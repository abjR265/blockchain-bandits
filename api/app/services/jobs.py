"""In-memory job store.

Week 1: in-process dict. Good enough for local dev and single-instance Fly.io.
Week 6+: swap for Upstash Redis / Supabase table for persistence and multi-instance.
"""

import uuid
from datetime import datetime, timezone

from app.models.schemas import AnalysisJob
from app.services.scorer import score_wallet

_JOBS: dict[str, AnalysisJob] = {}


def create_job(address: str) -> AnalysisJob:
    job_id = str(uuid.uuid4())
    job = AnalysisJob(
        job_id=job_id,
        status="queued",
        address=address,
        submitted_at=datetime.now(timezone.utc),
    )
    _JOBS[job_id] = job
    return job


def run_job(job_id: str) -> AnalysisJob:
    """Synchronous mock execution.

    Phase 3 replacement: enqueue onto Modal via `modal.Function.spawn()`,
    update status from the webhook / polling loop.
    """
    job = _JOBS.get(job_id)
    if job is None:
        raise KeyError(job_id)
    job.status = "running"
    job.result = score_wallet(job.address)
    job.status = "complete"
    _JOBS[job_id] = job
    return job


def get_job(job_id: str) -> AnalysisJob | None:
    return _JOBS.get(job_id)
