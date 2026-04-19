"""Supabase persistence for predictions (optional when credentials are set)."""

from __future__ import annotations

from supabase import Client, create_client

from app.config import get_settings
from app.models.schemas import WalletScore


def get_supabase() -> Client | None:
    settings = get_settings()
    if not settings.supabase_url or not settings.supabase_service_role_key:
        return None
    return create_client(settings.supabase_url, settings.supabase_service_role_key)


def persist_prediction(score: WalletScore) -> str | None:
    """Upsert wallet row, insert prediction, return prediction UUID string."""
    client = get_supabase()
    if client is None:
        return None

    addr = score.address.lower()
    client.table("wallets").upsert(
        {
            "address": addr,
            "last_seen_onchain": score.last_active.isoformat(),
        },
        on_conflict="address",
    ).execute()

    top_features = [f.model_dump() for f in score.top_features]
    ins = (
        client.table("predictions")
        .insert(
            {
                "address": addr,
                "label": score.label,
                "risk_score": score.risk_score,
                "confidence": score.confidence,
                "top_features": top_features,
                "model_version": score.model_version,
                "scored_at": score.scored_at.isoformat(),
            }
        )
        .execute()
    )
    rows = getattr(ins, "data", None) or []
    if not rows:
        return None
    pid = rows[0].get("id")
    return str(pid) if pid else None
