import pandas as pd

from blockchain_bandits_ml.labeling import (
    ABSTAIN,
    BOT_ACTIVITY,
    MIXER_USAGE,
    PHISHING,
    SANCTIONED,
    lf_cryptoscamdb,
    lf_high_freq_low_value,
    lf_sdn_match,
    lf_tornado_proximity,
)


def test_sdn_match():
    assert lf_sdn_match(pd.Series({"sdn_match": True})) == SANCTIONED
    assert lf_sdn_match(pd.Series({"sdn_match": False})) == ABSTAIN


def test_tornado_proximity():
    assert lf_tornado_proximity(pd.Series({"tornado_tx_count": 5})) == MIXER_USAGE
    assert lf_tornado_proximity(pd.Series({"tornado_tx_count": 1})) == ABSTAIN


def test_high_freq_low_value():
    hot_bot = pd.Series({"tx_frequency_per_day": 200, "value_mean_eth": 0.001})
    assert lf_high_freq_low_value(hot_bot) == BOT_ACTIVITY

    whale = pd.Series({"tx_frequency_per_day": 200, "value_mean_eth": 12})
    assert lf_high_freq_low_value(whale) == ABSTAIN


def test_cryptoscamdb():
    assert lf_cryptoscamdb(pd.Series({"cryptoscamdb_match": True})) == PHISHING
    assert lf_cryptoscamdb(pd.Series({"cryptoscamdb_match": False})) == ABSTAIN
