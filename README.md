# Blockchain-Bandits

AI-powered blockchain transaction intelligence. A graph-based ML pipeline that
detects suspicious behavior (wash trading, mixer usage, phishing clusters, bot
activity, layering) across Ethereum.

---

## What this project does

| Piece | Role |
|--------|------|
| **Dashboard (`web/`)** | Next.js analyst UI: stats, triage queue, ML analytics, wallet detail with score, label, and feature attributions. |
| **API (`api/`)** | FastAPI: async jobs for `/analyze`, recent wallets & stats, feedback loop, optional Supabase persistence. |
| **Features** | Per-address **tabular features** (e.g. Tornado proximity, fan-out, tx frequency, MEV-adjacent calls) built from **Etherscan API v2** + mainnet `chainid`—see `api/app/wallet_features.py`. |
| **Scoring** | **Primary:** trained **XGBoost** booster at `MODEL_PATH` (default `ml/checkpoints/xgb.json`) with optional **isotonic calibration** (`calibrators.joblib`). **Fallback:** `heuristic-v1+live-features` on the same engineered row. **Dev-only:** deterministic mock if `ALLOW_MOCK_SCORER=true` (not recommended). |
| **ML training (`ml/`)** | **BigQuery** public Ethereum data → feature pipelines, **Snorkel** weak supervision, **temporal CV**, **XGBoost** multi-class training, **W&B** experiment tracking—see `ml/README.md` and `docs/0002-model-approach.md`. |
| **Data & labels (`data/`)** | ETL, OFAC / CryptoScamDB / Tornado / MEV label sources, BigQuery extract with scan budgets—see `data/README.md`. |

**Risk output:** `risk_score` is a **0–1** scalar (shown as 0–100 in the UI). **Labels** include `legitimate`, `phishing`, `mixer_usage`, `bot_activity`, `sanctioned`, and `unknown`. Analyst **thumbs up/down** (when Supabase is configured) records feedback tied to `prediction_id` for future retraining.

---

## Tech stack

| Area | Choices |
|------|---------|
| **Frontend** | Next.js 14, React 18, TypeScript, Tailwind CSS, TanStack Query, Lucide icons |
| **Backend** | FastAPI, Pydantic v2, `uv` for envs |
| **Inference deps** | XGBoost (optional at runtime), NumPy/pandas, `joblib` calibrators |
| **Live chain data** | Etherscan HTTP API **v2** (`ETHERSCAN_API_KEY`, `ETHERSCAN_CHAIN_ID`, typically `1` for mainnet) |
| **State (optional)** | Supabase / Postgres for predictions & feedback |
| **Training data** | Google **BigQuery** `crypto_ethereum` (see `data/`) |
| **Experiments** | **Weights & Biases** (`WANDB_*` in `.env.example`) |
| **Monorepo** | `pnpm` for `web/`, `uv` + per-package `pyproject.toml` for `api/`, `ml/`, `data/` |

Deployment targets mentioned in the course brief: **Vercel** (web), **Fly.io** (API)—see `Makefile` and `api/fly.toml`.

---

## ML approach (short)

1. **Labels:** noisy silver labels from Snorkel LFs (OFAC, scam DBs, Tornado pools, CEX adjacency, etc.) plus analyst feedback over time.
2. **Features:** wallet-level aggregates aligned with `FEATURE_COLUMNS` in the API so training and serving share the same schema (with production using live Etherscan-backed rows where applicable).
3. **Model:** **XGBoost** multi-class softmax; **isotonic calibration** per class when `calibrators.joblib` ships with the checkpoint.
4. **Explanations:** **SHAP-style** contributions from the booster (`pred_contribs`) surfaced as `top_features` in the API response.

For graphs, weak supervision detail, and roadmap, see **`docs/project-summary.md`**, **`docs/0002-model-approach.md`**, and **`docs/roadmap.md`**.

---

## Repository layout

```
blockchain-bandits/
├── web/                 # Next.js dashboard
├── api/                 # FastAPI scoring & jobs
├── ml/                  # Training, notebooks, Modal entrypoints
├── data/                # ETL, label sources, BigQuery helpers
├── docs/                # Architecture, ADRs, setup, deep writeups
├── api/fly.toml         # Example Fly.io deploy config for the API
├── Makefile             # dev, test, lint, deploy helpers
├── pyproject.toml       # Root Python tooling (ruff, etc.)
├── pnpm-workspace.yaml  # Web workspace
├── .env.example         # Documented env vars (copy to .env — never commit .env)
└── README.md            # This file
```

---

## Prerequisites

- **Node.js 20+** and [pnpm](https://pnpm.io) 9+
- **Python 3.11+** and [uv](https://docs.astral.sh/uv/)
- Optional: **Fly CLI**, **Vercel CLI**, **Supabase CLI** for deploy/DB
- Optional: GCP **BigQuery** for training extracts
- macOS: **`brew install libomp`** if you run XGBoost locally

---

## Quick start

```bash
# Install JS + Python deps across packages
make setup

# Copy env template — edit secrets locally; do not commit .env
cp .env.example .env

# Run API :8000 + Next.js :3000 (see Makefile)
make dev
```

- **Web** expects **`NEXT_PUBLIC_API_URL`** (default `http://localhost:8000`).
- **Live scoring** needs **`ETHERSCAN_API_KEY`** in `.env` (root and/or `api/` per `api/app/config.py` loading).
- **`API_CORS_ORIGINS`** should list your dev origin (e.g. `http://localhost:3000`); empty may fall back to localhost in development—see `api/app/config.py`.

API docs: **http://localhost:8000/docs** after `make dev-api`.

More accounts, GCP, and class-specific setup: **`docs/setup.md`**.

---

## Useful commands

| Command | Purpose |
|---------|---------|
| `make dev` | API + web together |
| `make test` | API pytest + web test script |
| `make lint` / `make format` | Lint/format web + Python trees |
| `make deploy-web` / `make deploy-api` | Production deploy (requires CLI login) |

Package-specific notes: **`api/README.md`**, **`web/README.md`**, **`ml/README.md`**, **`data/README.md`**.

---

## Security & secrets

- **`.env` is gitignored**; use **`.env.example`** as the template. Do not commit API keys or Supabase service keys.
- Rotate any key that was exposed in screenshots or chat logs.

---

## License

MIT — see [LICENSE](LICENSE).
