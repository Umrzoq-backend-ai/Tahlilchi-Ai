import json
import sqlite3
from contextlib import contextmanager
from pathlib import Path


class Store:
    """Small local metadata store. Raw files never live in the database."""

    def __init__(self, data_dir: Path):
        data_dir.mkdir(parents=True, exist_ok=True, mode=0o700)
        self.path = data_dir / "metadata.sqlite3"
        with self.connect() as db:
            db.executescript("""
                PRAGMA journal_mode=WAL;
                CREATE TABLE IF NOT EXISTS datasets (
                    id TEXT PRIMARY KEY,
                    document TEXT NOT NULL
                );
                CREATE TABLE IF NOT EXISTS analyses (
                    id TEXT PRIMARY KEY,
                    dataset_id TEXT NOT NULL REFERENCES datasets(id) ON DELETE CASCADE,
                    document TEXT NOT NULL
                );
                CREATE INDEX IF NOT EXISTS analysis_dataset ON analyses(dataset_id);
                CREATE TABLE IF NOT EXISTS agent_runs (
                    id TEXT PRIMARY KEY,
                    dataset_id TEXT NOT NULL REFERENCES datasets(id) ON DELETE CASCADE,
                    idempotency_key TEXT NOT NULL,
                    document TEXT NOT NULL,
                    UNIQUE(dataset_id, idempotency_key)
                );
            """)

            columns = {row[1] for row in db.execute("PRAGMA table_info(datasets)")}
            if "owner_id" not in columns:
                db.execute("ALTER TABLE datasets ADD COLUMN owner_id TEXT")
            db.execute("CREATE INDEX IF NOT EXISTS dataset_owner ON datasets(owner_id)")

    def owns_dataset(self, dataset_id: str, user_id: str) -> bool:
        with self.connect() as db:
            return (
                db.execute(
                    "SELECT 1 FROM datasets WHERE id=? AND owner_id=?", (dataset_id, user_id)
                ).fetchone()
                is not None
            )

    @contextmanager
    def connect(self):
        connection = sqlite3.connect(self.path, timeout=10)
        connection.execute("PRAGMA foreign_keys=ON")
        try:
            with connection:
                yield connection
        finally:
            connection.close()

    def put_dataset(self, document: dict) -> None:
        with self.connect() as db:
            db.execute(
                "INSERT INTO datasets (id, document, owner_id) VALUES (?, ?, ?)",
                (
                    document["id"],
                    json.dumps(document, allow_nan=False),
                    document.get("owner_id"),
                ),
            )

    def get_dataset(self, dataset_id: str) -> dict | None:
        with self.connect() as db:
            row = db.execute("SELECT document FROM datasets WHERE id=?", (dataset_id,)).fetchone()
        return json.loads(row[0]) if row else None

    def list_datasets(self, owner_id: str) -> list[dict]:
        with self.connect() as db:
            rows = db.execute(
                "SELECT document FROM datasets WHERE owner_id=? ORDER BY rowid DESC LIMIT 100",
                (owner_id,),
            ).fetchall()
        return [json.loads(row[0]) for row in rows]

    def delete_dataset(self, dataset_id: str) -> None:
        with self.connect() as db:
            db.execute("DELETE FROM datasets WHERE id=?", (dataset_id,))

    def put_analysis(self, document: dict) -> None:
        with self.connect() as db:
            db.execute(
                "INSERT INTO analyses VALUES (?, ?, ?)",
                (
                    document["id"],
                    document["dataset_id"],
                    json.dumps(document, allow_nan=False),
                ),
            )

    def list_analyses(self, dataset_id: str) -> list[dict]:
        with self.connect() as db:
            rows = db.execute(
                "SELECT document FROM analyses WHERE dataset_id=? ORDER BY rowid DESC LIMIT 20",
                (dataset_id,),
            ).fetchall()
        return [json.loads(row[0]) for row in rows]

    def put_run(self, document: dict, key: str) -> dict:
        with self.connect() as db:
            db.execute(
                "INSERT OR IGNORE INTO agent_runs VALUES (?, ?, ?, ?)",
                (
                    document["id"],
                    document["dataset_id"],
                    key,
                    json.dumps(document, allow_nan=False),
                ),
            )
            row = db.execute(
                "SELECT document FROM agent_runs WHERE dataset_id=? AND idempotency_key=?",
                (document["dataset_id"], key),
            ).fetchone()
        return json.loads(row[0])

    def get_run(self, run_id: str) -> dict | None:
        with self.connect() as db:
            row = db.execute("SELECT document FROM agent_runs WHERE id=?", (run_id,)).fetchone()
        return json.loads(row[0]) if row else None

    def list_runs(self, dataset_id: str) -> list[dict]:
        with self.connect() as db:
            rows = db.execute(
                "SELECT document FROM agent_runs WHERE dataset_id=? ORDER BY rowid DESC LIMIT 20",
                (dataset_id,),
            ).fetchall()
        return [json.loads(row[0]) for row in rows]

    def update_run(self, run_id: str, patch: dict, event: str | None = None) -> dict | None:
        with self.connect() as db:
            db.execute("BEGIN IMMEDIATE")
            row = db.execute("SELECT document FROM agent_runs WHERE id=?", (run_id,)).fetchone()
            if not row:
                return None
            document = json.loads(row[0])
            if document["status"] in {
                "succeeded",
                "failed",
                "needs_input",
                "unsupported",
                "cancelled",
            }:
                return document
            document.update(patch)
            if event:
                document["events"].append({"seq": len(document["events"]) + 1, "stage": event})
            db.execute(
                "UPDATE agent_runs SET document=? WHERE id=?",
                (json.dumps(document, allow_nan=False), run_id),
            )
        return document

    def interrupt_runs(self) -> None:
        with self.connect() as db:
            rows = db.execute("SELECT id, document FROM agent_runs").fetchall()
            for run_id, raw in rows:
                document = json.loads(raw)
                if document["status"] in {"queued", "running"}:
                    document.update(
                        status="failed",
                        stage="interrupted",
                        error={
                            "code": "INTERRUPTED",
                            "message": "Server qayta ishga tushgan. Savolni qayta yuboring.",
                        },
                    )
                    document["events"].append(
                        {"seq": len(document["events"]) + 1, "stage": "interrupted"}
                    )
                    db.execute(
                        "UPDATE agent_runs SET document=? WHERE id=?",
                        (json.dumps(document), run_id),
                    )
