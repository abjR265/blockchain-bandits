"use client";

import { Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function BBSearch() {
  const [query, setQuery] = useState("");
  const router = useRouter();

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const t = query.trim();
    if (!t) return;
    router.push(`/wallet/${t}`);
  }

  return (
    <form onSubmit={onSubmit} className="relative w-full max-w-2xl">
      <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-[#121820] py-1.5 pl-3 pr-1.5 shadow-inner shadow-black/40">
        <Search className="h-4 w-4 shrink-0 text-zinc-500" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="0x… paste an Ethereum address to triage"
          className="min-w-0 flex-1 bg-transparent py-2.5 font-mono text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none"
        />
        <button
          type="submit"
          className="shrink-0 rounded-lg bg-[#4ef3e6] px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-[#0a0e12] transition hover:bg-[#7afbf0] active:scale-[0.98]"
        >
          Analyze →
        </button>
      </div>
      <p className="mt-3 text-center text-xs text-zinc-500">
        Try:{" "}
        <button
          type="button"
          onClick={() =>
            router.push("/wallet/0x3fC9a12E000000000000000000000000000000a1")
          }
          className="font-mono text-[#4ef3e6] hover:underline"
        >
          0x3fC9…00a1
        </button>
        {" · "}
        <button
          type="button"
          onClick={() =>
            router.push("/wallet/0xA8b277dF000000000000000000000000000000a2")
          }
          className="font-mono text-[#4ef3e6] hover:underline"
        >
          0xA8b2…00a2
        </button>
        {" · "}
        <LinkInline href="/#queue">open triage queue ↓</LinkInline>
      </p>
    </form>
  );
}

function LinkInline({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a href={href} className="text-[#4ef3e6] hover:underline">
      {children}
    </a>
  );
}
