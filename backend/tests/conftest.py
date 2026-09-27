import pytest
from fastapi.testclient import TestClient

from app.config import Settings
from app.main import create_app


@pytest.fixture
def settings(tmp_path):
    return Settings(data_dir=tmp_path / "data", job_timeout=20)


def authenticate(client, username="testadmin", password="test-password-12345"):
    status = client.get("/api/v1/auth/me").json()
    endpoint = "setup" if status.get("setup_allowed") else "login"
    response = client.post(
        f"/api/v1/auth/{endpoint}", json={"username": username, "password": password}
    )
    assert response.status_code in {200, 201}, response.text
    client.headers["X-CSRF-Token"] = response.json()["csrf_token"]
    return response.json()["user"]


@pytest.fixture
def client(settings):
    with TestClient(create_app(settings)) as client:
        authenticate(client)
        yield client
