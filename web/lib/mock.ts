// Mock data used until the API returns real results.
// Matches the Assignment 2 dashboard mockup.

import type { DashboardStats, WalletScore } from "./types";

export const mockStats: DashboardStats = {
  wallets_scanned: 1_200_000,
  flagged_today: 347,
  avg_risk_score: 0.12,
};

export const mockWallets: WalletScore[] = [
  {
    address: "0x3fC9a12E000000000000000000000000000000a1",
    label: "phishing",
    risk_score: 0.91,
    confidence: 0.88,
    last_active: new Date(Date.now() - 2 * 3600_000).toISOString(),
    top_features: [
      { feature: "fan_out_ratio", value: 18.4, shap_contribution: 0.34 },
      { feature: "cryptoscamdb_match", value: "true", shap_contribution: 0.29 },
      { feature: "first_seen_days", value: 1.2, shap_contribution: 0.12 },
    ],
    scored_at: new Date().toISOString(),
    model_version: "xgb-v0.1.0",
  },
  {
    address: "0xA8b277dF000000000000000000000000000000a2",
    label: "bot_activity",
    risk_score: 0.74,
    confidence: 0.79,
    last_active: new Date(Date.now() - 5 * 3600_000).toISOString(),
    top_features: [
      { feature: "tx_frequency", value: 2340, shap_contribution: 0.28 },
      { feature: "mev_contract_calls", value: 47, shap_contribution: 0.22 },
      { feature: "inter_arrival_var", value: 0.01, shap_contribution: 0.15 },
    ],
    scored_at: new Date().toISOString(),
    model_version: "xgb-v0.1.0",
  },
  {
    address: "0x11Cc03bA000000000000000000000000000000a3",
    label: "mixer_usage",
    risk_score: 0.68,
    confidence: 0.72,
    last_active: new Date(Date.now() - 24 * 3600_000).toISOString(),
    top_features: [
      { feature: "tornado_tx_count", value: 3, shap_contribution: 0.41 },
      { feature: "value_round_ratio", value: 0.87, shap_contribution: 0.18 },
      { feature: "counterparty_diversity", value: 2, shap_contribution: 0.09 },
    ],
    scored_at: new Date().toISOString(),
    model_version: "xgb-v0.1.0",
  },
  {
    address: "0xF5e091aC000000000000000000000000000000a4",
    label: "legitimate",
    risk_score: 0.04,
    confidence: 0.95,
    last_active: new Date(Date.now() - 3 * 24 * 3600_000).toISOString(),
    top_features: [
      { feature: "verified_contract_interactions", value: 87, shap_contribution: -0.22 },
      { feature: "tx_frequency", value: 12, shap_contribution: -0.05 },
      { feature: "counterparty_diversity", value: 34, shap_contribution: -0.04 },
    ],
    scored_at: new Date().toISOString(),
    model_version: "xgb-v0.1.0",
  },
];
