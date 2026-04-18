"""Notebook 04 — Snorkel weak supervision.

Apply the labeling functions to unlabeled wallets, fit the LabelModel,
produce probabilistic labels, join back with source labels, write the
combined training set to parquet.
"""

# ruff: noqa

from pathlib import Path

import pandas as pd
from snorkel.labeling import LFApplier, LFAnalysis
from snorkel.labeling.model import LabelModel

from blockchain_bandits_ml.labeling import ALL_LFS


UNLABELED = Path("/content/drive/MyDrive/blockchain-bandits/data/wallets_week.parquet")
OUT = Path("/content/drive/MyDrive/blockchain-bandits/data/wallets_weak_labels.parquet")


def run():
    df = pd.read_parquet(UNLABELED)
    records = df.to_dict(orient="records")
    applier = LFApplier(lfs=ALL_LFS)
    L = applier.apply(records)
    print(LFAnalysis(L=L, lfs=ALL_LFS).lf_summary())

    label_model = LabelModel(cardinality=5, verbose=True)
    label_model.fit(L_train=L, n_epochs=500, lr=0.01)
    probs = label_model.predict_proba(L=L)

    for k in range(probs.shape[1]):
        df[f"weak_prob_{k}"] = probs[:, k]
    df["weak_label"] = probs.argmax(axis=1)
    df.to_parquet(OUT, index=False)
    print(f"Wrote {OUT}")


if __name__ == "__main__":
    run()
