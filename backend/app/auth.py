"""Password accounts and revocable opaque sessions. No credentials in API responses."""

import hashlib
import hmac
import json
import secrets
import time
from uuid import UUID, uuid4

from pydantic import BaseModel, ConfigDict, Field

from app.errors import AppError

COOKIE = "analyst_session"


class Credentials(BaseModel):
    model_config = ConfigDict(extra="forbid")
    username: str = Field(min_length=3, max_length=64, pattern=r"^[a-zA-Z0-9_.-]+$")
    password: str = Field(min_length=12, max_length=128, repr=False)


def password_hash(password: str, salt: str | None = None) -> str:
    salt = salt or secrets.token_hex(16)
    digest = hashlib.scrypt(
        password.encode(), salt=bytes.fromhex(salt), n=32768, r=8, p=3, maxmem=64 * 1024 * 1024
    ).hex()
    return f"scrypt:{salt}:{digest}"


def check_password(password: str, encoded: str) -> bool:
    return hmac.compare_digest(password_hash(password, encoded.split(":")[1]), encoded)


def token_hash(token: str) -> str:
    return hashlib.sha256(token.encode()).hexdigest()


def csrf_token(token: str) -> str:
    return token_hash("csrf:" + token)


class AuthService:
    def __init__(self, store, settings):
        self.store = store
        self.settings = settings
        self.dummy_hash = password_hash(secrets.token_urlsafe(24))
        with store.connect() as db:
            db.executescript("""
                CREATE TABLE IF NOT EXISTS users (
                    id TEXT PRIMARY KEY, username TEXT NOT NULL UNIQUE,
                    password_hash TEXT NOT NULL, role TEXT NOT NULL,
                    created_at REAL NOT NULL
                );
                CREATE TABLE IF NOT EXISTS sessions (
                    token_hash TEXT PRIMARY KEY,
                    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                    expires_at REAL NOT NULL
                );
                CREATE TABLE IF NOT EXISTS login_attempts (
                    bucket TEXT PRIMARY KEY, failures INTEGER NOT NULL, resets_at REAL NOT NULL
                );
            """)

    def needs_setup(self):
        with self.store.connect() as db:
            return db.execute("SELECT 1 FROM users LIMIT 1").fetchone() is None

    def create_user(self, credentials: Credentials, *, first=False, claim_legacy=False):
        user = {
            "id": str(uuid4()),
            "username": credentials.username.lower(),
            "role": "admin" if first else "user",
        }
        hashed = password_hash(credentials.password)
        with self.store.connect() as db:
            db.execute("BEGIN IMMEDIATE")
            if first and db.execute("SELECT 1 FROM users LIMIT 1").fetchone():
                raise AppError("SETUP_CLOSED", "Administrator allaqachon yaratilgan.", 409)
            if db.execute("SELECT 1 FROM users WHERE username=?", (user["username"],)).fetchone():
                raise AppError("USER_EXISTS", "Bu login band.", 409)
            db.execute(
                "INSERT INTO users VALUES (?, ?, ?, ?, ?)",
                (user["id"], user["username"], hashed, user["role"], time.time()),
            )
            if first and claim_legacy:
                for dataset_id, raw in db.execute(
                    "SELECT id, document FROM datasets WHERE owner_id IS NULL"
                ).fetchall():
                    document = json.loads(raw)
                    document["owner_id"] = user["id"]
                    db.execute(
                        "UPDATE datasets SET owner_id=?, document=? WHERE id=?",
                        (user["id"], json.dumps(document), dataset_id),
                    )
        return user

    def login(self, credentials: Credentials, peer: str):
        username = credentials.username.lower()
        # Separate account and IP buckets prevent rotating usernames or IPs from bypassing limits.
        buckets = [token_hash("user:" + username), token_hash("peer:" + peer)]
        now = time.time()
        with self.store.connect() as db:
            db.execute("BEGIN IMMEDIATE")
            db.execute("DELETE FROM login_attempts WHERE resets_at <= ?", (now,))
            for bucket in buckets:
                row = db.execute(
                    "SELECT failures FROM login_attempts WHERE bucket=?", (bucket,)
                ).fetchone()
                if row and row[0] >= 10:
                    raise AppError(
                        "LOGIN_LIMIT",
                        "Urinishlar ko‘p. 15 daqiqadan keyin qayta urinib ko‘ring.",
                        429,
                    )
            # Reserve attempts before hashing, including concurrent requests.
            for bucket in buckets:
                db.execute(
                    "INSERT INTO login_attempts VALUES (?, 1, ?) ON CONFLICT(bucket) DO UPDATE SET failures=failures+1",
                    (bucket, now + 900),
                )
            row = db.execute(
                "SELECT id, username, role, password_hash FROM users WHERE username=?", (username,)
            ).fetchone()
        valid = check_password(credentials.password, row[3] if row else self.dummy_hash)
        if not row or not valid:
            raise AppError("LOGIN_FAILED", "Login yoki parol noto‘g‘ri.", 401)
        with self.store.connect() as db:
            db.execute("DELETE FROM login_attempts WHERE bucket=?", (buckets[0],))
            db.execute(
                "UPDATE login_attempts SET failures=MAX(0, failures-1) WHERE bucket=?",
                (buckets[1],),
            )
        return {"id": row[0], "username": row[1], "role": row[2]}

    def reset_password(self, credentials: Credentials):
        hashed = password_hash(credentials.password)
        with self.store.connect() as db:
            db.execute("BEGIN IMMEDIATE")
            row = db.execute(
                "SELECT id FROM users WHERE username=?", (credentials.username.lower(),)
            ).fetchone()
            if not row:
                raise AppError("NOT_FOUND", "Foydalanuvchi topilmadi.", 404)
            db.execute("UPDATE users SET password_hash=? WHERE id=?", (hashed, row[0]))
            db.execute("DELETE FROM sessions WHERE user_id=?", (row[0],))
            db.execute(
                "DELETE FROM login_attempts WHERE bucket=?",
                (token_hash("user:" + credentials.username.lower()),),
            )

    def new_session(self, user_id):
        token = secrets.token_urlsafe(32)
        with self.store.connect() as db:
            db.execute("DELETE FROM sessions WHERE expires_at<=?", (time.time(),))
            db.execute(
                "INSERT INTO sessions VALUES (?, ?, ?)",
                (token_hash(token), user_id, time.time() + self.settings.session_hours * 3600),
            )
        return token

    def session(self, token):
        if not token or len(token) > 128:
            return None
        with self.store.connect() as db:
            row = db.execute(
                "SELECT u.id, u.username, u.role FROM sessions s JOIN users u ON u.id=s.user_id WHERE s.token_hash=? AND s.expires_at>?",
                (token_hash(token), time.time()),
            ).fetchone()
        return {"id": row[0], "username": row[1], "role": row[2]} if row else None

    def logout(self, token):
        with self.store.connect() as db:
            db.execute("DELETE FROM sessions WHERE token_hash=?", (token_hash(token),))

    def authorize_resource(self, path, user):
        parts = path.strip("/").split("/")
        if len(parts) < 4:
            return
        if parts[2] in {"datasets", "runs"}:
            try:
                UUID(parts[3])
            except ValueError:
                raise AppError("VALIDATION", "ID UUID formatida bo‘lishi kerak.", 422) from None
        dataset_id = None
        if parts[2] == "datasets":
            dataset_id = parts[3]
        elif parts[2] == "runs":
            run = self.store.get_run(parts[3])
            if run:
                dataset_id = run["dataset_id"]
            else:
                raise AppError("NOT_FOUND", "Natija topilmadi.", 404)
        if dataset_id and not self.store.owns_dataset(dataset_id, user["id"]):
            raise AppError("NOT_FOUND", "Dataset topilmadi yoki o‘chirilgan.", 404)
