from app.config import PROJECT_ROOT, Settings


def test_relative_data_dir_is_stable_across_working_directories(monkeypatch, tmp_path):
    monkeypatch.setenv("ANALYST_DATA_DIR", ".data")
    monkeypatch.chdir(tmp_path)

    assert Settings.from_env().data_dir == PROJECT_ROOT / ".data"


def test_railway_public_domain_becomes_https_origin(monkeypatch):
    monkeypatch.delenv("ANALYST_PUBLIC_ORIGIN", raising=False)
    monkeypatch.setenv("RAILWAY_PUBLIC_DOMAIN", "tahlilchi-ai.up.railway.app")

    settings = Settings.from_env()

    assert settings.public_origin == "https://tahlilchi-ai.up.railway.app"
    assert settings.allowed_hosts == ["tahlilchi-ai.up.railway.app"]


def test_explicit_public_origin_overrides_railway_domain(monkeypatch):
    monkeypatch.setenv("ANALYST_PUBLIC_ORIGIN", "https://tahlilchi-ai.com/")
    monkeypatch.setenv("RAILWAY_PUBLIC_DOMAIN", "tahlilchi-ai.up.railway.app")

    assert Settings.from_env().public_origin == "https://tahlilchi-ai.com"
