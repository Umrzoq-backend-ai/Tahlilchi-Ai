import json
import time
from dataclasses import replace

import httpx
import pytest

from app.agent.models import GeneratedCode
from app.agent.provider import Budget, GeminiCompatibleProvider
from app.errors import AppError


def config(settings):
    return replace(
        settings, llm_model="gemini-test", llm_api_key="test-secret", llm_allow_remote=True
    )


def budget():
    return Budget(time.monotonic() + 10)


def test_gemini_contract(settings):
    def handle(request):
        assert (
            str(request.url)
            == "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions"
        )
        assert request.headers["authorization"] == "Bearer test-secret"
        body = json.loads(request.content)
        assert body["response_format"]["json_schema"]["strict"] is True
        return httpx.Response(
            200,
            json={
                "choices": [
                    {"finish_reason": "stop", "message": {"content": '{"code":"result = df"}'}}
                ],
                "usage": {"total_tokens": 30},
            },
        )

    limits = budget()
    provider = GeminiCompatibleProvider(config(settings), httpx.MockTransport(handle))
    assert (
        provider.complete("Return JSON", {"columns": []}, GeneratedCode, limits).code
        == "result = df"
    )
    assert limits.usage == [{"total_tokens": 30}]
    assert limits.calls == 1
    assert "test-secret" not in repr(config(settings))


@pytest.mark.parametrize(
    "status,code",
    [
        (401, "AI_AUTH"),
        (403, "AI_AUTH"),
        (429, "AI_QUOTA"),
        (500, "AI_UNAVAILABLE"),
        (302, "AI_PROVIDER"),
    ],
)
def test_errors_do_not_leak_response(settings, status, code):
    provider = GeminiCompatibleProvider(
        config(settings),
        httpx.MockTransport(
            lambda request: httpx.Response(
                status,
                text="private-provider-secret",
                headers={"location": "https://elsewhere.example"},
            )
        ),
    )
    with pytest.raises(AppError) as error:
        provider.complete("JSON", {}, GeneratedCode, budget())
    assert error.value.code == code
    assert "private-provider-secret" not in str(error.value)


@pytest.mark.parametrize(
    "content,finish,code",
    [("not-json", "stop", "AI_SCHEMA"), ('{"code":"x"}', "length", "AI_INCOMPLETE")],
)
def test_invalid_response(settings, content, finish, code):
    provider = GeminiCompatibleProvider(
        config(settings),
        httpx.MockTransport(
            lambda request: httpx.Response(
                200, json={"choices": [{"finish_reason": finish, "message": {"content": content}}]}
            )
        ),
    )
    with pytest.raises(AppError) as error:
        provider.complete("JSON", {}, GeneratedCode, budget())
    assert error.value.code == code


def test_budget_blocks_model_request(settings):
    provider = GeminiCompatibleProvider(
        config(settings), httpx.MockTransport(lambda request: pytest.fail("No call allowed"))
    )
    with pytest.raises(AppError) as error:
        provider.complete("JSON", {}, GeneratedCode, Budget(time.monotonic() + 10, max_calls=0))
    assert error.value.code == "AI_BUDGET"


def test_remote_configuration(settings):
    assert config(settings).agent_configuration_error() is None
    assert replace(config(settings), llm_allow_remote=False).agent_configuration_error()
    assert replace(
        config(settings), llm_base_url="http://remote.example/v1"
    ).agent_configuration_error()
    assert replace(
        config(settings), llm_base_url="https://user:pass@example.com/v1"
    ).agent_configuration_error()


def test_transient_error_has_one_bounded_retry(settings):
    calls = []

    def handle(request):
        calls.append(request)
        if len(calls) == 1:
            return httpx.Response(503)
        return httpx.Response(
            200,
            json={
                "choices": [
                    {"finish_reason": "stop", "message": {"content": '{"code":"result = df"}'}}
                ]
            },
        )

    limits = budget()
    provider = GeminiCompatibleProvider(config(settings), httpx.MockTransport(handle))
    assert provider.complete("JSON", {}, GeneratedCode, limits).code == "result = df"
    assert len(calls) == 2
    assert limits.calls == 2
