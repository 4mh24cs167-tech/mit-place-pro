"use client";

import Header from "@/components/layout/Header";
import { adminApi } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { cn } from "@/lib/utils";
import {
  CalendarClock,
  Play,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Users,
  Building2,
  Zap,
  Download,
  Inbox,
  Loader2,
} from "lucide-react";
import { useState, useEffect, useCallback } from "react";

interface SlotRun {
  id: string;
  company?: string;
  job?: string;
  round?: number;
  date?: string;
  totalCandidates?: number;
  slotsGenerated?: number;
  conflicts?: number;
  status?: string;
  venue?: string;
  timePerCandidate?: number;
}

interface TimelineSlot {
  time: string;
  student: string;
  company: string;
  venue: string;
}

export default function AdminSlotsPage() {
  const { user } = useAuth();
  const [slotRuns, setSlotRuns] = useState<SlotRun[]>([]);
  const [timeline, setTimeline] = useState<TimelineSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRun, setSelectedRun] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);

  const fetchSlots = useCallback(async () => {
    try {
      setLoading(true);
      const [slotsRes, timelineRes] = await Promise.allSettled([
        adminApi.listSlots(),
        adminApi.getSlotTimeline(),
      ]);

      if (slotsRes.status === "fulfilled") {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const data = (slotsRes.value as any)?.data;
        setSlotRuns(Array.isArray(data) ? data : []);
      }
      if (timelineRes.status === "fulfilled") {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const data = (timelineRes.value as any)?.data;
        setTimeline(Array.isArray(data) ? data : []);
      }
    } catch {
      // handled per-request
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSlots();
  }, [fetchSlots]);

  const handleGenerateSlots = async () => {
    try {
      setGenerating(true);
      // Trigger slot generation for pending runs
      const pendingRuns = slotRuns.filter(r => r.status === "pending");
      for (const run of pendingRuns) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const jobId = (run as any).jobId || run.id;
        await adminApi.generateSlots(jobId, run.round || 1);
      }
      await fetchSlots();
    } catch {
      // silently handle
    } finally {
      setGenerating(false);
    }
  };

  // Derived stats
  const totalSlots = slotRuns.reduce((sum, r) => sum + (r.slotsGenerated || 0), 0);
  const completedRuns = slotRuns.filter(r => r.status === "completed").length;
  const totalConflicts = slotRuns.reduce((sum, r) => sum + (r.conflicts || 0), 0);
  const pendingRuns = slotRuns.filter(r => r.status === "pending").length;

  return (
    <div className="page-enter">
      <Header
        userName={user?.email || "Admin"}
        userRole="Admin"
        greeting="Slot Manager"
        subtitle="Generate and manage conflict-free interview schedules"
      />

      <div className="px-8 pb-10 space-y-6">
        {/* Algorithm info card */}
        <div className="i-card p-5 flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-violet-50 flex items-center justify-center flex-shrink-0">
            <Zap className="w-6 h-6 text-violet-600" />
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-semibold text-foreground">CSP Slot Allocation Algorithm</h3>
            <p className="text-xs text-muted-foreground mt-1">
              Uses Greedy Constraint Satisfaction with Most-Constrained-First (MFC) heuristic and depth-limited backtracking.
              Generates conflict-free schedules ensuring no student has overlapping interviews across companies.
            </p>
          </div>
          <button
            onClick={handleGenerateSlots}
            disabled={generating || pendingRuns === 0}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 text-white text-sm font-semibold shadow-lg shadow-violet-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {generating ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Play className="w-4 h-4" />
            )}
            Generate Slots
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          {loading ? (
            [1, 2, 3, 4].map(i => (
              <div key={i} className="i-card p-4 flex items-center gap-3 animate-pulse">
                <div className="w-10 h-10 rounded-xl bg-muted" />
                <div className="space-y-1">
                  <div className="h-5 bg-muted rounded w-10" />
                  <div className="h-3 bg-muted rounded w-20" />
                </div>
              </div>
            ))
          ) : (
            <>
              <div className="i-card p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center">
                  <CalendarClock className="w-5 h-5 text-indigo-600" />
                </div>
                <div>
                  <p className="text-xl font-bold text-foreground">{totalSlots}</p>
                  <p className="text-[10px] text-muted-foreground">Total Slots Generated</p>
                </div>
              </div>
              <div className="i-card p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                </div>
                <div>
                  <p className="text-xl font-bold text-foreground">{completedRuns}</p>
                  <p className="text-[10px] text-muted-foreground">Runs Completed</p>
                </div>
              </div>
              <div className="i-card p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <p className="text-xl font-bold text-foreground">{totalConflicts}</p>
                  <p className="text-[10px] text-muted-foreground">Conflicts Found</p>
                </div>
              </div>
              <div className="i-card p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-violet-50 flex items-center justify-center">
                  <Clock className="w-5 h-5 text-violet-600" />
                </div>
                <div>
                  <p className="text-xl font-bold text-foreground">{pendingRuns}</p>
                  <p className="text-[10px] text-muted-foreground">Pending Runs</p>
                </div>
              </div>
            </>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Slot runs */}
          <div className="lg:col-span-3 space-y-4">
            <h3 className="text-base font-semibold text-foreground">Slot Generation Runs</h3>

            {loading ? (
              <div className="space-y-4">
                {[1, 2, 3].map(i => (
                  <div key={i} className="i-card p-5 animate-pulse">
                    <div className="flex items-start gap-4">
                      <div className="w-11 h-11 rounded-xl bg-muted" />
                      <div className="flex-1 space-y-2">
                        <div className="h-4 bg-muted rounded w-1/2" />
                        <div className="h-3 bg-muted rounded w-1/3" />
                        <div className="h-3 bg-muted rounded w-2/3" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : slotRuns.length === 0 ? (
              <div className="i-card p-12 text-center">
                <Inbox className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                <h3 className="text-lg font-semibold text-foreground mb-1">No slot runs yet</h3>
                <p className="text-sm text-muted-foreground">
                  Slot runs will appear here when companies schedule interview rounds
                </p>
              </div>
            ) : (
              slotRuns.map((run) => (
                <div
                  key={run.id}
                  onClick={() => setSelectedRun(run.id === selectedRun ? null : run.id)}
                  className={cn(
                    "i-card p-5 cursor-pointer transition-all",
                    selectedRun === run.id && "ring-2 ring-primary/30"
                  )}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4">
                      <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-indigo-100 to-violet-100 flex items-center justify-center text-sm font-bold text-indigo-700">
                        {(run.company || "?").charAt(0)}
                      </div>
                      <div>
                        <h4 className="text-sm font-semibold text-foreground">{run.company || "Company"} — {run.job || "Role"}</h4>
                        <p className="text-xs text-muted-foreground mt-0.5">Round {run.round || 1} · {run.date || "—"}</p>
                        <div className="flex items-center gap-4 mt-2">
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Users className="w-3.5 h-3.5" />
                            {run.totalCandidates || 0} candidates
                          </div>
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Clock className="w-3.5 h-3.5" />
                            {run.timePerCandidate || 0} min/slot
                          </div>
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Building2 className="w-3.5 h-3.5" />
                            {run.venue || "—"}
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className={cn(
                        "text-[10px] font-semibold px-2.5 py-1 rounded-full",
                        run.status === "completed" ? "bg-emerald-50 text-emerald-600" : "bg-amber-50 text-amber-600"
                      )}>
                        {run.status === "completed" ? "Completed" : "Pending"}
                      </span>
                      {(run.slotsGenerated || 0) > 0 && (
                        <p className="text-xs text-muted-foreground mt-1.5">{run.slotsGenerated} slots</p>
                      )}
                      {(run.conflicts || 0) > 0 && (
                        <p className="text-[10px] text-amber-600 mt-0.5">{run.conflicts} conflicts</p>
                      )}
                    </div>
                  </div>
                  {run.status === "completed" && (
                    <div className="flex items-center gap-2 mt-3 pt-3 border-t border-border/50">
                      <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-muted/50 text-xs font-medium text-muted-foreground hover:bg-muted transition-colors">
                        <Download className="w-3 h-3" /> Export CSV
                      </button>
                      <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-muted/50 text-xs font-medium text-muted-foreground hover:bg-muted transition-colors">
                        <RefreshCw className="w-3 h-3" /> Re-run
                      </button>
                    </div>
                  )}
                  {run.status === "pending" && (
                    <div className="mt-3 pt-3 border-t border-border/50">
                      <button
                        onClick={async (e) => {
                          e.stopPropagation();
                          try {
                            setGenerating(true);
                            // eslint-disable-next-line @typescript-eslint/no-explicit-any
                            const jobId = (run as any).jobId || run.id;
                            await adminApi.generateSlots(jobId, run.round || 1);
                            await fetchSlots();
                          } catch { /* silently handle */ }
                          finally { setGenerating(false); }
                        }}
                        disabled={generating}
                        className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-700 transition-colors disabled:opacity-50"
                      >
                        {generating ? <Loader2 className="w-3 h-3 animate-spin" /> : <Play className="w-3 h-3" />}
                        Run Algorithm
                      </button>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>

          {/* Today's timeline */}
          <div className="lg:col-span-2 i-card p-5">
            <h3 className="text-base font-semibold text-foreground mb-4">Today&apos;s Schedule</h3>
            {loading ? (
              <div className="space-y-4">
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className="flex items-start gap-3 animate-pulse">
                    <div className="w-3 h-3 rounded-full bg-muted" />
                    <div className="space-y-1 flex-1">
                      <div className="h-3 bg-muted rounded w-12" />
                      <div className="h-3 bg-muted rounded w-2/3" />
                      <div className="h-2 bg-muted rounded w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            ) : timeline.length === 0 ? (
              <div className="text-center py-8">
                <CalendarClock className="w-10 h-10 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">No interviews scheduled today</p>
              </div>
            ) : (
              <div className="space-y-0">
                {timeline.map((slot, i) => (
                  <div key={i} className="flex items-start gap-3 relative">
                    <div className="flex flex-col items-center">
                      <div className={cn(
                        "w-3 h-3 rounded-full border-2 z-10",
                        i === 0 ? "border-indigo-500 bg-indigo-500" : "border-border bg-white"
                      )} />
                      {i < timeline.length - 1 && (
                        <div className="w-px h-12 bg-border" />
                      )}
                    </div>
                    <div className="pb-6 -mt-1">
                      <p className="text-[10px] font-semibold text-indigo-600">{slot.time}</p>
                      <p className="text-sm font-medium text-foreground mt-0.5">{slot.student}</p>
                      <p className="text-[10px] text-muted-foreground">{slot.company} · {slot.venue}</p>
                    </div>
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
