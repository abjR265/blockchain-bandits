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
| ML serving | Modal (serverless GPU) |
| Training | Google Colab Pro + Weights & Biases |
| Database | Supabase (Postgres + auth) |
| Blob storage | Cloudflare R2 |
| Data source | BigQuery `crypto_ethereum` public dataset |
| Hosting (FE) | Vercel Hobby |
| Hosting (API) | Fly.io free tier |
| CI | GitHub Actions |
| Observability | Sentry (errors), W&B (experiments) |

## Consequences

**Good:**

- Free tiers of every selected vendor cover the expected load at current
  scale. Estimated steady-state cost < $5/mo.
- Managed auth (Supabase) removes an entire class of work.
- Modal's serverless GPU model matches bursty analyst queries; we pay per
  second, not per always-on machine.
- R2's zero-egress policy removes a common "surprise bill" vector when
  shipping training data between laptop, Colab, and prod inference.

**Trade-offs:**

- Five different vendors means five different dashboards and five different
  auth setups. Mitigate by storing all secrets in `.env` and using a password
  manager.
- Fly.io + Modal is more complex than a single-provider setup (e.g. Railway).
  Chosen anyway because Modal's GPU pricing crushes every alternative at our
  volume.
- BigQuery free tier has a 1 TB/mo query ceiling; a careless unpartitioned
  query can blow through it. Mitigated by `SAFE_GB` enforcement and GCP
  billing alerts.

## Alternatives considered

- **All-AWS** — painful to bootstrap, egress fees eat training-data sync.
- **HuggingFace Spaces for inference** — free but CPU-only; GNN inference
  would be too slow.
- **Railway for everything** — cleaner but pricier and no serverless GPU.
- **Supabase Edge Functions instead of FastAPI** — Deno runtime limits
  Python ML ecosystem use; rejected.
