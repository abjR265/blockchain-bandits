import type {
  AnalysisJob,
  DashboardStats,
  FeedbackPayload,
  WalletScore,
} from "./types";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

async function req<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });
  if (!res.ok) {
    throw new Error(`API ${res.status}: ${await res.text()}`);
  }
  return res.json() as Promise<T>;
}

export const api = {
  health: () => req<{ status: string }>("/health"),

  stats: () => req<DashboardStats>("/stats"),

  recentWallets: (limit = 10) =>
    req<WalletScore[]>(`/wallets/recent?limit=${limit}`),

  analyze: (address: string) =>
    req<AnalysisJob>("/analyze", {
      method: "POST",
      body: JSON.stringify({ address }),
    }),

  jobStatus: (jobId: string) => req<AnalysisJob>(`/analyze/${jobId}`),

  submitFeedback: (payload: FeedbackPayload) =>
    req<{ ok: true }>("/feedback", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
};
