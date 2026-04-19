import Link from "next/link";
import { Sparkles, ThumbsDown, ThumbsUp } from "lucide-react";
import { BBClassBadge } from "@/components/bb-class-badge";
import { mockTxCount, sourceTags } from "@/lib/ml-analytics";
import { cn, shortAddress } from "@/lib/utils";
import type { WalletScore } from "@/lib/types";

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60_000);
  const h = Math.floor(diff / 3600_000);
  if (m < 2) return "fresh";
  if (m < 60) return `${m}m ago`;
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

function heatVibe(risk100: number): { label: string; className: string } {
  if (risk100 <= 20) return { label: "cool", className: "text-emerald-400/90" };
  if (risk100 <= 45) return { label: "warm", className: "text-amber-300/90" };
  if (risk100 <= 70) return { label: "toasty", className: "text-orange-400/90" };
  return { label: "spicy", className: "text-rose-400/90" };
}

export function BBTriageTable({ wallets }: { wallets: WalletScore[] }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-[#2dd4bf]/20 bg-gradient-to-br from-[#141a22] via-[#121820] to-[#0a0e12] shadow-xl shadow-[#2dd4bf]/5">
      <div className="relative border-b border-white/5 px-4 py-4 sm:px-6">
        <div
          className="pointer-events-none absolute -right-8 -top-10 h-32 w-32 rounded-full bg-[#2dd4bf]/10 blur-3xl"
          aria-hidden
        />
        <div className="relative">
          <p className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.22em] text-zinc-500">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-40" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
            </span>
            Queue · live
          </p>
          <h2 className="mt-1 flex flex-wrap items-center gap-2 text-xl font-bold tracking-tight text-white sm:text-2xl">
            <Sparkles className="h-6 w-6 shrink-0 text-[#2dd4bf] animate-floaty" strokeWidth={1.5} aria-hidden />
            Who’s up next?
          </h2>
          <p className="mt-1.5 max-w-md text-sm text-zinc-500">
            A snackable lineup of wallets we just scored — poke a row to go full detective mode.
          </p>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead>
            <tr className="border-b border-white/5 font-mono text-[10px] uppercase tracking-wider text-zinc-500">
              <th className="px-4 py-3 sm:px-6">Wallet</th>
              <th className="px-4 py-3">Vibe</th>
              <th className="px-4 py-3">Heat</th>
              <th className="px-4 py-3">Moves</th>
              <th className="px-4 py-3">Fresh</th>
              <th className="px-4 py-3 text-right">Ya / nah</th>
            </tr>
          </thead>
          <tbody>
            {wallets.map((w, idx) => {
              const risk100 = Math.round(w.risk_score * 100);
              const tags = sourceTags(w.label);
              const txs = mockTxCount(w.address, w);
              const vibe = heatVibe(risk100);
              return (
                <tr
                  key={w.address}
                  className={cn(
                    "group border-b border-white/5 transition-colors",
                    idx % 2 === 0 ? "bg-black/10" : "bg-transparent",
                    "hover:bg-[#2dd4bf]/[0.06]",
                  )}
                >
                  <td className="px-4 py-4 align-top sm:px-6">
                    <div className="flex items-start gap-2">
                      <span
                        className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-zinc-900/80 font-mono text-[10px] font-bold text-[#2dd4bf]"
                        aria-hidden
                      >
                        {idx + 1}
                      </span>
                      <div>
                        <Link
                          href={`/wallet/${w.address}`}
                          className="font-mono text-sm font-medium text-[#2dd4bf] underline decoration-[#2dd4bf]/30 underline-offset-2 transition hover:decoration-[#2dd4bf]"
                        >
                          {shortAddress(w.address, 6)}
                        </Link>
                        <div className="mt-1.5 flex flex-wrap gap-1">
                          {tags.map((t) => (
                            <span
                              key={t}
                              className="rounded-md border border-white/10 bg-black/30 px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-wide text-zinc-400"
                            >
                              {t}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4 align-middle">
                    <BBClassBadge label={w.label} />
                  </td>
                  <td className="px-4 py-4 align-middle">
                    <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-3">
                      <div className="h-2.5 w-full max-w-[7rem] overflow-hidden rounded-full bg-zinc-800 ring-1 ring-white/5">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-emerald-500 via-amber-400 to-red-500 transition-all duration-300 group-hover:brightness-110"
                          style={{ width: `${risk100}%` }}
                        />
                      </div>
                      <div className="flex items-baseline gap-2">
                        <span className="font-mono text-sm font-semibold tabular-nums text-white">
                          {risk100}
                        </span>
                        <span className={cn("text-[10px] font-semibold uppercase tracking-wide", vibe.className)}>
                          {vibe.label}
                        </span>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4 font-mono text-zinc-300">{txs.toLocaleString()}</td>
                  <td className="px-4 py-4 text-zinc-400">{timeAgo(w.scored_at)}</td>
                  <td className="px-4 py-4 text-right">
                    <div className="inline-flex gap-1">
                      <Link
                        href={`/wallet/${w.address}`}
                        className="rounded-lg border border-white/10 bg-white/[0.02] p-1.5 text-zinc-500 transition hover:scale-110 hover:border-emerald-400/40 hover:text-emerald-400 active:scale-95"
                        title="Looks right — open wallet"
                      >
                        <ThumbsUp className="h-4 w-4" />
                      </Link>
                      <Link
                        href={`/wallet/${w.address}`}
                        className="rounded-lg border border-white/10 bg-white/[0.02] p-1.5 text-zinc-500 transition hover:scale-110 hover:border-rose-400/40 hover:text-rose-400 active:scale-95"
                        title="Looks off — open wallet"
                      >
                        <ThumbsDown className="h-4 w-4" />
                      </Link>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
