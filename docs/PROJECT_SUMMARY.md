# Blockchain-Bandits — Project summary (writeup)

**Author:** Abhijay Rane (ar2536@cornell.edu)  
**Repo:** [github.com/abjR265/blockchain-bandits](https://github.com/abjR265/blockchain-bandits)

## Purpose

Ethereum wallet risk triage: BigQuery → tabular features → weak labels (Snorkel) → **XGBoost** multi-class probabilities → **calibrated** risk score + **local explanations** (`pred_contribs`) → FastAPI → Next.js dashboard, with **feedback stored in Supabase** for retraining.

Framed as **decision-support for analysts**, not enforcement.

## What is implemented in this repo

| Area | Status |
|------|--------|
| Feature engineering (`ml` + mirrored `api/app/wallet_features.py`) | Implemented (~20 columns); keep both files aligned. |
| BigQuery extract (`data/…/bigquery_extract.py`) | Partitioned query + `SAFE_GB` dry-run guard. |
| Label loaders (`label_sources.py`) | OFAC (regex on SDN XML) + CryptoScamDB API + Tornado pool seeds. |
| Snorkel LFs (`labeling.py`) | Defined; wire into training notebooks / batch job. |
| Training (`train.py`) | XGBoost + isotonic calibrators saved as `calibrators.joblib`. |
| API scoring | Lazy-loads **XGBoost** only if `model_path` exists; else deterministic mock. |
| Explanations | Tree `pred_contribs` (no separate SHAP dependency in API). |
| Persistence | Supabase: wallet upsert + prediction insert; feedback UUID validation. |
| Web | Dashboard + wallet page call live API with React Query; feedback buttons when `prediction_id` exists. |
| Docker / Fly | `api/Dockerfile` builds from `api/`; copy `ml/checkpoints/xgb.json` → `api/checkpoints/` for deploy. |

## Ops notes

- **macOS:** If you train or load XGBoost locally, install OpenMP: `brew install libomp`. The API lazy-imports XGBoost so **mock scoring** works without it until a real model is used.
- **Production model path:** Set `MODEL_PATH=checkpoints/xgb.json` (see `api/fly.toml`) and bake artifacts into `api/checkpoints/` in the image.

## Rubric mapping (short)

- Data + labels: BigQuery + OFAC / CryptoScamDB / Tornado + Snorkel (training path).
- Training + calibration + W&B: `train.py` + Colab notebooks.
- Deployment: Vercel (web) + Fly (api) + Supabase (Postgres).
- Interpretability: top-3 feature contributions on each response.
- Feedback loop: `POST /feedback` → `feedback` table keyed by `prediction_id`.

For the full narrative (sources, ethics, risks), extend this document or link your course PDFs in `docs/`.
