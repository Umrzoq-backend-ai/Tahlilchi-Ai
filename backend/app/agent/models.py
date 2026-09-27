from typing import Literal

from pydantic import BaseModel, ConfigDict, Field, model_validator

from app.schemas import AnalysisRequest


class QuestionRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")
    question: str = Field(min_length=3, max_length=2000)
    idempotency_key: str = Field(min_length=8, max_length=64)
    clarification_for: str | None = Field(default=None, max_length=36)


class AgentPlan(BaseModel):
    model_config = ConfigDict(extra="forbid")
    action: Literal["analyze", "clarify", "unsupported"]
    analysis: AnalysisRequest | None
    explanation: str = Field(max_length=800)
    clarification: str | None = Field(max_length=500)

    @model_validator(mode="after")
    def check_action(self):
        if self.action == "analyze" and self.analysis is None:
            raise ValueError("analysis is required for analyze")
        if self.action != "analyze" and self.analysis is not None:
            raise ValueError("analysis must be null for non-analysis actions")
        if self.action == "clarify" and not self.clarification:
            raise ValueError("clarification is required")
        return self


class GeneratedCode(BaseModel):
    model_config = ConfigDict(extra="forbid")
    code: str = Field(min_length=1, max_length=12000)
