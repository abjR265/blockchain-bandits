import { SearchBar } from "@/components/search-bar";
import { StatCard } from "@/components/stat-card";
import { WalletTable } from "@/components/wallet-table";
import { mockStats, mockWallets } from "@/lib/mock";

export default function DashboardPage() {
  const stats = mockStats;
  const wallets = mockWallets;

  return (
    <div className="min-h-screen bg-neutral-50 px-6 py-8">
      <div className="mx-auto max-w-6xl space-y-6">
        {/* Header */}
        <header className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-semibold text-neutral-900">Chain Intel</h1>
              <span className="text-sm text-neutral-500">Dashboard</span>
            </div>
          </div>
          <div className="text-sm text-neutral-500">Ethereum · Base · Polygon</div>
        </header>

        {/* Search */}
        <section>
          <SearchBar />
        </section>

        {/* Stats */}
        <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <StatCard label="Wallets scanned" value={`${(stats.wallets_scanned / 1_000_000).toFixed(1)}M`} />
          <StatCard label="Flagged today" value={stats.flagged_today} />
          <StatCard label="Avg. risk score" value={stats.avg_risk_score.toFixed(2)} />
        </section>

        {/* Wallet table */}
        <section>
          <WalletTable wallets={wallets} />
        </section>

        {/* Footer disclaimer */}
        <footer className="pt-4 text-xs text-neutral-500">
          Results are risk signals for analyst review — not enforcement decisions.
        </footer>
      </div>
    </div>
  );
}
