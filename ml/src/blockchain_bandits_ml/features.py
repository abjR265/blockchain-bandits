"""Wallet-level feature engineering.

Input: transaction-level dataframe with columns
    [from_address, to_address, value_eth, gas, block_timestamp,
     token_type, method_id, is_internal]

Output: wallet-level dataframe keyed on `address`, with one row per wallet
and ~20 engineered features.
"""

from __future__ import annotations

import hashlib
from functools import lru_cache
from pathlib import Path

import numpy as np
import pandas as pd

# Same canonical pool list as `data/src/bb_data/label_sources.py` (mainnet ETH pools).
TORNADO_ETH_POOLS: frozenset[str] = frozenset(
    a.lower()
    for a in (
        "0x12d66f87a04a9e220743712ce6d9bb1b5616b8fc",
        "0x47ce0c6ed5b0ce3d3a51fdb1c52dc66a7c3c2936",
        "0x910cbd523d972eb0a6f4cae4618ad62622b39dbf",
        "0xa160cdab225685da1d56aa342ad8841c3b53f291",
    )
)

FEATURE_COLUMNS: list[str] = [
    "tx_count_in",
    "tx_count_out",
    "unique_counterparties",
    "counterparty_diversity",
    "tx_frequency_per_day",
    "inter_arrival_mean",
    "inter_arrival_var",
    "value_sum_eth",
    "value_mean_eth",
    "value_round_ratio",
    "fan_out_ratio",
    "fan_in_ratio",
    "first_seen_days",
    "last_seen_days",
    "lifetime_days",
    "token_diversity",
    "contract_call_ratio",
    "internal_tx_ratio",
    "tornado_tx_count",
    "mev_contract_calls",
]


@lru_cache(maxsize=1)
def _mev_address_set() -> frozenset[str]:
    """Load optional MEV / searcher addresses (lowercase hex)."""
    candidates = [
        Path(__file__).resolve().parent / "mev_addresses.csv",
        Path(__file__).resolve().parents[3] / "data" / "label_sources" / "mev_addresses.csv",
    ]
    for p in candidates:
        if not p.is_file():
            continue
        lines = p.read_text(encoding="utf-8").strip().splitlines()
        out: set[str] = set()
        for line in lines[1:]:
            line = line.strip()
            if not line or line.startswith("#"):
                continue
            addr = line.split(",")[0].strip().lower()
            if addr.startswith("0x") and len(addr) == 42:
                out.add(addr)
        return frozenset(out)
    return frozenset()


def _entropy_from_counts(counts: np.ndarray) -> float:
    total = counts.sum()
    if total <= 0:
        return 0.0
    p = counts[counts > 0] / total
    return float(-(p * np.log(p + 1e-12)).sum())


def _normalize_tx_df(txs: pd.DataFrame) -> pd.DataFrame:
    df = txs.copy()
    df.columns = [str(c).lower() for c in df.columns]
    defaults: dict = {
        "value_eth": 0.0,
        "gas": 21000.0,
        "token_type": "ETH",
        "method_id": "",
        "is_internal": False,
    }
    for col, val in defaults.items():
        if col not in df.columns:
            df[col] = val
    df["from_address"] = df["from_address"].astype(str).str.lower()
    df["to_address"] = df["to_address"].astype(str).str.lower()
    df["block_timestamp"] = pd.to_datetime(df["block_timestamp"], utc=True)
    df["value_eth"] = pd.to_numeric(df["value_eth"], errors="coerce").fillna(0.0)
    df["gas"] = pd.to_numeric(df["gas"], errors="coerce").fillna(21000.0)
    df["is_internal"] = df["is_internal"].astype(bool)
    return df


def engineer(txs: pd.DataFrame, now_ts: pd.Timestamp | None = None) -> pd.DataFrame:
    """Produce a wallet-level feature frame (one row per address appearing in txs)."""
    if now_ts is None:
        now_ts = pd.Timestamp.now(tz="UTC")
    elif now_ts.tzinfo is None:
        now_ts = now_ts.tz_localize("UTC")

    if txs.empty:
        return pd.DataFrame(columns=["address", *FEATURE_COLUMNS])

    df = _normalize_tx_df(txs)
    tornado = TORNADO_ETH_POOLS
    mev = _mev_address_set()

    wallets = pd.unique(pd.concat([df["from_address"], df["to_address"]], ignore_index=True))
    rows: list[dict] = []

    for w in wallets:
        if not isinstance(w, str) or not w.startswith("0x"):
            continue
        mask = (df["from_address"] == w) | (df["to_address"] == w)
        sub = df.loc[mask]
        if sub.empty:
            continue

        tx_out = sub[sub["from_address"] == w]
        tx_in = sub[sub["to_address"] == w]
        tx_count_out = int(len(tx_out))
        tx_count_in = int(len(tx_in))
        total_tx = tx_count_in + tx_count_out

        counterparties: set[str] = set()
        counterparties.update(tx_out["to_address"].tolist())
        counterparties.update(tx_in["from_address"].tolist())
        counterparties.discard(w)
        unique_counterparties = len(counterparties)

        # Diversity: entropy of edge counts to counterparties (approximate).
        if not counterparties:
            counterparty_diversity = 0.0
        else:
            counts: list[int] = []
            for c in counterparties:
                n_to = int(((tx_out["to_address"] == c)).sum())
                n_from = int(((tx_in["from_address"] == c)).sum())
                counts.append(n_to + n_from)
            counterparty_diversity = _entropy_from_counts(np.array(counts, dtype=float))

        ts_series = pd.concat(
            [tx_out["block_timestamp"], tx_in["block_timestamp"]], ignore_index=True
        ).sort_values()
        if len(ts_series) > 1:
            deltas = ts_series.diff().dt.total_seconds().iloc[1:]
            inter_arrival_mean = float(deltas.mean())
            inter_arrival_var = float(deltas.var())
        else:
            inter_arrival_mean = 0.0
            inter_arrival_var = 0.0

        vals = pd.concat([tx_out["value_eth"], tx_in["value_eth"]], ignore_index=True)
        value_sum_eth = float(vals.sum())
        value_mean_eth = float(vals.mean()) if len(vals) else 0.0
        rounded = np.isclose(vals.to_numpy(), np.round(vals.to_numpy()), rtol=0.0, atol=1e-6)
        value_round_ratio = float(rounded.mean()) if len(vals) else 0.0

        ts_min = ts_series.min()
        ts_max = ts_series.max()
        first_seen_days = max(0, int((now_ts - ts_min).total_seconds() // 86400))
        last_seen_days = max(0, int((now_ts - ts_max).total_seconds() // 86400))
        lifetime_days = max(1, int((ts_max - ts_min).total_seconds() // 86400) + 1)
        tx_frequency_per_day = total_tx / lifetime_days

        fan_out_ratio = tx_count_out / max(1, tx_count_in)
        fan_in_ratio = tx_count_in / max(1, tx_count_out)

        token_diversity = float(sub["token_type"].astype(str).nunique())

        gas_vals = pd.concat([tx_out["gas"], tx_in["gas"]], ignore_index=True)
        contract_call_ratio = float((gas_vals > 21000).mean()) if len(gas_vals) else 0.0

        internal_vals = pd.concat([tx_out["is_internal"], tx_in["is_internal"]], ignore_index=True)
        internal_tx_ratio = float(internal_vals.mean()) if len(internal_vals) else 0.0

        tornado_tx_count = 0
        mev_contract_calls = 0
        for _, row in sub.iterrows():
            fa, ta = row["from_address"], row["to_address"]
            if fa in tornado or ta in tornado:
                tornado_tx_count += 1
            if fa in mev or ta in mev:
                mev_contract_calls += 1

        rows.append(
            {
                "address": w,
                "tx_count_in": float(tx_count_in),
                "tx_count_out": float(tx_count_out),
                "unique_counterparties": float(unique_counterparties),
                "counterparty_diversity": float(counterparty_diversity),
                "tx_frequency_per_day": float(tx_frequency_per_day),
                "inter_arrival_mean": float(inter_arrival_mean),
                "inter_arrival_var": float(inter_arrival_var),
                "value_sum_eth": value_sum_eth,
                "value_mean_eth": value_mean_eth,
                "value_round_ratio": float(value_round_ratio),
                "fan_out_ratio": float(fan_out_ratio),
                "fan_in_ratio": float(fan_in_ratio),
                "first_seen_days": float(first_seen_days),
                "last_seen_days": float(last_seen_days),
                "lifetime_days": float(lifetime_days),
                "token_diversity": token_diversity,
                "contract_call_ratio": contract_call_ratio,
                "internal_tx_ratio": internal_tx_ratio,
                "tornado_tx_count": float(tornado_tx_count),
                "mev_contract_calls": float(mev_contract_calls),
            }
        )

    out = pd.DataFrame(rows)
    if out.empty:
        return pd.DataFrame(columns=["address", *FEATURE_COLUMNS])
    return out[["address", *FEATURE_COLUMNS]]


def _random_eth_address(seed: int) -> str:
    rng = np.random.default_rng(seed & 0xFFFFFFFF)
    b = rng.integers(0, 256, size=20, dtype=np.uint8)
    return "0x" + b.tobytes().hex()


def synthetic_transactions_for_address(address: str, n: int = 48) -> pd.DataFrame:
    """Deterministic pseudo-transactions for cold inference when chain data is unavailable."""
    h = int.from_bytes(hashlib.sha256(address.lower().encode()).digest()[:8], "little")
    rng = np.random.default_rng(h)
    addr = address.lower()
    now = pd.Timestamp.now(tz="UTC")
    rows: list[dict] = []
    pools = list(TORNADO_ETH_POOLS)
    for i in range(n):
        ts = now - pd.Timedelta(hours=int(rng.integers(1, 24 * 90)))
        flip = rng.random() > 0.45
        other = _random_eth_address(h + i * 17)
        if rng.random() < 0.08 and pools:
            other = rng.choice(pools)
        val = float(rng.exponential(0.05))
        gas = float(rng.integers(21000, 500_000))
        token = "ETH" if rng.random() > 0.12 else f"TOK{rng.integers(0, 5)}"
        internal = bool(rng.random() < 0.05)
        method = "" if gas <= 21000 else f"0x{rng.integers(0, 2**24):06x}"
        if flip:
            fa, ta = addr, other
        else:
            fa, ta = other, addr
        txh = "0x" + rng.integers(0, 256, size=32, dtype=np.uint8).tobytes().hex()
        rows.append(
            {
                "from_address": fa,
                "to_address": ta,
                "value_eth": val,
                "gas": gas,
                "block_timestamp": ts,
                "token_type": token,
                "method_id": method,
                "is_internal": internal,
                "transaction_hash": txh,
            }
        )
    return pd.DataFrame(rows)


def feature_row_for_address(address: str) -> pd.Series:
    """Single wallet feature vector for inference (synthetic tx history)."""
    txs = synthetic_transactions_for_address(address)
    df = engineer(txs)
    row = df.loc[df["address"] == address.lower()]
    if row.empty:
        return pd.Series({c: 0.0 for c in FEATURE_COLUMNS})
    return row.iloc[0][FEATURE_COLUMNS]

