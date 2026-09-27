import math
import operator
import re

import pandas as pd

from app.analysis.reader import json_value, table
from app.errors import AppError


def kind(series: pd.Series) -> str:
    if pd.api.types.is_bool_dtype(series):
        return "boolean"
    if pd.api.types.is_numeric_dtype(series):
        return "number"
    if pd.api.types.is_datetime64_any_dtype(series):
        return "date"
    return "text"


def numeric_values(series: pd.Series) -> pd.Series:
    if kind(series) != "number":
        raise AppError("NOT_NUMERIC", "Hisoblash uchun sonli ustunni tanlang.")
    valid = series.dropna()
    if not valid.map(math.isfinite).all():
        raise AppError("NON_FINITE", "Sonli ustunda cheksiz qiymatlar bor. Faylni tozalang.")
    return valid


def profile(frame: pd.DataFrame, metadata: dict) -> dict:
    columns = []
    warnings = list(metadata["warnings"])
    for name in frame.columns:
        series = frame[name]
        column = {
            "name": name,
            "kind": kind(series),
            "dtype": str(series.dtype),
            "missing": int(series.isna().sum()),
            "unique": int(series.nunique()),
        }
        if column["kind"] == "number":
            valid = series.dropna()
            if not valid.map(math.isfinite).all():
                warnings.append(
                    f"{name}: cheksiz qiymatlar mavjud; statistikani hisoblashdan oldin tozalang."
                )
            else:
                column["stats"] = {
                    key: json_value(value)
                    for key, value in {
                        "min": valid.min(),
                        "max": valid.max(),
                        "mean": valid.mean(),
                        "median": valid.median(),
                    }.items()
                }
        columns.append(column)
    return {
        **metadata,
        "warnings": warnings,
        "row_count": len(frame),
        "column_count": len(frame.columns),
        "missing_cells": int(frame.isna().sum().sum()),
        "duplicate_rows": int(frame.duplicated().sum()),
        "columns": columns,
        "preview": table(frame, limit=20),
    }


def filter_frame(frame: pd.DataFrame, request: dict) -> pd.DataFrame:
    filtered = frame
    operations = {
        "eq": operator.eq,
        "ne": operator.ne,
        "gt": operator.gt,
        "gte": operator.ge,
        "lt": operator.lt,
        "lte": operator.le,
    }
    for item in request.get("filters", []):
        column = item["column"]
        if column not in filtered.columns:
            raise AppError("UNKNOWN_COLUMN", "Filter ustuni datasetda yo‘q.")
        series, value = filtered[column], item["value"]
        try:
            if kind(series) == "number":
                if isinstance(value, (str, bool)) or not math.isfinite(value):
                    raise AppError("FILTER_TYPE", "Sonli ustun filteri son bo‘lishi kerak.")
            elif kind(series) == "date" or (
                isinstance(value, str)
                and re.fullmatch(r"\d{4}-\d{2}-\d{2}", value)
                and item["operator"] not in {"eq", "ne"}
            ):
                series = pd.to_datetime(series, format=request["date_format"], errors="raise")
                if series.dt.tz is not None:
                    raise ValueError("timezone")
                value = pd.to_datetime(value, format=request["date_format"], errors="raise")
            elif not isinstance(value, str) or item["operator"] not in {"eq", "ne"}:
                raise AppError(
                    "FILTER_TYPE", "Matn ustunida faqat aniq teng/teng emas filteri ishlaydi."
                )
            mask = operations[item["operator"]](series, value).fillna(False) & series.notna()
            filtered = filtered.loc[mask]
        except AppError:
            raise
        except (ValueError, TypeError, AttributeError) as exc:
            raise AppError(
                "FILTER_TYPE", "Filter qiymati ustun turi yoki sana formatiga mos emas."
            ) from exc
    if filtered.empty:
        raise AppError("NO_DATA", "Tanlangan filterlar bo‘yicha ma’lumot topilmadi.")
    return filtered


def analyze(frame: pd.DataFrame, request: dict) -> dict:
    original_rows = len(frame)
    frame = filter_frame(frame, request)
    operation = request["operation"]
    warnings = []
    chart = None
    if request.get("filters"):
        warnings.append(
            f"Filterdan keyin {original_rows} qatordan {len(frame)} qator qoldi; filterlar natija manbasida saqlangan."
        )
    if operation == "overview":
        stats = []
        for name in frame.select_dtypes(include="number").columns:
            valid = numeric_values(frame[name])
            stats.append(
                {
                    "ustun": name,
                    "soni": len(valid),
                    "minimum": valid.min(),
                    "maksimum": valid.max(),
                    "o‘rtacha": valid.mean(),
                    "mediana": valid.median(),
                }
            )
        result = pd.DataFrame(
            stats, columns=["ustun", "soni", "minimum", "maksimum", "o‘rtacha", "mediana"]
        )
        summary = f"Jadvalda {len(frame):,} qator, {len(frame.columns)} ustun va {len(stats)} sonli ustun bor."
        warnings.append("Bo‘sh qiymatlar statistikadan chiqarildi. Dublikatlar o‘chirilmagan.")
        if not stats:
            warnings.append("Sonli ustun topilmadi; raqam formatini tekshiring.")
    elif operation == "metric":
        aggregation = request["aggregation"]
        if aggregation == "count":
            value = len(frame)
        else:
            column = request["value_column"]
            if column not in frame.columns:
                raise AppError("UNKNOWN_COLUMN", "Sonli ustun datasetda yo‘q.")
            valid = numeric_values(frame[column])
            if valid.empty:
                value = None
            elif aggregation == "sum":
                value = sum(valid.tolist())
            else:
                value = valid.mean()
            warnings.append(
                f"Bo‘sh qiymati bor {int(frame[column].isna().sum())} qator hisobdan chiqarildi."
            )
            if value is not None and (not math.isfinite(value) or abs(value) > 2**53 - 1):
                raise AppError(
                    "NUMERIC_PRECISION", "Hisoblash natijasi aniqlik chegarasidan oshdi."
                )
        result = pd.DataFrame({"metric": [aggregation], "value": [value]})
        summary = (
            f"{aggregation}: {value:,.2f}."
            if value is not None
            else "Hisoblash uchun sonli qiymat yo‘q."
        )
    elif operation == "missing":
        result = pd.DataFrame(
            {
                "ustun": frame.columns,
                "bo‘sh": frame.isna().sum().values,
                "foiz": (frame.isna().mean().values * 100).round(2),
            }
        ).sort_values("bo‘sh", ascending=False, kind="stable")
        total = int(frame.isna().sum().sum())
        summary = f"Jami {total:,} ta bo‘sh katak topildi. Ma’lumotlar o‘zgartirilmadi."
        chart = make_chart(result, "ustun", "bo‘sh", "Ustunlar bo‘yicha bo‘sh qiymatlar")
    else:
        group, value = request["group_column"], request.get("value_column")
        aggregation = request["aggregation"]
        for column in (group, value if aggregation != "count" else None):
            if column is not None and column not in frame.columns:
                raise AppError("UNKNOWN_COLUMN", "Tanlangan ustun datasetda yo‘q.")
        if aggregation != "count":
            numeric_values(frame[value])
        keys = frame[group]
        if operation == "monthly":
            if kind(keys) in {"number", "boolean"}:
                raise AppError(
                    "INVALID_DATE",
                    "Sana ustuni son bo‘lmasligi kerak; haqiqiy sana ustunini tanlang.",
                )
            date_format = request["date_format"]
            if date_format == "ISO8601" and kind(keys) != "date":
                if (
                    not keys.dropna()
                    .astype(str)
                    .str.fullmatch(r"\d{4}-\d{2}-\d{2}(?:[ T].+)?")
                    .all()
                ):
                    raise AppError(
                        "AMBIGUOUS_DATE", "Sana uchun YYYY-MM-DD yoki mos sana formatini tanlang."
                    )
            try:
                dates = pd.to_datetime(keys, format=date_format, errors="raise")
                if dates.dt.tz is not None:
                    raise AppError(
                        "TIMEZONE",
                        "Vaqt zonali sanalar hozircha qo‘llanmaydi; lokal sanalardan foydalaning.",
                    )
                keys = dates.dt.to_period("M").astype("string")
            except AppError:
                raise
            except (ValueError, TypeError, AttributeError) as exc:
                raise AppError(
                    "INVALID_DATE", "Sana qiymatlari tanlangan formatga mos emas."
                ) from exc
        missing_groups = int(keys.isna().sum())
        if missing_groups:
            warnings.append(f"Guruh/sana qiymati bo‘sh {missing_groups} qator hisobdan chiqarildi.")
        work = pd.DataFrame({"group": keys})
        if aggregation == "count":
            result = work.groupby("group", sort=False).size().rename("value").reset_index()
        else:
            work["value"] = frame[value]
            if aggregation == "sum" and pd.api.types.is_integer_dtype(work["value"]):
                # Python integers avoid silent int64 wraparound during grouped sums.
                work["value"] = work["value"].astype(object)
            missing_values = int(work.loc[work["group"].notna(), "value"].isna().sum())
            if missing_values:
                warnings.append(
                    f"Hisoblanadigan ustunda {missing_values} bo‘sh qiymat o‘tkazib yuborildi."
                )
            grouped = work.groupby("group", sort=False)["value"]
            values = grouped.sum(min_count=1) if aggregation == "sum" else grouped.mean()
            if not values.dropna().map(math.isfinite).all():
                raise AppError("NUMERIC_OVERFLOW", "Hisoblash natijasi sonlar chegarasidan oshdi.")
            if (values.dropna().abs() > 2**53 - 1).any():
                raise AppError(
                    "NUMERIC_PRECISION",
                    "Natija brauzerda aniq ko‘rsatiladigan son chegarasidan oshdi. Kichikroq birlikdan foydalaning.",
                )
            result = values.reset_index()
        if result.empty:
            raise AppError("NO_DATA", "Tanlangan ustunlar bo‘yicha hisoblash uchun ma’lumot yo‘q.")
        if request.get("top_n"):
            result = result.sort_values(
                "value",
                ascending=request.get("ascending", False),
                na_position="last",
                kind="stable",
            ).head(request["top_n"])
            warnings.append(f"So‘ralgan top/bottom {request['top_n']} guruh ko‘rsatilmoqda.")
        elif operation == "monthly":
            result = result.sort_values("group", kind="stable")
            warnings.append("Jadvalda yo‘q oylar nol deb to‘ldirilmagan. Bu prognoz emas.")
        else:
            result = result.sort_values(
                "value",
                ascending=request.get("ascending", False),
                na_position="last",
                kind="stable",
            )
        labels = {"sum": "yig‘indi", "mean": "o‘rtacha", "count": "qatorlar soni"}
        summary = f"{len(result)} guruh bo‘yicha {labels[aggregation]} hisoblandi."
        populated = result.dropna(subset=["value"])
        if not populated.empty:
            best = populated.loc[populated["value"].idxmax()]
            summary += f" Eng yuqori qiymat: {best['group']} — {best['value']:,.2f}."
        else:
            warnings.append("Barcha guruhlarda hisoblanadigan qiymatlar bo‘sh; natijalar null.")
        chart = make_chart(result, "group", "value", f"{group} bo‘yicha {labels[aggregation]}")
        if len(result) > 100:
            warnings.append("Jadvalning dastlabki 100 qatori ko‘rsatilmoqda.")
    return {
        "summary": summary,
        "table": table(result),
        "chart": chart,
        "warnings": warnings,
        "engine": "trusted-pandas-v2",
    }


def make_chart(frame: pd.DataFrame, x: str, y: str, title: str) -> dict:
    subset = frame.head(24)
    return {
        "title": title,
        "type": "bar",
        "labels": [str(json_value(value)) for value in subset[x]],
        "values": [json_value(value) for value in subset[y]],
        "shown": len(subset),
        "total": len(frame),
    }
