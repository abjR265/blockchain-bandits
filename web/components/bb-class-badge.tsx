import type { RiskLabel } from "@/lib/types";
import { cn } from "@/lib/utils";

const LABEL_STYLE: Record<string, string> = {
  sanctioned: "border-red-500/50 bg-red-500/10 text-red-300",
  phishing: "border-orange-500/50 bg-orange-500/10 text-orange-300",
  mixer_usage: "border-amber-400/50 bg-amber-400/10 text-amber-200",
  bot_activity: "border-sky-500/50 bg-sky-500/10 text-sky-300",
  legitimate: "border-emerald-500/50 bg-emerald-500/10 text-emerald-300",
  unknown: "border-zinc-500/50 bg-zinc-500/10 text-zinc-300",
};

export function BBClassBadge({ label }: { label: RiskLabel }) {
  const u = label.toUpperCase().replace(/_/g, " ");
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide",
        LABEL_STYLE[label] ?? LABEL_STYLE.unknown,
      )}
    >
      <span className="h-1 w-1 rounded-full bg-current opacity-80" />
      {u}
    </span>
  );
}
