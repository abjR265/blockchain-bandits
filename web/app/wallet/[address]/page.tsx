"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";
import { BBClassBadge } from "@/components/bb-class-badge";
import { BBHeader } from "@/components/bb-header";
import { BBLedgerNetwork } from "@/components/bb-ledger-network";
import { BBSiteShell } from "@/components/bb-site-shell";
import { api } from "@/lib/api";
import {
  featureCopy,
  labelExplain,
  labelPlainName,
  labelShortExplain,
  methodologyTagExplain,
} from "@/lib/wallet-glossary";
import { mockTxCount, sourceTags } from "@/lib/ml-analytics";
import type { WalletScore } from "@/lib/types";

export default function WalletDetailPage() {
  const params = useParams();
  const address = (params.address as string) || "";
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);

  const analysis = useQuery({
    queryKey: ["analyze", address],
    queryFn: () => api.analyze(address),
    enabled: /^0x[a-fA-F0-9]{40}$/i.test(address),
    retry: 1,
  });

  const feedback = useMutation({
    mutationFn: (payload: Parameters<typeof api.submitFeedback>[0]) =>
      api.submitFeedback(payload),
    onSuccess: () => setFeedbackMsg("Feedback saved."),
    onError: () => setFeedbackMsg("Could not reach API — feedback not saved."),
  });

  const job = analysis.data;
  const wallet: WalletScore | undefined =
    job?.status === "complete" && job.result ? job.result : undefined;
  const analyzeFailed = job?.status === "failed";
  const analyzeError = job?.error;
  const loading = analysis.isLoading;
  const err = analysis.isError;
  const risk100 = wallet ? Math.round(wallet.risk_score * 100) : 0;

  return (
    <BBSiteShell>
      <BBHeader />
      <main className="mx-auto max-w-4xl px-4 py-10">
        <Link href="/" className="text-sm text-[#4ef3e6] hover:underline">
          ← Back to dashboard
        </Link>

        <div className="relative mt-8 overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-[#121820] to-[#0a0e12] p-6 shadow-2xl shadow-black/60 sm:p-8">
          <div className="pointer-events-none absolute -right-20 -top-20 h-56 w-56 rounded-full bg-[#4ef3e6]/10 blur-3xl" />
          <h1 className="relative text-xl font-bold text-white sm:text-2xl">
            Wallet risk check
          </h1>
          <p className="relative mt-2 max-w-xl text-sm leading-relaxed text-zinc-400">
            <strong className="font-medium text-zinc-300">On-chain</strong> means anything recorded
            publicly on Ethereum (transfers &amp; contract calls anyone can look up). We turn that
            into a 0–100 <strong className="font-medium text-zinc-300">risk score</strong> for
            triage—not legal or investment advice.
          </p>
        </div>

        {loading && (
          <p className="mt-8 text-sm text-zinc-500">Running analysis…</p>
        )}
        {err && !wallet && (
          <p className="mt-8 text-sm text-rose-400">
            Could not reach API. Run <span className="font-mono">make dev</span> or check
            NEXT_PUBLIC_API_URL.
          </p>
        )}
        {analyzeFailed && analyzeError && (
          <p className="mt-8 rounded-lg border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
            <strong className="font-medium">Scoring failed.</strong> {analyzeError}
          </p>
        )}

        {wallet && (
          <div className="mt-10 space-y-8">
            <div className="rounded-2xl border border-[#4ef3e6]/20 bg-[#121820]/90 p-6">
              <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="font-mono text-xs text-zinc-500" title="Public Ethereum address">
                    {wallet.address}
                  </p>
                  <div className="mt-3 flex flex-col gap-2">
                    <div title={labelExplain(wallet.label)}>
                      <div className="flex flex-wrap items-center gap-2">
                        <BBClassBadge label={wallet.label} />
                        <span className="text-sm font-medium text-zinc-300">
                          {labelPlainName(wallet.label)}
                        </span>
                      </div>
                      <p className="mt-1.5 max-w-md text-[11px] leading-snug text-zinc-500">
                        {labelShortExplain(wallet.label)}
                      </p>
                    </div>
                    <div className="flex flex-wrap items-baseline gap-2">
                      <span className="font-mono text-4xl font-bold text-white">
                        {risk100}
                        <span className="text-lg text-zinc-500">/100</span>
                      </span>
                      <span className="text-xs text-zinc-500">risk</span>
                    </div>
                  </div>
                  <div className="mt-3 h-3 max-w-xs overflow-hidden rounded-full bg-zinc-800">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-emerald-500 via-amber-400 to-red-500"
                      style={{ width: `${risk100}%` }}
                    />
                  </div>
                  <div className="mt-3 flex flex-wrap gap-1">
                    {sourceTags(wallet.label).map((t) => (
                      <span
                        key={t}
                        title={methodologyTagExplain(t)}
                        className="cursor-help rounded border border-white/10 bg-black/40 px-2 py-0.5 font-mono text-[9px] uppercase text-zinc-500"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                  <p className="mt-2 max-w-md text-[11px] leading-snug text-zinc-600">
                    Tags = which intel layer fits best (e.g. Tornado, OFAC). Hover a tag for a one-line
                    definition.
                  </p>
                </div>
                <div className="space-y-3 text-right text-xs text-zinc-500 sm:min-w-[12rem]">
                  <div>
                    <p className="font-medium text-zinc-400">Confidence</p>
                    <p className="font-mono text-zinc-300">{(wallet.confidence * 100).toFixed(0)}%</p>
                    <p className="mt-1 text-[10px] leading-snug text-zinc-600">
                      How sure the model is of its top label—not proof of wrongdoing.
                    </p>
                  </div>
                  <div>
                    <p className="font-medium text-zinc-400">Model</p>
                    <p className="font-mono text-[#4ef3e6]">{wallet.model_version}</p>
                    <p className="mt-1 text-[10px] leading-snug text-zinc-600">
                      {wallet.model_version.startsWith("xgb-")
                        ? "Trained XGBoost on live features from Etherscan."
                        : wallet.model_version.startsWith("heuristic")
                          ? "Rules on live-engineered features; add xgb.json for full ML."
                          : "Legacy demo scorer — use ETHERSCAN + checkpoint for production."}
                    </p>
                  </div>
                  <div>
                    <p className="font-medium text-zinc-400">Activity</p>
                    <p className="font-mono text-zinc-300">
                      ~{mockTxCount(wallet.address, wallet).toLocaleString()} txs
                    </p>
                    <p className="mt-1 text-[10px] leading-snug text-zinc-600">
                      Heuristic from features (not an explorer tx total).
                    </p>
                  </div>
                  {wallet.prediction_id && (
                    <p className="max-w-[220px] truncate font-mono text-[10px] text-zinc-600">
                      ID: {wallet.prediction_id}
                    </p>
                  )}
                </div>
              </div>

              <div className="mt-8 border-t border-white/5 pt-5">
                <h3
                  className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#4ef3e6]"
                  title="Model attribution (not $). Hover each row for detail."
                >
                  Top signals
                </h3>
                <p className="mt-2 max-w-2xl text-[11px] leading-relaxed text-zinc-500">
                  Behaviors derived from public ledger data.{" "}
                  <strong className="font-medium text-zinc-400">Impact</strong> = how much this
                  signal nudged the score in the model’s explanation (not dollars). Hover a row for
                  more detail.
                </p>
                <ul className="mt-3 space-y-2">
                  {wallet.top_features.map((f) => {
                    const { title, short, hint } = featureCopy(f.feature);
                    return (
                      <li
                        key={f.feature}
                        title={hint}
                        className="flex cursor-help items-center justify-between gap-3 rounded-lg border border-white/5 bg-black/30 px-3 py-2.5 text-sm"
                      >
                        <div className="min-w-0 flex-1">
                          <span className="font-sans text-zinc-200">{title}</span>
                          <span className="mt-0.5 block text-[11px] leading-snug text-zinc-500">
                            {short}
                          </span>
                          <span className="mt-1 block font-mono text-[11px] text-zinc-600">
                            {f.feature}={String(f.value)}
                          </span>
                        </div>
                        <span
                          className={
                            f.shap_contribution > 0
                              ? "shrink-0 font-mono text-rose-400"
                              : "shrink-0 font-mono text-emerald-400"
                          }
                        >
                          {f.shap_contribution > 0 ? "+" : ""}
                          {f.shap_contribution.toFixed(2)}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              </div>

              <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    disabled={!wallet.prediction_id || feedback.isPending}
                    onClick={() =>
                      wallet.prediction_id &&
                      feedback.mutate({
                        prediction_id: wallet.prediction_id,
                        verdict: "correct",
                      })
                    }
                    className="rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm text-zinc-200 transition hover:border-[#4ef3e6]/50 hover:text-[#4ef3e6] disabled:opacity-40"
                  >
                    👍 Looks right
                  </button>
                  <button
                    type="button"
                    disabled={!wallet.prediction_id || feedback.isPending}
                    onClick={() =>
                      wallet.prediction_id &&
                      feedback.mutate({
                        prediction_id: wallet.prediction_id,
                        verdict: "incorrect",
                      })
                    }
                    className="rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm text-zinc-200 transition hover:border-rose-400/50 hover:text-rose-400 disabled:opacity-40"
                  >
                    👎 Looks wrong
                  </button>
                </div>
                {!wallet.prediction_id && (
                  <p className="max-w-md text-xs text-zinc-600">
                    Feedback disabled — configure Supabase (service role) on the API.
                  </p>
                )}
              </div>
              {feedbackMsg && (
                <p className="mt-3 text-xs text-zinc-400">{feedbackMsg}</p>
              )}
            </div>

            <BBLedgerNetwork address={address} riskLabel={wallet.label} />
          </div>
        )}

        <p className="mt-10 text-center text-xs text-zinc-600">
          Signals for review only — not legal findings or enforcement.
        </p>
      </main>
    </BBSiteShell>
  );
}
