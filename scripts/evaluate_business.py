"""Run synthetic business references; optional --live-plan checks Gemini interpretation.

Local mode checks CSV parsing and trusted Pandas calculations. Live mode sends only
synthetic questions and column schemas to Gemini, never CSV rows or secrets.
"""

import argparse
import json
import re
import sys
import tempfile
import time
from pathlib import Path

from app.agent.models import AgentPlan
from app.agent.prompts import PLANNER
from app.agent.provider import Budget, GeminiCompatibleProvider
from app.analysis.engine import analyze, profile
from app.analysis.reader import read_frame
from app.config import PROJECT_ROOT, Settings
from app.errors import AppError
from app.schemas import AnalysisRequest


def effective_plan(request: AnalysisRequest) -> dict:
    """Compare only parameters that can change the executor's answer."""
    data = request.model_dump()
    operation = data["operation"]
    result = {
        "operation": operation,
        "filters": sorted(
            data["filters"], key=lambda item: json.dumps(item, sort_keys=True)
        ),
    }
    if operation in {"metric", "group", "monthly"}:
        result["aggregation"] = data["aggregation"]
        if data["aggregation"] != "count":
            result["value_column"] = data["value_column"]
    if operation in {"group", "monthly"}:
        result["group_column"] = data["group_column"]
        result["top_n"] = data["top_n"]
        if data["top_n"] is not None:
            result["ascending"] = data["ascending"]
    uses_date_format = operation == "monthly" or any(
        isinstance(item["value"], str)
        and item["operator"] not in {"eq", "ne"}
        and re.fullmatch(r"\d{4}-\d{2}-\d{2}", item["value"])
        for item in data["filters"]
    )
    if uses_date_format:
        result["date_format"] = data["date_format"]
    return result


def live_plan(provider, settings: Settings, case: dict, frame, metadata) -> None:
    columns = profile(frame, metadata)["columns"]
    context = {
        "question": case["question"],
        "columns": [
            {"name": column["name"], "kind": column["kind"], "dtype": column["dtype"]}
            for column in columns
        ],
    }
    budget = Budget(time.monotonic() + settings.llm_timeout * 2 + 5, 3)
    for attempt in range(2):
        try:
            plan = provider.complete(PLANNER, context, AgentPlan, budget)
            if plan.action == "analyze":
                available = {column["name"] for column in columns}
                referenced = {
                    name
                    for name in (plan.analysis.group_column, plan.analysis.value_column)
                    if name
                }
                referenced.update(item.column for item in plan.analysis.filters)
                if not referenced <= available:
                    raise AppError(
                        "UNKNOWN_COLUMN", "Rejada mavjud bo‘lmagan ustun bor."
                    )
            break
        except AppError as error:
            if error.code not in {"AI_SCHEMA", "UNKNOWN_COLUMN"} or attempt == 1:
                raise
            context["validation_error"] = error.code

    expected_action = case.get("expected_action", "analyze")
    if plan.action != expected_action:
        raise ValueError(f"expected action {expected_action}, got {plan.action}")
    if expected_action == "analyze":
        expected = effective_plan(AnalysisRequest.model_validate(case["request"]))
        actual = effective_plan(plan.analysis)
        if actual != expected:
            raise ValueError(
                f"effective plan mismatch: expected {expected}, got {actual}"
            )


def local_reference(case: dict, frame) -> None:
    request = AnalysisRequest.model_validate(case["request"]).model_dump()
    try:
        result = analyze(frame, request)
    except AppError as error:
        if error.code != case.get("expected_error"):
            raise
        return
    if "expected_error" in case:
        raise ValueError(f"expected {case['expected_error']} rejection")
    if (
        result["table"]["columns"] != case["expected_columns"]
        or result["table"]["rows"] != case["expected_rows"]
    ):
        raise ValueError("calculated table differs from hand-calculated answer")


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--live-plan", action="store_true", help="Call Gemini for planner-only checks"
    )
    parser.add_argument(
        "--limit", type=int, default=0, help="Run only the first N cases"
    )
    args = parser.parse_args()
    if args.limit < 0:
        parser.error("--limit must be nonnegative")
    cases = json.loads(
        (PROJECT_ROOT / "evaluation/cases.json").read_text(encoding="utf-8")
    )["cases"]
    if args.limit:
        cases = cases[: args.limit]
    settings = Settings.from_env()
    provider = GeminiCompatibleProvider(settings) if args.live_plan else None
    if args.live_plan and (error := settings.agent_configuration_error()):
        print(error, file=sys.stderr)
        return 2

    passed = failed = 0
    blocked = None
    with tempfile.TemporaryDirectory(prefix="analyst-evaluation-") as temporary:
        for case in cases:
            if not args.live_plan and "request" not in case:
                continue
            path = Path(temporary) / f"{case['id']}.csv"
            path.write_text(case["csv"], encoding="utf-8")
            try:
                frame, metadata = read_frame(
                    path, {}, {"max_rows": 100_000, "max_columns": 100}
                )
                if args.live_plan:
                    live_plan(provider, settings, case, frame, metadata)
                else:
                    local_reference(case, frame)
                passed += 1
                print(f"PASS {case['id']}", flush=True)
            except AppError as error:
                if error.code in {
                    "AI_QUOTA",
                    "AI_AUTH",
                    "AI_CONNECTION",
                    "AI_UNAVAILABLE",
                }:
                    blocked = error.code
                    print(f"BLOCKED {case['id']}: {error.code}", flush=True)
                    break
                failed += 1
                print(f"FAIL {case['id']}: {error.code}", flush=True)
            except ValueError as error:
                failed += 1
                print(f"FAIL {case['id']}: {error}", flush=True)
    total = len(cases) if args.live_plan else sum("request" in case for case in cases)
    label = "live planner" if args.live_plan else "local reference"
    print(
        f"{label}: {passed} passed, {failed} failed, {total - passed - failed} unverified"
    )
    if blocked:
        print(
            f"Stopped after provider error {blocked}; unverified cases were not counted as failures."
        )
    return 2 if blocked else 1 if failed else 0


if __name__ == "__main__":
    raise SystemExit(main())
