import os
import shutil

import pytest

from app.agent.sandbox import Sandbox
from app.config import PROJECT_ROOT
from app.errors import AppError
from app.schemas import AnalysisRequest

pytestmark = pytest.mark.skipif(
    shutil.which("bwrap") is None, reason="Bubblewrap required for namespace tests"
)
PLAN = AnalysisRequest(operation="overview").model_dump()


def execute(settings, code, timeout=10):
    return Sandbox(settings).run(PROJECT_ROOT / "examples/sales.csv", {}, PLAN, code, timeout)


def test_namespace_hides_host_and_environment(settings, tmp_path, monkeypatch):
    sentinel = tmp_path / "host-secret.txt"
    sentinel.write_text("only-test-secret")
    monkeypatch.setenv("SANDBOX_TEST_SECRET", "not-visible")
    # Bypass AST checks deliberately: test the OS boundary itself.
    code = f"import os\nresult = pd.DataFrame({{'uid':[os.getuid()], 'host_file':[os.path.exists({str(sentinel)!r})], 'credential':['SANDBOX_TEST_SECRET' in os.environ], 'other_uploads':[os.path.exists('/mnt/d/github project/.data')]}})"
    assert execute(settings, code)["rows"] == [[65534, False, False, False]]


def test_network_namespace_is_distinct(settings):
    parent = os.readlink("/proc/self/ns/net")
    table = execute(
        settings, "import os\nresult = pd.DataFrame({'net':[os.readlink('/proc/self/ns/net')]})"
    )
    assert table["rows"][0][0] != parent


def test_child_process_creation_is_blocked(settings):
    table = execute(
        settings,
        "import os\nblocked = False\ntry:\n    os.fork()\nexcept OSError:\n    blocked = True\nresult = pd.DataFrame({'blocked':[blocked]})",
    )
    assert table["rows"] == [[True]]


def test_timeout_stops_code(settings):
    with pytest.raises(AppError) as error:
        execute(settings, "while True: pass", 1)
    assert error.value.code in {"SANDBOX_TIMEOUT", "SANDBOX_FAILED"}


def test_output_limit_stops_code(settings):
    with pytest.raises(AppError) as error:
        execute(settings, "import os\nfor i in range(1000):\n    os.write(1, b'x' * 10000)")
    assert error.value.code == "SANDBOX_OUTPUT"
