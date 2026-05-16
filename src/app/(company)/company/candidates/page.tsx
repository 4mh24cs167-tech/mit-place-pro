"use client";

import Header from "@/components/layout/Header";
import { cn, getInitials } from "@/lib/utils";
import {
  Search,
  Filter,
  Star,
  Download,
  Eye,
  FileText,
  ChevronDown,
  CheckCircle2,
  XCircle,
  Users,
  ArrowUpDown,
  ThumbsUp,
  ThumbsDown,
  SortAsc,
} from "lucide-react";
import { useState } from "react";

const candidates = [
  { id: "c1", name: "Arjun Sharma", usn: "4MT21CS001", dept: "CSE", cgpa: 8.75, atsScore: 82, matchScore: 78, skills: ["React", "Node.js", "TypeScript"], round: 2, status: "shortlisted" as const },
  { id: "c2", name: "Priya Patel", usn: "4MT21CS002", dept: "CSE", cgpa: 9.2, atsScore: 88, matchScore: 85, skills: ["Python", "ML", "Data Science"], round: 1, status: "selected" as const },
  { id: "c3", name: "Ananya Iyer", usn: "4MT21CS006", dept: "CSE", cgpa: 8.5, atsScore: 91, matchScore: 89, skills: ["Java", "Spring Boot", "AWS"], round: 3, status: "shortlisted" as const },
  { id: "c4", name: "Sneha Reddy", usn: "4MT21IS004", dept: "ISE", cgpa: 7.8, atsScore: 74, matchScore: 70, skills: ["React", "Firebase", "Flutter"], round: 1, status: "pending" as const },
  { id: "c5", name: "Rahul Kumar", usn: "4MT21EC003", dept: "ECE", cgpa: 7.2, atsScore: 62, matchScore: 58, skills: ["C++", "Embedded", "RTOS"], round: 0, status: "rejected" as const },
  { id: "c6", name: "Vikram Singh", usn: "4MT21ME005", dept: "MECH", cgpa: 6.5, atsScore: 45, matchScore: 40, skills: ["AutoCAD", "MATLAB"], round: 0, status: "rejected" as const },
  { id: "c7", name: "Meera Nair", usn: "4MT21CS007", dept: "CSE", cgpa: 9.5, atsScore: 95, matchScore: 93, skills: ["React", "Next.js", "GraphQL", "Docker"], round: 3, status: "shortlisted" as const },
  { id: "c8", name: "Dev Patel", usn: "4MT21CS008", dept: "CSE", cgpa: 8.1, atsScore: 79, matchScore: 75, skills: ["Python", "Django", "PostgreSQL"], round: 2, status: "shortlisted" as const },
];

const statusColors: Record<string, { bg: string; text: string }> = {
  shortlisted: { bg: "bg-indigo-50", text: "text-indigo-600" },
  selected: { bg: "bg-emerald-50", text: "text-emerald-600" },
  pending: { bg: "bg-amber-50", text: "text-amber-600" },
  rejected: { bg: "bg-red-50", text: "text-red-600" },
};

export default function CompanyCandidatesPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState<"ats" | "cgpa" | "match">("ats");

  const filtered = candidates
    .filter((c) => {
      const matchSearch = c.name.toLowerCase().includes(searchQuery.toLowerCase()) || c.usn.toLowerCase().includes(searchQuery.toLowerCase());
      const matchStatus = statusFilter === "all" || c.status === statusFilter;
      return matchSearch && matchStatus;
    })
    .sort((a, b) => {
      if (sortBy === "ats") return b.atsScore - a.atsScore;
      if (sortBy === "cgpa") return b.cgpa - a.cgpa;
      return b.matchScore - a.matchScore;
    });

  return (
    <div className="page-enter">
      <Header
        userName="HR Manager"
        userRole="Company"
        greeting="Candidates"
        subtitle={`${candidates.length} total candidates · ${candidates.filter(c => c.status === "shortlisted").length} shortlisted`}
      />

      <div className="px-8 pb-10 space-y-6">
        {/* Filters */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center flex-1 max-w-sm bg-white rounded-xl border border-border px-3">
            <Search className="w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search candidates..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 bg-transparent px-3 py-2.5 text-sm outline-none text-foreground placeholder:text-muted-foreground"
            />
          </div>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2.5 rounded-xl border border-border bg-white text-sm outline-none cursor-pointer">
            <option value="all">All Status</option>
            <option value="shortlisted">Shortlisted</option>
            <option value="selected">Selected</option>
            <option value="pending">Pending</option>
            <option value="rejected">Rejected</option>
          </select>
          <div className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl border border-border bg-white text-sm">
            <SortAsc className="w-4 h-4 text-muted-foreground" />
            <select value={sortBy} onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
              className="bg-transparent outline-none cursor-pointer text-sm">
              <option value="ats">Sort by ATS</option>
              <option value="cgpa">Sort by CGPA</option>
              <option value="match">Sort by Match</option>
            </select>
          </div>
          <button className="px-4 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 transition-colors">
            <Download className="w-4 h-4 inline mr-1.5" /> Export List
          </button>
        </div>

        {/* Candidate table */}
        <div className="i-card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="text-left py-3.5 px-5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Candidate</th>
                <th className="text-center py-3.5 px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">CGPA</th>
                <th className="text-center py-3.5 px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">ATS</th>
                <th className="text-center py-3.5 px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Match</th>
                <th className="text-left py-3.5 px-5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Skills</th>
                <th className="text-center py-3.5 px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Round</th>
                <th className="text-center py-3.5 px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Status</th>
                <th className="text-center py-3.5 px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c) => {
                const sc = statusColors[c.status];
                return (
                  <tr key={c.id} className="border-b border-border/50 table-row-hover">
                    <td className="py-3 px-5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-100 to-violet-100 flex items-center justify-center text-[10px] font-bold text-indigo-700">
                          {getInitials(c.name)}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-foreground">{c.name}</p>
                          <p className="text-[10px] text-muted-foreground">{c.usn} · {c.dept}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-3 text-center"><span className="text-sm font-semibold text-foreground">{c.cgpa}</span></td>
                    <td className="py-3 px-3 text-center">
                      <span className={cn(
                        "text-xs font-semibold px-2 py-0.5 rounded-full",
                        c.atsScore >= 80 ? "bg-emerald-50 text-emerald-600" :
                        c.atsScore >= 65 ? "bg-blue-50 text-blue-600" : "bg-amber-50 text-amber-600"
                      )}>{c.atsScore}%</span>
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span className="text-xs text-muted-foreground">{c.matchScore}%</span>
                    </td>
                    <td className="py-3 px-5">
                      <div className="flex flex-wrap gap-1">
                        {c.skills.slice(0, 3).map((s) => (
                          <span key={s} className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">{s}</span>
                        ))}
                      </div>
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span className="text-xs font-medium">{c.round > 0 ? `R${c.round}` : "—"}</span>
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span className={cn("text-[10px] font-semibold px-2.5 py-1 rounded-full capitalize", sc.bg, sc.text)}>
                        {c.status}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button className="p-1.5 rounded-lg hover:bg-muted transition-colors" title="View Profile"><Eye className="w-3.5 h-3.5 text-muted-foreground" /></button>
                        <button className="p-1.5 rounded-lg hover:bg-muted transition-colors" title="View CV"><FileText className="w-3.5 h-3.5 text-muted-foreground" /></button>
                        {c.status !== "rejected" && c.status !== "selected" && (
                          <>
                            <button className="p-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 transition-colors" title="Shortlist"><ThumbsUp className="w-3.5 h-3.5 text-emerald-600" /></button>
                            <button className="p-1.5 rounded-lg bg-red-50 hover:bg-red-100 transition-colors" title="Reject"><ThumbsDown className="w-3.5 h-3.5 text-red-600" /></button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
