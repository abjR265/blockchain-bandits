"""Wallet scoring: live features → XGBoost when checkpoint exists, else calibrated heuristic."""

from __future__ import annotations

from datetime import UTC, datetime, timedelta
from hashlib import blake2b
from pathlib import Path

import joblib
import numpy as np
import pandas as pd

from app.config import get_settings
from app.etherscan import EtherscanError
from app.models.schemas import FeatureContribution, RiskLabel, WalletScore
from app.scoring_errors import ScoringError
from app.wallet_features import FEATURE_COLUMNS, feature_row_for_address

CLASS_LABELS: list[RiskLabel] = [
    "legitimate",
    "phishing",
    "mixer_usage",
    "bot_activity",
    "sanctioned",
]


def _api_root() -> Path:
    return Path(__file__).resolve().parents[2]


def resolved_model_path() -> Path:
    settings = get_settings()
    p = Path(settings.model_path)
    if not p.is_absolute():
        p = (_api_root() / p).resolve()
    return p


def _deterministic_float(address: str, salt: str) -> float:
    h = blake2b(f"{address}:{salt}".encode(), digest_size=8).digest()
    return int.from_bytes(h, "big") / 2**64


def _mock_score(address: str) -> WalletScore:
    score = _deterministic_float(address, "risk")
    conf = 0.6 + _deterministic_float(address, "conf") * 0.4

    if score >= 0.85:
        label: RiskLabel = "phishing"
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
            feature="tx_frequency_per_day",
            value=round(500 * _deterministic_float(address, "tf"), 0),
            shap_contribution=round(score * 0.15, 3),
        ),
    ]

    now = datetime.now(UTC)
    return WalletScore(
        address=address,
        label=label,
        risk_score=round(float(score), 3),
        confidence=round(float(conf), 3),
        last_active=now - timedelta(hours=int(24 * _deterministic_float(address, "la"))),
        top_features=top_features,
        scored_at=now,
        model_version="mock-v0.0.1",
        prediction_id=None,
    )


def _heuristic_score(address: str, row: pd.Series, *, xgb_failed: bool = False) -> WalletScore:
    """Rule-based score from engineered features when no booster is available."""
    t = float(row.get("tornado_tx_count", 0))
    fan = float(row.get("fan_out_ratio", 0))
    freq = float(row.get("tx_frequency_per_day", 0))
    mev = float(row.get("mev_contract_calls", 0))

    risk = min(
        1.0,
        0.04
        + 0.07 * min(t, 8.0)
        + 0.018 * min(fan, 25.0)
        + 0.0008 * min(freq, 800.0)
        + 0.04 * min(mev, 10.0),
    )

    if t >= 1:
        label: RiskLabel = "mixer_usage"
    elif fan > 14 and freq > 120:
        label = "bot_activity"
    elif risk < 0.22:
        label = "legitimate"
    else:
        label = "unknown"

    conf = min(0.95, 0.48 + 0.47 * risk)

    keys = [
        "tornado_tx_count",
        "fan_out_ratio",
        "tx_frequency_per_day",
        "unique_counterparties",
        "mev_contract_calls",
        "contract_call_ratio",
    ]
    weighted: list[tuple[str, float, float]] = []
    for k in keys:
        if k not in FEATURE_COLUMNS:
            continue
        v = float(row.get(k, 0))
        w = abs(v) * (2.2 if "tornado" in k else 1.0)
        weighted.append((k, v, w))
    weighted.sort(key=lambda x: -x[2])
    top3 = weighted[:3] if weighted else [
        ("fan_out_ratio", float(row.get("fan_out_ratio", 0)), 1.0),
        ("tornado_tx_count", float(row.get("tornado_tx_count", 0)), 1.0),
        ("tx_frequency_per_day", float(row.get("tx_frequency_per_day", 0)), 1.0),
    ]
    total_w = sum(x[2] for x in top3) or 1.0
    top_features = [
        FeatureContribution(
            feature=k,
            value=round(v, 4),
            shap_contribution=round(risk * (w / total_w) * 0.85 - 0.05, 3),
        )
        for k, v, w in top3
    ]

    now = datetime.now(UTC)
    last_days = float(row.get("last_seen_days", 0))
    last_active = now - timedelta(days=min(max(0, int(last_days)), 3650))

    ver = "heuristic-v1+live-features"
    if xgb_failed:
        ver = "heuristic-v1+live-features(xgb-unavailable)"
    return WalletScore(
        address=address,
        label=label,
        risk_score=round(float(risk), 3),
        confidence=round(float(conf), 3),
        last_active=last_active,
        top_features=top_features,
        scored_at=now,
        model_version=ver,
        prediction_id=None,
    )


def _xgb_score(address: str, model_path: Path, row: pd.Series) -> WalletScore:
    import xgboost as xgb

    booster = xgb.Booster()
    booster.load_model(str(model_path))

    X = np.array([float(row[c]) for c in FEATURE_COLUMNS], dtype=np.float32)
    dm = xgb.DMatrix(X.reshape(1, -1), feature_names=FEATURE_COLUMNS)
    probs = booster.predict(dm).reshape(-1)
    if probs.shape[0] != len(CLASS_LABELS):
        probs = probs[: len(CLASS_LABELS)]
    probs = np.asarray(probs, dtype=np.float64)
    probs = np.clip(probs, 1e-12, 1.0)

    cal_path = model_path.with_name("calibrators.joblib")
    if cal_path.is_file():
        calibrators: list = joblib.load(cal_path)
        for k, iso in enumerate(calibrators):
            if k < len(probs):
                probs[k] = float(iso.predict([probs[k]])[0])
        probs = np.clip(probs, 1e-12, 1.0)
        probs = probs / probs.sum()

    confidence = float(np.max(probs))
    pred_class = int(np.argmax(probs))
    label = CLASS_LABELS[pred_class]
    risk_score = float(1.0 - probs[0])

    nfeat = len(FEATURE_COLUMNS)
    raw = np.asarray(booster.predict(dm, pred_contribs=True)).reshape(-1)
    if len(raw) == nfeat + 1:
        vec = raw[:-1]
    elif len(raw) % (nfeat + 1) == 0:
        ngrp = len(raw) // (nfeat + 1)
        pc = min(pred_class, ngrp - 1)
        chunk = raw[pc * (nfeat + 1) : (pc + 1) * (nfeat + 1)]
        vec = chunk[:-1]
    else:
        vec = raw[:nfeat]
    idx = np.argsort(-np.abs(vec))[:3]
    top_features = [
        FeatureContribution(
            feature=FEATURE_COLUMNS[i],
            value=float(X[i]),
            shap_contribution=float(vec[i]),
        )
        for i in idx
    ]

    now = datetime.now(UTC)
    last_days = float(row.get("last_seen_days", 0))
    last_active = now - timedelta(days=min(max(0, int(last_days)), 3650))

    version = model_path.stem
    return WalletScore(
        address=address,
        label=label,
        risk_score=round(risk_score, 3),
        confidence=round(confidence, 3),
        last_active=last_active,
        top_features=top_features,
        scored_at=now,
        model_version=f"xgb-{version}",
        prediction_id=None,
    )


def score_wallet(address: str) -> WalletScore:
    """Score using live Etherscan features; XGBoost if checkpoint loads; else heuristic."""
    settings = get_settings()
    addr = address.lower()

    try:
        row = feature_row_for_address(
            addr,
            etherscan_api_key=settings.etherscan_api_key or None,
            allow_synthetic=settings.allow_synthetic_features,
        )
    except EtherscanError as exc:
        raise ScoringError(str(exc)) from exc

    path = resolved_model_path()
    if path.is_file():
        try:
            return _xgb_score(addr, path, row)
        except Exception:
            if settings.allow_mock_scorer:
                return _mock_score(addr)
            return _heuristic_score(addr, row, xgb_failed=True)

    if settings.allow_mock_scorer:
        return _mock_score(addr)
    return _heuristic_score(addr, row, xgb_failed=False)
