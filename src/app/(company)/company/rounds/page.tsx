"use client";

import Header from "@/components/layout/Header";
import { cn } from "@/lib/utils";
import {
  Plus,
  Settings,
  Users,
  CheckCircle2,
  Clock,
  Play,
  Video,
  FileText,
  MessageSquare,
  Code2,
  Edit3,
  Trash2,
  ChevronRight,
} from "lucide-react";

const rounds = [
  {
    id: "r1",
    title: "Online Assessment",
    type: "aptitude" as const,
    description: "MCQ test covering aptitude, verbal, and logical reasoning",
    duration: "90 min",
    totalCandidates: 120,
    qualified: 78,
    pending: 0,
    status: "completed" as const,
    date: "May 15, 2026",
  },
  {
    id: "r2",
    title: "Technical Interview",
    type: "technical" as const,
    description: "1-on-1 technical interview covering DSA, OOP, and system design",
    duration: "45 min/candidate",
    totalCandidates: 78,
    qualified: 32,
    pending: 8,
    status: "in_progress" as const,
    date: "May 19, 2026",
  },
  {
    id: "r3",
    title: "HR Interview",
    type: "hr" as const,
    description: "Cultural fit assessment and salary negotiation",
    duration: "30 min/candidate",
    totalCandidates: 32,
    qualified: 0,
    pending: 32,
    status: "upcoming" as const,
    date: "May 22, 2026",
  },
];

const roundTypeConfig: Record<string, { icon: React.ElementType; color: string; bg: string }> = {
  aptitude: { icon: FileText, color: "text-blue-600", bg: "bg-blue-50" },
  technical: { icon: Code2, color: "text-violet-600", bg: "bg-violet-50" },
  hr: { icon: MessageSquare, color: "text-emerald-600", bg: "bg-emerald-50" },
  coding: { icon: Code2, color: "text-orange-600", bg: "bg-orange-50" },
  gd: { icon: Users, color: "text-pink-600", bg: "bg-pink-50" },
};

const statusConfig = {
  completed: { label: "Completed", color: "text-emerald-600", bg: "bg-emerald-50" },
  in_progress: { label: "In Progress", color: "text-blue-600", bg: "bg-blue-50" },
  upcoming: { label: "Upcoming", color: "text-amber-600", bg: "bg-amber-50" },
};

export default function CompanyRoundsPage() {
  return (
    <div className="page-enter">
      <Header
        userName="HR Manager"
        userRole="Company"
        greeting="Interview Rounds"
        subtitle="Design and manage your recruitment pipeline rounds"
      />

      <div className="px-8 pb-10 space-y-6">
        {/* Pipeline visual */}
        <div className="i-card p-6">
          <h3 className="text-sm font-semibold text-foreground mb-5">Recruitment Pipeline</h3>
          <div className="flex items-center gap-2 overflow-x-auto pb-2">
            {rounds.map((round, i) => {
              const tc = roundTypeConfig[round.type];
              const sc = statusConfig[round.status];
              const Icon = tc.icon;
              return (
                <div key={round.id} className="flex items-center gap-2 flex-shrink-0">
                  <div className={cn(
                    "flex items-center gap-3 px-5 py-3 rounded-xl border transition-all cursor-pointer hover:shadow-md",
                    round.status === "in_progress" ? "border-blue-300 bg-blue-50/50 ring-1 ring-blue-200" : "border-border bg-white"
                  )}>
                    <div className={cn("w-9 h-9 rounded-lg flex items-center justify-center", tc.bg)}>
                      <Icon className={cn("w-4 h-4", tc.color)} />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-foreground whitespace-nowrap">{round.title}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className={cn("text-[10px] font-semibold", sc.color)}>{sc.label}</span>
                        <span className="text-[10px] text-muted-foreground">{round.totalCandidates} candidates</span>
                      </div>
                    </div>
                  </div>
                  {i < rounds.length - 1 && (
                    <ChevronRight className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                  )}
                </div>
              );
            })}
            <button className="flex items-center gap-2 px-4 py-3 rounded-xl border-2 border-dashed border-border text-sm text-muted-foreground hover:border-primary hover:text-primary transition-colors flex-shrink-0">
              <Plus className="w-4 h-4" />
              Add Round
            </button>
          </div>
        </div>

        {/* Round details */}
        <div className="space-y-5">
          {rounds.map((round) => {
            const tc = roundTypeConfig[round.type];
            const sc = statusConfig[round.status];
            const Icon = tc.icon;
            const qualifiedPercent = round.totalCandidates > 0 ? Math.round((round.qualified / round.totalCandidates) * 100) : 0;
            return (
              <div key={round.id} className="i-card p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center", tc.bg)}>
                      <Icon className={cn("w-6 h-6", tc.color)} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-base font-semibold text-foreground">{round.title}</h3>
                        <span className={cn("text-[10px] font-semibold px-2.5 py-1 rounded-full", sc.bg, sc.color)}>
                          {sc.label}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">{round.description}</p>
                      <div className="flex items-center gap-4 mt-2 text-[10px] text-muted-foreground">
                        <span>Duration: {round.duration}</span>
                        <span>·</span>
                        <span>Date: {round.date}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button className="p-2 rounded-lg hover:bg-muted transition-colors"><Edit3 className="w-4 h-4 text-muted-foreground" /></button>
                    <button className="p-2 rounded-lg hover:bg-red-50 transition-colors"><Trash2 className="w-4 h-4 text-red-400" /></button>
                  </div>
                </div>

                {/* Stats bar */}
                <div className="grid grid-cols-3 gap-4 mt-5 pt-4 border-t border-border/50">
                  <div className="text-center">
                    <p className="text-lg font-bold text-foreground">{round.totalCandidates}</p>
                    <p className="text-[10px] text-muted-foreground">Total Candidates</p>
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-bold text-emerald-600">{round.qualified}</p>
                    <p className="text-[10px] text-muted-foreground">Qualified ({qualifiedPercent}%)</p>
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-bold text-amber-600">{round.pending}</p>
                    <p className="text-[10px] text-muted-foreground">Pending Review</p>
                  </div>
                </div>

                {/* Progress bar */}
                {round.status !== "upcoming" && (
                  <div className="mt-4">
                    <div className="h-2 rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-emerald-400 progress-fill"
                        style={{ width: `${qualifiedPercent}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
