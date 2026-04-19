"""In-memory job store.

Week 1: in-process dict. Good enough for local dev and single-instance Fly.io.
Week 6+: swap for Upstash Redis / Supabase table for persistence and multi-instance.
"""

import uuid
from datetime import UTC, datetime

from app.models.schemas import AnalysisJob
from app.scoring_errors import ScoringError
from app.services.persistence import persist_prediction
from app.services.scorer import score_wallet

_JOBS: dict[str, AnalysisJob] = {}


def create_job(address: str) -> AnalysisJob:
    job_id = str(uuid.uuid4())
    job = AnalysisJob(
        job_id=job_id,
        status="queued",
        address=address,
        submitted_at=datetime.now(UTC),
    )
    _JOBS[job_id] = job
    return job


def run_job(job_id: str) -> AnalysisJob:
    """Run scoring synchronously; persist prediction when Supabase is configured."""
    job = _JOBS.get(job_id)
    if job is None:
        raise KeyError(job_id)
    job.status = "running"
    try:
        result = score_wallet(job.address)
    except ScoringError as e:
        job.status = "failed"
        job.error = str(e)
        job.result = None
        _JOBS[job_id] = job
        return job
    except Exception as e:  # noqa: BLE001 — surface as failed job instead of HTTP 500
        job.status = "failed"
        job.error = f"{type(e).__name__}: {e}"
        job.result = None
        _JOBS[job_id] = job
        return job
    try:
        pid = persist_prediction(result)
    except Exception:  # noqa: BLE001 — scoring succeeded; Supabase is optional
        pid = None
    if pid:
        result = result.model_copy(update={"prediction_id": pid})
    job.result = result
    job.status = "complete"
    job.error = None
    _JOBS[job_id] = job
    return job


def get_job(job_id: str) -> AnalysisJob | None:
    return _JOBS.get(job_id)
