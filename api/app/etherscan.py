"""Fetch normalized mainnet ETH transactions from Etherscan API v2 (free tier).

V1 `https://api.etherscan.io/api` is deprecated — use v2 + chainid.
See https://docs.etherscan.io/v2-migration
"""

from __future__ import annotations

import json
import urllib.error
import urllib.parse
import urllib.request

import pandas as pd

# Ethereum mainnet (use another chain id only if you point the app at that chain’s data)
ETH_MAINNET_CHAIN_ID = 1
V2_API_BASE = "https://api.etherscan.io/v2/api"


class EtherscanError(Exception):
    """API failure or misconfiguration."""


def fetch_txlist_mainnet(
    address: str,
    api_key: str,
    *,
    max_tx: int = 2_000,
    chain_id: int = ETH_MAINNET_CHAIN_ID,
) -> pd.DataFrame:
    """Return a dataframe compatible with `wallet_features.engineer` (normal txs only)."""
    if not api_key or not api_key.strip():
        raise EtherscanError("ETHERSCAN_API_KEY is empty — set it in the API environment for live data.")

    addr = address.lower()
    if not addr.startswith("0x") or len(addr) != 42:
        raise EtherscanError("Invalid Ethereum address.")

    params = urllib.parse.urlencode(
        {
            "chainid": chain_id,
            "module": "account",
            "action": "txlist",
            "address": addr,
            "startblock": 0,
            "endblock": 99_999_999,
            "page": 1,
            "offset": max_tx,
            "sort": "asc",
            "apikey": api_key.strip(),
        }
    )
    url = f"{V2_API_BASE}?{params}"
    try:
        req = urllib.request.Request(url, headers={"User-Agent": "blockchain-bandits-api/0.1"})
        with urllib.request.urlopen(req, timeout=25) as resp:
            payload = json.loads(resp.read().decode())
    except urllib.error.HTTPError as e:
        raise EtherscanError(f"Etherscan HTTP {e.code}") from e
    except urllib.error.URLError as e:
        raise EtherscanError(f"Etherscan unreachable: {e.reason!r}") from e

    status = str(payload.get("status", ""))
    message = str(payload.get("message", ""))
    result = payload.get("result")

    if status == "0":
        if isinstance(result, str) and "rate limit" in result.lower():
            raise EtherscanError("Etherscan rate limit — try again shortly.")
        if "No transactions found" in message or result == []:
            return _empty_tx_df()
        if isinstance(result, str) and ("Invalid API Key" in result or "deprecated" in result.lower()):
            raise EtherscanError(f"Etherscan: {result}")
        # Some accounts return message NOTOK with empty list
        if result == [] or result is None:
            return _empty_tx_df()
        raise EtherscanError(f"Etherscan error: {message} — {result!r}")

    if not isinstance(result, list):
        raise EtherscanError(f"Unexpected Etherscan response: {payload!r}")

    if not result:
        return _empty_tx_df()

    rows: list[dict] = []
    for tx in result:
        try:
            ts = int(tx["timeStamp"])
            value_wei = int(tx.get("value", 0))
            gas = int(tx.get("gas", 21_000))
            inp = tx.get("input") or "0x"
            method_id = inp[:10] if len(inp) >= 10 else ""
            to_raw = tx.get("to")
            to_addr = (to_raw or "0x0000000000000000000000000000000000000000").lower()
            rows.append(
                {
                    "from_address": str(tx["from"]).lower(),
                    "to_address": to_addr,
                    "value_eth": value_wei / 1e18,
                    "gas": float(gas),
                    "block_timestamp": pd.Timestamp(ts, unit="s", tz="UTC"),
                    "token_type": "ETH",
                    "method_id": method_id,
                    "is_internal": False,
                    "transaction_hash": tx.get("hash", ""),
                }
            )
        except (KeyError, TypeError, ValueError):
            continue

    return pd.DataFrame(rows)


def _empty_tx_df() -> pd.DataFrame:
    return pd.DataFrame(
        columns=[
            "from_address",
            "to_address",
            "value_eth",
            "gas",
            "block_timestamp",
            "token_type",
            "method_id",
            "is_internal",
            "transaction_hash",
        ]
    )
