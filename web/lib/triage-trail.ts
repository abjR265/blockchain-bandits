import type { RiskLabel } from "./types";

export type TrailEmphasis = "default" | "watch" | "alert";

export type TriageTrailItem = {
  id: string;
  icon: "fingerprint" | "split" | "shield" | "zap" | "scale" | "cpu";
  title: string;
  body: string;
  meta: string;
  emphasis: TrailEmphasis;
};

const DEMO_ADDR = "0x3fC9a12E000000000000000000000000000000a1";

function seed(addr: string): number {
  let h = 2166136261;
  const s = addr.toLowerCase();
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h);
}

export function shortAddr(a: string): string {
  if (!a || a.length < 14) return a || "—";
  return `${a.slice(0, 6)}…${a.slice(-4)}`;
}

/** LinkedIn-style “activity” blocks: synthetic triage narrative tied to this address. */
export function buildTriageTrail(
  address?: string,
  riskLabel?: RiskLabel,
): TriageTrailItem[] {
  const addr = (address || DEMO_ADDR).toLowerCase();
  const s = seed(addr);
  const label = riskLabel ?? "unknown";

  const fan = (s % 180) / 10 + 4; // 4–21
  const txDay = 50 + (s % 500);
  const tornado = label === "mixer_usage" ? 1 + (s % 3) : s % 4 === 0 ? 1 : 0;
  const counterparties = 12 + (s % 80);

  const intel: string[] = [];
  if (label === "sanctioned") intel.push("OFAC SDN cross-check");
  if (label === "phishing") intel.push("CryptoScamDB overlap");
  if (label === "bot_activity" || txDay > 400) intel.push("MEV-adjacent cadence");
  if (label === "mixer_usage" || tornado > 0) intel.push("Tornado pool graph");
  if (intel.length === 0) intel.push("Public labels + on-chain heuristics");

  const flowVerb =
    fan > 14 ? "High fan-out — value splits to many destinations." : "Moderate outbound spread vs. peers.";

  const privacy =
    tornado > 0
      ? `${tornado} touch(es) to known Tornado Cash pools in the synthetic window — privacy tooling flags for compliance review.`
      : "No Tornado pool interactions in the feature window used for this score.";

  const velocity =
    txDay > 350
      ? "Very high daily tx rate — patterns overlap automated / bot-like flows."
      : txDay > 120
        ? "Elevated activity vs. retail norms — worth a second look with other signals."
        : "Cadence looks closer to occasional retail usage.";

  const classLine =
    label === "legitimate"
      ? "Model leans legitimate — still verify with policy."
      : label === "unknown"
        ? "Model uncertainty — analyst review recommended."
        : `Top predicted class: ${label.replace(/_/g, " ")} — calibrated probability + isotonic correction.`;

  const items: TriageTrailItem[] = [
    {
      id: "1",
      icon: "fingerprint",
      title: "Triage subject",
      body: `This address is the unit of analysis — pseudonymous on-chain ID (not who owns the keys).`,
      meta: shortAddr(addr),
      emphasis: "default",
    },
    {
      id: "2",
      icon: "split",
      title: "Flow & counterparties",
      body: `${flowVerb} ~${counterparties} unique counterparties in the engineered window.`,
      meta: `fan_out≈${fan.toFixed(1)} · diversity signal`,
      emphasis: fan > 14 ? "watch" : "default",
    },
    {
      id: "3",
      icon: "shield",
      title: "Privacy / mixer surface",
      body: privacy,
      meta: tornado > 0 ? "Tornado adjacency" : "Pools: clear in this slice",
      emphasis: tornado > 0 ? "alert" : "default",
    },
    {
      id: "4",
      icon: "zap",
      title: "Velocity",
      body: velocity,
      meta: `~${txDay} tx/day (feature estimate)`,
      emphasis: txDay > 350 ? "watch" : "default",
    },
    {
      id: "5",
      icon: "scale",
      title: "Intel overlays",
      body: `Signals stitched from curated lists + on-chain patterns: ${intel.join(" · ")}.`,
      meta: "OFAC · CryptoScamDB · MEV stubs (project)",
      emphasis: "default",
    },
    {
      id: "6",
      icon: "cpu",
      title: "Model stack",
      body: `${classLine} XGBoost multiclass + per-class isotonic calibration; explanations via pred_contribs.`,
      meta: "Blockchain-Bandits triage pipeline",
      emphasis: label === "sanctioned" || label === "phishing" ? "alert" : "default",
    },
  ];

  return items;
}
