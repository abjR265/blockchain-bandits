"""Pull and normalise wallet-label source lists.

Sources:
- OFAC SDN (sanctioned)
- CryptoScamDB (phishing)
- Tornado Cash pool addresses (mixer_usage seed)
- Etherscan exchange tags (legitimate seed)

All sources are deduped and written to `labels.parquet` keyed on `address`
with a `source` column for provenance.
"""

from __future__ import annotations

import json
from dataclasses import dataclass
from pathlib import Path

import httpx
import pandas as pd


OFAC_URL = "https://www.treasury.gov/ofac/downloads/sdn.xml"  # or sdnlist.txt for a simpler parse
CRYPTOSCAMDB_URL = "https://raw.githubusercontent.com/CryptoScamDB/blacklist/master/data/urls.yaml"
TORNADO_POOLS = [
    # Mainnet ETH pools
    "0x12d66f87a04a9e220743712ce6d9bb1b5616b8fc",
    "0x47ce0c6ed5b0ce3d3a51fdb1c52dc66a7c3c2936",
    "0x910cbd523d972eb0a6f4cae4618ad62622b39dbf",
    "0xa160cdab225685da1d56aa342ad8841c3b53f291",
]


@dataclass
class LabelRow:
    address: str
    label: str
    source: str


def fetch_ofac_addresses() -> list[LabelRow]:
    """Stub: parse SDN XML for crypto-tagged entries. Week 2 impl."""
    # TODO: implement XML parse or use a prebuilt JSON mirror.
    return []


def fetch_cryptoscamdb() -> list[LabelRow]:
    """Stub: CryptoScamDB yaml -> wallet addresses. Week 2 impl."""
    return []


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

    df = pd.DataFrame(r.__dict__ for r in rows).drop_duplicates(["address", "label"])
    out_path.parent.mkdir(parents=True, exist_ok=True)
    df.to_parquet(out_path, index=False)
    print(f"wrote {len(df):,} label rows to {out_path}")


if __name__ == "__main__":
    build_labels(Path("data/parquet/labels.parquet"))
