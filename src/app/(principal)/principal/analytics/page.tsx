"use client";

import Header from "@/components/layout/Header";
import StatsCard from "@/components/dashboard/StatsCard";
import { MOCK_DASHBOARD_STATS } from "@/constants";
import { cn } from "@/lib/utils";
import {
  Users,
  Building2,
  Award,
  TrendingUp,
  Download,
  Printer,
  Calendar,
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
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

const COLORS = ["#6366f1", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4", "#ec4899", "#84cc16"];

const yearComparison = [
  { year: "2022", placed: 620, rate: 38 },
  { year: "2023", placed: 745, rate: 42 },
  { year: "2024", placed: 812, rate: 45 },
  { year: "2025", placed: 892, rate: 48 },
];

const ctcDistribution = [
  { range: "< 3 LPA", count: 120, fill: "#e0e7ff" },
  { range: "3-5 LPA", count: 380, fill: "#a5b4fc" },
  { range: "5-8 LPA", count: 245, fill: "#818cf8" },
  { range: "8-12 LPA", count: 98, fill: "#6366f1" },
  { range: "12+ LPA", count: 49, fill: "#4f46e5" },
];

export default function PrincipalAnalyticsPage() {
  const stats = MOCK_DASHBOARD_STATS;

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
          <StatsCard title="Total Students" value={stats.totalStudents} change={12} icon={Users} variant="indigo" />
          <StatsCard title="Active Companies" value={stats.totalCompanies} change={8} icon={Building2} variant="emerald" />
          <StatsCard title="Students Placed" value={stats.totalPlaced} change={15} icon={Award} variant="amber" />
          <StatsCard title="Avg CTC Offered" value={`₹${stats.avgCtc} LPA`} change={6} icon={TrendingUp} variant="rose" />
        </div>

        {/* Year comparison + CTC distribution */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="glass-card p-6">
            <h3 className="text-base font-semibold text-foreground mb-1">Year-on-Year Comparison</h3>
            <p className="text-xs text-muted-foreground mb-5">Placement numbers over the last 4 years</p>
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
          </div>

          <div className="glass-card p-6">
            <h3 className="text-base font-semibold text-foreground mb-1">CTC Distribution</h3>
            <p className="text-xs text-muted-foreground mb-5">Package ranges of placed students</p>
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
          </div>
        </div>

        {/* Department performance table */}
        <div className="glass-card p-6">
          <h3 className="text-base font-semibold text-foreground mb-1">Department-wise Performance</h3>
          <p className="text-xs text-muted-foreground mb-5">Detailed breakdown by department</p>
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
                {stats.departmentStats.map((dept) => (
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
        </div>

        {/* Company performance */}
        <div className="glass-card p-6">
          <h3 className="text-base font-semibold text-foreground mb-1">Top Recruiters</h3>
          <p className="text-xs text-muted-foreground mb-5">Companies with highest placements</p>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={stats.companyStats} barSize={32}>
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
        </div>
      </div>
    </div>
  );
}
