import pandas as pd

from blockchain_bandits_ml.features import (
    FEATURE_COLUMNS,
    engineer,
    feature_row_for_address,
    synthetic_transactions_for_address,
)


def _tiny_frame() -> pd.DataFrame:
    ts = pd.Timestamp("2024-06-01T12:00:00Z")
    rows = [
        {
            "from_address": "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
            "to_address": "0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
            "value_eth": 1.0,
            "gas": 21000,
            "block_timestamp": ts,
            "token_type": "ETH",
            "method_id": "",
            "is_internal": False,
        },
        {
            "from_address": "0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
            "to_address": "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
            "value_eth": 0.5,
            "gas": 21000,
            "block_timestamp": ts + pd.Timedelta(hours=1),
            "token_type": "ETH",
            "method_id": "",
            "is_internal": False,
        },
    ]
    return pd.DataFrame(rows)


def test_engineer_columns():
    out = engineer(_tiny_frame(), now_ts=pd.Timestamp("2024-07-01T00:00:00Z"))
    assert list(out.columns) == ["address", *FEATURE_COLUMNS]
    assert len(out) >= 2


def test_feature_row_deterministic():
    a = "0x" + "c" * 40
    r1 = feature_row_for_address(a)
    r2 = feature_row_for_address(a)
    assert list(r1.index) == FEATURE_COLUMNS
    pd.testing.assert_series_equal(r1, r2)


def test_synthetic_nonempty():
    df = synthetic_transactions_for_address("0x" + "d" * 40, n=10)
    assert len(df) == 10
    assert set(df.columns) >= {
        "from_address",
        "to_address",
        "value_eth",
        "block_timestamp",
    }
