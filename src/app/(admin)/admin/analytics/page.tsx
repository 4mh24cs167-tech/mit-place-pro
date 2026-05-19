"use client";

import Header from "@/components/layout/Header";
import StatsCard from "@/components/dashboard/StatsCard";
import { adminApi } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { cn } from "@/lib/utils";
import {
  Users,
  Building2,
  Award,
  TrendingUp,
  Briefcase,
  FileCheck2,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { useState, useEffect, useCallback } from "react";

const COLORS = ["#6366f1", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4", "#ec4899", "#84cc16"];

interface DeptStat {
  department: string;
  total: number;
  placed: number;
}

export default function AdminAnalyticsPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<{
    totalStudents: number;
    totalCompanies: number;
    totalJobs: number;
    totalApplications: number;
    placedStudents: number;
    activeJobs: number;
    pendingApprovals: number;
    placementRate: number;
    avgCtc: number;
    departmentStats: DeptStat[];
  }>({
    totalStudents: 0,
    totalCompanies: 0,
    totalJobs: 0,
    totalApplications: 0,
    placedStudents: 0,
    activeJobs: 0,
    pendingApprovals: 0,
    placementRate: 0,
    avgCtc: 0,
    departmentStats: [],
  });

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await adminApi.getDashboard();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const data = (res as any)?.data;
      if (data) {
        setStats({
          totalStudents: data.totalStudents || 0,
          totalCompanies: data.totalCompanies || 0,
          totalJobs: data.totalJobs || 0,
          totalApplications: data.totalApplications || 0,
          placedStudents: data.placedStudents || 0,
          activeJobs: data.activeJobs || 0,
          pendingApprovals: data.pendingApprovals || 0,
          placementRate: data.placementRate || 0,
          avgCtc: data.avgCtc || 0,
          departmentStats: (data.departmentStats || []).map((d: DeptStat) => ({
            ...d,
            percentage: d.total > 0 ? Math.round((d.placed / d.total) * 100) : 0,
          })),
        });
      }
    } catch {
      // silently handle — show zeros
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const pieData = [
    { name: "Placed", value: stats.placedStudents, color: "#10b981" },
    { name: "Unplaced", value: Math.max(0, stats.totalStudents - stats.placedStudents), color: "#e2e8f0" },
  ];

  return (
    <div className="page-enter">
      <Header
        userName={user?.email || "Admin"}
        userRole="Administrator"
        subtitle="Placement analytics and performance overview."
      />

      <div className="px-8 pb-10 space-y-7">
        {/* Stats Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {loading ? (
            [1, 2, 3, 4].map(i => (
              <div key={i} className="i-card p-5 animate-pulse">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-muted" />
                  <div className="space-y-2 flex-1">
                    <div className="h-3 bg-muted rounded w-20" />
                    <div className="h-6 bg-muted rounded w-12" />
                  </div>
                </div>
              </div>
            ))
          ) : (
            <>
              <StatsCard title="Total Students" value={stats.totalStudents} change={0} icon={Users} variant="indigo" />
              <StatsCard title="Active Companies" value={stats.totalCompanies} change={0} icon={Building2} variant="emerald" />
              <StatsCard title="Students Placed" value={stats.placedStudents} change={0} icon={Award} variant="amber" />
              <StatsCard title="Avg CTC Offered" value={`₹${stats.avgCtc} LPA`} change={0} icon={TrendingUp} variant="rose" />
            </>
          )}
        </div>

        {/* Second Stats Row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          {loading ? (
            [1, 2, 3].map(i => (
              <div key={i} className="i-card p-5 animate-pulse">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-muted" />
                  <div className="space-y-2 flex-1">
                    <div className="h-3 bg-muted rounded w-20" />
                    <div className="h-6 bg-muted rounded w-12" />
                  </div>
                </div>
              </div>
            ))
          ) : (
            <>
              <StatsCard title="Active Jobs" value={stats.activeJobs} change={0} icon={Briefcase} variant="indigo" />
              <StatsCard title="Pending Approvals" value={stats.pendingApprovals} change={0} icon={FileCheck2} variant="amber" />
              <StatsCard title="Placement Rate" value={`${stats.placementRate}%`} change={0} icon={TrendingUp} variant="emerald" />
            </>
          )}
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Department Performance Chart */}
          <div className="i-card p-6">
            <h3 className="text-base font-semibold text-foreground mb-1">Department-wise Placements</h3>
            <p className="text-xs text-muted-foreground mb-5">Students placed per department</p>
            {loading ? (
              <div className="h-[300px] flex items-center justify-center">
                <div className="animate-pulse text-muted-foreground text-sm">Loading chart...</div>
              </div>
            ) : stats.departmentStats.length === 0 ? (
              <div className="h-[300px] flex items-center justify-center">
                <p className="text-sm text-muted-foreground">No department data available yet</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={stats.departmentStats} barSize={36}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="department" axisLine={false} tickLine={false} tick={{ fill: "#94a3b8", fontSize: 11 }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: "#94a3b8", fontSize: 11 }} />
                  <Tooltip
                    contentStyle={{
                      background: "#1e1b4b",
                      border: "none",
                      borderRadius: "10px",
                      color: "white",
                      fontSize: "12px",
                    }}
                  />
                  <Bar dataKey="total" fill="#c7d2fe" radius={[8, 8, 0, 0]} name="Total" />
                  <Bar dataKey="placed" fill="#6366f1" radius={[8, 8, 0, 0]} name="Placed" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Placement Ratio Pie */}
          <div className="i-card p-6">
            <h3 className="text-base font-semibold text-foreground mb-1">Overall Placement Ratio</h3>
            <p className="text-xs text-muted-foreground mb-5">Placed vs. unplaced students</p>
            {loading ? (
              <div className="h-[300px] flex items-center justify-center">
                <div className="animate-pulse text-muted-foreground text-sm">Loading chart...</div>
              </div>
            ) : (
              <div className="flex items-center justify-center gap-8">
                <ResponsiveContainer width={220} height={220}>
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={95}
                      paddingAngle={3}
                      dataKey="value"
                      strokeWidth={0}
                    >
                      {pieData.map((entry, i) => (
                        <Cell key={i} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        background: "#1e1b4b",
                        border: "none",
                        borderRadius: "10px",
                        color: "white",
                        fontSize: "12px",
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="space-y-4">
                  <div>
                    <p className="text-3xl font-bold text-foreground">{stats.placementRate}%</p>
                    <p className="text-xs text-muted-foreground mt-1">Placement Rate</p>
                  </div>
                  <div className="space-y-2">
                    {pieData.map((item) => (
                      <div key={item.name} className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                        <span className="text-xs text-muted-foreground">{item.name}: <span className="font-semibold text-foreground">{item.value}</span></span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Department Performance Table */}
        <div className="i-card p-6">
          <h3 className="text-base font-semibold text-foreground mb-1">Department Performance Breakdown</h3>
          <p className="text-xs text-muted-foreground mb-5">Detailed placement statistics per department</p>
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map(i => (
                <div key={i} className="animate-pulse flex items-center gap-4 py-3">
                  <div className="h-4 bg-muted rounded w-24" />
                  <div className="h-4 bg-muted rounded w-12" />
                  <div className="h-4 bg-muted rounded w-12" />
                  <div className="h-4 bg-muted rounded w-16" />
                  <div className="flex-1 h-2 bg-muted rounded" />
                </div>
              ))}
            </div>
          ) : stats.departmentStats.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">No department data available yet</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Department</th>
                    <th className="text-right py-3 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Total</th>
                    <th className="text-right py-3 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Placed</th>
                    <th className="text-right py-3 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Rate</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider w-40">Progress</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.departmentStats.map((dept) => {
                    const pct = dept.total > 0 ? Math.round((dept.placed / dept.total) * 100) : 0;
                    return (
                      <tr key={dept.department} className="border-b border-border/50 table-row-hover">
                        <td className="py-3 px-4 font-medium text-foreground">{dept.department}</td>
                        <td className="py-3 px-4 text-right text-muted-foreground">{dept.total}</td>
                        <td className="py-3 px-4 text-right font-semibold text-foreground">{dept.placed}</td>
                        <td className="py-3 px-4 text-right">
                          <span className={cn(
                            "text-xs font-semibold px-2 py-0.5 rounded-full",
                            pct >= 50 ? "bg-emerald-50 text-emerald-600" :
                            pct >= 35 ? "bg-amber-50 text-amber-600" :
                            "bg-red-50 text-red-600"
                          )}>
                            {pct}%
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                              <div
                                className={cn(
                                  "h-full rounded-full transition-all duration-500",
                                  pct >= 50 ? "bg-emerald-500" :
                                  pct >= 35 ? "bg-amber-500" :
                                  "bg-red-500"
                                )}
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
