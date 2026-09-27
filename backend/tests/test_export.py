import csv
import io
from uuid import uuid4

from conftest import authenticate

from app.export import render_preview_csv


def parse_csv(payload: bytes) -> list[list[str]]:
    return list(csv.reader(io.StringIO(payload.decode("utf-8-sig"))))


def test_spreadsheet_formulas_are_neutralized_without_changing_numbers():
    payload = render_preview_csv(
        {
            "columns": ["=FORMULA()", "value"],
            "rows": [
                ["=1+1", -7],
                [" \t@cmd", None],
                ["\ufeff+SUM(1,1)", True],
                ["safe,with\nnewline", 3.5],
                ["-looks-like-text", False],
            ],
        }
    )
    assert payload.startswith(b"\xef\xbb\xbf")
    assert parse_csv(payload) == [
        ["'=FORMULA()", "value"],
        ["'=1+1", "-7"],
        ["' \t@cmd", ""],
        ["'\ufeff+SUM(1,1)", "TRUE"],
        ["safe,with\nnewline", "3.5"],
        ["'-looks-like-text", "FALSE"],
    ]


def test_csv_export_is_limited_to_owned_saved_analysis(client):
    dataset = client.post(
        "/api/v1/datasets", files={"file": ("sales.csv", b"city,amount\nA,10\nB,20\n")}
    ).json()
    analysis = client.post(
        f"/api/v1/datasets/{dataset['id']}/analyses",
        json={"operation": "group", "group_column": "city", "value_column": "amount"},
    ).json()
    url = f"/api/v1/datasets/{dataset['id']}/analyses/{analysis['id']}/export.csv"
    response = client.get(url)
    assert response.status_code == 200
    assert response.headers["content-type"].startswith("text/csv")
    assert response.headers["content-disposition"].endswith(
        f'analysis-{analysis["id"]}-preview.csv"'
    )
    assert response.headers["x-export-truncated"] == "false"
    assert parse_csv(response.content) == [["group", "value"], ["B", "20"], ["A", "10"]]
    assert client.get(url.replace(dataset["id"], str(uuid4()))).status_code == 404
    assert client.get(url.replace(analysis["id"], str(uuid4()))).status_code == 404

    client.post(
        "/api/v1/auth/users",
        json={"username": "another", "password": "another-password-123"},
    )
    authenticate(client, username="another", password="another-password-123")
    assert client.get(url).status_code == 404
    client.cookies.clear()
    assert client.get(url).status_code == 401


def test_csv_export_advertises_displayed_row_limit(client):
    content = "city,amount\n" + "".join(f"city-{index},1\n" for index in range(105))
    dataset = client.post("/api/v1/datasets", files={"file": ("many.csv", content.encode())}).json()
    analysis = client.post(
        f"/api/v1/datasets/{dataset['id']}/analyses",
        json={"operation": "group", "group_column": "city", "value_column": "amount"},
    ).json()
    response = client.get(f"/api/v1/datasets/{dataset['id']}/analyses/{analysis['id']}/export.csv")
    assert response.status_code == 200
    assert response.headers["x-export-truncated"] == "true"
    assert len(parse_csv(response.content)) == 101
