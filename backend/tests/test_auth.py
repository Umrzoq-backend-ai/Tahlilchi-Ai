import json
import sqlite3
import time
from dataclasses import replace
from io import BytesIO
from uuid import uuid4

import pytest
from conftest import authenticate
from fastapi.testclient import TestClient
from starlette.websockets import WebSocketDisconnect

from app.auth import COOKIE, AuthService, Credentials
from app.main import create_app
from app.services import DatasetService
from app.store import Store

ACCOUNT = {"username": "employee", "password": "employee-password-123"}


def test_anonymous_and_csrf(settings):
    with TestClient(create_app(settings)) as client:
        assert client.get("/api/v1/datasets").status_code == 401
        assert client.post("/api/v1/datasets").status_code == 401
        assert client.get("/api/v1/agent/status").status_code == 401
        response = client.post("/api/v1/auth/setup", json=ACCOUNT)
        assert response.status_code == 201
        cookie = response.headers["set-cookie"].lower()
        assert "httponly" in cookie and "samesite=strict" in cookie
        assert "password" not in response.json()["user"]
        assert client.post("/api/v1/auth/setup", json=ACCOUNT).status_code == 403
        assert client.post("/api/v1/auth/logout").status_code == 403
        client.headers["X-CSRF-Token"] = response.json()["csrf_token"]
        assert (
            client.post(
                "/api/v1/auth/users",
                json={**ACCOUNT, "username": "second"},
                headers={"Origin": "https://evil.example"},
            ).status_code
            == 403
        )
        token = client.cookies.get(COOKIE)
        assert client.post("/api/v1/auth/logout").status_code == 204
        assert client.get("/api/v1/auth/me").json()["authenticated"] is False
        assert (
            client.get("/api/v1/datasets", headers={"Cookie": f"{COOKIE}={token}"}).status_code
            == 401
        )


def test_password_hash_login_expiry_and_rate_limit(settings):
    with TestClient(create_app(settings)) as client:
        authenticate(client)
        with client.app.state.service.store.connect() as db:
            hashed = db.execute("SELECT password_hash FROM users").fetchone()[0]
            assert hashed.startswith("scrypt:") and "test-password" not in hashed
            stored = db.execute("SELECT token_hash FROM sessions").fetchone()[0]
            assert stored != client.cookies.get(COOKIE)
            db.execute("UPDATE sessions SET expires_at=?", (time.time() - 1,))
        assert client.get("/api/v1/datasets").status_code == 401
        for _ in range(10):
            response = client.post(
                "/api/v1/auth/login",
                json={"username": "testadmin", "password": "wrong-password-123"},
            )
            assert response.status_code == 401
        assert (
            client.post(
                "/api/v1/auth/login",
                json={"username": "testadmin", "password": "test-password-12345"},
            ).status_code
            == 429
        )


def test_owner_isolation_all_routes_and_websocket(client):
    dataset = client.post(
        "/api/v1/datasets", files={"file": ("private.csv", b"name,amount\nA,42\n")}
    ).json()
    dataset_id = dataset["id"]
    analysis = client.post(
        f"/api/v1/datasets/{dataset_id}/analyses", json={"operation": "overview"}
    )
    assert analysis.status_code == 201
    run_id = str(uuid4())
    client.app.state.service.store.put_run(
        {"id": run_id, "dataset_id": dataset_id, "status": "succeeded", "events": []},
        "test-private-run",
    )
    assert client.post("/api/v1/auth/users", json=ACCOUNT).status_code == 201
    admin_cookie = client.cookies.get(COOKIE)
    admin_csrf = client.headers["X-CSRF-Token"]
    authenticate(client, **ACCOUNT)
    assert client.get("/api/v1/datasets").json() == []
    for suffix in ["", "/preview", "/analyses", "/runs"]:
        assert client.get(f"/api/v1/datasets/{dataset_id}{suffix}").status_code == 404
    for suffix, payload in [
        ("/analyses", {"operation": "overview"}),
        ("/versions", {}),
        ("/questions", {"question": "Show total", "idempotency_key": str(uuid4())}),
    ]:
        assert (
            client.post(f"/api/v1/datasets/{dataset_id}{suffix}", json=payload).status_code == 404
        )
    assert client.delete(f"/api/v1/datasets/{dataset_id}").status_code == 404
    for suffix in ["", "/events"]:
        assert client.get(f"/api/v1/runs/{run_id}{suffix}").status_code == 404
    assert client.post(f"/api/v1/runs/{run_id}/cancel").status_code == 404
    with pytest.raises(WebSocketDisconnect) as closed:
        with client.websocket_connect(f"/api/v1/runs/{run_id}/events/ws"):
            pytest.fail("Foreign run socket was accepted")
    assert closed.value.code == 1008
    assert (
        client.post("/api/v1/auth/users", json={**ACCOUNT, "username": "third"}).status_code == 403
    )
    own = client.post("/api/v1/datasets", files={"file": ("mine.csv", b"x\n1\n")}).json()
    version = client.post(f"/api/v1/datasets/{own['id']}/versions", json={})
    assert version.status_code == 201
    assert version.json()["owner_id"] == own["owner_id"]
    # Administrators manage accounts; they do not inherit access to employees' data.
    client.cookies.clear()
    client.cookies.set(COOKIE, admin_cookie)
    client.headers["X-CSRF-Token"] = admin_csrf
    assert client.get(f"/api/v1/datasets/{dataset_id}").status_code == 200
    assert client.get(f"/api/v1/datasets/{own['id']}").status_code == 404


def test_websocket_session_revoked_midstream(client):
    dataset = client.post("/api/v1/datasets", files={"file": ("x.csv", b"x\n1\n")}).json()
    run_id = str(uuid4())
    client.app.state.service.store.put_run(
        {"id": run_id, "dataset_id": dataset["id"], "status": "running", "events": []},
        "session-revoked",
    )
    with client.websocket_connect(f"/api/v1/runs/{run_id}/events/ws") as websocket:
        assert websocket.receive_json()["status"] == "running"
        assert client.post("/api/v1/auth/logout").status_code == 204
        with pytest.raises(WebSocketDisconnect) as closed:
            websocket.receive_json()
        assert closed.value.code == 1008


def test_production_bootstrap_disabled_and_cookie(settings):
    config = replace(settings, public_origin="https://analyst.example")
    app = create_app(config)
    with TestClient(app, base_url="https://analyst.example") as client:
        assert client.get("/api/v1/auth/me").json()["setup_allowed"] is False
        assert client.post("/api/v1/auth/setup", json=ACCOUNT).status_code == 403
        app.state.auth.create_user(Credentials(**ACCOUNT), first=True)
        response = client.post("/api/v1/auth/login", json=ACCOUNT)
        assert response.status_code == 200
        assert "secure" in response.headers["set-cookie"].lower()
        assert client.get("/api/v1/health", headers={"Host": "evil.example"}).status_code == 400
        assert (
            client.get("/api/v1/auth/me", headers={"Origin": "http://analyst.example"}).status_code
            == 403
        )
        client.headers["X-CSRF-Token"] = response.json()["csrf_token"]
        assert (
            client.post(
                "/api/v1/auth/logout", headers={"Origin": "https://analyst.example"}
            ).status_code
            == 204
        )


def test_remote_cannot_claim_first_account(settings):
    with TestClient(create_app(settings), client=("192.0.2.5", 4000)) as client:
        assert client.get("/api/v1/auth/me").json()["setup_allowed"] is False
        assert client.post("/api/v1/auth/setup", json=ACCOUNT).status_code == 403


def test_legacy_migration_and_first_admin_claim(settings):
    settings.data_dir.mkdir()
    dataset_id = str(uuid4())
    with sqlite3.connect(settings.data_dir / "metadata.sqlite3") as db:
        db.execute("CREATE TABLE datasets (id TEXT PRIMARY KEY, document TEXT NOT NULL)")
        db.execute(
            "INSERT INTO datasets VALUES (?, ?)", (dataset_id, json.dumps({"id": dataset_id}))
        )
    store = Store(settings.data_dir)
    auth = AuthService(store, settings)
    assert store.list_datasets("someone") == []
    user = auth.create_user(Credentials(**ACCOUNT), first=True, claim_legacy=True)
    assert store.owns_dataset(dataset_id, user["id"])
    assert store.get_dataset(dataset_id)["owner_id"] == user["id"]
    assert len(store.list_datasets(user["id"])) == 1


def test_unclaimed_legacy_stays_private(settings):
    service = DatasetService(settings)
    dataset = service.upload(BytesIO(b"x\n1\n"), "old.csv", {})
    auth = AuthService(service.store, settings)
    user = auth.create_user(Credentials(**ACCOUNT), first=True)
    assert not service.store.owns_dataset(dataset["id"], user["id"])


def test_username_case_and_no_password_echo(client):
    response = client.post("/api/v1/auth/users", json=ACCOUNT)
    assert response.status_code == 201
    assert (
        client.post("/api/v1/auth/users", json={**ACCOUNT, "username": "EMPLOYEE"}).status_code
        == 409
    )
    response = client.post(
        "/api/v1/auth/users", json={"username": "short", "password": "secret-short"}
    )
    assert response.status_code == 201
    response = client.post("/api/v1/auth/users", json={"username": "bad", "password": "secret"})
    assert response.status_code == 422 and "secret" not in response.text


@pytest.mark.parametrize(
    "origin",
    [
        "http://example.com",
        "https://user:pass@example.com",
        "https://example.com/path",
        "https://example.com?x=1",
    ],
)
def test_bad_deployment_origin_rejected(settings, origin):
    with pytest.raises(ValueError):
        replace(settings, public_origin=origin)


def test_password_reset_revokes_all_sessions(client):
    from app.auth import Credentials

    token = client.cookies.get(COOKIE)
    auth = client.app.state.auth
    session = auth.session(token)
    second = auth.new_session(session["id"])
    credentials = Credentials(username="testadmin", password="replacement-password-123")
    auth.reset_password(credentials)
    assert auth.session(token) is None
    assert auth.session(second) is None
    assert (
        client.post(
            "/api/v1/auth/login", json={"username": "testadmin", "password": "test-password-12345"}
        ).status_code
        == 401
    )
    assert client.post("/api/v1/auth/login", json=credentials.model_dump()).status_code == 200
