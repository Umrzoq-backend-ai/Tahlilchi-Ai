from io import BytesIO
from uuid import uuid4

from conftest import authenticate
from fastapi.testclient import TestClient
from openpyxl import Workbook

from app.config import PROJECT_ROOT, Settings
from app.main import create_app


def upload(
    client,
    content=b"date,category,amount\n2026-01-01,A,10\n2026-01-05,B,20\n2026-02-01,A,40\n",
    name="sales.csv",
):
    return client.post("/api/v1/datasets", files={"file": (name, content)})


def test_upload_analyze_persist_and_delete(client, settings):
    response = upload(client)
    assert response.status_code == 201, response.text
    dataset = response.json()
    dataset_id = dataset["id"]
    assert dataset["profile"]["row_count"] == 3
    assert dataset["profile"]["columns"][2]["kind"] == "number"
    assert client.get(f"/api/v1/datasets/{dataset_id}/preview").json()["rows"][0][2] == 10
    result = client.post(
        f"/api/v1/datasets/{dataset_id}/analyses",
        json={
            "operation": "monthly",
            "group_column": "date",
            "value_column": "amount",
        },
    )
    assert result.status_code == 201, result.text
    assert result.json()["result"]["table"]["rows"] == [["2026-01", 30], ["2026-02", 40]]
    assert result.json()["result"]["chart"]["values"] == [30, 40]
    assert result.json()["provenance"]["dataset_sha256"] == dataset["sha256"]
    with TestClient(create_app(settings)) as restarted:
        authenticate(restarted)
        assert restarted.get(f"/api/v1/datasets/{dataset_id}").status_code == 200
        assert len(restarted.get(f"/api/v1/datasets/{dataset_id}/analyses").json()) == 1
    assert client.delete(f"/api/v1/datasets/{dataset_id}").status_code == 204
    assert client.get(f"/api/v1/datasets/{dataset_id}").status_code == 404
    assert client.get(f"/api/v1/datasets/{dataset_id}/analyses").status_code == 404
    assert list((settings.data_dir / "uploads").iterdir()) == []
    assert client.app.state.service.store.list_analyses(dataset_id) == []


def test_demo_reference_monthly(client):
    response = upload(client, (PROJECT_ROOT / "examples" / "sales.csv").read_bytes())
    assert response.status_code == 201, response.text
    dataset = response.json()
    assert dataset["profile"]["missing_cells"] == 1
    response = client.post(
        f"/api/v1/datasets/{dataset['id']}/analyses",
        json={
            "operation": "monthly",
            "group_column": "order_date",
            "value_column": "amount",
        },
    )
    assert response.status_code == 201, response.text
    assert response.json()["result"]["table"]["rows"] == [
        ["2026-01", 1200000],
        ["2026-02", 1900000],
        ["2026-03", 3400000],
        ["2026-04", 700000],
        ["2026-05", 2070000],
        ["2026-06", 2850000],
    ]


def test_excel_sheet_versions(client):
    workbook = Workbook()
    workbook.active.title = "First"
    workbook.active.append(["name", "amount"])
    workbook.active.append(["A", 10])
    second = workbook.create_sheet("Second")
    second.append(["name", "amount"])
    second.append(["B", 42])
    buffer = BytesIO()
    workbook.save(buffer)
    response = upload(client, buffer.getvalue(), "book.xlsx")
    assert response.status_code == 201, response.text
    dataset = response.json()
    assert dataset["profile"]["sheets"] == ["First", "Second"]
    version = client.post(f"/api/v1/datasets/{dataset['id']}/versions", json={"sheet": "Second"})
    assert version.status_code == 201, version.text
    assert version.json()["id"] != dataset["id"]
    assert version.json()["profile"]["preview"]["rows"] == [["B", 42]]
    original = client.get(f"/api/v1/datasets/{dataset['id']}").json()
    assert original["profile"]["preview"]["rows"] == [["A", 10]]


def test_bad_files_are_cleaned_up(client, settings):
    cases = [
        (b"", "empty.csv", "EMPTY_FILE"),
        (b"x,y\n", "header.csv", "EMPTY_DATASET"),
        (b"hello", "bad.xlsx", "INVALID_XLSX"),
        (b"hi", "bad.exe", "UNSUPPORTED_FORMAT"),
        (b"\xff\xfe", "bad.csv", "ENCODING"),
        (b"a,b\n1,2,3\n", "bad.csv", "INCONSISTENT_COLUMNS"),
    ]
    for content, name, code in cases:
        response = upload(client, content, name)
        assert response.status_code in (415, 422), response.text
        assert response.json()["error"]["code"] == code
    assert client.get("/api/v1/datasets").json() == []
    assert list((settings.data_dir / "uploads").iterdir()) == []


def test_limits(tmp_path):
    with TestClient(create_app(Settings(data_dir=tmp_path, max_upload_bytes=15))) as client:
        authenticate(client)
        response = upload(client)
        assert response.status_code == 413
        assert list((tmp_path / "uploads").iterdir()) == []


def test_path_names_are_not_storage_paths(client, settings):
    response = upload(client, name="../../escape.csv")
    assert response.status_code == 201, response.text
    assert response.json()["name"] == "escape.csv"
    files = list((settings.data_dir / "uploads").iterdir())
    assert len(files) == 1
    assert files[0].name == f"{response.json()['id']}.csv"
    assert client.get("/_next/../.data/metadata.sqlite3").status_code == 404


def test_contracts_and_local_boundaries(client):
    assert client.get("/api/v1/health").json()["agent_enabled"] is False
    assert client.get("/").status_code == 200
    from app.config import PROJECT_ROOT

    javascript = next((PROJECT_ROOT / "frontend/out/_next/static").rglob("*.js"))
    path = "/_next/" + str(javascript.relative_to(PROJECT_ROOT / "frontend/out/_next"))
    assert client.get(path).status_code == 200
    assert client.get("/api/v1/demo.csv").status_code == 200
    assert client.get("/openapi.json").status_code == 200
    assert client.get(f"/api/v1/datasets/{uuid4()}").status_code == 404
    assert client.get("/api/v1/datasets/not-a-uuid").status_code == 422
    assert (
        client.get("/api/v1/health", headers={"Origin": "https://untrusted.example"}).status_code
        == 403
    )
    assert client.get("/api/v1/health", headers={"Host": "untrusted.example"}).status_code == 400
    dataset = upload(client).json()
    response = client.post(
        f"/api/v1/datasets/{dataset['id']}/analyses", json={"operation": "group"}
    )
    assert response.status_code == 422
    response = client.post(
        f"/api/v1/datasets/{dataset['id']}/analyses",
        json={"operation": "overview", "code": "print(1)"},
    )
    assert response.status_code == 422
