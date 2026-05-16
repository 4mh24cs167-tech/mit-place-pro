"use client";

import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import type { LucideIcon } from "lucide-react";

interface StatsCardProps {
  title: string;
  value: string | number;
  change?: number;
  changeLabel?: string;
  icon: LucideIcon;
  variant?: "indigo" | "emerald" | "amber" | "rose";
}

const variantStyles = {
  indigo: {
    bg: "stat-card-indigo",
    iconBg: "bg-white/20",
    text: "text-white",
    muted: "text-indigo-100/80",
  },
  emerald: {
    bg: "stat-card-emerald",
    iconBg: "bg-white/20",
    text: "text-white",
    muted: "text-emerald-100/80",
  },
  amber: {
    bg: "stat-card-amber",
    iconBg: "bg-white/20",
    text: "text-white",
    muted: "text-amber-100/80",
  },
  rose: {
    bg: "stat-card-rose",
    iconBg: "bg-white/20",
    text: "text-white",
    muted: "text-rose-100/80",
  },
};

export default function StatsCard({
  title,
  value,
  change,
  changeLabel,
  icon: Icon,
  variant = "indigo",
}: StatsCardProps) {
  const styles = variantStyles[variant];

  return (
    <div className={cn("rounded-2xl p-5 relative overflow-hidden", styles.bg)}>
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-24 h-24 rounded-full bg-white/[0.06] -translate-y-8 translate-x-8" />
      <div className="absolute bottom-0 left-0 w-16 h-16 rounded-full bg-white/[0.04] translate-y-8 -translate-x-6" />

      <div className="relative z-10">
        <div className="flex items-start justify-between mb-4">
          <div className={cn("p-2.5 rounded-xl", styles.iconBg)}>
            <Icon className="w-5 h-5 text-white" />
          </div>
          {change !== undefined && (
            <div className={cn(
              "flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium",
              change > 0 ? "bg-white/20 text-white" : change < 0 ? "bg-white/20 text-white" : "bg-white/20 text-white"
            )}>
              {change > 0 ? (
                <TrendingUp className="w-3 h-3" />
              ) : change < 0 ? (
                <TrendingDown className="w-3 h-3" />
              ) : (
                <Minus className="w-3 h-3" />
              )}
              <span>{Math.abs(change)}%</span>
            </div>
          )}
        </div>

        <div>
          <p className={cn("text-3xl font-extrabold tracking-tight", styles.text)}>
            {typeof value === "number" ? value.toLocaleString("en-IN") : value}
          </p>
          <p className={cn("text-sm mt-1 font-medium", styles.muted)}>
            {title}
          </p>
          {changeLabel && (
            <p className={cn("text-[11px] mt-0.5", styles.muted, "opacity-70")}>{changeLabel}</p>
          )}
        </div>
      </div>
    </div>
  );
}
