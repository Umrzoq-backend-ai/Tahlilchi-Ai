"""One-shot trusted parser/analysis process; this is NOT a generated-code sandbox."""

import json
import sys
from pathlib import Path


def main() -> None:
    payload = json.load(sys.stdin)
    # Apply Linux/WSL resource limits before loading pandas/NumPy.
    import resource

    memory = 1536 * 1024 * 1024
    resource.setrlimit(resource.RLIMIT_AS, (memory, memory))
    resource.setrlimit(resource.RLIMIT_CPU, (payload["timeout"], payload["timeout"] + 1))
    resource.setrlimit(resource.RLIMIT_FSIZE, (1024 * 1024, 1024 * 1024))
    resource.setrlimit(resource.RLIMIT_CORE, (0, 0))

    from app.analysis.engine import analyze, profile
    from app.analysis.reader import read_frame
    from app.errors import AppError

    try:
        frame, metadata = read_frame(Path(payload["path"]), payload["options"], payload["limits"])
        if payload["action"] == "profile":
            result = profile(frame, metadata)
        else:
            result = analyze(frame, payload["request"])
        response = {"ok": True, "result": result}
    except AppError as exc:
        response = {"ok": False, "code": exc.code, "message": exc.message}
    except MemoryError:
        response = {
            "ok": False,
            "code": "MEMORY_LIMIT",
            "message": "Faylni qayta ishlash xotira limitidan oshdi.",
        }
    except Exception:
        response = {
            "ok": False,
            "code": "PROCESSING_FAILED",
            "message": "Faylni qayta ishlab bo‘lmadi. Format va qiymatlarni tekshiring.",
        }
    json.dump(response, sys.stdout, allow_nan=False)


if __name__ == "__main__":
    main()
