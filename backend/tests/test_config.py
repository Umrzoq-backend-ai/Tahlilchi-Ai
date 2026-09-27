from app.config import PROJECT_ROOT, Settings


def test_relative_data_dir_is_stable_across_working_directories(monkeypatch, tmp_path):
    monkeypatch.setenv("ANALYST_DATA_DIR", ".data")
    monkeypatch.chdir(tmp_path)

    assert Settings.from_env().data_dir == PROJECT_ROOT / ".data"
