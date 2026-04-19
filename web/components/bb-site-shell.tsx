import { cn } from "@/lib/utils";

export function BBSiteShell({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "relative min-h-screen overflow-x-hidden bg-[#0a0e12] text-zinc-100",
        className,
      )}
    >
      <div
        className="pointer-events-none fixed inset-0 opacity-[0.35]"
        style={{
          backgroundImage: `
            linear-gradient(rgba(78, 243, 230, 0.06) 1px, transparent 1px),
            linear-gradient(90deg, rgba(78, 243, 230, 0.06) 1px, transparent 1px)
          `,
          backgroundSize: "48px 48px",
        }}
      />
      <div className="pointer-events-none fixed -right-32 -top-32 h-96 w-96 rounded-full bg-[#4ef3e6]/10 blur-[100px]" />
      <div className="pointer-events-none fixed -bottom-24 -left-24 h-72 w-72 rounded-full bg-violet-600/15 blur-[90px]" />
      <div className="relative z-10">{children}</div>
    </div>
  );
}
