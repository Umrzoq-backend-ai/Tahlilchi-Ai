"""Executed only INSIDE the namespace sandbox. Never invoke with untrusted code on host."""

import json
import resource
import sys
from pathlib import Path


def main():
    payload = json.loads(Path("/input/job.json").read_text())
    memory = 1536 * 1024 * 1024
    resource.setrlimit(resource.RLIMIT_AS, (memory, memory))
    resource.setrlimit(resource.RLIMIT_CPU, (payload["timeout"], payload["timeout"] + 1))
    resource.setrlimit(resource.RLIMIT_FSIZE, (2 * 1024 * 1024, 2 * 1024 * 1024))
    resource.setrlimit(resource.RLIMIT_NOFILE, (64, 64))
    resource.setrlimit(resource.RLIMIT_CORE, (0, 0))
    import numpy as np
    import pandas as pd

    from app.analysis.engine import filter_frame
    from app.analysis.reader import read_frame, table

    frame, _ = read_frame(Path(payload["path"]), payload["options"], payload["limits"])
    frame = filter_frame(frame, payload["plan"])
    # pandas/NumPy are initialized with one thread before forbidding child processes.
    resource.setrlimit(resource.RLIMIT_NPROC, (1, 1))
    context = {"df": frame, "pd": pd, "np": np}
    try:
        exec(compile(payload["code"], "<agent>", "exec"), context)
        result = context.get("result")
        if not isinstance(result, pd.DataFrame):
            raise TypeError("result must be a DataFrame")
        if len(result.columns) > 100 or len(result) > 100000:
            raise ValueError("result too large")
        response = {"ok": True, "table": table(result)}
    except Exception as exc:
        # Never leak source data, exception messages or Python locals to the model.
        trace = exc.__traceback__
        line = None
        while trace:
            if trace.tb_frame.f_code.co_filename == "<agent>":
                line = trace.tb_lineno
            trace = trace.tb_next
        response = {"ok": False, "error_type": type(exc).__name__, "line": line}
    json.dump(response, sys.stdout, allow_nan=False)


if __name__ == "__main__":
    main()
