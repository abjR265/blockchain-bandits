from fastapi import APIRouter

from app.models.schemas import DashboardStats, WalletScore
from app.services.scorer import score_wallet

router = APIRouter()

# Mock addresses used until we have a live Supabase-backed feed.
_MOCK_RECENT_ADDRESSES = [
    "0x3fc9a12e000000000000000000000000000000a1",
    "0xa8b277df000000000000000000000000000000a2",
    "0x11cc03ba000000000000000000000000000000a3",
    "0xf5e091ac000000000000000000000000000000a4",
]


@router.get("/stats", response_model=DashboardStats)
def stats() -> DashboardStats:
    return DashboardStats(
        wallets_scanned=1_200_000,
        flagged_today=347,
        avg_risk_score=0.12,
    )


@router.get("/wallets/recent", response_model=list[WalletScore])
def recent(limit: int = 10) -> list[WalletScore]:
    return [score_wallet(addr) for addr in _MOCK_RECENT_ADDRESSES[:limit]]
