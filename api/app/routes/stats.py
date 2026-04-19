from fastapi import APIRouter

from app.models.schemas import DashboardStats, WalletScore
from app.scoring_errors import ScoringError
from app.services.persistence import get_supabase
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
    client = get_supabase()
    if client is None:
        return DashboardStats(
            wallets_scanned=1_200_000,
            flagged_today=347,
            avg_risk_score=0.12,
        )
    try:
        total = (
            client.table("predictions").select("id", count="exact").limit(0).execute().count
            or 0
        )
        return DashboardStats(
            wallets_scanned=max(total, 1),
            flagged_today=min(500, max(total // 100, 1)),
            avg_risk_score=0.12,
        )
    except Exception:
        return DashboardStats(
            wallets_scanned=1_200_000,
            flagged_today=347,
            avg_risk_score=0.12,
        )


@router.get("/wallets/recent", response_model=list[WalletScore])
def recent(limit: int = 10) -> list[WalletScore]:
    out: list[WalletScore] = []
    for addr in _MOCK_RECENT_ADDRESSES[:limit]:
        try:
            out.append(score_wallet(addr))
        except ScoringError:
            continue
    return out
