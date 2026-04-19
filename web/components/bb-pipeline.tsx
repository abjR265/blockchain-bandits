import { ShieldCheck } from "lucide-react";

const STEPS = [
  {
    id: "01",
    title: "Ingest",
    head: "BigQuery extract",
    body: "Partitioned, dry-run gated, 5GB/query ceiling.",
  },
  {
    id: "02",
    title: "Label",
    head: "Snorkel LabelModel",
    body: "8 LFs over OFAC, CSDB, Tornado, MEV, Etherscan.",
  },
  {
    id: "03",
    title: "Train",
    head: "XGBoost + calibration",
    body: "Temporal CV, focal loss, isotonic per-class.",
  },
  {
    id: "04",
    title: "Serve",
    head: "FastAPI + contribs",
    body: "In-process inference, top-3 feature contributions.",
  },
];

export function BBPipeline() {
  return (
    <section className="mx-auto max-w-6xl px-4 py-16">
      <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-[#4ef3e6]">
        /03 · How it works
      </p>
      <h2 className="mt-2 text-2xl font-bold tracking-tight text-white sm:text-3xl">
        From raw chain to risk score.
      </h2>
      <div className="mt-8 rounded-2xl border border-white/10 bg-[#121820]/60 p-6 backdrop-blur-sm">
        <div className="grid gap-6 md:grid-cols-4 md:gap-2">
          {STEPS.map((s, i) => (
            <div key={s.id} className="relative md:border-r md:border-white/5 md:pr-4 md:last:border-0">
              {i < STEPS.length - 1 && (
                <span className="absolute -right-1 top-8 hidden text-[#4ef3e6]/50 md:block">
                  →
                </span>
              )}
              <p className="font-mono text-[10px] text-zinc-500">
                /{s.id} · {s.title}
              </p>
              <p className="mt-2 font-semibold text-zinc-100">{s.head}</p>
              <p className="mt-1 text-xs leading-relaxed text-zinc-500">{s.body}</p>
            </div>
          ))}
        </div>
        <div className="mt-6 flex items-start gap-3 rounded-xl border border-[#4ef3e6]/25 bg-[#4ef3e6]/5 p-4">
          <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-[#4ef3e6]" />
          <p className="text-xs leading-relaxed text-zinc-400">
            <span className="font-semibold uppercase tracking-wide text-[#7afbf0]">
              Feedback loop
            </span>{" "}
            · Every thumbs up/down writes to <span className="font-mono text-zinc-300">feedback</span>{" "}
            in Postgres. That table is the only fully-supervised signal joined into the next retrain.
          </p>
        </div>
      </div>
    </section>
  );
}
