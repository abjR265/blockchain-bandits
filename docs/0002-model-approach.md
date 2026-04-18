# ADR 0002 — Model approach: XGBoost first, GNN second

**Status:** Accepted · Date: 2026-04-18

## Context

The project narrative is "graph neural network over Ethereum transaction
graphs." GNNs are genuinely well-matched to this problem (heterogeneous
edges, neighbourhood signal, evolving graph). But they're also:

- Expensive to train,
- Easy to get wrong (temporal leakage, subgraph sampling bias, oversmoothing),
- Not always better than a well-tuned tabular baseline.

## Decision

Ship in two model phases:

1. **Phase A — XGBoost on tabular wallet features.** ~20 engineered features
   per wallet (centrality, fan-out, inter-arrival variance, token diversity,
   mixer proximity, MEV interactions, lifetime, etc.). Multiclass softprob
   with 5 classes. Focal-loss weighting for class imbalance. Temporal CV.
   Isotonic calibration on the val slice.

2. **Phase B — Heterogeneous GNN** (R-GCN or HGT in PyG) over 2-hop
   ego-subgraphs. Produces a 128-d embedding concatenated with the tabular
   features, scored by an XGBoost head. Only promoted if it meaningfully
   beats Phase A on the test set.

## Rationale

- Phase A trains in minutes on a laptop CPU. It unblocks every downstream
  component (API, UI, feedback loop) so we're not single-threaded on model
  work.
- A tabular baseline is the only defensible way to answer "does the GNN
  actually help?" If XGBoost hits 0.85 average precision, a GNN that only
  gets to 0.87 isn't worth the serving complexity.
- Phase B risks are front-loaded: if it fails, the project still ships.

## Metrics

Primary: **average precision** (robust to class imbalance) and **expected
calibration error** (scores are displayed as probabilities in the UI, so
they must actually mean what they claim).

Secondary: precision@K (analyst triage efficiency), macro-F1 per class.

## Non-decisions (deferred)

- LLM-as-judge evaluation: not needed. Labels come from objective sources
  (OFAC, CryptoScamDB). Revisit only if we extend to subjective categories.
- Pre-training a foundation model from scratch: explicitly out of scope.
- Temporal GNNs (TGAT, TGN): interesting but a different project.
