"use client";

import { useState, useEffect, useCallback } from "react";
import Header from "@/components/layout/Header";
import { cn } from "@/lib/utils";
import { adminApi } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import {
  Plus,
  ArrowUpRight,
  Calendar,
  CheckCircle2,
  TrendingUp,
  SlidersHorizontal,
  Users,
  Building2,
  Briefcase,
  GraduationCap,
  RefreshCw,
  Loader2,
} from "lucide-react";

interface DashboardStats {
  totalStudents: number;
  totalCompanies: number;
  totalJobs: number;
  totalPlaced: number;
  placementRate: number;
  pendingApprovals: number;
}

interface ActivityItem {
  id: string;
  action: string;
  entityType: string;
  createdAt: string;
}

export default function AdminDashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [activity, setActivity] = useState<ActivityItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async (silent = false) => {
    if (!silent) setIsLoading(true);
    else setIsRefreshing(true);
    setError(null);

    try {
      const [dashRes, actRes] = await Promise.all([
        adminApi.getDashboard(),
        adminApi.getActivity(8),
      ]);

      if (dashRes.data) setStats(dashRes.data as DashboardStats);
      if (actRes.data) setActivity(actRes.data as ActivityItem[]);
    } catch (err) {
      setError("Failed to load dashboard data");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    // Auto-refresh every 30 seconds
    const interval = setInterval(() => fetchData(true), 30000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const statCards = [
    { label: "Total Students", value: stats?.totalStudents ?? 0, icon: Users, color: "bg-blue-50 text-blue-600" },
    { label: "Companies", value: stats?.totalCompanies ?? 0, icon: Building2, color: "bg-purple-50 text-purple-600" },
    { label: "Active Jobs", value: stats?.totalJobs ?? 0, icon: Briefcase, color: "bg-amber-50 text-amber-600" },
    { label: "Students Placed", value: stats?.totalPlaced ?? 0, icon: GraduationCap, color: "bg-green-50 text-green-600" },
  ];

  const greetingHour = new Date().getHours();
  const greeting = greetingHour < 12 ? "Good morning" : greetingHour < 17 ? "Good afternoon" : "Good evening";

  return (
    <div className="page-enter">
      <Header
        userName={user?.email || "Admin"}
        userRole="Admin"
        greeting={`${greeting}, Admin!`}
        subtitle="Let's make this day productive."
      />

      <div className="px-4 sm:px-6 md:px-8 pb-10">
        {/* Stats Row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {statCards.map((card) => (
            <div key={card.label} className="i-card p-5 flex items-start gap-4">
              <div className={cn("w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0", card.color)}>
                <card.icon className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{card.label}</p>
                {isLoading ? (
                  <div className="h-8 w-16 rounded bg-muted animate-pulse mt-1" />
                ) : (
                  <p className="text-2xl font-bold text-foreground tracking-tight">
                    {card.value.toLocaleString()}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Placement Rate Banner */}
        <div className="i-card p-4 sm:p-6 mb-6 sm:mb-8 bg-gradient-to-r from-foreground to-foreground/90 text-white">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <p className="text-xs sm:text-sm text-white/70">Overall Placement Rate</p>
              {isLoading ? (
                <div className="h-10 w-24 rounded bg-white/20 animate-pulse mt-1" />
              ) : (
                <p className="text-3xl sm:text-4xl font-bold tracking-tight">
                  {stats?.placementRate ?? 0}%
                  <span className="text-white/50 ml-2">↗</span>
                </p>
              )}
            </div>
            <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto">
              <button
                onClick={() => fetchData(true)}
                disabled={isRefreshing}
                className="flex items-center justify-center gap-2 flex-1 sm:flex-initial px-3 sm:px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-sm font-medium transition-all"
              >
                <RefreshCw className={cn("w-4 h-4", isRefreshing && "animate-spin")} />
                Refresh
              </button>
              <button className="flex items-center justify-center gap-2 flex-1 sm:flex-initial px-3 sm:px-4 py-2 rounded-xl bg-white text-foreground text-sm font-medium hover:bg-white/90 transition-all">
                <Plus className="w-4 h-4" />
                Add Drive
              </button>
            </div>
          </div>
        </div>

        {/* Two-column layout */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
          {/* Quick Actions */}
          <div className="lg:col-span-2 i-card p-6 flex flex-col">
            <h2 className="text-lg font-semibold text-foreground mb-1">Quick Actions</h2>
            <p className="text-sm text-muted-foreground mb-5">Common tasks and shortcuts</p>

            <div className="space-y-3 flex-1">
              {[
                { emoji: "📤", label: "Bulk Upload Students", desc: "Import from Excel", action: "upload" },
                { emoji: "🏢", label: "Add New Company", desc: "Register company account", action: "company" },
                { emoji: "✅", label: `Pending Approvals`, desc: `${stats?.pendingApprovals ?? 0} waiting`, action: "approve" },
                { emoji: "📊", label: "Generate Reports", desc: "Export placement data", action: "reports" },
              ].map((item) => (
                <button
                  key={item.action}
                  className="w-full flex items-center gap-3 p-3.5 rounded-xl border border-border hover:border-foreground/20 hover:bg-muted/50 transition-all text-left group"
                >
                  <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center text-xl flex-shrink-0 group-hover:bg-foreground/5">
                    {item.emoji}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-foreground">{item.label}</p>
                    <p className="text-xs text-muted-foreground">{item.desc}</p>
                  </div>
                  <ArrowUpRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                </button>
              ))}
            </div>
          </div>

          {/* Recent Activity */}
          <div className="lg:col-span-3 i-card p-6">
            <div className="flex items-start justify-between mb-5">
              <div>
                <h2 className="text-lg font-semibold text-foreground">Recent Activity</h2>
                <p className="text-sm text-muted-foreground">Audit trail of admin actions</p>
              </div>
              <button className="i-btn-icon">
                <Calendar className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>

            {isLoading ? (
              <div className="space-y-4">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="flex items-start gap-3 pb-4 border-b border-border">
                    <div className="w-8 h-8 rounded-full bg-muted animate-pulse flex-shrink-0" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 w-3/4 bg-muted animate-pulse rounded" />
                      <div className="h-3 w-1/2 bg-muted animate-pulse rounded" />
                    </div>
                  </div>
                ))}
              </div>
            ) : activity.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-3">
                  <TrendingUp className="w-5 h-5 text-muted-foreground" />
                </div>
                <p className="text-sm font-medium text-foreground">No activity yet</p>
                <p className="text-xs text-muted-foreground mt-1">Actions will appear here as you use the system</p>
              </div>
            ) : (
              <div className="space-y-4">
                {activity.map((item, i) => (
                  <div key={item.id || i} className="flex items-start gap-3 pb-4 border-b border-border last:border-0 last:pb-0">
                    <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center flex-shrink-0 mt-0.5">
                      {item.entityType === 'student' ? '🎓' :
                       item.entityType === 'company' ? '🏢' :
                       item.entityType === 'job' ? '💼' : '📋'}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-foreground">
                        {item.action.replace(/_/g, ' ').toLowerCase().replace(/^\w/, (c) => c.toUpperCase())}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {item.entityType} · {new Date(item.createdAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Bottom row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mt-5">
          {/* Pending Tasks */}
          <div className="i-card p-6">
            <div className="flex items-start justify-between mb-5">
              <div>
                <h2 className="text-lg font-semibold text-foreground">Pending Tasks</h2>
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
                { task: "Review pending shortlist approvals", subtitle: "Approval Queue", done: false, urgent: true },
                { task: "Verify student eligibility data", subtitle: "Data Validation", done: false, urgent: false },
                { task: "Schedule company orientation", subtitle: "Event Planning", done: false, urgent: false },
              ].map((item, i) => (
                <div key={i} className="flex items-start gap-3 pb-4 border-b border-border last:border-0 last:pb-0">
                  <div className={cn(
                    "w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5",
                    item.done ? "bg-accent-green" : "border-2 border-border"
                  )}>
                    {item.done && <CheckCircle2 className="w-4 h-4 text-foreground" />}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className={cn(
                        "text-sm font-semibold",
                        item.done ? "text-muted-foreground line-through" : "text-foreground"
                      )}>
                        {item.task}
                      </p>
                      {item.urgent && (
                        <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-red-50 text-red-600">Urgent</span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">{item.subtitle}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Department-wise Placement */}
          <div className="i-card p-6">
            <div className="flex items-start justify-between mb-5">
              <div>
                <h2 className="text-lg font-semibold text-foreground">Department Overview</h2>
                <p className="text-sm text-muted-foreground">Placement progress by department</p>
              </div>
              <div className="flex items-center gap-2">
                <button className="i-btn-icon !w-9 !h-9">
                  <SlidersHorizontal className="w-4 h-4 text-muted-foreground" />
                </button>
              </div>
            </div>

            <div className="space-y-4">
              {[
                { dept: "CSE", placed: 85, total: 120, color: "bg-blue-500" },
                { dept: "ISE", placed: 62, total: 90, color: "bg-purple-500" },
                { dept: "ECE", placed: 45, total: 80, color: "bg-amber-500" },
                { dept: "MECH", placed: 30, total: 60, color: "bg-green-500" },
                { dept: "CIVIL", placed: 18, total: 40, color: "bg-red-500" },
              ].map((dept) => (
                <div key={dept.dept} className="flex items-center gap-3">
                  <span className="text-xs font-medium text-foreground w-10">{dept.dept}</span>
                  <div className="flex-1 h-2.5 rounded-full bg-muted overflow-hidden">
                    <div
                      className={cn("h-full rounded-full transition-all duration-700", dept.color)}
                      style={{ width: `${(dept.placed / dept.total) * 100}%` }}
                    />
                  </div>
                  <span className="text-xs text-muted-foreground w-16 text-right">
                    {dept.placed}/{dept.total}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
