import asyncio
import base64
import hashlib
import hmac
import logging
import re
from contextlib import asynccontextmanager
from typing import Annotated, Literal
from uuid import UUID, uuid4

from fastapi import (
    FastAPI,
    File,
    Query,
    Request,
    Response,
    UploadFile,
    WebSocket,
    WebSocketDisconnect,
)
from fastapi.exceptions import RequestValidationError
from fastapi.responses import FileResponse, HTMLResponse, JSONResponse, RedirectResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, ConfigDict, Field
from starlette.middleware.trustedhost import TrustedHostMiddleware

from app.agent.models import QuestionRequest
from app.agent.orchestrator import TERMINAL, AgentService
from app.auth import COOKIE, AuthService, Credentials, csrf_token
from app.config import PROJECT_ROOT, Settings
from app.errors import AppError
from app.google_oauth import STATE_COOKIE, GoogleOAuth
from app.schemas import AnalysisRequest
from app.services import DatasetService

logger = logging.getLogger(__name__)


class ParseOptions(BaseModel):
    model_config = ConfigDict(extra="forbid")
    sheet: str | None = Field(default=None, max_length=200)
    delimiter: Literal[",", ";", "\t", "|"] | None = None


def create_app(settings: Settings | None = None) -> FastAPI:
    config = settings or Settings.from_env()
    frontend_output = PROJECT_ROOT / "frontend" / "out"
    html_path = frontend_output / "index.html"

    def script_sources() -> str:
        if not html_path.exists():
            return ""
        html = html_path.read_text(encoding="utf-8")
        sources = []
        for attributes, body in re.findall(
            r"<script([^>]*)>(.*?)</script>", html, re.DOTALL | re.IGNORECASE
        ):
            if not re.search(r"\bsrc\s*=", attributes, re.IGNORECASE):
                digest = base64.b64encode(hashlib.sha256(body.encode()).digest()).decode()
                sources.append(f"'sha256-{digest}'")
        return " " + " ".join(sources) if sources else ""

    inline_script_sources = script_sources()

    @asynccontextmanager
    async def lifespan(app: FastAPI):
        app.state.service = DatasetService(config)
        app.state.agent = AgentService(app.state.service)
        app.state.auth = AuthService(app.state.service.store, config)
        app.state.google_oauth = GoogleOAuth(config)
        try:
            yield
        finally:
            await asyncio.to_thread(app.state.agent.close)

    app = FastAPI(
        title="Data Analyst",
        version="0.5.0",
        description="CSV/Excel, Gemini agenti va mustaqil tekshiriladigan hisoblashlar.",
        lifespan=lifespan,
    )
    app.add_middleware(TrustedHostMiddleware, allowed_hosts=config.allowed_hosts)

    @app.middleware("http")
    async def local_boundaries(request: Request, call_next):
        request.state.request_id = str(uuid4())
        origin = request.headers.get("origin")
        if origin and origin != (
            config.public_origin or f"{request.url.scheme}://{request.headers.get('host')}"
        ):
            return error_response(
                request, "ORIGIN", "Boshqa saytdan kelgan so‘rovga ruxsat yo‘q.", 403
            )
        length = request.headers.get("content-length")
        if length:
            try:
                if int(length) > config.max_upload_bytes + 1024 * 1024:
                    return error_response(
                        request, "FILE_TOO_LARGE", "So‘rov hajmi limitdan oshgan.", 413
                    )
            except ValueError:
                return error_response(request, "BAD_REQUEST", "Content-Length noto‘g‘ri.", 400)
        public = {
            "/api/v1/health",
            "/api/v1/demo.csv",
            "/api/v1/auth/me",
            "/api/v1/auth/login",
            "/api/v1/auth/setup",
            "/api/v1/auth/google/status",
            "/api/v1/auth/google/start",
            "/api/v1/auth/google/callback",
        }
        if request.url.path.startswith("/api/") and request.url.path not in public:
            token = request.cookies.get(COOKIE, "")
            user = await asyncio.to_thread(request.app.state.auth.session, token)
            if not user:
                return error_response(request, "AUTH_REQUIRED", "Hisobingizga kiring.", 401)
            request.state.user = user
            if request.method not in {"GET", "HEAD", "OPTIONS"} and not hmac.compare_digest(
                request.headers.get("x-csrf-token", "").encode(), csrf_token(token).encode()
            ):
                return error_response(
                    request, "CSRF", "Sessiya tekshiruvi o‘tmadi. Sahifani yangilang.", 403
                )
            try:
                await asyncio.to_thread(
                    request.app.state.auth.authorize_resource, request.url.path, user
                )
            except AppError as exc:
                return error_response(request, exc.code, exc.message, exc.status)
        response = await call_next(request)
        response.headers["X-Request-ID"] = request.state.request_id
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["Referrer-Policy"] = (
            "no-referrer" if request.url.path == "/api/v1/auth/google/callback" else "same-origin"
        )
        response.headers["Content-Security-Policy"] = (
            (
                "default-src 'self'; script-src 'self'"
                + inline_script_sources
                + "; style-src 'self'; "
                "img-src 'self' data:; connect-src 'self'; object-src 'none'; frame-ancestors 'none'"
            )
            if not request.url.path.startswith(("/docs", "/redoc"))
            else "frame-ancestors 'none'"
        )
        if request.url.path.startswith("/api") or request.url.path == "/":
            response.headers["Cache-Control"] = "no-store"
        return response

    def error_response(request: Request, code: str, message: str, status: int):
        return JSONResponse(
            status_code=status,
            headers={"Cache-Control": "no-store", "X-Content-Type-Options": "nosniff"},
            content={
                "error": {"code": code, "message": message},
                "request_id": getattr(request.state, "request_id", None),
            },
        )

    @app.exception_handler(AppError)
    async def app_error(request: Request, exc: AppError):
        return error_response(request, exc.code, exc.message, exc.status)

    @app.exception_handler(RequestValidationError)
    async def validation_error(request: Request, exc: RequestValidationError):
        messages = [
            f"{'.'.join(str(part) for part in error['loc'])}: {error['msg']}"
            for error in exc.errors()
        ]
        return error_response(request, "VALIDATION", " ".join(messages), 422)

    @app.exception_handler(Exception)
    async def unexpected_error(request: Request, exc: Exception):
        logger.error(
            "Unexpected error request_id=%s type=%s", request.state.request_id, type(exc).__name__
        )
        return error_response(
            request, "INTERNAL_ERROR", "Ichki xatolik yuz berdi. Qayta urinib ko‘ring.", 500
        )

    def setup_allowed(request):
        return (
            not config.public_origin
            and request.client is not None
            and request.client.host in {"127.0.0.1", "::1", "testclient"}
            and request.app.state.auth.needs_setup()
        )

    def start_session(request, response, user):
        token = request.app.state.auth.new_session(user["id"])
        response.set_cookie(
            COOKIE,
            token,
            httponly=True,
            secure=bool(config.public_origin),
            samesite="strict",
            max_age=config.session_hours * 3600,
            path="/",
        )
        return {"authenticated": True, "user": user, "csrf_token": csrf_token(token)}

    @app.get("/api/v1/auth/me")
    def me(request: Request):
        token = request.cookies.get(COOKIE, "")
        user = request.app.state.auth.session(token)
        if user:
            return {"authenticated": True, "user": user, "csrf_token": csrf_token(token)}
        return {"authenticated": False, "setup_allowed": setup_allowed(request)}

    @app.post("/api/v1/auth/setup", status_code=201)
    def setup(payload: Credentials, request: Request, response: Response):
        if not setup_allowed(request):
            raise AppError(
                "SETUP_CLOSED", "Birinchi hisobni server administratoridan so‘rang.", 403
            )
        user = request.app.state.auth.create_user(payload, first=True, claim_legacy=True)
        return start_session(request, response, user)

    @app.post("/api/v1/auth/login")
    def login(payload: Credentials, request: Request, response: Response):
        user = request.app.state.auth.login(
            payload, request.client.host if request.client else "unknown"
        )
        return start_session(request, response, user)

    def google_redirect_uri(request: Request) -> str:
        origin = config.public_origin or f"{request.url.scheme}://{request.headers.get('host')}"
        return origin + "/api/v1/auth/google/callback"

    def google_flow_response(request: Request, session_token: str | None = None):
        oauth = request.app.state.google_oauth
        uri = google_redirect_uri(request)
        state, nonce, verifier, url = oauth.begin(uri)
        request.app.state.auth.begin_google_flow(
            state,
            nonce,
            verifier,
            uri,
            session_token,
            request.client.host if request.client else "unknown",
        )
        response = JSONResponse({"url": url})
        response.set_cookie(
            STATE_COOKIE,
            state,
            httponly=True,
            secure=bool(config.public_origin),
            samesite="lax",
            max_age=600,
            path="/api/v1/auth/google/callback",
        )
        return response

    @app.get("/api/v1/auth/google/status")
    def google_status(request: Request):
        user = request.app.state.auth.session(request.cookies.get(COOKIE, ""))
        return {
            "configured": config.google_enabled,
            "redirect_uri": google_redirect_uri(request),
            "linked": bool(user and user.get("google_email")),
        }

    @app.get("/api/v1/auth/google/start")
    def google_start(request: Request):
        if request.app.state.auth.session(request.cookies.get(COOKIE, "")):
            raise AppError(
                "ALREADY_LOGGED_IN", "Hisobingizga Google bog‘lash tugmasidan foydalaning.", 409
            )
        return google_flow_response(request)

    @app.post("/api/v1/auth/google/link")
    def google_link(request: Request):
        if request.state.user.get("google_email"):
            raise AppError("GOOGLE_LINKED", "Bu hisobga Google allaqachon bog‘langan.", 409)
        return google_flow_response(request, request.cookies.get(COOKIE, ""))

    @app.get("/api/v1/auth/google/callback")
    async def google_callback(
        request: Request,
        state: str = Query(max_length=128),
        code: str | None = Query(default=None, max_length=4096),
        error: str | None = Query(default=None, max_length=128),
    ):
        flow = request.app.state.auth.consume_google_flow(
            state, request.cookies.get(STATE_COOKIE, "")
        )
        response = RedirectResponse("/", status_code=303)
        response.delete_cookie(
            STATE_COOKIE,
            path="/api/v1/auth/google/callback",
            secure=bool(config.public_origin),
            httponly=True,
            samesite="lax",
        )
        if error or not code:
            response.headers["Location"] = "/?google_error=denied"
            return response
        try:
            token = await request.app.state.google_oauth.exchange(
                code, flow["verifier"], flow["redirect_uri"]
            )
            subject, email = await asyncio.to_thread(
                request.app.state.google_oauth.verify, token, flow["nonce"]
            )
            user = await asyncio.to_thread(
                request.app.state.auth.google_identity,
                subject,
                email,
                flow["user_id"],
                flow["session_hash"],
            )
        except AppError as exc:
            logger.warning(
                "Google sign-in failed request_id=%s code=%s", request.state.request_id, exc.code
            )
            response.headers["Location"] = "/?google_error=" + (
                "link"
                if exc.code == "GOOGLE_LINKED"
                else "setup"
                if exc.code == "GOOGLE_SETUP"
                else "failed"
            )
            return response
        session_token = request.app.state.auth.new_session(user["id"])
        response.set_cookie(
            COOKIE,
            session_token,
            httponly=True,
            secure=bool(config.public_origin),
            samesite="strict",
            max_age=config.session_hours * 3600,
            path="/",
        )
        return response

    @app.post("/api/v1/auth/logout", status_code=204)
    def logout(request: Request, response: Response):
        request.app.state.auth.logout(request.cookies.get(COOKIE, ""))
        response.delete_cookie(
            COOKIE, path="/", secure=bool(config.public_origin), httponly=True, samesite="strict"
        )

    @app.post("/api/v1/auth/users", status_code=201)
    def add_user(payload: Credentials, request: Request):
        if request.state.user["role"] != "admin":
            raise AppError("FORBIDDEN", "Faqat administrator hisob yaratishi mumkin.", 403)
        return request.app.state.auth.create_user(payload)

    @app.get("/api/v1/health")
    def health(request: Request):
        return {
            "status": "ok",
            "version": "0.5.0",
            "mode": "server" if config.public_origin else "local",
            "agent_enabled": request.app.state.agent.status()["configured"],
            "max_upload_bytes": config.max_upload_bytes,
        }

    @app.get("/api/v1/datasets")
    def list_datasets(request: Request):
        return [
            {key: row[key] for key in ("id", "name", "size_bytes", "created_at", "status")}
            for row in request.app.state.service.store.list_datasets(request.state.user["id"])
        ]

    @app.post("/api/v1/datasets", status_code=201)
    def upload_dataset(
        request: Request,
        file: Annotated[UploadFile, File()],
        sheet: Annotated[str | None, Query(max_length=200)] = None,
        delimiter: Literal[",", ";", "\t", "|"] | None = None,
    ):
        try:
            return request.app.state.service.upload(
                file.file,
                file.filename or "",
                {"sheet": sheet, "delimiter": delimiter},
                owner_id=request.state.user["id"],
            )
        finally:
            file.file.close()

    @app.get("/api/v1/datasets/{dataset_id}")
    def get_dataset(dataset_id: UUID, request: Request):
        return request.app.state.service.get(str(dataset_id))

    @app.get("/api/v1/datasets/{dataset_id}/preview")
    def preview(dataset_id: UUID, request: Request):
        return request.app.state.service.get(str(dataset_id))["profile"]["preview"]

    @app.post("/api/v1/datasets/{dataset_id}/versions", status_code=201)
    def reparse(dataset_id: UUID, options: ParseOptions, request: Request):
        return request.app.state.service.reparse(str(dataset_id), options.model_dump())

    @app.delete("/api/v1/datasets/{dataset_id}", status_code=204)
    def delete_dataset(dataset_id: UUID, request: Request):
        request.app.state.service.delete(str(dataset_id))
        return Response(status_code=204)

    @app.post("/api/v1/datasets/{dataset_id}/analyses", status_code=201)
    def analysis(dataset_id: UUID, payload: AnalysisRequest, request: Request):
        return request.app.state.service.analyze(str(dataset_id), payload.model_dump())

    @app.get("/api/v1/datasets/{dataset_id}/analyses")
    def history(dataset_id: UUID, request: Request):
        request.app.state.service.get(str(dataset_id))
        return request.app.state.service.store.list_analyses(str(dataset_id))

    @app.get("/api/v1/agent/status")
    def agent_status(request: Request):
        return request.app.state.agent.status()

    @app.post("/api/v1/datasets/{dataset_id}/questions", status_code=202)
    def question(dataset_id: UUID, payload: QuestionRequest, request: Request):
        return request.app.state.agent.submit(str(dataset_id), payload)

    @app.get("/api/v1/datasets/{dataset_id}/runs")
    def runs(dataset_id: UUID, request: Request):
        request.app.state.service.get(str(dataset_id))
        return request.app.state.service.store.list_runs(str(dataset_id))

    @app.get("/api/v1/runs/{run_id}")
    def get_run(run_id: UUID, request: Request):
        return request.app.state.agent.get(str(run_id))

    @app.post("/api/v1/runs/{run_id}/cancel")
    def cancel_run(run_id: UUID, request: Request):
        return request.app.state.agent.cancel(str(run_id))

    @app.get("/api/v1/runs/{run_id}/events")
    def events(run_id: UUID, request: Request, after_seq: int = Query(default=0, ge=0)):
        return [
            event
            for event in request.app.state.agent.get(str(run_id))["events"]
            if event["seq"] > after_seq
        ]

    @app.websocket("/api/v1/runs/{run_id}/events/ws")
    async def websocket_events(websocket: WebSocket, run_id: UUID):
        host = websocket.headers.get("host", "")
        origin = websocket.headers.get("origin")
        scheme = "https" if websocket.url.scheme == "wss" else "http"
        if origin and origin != (config.public_origin or f"{scheme}://{host}"):
            await websocket.close(code=1008)
            return
        token = websocket.cookies.get(COOKIE, "")
        user = await asyncio.to_thread(websocket.app.state.auth.session, token)
        if not user:
            await websocket.close(code=1008)
            return
        try:
            await asyncio.to_thread(
                websocket.app.state.auth.authorize_resource, websocket.url.path, user
            )
        except AppError:
            await websocket.close(code=1008)
            return
        await websocket.accept()
        previous = None
        try:
            while True:
                if not await asyncio.to_thread(websocket.app.state.auth.session, token):
                    await websocket.close(code=1008)
                    return
                run = await asyncio.to_thread(websocket.app.state.agent.get, str(run_id))
                version = (run["status"], len(run["events"]))
                if version != previous:
                    await websocket.send_json(run)
                    previous = version
                if run["status"] in TERMINAL:
                    await websocket.close()
                    return
                await asyncio.sleep(0.5)
        except WebSocketDisconnect:
            return
        except AppError:
            await websocket.close(code=1008)

    @app.get("/api/v1/demo.csv")
    def demo():
        return FileResponse(
            PROJECT_ROOT / "examples" / "sales.csv", media_type="text/csv", filename="sales.csv"
        )

    @app.get("/", include_in_schema=False)
    def index():
        if not html_path.is_file():
            return HTMLResponse(
                "Frontend build topilmadi. npm ci --prefix frontend && npm run build --prefix frontend",
                status_code=503,
            )
        return FileResponse(html_path)

    app.mount(
        "/_next",
        StaticFiles(directory=frontend_output / "_next", check_dir=False),
        name="next-assets",
    )
    return app


app = create_app()
