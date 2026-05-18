"use client";

import Header from "@/components/layout/Header";
import { companyApi } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { cn } from "@/lib/utils";
import {
  Plus,
  ArrowUpRight,
  CheckCircle2,
  SlidersHorizontal,
  Users,
  Briefcase,
} from "lucide-react";
import { useState, useEffect, useCallback } from "react";

interface Job {
  id: string;
  title?: string;
  totalApplicants?: number;
  selected?: number;
  status?: string;
}

interface Candidate {
  name: string;
  dept: string;
  ats: number;
  status: string;
}

export default function CompanyDashboardPage() {
  const { user } = useAuth();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [jobRes, candRes] = await Promise.allSettled([
        companyApi.getJobs(),
        companyApi.getShortlist(),
      ]);

      if (jobRes.status === "fulfilled") {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const data = (jobRes.value as any)?.data;
        setJobs(Array.isArray(data) ? data : []);
      }
      if (candRes.status === "fulfilled") {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const data = (candRes.value as any)?.data;
        if (Array.isArray(data)) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          setCandidates(data.slice(0, 5).map((c: any) => ({
            name: c.student?.fullName || c.fullName || "Candidate",
            dept: c.student?.department || c.department || "—",
            ats: c.atsScore || 0,
            status: c.result || "Shortlisted",
          })));
        }
      }
    } catch {
      // handled
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Pipeline from jobs
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const totalApplicants = jobs.reduce((sum, j: any) => sum + (j.totalApplicants || 0), 0);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const totalSelected = jobs.reduce((sum, j: any) => sum + (j.selected || 0), 0);

  const pipelineStages = [
    { name: "Applied", count: totalApplicants, color: "bg-muted" },
    { name: "ATS Cleared", count: Math.round(totalApplicants * 0.65), color: "activity-green" },
    { name: "Round 1", count: Math.round(totalApplicants * 0.38), color: "activity-gray" },
    { name: "Round 2", count: Math.round(totalApplicants * 0.18), color: "activity-purple" },
    { name: "Selected", count: totalSelected, color: "bg-accent-green" },
  ];

  const maxCount = Math.max(...pipelineStages.map(s => s.count), 1);

  return (
    <div className="page-enter">
      <Header
        userName={user?.email?.split("@")[0] || "HR Manager"}
        userRole="Company"
        greeting={`Good morning!`}
        subtitle="Let's make this day productive."
      />

      <div className="px-4 sm:px-6 md:px-8 pb-10">
        {/* Stats row */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-8 mb-6 sm:mb-8 -mt-2">
          <div className="hidden sm:block flex-1" />
          <div className="grid grid-cols-2 sm:flex gap-4 sm:gap-8 w-full sm:w-auto">
            {loading ? (
              [1, 2].map(i => (
                <div key={i} className="animate-pulse">
                  <div className="h-3 bg-muted rounded w-20 mb-2" />
                  <div className="h-8 bg-muted rounded w-12" />
                </div>
              ))
            ) : (
              <>
                <div>
                  <p className="text-xs sm:text-sm text-muted-foreground">Total Applicants</p>
                  <p className="text-2xl sm:text-4xl font-bold text-foreground tracking-tight">
                    {totalApplicants}<span className="stat-arrow text-muted-foreground">↗</span>
                  </p>
                </div>
                <div>
                  <p className="text-xs sm:text-sm text-muted-foreground">Offers Sent</p>
                  <p className="text-2xl sm:text-4xl font-bold text-foreground tracking-tight">
                    {totalSelected}<span className="stat-arrow text-muted-foreground">↗</span>
                  </p>
                </div>
              </>
            )}
          </div>
          <button className="i-btn-dark w-full sm:w-auto justify-center">
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

            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3, 4, 5].map(i => (
                  <div key={i} className="flex items-center gap-4 animate-pulse">
                    <div className="h-3 bg-muted rounded w-20" />
                    <div className="flex-1 h-10 bg-muted/50 rounded-xl" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                {pipelineStages.map((stage) => (
                  <div key={stage.name} className="flex items-center gap-4">
                    <span className="text-xs text-muted-foreground w-16 sm:w-24 text-right flex-shrink-0">{stage.name}</span>
                    <div className="flex-1 h-10 bg-muted/50 rounded-xl overflow-hidden relative">
                      <div
                        className={cn("h-full rounded-xl flex items-center px-4 transition-all duration-700", stage.color)}
                        style={{ width: `${Math.max((stage.count / maxCount) * 100, 8)}%` }}
                      >
                        <span className="text-xs font-bold text-foreground">{stage.count}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
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

            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className="flex items-center gap-3 p-3 animate-pulse">
                    <div className="w-9 h-9 rounded-full bg-muted" />
                    <div className="flex-1 space-y-1">
                      <div className="h-3 bg-muted rounded w-2/3" />
                      <div className="h-2 bg-muted rounded w-1/4" />
                    </div>
                    <div className="h-3 bg-muted rounded w-8" />
                  </div>
                ))}
              </div>
            ) : candidates.length === 0 ? (
              <div className="text-center py-8">
                <Users className="w-10 h-10 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">No candidates yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {candidates.map((c, i) => (
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
            )}
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
                { task: `Review ${totalApplicants > 0 ? totalApplicants : "pending"} applications`, done: false },
                { task: "Schedule Round 2 interviews", done: false },
                { task: "Send offer letters to selected", done: totalSelected > 0 },
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
            {loading ? (
              <div className="grid grid-cols-2 gap-4">
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className="p-4 rounded-xl bg-muted/30 animate-pulse">
                    <div className="h-8 bg-muted rounded w-12 mx-auto mb-2" />
                    <div className="h-3 bg-muted rounded w-16 mx-auto" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                {[
                  { label: "Avg Time to Hire", value: "—", icon: "⏱️" },
                  { label: "Acceptance Rate", value: totalApplicants > 0 ? `${Math.round((totalSelected / totalApplicants) * 100)}%` : "—", icon: "✅" },
                  { label: "JDs Posted", value: String(jobs.length), icon: "📝" },
                  { label: "Rounds Complete", value: "—", icon: "🎯" },
                ].map((s) => (
                  <div key={s.label} className="p-4 rounded-xl bg-muted/30 text-center">
                    <span className="text-2xl">{s.icon}</span>
                    <p className="text-xl font-bold text-foreground mt-1">{s.value}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">{s.label}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
