import Link from "next/link";
import { BBHeader } from "@/components/bb-header";
import { BBPipeline } from "@/components/bb-pipeline";
import { BBSiteShell } from "@/components/bb-site-shell";

export default function AboutPage() {
  return (
    <BBSiteShell>
      <BBHeader />
      <main className="mx-auto max-w-3xl px-4 py-16">
        <Link href="/" className="text-sm text-[#4ef3e6] hover:underline">
          ← Back
        </Link>
        <h1 className="mt-6 text-3xl font-bold text-white">About Blockchain-Bandits</h1>
        <p className="mt-4 leading-relaxed text-zinc-400">
          A class project for calibrated Ethereum wallet triage: BigQuery ingestion, Snorkel weak
          supervision, XGBoost with isotonic calibration, FastAPI inference, and analyst feedback
          stored in Postgres (Supabase).
        </p>
        <p className="mt-4 text-sm text-zinc-500">
          See <code className="rounded bg-white/5 px-1 font-mono text-zinc-300">docs/PROJECT_SUMMARY.md</code>{" "}
          for the full writeup.
        </p>
      </main>
      <BBPipeline />
      <footer className="border-t border-white/5 px-4 py-8 text-center text-xs text-zinc-600">
        Decision-support only — not enforcement automation.
      </footer>
    </BBSiteShell>
  );
}
