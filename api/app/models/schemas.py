"""Pydantic request/response schemas.

Keep in sync with web/lib/types.ts.
"""

from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field

RiskLabel = Literal[
    "legitimate",
    "phishing",
    "mixer_usage",
    "bot_activity",
    "sanctioned",
    "unknown",
]

JobStatus = Literal["queued", "running", "complete", "failed"]


class FeatureContribution(BaseModel):
    feature: str
    value: float | str
    shap_contribution: float


class WalletScore(BaseModel):
    address: str
    label: RiskLabel
    risk_score: float = Field(ge=0.0, le=1.0)
    confidence: float = Field(ge=0.0, le=1.0)
    last_active: datetime
    top_features: list[FeatureContribution]
    scored_at: datetime
    model_version: str


class DashboardStats(BaseModel):
    wallets_scanned: int
    flagged_today: int
    avg_risk_score: float


class AnalysisRequest(BaseModel):
    address: str = Field(min_length=42, max_length=42, pattern=r"^0x[a-fA-F0-9]{40}$")


class AnalysisJob(BaseModel):
    job_id: str
    status: JobStatus
    address: str
    submitted_at: datetime
    result: WalletScore | None = None


class FeedbackPayload(BaseModel):
    prediction_id: str
    verdict: Literal["correct", "incorrect"]
    correct_label: RiskLabel | None = None
    note: str | None = None


class FeedbackResponse(BaseModel):
    ok: bool = True


class Health(BaseModel):
    status: Literal["ok"] = "ok"
    environment: str
    version: str = "0.1.0"
