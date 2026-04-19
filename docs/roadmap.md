# Roadmap

Target: fully working Blockchain-Bandits in 8 weeks, class-friendly and simple.

## Week 1 — Skeleton deployed

- [x] Monorepo scaffolded
- [ ] GitHub repo pushed, connected to Vercel + Fly + Supabase
- [ ] `/health` green in production
- [ ] Dashboard renders mock data at public URL

## Week 2 — Data pipeline

- [ ] BigQuery service account + GCP billing alert at $5
- [ ] One week of transactions pulled to Parquet (Tornado-adjacent slice)
- [ ] OFAC + CryptoScamDB loaders produce a labels parquet
- [ ] `data/src/bb_data/bigquery_extract.py` enforced under SAFE_GB

## Week 3 — Features + weak labels

- [ ] `features.engineer` implemented and tested
- [ ] ~20 features per wallet
- [ ] Snorkel LabelModel fitted; agreement stats logged
- [ ] Combined labeled dataset ~50k wallets

## Week 4 — XGBoost baseline

- [ ] Train on Colab Pro with W&B logging
- [ ] Temporal CV, focal loss, isotonic calibration
- [ ] Target: AP ≥ 0.8 on test slice
- [ ] Booster + calibrators saved locally and versioned

## Week 5 — Inference + feedback loop live

- [ ] FastAPI loads real XGBoost model directly
- [ ] FastAPI serves predictions and persists to Postgres
- [ ] UI shows real scores + SHAP top-3 explanations
- [ ] Feedback thumbs up/down writes to `feedback` table

## Week 6 — GNN (stretch, A)

- [ ] 2-hop ego-subgraph builder
- [ ] R-GCN / HGT in PyG, trained on Colab Pro A100
- [ ] Offline comparison vs. XGBoost — promote only if AP lift ≥ 0.03

## Week 7 — Polish (stretch, B)

- [ ] Ego-graph visualisation (Cytoscape.js) on wallet detail page
- [ ] "Ask Claude" button calling Haiku for plain-English explanations
- [ ] Drift monitoring cron (ECE on last 7 days)

## Week 8 — Demo + writeup

- [ ] Assignment 2 rubric re-check
- [ ] Slides + recorded demo
- [ ] `docs/setup.md` finalised with production URLs
- [ ] `make test` green across all packages

## Scope-cut priority (if weeks slip)

Cut in this order, earliest first: ego-graph viz -> GNN -> LLM explanations ->
drift monitoring. The XGBoost baseline + feedback loop + deployed dashboard is
the non-negotiable core.
