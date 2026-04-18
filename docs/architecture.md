# Architecture

```
                ┌─────────────────┐
                │ Next.js/Vercel  │  ← analyst dashboard
                └────────┬────────┘
                         │ REST (TanStack Query)
                ┌────────▼────────┐
                │ FastAPI/Fly.io  │  ← thin API, auth, caching
                └────┬──────┬─────┘
                     │      │
       ┌─────────────┘      └────────────┐
       ▼                                 ▼
┌──────────────┐                 ┌──────────────┐
│ Supabase PG  │                 │ Modal GPU    │
│ predictions, │                 │ XGB + GNN    │
│ feedback,    │                 │ inference    │
│ wallets,     │                 └──────┬───────┘
│ labels,      │                        │
│ models       │                        │
└──────────────┘                        │
                                ┌───────▼───────┐
                                │ R2 (parquet,  │
                                │ model ckpts)  │
                                └───────▲───────┘
                                        │
                          ┌─────────────┴──────┐
                          │ Colab Pro (train)  │
                          └─────────┬──────────┘
                                    │
                          ┌─────────▼──────────┐
                          │ BigQuery (ETH raw) │
                          └────────────────────┘
```

## Data flow

### Read path (analyst looks up a wallet)

1. Analyst pastes `0x...` into the dashboard.
2. Next.js `POST /analyze` → FastAPI.
3. FastAPI hashes the address, checks the recent-predictions cache in
   Postgres (+ Upstash Redis layer in week 6). Hit → return cached score.
4. Miss → `modal.Function.spawn("score_wallet", address)`. FastAPI returns
   `job_id` immediately.
5. UI polls `GET /analyze/{job_id}` until `status == "complete"`.
6. Modal loads model from `/models` volume (synced from R2 at cold start),
   pulls the wallet's feature vector from R2 Parquet shards, runs the
   booster, returns the score + SHAP contributions.
7. FastAPI persists the prediction to `predictions` table, returns it.

### Write path (feedback)

1. Analyst clicks thumbs-up/down.
2. Next.js `POST /feedback` with `prediction_id` + verdict.
3. FastAPI inserts into `feedback`. That row is the only long-term ground
   truth source for retraining.

### Training path (weekly)

1. A scheduled Colab notebook (or `modal run`) pulls fresh txs from
   BigQuery into R2 Parquet.
2. Features + labels joined with `feedback` corrections.
3. XGBoost retrained on temporal CV, evaluated, calibrated.
4. New booster written to R2 with a new `version` tag.
5. Row inserted into `models` table; analyst clicks "promote" to flip
   `is_production=true` (exclusive-index enforces a single prod model).

## Boundaries

- **Modal doesn't touch Postgres.** FastAPI owns all writes.
- **The UI never reads from Postgres.** Only through FastAPI.
- **R2 is the only cross-environment artifact store.** Colab, Modal, and
  FastAPI all reach into R2 rather than each other.
