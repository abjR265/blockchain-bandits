"""Notebook 03 — train XGBoost baseline.

Input: wallet-level parquet with features + labels.
Output: xgb.json + calibrators.npz in R2 or Drive. W&B run logged.
"""

# ruff: noqa

from pathlib import Path
import os
import wandb

from blockchain_bandits_ml.train import TrainConfig, fit_xgb, calibrate, evaluate, temporal_split
import pandas as pd

DATA = Path("/content/drive/MyDrive/blockchain-bandits/data/wallets_labeled.parquet")
OUT = Path("/content/drive/MyDrive/blockchain-bandits/checkpoints")


def run():
    cfg = TrainConfig(data_path=DATA, output_dir=OUT)
    wandb.init(project=cfg.wandb_project, config=vars(cfg))

    df = pd.read_parquet(DATA)
    train, val, test = temporal_split(df, cfg)
    print(f"train={len(train):,}  val={len(val):,}  test={len(test):,}")

    booster = fit_xgb(train, val, cfg)
    _ = calibrate(booster, val, cfg)
    metrics = evaluate(booster, test, cfg)
    print("metrics:", metrics)
    wandb.log(metrics)

    OUT.mkdir(parents=True, exist_ok=True)
    booster.save_model(str(OUT / "xgb.json"))
    wandb.save(str(OUT / "xgb.json"))
    wandb.finish()


if __name__ == "__main__":
    run()
