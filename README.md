# Blockchain-Bandits

AI-powered blockchain transaction intelligence. A graph-based ML pipeline that
detects suspicious behavior (wash trading, mixer usage, phishing clusters, bot
activity, layering) across Ethereum.

> Decision-support tool for analysts — outputs calibrated risk scores, never
> enforcement decisions.

## Stack at a glance

| Layer | Tech | Host |
|---|---|---|
| Frontend | Next.js 14, TypeScript, Tailwind, shadcn/ui | Vercel |
| API | FastAPI, Pydantic v2, async SQLAlchemy | Fly.io |
| ML inference | XGBoost (baseline), GraphSAGE (stretch) | Modal |
| Database | Postgres + auth | Supabase |
| Blob storage | Parquet, checkpoints | Cloudflare R2 |
| Data source | Ethereum transactions | BigQuery public dataset |
| Experiment tracking | Runs, artifacts | Weights & Biases |
| Training | Notebooks, GPU | Google Colab Pro |

Total steady-state cost target: **under $5/month** on free tiers.

## Repo layout

```
blockchain-bandits/
├── web/            # Next.js analyst dashboard
├── api/            # FastAPI service (thin wrapper over Modal + Supabase)
├── ml/             # Training code, notebooks, Modal inference app
├── data/           # ETL scripts, label sources, DB migrations
├── infra/          # fly.toml, vercel.json, Modal config, GitHub Actions
├── docs/           # ADRs, architecture diagrams
├── Makefile        # Common commands
├── pnpm-workspace.yaml
└── pyproject.toml  # Shared Python tooling (ruff, pyright)
```

## Prerequisites

- Node 20+ and [pnpm](https://pnpm.io) 9+
- Python 3.11 and [uv](https://docs.astral.sh/uv/)
- [Fly CLI](https://fly.io/docs/flyctl/) (deploy API)
- [Vercel CLI](https://vercel.com/docs/cli) (deploy web)
- [Supabase CLI](https://supabase.com/docs/guides/cli) (DB migrations)
- [Modal CLI](https://modal.com/docs/guide) (ML inference)
- A GCP project with BigQuery enabled (free tier is enough)

## First-time setup

```bash
# 1. Install dependencies
make setup

# 2. Configure environment
cp .env.example .env
# Fill in: SUPABASE_URL, SUPABASE_ANON_KEY, MODAL_TOKEN, etc.

# 3. Run the dev stack
make dev
```

`make dev` boots the FastAPI backend on `:8000` and the Next.js dashboard on
`:3000` concurrently. The dashboard talks to `http://localhost:8000` by default.

## Day-one checklist

See [`docs/setup.md`](docs/setup.md) for the full list of accounts to create
(Vercel, Fly.io, Supabase, Modal, BigQuery, W&B) plus Cornell-specific
benefits to claim (GitHub Student Pack, Azure for Students).

## Build phases

See [`docs/roadmap.md`](docs/roadmap.md). tl;dr:

1. **Week 1** — skeleton up, everything deployed, `/health` green
2. **Weeks 2–3** — BigQuery → Parquet → labeled wallets → features
3. **Weeks 4–5** — XGBoost baseline trained, calibrated, on Modal
4. **Week 6** — SHAP explanations, feedback loop
5. **Weeks 7–8** — GraphSAGE GNN (stretch), graph viz, LLM explanations

## License

MIT. See [LICENSE](LICENSE).
