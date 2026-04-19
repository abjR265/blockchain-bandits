# api

FastAPI service. Thin layer over Modal (ML inference) and Supabase (state).

## Dev

```bash
uv sync
cp ../.env.example .env
uv run uvicorn app.main:app --reload --port 8000
```

OpenAPI docs: http://localhost:8000/docs

## Routes

| Method | Path | Purpose |
|---|---|---|
| GET | `/health` | Liveness |
| GET | `/stats` | Dashboard KPIs |
| GET | `/wallets/recent` | Recent flagged wallets |
| POST | `/analyze` | Queue wallet scoring |
| GET | `/analyze/{job_id}` | Poll job status |
| POST | `/feedback` | Analyst correct/incorrect label |

## Live scoring (default)

1. Set **`ETHERSCAN_API_KEY`** and optional **`ETHERSCAN_CHAIN_ID=1`** (Ethereum mainnet; Etherscan **API v2** — see root `.env.example`).
2. Optionally place **`xgb.json`** (+ `calibrators.joblib` alongside) at **`MODEL_PATH`** for trained XGBoost; if missing or unloadable, the API uses **`heuristic-v1+live-features`** (rules on real engineered features), not hash mocks.
3. **`ALLOW_SYNTHETIC_FEATURES=true`** — only for offline demos (fake txs). **`ALLOW_MOCK_SCORER=true`** — legacy hash mock (not recommended).

## Tests

```bash
uv run pytest
```

## Deploy (Fly.io)

```bash
fly launch --no-deploy      # one-time; creates fly.toml
fly secrets set SUPABASE_URL=... MODAL_TOKEN_ID=... ...
fly deploy
```
