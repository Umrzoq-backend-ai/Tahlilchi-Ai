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
                CREATE TABLE IF NOT EXISTS google_auth_flows (
                    state_hash TEXT PRIMARY KEY, nonce TEXT NOT NULL, verifier TEXT NOT NULL,
                    redirect_uri TEXT NOT NULL, user_id TEXT, session_hash TEXT,
                    created_at REAL NOT NULL
                );
                CREATE TABLE IF NOT EXISTS google_identities (
                    sub TEXT PRIMARY KEY, user_id TEXT NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
                    email TEXT NOT NULL, display_name TEXT, picture_url TEXT
                );
            """)
            google_columns = {
                row[1] for row in db.execute("PRAGMA table_info(google_identities)").fetchall()
            }
            if "display_name" not in google_columns:
                db.execute("ALTER TABLE google_identities ADD COLUMN display_name TEXT")
            if "picture_url" not in google_columns:
                db.execute("ALTER TABLE google_identities ADD COLUMN picture_url TEXT")

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

    def begin_google_flow(
        self,
        state: str,
        nonce: str,
        verifier: str,
        redirect_uri: str,
        session_token: str | None = None,
        peer: str = "unknown",
    ):
        session = self.session(session_token) if session_token else None
        if session_token and not session:
            raise AppError("AUTH_REQUIRED", "Google hisobini bog‘lash uchun qayta kiring.", 401)
        with self.store.connect() as db:
            db.execute("BEGIN IMMEDIATE")
            now = time.time()
            db.execute("DELETE FROM google_auth_flows WHERE created_at<?", (now - 600,))
            db.execute("DELETE FROM login_attempts WHERE resets_at<=?", (now,))
            bucket = token_hash("google_start:" + peer)
            row = db.execute(
                "SELECT failures FROM login_attempts WHERE bucket=?", (bucket,)
            ).fetchone()
            if row and row[0] >= 20:
                raise AppError(
                    "LOGIN_LIMIT", "Google kirish urinishlari ko‘p. Keyinroq urinib ko‘ring.", 429
                )
            db.execute(
                "INSERT INTO login_attempts VALUES (?, 1, ?) ON CONFLICT(bucket) DO UPDATE SET failures=failures+1",
                (bucket, now + 900),
            )
            db.execute(
                "INSERT INTO google_auth_flows VALUES (?, ?, ?, ?, ?, ?, ?)",
                (
                    token_hash(state),
                    nonce,
                    verifier,
                    redirect_uri,
                    session["id"] if session else None,
                    token_hash(session_token) if session_token else None,
                    time.time(),
                ),
            )

    def consume_google_flow(self, state: str, cookie_state: str):
        if (
            not state
            or len(state) > 128
            or not hmac.compare_digest(state.encode(), cookie_state.encode())
        ):
            raise AppError(
                "GOOGLE_STATE", "Google kirish sessiyasi mos emas. Qayta urinib ko‘ring.", 403
            )
        with self.store.connect() as db:
            row = db.execute(
                "DELETE FROM google_auth_flows WHERE state_hash=? RETURNING nonce, verifier, redirect_uri, user_id, session_hash, created_at",
                (token_hash(state),),
            ).fetchone()
        if not row or time.time() - row[5] > 600:
            raise AppError(
                "GOOGLE_STATE", "Google kirish sessiyasi tugagan. Qayta urinib ko‘ring.", 403
            )
        return {
            "nonce": row[0],
            "verifier": row[1],
            "redirect_uri": row[2],
            "user_id": row[3],
            "session_hash": row[4],
        }

    def google_identity(
        self,
        subject: str,
        email: str,
        display_name: str | None = None,
        picture_url: str | None = None,
        user_id: str | None = None,
        session_hash: str | None = None,
    ):
        if not subject or len(subject) > 255 or not email or len(email) > 320:
            raise AppError("GOOGLE_IDENTITY", "Google hisob ma’lumoti yaroqsiz.", 401)
        with self.store.connect() as db:
            db.execute("BEGIN IMMEDIATE")
            if user_id:
                active = db.execute(
                    "SELECT 1 FROM sessions WHERE token_hash=? AND user_id=? AND expires_at>?",
                    (session_hash, user_id, time.time()),
                ).fetchone()
                if not active:
                    raise AppError(
                        "AUTH_REQUIRED", "Bog‘lash sessiyasi tugagan. Qayta kiring.", 401
                    )
                bound = db.execute(
                    "SELECT user_id FROM google_identities WHERE sub=?", (subject,)
                ).fetchone()
                other = db.execute(
                    "SELECT sub FROM google_identities WHERE user_id=?", (user_id,)
                ).fetchone()
                if other and other[0] != subject:
                    raise AppError(
                        "GOOGLE_LINKED", "Bu ish maydoniga boshqa Google hisobi bog‘langan.", 409
                    )
                if bound and bound[0] != user_id:
                    source_id = bound[0]
                    source = db.execute(
                        "SELECT username, role FROM users WHERE id=?", (source_id,)
                    ).fetchone()
                    owns_data = db.execute(
                        "SELECT 1 FROM datasets WHERE owner_id=? LIMIT 1", (source_id,)
                    ).fetchone()
                    if (
                        not source
                        or not source[0].startswith("google_")
                        or source[1] != "user"
                        or owns_data
                    ):
                        raise AppError(
                            "GOOGLE_LINKED",
                            "Bu Google hisobi boshqa ish maydoniga bog‘langan.",
                            409,
                        )
                    db.execute(
                        "UPDATE google_identities SET user_id=?, email=?, display_name=?, picture_url=? WHERE sub=?",
                        (user_id, email, display_name, picture_url, subject),
                    )
                    db.execute("DELETE FROM sessions WHERE user_id=?", (source_id,))
                    db.execute("DELETE FROM users WHERE id=?", (source_id,))
                if not bound:
                    db.execute(
                        "INSERT INTO google_identities (sub, user_id, email, display_name, picture_url) VALUES (?, ?, ?, ?, ?)",
                        (subject, user_id, email, display_name, picture_url),
                    )
                else:
                    db.execute(
                        "UPDATE google_identities SET email=?, display_name=?, picture_url=? WHERE sub=?",
                        (email, display_name, picture_url, subject),
                    )
                target_id = user_id
            else:
                bound = db.execute(
                    "SELECT user_id FROM google_identities WHERE sub=?", (subject,)
                ).fetchone()
                if bound:
                    target_id = bound[0]
                    db.execute(
                        "UPDATE google_identities SET email=?, display_name=?, picture_url=? WHERE sub=?",
                        (email, display_name, picture_url, subject),
                    )
                else:
                    if db.execute("SELECT 1 FROM users LIMIT 1").fetchone() is None:
                        raise AppError(
                            "GOOGLE_SETUP", "Avval lokal administrator hisobini yarating.", 403
                        )
                    if self.settings.public_origin and not self.settings.google_allowed_domain:
                        raise AppError(
                            "GOOGLE_INVITE", "Google orqali yangi hisoblar bu serverda yopiq.", 403
                        )
                    target_id = str(uuid4())
                    username = "google_" + hashlib.sha256(subject.encode()).hexdigest()[:20]
                    db.execute(
                        "INSERT INTO users VALUES (?, ?, ?, 'user', ?)",
                        (
                            target_id,
                            username,
                            password_hash(secrets.token_urlsafe(32)),
                            time.time(),
                        ),
                    )
                    db.execute(
                        "INSERT INTO google_identities (sub, user_id, email, display_name, picture_url) VALUES (?, ?, ?, ?, ?)",
                        (subject, target_id, email, display_name, picture_url),
                    )
            row = db.execute(
                "SELECT u.id, u.username, u.role, g.email, g.display_name, g.picture_url FROM users u LEFT JOIN google_identities g ON g.user_id=u.id WHERE u.id=?",
                (target_id,),
            ).fetchone()
        return {
            "id": row[0],
            "username": row[1],
            "role": row[2],
            "google_email": row[3],
            "display_name": row[4],
            "picture_url": row[5],
        }

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
                "SELECT u.id, u.username, u.role, g.email, g.display_name, g.picture_url FROM sessions s JOIN users u ON u.id=s.user_id LEFT JOIN google_identities g ON g.user_id=u.id WHERE s.token_hash=? AND s.expires_at>?",
                (token_hash(token), time.time()),
            ).fetchone()
        return (
            {
                "id": row[0],
                "username": row[1],
                "role": row[2],
                "google_email": row[3],
                "display_name": row[4],
                "picture_url": row[5],
            }
            if row
            else None
        )

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
