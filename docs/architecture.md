# Architecture

```
                ┌─────────────────┐
                │ Next.js/Vercel  │  ← analyst dashboard
                └────────┬────────┘
                         │ REST (TanStack Query)
                ┌────────▼────────┐
                │ FastAPI/Fly.io  │  ← API + local model scoring
                └────┬──────┬─────┘
                     │      │
                     ▼      ▼
            ┌──────────────┐  ┌──────────────┐
            │ Supabase PG  │  │ Colab Pro    │
            │ predictions, │  │ training     │
            │ feedback,    │  │ notebooks    │
            │ labels,      │  └──────┬───────┘
            │ models       │         │
            └──────────────┘         ▼
                            ┌──────────────────┐
                            │ BigQuery (ETH)   │
                            └──────────────────┘
```

## Data flow

### Read path (analyst looks up a wallet)

1. Analyst pastes `0x...` into the dashboard.
2. Next.js `POST /analyze` → FastAPI.
3. FastAPI optionally checks recent predictions in Postgres.
4. FastAPI computes features, runs local XGBoost model, and returns score +
   SHAP contributions.
5. FastAPI persists the prediction to `predictions` table.

### Write path (feedback)

1. Analyst clicks thumbs-up/down.
2. Next.js `POST /feedback` with `prediction_id` + verdict.
3. FastAPI inserts into `feedback`. That row is the only long-term ground
   truth source for retraining.

### Training path (weekly)

1. A scheduled Colab notebook pulls fresh txs from BigQuery.
2. Features + labels joined with `feedback` corrections.
3. XGBoost retrained on temporal CV, evaluated, calibrated.
4. New booster written to `ml/checkpoints` with a new `version` tag.
5. Row inserted into `models` table; analyst clicks "promote" to flip
   `is_production=true` (exclusive-index enforces a single prod model).

## Boundaries

- **The UI never reads from Postgres.** Only through FastAPI.
- **FastAPI owns writes and inference serving.** Keep one serving path for the
  class project.
