# Day-one setup

Every account you need to create, in order. Total time: ~45 minutes if
you click fast. Cost: $0.

## Required

| # | Service | Why | Plan |
|---|---|---|---|
| 1 | [GitHub](https://github.com) | Repo + Actions | Free |
| 2 | [Vercel](https://vercel.com) | Frontend hosting | Hobby |
| 3 | [Fly.io](https://fly.io) | API hosting | Free tier (no card for free tier) |
| 4 | [Supabase](https://supabase.com) | Postgres + auth | Free |
| 5 | [Modal](https://modal.com) | Serverless GPU | Free tier ($30/mo credit) |
| 6 | [Cloudflare](https://dash.cloudflare.com) | R2 blob storage, DNS | Free |
| 7 | [Google Cloud](https://console.cloud.google.com) | BigQuery | $300 trial credit |
| 8 | [Weights & Biases](https://wandb.ai) | Experiment tracking | Free personal |
| 9 | [Sentry](https://sentry.io) | Error tracking | Free |

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
- `MODAL_TOKEN_ID`, `MODAL_TOKEN_SECRET` — `modal token new`
- `R2_*` — from Cloudflare R2 → Manage R2 API Tokens
- `GCP_PROJECT_ID` + service account JSON at `.secrets/gcp-service-account.json`
- `WANDB_API_KEY` — from wandb.ai/authorize
- `SENTRY_DSN` — from Sentry project settings
- `ETHERSCAN_API_KEY` — etherscan.io/myapikey
- `ANTHROPIC_API_KEY` — console.anthropic.com (only if doing LLM explanations)

## Billing guardrails (do this once)

1. **GCP:** Billing → Budgets & alerts → $5 alert at 50/90/100%
2. **Modal:** Usage dashboard — keep an eye on credit burn
3. **Vercel:** Hobby tier is free; no budget to set
4. **Fly.io:** free tier is hard-capped; no card billed unless you upgrade
5. **Colab:** compute units dashboard — pin T4/V100 when experimenting to save A100 for real training

## Verify the skeleton works

```bash
make setup
make dev
# -> http://localhost:3000 shows dashboard
# -> http://localhost:8000/docs shows OpenAPI
# -> http://localhost:8000/health returns ok
```
