import { cn } from "@/lib/utils";
import type { RiskLabel } from "@/lib/types";

const LABEL_STYLES: Record<RiskLabel, string> = {
  phishing: "bg-red-100 text-red-700",
  sanctioned: "bg-red-100 text-red-700",
  mixer_usage: "bg-amber-100 text-amber-700",
  bot_activity: "bg-orange-100 text-orange-700",
  legitimate: "bg-emerald-100 text-emerald-700",
  unknown: "bg-gray-100 text-gray-600",
};

const LABEL_TEXT: Record<RiskLabel, string> = {
  phishing: "Phishing",
  sanctioned: "Sanctioned",
  mixer_usage: "Mixer usage",
  bot_activity: "Bot activity",
  legitimate: "Legitimate",
  unknown: "Unknown",
};

export function RiskPill({ label }: { label: RiskLabel }) {
  return <span className={cn("pill", LABEL_STYLES[label])}>{LABEL_TEXT[label]}</span>;
}
