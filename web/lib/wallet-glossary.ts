import type { RiskLabel } from "./types";

type FeatureEntry = { title: string; short: string; hint: string };

/** Plain-language titles, visible one-liners, and longer hover hints. */
const FEATURE_COPY: Record<string, FeatureEntry> = {
  tx_count_in: {
    title: "Incoming transfers",
    short: "How often this address received sends.",
    hint: "How many times this wallet received ETH or tokens from others.",
  },
  tx_count_out: {
    title: "Outgoing transfers",
    short: "How often this address sent funds out.",
    hint: "How many times this wallet sent ETH or tokens to others.",
  },
  unique_counterparties: {
    title: "Unique counterparties",
    short: "How many distinct addresses it traded with.",
    hint: "How many different addresses this wallet has sent to or received from.",
  },
  counterparty_diversity: {
    title: "Counterparty diversity",
    short: "How spread out activity is across partners.",
    hint: "Spread of activity across many partners vs. repeating the same few.",
  },
  tx_frequency_per_day: {
    title: "Transactions per day",
    short: "Avg daily activity—very high can look automated.",
    hint: "Average daily activity—very high rates can look automated.",
  },
  inter_arrival_mean: {
    title: "Typical gap between txs",
    short: "Average time between transactions.",
    hint: "Average time between transactions; bots often show very regular timing.",
  },
  inter_arrival_var: {
    title: "Timing variability",
    short: "How irregular the pauses between txs are.",
    hint: "How irregular the gaps are between transactions.",
  },
  value_sum_eth: {
    title: "Total ETH moved (approx.)",
    short: "Rough volume through the wallet in our window.",
    hint: "Sum of ETH-like value flowing through the wallet in the window we analyzed.",
  },
  value_mean_eth: {
    title: "Average transfer size",
    short: "Typical transfer size (context with other signals).",
    hint: "Typical size of a transfer—useful with other signals, not alone.",
  },
  value_round_ratio: {
    title: "“Round number” transfers",
    short: "Share of clean round amounts—can indicate scripts.",
    hint: "Share of transfers in clean round amounts—sometimes seen in scripted flows.",
  },
  fan_out_ratio: {
    title: "Fan-out (sends to many places)",
    short: "Splits outgoing funds across many destinations—common laundering pattern.",
    hint: "How strongly this wallet splits outgoing value across many destinations.",
  },
  fan_in_ratio: {
    title: "Fan-in (receives from many places)",
    short: "Pulls funds in from many sources at once.",
    hint: "How strongly value arrives from many different sources.",
  },
  first_seen_days: {
    title: "Wallet age (first seen)",
    short: "How long we’ve seen this address on-chain.",
    hint: "How long ago we first saw this address on-chain (roughly).",
  },
  last_seen_days: {
    title: "Last activity",
    short: "Time since last observed tx.",
    hint: "How long since the last observed transaction.",
  },
  lifetime_days: {
    title: "Active lifetime",
    short: "Span from first to last seen activity.",
    hint: "Span between first and last seen activity in our data.",
  },
  token_diversity: {
    title: "Token diversity",
    short: "Variety of tokens beyond plain ETH.",
    hint: "Variety of tokens interacted with—not just ETH.",
  },
  contract_call_ratio: {
    title: "Smart-contract usage",
    short: "Share of calls to contracts vs. simple sends.",
    hint: "Share of activity that calls contracts (DeFi, apps) vs. simple transfers.",
  },
  internal_tx_ratio: {
    title: "Internal / trace transfers",
    short: "Internal transfers revealed by traces—not only top-level sends.",
    hint: "Share of internal-style transfers (e.g. contract-mediated moves).",
  },
  tornado_tx_count: {
    title: "Tornado Cash–related touches",
    short: "Interactions with Tornado pools—privacy tool; also used to hide trails.",
    hint: "Interactions with known Tornado Cash pool contracts—a privacy tool; also used to obscure funds.",
  },
  mev_contract_calls: {
    title: "MEV / searcher-style calls",
    short: "Patterns like MEV bots—fast, automated on-chain competition.",
    hint: "Touches patterns associated with MEV bots or searchers (high-frequency on-chain activity).",
  },
};

export function featureCopy(featureKey: string): FeatureEntry {
  return (
    FEATURE_COPY[featureKey] ?? {
      title: featureKey.replace(/_/g, " "),
      short: "Numeric input to the risk model.",
      hint: "A numeric signal the model uses; see project docs for the exact definition.",
    }
  );
}

export function labelPlainName(label: RiskLabel): string {
  const names: Record<RiskLabel, string> = {
    legitimate: "Legitimate",
    phishing: "Phishing / scam-linked",
    mixer_usage: "Mixer / privacy pool usage",
    bot_activity: "Bot-like activity",
    sanctioned: "Sanctions-related",
    unknown: "Uncertain category",
  };
  return names[label] ?? label;
}

/** One-line, visible — for badge row. */
export function labelShortExplain(label: RiskLabel): string {
  const copy: Record<RiskLabel, string> = {
    legitimate: "Looks like normal usage patterns in our data—not proof of intent.",
    phishing: "Overlaps scam reports or similar heuristics—investigate further.",
    mixer_usage:
      "Mixer = service that mixes coins to obscure trails (e.g. Tornado). Often compliance-sensitive.",
    bot_activity: "Very regular or high-frequency flow—often bots, not necessarily illicit alone.",
    sanctioned: "Possible match to public sanctions data—needs official review.",
    unknown: "Model isn’t sure—use as a weak hint only.",
  };
  return copy[label] ?? copy.unknown;
}

export function labelExplain(label: RiskLabel): string {
  const copy: Record<RiskLabel, string> = {
    legitimate:
      "Behavior looks broadly consistent with normal retail or app usage—still not a guarantee of intent.",
    phishing:
      "Patterns overlap addresses reported in scam databases or similar heuristics—verify before acting.",
    mixer_usage:
      "On-chain touches to mixer contracts (e.g. Tornado)—privacy use or obfuscation; context matters.",
    bot_activity:
      "High frequency or MEV-like patterns—often automation, not necessarily malicious alone.",
    sanctioned:
      "Overlap with public sanctions lists—requires compliance review; this UI is not a legal determination.",
    unknown:
      "The model is not confident in a single class—treat as a weak signal and review manually.",
  };
  return copy[label] ?? copy.unknown;
}

export function methodologyTagExplain(tag: string): string {
  const t = tag.toUpperCase();
  const map: Record<string, string> = {
    OFAC: "Signal tied to U.S. Treasury OFAC sanctions list matching (public data).",
    CRYPTOSCAMDB: "Signal tied to CryptoScamDB community-reported addresses.",
    TORNADO: "Signal tied to Tornado Cash pool proximity (on-chain).",
    MEV: "Signal tied to MEV / searcher-style activity patterns.",
    "CEX ADJACENT": "Heuristic tag for exchange-adjacent behavior (illustrative in mock flows).",
    HEURISTIC: "Rule-based tag when no strong class-specific source applies.",
  };
  return map[t] ?? "Context tag for this result.";
}
