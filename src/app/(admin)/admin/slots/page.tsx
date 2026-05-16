"use client";

import Header from "@/components/layout/Header";
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
  Settings,
  Download,
} from "lucide-react";
import { useState } from "react";

const slotRuns = [
  {
    id: "sr1",
    company: "Infosys",
    job: "Software Engineer",
    round: 1,
    date: "May 18, 2026",
    totalCandidates: 45,
    slotsGenerated: 45,
    conflicts: 0,
    status: "completed",
    venue: "Room 301, Admin Block",
    timePerCandidate: 30,
  },
  {
    id: "sr2",
    company: "TCS",
    job: "Systems Engineer",
    round: 1,
    date: "May 19, 2026",
    totalCandidates: 120,
    slotsGenerated: 118,
    conflicts: 2,
    status: "completed",
    venue: "Computer Lab 2",
    timePerCandidate: 20,
  },
  {
    id: "sr3",
    company: "Wipro",
    job: "Project Engineer",
    round: 1,
    date: "May 20, 2026",
    totalCandidates: 78,
    slotsGenerated: 0,
    conflicts: 0,
    status: "pending",
    venue: "Seminar Hall",
    timePerCandidate: 25,
  },
];

const timeline = [
  { time: "09:00", student: "Arjun Sharma", company: "Infosys", venue: "Room 301" },
  { time: "09:30", student: "Priya Patel", company: "Infosys", venue: "Room 301" },
  { time: "10:00", student: "Ananya Iyer", company: "Infosys", venue: "Room 301" },
  { time: "10:00", student: "Rahul Kumar", company: "TCS", venue: "Lab 2" },
  { time: "10:20", student: "Sneha Reddy", company: "TCS", venue: "Lab 2" },
  { time: "10:30", student: "Vikram Singh", company: "Infosys", venue: "Room 301" },
];

export default function AdminSlotsPage() {
  const [selectedRun, setSelectedRun] = useState<string | null>(null);

  return (
    <div className="page-enter">
      <Header
        userName="Dr. Placement Head"
        userRole="Admin"
        greeting="Slot Manager"
        subtitle="Generate and manage conflict-free interview schedules"
      />

      <div className="px-8 pb-10 space-y-6">
        {/* Algorithm info card */}
        <div className="glass-card p-5 flex items-start gap-4">
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
          <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 text-white text-sm font-semibold shadow-lg shadow-violet-500/20">
            <Play className="w-4 h-4" />
            Generate Slots
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div className="glass-card p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center">
              <CalendarClock className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <p className="text-xl font-bold text-foreground">163</p>
              <p className="text-[10px] text-muted-foreground">Total Slots Generated</p>
            </div>
          </div>
          <div className="glass-card p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-xl font-bold text-foreground">2</p>
              <p className="text-[10px] text-muted-foreground">Runs Completed</p>
            </div>
          </div>
          <div className="glass-card p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <p className="text-xl font-bold text-foreground">2</p>
              <p className="text-[10px] text-muted-foreground">Conflicts Found</p>
            </div>
          </div>
          <div className="glass-card p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-violet-50 flex items-center justify-center">
              <Clock className="w-5 h-5 text-violet-600" />
            </div>
            <div>
              <p className="text-xl font-bold text-foreground">1</p>
              <p className="text-[10px] text-muted-foreground">Pending Run</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Slot runs */}
          <div className="lg:col-span-3 space-y-4">
            <h3 className="text-base font-semibold text-foreground">Slot Generation Runs</h3>
            {slotRuns.map((run) => (
              <div
                key={run.id}
                onClick={() => setSelectedRun(run.id === selectedRun ? null : run.id)}
                className={cn(
                  "glass-card p-5 cursor-pointer transition-all",
                  selectedRun === run.id && "ring-2 ring-primary/30"
                )}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-indigo-100 to-violet-100 flex items-center justify-center text-sm font-bold text-indigo-700">
                      {run.company.charAt(0)}
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-foreground">{run.company} — {run.job}</h4>
                      <p className="text-xs text-muted-foreground mt-0.5">Round {run.round} · {run.date}</p>
                      <div className="flex items-center gap-4 mt-2">
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Users className="w-3.5 h-3.5" />
                          {run.totalCandidates} candidates
                        </div>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Clock className="w-3.5 h-3.5" />
                          {run.timePerCandidate} min/slot
                        </div>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Building2 className="w-3.5 h-3.5" />
                          {run.venue}
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
                    {run.slotsGenerated > 0 && (
                      <p className="text-xs text-muted-foreground mt-1.5">{run.slotsGenerated} slots</p>
                    )}
                    {run.conflicts > 0 && (
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
                    <button className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-700 transition-colors">
                      <Play className="w-3 h-3" /> Run Algorithm
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Today's timeline */}
          <div className="lg:col-span-2 glass-card p-5">
            <h3 className="text-base font-semibold text-foreground mb-4">Today&apos;s Schedule</h3>
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
          </div>
        </div>
      </div>
    </div>
  );
}
