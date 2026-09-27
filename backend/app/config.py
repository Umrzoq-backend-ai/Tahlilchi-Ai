import os
import re
from dataclasses import dataclass, field
from pathlib import Path
from urllib.parse import urlsplit

from dotenv import dotenv_values

PROJECT_ROOT = Path(__file__).resolve().parents[2]


@dataclass(frozen=True)
class Settings:
    data_dir: Path
    max_upload_bytes: int = 20 * 1024 * 1024
    job_timeout: int = 60
    max_rows: int = 100_000
    max_columns: int = 100
    max_parallel_jobs: int = 2
    llm_base_url: str = "https://generativelanguage.googleapis.com/v1beta/openai"
    llm_model: str = ""
    llm_api_key: str = field(default="", repr=False)
    llm_allow_remote: bool = False
    llm_json_mode: str = "schema"
    llm_timeout: int = 45
    agent_timeout: int = 180
    agent_max_calls: int = 5
    sandbox_binary: str = "/usr/bin/bwrap"
    public_origin: str = ""
    session_hours: int = 12
    google_client_id: str = ""
    google_client_secret: str = field(default="", repr=False)
    google_allowed_domain: str = ""

    @property
    def google_enabled(self) -> bool:
        return bool(self.google_client_id and self.google_client_secret)

    def __post_init__(self):
        origin = urlsplit(self.public_origin)
        if self.public_origin and (
            origin.scheme != "https"
            or not origin.hostname
            or origin.path
            or origin.query
            or origin.fragment
            or origin.username
            or origin.password
        ):
            raise ValueError("ANALYST_PUBLIC_ORIGIN must be an HTTPS origin without a path")
        if self.google_allowed_domain and not re.fullmatch(
            r"(?=.{1,253}$)(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}",
            self.google_allowed_domain,
        ):
            raise ValueError("ANALYST_GOOGLE_ALLOWED_DOMAIN must be a lowercase domain")
        if not 1 <= self.session_hours <= 168:
            raise ValueError("Session lifetime must be 1..168 hours")

    @property
    def allowed_hosts(self) -> list[str]:
        if self.public_origin:
            return [urlsplit(self.public_origin).hostname]
        return ["localhost", "127.0.0.1", "[::1]", "testserver"]

    @property
    def llm_local(self) -> bool:
        return urlsplit(self.llm_base_url).hostname in {"localhost", "127.0.0.1", "::1"}

    def agent_configuration_error(self) -> str | None:
        url = urlsplit(self.llm_base_url)
        if not self.llm_model:
            return "AI model sozlanmagan. .env ichida ANALYST_LLM_MODEL qiymatini kiriting."
        if url.username or url.password or url.query or url.fragment or not url.hostname:
            return "AI xizmatining URL manzili noto‘g‘ri."
        if url.scheme != "https" and not (self.llm_local and url.scheme == "http"):
            return "Tashqi AI xizmati uchun HTTPS talab qilinadi."
        if not self.llm_local and not self.llm_allow_remote:
            return "Tashqi AIga savol va schema yuborish o‘chiq. ANALYST_LLM_ALLOW_REMOTE=true bilan yoqing."
        if not self.llm_local and not self.llm_api_key:
            return "AI API kaliti sozlanmagan. ANALYST_LLM_API_KEY qiymatini .env ichiga kiriting."
        if self.llm_json_mode not in {"schema", "json"}:
            return "ANALYST_LLM_JSON_MODE schema yoki json bo‘lishi kerak."
        return None

    @classmethod
    def from_env(cls) -> "Settings":
        # Never execute a .env as shell code; exported variables take precedence.
        values = {**dotenv_values(PROJECT_ROOT / ".env"), **os.environ}
        size = int(values.get("ANALYST_MAX_UPLOAD_MB", "20"))
        timeout = int(values.get("ANALYST_JOB_TIMEOUT", "60"))
        if size < 1 or timeout < 1:
            raise ValueError("Upload size and job timeout must be positive")
        return cls(
            data_dir=(PROJECT_ROOT / values.get("ANALYST_DATA_DIR", ".data")).resolve(),
            max_upload_bytes=size * 1024 * 1024,
            job_timeout=timeout,
            public_origin=values.get("ANALYST_PUBLIC_ORIGIN", "").rstrip("/"),
            session_hours=int(values.get("ANALYST_SESSION_HOURS", "12")),
            google_client_id=values.get("ANALYST_GOOGLE_CLIENT_ID", "").strip(),
            google_client_secret=values.get("ANALYST_GOOGLE_CLIENT_SECRET", "").strip(),
            google_allowed_domain=values.get("ANALYST_GOOGLE_ALLOWED_DOMAIN", "").strip().lower(),
            llm_base_url=values.get(
                "ANALYST_LLM_BASE_URL", "https://generativelanguage.googleapis.com/v1beta/openai"
            ).rstrip("/"),
            llm_model=values.get("ANALYST_LLM_MODEL", ""),
            llm_api_key=values.get("ANALYST_LLM_API_KEY") or values.get("GEMINI_API_KEY", ""),
            llm_allow_remote=values.get("ANALYST_LLM_ALLOW_REMOTE", "false").lower() == "true",
            llm_json_mode=values.get("ANALYST_LLM_JSON_MODE", "schema"),
        )
