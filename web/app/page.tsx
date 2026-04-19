"use client";

import { useQuery } from "@tanstack/react-query";
import { BBHeader } from "@/components/bb-header";
import { BBHero } from "@/components/bb-hero";
import { BBLedgerNetwork } from "@/components/bb-ledger-network";
import { BBMLAnalytics } from "@/components/bb-ml-analytics";
import { BBPipeline } from "@/components/bb-pipeline";
import { BBSiteShell } from "@/components/bb-site-shell";
import { BBStatPills } from "@/components/bb-stat-pills";
import { BBTicker } from "@/components/bb-ticker";
import { BBTriageTable } from "@/components/bb-triage-table";
import { api } from "@/lib/api";
import { mockStats, mockWallets } from "@/lib/mock";

const MODEL_UI = "V3.1.2";

export default function DashboardPage() {
  const statsQ = useQuery({
    queryKey: ["stats"],
    queryFn: () => api.stats(),
    retry: 1,
  });

  const recentQ = useQuery({
    queryKey: ["recent-wallets"],
    queryFn: () => api.recentWallets(10),
    retry: 1,
  });

  const stats = statsQ.data ?? mockStats;
  const wallets = recentQ.data ?? mockWallets;

  return (
    <BBSiteShell>
      <BBHeader modelVersion={MODEL_UI} />
      <main>
        <BBHero stats={stats} modelVersion={MODEL_UI} />
        <BBTicker />
        {(statsQ.isError || recentQ.isError) && (
          <p className="mx-auto max-w-2xl px-4 text-center text-xs text-amber-400/90">
            API unreachable — showing mock queue. Run <span className="font-mono">make dev</span> or set
            NEXT_PUBLIC_API_URL.
          </p>
        )}
        <div className="mx-auto max-w-6xl px-4 py-10">
          <BBStatPills stats={stats} />
        </div>
        <div id="queue" className="mx-auto max-w-6xl scroll-mt-24 px-4 pb-10">
          <BBTriageTable wallets={wallets} />
        </div>
        <div className="mx-auto grid max-w-6xl gap-8 px-4 pb-8 lg:grid-cols-2">
          <BBLedgerNetwork />
          <BBMLAnalytics wallets={wallets} />
        </div>
        <BBPipeline />
        <footer className="border-t border-white/5 px-4 py-8 text-center text-xs text-zinc-600">
          Results are risk signals for analyst review — not enforcement decisions.
        </footer>
      </main>
    </BBSiteShell>
  );
}
