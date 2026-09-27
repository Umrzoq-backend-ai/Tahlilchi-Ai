"""Independent, hand-calculated business references for the supported operations."""

import json

import pytest
from scripts.evaluate_business import effective_plan

from app.analysis.engine import analyze, profile
from app.analysis.reader import read_frame
from app.config import PROJECT_ROOT
from app.errors import AppError
from app.schemas import AnalysisRequest

CASES = json.loads((PROJECT_ROOT / "evaluation/cases.json").read_text(encoding="utf-8"))["cases"]


def test_reference_catalog_has_distinct_business_examples():
    assert len(CASES) >= 10
    assert len({case["id"] for case in CASES}) == len(CASES)
    assert len({case["csv"] for case in CASES}) == len(CASES)
    assert all(case["question"] for case in CASES)


@pytest.mark.parametrize(
    "case", [case for case in CASES if "request" in case], ids=lambda case: case["id"]
)
def test_business_reference(case, tmp_path):
    path = tmp_path / f"{case['id']}.csv"
    path.write_text(case["csv"], encoding="utf-8")
    frame, metadata = read_frame(path, {}, {"max_rows": 100_000, "max_columns": 100})
    actual_profile = profile(frame, metadata)
    for key, expected in case.get("expected_profile", {}).items():
        assert actual_profile[key] == expected

    request = AnalysisRequest.model_validate(case["request"]).model_dump()
    if "expected_error" in case:
        with pytest.raises(AppError) as error:
            analyze(frame, request)
        assert error.value.code == case["expected_error"]
        return

    result = analyze(frame, request)
    assert result["table"]["columns"] == case["expected_columns"]
    assert result["table"]["rows"] == case["expected_rows"]
    assert result["table"]["total_rows"] == len(case["expected_rows"])


def test_planner_evaluation_ignores_unused_missing_aggregation():
    default = AnalysisRequest(operation="missing")
    irrelevant = AnalysisRequest(operation="missing", aggregation="count")
    assert effective_plan(default) == effective_plan(irrelevant)


def test_planner_evaluation_detects_result_changing_settings():
    revenue = AnalysisRequest(operation="group", group_column="city", value_column="amount")
    average = AnalysisRequest(
        operation="group", group_column="city", value_column="amount", aggregation="mean"
    )
    assert effective_plan(revenue) != effective_plan(average)

    start = AnalysisRequest(
        operation="metric",
        value_column="amount",
        filters=[{"column": "order_date", "operator": "gte", "value": "2026-01-01"}],
    )
    different_format = start.model_copy(update={"date_format": "%d/%m/%Y"})
    assert effective_plan(start) != effective_plan(different_format)
