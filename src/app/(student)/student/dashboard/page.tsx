"use client";

import Header from "@/components/layout/Header";
import { studentApi } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { cn } from "@/lib/utils";
import {
  Plus,
  ArrowUpRight,
  Calendar,
  CheckCircle2,
  Clock,
  MapPin,
  SlidersHorizontal,
  Briefcase,
  FileText,
  Loader2,
} from "lucide-react";
import { useState, useEffect, useCallback } from "react";

interface Interview {
  company?: string;
  role?: string;
  date?: string;
  time?: string;
  round?: string;
  venue?: string;
}

interface AppStats {
  applied: number;
  inProgress: number;
  offers: number;
  atsAvg: number;
}

interface Activity {
  action: string;
  time: string;
  type: "applied" | "offer" | "advanced" | "rejected";
}

const activityColors = {
  applied: "bg-blue-100 text-blue-600",
  offer: "bg-accent-green text-green-700",
  advanced: "bg-accent-purple text-purple-700",
  rejected: "bg-red-100 text-red-600",
};

export default function StudentDashboardPage() {
  const { user } = useAuth();
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [applications, setApplications] = useState<unknown[]>([]);
  const [profile, setProfile] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [interviewRes, appRes, profileRes] = await Promise.allSettled([
        studentApi.getInterviews(),
        studentApi.getApplications(),
        studentApi.getProfile(),
      ]);

      if (interviewRes.status === "fulfilled") {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const data = (interviewRes.value as any)?.data;
        setInterviews(Array.isArray(data) ? data : []);
      }
      if (appRes.status === "fulfilled") {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const data = (appRes.value as any)?.data;
        setApplications(Array.isArray(data) ? data : []);
      }
      if (profileRes.status === "fulfilled") {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        setProfile((profileRes.value as any)?.data || null);
      }
    } catch {
      // handled per-request
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Derived stats
  const stats: AppStats = {
    applied: applications.length,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    inProgress: applications.filter((a: any) => a.result === "pending" || a.currentRound > 0).length,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    offers: applications.filter((a: any) => a.result === "selected" || a.result === "offered").length,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    atsAvg: applications.length > 0 ? Math.round(applications.reduce((sum: number, a: any) => sum + (a.atsScore || 0), 0) / applications.length) : 0,
  };

  const applicationStats = [
    { label: "Applied", count: stats.applied },
    { label: "In Progress", count: stats.inProgress },
    { label: "Offers", count: stats.offers },
    { label: "ATS Avg", count: stats.atsAvg, suffix: "%" },
  ];

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recentActivity: Activity[] = applications.slice(0, 4).map((a: any) => ({
    action: `${a.result === "selected" ? "Selected at" : a.result === "rejected" ? "Rejected by" : "Applied to"} ${a.job?.company?.name || "Company"} — ${a.job?.title || "Role"}`,
    time: a.updatedAt ? new Date(a.updatedAt).toLocaleDateString() : "Recently",
    type: a.result === "selected" ? "offer" : a.result === "rejected" ? "rejected" : a.currentRound > 0 ? "advanced" : "applied",
  }));

  // Profile completion
  const profileItems = [
    { label: "Basic Info", done: !!(profile as Record<string, unknown>)?.fullName },
    { label: "Academic Details", done: !!((profile as Record<string, unknown>)?.cgpa) },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    { label: "Skills & Projects", done: ((profile as any)?.profileData?.skills?.length || 0) > 0 },
    { label: "CV Uploaded", done: !!(profile as Record<string, unknown>)?.hasCv },
    { label: "Phone Number", done: !!(profile as Record<string, unknown>)?.phone },
  ];
  const profilePercent = profileItems.length > 0 ? Math.round((profileItems.filter(p => p.done).length / profileItems.length) * 100) : 0;

  const userName = (profile as Record<string, unknown>)?.fullName as string || user?.email?.split("@")[0] || "Student";
  const firstName = userName.split(" ")[0];

  return (
    <div className="page-enter">
      <Header
        userName={userName}
        userRole="Student"
        greeting={`Good morning, ${firstName}!`}
        subtitle="Let's make this day productive."
      />

      <div className="px-8 pb-10">
        {/* Stats row */}
        <div className="flex items-center gap-8 mb-8 -mt-2">
          <div className="flex-1" />
          {loading ? (
            [1, 2, 3, 4].map(i => (
              <div key={i} className="animate-pulse">
                <div className="h-3 bg-muted rounded w-16 mb-2" />
                <div className="h-8 bg-muted rounded w-12" />
              </div>
            ))
          ) : (
            applicationStats.map((s) => (
              <div key={s.label}>
                <p className="text-sm text-muted-foreground">{s.label}</p>
                <p className="text-4xl font-bold text-foreground tracking-tight">
                  {s.count}{s.suffix || ""}
                  <span className="stat-arrow text-muted-foreground">↗</span>
                </p>
              </div>
            ))
          )}
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

            {loading ? (
              <div className="space-y-4">
                {[1, 2].map(i => (
                  <div key={i} className="p-4 rounded-xl border border-border animate-pulse">
                    <div className="h-4 bg-muted rounded w-1/2 mb-2" />
                    <div className="h-3 bg-muted rounded w-1/3" />
                  </div>
                ))}
              </div>
            ) : interviews.length === 0 ? (
              <div className="text-center py-8">
                <Calendar className="w-10 h-10 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">No upcoming interviews</p>
              </div>
            ) : (
              <div className="space-y-4">
                {interviews.map((interview, i) => (
                  <div key={i} className="p-4 rounded-xl border border-border hover:bg-muted/30 transition-colors">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="text-sm font-semibold text-foreground">{interview.company}</h3>
                        <p className="text-xs text-muted-foreground mt-0.5">{interview.role} — {interview.round}</p>
                      </div>
                      <div className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center text-xs font-bold text-foreground">
                        {(interview.company || "?").charAt(0)}
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
            )}
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

            {loading ? (
              <div className="space-y-4">
                {[1, 2, 3].map(i => (
                  <div key={i} className="animate-pulse flex items-center gap-3 py-4 border-b border-border last:border-0">
                    <div className="w-8 h-8 rounded-full bg-muted" />
                    <div className="flex-1">
                      <div className="h-4 bg-muted rounded w-2/3 mb-1" />
                      <div className="h-3 bg-muted rounded w-1/4" />
                    </div>
                  </div>
                ))}
              </div>
            ) : recentActivity.length === 0 ? (
              <div className="text-center py-8">
                <Briefcase className="w-10 h-10 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">No activity yet — start applying!</p>
              </div>
            ) : (
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
            )}
          </div>
        </div>

        {/* Bottom row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mt-5">
          {/* Quick actions */}
          <div className="i-card p-6">
            <div className="flex items-start justify-between mb-5">
              <div>
                <h2 className="text-lg font-semibold text-foreground">Quick Actions</h2>
                <p className="text-sm text-muted-foreground">
                  {new Date().toLocaleDateString("en-US", { weekday: "long", day: "numeric", month: "long" })}
                </p>
              </div>
            </div>
            <div className="space-y-3">
              {[
                { label: "View Eligible Jobs", icon: Briefcase, href: "/student/applications" },
                { label: "Update Your CV", icon: FileText, href: "/student/cv" },
                { label: "Complete Profile", icon: SlidersHorizontal, href: "/student/profile" },
              ].map((action) => (
                <a key={action.label} href={action.href}
                  className="flex items-center gap-3 p-3 rounded-xl border border-border hover:bg-muted/30 transition-colors">
                  <div className="w-9 h-9 rounded-lg bg-indigo-50 flex items-center justify-center">
                    <action.icon className="w-4 h-4 text-indigo-600" />
                  </div>
                  <span className="text-sm font-medium text-foreground">{action.label}</span>
                  <ArrowUpRight className="w-4 h-4 text-muted-foreground ml-auto" />
                </a>
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

            {loading ? (
              <div className="animate-pulse flex items-center gap-4">
                <div className="w-20 h-20 rounded-full bg-muted" />
                <div className="space-y-2 flex-1">
                  {[1, 2, 3].map(i => <div key={i} className="h-3 bg-muted rounded w-1/2" />)}
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-4 mb-6">
                <div className="relative w-20 h-20">
                  <svg className="w-20 h-20 transform -rotate-90" viewBox="0 0 80 80">
                    <circle cx="40" cy="40" r="32" stroke="oklch(0.92 0.01 280)" strokeWidth="6" fill="none" />
                    <circle cx="40" cy="40" r="32" stroke="oklch(0.82 0.15 135)" strokeWidth="6" fill="none"
                      strokeDasharray={`${(profilePercent / 100) * 201} ${201}`} strokeLinecap="round" />
                  </svg>
                  <span className="absolute inset-0 flex items-center justify-center text-lg font-bold text-foreground">{profilePercent}%</span>
                </div>
                <div className="space-y-1.5">
                  {profileItems.map((item) => (
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
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
