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

## Mock → real, by phase

- **Phase 1 (now):** deterministic hash-based mock scorer in `services/scorer.py`
- **Phase 3:** replace `scorer.score_wallet` body with a `modal.Function.remote()` call
- **Phase 5:** `jobs.run_job` becomes async — use `modal.Function.spawn()` plus a polling endpoint
- **Phase 5:** `feedback.submit` writes to Supabase `feedback` table instead of printing

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
