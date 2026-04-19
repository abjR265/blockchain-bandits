const ITEMS = [
  { icon: "▶", text: "Drainer pattern detected" },
  { icon: "↑", text: "11 txs / block window" },
  { icon: "◇", text: "4d-old wallet" },
  { icon: "▶", text: "MEV cluster proximity" },
  { icon: "◇", text: "233 tx/day burst" },
  { icon: "▶", text: "Verified-contract-only path" },
  { icon: "◇", text: "Low risk · CEX adjacent" },
];

export function BBTicker() {
  const doubled = [...ITEMS, ...ITEMS];
  return (
    <div className="mt-12 border-y border-white/5 bg-black/30 py-2 motion-reduce:animate-none">
      <div className="relative overflow-hidden">
        <div className="flex w-max animate-bb-ticker gap-10 whitespace-nowrap py-2 font-mono text-[11px] uppercase tracking-wider motion-reduce:animate-none">
          {doubled.map((item, i) => (
            <span key={i} className="inline-flex items-center gap-2 text-zinc-400">
              <span className="text-[#4ef3e6]">{item.icon}</span>
              {item.text}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
