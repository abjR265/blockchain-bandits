"""SHAP explanations for the XGBoost model."""

from __future__ import annotations

import numpy as np
import shap
import xgboost as xgb

from blockchain_bandits_ml.features import FEATURE_COLUMNS


def top_k_contributions(
    booster: xgb.Booster,
    row: np.ndarray,
    k: int = 3,
) -> list[tuple[str, float, float]]:
    """Return the top-k features by absolute SHAP contribution.

    Returns a list of (feature_name, feature_value, shap_value).
    """
    explainer = shap.TreeExplainer(booster)
    shap_values = explainer.shap_values(row.reshape(1, -1))  # (1, n_features) or per-class
    # For multiclass, take the predicted class.
    if isinstance(shap_values, list):
        probs = booster.predict(xgb.DMatrix(row.reshape(1, -1)))
        cls = int(np.argmax(probs, axis=1)[0])
        sv = shap_values[cls][0]
    else:
        sv = shap_values[0]

    idx = np.argsort(-np.abs(sv))[:k]
    return [(FEATURE_COLUMNS[i], float(row[i]), float(sv[i])) for i in idx]
