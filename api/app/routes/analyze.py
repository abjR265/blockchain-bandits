from fastapi import APIRouter, HTTPException

from app.models.schemas import AnalysisJob, AnalysisRequest
from app.services import jobs

router = APIRouter(prefix="/analyze")


@router.post("", response_model=AnalysisJob)
def submit(request: AnalysisRequest) -> AnalysisJob:
    """Queue a wallet for scoring. Synchronous mock for now."""
    job = jobs.create_job(request.address.lower())
    # Phase 3: spawn on Modal asynchronously.
    return jobs.run_job(job.job_id)


@router.get("/{job_id}", response_model=AnalysisJob)
def status(job_id: str) -> AnalysisJob:
    job = jobs.get_job(job_id)
    if job is None:
        raise HTTPException(status_code=404, detail="Job not found")
    return job
