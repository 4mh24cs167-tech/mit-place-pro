"use client";

import Header from "@/components/layout/Header";
import { cn } from "@/lib/utils";
import { adminApi } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import {
  Layers, Plus, ArrowUpCircle, Trash2, Loader2, AlertCircle,
  GraduationCap, Users, Calendar, ChevronUp, Building2, X,
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

const DEPARTMENTS = ["CSE", "ISE", "ECE", "EEE", "MECH", "CIVIL", "AI&ML", "AI&DS"];

export default function AdminBatchesPage() {
  const { user } = useAuth();
  const [batches, setBatches] = useState<BatchRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
    if (batch.currentSemester >= 8) {
      showToast("error", "Batch already at maximum semester (8)");
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
    if (sem <= 2) return "bg-emerald-500/15 text-emerald-400 border-emerald-500/20";
    if (sem <= 4) return "bg-blue-500/15 text-blue-400 border-blue-500/20";
    if (sem <= 6) return "bg-amber-500/15 text-amber-400 border-amber-500/20";
    return "bg-purple-500/15 text-purple-400 border-purple-500/20";
  };

  return (
    <div className="min-h-screen bg-[#0a0a0f]">
      <Header userName={user?.email || "Admin"} userRole="admin" />

      {/* Toast */}
      {toast && (
        <div className="fixed top-6 right-6 z-50 animate-in slide-in-from-top-2 fade-in duration-300">
          <div className={cn(
            "flex items-center gap-3 px-5 py-3 rounded-xl border shadow-2xl backdrop-blur-xl",
            toast.type === "success"
              ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
              : "bg-red-500/10 border-red-500/30 text-red-300"
          )}>
            {toast.type === "success" ? <GraduationCap className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
            <span className="text-sm font-medium">{toast.message}</span>
            <button onClick={() => setToast(null)} className="ml-2 opacity-60 hover:opacity-100">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-gradient-to-br from-purple-500/20 to-indigo-500/20 border border-purple-500/20">
                <Layers className="w-6 h-6 text-purple-400" />
              </div>
              Batch Management
            </h1>
            <p className="text-white/50 mt-1.5 text-sm sm:text-base">
              Create batches, assign semesters, and promote students
            </p>
          </div>
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-xl font-medium shadow-lg shadow-purple-500/20 transition-all duration-200 text-sm"
          >
            <Plus className="w-4 h-4" />
            Create Batch
          </button>
        </div>

        {/* Stats Summary */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-8">
          {[
            { label: "Total Batches", value: batches.length, icon: Layers, color: "purple" },
            { label: "Departments", value: new Set(batches.map(b => b.department)).size, icon: Building2, color: "blue" },
            { label: "Total Students", value: batches.reduce((acc, b) => acc + (b.studentCount || 0), 0), icon: Users, color: "emerald" },
            { label: "Avg Semester", value: batches.length > 0 ? (batches.reduce((acc, b) => acc + b.currentSemester, 0) / batches.length).toFixed(1) : "0", icon: GraduationCap, color: "amber" },
          ].map((stat) => (
            <div
              key={stat.label}
              className="bg-white/[0.03] backdrop-blur-sm border border-white/[0.06] rounded-xl p-4"
            >
              <div className="flex items-center gap-2 mb-2">
                <stat.icon className={cn("w-4 h-4", `text-${stat.color}-400`)} />
                <span className="text-white/40 text-xs font-medium uppercase tracking-wider">{stat.label}</span>
              </div>
              <p className="text-2xl font-bold text-white">{stat.value}</p>
            </div>
          ))}
        </div>

        {/* Loading / Error */}
        {isLoading && (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <Loader2 className="w-8 h-8 text-purple-400 animate-spin" />
            <p className="text-white/40 text-sm">Loading batches...</p>
          </div>
        )}

        {error && !isLoading && (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <AlertCircle className="w-8 h-8 text-red-400" />
            <p className="text-red-300 text-sm">{error}</p>
            <button onClick={fetchBatches} className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white/70 text-sm hover:bg-white/10 transition-colors">
              Retry
            </button>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && !error && batches.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <div className="p-4 rounded-2xl bg-purple-500/10 border border-purple-500/20">
              <Layers className="w-10 h-10 text-purple-400" />
            </div>
            <h3 className="text-xl font-semibold text-white">No Batches Yet</h3>
            <p className="text-white/40 text-sm text-center max-w-md">
              Create your first batch to start organizing students by department and semester.
            </p>
            <button
              onClick={() => setShowCreate(true)}
              className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl font-medium text-sm mt-2"
            >
              <Plus className="w-4 h-4" />
              Create Batch
            </button>
          </div>
        )}

        {/* Batch Cards Grid */}
        {!isLoading && !error && batches.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {batches.map((batch) => (
              <div
                key={batch.id}
                className="group bg-white/[0.03] backdrop-blur-sm border border-white/[0.06] rounded-2xl p-5 hover:bg-white/[0.05] hover:border-white/[0.1] transition-all duration-300"
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-white">{batch.name}</h3>
                    <p className="text-white/40 text-sm flex items-center gap-1.5 mt-0.5">
                      <Calendar className="w-3.5 h-3.5" />
                      Batch {batch.year}
                    </p>
                  </div>
                  <span className={cn(
                    "px-3 py-1 rounded-lg text-xs font-semibold border",
                    getSemesterColor(batch.currentSemester)
                  )}>
                    Sem {batch.currentSemester}
                  </span>
                </div>

                {/* Stats Row */}
                <div className="flex items-center gap-4 mb-5">
                  <div className="flex items-center gap-1.5">
                    <Users className="w-4 h-4 text-white/30" />
                    <span className="text-white/70 text-sm font-medium">{batch.studentCount || 0}</span>
                    <span className="text-white/30 text-sm">students</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Building2 className="w-4 h-4 text-white/30" />
                    <span className="text-white/70 text-sm">{batch.department}</span>
                  </div>
                </div>

                {/* Semester Progress */}
                <div className="mb-5">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-white/30 text-xs uppercase tracking-wider font-medium">Semester Progress</span>
                    <span className="text-white/50 text-xs">{batch.currentSemester}/8</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-white/[0.06] overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-purple-500 to-indigo-500 transition-all duration-500"
                      style={{ width: `${(batch.currentSemester / 8) * 100}%` }}
                    />
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handlePromote(batch)}
                    disabled={promotingId === batch.id || batch.currentSemester >= 8}
                    className={cn(
                      "flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200",
                      batch.currentSemester >= 8
                        ? "bg-white/5 text-white/20 cursor-not-allowed"
                        : "bg-gradient-to-r from-emerald-600/20 to-teal-600/20 text-emerald-300 border border-emerald-500/20 hover:from-emerald-600/30 hover:to-teal-600/30"
                    )}
                  >
                    {promotingId === batch.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <ArrowUpCircle className="w-4 h-4" />
                    )}
                    {batch.currentSemester >= 8 ? "Max Sem" : "Promote"}
                  </button>
                  <button
                    onClick={() => handleDelete(batch)}
                    className="flex items-center justify-center p-2.5 rounded-xl bg-red-500/10 text-red-400 border border-red-500/15 hover:bg-red-500/20 transition-all duration-200"
                    title="Delete Batch"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Create Batch Modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-[#12121a] border border-white/[0.08] rounded-2xl w-full max-w-md shadow-2xl">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-5 border-b border-white/[0.06]">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-purple-500/15 border border-purple-500/20">
                  <Plus className="w-5 h-5 text-purple-400" />
                </div>
                <h2 className="text-lg font-semibold text-white">Create New Batch</h2>
              </div>
              <button
                onClick={() => setShowCreate(false)}
                className="p-2 rounded-lg hover:bg-white/5 text-white/40 hover:text-white/70 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 space-y-5">
              {/* Department */}
              <div>
                <label className="block text-white/60 text-sm font-medium mb-2">Department *</label>
                <div className="grid grid-cols-4 gap-2">
                  {DEPARTMENTS.map((dept) => (
                    <button
                      key={dept}
                      onClick={() => setCreateDept(dept)}
                      className={cn(
                        "px-3 py-2 rounded-lg text-xs font-semibold border transition-all duration-200",
                        createDept === dept
                          ? "bg-purple-500/20 border-purple-500/40 text-purple-300"
                          : "bg-white/[0.03] border-white/[0.06] text-white/50 hover:bg-white/[0.06] hover:text-white/70"
                      )}
                    >
                      {dept}
                    </button>
                  ))}
                </div>
              </div>

              {/* Year */}
              <div>
                <label className="block text-white/60 text-sm font-medium mb-2">Batch Year *</label>
                <input
                  type="number"
                  min={2020}
                  max={2040}
                  value={createYear}
                  onChange={(e) => setCreateYear(parseInt(e.target.value) || new Date().getFullYear())}
                  className="w-full px-4 py-2.5 bg-white/[0.04] border border-white/[0.08] rounded-xl text-white text-sm focus:outline-none focus:border-purple-500/40 focus:ring-1 focus:ring-purple-500/20 transition-all"
                  placeholder="e.g. 2026"
                />
              </div>

              {/* Semester */}
              <div>
                <label className="block text-white/60 text-sm font-medium mb-2">Current Semester *</label>
                <div className="grid grid-cols-8 gap-1.5">
                  {[1, 2, 3, 4, 5, 6, 7, 8].map((sem) => (
                    <button
                      key={sem}
                      onClick={() => setCreateSemester(sem)}
                      className={cn(
                        "py-2 rounded-lg text-xs font-bold border transition-all duration-200",
                        createSemester === sem
                          ? "bg-purple-500/25 border-purple-500/40 text-purple-300"
                          : "bg-white/[0.03] border-white/[0.06] text-white/40 hover:bg-white/[0.06] hover:text-white/60"
                      )}
                    >
                      {sem}
                    </button>
                  ))}
                </div>
              </div>

              {/* Preview */}
              {createDept && (
                <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-4">
                  <p className="text-white/40 text-xs uppercase tracking-wider font-medium mb-2">Preview</p>
                  <div className="flex items-center gap-3">
                    <span className="text-white font-semibold">{createDept} {createYear}</span>
                    <span className="text-white/30">•</span>
                    <span className={cn("px-2 py-0.5 rounded text-xs font-semibold border", getSemesterColor(createSemester))}>
                      Sem {createSemester}
                    </span>
                  </div>
                  <p className="text-white/30 text-xs mt-1.5">
                    Password format for students: <span className="text-purple-300 font-mono">{createDept}{createYear}</span>
                  </p>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="flex items-center gap-3 p-5 border-t border-white/[0.06]">
              <button
                onClick={() => setShowCreate(false)}
                className="flex-1 px-4 py-2.5 bg-white/5 border border-white/10 text-white/60 rounded-xl text-sm font-medium hover:bg-white/10 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleCreate}
                disabled={isCreating || !createDept}
                className={cn(
                  "flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all",
                  isCreating || !createDept
                    ? "bg-purple-600/30 text-purple-300/50 cursor-not-allowed"
                    : "bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg shadow-purple-500/20 hover:from-purple-500 hover:to-indigo-500"
                )}
              >
                {isCreating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                {isCreating ? "Creating..." : "Create Batch"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
