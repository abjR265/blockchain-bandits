import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Chain Intel — Blockchain Bandits",
  description:
    "AI-powered blockchain transaction intelligence. Risk signals for analyst review — not enforcement decisions.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
