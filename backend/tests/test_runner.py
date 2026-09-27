import subprocess
from pathlib import Path

import pytest

from app.analysis.runner import AnalysisRunner
from app.errors import AppError


def test_timeout_releases_capacity(settings, monkeypatch):
    runner = AnalysisRunner(settings)

    def timeout(*args, **kwargs):
        raise subprocess.TimeoutExpired("trusted-worker", 1)

    monkeypatch.setattr(subprocess, "run", timeout)
    for _ in range(3):
        with pytest.raises(AppError) as error:
            runner.run(Path("unused.csv"), {})
        assert error.value.code == "TIMEOUT"


def test_busy_rejects_instead_of_spawning(settings):
    runner = AnalysisRunner(settings)
    for _ in range(settings.max_parallel_jobs):
        runner.slots.acquire()
    with pytest.raises(AppError) as error:
        runner.run(Path("unused.csv"), {})
    assert error.value.status == 429
