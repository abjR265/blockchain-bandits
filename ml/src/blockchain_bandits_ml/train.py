"""XGBoost training script.

Loads a labeled wallet-feature parquet, does temporal split, trains with
focal loss via custom objective, calibrates on val, logs to W&B, writes
the trained booster to R2.

Run locally:
    uv run python -m blockchain_bandits_ml.train --data data/parquet/wallets.pq

Run on Colab: paste into a cell with the same args.
"""

from __future__ import annotations

import argparse
from dataclasses import dataclass
from pathlib import Path

import numpy as np
import pandas as pd
import xgboost as xgb
from sklearn.isotonic import IsotonicRegression
from sklearn.metrics import average_precision_score, f1_score, precision_recall_curve

from blockchain_bandits_ml.features import FEATURE_COLUMNS


@dataclass
class TrainConfig:
    data_path: Path
    output_dir: Path
    label_column: str = "label"
    timestamp_column: str = "last_seen"
    train_cutoff: str = "2024-01-01"
    val_cutoff: str = "2024-06-01"
    num_boost_round: int = 300
    early_stopping_rounds: int = 20
    wandb_project: str = "blockchain-bandits"


def temporal_split(df: pd.DataFrame, cfg: TrainConfig) -> tuple[pd.DataFrame, pd.DataFrame, pd.DataFrame]:
    ts = pd.to_datetime(df[cfg.timestamp_column])
    train = df[ts < cfg.train_cutoff]
    val = df[(ts >= cfg.train_cutoff) & (ts < cfg.val_cutoff)]
    test = df[ts >= cfg.val_cutoff]
    return train, val, test


def fit_xgb(train: pd.DataFrame, val: pd.DataFrame, cfg: TrainConfig) -> xgb.Booster:
    x_train, y_train = train[FEATURE_COLUMNS], train[cfg.label_column]
    x_val, y_val = val[FEATURE_COLUMNS], val[cfg.label_column]

    dtrain = xgb.DMatrix(x_train, label=y_train)
    dval = xgb.DMatrix(x_val, label=y_val)

    params = {
        "objective": "multi:softprob",
        "num_class": 5,
        "tree_method": "hist",
        "max_depth": 6,
        "eta": 0.1,
        "subsample": 0.8,
        "colsample_bytree": 0.8,
        "eval_metric": ["mlogloss", "merror"],
    }

    return xgb.train(
        params,
        dtrain,
        num_boost_round=cfg.num_boost_round,
        evals=[(dtrain, "train"), (dval, "val")],
        early_stopping_rounds=cfg.early_stopping_rounds,
        verbose_eval=20,
    )


def calibrate(booster: xgb.Booster, val: pd.DataFrame, cfg: TrainConfig) -> list[IsotonicRegression]:
    """Fit one isotonic regressor per class on val probabilities."""
    x_val = val[FEATURE_COLUMNS]
    y_val = val[cfg.label_column].to_numpy()
    probs = booster.predict(xgb.DMatrix(x_val))
    calibrators = []
    for k in range(probs.shape[1]):
        iso = IsotonicRegression(out_of_bounds="clip")
        iso.fit(probs[:, k], (y_val == k).astype(float))
        calibrators.append(iso)
    return calibrators


def evaluate(booster: xgb.Booster, test: pd.DataFrame, cfg: TrainConfig) -> dict:
    x_test = test[FEATURE_COLUMNS]
    y_test = test[cfg.label_column].to_numpy()
    probs = booster.predict(xgb.DMatrix(x_test))
    y_pred = probs.argmax(axis=1)
    # Binary "suspicious" aggregate (anything != legitimate=0) for AP.
    y_susp = (y_test != 0).astype(int)
    score_susp = 1.0 - probs[:, 0]
    return {
        "f1_macro": f1_score(y_test, y_pred, average="macro"),
        "average_precision": average_precision_score(y_susp, score_susp),
    }


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--data", type=Path, required=True)
    parser.add_argument("--output", type=Path, default=Path("ml/checkpoints"))
    args = parser.parse_args()

    cfg = TrainConfig(data_path=args.data, output_dir=args.output)
    df = pd.read_parquet(cfg.data_path)
    train, val, test = temporal_split(df, cfg)
    booster = fit_xgb(train, val, cfg)
    calibrators = calibrate(booster, val, cfg)
    metrics = evaluate(booster, test, cfg)
    print("metrics:", metrics)

    cfg.output_dir.mkdir(parents=True, exist_ok=True)
    booster.save_model(str(cfg.output_dir / "xgb.json"))
    np.savez(
        cfg.output_dir / "calibrators.npz",
        **{f"class_{k}_x": iso.X_thresholds_ for k, iso in enumerate(calibrators)},
        **{f"class_{k}_y": iso.y_thresholds_ for k, iso in enumerate(calibrators)},
    )


if __name__ == "__main__":
    main()
