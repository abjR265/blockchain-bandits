"""Snorkel labeling functions for weak supervision.

Each LF returns one of:
    0 = legitimate, 1 = phishing, 2 = mixer_usage, 3 = bot_activity,
    4 = sanctioned, -1 = abstain.

The LabelModel aggregates these per-wallet into probabilistic labels used to
fill in the long tail of unlabeled addresses.
"""

from __future__ import annotations

import pandas as pd

ABSTAIN = -1
LEGITIMATE = 0
PHISHING = 1
MIXER_USAGE = 2
BOT_ACTIVITY = 3
SANCTIONED = 4


# ---- Labeling functions ----
# Each takes a wallet-level row and returns a class or ABSTAIN.


def lf_sdn_match(row: pd.Series) -> int:
    """Wallet appears in OFAC SDN list."""
    return SANCTIONED if row.get("sdn_match") else ABSTAIN


def lf_cryptoscamdb(row: pd.Series) -> int:
    """Wallet tagged by CryptoScamDB."""
    return PHISHING if row.get("cryptoscamdb_match") else ABSTAIN


def lf_tornado_proximity(row: pd.Series) -> int:
    """≥3 transactions to/from Tornado Cash pools."""
    return MIXER_USAGE if row.get("tornado_tx_count", 0) >= 3 else ABSTAIN


def lf_high_freq_low_value(row: pd.Series) -> int:
    """High tx frequency with tiny median value — bot signature."""
    if row.get("tx_frequency_per_day", 0) > 100 and row.get("value_mean_eth", 0) < 0.01:
        return BOT_ACTIVITY
    return ABSTAIN


def lf_mev_interactions(row: pd.Series) -> int:
    """Repeated calls to known MEV builder contracts."""
    return BOT_ACTIVITY if row.get("mev_contract_calls", 0) >= 5 else ABSTAIN


def lf_cex_whitelist(row: pd.Series) -> int:
    """Address belongs to a known exchange hot wallet."""
    return LEGITIMATE if row.get("cex_whitelisted") else ABSTAIN


def lf_verified_contract_only(row: pd.Series) -> int:
    """Wallet only interacts with Etherscan-verified contracts."""
    if row.get("verified_contract_only"):
        return LEGITIMATE
    return ABSTAIN


def lf_short_lifetime_high_fanout(row: pd.Series) -> int:
    """Lived <7 days but fanned out to many counterparties — layering."""
    if row.get("lifetime_days", 0) < 7 and row.get("fan_out_ratio", 0) > 10:
        return PHISHING
    return ABSTAIN


ALL_LFS = [
    lf_sdn_match,
    lf_cryptoscamdb,
    lf_tornado_proximity,
    lf_high_freq_low_value,
    lf_mev_interactions,
    lf_cex_whitelist,
    lf_verified_contract_only,
    lf_short_lifetime_high_fanout,
]
