"use client";

import Header from "@/components/layout/Header";
import { getStatusConfig, cn, getInitials } from "@/lib/utils";
import { adminApi } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import {
  Search, Download, Upload, Loader2, AlertCircle, CheckCircle2, X,
  FileSpreadsheet, UserPlus, GraduationCap, Hash, Building2,
  ChevronDown, ChevronRight, Users,
} from "lucide-react";
import { useState, useEffect, useCallback, useRef, useMemo } from "react";

interface StudentRecord {
  id: string; usn: string; fullName: string; department: string;
  batchName?: string | null;
  cgpa: number | null; tenthPercent: number | null;
  twelfthPercent: number | null; backlogs: number; semester: number;
  placementStatus: string; profileComplete: boolean;
  profileData: { skills?: string[] };
}

interface BulkResult {
  total: number; created: number; skipped: number;
  errors: Array<{ row: number; usn: string; reason: string }>;
  credentials: Array<{ usn: string; email: string; temporaryPassword: string }>;
}

const DEPARTMENTS = ["CSE", "ISE", "ECE", "EEE", "MECH", "CIVIL", "AI&ML", "AI&DS"];
const BATCH_YEARS = (() => {
  const cur = new Date().getFullYear();
  return [cur, cur + 1, cur + 2, cur + 3].map(String);
})();

export default function AdminStudentsPage() {
  const { user } = useAuth();
  const [students, setStudents] = useState<StudentRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [deptFilter, setDeptFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [expandedBatches, setExpandedBatches] = useState<Set<string>>(new Set());
  const [expandedDepts, setExpandedDepts] = useState<Set<string>>(new Set());

  // Upload state
  const [showUpload, setShowUpload] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<BulkResult | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadDept, setUploadDept] = useState("");
  const [uploadBatch, setUploadBatch] = useState(BATCH_YEARS[0]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchStudents = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await adminApi.listStudents({
        page, limit: 100,
        search: searchQuery || undefined,
        department: deptFilter !== "all" ? deptFilter : undefined,
        status: statusFilter !== "all" ? statusFilter : undefined,
      });
      if (res.data) {
        setStudents(res.data as StudentRecord[]);
        const batches = new Set((res.data as StudentRecord[]).map(s => s.batchName || "Unassigned"));
        setExpandedBatches(batches);
        const depts = new Set((res.data as StudentRecord[]).map(s => `${s.batchName || "Unassigned"}__${s.department}`));
        setExpandedDepts(depts);
      }
      if (res.meta) setTotalCount(res.meta.total);
    } catch { /* empty */ } finally { setIsLoading(false); }
  }, [page, searchQuery, deptFilter, statusFilter]);

  useEffect(() => { fetchStudents(); }, [fetchStudents]);
  useEffect(() => { const t = setTimeout(() => setPage(1), 300); return () => clearTimeout(t); }, [searchQuery]);

  const toggleBatch = (b: string) => setExpandedBatches(prev => { const n = new Set(prev); n.has(b) ? n.delete(b) : n.add(b); return n; });
  const toggleDept = (key: string) => setExpandedDepts(prev => { const n = new Set(prev); n.has(key) ? n.delete(key) : n.add(key); return n; });

  const grouped = useMemo(() => {
    const map: Record<string, Record<string, StudentRecord[]>> = {};
    students.forEach(s => {
      const batch = s.batchName || "Unassigned";
      const dept = s.department || "Unknown";
      if (!map[batch]) map[batch] = {};
      if (!map[batch][dept]) map[batch][dept] = [];
      map[batch][dept].push(s);
    });
    return Object.entries(map).sort(([a], [b]) => b.localeCompare(a));
  }, [students]);

  const handleFileSelect = (file: File) => {
    setSelectedFile(file);
    setUploadError(null);
  };

  const handleUploadSubmit = async () => {
    if (!selectedFile) { setUploadError("Please select a file first"); return; }
    if (!uploadDept) { setUploadError("Please select a department"); return; }

    setIsUploading(true);
    setUploadError(null);
    try {
      const res = await adminApi.uploadStudents(selectedFile, uploadDept, uploadBatch);
      if (res.data) { setUploadResult(res.data as BulkResult); fetchStudents(); }
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "Upload failed");
    } finally { setIsUploading(false); }
  };

  const resetUpload = () => {
    setShowUpload(false); setUploadResult(null); setUploadError(null);
    setSelectedFile(null); setUploadDept(""); setUploadBatch(BATCH_YEARS[0]);
  };

  const handleDownloadTemplate = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/v1/admin/students/template`,
        { headers: token ? { Authorization: `Bearer ${token}` } : {} }
      );
      if (!res.ok) throw new Error('Download failed');
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = 'student_upload_template.xlsx';
      document.body.appendChild(a); a.click();
      window.URL.revokeObjectURL(url); document.body.removeChild(a);
    } catch { alert('Failed to download template.'); }
  };

  const totalPages = Math.ceil(totalCount / 12);
  const passwordPreview = uploadDept ? `${uploadDept}${uploadBatch}` : "DEPT+BATCH";

  return (
    <div className="page-enter">
      <Header userName={user?.email || "Admin"} userRole="Admin"
        greeting="Students" subtitle={`${totalCount} students registered`} />

      <div className="px-4 sm:px-6 md:px-8 pb-10 space-y-4 sm:space-y-6">
        {/* Action Bar */}
        <div className="space-y-3">
          <div className="flex items-center bg-white rounded-xl border border-border px-3 w-full">
            <Search className="w-4 h-4 text-muted-foreground flex-shrink-0" />
            <input type="text" placeholder="Search by name, USN..." value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 bg-transparent px-3 py-2.5 text-sm outline-none text-foreground placeholder:text-muted-foreground min-w-0" />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select value={deptFilter} onChange={(e) => { setDeptFilter(e.target.value); setPage(1); }}
              className="px-3 py-2 rounded-xl border border-border bg-white text-xs sm:text-sm text-foreground outline-none cursor-pointer flex-shrink-0">
              <option value="all">All Depts</option>
              {DEPARTMENTS.map((d) => <option key={d} value={d}>{d}</option>)}
            </select>

            <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
              className="px-3 py-2 rounded-xl border border-border bg-white text-xs sm:text-sm text-foreground outline-none cursor-pointer flex-shrink-0">
              <option value="all">All Status</option>
              <option value="none">Not Started</option>
              <option value="shortlisted">Shortlisted</option>
              <option value="interview_scheduled">Scheduled</option>
              <option value="offered">Offered</option>
              <option value="placed">Placed</option>
            </select>

            <div className="flex items-center gap-2 ml-auto">
              <button onClick={handleDownloadTemplate}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-border bg-white text-xs sm:text-sm font-medium text-foreground hover:bg-muted/50 transition-colors">
                <Download className="w-3.5 h-3.5" /><span className="hidden sm:inline">Template</span>
              </button>
              <button onClick={() => setShowUpload(true)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white text-xs sm:text-sm font-semibold shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/30 transition-all">
                <Upload className="w-3.5 h-3.5" /> Upload
              </button>
            </div>
          </div>
        </div>

        {/* ─── Upload Modal ───────────────────────────── */}
        {showUpload && (
          <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 p-0 sm:p-6">
            <div className="bg-white rounded-t-2xl sm:rounded-2xl p-5 sm:p-6 w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center">
                    <FileSpreadsheet className="w-5 h-5 text-indigo-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-foreground">Bulk Upload Students</h3>
                    <p className="text-xs text-muted-foreground">Upload Excel with USN & Email</p>
                  </div>
                </div>
                <button onClick={resetUpload} className="w-8 h-8 rounded-lg hover:bg-muted flex items-center justify-center">
                  <X className="w-4 h-4" />
                </button>
              </div>

              {!uploadResult ? (
                <div className="space-y-4">
                  {/* Step 1: Department & Batch */}
                  <div className="p-4 rounded-xl bg-gradient-to-r from-indigo-50 to-violet-50 border border-indigo-100">
                    <p className="text-xs font-semibold text-indigo-700 uppercase mb-3 flex items-center gap-1.5">
                      <Building2 className="w-3.5 h-3.5" /> Step 1 · Select Department & Batch
                    </p>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] font-semibold text-muted-foreground uppercase mb-1.5">Department *</label>
                        <select value={uploadDept} onChange={(e) => setUploadDept(e.target.value)}
                          className={cn("w-full px-3 py-2.5 rounded-lg border text-sm outline-none bg-white transition-colors",
                            !uploadDept ? "border-amber-300" : "border-border")}>
                          <option value="">Select dept...</option>
                          {DEPARTMENTS.map((d) => <option key={d} value={d}>{d}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="block text-[10px] font-semibold text-muted-foreground uppercase mb-1.5">Batch Year *</label>
                        <select value={uploadBatch} onChange={(e) => setUploadBatch(e.target.value)}
                          className="w-full px-3 py-2.5 rounded-lg border border-border text-sm outline-none bg-white">
                          {BATCH_YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
                        </select>
                      </div>
                    </div>
                    {uploadDept && (
                      <div className="mt-3 flex items-center gap-2 p-2.5 rounded-lg bg-white border border-indigo-200">
                        <Hash className="w-3.5 h-3.5 text-indigo-500" />
                        <p className="text-xs text-foreground">
                          Default password: <code className="font-bold text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded">{passwordPreview}</code>
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Step 2: File Upload */}
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase mb-2 flex items-center gap-1.5">
                      <GraduationCap className="w-3.5 h-3.5" /> Step 2 · Upload Excel File
                    </p>
                    <div className={cn(
                        "border-2 border-dashed rounded-xl p-6 text-center transition-all cursor-pointer",
                        selectedFile ? "border-emerald-300 bg-emerald-50/30" : "border-border hover:border-indigo-300 hover:bg-indigo-50/30"
                      )}
                      onClick={() => fileInputRef.current?.click()}
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={(e) => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) handleFileSelect(f); }}>
                      {selectedFile ? (
                        <div className="flex flex-col items-center gap-2">
                          <CheckCircle2 className="w-7 h-7 text-emerald-500" />
                          <p className="text-sm font-medium text-foreground">{selectedFile.name}</p>
                          <p className="text-xs text-muted-foreground">{(selectedFile.size / 1024).toFixed(1)} KB · Click to change</p>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center gap-2">
                          <Upload className="w-7 h-7 text-muted-foreground" />
                          <p className="text-sm font-medium text-foreground">Drop Excel file here</p>
                          <p className="text-xs text-muted-foreground">or click to browse (.xlsx · max 5MB)</p>
                        </div>
                      )}
                    </div>
                    <input ref={fileInputRef} type="file" accept=".xlsx,.xls" className="hidden"
                      onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFileSelect(f); }} />
                  </div>

                  {uploadError && (
                    <div className="flex items-center gap-2 p-3 rounded-lg bg-red-50 border border-red-200">
                      <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                      <p className="text-sm text-red-600">{uploadError}</p>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex flex-col gap-2">
                    <button onClick={handleUploadSubmit} disabled={isUploading || !selectedFile || !uploadDept}
                      className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white text-sm font-semibold shadow-lg shadow-indigo-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all">
                      {isUploading ? <><Loader2 className="w-4 h-4 animate-spin" /> Processing...</> :
                        <><Upload className="w-4 h-4" /> Upload Students</>}
                    </button>
                    <button onClick={handleDownloadTemplate}
                      className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-border text-sm font-medium text-foreground hover:bg-muted/50 transition-colors">
                      <Download className="w-4 h-4" /> Download Template
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Results summary */}
                  <div className="grid grid-cols-3 gap-3">
                    <div className="p-3 rounded-xl bg-green-50 text-center">
                      <p className="text-2xl font-bold text-green-600">{uploadResult.created}</p>
                      <p className="text-[10px] text-green-700 font-medium">Created</p>
                    </div>
                    <div className="p-3 rounded-xl bg-amber-50 text-center">
                      <p className="text-2xl font-bold text-amber-600">{uploadResult.skipped}</p>
                      <p className="text-[10px] text-amber-700 font-medium">Skipped</p>
                    </div>
                    <div className="p-3 rounded-xl bg-muted text-center">
                      <p className="text-2xl font-bold text-foreground">{uploadResult.total}</p>
                      <p className="text-[10px] text-muted-foreground font-medium">Total</p>
                    </div>
                  </div>

                  {uploadResult.errors.length > 0 && (
                    <div className="max-h-32 overflow-y-auto space-y-1">
                      {uploadResult.errors.map((err, i) => (
                        <div key={i} className="flex items-center gap-2 text-xs p-2 rounded bg-red-50">
                          <span className="font-medium text-red-600">Row {err.row}</span>
                          <span className="text-red-500">{err.usn}: {err.reason}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {uploadResult.credentials.length > 0 && (
                    <div className="p-3 rounded-xl bg-green-50 border border-green-200">
                      <div className="flex items-center gap-2 mb-2">
                        <CheckCircle2 className="w-4 h-4 text-green-600" />
                        <p className="text-sm font-medium text-green-700">Credentials Generated</p>
                      </div>
                      <p className="text-xs text-green-600">
                        {uploadResult.credentials.length} students · Password: <code className="font-bold">{passwordPreview}</code>
                      </p>
                    </div>
                  )}

                  <button onClick={resetUpload}
                    className="w-full px-4 py-2.5 rounded-xl bg-foreground text-white text-sm font-medium hover:bg-foreground/90 transition-colors">
                    Done
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Batch → Department Grouped View */}
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2].map(i => (
              <div key={i} className="i-card p-5">
                <div className="h-6 w-48 bg-muted animate-pulse rounded mb-4" />
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {[1, 2, 3].map(j => <div key={j} className="h-32 rounded-lg bg-muted animate-pulse" />)}
                </div>
              </div>
            ))}
          </div>
        ) : students.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
              <UserPlus className="w-7 h-7 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-1">No students found</h3>
            <p className="text-sm text-muted-foreground mb-4">Upload an Excel file to add students in bulk</p>
            <button onClick={() => setShowUpload(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-foreground text-white text-sm font-medium">
              <Upload className="w-4 h-4" /> Upload Excel
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {grouped.map(([batchName, deptMap]) => {
              const batchOpen = expandedBatches.has(batchName);
              const batchStudentCount = Object.values(deptMap).reduce((s, arr) => s + arr.length, 0);
              const deptCount = Object.keys(deptMap).length;
              return (
                <div key={batchName} className="i-card overflow-hidden">
                  {/* Batch Header */}
                  <button onClick={() => toggleBatch(batchName)}
                    className="w-full flex items-center justify-between p-4 sm:p-5 hover:bg-muted/20 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center">
                        <GraduationCap className="w-5 h-5 text-white" />
                      </div>
                      <div className="text-left">
                        <h3 className="text-sm sm:text-base font-bold text-foreground">Batch {batchName}</h3>
                        <p className="text-[10px] sm:text-xs text-muted-foreground">{deptCount} department{deptCount !== 1 ? 's' : ''} · {batchStudentCount} student{batchStudentCount !== 1 ? 's' : ''}</p>
                      </div>
                    </div>
                    {batchOpen ? <ChevronDown className="w-5 h-5 text-muted-foreground" /> : <ChevronRight className="w-5 h-5 text-muted-foreground" />}
                  </button>

                  {batchOpen && (
                    <div className="border-t border-border/50">
                      {Object.entries(deptMap).sort(([a], [b]) => a.localeCompare(b)).map(([dept, deptStudents]) => {
                        const deptKey = `${batchName}__${dept}`;
                        const deptOpen = expandedDepts.has(deptKey);
                        return (
                          <div key={deptKey}>
                            {/* Department Sub-header */}
                            <button onClick={() => toggleDept(deptKey)}
                              className="w-full flex items-center justify-between px-5 sm:px-6 py-3 bg-muted/20 hover:bg-muted/40 transition-colors border-b border-border/30">
                              <div className="flex items-center gap-2.5">
                                <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center">
                                  <Building2 className="w-3.5 h-3.5 text-blue-600" />
                                </div>
                                <span className="text-xs sm:text-sm font-semibold text-foreground">{dept}</span>
                                <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 border border-blue-200">
                                  {deptStudents.length} student{deptStudents.length !== 1 ? 's' : ''}
                                </span>
                              </div>
                              {deptOpen ? <ChevronDown className="w-4 h-4 text-muted-foreground" /> : <ChevronRight className="w-4 h-4 text-muted-foreground" />}
                            </button>

                            {deptOpen && (
                              <div className="p-4 sm:p-5">
                                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                                  {deptStudents.map(student => {
                                    const statusCfg = getStatusConfig(student.placementStatus);
                                    const completionPct = student.profileComplete ? 100 : 35;
                                    return (
                                      <div key={student.id} className="p-4 rounded-xl border border-border/60 bg-white hover:shadow-md transition-all group cursor-pointer">
                                        <div className="flex items-start justify-between mb-3">
                                          <div className="flex items-center gap-2.5">
                                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-100 to-violet-100 flex items-center justify-center text-xs font-bold text-indigo-700">
                                              {getInitials(student.fullName)}
                                            </div>
                                            <div>
                                              <h4 className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">{student.fullName}</h4>
                                              <p className="text-[10px] text-muted-foreground">{student.usn}</p>
                                            </div>
                                          </div>
                                          <span className={cn("text-[9px] font-semibold px-2 py-0.5 rounded-full", statusCfg.bg, statusCfg.color)}>{statusCfg.label}</span>
                                        </div>
                                        <div className="grid grid-cols-3 gap-2 mb-3">
                                          <div className="text-center p-1.5 rounded-lg bg-muted/40">
                                            <p className="text-sm font-bold text-foreground">{student.cgpa ?? '-'}</p>
                                            <p className="text-[9px] text-muted-foreground">CGPA</p>
                                          </div>
                                          <div className="text-center p-1.5 rounded-lg bg-muted/40">
                                            <p className="text-sm font-bold text-foreground">{student.tenthPercent ?? '-'}%</p>
                                            <p className="text-[9px] text-muted-foreground">10th</p>
                                          </div>
                                          <div className="text-center p-1.5 rounded-lg bg-muted/40">
                                            <p className="text-sm font-bold text-foreground">{student.twelfthPercent ?? '-'}%</p>
                                            <p className="text-[9px] text-muted-foreground">12th</p>
                                          </div>
                                        </div>
                                        <div className="flex items-center gap-2 mb-2">
                                          <span className="text-[10px] text-muted-foreground">Sem {student.semester}</span>
                                          {student.backlogs > 0 && <span className="text-[10px] text-red-500 font-medium">{student.backlogs} Backlog</span>}
                                        </div>
                                        <div className="flex items-center gap-2">
                                          <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
                                            <div className={cn("h-full rounded-full", completionPct === 100 ? "bg-emerald-500" : "bg-amber-500")} style={{ width: `${completionPct}%` }} />
                                          </div>
                                          <span className="text-[9px] font-medium text-muted-foreground">{completionPct}%</span>
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
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

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4">
            <p className="text-xs sm:text-sm text-muted-foreground">Page {page} of {totalPages} · {totalCount} total</p>
            <div className="flex items-center gap-1">
              <button onClick={() => setPage(Math.max(1, page - 1))} disabled={page === 1}
                className="w-9 h-9 rounded-lg text-sm font-medium text-muted-foreground hover:bg-muted disabled:opacity-40">←</button>
              {[...Array(Math.min(5, totalPages))].map((_, i) => {
                const pageNum = i + 1;
                return (
                  <button key={i} onClick={() => setPage(pageNum)}
                    className={cn("w-9 h-9 rounded-lg text-sm font-medium transition-colors",
                      page === pageNum ? "bg-foreground text-white" : "text-muted-foreground hover:bg-muted")}>
                    {pageNum}
                  </button>
                );
              })}
              <button onClick={() => setPage(Math.min(totalPages, page + 1))} disabled={page === totalPages}
                className="w-9 h-9 rounded-lg text-sm font-medium text-muted-foreground hover:bg-muted disabled:opacity-40">→</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
