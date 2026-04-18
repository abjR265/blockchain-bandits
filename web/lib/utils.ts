import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function shortAddress(address: string, chars: number = 4): string {
  if (!address || address.length < chars * 2 + 2) return address;
  return `${address.slice(0, chars + 2)}...${address.slice(-chars)}`;
}

export function riskBucket(score: number): "low" | "medium" | "high" {
  if (score < 0.3) return "low";
  if (score < 0.7) return "medium";
  return "high";
}
