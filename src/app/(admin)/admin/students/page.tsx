"use client";

import Header from "@/components/layout/Header";
import { getStatusConfig, cn, getInitials } from "@/lib/utils";
import { adminApi } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import {
  Search,
  Download,
  Upload,
  Eye,
  Loader2,
  AlertCircle,
  CheckCircle2,
  X,
  FileSpreadsheet,
  UserPlus,
} from "lucide-react";
import { useState, useEffect, useCallback, useRef } from "react";

interface StudentRecord {
  id: string;
  usn: string;
  fullName: string;
  department: string;
  cgpa: number | null;
  tenthPercent: number | null;
  twelfthPercent: number | null;
  backlogs: number;
  semester: number;
  placementStatus: string;
  profileComplete: boolean;
  profileData: { skills?: string[] };
}

interface BulkResult {
  total: number;
  created: number;
  skipped: number;
  errors: Array<{ row: number; usn: string; reason: string }>;
  credentials: Array<{ usn: string; email: string; temporaryPassword: string }>;
}

export default function AdminStudentsPage() {
  const { user } = useAuth();
  const [students, setStudents] = useState<StudentRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [deptFilter, setDeptFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Upload state
  const [showUpload, setShowUpload] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<BulkResult | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchStudents = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await adminApi.listStudents({
        page,
        limit: 12,
        search: searchQuery || undefined,
        department: deptFilter !== "all" ? deptFilter : undefined,
        status: statusFilter !== "all" ? statusFilter : undefined,
      });
      if (res.data) setStudents(res.data as StudentRecord[]);
      if (res.meta) setTotalCount(res.meta.total);
    } catch {
      // fallback to empty
    } finally {
      setIsLoading(false);
    }
  }, [page, searchQuery, deptFilter, statusFilter]);

  useEffect(() => {
    fetchStudents();
  }, [fetchStudents]);

  // Debounced search
  useEffect(() => {
    const timeout = setTimeout(() => {
      setPage(1);
    }, 300);
    return () => clearTimeout(timeout);
  }, [searchQuery]);

  const handleFileUpload = async (file: File) => {
    setIsUploading(true);
    setUploadError(null);
    setUploadResult(null);

    try {
      const res = await adminApi.uploadStudents(file);
      if (res.data) {
        setUploadResult(res.data as BulkResult);
        fetchStudents(); // Refresh list
      }
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setIsUploading(false);
    }
  };

  const handleDownloadTemplate = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/v1/admin/students/template`,
        {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        }
      );
      if (!res.ok) throw new Error('Download failed');
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'student_upload_template.xlsx';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch {
      alert('Failed to download template. Please try again.');
    }
  };

  const totalPages = Math.ceil(totalCount / 12);

  return (
    <div className="page-enter">
      <Header
        userName={user?.email || "Admin"}
        userRole="Admin"
        greeting="Students"
        subtitle={`${totalCount} students registered`}
      />

      <div className="px-4 sm:px-6 md:px-8 pb-10 space-y-4 sm:space-y-6">
        {/* Action Bar */}
        <div className="space-y-3">
          {/* Search */}
          <div className="flex items-center bg-white rounded-xl border border-border px-3 w-full">
            <Search className="w-4 h-4 text-muted-foreground flex-shrink-0" />
            <input
              type="text"
              placeholder="Search by name, USN..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 bg-transparent px-3 py-2.5 text-sm outline-none text-foreground placeholder:text-muted-foreground min-w-0"
            />
          </div>

          {/* Filters + Actions */}
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={deptFilter}
              onChange={(e) => { setDeptFilter(e.target.value); setPage(1); }}
              className="px-3 py-2 rounded-xl border border-border bg-white text-xs sm:text-sm text-foreground outline-none cursor-pointer flex-shrink-0"
            >
              <option value="all">All Depts</option>
              <option value="CSE">CSE</option>
              <option value="ISE">ISE</option>
              <option value="ECE">ECE</option>
              <option value="EEE">EEE</option>
              <option value="MECH">MECH</option>
            </select>

            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
              className="px-3 py-2 rounded-xl border border-border bg-white text-xs sm:text-sm text-foreground outline-none cursor-pointer flex-shrink-0"
            >
              <option value="all">All Status</option>
              <option value="none">Not Started</option>
              <option value="shortlisted">Shortlisted</option>
              <option value="interview_scheduled">Scheduled</option>
              <option value="offered">Offered</option>
              <option value="placed">Placed</option>
            </select>

            <div className="flex items-center gap-2 ml-auto">
              <button
                onClick={handleDownloadTemplate}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-border bg-white text-xs sm:text-sm font-medium text-foreground hover:bg-muted/50 transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Template</span>
              </button>
              <button
                onClick={() => setShowUpload(true)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white text-xs sm:text-sm font-semibold shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/30 transition-all"
              >
                <Upload className="w-3.5 h-3.5" />
                Upload
              </button>
            </div>
          </div>
        </div>

        {/* Upload Modal */}
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
                    <p className="text-xs text-muted-foreground">Upload an Excel file with student data</p>
                  </div>
                </div>
                <button onClick={() => { setShowUpload(false); setUploadResult(null); setUploadError(null); }} className="w-8 h-8 rounded-lg hover:bg-muted flex items-center justify-center">
                  <X className="w-4 h-4" />
                </button>
              </div>

              {!uploadResult ? (
                <>
                  <div
                    className="border-2 border-dashed border-border rounded-xl p-8 text-center hover:border-indigo-300 hover:bg-indigo-50/30 transition-all cursor-pointer"
                    onClick={() => fileInputRef.current?.click()}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => {
                      e.preventDefault();
                      const file = e.dataTransfer.files[0];
                      if (file) handleFileUpload(file);
                    }}
                  >
                    {isUploading ? (
                      <div className="flex flex-col items-center gap-3">
                        <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
                        <p className="text-sm font-medium text-foreground">Processing...</p>
                        <p className="text-xs text-muted-foreground">This may take a moment</p>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-3">
                        <Upload className="w-8 h-8 text-muted-foreground" />
                        <p className="text-sm font-medium text-foreground">Drop your Excel file here</p>
                        <p className="text-xs text-muted-foreground">or click to browse (.xlsx, .xls · max 5MB)</p>
                      </div>
                    )}
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".xlsx,.xls"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleFileUpload(file);
                    }}
                  />

                  {uploadError && (
                    <div className="flex items-center gap-2 p-3 rounded-lg bg-red-50 border border-red-200 mt-4">
                      <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                      <p className="text-sm text-red-600">{uploadError}</p>
                    </div>
                  )}

                  <button
                    onClick={handleDownloadTemplate}
                    className="w-full mt-4 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-border text-sm font-medium text-foreground hover:bg-muted/50 transition-colors"
                  >
                    <Download className="w-4 h-4" />
                    Download Template
                  </button>
                </>
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

                  {/* Errors */}
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

                  {/* Credentials */}
                  {uploadResult.credentials.length > 0 && (
                    <div className="p-3 rounded-xl bg-green-50 border border-green-200">
                      <div className="flex items-center gap-2 mb-2">
                        <CheckCircle2 className="w-4 h-4 text-green-600" />
                        <p className="text-sm font-medium text-green-700">Credentials Generated</p>
                      </div>
                      <p className="text-xs text-green-600">
                        {uploadResult.credentials.length} students can now login with their email and department-based password
                      </p>
                    </div>
                  )}

                  <button
                    onClick={() => { setShowUpload(false); setUploadResult(null); }}
                    className="w-full px-4 py-2.5 rounded-xl bg-foreground text-white text-sm font-medium hover:bg-foreground/90 transition-colors"
                  >
                    Done
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Student Cards Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="i-card p-5">
                <div className="flex items-start gap-3 mb-4">
                  <div className="w-12 h-12 rounded-2xl bg-muted animate-pulse" />
                  <div className="space-y-2 flex-1">
                    <div className="h-4 w-3/4 bg-muted animate-pulse rounded" />
                    <div className="h-3 w-1/2 bg-muted animate-pulse rounded" />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-3 mb-4">
                  {[1, 2, 3].map((j) => (
                    <div key={j} className="h-14 rounded-lg bg-muted animate-pulse" />
                  ))}
                </div>
                <div className="h-2 bg-muted animate-pulse rounded-full" />
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
            <button
              onClick={() => setShowUpload(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-foreground text-white text-sm font-medium"
            >
              <Upload className="w-4 h-4" /> Upload Excel
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {students.map((student) => {
              const statusCfg = getStatusConfig(student.placementStatus);
              const completionPct = student.profileComplete ? 100 : 35;

              return (
                <div key={student.id} className="i-card p-5 cursor-pointer group">
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
                      <p className="text-lg font-bold text-foreground">{student.cgpa ?? '-'}</p>
                      <p className="text-[10px] text-muted-foreground uppercase">CGPA</p>
                    </div>
                    <div className="text-center p-2 rounded-lg bg-muted/40">
                      <p className="text-lg font-bold text-foreground">{student.tenthPercent ?? '-'}%</p>
                      <p className="text-[10px] text-muted-foreground uppercase">10th</p>
                    </div>
                    <div className="text-center p-2 rounded-lg bg-muted/40">
                      <p className="text-lg font-bold text-foreground">{student.twelfthPercent ?? '-'}%</p>
                      <p className="text-[10px] text-muted-foreground uppercase">12th</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">{student.department}</span>
                    {student.backlogs > 0 && (
                      <>
                        <span className="text-muted-foreground">·</span>
                        <span className="text-[10px] text-red-500 font-medium">{student.backlogs} Backlog</span>
                      </>
                    )}
                  </div>

                  {/* Skills */}
                  <div className="flex flex-wrap gap-1.5 mb-4">
                    {(student.profileData?.skills || []).slice(0, 4).map((skill) => (
                      <span key={skill} className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-600 font-medium">
                        {skill}
                      </span>
                    ))}
                  </div>

                  {/* Profile completion */}
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
                      <div
                        className={cn("h-full rounded-full", completionPct === 100 ? "bg-emerald-500" : "bg-amber-500")}
                        style={{ width: `${completionPct}%` }}
                      />
                    </div>
                    <span className="text-[10px] font-medium text-muted-foreground">{completionPct}%</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4">
            <p className="text-xs sm:text-sm text-muted-foreground">
              Page {page} of {totalPages} · {totalCount} total
            </p>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page === 1}
                className="w-9 h-9 rounded-lg text-sm font-medium text-muted-foreground hover:bg-muted disabled:opacity-40"
              >
                ←
              </button>
              {[...Array(Math.min(5, totalPages))].map((_, i) => {
                const pageNum = i + 1;
                return (
                  <button
                    key={i}
                    onClick={() => setPage(pageNum)}
                    className={cn(
                      "w-9 h-9 rounded-lg text-sm font-medium transition-colors",
                      page === pageNum ? "bg-foreground text-white" : "text-muted-foreground hover:bg-muted"
                    )}
                  >
                    {pageNum}
                  </button>
                );
              })}
              <button
                onClick={() => setPage(Math.min(totalPages, page + 1))}
                disabled={page === totalPages}
                className="w-9 h-9 rounded-lg text-sm font-medium text-muted-foreground hover:bg-muted disabled:opacity-40"
              >
                →
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
