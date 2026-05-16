"use client";

import Header from "@/components/layout/Header";
import StatsCard from "@/components/dashboard/StatsCard";
import { adminApi } from "@/lib/api";
import { cn } from "@/lib/utils";
import {
  Users,
  Building2,
  Award,
  TrendingUp,
  Download,
  Printer,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  Cell,
} from "recharts";
import { useState, useEffect, useCallback } from "react";

const COLORS = ["#6366f1", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4", "#ec4899", "#84cc16"];

const yearComparison = [
  { year: "2022", placed: 620 },
  { year: "2023", placed: 745 },
  { year: "2024", placed: 812 },
  { year: "2025", placed: 892 },
];

const defaultCtcDistribution = [
  { range: "< 3 LPA", count: 0, fill: "#e0e7ff" },
  { range: "3-5 LPA", count: 0, fill: "#a5b4fc" },
  { range: "5-8 LPA", count: 0, fill: "#818cf8" },
  { range: "8-12 LPA", count: 0, fill: "#6366f1" },
  { range: "12+ LPA", count: 0, fill: "#4f46e5" },
];

interface DeptStat {
  department: string;
  total: number;
  placed: number;
  percentage: number;
}

interface CompanyStat {
  company: string;
  placed: number;
}

export default function PrincipalAnalyticsPage() {
  const [loading, setLoading] = useState(true);
  const [totalStudents, setTotalStudents] = useState(0);
  const [totalCompanies, setTotalCompanies] = useState(0);
  const [totalPlaced, setTotalPlaced] = useState(0);
  const [avgCtc, setAvgCtc] = useState("0");
  const [departmentStats, setDepartmentStats] = useState<DeptStat[]>([]);
  const [companyStats, setCompanyStats] = useState<CompanyStat[]>([]);
  const [ctcDistribution, setCtcDistribution] = useState(defaultCtcDistribution);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await adminApi.getDashboard();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const data = (res as any)?.data;
      if (data) {
        setTotalStudents(data.totalStudents || 0);
        setTotalCompanies(data.totalCompanies || 0);
        setTotalPlaced(data.totalPlaced || 0);
        setAvgCtc(data.avgCtc || "0");
        setDepartmentStats(data.departmentStats || []);
        setCompanyStats(data.companyStats || []);
        if (data.ctcDistribution) {
          setCtcDistribution(data.ctcDistribution);
        }
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

  return (
    <div className="page-enter">
      <Header
        userName="Dr. Principal"
        userRole="Principal (Read-Only)"
        subtitle="Comprehensive placement analytics for the current season."
      />

      <div className="px-8 pb-10 space-y-7">
        {/* Read-only banner */}
        <div className="flex items-center gap-3 p-4 rounded-xl bg-purple-50 border border-purple-200">
          <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center">
            <TrendingUp className="w-4 h-4 text-purple-600" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-purple-800">Read-Only Analytics Dashboard</p>
            <p className="text-xs text-purple-600">You have view-only access to placement statistics and reports.</p>
          </div>
          <div className="flex items-center gap-2">
            <button className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-purple-200 bg-white text-xs font-medium text-purple-700 hover:bg-purple-50 transition-colors">
              <Download className="w-3.5 h-3.5" />
              Export PDF
            </button>
            <button className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-purple-200 bg-white text-xs font-medium text-purple-700 hover:bg-purple-50 transition-colors">
              <Printer className="w-3.5 h-3.5" />
              Print
            </button>
          </div>
        </div>

        {/* Stats */}
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
              <StatsCard title="Total Students" value={totalStudents} change={12} icon={Users} variant="indigo" />
              <StatsCard title="Active Companies" value={totalCompanies} change={8} icon={Building2} variant="emerald" />
              <StatsCard title="Students Placed" value={totalPlaced} change={15} icon={Award} variant="amber" />
              <StatsCard title="Avg CTC Offered" value={`₹${avgCtc} LPA`} change={6} icon={TrendingUp} variant="rose" />
            </>
          )}
        </div>

        {/* Year comparison + CTC distribution */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="i-card p-6">
            <h3 className="text-base font-semibold text-foreground mb-1">Year-on-Year Comparison</h3>
            <p className="text-xs text-muted-foreground mb-5">Placement numbers over the last 4 years</p>
            {loading ? (
              <div className="h-[280px] flex items-center justify-center">
                <div className="animate-pulse text-muted-foreground text-sm">Loading chart...</div>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={yearComparison}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="year" axisLine={false} tickLine={false} tick={{ fill: "#94a3b8", fontSize: 12 }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: "#94a3b8", fontSize: 12 }} />
                  <Tooltip
                    contentStyle={{
                      background: "#1e1b4b",
                      border: "none",
                      borderRadius: "10px",
                      color: "white",
                      fontSize: "12px",
                    }}
                  />
                  <Line type="monotone" dataKey="placed" stroke="#6366f1" strokeWidth={3} dot={{ r: 6, fill: "#6366f1", stroke: "white", strokeWidth: 2 }} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>

          <div className="i-card p-6">
            <h3 className="text-base font-semibold text-foreground mb-1">CTC Distribution</h3>
            <p className="text-xs text-muted-foreground mb-5">Package ranges of placed students</p>
            {loading ? (
              <div className="h-[280px] flex items-center justify-center">
                <div className="animate-pulse text-muted-foreground text-sm">Loading chart...</div>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={ctcDistribution} barSize={40}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="range" axisLine={false} tickLine={false} tick={{ fill: "#94a3b8", fontSize: 11 }} />
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
                  <Bar dataKey="count" radius={[8, 8, 0, 0]}>
                    {ctcDistribution.map((entry, i) => (
                      <Cell key={i} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Department performance table */}
        <div className="i-card p-6">
          <h3 className="text-base font-semibold text-foreground mb-1">Department-wise Performance</h3>
          <p className="text-xs text-muted-foreground mb-5">Detailed breakdown by department</p>
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
          ) : departmentStats.length === 0 ? (
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
                  {departmentStats.map((dept) => (
                    <tr key={dept.department} className="border-b border-border/50 table-row-hover">
                      <td className="py-3 px-4 font-medium text-foreground">{dept.department}</td>
                      <td className="py-3 px-4 text-right text-muted-foreground">{dept.total}</td>
                      <td className="py-3 px-4 text-right font-semibold text-foreground">{dept.placed}</td>
                      <td className="py-3 px-4 text-right">
                        <span className={cn(
                          "text-xs font-semibold px-2 py-0.5 rounded-full",
                          dept.percentage >= 50 ? "bg-emerald-50 text-emerald-600" :
                          dept.percentage >= 35 ? "bg-amber-50 text-amber-600" :
                          "bg-red-50 text-red-600"
                        )}>
                          {dept.percentage}%
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                            <div
                              className={cn(
                                "h-full rounded-full progress-fill",
                                dept.percentage >= 50 ? "bg-emerald-500" :
                                dept.percentage >= 35 ? "bg-amber-500" :
                                "bg-red-500"
                              )}
                              style={{ width: `${dept.percentage}%` }}
                            />
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Company performance */}
        <div className="i-card p-6">
          <h3 className="text-base font-semibold text-foreground mb-1">Top Recruiters</h3>
          <p className="text-xs text-muted-foreground mb-5">Companies with highest placements</p>
          {loading ? (
            <div className="h-[280px] flex items-center justify-center">
              <div className="animate-pulse text-muted-foreground text-sm">Loading chart...</div>
            </div>
          ) : companyStats.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">No company data available yet</p>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={companyStats} barSize={32}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="company" axisLine={false} tickLine={false} tick={{ fill: "#94a3b8", fontSize: 11 }} />
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
                <Bar dataKey="placed" fill="#6366f1" radius={[8, 8, 0, 0]} name="Students Placed" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  );
}
