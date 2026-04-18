# ml

Training code, Colab notebooks, and the Modal inference app.

## Layout

```
ml/
├── src/blockchain_bandits_ml/
│   ├── features.py      # wallet-level feature engineering
│   ├── labeling.py      # Snorkel labeling functions
│   ├── train.py         # XGBoost training (temporal CV + isotonic calibration)
│   └── explain.py       # SHAP top-k per prediction
├── notebooks/           # Colab-ready .py scripts (paste into cells)
│   ├── 00_colab_setup.py
│   ├── 01_explore_bigquery.py
│   ├── 02_feature_engineering.py
│   ├── 03_train_xgboost.py
│   └── 04_snorkel_labeling.py
├── modal_app.py         # Modal inference + training entrypoint
└── tests/
```

## Dev

```bash
uv sync
uv run pytest
```

## Colab workflow

1. Open a new Colab Pro notebook
2. Paste the content of `notebooks/00_colab_setup.py` and run
3. Paste the content of whichever notebook you're working on
4. Checkpoints write to Google Drive; the "production" model is copied to R2

## Modal

```bash
modal deploy modal_app.py
modal run modal_app.py --address 0x<address>
```

## Model approach

See [`docs/0002-model-approach.md`](../docs/0002-model-approach.md). Short
version: XGBoost on tabular wallet features (5-class) as the v1 baseline,
GraphSAGE over heterogeneous ego-subgraphs as a week-7 stretch.
