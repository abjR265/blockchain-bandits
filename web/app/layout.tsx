import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";

/** UI copy: Inter (reference: Geist / Inter / Roboto). Technical: JetBrains Mono. */
const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const mono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Blockchain-Bandits — Wallet risk intel",
  description:
    "Calibrated Ethereum wallet triage. Risk signals for analyst review — not enforcement decisions.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${mono.variable}`}>
      <body className="min-h-screen bg-[#0a0e12] font-sans antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
