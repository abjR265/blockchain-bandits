# Day-one setup

Every account you need to create, in order. Total time: ~30-45 minutes.
Cost target: $0 for class use.

## Required

| # | Service | Why | Plan |
|---|---|---|---|
| 1 | [GitHub](https://github.com) | Repo + Actions | Free |
| 2 | [Vercel](https://vercel.com) | Frontend hosting | Hobby |
| 3 | [Fly.io](https://fly.io) | API hosting | Free tier (no card for free tier) |
| 4 | [Supabase](https://supabase.com) | Postgres (predictions + feedback) | Free |
| 5 | [Google Cloud](https://console.cloud.google.com) | BigQuery | $300 trial credit |
| 6 | [Weights & Biases](https://wandb.ai) | Experiment tracking | Free personal |

## Claim these too (.edu benefits)

| # | Program | Why | How |
|---|---|---|---|
| 1 | [GitHub Student Pack](https://education.github.com/pack) | $200 DigitalOcean, free `.me` domain, JetBrains, Sentry boost | Verify with Cornell ID |
| 2 | [Azure for Students](https://azure.microsoft.com/free/students) | $100 credit, no card required | Sign in with @cornell.edu |
| 3 | Cornell AWS Academy | Course-specific sandbox | Ask your course staff |
| 4 | Colab Pro | GPU training | Already active via ar2536@cornell.edu |

## Env vars to populate

After signing up, copy `.env.example` → `.env` and fill in:

- `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` — from Supabase Project Settings → API
- `GCP_PROJECT_ID` + service account JSON at `.secrets/gcp-service-account.json`
- `WANDB_API_KEY` — from wandb.ai/authorize
- `ETHERSCAN_API_KEY` — etherscan.io/myapikey
- `ANTHROPIC_API_KEY` — console.anthropic.com (only if doing LLM explanations)

## Billing guardrails (do this once)

1. **GCP:** Billing → Budgets & alerts → $5 alert at 50/90/100%
2. **Vercel:** Hobby tier is free; no budget to set
3. **Fly.io:** free tier is hard-capped; no card billed unless you upgrade
4. **Colab:** compute units dashboard — pin T4/V100 when experimenting to save A100 for real training

## Optional later (only if needed)

- **Modal** for serverless GPU inference if local API inference becomes too slow
- **Cloudflare R2** for large Parquet/checkpoint storage beyond local + Drive
- **Sentry** if you want production-style error tracking in demos

## Verify the skeleton works

```bash
make setup
make dev
# -> http://localhost:3000 shows dashboard
# -> http://localhost:8000/docs shows OpenAPI
# -> http://localhost:8000/health returns ok
```
