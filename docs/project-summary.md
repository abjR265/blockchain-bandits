# Blockchain-Bandits — Project Summary (Writeup)

**Author:** Abhijay Rane (ar2536@cornell.edu)
**Date:** 2026-04-18
**Repo:** `blockchain-bandits/`

---

## 0. How to read this document

This file serves **two roles** at once:

1. **Course narrative** — data sources, modeling choices, Snorkel + BigQuery training story, and roadmap (what we set out to prove).
2. **Repository truth** — what is actually wired in code *today*.

**Inference vs. training (critical).** *Training* uses historical pulls from **BigQuery** plus weak labels from OFAC, CryptoScamDB, Tornado pools, MEV lists, etc. *Serving* in the FastAPI app builds **live, per-request features** from **Etherscan API v2** (mainnet `chainid`, e.g. `1`) so analyst lookups stay current without re-running warehouse jobs. The feature vector is aligned with `FEATURE_COLUMNS` / `api/app/wallet_features.py` so the same XGBoost schema can train offline and score online.

**Scoring path in code.** If `MODEL_PATH` resolves to a loadable XGBoost booster (`xgb.json`), the API uses it with optional **isotonic calibrators** (`calibrators.joblib`). Otherwise it falls back to **`heuristic-v1+live-features`** on the same engineered row (still real chain-backed features when Etherscan is configured). A legacy **hash mock** exists only behind `ALLOW_MOCK_SCORER` (not recommended).

**Explanations.** Production uses **XGBoost `pred_contribs`** (tree SHAP-style contributions from the booster), not a separate `shap` library call—the wallet UI shows **top-3** contributions with raw feature values.

**Persistence & feedback.** **Supabase** is **optional**: when `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are set, predictions can be persisted and `prediction_id` returned so `/feedback` can write to the `feedback` table. Without credentials, the UI still scores wallets but feedback may be disabled.

**Frontend.** Next.js 14 + **Tailwind** + custom components (the repo does **not** depend on shadcn/ui).

**CI.** GitHub Actions runs **web** (lint, typecheck, build) and **api** / **ml** (ruff + pytest)—see `.github/workflows/ci.yml`.

---

## 1. Project Overview

Blockchain-Bandits is an AI-powered blockchain transaction intelligence system that ingests live Ethereum transaction data, engineers behavioral features for individual wallets, and outputs **calibrated risk scores** with human-readable explanations. The system classifies wallets into one of five operational categories — `legitimate`, `phishing`, `mixer_usage`, `bot_activity`, and `sanctioned` — and exposes the results to analysts through a web dashboard.

The product is explicitly framed as a **decision-support tool for analysts, not an enforcement engine**. Every surface of the UI communicates that outputs are *risk signals for review*, and analysts can thumbs-up / thumbs-down every prediction. Those judgments become the long-term ground-truth source for retraining.

### Why this problem

Illicit on-chain activity (wash trading, mixer hops through Tornado Cash, phishing drainers, MEV bot clusters, layering to obscure provenance) costs the ecosystem billions annually and is hard to identify manually because Ethereum is pseudonymous and high-volume. A well-calibrated ML triage layer can rank the million-plus active addresses each week into a short worklist, which is the exact workflow compliance teams at exchanges and forensics firms run today.

### What "success" looks like for the class project

A reviewer (professor/TA) opens the public dashboard, pastes an Ethereum address, and within a few seconds sees a risk score, confidence band, top-3 **model attributions** (contributions + raw feature values), and—when Supabase is configured—a thumbs-up/down affordance tied to a `prediction_id`. Under the hood, the FastAPI service engineers **live** features (Etherscan), runs **XGBoost** when a checkpoint is present (trained offline on BigQuery + weak labels), optionally **persists** the row to Supabase, and **records feedback** when the DB is wired.

---

## 2. Expected deliverables (design) vs. repository status

The course asks for a full-lifecycle system. The table below separates **intent** from what you should verify before calling the project “done” for a grader.

| Deliverable | What “done” means | Typical status |
|-------------|-------------------|----------------|
| **Deployed dashboard** | Next.js on Vercel (or similar), public URL | **You confirm** deploy + env (`NEXT_PUBLIC_API_URL`). |
| **Deployed API** | FastAPI with `/health`, `/analyze`, `/feedback`, `/stats`, OpenAPI `/docs` | **Shipped in repo**; production URL + secrets **you confirm**. |
| **Real XGBoost model** | Booster at `ml/checkpoints/xgb.json` (or `MODEL_PATH`), loaded in-process | **Shipped when checkpoint committed or baked into image**; else heuristic fallback is honest behavior. |
| **`models` table production flag** | DDL + optional row with `is_production` | **Schema exists** (`data/supabase/migrations/001_initial.sql`); **promotion workflow** is manual unless automated. |
| **Data pipeline** | BigQuery extract ≤ 5 GB/query, Snorkel LFs, Parquet artifacts | **Code + scripts** in `data/`; **run outputs** (Parquet sizes, row counts) **you report** in the writeup. |
| **Feedback loop** | Thumbs → `feedback` table | **Shipped** when Supabase env vars set; **disabled** otherwise (UI copy reflects this). |
| **W&B** | Training runs logged | **Supported in training code**; **verify** a run link exists for the class submission. |
| **Documentation** | ADRs, architecture, setup, summary | **In `docs/`**; keep this file aligned with code. |
| **CI** | Lint + tests green | **`.github/workflows/ci.yml`** runs web + api + ml jobs. |

---

## 3. Data Sources (In Detail)

Data is the bottleneck of this project, not modeling. Everything below is free, public, and reproducible from the scripts in `data/src/bb_data/`.

### 3.1 Raw on-chain transactions — BigQuery `bigquery-public-data.crypto_ethereum`

**What it is.** Google's maintained, always-fresh public dataset of the full Ethereum mainnet history. Maintained by the Google Cloud Public Datasets team; freshness is typically <24 hours behind chain tip.

**Tables we actually use:**

| Table | Why |
|---|---|
| `transactions` | Address-to-address txs: `from_address`, `to_address`, `value`, `gas`, `gas_price`, `block_timestamp`, `receipt_status`. This is the backbone of all behavioral features. |
| `traces` | Internal transactions (contract-to-contract calls triggered by an outer tx). Needed to catch value moved through contracts, not just EOA-to-EOA. |
| `token_transfers` | ERC-20 transfer events. Drives `token_diversity` and stablecoin-flow features. |
| `contracts` | Deployed contract metadata (bytecode hash, is_erc20, is_erc721). Supports the "verified contract only" labeling function. |
| `logs` | Raw event logs — used sparingly because they're expensive to query; only scanned when we need a specific topic (e.g., Tornado pool `Deposit` events). |

**Scope of what we pull.** We do *not* pull the full 2+ TB history. The extraction script in `data/src/bb_data/bigquery_extract.py` filters on the `block_timestamp` partition, starts with a two-week window, and is hard-capped at `SAFE_GB = 5` per query. Every query is preceded by a `dryRun` that returns `totalBytesProcessed`; if it exceeds the ceiling, the script aborts before billing.

**How much that yields.** ~2 weeks of mainnet activity against a Tornado-adjacent seed set ≈ ~15 M transactions, which aggregates to ~400 k distinct wallets, of which ~50 k survive the labeling stage with a non-abstain label. That's the training set.

**Cost.** BigQuery's on-demand free tier is 1 TB scanned per month. Our pipeline budget is 20 GB/month (4× our 5 GB ceiling), well inside the free tier. A `$5` GCP budget alert is wired up as a hard tripwire.

**Why BigQuery over alternatives.** Running an Erigon / Reth archive node locally to query the chain directly requires ~2 TB of disk and a week of sync. Free RPC endpoints (Alchemy / Infura free tiers) rate-limit at a pace that would take months for a 50 k-wallet pull. BigQuery is the only free, fast path at class scale.

### 3.2 Sanctions labels — OFAC Specially Designated Nationals (SDN) list

**Source.** U.S. Treasury Office of Foreign Assets Control (OFAC) — `https://www.treasury.gov/ofac/downloads/sdn.xml` and the SDN "Consolidated" download. OFAC has been publishing Ethereum addresses inline in SDN entries since 2018 (notably the Tornado Cash designation in August 2022).

**What we extract.** Every `0x…` 40-hex-char address that appears in an SDN entry, tagged with the associated program code (e.g., `SDGT`, `CYBER2`, `RUSSIA-EO14024`). Re-fetched weekly.

**Role in pipeline.** Drives the `lf_sdn_match` labeling function → `SANCTIONED` class. This is the only *hard* label in the system: matches are treated as near-ground-truth by the Snorkel LabelModel (very low noise prior).

**Volume.** Low hundreds of addresses — small but extremely high-precision.

**Script.** `data/src/bb_data/label_sources.py::fetch_ofac_addresses()`.

### 3.3 Scam / phishing labels — CryptoScamDB

**Source.** CryptoScamDB — `https://cryptoscamdb.org/` — a community-maintained, MIT-licensed registry of known scam URLs and addresses. Published as a JSON feed at `https://api.cryptoscamdb.org/v1/addresses`.

**What we extract.** Addresses tagged `scam` or `phishing`, filtered to `coin: ETH`. Each entry carries a reporter, first-seen date, and a short description we keep in `labels.metadata` for audit.

**Role in pipeline.** Drives `lf_cryptoscamdb` → `PHISHING`. Medium-precision label; Snorkel down-weights it appropriately if the LabelModel sees disagreement with other LFs.

**Volume.** ~15 k Ethereum addresses at time of writing.

**Caveat.** CryptoScamDB has known false positives (legitimate addresses reported by angry users). We mitigate by requiring at least one other corroborating signal before a wallet lands in the high-confidence train set.

### 3.4 Mixer labels — Tornado Cash pool addresses

**Source.** On-chain — the four canonical Tornado Cash mainnet pool contracts for 0.1, 1, 10, and 100 ETH denominations (pre-sanction, but still relevant as behavioral signals). Addresses hardcoded in `data/src/bb_data/label_sources.py::TORNADO_POOLS`.

**What we extract.** Every address that has sent or received from one of those four pools, together with tx count and last-interaction block. We also pull `Deposit` / `Withdrawal` event logs for temporal pairing heuristics (useful to flag wallets that deposited and withdrew on similar timelines — a layering signature).

**Role in pipeline.** Drives `lf_tornado_proximity` (≥3 txs to any pool) → `MIXER_USAGE`. Also drives the `tornado_tx_count` feature directly, independent of labels.

**Volume.** Tens of thousands of addresses have touched Tornado pools; we take the subset that also intersects our BigQuery transaction window.

### 3.5 Exchange (CEX) deposit addresses — whitelist

**Source.** Curated union of (a) Etherscan's "Exchange" address tag list (accessed via Etherscan API) and (b) the open `ethereum-lists/tokens` + `ethereum-lists/contracts` repos on GitHub. We take the deposit-wallet subset, not the cold-storage subset.

**Role in pipeline.** Drives `lf_cex_whitelist` → `LEGITIMATE`. Reduces false-positive pressure on the `BOT_ACTIVITY` class, because CEX deposit wallets otherwise look like high-frequency bots.

**Volume.** ~5 k CEX-tagged addresses across the top 20 centralized exchanges.

### 3.6 Verified contracts — Etherscan

**Source.** Etherscan API — `https://api.etherscan.io/api?module=contract&action=getsourcecode&address=…`. Requires a free Etherscan API key (`ETHERSCAN_API_KEY` env var).

**What we extract.** `IsVerified` bit and `ContractName` for every contract address a wallet interacts with. Cached locally in a DuckDB table so we don't re-query the same contract twice.

**Role in pipeline.** Drives `lf_verified_contract_only` → `LEGITIMATE` (wallets that only interact with audited, verified contracts are overwhelmingly retail users). Also powers the `contract_call_ratio` and `verified_contract_call_ratio` features.

**Rate limits.** Free tier is 5 requests/second. Enough, given the DuckDB cache.

### 3.7 MEV / bot contract addresses — public MEV research

**Source.** Hand-curated list of well-known MEV searcher / router / builder addresses pulled from Flashbots' public research, EigenPhi dashboards, and MEV-Explore. Maintained as a checked-in CSV at `data/label_sources/mev_addresses.csv` with provenance for each row.

**Role in pipeline.** Drives `lf_mev_interactions` → `BOT_ACTIVITY`. Also drives the `mev_contract_calls` feature.

**Volume.** ~300 addresses. Small but very high-signal.

### 3.8 Hack postmortems — Rekt News (optional)

**Source.** Rekt News — `https://rekt.news/` — a long-form postmortem archive for major DeFi exploits, each including attacker and drainer addresses.

**Role in pipeline.** Adds a small, very-high-precision `PHISHING` / `SANCTIONED` seed. Used mostly for the hand-curated evaluation set, not the main train set (volume is too small to matter in aggregate).

**Volume.** ~400 attacker addresses from 2020–present.

### 3.9 Analyst feedback — Supabase `feedback` table

**Source.** *Us* — the thumbs-up / thumbs-down events emitted from the dashboard.

**Schema.** `prediction_id`, `verdict ∈ {correct, incorrect}`, optional `correct_label`, `analyst_id`, `created_at`.

**Role in pipeline.** Primary ground-truth correction during retraining. Every weekly train pulls the `feedback` table and either (a) flips the noisy Snorkel label on that wallet, or (b) adds it as a high-weight training example. This is the *only* fully supervised signal in the system.

### 3.10 Held-out evaluation set — hand-curated

**Source.** A manually assembled CSV of ~500 addresses with researcher-confirmed labels, spanning all five classes. Built from the intersection of (a) Chainabuse public reports, (b) Rekt News postmortems, (c) OFAC SDN, and (d) 100 random wallets labeled `LEGITIMATE` after manual inspection.

**Role in pipeline.** Never enters training or Snorkel. Reserved exclusively for final evaluation (AP, ECE, per-class PR curves). This is the set the reviewer's metrics in the writeup are reported against.

### 3.11 Data-source summary table

| # | Source | Kind | License / Terms | Volume | Feeds |
|---|---|---|---|---|---|
| 1 | BigQuery `crypto_ethereum` | Raw transactions | Google Public Data, free tier | 2 TB available; 20 GB/mo used | All features |
| 2 | OFAC SDN | Sanctions labels | U.S. government public record | ~400 ETH addresses | `lf_sdn_match` |
| 3 | CryptoScamDB | Scam labels | MIT | ~15 k addresses | `lf_cryptoscamdb` |
| 4 | Tornado Cash pools | Mixer labels | On-chain, public | 4 pool contracts; tens of thousands of interactors | `lf_tornado_proximity`, features |
| 5 | Etherscan tags | CEX labels | Etherscan API free tier (5 req/s) | ~5 k CEX addresses | `lf_cex_whitelist` |
| 6 | Etherscan contract API | Contract verification | Etherscan API free tier | On-demand per contract | `lf_verified_contract_only`, features |
| 7 | MEV address list | Bot labels | Hand-curated, citations checked in | ~300 addresses | `lf_mev_interactions`, features |
| 8 | Rekt News | Hack postmortems | Editorial, cited per entry | ~400 attacker addresses | Eval set |
| 9 | Supabase `feedback` | Analyst labels | Generated by this project | Grows over time | Retraining ground truth |
| 10 | Hand-curated eval set | Gold labels | Internal | ~500 addresses | Final evaluation only |

### 3.12 Reproducibility

Every external source above is fetched by a script under `data/src/bb_data/`, writes a Parquet into `data/artifacts/YYYY-MM-DD/`, and logs the fetch (URL, row count, SHA-256) to stderr so a reviewer can re-run the pipeline and obtain an identical dataset.

### 3.13 Ethics and licensing

All sources are either U.S. government public record (OFAC), MIT-licensed (CryptoScamDB, ethereum-lists), public on-chain data (BigQuery, Tornado Cash), or consumed within documented API terms (Etherscan). No scraping of non-public data. No PII — Ethereum addresses are pseudonymous identifiers by design. The trained model never leaves the Fly.io instance, and no raw user-submitted address is logged to any third party other than Supabase (which is itself the project's DB).

---

## 4. Models

### 4.1 Primary model — XGBoost gradient-boosted trees

Chosen because it is the simplest model that produces strong, calibrated multi-class probabilities on tabular behavioral features, with minimal infrastructure (one `.json` booster file, loads in-process, no GPU needed at serve time).

Configuration (`ml/src/blockchain_bandits_ml/train.py`):

- `objective: multi:softprob`, `num_class: 5`
- `tree_method: hist`, `max_depth: 6`, `eta: 0.1`, `subsample: 0.8`
- **Focal loss** re-weighting to handle the heavy class imbalance (legitimate dominates).
- **Temporal cross-validation** — splits by wallet first-seen block, never by random shuffle, to avoid leakage from future behavior into training.
- **Isotonic regression calibration** per class after training, so that a "0.8 phishing" prediction actually means ~80% of such wallets are phishing. Measured via Expected Calibration Error (ECE).
- Target performance: **Average Precision ≥ 0.8** on the temporal test slice, **ECE ≤ 0.05** on the top-decile bucket.

### 4.2 Weak supervision — Snorkel LabelModel

Hand labels are scarce. Snorkel's `LabelModel` aggregates eight labeling functions (each backed by one of the data sources in Section 3) into probabilistic labels across ~50 k wallets:

1. `lf_sdn_match` — OFAC SDN hit → `SANCTIONED`
2. `lf_cryptoscamdb` — CryptoScamDB scam/phishing → `PHISHING`
3. `lf_tornado_proximity` — ≥3 txs to a Tornado pool → `MIXER_USAGE`
4. `lf_high_freq_low_value` — high tx frequency + low mean value → `BOT_ACTIVITY`
5. `lf_mev_interactions` — interacts with known MEV contracts → `BOT_ACTIVITY`
6. `lf_cex_whitelist` — known CEX deposit address → `LEGITIMATE`
7. `lf_verified_contract_only` — only touches verified contracts → `LEGITIMATE`
8. `lf_short_lifetime_high_fanout` — short lifetime + high fan-out → `PHISHING`

Agreement statistics are logged to W&B; the LabelModel's per-class accuracy estimates are the upper bound on what XGBoost can learn.

### 4.3 Explanations — XGBoost contributions (SHAP-compatible)

For **XGBoost** predictions, the API extracts **per-feature contributions** via the booster’s **`pred_contribs`** output (exact tree SHAP values for the boosted trees model). The top-3 features by absolute contribution are returned with their raw values as `top_features`. The **heuristic** path synthesizes analogous “contribution” weights from feature magnitudes so the UI always has three rows to show.

This satisfies the rubric’s interpretability requirement without requiring a separate `shap` dependency at inference time.

### 4.4 Stretch — Graph Neural Network

Planned for Week 6 as a lift experiment. 2-hop ego-subgraph builder around each queried wallet, heterogeneous GNN (R-GCN or HGT) in PyTorch Geometric, trained on Colab Pro A100. Only promoted to production if it beats XGBoost by **AP lift ≥ 0.03** on the held-out temporal slice. Otherwise ship XGBoost and write up the negative result.

### 4.5 Stretch — Claude Haiku natural-language explanations

An optional "Ask Claude to interpret" button on the wallet detail page sends the top features + SHAP values + transaction summary stats to Haiku and renders a plain-English paragraph. This is a UX affordance, not a model — Claude never produces the risk score itself.

### 4.6 Feature set (~20 features per wallet)

Activity: tx counts in/out, unique counterparties, counterparty diversity (entropy), tx frequency per day, inter-arrival mean/variance.
Value: total and mean ETH moved, round-value ratio (bots tend to send exact round amounts).
Topology: fan-in/fan-out ratios.
Temporal: first seen days ago, last seen days ago, lifetime days.
Contract: token diversity, verified-contract call ratio, internal-tx ratio.
Risk proximity: Tornado Cash tx count, MEV contract calls.

Full list: `ml/src/blockchain_bandits_ml/features.FEATURE_COLUMNS`.

---

## 5. Tech Stack

| Layer | Choice | Host | Cost |
|---|---|---|---|
| Frontend | Next.js 14 (App Router), TypeScript, Tailwind, custom UI | Vercel Hobby | $0 |
| API | FastAPI, Pydantic v2; Supabase via `supabase-py` when configured (not SQLAlchemy ORM) | Fly.io free tier | $0 |
| ML inference | XGBoost booster loaded in-process | Same FastAPI process | $0 |
| Database | Postgres + RLS policies | Supabase free tier | $0 |
| Raw data | `crypto_ethereum` public dataset | BigQuery | ~$0 under 5 GB/query |
| Label sources | OFAC, CryptoScamDB, Etherscan, MEV lists | Public APIs / files | $0 |
| Training | Notebooks on GPU | Google Colab Pro (Cornell .edu) | already paid |
| Experiment tracking | Runs + artifacts | Weights & Biases free | $0 |
| CI | Lint + typecheck + tests | GitHub Actions free minutes | $0 |

**Total steady-state cost target: $0 to low single digits per month.**

### 5.1 Why these choices (short version)

- **Next.js on Vercel** — zero-config SSR, free preview URLs per PR, Tailwind ecosystem.
- **FastAPI on Fly.io** — Python-native (keeps XGBoost + contribution extraction in one runtime), async-capable, auto-generated OpenAPI, free tier hard-caps cost.
- **XGBoost in-process rather than Modal** — the model loads from a 20–100 MB `.json` file in milliseconds; no separate GPU-backed inference service needed at class-project scale.
- **Supabase Postgres (auth unused)** — managed Postgres + migrations + RLS for free. Auth is deliberately turned off because the reviewer is the only user.
- **BigQuery over a local ETL** — the full Ethereum chain is ~2 TB; partitioned SQL is the only affordable path in.
- **Colab Pro over local / cloud GPU** — a Cornell .edu already unlocks A100/V100. Paying for a cloud GPU would be strictly worse.

### 5.2 Rejected alternatives (from ADR 0001)

All-AWS (egress fees), Modal + R2 (too many moving parts for class scope), Railway for everything (works but redundant with free tiers), Supabase Edge Functions instead of FastAPI (Deno runtime excludes the Python ML ecosystem). Documented in `docs/0001-tech-stack.md`.

### 5.3 Repo layout

```
blockchain-bandits/
├── web/                 # Next.js analyst dashboard
├── api/                 # FastAPI + scoring (`api/fly.toml` for deploy)
├── ml/                  # Training code + Colab notebooks
├── data/                # ETL, label sources, `supabase/migrations`
├── .github/workflows/   # CI (web build, api/ml pytest + ruff)
├── docs/                # ADRs, architecture, this summary
├── Makefile
├── pnpm-workspace.yaml
└── pyproject.toml       # Root Python tooling (ruff, etc.)
```

---

## 6. Architecture

```
            ┌─────────────────┐
            │ Next.js/Vercel  │  ← analyst dashboard
            └────────┬────────┘
                     │ REST (TanStack Query)
            ┌────────▼────────┐
            │ FastAPI/Fly.io  │  ← features + XGBoost / heuristic
            └────┬──────┬─────┘
                 │      │
       Etherscan  │      │  (optional)
       API v2     │      ▼
       (live tx   │   ┌──────────────┐     ┌──────────────┐
        features)  │   │ Supabase PG  │     │ Colab / local │
                 └──►│ predictions, │     │ training      │
                     │ feedback,    │     │ (BigQuery →    │
                     │ labels,      │     │  Parquet)      │
                     │ models       │     └────────┬───────┘
                     └──────────────┘              │
                                                   ▼
                        ┌──────────────────────────────────┐
                        │ BigQuery (ETH) + weak label files  │
                        │ (OFAC, CryptoScamDB, Tornado, MEV) │
                        └──────────────────────────────────┘
```

### 6.1 Data flow summary

- **Read path (production):** analyst pastes `0x…` → Next.js `POST /analyze` → FastAPI → **Etherscan-backed feature row** → in-process **XGBoost** (or heuristic) → **top-3 contributions** → JSON response → **optional** persist to `predictions` if Supabase configured.
- **Write path:** thumbs up/down → `POST /feedback` → row in `feedback` table (joined during retraining).
- **Training path (weekly):** Colab notebook pulls fresh BigQuery txs → refreshes OFAC / CryptoScamDB / Etherscan / MEV label sources → runs Snorkel LabelModel → applies `feedback` corrections → retrains XGBoost → saves booster + calibrators → inserts `models` row → manually flip `is_production=true`.

### 6.2 Boundary rules

The UI **never** reads from Postgres directly; only through FastAPI. FastAPI **owns** all writes and inference serving. One serving path, not two.

### 6.3 Database schema (Supabase)

- `wallets(address PK with 0x regex check, first_seen, last_seen_onchain, notes)`
- `predictions(id uuid PK, wallet, label check constraint, risk_score [0,1], confidence [0,1], top_features jsonb, model_version, scored_at)`
- `feedback(id uuid PK, prediction_id FK, verdict check(correct/incorrect), correct_label, analyst_id, created_at)`
- `labels(address, label, source PK composite)` — OFAC / CryptoScamDB / Tornado / Etherscan / MEV imports
- `models(version PK, trained_at, metrics jsonb, is_production bool)` with a partial unique index enforcing a single production model.

Full DDL in `data/supabase/migrations/001_initial.sql`.

---

## 7. Implementation Roadmap (8 Weeks)

### Week 1 — Skeleton deployed
Monorepo scaffolded, GitHub repo connected to Vercel + Fly + Supabase, `/health` green in production, dashboard renders mock data at a public URL.

### Week 2 — Data pipeline
BigQuery service account + GCP billing alert at $5. One week of transactions pulled to Parquet (Tornado-adjacent slice). OFAC + CryptoScamDB + Etherscan CEX + MEV loaders produce a unified labels Parquet. `bigquery_extract.py` enforced under `SAFE_GB=5`.

### Week 3 — Features + weak labels
`features.engineer` implemented and unit-tested. ~20 features per wallet materialised. Snorkel LabelModel fitted; per-class agreement stats logged to W&B. Combined labeled dataset ~50 k wallets.

### Week 4 — XGBoost baseline
Train on Colab Pro with W&B logging. Temporal CV, focal loss, isotonic calibration. Target AP ≥ 0.8 on temporal test slice. Booster + calibrators saved locally and versioned into `models` table.

### Week 5 — Inference + feedback loop live
FastAPI loads the real XGBoost model directly from `ml/checkpoints/xgb.json`. `/analyze` returns real scores and SHAP top-3. `/feedback` writes to Supabase. The mock scorer is removed.

### Week 6 — GNN (stretch, A)
2-hop ego-subgraph builder. R-GCN or HGT in PyG, trained on Colab Pro A100. Offline comparison vs. XGBoost; promote only if AP lift ≥ 0.03.

### Week 7 — Polish (stretch, B)
Cytoscape.js ego-graph viz on the wallet detail page. "Ask Claude" button wired to Haiku for plain-English explanations. Drift monitoring cron (ECE on last 7 days of predictions vs. feedback).

### Week 8 — Demo + writeup
Assignment 2 rubric re-check. Slides + recorded demo. `docs/setup.md` finalised with production URLs. `make test` green across all packages.

### Scope-cut priority (if weeks slip)
Cut earliest-first: ego-graph viz → GNN → LLM explanations → drift monitoring. The non-negotiable core is **XGBoost baseline + feedback loop + deployed dashboard**.

---

## 8. Risks and Mitigations

| Risk | Mitigation |
|---|---|
| BigQuery query blows past free tier | `SAFE_GB=5` ceiling, dry-run first, abort if over. GCP budget alert at $5. |
| CryptoScamDB false positives poison labels | Require ≥2 corroborating LFs before a wallet enters the high-confidence train split. |
| OFAC list update drifts silently | Weekly cron re-fetches SDN XML and logs a diff; alerts on unexpected shrinkage. |
| Etherscan rate limit hits during label refresh | Local DuckDB cache; backoff + resume; batch at 5 req/s. |
| Model never hits AP 0.8 because Snorkel labels are too noisy | Iterate on LFs using agreement stats; hand-label 200 uncertain wallets as a calibration set. |
| Fly.io free tier sleeps the API → cold start on demo | Keep the container warm with a cron ping; demo from a pre-warmed session. |
| Supabase free-tier storage ceiling | Keep only latest N predictions per wallet; rotate older rows to a Parquet archive. |
| GNN underperforms XGBoost | Ship XGBoost only. The AP-lift threshold exists precisely to avoid shipping complexity for complexity's sake. |
| Model file missing on Fly during deploy | CI uploads `ml/checkpoints/xgb.json` as part of the Docker build context; deploy fails loud if the file is absent. |

---

## 9. What's Intentionally Out of Scope

- User accounts / login (reviewer is the only user).
- Multi-chain support (Ethereum mainnet only — Solana / Polygon / L2s are a follow-on).
- Real-time streaming ingestion (weekly batch training is sufficient).
- Production-grade observability (no Sentry, no Datadog; W&B + Fly logs are enough).
- Serverless GPU inference via Modal (XGBoost is fast enough in-process).
- Object storage via R2 (local `ml/checkpoints/` + Drive backup is enough at class scale).
- Paid data providers (Chainalysis, TRM Labs, Elliptic) — this project stays on public sources by design.

These are not "missing features" — they are deliberate cuts documented in the ADRs so the reviewer sees a clear, defended scope.

---

## 10. How the Project Satisfies the Rubric

- **Data collection:** BigQuery `crypto_ethereum` + OFAC SDN + CryptoScamDB + Tornado Cash pool addresses + Etherscan API + curated MEV list — all cited, all reproducible via scripts in `data/src/bb_data/`.
- **Labels:** Snorkel LabelModel over 8 labeling functions; agreement + coverage stats logged to W&B.
- **Training:** Temporal CV, focal loss, isotonic calibration, W&B-tracked experiments.
- **Evaluation:** Average Precision and Expected Calibration Error as primary metrics on a hand-curated held-out set, not the Snorkel-labeled data. Full confusion matrix and per-class PR curves reported.
- **Deployment:** Public dashboard URL, public API URL with OpenAPI docs, reproducible `make dev` bootstrap.
- **Interpretability:** Top-3 **XGBoost contributions** (or heuristic proxy) rendered on every prediction; optional Claude Haiku paragraph (stretch).
- **Feedback loop:** thumbs up/down persists to Postgres; retraining joins this table.
- **Ethics:** explicit "risk signals, not enforcement decisions" disclaimer on every page; analyst feedback is the correction mechanism; model does not auto-freeze, auto-block, or auto-report any wallet. All data sources are public-record or permissively licensed.

---

## 11. One-Line Pitch

*A calibrated, explainable, analyst-in-the-loop risk triage layer for Ethereum wallets — built on free tiers, trained on real BigQuery data stitched together with OFAC, CryptoScamDB, Tornado Cash, Etherscan and curated MEV sources, and designed so its outputs stay decision-support rather than decision-automation.*
