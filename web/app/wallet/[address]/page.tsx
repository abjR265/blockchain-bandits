import Link from "next/link";
import { RiskPill } from "@/components/risk-pill";
import { mockWallets } from "@/lib/mock";
import { shortAddress } from "@/lib/utils";
import type { WalletScore } from "@/lib/types";

// Placeholder detail page. Week-2: replace with live fetch from /analyze + /results.

export default function WalletDetailPage({
  params,
}: {
  params: { address: string };
}) {
  const wallet: WalletScore =
    mockWallets.find((w) => w.address.toLowerCase() === params.address.toLowerCase()) ?? {
      ...mockWallets[0],
      address: params.address,
    };

  return (
    <div className="min-h-screen bg-neutral-50 px-6 py-8">
      <div className="mx-auto max-w-4xl space-y-6">
        <Link href="/" className="text-sm text-neutral-500 hover:underline">
          ← Back to dashboard
        </Link>

        <div className="rounded-lg border border-neutral-200 bg-white p-6">
          <div className="flex items-start justify-between">
            <div>
              <div className="font-mono text-sm text-neutral-500">
                {shortAddress(wallet.address, 6)}
              </div>
              <div className="mt-2 flex items-center gap-3">
                <RiskPill label={wallet.label} />
                <span className="text-3xl font-semibold text-neutral-900">
                  {wallet.risk_score.toFixed(2)}
                </span>
                <span className="text-sm text-neutral-500">
                  confidence {(wallet.confidence * 100).toFixed(0)}%
                </span>
              </div>
            </div>
            <div className="text-right text-xs text-neutral-500">
              <div>Model {wallet.model_version}</div>
              <div>Scored {new Date(wallet.scored_at).toLocaleString()}</div>
            </div>
          </div>

          <div className="mt-6">
            <h3 className="text-sm font-semibold text-neutral-900">
              Why this score
            </h3>
            <ul className="mt-2 space-y-1 text-sm text-neutral-700">
              {wallet.top_features.map((f) => (
                <li key={f.feature} className="flex justify-between font-mono">
                  <span>
                    {f.feature} = {String(f.value)}
                  </span>
                  <span
                    className={
                      f.shap_contribution > 0
                        ? "text-red-600"
                        : "text-emerald-600"
                    }
                  >
                    {f.shap_contribution > 0 ? "+" : ""}
                    {f.shap_contribution.toFixed(2)}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          <div className="mt-6 flex items-center gap-2">
            <button className="rounded-md border border-neutral-200 px-3 py-1 text-sm hover:bg-neutral-50">
              👍 Correct
            </button>
            <button className="rounded-md border border-neutral-200 px-3 py-1 text-sm hover:bg-neutral-50">
              👎 Incorrect
            </button>
            <button className="ml-auto rounded-md border border-neutral-200 px-3 py-1 text-sm hover:bg-neutral-50">
              Ask Claude to interpret
            </button>
          </div>
        </div>

        <p className="text-xs text-neutral-500">
          Results are risk signals for analyst review — not enforcement decisions.
        </p>
      </div>
    </div>
  );
}
