"use client";

import Header from "@/components/layout/Header";
import { cn, getInitials } from "@/lib/utils";
import {
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  Clock,
  Eye,
  ThumbsUp,
  ThumbsDown,
  ChevronDown,
  Star,
  FileText,
} from "lucide-react";
import { useState } from "react";

const applications = [
  { id: "a1", student: "Arjun Sharma", usn: "4MT21CS001", dept: "CSE", company: "Infosys", role: "Software Engineer", atsScore: 82, matchScore: 78, approved: true, round: 2, result: "pending" },
  { id: "a2", student: "Priya Patel", usn: "4MT21CS002", dept: "CSE", company: "Infosys", role: "Software Engineer", atsScore: 88, matchScore: 85, approved: true, round: 1, result: "selected" },
  { id: "a3", student: "Ananya Iyer", usn: "4MT21CS006", dept: "CSE", company: "TCS", role: "Systems Engineer", atsScore: 91, matchScore: 89, approved: true, round: 3, result: "pending" },
  { id: "a4", student: "Sneha Reddy", usn: "4MT21IS004", dept: "ISE", company: "Wipro", role: "Project Engineer", atsScore: 74, matchScore: 70, approved: null, round: 0, result: "pending" },
  { id: "a5", student: "Rahul Kumar", usn: "4MT21EC003", dept: "ECE", company: "Bosch", role: "Embedded Engineer", atsScore: 62, matchScore: 58, approved: null, round: 0, result: "pending" },
  { id: "a6", student: "Vikram Singh", usn: "4MT21ME005", dept: "MECH", company: "TCS", role: "Systems Engineer", atsScore: 45, matchScore: 40, approved: false, round: 0, result: "rejected" },
  { id: "a7", student: "Arjun Sharma", usn: "4MT21CS001", dept: "CSE", company: "TCS", role: "Systems Engineer", atsScore: 76, matchScore: 72, approved: true, round: 1, result: "selected" },
  { id: "a8", student: "Priya Patel", usn: "4MT21CS002", dept: "CSE", company: "Wipro", role: "Project Engineer", atsScore: 80, matchScore: 77, approved: true, round: 2, result: "pending" },
];

export default function AdminApplicationsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [approvalFilter, setApprovalFilter] = useState("all");

  const filtered = applications.filter((a) => {
    const matchSearch = a.student.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.usn.toLowerCase().includes(searchQuery.toLowerCase());
    const matchApproval = approvalFilter === "all" ||
      (approvalFilter === "pending" && a.approved === null) ||
      (approvalFilter === "approved" && a.approved === true) ||
      (approvalFilter === "rejected" && a.approved === false);
    return matchSearch && matchApproval;
  });

  const pendingCount = applications.filter((a) => a.approved === null).length;

  return (
    <div className="page-enter">
      <Header
        userName="Dr. Placement Head"
        userRole="Admin"
        greeting="Applications"
        subtitle={`${applications.length} total applications · ${pendingCount} pending approval`}
      />

      <div className="px-8 pb-10 space-y-6">
        {/* Pending approval banner */}
        {pendingCount > 0 && (
          <div className="flex items-center gap-3 p-4 rounded-xl bg-amber-50 border border-amber-200">
            <Clock className="w-5 h-5 text-amber-600" />
            <div className="flex-1">
              <p className="text-sm font-medium text-amber-800">{pendingCount} applications awaiting your approval</p>
              <p className="text-xs text-amber-600">Review and approve student-company matches before interview scheduling.</p>
            </div>
            <button className="px-4 py-2 rounded-lg bg-amber-600 text-white text-xs font-semibold hover:bg-amber-700 transition-colors">
              Review All
            </button>
          </div>
        )}

        {/* Filters */}
        <div className="flex items-center gap-3">
          <div className="flex items-center flex-1 max-w-md bg-white rounded-xl border border-border px-3">
            <Search className="w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search by student, company, USN..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 bg-transparent px-3 py-2.5 text-sm outline-none text-foreground placeholder:text-muted-foreground"
            />
          </div>
          <select
            value={approvalFilter}
            onChange={(e) => setApprovalFilter(e.target.value)}
            className="px-3 py-2.5 rounded-xl border border-border bg-white text-sm text-foreground outline-none cursor-pointer"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending Approval</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>

        {/* Applications Table */}
        <div className="glass-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="text-left py-3.5 px-5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Student</th>
                  <th className="text-left py-3.5 px-5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Company / Role</th>
                  <th className="text-center py-3.5 px-5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">ATS Score</th>
                  <th className="text-center py-3.5 px-5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Match</th>
                  <th className="text-center py-3.5 px-5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Approval</th>
                  <th className="text-center py-3.5 px-5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Round</th>
                  <th className="text-center py-3.5 px-5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((app) => (
                  <tr key={app.id} className="border-b border-border/50 table-row-hover">
                    <td className="py-3 px-5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-100 to-violet-100 flex items-center justify-center text-[10px] font-bold text-indigo-700">
                          {getInitials(app.student)}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-foreground">{app.student}</p>
                          <p className="text-[10px] text-muted-foreground">{app.usn} · {app.dept}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-5">
                      <p className="text-sm font-medium text-foreground">{app.company}</p>
                      <p className="text-[10px] text-muted-foreground">{app.role}</p>
                    </td>
                    <td className="py-3 px-5 text-center">
                      <span className={cn(
                        "text-xs font-semibold px-2.5 py-1 rounded-full border inline-flex items-center gap-1",
                        app.atsScore >= 80 ? "bg-emerald-50 text-emerald-600 border-emerald-200" :
                        app.atsScore >= 65 ? "bg-blue-50 text-blue-600 border-blue-200" :
                        app.atsScore >= 45 ? "bg-amber-50 text-amber-600 border-amber-200" :
                        "bg-red-50 text-red-600 border-red-200"
                      )}>
                        <Star className="w-3 h-3" />
                        {app.atsScore}%
                      </span>
                    </td>
                    <td className="py-3 px-5 text-center">
                      <span className="text-xs font-medium text-muted-foreground">{app.matchScore}%</span>
                    </td>
                    <td className="py-3 px-5 text-center">
                      {app.approved === null && (
                        <span className="text-[10px] font-semibold px-2.5 py-1 rounded-full bg-amber-50 text-amber-600">Pending</span>
                      )}
                      {app.approved === true && (
                        <span className="text-[10px] font-semibold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-600 inline-flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> Approved
                        </span>
                      )}
                      {app.approved === false && (
                        <span className="text-[10px] font-semibold px-2.5 py-1 rounded-full bg-red-50 text-red-600 inline-flex items-center gap-1">
                          <XCircle className="w-3 h-3" /> Rejected
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-5 text-center">
                      <span className="text-xs font-medium text-foreground">
                        {app.round > 0 ? `Round ${app.round}` : "—"}
                      </span>
                    </td>
                    <td className="py-3 px-5 text-center">
                      <div className="flex items-center justify-center gap-1">
                        {app.approved === null && (
                          <>
                            <button className="p-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 transition-colors" title="Approve">
                              <ThumbsUp className="w-3.5 h-3.5 text-emerald-600" />
                            </button>
                            <button className="p-1.5 rounded-lg bg-red-50 hover:bg-red-100 transition-colors" title="Reject">
                              <ThumbsDown className="w-3.5 h-3.5 text-red-600" />
                            </button>
                          </>
                        )}
                        <button className="p-1.5 rounded-lg hover:bg-muted transition-colors" title="View Details">
                          <Eye className="w-3.5 h-3.5 text-muted-foreground" />
                        </button>
                        <button className="p-1.5 rounded-lg hover:bg-muted transition-colors" title="View CV">
                          <FileText className="w-3.5 h-3.5 text-muted-foreground" />
                        </button>
                      </div>
                    </td>
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
