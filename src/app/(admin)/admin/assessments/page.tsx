"use client";

import Header from "@/components/layout/Header";
import { cn } from "@/lib/utils";
import { adminApi } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import {
  ClipboardCheck, Loader2, AlertCircle, Plus, Trash2, ExternalLink,
  Link2, Upload, BarChart3, Clock, Users, X, CheckCircle2, Calendar, MapPin,
  Layers, KeyRound,
} from "lucide-react";
import { useState, useEffect, useCallback, useRef } from "react";

/* eslint-disable @typescript-eslint/no-explicit-any */

interface AssessmentItem {
  id: string; title: string; description: string | null; types: string[];
  departments: string[]; status: string; deadline: string | null;
  maxScore: number | null; createdAt: string;
  counts: { total: number; completed: number; absent: number };
  scheduleCount: number;
}
interface LinkItem { id: string; title: string; url: string; platform: string; displayOrder: number; instructions: string | null; }
interface SubItemData {
  id: string; title: string; type: string; description: string | null;
  scheduleDate: string | null; startTime: string | null; endTime: string | null;
  is24Hours: boolean; links: { title: string; url: string; platform?: string }[];
  displayOrder: number;
}
interface ScheduleItem { id: string; batchLabel: string; departments: string[]; scheduleDate: string; startTime: string | null; endTime: string | null; venue: string | null; usnStart: number | null; usnEnd: number | null; }
interface SubmissionItem {
  id: string; studentId: string; studentName: string | null; usn: string | null;
  department: string | null; status: string; score: number | null; remarks: string | null;
  batchLabel: string | null; scheduleDate: string | null; startTime: string | null;
}
interface DetailedAssessment {
  id: string; title: string; description: string | null; types: string[];
  departments: string[]; status: string; deadline: string | null; maxScore: number | null;
  links: LinkItem[]; subItems: SubItemData[]; schedules: ScheduleItem[]; submissions: SubmissionItem[];
}

const TYPE_COLORS: Record<string, string> = {
  aptitude: "bg-indigo-50 text-indigo-700 border-indigo-200",
  technical: "bg-violet-50 text-violet-700 border-violet-200",
  coding: "bg-emerald-50 text-emerald-700 border-emerald-200",
  interview: "bg-amber-50 text-amber-700 border-amber-200",
  custom: "bg-slate-50 text-slate-700 border-slate-200",
};
const STATUS_COLORS: Record<string, string> = {
  draft: "bg-slate-100 text-slate-600", active: "bg-emerald-100 text-emerald-700",
  expired: "bg-red-100 text-red-600", archived: "bg-gray-100 text-gray-500",
};
const PLATFORMS = ["hackerrank", "mettl", "google_forms", "leetcode", "codechef", "custom"];
const TYPES = ["aptitude", "technical", "coding", "interview", "custom"];

export default function AdminAssessmentsPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [assessments, setAssessments] = useState<AssessmentItem[]>([]);
  const [departments, setDepartments] = useState<{ id: string; code: string; name: string }[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [detail, setDetail] = useState<DetailedAssessment | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [filterType, setFilterType] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [toast, setToast] = useState<{ type: "success" | "error"; msg: string } | null>(null);
  const [uploadingGrades, setUploadingGrades] = useState(false);
  const [uploadingCreds, setUploadingCreds] = useState(false);
  const [stats, setStats] = useState<any>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const credFileRef = useRef<HTMLInputElement>(null);

  const showToast = (type: "success" | "error", msg: string) => { setToast({ type, msg }); setTimeout(() => setToast(null), 4000); };

  const fetchAssessments = useCallback(async () => {
    try {
      const params: any = {};
      if (filterType) params.type = filterType;
      if (filterStatus) params.status = filterStatus;
      const res = await adminApi.listAssessments(params) as any;
      setAssessments(res?.data || []);
    } catch { showToast("error", "Failed to load assessments"); }
  }, [filterType, filterStatus]);

  useEffect(() => {
    (async () => {
      try {
        const [, dRes] = await Promise.all([fetchAssessments(), adminApi.listDepartments() as any]);
        setDepartments(dRes?.data || []);
      } catch { /* */ } finally { setLoading(false); }
    })();
  }, [fetchAssessments]);

  const fetchDetail = async (id: string) => {
    setDetailLoading(true); setStats(null);
    try {
      const [dRes, sRes] = await Promise.all([adminApi.getAssessment(id) as any, adminApi.getAssessmentStats(id) as any]);
      setDetail(dRes?.data || null); setStats(sRes?.data || null);
    } catch { showToast("error", "Failed to load detail"); } finally { setDetailLoading(false); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this assessment? This cannot be undone.")) return;
    try { await adminApi.deleteAssessment(id); showToast("success", "Deleted"); setDetailId(null); setDetail(null); fetchAssessments(); }
    catch { showToast("error", "Delete failed"); }
  };

  const handleStatusChange = async (id: string, newStatus: string) => {
    try { await adminApi.updateAssessment(id, { status: newStatus }); showToast("success", `Status → ${newStatus}`); fetchAssessments(); if (detailId === id) fetchDetail(id); }
    catch { showToast("error", "Update failed"); }
  };

  const handleExcelUpload = async (id: string, file: File) => {
    setUploadingGrades(true);
    try {
      const text = await file.text();
      const lines = text.split("\n").filter(l => l.trim());
      if (lines.length < 2) { showToast("error", "CSV must have header + data rows"); setUploadingGrades(false); return; }
      const headers = lines[0].split(",").map(h => h.trim().toLowerCase());
      const usnIdx = headers.findIndex(h => ["usn", "roll", "roll_no", "rollno"].includes(h));
      const scoreIdx = headers.findIndex(h => ["score", "marks", "total"].includes(h));
      const remarksIdx = headers.findIndex(h => ["remarks", "comment", "comments"].includes(h));
      if (usnIdx < 0 || scoreIdx < 0) { showToast("error", "CSV must have 'USN' and 'Score' columns"); setUploadingGrades(false); return; }
      const grades = lines.slice(1).map(line => {
        const cols = line.split(",").map(c => c.trim().replace(/^"|"$/g, ""));
        return { usn: cols[usnIdx] || "", score: parseFloat(cols[scoreIdx]) || 0, remarks: remarksIdx >= 0 ? cols[remarksIdx] || undefined : undefined };
      }).filter(g => g.usn);
      const res = await adminApi.bulkGradeAssessment(id, grades) as any;
      showToast("success", `Graded ${res?.data?.graded || 0}. ${res?.data?.notFound || 0} USNs not found.`);
      fetchDetail(id); fetchAssessments();
    } catch { showToast("error", "Upload failed"); } finally { setUploadingGrades(false); }
  };

  return (
    <div className="page-enter">
      <Header userName={user?.email || ""} userRole="Admin" greeting="Assessments" subtitle="Create tests, share links, and upload scores" />
      <div className="px-4 sm:px-6 md:px-8 pb-24 sm:pb-10 -mt-2 space-y-4">
        {/* Filters + Create */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <select value={filterType} onChange={e => setFilterType(e.target.value)} className="px-3 py-2 bg-white border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30">
            <option value="">All Types</option>
            {TYPES.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="px-3 py-2 bg-white border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30">
            <option value="">All Status</option>
            {["draft", "active", "expired", "archived"].map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <div className="flex-1" />
          <button onClick={() => setShowCreate(true)} className="flex items-center gap-1.5 px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded-xl text-sm font-medium shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/30 transition-all">
            <Plus className="w-4 h-4" /> New Assessment
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-indigo-500" /></div>
        ) : assessments.length === 0 ? (
          <div className="text-center py-16 i-card">
            <ClipboardCheck className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-40" />
            <p className="text-muted-foreground font-medium">No assessments yet</p>
            <p className="text-sm text-muted-foreground mt-1">Create your first assessment to get started</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            {assessments.map(a => {
              const progress = a.counts.total > 0 ? Math.round((a.counts.completed / a.counts.total) * 100) : 0;
              const isExpired = a.deadline && new Date(a.deadline) < new Date();
              return (
                <div key={a.id} className={cn("i-card p-4 cursor-pointer hover:shadow-md transition-all border-l-4",
                  a.status === "active" ? "border-l-emerald-500" : a.status === "draft" ? "border-l-slate-300" : "border-l-red-300")}
                  onClick={() => { setDetailId(a.id); fetchDetail(a.id); }}>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="min-w-0">
                      <h3 className="font-semibold text-foreground truncate">{a.title}</h3>
                      <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                        {(a.types || []).map(t => <span key={t} className={cn("px-2 py-0.5 rounded-full text-[10px] font-semibold border capitalize", TYPE_COLORS[t] || TYPE_COLORS.custom)}>{t}</span>)}
                        <span className={cn("px-2 py-0.5 rounded-full text-[10px] font-semibold capitalize", STATUS_COLORS[a.status])}>{a.status}</span>
                        {isExpired && a.status === "active" && <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-red-100 text-red-600">Expired</span>}
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-lg font-bold text-foreground">{progress}%</p>
                      <p className="text-[10px] text-muted-foreground">{a.counts.completed}/{a.counts.total}</p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1 mb-2">
                    {a.departments.map(d => <span key={d} className="px-1.5 py-0.5 bg-accent/50 rounded text-[10px] text-muted-foreground">{d}</span>)}
                    {a.scheduleCount > 0 && <span className="px-1.5 py-0.5 bg-blue-50 rounded text-[10px] text-blue-600 font-medium">{a.scheduleCount} batch{a.scheduleCount > 1 ? "es" : ""}</span>}
                  </div>
                  <div className="w-full bg-accent/50 rounded-full h-1.5">
                    <div className="h-1.5 rounded-full bg-gradient-to-r from-indigo-500 to-violet-500 transition-all" style={{ width: `${progress}%` }} />
                  </div>
                  {a.deadline && (
                    <p className={cn("text-[10px] mt-1.5", isExpired ? "text-red-500" : "text-muted-foreground")}>
                      <Clock className="w-3 h-3 inline mr-0.5" /> {isExpired ? "Expired" : `Deadline: ${new Date(a.deadline).toLocaleDateString()}`}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Detail Panel */}
        {detailId && (
          <div className="fixed inset-0 bg-black/40 z-50 flex items-start justify-center pt-6 sm:pt-12 px-4" onClick={() => { setDetailId(null); setDetail(null); }}>
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[85vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
              {detailLoading || !detail ? (
                <div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-indigo-500" /></div>
              ) : (
                <div className="p-5 sm:p-6 space-y-5">
                  {/* Header */}
                  <div className="flex items-start justify-between">
                    <div>
                      <h2 className="text-xl font-bold text-foreground">{detail.title}</h2>
                      <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                        {(detail.types || []).map(t => <span key={t} className={cn("px-2 py-0.5 rounded-full text-xs font-semibold border capitalize", TYPE_COLORS[t])}>{t}</span>)}
                        <span className={cn("px-2 py-0.5 rounded-full text-xs font-semibold capitalize", STATUS_COLORS[detail.status])}>{detail.status}</span>
                      </div>
                      {detail.description && <p className="text-sm text-muted-foreground mt-2">{detail.description}</p>}
                    </div>
                    <div className="flex items-center gap-2">
                      {detail.status === "draft" && <button onClick={() => handleStatusChange(detail.id, "active")} className="px-3 py-1.5 bg-emerald-500 text-white rounded-lg text-xs font-medium hover:bg-emerald-600 transition-colors">Publish</button>}
                      {detail.status === "active" && <button onClick={() => handleStatusChange(detail.id, "expired")} className="px-3 py-1.5 bg-amber-500 text-white rounded-lg text-xs font-medium hover:bg-amber-600 transition-colors">Expire</button>}
                      <button onClick={() => handleDelete(detail.id)} className="p-1.5 text-red-400 hover:text-red-600"><Trash2 className="w-4 h-4" /></button>
                      <button onClick={() => { setDetailId(null); setDetail(null); }} className="p-1.5 text-muted-foreground hover:text-foreground"><X className="w-5 h-5" /></button>
                    </div>
                  </div>

                  {/* Stats */}
                  {stats && (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {[
                        { label: "Total", val: stats.total, bg: "bg-indigo-50", text: "text-indigo-700", sub: "text-indigo-500" },
                        { label: "Completed", val: stats.completed, bg: "bg-emerald-50", text: "text-emerald-700", sub: "text-emerald-500" },
                        { label: "Absent", val: stats.absent, bg: "bg-red-50", text: "text-red-700", sub: "text-red-500" },
                        { label: "Avg Score", val: stats.avgScore ?? "—", bg: "bg-amber-50", text: "text-amber-700", sub: "text-amber-500" },
                      ].map(s => (
                        <div key={s.label} className={cn("p-3 rounded-xl text-center", s.bg)}>
                          <p className={cn("text-lg font-bold", s.text)}>{s.val}</p>
                          <p className={cn("text-[10px] font-medium", s.sub)}>{s.label}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Sub-Items */}
                  {(detail.subItems || []).length > 0 && (
                    <div>
                      <h3 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-1.5">
                        <Layers className="w-4 h-4" /> Sub-Assessments ({detail.subItems.length})
                      </h3>
                      <div className="space-y-2">
                        {detail.subItems.map(si => (
                          <div key={si.id} className="p-3.5 bg-gradient-to-r from-violet-50/80 to-indigo-50/80 rounded-xl border border-violet-100">
                            <div className="flex items-start justify-between">
                              <div>
                                <div className="flex items-center gap-2 mb-1">
                                  <h4 className="text-sm font-bold text-foreground">{si.title}</h4>
                                  <span className={cn("px-2 py-0.5 rounded-full text-[10px] font-semibold border capitalize", TYPE_COLORS[si.type] || TYPE_COLORS.custom)}>{si.type}</span>
                                </div>
                                {si.description && <p className="text-xs text-muted-foreground mb-1.5">{si.description}</p>}
                                <div className="flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
                                  {si.is24Hours ? (
                                    <span className="flex items-center gap-0.5 text-emerald-600 font-medium"><Clock className="w-3 h-3" /> 24 Hours Access</span>
                                  ) : (
                                    <>
                                      {si.scheduleDate && <span className="flex items-center gap-0.5"><Calendar className="w-3 h-3" /> {new Date(si.scheduleDate).toLocaleDateString()}</span>}
                                      {si.startTime && <span className="flex items-center gap-0.5"><Clock className="w-3 h-3" /> {si.startTime}{si.endTime ? ` – ${si.endTime}` : ""}</span>}
                                    </>
                                  )}
                                </div>
                                {si.links.length > 0 && (
                                  <div className="mt-2 space-y-1">
                                    {si.links.map((l, li) => (
                                      <a key={li} href={l.url} target="_blank" rel="noopener noreferrer"
                                        className="flex items-center gap-2 px-2.5 py-1.5 bg-white rounded-lg border border-violet-100 hover:border-indigo-300 transition-all text-xs">
                                        <Link2 className="w-3 h-3 text-indigo-500" />
                                        <span className="font-medium text-foreground">{l.title}</span>
                                        <ExternalLink className="w-3 h-3 text-muted-foreground ml-auto" />
                                      </a>
                                    ))}
                                  </div>
                                )}
                              </div>
                              <button onClick={async () => { await adminApi.removeAssessmentSubItem(si.id); fetchDetail(detail.id); showToast("success", "Sub-item removed"); }}
                                className="p-1.5 text-red-400 hover:text-red-600 flex-shrink-0"><Trash2 className="w-3.5 h-3.5" /></button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Schedules / Batches */}
                  <div>
                    <h3 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-1.5">
                      <Calendar className="w-4 h-4" /> Batch Schedule ({detail.schedules.length})
                    </h3>
                    {detail.schedules.length > 0 ? (
                      <div className="space-y-2">
                        {detail.schedules.map(s => (
                          <div key={s.id} className="flex items-center justify-between p-3 bg-blue-50/60 rounded-xl border border-blue-100">
                            <div>
                              <p className="text-sm font-semibold text-foreground">{s.batchLabel}</p>
                              <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                                {(s as any).usnStart != null && (s as any).usnEnd != null && (
                                  <span className="text-xs text-blue-600 font-semibold flex items-center gap-0.5">USN {(s as any).usnStart} – {(s as any).usnEnd}</span>
                                )}
                                <span className="text-xs text-muted-foreground flex items-center gap-0.5"><Calendar className="w-3 h-3" /> {new Date(s.scheduleDate).toLocaleDateString()}</span>
                                {s.startTime && <span className="text-xs text-muted-foreground flex items-center gap-0.5"><Clock className="w-3 h-3" /> {s.startTime}{s.endTime ? ` - ${s.endTime}` : ""}</span>}
                                {s.venue && <span className="text-xs text-muted-foreground flex items-center gap-0.5"><MapPin className="w-3 h-3" /> {s.venue}</span>}
                              </div>
                              <div className="flex gap-1 mt-1">{s.departments.map(d => <span key={d} className="px-1.5 py-0.5 bg-white rounded text-[10px] text-blue-600 font-medium">{d}</span>)}</div>
                            </div>
                            <button onClick={async () => { await adminApi.removeAssessmentSchedule(s.id); fetchDetail(detail.id); showToast("success", "Schedule removed"); }}
                              className="p-1.5 text-red-400 hover:text-red-600"><Trash2 className="w-3.5 h-3.5" /></button>
                          </div>
                        ))}
                      </div>
                    ) : <p className="text-sm text-muted-foreground">No batch schedules — all departments share the same deadline.</p>}
                  </div>

                  {/* Links */}
                  <div>
                    <h3 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-1.5"><Link2 className="w-4 h-4" /> Test Links ({detail.links.length})</h3>
                    {detail.links.length === 0 ? <p className="text-sm text-muted-foreground">No links added</p> : (
                      <div className="space-y-2">
                        {detail.links.map(l => (
                          <div key={l.id} className="flex items-center justify-between p-2.5 bg-accent/30 rounded-xl">
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-medium text-foreground truncate">{l.title}</p>
                              <p className="text-[10px] text-muted-foreground truncate">{l.url}</p>
                            </div>
                            <div className="flex items-center gap-1.5 ml-2">
                              <a href={l.url} target="_blank" rel="noopener noreferrer" className="p-1.5 text-indigo-500 hover:text-indigo-700"><ExternalLink className="w-4 h-4" /></a>
                              <button onClick={async () => { await adminApi.removeAssessmentLink(l.id); fetchDetail(detail.id); showToast("success", "Link removed"); }}
                                className="p-1.5 text-red-400 hover:text-red-600"><Trash2 className="w-3.5 h-3.5" /></button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Upload Grades */}
                  <div className="p-4 bg-gradient-to-br from-indigo-50 to-violet-50 rounded-xl border border-indigo-100">
                    <h3 className="text-sm font-semibold text-foreground mb-1 flex items-center gap-1.5"><Upload className="w-4 h-4" /> Upload Scores (CSV)</h3>
                    <p className="text-[11px] text-muted-foreground mb-3">CSV: <strong>USN, Score</strong> (optional: Remarks). Students with scores = attended.</p>
                    <input ref={fileRef} type="file" accept=".csv,.txt" className="hidden"
                      onChange={e => { if (e.target.files?.[0]) { handleExcelUpload(detail.id, e.target.files[0]); e.target.value = ""; } }} />
                    <button onClick={() => fileRef.current?.click()} disabled={uploadingGrades}
                      className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded-lg text-sm font-medium shadow-md hover:shadow-lg transition-all disabled:opacity-50">
                      {uploadingGrades ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                      {uploadingGrades ? "Processing..." : "Upload CSV"}
                    </button>
                  </div>

                  {/* Upload Test Credentials */}
                  <div className="p-4 bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl border border-amber-100">
                    <h3 className="text-sm font-semibold text-foreground mb-1 flex items-center gap-1.5"><KeyRound className="w-4 h-4 text-amber-600" /> Upload Test Credentials (CSV)</h3>
                    <p className="text-[11px] text-muted-foreground mb-3">CSV: <strong>Email, LoginID, Password</strong> — assigns external test platform credentials to students. Matched by student email.</p>
                    <input ref={credFileRef} type="file" accept=".csv,.txt" className="hidden"
                      onChange={async e => {
                        if (!e.target.files?.[0]) return;
                        setUploadingCreds(true);
                        try {
                          const text = await e.target.files[0].text();
                          const lines = text.split("\n").filter(l => l.trim());
                          if (lines.length < 2) { showToast("error", "CSV must have header + data rows"); return; }
                          const headers = lines[0].split(",").map(h => h.trim().toLowerCase());
                          const emailIdx = headers.findIndex(h => ["email", "mail", "student_email"].includes(h));
                          const loginIdx = headers.findIndex(h => ["loginid", "login_id", "id", "username", "user_id"].includes(h));
                          const passIdx = headers.findIndex(h => ["password", "pass", "pwd", "login_password"].includes(h));
                          if (emailIdx < 0 || loginIdx < 0 || passIdx < 0) {
                            showToast("error", "CSV must have Email, LoginID, Password columns"); return;
                          }
                          const creds = lines.slice(1).map(line => {
                            const cols = line.split(",").map(c => c.trim().replace(/^"|"$/g, ""));
                            return { email: cols[emailIdx] || "", loginId: cols[loginIdx] || "", password: cols[passIdx] || "" };
                          }).filter(c => c.email && c.loginId);
                          const res = await adminApi.uploadAssessmentCredentials(detail.id, creds) as any;
                          showToast("success", `Credentials: ${res?.data?.matched || 0} matched, ${res?.data?.notFound || 0} not found`);
                        } catch { showToast("error", "Credential upload failed"); } finally { setUploadingCreds(false); e.target.value = ""; }
                      }} />
                    <button onClick={() => credFileRef.current?.click()} disabled={uploadingCreds}
                      className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-lg text-sm font-medium shadow-md hover:shadow-lg transition-all disabled:opacity-50">
                      {uploadingCreds ? <Loader2 className="w-4 h-4 animate-spin" /> : <KeyRound className="w-4 h-4" />}
                      {uploadingCreds ? "Uploading..." : "Upload Credentials CSV"}
                    </button>
                  </div>

                  {/* Submissions Table */}
                  <div>
                    <h3 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-1.5"><Users className="w-4 h-4" /> Submissions ({detail.submissions.length})</h3>
                    {detail.submissions.length === 0 ? (
                      <p className="text-sm text-muted-foreground">No students assigned. Publish to assign.</p>
                    ) : (
                      <div className="overflow-x-auto -mx-1">
                        <table className="w-full text-sm">
                          <thead><tr className="border-b border-border">
                            <th className="text-left py-2 px-2 text-[11px] font-semibold text-muted-foreground">Student</th>
                            <th className="text-left py-2 px-2 text-[11px] font-semibold text-muted-foreground">USN</th>
                            <th className="text-left py-2 px-2 text-[11px] font-semibold text-muted-foreground hidden sm:table-cell">Dept</th>
                            <th className="text-left py-2 px-2 text-[11px] font-semibold text-muted-foreground hidden md:table-cell">Batch</th>
                            <th className="text-center py-2 px-2 text-[11px] font-semibold text-muted-foreground">Status</th>
                            <th className="text-center py-2 px-2 text-[11px] font-semibold text-muted-foreground">Score</th>
                          </tr></thead>
                          <tbody>
                            {detail.submissions.map(s => (
                              <tr key={s.id} className="border-b border-border/50 hover:bg-accent/20 transition-colors">
                                <td className="py-2 px-2 text-foreground font-medium truncate max-w-[120px]">{s.studentName || "—"}</td>
                                <td className="py-2 px-2 text-muted-foreground text-xs">{s.usn || "—"}</td>
                                <td className="py-2 px-2 text-muted-foreground text-xs hidden sm:table-cell">{s.department || "—"}</td>
                                <td className="py-2 px-2 text-muted-foreground text-xs hidden md:table-cell">{s.batchLabel || "—"}</td>
                                <td className="py-2 px-2 text-center">
                                  <span className={cn("px-2 py-0.5 rounded-full text-[10px] font-semibold capitalize",
                                    s.status === "completed" ? "bg-emerald-100 text-emerald-700" : s.status === "absent" ? "bg-red-100 text-red-600" : "bg-amber-100 text-amber-600")}>
                                    {s.status}
                                  </span>
                                </td>
                                <td className="py-2 px-2 text-center font-bold text-foreground">{s.score != null ? `${s.score}${detail.maxScore ? `/${detail.maxScore}` : ""}` : "—"}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>

                  {/* Dept Stats */}
                  {stats?.departmentStats?.length > 0 && (
                    <div>
                      <h3 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-1.5"><BarChart3 className="w-4 h-4" /> Department Breakdown</h3>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {stats.departmentStats.map((ds: any) => (
                          <div key={ds.department} className="p-2.5 bg-accent/30 rounded-xl">
                            <p className="text-xs font-semibold text-foreground">{ds.department}</p>
                            <p className="text-[10px] text-muted-foreground">{ds.completed}/{ds.total} completed</p>
                            <p className="text-xs font-bold text-indigo-600 mt-0.5">Avg: {ds.avgScore ?? "—"}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {showCreate && <CreateModal departments={departments} onClose={() => setShowCreate(false)}
          onCreated={() => { setShowCreate(false); fetchAssessments(); showToast("success", "Assessment created!"); }} />}
      </div>

      {toast && (
        <div className={cn("fixed bottom-6 left-1/2 -translate-x-1/2 z-[60] px-5 py-3 rounded-xl shadow-lg text-sm font-medium flex items-center gap-2",
          toast.type === "success" ? "bg-emerald-600 text-white" : "bg-red-600 text-white")}>
          {toast.type === "success" ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          {toast.msg}
        </div>
      )}
    </div>
  );
}

// ─── Create Modal with sub-items builder ─
interface SubItemForm {
  title: string; type: string; description: string;
  scheduleDate: string; startTime: string; endTime: string; is24Hours: boolean;
  links: { title: string; url: string; platform: string }[];
}

function CreateModal({ departments, onClose, onCreated }: {
  departments: { id: string; code: string; name: string }[];
  onClose: () => void; onCreated: () => void;
}) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [selectedTypes, setSelectedTypes] = useState<string[]>(["aptitude"]);
  const [selectedDepts, setSelectedDepts] = useState<string[]>([]);
  const [deadline, setDeadline] = useState("");
  const [maxScore, setMaxScore] = useState("");
  const [status, setStatus] = useState("active");
  const [links, setLinks] = useState<{ title: string; url: string; platform: string }[]>([]);
  const [schedules, setSchedules] = useState<{ batchLabel: string; departments: string[]; scheduleDate: string; startTime: string; endTime: string; venue: string; usnStart: string; usnEnd: string }[]>([]);
  const [subItems, setSubItems] = useState<SubItemForm[]>([]);
  const [saving, setSaving] = useState(false);

  const toggleType = (t: string) => setSelectedTypes(prev => prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t]);
  const toggleDept = (code: string) => setSelectedDepts(prev => prev.includes(code) ? prev.filter(d => d !== code) : [...prev, code]);

  const addSchedule = () => {
    setSchedules([...schedules, { batchLabel: `Batch ${schedules.length + 1}`, departments: [], scheduleDate: "", startTime: "", endTime: "", venue: "", usnStart: "", usnEnd: "" }]);
  };

  const addSubItem = () => {
    setSubItems([...subItems, { title: "", type: "aptitude", description: "", scheduleDate: "", startTime: "", endTime: "", is24Hours: false, links: [{ title: "", url: "", platform: "custom" }] }]);
  };

  const updateSubItem = (idx: number, field: string, val: any) => {
    const n = [...subItems];
    (n[idx] as any)[field] = val;
    if (field === "is24Hours" && val) { n[idx].startTime = ""; n[idx].endTime = ""; }
    setSubItems(n);
  };

  const addSubItemLink = (idx: number) => {
    const n = [...subItems];
    n[idx].links = [...n[idx].links, { title: "", url: "", platform: "custom" }];
    setSubItems(n);
  };

  const updateSubItemLink = (siIdx: number, lIdx: number, field: string, val: string) => {
    const n = [...subItems];
    (n[siIdx].links[lIdx] as any)[field] = val;
    setSubItems(n);
  };

  const removeSubItemLink = (siIdx: number, lIdx: number) => {
    const n = [...subItems];
    n[siIdx].links = n[siIdx].links.filter((_, j) => j !== lIdx);
    setSubItems(n);
  };

  const handleSave = async () => {
    if (!title.trim()) return;
    setSaving(true);
    try {
      await adminApi.createAssessment({
        title: title.trim(), description: description.trim() || undefined,
        types: selectedTypes, departments: selectedDepts, status,
        deadline: deadline || undefined,
        maxScore: maxScore ? parseFloat(maxScore) : undefined,
        links: links.filter(l => l.title.trim() && l.url.trim()),
        schedules: schedules.filter(s => s.scheduleDate).map(s => ({
          batchLabel: s.batchLabel, departments: selectedDepts,
          scheduleDate: s.scheduleDate, startTime: s.startTime || undefined,
          endTime: s.endTime || undefined, venue: s.venue || undefined,
          usnStart: s.usnStart ? parseInt(s.usnStart) : undefined,
          usnEnd: s.usnEnd ? parseInt(s.usnEnd) : undefined,
        })),
        subItems: subItems.filter(si => si.title.trim()).map(si => ({
          title: si.title.trim(), type: si.type,
          description: si.description.trim() || undefined,
          scheduleDate: si.scheduleDate || undefined,
          startTime: si.is24Hours ? undefined : (si.startTime || undefined),
          endTime: si.is24Hours ? undefined : (si.endTime || undefined),
          is24Hours: si.is24Hours,
          links: si.links.filter(l => l.title.trim() && l.url.trim()),
        })),
      });
      onCreated();
    } catch { /* */ } finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-start justify-center pt-4 sm:pt-8 px-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="p-5 sm:p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-foreground">New Assessment</h2>
            <button onClick={onClose} className="p-1 text-muted-foreground hover:text-foreground"><X className="w-5 h-5" /></button>
          </div>

          {/* Title */}
          <div>
            <label className="text-xs font-semibold text-muted-foreground block mb-1">Title *</label>
            <input value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Placement Test - Batch 2026"
              className="w-full px-3 py-2.5 bg-white border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30" />
          </div>

          {/* Description */}
          <div>
            <label className="text-xs font-semibold text-muted-foreground block mb-1">Description</label>
            <textarea value={description} onChange={e => setDescription(e.target.value)} rows={2} placeholder="Instructions..."
              className="w-full px-3 py-2.5 bg-white border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 resize-none" />
          </div>

          {/* Types */}
          <div>
            <label className="text-xs font-semibold text-muted-foreground block mb-1.5">Types (select multiple)</label>
            <div className="flex flex-wrap gap-1.5">
              {TYPES.map(t => (
                <button key={t} onClick={() => toggleType(t)}
                  className={cn("px-3 py-1.5 rounded-lg text-xs font-medium border transition-all capitalize",
                    selectedTypes.includes(t) ? "bg-indigo-600 text-white border-indigo-600" : "bg-white text-muted-foreground border-border hover:border-indigo-300")}>
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Status + Max Score + Deadline */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-semibold text-muted-foreground block mb-1">Status</label>
              <select value={status} onChange={e => setStatus(e.target.value)} className="w-full px-3 py-2.5 bg-white border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30">
                <option value="draft">Draft</option>
                <option value="active">Active</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground block mb-1">Max Score</label>
              <input type="number" value={maxScore} onChange={e => setMaxScore(e.target.value)} placeholder="100"
                className="w-full px-3 py-2.5 bg-white border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30" />
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground block mb-1">Deadline</label>
              <input type="datetime-local" value={deadline} onChange={e => setDeadline(e.target.value)}
                className="w-full px-3 py-2.5 bg-white border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30" />
            </div>
          </div>

          {/* Departments */}
          <div>
            <label className="text-xs font-semibold text-muted-foreground block mb-1.5">Departments</label>
            <div className="flex flex-wrap gap-1.5">
              {departments.map(d => (
                <button key={d.code} onClick={() => toggleDept(d.code)}
                  className={cn("px-2.5 py-1 rounded-lg text-xs font-medium border transition-all",
                    selectedDepts.includes(d.code) ? "bg-indigo-600 text-white border-indigo-600" : "bg-white text-muted-foreground border-border hover:border-indigo-300")}>
                  {d.code}
                </button>
              ))}
            </div>
          </div>

          {/* Sub-Items Builder */}
          <div className="border-t border-border pt-4">
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-violet-600" /> Sub-Assessments
              </label>
              <button onClick={addSubItem} className="text-xs text-violet-600 font-medium hover:text-violet-700 flex items-center gap-0.5"><Plus className="w-3 h-3" /> Add Sub-Assessment</button>
            </div>
            {subItems.length === 0 ? (
              <p className="text-[11px] text-muted-foreground">Each sub-assessment gets its own type, time slot, and links. Click &quot;Add Sub-Assessment&quot; to start.</p>
            ) : (
              <div className="space-y-3">
                {subItems.map((si, i) => (
                  <div key={i} className="p-3 bg-gradient-to-r from-violet-50/60 to-indigo-50/60 rounded-xl border border-violet-100 space-y-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <input value={si.title} onChange={e => updateSubItem(i, "title", e.target.value)} placeholder="e.g. Aptitude Test"
                        className="flex-1 px-2.5 py-1.5 bg-white border border-border rounded-lg text-sm font-semibold focus:outline-none" />
                      <select value={si.type} onChange={e => updateSubItem(i, "type", e.target.value)}
                        className="px-2 py-1.5 bg-white border border-border rounded-lg text-xs focus:outline-none capitalize">
                        {TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                      </select>
                      <button onClick={() => setSubItems(subItems.filter((_, j) => j !== i))} className="p-1 text-red-400 hover:text-red-600"><X className="w-3.5 h-3.5" /></button>
                    </div>

                    <input value={si.description} onChange={e => updateSubItem(i, "description", e.target.value)} placeholder="Description (optional)"
                      className="w-full px-2.5 py-1.5 bg-white border border-border rounded-lg text-xs focus:outline-none" />

                    {/* Time */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <label className="flex items-center gap-1.5 text-xs">
                        <input type="checkbox" checked={si.is24Hours} onChange={e => updateSubItem(i, "is24Hours", e.target.checked)}
                          className="rounded border-border" />
                        <span className="font-medium text-emerald-700">24 Hours</span>
                      </label>
                      {!si.is24Hours && (
                        <>
                          <input type="date" value={si.scheduleDate} onChange={e => updateSubItem(i, "scheduleDate", e.target.value)}
                            className="px-2 py-1.5 bg-white border border-border rounded-lg text-xs focus:outline-none" />
                          <input value={si.startTime} onChange={e => updateSubItem(i, "startTime", e.target.value)} placeholder="10:00 AM"
                            className="px-2 py-1.5 bg-white border border-border rounded-lg text-xs focus:outline-none w-24" />
                          <input value={si.endTime} onChange={e => updateSubItem(i, "endTime", e.target.value)} placeholder="12:00 PM"
                            className="px-2 py-1.5 bg-white border border-border rounded-lg text-xs focus:outline-none w-24" />
                        </>
                      )}
                    </div>

                    {/* Links for this sub-item */}
                    <div>
                      <p className="text-[10px] font-semibold text-muted-foreground uppercase mb-1">Links</p>
                      <div className="space-y-1.5">
                        {si.links.map((l, li) => (
                          <div key={li} className="flex items-center gap-1.5">
                            <input value={l.title} onChange={e => updateSubItemLink(i, li, "title", e.target.value)} placeholder="Link title"
                              className="flex-1 px-2 py-1.5 bg-white border border-border rounded-lg text-xs focus:outline-none" />
                            <input value={l.url} onChange={e => updateSubItemLink(i, li, "url", e.target.value)} placeholder="https://..."
                              className="flex-[2] px-2 py-1.5 bg-white border border-border rounded-lg text-xs focus:outline-none" />
                            {si.links.length > 1 && (
                              <button onClick={() => removeSubItemLink(i, li)} className="p-0.5 text-red-400 hover:text-red-600"><X className="w-3 h-3" /></button>
                            )}
                          </div>
                        ))}
                      </div>
                      <button onClick={() => addSubItemLink(i)} className="mt-1 text-[10px] text-indigo-600 font-medium hover:text-indigo-700 flex items-center gap-0.5">
                        <Plus className="w-2.5 h-2.5" /> Add link
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Batch Schedules — split by USN range */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-muted-foreground">Batch Schedules (split students by USN range)</label>
              <button onClick={addSchedule} className="text-xs text-indigo-600 font-medium hover:text-indigo-700 flex items-center gap-0.5"><Plus className="w-3 h-3" /> Add Batch</button>
            </div>
            {schedules.length === 0 ? (
              <p className="text-[11px] text-muted-foreground">No batches — all students share the same schedule. Add batches to split by USN range (e.g. 001–100 in Batch 1, 101–200 in Batch 2).</p>
            ) : (
              <div className="space-y-3">
                {schedules.map((s, i) => (
                  <div key={i} className="p-3 bg-blue-50/50 rounded-xl border border-blue-100 space-y-2">
                    <div className="flex items-center justify-between">
                      <input value={s.batchLabel} onChange={e => { const n = [...schedules]; n[i].batchLabel = e.target.value; setSchedules(n); }}
                        className="px-2 py-1 bg-white border border-border rounded-lg text-sm font-semibold w-32 focus:outline-none" />
                      <button onClick={() => setSchedules(schedules.filter((_, j) => j !== i))} className="p-1 text-red-400 hover:text-red-600"><X className="w-3.5 h-3.5" /></button>
                    </div>
                    {/* USN Range */}
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-semibold text-blue-600 whitespace-nowrap">USN Range:</span>
                      <input type="number" value={s.usnStart} onChange={e => { const n = [...schedules]; n[i].usnStart = e.target.value; setSchedules(n); }}
                        placeholder="From (e.g. 1)" className="w-28 px-2 py-1.5 bg-white border border-border rounded-lg text-xs focus:outline-none" />
                      <span className="text-xs text-muted-foreground">to</span>
                      <input type="number" value={s.usnEnd} onChange={e => { const n = [...schedules]; n[i].usnEnd = e.target.value; setSchedules(n); }}
                        placeholder="To (e.g. 100)" className="w-28 px-2 py-1.5 bg-white border border-border rounded-lg text-xs focus:outline-none" />
                    </div>
                    {/* Date + Time + Venue */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      <input type="date" value={s.scheduleDate} onChange={e => { const n = [...schedules]; n[i].scheduleDate = e.target.value; setSchedules(n); }}
                        className="px-2 py-1.5 bg-white border border-border rounded-lg text-xs focus:outline-none" />
                      <input value={s.startTime} onChange={e => { const n = [...schedules]; n[i].startTime = e.target.value; setSchedules(n); }}
                        placeholder="10:00 AM" className="px-2 py-1.5 bg-white border border-border rounded-lg text-xs focus:outline-none" />
                      <input value={s.endTime} onChange={e => { const n = [...schedules]; n[i].endTime = e.target.value; setSchedules(n); }}
                        placeholder="12:00 PM" className="px-2 py-1.5 bg-white border border-border rounded-lg text-xs focus:outline-none" />
                      <input value={s.venue} onChange={e => { const n = [...schedules]; n[i].venue = e.target.value; setSchedules(n); }}
                        placeholder="Venue" className="px-2 py-1.5 bg-white border border-border rounded-lg text-xs focus:outline-none" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Direct Links (legacy) */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-muted-foreground">Direct Test Links (optional)</label>
              <button onClick={() => setLinks([...links, { title: "", url: "", platform: "custom" }])}
                className="text-xs text-indigo-600 font-medium hover:text-indigo-700 flex items-center gap-0.5"><Plus className="w-3 h-3" /> Add link</button>
            </div>
            {links.length > 0 && (
              <div className="space-y-2">
                {links.map((l, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <input value={l.title} onChange={e => { const n = [...links]; n[i].title = e.target.value; setLinks(n); }}
                      placeholder="Link title" className="flex-1 px-2.5 py-2 bg-white border border-border rounded-lg text-xs focus:outline-none" />
                    <input value={l.url} onChange={e => { const n = [...links]; n[i].url = e.target.value; setLinks(n); }}
                      placeholder="https://..." className="flex-[2] px-2.5 py-2 bg-white border border-border rounded-lg text-xs focus:outline-none" />
                    <select value={l.platform} onChange={e => { const n = [...links]; n[i].platform = e.target.value; setLinks(n); }}
                      className="px-2 py-2 bg-white border border-border rounded-lg text-xs focus:outline-none hidden sm:block">
                      {PLATFORMS.map(p => <option key={p} value={p}>{p}</option>)}
                    </select>
                    <button onClick={() => setLinks(links.filter((_, j) => j !== i))} className="p-1 text-red-400 hover:text-red-600"><X className="w-3.5 h-3.5" /></button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Save */}
          <button onClick={handleSave} disabled={saving || !title.trim()}
            className="w-full py-3 bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded-xl font-medium shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/30 transition-all disabled:opacity-50 flex items-center justify-center gap-2">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <ClipboardCheck className="w-4 h-4" />}
            {saving ? "Creating..." : "Create Assessment"}
          </button>
        </div>
      </div>
    </div>
  );
}
