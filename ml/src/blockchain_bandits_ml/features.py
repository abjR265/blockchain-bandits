"""Wallet-level feature engineering.

Input: transaction-level dataframe with columns
    [from_address, to_address, value_eth, gas, block_timestamp,
     token_type, method_id, is_internal]

Output: wallet-level dataframe keyed on `address`, with one row per wallet
and ~20 engineered features.
"""

from __future__ import annotations

import pandas as pd

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


def engineer(txs: pd.DataFrame, now_ts: pd.Timestamp | None = None) -> pd.DataFrame:
    """Produce a wallet-level feature frame.

    Stub: fill in for week 2. The contract is the schema above.
    """
    if now_ts is None:
        now_ts = pd.Timestamp.utcnow()

    # --- Stub body. Replace with real implementation. ---
    raise NotImplementedError(
        "Implement feature engineering against the tx dataframe. "
        "See docs/roadmap.md week 2."
    )
