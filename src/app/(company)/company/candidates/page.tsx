"use client";

import Header from "@/components/layout/Header";
import { cn, getInitials } from "@/lib/utils";
import { companyApi } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import {
  Search,
  Download,
  Eye,
  FileText,
  ThumbsUp,
  ThumbsDown,
  SortAsc,
  Loader2,
  Users,
  CalendarDays,
  Clock,
  MapPin,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { useState, useEffect, useCallback } from "react";

interface Candidate {
  applicationId: string;
  studentName: string;
  usn: string;
  department: string;
  batchName?: string | null;
  semester?: number;
  cgpa: number | null;
  matchScore: number;
  atsScore: number | null;
  currentRound: number;
  finalResult: string;
}

const statusColors: Record<string, { bg: string; text: string }> = {
  shortlisted: { bg: "bg-indigo-50", text: "text-indigo-600" },
  selected: { bg: "bg-emerald-50", text: "text-emerald-600" },
  pending: { bg: "bg-amber-50", text: "text-amber-600" },
  rejected: { bg: "bg-red-50", text: "text-red-600" },
};

export default function CompanyCandidatesPage() {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState<"ats" | "cgpa" | "match">("ats");
  const [loading, setLoading] = useState(true);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [jobs, setJobs] = useState<Array<{ id: string; title: string }>>([]);
  const [selectedJobId, setSelectedJobId] = useState<string>("");
  const [driveSlots, setDriveSlots] = useState<Array<{ timeSlot: string; classroom: string | null; departments: string[]; studentCount: number }>>([]);
  const [showSchedule, setShowSchedule] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [toast, setToast] = useState<{ type: "success" | "error"; msg: string } | null>(null);

  const showToast = (type: "success" | "error", msg: string) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 3000);
  };

  const handleMarkResult = async (applicationId: string, result: "selected" | "rejected") => {
    setActionLoading(applicationId);
    try {
      await companyApi.markRoundResult(applicationId, result);
      setCandidates((prev) =>
        prev.map((c) => c.applicationId === applicationId ? { ...c, finalResult: result } : c)
      );
      showToast("success", `Candidate ${result === "selected" ? "shortlisted" : "rejected"} successfully`);
    } catch {
      showToast("error", "Action failed. Please try again.");
    } finally {
      setActionLoading(null);
    }
  };

  const handleExport = () => {
    if (filtered.length === 0) { showToast("error", "No candidates to export"); return; }
    const headers = ["Name", "USN", "Batch", "Department", "Semester", "CGPA", "ATS Score", "Match Score", "Round", "Status"];
    const rows = filtered.map((c) => [
      c.studentName || "", c.usn || "", c.batchName || "", c.department || "",
      String(c.semester ?? ""), String(c.cgpa ?? ""), String(c.atsScore ?? ""), String(c.matchScore),
      String(c.currentRound), c.finalResult || "pending",
    ]);
    const csv = [headers.join(","), ...rows.map((r) => r.map((v) => `"${v}"`).join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `candidates_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click(); URL.revokeObjectURL(url);
    showToast("success", "Exported to CSV");
  };

  const fetchJobs = useCallback(async () => {
    try {
      const res = await companyApi.listJobs();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const data = (res as any)?.data;
      if (Array.isArray(data) && data.length > 0) {
        setJobs(data.map((j: { id: string; title: string }) => ({ id: j.id, title: j.title })));
        setSelectedJobId(data[0].id);
      }
    } catch {
      // silently handle
    }
  }, []);

  const fetchCandidates = useCallback(async () => {
    if (!selectedJobId) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const res = await companyApi.getCandidates(selectedJobId);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const data = (res as any)?.data;
      if (Array.isArray(data)) {
        setCandidates(data);
      }
    } catch {
      // silently handle
    } finally {
      setLoading(false);
    }
  }, [selectedJobId]);

  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  useEffect(() => {
    fetchCandidates();
  }, [fetchCandidates]);

  // Fetch drive slots for schedule banner
  useEffect(() => {
    (async () => {
      try {
        const res = await companyApi.getDrives();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const data = (res as any)?.data;
        if (Array.isArray(data)) {
          // Flatten all slots across drives
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const allSlots = data.flatMap((d: any) => d.slots || []);
          setDriveSlots(allSlots);
        }
      } catch {
        // non-critical
      }
    })();
  }, []);

  const filtered = candidates
    .filter((c) => {
      const matchSearch =
        (c.studentName || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        (c.usn || "").toLowerCase().includes(searchQuery.toLowerCase());
      const matchStatus =
        statusFilter === "all" || c.finalResult === statusFilter;
      return matchSearch && matchStatus;
    })
    .sort((a, b) => {
      if (sortBy === "ats") return (b.atsScore || 0) - (a.atsScore || 0);
      if (sortBy === "cgpa") return (b.cgpa || 0) - (a.cgpa || 0);
      return (b.matchScore || 0) - (a.matchScore || 0);
    });

  const shortlistedCount = candidates.filter(
    (c) => c.finalResult !== "rejected" && c.finalResult !== "selected"
  ).length;

  return (
    <div className="page-enter">
      <Header
        userName={user?.email?.split("@")[0] || "HR"}
        userRole="Company"
        greeting="Candidates"
        subtitle={`${candidates.length} total candidates · ${shortlistedCount} in pipeline`}
      />

      <div className="px-4 sm:px-6 md:px-8 pb-10 space-y-4 sm:space-y-6">
        {/* Job selector */}
        {jobs.length > 1 && (
          <div className="flex items-center gap-3">
            <label className="text-sm font-medium text-foreground">Job:</label>
            <select
              value={selectedJobId}
              onChange={(e) => setSelectedJobId(e.target.value)}
              className="px-3 py-2 rounded-xl border border-border bg-white text-sm outline-none cursor-pointer flex-1 sm:flex-none"
            >
              {jobs.map((j) => (
                <option key={j.id} value={j.id}>
                  {j.title}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Drive Schedule Banner */}
        {driveSlots.length > 0 && (
          <div className="i-card overflow-hidden">
            <button
              onClick={() => setShowSchedule(!showSchedule)}
              className="w-full flex items-center justify-between p-4 hover:bg-muted/20 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center">
                  <CalendarDays className="w-4.5 h-4.5 text-blue-600" />
                </div>
                <div className="text-left">
                  <p className="text-sm font-semibold text-foreground">Drive Schedule</p>
                  <p className="text-[10px] text-muted-foreground">
                    {driveSlots.length} slot{driveSlots.length !== 1 ? "s" : ""} · {driveSlots.reduce((s, sl) => s + sl.studentCount, 0)} students allocated
                  </p>
                </div>
              </div>
              {showSchedule ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
            </button>
            {showSchedule && (
              <div className="border-t border-border/50 p-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                  {driveSlots.map((slot, idx) => (
                    <div key={idx} className="flex items-center gap-3 p-3 rounded-xl bg-gradient-to-r from-blue-50/60 to-indigo-50/60 border border-blue-100/60">
                      <div className="space-y-1 flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 text-xs font-medium text-foreground">
                          <Clock className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" />
                          {slot.timeSlot}
                        </div>
                        {slot.classroom && (
                          <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                            <MapPin className="w-3 h-3 flex-shrink-0" />
                            {slot.classroom}
                          </div>
                        )}
                        <div className="flex flex-wrap gap-1">
                          {slot.departments.map((d) => (
                            <span key={d} className="text-[9px] font-medium px-1.5 py-0.5 rounded bg-indigo-100 text-indigo-700">{d}</span>
                          ))}
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-sm font-bold text-foreground">{slot.studentCount}</p>
                        <p className="text-[9px] text-muted-foreground">students</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Filters */}
        <div className="space-y-3 sm:space-y-0 sm:flex sm:items-center sm:gap-3 sm:flex-wrap">
          <div className="flex items-center bg-white rounded-xl border border-border px-3 w-full sm:flex-1 sm:max-w-sm">
            <Search className="w-4 h-4 text-muted-foreground flex-shrink-0" />
            <input
              type="text"
              placeholder="Search candidates..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 bg-transparent px-3 py-2.5 text-sm outline-none text-foreground placeholder:text-muted-foreground min-w-0"
            />
          </div>
          <div className="flex items-center gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 rounded-xl border border-border bg-white text-xs sm:text-sm outline-none cursor-pointer"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="selected">Selected</option>
              <option value="rejected">Rejected</option>
            </select>
            <div className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-border bg-white text-xs sm:text-sm">
              <SortAsc className="w-4 h-4 text-muted-foreground" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
                className="bg-transparent outline-none cursor-pointer text-xs sm:text-sm"
              >
                <option value="ats">Sort by ATS</option>
                <option value="cgpa">Sort by CGPA</option>
                <option value="match">Sort by Match</option>
              </select>
            </div>
          </div>
          <button
            onClick={handleExport}
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-indigo-600 text-white text-xs sm:text-sm font-semibold hover:bg-indigo-700 transition-colors text-center"
          >
            <Download className="w-4 h-4 inline mr-1.5" /> Export List
          </button>
        </div>

        {/* Candidate table */}
        <div className="i-card overflow-hidden">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
              <p className="text-sm text-muted-foreground">Loading candidates...</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <Users className="w-10 h-10 text-muted-foreground/40" />
              <p className="text-sm text-muted-foreground">
                {candidates.length === 0
                  ? "No candidates for this job yet"
                  : "No candidates match your filters"}
              </p>
            </div>
          ) : (
            <>
              {/* Desktop table */}
              <div className="hidden md:block">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-muted/30">
                      <th className="text-left py-3.5 px-5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Candidate</th>
                      <th className="text-left py-3.5 px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Batch / Dept</th>
                      <th className="text-center py-3.5 px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">CGPA</th>
                      <th className="text-center py-3.5 px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">ATS</th>
                      <th className="text-center py-3.5 px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Match</th>
                      <th className="text-center py-3.5 px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Round</th>
                      <th className="text-center py-3.5 px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Status</th>
                      <th className="text-center py-3.5 px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((c) => {
                      const sc = statusColors[c.finalResult] || statusColors.pending;
                      return (
                        <tr key={c.applicationId} className="border-b border-border/50 table-row-hover">
                          <td className="py-3 px-5">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-100 to-violet-100 flex items-center justify-center text-[10px] font-bold text-indigo-700">
                                {getInitials(c.studentName || "?")}
                              </div>
                              <div>
                                <p className="text-sm font-medium text-foreground">{c.studentName || "—"}</p>
                                <p className="text-[10px] text-muted-foreground">{c.usn || "—"}</p>
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-3">
                            <div className="flex flex-col gap-1">
                              {c.batchName && (
                                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 w-fit">
                                  {c.batchName}
                                </span>
                              )}
                              <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
                                {c.department || "—"}{c.semester ? ` · Sem ${c.semester}` : ""}
                              </span>
                            </div>
                          </td>
                          <td className="py-3 px-3 text-center"><span className="text-sm font-semibold text-foreground">{c.cgpa ?? "—"}</span></td>
                          <td className="py-3 px-3 text-center">
                            <span className={cn("text-xs font-semibold px-2 py-0.5 rounded-full",
                              (c.atsScore || 0) >= 80 ? "bg-emerald-50 text-emerald-600" :
                                (c.atsScore || 0) >= 65 ? "bg-blue-50 text-blue-600" : "bg-amber-50 text-amber-600"
                            )}>{c.atsScore ?? "—"}%</span>
                          </td>
                          <td className="py-3 px-3 text-center"><span className="text-xs text-muted-foreground">{c.matchScore}%</span></td>
                          <td className="py-3 px-3 text-center"><span className="text-xs font-medium">{c.currentRound > 0 ? `R${c.currentRound}` : "—"}</span></td>
                          <td className="py-3 px-3 text-center">
                            <span className={cn("text-[10px] font-semibold px-2.5 py-1 rounded-full capitalize", sc.bg, sc.text)}>{c.finalResult || "pending"}</span>
                          </td>
                          <td className="py-3 px-3 text-center">
                            <div className="flex items-center justify-center gap-1">
                              <button onClick={() => showToast("success", `Viewing profile: ${c.studentName} (${c.usn})`)} className="p-1.5 rounded-lg hover:bg-muted transition-colors" title="View Profile"><Eye className="w-3.5 h-3.5 text-muted-foreground" /></button>
                              <button onClick={() => showToast("success", "Resume view: coming soon")} className="p-1.5 rounded-lg hover:bg-muted transition-colors" title="View CV"><FileText className="w-3.5 h-3.5 text-muted-foreground" /></button>
                              {c.finalResult !== "rejected" && c.finalResult !== "selected" && (
                                <>
                                  <button
                                    disabled={actionLoading === c.applicationId}
                                    onClick={() => handleMarkResult(c.applicationId, "selected")}
                                    className="p-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 transition-colors disabled:opacity-50"
                                    title="Shortlist"
                                  >
                                    {actionLoading === c.applicationId ? <Loader2 className="w-3.5 h-3.5 text-emerald-600 animate-spin" /> : <ThumbsUp className="w-3.5 h-3.5 text-emerald-600" />}
                                  </button>
                                  <button
                                    disabled={actionLoading === c.applicationId}
                                    onClick={() => handleMarkResult(c.applicationId, "rejected")}
                                    className="p-1.5 rounded-lg bg-red-50 hover:bg-red-100 transition-colors disabled:opacity-50"
                                    title="Reject"
                                  >
                                    <ThumbsDown className="w-3.5 h-3.5 text-red-600" />
                                  </button>
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

              {/* Mobile card list */}
              <div className="md:hidden divide-y divide-border">
                {filtered.map((c) => {
                  const sc = statusColors[c.finalResult] || statusColors.pending;
                  return (
                    <div key={c.applicationId} className="p-4 space-y-3">
                        <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-indigo-100 to-violet-100 flex items-center justify-center text-[10px] font-bold text-indigo-700 flex-shrink-0">
                            {getInitials(c.studentName || "?")}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-foreground">{c.studentName || "—"}</p>
                            <p className="text-[10px] text-muted-foreground">{c.usn || "—"}</p>
                          </div>
                        </div>
                        <span className={cn("text-[10px] font-semibold px-2 py-0.5 rounded-full capitalize flex-shrink-0", sc.bg, sc.text)}>
                          {c.finalResult || "pending"}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 flex-wrap">
                        {c.batchName && (
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                            {c.batchName}
                          </span>
                        )}
                        <span className="text-[10px] font-medium text-muted-foreground uppercase">
                          {c.department || "—"}{c.semester ? ` · Sem ${c.semester}` : ""}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 flex-wrap text-[10px]">
                        <span className="text-muted-foreground">CGPA: <strong className="text-foreground">{c.cgpa ?? "—"}</strong></span>
                        <span className={cn("font-semibold px-2 py-0.5 rounded-full",
                          (c.atsScore || 0) >= 80 ? "bg-emerald-50 text-emerald-600" :
                            (c.atsScore || 0) >= 65 ? "bg-blue-50 text-blue-600" : "bg-amber-50 text-amber-600"
                        )}>ATS: {c.atsScore ?? "—"}%</span>
                        <span className="text-muted-foreground">Match: {c.matchScore}%</span>
                        <span className="text-foreground font-medium">{c.currentRound > 0 ? `Round ${c.currentRound}` : "—"}</span>
                      </div>
                      {c.finalResult !== "rejected" && c.finalResult !== "selected" && (
                        <div className="flex items-center gap-2 pt-1">
                          <button
                            disabled={actionLoading === c.applicationId}
                            onClick={() => handleMarkResult(c.applicationId, "selected")}
                            className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-emerald-50 text-emerald-600 text-xs font-semibold disabled:opacity-50"
                          >
                            {actionLoading === c.applicationId ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ThumbsUp className="w-3.5 h-3.5" />} Shortlist
                          </button>
                          <button
                            disabled={actionLoading === c.applicationId}
                            onClick={() => handleMarkResult(c.applicationId, "rejected")}
                            className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-red-50 text-red-600 text-xs font-semibold disabled:opacity-50"
                          >
                            <ThumbsDown className="w-3.5 h-3.5" /> Reject
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </div>
      {/* Toast */}
      {toast && (
        <div className={cn(
          "fixed bottom-6 right-6 z-50 px-4 py-3 rounded-xl shadow-lg text-sm font-medium animate-in slide-in-from-bottom-4 fade-in duration-300",
          toast.type === "success" ? "bg-emerald-600 text-white" : "bg-red-600 text-white"
        )}>
          {toast.msg}
        </div>
      )}
    </div>
  );
}
