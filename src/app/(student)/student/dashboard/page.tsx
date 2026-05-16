"use client";

import Header from "@/components/layout/Header";
import { cn } from "@/lib/utils";
import {
  Plus,
  ArrowUpRight,
  Calendar,
  CheckCircle2,
  Clock,
  Star,
  MapPin,
  IndianRupee,
  Briefcase,
  TrendingUp,
  SlidersHorizontal,
  FileText,
} from "lucide-react";

const upcomingInterviews = [
  { company: "Infosys", role: "Software Engineer", date: "May 19", time: "10:30 AM", round: "Technical", venue: "Room 301" },
  { company: "Wipro", role: "Project Engineer", date: "May 21", time: "02:00 PM", round: "Online Assessment", venue: "Lab 2" },
];

const applicationStats = [
  { label: "Applied", count: 5 },
  { label: "In Progress", count: 3 },
  { label: "Offers", count: 1 },
  { label: "ATS Avg", count: 79, suffix: "%" },
];

const recentActivity = [
  { action: "Applied to Google SDE Intern", time: "2 hours ago", type: "applied" as const },
  { action: "TCS — Offer Letter Released", time: "5 hours ago", type: "offer" as const },
  { action: "Infosys — Advanced to Round 2", time: "1 day ago", type: "advanced" as const },
  { action: "Bosch — ATS Screening Failed", time: "2 days ago", type: "rejected" as const },
];

const activityColors = {
  applied: "bg-blue-100 text-blue-600",
  offer: "bg-accent-green text-green-700",
  advanced: "bg-accent-purple text-purple-700",
  rejected: "bg-red-100 text-red-600",
};

export default function StudentDashboardPage() {
  return (
    <div className="page-enter">
      <Header
        userName="Arjun Sharma"
        userRole="Student"
        greeting="Good morning, Arjun!"
        subtitle="Let's make this day productive."
      />

      <div className="px-8 pb-10">
        {/* Stats row */}
        <div className="flex items-center gap-8 mb-8 -mt-2">
          <div className="flex-1" />
          {applicationStats.map((s) => (
            <div key={s.label}>
              <p className="text-sm text-muted-foreground">{s.label}</p>
              <p className="text-4xl font-bold text-foreground tracking-tight">
                {s.count}{s.suffix || ""}
                <span className="stat-arrow text-muted-foreground">↗</span>
              </p>
            </div>
          ))}
          <button className="i-btn-dark">
            <Plus className="w-4 h-4" />
            Browse Jobs
          </button>
        </div>

        {/* Two-column layout */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
          {/* Upcoming Interviews */}
          <div className="lg:col-span-2 i-card p-6">
            <div className="flex items-start justify-between mb-5">
              <div>
                <h2 className="text-lg font-semibold text-foreground">Upcoming Interviews</h2>
                <p className="text-sm text-muted-foreground">Your next scheduled rounds</p>
              </div>
              <button className="i-btn-icon">
                <Calendar className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>

            <div className="space-y-4">
              {upcomingInterviews.map((interview, i) => (
                <div key={i} className="p-4 rounded-xl border border-border hover:bg-muted/30 transition-colors">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-sm font-semibold text-foreground">{interview.company}</h3>
                      <p className="text-xs text-muted-foreground mt-0.5">{interview.role} — {interview.round}</p>
                    </div>
                    <div className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center text-xs font-bold text-foreground">
                      {interview.company.charAt(0)}
                    </div>
                  </div>
                  <div className="flex items-center gap-3 mt-3 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1"><Calendar className="w-3 h-3" />{interview.date}</div>
                    <div className="flex items-center gap-1"><Clock className="w-3 h-3" />{interview.time}</div>
                    <div className="flex items-center gap-1"><MapPin className="w-3 h-3" />{interview.venue}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Activity Feed */}
          <div className="lg:col-span-3 i-card p-6">
            <div className="flex items-start justify-between mb-5">
              <div>
                <h2 className="text-lg font-semibold text-foreground">Recent Activity</h2>
                <p className="text-sm text-muted-foreground">Your placement journey updates</p>
              </div>
              <button className="i-btn-icon">
                <ArrowUpRight className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>

            <div className="space-y-0">
              {recentActivity.map((item, i) => (
                <div key={i} className="flex items-start gap-3 relative py-4 border-b border-border last:border-0">
                  <div className="flex flex-col items-center">
                    <div className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0",
                      activityColors[item.type]
                    )}>
                      {item.type === "applied" && "📤"}
                      {item.type === "offer" && "🎉"}
                      {item.type === "advanced" && "⬆️"}
                      {item.type === "rejected" && "❌"}
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">{item.action}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{item.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mt-5">
          {/* Quick actions — like To-do */}
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
                { task: "Complete Infosys prep quiz", done: true },
                { task: "Upload updated resume for Wipro", done: false },
                { task: "Practice system design questions", done: false },
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

          {/* Profile completion */}
          <div className="i-card p-6">
            <div className="flex items-start justify-between mb-5">
              <div>
                <h2 className="text-lg font-semibold text-foreground">Profile Strength</h2>
                <p className="text-sm text-muted-foreground">Complete your profile for better matches</p>
              </div>
              <button className="i-btn-icon">
                <SlidersHorizontal className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>

            <div className="flex items-center gap-4 mb-6">
              <div className="relative w-20 h-20">
                <svg className="w-20 h-20 transform -rotate-90" viewBox="0 0 80 80">
                  <circle cx="40" cy="40" r="32" stroke="oklch(0.92 0.01 280)" strokeWidth="6" fill="none" />
                  <circle cx="40" cy="40" r="32" stroke="oklch(0.82 0.15 135)" strokeWidth="6" fill="none"
                    strokeDasharray={`${0.78 * 201} ${201}`} strokeLinecap="round" />
                </svg>
                <span className="absolute inset-0 flex items-center justify-center text-lg font-bold text-foreground">78%</span>
              </div>
              <div className="space-y-1.5">
                {[
                  { label: "Basic Info", done: true },
                  { label: "Academic Details", done: true },
                  { label: "Skills & Projects", done: true },
                  { label: "CV Uploaded", done: false },
                  { label: "Experience", done: false },
                ].map((item) => (
                  <div key={item.label} className="flex items-center gap-2 text-xs">
                    {item.done ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-green-600" />
                    ) : (
                      <div className="w-3.5 h-3.5 rounded-full border-2 border-border" />
                    )}
                    <span className={cn(item.done ? "text-muted-foreground" : "text-foreground font-medium")}>
                      {item.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
