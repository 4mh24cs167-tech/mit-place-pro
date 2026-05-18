"use client";

import Header from "@/components/layout/Header";
import { adminApi } from "@/lib/api";
import { cn, getInitials } from "@/lib/utils";
import {
  Search,
  CheckCircle2,
  XCircle,
  Clock,
  Eye,
  ThumbsUp,
  ThumbsDown,
  Star,
  FileText,
  Loader2,
  Inbox,
} from "lucide-react";
import { useState, useEffect, useCallback } from "react";

interface Application {
  id: string;
  student?: { fullName?: string; usn?: string; department?: string };
  job?: { title?: string; company?: { name?: string } };
  atsScore?: number;
  matchScore?: number;
  approved?: boolean | null;
  currentRound?: number;
  result?: string;
}

export default function AdminApplicationsPage() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [approvalFilter, setApprovalFilter] = useState("all");
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchApplications = useCallback(async () => {
    try {
      setLoading(true);
      const res = await adminApi.listApplications({
        status: approvalFilter !== 'all' ? approvalFilter : undefined,
      });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const data = (res as any)?.data;
      setApplications(Array.isArray(data) ? data : []);
    } catch {
      setApplications([]);
    } finally {
      setLoading(false);
    }
  }, [approvalFilter]);

  useEffect(() => {
    fetchApplications();
  }, [fetchApplications]);

  const handleApprove = async (appId: string, approved: boolean) => {
    try {
      setActionLoading(appId);
      // Use approveShortlist — pass the application's job and student
      const app = applications.find(a => a.id === appId);
      if (app?.job) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const jobId = (app.job as any)?.id || "";
        await adminApi.approveShortlist(jobId, [appId], approved);
      }
      await fetchApplications();
    } catch {
      // silently handle
    } finally {
      setActionLoading(null);
    }
  };

  const filtered = applications.filter((a) => {
    const studentName = a.student?.fullName || "";
    const companyName = a.job?.company?.name || "";
    const usn = a.student?.usn || "";
    const matchSearch = !searchQuery ||
      studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      companyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      usn.toLowerCase().includes(searchQuery.toLowerCase());
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

      <div className="px-4 sm:px-6 md:px-8 pb-10 space-y-4 sm:space-y-6">
        {/* Pending approval banner */}
        {pendingCount > 0 && (
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 p-3 sm:p-4 rounded-xl bg-amber-50 border border-amber-200">
            <Clock className="w-5 h-5 text-amber-600 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-xs sm:text-sm font-medium text-amber-800">{pendingCount} applications awaiting your approval</p>
              <p className="text-[10px] sm:text-xs text-amber-600">Review and approve student-company matches before interview scheduling.</p>
            </div>
            <button
              onClick={() => setApprovalFilter("pending")}
              className="px-3 sm:px-4 py-2 rounded-lg bg-amber-600 text-white text-xs font-semibold hover:bg-amber-700 transition-colors w-full sm:w-auto text-center"
            >
              Review All
            </button>
          </div>
        )}

        {/* Filters */}
        <div className="space-y-3">
          <div className="flex items-center bg-white rounded-xl border border-border px-3 w-full">
            <Search className="w-4 h-4 text-muted-foreground flex-shrink-0" />
            <input
              type="text"
              placeholder="Search by student, company, USN..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 bg-transparent px-3 py-2.5 text-sm outline-none text-foreground placeholder:text-muted-foreground min-w-0"
            />
          </div>
          <select
            value={approvalFilter}
            onChange={(e) => setApprovalFilter(e.target.value)}
            className="px-3 py-2 rounded-xl border border-border bg-white text-xs sm:text-sm text-foreground outline-none cursor-pointer"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending Approval</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>

        {/* Applications Table */}
        {loading ? (
          <div className="i-card p-6">
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="animate-pulse flex items-center gap-4">
                  <div className="w-8 h-8 rounded-lg bg-muted" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-muted rounded w-1/3" />
                    <div className="h-3 bg-muted rounded w-1/4" />
                  </div>
                  <div className="h-4 bg-muted rounded w-16" />
                  <div className="h-4 bg-muted rounded w-20" />
                </div>
              ))}
            </div>
          </div>
        ) : filtered.length === 0 ? (
          <div className="i-card p-12 text-center">
            <Inbox className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
            <h3 className="text-lg font-semibold text-foreground mb-1">No applications yet</h3>
            <p className="text-sm text-muted-foreground">
              Applications will appear here when students apply for jobs
            </p>
          </div>
        ) : (
          <div className="i-card overflow-hidden">
            {/* Desktop table */}
            <div className="hidden md:block overflow-x-auto">
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
                            {getInitials(app.student?.fullName || "?")}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-foreground">{app.student?.fullName || "—"}</p>
                            <p className="text-[10px] text-muted-foreground">{app.student?.usn || "—"} · {app.student?.department || "—"}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-5">
                        <p className="text-sm font-medium text-foreground">{app.job?.company?.name || "—"}</p>
                        <p className="text-[10px] text-muted-foreground">{app.job?.title || "—"}</p>
                      </td>
                      <td className="py-3 px-5 text-center">
                        <span className={cn(
                          "text-xs font-semibold px-2.5 py-1 rounded-full border inline-flex items-center gap-1",
                          (app.atsScore || 0) >= 80 ? "bg-emerald-50 text-emerald-600 border-emerald-200" :
                          (app.atsScore || 0) >= 65 ? "bg-blue-50 text-blue-600 border-blue-200" :
                          (app.atsScore || 0) >= 45 ? "bg-amber-50 text-amber-600 border-amber-200" :
                          "bg-red-50 text-red-600 border-red-200"
                        )}>
                          <Star className="w-3 h-3" />
                          {app.atsScore ?? "—"}%
                        </span>
                      </td>
                      <td className="py-3 px-5 text-center">
                        <span className="text-xs font-medium text-muted-foreground">{app.matchScore ?? "—"}%</span>
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
                          {(app.currentRound || 0) > 0 ? `Round ${app.currentRound}` : "—"}
                        </span>
                      </td>
                      <td className="py-3 px-5 text-center">
                        <div className="flex items-center justify-center gap-1">
                          {app.approved === null && (
                            <>
                              <button
                                onClick={() => handleApprove(app.id, true)}
                                disabled={actionLoading === app.id}
                                className="p-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 transition-colors disabled:opacity-50"
                                title="Approve"
                              >
                                {actionLoading === app.id ? (
                                  <Loader2 className="w-3.5 h-3.5 text-emerald-600 animate-spin" />
                                ) : (
                                  <ThumbsUp className="w-3.5 h-3.5 text-emerald-600" />
                                )}
                              </button>
                              <button
                                onClick={() => handleApprove(app.id, false)}
                                disabled={actionLoading === app.id}
                                className="p-1.5 rounded-lg bg-red-50 hover:bg-red-100 transition-colors disabled:opacity-50"
                                title="Reject"
                              >
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

            {/* Mobile card list */}
            <div className="md:hidden divide-y divide-border">
              {filtered.map((app) => (
                <div key={app.id} className="p-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-indigo-100 to-violet-100 flex items-center justify-center text-[10px] font-bold text-indigo-700 flex-shrink-0">
                        {getInitials(app.student?.fullName || "?")}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">{app.student?.fullName || "—"}</p>
                        <p className="text-[10px] text-muted-foreground">{app.student?.usn || "—"} · {app.student?.department || "—"}</p>
                      </div>
                    </div>
                    {app.approved === null && (
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-50 text-amber-600 flex-shrink-0">Pending</span>
                    )}
                    {app.approved === true && (
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600 flex-shrink-0">Approved</span>
                    )}
                    {app.approved === false && (
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-red-50 text-red-600 flex-shrink-0">Rejected</span>
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    <span className="font-medium text-foreground">{app.job?.company?.name || "—"}</span> · {app.job?.title || "—"}
                  </div>
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className={cn(
                      "text-[10px] font-semibold px-2 py-0.5 rounded-full border inline-flex items-center gap-1",
                      (app.atsScore || 0) >= 80 ? "bg-emerald-50 text-emerald-600 border-emerald-200" :
                      (app.atsScore || 0) >= 65 ? "bg-blue-50 text-blue-600 border-blue-200" :
                      "bg-amber-50 text-amber-600 border-amber-200"
                    )}>
                      <Star className="w-2.5 h-2.5" /> ATS: {app.atsScore ?? "—"}%
                    </span>
                    <span className="text-[10px] text-muted-foreground">Match: {app.matchScore ?? "—"}%</span>
                    <span className="text-[10px] text-foreground font-medium">
                      {(app.currentRound || 0) > 0 ? `Round ${app.currentRound}` : "—"}
                    </span>
                  </div>
                  {app.approved === null && (
                    <div className="flex items-center gap-2 pt-1">
                      <button
                        onClick={() => handleApprove(app.id, true)}
                        disabled={actionLoading === app.id}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-emerald-50 text-emerald-600 text-xs font-semibold hover:bg-emerald-100 transition-colors disabled:opacity-50"
                      >
                        {actionLoading === app.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ThumbsUp className="w-3.5 h-3.5" />}
                        Approve
                      </button>
                      <button
                        onClick={() => handleApprove(app.id, false)}
                        disabled={actionLoading === app.id}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-red-50 text-red-600 text-xs font-semibold hover:bg-red-100 transition-colors disabled:opacity-50"
                      >
                        <ThumbsDown className="w-3.5 h-3.5" />
                        Reject
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
