import json
import os
import subprocess
import sys
from pathlib import Path
from threading import BoundedSemaphore

from app.config import Settings
from app.errors import AppError


class AnalysisRunner:
    """Runs only our fixed functions. Never accepts source code or shell commands."""

    def __init__(self, settings: Settings):
        self.settings = settings
        self.slots = BoundedSemaphore(settings.max_parallel_jobs)

    def run(self, path: Path, options: dict, request: dict | None = None) -> dict:
        if os.name != "posix":
            raise AppError(
                "PLATFORM", "Bu versiyani Linux, WSL yoki Docker orqali ishga tushiring.", 503
            )
        if not self.slots.acquire(blocking=False):
            raise AppError(
                "BUSY",
                "Hozir boshqa fayllar qayta ishlanmoqda. Birozdan keyin urinib ko‘ring.",
                429,
            )
        payload = {
            "path": str(path),
            "options": options,
            "action": "analyze" if request is not None else "profile",
            "request": request,
            "timeout": self.settings.job_timeout,
            "limits": {
                "max_rows": self.settings.max_rows,
                "max_columns": self.settings.max_columns,
            },
        }
        env = {
            "PATH": os.defpath,
            "LANG": "C.UTF-8",
            "PYTHONIOENCODING": "utf-8",
            "OPENBLAS_NUM_THREADS": "1",
            "OMP_NUM_THREADS": "1",
            "MKL_NUM_THREADS": "1",
        }
        try:
            result = subprocess.run(
                [sys.executable, "-m", "app.analysis.worker"],
                input=json.dumps(payload),
                capture_output=True,
                text=True,
                env=env,
                cwd=Path(__file__).resolve().parents[2],
                timeout=self.settings.job_timeout,
            )
            if result.returncode != 0:
                raise AppError(
                    "WORKER_STOPPED", "Hisoblash jarayoni to‘xtadi yoki resurs limitiga yetdi."
                )
            response = json.loads(result.stdout)
            if not response["ok"]:
                raise AppError(response["code"], response["message"])
            return response["result"]
        except subprocess.TimeoutExpired as exc:
            raise AppError(
                "TIMEOUT", "Hisoblash vaqti tugadi. Kichikroq fayl bilan urinib ko‘ring.", 408
            ) from exc
        except (json.JSONDecodeError, KeyError) as exc:
            raise AppError("WORKER_PROTOCOL", "Hisoblashdan yaroqli javob kelmadi.", 500) from exc
        finally:
            self.slots.release()
