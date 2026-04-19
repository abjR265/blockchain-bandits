# ADR 0001 — Tech stack

**Status:** Accepted · Date: 2026-04-18

## Context

A solo-ish student project that needs to ship:

- A real ML pipeline (data → features → labels → trained model → calibrated
  inference) against live Ethereum data,
- A real API serving predictions to a real dashboard,
- A real feedback loop that can inform retraining.

Constraints: one semester, ~$0 budget ceiling, one primary developer with
Colab Pro via a Cornell .edu account.

## Decision

| Layer | Choice |
|---|---|
| Frontend | Next.js 14 (App Router) + TypeScript + Tailwind |
| API | FastAPI + Pydantic v2 (Python 3.11) |
| ML serving | XGBoost loaded directly in FastAPI |
| Training | Google Colab Pro + Weights & Biases |
| Database | Supabase Postgres |
| Data source | BigQuery `crypto_ethereum` public dataset |
| Hosting (FE) | Vercel Hobby |
| Hosting (API) | Fly.io free tier |
| CI | GitHub Actions |
| Observability | W&B (experiments) |

## Consequences

**Good:**

- Free tiers of every selected vendor cover the expected load at current
  scale. Estimated steady-state cost near $0 for class use.
- FastAPI + XGBoost keeps the serving path simple and easy to demo.
- Supabase keeps schema + SQL workflow straightforward.

**Trade-offs:**

- Inference runs on API CPU instead of dedicated GPU infra, so latency can be
  higher for future GNN experiments.
- Fewer services means fewer moving parts, but also fewer "production-like"
  platform features.
- BigQuery free tier has a 1 TB/mo query ceiling; a careless unpartitioned
  query can blow through it. Mitigated by `SAFE_GB` enforcement and GCP
  billing alerts.

## Alternatives considered

- **All-AWS** — painful to bootstrap, egress fees eat training-data sync.
- **Modal + R2 architecture** — powerful but too complex for class scope.
- **Railway for everything** — cleaner but unnecessary while free tiers already
  cover this project.
- **Supabase Edge Functions instead of FastAPI** — Deno runtime limits
  Python ML ecosystem use; rejected.
