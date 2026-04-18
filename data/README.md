# data

ETL scripts and the Supabase schema.

## Layout

```
data/
├── src/bb_data/
│   ├── bigquery_extract.py   # partitioned, budget-safe BigQuery extractor
│   └── label_sources.py      # OFAC, CryptoScamDB, Tornado pool loaders
└── supabase/
    ├── config.toml
    └── migrations/
        └── 001_initial.sql   # wallets, predictions, feedback, labels, models
```

## Quick start

```bash
uv sync

# 1) Pull one week of Tornado-adjacent transactions (dry-run by default)
uv run python -m bb_data.bigquery_extract \
    --start 2024-01-01 --end 2024-01-08 \
    --out /tmp/txs_week.parquet

# 2) Build label seeds
uv run python -m bb_data.label_sources

# 3) Apply Supabase migrations
supabase db push
```

## Cost discipline

- Every query filters on `block_timestamp`; unpartitioned queries abort.
- `SAFE_GB = 5` ceiling in `bigquery_extract.py` — dry-run first, refuse to run if over.
- Set a billing alert at $5 in GCP console to catch runaway spend.
