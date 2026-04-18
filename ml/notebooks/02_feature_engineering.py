"""Notebook 02 — feature engineering.

Input: tx-level parquet produced by notebook 01.
Output: wallet-level parquet with FEATURE_COLUMNS, written to R2 or Drive.
"""

# ruff: noqa

from pathlib import Path

import pandas as pd

from blockchain_bandits_ml.features import FEATURE_COLUMNS, engineer

IN_PATH = Path("/content/drive/MyDrive/blockchain-bandits/data/txs_week.parquet")
OUT_PATH = Path("/content/drive/MyDrive/blockchain-bandits/data/wallets_week.parquet")


def run():
    txs = pd.read_parquet(IN_PATH)
    print(f"Loaded {len(txs):,} transactions.")
    wallets = engineer(txs)
    print(f"Engineered {len(wallets):,} wallet rows; {len(FEATURE_COLUMNS)} features.")
    wallets.to_parquet(OUT_PATH, index=False)
    print(f"Wrote {OUT_PATH}.")


if __name__ == "__main__":
    run()
