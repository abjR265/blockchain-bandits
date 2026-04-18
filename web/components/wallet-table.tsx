import Link from "next/link";
import { RiskPill } from "./risk-pill";
import { shortAddress } from "@/lib/utils";
import type { WalletScore } from "@/lib/types";

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const h = Math.floor(diff / 3600_000);
  const d = Math.floor(h / 24);
  if (d >= 1) return `${d} day${d > 1 ? "s" : ""} ago`;
  if (h >= 1) return `${h} hr${h > 1 ? "s" : ""} ago`;
  return "just now";
}

export function WalletTable({ wallets }: { wallets: WalletScore[] }) {
  return (
    <div className="overflow-hidden rounded-lg border border-neutral-200 bg-white">
      <table className="w-full text-sm">
        <thead className="border-b border-neutral-200 bg-neutral-50 text-left text-xs uppercase tracking-wide text-neutral-500">
          <tr>
            <th className="px-4 py-3 font-medium">Wallet</th>
            <th className="px-4 py-3 font-medium">Label</th>
            <th className="px-4 py-3 font-medium">Risk score</th>
            <th className="px-4 py-3 font-medium">Last active</th>
          </tr>
        </thead>
        <tbody>
          {wallets.map((w) => (
            <tr
              key={w.address}
              className="border-b border-neutral-100 last:border-b-0 hover:bg-neutral-50"
            >
              <td className="px-4 py-3 font-mono text-neutral-900">
                <Link href={`/wallet/${w.address}`} className="hover:underline">
                  {shortAddress(w.address)}
                </Link>
              </td>
              <td className="px-4 py-3">
                <RiskPill label={w.label} />
              </td>
              <td className="px-4 py-3 font-mono">{w.risk_score.toFixed(2)}</td>
              <td className="px-4 py-3 text-neutral-600">{timeAgo(w.last_active)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
