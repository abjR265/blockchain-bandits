import type { RiskLabel, WalletScore } from "./types";

export type LabelCount = { label: RiskLabel; count: number; pct: number };

export function labelDistribution(wallets: WalletScore[]): LabelCount[] {
  const counts = new Map<RiskLabel, number>();
  for (const w of wallets) {
    counts.set(w.label, (counts.get(w.label) ?? 0) + 1);
  }
  const total = wallets.length || 1;
  return Array.from(counts.entries()).map(([label, count]) => ({
    label,
    count,
    pct: (count / total) * 100,
  }));
}

export function aggregateFeatureImportance(wallets: WalletScore[], topN = 8) {
  const acc = new Map<string, number>();
  for (const w of wallets) {
    for (const f of w.top_features) {
      const v = Math.abs(Number(f.shap_contribution));
      acc.set(f.feature, (acc.get(f.feature) ?? 0) + v);
    }
  }
  return Array.from(acc.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, topN)
    .map(([name, value]) => ({ name, value }));
}

export function avgRiskByLabel(wallets: WalletScore[]) {
  const sums = new Map<RiskLabel, { sum: number; n: number }>();
  for (const w of wallets) {
    const cur = sums.get(w.label) ?? { sum: 0, n: 0 };
    cur.sum += w.risk_score;
    cur.n += 1;
    sums.set(w.label, cur);
  }
  return Array.from(sums.entries()).map(([label, { sum, n }]) => ({
    label,
    avg: sum / n,
  }));
}

/** Decorative tags under address — derived from model label + heuristics. */
export function sourceTags(label: RiskLabel): string[] {
  switch (label) {
    case "sanctioned":
      return ["OFAC"];
    case "phishing":
      return ["CRYPTOSCAMDB"];
    case "mixer_usage":
      return ["TORNADO"];
    case "bot_activity":
      return ["MEV"];
    case "legitimate":
      return ["CEX ADJACENT"];
    default:
      return ["HEURISTIC"];
  }
}

export function mockTxCount(address: string, w: WalletScore): number {
  const freq = w.top_features.find((f) => f.feature.includes("frequency"));
  if (freq && typeof freq.value === "number") {
    return Math.min(999_999, Math.max(10, Math.round(freq.value * 42)));
  }
  let h = 2166136261;
  for (let i = 0; i < address.length; i++) {
    h ^= address.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return 800 + (Math.abs(h) % 120_000);
}

/** Mock 7-day risk trend for sparkline (normalized 0–1). */
export function mockRiskTrend(seed: number): number[] {
  const out: number[] = [];
  let v = 0.08 + (Math.abs(seed) % 20) / 200;
  for (let i = 0; i < 7; i++) {
    v += (Math.sin(seed + i) * 0.02 + (i * 0.008)) % 0.05;
    v = Math.min(0.45, Math.max(0.05, v));
    out.push(v);
  }
  return out;
}
