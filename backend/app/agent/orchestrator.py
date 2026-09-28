import hashlib
import time
from concurrent.futures import ThreadPoolExecutor
from threading import BoundedSemaphore, Event
from uuid import uuid4

from app.agent.models import AgentPlan, GeneratedCode, QuestionRequest
from app.agent.policy import check_code
from app.agent.prompts import CODEGEN, PLANNER
from app.agent.provider import Budget, GeminiCompatibleProvider
from app.agent.sandbox import Sandbox
from app.agent.validator import validate_table
from app.analysis.engine import agent_schema
from app.errors import AppError
from app.services import DatasetService, now

TERMINAL = {"succeeded", "failed", "needs_input", "unsupported", "cancelled"}


class AgentService:
    def __init__(self, service: DatasetService, provider=None, sandbox=None):
        self.service = service
        self.settings = service.settings
        self.store = service.store
        self.provider = provider or GeminiCompatibleProvider(self.settings)
        self.sandbox = sandbox or Sandbox(self.settings)
        self.executor = ThreadPoolExecutor(max_workers=2, thread_name_prefix="analyst-agent")
        self.capacity = BoundedSemaphore(2)
        self.closing = Event()
        self.store.interrupt_runs()

    def close(self):
        self.closing.set()
        self.executor.shutdown(wait=True, cancel_futures=False)

    def status(self) -> dict:
        error = self.settings.agent_configuration_error()
        return {
            "configured": error is None,
            "message": error,
            "model": self.settings.llm_model,
            "provider": "Gemini"
            if "googleapis.com" in self.settings.llm_base_url
            else "Compatible API",
            "remote": not self.settings.llm_local,
            "data_policy": "Faqat savol, schema va reja yuboriladi; fayl qatorlari va natija yuborilmaydi.",
            "execution": "bubblewrap",
            "live_verified": getattr(self.provider, "live_verified", False),
        }

    def get(self, run_id: str) -> dict:
        run = self.store.get_run(run_id)
        if run is None:
            raise AppError("NOT_FOUND", "Agent ishi topilmadi.", 404)
        return run

    def submit(self, dataset_id: str, request: QuestionRequest) -> dict:
        error = self.settings.agent_configuration_error()
        if error:
            raise AppError("AI_NOT_CONFIGURED", error, 503)
        with self.service.lock:
            dataset = self.service.get(dataset_id)
            question = request.question.strip()
            if len(question) < 3:
                raise AppError("QUESTION_EMPTY", "Savolni kamida 3 belgi bilan yozing.")
            if request.clarification_for:
                previous = self.get(request.clarification_for)
                if previous["dataset_id"] != dataset_id or previous["status"] != "needs_input":
                    raise AppError(
                        "CLARIFICATION", "Bu javob shu datasetdagi aniqlashtirishga tegishli emas."
                    )
                question = previous["question"] + "\nAniqlik: " + question
                if len(question) > 4000:
                    raise AppError(
                        "CONTEXT_LIMIT", "Aniqlashtirish hajmi oshdi; savolni qayta aniq yozing."
                    )
            # Detect duplicates before any model call or namespace setup.
            for existing in self.store.list_runs(dataset_id):
                if existing["idempotency_key"] == request.idempotency_key:
                    if existing["question"] != question:
                        raise AppError(
                            "IDEMPOTENCY_CONFLICT", "Bu kalit boshqa savol uchun ishlatilgan.", 409
                        )
                    return existing
            if not self.capacity.acquire(blocking=False):
                raise AppError(
                    "AGENT_BUSY",
                    "Ikki agent ishi bajarilmoqda. Birozdan keyin urinib ko‘ring.",
                    429,
                )
            try:
                document = {
                    "id": str(uuid4()),
                    "dataset_id": dataset_id,
                    "idempotency_key": request.idempotency_key,
                    "question": question,
                    "status": "queued",
                    "stage": "queued",
                    "created_at": now(),
                    "events": [{"seq": 1, "stage": "queued"}],
                    "attempts": [],
                    "analysis": None,
                    "error": None,
                    "plan": None,
                }
                stored = self.store.put_run(document, request.idempotency_key)
                if stored["id"] != document["id"]:
                    if stored["question"] != question:
                        raise AppError(
                            "IDEMPOTENCY_CONFLICT", "Bu kalit boshqa savol uchun ishlatilgan.", 409
                        )
                    self.capacity.release()
                    return stored
                self.executor.submit(self._work, stored, dataset)
                return stored
            except BaseException:
                # No submitted task owns this permit yet.
                self.capacity.release()
                raise

    def cancel(self, run_id: str) -> dict:
        with self.service.lock:
            self.get(run_id)
            return self.store.update_run(run_id, {"cancel_requested": True}, "cancel_requested")

    def _check(self, run_id: str, budget: Budget):
        budget.remaining()
        run = self.store.get_run(run_id)
        if self.closing.is_set() or run is None or run.get("cancel_requested"):
            raise AppError("CANCELLED", "Agent ishi bekor qilindi.", 409)

    def _work(self, document: dict, dataset: dict):
        run_id = document["id"]
        budget = Budget(
            time.monotonic() + self.settings.agent_timeout, self.settings.agent_max_calls
        )
        attempts = []
        try:
            self._check(run_id, budget)
            self.store.update_run(
                run_id, {"status": "running", "stage": "checking_sandbox"}, "checking_sandbox"
            )
            # Prove isolation works BEFORE consuming provider tokens.
            self.sandbox.probe()
            schema = agent_schema(dataset["profile"])
            context = {"question": document["question"], "columns": schema}
            plan = None
            for planning_attempt in range(2):
                self._check(run_id, budget)
                self.store.update_run(run_id, {"stage": "planning"}, "planning")
                try:
                    plan = self.provider.complete(PLANNER, context, AgentPlan, budget)
                    if plan.action == "analyze":
                        available = {c["name"] for c in schema}
                        referenced = {
                            v for v in [plan.analysis.group_column, plan.analysis.value_column] if v
                        }
                        referenced.update(f.column for f in plan.analysis.filters)
                        if not referenced <= available:
                            raise AppError("UNKNOWN_COLUMN", "Rejada mavjud bo‘lmagan ustun bor.")
                    break
                except AppError as exc:
                    if exc.code not in {"AI_SCHEMA", "UNKNOWN_COLUMN"} or planning_attempt == 1:
                        raise
                    context["validation_error"] = exc.code
            self._check(run_id, budget)
            self.store.update_run(run_id, {"plan": plan.model_dump()})
            if plan.action != "analyze":
                status = "needs_input" if plan.action == "clarify" else "unsupported"
                self.store.update_run(
                    run_id,
                    {
                        "status": status,
                        "stage": status,
                        "message": plan.clarification or plan.explanation,
                        "usage": budget.usage,
                        "model_calls": budget.calls,
                    },
                    status,
                )
                return
            parameters = plan.analysis.model_dump()
            self.store.update_run(run_id, {"stage": "reference"}, "reference")
            with self.service.lock:
                self.service.get(dataset["id"])
                reference = self.service.runner.run(
                    self.service.path_for(dataset), dataset["parsing_options"], parameters
                )
            code_context = {
                "columns": schema,
                "plan": parameters,
                "result_columns": reference["table"]["columns"],
            }
            for number in range(1, 4):
                self._check(run_id, budget)
                self.store.update_run(run_id, {"stage": "generating"}, "generating")
                code = None
                try:
                    generated = self.provider.complete(CODEGEN, code_context, GeneratedCode, budget)
                    code = generated.code
                    check_code(code)
                    self._check(run_id, budget)
                    self.store.update_run(run_id, {"stage": "executing"}, "executing")
                    with self.service.lock:
                        self.service.get(dataset["id"])
                        actual = self.sandbox.run(
                            self.service.path_for(dataset),
                            dataset["parsing_options"],
                            parameters,
                            code,
                            budget.remaining(),
                        )
                    self._check(run_id, budget)
                    self.store.update_run(run_id, {"stage": "validating"}, "validating")
                    validate_table(actual, reference["table"])
                    attempts.append({"number": number, "code": code, "status": "verified"})
                    analysis = {
                        "id": str(uuid4()),
                        "dataset_id": dataset["id"],
                        "created_at": now(),
                        "status": "succeeded",
                        "request": parameters,
                        "result": reference,
                        "provenance": {
                            "dataset_id": dataset["id"],
                            "dataset_sha256": dataset["sha256"],
                            "parsing_options": dataset["parsing_options"],
                            "parameters": parameters,
                            "model": self.settings.llm_model,
                            "engine": reference["engine"],
                            "code": code,
                            "code_sha256": hashlib.sha256(code.encode()).hexdigest(),
                            "validation": "All displayed cells and dimensions matched trusted Pandas execution; question interpretation is not proven.",
                            "sandbox": "bubblewrap-namespaces-v1",
                            "prompt_version": "business-v1",
                        },
                    }
                    with self.service.lock:
                        self._check(run_id, budget)
                        self.service.get(dataset["id"])
                        self.store.put_analysis(analysis)
                        self.store.update_run(
                            run_id,
                            {
                                "status": "succeeded",
                                "stage": "succeeded",
                                "analysis": analysis,
                                "attempts": attempts,
                                "usage": budget.usage,
                                "model_calls": budget.calls,
                            },
                            "succeeded",
                        )
                    return
                except AppError as exc:
                    attempts.append(
                        {"number": number, "code": code, "status": "failed", "error_code": exc.code}
                    )
                    self.store.update_run(run_id, {"attempts": attempts})
                    if (
                        exc.code
                        not in {"AI_SCHEMA", "CODE_SYNTAX", "CODE_RUNTIME", "RESULT_MISMATCH"}
                        or number == 3
                    ):
                        raise
                    code_context["previous_code"] = code
                    code_context["error"] = (
                        exc.message if exc.code in {"CODE_SYNTAX", "CODE_RUNTIME"} else exc.code
                    )
                    self.store.update_run(run_id, {"stage": "repairing"}, "repairing")
        except AppError as exc:
            status = "cancelled" if exc.code == "CANCELLED" else "failed"
            self.store.update_run(
                run_id,
                {
                    "status": status,
                    "stage": status,
                    "error": {"code": exc.code, "message": exc.message},
                    "attempts": attempts,
                    "usage": budget.usage,
                    "model_calls": budget.calls,
                },
                status,
            )
        except Exception:
            self.store.update_run(
                run_id,
                {
                    "status": "failed",
                    "stage": "failed",
                    "error": {
                        "code": "AGENT_INTERNAL",
                        "message": "Agent ishi ichki xato bilan to‘xtadi.",
                    },
                    "attempts": attempts,
                    "usage": budget.usage,
                    "model_calls": budget.calls,
                },
                "failed",
            )
        finally:
            self.capacity.release()
