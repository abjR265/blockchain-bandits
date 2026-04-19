import { Flame, Radar, Scan } from "lucide-react";
import type { DashboardStats } from "@/lib/types";

export function BBStatPills({ stats }: { stats: DashboardStats }) {
  const items = [
    {
      icon: Scan,
      label: "Wallets scanned",
      value: `${(stats.wallets_scanned / 1_000_000).toFixed(2)}M`,
      sub: "indexed for triage",
    },
    {
      icon: Flame,
      label: "Flagged today",
      value: String(stats.flagged_today),
      sub: "above policy threshold",
    },
    {
      icon: Radar,
      label: "Avg risk",
      value: stats.avg_risk_score.toFixed(2),
      sub: "batch mean (0–1)",
    },
  ];
  return (
    <div className="mx-auto grid max-w-4xl grid-cols-1 gap-4 px-4 sm:grid-cols-3">
      {items.map((it) => (
        <div
          key={it.label}
          className="group rounded-2xl border border-[#4ef3e6]/20 bg-gradient-to-br from-[#121820] to-[#0a0e12] p-5 shadow-lg shadow-black/40 transition hover:border-[#4ef3e6]/40 hover:shadow-[#4ef3e6]/10"
        >
          <it.icon className="mb-3 h-5 w-5 text-[#4ef3e6] transition group-hover:animate-floaty" />
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-zinc-500">
            {it.label}
          </p>
          <p className="mt-1 font-mono text-3xl font-bold text-white">{it.value}</p>
          <p className="mt-1 text-xs text-zinc-500">{it.sub}</p>
        </div>
      ))}
    </div>
  );
}
 