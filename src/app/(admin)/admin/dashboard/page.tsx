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
  Mail,
  Ban,
  Clock,
  XCircle,
  Send,
} from "lucide-react";

interface DashboardStats {
  totalStudents: number;
  totalCompanies: number;
  totalJobs: number;
  totalPlaced: number;
  placementRate: number;
  pendingApprovals: number;
  departmentStats?: Array<{ department: string; placed: number; total: number }>;
  driveResponseStats?: { pending: number; approved: number; rejected: number; declined: number };
  emailStats?: Array<{ emailType: string; total: number; sent: number; failed: number; totalRecipients: number }>;
}

interface ActivityItem {
  id: string;
  action: string;
  entityType: string;
  createdAt: string;
}

interface EmailLogItem {
  id: string;
  emailType: string;
  subject: string;
  recipients: string[];
  recipientCount: number;
  success: boolean;
  errorMessage: string | null;
  createdAt: string;
}

const emailTypeLabels: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  company_credentials: { label: "Company Credentials", color: "text-purple-600", icon: Building2 },
  otp_reset: { label: "Password Reset", color: "text-amber-600", icon: RefreshCw },
  round_selected: { label: "Round Selected", color: "text-emerald-600", icon: CheckCircle2 },
  round_rejected: { label: "Round Rejected", color: "text-red-600", icon: XCircle },
  drive_announcement: { label: "Drive Announcement", color: "text-indigo-600", icon: Send },
  other: { label: "Other", color: "text-slate-600", icon: Mail },
};

export default function AdminDashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [activity, setActivity] = useState<ActivityItem[]>([]);
  const [emailLogs, setEmailLogs] = useState<EmailLogItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async (silent = false) => {
    if (!silent) setIsLoading(true);
    else setIsRefreshing(true);
    setError(null);

    try {
      const [dashRes, actRes, emailRes] = await Promise.allSettled([
        adminApi.getDashboard(),
        adminApi.getActivity(8),
        adminApi.getEmailLogs(20),
      ]);

      if (dashRes.status === 'fulfilled' && dashRes.value.data) setStats(dashRes.value.data as DashboardStats);
      if (actRes.status === 'fulfilled' && actRes.value.data) setActivity(actRes.value.data as ActivityItem[]);
      if (emailRes.status === 'fulfilled' && emailRes.value.data) setEmailLogs(emailRes.value.data as EmailLogItem[]);

      // Only show error if the main dashboard call failed
      if (dashRes.status === 'rejected') {
        setError("Failed to load dashboard data");
      }
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
              {(stats?.pendingApprovals ?? 0) > 0 ? (
                <div className="flex items-start gap-3 pb-4 border-b border-border">
                  <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 border-2 border-border" />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-foreground">
                        Review {stats?.pendingApprovals} pending approvals
                      </p>
                      <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-red-50 text-red-600">Urgent</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">Approval Queue</p>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <CheckCircle2 className="w-8 h-8 text-green-500 mb-2" />
                  <p className="text-sm font-medium text-foreground">All caught up!</p>
                  <p className="text-xs text-muted-foreground mt-1">No pending tasks right now</p>
                </div>
              )}
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
              {(stats?.departmentStats && stats.departmentStats.length > 0) ? (
                stats.departmentStats.map((dept) => {
                  const colors = ["bg-blue-500", "bg-purple-500", "bg-amber-500", "bg-green-500", "bg-red-500", "bg-indigo-500", "bg-pink-500", "bg-teal-500"];
                  const colorIdx = stats.departmentStats!.indexOf(dept) % colors.length;
                  return (
                    <div key={dept.department} className="flex items-center gap-3">
                      <span className="text-xs font-medium text-foreground w-14">{dept.department}</span>
                      <div className="flex-1 h-2.5 rounded-full bg-muted overflow-hidden">
                        <div
                          className={cn("h-full rounded-full transition-all duration-700", colors[colorIdx])}
                          style={{ width: `${dept.total > 0 ? (dept.placed / dept.total) * 100 : 0}%` }}
                        />
                      </div>
                      <span className="text-xs text-muted-foreground w-16 text-right">
                        {dept.placed}/{dept.total}
                      </span>
                    </div>
                  );
                })
              ) : (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <SlidersHorizontal className="w-8 h-8 text-muted-foreground mb-2" />
                  <p className="text-sm font-medium text-foreground">No department data</p>
                  <p className="text-xs text-muted-foreground mt-1">Department stats will appear as placements happen</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Drive Response Stats & Email Audit */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mt-5">
          {/* Drive Response Stats */}
          <div className="i-card p-6">
            <div className="flex items-start justify-between mb-5">
              <div>
                <h2 className="text-lg font-semibold text-foreground">Drive Responses</h2>
                <p className="text-sm text-muted-foreground">Student drive acceptance/decline tracking</p>
              </div>
            </div>
            {isLoading ? (
              <div className="space-y-3">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="h-10 bg-muted animate-pulse rounded-lg" />
                ))}
              </div>
            ) : stats?.driveResponseStats ? (
              <div className="space-y-3">
                {[
                  { key: "approved" as const, label: "Accepted", icon: CheckCircle2, color: "text-emerald-600", bg: "bg-emerald-50", barColor: "bg-emerald-500" },
                  { key: "declined" as const, label: "Declined", icon: Ban, color: "text-slate-600", bg: "bg-slate-50", barColor: "bg-slate-400" },
                  { key: "pending" as const, label: "Not Responded", icon: Clock, color: "text-amber-600", bg: "bg-amber-50", barColor: "bg-amber-400" },
                  { key: "rejected" as const, label: "Rejected by Admin", icon: XCircle, color: "text-red-600", bg: "bg-red-50", barColor: "bg-red-400" },
                ].map((item) => {
                  const count = stats.driveResponseStats?.[item.key] ?? 0;
                  const total = Object.values(stats.driveResponseStats || {}).reduce((a, b) => a + b, 0);
                  const pct = total > 0 ? (count / total) * 100 : 0;
                  return (
                    <div key={item.key} className="flex items-center gap-3">
                      <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0", item.bg)}>
                        <item.icon className={cn("w-4 h-4", item.color)} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-medium text-foreground">{item.label}</span>
                          <span className="text-xs font-bold text-foreground">{count}</span>
                        </div>
                        <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                          <div className={cn("h-full rounded-full transition-all duration-700", item.barColor)} style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <Users className="w-8 h-8 text-muted-foreground mb-2" />
                <p className="text-sm font-medium text-foreground">No drive data</p>
                <p className="text-xs text-muted-foreground mt-1">Drive response stats will appear when drives are created</p>
              </div>
            )}
          </div>

          {/* Email Audit Log */}
          <div className="i-card p-6">
            <div className="flex items-start justify-between mb-5">
              <div>
                <h2 className="text-lg font-semibold text-foreground">Email Audit</h2>
                <p className="text-sm text-muted-foreground">Emails sent by type and status</p>
              </div>
              <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center", "bg-indigo-50")}>
                <Mail className="w-4 h-4 text-indigo-600" />
              </div>
            </div>
            {isLoading ? (
              <div className="space-y-3">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="h-10 bg-muted animate-pulse rounded-lg" />
                ))}
              </div>
            ) : stats?.emailStats && stats.emailStats.length > 0 ? (
              <div className="space-y-2.5">
                {stats.emailStats.map((es) => {
                  const cfg = emailTypeLabels[es.emailType] || emailTypeLabels.other;
                  const TypeIcon = cfg.icon;
                  return (
                    <div key={es.emailType} className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-muted/50 transition-colors">
                      <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                        <TypeIcon className={cn("w-4 h-4", cfg.color)} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-foreground truncate">{cfg.label}</p>
                        <p className="text-[10px] text-muted-foreground">
                          {es.totalRecipients} recipients
                        </p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-sm font-bold text-foreground">{es.sent}</p>
                        <p className="text-[10px] text-muted-foreground">
                          {es.failed > 0 ? <span className="text-red-500">{es.failed} failed</span> : "all sent"}
                        </p>
                      </div>
                    </div>
                  );
                })}
                <div className="pt-2 border-t border-border">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground font-medium">Total Emails</span>
                    <span className="font-bold text-foreground">
                      {stats.emailStats.reduce((a, b) => a + b.total, 0)}
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <Mail className="w-8 h-8 text-muted-foreground mb-2" />
                <p className="text-sm font-medium text-foreground">No emails sent yet</p>
                <p className="text-xs text-muted-foreground mt-1">Email audit data will appear as emails are sent</p>
              </div>
            )}
          </div>
        </div>

        {/* Recent Email Log */}
        {emailLogs.length > 0 && (
          <div className="i-card p-6 mt-5">
            <div className="flex items-start justify-between mb-5">
              <div>
                <h2 className="text-lg font-semibold text-foreground">Recent Email Activity</h2>
                <p className="text-sm text-muted-foreground">Latest {emailLogs.length} emails sent from the system</p>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-2 px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Type</th>
                    <th className="text-left py-2 px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Subject</th>
                    <th className="text-left py-2 px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Recipients</th>
                    <th className="text-left py-2 px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Status</th>
                    <th className="text-left py-2 px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {emailLogs.map((log) => {
                    const cfg = emailTypeLabels[log.emailType] || emailTypeLabels.other;
                    return (
                      <tr key={log.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                        <td className="py-2.5 px-3">
                          <span className={cn("text-xs font-semibold", cfg.color)}>{cfg.label}</span>
                        </td>
                        <td className="py-2.5 px-3">
                          <span className="text-xs text-foreground truncate block max-w-[250px]">{log.subject}</span>
                        </td>
                        <td className="py-2.5 px-3">
                          <span className="text-xs text-muted-foreground">{log.recipientCount}</span>
                        </td>
                        <td className="py-2.5 px-3">
                          {log.success ? (
                            <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                              <CheckCircle2 className="w-3 h-3" /> Sent
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-xs font-medium text-red-700 bg-red-50 px-2 py-0.5 rounded-full">
                              <XCircle className="w-3 h-3" /> Failed
                            </span>
                          )}
                        </td>
                        <td className="py-2.5 px-3">
                          <span className="text-xs text-muted-foreground">
                            {new Date(log.createdAt).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
