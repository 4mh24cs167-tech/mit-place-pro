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
  ChevronRight,
  GraduationCap,
  Building2,
} from "lucide-react";
import { useState, useEffect, useCallback, useMemo } from "react";

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
  const [expandedBatches, setExpandedBatches] = useState<Set<string>>(new Set());
  const [expandedDepts, setExpandedDepts] = useState<Set<string>>(new Set());
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
        const batches = new Set(data.map((c: Candidate) => c.batchName || "Unassigned"));
        setExpandedBatches(batches);
        const depts = new Set(data.map((c: Candidate) => `${c.batchName || "Unassigned"}__${c.department}`));
        setExpandedDepts(depts);
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

  const toggleBatch = (b: string) => setExpandedBatches(prev => { const n = new Set(prev); n.has(b) ? n.delete(b) : n.add(b); return n; });
  const toggleDept = (key: string) => setExpandedDepts(prev => { const n = new Set(prev); n.has(key) ? n.delete(key) : n.add(key); return n; });

  const grouped = useMemo(() => {
    const map: Record<string, Record<string, Candidate[]>> = {};
    filtered.forEach(c => {
      const batch = c.batchName || "Unassigned";
      const dept = c.department || "Unknown";
      if (!map[batch]) map[batch] = {};
      if (!map[batch][dept]) map[batch][dept] = [];
      map[batch][dept].push(c);
    });
    return Object.entries(map).sort(([a], [b]) => b.localeCompare(a));
  }, [filtered]);

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

        {/* Batch → Department Grouped Candidates */}
        {loading ? (
          <div className="space-y-4">
            {[1, 2].map(i => (
              <div key={i} className="i-card p-5">
                <div className="h-6 w-48 bg-muted animate-pulse rounded mb-4" />
                <div className="space-y-2">{[1, 2, 3].map(j => <div key={j} className="h-16 rounded-lg bg-muted animate-pulse" />)}</div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="i-card flex flex-col items-center justify-center py-16 gap-3">
            <Users className="w-10 h-10 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">
              {candidates.length === 0 ? "No candidates for this job yet" : "No candidates match your filters"}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {grouped.map(([batchName, deptMap]) => {
              const batchOpen = expandedBatches.has(batchName);
              const batchCount = Object.values(deptMap).reduce((s, arr) => s + arr.length, 0);
              const deptCount = Object.keys(deptMap).length;
              return (
                <div key={batchName} className="i-card overflow-hidden">
                  <button onClick={() => toggleBatch(batchName)}
                    className="w-full flex items-center justify-between p-4 sm:p-5 hover:bg-muted/20 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center">
                        <GraduationCap className="w-5 h-5 text-white" />
                      </div>
                      <div className="text-left">
                        <h3 className="text-sm sm:text-base font-bold text-foreground">Batch {batchName}</h3>
                        <p className="text-[10px] sm:text-xs text-muted-foreground">{deptCount} dept{deptCount !== 1 ? 's' : ''} · {batchCount} candidate{batchCount !== 1 ? 's' : ''}</p>
                      </div>
                    </div>
                    {batchOpen ? <ChevronDown className="w-5 h-5 text-muted-foreground" /> : <ChevronRight className="w-5 h-5 text-muted-foreground" />}
                  </button>
                  {batchOpen && (
                    <div className="border-t border-border/50">
                      {Object.entries(deptMap).sort(([a], [b]) => a.localeCompare(b)).map(([dept, deptCandidates]) => {
                        const deptKey = `${batchName}__${dept}`;
                        const deptOpen = expandedDepts.has(deptKey);
                        return (
                          <div key={deptKey}>
                            <button onClick={() => toggleDept(deptKey)}
                              className="w-full flex items-center justify-between px-5 sm:px-6 py-3 bg-muted/20 hover:bg-muted/40 transition-colors border-b border-border/30">
                              <div className="flex items-center gap-2.5">
                                <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center">
                                  <Building2 className="w-3.5 h-3.5 text-blue-600" />
                                </div>
                                <span className="text-xs sm:text-sm font-semibold text-foreground">{dept}</span>
                                <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 border border-blue-200">{deptCandidates.length}</span>
                              </div>
                              {deptOpen ? <ChevronDown className="w-4 h-4 text-muted-foreground" /> : <ChevronRight className="w-4 h-4 text-muted-foreground" />}
                            </button>
                            {deptOpen && (
                              <div className="divide-y divide-border/30">
                                {deptCandidates.map(c => {
                                  const sc = statusColors[c.finalResult] || statusColors.pending;
                                  return (
                                    <div key={c.applicationId} className="px-5 sm:px-6 py-3 hover:bg-muted/10 transition-colors">
                                      <div className="flex items-center justify-between gap-3 flex-wrap">
                                        <div className="flex items-center gap-3 min-w-0">
                                          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-100 to-violet-100 flex items-center justify-center text-[10px] font-bold text-indigo-700 flex-shrink-0">
                                            {getInitials(c.studentName || "?")}
                                          </div>
                                          <div className="min-w-0">
                                            <p className="text-sm font-medium text-foreground truncate">{c.studentName || "—"}</p>
                                            <p className="text-[10px] text-muted-foreground">{c.usn || "—"}</p>
                                          </div>
                                        </div>
                                        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
                                          <span className="text-xs font-semibold text-foreground">{c.cgpa ?? "—"} CGPA</span>
                                          <span className={cn("text-[10px] font-semibold px-2 py-0.5 rounded-full",
                                            (c.atsScore || 0) >= 80 ? "bg-emerald-50 text-emerald-600" :
                                              (c.atsScore || 0) >= 65 ? "bg-blue-50 text-blue-600" : "bg-amber-50 text-amber-600"
                                          )}>ATS {c.atsScore ?? "—"}%</span>
                                          <span className="text-[10px] text-muted-foreground">Match {c.matchScore}%</span>
                                          {c.currentRound > 0 && <span className="text-[10px] font-medium">R{c.currentRound}</span>}
                                          <span className={cn("text-[10px] font-semibold px-2 py-0.5 rounded-full capitalize", sc.bg, sc.text)}>{c.finalResult || "pending"}</span>
                                          <div className="flex items-center gap-1">
                                            <button onClick={() => showToast("success", `Viewing: ${c.studentName}`)} className="p-1 rounded hover:bg-muted" title="View"><Eye className="w-3.5 h-3.5 text-muted-foreground" /></button>
                                            <button onClick={() => showToast("success", "Resume: coming soon")} className="p-1 rounded hover:bg-muted" title="CV"><FileText className="w-3.5 h-3.5 text-muted-foreground" /></button>
                                            {c.finalResult !== "rejected" && c.finalResult !== "selected" && (
                                              <>
                                                <button disabled={actionLoading === c.applicationId} onClick={() => handleMarkResult(c.applicationId, "selected")}
                                                  className="p-1 rounded bg-emerald-50 hover:bg-emerald-100 disabled:opacity-50" title="Shortlist">
                                                  {actionLoading === c.applicationId ? <Loader2 className="w-3.5 h-3.5 text-emerald-600 animate-spin" /> : <ThumbsUp className="w-3.5 h-3.5 text-emerald-600" />}
                                                </button>
                                                <button disabled={actionLoading === c.applicationId} onClick={() => handleMarkResult(c.applicationId, "rejected")}
                                                  className="p-1 rounded bg-red-50 hover:bg-red-100 disabled:opacity-50" title="Reject">
                                                  <ThumbsDown className="w-3.5 h-3.5 text-red-600" />
                                                </button>
                                              </>
                                            )}
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
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
