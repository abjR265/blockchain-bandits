import { BBSearch } from "./bb-search";
import type { DashboardStats } from "@/lib/types";

export function BBHero({
  stats,
  modelVersion = "V3.1.2",
}: {
  stats: DashboardStats;
  modelVersion?: string;
}) {
  const indexed = Math.max(0, stats.wallets_scanned - 128).toLocaleString();

  return (
    <section id="top" className="mx-auto max-w-4xl px-4 pt-10 text-center sm:pt-14">
      <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[#4ef3e6]/25 bg-[#4ef3e6]/5 px-4 py-1.5 text-[11px] font-medium uppercase tracking-[0.12em] text-[#7afbf0]">
        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#4ef3e6]" />
        Live · {indexed} wallets indexed · model {modelVersion}
      </div>
      <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl md:text-5xl md:leading-tight">
        Risk intelligence for{" "}
        <span className="text-[#2dd4bf] text-glow-cyan">Ethereum wallets</span>.
      </h1>
      <p className="mx-auto mt-5 max-w-2xl font-sans text-sm font-normal leading-relaxed text-zinc-300 sm:text-base">
        Calibrated, explainable, analyst-in-the-loop triage. Built on public on-chain data,
        OFAC, CryptoScamDB, and curated MEV signals. Outputs are{" "}
        <span className="text-zinc-300">decision-support</span>, never decision-automation.
      </p>
      <div className="mt-10 flex justify-center">
        <BBSearch />
      </div>
    </section>
  );
}
