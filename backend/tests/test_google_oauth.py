from dataclasses import replace
from urllib.parse import parse_qs, urlsplit

import pytest
from conftest import authenticate
from fastapi.testclient import TestClient

from app.auth import Credentials
from app.errors import AppError
from app.main import create_app

CALLBACK = "/api/v1/auth/google/callback"


def configured(settings, **changes):
    return replace(
        settings,
        google_client_id="test.apps.googleusercontent.com",
        google_client_secret="fake-secret",
        **changes,
    )


def mock_provider(
    client,
    monkeypatch,
    subject="google-sub",
    email="person@gmail.com",
    display_name="Test Person",
    picture_url="https://lh3.googleusercontent.com/a/test-avatar",
):
    async def exchange(code, verifier, redirect_uri):
        assert code == "one-code" and len(verifier) >= 43 and redirect_uri.endswith(CALLBACK)
        return "verified-token"

    def verify(token, nonce):
        assert token == "verified-token" and len(nonce) >= 32
        return subject, email, display_name, picture_url

    monkeypatch.setattr(client.app.state.google_oauth, "exchange", exchange)
    monkeypatch.setattr(client.app.state.google_oauth, "verify", verify)


def begin(client, link=False):
    response = (
        client.post("/api/v1/auth/google/link") if link else client.get("/api/v1/auth/google/start")
    )
    assert response.status_code == 200, response.text
    url = response.json()["url"]
    params = {key: values[0] for key, values in parse_qs(urlsplit(url).query).items()}
    assert urlsplit(url).hostname == "accounts.google.com"
    assert params["scope"] == "openid email profile"
    assert params["prompt"] == "select_account"
    assert params["code_challenge_method"] == "S256"
    assert params["state"] == client.cookies.get("analyst_google_state")
    assert "fake-secret" not in url
    assert "httponly" in response.headers["set-cookie"].lower()
    assert "samesite=lax" in response.headers["set-cookie"].lower()
    return params


def callback(client, params):
    return client.get(
        CALLBACK, params={"state": params["state"], "code": "one-code"}, follow_redirects=False
    )


def test_disabled(settings):
    with TestClient(create_app(settings)) as client:
        assert client.get("/api/v1/auth/google/status").json()["configured"] is False
        assert client.get("/api/v1/auth/google/start").status_code == 503


def test_google_login_new_user_isolated_and_one_use(settings, monkeypatch):
    with TestClient(create_app(configured(settings))) as client:
        admin = authenticate(client)
        dataset = client.post("/api/v1/datasets", files={"file": ("private.csv", b"x\n1\n")}).json()
        client.post("/api/v1/auth/logout")
        mock_provider(client, monkeypatch)
        params = begin(client)
        assert (
            client.get(CALLBACK, params={"state": "wrong", "code": "one-code"}).status_code == 403
        )
        assert callback(client, params).status_code == 303
        me = client.get("/api/v1/auth/me").json()
        assert me["user"]["id"] != admin["id"]
        assert me["user"]["google_email"] == "person@gmail.com"
        assert me["user"]["display_name"] == "Test Person"
        assert me["user"]["picture_url"] == "https://lh3.googleusercontent.com/a/test-avatar"
        assert client.get(f"/api/v1/datasets/{dataset['id']}").status_code == 404
        assert callback(client, params).status_code == 403
        client.headers["X-CSRF-Token"] = me["csrf_token"]
        client.post("/api/v1/auth/logout")
        assert callback(client, begin(client)).status_code == 303
        assert client.get("/api/v1/auth/me").json()["user"]["id"] == me["user"]["id"]


def test_link_existing_account_keeps_data(settings, monkeypatch):
    with TestClient(create_app(configured(settings))) as client:
        admin = authenticate(client)
        dataset = client.post("/api/v1/datasets", files={"file": ("mine.csv", b"x\n1\n")}).json()
        mock_provider(client, monkeypatch)
        assert callback(client, begin(client, link=True)).status_code == 303
        me = client.get("/api/v1/auth/me").json()
        assert me["user"]["id"] == admin["id"]
        assert client.get(f"/api/v1/datasets/{dataset['id']}").status_code == 200
        client.headers["X-CSRF-Token"] = me["csrf_token"]
        assert client.post("/api/v1/auth/google/link").status_code == 409
        client.post("/api/v1/auth/logout")
        assert callback(client, begin(client)).status_code == 303
        assert client.get(f"/api/v1/datasets/{dataset['id']}").status_code == 200


def test_flow_cookie_expiry_and_revoked_link(settings, monkeypatch):
    with TestClient(create_app(configured(settings))) as client:
        authenticate(client)
        mock_provider(client, monkeypatch)
        params = begin(client, link=True)
        client.post("/api/v1/auth/logout")
        result = callback(client, params)
        assert result.status_code == 303 and result.headers["location"] == "/?google_error=failed"
        params = begin(client)
        with client.app.state.service.store.connect() as db:
            db.execute("UPDATE google_auth_flows SET created_at=0")
        assert callback(client, params).status_code == 403
        params = begin(client)
        client.cookies.clear()
        assert callback(client, params).status_code == 403


def test_production_signup_closed_without_domain(settings, monkeypatch):
    config = configured(settings, public_origin="https://analyst.example")
    with TestClient(create_app(config), base_url="https://analyst.example") as client:
        client.app.state.auth.create_user(
            Credentials(username="admin", password="admin-password-123"), first=True
        )
        mock_provider(client, monkeypatch)
        params = begin(client)
        assert params["redirect_uri"] == "https://analyst.example" + CALLBACK
        assert callback(client, params).headers["location"] == "/?google_error=failed"
        assert client.get("/api/v1/auth/me").json()["authenticated"] is False


def test_verified_claim_requirements(settings, monkeypatch):
    from app.google_oauth import GoogleOAuth

    oauth = GoogleOAuth(configured(settings, google_allowed_domain="company.uz"))
    claims = {
        "sub": "immutable-sub",
        "email": "person@company.uz",
        "email_verified": True,
        "nonce": "expected",
        "hd": "company.uz",
        "name": "  Example Person  ",
        "picture": "https://lh3.googleusercontent.com/a/profile-photo",
    }
    monkeypatch.setattr(
        "app.google_oauth.id_token.verify_oauth2_token", lambda *a, **k: claims.copy()
    )
    assert oauth.verify("token", "expected") == (
        "immutable-sub",
        "person@company.uz",
        "Example Person",
        "https://lh3.googleusercontent.com/a/profile-photo",
    )
    with pytest.raises(AppError) as wrong_nonce:
        oauth.verify("token", "wrong")
    assert wrong_nonce.value.code == "GOOGLE_NONCE"
    claims["email_verified"] = False
    with pytest.raises(AppError) as unverified:
        oauth.verify("token", "expected")
    assert unverified.value.code == "GOOGLE_EMAIL"
    claims["email_verified"] = True
    claims["hd"] = "another.uz"
    with pytest.raises(AppError) as wrong_domain:
        oauth.verify("token", "expected")
    assert wrong_domain.value.code == "GOOGLE_DOMAIN"


def test_empty_google_account_can_be_linked_to_old_account(settings, monkeypatch):
    with TestClient(create_app(configured(settings))) as client:
        admin = authenticate(client)
        dataset = client.post("/api/v1/datasets", files={"file": ("old.csv", b"x\n1\n")}).json()
        client.post("/api/v1/auth/logout")
        mock_provider(client, monkeypatch, subject="same-google")
        assert callback(client, begin(client)).status_code == 303
        temporary_id = client.get("/api/v1/auth/me").json()["user"]["id"]
        temporary_csrf = client.get("/api/v1/auth/me").json()["csrf_token"]
        client.headers["X-CSRF-Token"] = temporary_csrf
        client.post("/api/v1/auth/logout")
        authenticate(client)
        assert callback(client, begin(client, link=True)).status_code == 303
        assert client.get("/api/v1/auth/me").json()["user"]["id"] == admin["id"]
        assert client.get(f"/api/v1/datasets/{dataset['id']}").status_code == 200
        with client.app.state.service.store.connect() as db:
            assert db.execute("SELECT 1 FROM users WHERE id=?", (temporary_id,)).fetchone() is None


def test_google_account_with_files_cannot_be_merged(settings, monkeypatch):
    with TestClient(create_app(configured(settings))) as client:
        authenticate(client)
        client.post("/api/v1/auth/logout")
        mock_provider(client, monkeypatch, subject="has-data")
        callback(client, begin(client))
        me = client.get("/api/v1/auth/me").json()
        client.headers["X-CSRF-Token"] = me["csrf_token"]
        dataset = client.post("/api/v1/datasets", files={"file": ("new.csv", b"x\n1\n")}).json()
        client.post("/api/v1/auth/logout")
        authenticate(client)
        result = callback(client, begin(client, link=True))
        assert result.headers["location"] == "/?google_error=link"
        assert client.get(f"/api/v1/datasets/{dataset['id']}").status_code == 404


def test_oauth_start_is_rate_limited(settings):
    with TestClient(create_app(configured(settings))) as client:
        for _ in range(20):
            assert client.get("/api/v1/auth/google/start").status_code == 200
        assert client.get("/api/v1/auth/google/start").status_code == 429
