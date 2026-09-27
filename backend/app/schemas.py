from typing import Literal

from pydantic import BaseModel, ConfigDict, Field, StrictFloat, StrictInt, model_validator


class DataFilter(BaseModel):
    model_config = ConfigDict(extra="forbid", allow_inf_nan=False)
    column: str = Field(min_length=1, max_length=200)
    operator: Literal["eq", "ne", "gt", "gte", "lt", "lte"]
    value: str | StrictInt | StrictFloat


class AnalysisRequest(BaseModel):
    model_config = ConfigDict(extra="forbid", allow_inf_nan=False)

    operation: Literal["overview", "missing", "group", "monthly", "metric"]
    group_column: str | None = Field(default=None, max_length=200)
    value_column: str | None = Field(default=None, max_length=200)
    aggregation: Literal["sum", "mean", "count"] = "sum"
    date_format: Literal["ISO8601", "%d/%m/%Y", "%m/%d/%Y", "%d.%m.%Y"] = "ISO8601"
    filters: list[DataFilter] = Field(default_factory=list, max_length=5)
    top_n: int | None = Field(default=None, ge=1, le=100)
    ascending: bool = False

    @model_validator(mode="after")
    def check_columns(self) -> "AnalysisRequest":
        if self.operation in {"group", "monthly"}:
            if not self.group_column:
                raise ValueError("Guruhlash yoki sana ustunini tanlang.")
            if self.aggregation != "count" and not self.value_column:
                raise ValueError("Hisoblanadigan sonli ustunni tanlang.")
        if self.operation == "metric" and self.aggregation != "count" and not self.value_column:
            raise ValueError("Hisoblanadigan sonli ustunni tanlang.")
        if self.top_n is not None and self.operation not in {"group", "monthly"}:
            raise ValueError("Top-N faqat guruhli tahlil uchun ishlaydi.")
        return self
