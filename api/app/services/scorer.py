"""Mock scoring service. Swap for Modal-backed impl in Phase 3."""

from datetime import datetime, timedelta, timezone
from hashlib import blake2b

from app.models.schemas import FeatureContribution, WalletScore


def _deterministic_float(address: str, salt: str) -> float:
    """Hash-based deterministic float in [0, 1) for stable mock outputs."""
    h = blake2b(f"{address}:{salt}".encode(), digest_size=8).digest()
    return int.from_bytes(h, "big") / 2**64


def score_wallet(address: str) -> WalletScore:
    """Return a fake but stable score for a wallet address.

    Replace the body of this function with a Modal function call once the real
    inference endpoint is wired up (see ml/modal_app.py).
    """
    score = _deterministic_float(address, "risk")
    conf = 0.6 + _deterministic_float(address, "conf") * 0.4

    if score >= 0.85:
        label = "phishing"
    elif score >= 0.7:
        label = "bot_activity"
    elif score >= 0.55:
        label = "mixer_usage"
    elif score >= 0.3:
        label = "unknown"
    else:
        label = "legitimate"

    top_features = [
        FeatureContribution(
            feature="fan_out_ratio",
            value=round(20 * _deterministic_float(address, "fo"), 2),
            shap_contribution=round(score * 0.4, 3),
        ),
        FeatureContribution(
            feature="tornado_tx_count",
            value=round(5 * _deterministic_float(address, "to"), 0),
            shap_contribution=round(score * 0.25, 3),
        ),
        FeatureContribution(
            feature="tx_frequency",
            value=round(500 * _deterministic_float(address, "tf"), 0),
            shap_contribution=round(score * 0.15, 3),
        ),
    ]

    now = datetime.now(timezone.utc)
    return WalletScore(
        address=address,
        label=label,
        risk_score=round(score, 3),
        confidence=round(conf, 3),
        last_active=now - timedelta(hours=int(24 * _deterministic_float(address, "la"))),
        top_features=top_features,
        scored_at=now,
        model_version="mock-v0.0.1",
    )
