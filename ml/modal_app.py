"""Modal inference app.

Deploy:
    modal deploy modal_app.py

Invoke (from the FastAPI service):
    fn = modal.Function.lookup("blockchain-bandits", "score_wallet")
    result = fn.remote(address="0x...")
"""

from __future__ import annotations

import modal

app = modal.App("blockchain-bandits")

image = (
    modal.Image.debian_slim(python_version="3.11")
    .pip_install(
        "xgboost>=2.1.0",
        "shap>=0.46.0",
        "pandas>=2.2.0",
        "numpy>=1.26.0",
        "pyarrow>=17.0.0",
        "boto3>=1.35.0",  # R2 (S3-compatible)
    )
)

# Persistent volume for model artifacts, synced from R2 at cold start.
volume = modal.Volume.from_name("bb-models", create_if_missing=True)


@app.function(image=image, volumes={"/models": volume}, timeout=60)
def score_wallet(address: str) -> dict:
    """Score a single wallet.

    Week 4 impl: load xgb booster from /models/xgb.json, fetch the wallet's
    feature vector from R2 Parquet (or a Postgres feature cache), predict,
    return JSON-serialisable result. For now, returns a stub.
    """
    # TODO: load model, features, return real prediction
    return {
        "address": address,
        "label": "unknown",
        "risk_score": 0.5,
        "confidence": 0.5,
        "model_version": "modal-stub-v0.0.1",
    }


@app.function(
    image=image,
    volumes={"/models": volume},
    gpu="T4",
    timeout=3600,
)
def train_xgb(data_uri: str) -> dict:
    """Training entry point.

    Trigger with `modal run modal_app.py::train_xgb --data-uri s3://...`.
    """
    # TODO: wire up train.py against the GPU image.
    return {"status": "not_implemented", "data_uri": data_uri}


@app.local_entrypoint()
def main(address: str = "0x" + "a" * 40) -> None:
    """Smoke test from the CLI: `modal run modal_app.py --address 0x...`"""
    result = score_wallet.remote(address)
    print(result)
