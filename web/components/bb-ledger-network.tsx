"use client";

import {
  Cpu,
  Fingerprint,
  type LucideIcon,
  Scale,
  Share2,
  Shield,
  Zap,
} from "lucide-react";
import { buildTriageTrail, shortAddr, type TriageTrailItem } from "@/lib/triage-trail";
import type { RiskLabel } from "@/lib/types";
import { cn } from "@/lib/utils";

const ICON_MAP: Record<TriageTrailItem["icon"], LucideIcon> = {
  fingerprint: Fingerprint,
  split: Share2,
  shield: Shield,
  zap: Zap,
  scale: Scale,
  cpu: Cpu,
};

const emphasisClass: Record<TriageTrailItem["emphasis"], string> = {
  default: "border-white/10 bg-black/25 hover:border-[#2dd4bf]/25",
  watch: "border-amber-500/20 bg-amber-500/[0.06] hover:border-amber-400/35",
  alert: "border-rose-500/25 bg-rose-500/[0.07] hover:border-rose-400/35",
};

/**
 * LinkedIn-style “activity” timeline: on-chain triage story for an address
 * (deterministic demo narrative — wire real block receipts later).
 */
export function BBLedgerNetwork({
  address,
  riskLabel,
}: {
  address?: string;
  riskLabel?: RiskLabel;
} = {}) {
  const items = buildTriageTrail(address, riskLabel);
  const headline = address
    ? `Footprint for ${shortAddr(address)}`
    : "Example triage footprint";

  return (
    <div className="relative overflow-hidden rounded-2xl border border-[#2dd4bf]/20 bg-gradient-to-br from-[#121820] to-[#0a0e12] p-5 shadow-lg shadow-[#2dd4bf]/5">
      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#2dd4bf]">
            / Triage trail
          </p>
          <h2 className="mt-1 font-sans text-lg font-semibold tracking-tight text-white">
            {headline}
          </h2>
          <p className="mt-1 max-w-md text-xs text-zinc-500">
            Like a profile activity feed — each “block” is a slice we use for wallet risk triage (not raw
            block receipts yet).
          </p>
        </div>
        <span className="shrink-0 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 font-mono text-[10px] text-emerald-300">
          ● live queue
        </span>
      </div>

      <ol className="space-y-0">
        {items.map((item, i) => {
          const Icon = ICON_MAP[item.icon];
          const last = i === items.length - 1;
          return (
            <li key={item.id} className="flex gap-4">
              <div className="flex w-8 shrink-0 flex-col items-center self-stretch">
                <span
                  className="z-[1] mt-2 h-2.5 w-2.5 rounded-full border-2 border-[#0a0e12] bg-[#2dd4bf] shadow-[0_0_12px_rgba(45,212,191,0.4)]"
                  aria-hidden
                />
                {!last && (
                  <span
                    className="mt-1 w-px flex-1 bg-gradient-to-b from-[#2dd4bf]/35 via-white/15 to-transparent"
                    aria-hidden
                  />
                )}
              </div>
              <article
                className={cn(
                  "mb-4 flex-1 rounded-xl border p-4 transition-colors last:mb-0",
                  emphasisClass[item.emphasis],
                )}
              >
                <div className="flex gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-[#0a0e12] text-[#2dd4bf]">
                    <Icon className="h-5 w-5" strokeWidth={1.5} aria-hidden />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-sm font-semibold text-zinc-100">{item.title}</h3>
                    <p className="mt-1 text-xs leading-relaxed text-zinc-400">{item.body}</p>
                    <p className="mt-2 font-mono text-[11px] text-zinc-500">{item.meta}</p>
                  </div>
                </div>
              </article>
            </li>
          );
        })}
      </ol>

      <p className="mt-4 border-t border-white/5 pt-3 text-center text-[11px] text-zinc-600">
        Synthetic narrative from feature engineering — plug in your indexer / subgraph for real tx hashes &
        timestamps.
      </p>
    </div>
  );
}
