"use client";

import Header from "@/components/layout/Header";
import { cn, getInitials } from "@/lib/utils";
import { companyApi } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import {
  Search, Download, Eye, FileText, SortAsc, Loader2, Users,
  CalendarDays, Clock, MapPin, ChevronDown, ChevronUp, ChevronRight,
  GraduationCap, Building2, CheckSquare, Square, AlertTriangle, Send,
  X, Phone, Mail, ExternalLink, Globe, Award, Code, Link2,
} from "lucide-react";
import { useState, useEffect, useCallback, useMemo } from "react";

interface Candidate {
  applicationId: string;
  studentId: string;
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
  // Enhanced profile fields
  phone?: string | null;
  email?: string | null;
  gender?: string | null;
  tenthPercent?: number | null;
  twelfthPercent?: number | null;
  backlogs?: number;
  resumeLink?: string | null;
  driveLink?: string | null;
  skills?: string[];
  certifications?: string[];
  linkedin?: string | null;
  github?: string | null;
  aboutMe?: string | null;
  profileComplete?: boolean;
}

interface StudentProfileData {
  id: string;
  fullName: string;
  usn: string;
  department: string;
  batchName?: string | null;
  semester?: number | null;
  cgpa?: number | null;
  email?: string | null;
  phone?: string | null;
  gender?: string | null;
  dateOfBirth?: string | null;
  tenthPercent?: number | null;
  tenthBoard?: string | null;
  tenthYear?: number | null;
  twelfthPercent?: number | null;
  twelfthBoard?: string | null;
  twelfthYear?: number | null;
  twelfthStream?: string | null;
  backlogs?: number;
  resumeLink?: string | null;
  driveLink?: string | null;
  familyIncome?: number | null;
  category?: string | null;
  profileComplete?: boolean;
  placementStatus?: string;
  skills?: string[];
  certifications?: string[];
  linkedin?: string | null;
  github?: string | null;
  aboutMe?: string | null;
  tenthMarksCardLink?: string | null;
  twelfthMarksCardLink?: string | null;
  qualificationType?: string;
  diplomaBranch?: string | null;
}

interface JobInfo {
  id: string;
  title: string;
  numRounds: number;
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
  const [jobs, setJobs] = useState<JobInfo[]>([]);
  const [selectedJobId, setSelectedJobId] = useState<string>("");
  const [driveSlots, setDriveSlots] = useState<Array<{ timeSlot: string; classroom: string | null; departments: string[]; studentCount: number }>>([]);
  const [showSchedule, setShowSchedule] = useState(false);
  const [expandedBatches, setExpandedBatches] = useState<Set<string>>(new Set());
  const [expandedDepts, setExpandedDepts] = useState<Set<string>>(new Set());
  const [toast, setToast] = useState<{ type: "success" | "error"; msg: string } | null>(null);

  // ─── Bulk Selection State ──────────────────────
  const [selectedStudentIds, setSelectedStudentIds] = useState<Set<string>>(new Set());
  const [activeRound, setActiveRound] = useState<number>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  // ─── Profile Modal State ───────────────────────
  const [profileModalStudent, setProfileModalStudent] = useState<StudentProfileData | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);

  const openStudentProfile = async (studentId: string) => {
    setProfileLoading(true);
    setProfileModalStudent(null);
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const res = await companyApi.getStudentProfile(studentId) as any;
      if (res?.data) setProfileModalStudent(res.data);
    } catch {
      showToast("error", "Failed to load student profile");
    } finally {
      setProfileLoading(false);
    }
  };

  const showToast = (type: "success" | "error", msg: string) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 4000);
  };

  const selectedJob = useMemo(() => jobs.find(j => j.id === selectedJobId), [jobs, selectedJobId]);

  // ─── Checkbox Helpers ──────────────────────────
  const toggleStudent = (studentId: string) => {
    setSelectedStudentIds(prev => {
      const next = new Set(prev);
      next.has(studentId) ? next.delete(studentId) : next.add(studentId);
      return next;
    });
  };

  const roundCandidates = useMemo(() =>
    candidates.filter(c => c.currentRound === activeRound && c.finalResult === "pending"),
    [candidates, activeRound]
  );

  const toggleDeptAll = (dept: string, select: boolean) => {
    setSelectedStudentIds(prev => {
      const next = new Set(prev);
      roundCandidates.filter(c => c.department === dept).forEach(c => {
        select ? next.add(c.studentId) : next.delete(c.studentId);
      });
      return next;
    });
  };

  const isDeptAllSelected = (dept: string) => {
    const deptCandidates = roundCandidates.filter(c => c.department === dept);
    return deptCandidates.length > 0 && deptCandidates.every(c => selectedStudentIds.has(c.studentId));
  };

  // ─── Submit Round Results ──────────────────────
  const handleSubmitResults = async () => {
    if (!selectedJobId) return;
    setIsSubmitting(true);
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const res = await companyApi.submitRoundResults(selectedJobId, activeRound, Array.from(selectedStudentIds)) as any;
      const data = res?.data;
      showToast("success",
        `Round ${activeRound} results submitted! ${data?.selected || 0} selected, ${data?.rejected || 0} rejected. Emails sent.`
      );
      setSelectedStudentIds(new Set());
      setShowConfirmModal(false);
      fetchCandidates();
    } catch (err) {
      showToast("error", err instanceof Error ? err.message : "Failed to submit results");
    } finally {
      setIsSubmitting(false);
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
        setJobs(data.map((j: JobInfo) => ({ id: j.id, title: j.title, numRounds: j.numRounds || 3 })));
        setSelectedJobId(data[0].id);
      }
    } catch {
      // silently handle
    }
  }, []);

  const fetchCandidates = useCallback(async () => {
    if (!selectedJobId) { setLoading(false); return; }
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
        // Detect active round
        const rounds = data.filter((c: Candidate) => c.finalResult === "pending").map((c: Candidate) => c.currentRound);
        if (rounds.length > 0) setActiveRound(Math.min(...rounds));
      }
    } catch {
      // silently handle
    } finally {
      setLoading(false);
    }
  }, [selectedJobId]);

  useEffect(() => { fetchJobs(); }, [fetchJobs]);
  useEffect(() => { fetchCandidates(); }, [fetchCandidates]);

  // Fetch drive slots for schedule banner
  useEffect(() => {
    (async () => {
      try {
        const res = await companyApi.getDrives();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const data = (res as any)?.data;
        if (Array.isArray(data)) {
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
      const matchStatus = statusFilter === "all" || c.finalResult === statusFilter;
      return matchSearch && matchStatus;
    })
    .sort((a, b) => {
      if (sortBy === "ats") return (b.atsScore || 0) - (a.atsScore || 0);
      if (sortBy === "cgpa") return (b.cgpa || 0) - (a.cgpa || 0);
      return (b.matchScore || 0) - (a.matchScore || 0);
    });

  const pipelineCount = candidates.filter(c => c.finalResult !== "rejected" && c.finalResult !== "selected").length;

  const toggleBatch = (b: string) => setExpandedBatches(prev => { const n = new Set(prev); n.has(b) ? n.delete(b) : n.add(b); return n; });
  const toggleDeptExpand = (key: string) => setExpandedDepts(prev => { const n = new Set(prev); n.has(key) ? n.delete(key) : n.add(key); return n; });

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

  // Departments with pending candidates in active round
  const roundDepts = useMemo(() => {
    const map: Record<string, number> = {};
    roundCandidates.forEach(c => { map[c.department] = (map[c.department] || 0) + 1; });
    return Object.entries(map).sort(([a], [b]) => a.localeCompare(b));
  }, [roundCandidates]);

  const rejectedCount = roundCandidates.length - selectedStudentIds.size;

  return (
    <div className="page-enter">
      <Header
        userName={user?.email?.split("@")[0] || "HR"}
        userRole="Company"
        greeting="Candidates"
        subtitle={`${candidates.length} total candidates · ${pipelineCount} in pipeline`}
      />

      <div className="px-4 sm:px-6 md:px-8 pb-10 space-y-4 sm:space-y-6">
        {/* Job selector */}
        {jobs.length > 1 && (
          <div className="flex items-center gap-3">
            <label className="text-sm font-medium text-foreground">Job:</label>
            <select
              value={selectedJobId}
              onChange={(e) => { setSelectedJobId(e.target.value); setSelectedStudentIds(new Set()); }}
              className="px-3 py-2 rounded-xl border border-border bg-white text-sm outline-none cursor-pointer flex-1 sm:flex-none"
            >
              {jobs.map((j) => <option key={j.id} value={j.id}>{j.title}</option>)}
            </select>
          </div>
        )}

        {/* ═══════════════════════════════════════════════
            ROUND RESULTS PANEL — Bulk Selection
        ═══════════════════════════════════════════════ */}
        {selectedJob && roundCandidates.length > 0 && (
          <div className="i-card overflow-hidden border-2 border-indigo-200">
            <div className="bg-gradient-to-r from-indigo-50 to-violet-50 p-5">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                    <Send className="w-4 h-4 text-indigo-600" />
                    Submit Round Results
                  </h3>
                  <p className="text-xs text-muted-foreground mt-1">
                    Select students who cleared the round. Unselected students will be <strong className="text-red-600">automatically rejected</strong>.
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <label className="text-xs font-semibold text-muted-foreground uppercase">Round</label>
                  <select
                    value={activeRound}
                    onChange={(e) => { setActiveRound(Number(e.target.value)); setSelectedStudentIds(new Set()); }}
                    className="px-3 py-2 rounded-xl border border-indigo-200 bg-white text-sm font-semibold outline-none cursor-pointer"
                  >
                    {Array.from({ length: selectedJob.numRounds }, (_, i) => i + 1).map(r => (
                      <option key={r} value={r}>Round {r}{r === selectedJob.numRounds ? " (Final)" : ""}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Department quick-select chips */}
              <div className="mt-4 flex flex-wrap gap-2">
                {roundDepts.map(([dept, count]) => {
                  const allSelected = isDeptAllSelected(dept);
                  const selectedInDept = roundCandidates.filter(c => c.department === dept && selectedStudentIds.has(c.studentId)).length;
                  return (
                    <button
                      key={dept}
                      onClick={() => toggleDeptAll(dept, !allSelected)}
                      className={cn(
                        "flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold border transition-all",
                        allSelected
                          ? "bg-emerald-600 border-emerald-600 text-white"
                          : selectedInDept > 0
                            ? "bg-emerald-50 border-emerald-300 text-emerald-700"
                            : "bg-white border-border text-foreground hover:border-indigo-300"
                      )}
                    >
                      {allSelected ? <CheckSquare className="w-3.5 h-3.5" /> : <Square className="w-3.5 h-3.5" />}
                      {dept}
                      <span className={cn(
                        "px-1.5 py-0.5 rounded-md text-[10px]",
                        allSelected ? "bg-emerald-700" : "bg-muted"
                      )}>
                        {selectedInDept}/{count}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Summary + Submit */}
              <div className="mt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-indigo-200/60">
                <div className="flex items-center gap-4 text-sm">
                  <span className="font-semibold text-emerald-600">
                    ✅ {selectedStudentIds.size} selected
                  </span>
                  <span className="font-semibold text-red-500">
                    ❌ {rejectedCount} will be rejected
                  </span>
                  <span className="text-muted-foreground">
                    / {roundCandidates.length} total
                  </span>
                </div>
                <button
                  onClick={() => setShowConfirmModal(true)}
                  disabled={roundCandidates.length === 0}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white text-sm font-semibold shadow-lg shadow-indigo-500/20 disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-xl transition-all"
                >
                  Submit Round {activeRound} Results
                </button>
              </div>
            </div>
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
                            <button onClick={() => toggleDeptExpand(deptKey)}
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
                                  const isInActiveRound = c.currentRound === activeRound && c.finalResult === "pending";
                                  const isChecked = selectedStudentIds.has(c.studentId);
                                  return (
                                    <div
                                      key={c.applicationId}
                                      onClick={() => { if (isInActiveRound) toggleStudent(c.studentId); }}
                                      className={cn(
                                        "px-5 sm:px-6 py-3 transition-colors",
                                        isInActiveRound ? "cursor-pointer" : "",
                                        isInActiveRound && isChecked ? "bg-emerald-50/60 hover:bg-emerald-50" : "hover:bg-muted/10"
                                      )}
                                    >
                                      <div className="flex items-center justify-between gap-3 flex-wrap">
                                        <div className="flex items-center gap-3 min-w-0">
                                          {/* Checkbox for active round candidates */}
                                          {isInActiveRound ? (
                                            <button
                                              onClick={(e) => { e.stopPropagation(); toggleStudent(c.studentId); }}
                                              className="flex-shrink-0"
                                            >
                                              {isChecked
                                                ? <CheckSquare className="w-5 h-5 text-emerald-600" />
                                                : <Square className="w-5 h-5 text-muted-foreground" />
                                              }
                                            </button>
                                          ) : (
                                            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-100 to-violet-100 flex items-center justify-center text-[10px] font-bold text-indigo-700 flex-shrink-0">
                                              {getInitials(c.studentName || "?")}
                                            </div>
                                          )}
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
                                            <button onClick={(e) => { e.stopPropagation(); openStudentProfile(c.studentId); }} className="p-1 rounded hover:bg-indigo-50 transition-colors" title="View Profile"><Eye className="w-3.5 h-3.5 text-indigo-500 hover:text-indigo-700" /></button>
                                            {(c.resumeLink || c.driveLink) ? (
                                              <a href={c.resumeLink || c.driveLink || "#"} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} className="p-1 rounded hover:bg-violet-50 transition-colors" title="View Resume">
                                                <FileText className="w-3.5 h-3.5 text-violet-500 hover:text-violet-700" />
                                              </a>
                                            ) : (
                                              <button onClick={(e) => { e.stopPropagation(); showToast("error", "No resume uploaded yet"); }} className="p-1 rounded hover:bg-muted" title="No Resume"><FileText className="w-3.5 h-3.5 text-muted-foreground/40" /></button>
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

      {/* ═══ Confirmation Modal ═══ */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl p-6 space-y-5">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-amber-50 flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-amber-500" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-foreground">Confirm Round {activeRound} Results</h3>
                <p className="text-xs text-muted-foreground">This action cannot be undone</p>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 rounded-xl bg-emerald-50 border border-emerald-200">
                <span className="text-sm font-medium text-emerald-700">Students Selected</span>
                <span className="text-lg font-bold text-emerald-700">{selectedStudentIds.size}</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-xl bg-red-50 border border-red-200">
                <span className="text-sm font-medium text-red-700">Will Be Rejected</span>
                <span className="text-lg font-bold text-red-700">{rejectedCount}</span>
              </div>
              <p className="text-xs text-muted-foreground">
                {activeRound >= (selectedJob?.numRounds || 3)
                  ? "⚠️ This is the FINAL round. Selected students will be marked as PLACED."
                  : `Selected students will advance to Round ${activeRound + 1}. All others will receive rejection emails.`
                }
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowConfirmModal(false)}
                className="flex-1 px-4 py-3 rounded-xl border border-border text-sm font-medium hover:bg-muted/50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitResults}
                disabled={isSubmitting}
                className="flex-1 px-4 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white text-sm font-semibold shadow-lg disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                {isSubmitting ? "Submitting..." : "Confirm & Send Emails"}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* ═══ Student Profile Modal ═══ */}
      {(profileModalStudent || profileLoading) && (
        <div className="fixed inset-0 z-50 flex items-start justify-end bg-black/40" onClick={() => { setProfileModalStudent(null); setProfileLoading(false); }}>
          <div
            className="bg-white w-full max-w-lg h-full overflow-y-auto shadow-2xl animate-in slide-in-from-right duration-300"
            onClick={(e) => e.stopPropagation()}
          >
            {profileLoading && !profileModalStudent ? (
              <div className="flex flex-col items-center justify-center h-64 gap-3">
                <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
                <p className="text-sm text-muted-foreground">Loading profile...</p>
              </div>
            ) : profileModalStudent ? (
              <>
                {/* Header */}
                <div className="sticky top-0 z-10 bg-gradient-to-r from-indigo-600 to-violet-600 p-5 text-white">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-14 h-14 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center text-lg font-bold">
                        {getInitials(profileModalStudent.fullName)}
                      </div>
                      <div>
                        <h2 className="text-lg font-bold">{profileModalStudent.fullName}</h2>
                        <p className="text-sm text-white/80">{profileModalStudent.usn}</p>
                        <p className="text-xs text-white/70">{profileModalStudent.department} · Sem {profileModalStudent.semester}</p>
                      </div>
                    </div>
                    <button onClick={() => setProfileModalStudent(null)} className="p-1.5 rounded-lg hover:bg-white/20 transition-colors">
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                <div className="p-5 space-y-5">
                  {/* Quick Stats */}
                  <div className="grid grid-cols-3 gap-3">
                    <div className="p-3 rounded-xl bg-indigo-50 text-center">
                      <p className="text-xl font-bold text-indigo-700">{profileModalStudent.cgpa ?? "—"}</p>
                      <p className="text-[10px] font-semibold text-indigo-500 uppercase">CGPA</p>
                    </div>
                    <div className="p-3 rounded-xl bg-emerald-50 text-center">
                      <p className="text-xl font-bold text-emerald-700">{profileModalStudent.tenthPercent ?? "—"}%</p>
                      <p className="text-[10px] font-semibold text-emerald-500 uppercase">10th</p>
                    </div>
                    <div className="p-3 rounded-xl bg-violet-50 text-center">
                      <p className="text-xl font-bold text-violet-700">{profileModalStudent.twelfthPercent ?? "—"}%</p>
                      <p className="text-[10px] font-semibold text-violet-500 uppercase">
                        {profileModalStudent.qualificationType === "Diploma" ? "Diploma" : "12th"}
                      </p>
                    </div>
                  </div>

                  {/* Contact Info */}
                  <div className="space-y-2">
                    <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Contact</h4>
                    <div className="grid grid-cols-1 gap-2">
                      {profileModalStudent.email && (
                        <div className="flex items-center gap-2.5 p-2.5 rounded-lg bg-muted/30">
                          <Mail className="w-4 h-4 text-blue-500" />
                          <span className="text-sm text-foreground">{profileModalStudent.email}</span>
                        </div>
                      )}
                      {profileModalStudent.phone && (
                        <div className="flex items-center gap-2.5 p-2.5 rounded-lg bg-muted/30">
                          <Phone className="w-4 h-4 text-emerald-500" />
                          <span className="text-sm text-foreground">{profileModalStudent.phone}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* About */}
                  {profileModalStudent.aboutMe && (
                    <div className="space-y-2">
                      <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">About</h4>
                      <p className="text-sm text-foreground leading-relaxed bg-muted/20 p-3 rounded-xl">{profileModalStudent.aboutMe}</p>
                    </div>
                  )}

                  {/* Academic Details */}
                  <div className="space-y-2">
                    <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Academics</h4>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between p-3 rounded-xl bg-muted/20">
                        <div className="flex items-center gap-2">
                          <GraduationCap className="w-4 h-4 text-indigo-500" />
                          <span className="text-sm font-medium">Department</span>
                        </div>
                        <span className="text-sm text-foreground font-semibold">{profileModalStudent.department}</span>
                      </div>
                      {profileModalStudent.batchName && (
                        <div className="flex items-center justify-between p-3 rounded-xl bg-muted/20">
                          <span className="text-sm font-medium text-muted-foreground">Batch</span>
                          <span className="text-sm font-semibold">{profileModalStudent.batchName}</span>
                        </div>
                      )}
                      <div className="flex items-center justify-between p-3 rounded-xl bg-muted/20">
                        <span className="text-sm font-medium text-muted-foreground">Backlogs</span>
                        <span className={cn("text-sm font-semibold", (profileModalStudent.backlogs ?? 0) === 0 ? "text-emerald-600" : "text-red-600")}>
                          {profileModalStudent.backlogs ?? 0}
                        </span>
                      </div>
                      {profileModalStudent.category && (
                        <div className="flex items-center justify-between p-3 rounded-xl bg-muted/20">
                          <span className="text-sm font-medium text-muted-foreground">Category</span>
                          <span className="text-sm font-semibold">{profileModalStudent.category}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Skills */}
                  {profileModalStudent.skills && profileModalStudent.skills.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                        <Code className="w-3.5 h-3.5" /> Skills
                      </h4>
                      <div className="flex flex-wrap gap-1.5">
                        {profileModalStudent.skills.map((s, i) => (
                          <span key={i} className="text-xs font-medium px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100">{s}</span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Certifications */}
                  {profileModalStudent.certifications && profileModalStudent.certifications.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                        <Award className="w-3.5 h-3.5" /> Certifications
                      </h4>
                      <div className="flex flex-wrap gap-1.5">
                        {profileModalStudent.certifications.map((c, i) => (
                          <span key={i} className="text-xs font-medium px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-100">{c}</span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Links */}
                  <div className="space-y-2">
                    <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                      <Link2 className="w-3.5 h-3.5" /> Links & Documents
                    </h4>
                    <div className="space-y-2">
                      {profileModalStudent.resumeLink && (
                        <a href={profileModalStudent.resumeLink} target="_blank" rel="noopener noreferrer"
                          className="flex items-center gap-2.5 p-3 rounded-xl bg-violet-50 border border-violet-100 hover:bg-violet-100 transition-colors">
                          <FileText className="w-4 h-4 text-violet-600" />
                          <span className="text-sm font-medium text-violet-700 flex-1">Resume</span>
                          <ExternalLink className="w-3.5 h-3.5 text-violet-400" />
                        </a>
                      )}
                      {profileModalStudent.driveLink && (
                        <a href={profileModalStudent.driveLink} target="_blank" rel="noopener noreferrer"
                          className="flex items-center gap-2.5 p-3 rounded-xl bg-blue-50 border border-blue-100 hover:bg-blue-100 transition-colors">
                          <Globe className="w-4 h-4 text-blue-600" />
                          <span className="text-sm font-medium text-blue-700 flex-1">Drive Folder</span>
                          <ExternalLink className="w-3.5 h-3.5 text-blue-400" />
                        </a>
                      )}
                      {profileModalStudent.tenthMarksCardLink && (
                        <a href={profileModalStudent.tenthMarksCardLink} target="_blank" rel="noopener noreferrer"
                          className="flex items-center gap-2.5 p-3 rounded-xl bg-emerald-50 border border-emerald-100 hover:bg-emerald-100 transition-colors">
                          <FileText className="w-4 h-4 text-emerald-600" />
                          <span className="text-sm font-medium text-emerald-700 flex-1">10th Marks Card</span>
                          <ExternalLink className="w-3.5 h-3.5 text-emerald-400" />
                        </a>
                      )}
                      {profileModalStudent.twelfthMarksCardLink && (
                        <a href={profileModalStudent.twelfthMarksCardLink} target="_blank" rel="noopener noreferrer"
                          className="flex items-center gap-2.5 p-3 rounded-xl bg-amber-50 border border-amber-100 hover:bg-amber-100 transition-colors">
                          <FileText className="w-4 h-4 text-amber-600" />
                          <span className="text-sm font-medium text-amber-700 flex-1">
                            {profileModalStudent.qualificationType === "Diploma" ? "Diploma Marks Card" : "12th Marks Card"}
                          </span>
                          <ExternalLink className="w-3.5 h-3.5 text-amber-400" />
                        </a>
                      )}
                      {profileModalStudent.linkedin && (
                        <a href={profileModalStudent.linkedin} target="_blank" rel="noopener noreferrer"
                          className="flex items-center gap-2.5 p-3 rounded-xl bg-blue-50 border border-blue-100 hover:bg-blue-100 transition-colors">
                          <Globe className="w-4 h-4 text-blue-700" />
                          <span className="text-sm font-medium text-blue-700 flex-1">LinkedIn</span>
                          <ExternalLink className="w-3.5 h-3.5 text-blue-400" />
                        </a>
                      )}
                      {profileModalStudent.github && (
                        <a href={profileModalStudent.github} target="_blank" rel="noopener noreferrer"
                          className="flex items-center gap-2.5 p-3 rounded-xl bg-gray-50 border border-gray-200 hover:bg-gray-100 transition-colors">
                          <Code className="w-4 h-4 text-gray-700" />
                          <span className="text-sm font-medium text-gray-700 flex-1">GitHub</span>
                          <ExternalLink className="w-3.5 h-3.5 text-gray-400" />
                        </a>
                      )}
                      {!profileModalStudent.resumeLink && !profileModalStudent.driveLink && !profileModalStudent.linkedin && !profileModalStudent.github && (
                        <p className="text-xs text-muted-foreground italic p-3">No links or documents uploaded yet.</p>
                      )}
                    </div>
                  </div>
                </div>
              </>
            ) : null}
          </div>
        </div>
      )}

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
