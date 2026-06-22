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
import * as XLSX from "xlsx";

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
  is24Hours: boolean; departments: string[]; links: { title: string; url: string; platform?: string }[];
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

  // Inline add forms
  const [showAddLink, setShowAddLink] = useState(false);
  const [newLink, setNewLink] = useState({ title: "", url: "", platform: "custom" });
  const [showAddBatch, setShowAddBatch] = useState(false);
  const [newBatch, setNewBatch] = useState({ batchLabel: "", scheduleDate: "", startTime: "", endTime: "", venue: "", usnStart: "", usnEnd: "" });
  const [showAddSubItem, setShowAddSubItem] = useState(false);
  const [newSubItem, setNewSubItem] = useState({ title: "", type: "aptitude", description: "", scheduleDate: "", startTime: "", endTime: "", is24Hours: false, departments: [] as string[], links: [{ title: "", url: "", platform: "custom" }] });
  const [selectedDepts, setSelectedDepts] = useState<string[]>([]);
  const [credPreview, setCredPreview] = useState<{ matched: any[]; notFound: any[]; existingCount: number; total: number; parsedCreds: any[] } | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);

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

                  {/* Department Tabs (multi-select) */}
                  {detail.departments.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground mb-1.5">Filter by Department <span className="text-[10px] font-normal">(click multiple)</span></p>
                      <div className="flex flex-wrap gap-1.5">
                        <button onClick={() => setSelectedDepts([])}
                          className={cn("px-3 py-1.5 rounded-lg text-xs font-medium border transition-all",
                            selectedDepts.length === 0 ? "bg-indigo-600 text-white border-indigo-600" : "bg-white text-muted-foreground border-border hover:border-indigo-300")}>
                          All Depts
                        </button>
                        {detail.departments.map(d => (
                          <button key={d} onClick={() => setSelectedDepts(prev => prev.includes(d) ? prev.filter(x => x !== d) : [...prev, d])}
                            className={cn("px-3 py-1.5 rounded-lg text-xs font-medium border transition-all",
                              selectedDepts.includes(d) ? "bg-indigo-600 text-white border-indigo-600" : "bg-white text-muted-foreground border-border hover:border-indigo-300")}>
                            {d}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Sub-Items */}
                  {(() => { const filteredSubItems = selectedDepts.length > 0 ? (detail.subItems || []).filter(si => !si.departments || si.departments.length === 0 || si.departments.some(d => selectedDepts.includes(d))) : (detail.subItems || []); return (
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                        <Layers className="w-4 h-4" /> Sub-Assessments ({filteredSubItems.length})
                      </h3>
                      <button onClick={() => setShowAddSubItem(!showAddSubItem)} className="text-xs text-violet-600 font-medium hover:text-violet-700 flex items-center gap-0.5">
                        <Plus className="w-3 h-3" /> Add Sub-Assessment
                      </button>
                    </div>
                  {filteredSubItems.length > 0 && (
                    <div>
                      <div className="space-y-2">
                        {filteredSubItems.map(si => (
                          <div key={si.id} className="p-3.5 bg-gradient-to-r from-violet-50/80 to-indigo-50/80 rounded-xl border border-violet-100">
                            <div className="flex items-start justify-between">
                              <div>
                                <div className="flex items-center gap-2 mb-1 flex-wrap">
                                  <h4 className="text-sm font-bold text-foreground">{si.title}</h4>
                                  <span className={cn("px-2 py-0.5 rounded-full text-[10px] font-semibold border capitalize", TYPE_COLORS[si.type] || TYPE_COLORS.custom)}>{si.type}</span>
                                  {(si.departments || []).length > 0 && si.departments.map(d => (
                                    <span key={d} className="px-1.5 py-0.5 rounded text-[9px] font-semibold bg-blue-50 text-blue-600 border border-blue-200">{d}</span>
                                  ))}
                                  {(si.departments || []).length === 0 && <span className="text-[9px] text-muted-foreground">All Depts</span>}
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
                    {!showAddSubItem && filteredSubItems.length === 0 && <p className="text-sm text-muted-foreground">No sub-assessments — click "Add Sub-Assessment" to add.</p>}
                    {showAddSubItem && (
                      <div className="p-3 bg-violet-50/40 rounded-xl border border-violet-100 space-y-2 mt-2">
                        <div className="flex items-center gap-2">
                          <input value={newSubItem.title} onChange={e => setNewSubItem({ ...newSubItem, title: e.target.value })} placeholder="e.g. Aptitude Test"
                            className="flex-1 px-2.5 py-1.5 bg-white border border-border rounded-lg text-sm font-semibold focus:outline-none" />
                          <select value={newSubItem.type} onChange={e => setNewSubItem({ ...newSubItem, type: e.target.value })}
                            className="px-2 py-1.5 bg-white border border-border rounded-lg text-xs focus:outline-none capitalize">
                            {TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                          </select>
                          <button onClick={() => setShowAddSubItem(false)} className="p-1 text-muted-foreground hover:text-foreground"><X className="w-3.5 h-3.5" /></button>
                        </div>
                        {/* Department selector for sub-assessment */}
                        {detail.departments.length > 0 && (
                          <div>
                            <p className="text-[10px] font-semibold text-muted-foreground uppercase mb-1">Departments <span className="text-[9px] font-normal">(leave empty = all depts)</span></p>
                            <div className="flex flex-wrap gap-1">
                              {detail.departments.map(d => (
                                <button key={d} type="button" onClick={() => setNewSubItem(prev => ({ ...prev, departments: prev.departments.includes(d) ? prev.departments.filter(x => x !== d) : [...prev.departments, d] }))}
                                  className={cn("px-2 py-1 rounded-md text-[10px] font-medium border transition-all",
                                    newSubItem.departments.includes(d) ? "bg-indigo-600 text-white border-indigo-600" : "bg-white text-muted-foreground border-border hover:border-indigo-300")}>
                                  {d}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                        <input value={newSubItem.description} onChange={e => setNewSubItem({ ...newSubItem, description: e.target.value })} placeholder="Description (optional)"
                          className="w-full px-2.5 py-1.5 bg-white border border-border rounded-lg text-xs focus:outline-none" />
                        <div className="flex items-center gap-2 flex-wrap">
                          <label className="flex items-center gap-1.5 text-xs">
                            <input type="checkbox" checked={newSubItem.is24Hours} onChange={e => setNewSubItem({ ...newSubItem, is24Hours: e.target.checked, startTime: "", endTime: "" })}
                              className="rounded border-border" />
                            <span className="font-medium text-emerald-700">24 Hours</span>
                          </label>
                          {!newSubItem.is24Hours && (
                            <>
                              <input type="date" value={newSubItem.scheduleDate} onChange={e => setNewSubItem({ ...newSubItem, scheduleDate: e.target.value })}
                                className="px-2 py-1.5 bg-white border border-border rounded-lg text-xs focus:outline-none" />
                              <input value={newSubItem.startTime} onChange={e => setNewSubItem({ ...newSubItem, startTime: e.target.value })} placeholder="10:00 AM"
                                className="px-2 py-1.5 bg-white border border-border rounded-lg text-xs focus:outline-none w-24" />
                              <input value={newSubItem.endTime} onChange={e => setNewSubItem({ ...newSubItem, endTime: e.target.value })} placeholder="12:00 PM"
                                className="px-2 py-1.5 bg-white border border-border rounded-lg text-xs focus:outline-none w-24" />
                            </>
                          )}
                        </div>
                        <div>
                          <p className="text-[10px] font-semibold text-muted-foreground uppercase mb-1">Links</p>
                          {newSubItem.links.map((l, li) => (
                            <div key={li} className="flex items-center gap-1.5 mb-1">
                              <input value={l.title} onChange={e => { const n = [...newSubItem.links]; n[li] = { ...n[li], title: e.target.value }; setNewSubItem({ ...newSubItem, links: n }); }} placeholder="Link title"
                                className="flex-1 px-2 py-1.5 bg-white border border-border rounded-lg text-xs focus:outline-none" />
                              <input value={l.url} onChange={e => { const n = [...newSubItem.links]; n[li] = { ...n[li], url: e.target.value }; setNewSubItem({ ...newSubItem, links: n }); }} placeholder="https://..."
                                className="flex-[2] px-2 py-1.5 bg-white border border-border rounded-lg text-xs focus:outline-none" />
                              {newSubItem.links.length > 1 && (
                                <button onClick={() => setNewSubItem({ ...newSubItem, links: newSubItem.links.filter((_, j) => j !== li) })} className="p-0.5 text-red-400 hover:text-red-600"><X className="w-3 h-3" /></button>
                              )}
                            </div>
                          ))}
                          <button onClick={() => setNewSubItem({ ...newSubItem, links: [...newSubItem.links, { title: "", url: "", platform: "custom" }] })}
                            className="mt-1 text-[10px] text-indigo-600 font-medium hover:text-indigo-700 flex items-center gap-0.5"><Plus className="w-2.5 h-2.5" /> Add link</button>
                        </div>
                        <button disabled={!newSubItem.title.trim()} onClick={async () => {
                          try {
                            await adminApi.addAssessmentSubItem(detail.id, {
                              title: newSubItem.title.trim(), type: newSubItem.type,
                              description: newSubItem.description.trim() || undefined,
                              scheduleDate: newSubItem.scheduleDate || undefined,
                              startTime: newSubItem.is24Hours ? undefined : (newSubItem.startTime || undefined),
                              endTime: newSubItem.is24Hours ? undefined : (newSubItem.endTime || undefined),
                              is24Hours: newSubItem.is24Hours,
                              departments: newSubItem.departments.length > 0 ? newSubItem.departments : undefined,
                              links: newSubItem.links.filter(l => l.title.trim() && l.url.trim()),
                            });
                            showToast("success", "Sub-assessment added"); setShowAddSubItem(false);
                            setNewSubItem({ title: "", type: "aptitude", description: "", scheduleDate: "", startTime: "", endTime: "", is24Hours: false, departments: [], links: [{ title: "", url: "", platform: "custom" }] });
                            fetchDetail(detail.id);
                          } catch { showToast("error", "Failed to add sub-assessment"); }
                        }} className="px-3 py-1.5 bg-violet-600 text-white rounded-lg text-xs font-medium hover:bg-violet-700 transition-colors disabled:opacity-50">
                          Add Sub-Assessment
                        </button>
                      </div>
                    )}
                  </div>
                  ); })()}

                  {(() => { const filteredSchedules = selectedDepts.length > 0 ? detail.schedules.filter(s => s.departments.some(d => selectedDepts.includes(d))) : detail.schedules; return (
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                        <Calendar className="w-4 h-4" /> Batch Schedule ({filteredSchedules.length}){selectedDepts.length > 0 && <span className="text-xs text-indigo-500 font-normal ml-1">· {selectedDepts.join(", ")}</span>}
                      </h3>
                      <button onClick={() => setShowAddBatch(!showAddBatch)} className="text-xs text-blue-600 font-medium hover:text-blue-700 flex items-center gap-0.5">
                        <Plus className="w-3 h-3" /> Add Batch{selectedDepts.length > 0 ? ` (${selectedDepts.join(", ")})` : ""}
                      </button>
                    </div>
                    {filteredSchedules.length > 0 && (
                      <div className="space-y-2 mb-2">
                        {filteredSchedules.map(s => (
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
                    )}
                    {!showAddBatch && filteredSchedules.length === 0 && <p className="text-sm text-muted-foreground">No batch schedules{selectedDepts.length > 0 ? ` for ${selectedDepts.join(", ")}` : ""} — click "Add Batch" to create.</p>}
                    {showAddBatch && (
                      <div className="p-3 bg-blue-50/40 rounded-xl border border-blue-100 space-y-2 mt-2">
                        <div className="flex items-center gap-2">
                          <input value={newBatch.batchLabel} onChange={e => setNewBatch({ ...newBatch, batchLabel: e.target.value })} placeholder="Batch name (e.g. Batch 1)"
                            className="flex-1 px-2.5 py-1.5 bg-white border border-border rounded-lg text-sm focus:outline-none" />
                          <button onClick={() => setShowAddBatch(false)} className="p-1 text-muted-foreground hover:text-foreground"><X className="w-3.5 h-3.5" /></button>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-semibold text-blue-600 whitespace-nowrap">USN Range:</span>
                          <input type="number" value={newBatch.usnStart} onChange={e => setNewBatch({ ...newBatch, usnStart: e.target.value })} placeholder="From (e.g. 1)"
                            className="w-24 px-2 py-1.5 bg-white border border-border rounded-lg text-xs focus:outline-none" />
                          <span className="text-xs text-muted-foreground">to</span>
                          <input type="number" value={newBatch.usnEnd} onChange={e => setNewBatch({ ...newBatch, usnEnd: e.target.value })} placeholder="To (e.g. 100)"
                            className="w-24 px-2 py-1.5 bg-white border border-border rounded-lg text-xs focus:outline-none" />
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                          <input type="date" value={newBatch.scheduleDate} onChange={e => setNewBatch({ ...newBatch, scheduleDate: e.target.value })}
                            className="px-2 py-1.5 bg-white border border-border rounded-lg text-xs focus:outline-none" />
                          <input value={newBatch.startTime} onChange={e => setNewBatch({ ...newBatch, startTime: e.target.value })} placeholder="10:00 AM"
                            className="px-2 py-1.5 bg-white border border-border rounded-lg text-xs focus:outline-none" />
                          <input value={newBatch.endTime} onChange={e => setNewBatch({ ...newBatch, endTime: e.target.value })} placeholder="12:00 PM"
                            className="px-2 py-1.5 bg-white border border-border rounded-lg text-xs focus:outline-none" />
                          <input value={newBatch.venue} onChange={e => setNewBatch({ ...newBatch, venue: e.target.value })} placeholder="Venue"
                            className="px-2 py-1.5 bg-white border border-border rounded-lg text-xs focus:outline-none" />
                        </div>
                        <button disabled={!newBatch.batchLabel.trim() || !newBatch.scheduleDate} onClick={async () => {
                          try {
                            await adminApi.addAssessmentSchedule(detail.id, {
                              batchLabel: newBatch.batchLabel, departments: selectedDepts.length > 0 ? selectedDepts : detail.departments,
                              scheduleDate: newBatch.scheduleDate, startTime: newBatch.startTime || undefined,
                              endTime: newBatch.endTime || undefined, venue: newBatch.venue || undefined,
                              usnStart: newBatch.usnStart ? parseInt(newBatch.usnStart) : undefined,
                              usnEnd: newBatch.usnEnd ? parseInt(newBatch.usnEnd) : undefined,
                            });
                            showToast("success", "Batch added"); setShowAddBatch(false);
                            setNewBatch({ batchLabel: "", scheduleDate: "", startTime: "", endTime: "", venue: "", usnStart: "", usnEnd: "" });
                            fetchDetail(detail.id);
                          } catch { showToast("error", "Failed to add batch"); }
                        }} className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-medium hover:bg-blue-700 transition-colors disabled:opacity-50">
                          Add Batch
                        </button>
                      </div>
                    )}
                  </div>
                  ); })()}

                  {/* Links */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-sm font-semibold text-foreground flex items-center gap-1.5"><Link2 className="w-4 h-4" /> Test Links ({detail.links.length})</h3>
                      <button onClick={() => setShowAddLink(!showAddLink)} className="text-xs text-indigo-600 font-medium hover:text-indigo-700 flex items-center gap-0.5">
                        <Plus className="w-3 h-3" /> Add Link
                      </button>
                    </div>
                    {detail.links.length > 0 && (
                      <div className="space-y-2 mb-2">
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
                    {!showAddLink && detail.links.length === 0 && <p className="text-sm text-muted-foreground">No links added — click "Add Link" to add test URLs.</p>}
                    {showAddLink && (
                      <div className="p-3 bg-indigo-50/40 rounded-xl border border-indigo-100 space-y-2 mt-2">
                        <div className="flex items-center gap-2">
                          <input value={newLink.title} onChange={e => setNewLink({ ...newLink, title: e.target.value })} placeholder="Link title (e.g. HackerRank Test)"
                            className="flex-1 px-2.5 py-1.5 bg-white border border-border rounded-lg text-sm focus:outline-none" />
                          <button onClick={() => setShowAddLink(false)} className="p-1 text-muted-foreground hover:text-foreground"><X className="w-3.5 h-3.5" /></button>
                        </div>
                        <input value={newLink.url} onChange={e => setNewLink({ ...newLink, url: e.target.value })} placeholder="https://..."
                          className="w-full px-2.5 py-1.5 bg-white border border-border rounded-lg text-sm focus:outline-none" />
                        <div className="flex items-center gap-2">
                          <select value={newLink.platform} onChange={e => setNewLink({ ...newLink, platform: e.target.value })}
                            className="px-2 py-1.5 bg-white border border-border rounded-lg text-xs focus:outline-none">
                            {PLATFORMS.map(p => <option key={p} value={p}>{p}</option>)}
                          </select>
                          <button disabled={!newLink.title.trim() || !newLink.url.trim()} onClick={async () => {
                            try {
                              await adminApi.addAssessmentLink(detail.id, newLink);
                              showToast("success", "Link added"); setShowAddLink(false);
                              setNewLink({ title: "", url: "", platform: "custom" });
                              fetchDetail(detail.id);
                            } catch { showToast("error", "Failed to add link"); }
                          }} className="px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50">
                            Add Link
                          </button>
                        </div>
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
                    <h3 className="text-sm font-semibold text-foreground mb-1 flex items-center gap-1.5"><KeyRound className="w-4 h-4 text-amber-600" /> Upload Test Credentials</h3>
                    <p className="text-[11px] text-muted-foreground mb-3">Upload <strong>.xlsx or .csv</strong> with columns: <strong>Email, Password</strong> (LoginID optional). Re-uploading <strong>replaces</strong> all previous credentials.</p>
                    <input ref={credFileRef} type="file" accept=".csv,.txt,.xlsx,.xls" className="hidden"
                      onChange={async e => {
                        if (!e.target.files?.[0]) return;
                        const file = e.target.files[0];
                        setPreviewLoading(true);
                        try {
                          let rows: Record<string, string>[] = [];
                          const isExcel = file.name.endsWith('.xlsx') || file.name.endsWith('.xls');
                          if (isExcel) {
                            const buf = await file.arrayBuffer();
                            const wb = XLSX.read(buf, { type: 'array' });
                            const ws = wb.Sheets[wb.SheetNames[0]];
                            const jsonData = XLSX.utils.sheet_to_json<Record<string, string>>(ws, { defval: '' });
                            rows = jsonData.map(r => {
                              const norm: Record<string, string> = {};
                              for (const [k, v] of Object.entries(r)) norm[k.trim().toLowerCase()] = String(v).trim();
                              return norm;
                            });
                          } else {
                            const text = await file.text();
                            const lines = text.split('\n').filter(l => l.trim());
                            if (lines.length < 2) { showToast('error', 'File must have header + data rows'); setPreviewLoading(false); return; }
                            const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
                            rows = lines.slice(1).map(line => {
                              const cols = line.split(',').map(c => c.trim().replace(/^"|"$/g, ''));
                              const obj: Record<string, string> = {};
                              headers.forEach((h, i) => { obj[h] = cols[i] || ''; });
                              return obj;
                            });
                          }
                          if (rows.length === 0) { showToast('error', 'No data rows found'); setPreviewLoading(false); return; }
                          const keys = Object.keys(rows[0]);
                          const emailKey = keys.find(k => ['email', 'mail', 'student_email'].includes(k));
                          const loginKey = keys.find(k => ['loginid', 'login_id', 'id', 'username', 'user_id'].includes(k));
                          const passKey = keys.find(k => ['password', 'pass', 'pwd', 'login_password'].includes(k));
                          if (!emailKey || !passKey) {
                            showToast('error', 'File must have Email and Password columns'); setPreviewLoading(false); return;
                          }
                          const creds = rows.map(r => ({
                            email: r[emailKey] || '', loginId: loginKey ? (r[loginKey] || r[emailKey] || '') : (r[emailKey] || ''), password: r[passKey] || '',
                          })).filter(c => c.email && c.password);
                          const res = await adminApi.previewAssessmentCredentials(detail.id, creds) as any;
                          setCredPreview({ ...res.data, parsedCreds: creds });
                        } catch { showToast('error', 'Failed to parse file'); } finally { setPreviewLoading(false); e.target.value = ''; }
                      }} />
                    {!credPreview && (
                      <button onClick={() => credFileRef.current?.click()} disabled={previewLoading}
                        className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-lg text-sm font-medium shadow-md hover:shadow-lg transition-all disabled:opacity-50">
                        {previewLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <KeyRound className="w-4 h-4" />}
                        {previewLoading ? "Parsing..." : "Upload Credentials (.xlsx / .csv)"}
                      </button>
                    )}
                    {credPreview && (
                      <div className="space-y-3">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="px-3 py-1.5 rounded-lg text-xs font-bold bg-emerald-100 text-emerald-700">{credPreview.matched.length} Matched</span>
                          <span className="px-3 py-1.5 rounded-lg text-xs font-bold bg-red-100 text-red-600">{credPreview.notFound.length} Not Found</span>
                          <span className="px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-100 text-slate-600">{credPreview.total} Total</span>
                          {credPreview.existingCount > 0 && (
                            <span className="px-3 py-1.5 rounded-lg text-xs font-bold bg-amber-100 text-amber-700">⚠ {credPreview.existingCount} existing will be replaced</span>
                          )}
                        </div>
                        {credPreview.matched.length > 0 && (
                          <div>
                            <p className="text-xs font-semibold text-emerald-700 mb-1">✓ Matched Students (first 20)</p>
                            <div className="overflow-x-auto max-h-48 overflow-y-auto rounded-lg border border-emerald-100">
                              <table className="w-full text-xs">
                                <thead className="bg-emerald-50 sticky top-0"><tr>
                                  <th className="text-left px-2 py-1.5 font-semibold">USN</th>
                                  <th className="text-left px-2 py-1.5 font-semibold">Name</th>
                                  <th className="text-left px-2 py-1.5 font-semibold">Dept</th>
                                  <th className="text-left px-2 py-1.5 font-semibold">Password</th>
                                </tr></thead>
                                <tbody>{credPreview.matched.slice(0, 20).map((m: any, i: number) => (
                                  <tr key={i} className="border-t border-emerald-50">
                                    <td className="px-2 py-1 font-mono text-[11px]">{m.usn}</td>
                                    <td className="px-2 py-1 truncate max-w-[120px]">{m.name}</td>
                                    <td className="px-2 py-1">{m.department}</td>
                                    <td className="px-2 py-1 font-mono text-[11px]">{m.password}</td>
                                  </tr>
                                ))}</tbody>
                              </table>
                            </div>
                          </div>
                        )}
                        {credPreview.notFound.length > 0 && (
                          <div>
                            <p className="text-xs font-semibold text-red-600 mb-1">✗ Not Found (first 10)</p>
                            <div className="overflow-x-auto max-h-32 overflow-y-auto rounded-lg border border-red-100">
                              <table className="w-full text-xs">
                                <thead className="bg-red-50 sticky top-0"><tr>
                                  <th className="text-left px-2 py-1.5 font-semibold">Email</th>
                                  <th className="text-left px-2 py-1.5 font-semibold">Password</th>
                                </tr></thead>
                                <tbody>{credPreview.notFound.slice(0, 10).map((m: any, i: number) => (
                                  <tr key={i} className="border-t border-red-50">
                                    <td className="px-2 py-1 text-[11px]">{m.email}</td>
                                    <td className="px-2 py-1 font-mono text-[11px]">{m.password}</td>
                                  </tr>
                                ))}</tbody>
                              </table>
                            </div>
                          </div>
                        )}
                        <div className="flex items-center gap-2 pt-1">
                          <button disabled={uploadingCreds || credPreview.matched.length === 0} onClick={async () => {
                            setUploadingCreds(true);
                            try {
                              const res = await adminApi.uploadAssessmentCredentials(detail.id, credPreview.parsedCreds) as any;
                              showToast('success', `Saved: ${res?.data?.matched || 0} credentials (previous erased)`);
                              setCredPreview(null);
                            } catch { showToast('error', 'Failed to save credentials'); } finally { setUploadingCreds(false); }
                          }} className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-xs font-semibold hover:bg-emerald-700 transition-colors disabled:opacity-50 flex items-center gap-1.5">
                            {uploadingCreds ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                            {uploadingCreds ? "Saving..." : `Confirm & Save ${credPreview.matched.length} Credentials`}
                          </button>
                          <button onClick={() => setCredPreview(null)} className="px-4 py-2 bg-white text-muted-foreground rounded-lg text-xs font-semibold border hover:bg-slate-50 transition-colors">
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Submissions Table */}
                  {(() => { const filteredSubs = selectedDepts.length > 0 ? detail.submissions.filter(s => !!s.department && selectedDepts.includes(s.department)) : detail.submissions; return (
                  <div>
                    <h3 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-1.5"><Users className="w-4 h-4" /> Submissions ({filteredSubs.length}){selectedDepts.length > 0 && <span className="text-xs text-indigo-500 font-normal ml-1">· {selectedDepts.join(", ")}</span>}</h3>
                    {filteredSubs.length === 0 ? (
                      <p className="text-sm text-muted-foreground">No students{selectedDepts.length > 0 ? ` in ${selectedDepts.join(", ")}` : ""}. Publish to assign.</p>
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
                            {filteredSubs.map(s => (
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
                  ); })()}

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

// ─── Simplified Create Modal ─
function CreateModal({ departments, onClose, onCreated }: {
  departments: { id: string; code: string; name: string }[];
  onClose: () => void; onCreated: () => void;
}) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [selectedTypes, setSelectedTypes] = useState<string[]>(["aptitude"]);
  const [selectedDepts, setSelectedDepts] = useState<string[]>([]);
  const [status, setStatus] = useState("active");
  const [saving, setSaving] = useState(false);

  const toggleType = (t: string) => setSelectedTypes(prev => prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t]);
  const toggleDept = (code: string) => setSelectedDepts(prev => prev.includes(code) ? prev.filter(d => d !== code) : [...prev, code]);

  const handleSave = async () => {
    if (!title.trim()) return;
    setSaving(true);
    try {
      await adminApi.createAssessment({
        title: title.trim(), description: description.trim() || undefined,
        types: selectedTypes, departments: selectedDepts, status,
      });
      onCreated();
    } catch { /* */ } finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-start justify-center pt-4 sm:pt-8 px-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
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

          {/* Status */}
          <div>
            <label className="text-xs font-semibold text-muted-foreground block mb-1">Status</label>
            <select value={status} onChange={e => setStatus(e.target.value)} className="w-full px-3 py-2.5 bg-white border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30">
              <option value="draft">Draft</option>
              <option value="active">Active</option>
            </select>
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

          <p className="text-[11px] text-muted-foreground text-center">You can add links, sub-assessments, batches, and credentials after creating.</p>

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

