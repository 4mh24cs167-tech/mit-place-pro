import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatLPA(lpa: number): string {
  return `₹${lpa} LPA`;
}

export function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function getATSColorClass(score: number): string {
  if (score >= 81) return "text-emerald-600 bg-emerald-50 border-emerald-200";
  if (score >= 66) return "text-blue-600 bg-blue-50 border-blue-200";
  if (score >= 41) return "text-amber-600 bg-amber-50 border-amber-200";
  return "text-red-600 bg-red-50 border-red-200";
}

export function getStatusConfig(status: string) {
  const configs: Record<string, { label: string; color: string; bg: string }> = {
    none: { label: "Not Started", color: "text-slate-500", bg: "bg-slate-100" },
    shortlisted: { label: "Shortlisted", color: "text-blue-600", bg: "bg-blue-50" },
    interview_scheduled: { label: "Interview Scheduled", color: "text-violet-600", bg: "bg-violet-50" },
    offered: { label: "Offered", color: "text-amber-600", bg: "bg-amber-50" },
    placed: { label: "Placed", color: "text-emerald-600", bg: "bg-emerald-50" },
    not_placed: { label: "Not Placed", color: "text-red-600", bg: "bg-red-50" },
  };
  return configs[status] || configs.none;
}
