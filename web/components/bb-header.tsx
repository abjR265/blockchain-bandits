import Link from "next/link";
import { Shield } from "lucide-react";

export function BBHeader({ modelVersion = "V3.1.2" }: { modelVersion?: string }) {
  return (
    <header className="border-b border-white/5 bg-[#0a0e12]/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
        <Link href="/" className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-lg border border-[#4ef3e6]/40 bg-[#4ef3e6]/5">
            <Shield className="h-5 w-5 text-[#4ef3e6]" strokeWidth={1.5} />
          </span>
          <span className="leading-tight">
            <span className="block font-semibold tracking-tight text-white">
              Blockchain-Bandits
            </span>
            <span className="text-[10px] font-medium uppercase tracking-[0.2em] text-zinc-500">
              Wallet risk intel
            </span>
          </span>
        </Link>
        <nav className="hidden items-center gap-8 text-[11px] font-semibold uppercase tracking-[0.15em] text-zinc-400 md:flex">
          <Link href="/" className="text-[#4ef3e6] transition hover:text-[#7afbf0]">
            Dashboard
          </Link>
          <Link
            href="/wallet/0x3fC9a12E000000000000000000000000000000a1"
            className="transition hover:text-white"
          >
            Sample wallet
          </Link>
          <Link href="/about" className="transition hover:text-white">
            About
          </Link>
        </nav>
        <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-[10px] font-mono uppercase tracking-wider text-zinc-300">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
          </span>
          live · model {modelVersion}
        </div>
      </div>
    </header>
  );
}
