from datetime import datetime

import pandas as pd
import pytest

from app.analysis.engine import agent_schema, analyze, date_format_hint, profile
from app.analysis.reader import read_frame
from app.errors import AppError
from app.schemas import AnalysisRequest


def run(frame, **kwargs):
    return analyze(frame, AnalysisRequest(**kwargs).model_dump())


@pytest.mark.parametrize(
    "operation,aggregation,expected",
    [
        ("group", "sum", [["B", 30.0], ["A", 10.0]]),
        ("group", "mean", [["B", 15.0], ["A", 10.0]]),
        ("group", "count", [["A", 2], ["B", 2]]),
    ],
)
def test_group_reference(operation, aggregation, expected):
    frame = pd.DataFrame({"category": ["A", "A", "B", "B"], "amount": [10, None, 10, 20]})
    result = run(
        frame,
        operation=operation,
        aggregation=aggregation,
        group_column="category",
        value_column="amount",
    )
    assert result["table"]["rows"] == expected


def test_statistics_missing_and_duplicates():
    frame = pd.DataFrame({"amount": [10, 20, 30, None], "name": ["A", "B", None, None]})
    overview = run(frame, operation="overview")
    assert overview["table"]["rows"] == [["amount", 3, 10, 30, 20, 20]]
    missing = run(frame, operation="missing")
    assert missing["table"]["rows"] == [["name", 2, 50], ["amount", 1, 25]]


def test_empty_numeric_group_is_null_not_zero():
    frame = pd.DataFrame({"category": ["A", "B"], "amount": [None, 5.0]})
    result = run(frame, operation="group", group_column="category", value_column="amount")
    assert result["table"]["rows"] == [["B", 5.0], ["A", None]]
    assert result["chart"]["values"] == [5.0, None]


def test_negative_values_and_missing_group_are_explicit():
    frame = pd.DataFrame({"category": ["A", None, "B"], "amount": [-20, 100, -5]})
    result = run(frame, operation="group", group_column="category", value_column="amount")
    assert result["table"]["rows"] == [["B", -5], ["A", -20]]
    assert any("1 qator" in warning for warning in result["warnings"])


def test_ambiguous_date_requires_format():
    frame = pd.DataFrame({"date": ["01/02/2026"], "value": [10]})
    with pytest.raises(AppError, match="Sana uchun"):
        run(frame, operation="monthly", group_column="date", value_column="value")
    result = run(
        frame,
        operation="monthly",
        group_column="date",
        value_column="value",
        date_format="%d/%m/%Y",
    )
    assert result["table"]["rows"] == [["2026-02", 10]]


def test_excel_native_dates_work():
    frame = pd.DataFrame({"date": [datetime(2026, 1, 1), datetime(2026, 2, 1)], "value": [10, 20]})
    result = run(frame, operation="monthly", group_column="date", value_column="value")
    assert result["table"]["rows"] == [["2026-01", 10], ["2026-02", 20]]


@pytest.mark.parametrize("values", [["2026-02-30"], [20260101], ["2026-01-01T12:00:00Z"]])
def test_invalid_numeric_or_zoned_dates_are_rejected(values):
    frame = pd.DataFrame({"date": values, "value": [10]})
    with pytest.raises(AppError):
        run(frame, operation="monthly", group_column="date", value_column="value")


@pytest.mark.parametrize(
    "column,values,code",
    [
        ("missing", [1], "UNKNOWN_COLUMN"),
        ("value", ["abc"], "NOT_NUMERIC"),
        ("value", [float("inf")], "NON_FINITE"),
    ],
)
def test_bad_aggregation_inputs(column, values, code):
    frame = pd.DataFrame({"group": ["A"], "value": values})
    with pytest.raises(AppError) as error:
        run(frame, operation="group", group_column="group", value_column=column)
    assert error.value.code == code


def test_headers_and_identifiers_are_preserved(tmp_path):
    path = tmp_path / "sample.csv"
    path.write_text("id,amount,amount,\n001,2,3,hello\n002,,5,NA\n", encoding="utf-8")
    frame, metadata = read_frame(path, {}, {"max_rows": 100, "max_columns": 10})
    assert list(frame.columns) == ["id", "amount", "amount_2", "column_4"]
    assert frame["id"].tolist() == ["001", "002"]
    assert frame["column_4"].tolist() == ["hello", "NA"]
    assert metadata["warnings"]


@pytest.mark.parametrize(
    "content,limits,code",
    [
        ("a,b\n1,2\n3,4\n", {"max_rows": 1, "max_columns": 10}, "ROW_LIMIT"),
        ("a,b\n1,2\n", {"max_rows": 10, "max_columns": 1}, "COLUMN_LIMIT"),
    ],
)
def test_reader_limits(tmp_path, content, limits, code):
    path = tmp_path / "sample.csv"
    path.write_text(content)
    with pytest.raises(AppError) as error:
        read_frame(path, {}, limits)
    assert error.value.code == code


def test_top_chart_and_table_report_truncation():
    frame = pd.DataFrame({"category": [str(i) for i in range(110)], "amount": list(range(110))})
    result = run(frame, operation="group", group_column="category", value_column="amount")
    assert result["table"]["total_rows"] == 110
    assert result["table"]["truncated"] is True
    assert len(result["table"]["rows"]) == 100
    assert result["chart"]["shown"] == 24
    assert result["chart"]["total"] == 110


def test_integer_sum_cannot_silently_wrap_or_lose_browser_precision():
    frame = pd.DataFrame({"category": ["A"] * 2000, "amount": [2**53 - 1] * 2000})
    with pytest.raises(AppError) as error:
        run(frame, operation="group", group_column="category", value_column="amount")
    assert error.value.code == "NUMERIC_PRECISION"


@pytest.mark.parametrize("aggregation,expected", [("sum", 30), ("mean", 15), ("count", 2)])
def test_filtered_company_metric(aggregation, expected):
    frame = pd.DataFrame({"city": ["Toshkent", "Toshkent", "Buxoro"], "amount": [10, 20, 500]})
    result = run(
        frame,
        operation="metric",
        value_column="amount",
        aggregation=aggregation,
        filters=[{"column": "city", "operator": "eq", "value": "Toshkent"}],
    )
    assert result["table"]["rows"] == [[aggregation, expected]]
    assert "3 qatordan 2" in result["warnings"][0]


def test_top_n_after_aggregation():
    frame = pd.DataFrame({"city": ["A", "B", "C", "A"], "amount": [15, 25, 10, 15]})
    result = run(frame, operation="group", group_column="city", value_column="amount", top_n=2)
    assert result["table"]["rows"] == [["A", 30], ["B", 25]]
    bottom = run(
        frame,
        operation="group",
        group_column="city",
        value_column="amount",
        top_n=1,
        ascending=True,
    )
    assert bottom["table"]["rows"] == [["C", 10]]


def test_date_range_filter_and_empty_match():
    frame = pd.DataFrame(
        {"date": ["2026-01-01", "2026-02-01", "2026-03-01"], "amount": [10, 20, 30]}
    )
    result = run(
        frame,
        operation="metric",
        value_column="amount",
        filters=[
            {"column": "date", "operator": "gte", "value": "2026-02-01"},
            {"column": "date", "operator": "lt", "value": "2026-03-01"},
        ],
    )
    assert result["table"]["rows"] == [["sum", 20]]
    with pytest.raises(AppError) as error:
        run(
            frame,
            operation="metric",
            value_column="amount",
            filters=[{"column": "amount", "operator": "gt", "value": 100}],
        )
    assert error.value.code == "NO_DATA"


def test_missing_values_are_not_matched_by_not_equal():
    frame = pd.DataFrame({"city": ["A", None, "B"], "amount": [10, 20, 30]})
    result = run(
        frame,
        operation="metric",
        value_column="amount",
        filters=[{"column": "city", "operator": "ne", "value": "A"}],
    )
    assert result["table"]["rows"] == [["sum", 30]]


def test_demo_company_metric_reference():
    from app.config import PROJECT_ROOT

    frame, _ = read_frame(
        PROJECT_ROOT / "examples/sales.csv", {}, {"max_rows": 100000, "max_columns": 100}
    )
    result = run(
        frame,
        operation="metric",
        value_column="amount",
        filters=[{"column": "city", "operator": "eq", "value": "Toshkent"}],
    )
    assert result["table"]["rows"] == [["sum", 3280000]]


@pytest.mark.parametrize(
    "values,expected",
    [
        (["2026-01-01", "2026-02-28", None], "ISO8601"),
        (["2026-01-01", "01/02/2026"], None),
        (["2026-02-30", "2026-01-01"], None),
        (["2026-01-01T12:00:00", "2026-02-01"], None),
    ],
)
def test_date_hint_requires_every_value_to_match(values, expected):
    assert date_format_hint(pd.Series(values, dtype="object")) == expected


def test_agent_schema_only_sends_validated_format_metadata():
    frame = pd.DataFrame(
        {"order_date": ["2026-01-01", "2026-02-01"], "customer": ["Aziza", "Bobur"]}
    )
    dataset_profile = profile(frame, {"warnings": []})
    columns = agent_schema(dataset_profile)
    assert columns[0]["date_format_hint"] == "ISO8601"
    assert "date_format_hint" not in columns[1]
    assert "Aziza" not in str(columns)
    assert "2026-01-01" not in str(columns)


def test_monthly_result_discloses_chosen_date_format():
    frame = pd.DataFrame({"date": ["2026-01-01"], "value": [10]})
    result = run(frame, operation="monthly", group_column="date", value_column="value")
    assert "Sana YYYY-MM-DD formatida talqin qilindi." in result["warnings"]
