"use client";

import Header from "@/components/layout/Header";
import { cn } from "@/lib/utils";
import { adminApi } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import {
  Layers, Plus, ArrowUpCircle, Trash2, Loader2, AlertCircle,
  GraduationCap, Users, Calendar, Building2, X,
} from "lucide-react";
import { useState, useEffect, useCallback } from "react";

interface BatchRecord {
  id: string;
  name: string;
  department: string;
  year: number;
  currentSemester: number;
  studentCount: number;
  createdAt: string;
}

interface DeptInfo {
  code: string;
  type: 'UG' | 'PG' | 'DEGREE';
  totalSemesters: number;
}

export default function AdminBatchesPage() {
  const { user } = useAuth();
  const [batches, setBatches] = useState<BatchRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [DEPARTMENTS, setDepartments] = useState<string[]>([]);
  const [deptInfoMap, setDeptInfoMap] = useState<Record<string, DeptInfo>>({});

  // Create modal state
  const [showCreate, setShowCreate] = useState(false);
  const [createDept, setCreateDept] = useState("");
  const [createYear, setCreateYear] = useState(new Date().getFullYear());
  const [createSemester, setCreateSemester] = useState(1);
  const [isCreating, setIsCreating] = useState(false);

  // Promote state
  const [promotingId, setPromotingId] = useState<string | null>(null);

  // Toast
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const showToast = (type: "success" | "error", message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  };

  const fetchBatches = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await adminApi.listBatches();
      const data = (res.data || []) as BatchRecord[];
      setBatches(data);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to load batches";
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBatches();
    (async () => {
      try {
        const res = await adminApi.listDepartments();
        if (res.data) {
          const depts = res.data as Array<{ code: string; type?: string; totalSemesters?: number }>;
          setDepartments(depts.map(d => d.code));
          const map: Record<string, DeptInfo> = {};
          for (const d of depts) {
            map[d.code] = { code: d.code, type: (d.type as DeptInfo['type']) || 'UG', totalSemesters: d.totalSemesters || 8 };
          }
          setDeptInfoMap(map);
        }
      } catch { /* empty */ }
    })();
  }, [fetchBatches]);

  const handleCreate = async () => {
    if (!createDept) {
      showToast("error", "Please select a department");
      return;
    }
    setIsCreating(true);
    try {
      await adminApi.createBatch({
        department: createDept,
        year: createYear,
        currentSemester: createSemester,
      });
      showToast("success", `Batch ${createDept} ${createYear} created successfully`);
      setShowCreate(false);
      setCreateDept("");
      setCreateSemester(1);
      fetchBatches();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to create batch";
      showToast("error", msg);
    } finally {
      setIsCreating(false);
    }
  };

  const handlePromote = async (batch: BatchRecord) => {
    const maxSem = deptInfoMap[batch.department]?.totalSemesters || 8;
    if (batch.currentSemester >= maxSem) {
      showToast("error", `Batch already at maximum semester (${maxSem})`);
      return;
    }
    const confirmed = window.confirm(
      `Promote "${batch.name}" from Semester ${batch.currentSemester} → ${batch.currentSemester + 1}?\n\nThis will update all ${batch.studentCount} student(s) in this batch.`
    );
    if (!confirmed) return;

    setPromotingId(batch.id);
    try {
      const res = await adminApi.promoteBatch(batch.id);
      const d = res.data as { newSemester?: number; studentsUpdated?: number } | undefined;
      showToast(
        "success",
        `Promoted to Sem ${d?.newSemester}. ${d?.studentsUpdated} students updated.`
      );
      fetchBatches();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to promote batch";
      showToast("error", msg);
    } finally {
      setPromotingId(null);
    }
  };

  const handleDelete = async (batch: BatchRecord) => {
    const confirmed = window.confirm(
      `Delete batch "${batch.name}"?\n\nThis will unlink all ${batch.studentCount} students from this batch. This action cannot be undone.`
    );
    if (!confirmed) return;

    try {
      await adminApi.deleteBatch(batch.id);
      showToast("success", `Batch "${batch.name}" deleted`);
      fetchBatches();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to delete batch";
      showToast("error", msg);
    }
  };

  const getSemesterColor = (sem: number) => {
    if (sem <= 2) return "bg-emerald-50 text-emerald-600";
    if (sem <= 4) return "bg-blue-50 text-blue-600";
    if (sem <= 6) return "bg-amber-50 text-amber-600";
    return "bg-purple-50 text-purple-600";
  };

  const getSemesterBarColor = (sem: number) => {
    if (sem <= 2) return "bg-emerald-500";
    if (sem <= 4) return "bg-blue-500";
    if (sem <= 6) return "bg-amber-500";
    return "bg-purple-500";
  };

  return (
    <div className="page-enter">
      <Header userName={user?.email || "Admin"} userRole="Admin"
        greeting="Batch Management" subtitle="Create batches, assign semesters, and promote students" />

      {/* Toast */}
      {toast && (
        <div className="fixed top-6 right-6 z-50 animate-in slide-in-from-top-2 fade-in duration-300">
          <div className={cn(
            "flex items-center gap-3 px-5 py-3 rounded-xl border shadow-2xl",
            toast.type === "success"
              ? "bg-green-50 border-green-200 text-green-700"
              : "bg-red-50 border-red-200 text-red-700"
          )}>
            {toast.type === "success" ? <GraduationCap className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
            <span className="text-sm font-medium">{toast.message}</span>
            <button onClick={() => setToast(null)} className="ml-2 opacity-60 hover:opacity-100">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      <div className="px-4 sm:px-6 md:px-8 pb-10 space-y-4 sm:space-y-6">
        {/* Stats Row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: "Total Batches", value: batches.length, icon: Layers, color: "bg-purple-50 text-purple-600" },
            { label: "Departments", value: new Set(batches.map(b => b.department)).size, icon: Building2, color: "bg-blue-50 text-blue-600" },
            { label: "Total Students", value: batches.reduce((acc, b) => acc + (b.studentCount || 0), 0), icon: Users, color: "bg-green-50 text-green-600" },
            { label: "Avg Semester", value: batches.length > 0 ? (batches.reduce((acc, b) => acc + b.currentSemester, 0) / batches.length).toFixed(1) : "0", icon: GraduationCap, color: "bg-amber-50 text-amber-600" },
          ].map((card) => (
            <div key={card.label} className="i-card p-5 flex items-start gap-4">
              <div className={cn("w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0", card.color)}>
                <card.icon className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{card.label}</p>
                {isLoading ? (
                  <div className="h-8 w-16 rounded bg-muted animate-pulse mt-1" />
                ) : (
                  <p className="text-2xl font-bold text-foreground tracking-tight">
                    {card.value}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Create Button */}
        <div className="flex items-center justify-end">
          <button onClick={() => setShowCreate(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white text-xs sm:text-sm font-semibold shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/30 transition-all">
            <Plus className="w-3.5 h-3.5" /> Create Batch
          </button>
        </div>

        {/* Loading */}
        {isLoading && (
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
                <div className="h-2 bg-muted animate-pulse rounded-full" />
              </div>
            ))}
          </div>
        )}

        {/* Error */}
        {error && !isLoading && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mb-4">
              <AlertCircle className="w-7 h-7 text-red-500" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-1">{error}</h3>
            <button onClick={fetchBatches}
              className="mt-4 flex items-center gap-2 px-4 py-2.5 rounded-xl bg-foreground text-white text-sm font-medium">
              Retry
            </button>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && !error && batches.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
              <Layers className="w-7 h-7 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-1">No Batches Yet</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Create your first batch to start organizing students by department and semester.
            </p>
            <button onClick={() => setShowCreate(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-foreground text-white text-sm font-medium">
              <Plus className="w-4 h-4" /> Create Batch
            </button>
          </div>
        )}

        {/* Batch Cards Grid */}
        {!isLoading && !error && batches.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {batches.map((batch) => (
              <div key={batch.id} className="i-card p-5 cursor-pointer group">
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-100 to-violet-100 flex items-center justify-center text-sm font-bold text-indigo-700">
                      {batch.department.slice(0, 3)}
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
                        {batch.name}
                      </h4>
                      <p className="text-[11px] text-muted-foreground flex items-center gap-1">
                        <Calendar className="w-3 h-3" /> Batch {batch.year}
                      </p>
                    </div>
                  </div>
                  <span className={cn(
                    "text-[10px] font-semibold px-2.5 py-1 rounded-full",
                    getSemesterColor(batch.currentSemester)
                  )}>
                    Sem {batch.currentSemester}
                  </span>
                </div>

                {/* Stats Row */}
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className="text-center p-2 rounded-lg bg-muted/40">
                    <p className="text-lg font-bold text-foreground">{batch.studentCount || 0}</p>
                    <p className="text-[10px] text-muted-foreground uppercase">Students</p>
                  </div>
                  <div className="text-center p-2 rounded-lg bg-muted/40">
                    <p className="text-lg font-bold text-foreground">{batch.department}</p>
                    <p className="text-[10px] text-muted-foreground uppercase">Department</p>
                  </div>
                </div>

                {/* Semester Progress */}
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Semester Progress</span>
                    <span className="text-[10px] text-muted-foreground">{batch.currentSemester}/{deptInfoMap[batch.department]?.totalSemesters || 8}</span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-muted overflow-hidden">
                    <div
                      className={cn("h-full rounded-full transition-all duration-700", getSemesterBarColor(batch.currentSemester))}
                      style={{ width: `${(batch.currentSemester / (deptInfoMap[batch.department]?.totalSemesters || 8)) * 100}%` }}
                    />
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handlePromote(batch)}
                    disabled={promotingId === batch.id || batch.currentSemester >= (deptInfoMap[batch.department]?.totalSemesters || 8)}
                    className={cn(
                      "flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all",
                      batch.currentSemester >= (deptInfoMap[batch.department]?.totalSemesters || 8)
                        ? "bg-muted text-muted-foreground cursor-not-allowed"
                        : "bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/30"
                    )}
                  >
                    {promotingId === batch.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <ArrowUpCircle className="w-4 h-4" />
                    )}
                    {(deptInfoMap[batch.department]?.totalSemesters || 8) <= batch.currentSemester ? "Max Sem" : "Promote"}
                  </button>
                  <button
                    onClick={() => handleDelete(batch)}
                    className="flex items-center justify-center p-2.5 rounded-xl border border-border hover:bg-red-50 hover:border-red-200 hover:text-red-600 text-muted-foreground transition-all"
                    title="Delete Batch"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Batch Modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 p-0 sm:p-6">
          <div className="bg-white rounded-t-2xl sm:rounded-2xl p-5 sm:p-6 w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center">
                  <Layers className="w-5 h-5 text-indigo-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-foreground">Create New Batch</h3>
                  <p className="text-xs text-muted-foreground">Organize students by department & semester</p>
                </div>
              </div>
              <button onClick={() => setShowCreate(false)} className="w-8 h-8 rounded-lg hover:bg-muted flex items-center justify-center">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Department */}
              <div className="p-4 rounded-xl bg-gradient-to-r from-indigo-50 to-violet-50 border border-indigo-100">
                <p className="text-xs font-semibold text-indigo-700 uppercase mb-3 flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5" /> Department *
                </p>
                <div className="grid grid-cols-4 gap-2">
                  {DEPARTMENTS.map((dept) => (
                    <button
                      key={dept}
                      onClick={() => setCreateDept(dept)}
                      className={cn(
                        "px-3 py-2 rounded-lg text-xs font-semibold border transition-all",
                        createDept === dept
                          ? "bg-indigo-600 border-indigo-600 text-white"
                          : "bg-white border-border text-foreground hover:border-indigo-300"
                      )}
                    >
                      {dept}
                    </button>
                  ))}
                </div>
              </div>

              {/* Year */}
              <div>
                <label className="block text-[10px] font-semibold text-muted-foreground uppercase mb-1.5">Batch Year *</label>
                <input
                  type="number"
                  min={2020}
                  max={2040}
                  value={createYear}
                  onChange={(e) => setCreateYear(parseInt(e.target.value) || new Date().getFullYear())}
                  className="w-full px-3 py-2.5 rounded-lg border border-border text-sm outline-none bg-white text-foreground focus:border-indigo-400 transition-colors"
                  placeholder="e.g. 2026"
                />
              </div>

              {/* Semester */}
              <div>
                <label className="block text-[10px] font-semibold text-muted-foreground uppercase mb-1.5">Current Semester *</label>
                <div className="grid grid-cols-8 gap-1.5">
                  {Array.from({ length: deptInfoMap[createDept]?.totalSemesters || 8 }, (_, i) => i + 1).map((sem) => (
                    <button
                      key={sem}
                      onClick={() => setCreateSemester(sem)}
                      className={cn(
                        "py-2 rounded-lg text-xs font-bold border transition-all",
                        createSemester === sem
                          ? "bg-indigo-600 border-indigo-600 text-white"
                          : "bg-white border-border text-foreground hover:border-indigo-300"
                      )}
                    >
                      {sem}
                    </button>
                  ))}
                </div>
              </div>

              {/* Preview */}
              {createDept && (
                <div className="p-3 rounded-xl bg-muted/50 border border-border">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium mb-2">Preview</p>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-semibold text-foreground">{createDept} {createYear}</span>
                    <span className="text-muted-foreground">•</span>
                    <span className={cn("px-2 py-0.5 rounded text-xs font-semibold", getSemesterColor(createSemester))}>
                      Sem {createSemester}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1.5">
                    Password format: <code className="font-bold text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded">{createDept}{createYear}</code>
                  </p>
                </div>
              )}

              {/* Actions */}
              <div className="flex flex-col gap-2">
                <button
                  onClick={handleCreate}
                  disabled={isCreating || !createDept}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white text-sm font-semibold shadow-lg shadow-indigo-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  {isCreating ? <><Loader2 className="w-4 h-4 animate-spin" /> Creating...</> :
                    <><Plus className="w-4 h-4" /> Create Batch</>}
                </button>
                <button onClick={() => setShowCreate(false)}
                  className="w-full flex items-center justify-center px-4 py-2.5 rounded-xl border border-border text-sm font-medium text-foreground hover:bg-muted/50 transition-colors">
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
