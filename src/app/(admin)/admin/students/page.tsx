"use client";

import Header from "@/components/layout/Header";
import { getStatusConfig, cn, getInitials } from "@/lib/utils";
import { adminApi } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import {
  Search, Download, Upload, Loader2, AlertCircle, CheckCircle2, X,
  FileSpreadsheet, UserPlus, GraduationCap, Hash, Building2,
  ChevronDown, ChevronRight, Users, Trash2, BookOpen, ChevronLeft,
  Mail, Pencil, Check
} from "lucide-react";
import { useState, useEffect, useCallback, useRef, useMemo } from "react";

interface StudentRecord {
  id: string; usn: string; fullName: string; department: string;
  email?: string | null;
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

interface BatchRecord {
  id: string; name: string; department: string; year: number;
}

export default function AdminStudentsPage() {
  const { user } = useAuth();
  
  // Base metadata loaded at startup
  const [allBatches, setAllBatches] = useState<BatchRecord[]>([]);
  const [DEPARTMENTS, setDepartments] = useState<string[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  // Search & filter controls
  const [searchQuery, setSearchQuery] = useState("");
  const [deptFilter, setDeptFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchResults, setSearchResults] = useState<StudentRecord[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);

  // Department pagination state (15 departments per page)
  const [departmentPage, setDepartmentPage] = useState(1);
  const deptPageSize = 15;

  // Active student pagination state inside opened batches
  const [expandedBatches, setExpandedBatches] = useState<Set<string>>(new Set());
  const [batchStudents, setBatchStudents] = useState<Record<string, StudentRecord[]>>({});
  const [batchStudentPages, setBatchStudentPages] = useState<Record<string, number>>({});
  const [batchStudentTotals, setBatchStudentTotals] = useState<Record<string, number>>({});
  const [batchStudentLoading, setBatchStudentLoading] = useState<Record<string, boolean>>({});

  // Upload modal state
  const [showUpload, setShowUpload] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<BulkResult | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadDept, setUploadDept] = useState("");
  const [uploadBatch, setUploadBatch] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Edit email state
  const [editingEmailId, setEditingEmailId] = useState<string | null>(null);
  const [editEmailValue, setEditEmailValue] = useState("");
  const [savingEmail, setSavingEmail] = useState(false);
  const [emailToast, setEmailToast] = useState<{ type: "success" | "error"; msg: string } | null>(null);

  // Single add student modal state
  const [showAddStudent, setShowAddStudent] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [createResult, setCreateResult] = useState<{ student: { usn: string; fullName: string; email: string; department: string }; temporaryPassword: string } | null>(null);
  const [addForm, setAddForm] = useState({
    usn: "", email: "", fullName: "", department: "", batch: "",
    phone: "", gender: "", category: "", cgpa: "", tenthPercent: "", twelfthPercent: "", backlogs: "",
  });

  const setAddField = (key: string, val: string) => setAddForm(p => ({ ...p, [key]: val }));

  // Main loader for metadata
  const fetchMetadata = async () => {
    setIsLoading(true);
    try {
      const [batchesRes, deptsRes, studentsRes] = await Promise.all([
        adminApi.listBatches(),
        adminApi.listDepartments(),
        adminApi.listStudents({ page: 1, limit: 1 }),
      ]);
      if (batchesRes.data) setAllBatches(batchesRes.data as BatchRecord[]);
      if (deptsRes.data) {
        setDepartments((deptsRes.data as Array<{ code: string }>).map(d => d.code));
      }
      if (studentsRes.meta) {
        setTotalCount(studentsRes.meta.total);
      }
    } catch (err) {
      console.error("Failed to load student dashboard metadata:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMetadata();
  }, []);

  // Debounced search for unified search view
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    const delayDebounce = setTimeout(async () => {
      setSearchLoading(true);
      try {
        const res = await adminApi.listStudents({
          search: searchQuery,
          limit: 100,
          status: statusFilter !== "all" ? statusFilter : undefined,
        });
        if (res.data) {
          setSearchResults(res.data as StudentRecord[]);
        }
      } catch (err) {
        console.error("Failed to search students:", err);
      } finally {
        setSearchLoading(false);
      }
    }, 400);

    return () => clearTimeout(delayDebounce);
  }, [searchQuery, statusFilter]);

  // Fetch students for a specific batch and department with 50 limit and USN order
  const fetchStudentsForBatch = useCallback(async (batchName: string, deptCode: string, studentPage: number) => {
    setBatchStudentLoading(prev => ({ ...prev, [batchName]: true }));
    try {
      const res = await adminApi.listStudents({
        page: studentPage,
        limit: 50,
        batch: batchName,
        department: deptCode,
        search: searchQuery || undefined,
        status: statusFilter !== "all" ? statusFilter : undefined,
      });
      if (res.data) {
        setBatchStudents(prev => ({ ...prev, [batchName]: res.data as StudentRecord[] }));
      }
      if (res.meta) {
        setBatchStudentTotals(prev => ({ ...prev, [batchName]: res.meta!.total }));
      }
    } catch (err) {
      console.error(`Failed to fetch students for batch ${batchName}:`, err);
    } finally {
      setBatchStudentLoading(prev => ({ ...prev, [batchName]: false }));
    }
  }, [searchQuery, statusFilter]);

  // Re-fetch all active open batches when filter or search changes
  useEffect(() => {
    expandedBatches.forEach(batchName => {
      const batchObj = allBatches.find(b => b.name === batchName);
      if (batchObj) {
        fetchStudentsForBatch(batchName, batchObj.department, batchStudentPages[batchName] || 1);
      }
    });
  }, [searchQuery, statusFilter, expandedBatches, allBatches, fetchStudentsForBatch, batchStudentPages]);

  // Handle batch toggling and trigger page 1 fetch
  const toggleBatch = (batchName: string, deptCode: string) => {
    setExpandedBatches(prev => {
      const next = new Set(prev);
      if (next.has(batchName)) {
        next.delete(batchName);
      } else {
        next.add(batchName);
        setBatchStudentPages(pages => ({ ...pages, [batchName]: 1 }));
        fetchStudentsForBatch(batchName, deptCode, 1);
      }
      return next;
    });
  };

  const handleStudentPageChange = (batchName: string, deptCode: string, newPage: number) => {
    setBatchStudentPages(pages => ({ ...pages, [batchName]: newPage }));
    fetchStudentsForBatch(batchName, deptCode, newPage);
  };

  // Derive department list with pagination
  const filteredDepts = useMemo(() => {
    if (deptFilter === "all") return DEPARTMENTS;
    return DEPARTMENTS.filter(d => d === deptFilter);
  }, [DEPARTMENTS, deptFilter]);

  const totalDeptPages = Math.ceil(filteredDepts.length / deptPageSize);
  
  const paginatedDepts = useMemo(() => {
    return filteredDepts.slice((departmentPage - 1) * deptPageSize, departmentPage * deptPageSize);
  }, [filteredDepts, departmentPage, deptPageSize]);

  // Filter change helper
  const handleDeptFilterChange = (val: string) => {
    setDeptFilter(val);
    setDepartmentPage(1);
  };

  // Bulk Upload logic
  const batchYearsForDept = useMemo(() => {
    if (!uploadDept) return [...new Set(allBatches.map(b => String(b.year)))].sort((a, b) => b.localeCompare(a));
    return [...new Set(allBatches.filter(b => b.department === uploadDept).map(b => String(b.year)))].sort((a, b) => b.localeCompare(a));
  }, [uploadDept, allBatches]);

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
      if (res.data) {
        setUploadResult(res.data as BulkResult);
        fetchMetadata();
      }
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "Upload failed");
    } finally { setIsUploading(false); }
  };

  const resetUpload = () => {
    setShowUpload(false); setUploadResult(null); setUploadError(null);
    setSelectedFile(null); setUploadDept(""); setUploadBatch("");
  };

  // Add Single Student logic
  const resetAddStudent = () => {
    setShowAddStudent(false); setCreateResult(null); setCreateError(null);
    setAddForm({ usn: "", email: "", fullName: "", department: "", batch: "", phone: "", gender: "", category: "", cgpa: "", tenthPercent: "", twelfthPercent: "", backlogs: "" });
  };

  const handleCreateStudent = async () => {
    if (!addForm.usn || !addForm.email || !addForm.fullName || !addForm.department) {
      setCreateError("USN, Email, Full Name, and Department are required");
      return;
    }
    setIsCreating(true);
    setCreateError(null);
    try {
      const payload: Record<string, unknown> = {
        usn: addForm.usn,
        email: addForm.email,
        fullName: addForm.fullName,
        department: addForm.department,
      };
      if (addForm.batch) payload.batch = addForm.batch;
      if (addForm.phone) payload.phone = addForm.phone;
      if (addForm.gender) payload.gender = addForm.gender;
      if (addForm.category) payload.category = addForm.category;
      if (addForm.cgpa) payload.cgpa = parseFloat(addForm.cgpa);
      if (addForm.tenthPercent) payload.tenthPercent = parseFloat(addForm.tenthPercent);
      if (addForm.twelfthPercent) payload.twelfthPercent = parseFloat(addForm.twelfthPercent);
      if (addForm.backlogs) payload.backlogs = parseInt(addForm.backlogs);

      const res = await adminApi.createStudent(payload as Parameters<typeof adminApi.createStudent>[0]);
      if ((res as any).data) {
        setCreateResult((res as any).data);
        fetchMetadata();
      }
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : "Failed to create student");
    } finally {
      setIsCreating(false);
    }
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

  const addBatchYearsForDept = useMemo(() => {
    if (!addForm.department) return [...new Set(allBatches.map(b => String(b.year)))].sort((a, b) => b.localeCompare(a));
    return [...new Set(allBatches.filter(b => b.department === addForm.department).map(b => String(b.year)))].sort((a, b) => b.localeCompare(a));
  }, [addForm.department, allBatches]);

  const passwordPreview = uploadDept ? `${uploadDept}${uploadBatch}` : "DEPT+BATCH";
  const addPasswordPreview = addForm.department ? `${addForm.department}${addForm.batch || new Date().getFullYear()}` : "DEPT+BATCH";

  // Handle email update
  const handleSaveEmail = async (studentId: string) => {
    if (!editEmailValue.trim()) return;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(editEmailValue.trim())) {
      setEmailToast({ type: "error", msg: "Please enter a valid email address" });
      setTimeout(() => setEmailToast(null), 3000);
      return;
    }
    setSavingEmail(true);
    try {
      await adminApi.updateStudent(studentId, { email: editEmailValue.trim().toLowerCase() });
      // Update local state for both search results and batch students
      const newEmail = editEmailValue.trim().toLowerCase();
      setSearchResults(prev => prev.map(s => s.id === studentId ? { ...s, email: newEmail } : s));
      setBatchStudents(prev => {
        const updated = { ...prev };
        for (const key of Object.keys(updated)) {
          updated[key] = updated[key].map(s => s.id === studentId ? { ...s, email: newEmail } : s);
        }
        return updated;
      });
      setEditingEmailId(null);
      setEmailToast({ type: "success", msg: `Email updated to ${newEmail}` });
      setTimeout(() => setEmailToast(null), 3000);
    } catch (err) {
      setEmailToast({ type: "error", msg: err instanceof Error ? err.message : "Failed to update email" });
      setTimeout(() => setEmailToast(null), 4000);
    } finally {
      setSavingEmail(false);
    }
  };

  return (
    <div className="page-enter">
      <Header userName={user?.email || "Admin"} userRole="Admin"
        greeting="Students" subtitle={`${totalCount} students registered`} />

      {/* Email toast notification */}
      {emailToast && (
        <div className={cn(
          "fixed top-4 right-4 z-[100] flex items-center gap-2 px-4 py-3 rounded-xl shadow-lg text-sm font-medium animate-in slide-in-from-top-2",
          emailToast.type === "success" ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-red-50 text-red-700 border border-red-200"
        )}>
          {emailToast.type === "success" ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          {emailToast.msg}
          <button onClick={() => setEmailToast(null)} className="ml-2 p-0.5 rounded hover:bg-black/5"><X className="w-3 h-3" /></button>
        </div>
      )}

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
            <select value={deptFilter} onChange={(e) => handleDeptFilterChange(e.target.value)}
              className="px-3 py-2 rounded-xl border border-border bg-white text-xs sm:text-sm text-foreground outline-none cursor-pointer flex-shrink-0">
              <option value="all">All Depts</option>
              {DEPARTMENTS.map((d) => <option key={d} value={d}>{d}</option>)}
            </select>

            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
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
              <button onClick={() => setShowAddStudent(true)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-indigo-200 bg-indigo-50 text-indigo-700 text-xs sm:text-sm font-semibold hover:bg-indigo-100 transition-colors">
                <UserPlus className="w-3.5 h-3.5" /><span className="hidden sm:inline">Add Student</span>
              </button>
              <button onClick={() => setShowUpload(true)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white text-xs sm:text-sm font-semibold shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/30 transition-all">
                <Upload className="w-3.5 h-3.5" /> Bulk Upload
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
                        <select value={uploadDept} onChange={(e) => { setUploadDept(e.target.value); setUploadBatch(""); }}
                          className={cn("w-full px-3 py-2.5 rounded-lg border text-sm outline-none bg-white transition-colors",
                            !uploadDept ? "border-amber-300" : "border-border")}>
                          <option value="">Select dept...</option>
                          {DEPARTMENTS.map((d) => <option key={d} value={d}>{d}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="block text-[10px] font-semibold text-muted-foreground uppercase mb-1.5">Batch Year *</label>
                        <select value={uploadBatch} onChange={(e) => setUploadBatch(e.target.value)}
                          className={cn("w-full px-3 py-2.5 rounded-lg border text-sm outline-none bg-white transition-colors",
                            !uploadBatch ? "border-amber-300" : "border-border")}>
                          <option value="">Select year...</option>
                          {batchYearsForDept.map((y) => <option key={y} value={y}>{y}</option>)}
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
                          <p className="text-xs text-muted-foreground">or click to browse (.xlsx · max 10MB · up to 500 students)</p>
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
                    <button onClick={handleUploadSubmit} disabled={isUploading || !selectedFile || !uploadDept || !uploadBatch}
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

        {/* ─── Add Single Student Modal ─────────────── */}
        {showAddStudent && (
          <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 p-0 sm:p-6">
            <div className="bg-white rounded-t-2xl sm:rounded-2xl p-5 sm:p-6 w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-50 to-violet-50 flex items-center justify-center">
                    <UserPlus className="w-5 h-5 text-indigo-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-foreground">Add Single Student</h3>
                    <p className="text-xs text-muted-foreground">Create one student account directly</p>
                  </div>
                </div>
                <button onClick={resetAddStudent} className="w-8 h-8 rounded-lg hover:bg-muted flex items-center justify-center">
                  <X className="w-4 h-4" />
                </button>
              </div>

              {!createResult ? (
                <div className="space-y-4">
                  {/* Required fields */}
                  <div className="p-4 rounded-xl bg-gradient-to-r from-indigo-50 to-violet-50 border border-indigo-100">
                    <p className="text-xs font-semibold text-indigo-700 uppercase mb-3 flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5" /> Required Information
                    </p>
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[10px] font-semibold text-muted-foreground uppercase mb-1.5">USN *</label>
                          <input value={addForm.usn} onChange={(e) => setAddField("usn", e.target.value)}
                            placeholder="4MT22CS001" className={cn("w-full px-3 py-2.5 rounded-lg border text-sm outline-none bg-white transition-colors",
                              !addForm.usn ? "border-amber-300" : "border-border")} />
                        </div>
                        <div>
                          <label className="block text-[10px] font-semibold text-muted-foreground uppercase mb-1.5">Email *</label>
                          <input value={addForm.email} onChange={(e) => setAddField("email", e.target.value)} type="email"
                            placeholder="john@mitm.ac.in" className={cn("w-full px-3 py-2.5 rounded-lg border text-sm outline-none bg-white transition-colors",
                              !addForm.email ? "border-amber-300" : "border-border")} />
                        </div>
                      </div>
                      <div>
                        <label className="block text-[10px] font-semibold text-muted-foreground uppercase mb-1.5">Full Name *</label>
                        <input value={addForm.fullName} onChange={(e) => setAddField("fullName", e.target.value)}
                          placeholder="John Doe" className={cn("w-full px-3 py-2.5 rounded-lg border text-sm outline-none bg-white transition-colors",
                            !addForm.fullName ? "border-amber-300" : "border-border")} />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[10px] font-semibold text-muted-foreground uppercase mb-1.5">Department *</label>
                          <select value={addForm.department} onChange={(e) => { setAddField("department", e.target.value); setAddField("batch", ""); }}
                            className={cn("w-full px-3 py-2.5 rounded-lg border text-sm outline-none bg-white transition-colors",
                              !addForm.department ? "border-amber-300" : "border-border")}>
                            <option value="">Select dept...</option>
                            {DEPARTMENTS.map((d) => <option key={d} value={d}>{d}</option>)}
                          </select>
                        </div>
                        <div>
                          <label className="block text-[10px] font-semibold text-muted-foreground uppercase mb-1.5">Batch Year</label>
                          <select value={addForm.batch} onChange={(e) => setAddField("batch", e.target.value)}
                            className="w-full px-3 py-2.5 rounded-lg border border-border text-sm outline-none bg-white">
                            <option value="">Select year...</option>
                            {addBatchYearsForDept.map((y) => <option key={y} value={y}>{y}</option>)}
                          </select>
                        </div>
                      </div>
                      {addForm.department && (
                        <div className="flex items-center gap-2 p-2.5 rounded-lg bg-white border border-indigo-200">
                          <Hash className="w-3.5 h-3.5 text-indigo-500" />
                          <p className="text-xs text-foreground">
                            Password: <code className="font-bold text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded">{addPasswordPreview}</code>
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Optional fields */}
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase mb-2 flex items-center gap-1.5">
                      <GraduationCap className="w-3.5 h-3.5" /> Optional Details
                    </p>
                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <label className="block text-[10px] font-semibold text-muted-foreground uppercase mb-1.5">Phone</label>
                        <input value={addForm.phone} onChange={(e) => setAddField("phone", e.target.value)}
                          placeholder="9876543210" className="w-full px-3 py-2.5 rounded-lg border border-border text-sm outline-none bg-white" />
                      </div>
                      <div>
                        <label className="block text-[10px] font-semibold text-muted-foreground uppercase mb-1.5">Gender</label>
                        <select value={addForm.gender} onChange={(e) => setAddField("gender", e.target.value)}
                          className="w-full px-3 py-2.5 rounded-lg border border-border text-sm outline-none bg-white">
                          <option value="">Select...</option>
                          <option value="Male">Male</option>
                          <option value="Female">Female</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-[10px] font-semibold text-muted-foreground uppercase mb-1.5">Category</label>
                        <select value={addForm.category} onChange={(e) => setAddField("category", e.target.value)}
                          className="w-full px-3 py-2.5 rounded-lg border border-border text-sm outline-none bg-white">
                          <option value="">Select...</option>
                          {["General", "OBC", "SC", "ST", "EWS"].map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                      </div>
                    </div>
                    <div className="grid grid-cols-4 gap-3 mt-3">
                      <div>
                        <label className="block text-[10px] font-semibold text-muted-foreground uppercase mb-1.5">CGPA</label>
                        <input value={addForm.cgpa} onChange={(e) => setAddField("cgpa", e.target.value)} type="number" step="0.01"
                          placeholder="8.5" className="w-full px-3 py-2.5 rounded-lg border border-border text-sm outline-none bg-white" />
                      </div>
                      <div>
                        <label className="block text-[10px] font-semibold text-muted-foreground uppercase mb-1.5">10th %</label>
                        <input value={addForm.tenthPercent} onChange={(e) => setAddField("tenthPercent", e.target.value)} type="number" step="0.1"
                          placeholder="92.4" className="w-full px-3 py-2.5 rounded-lg border border-border text-sm outline-none bg-white" />
                      </div>
                      <div>
                        <label className="block text-[10px] font-semibold text-muted-foreground uppercase mb-1.5">12th %</label>
                        <input value={addForm.twelfthPercent} onChange={(e) => setAddField("twelfthPercent", e.target.value)} type="number" step="0.1"
                          placeholder="88.6" className="w-full px-3 py-2.5 rounded-lg border border-border text-sm outline-none bg-white" />
                      </div>
                      <div>
                        <label className="block text-[10px] font-semibold text-muted-foreground uppercase mb-1.5">Backlogs</label>
                        <input value={addForm.backlogs} onChange={(e) => setAddField("backlogs", e.target.value)} type="number"
                          placeholder="0" className="w-full px-3 py-2.5 rounded-lg border border-border text-sm outline-none bg-white" />
                      </div>
                    </div>
                  </div>

                  {createError && (
                    <div className="flex items-center gap-2 p-3 rounded-lg bg-red-50 border border-red-200">
                      <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                      <p className="text-sm text-red-600">{createError}</p>
                    </div>
                  )}

                  <button onClick={handleCreateStudent} disabled={isCreating || !addForm.usn || !addForm.email || !addForm.fullName || !addForm.department}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white text-sm font-semibold shadow-lg shadow-indigo-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all">
                    {isCreating ? <><Loader2 className="w-4 h-4 animate-spin" /> Creating...</> :
                      <><UserPlus className="w-4 h-4" /> Create Student</>}
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Success result */}
                  <div className="text-center py-4">
                    <div className="w-14 h-14 rounded-full bg-emerald-50 flex items-center justify-center mx-auto mb-3">
                      <CheckCircle2 className="w-7 h-7 text-emerald-500" />
                    </div>
                    <h4 className="text-base font-bold text-foreground">Student Created!</h4>
                    <p className="text-xs text-muted-foreground mt-1">Account is ready for login</p>
                  </div>

                  <div className="p-4 rounded-xl bg-muted/40 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Name</span>
                      <span className="font-medium text-foreground">{createResult.student.fullName}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">USN</span>
                      <span className="font-medium text-foreground">{createResult.student.usn}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Email</span>
                      <span className="font-medium text-foreground">{createResult.student.email}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Department</span>
                      <span className="font-medium text-foreground">{createResult.student.department}</span>
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-green-50 border border-green-200">
                    <p className="text-xs font-semibold text-green-700 uppercase mb-1">Login Credentials</p>
                    <div className="flex justify-between text-sm">
                      <span className="text-green-600">Email</span>
                      <code className="font-bold text-green-800">{createResult.student.email}</code>
                    </div>
                    <div className="flex justify-between text-sm mt-1">
                      <span className="text-green-600">Password</span>
                      <code className="font-bold text-green-800">{createResult.temporaryPassword}</code>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button onClick={() => { setCreateResult(null); setAddForm({ usn: "", email: "", fullName: "", department: addForm.department, batch: addForm.batch, phone: "", gender: "", category: "", cgpa: "", tenthPercent: "", twelfthPercent: "", backlogs: "" }); }}
                      className="flex-1 px-4 py-2.5 rounded-xl border border-border text-sm font-medium text-foreground hover:bg-muted/50 transition-colors flex items-center justify-center gap-1.5">
                      <UserPlus className="w-3.5 h-3.5" /> Add Another
                    </button>
                    <button onClick={resetAddStudent}
                      className="flex-1 px-4 py-2.5 rounded-xl bg-foreground text-white text-sm font-medium hover:bg-foreground/90 transition-colors">
                      Done
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ─── Main Nested Layout: Departments → Batches → Students ─── */}
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="i-card p-5">
                <div className="h-6 w-48 bg-muted animate-pulse rounded mb-4" />
                <div className="space-y-3">
                  <div className="h-12 rounded-lg bg-muted animate-pulse" />
                  <div className="h-12 rounded-lg bg-muted animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        ) : searchQuery.trim() ? (
          <div className="i-card p-5 border border-border bg-white shadow-sm rounded-2xl">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-border/50">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-indigo-50 flex items-center justify-center">
                  <Search className="w-5 h-5 text-indigo-600" />
                </div>
                <div>
                  <h3 className="text-base font-black text-foreground">Search Results</h3>
                  <p className="text-xs text-muted-foreground">
                    Found {searchResults.length} student{searchResults.length !== 1 ? 's' : ''} matching &quot;{searchQuery}&quot;
                  </p>
                </div>
              </div>
              {searchLoading && <Loader2 className="w-5 h-5 animate-spin text-indigo-600" />}
            </div>

            {searchLoading && searchResults.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 gap-3">
                <Loader2 className="w-7 h-7 text-indigo-600 animate-spin" />
                <p className="text-sm text-muted-foreground">Searching students...</p>
              </div>
            ) : searchResults.length === 0 ? (
              <div className="text-center py-12">
                <Users className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
                <h4 className="text-sm font-semibold text-foreground">No students found</h4>
                <p className="text-xs text-muted-foreground mt-1">Try another search term or filter.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {searchResults.map(student => {
                  const statusCfg = getStatusConfig(student.placementStatus);
                  const completionPct = student.profileComplete ? 100 : 35;
                  return (
                    <div key={student.id} className="p-4 rounded-xl border border-border/60 bg-white hover:shadow-md transition-all group relative">
                      {/* Delete Student */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (deletingId === student.id) return;
                          if (!confirm(`Delete ${student.fullName} (${student.usn})? This cannot be undone.`)) return;
                          setDeletingId(student.id);
                          adminApi.deleteStudent(student.id)
                            .then(() => {
                              setSearchResults(prev => prev.filter(s => s.id !== student.id));
                              fetchMetadata();
                            })
                            .catch(() => alert('Failed to delete student'))
                            .finally(() => setDeletingId(null));
                        }}
                        disabled={deletingId === student.id}
                        className="absolute top-3 right-3 w-7 h-7 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 hover:bg-red-50 text-muted-foreground hover:text-red-500 transition-all disabled:opacity-50"
                        title="Delete student"
                      >
                        {deletingId === student.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                      </button>

                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-9 h-9 rounded-lg bg-indigo-50 flex items-center justify-center text-xs font-bold text-indigo-700">
                            {getInitials(student.fullName)}
                          </div>
                          <div>
                            <h5 className="text-xs sm:text-sm font-semibold text-foreground truncate max-w-[130px] group-hover:text-indigo-600 transition-colors">
                              {student.fullName}
                            </h5>
                            <p className="text-[10px] text-muted-foreground font-mono">{student.usn}</p>
                          </div>
                        </div>
                        <span className={cn("text-[9px] font-semibold px-2 py-0.5 rounded-full mr-8", statusCfg.bg, statusCfg.color)}>
                          {statusCfg.label}
                        </span>
                      </div>

                      <div className="grid grid-cols-3 gap-1.5 mb-3">
                        <div className="text-center p-1 rounded-lg bg-muted/40">
                          <p className="text-xs font-bold text-foreground">{student.cgpa ?? '-'}</p>
                          <p className="text-[9px] text-muted-foreground">CGPA</p>
                        </div>
                        <div className="text-center p-1 rounded-lg bg-muted/40">
                          <p className="text-xs font-bold text-foreground">{student.tenthPercent ?? '-'}%</p>
                          <p className="text-[9px] text-muted-foreground">10th</p>
                        </div>
                        <div className="text-center p-1 rounded-lg bg-muted/40">
                          <p className="text-xs font-bold text-foreground">{student.twelfthPercent ?? '-'}%</p>
                          <p className="text-[9px] text-muted-foreground">12th</p>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 mb-2 text-[10px] text-muted-foreground">
                        <span className="font-semibold bg-indigo-50 text-indigo-700 px-1.5 py-0.5 rounded">{student.department}</span>
                        {student.batchName && <span className="bg-gray-100 text-gray-700 px-1.5 py-0.5 rounded">{student.batchName}</span>}
                        <span>Sem {student.semester}</span>
                        {student.backlogs > 0 && <span className="text-red-500 font-semibold">{student.backlogs} Backlog</span>}
                      </div>

                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
                          <div className={cn("h-full rounded-full", completionPct === 100 ? "bg-emerald-500" : "bg-amber-500")} style={{ width: `${completionPct}%` }} />
                        </div>
                        <span className="text-[9px] font-medium text-muted-foreground">{completionPct}%</span>
                      </div>

                      {/* Email — editable */}
                      <div className="mt-2 pt-2 border-t border-border/30">
                        {editingEmailId === student.id ? (
                          <div className="flex items-center gap-1">
                            <Mail className="w-3 h-3 text-muted-foreground flex-shrink-0" />
                            <input
                              type="email"
                              value={editEmailValue}
                              onChange={(e) => setEditEmailValue(e.target.value)}
                              onKeyDown={(e) => { if (e.key === 'Enter') handleSaveEmail(student.id); if (e.key === 'Escape') setEditingEmailId(null); }}
                              autoFocus
                              className="flex-1 text-[10px] px-1.5 py-1 rounded border border-indigo-300 outline-none bg-indigo-50/50 focus:border-indigo-500 min-w-0"
                              placeholder="new@email.com"
                            />
                            <button
                              onClick={() => handleSaveEmail(student.id)}
                              disabled={savingEmail}
                              className="w-6 h-6 rounded-md flex items-center justify-center bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50 transition-colors"
                            >
                              {savingEmail ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
                            </button>
                            <button
                              onClick={() => setEditingEmailId(null)}
                              className="w-6 h-6 rounded-md flex items-center justify-center hover:bg-muted text-muted-foreground"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1 group/email">
                            <Mail className="w-3 h-3 text-muted-foreground flex-shrink-0" />
                            <span className="text-[10px] text-muted-foreground truncate flex-1">{student.email || 'No email'}</span>
                            <button
                              onClick={(e) => { e.stopPropagation(); setEditingEmailId(student.id); setEditEmailValue(student.email || ''); }}
                              className="w-5 h-5 rounded flex items-center justify-center opacity-0 group-hover/email:opacity-100 hover:bg-indigo-50 text-muted-foreground hover:text-indigo-600 transition-all"
                              title="Change login email"
                            >
                              <Pencil className="w-2.5 h-2.5" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ) : filteredDepts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
              <BookOpen className="w-7 h-7 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-1">No departments found</h3>
            <p className="text-sm text-muted-foreground">Select another department filter or add students first.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {paginatedDepts.map(deptCode => {
              // Get batches belonging to this department
              const deptBatches = allBatches.filter(b => b.department === deptCode)
                .sort((a, b) => b.name.localeCompare(a.name));

              return (
                <div key={deptCode} className="i-card p-5 border border-border bg-white shadow-sm rounded-2xl">
                  {/* Department Title */}
                  <div className="flex items-center gap-3 mb-4 pb-3 border-b border-border/50">
                    <div className="w-9 h-9 rounded-xl bg-indigo-50 flex items-center justify-center">
                      <BookOpen className="w-5 h-5 text-indigo-600" />
                    </div>
                    <div>
                      <h3 className="text-base font-black text-foreground">Department: {deptCode}</h3>
                      <p className="text-[10px] sm:text-xs text-muted-foreground">
                        {deptBatches.length} batch{deptBatches.length !== 1 ? 'es' : ''} registered
                      </p>
                    </div>
                  </div>

                  {deptBatches.length === 0 ? (
                    <p className="text-xs text-muted-foreground italic px-2">No active batches created in this department yet.</p>
                  ) : (
                    <div className="space-y-3">
                      {deptBatches.map(batch => {
                        const batchOpen = expandedBatches.has(batch.name);
                        const studentsInBatch = batchStudents[batch.name] || [];
                        const studentsPage = batchStudentPages[batch.name] || 1;
                        const studentsTotal = batchStudentTotals[batch.name] || 0;
                        const totalStudentPages = Math.ceil(studentsTotal / 50);
                        const isStudentListLoading = batchStudentLoading[batch.name] || false;

                        return (
                          <div key={batch.id} className="border border-border/60 rounded-xl overflow-hidden shadow-sm hover:border-border transition-all bg-white/50">
                            {/* Batch Header */}
                            <button
                              onClick={() => toggleBatch(batch.name, deptCode)}
                              className="w-full flex items-center justify-between p-3.5 bg-muted/10 hover:bg-muted/30 transition-colors"
                            >
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-50 to-indigo-100 flex items-center justify-center">
                                  <GraduationCap className="w-4 h-4 text-indigo-600" />
                                </div>
                                <div className="text-left">
                                  <h4 className="text-xs sm:text-sm font-bold text-foreground">{batch.name}</h4>
                                  <p className="text-[10px] text-muted-foreground">Batch Year: {batch.year}</p>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                {batchOpen && isStudentListLoading && (
                                  <Loader2 className="w-3.5 h-3.5 animate-spin text-muted-foreground" />
                                )}
                                {batchOpen ? (
                                  <ChevronDown className="w-4 h-4 text-muted-foreground" />
                                ) : (
                                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                                )}
                              </div>
                            </button>

                            {/* Batch Student List */}
                            {batchOpen && (
                              <div className="p-4 sm:p-5 bg-white border-t border-border/50 space-y-4">
                                {isStudentListLoading && studentsInBatch.length === 0 ? (
                                  <div className="flex items-center justify-center py-10">
                                    <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
                                    <span className="text-xs text-muted-foreground ml-2 font-medium">Loading batch list...</span>
                                  </div>
                                ) : studentsInBatch.length === 0 ? (
                                  <div className="text-center py-6">
                                    <Users className="w-8 h-8 text-muted-foreground/60 mx-auto mb-2" />
                                    <p className="text-xs text-muted-foreground">No students in this batch match the search query.</p>
                                  </div>
                                ) : (
                                  <div className="space-y-4">
                                    {/* Student Card Grid */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3.5">
                                      {studentsInBatch.map(student => {
                                        const statusCfg = getStatusConfig(student.placementStatus);
                                        const completionPct = student.profileComplete ? 100 : 35;
                                        return (
                                          <div key={student.id} className="p-4 rounded-xl border border-border/60 bg-white hover:shadow-md transition-all group relative">
                                            {/* Delete Student */}
                                            <button
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                if (deletingId === student.id) return;
                                                if (!confirm(`Delete ${student.fullName} (${student.usn})? This cannot be undone.`)) return;
                                                setDeletingId(student.id);
                                                adminApi.deleteStudent(student.id)
                                                  .then(() => { fetchStudentsForBatch(batch.name, deptCode, studentsPage); fetchMetadata(); })
                                                  .catch(() => alert('Failed to delete student'))
                                                  .finally(() => setDeletingId(null));
                                              }}
                                              disabled={deletingId === student.id}
                                              className="absolute top-3 right-3 w-7 h-7 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 hover:bg-red-50 text-muted-foreground hover:text-red-500 transition-all disabled:opacity-50"
                                              title="Delete student"
                                            >
                                              {deletingId === student.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                                            </button>

                                            <div className="flex items-start justify-between mb-3">
                                              <div className="flex items-center gap-2.5">
                                                <div className="w-9 h-9 rounded-lg bg-indigo-50 flex items-center justify-center text-xs font-bold text-indigo-700">
                                                  {getInitials(student.fullName)}
                                                </div>
                                                <div>
                                                  <h5 className="text-xs sm:text-sm font-semibold text-foreground truncate max-w-[130px] group-hover:text-indigo-600 transition-colors">
                                                    {student.fullName}
                                                  </h5>
                                                  <p className="text-[10px] text-muted-foreground font-mono">{student.usn}</p>
                                                </div>
                                              </div>
                                              <span className={cn("text-[9px] font-semibold px-2 py-0.5 rounded-full mr-8", statusCfg.bg, statusCfg.color)}>
                                                {statusCfg.label}
                                              </span>
                                            </div>

                                            <div className="grid grid-cols-3 gap-1.5 mb-3">
                                              <div className="text-center p-1 rounded-lg bg-muted/40">
                                                <p className="text-xs font-bold text-foreground">{student.cgpa ?? '-'}</p>
                                                <p className="text-[9px] text-muted-foreground">CGPA</p>
                                              </div>
                                              <div className="text-center p-1 rounded-lg bg-muted/40">
                                                <p className="text-xs font-bold text-foreground">{student.tenthPercent ?? '-'}%</p>
                                                <p className="text-[9px] text-muted-foreground">10th</p>
                                              </div>
                                              <div className="text-center p-1 rounded-lg bg-muted/40">
                                                <p className="text-xs font-bold text-foreground">{student.twelfthPercent ?? '-'}%</p>
                                                <p className="text-[9px] text-muted-foreground">12th</p>
                                              </div>
                                            </div>

                                            <div className="flex items-center gap-2 mb-2">
                                              <span className="text-[10px] text-muted-foreground">Sem {student.semester}</span>
                                              {student.backlogs > 0 && <span className="text-[10px] text-red-500 font-semibold">{student.backlogs} Backlog</span>}
                                            </div>

                                            <div className="flex items-center gap-2">
                                              <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
                                                <div className={cn("h-full rounded-full", completionPct === 100 ? "bg-emerald-500" : "bg-amber-500")} style={{ width: `${completionPct}%` }} />
                                              </div>
                                              <span className="text-[9px] font-medium text-muted-foreground">{completionPct}%</span>
                                            </div>

                                            {/* Email — editable */}
                                            <div className="mt-2 pt-2 border-t border-border/30">
                                              {editingEmailId === student.id ? (
                                                <div className="flex items-center gap-1">
                                                  <Mail className="w-3 h-3 text-muted-foreground flex-shrink-0" />
                                                  <input
                                                    type="email"
                                                    value={editEmailValue}
                                                    onChange={(e) => setEditEmailValue(e.target.value)}
                                                    onKeyDown={(e) => { if (e.key === 'Enter') handleSaveEmail(student.id); if (e.key === 'Escape') setEditingEmailId(null); }}
                                                    autoFocus
                                                    className="flex-1 text-[10px] px-1.5 py-1 rounded border border-indigo-300 outline-none bg-indigo-50/50 focus:border-indigo-500 min-w-0"
                                                    placeholder="new@email.com"
                                                  />
                                                  <button
                                                    onClick={() => handleSaveEmail(student.id)}
                                                    disabled={savingEmail}
                                                    className="w-6 h-6 rounded-md flex items-center justify-center bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50 transition-colors"
                                                  >
                                                    {savingEmail ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
                                                  </button>
                                                  <button
                                                    onClick={() => setEditingEmailId(null)}
                                                    className="w-6 h-6 rounded-md flex items-center justify-center hover:bg-muted text-muted-foreground"
                                                  >
                                                    <X className="w-3 h-3" />
                                                  </button>
                                                </div>
                                              ) : (
                                                <div className="flex items-center gap-1 group/email">
                                                  <Mail className="w-3 h-3 text-muted-foreground flex-shrink-0" />
                                                  <span className="text-[10px] text-muted-foreground truncate flex-1">{student.email || 'No email'}</span>
                                                  <button
                                                    onClick={(e) => { e.stopPropagation(); setEditingEmailId(student.id); setEditEmailValue(student.email || ''); }}
                                                    className="w-5 h-5 rounded flex items-center justify-center opacity-0 group-hover/email:opacity-100 hover:bg-indigo-50 text-muted-foreground hover:text-indigo-600 transition-all"
                                                    title="Change login email"
                                                  >
                                                    <Pencil className="w-2.5 h-2.5" />
                                                  </button>
                                                </div>
                                              )}
                                            </div>
                                          </div>
                                        );
                                      })}
                                    </div>

                                    {/* Batch Student List Pagination Controls (50 limit) */}
                                    {totalStudentPages > 1 && (
                                      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-border/50">
                                        <p className="text-[11px] sm:text-xs text-muted-foreground">
                                          Showing students {((studentsPage - 1) * 50) + 1} - {Math.min(studentsPage * 50, studentsTotal)} of {studentsTotal}
                                        </p>
                                        <div className="flex items-center gap-1.5">
                                          <button
                                            onClick={() => handleStudentPageChange(batch.name, deptCode, Math.max(1, studentsPage - 1))}
                                            disabled={studentsPage === 1 || isStudentListLoading}
                                            className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold border border-border bg-white text-muted-foreground hover:bg-muted disabled:opacity-40"
                                          >
                                            <ChevronLeft className="w-3.5 h-3.5" />
                                          </button>
                                          <span className="text-xs font-semibold px-2 text-foreground">
                                            Page {studentsPage} of {totalStudentPages}
                                          </span>
                                          <button
                                            onClick={() => handleStudentPageChange(batch.name, deptCode, Math.min(totalStudentPages, studentsPage + 1))}
                                            disabled={studentsPage === totalStudentPages || isStudentListLoading}
                                            className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold border border-border bg-white text-muted-foreground hover:bg-muted disabled:opacity-40"
                                          >
                                            <ChevronRight className="w-3.5 h-3.5" />
                                          </button>
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                )}
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

            {/* Department level pagination controls (15 limit) */}
            {totalDeptPages > 1 && (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-border/50">
                <p className="text-xs sm:text-sm text-muted-foreground">
                  Showing departments {((departmentPage - 1) * deptPageSize) + 1} - {Math.min(departmentPage * deptPageSize, filteredDepts.length)} of {filteredDepts.length}
                </p>
                <div className="flex items-center gap-1">
                  <button onClick={() => setDepartmentPage(Math.max(1, departmentPage - 1))} disabled={departmentPage === 1}
                    className="w-9 h-9 rounded-lg text-sm font-semibold border border-border bg-white text-muted-foreground hover:bg-muted disabled:opacity-40 flex items-center justify-center">
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  {[...Array(totalDeptPages)].map((_, i) => {
                    const pageNum = i + 1;
                    return (
                      <button key={i} onClick={() => setDepartmentPage(pageNum)}
                        className={cn("w-9 h-9 rounded-lg text-xs sm:text-sm font-semibold transition-all border",
                          departmentPage === pageNum
                            ? "bg-foreground text-white border-foreground"
                            : "bg-white text-muted-foreground border-border hover:bg-muted")}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                  <button onClick={() => setDepartmentPage(Math.min(totalDeptPages, departmentPage + 1))} disabled={departmentPage === totalDeptPages}
                    className="w-9 h-9 rounded-lg text-sm font-semibold border border-border bg-white text-muted-foreground hover:bg-muted disabled:opacity-40 flex items-center justify-center">
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
