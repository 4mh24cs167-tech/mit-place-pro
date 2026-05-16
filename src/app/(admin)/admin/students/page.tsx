"use client";

import Header from "@/components/layout/Header";
import { MOCK_STUDENTS } from "@/constants";
import { getStatusConfig, cn, getInitials } from "@/lib/utils";
import {
  Search,
  Filter,
  Download,
  Upload,
  ChevronDown,
  ArrowUpDown,
  Eye,
  MoreHorizontal,
  UserPlus,
} from "lucide-react";
import { useState } from "react";

export default function AdminStudentsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [deptFilter, setDeptFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const filtered = MOCK_STUDENTS.filter((s) => {
    const matchSearch = s.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.usn.toLowerCase().includes(searchQuery.toLowerCase());
    const matchDept = deptFilter === "all" || s.department === deptFilter;
    const matchStatus = statusFilter === "all" || s.placementStatus === statusFilter;
    return matchSearch && matchDept && matchStatus;
  });

  return (
    <div className="page-enter">
      <Header
        userName="Dr. Placement Head"
        userRole="Admin"
        greeting="Students"
        subtitle={`${MOCK_STUDENTS.length} students registered this season`}
      />

      <div className="px-8 pb-10 space-y-6">
        {/* Action Bar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3 flex-1 w-full sm:w-auto">
            <div className="flex items-center flex-1 max-w-md bg-white rounded-xl border border-border px-3">
              <Search className="w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search by name, USN..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 bg-transparent px-3 py-2.5 text-sm outline-none text-foreground placeholder:text-muted-foreground"
              />
            </div>

            <select
              value={deptFilter}
              onChange={(e) => setDeptFilter(e.target.value)}
              className="px-3 py-2.5 rounded-xl border border-border bg-white text-sm text-foreground outline-none cursor-pointer"
            >
              <option value="all">All Departments</option>
              <option value="CSE">CSE</option>
              <option value="ISE">ISE</option>
              <option value="ECE">ECE</option>
              <option value="EEE">EEE</option>
              <option value="MECH">MECH</option>
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2.5 rounded-xl border border-border bg-white text-sm text-foreground outline-none cursor-pointer"
            >
              <option value="all">All Status</option>
              <option value="none">Not Started</option>
              <option value="shortlisted">Shortlisted</option>
              <option value="interview_scheduled">Interview Scheduled</option>
              <option value="offered">Offered</option>
              <option value="placed">Placed</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-border bg-white text-sm font-medium text-foreground hover:bg-muted/50 transition-colors">
              <Download className="w-4 h-4" />
              Export
            </button>
            <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white text-sm font-semibold shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/30 transition-all">
              <Upload className="w-4 h-4" />
              Upload Excel
            </button>
          </div>
        </div>

        {/* Student Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((student) => {
            const statusCfg = getStatusConfig(student.placementStatus);
            const completionPct = student.profileComplete ? 100 : 35;

            return (
              <div
                key={student.id}
                className="i-card p-5 cursor-pointer group"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-100 to-violet-100 flex items-center justify-center text-sm font-bold text-indigo-700">
                      {getInitials(student.fullName)}
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
                        {student.fullName}
                      </h4>
                      <p className="text-[11px] text-muted-foreground">{student.usn}</p>
                    </div>
                  </div>
                  <span className={cn("text-[10px] font-semibold px-2.5 py-1 rounded-full", statusCfg.bg, statusCfg.color)}>
                    {statusCfg.label}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-3 mb-4">
                  <div className="text-center p-2 rounded-lg bg-muted/40">
                    <p className="text-lg font-bold text-foreground">{student.cgpa}</p>
                    <p className="text-[10px] text-muted-foreground uppercase">CGPA</p>
                  </div>
                  <div className="text-center p-2 rounded-lg bg-muted/40">
                    <p className="text-lg font-bold text-foreground">{student.tenthPercent}%</p>
                    <p className="text-[10px] text-muted-foreground uppercase">10th</p>
                  </div>
                  <div className="text-center p-2 rounded-lg bg-muted/40">
                    <p className="text-lg font-bold text-foreground">{student.twelfthPercent}%</p>
                    <p className="text-[10px] text-muted-foreground uppercase">12th</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 mb-3">
                  <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">{student.department}</span>
                  <span className="text-muted-foreground">·</span>
                  <span className="text-[10px] text-muted-foreground">Sem {student.semester}</span>
                  {student.backlogs > 0 && (
                    <>
                      <span className="text-muted-foreground">·</span>
                      <span className="text-[10px] text-red-500 font-medium">{student.backlogs} Backlog</span>
                    </>
                  )}
                </div>

                {/* Skills */}
                <div className="flex flex-wrap gap-1.5 mb-4">
                  {(student.profileData.skills || []).slice(0, 4).map((skill) => (
                    <span key={skill} className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-600 font-medium">
                      {skill}
                    </span>
                  ))}
                  {(student.profileData.skills || []).length > 4 && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                      +{(student.profileData.skills || []).length - 4}
                    </span>
                  )}
                </div>

                {/* Profile completion */}
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
                    <div
                      className={cn(
                        "h-full rounded-full progress-fill",
                        completionPct === 100 ? "bg-emerald-500" : "bg-amber-500"
                      )}
                      style={{ width: `${completionPct}%` }}
                    />
                  </div>
                  <span className="text-[10px] font-medium text-muted-foreground">{completionPct}%</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between pt-4">
          <p className="text-sm text-muted-foreground">
            Showing {filtered.length} of {MOCK_STUDENTS.length} students
          </p>
          <div className="flex items-center gap-1">
            {[1, 2, 3, "...", 12].map((page, i) => (
              <button
                key={i}
                className={cn(
                  "w-9 h-9 rounded-lg text-sm font-medium transition-colors",
                  page === 1
                    ? "bg-primary text-white"
                    : "text-muted-foreground hover:bg-muted"
                )}
              >
                {page}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
