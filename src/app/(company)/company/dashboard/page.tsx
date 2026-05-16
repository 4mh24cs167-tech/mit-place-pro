"use client";

import Header from "@/components/layout/Header";
import { cn } from "@/lib/utils";
import {
  Plus,
  ArrowUpRight,
  Calendar,
  CheckCircle2,
  Users,
  TrendingUp,
  SlidersHorizontal,
  FileText,
  Award,
} from "lucide-react";

const pipelineStages = [
  { name: "Applied", count: 120, color: "bg-muted" },
  { name: "ATS Cleared", count: 78, color: "activity-green" },
  { name: "Round 1", count: 45, color: "activity-gray" },
  { name: "Round 2", count: 22, color: "activity-purple" },
  { name: "Selected", count: 8, color: "bg-accent-green" },
];

const recentCandidates = [
  { name: "Meera Nair", dept: "CSE", ats: 95, status: "Shortlisted" },
  { name: "Priya Patel", dept: "CSE", ats: 88, status: "Selected" },
  { name: "Arjun Sharma", dept: "CSE", ats: 82, status: "Round 2" },
  { name: "Ananya Iyer", dept: "CSE", ats: 91, status: "Shortlisted" },
];

export default function CompanyDashboardPage() {
  return (
    <div className="page-enter">
      <Header
        userName="HR Manager"
        userRole="Company"
        greeting="Good morning, HR!"
        subtitle="Let's make this day productive."
      />

      <div className="px-8 pb-10">
        {/* Stats row */}
        <div className="flex items-center gap-8 mb-8 -mt-2">
          <div className="flex-1" />
          <div>
            <p className="text-sm text-muted-foreground">Total Applicants</p>
            <p className="text-4xl font-bold text-foreground tracking-tight">
              120<span className="stat-arrow text-muted-foreground">↗</span>
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Offers Sent</p>
            <p className="text-4xl font-bold text-foreground tracking-tight">
              8<span className="stat-arrow text-muted-foreground">↗</span>
            </p>
          </div>
          <button className="i-btn-dark">
            <Plus className="w-4 h-4" />
            Post Job
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
          {/* Recruitment funnel */}
          <div className="lg:col-span-3 i-card p-6">
            <div className="flex items-start justify-between mb-5">
              <div>
                <h2 className="text-lg font-semibold text-foreground">Recruitment Pipeline</h2>
                <p className="text-sm text-muted-foreground">Candidate flow through stages</p>
              </div>
              <button className="i-btn-icon">
                <SlidersHorizontal className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>

            <div className="space-y-3">
              {pipelineStages.map((stage) => (
                <div key={stage.name} className="flex items-center gap-4">
                  <span className="text-xs text-muted-foreground w-24 text-right">{stage.name}</span>
                  <div className="flex-1 h-10 bg-muted/50 rounded-xl overflow-hidden relative">
                    <div
                      className={cn("h-full rounded-xl flex items-center px-4 transition-all duration-700", stage.color)}
                      style={{ width: `${(stage.count / 120) * 100}%` }}
                    >
                      <span className="text-xs font-bold text-foreground">{stage.count}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Top Candidates */}
          <div className="lg:col-span-2 i-card p-6">
            <div className="flex items-start justify-between mb-5">
              <div>
                <h2 className="text-lg font-semibold text-foreground">Top Candidates</h2>
                <p className="text-sm text-muted-foreground">Highest ATS scores</p>
              </div>
              <button className="i-btn-icon">
                <ArrowUpRight className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>

            <div className="space-y-3">
              {recentCandidates.map((c, i) => (
                <div key={i} className="flex items-center gap-3 p-3 rounded-xl hover:bg-muted/30 transition-colors">
                  <div className="w-9 h-9 rounded-full bg-muted flex items-center justify-center text-xs font-bold text-foreground">
                    {c.name.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{c.name}</p>
                    <p className="text-[10px] text-muted-foreground">{c.dept}</p>
                  </div>
                  <div className="text-right">
                    <p className={cn(
                      "text-xs font-bold",
                      c.ats >= 90 ? "text-green-600" : c.ats >= 80 ? "text-blue-600" : "text-amber-600"
                    )}>
                      {c.ats}%
                    </p>
                    <p className="text-[10px] text-muted-foreground">{c.status}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mt-5">
          <div className="i-card p-6">
            <div className="flex items-start justify-between mb-5">
              <div>
                <h2 className="text-lg font-semibold text-foreground">To-do list</h2>
                <p className="text-sm text-muted-foreground">
                  {new Date().toLocaleDateString("en-US", { weekday: "long", day: "numeric", month: "long" })}
                </p>
              </div>
              <button className="i-btn-icon">
                <ArrowUpRight className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>
            <div className="space-y-4">
              {[
                { task: "Review 8 pending applications", done: false },
                { task: "Schedule Round 2 interviews", done: false },
                { task: "Send offer letters to selected", done: true },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-3 pb-4 border-b border-border last:border-0 last:pb-0">
                  <div className={cn(
                    "w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0",
                    item.done ? "bg-accent-green" : "border-2 border-border"
                  )}>
                    {item.done && <CheckCircle2 className="w-4 h-4 text-foreground" />}
                  </div>
                  <p className={cn("text-sm", item.done ? "text-muted-foreground line-through" : "text-foreground font-medium")}>
                    {item.task}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="i-card p-6">
            <div className="flex items-start justify-between mb-5">
              <div>
                <h2 className="text-lg font-semibold text-foreground">Summary</h2>
                <p className="text-sm text-muted-foreground">Track your recruitment</p>
              </div>
              <div className="flex items-center gap-2">
                <button className="i-btn-icon !w-9 !h-9">
                  <SlidersHorizontal className="w-4 h-4 text-muted-foreground" />
                </button>
                <button className="i-btn-icon !w-9 !h-9">
                  <ArrowUpRight className="w-4 h-4 text-muted-foreground" />
                </button>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {[
                { label: "Avg Time to Hire", value: "12 days", icon: "⏱️" },
                { label: "Acceptance Rate", value: "87%", icon: "✅" },
                { label: "JDs Posted", value: "3", icon: "📝" },
                { label: "Rounds Complete", value: "5/9", icon: "🎯" },
              ].map((s) => (
                <div key={s.label} className="p-4 rounded-xl bg-muted/30 text-center">
                  <span className="text-2xl">{s.icon}</span>
                  <p className="text-xl font-bold text-foreground mt-1">{s.value}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
