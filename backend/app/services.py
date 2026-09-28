import hashlib
import platform
from datetime import UTC, datetime
from pathlib import Path
from threading import RLock
from typing import BinaryIO
from uuid import uuid4

from app.analysis.engine import PROFILE_VERSION
from app.analysis.runner import AnalysisRunner
from app.config import Settings
from app.errors import AppError
from app.store import Store


def now() -> str:
    return datetime.now(UTC).isoformat()


class DatasetService:
    def __init__(self, settings: Settings):
        self.settings = settings
        self.store = Store(settings.data_dir)
        self.files = settings.data_dir / "uploads"
        self.files.mkdir(exist_ok=True, mode=0o700)
        self.runner = AnalysisRunner(settings)
        # Single local process: deletion cannot race analysis/history persistence.
        self.lock = RLock()

    def get(self, dataset_id: str, refresh_profile: bool = True) -> dict:
        with self.lock:
            dataset = self.store.get_dataset(dataset_id)
            if dataset is None:
                raise AppError("NOT_FOUND", "Dataset topilmadi yoki o‘chirilgan.", 404)
            if refresh_profile and dataset["profile"].get("profile_version", 0) < PROFILE_VERSION:
                # Existing uploads need the newer metadata too; preserve their IDs and history.
                dataset["profile"] = self.runner.run(
                    self.path_for(dataset), dataset["parsing_options"]
                )
                self.store.update_dataset_profile(dataset_id, dataset["profile"])
            return dataset

    def path_for(self, dataset: dict) -> Path:
        return self.files / f"{dataset['id']}{dataset['extension']}"

    def upload(
        self, stream: BinaryIO, filename: str, options: dict, owner_id: str | None = None
    ) -> dict:
        name = filename.replace("\\", "/").split("/")[-1][:200]
        extension = Path(name).suffix.lower()
        if extension not in {".csv", ".xlsx"}:
            raise AppError("UNSUPPORTED_FORMAT", "Faqat .csv yoki .xlsx fayl yuklang.", 415)
        dataset_id = str(uuid4())
        path = self.files / f"{dataset_id}{extension}"
        size, digest = 0, hashlib.sha256()
        try:
            with path.open("xb") as output:
                while chunk := stream.read(64 * 1024):
                    size += len(chunk)
                    if size > self.settings.max_upload_bytes:
                        raise AppError(
                            "FILE_TOO_LARGE", "Fayl hajmi ruxsat etilgan limitdan oshgan.", 413
                        )
                    digest.update(chunk)
                    output.write(chunk)
            if size == 0:
                raise AppError("EMPTY_FILE", "Yuklangan fayl bo‘sh.")
            profile = self.runner.run(path, options)
            options = {"sheet": profile["selected_sheet"], "delimiter": profile["delimiter"]}
            document = {
                "id": dataset_id,
                "owner_id": owner_id,
                "name": name,
                "extension": extension,
                "size_bytes": size,
                "sha256": digest.hexdigest(),
                "created_at": now(),
                "status": "ready",
                "parsing_options": options,
                "profile": profile,
            }
            self.store.put_dataset(document)
            return document
        except BaseException:
            path.unlink(missing_ok=True)
            raise

    def reparse(self, dataset_id: str, options: dict) -> dict:
        with self.lock:
            dataset = self.get(dataset_id, refresh_profile=False)
            with self.path_for(dataset).open("rb") as stream:
                return self.upload(stream, dataset["name"], options, dataset.get("owner_id"))

    def analyze(self, dataset_id: str, request: dict) -> dict:
        with self.lock:
            dataset = self.get(dataset_id, refresh_profile=False)
            result = self.runner.run(self.path_for(dataset), dataset["parsing_options"], request)
            document = {
                "id": str(uuid4()),
                "dataset_id": dataset_id,
                "created_at": now(),
                "status": "succeeded",
                "request": request,
                "result": result,
                "provenance": {
                    "dataset_sha256": dataset["sha256"],
                    "dataset_id": dataset_id,
                    "parsing_options": dataset["parsing_options"],
                    "engine": "trusted-pandas-v2",
                    "python": platform.python_version(),
                    "parameters": request,
                },
            }
            self.store.put_analysis(document)
            return document

    def delete(self, dataset_id: str) -> None:
        with self.lock:
            dataset = self.get(dataset_id, refresh_profile=False)
            self.path_for(dataset).unlink(missing_ok=True)
            self.store.delete_dataset(dataset_id)
