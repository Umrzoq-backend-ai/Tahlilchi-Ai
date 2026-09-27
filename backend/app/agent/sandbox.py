import json
import os
import selectors
import shutil
import signal
import subprocess
import sys
import sysconfig
import tempfile
import time
from pathlib import Path

from app.config import PROJECT_ROOT, Settings
from app.errors import AppError


def bounded_process(command: list[str], timeout: float, max_bytes: int = 1024 * 1024) -> bytes:
    """Bound BOTH pipes; kill the namespace supervisor on overflow/deadline."""
    process = subprocess.Popen(
        command,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        stdin=subprocess.DEVNULL,
        env={"PATH": os.defpath},
        start_new_session=True,
    )
    output = bytearray()
    total = 0
    deadline = time.monotonic() + timeout
    try:
        with selectors.DefaultSelector() as selector:
            selector.register(process.stdout, selectors.EVENT_READ, True)
            selector.register(process.stderr, selectors.EVENT_READ, False)
            while selector.get_map():
                remaining = deadline - time.monotonic()
                if remaining <= 0:
                    raise AppError("SANDBOX_TIMEOUT", "Ajratilgan hisoblash vaqti tugadi.", 408)
                for key, _ in selector.select(min(remaining, 0.2)):
                    chunk = os.read(key.fileobj.fileno(), 65536)
                    if not chunk:
                        selector.unregister(key.fileobj)
                        continue
                    total += len(chunk)
                    if total > max_bytes:
                        raise AppError(
                            "SANDBOX_OUTPUT", "Ajratilgan hisoblash chiqishi limitdan oshdi."
                        )
                    if key.data:
                        output.extend(chunk)
            process.wait(timeout=max(0.01, deadline - time.monotonic()))
        if process.returncode != 0:
            raise AppError(
                "SANDBOX_FAILED", "Izolyatsiya yoki resurs limiti hisoblashni to‘xtatdi.", 503
            )
        return bytes(output)
    except subprocess.TimeoutExpired as exc:
        raise AppError("SANDBOX_TIMEOUT", "Ajratilgan hisoblash vaqti tugadi.", 408) from exc
    finally:
        if process.poll() is None:
            os.killpg(process.pid, signal.SIGKILL)
        process.wait()
        process.stdout.close()
        process.stderr.close()


class Sandbox:
    """One dataset, read-only runtime, no host network, no host home or credentials.

    Fail closed: no host-exec fallback if namespaces/resource enforcement is unavailable.
    This local Linux boundary is not a substitute for a reviewed multi-tenant deployment.
    """

    def __init__(self, settings: Settings):
        self.settings = settings

    def command(self) -> list[str]:
        binary = shutil.which(self.settings.sandbox_binary)
        if os.name != "posix" or not binary:
            raise AppError(
                "SANDBOX_UNAVAILABLE", "Bubblewrap o‘rnatilmagan; AI kodini bajarish o‘chiq.", 503
            )
        command = [
            binary,
            "--unshare-all",
            "--unshare-user",
            "--die-with-parent",
            "--new-session",
            "--disable-userns",
            "--assert-userns-disabled",
            "--uid",
            "65534",
            "--gid",
            "65534",
            "--cap-drop",
            "ALL",
            "--clearenv",
        ]
        for source in ("/usr", "/lib", "/lib64"):
            if Path(source).exists():
                command += ["--ro-bind", source, source]
        command += [
            "--proc",
            "/proc",
            "--remount-ro",
            "/proc",
            "--dev",
            "/dev",
            "--size",
            str(32 * 1024 * 1024),
            "--tmpfs",
            "/tmp",
            "--ro-bind",
            sysconfig.get_path("purelib"),
            "/opt/python",
            "--ro-bind",
            str(PROJECT_ROOT / "backend" / "app"),
            "/opt/backend/app",
            "--chdir",
            "/tmp",
        ]
        environment = {
            "PYTHONPATH": "/opt/python:/opt/backend",
            "PYTHONNOUSERSITE": "1",
            "PYTHONDONTWRITEBYTECODE": "1",
            "OPENBLAS_NUM_THREADS": "1",
            "OMP_NUM_THREADS": "1",
            "MKL_NUM_THREADS": "1",
            "LANG": "C.UTF-8",
        }
        for key, value in environment.items():
            command += ["--setenv", key, value]
        return command

    def probe(self) -> None:
        output = bounded_process(
            self.command()
            + [
                str(Path(sys._base_executable).resolve()),
                "-c",
                "import os; assert os.getuid() == 65534; print('sandbox-ok')",
            ],
            5,
        )
        if output.strip() != b"sandbox-ok":
            raise AppError("SANDBOX_UNAVAILABLE", "Izolyatsiya tekshiruvi muvaffaqiyatsiz.", 503)

    def run(self, path: Path, options: dict, plan: dict, code: str, timeout: float) -> dict:
        with tempfile.TemporaryDirectory(prefix="analyst-job-") as folder:
            spec = Path(folder) / "job.json"
            target = "/input/dataset" + path.suffix
            spec.write_text(
                json.dumps(
                    {
                        "path": target,
                        "options": options,
                        "plan": plan,
                        "code": code,
                        "timeout": max(1, int(min(timeout, self.settings.job_timeout))),
                        "limits": {
                            "max_rows": self.settings.max_rows,
                            "max_columns": self.settings.max_columns,
                        },
                    },
                    allow_nan=False,
                )
            )
            command = self.command() + [
                "--ro-bind",
                str(path),
                target,
                "--ro-bind",
                str(spec),
                "/input/job.json",
                str(Path(sys._base_executable).resolve()),
                "-s",
                "-B",
                "-m",
                "app.agent.sandbox_runtime",
            ]
            try:
                output = json.loads(
                    bounded_process(command, min(timeout, self.settings.job_timeout))
                )
            except (ValueError, TypeError) as exc:
                raise AppError("SANDBOX_PROTOCOL", "Agentdan yaroqli natija kelmadi.") from exc
            if not isinstance(output, dict) or not isinstance(output.get("ok"), bool):
                raise AppError("SANDBOX_PROTOCOL", "Agentdan yaroqli natija kelmadi.")
            if not output["ok"]:
                error_type = str(output.get("error_type", "RuntimeError"))[:40]
                if not error_type.isidentifier():
                    error_type = "RuntimeError"
                line = output.get("line")
                raise AppError(
                    "CODE_RUNTIME", f"{error_type}, line {line if isinstance(line, int) else '?'}"
                )
            return output.get("table", {})
