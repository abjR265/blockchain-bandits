from fastapi import APIRouter

from app.config import get_settings
from app.models.schemas import Health

router = APIRouter()


@router.get("/health", response_model=Health)
def health() -> Health:
    return Health(status="ok", environment=get_settings().environment)
