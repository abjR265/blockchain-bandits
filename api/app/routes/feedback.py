from uuid import UUID

from fastapi import APIRouter, HTTPException

from app.models.schemas import FeedbackPayload, FeedbackResponse
from app.services.persistence import get_supabase

router = APIRouter(prefix="/feedback")


@router.post("", response_model=FeedbackResponse)
def submit(payload: FeedbackPayload) -> FeedbackResponse:
    """Persist analyst feedback to Supabase when configured."""
    try:
        UUID(payload.prediction_id)
    except ValueError as e:
        raise HTTPException(status_code=422, detail="prediction_id must be a UUID") from e

    client = get_supabase()
    if client is None:
        return FeedbackResponse(ok=True)

    row = {
        "prediction_id": payload.prediction_id,
        "verdict": payload.verdict,
        "correct_label": payload.correct_label,
        "note": payload.note,
    }
    client.table("feedback").insert(row).execute()
    return FeedbackResponse(ok=True)
