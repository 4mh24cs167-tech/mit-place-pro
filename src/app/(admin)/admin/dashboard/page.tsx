"use client";

import Header from "@/components/layout/Header";
import StatsCard from "@/components/dashboard/StatsCard";
import { MOCK_DASHBOARD_STATS, MOCK_STUDENTS, MOCK_COMPANIES } from "@/constants";
import { getStatusConfig, cn } from "@/lib/utils";
import {
  Users,
  Building2,
  Award,
  TrendingUp,
  FileText,
  CalendarClock,
  ArrowUpRight,
  Upload,
  Plus,
  MoreHorizontal,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
} from "recharts";

const CHART_COLORS = ["#6366f1", "#8b5cf6", "#a78bfa", "#c4b5fd", "#ddd6fe", "#ede9fe", "#a5b4fc", "#818cf8"];

export default function AdminDashboardPage() {
  const stats = MOCK_DASHBOARD_STATS;

  return (
    <div className="page-enter">
      <Header
        userName="Dr. Placement Head"
        userRole="Admin"
        subtitle="Here's your placement overview for the current season."
      />

      <div className="px-8 pb-10 space-y-8">
        {/* Stats Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <StatsCard
            title="Total Students"
            value={stats.totalStudents}
            change={12}
            changeLabel="vs last year"
            icon={Users}
            variant="indigo"
          />
          <StatsCard
            title="Companies Active"
            value={stats.totalCompanies}
            change={8}
            changeLabel="vs last year"
            icon={Building2}
            variant="emerald"
          />
          <StatsCard
            title="Students Placed"
            value={stats.totalPlaced}
            change={15}
            changeLabel="48.3% placement rate"
            icon={Award}
            variant="amber"
          />
          <StatsCard
            title="Average CTC"
            value={`₹${stats.avgCtc} LPA`}
            change={6}
            changeLabel="vs last year"
            icon={TrendingUp}
            variant="rose"
          />
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <button className="glass-card flex items-center gap-4 p-5 group cursor-pointer">
            <div className="w-11 h-11 rounded-xl bg-indigo-50 flex items-center justify-center group-hover:bg-indigo-100 transition-colors">
              <Upload className="w-5 h-5 text-indigo-600" />
            </div>
            <div className="text-left">
              <p className="text-sm font-semibold text-foreground">Upload Students</p>
              <p className="text-xs text-muted-foreground">Bulk import via Excel</p>
            </div>
            <ArrowUpRight className="w-4 h-4 text-muted-foreground ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
          </button>

          <button className="glass-card flex items-center gap-4 p-5 group cursor-pointer">
            <div className="w-11 h-11 rounded-xl bg-emerald-50 flex items-center justify-center group-hover:bg-emerald-100 transition-colors">
              <Plus className="w-5 h-5 text-emerald-600" />
            </div>
            <div className="text-left">
              <p className="text-sm font-semibold text-foreground">Add Company</p>
              <p className="text-xs text-muted-foreground">Create HR account</p>
            </div>
            <ArrowUpRight className="w-4 h-4 text-muted-foreground ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
          </button>

          <button className="glass-card flex items-center gap-4 p-5 group cursor-pointer">
            <div className="w-11 h-11 rounded-xl bg-violet-50 flex items-center justify-center group-hover:bg-violet-100 transition-colors">
              <CalendarClock className="w-5 h-5 text-violet-600" />
            </div>
            <div className="text-left">
              <p className="text-sm font-semibold text-foreground">Generate Slots</p>
              <p className="text-xs text-muted-foreground">Interview scheduling</p>
            </div>
            <ArrowUpRight className="w-4 h-4 text-muted-foreground ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
          </button>
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Placement Trend */}
          <div className="lg:col-span-2 glass-card p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-base font-semibold text-foreground">Placement Trend</h3>
                <p className="text-xs text-muted-foreground mt-0.5">Monthly placements & offers this season</p>
              </div>
              <button className="p-2 rounded-lg hover:bg-muted transition-colors">
                <MoreHorizontal className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={stats.monthlyTrend}>
                <defs>
                  <linearGradient id="colorPlacements" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorOffers" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: "#94a3b8", fontSize: 12 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: "#94a3b8", fontSize: 12 }} />
                <Tooltip
                  contentStyle={{
                    background: "#1e1b4b",
                    border: "none",
                    borderRadius: "10px",
                    color: "white",
                    fontSize: "12px",
                    padding: "8px 12px",
                  }}
                />
                <Area type="monotone" dataKey="offers" stroke="#8b5cf6" strokeWidth={2} fill="url(#colorOffers)" />
                <Area type="monotone" dataKey="placements" stroke="#6366f1" strokeWidth={2.5} fill="url(#colorPlacements)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Department-wise pie */}
          <div className="glass-card p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-semibold text-foreground">By Department</h3>
                <p className="text-xs text-muted-foreground mt-0.5">Placement distribution</p>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={stats.departmentStats.slice(0, 6)}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={80}
                  paddingAngle={3}
                  dataKey="placed"
                  nameKey="department"
                >
                  {stats.departmentStats.slice(0, 6).map((_, index) => (
                    <Cell key={index} fill={CHART_COLORS[index % CHART_COLORS.length]} />
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
            <div className="grid grid-cols-2 gap-2 mt-2">
              {stats.departmentStats.slice(0, 6).map((dept, i) => (
                <div key={dept.department} className="flex items-center gap-2">
                  <div
                    className="w-2.5 h-2.5 rounded-sm"
                    style={{ backgroundColor: CHART_COLORS[i] }}
                  />
                  <span className="text-[11px] text-muted-foreground">
                    {dept.department} ({dept.placed})
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Department Performance Bar Chart + Recent Students */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Bar chart */}
          <div className="lg:col-span-3 glass-card p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-base font-semibold text-foreground">Department Performance</h3>
                <p className="text-xs text-muted-foreground mt-0.5">Students vs Placed per department</p>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={stats.departmentStats} barGap={6}>
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
                <Bar dataKey="total" fill="#e0e7ff" radius={[6, 6, 0, 0]} name="Total" />
                <Bar dataKey="placed" fill="#6366f1" radius={[6, 6, 0, 0]} name="Placed" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Recent students */}
          <div className="lg:col-span-2 glass-card p-6">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="text-base font-semibold text-foreground">Recent Students</h3>
                <p className="text-xs text-muted-foreground mt-0.5">Latest profile updates</p>
              </div>
              <button className="text-xs text-primary hover:underline font-medium">View all</button>
            </div>
            <div className="space-y-3">
              {MOCK_STUDENTS.slice(0, 5).map((student) => {
                const statusCfg = getStatusConfig(student.placementStatus);
                return (
                  <div
                    key={student.id}
                    className="flex items-center gap-3 p-3 rounded-xl hover:bg-muted/50 transition-colors cursor-pointer"
                  >
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-slate-200 to-slate-300 flex items-center justify-center text-xs font-bold text-slate-600">
                      {student.fullName.split(" ").map(n => n[0]).join("")}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{student.fullName}</p>
                      <p className="text-[11px] text-muted-foreground">{student.department} · {student.usn}</p>
                    </div>
                    <span className={cn("text-[10px] font-semibold px-2 py-0.5 rounded-full", statusCfg.bg, statusCfg.color)}>
                      {statusCfg.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Company Activity */}
        <div className="glass-card p-6">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="text-base font-semibold text-foreground">Company Activity</h3>
              <p className="text-xs text-muted-foreground mt-0.5">Active placement drives</p>
            </div>
            <button className="text-xs text-primary hover:underline font-medium">View all</button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Company</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Sector</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Status</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Profile</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">HR Contact</th>
                </tr>
              </thead>
              <tbody>
                {MOCK_COMPANIES.map((company) => (
                  <tr key={company.id} className="border-b border-border/50 table-row-hover cursor-pointer">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-100 to-teal-100 flex items-center justify-center text-[11px] font-bold text-emerald-700">
                          {company.name.charAt(0)}
                        </div>
                        <span className="font-medium text-foreground">{company.name}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-muted-foreground">{company.sector}</td>
                    <td className="py-3 px-4">
                      <span className={cn(
                        "text-[10px] font-semibold px-2 py-0.5 rounded-full",
                        company.isActive ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-600"
                      )}>
                        {company.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-1.5 rounded-full bg-muted overflow-hidden">
                          <div
                            className="h-full rounded-full bg-indigo-500 progress-fill"
                            style={{ width: company.profileComplete ? "100%" : "40%" }}
                          />
                        </div>
                        <span className="text-[11px] text-muted-foreground">
                          {company.profileComplete ? "100%" : "40%"}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-muted-foreground">{company.hrName}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
