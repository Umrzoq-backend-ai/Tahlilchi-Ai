import time
from dataclasses import replace
from uuid import uuid4

import pytest
from conftest import authenticate
from fastapi.testclient import TestClient

from app.agent.orchestrator import AgentService
from app.config import PROJECT_ROOT
from app.main import create_app
from app.schemas import AnalysisRequest
from app.services import DatasetService

PLAN = {
    "action": "analyze",
    "analysis": AnalysisRequest(
        operation="monthly", group_column="order_date", value_column="amount"
    ).model_dump(),
    "explanation": "Oylik tushum yig‘indisi.",
    "clarification": None,
}
CODE = """keys = pd.to_datetime(df['order_date'], format='ISO8601').dt.to_period('M').astype('string')
result = df['amount'].groupby(keys, sort=False).sum(min_count=1).reset_index()
result.columns = ['group', 'value']
result = result.sort_values('group', kind='stable')"""


class FakeProvider:
    def __init__(self, answers):
        self.answers = list(answers)
        self.contexts = []

    def complete(self, system, context, model, budget):
        budget.calls += 1
        budget.remaining()
        self.contexts.append(context.copy())
        return model.model_validate(self.answers.pop(0))


def wait(client, run_id):
    deadline = time.monotonic() + 20
    while time.monotonic() < deadline:
        run = client.get("/api/v1/runs/" + run_id).json()
        if run["status"] not in {"queued", "running"}:
            return run
        time.sleep(0.03)
    pytest.fail("Agent run did not finish")


@pytest.fixture
def agent_client(settings):
    config = replace(settings, llm_base_url="http://127.0.0.1:9999/v1", llm_model="test-fixture")
    with TestClient(create_app(config)) as client:
        authenticate(client)
        payload = (PROJECT_ROOT / "examples/sales.csv").read_bytes()
        response = client.post("/api/v1/datasets", files={"file": ("sales.csv", payload)})
        assert response.status_code == 201
        yield client, response.json()["id"]


def submit(client, dataset_id, question="Oylik tushumni ko‘rsat", **extra):
    return client.post(
        f"/api/v1/datasets/{dataset_id}/questions",
        json={
            "question": question,
            "idempotency_key": str(uuid4()),
            **extra,
        },
    )


def test_real_sandbox_repair_and_idempotency(agent_client):
    client, dataset_id = agent_client
    fake = FakeProvider([PLAN, {"code": "result ="}, {"code": CODE}])
    client.app.state.agent.provider = fake
    key = str(uuid4())
    response = submit(client, dataset_id, idempotency_key=key)
    assert response.status_code == 202, response.text
    run = wait(client, response.json()["id"])
    assert run["status"] == "succeeded", run
    assert len(run["attempts"]) == 2
    assert run["attempts"][0]["error_code"] == "CODE_SYNTAX"
    assert run["analysis"]["result"]["table"]["rows"][2] == ["2026-03", 3400000]
    assert "repairing" in [event["stage"] for event in run["events"]]
    duplicate = submit(client, dataset_id, idempotency_key=key).json()
    assert duplicate["id"] == run["id"]
    assert len(fake.contexts) == 3
    assert set(fake.contexts[0]) == {"question", "columns"}
    assert "Aziza" not in str(fake.contexts)
    assert "3400000" not in str(fake.contexts)
    events = client.get(f"/api/v1/runs/{run['id']}/events?after_seq=2").json()
    assert all(event["seq"] > 2 for event in events)
    with client.websocket_connect(f"/api/v1/runs/{run['id']}/events/ws") as websocket:
        assert websocket.receive_json()["status"] == "succeeded"
    assert (
        submit(client, dataset_id, question="Boshqa savol", idempotency_key=key).status_code == 409
    )
    client.delete(f"/api/v1/datasets/{dataset_id}")
    assert client.get(f"/api/v1/runs/{run['id']}").status_code == 404


def test_wrong_numbers_never_become_answer(agent_client):
    client, dataset_id = agent_client
    fake = FakeProvider(
        [PLAN] + [{"code": "result = pd.DataFrame({'group':['2026-03'], 'value':[999999]})"}] * 3
    )
    client.app.state.agent.provider = fake
    run = wait(client, submit(client, dataset_id).json()["id"])
    assert run["status"] == "failed"
    assert run["error"]["code"] == "RESULT_MISMATCH"
    assert len(run["attempts"]) == 3
    assert run["analysis"] is None
    assert client.get(f"/api/v1/datasets/{dataset_id}/analyses").json() == []


def test_policy_violation_is_not_retried(agent_client):
    client, dataset_id = agent_client
    client.app.state.agent.provider = FakeProvider([PLAN, {"code": "import os\nresult = df"}])
    run = wait(client, submit(client, dataset_id).json()["id"])
    assert run["status"] == "failed"
    assert run["error"]["code"] == "CODE_POLICY"
    assert len(run["attempts"]) == 1


def test_clarification_then_answer(agent_client):
    client, dataset_id = agent_client
    client.app.state.agent.provider = FakeProvider(
        [
            {
                "action": "clarify",
                "analysis": None,
                "explanation": "Sana ustuni kerak.",
                "clarification": "Qaysi ustun sana?",
            },
            PLAN,
            {"code": CODE},
        ]
    )
    first = wait(client, submit(client, dataset_id).json()["id"])
    assert first["status"] == "needs_input"
    second = wait(
        client,
        submit(
            client, dataset_id, question="Sana order_date ustunida", clarification_for=first["id"]
        ).json()["id"],
    )
    assert second["status"] == "succeeded", second
    assert "Aniqlik:" in second["question"]


def test_unsupported_does_not_execute(agent_client):
    client, dataset_id = agent_client
    client.app.state.agent.provider = FakeProvider(
        [
            {
                "action": "unsupported",
                "analysis": None,
                "explanation": "Prognoz bu versiyada yo‘q.",
                "clarification": None,
            }
        ]
    )
    run = wait(
        client, submit(client, dataset_id, question="Keyingi oy prognozini hisobla").json()["id"]
    )
    assert run["status"] == "unsupported"
    assert run["attempts"] == []


def test_unconfigured_is_honest(client):
    assert client.get("/api/v1/agent/status").json()["configured"] is False
    dataset = client.post("/api/v1/datasets", files={"file": ("x.csv", b"x\n1\n")}).json()
    response = submit(client, dataset["id"])
    assert response.status_code == 503
    assert response.json()["error"]["code"] == "AI_NOT_CONFIGURED"


def test_restart_marks_unfinished_run(settings):
    service = DatasetService(settings)
    with (PROJECT_ROOT / "examples/sales.csv").open("rb") as stream:
        dataset = service.upload(stream, "sales.csv", {})
    run_id = str(uuid4())
    service.store.put_run(
        {"id": run_id, "dataset_id": dataset["id"], "status": "running", "events": []},
        "restart-test",
    )
    agent = AgentService(service)
    try:
        run = agent.get(run_id)
        assert run["status"] == "failed"
        assert run["error"]["code"] == "INTERRUPTED"
    finally:
        agent.close()


def test_cancel_during_model_call_does_not_publish_result(agent_client):
    from threading import Event

    client, dataset_id = agent_client
    entered, release = Event(), Event()

    class BlockingProvider(FakeProvider):
        def complete(self, system, context, model, budget):
            entered.set()
            assert release.wait(5)
            return super().complete(system, context, model, budget)

    client.app.state.agent.provider = BlockingProvider([PLAN])
    response = submit(client, dataset_id)
    run_id = response.json()["id"]
    try:
        assert entered.wait(5)
        assert client.post(f"/api/v1/runs/{run_id}/cancel").status_code == 200
    finally:
        release.set()
    run = wait(client, run_id)
    assert run["status"] == "cancelled"
    assert run["analysis"] is None
    assert client.get(f"/api/v1/datasets/{dataset_id}/analyses").json() == []
