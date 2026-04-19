"""Local explanations for the XGBoost model via `pred_contribs` (no separate SHAP install)."""

from __future__ import annotations

import numpy as np
import xgboost as xgb

from blockchain_bandits_ml.features import FEATURE_COLUMNS


def _contribution_vector(booster: xgb.Booster, dm: xgb.DMatrix, pred_class: int) -> np.ndarray:
    raw = np.asarray(booster.predict(dm, pred_contribs=True)).reshape(-1)
    nfeat = len(FEATURE_COLUMNS)
    if len(raw) == nfeat + 1:
        return raw[:-1]
    if len(raw) % (nfeat + 1) == 0:
        ngrp = len(raw) // (nfeat + 1)
        pc = min(pred_class, ngrp - 1)
        chunk = raw[pc * (nfeat + 1) : (pc + 1) * (nfeat + 1)]
        return chunk[:-1]
    return raw[:nfeat]


def top_k_contributions(
    booster: xgb.Booster,
    row: np.ndarray,
    k: int = 3,
) -> list[tuple[str, float, float]]:
    dm = xgb.DMatrix(row.reshape(1, -1), feature_names=FEATURE_COLUMNS)
    probs = booster.predict(dm).reshape(-1)
    pred_class = int(np.argmax(probs))
    vec = _contribution_vector(booster, dm, pred_class)
    idx = np.argsort(-np.abs(vec))[:k]
    return [(FEATURE_COLUMNS[i], float(row[i]), float(vec[i])) for i in idx]
