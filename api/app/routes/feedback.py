from fastapi import APIRouter

from app.models.schemas import FeedbackPayload, FeedbackResponse

router = APIRouter(prefix="/feedback")


@router.post("", response_model=FeedbackResponse)
def submit(payload: FeedbackPayload) -> FeedbackResponse:
    """Persist analyst feedback.

    Week 5: replace with Supabase insert into `feedback` table. For now just
    logs and returns ok=True so the UI thumbs up/down works end-to-end.
    """
    # TODO: supabase client -> feedback table
    print(f"[feedback] {payload.model_dump()}")
    return FeedbackResponse(ok=True)
