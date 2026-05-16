"use client";

import Header from "@/components/layout/Header";
import StatsCard from "@/components/dashboard/StatsCard";
import { cn, getInitials } from "@/lib/utils";
import {
  Users,
  CheckCircle2,
  XCircle,
  Award,
  ChevronRight,
  Star,
  FileText,
  Eye,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const roundFunnelData = [
  { round: "Registered", count: 120, fill: "#e0e7ff" },
  { round: "Round 1", count: 98, fill: "#c7d2fe" },
  { round: "Round 2", count: 54, fill: "#a5b4fc" },
  { round: "Round 3", count: 28, fill: "#818cf8" },
  { round: "Finalists", count: 18, fill: "#6366f1" },
];

const candidates = [
  { name: "Arjun Sharma", usn: "4MT21CS001", dept: "CSE", cgpa: 8.75, atsScore: 82, skills: ["React", "Node.js", "Python"] },
  { name: "Priya Patel", usn: "4MT21CS002", dept: "CSE", cgpa: 9.12, atsScore: 88, skills: ["Java", "Spring Boot", "AWS"] },
  { name: "Ananya Iyer", usn: "4MT21CS006", dept: "CSE", cgpa: 9.45, atsScore: 91, skills: ["ML", "Python", "TensorFlow"] },
  { name: "Sneha Reddy", usn: "4MT21IS004", dept: "ISE", cgpa: 8.45, atsScore: 74, skills: ["React", "TypeScript", "GraphQL"] },
  { name: "Rahul Kumar", usn: "4MT21EC003", dept: "ECE", cgpa: 7.85, atsScore: 62, skills: ["VLSI", "Embedded C", "MATLAB"] },
];

export default function CompanyDashboardPage() {
  return (
    <div className="page-enter">
      <Header
        userName="Meera Joshi"
        userRole="Company HR · Infosys"
        subtitle="Manage your campus recruitment drive at MITM."
      />

      <div className="px-8 pb-10 space-y-7">
        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <StatsCard title="Approved Candidates" value={120} icon={Users} variant="indigo" />
          <StatsCard title="Round 1 Selected" value={54} icon={CheckCircle2} variant="emerald" />
          <StatsCard title="Finalists" value={18} icon={Award} variant="amber" />
          <StatsCard title="Offers Sent" value={12} icon={FileText} variant="rose" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Funnel chart */}
          <div className="lg:col-span-2 glass-card p-6">
            <h3 className="text-base font-semibold text-foreground mb-1">Round Funnel</h3>
            <p className="text-xs text-muted-foreground mb-5">Candidate progression through rounds</p>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={roundFunnelData} layout="vertical" barSize={28}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                <XAxis type="number" axisLine={false} tickLine={false} tick={{ fill: "#94a3b8", fontSize: 11 }} />
                <YAxis type="category" dataKey="round" axisLine={false} tickLine={false} tick={{ fill: "#64748b", fontSize: 12, fontWeight: 500 }} width={90} />
                <Tooltip
                  contentStyle={{
                    background: "#1e1b4b",
                    border: "none",
                    borderRadius: "10px",
                    color: "white",
                    fontSize: "12px",
                  }}
                />
                <Bar dataKey="count" radius={[0, 8, 8, 0]}>
                  {roundFunnelData.map((entry, i) => (
                    <Bar key={i} dataKey="count" fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Top candidates */}
          <div className="lg:col-span-3 glass-card p-6">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="text-base font-semibold text-foreground">Top Candidates</h3>
                <p className="text-xs text-muted-foreground mt-0.5">Sorted by ATS score for your job description</p>
              </div>
              <button className="text-xs text-primary hover:underline font-medium">View all</button>
            </div>

            <div className="space-y-3">
              {candidates.map((c, i) => (
                <div key={i} className="flex items-center gap-4 p-3 rounded-xl hover:bg-muted/40 transition-colors cursor-pointer group">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-100 to-teal-100 flex items-center justify-center text-xs font-bold text-emerald-700">
                    {getInitials(c.name)}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-foreground">{c.name}</p>
                      <span className="text-[10px] text-muted-foreground">{c.usn}</span>
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[10px] font-medium text-muted-foreground">{c.dept}</span>
                      <span className="text-muted-foreground">·</span>
                      <span className="text-[10px] text-muted-foreground">CGPA: {c.cgpa}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {c.skills.slice(0, 2).map((s) => (
                      <span key={s} className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-600 font-medium">
                        {s}
                      </span>
                    ))}
                  </div>

                  <div className={cn(
                    "flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border",
                    c.atsScore >= 80 ? "bg-emerald-50 text-emerald-600 border-emerald-200" :
                    c.atsScore >= 65 ? "bg-blue-50 text-blue-600 border-blue-200" :
                    "bg-amber-50 text-amber-600 border-amber-200"
                  )}>
                    <Star className="w-3 h-3" />
                    {c.atsScore}%
                  </div>

                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button className="p-1.5 rounded-lg hover:bg-muted transition-colors" title="View Profile">
                      <Eye className="w-4 h-4 text-muted-foreground" />
                    </button>
                    <button className="p-1.5 rounded-lg hover:bg-muted transition-colors" title="View CVs">
                      <FileText className="w-4 h-4 text-muted-foreground" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Job summary card */}
        <div className="glass-card p-6">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-base font-semibold text-foreground">Your Active Job Posting</h3>
              <p className="text-xs text-muted-foreground mt-0.5">Software Engineer — Full Time</p>
            </div>
            <span className="text-[10px] font-semibold px-3 py-1 rounded-full bg-emerald-50 text-emerald-600">Open</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-5">
            <div className="p-3 rounded-xl bg-muted/40 text-center">
              <p className="text-xl font-bold text-foreground">25</p>
              <p className="text-[10px] text-muted-foreground uppercase">Vacancies</p>
            </div>
            <div className="p-3 rounded-xl bg-muted/40 text-center">
              <p className="text-xl font-bold text-foreground">₹4.5 - 6.0</p>
              <p className="text-[10px] text-muted-foreground uppercase">CTC (LPA)</p>
            </div>
            <div className="p-3 rounded-xl bg-muted/40 text-center">
              <p className="text-xl font-bold text-foreground">3</p>
              <p className="text-[10px] text-muted-foreground uppercase">Rounds</p>
            </div>
            <div className="p-3 rounded-xl bg-muted/40 text-center">
              <p className="text-xl font-bold text-foreground">7.0</p>
              <p className="text-[10px] text-muted-foreground uppercase">Min CGPA</p>
            </div>
          </div>

          <div className="flex items-center gap-2 mt-5">
            <span className="text-xs text-muted-foreground">Required Skills:</span>
            {["Java", "SQL", "Problem Solving", "Communication"].map((s) => (
              <span key={s} className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-600 font-medium">
                {s}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
