import math

from app.errors import AppError


def validate_table(actual: dict, expected: dict) -> None:
    """Validate every displayed cell, dimensions and ordering against trusted execution."""

    def equal(left, right):
        if isinstance(left, bool) or isinstance(right, bool):
            return type(left) is type(right) and left == right
        if isinstance(left, (int, float)) and isinstance(right, (int, float)):
            return (
                math.isfinite(left)
                and math.isfinite(right)
                and math.isclose(left, right, rel_tol=1e-10, abs_tol=1e-8)
            )
        if isinstance(left, list) and isinstance(right, list):
            return len(left) == len(right) and all(equal(a, b) for a, b in zip(left, right))
        return type(left) is type(right) and left == right

    if (
        not isinstance(actual, dict)
        or set(actual) != set(expected)
        or not all(equal(actual[key], expected[key]) for key in expected)
    ):
        raise AppError("RESULT_MISMATCH", "Generated natija mustaqil hisoblash bilan mos kelmadi.")
