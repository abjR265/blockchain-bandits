// Shared types mirroring the API response shapes.
// Keep in sync with api/app/models/schemas.py

export type RiskLabel =
  | "legitimate"
  | "phishing"
  | "mixer_usage"
  | "bot_activity"
  | "sanctioned"
  | "unknown";

export interface WalletScore {
  address: string;
  label: RiskLabel;
  risk_score: number;
  confidence: number;
  last_active: string; // ISO timestamp
  top_features: FeatureContribution[];
  scored_at: string;
  model_version: string;
}

export interface FeatureContribution {
  feature: string;
  value: number | string;
  shap_contribution: number;
}

export interface DashboardStats {
  wallets_scanned: number;
  flagged_today: number;
  avg_risk_score: number;
}

export interface AnalysisJob {
  job_id: string;
  status: "queued" | "running" | "complete" | "failed";
  address: string;
  submitted_at: string;
  result?: WalletScore;
}

export interface FeedbackPayload {
  prediction_id: string;
  verdict: "correct" | "incorrect";
  correct_label?: RiskLabel;
  note?: string;
}
