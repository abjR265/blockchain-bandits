"use client";

import {
  Activity,
  BarChart3,
  Gauge,
  Layers,
  type LucideIcon,
  Share2,
  Shield,
  Waves,
  Zap,
} from "lucide-react";
import {
  aggregateFeatureImportance,
  avgRiskByLabel,
  labelDistribution,
} from "@/lib/ml-analytics";
import { featureCopy } from "@/lib/wallet-glossary";
import type { WalletScore } from "@/lib/types";

function featureIcon(name: string): LucideIcon {
  const n = name.toLowerCase();
  if (n.includes("tornado")) return Shield;
  if (n.includes("fan_out")) return Share2;
  if (n.includes("fan_in")) return Waves;
  if (n.includes("frequency") || n.includes("inter_arrival")) return Zap;
  if (n.includes("mev")) return Activity;
  return BarChart3;
}

export function BBMLAnalytics({ wallets }: { wallets: WalletScore[] }) {
  const dist = labelDistribution(wallets);
  const feats = aggregateFeatureImportance(wallets, 6);
  const byLabel = avgRiskByLabel(wallets);
  const maxFeat = Math.max(...feats.map((f) => f.value), 1e-6);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#2dd4bf]">
          / ML analytics
        </span>
        <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 font-mono text-[10px] text-zinc-400">
          XGBoost · 5-class · isotonic
        </span>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-xl border border-white/10 bg-[#121820]/90 p-4">
          <div className="mb-3 flex items-center gap-2 text-xs font-medium text-zinc-300">
            <Layers className="h-4 w-4 text-[#2dd4bf]" />
            Class mix (batch)
          </div>
          <div className="space-y-2">
            {dist.map((d) => (
              <div key={d.label} className="flex items-center gap-2">
                <span className="w-24 truncate font-mono text-[10px] uppercase text-zinc-500">
                  {d.label}
                </span>
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-zinc-800">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-[#2dd4bf] to-violet-500 transition-all"
                    style={{ width: `${d.pct}%` }}
                  />
                </div>
                <span className="w-8 text-right font-mono text-[10px] text-zinc-400">
                  {d.count}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-white/10 bg-[#121820]/90 p-4">
          <div className="mb-3 flex items-center gap-2 text-xs font-medium text-zinc-300">
            <Gauge className="h-4 w-4 text-violet-400" />
            Avg risk by label
          </div>
          <div className="space-y-2">
            {byLabel.map((b) => {
              const pct = Math.min(100, Math.max(0, b.avg * 100));
              return (
                <div key={b.label} className="flex items-center justify-between gap-2">
                  <span className="font-mono text-[10px] uppercase text-zinc-500">
                    {b.label}
                  </span>
                  <div className="flex min-w-0 flex-1 items-center gap-3">
                    {/* Full-width track + marker: tiny fill % was nearly invisible at low risk (e.g. 4). */}
                    <div
                      className="relative h-7 min-w-0 flex-1"
                      role="img"
                      aria-label={`Average risk ${pct.toFixed(0)} out of 100`}
                    >
                      <div className="absolute left-0 right-0 top-1/2 h-2 -translate-y-1/2 rounded-full bg-zinc-800 ring-1 ring-white/5" />
                      <div
                        className="absolute left-0 right-0 top-1/2 h-2 -translate-y-1/2 rounded-full bg-gradient-to-r from-emerald-500/35 via-amber-400/35 to-red-500/35"
                        aria-hidden
                      />
                      <div
                        className="absolute top-1/2 z-10 box-border h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-[#0c1016] bg-[#2dd4bf] shadow-[0_0_10px_rgba(45,212,191,0.45)]"
                        style={{ left: `${pct}%` }}
                      />
                    </div>
                    <span className="shrink-0 font-mono text-xs tabular-nums text-[#2dd4bf]">
                      {pct.toFixed(0)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Model attention — friendly names + detail */}
      <div className="relative overflow-hidden rounded-2xl border border-emerald-500/20 bg-gradient-to-br from-[#121820] to-[#0c1016] p-5">
        <div className="relative flex flex-wrap items-start justify-between gap-3">
          <div className="flex items-start gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-emerald-500/25 bg-emerald-500/10">
              <BarChart3 className="h-5 w-5 text-emerald-400" strokeWidth={1.5} />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white">Who the model stares at</h3>
              <p className="mt-1 max-w-xl text-[11px] leading-relaxed text-zinc-500">
                We sum <span className="font-mono text-zinc-400">|contribution|</span> from each wallet’s
                explanation across the current queue — like a cast list ranked by how often the trees
                leaned on a signal. (Same spirit as SHAP-style attributions; your API uses{" "}
                <span className="font-mono text-zinc-400">pred_contribs</span>.)
              </p>
            </div>
          </div>
        </div>

        <ul className="relative mt-4 space-y-3">
          {feats.map((f, idx) => {
            const fc = featureCopy(f.name);
            const Icon = featureIcon(f.name);
            const pct = (f.value / maxFeat) * 100;
            const medal =
              idx === 0 ? "🥇" : idx === 1 ? "🥈" : idx === 2 ? "🥉" : `${idx + 1}.`;
            return (
              <li
                key={f.name}
                className="group rounded-xl border border-white/5 bg-black/25 p-3 transition-colors hover:border-[#2dd4bf]/25"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                  <div className="flex min-w-0 flex-1 items-start gap-3">
                    <span
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-zinc-900/80 text-sm"
                      aria-hidden
                    >
                      {medal}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <Icon className="h-4 w-4 shrink-0 text-[#2dd4bf]" strokeWidth={1.5} />
                        <span className="font-medium text-zinc-100">{fc.title}</span>
                      </div>
                      <p className="mt-0.5 text-[11px] leading-snug text-zinc-500">{fc.short}</p>
                      <p className="mt-1 font-mono text-[10px] text-zinc-600">{f.name}</p>
                    </div>
                  </div>
                  <div className="w-full sm:w-[min(100%,220px)] sm:shrink-0">
                    <div className="mb-1 flex items-center justify-between text-[10px] uppercase tracking-wide text-zinc-600">
                      <span>Collective pull</span>
                      <span className="font-mono text-[#2dd4bf]">{f.value.toFixed(2)}</span>
                    </div>
                    <div className="h-2.5 overflow-hidden rounded-full bg-zinc-800/90 ring-1 ring-white/5">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-emerald-400/90 via-[#2dd4bf] to-cyan-300/90 transition-all group-hover:brightness-110"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
