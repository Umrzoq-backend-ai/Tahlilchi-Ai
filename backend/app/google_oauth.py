"""Google OpenID Connect code flow with one-use state, PKCE, and verified ID tokens."""

import base64
import hashlib
import hmac
import secrets
from urllib.parse import urlencode

import httpx
from google.auth.transport.requests import Request
from google.oauth2 import id_token

from app.config import Settings
from app.errors import AppError

AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth"
TOKEN_URL = "https://oauth2.googleapis.com/token"
STATE_COOKIE = "analyst_google_state"


class GoogleOAuth:
    def __init__(self, settings: Settings):
        self.settings = settings

    def configured(self) -> bool:
        return self.settings.google_enabled

    def begin(self, redirect_uri: str):
        if not self.configured():
            raise AppError("GOOGLE_NOT_CONFIGURED", "Google kirishi hali sozlanmagan.", 503)
        state = secrets.token_urlsafe(32)
        nonce = secrets.token_urlsafe(32)
        verifier = secrets.token_urlsafe(48)
        challenge = (
            base64.urlsafe_b64encode(hashlib.sha256(verifier.encode()).digest())
            .rstrip(b"=")
            .decode()
        )
        params = {
            "client_id": self.settings.google_client_id,
            "redirect_uri": redirect_uri,
            "response_type": "code",
            "scope": "openid email",
            "prompt": "select_account",
            "state": state,
            "nonce": nonce,
            "code_challenge": challenge,
            "code_challenge_method": "S256",
        }
        if self.settings.google_allowed_domain:
            params["hd"] = self.settings.google_allowed_domain
        return state, nonce, verifier, AUTH_URL + "?" + urlencode(params)

    async def exchange(self, code: str, verifier: str, redirect_uri: str) -> str:
        async with httpx.AsyncClient(timeout=12, follow_redirects=False) as client:
            try:
                response = await client.post(
                    TOKEN_URL,
                    data={
                        "code": code,
                        "client_id": self.settings.google_client_id,
                        "client_secret": self.settings.google_client_secret,
                        "redirect_uri": redirect_uri,
                        "grant_type": "authorization_code",
                        "code_verifier": verifier,
                    },
                )
                if response.status_code != 200 or len(response.content) > 64 * 1024:
                    raise AppError(
                        "GOOGLE_EXCHANGE", "Google kirishi yakunlanmadi. Qayta urinib ko‘ring.", 502
                    )
                payload = response.json()
                token = payload.get("id_token") if isinstance(payload, dict) else None
            except (httpx.HTTPError, ValueError) as exc:
                raise AppError("GOOGLE_EXCHANGE", "Google xizmatiga ulanish xatosi.", 502) from exc
        if not isinstance(token, str) or len(token) > 16_384:
            raise AppError("GOOGLE_TOKEN", "Google hisob tasdig‘i kelmadi.", 502)
        return token

    def verify(self, token: str, expected_nonce: str) -> tuple[str, str]:
        try:
            claims = id_token.verify_oauth2_token(
                token, Request(), self.settings.google_client_id, clock_skew_in_seconds=10
            )
        except Exception as exc:
            raise AppError("GOOGLE_TOKEN", "Google hisob tasdig‘i yaroqsiz.", 401) from exc
        if not hmac.compare_digest(str(claims.get("nonce", "")), expected_nonce):
            raise AppError("GOOGLE_NONCE", "Google kirish tasdig‘i mos emas.", 401)
        subject = claims.get("sub")
        email = claims.get("email")
        if (
            not isinstance(subject, str)
            or not isinstance(email, str)
            or claims.get("email_verified") is not True
        ):
            raise AppError("GOOGLE_EMAIL", "Tasdiqlangan Google email talab qilinadi.", 401)
        domain = self.settings.google_allowed_domain
        if domain and claims.get("hd") != domain:
            raise AppError(
                "GOOGLE_DOMAIN", "Bu Google hisobi tashkilot domeniga tegishli emas.", 403
            )
        return subject, email.lower()
