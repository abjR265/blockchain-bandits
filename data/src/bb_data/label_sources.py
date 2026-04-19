"""Pull and normalise wallet-label source lists."""

from __future__ import annotations

import re
from dataclasses import dataclass
from pathlib import Path

import httpx
import pandas as pd


OFAC_URL = "https://www.treasury.gov/ofac/downloads/sdn.xml"
CRYPTOSCAMDB_URL = "https://api.cryptoscamdb.org/v1/addresses"
TORNADO_POOLS = [
    "0x12d66f87a04a9e220743712ce6d9bb1b5616b8fc",
    "0x47ce0c6ed5b0ce3d3a51fdb1c52dc66a7c3c2936",
    "0x910cbd523d972eb0a6f4cae4618ad62622b39dbf",
    "0xa160cdab225685da1d56aa342ad8841c3b53f291",
]

_ETH_ADDR = re.compile(r"\b(0x[a-fA-F0-9]{40})\b")


@dataclass
class LabelRow:
    address: str
    label: str
    source: str


def fetch_ofac_addresses() -> list[LabelRow]:
    """Parse Ethereum addresses from OFAC SDN XML (regex-based)."""
    with httpx.Client(timeout=120.0) as client:
        r = client.get(OFAC_URL)
        r.raise_for_status()
        text = r.text
    seen: set[str] = set()
    rows: list[LabelRow] = []
    for m in _ETH_ADDR.finditer(text):
        addr = m.group(1).lower()
        if addr not in seen:
            seen.add(addr)
            rows.append(LabelRow(address=addr, label="sanctioned_seed", source="ofac_sdn"))
    return rows


def fetch_cryptoscamdb() -> list[LabelRow]:
    """Pull tagged ETH addresses from CryptoScamDB public API."""
    with httpx.Client(timeout=60.0) as client:
        r = client.get(CRYPTOSCAMDB_URL)
        r.raise_for_status()
        payload = r.json()
    rows: list[LabelRow] = []
    # API shape: { "success": true, "result": [ { "address": "0x...", "category": "..." } ] }
    result = payload.get("result") or payload.get("data") or []
    for item in result:
        if not isinstance(item, dict):
            continue
        addr = (item.get("address") or "").strip().lower()
        if not addr.startswith("0x") or len(addr) != 42:
            continue
        coin_raw = item.get("coin") or item.get("chain")
        if coin_raw is not None and str(coin_raw).upper() not in {"ETH", "ETHEREUM"}:
            continue
        cat = (item.get("category") or item.get("status") or "scam").lower()
        label = "phishing_seed" if "phish" in cat else "phishing_seed"
        rows.append(LabelRow(address=addr, label=label, source="cryptoscamdb"))
    return rows


def tornado_pool_labels() -> list[LabelRow]:
    return [
        LabelRow(address=addr.lower(), label="mixer_usage_seed", source="tornado_cash")
        for addr in TORNADO_POOLS
    ]


def build_labels(out_path: Path) -> None:
    rows: list[LabelRow] = []
    rows += fetch_ofac_addresses()
    rows += fetch_cryptoscamdb()
    rows += tornado_pool_labels()

    df = pd.DataFrame([r.__dict__ for r in rows]).drop_duplicates(["address", "label"])
    out_path.parent.mkdir(parents=True, exist_ok=True)
    df.to_parquet(out_path, index=False)
    print(f"wrote {len(df):,} label rows to {out_path}")


if __name__ == "__main__":
    build_labels(Path("data/parquet/labels.parquet"))
