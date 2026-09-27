"""Bounded spreadsheet-safe CSV export of the displayed result table."""

import csv
import io
import unicodedata

from app.errors import AppError

MAX_EXPORT_BYTES = 20 * 1024 * 1024
DANGEROUS_PREFIXES = "=+-@"


def spreadsheet_cell(value) -> str:
    if value is None:
        return ""
    if isinstance(value, bool):
        return "TRUE" if value else "FALSE"
    if isinstance(value, (int, float)):
        return str(value)
    if not isinstance(value, str):
        raise AppError("EXPORT_INVALID", "Natija jadvalini CSVga aylantirib bo‘lmadi.", 422)
    for char in value:
        if char in DANGEROUS_PREFIXES:
            # Spreadsheet programs can execute a formula even inside a quoted CSV field.
            return "'" + value
        if char.isspace() or unicodedata.category(char) in {"Cc", "Cf"}:
            continue
        break
    return value


def render_preview_csv(table: dict) -> bytes:
    columns, rows = table.get("columns"), table.get("rows")
    if (
        not isinstance(columns, list)
        or not isinstance(rows, list)
        or len(columns) > 100
        or len(rows) > 100
        or any(not isinstance(row, list) or len(row) != len(columns) for row in rows)
    ):
        raise AppError("EXPORT_INVALID", "Natija jadvalini CSVga aylantirib bo‘lmadi.", 422)
    output = io.StringIO(newline="")
    writer = csv.writer(output, quoting=csv.QUOTE_ALL, lineterminator="\r\n")
    writer.writerow([spreadsheet_cell(column) for column in columns])
    for row in rows:
        writer.writerow([spreadsheet_cell(value) for value in row])
        if output.tell() > MAX_EXPORT_BYTES:
            raise AppError("EXPORT_TOO_LARGE", "CSV eksport hajmi limitdan oshdi.", 413)
    payload = b"\xef\xbb\xbf" + output.getvalue().encode("utf-8")
    if len(payload) > MAX_EXPORT_BYTES:
        raise AppError("EXPORT_TOO_LARGE", "CSV eksport hajmi limitdan oshdi.", 413)
    return payload
