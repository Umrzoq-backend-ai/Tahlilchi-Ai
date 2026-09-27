import json
import time
from dataclasses import dataclass, field

import httpx
from pydantic import BaseModel, ValidationError

from app.config import Settings
from app.errors import AppError


def strict_schema(model: type[BaseModel]) -> dict:
    schema = model.model_json_schema()

    def visit(value):
        if isinstance(value, dict):
            value.pop("default", None)
            if value.get("type") == "object":
                value["additionalProperties"] = False
                value["required"] = list(value.get("properties", {}))
            for child in value.values():
                visit(child)
        elif isinstance(value, list):
            for child in value:
                visit(child)

    visit(schema)
    return schema


@dataclass
class Budget:
    deadline: float
    max_calls: int = 5
    calls: int = 0
    usage: list[dict] = field(default_factory=list)

    def remaining(self) -> float:
        seconds = self.deadline - time.monotonic()
        if seconds <= 0:
            raise AppError("AGENT_TIMEOUT", "Agentning umumiy vaqt limiti tugadi.", 408)
        return seconds


class GeminiCompatibleProvider:
    """Gemini's documented OpenAI-compatible endpoint. No cell data or logs sent."""

    def __init__(self, settings: Settings, transport=None):
        self.settings = settings
        self.transport = transport
        self.live_verified = False

    def complete(self, system: str, context: dict, model: type[BaseModel], budget: Budget):
        for attempt in range(2):
            try:
                result = self._complete_once(system, context, model, budget)
                if self.transport is None:
                    self.live_verified = True
                return result
            except AppError as exc:
                if exc.code not in {"AI_UNAVAILABLE", "AI_CONNECTION"} or attempt == 1:
                    raise
                budget.remaining()
                if budget.calls >= budget.max_calls:
                    raise
                time.sleep(min(0.3, budget.remaining()))
        raise AssertionError("unreachable")

    def _complete_once(self, system: str, context: dict, model: type[BaseModel], budget: Budget):
        error = self.settings.agent_configuration_error()
        if error:
            raise AppError("AI_NOT_CONFIGURED", error, 503)
        if budget.calls >= budget.max_calls:
            raise AppError("AI_BUDGET", "Agentning model chaqiruv limiti tugadi.", 429)
        budget.calls += 1
        schema = strict_schema(model)
        response_format = {"type": "json_object"}
        if self.settings.llm_json_mode == "schema":
            response_format = {
                "type": "json_schema",
                "json_schema": {
                    "name": model.__name__,
                    "strict": True,
                    "schema": schema,
                },
            }
        body = {
            "model": self.settings.llm_model,
            "messages": [
                {
                    "role": "system",
                    "content": system + "\nReturn JSON matching this schema: " + json.dumps(schema),
                },
                {
                    "role": "user",
                    "content": json.dumps(context, ensure_ascii=False, allow_nan=False),
                },
            ],
            "response_format": response_format,
            "max_completion_tokens": 4096,
        }
        headers = {"Content-Type": "application/json"}
        if self.settings.llm_api_key:
            headers["Authorization"] = "Bearer " + self.settings.llm_api_key
        timeout = min(self.settings.llm_timeout, budget.remaining())
        try:
            # No redirects: never forward a secret to a provider-selected URL.
            with httpx.Client(
                timeout=timeout, follow_redirects=False, trust_env=False, transport=self.transport
            ) as client:
                with client.stream(
                    "POST",
                    self.settings.llm_base_url + "/chat/completions",
                    headers=headers,
                    json=body,
                ) as response:
                    if response.status_code in (401, 403):
                        raise AppError(
                            "AI_AUTH", "Gemini kaliti yoki modelga kirish huquqini tekshiring.", 502
                        )
                    if response.status_code == 429:
                        raise AppError(
                            "AI_QUOTA",
                            "AI kvotasi yoki rate limit tugadi. AI Studio billingni tekshiring.",
                            429,
                        )
                    if response.status_code >= 500:
                        raise AppError(
                            "AI_UNAVAILABLE",
                            "Gemini xizmati hozir band yoki vaqtincha ishlamayapti. Keyinroq qayta urinib ko‘ring.",
                            503,
                        )
                    if response.status_code >= 400 or response.is_redirect:
                        raise AppError(
                            "AI_PROVIDER",
                            "AI xizmati so‘rovni qabul qilmadi. Model va API sozlamalarini tekshiring.",
                            502,
                        )
                    raw = bytearray()
                    for chunk in response.iter_bytes():
                        budget.remaining()
                        raw.extend(chunk)
                        if len(raw) > 128 * 1024:
                            raise AppError(
                                "AI_RESPONSE_LIMIT", "Model javobi hajm limitidan oshdi.", 502
                            )
            data = json.loads(raw)
            choice = data["choices"][0]
            if choice.get("finish_reason") != "stop":
                raise AppError("AI_INCOMPLETE", "Model javobi tugallanmagan yoki rad etilgan.", 502)
            if choice["message"].get("refusal"):
                raise AppError("AI_REFUSAL", "Model bu so‘rovga javob berishni rad etdi.", 422)
            content = choice["message"]["content"]
            usage = data.get("usage", {})
            budget.usage.append(
                {
                    key: value
                    for key, value in usage.items()
                    if key in {"prompt_tokens", "completion_tokens", "total_tokens"}
                    and isinstance(value, int)
                    and value >= 0
                }
            )
            budget.remaining()
            return model.model_validate_json(content)
        except httpx.TimeoutException as exc:
            raise AppError(
                "AI_TIMEOUT", "AI xizmati belgilangan vaqtda javob bermadi.", 504
            ) from exc
        except httpx.HTTPError as exc:
            raise AppError("AI_CONNECTION", "AI xizmatiga ulanib bo‘lmadi.", 502) from exc
        except (ValueError, KeyError, IndexError, TypeError, ValidationError) as exc:
            raise AppError(
                "AI_SCHEMA", "Model javobi talab qilingan formatga mos kelmadi.", 502
            ) from exc
