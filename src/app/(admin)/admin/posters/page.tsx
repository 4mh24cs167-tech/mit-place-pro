"use client";

import Header from "@/components/layout/Header";
import { cn } from "@/lib/utils";
import {
  Image,
  Plus,
  Download,
  Eye,
  Loader2,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Palette,
} from "lucide-react";

const posters = [
  { id: "p1", company: "Infosys", title: "Infosys Campus Placement Drive 2026", date: "May 18, 2026", status: "done" as const, previewColor: "from-blue-600 to-indigo-700" },
  { id: "p2", company: "TCS", title: "TCS Campus Hiring – BE/BTech 2026", date: "May 19, 2026", status: "done" as const, previewColor: "from-slate-700 to-slate-900" },
  { id: "p3", company: "Wipro", title: "Wipro Elite NTH Recruitment", date: "May 20, 2026", status: "generating" as const, previewColor: "from-violet-600 to-purple-700" },
  { id: "p4", company: "Bosch", title: "Bosch Engineering Talent Drive", date: "May 22, 2026", status: "queued" as const, previewColor: "from-red-600 to-rose-700" },
];

const statusConfig = {
  done: { label: "Generated", icon: CheckCircle2, color: "text-emerald-600", bg: "bg-emerald-50" },
  generating: { label: "Generating...", icon: Loader2, color: "text-violet-600", bg: "bg-violet-50" },
  queued: { label: "Queued", icon: RefreshCw, color: "text-amber-600", bg: "bg-amber-50" },
  failed: { label: "Failed", icon: XCircle, color: "text-red-600", bg: "bg-red-50" },
};

export default function AdminPostersPage() {
  return (
    <div className="page-enter">
      <Header
        userName="Dr. Placement Head"
        userRole="Admin"
        greeting="Placement Posters"
        subtitle="Auto-generate placement announcement posters via Node Canvas"
      />

      <div className="px-8 pb-10 space-y-6">
        {/* Info */}
        <div className="i-card p-5 flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-pink-50 flex items-center justify-center flex-shrink-0">
            <Palette className="w-6 h-6 text-pink-600" />
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-semibold text-foreground">Automated Poster Generation</h3>
            <p className="text-xs text-muted-foreground mt-1">
              Posters are automatically generated server-side using Node.js Canvas with JSON-based templates from S3.
              Each poster includes company branding, job details, eligibility criteria, and the MITM logo.
            </p>
          </div>
          <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-pink-600 to-rose-600 text-white text-sm font-semibold shadow-lg shadow-pink-500/20">
            <Plus className="w-4 h-4" />
            Create Poster
          </button>
        </div>

        {/* Poster Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {posters.map((poster) => {
            const sc = statusConfig[poster.status];
            const StatusIcon = sc.icon;
            return (
              <div key={poster.id} className="i-card overflow-hidden group cursor-pointer">
                {/* Poster preview */}
                <div className={cn(
                  "h-48 bg-gradient-to-br relative flex flex-col items-center justify-center p-6 text-center",
                  poster.previewColor
                )}>
                  <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center mb-3">
                    <span className="text-white text-lg font-bold">{poster.company.charAt(0)}</span>
                  </div>
                  <h4 className="text-white text-sm font-bold leading-tight">{poster.title}</h4>
                  <p className="text-white/70 text-[10px] mt-2">MITM College · {poster.date}</p>

                  {/* Overlay on hover */}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                    <button className="p-2.5 rounded-xl bg-white/20 backdrop-blur-sm hover:bg-white/30 transition-colors">
                      <Eye className="w-5 h-5 text-white" />
                    </button>
                    <button className="p-2.5 rounded-xl bg-white/20 backdrop-blur-sm hover:bg-white/30 transition-colors">
                      <Download className="w-5 h-5 text-white" />
                    </button>
                  </div>
                </div>

                {/* Info */}
                <div className="p-4">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-foreground">{poster.company}</p>
                    <span className={cn(
                      "text-[10px] font-semibold px-2 py-0.5 rounded-full inline-flex items-center gap-1",
                      sc.bg, sc.color
                    )}>
                      <StatusIcon className={cn("w-3 h-3", poster.status === "generating" && "animate-spin")} />
                      {sc.label}
                    </span>
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-1">{poster.date}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Template settings */}
        <div className="i-card p-6">
          <h3 className="text-base font-semibold text-foreground mb-4">Poster Templates</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {["Default MITM Template", "Minimal Corporate", "Vibrant Campus"].map((tmpl, i) => (
              <div key={tmpl} className={cn(
                "p-4 rounded-xl border-2 cursor-pointer transition-all",
                i === 0 ? "border-primary bg-primary/5" : "border-border hover:border-primary/30"
              )}>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-medium text-foreground">{tmpl}</p>
                  {i === 0 && (
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-primary text-white">Active</span>
                  )}
                </div>
                <p className="text-[10px] text-muted-foreground">1080 × 1080px · PNG output</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
