"use client";

import Header from "@/components/layout/Header";
import { cn } from "@/lib/utils";
import { adminApi } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import {
  BookOpen, Plus, Pencil, Trash2, Loader2, AlertCircle,
  X, Check, Building2,
} from "lucide-react";
import { useState, useEffect, useCallback } from "react";

interface DepartmentRecord {
  id: string;
  code: string;
  name: string;
  isActive: boolean;
  createdAt: string;
}

export default function AdminDepartmentsPage() {
  const { user } = useAuth();
  const [departments, setDepartments] = useState<DepartmentRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Create state
  const [showCreate, setShowCreate] = useState(false);
  const [createCode, setCreateCode] = useState("");
  const [createName, setCreateName] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  // Edit state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editCode, setEditCode] = useState("");
  const [editName, setEditName] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  // Toast
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const showToast = (type: "success" | "error", message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  };

  const fetchDepartments = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await adminApi.listDepartments();
      setDepartments((res.data || []) as DepartmentRecord[]);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load departments");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDepartments();
  }, [fetchDepartments]);

  const handleCreate = async () => {
    if (!createCode.trim() || !createName.trim()) {
      showToast("error", "Code and name are required");
      return;
    }
    setIsCreating(true);
    try {
      await adminApi.createDepartment({ code: createCode.trim(), name: createName.trim() });
      showToast("success", `Department "${createCode.trim().toUpperCase()}" created`);
      setShowCreate(false);
      setCreateCode("");
      setCreateName("");
      fetchDepartments();
    } catch (err: unknown) {
      showToast("error", err instanceof Error ? err.message : "Failed to create department");
    } finally {
      setIsCreating(false);
    }
  };

  const startEdit = (dept: DepartmentRecord) => {
    setEditingId(dept.id);
    setEditCode(dept.code);
    setEditName(dept.name);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditCode("");
    setEditName("");
  };

  const handleSave = async (id: string) => {
    if (!editCode.trim() || !editName.trim()) {
      showToast("error", "Code and name are required");
      return;
    }
    setIsSaving(true);
    try {
      await adminApi.updateDepartment(id, { code: editCode.trim(), name: editName.trim() });
      showToast("success", `Department updated`);
      setEditingId(null);
      fetchDepartments();
    } catch (err: unknown) {
      showToast("error", err instanceof Error ? err.message : "Failed to update department");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (dept: DepartmentRecord) => {
    const confirmed = window.confirm(
      `Delete department "${dept.code} — ${dept.name}"?\n\nThis will fail if any batches or students reference this department.`
    );
    if (!confirmed) return;
    try {
      await adminApi.deleteDepartment(dept.id);
      showToast("success", `Department "${dept.code}" deleted`);
      fetchDepartments();
    } catch (err: unknown) {
      showToast("error", err instanceof Error ? err.message : "Failed to delete department");
    }
  };

  return (
    <div className="page-enter">
      <Header userName={user?.email || "Admin"} userRole="Admin"
        greeting="Department Management" subtitle="Create, edit, and manage college departments" />

      {/* Toast */}
      {toast && (
        <div className="fixed top-6 right-6 z-50 animate-in slide-in-from-top-2 fade-in duration-300">
          <div className={cn(
            "flex items-center gap-3 px-5 py-3 rounded-xl border shadow-2xl",
            toast.type === "success"
              ? "bg-green-50 border-green-200 text-green-700"
              : "bg-red-50 border-red-200 text-red-700"
          )}>
            {toast.type === "success" ? <BookOpen className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
            <span className="text-sm font-medium">{toast.message}</span>
            <button onClick={() => setToast(null)} className="ml-2 opacity-60 hover:opacity-100">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      <div className="px-4 sm:px-6 md:px-8 pb-10 space-y-6">
        {/* Stats + Actions Row */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-indigo-50 flex items-center justify-center">
              <Building2 className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Departments</p>
              {isLoading ? (
                <div className="h-7 w-10 rounded bg-muted animate-pulse mt-0.5" />
              ) : (
                <p className="text-xl font-bold text-foreground">{departments.length}</p>
              )}
            </div>
          </div>
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white text-xs sm:text-sm font-semibold shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/30 transition-all"
          >
            <Plus className="w-3.5 h-3.5" /> Add Department
          </button>
        </div>

        {/* Loading */}
        {isLoading && (
          <div className="i-card p-6">
            <div className="space-y-3">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="flex items-center gap-4">
                  <div className="w-14 h-10 rounded-lg bg-muted animate-pulse" />
                  <div className="flex-1 h-4 bg-muted animate-pulse rounded" />
                  <div className="w-20 h-8 bg-muted animate-pulse rounded-lg" />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Error */}
        {error && !isLoading && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mb-4">
              <AlertCircle className="w-7 h-7 text-red-500" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-1">{error}</h3>
            <button onClick={fetchDepartments}
              className="mt-4 flex items-center gap-2 px-4 py-2.5 rounded-xl bg-foreground text-white text-sm font-medium">
              Retry
            </button>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && !error && departments.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
              <BookOpen className="w-7 h-7 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-1">No Departments Yet</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Add your first department to start organizing batches and students.
            </p>
            <button onClick={() => setShowCreate(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-foreground text-white text-sm font-medium">
              <Plus className="w-4 h-4" /> Add Department
            </button>
          </div>
        )}

        {/* Department Table */}
        {!isLoading && !error && departments.length > 0 && (
          <div className="i-card overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="text-left text-[10px] font-semibold text-muted-foreground uppercase tracking-wider p-3 pl-5 w-28">Code</th>
                  <th className="text-left text-[10px] font-semibold text-muted-foreground uppercase tracking-wider p-3">Full Name</th>
                  <th className="text-left text-[10px] font-semibold text-muted-foreground uppercase tracking-wider p-3 w-28">Status</th>
                  <th className="text-right text-[10px] font-semibold text-muted-foreground uppercase tracking-wider p-3 pr-5 w-28">Actions</th>
                </tr>
              </thead>
              <tbody>
                {departments.map((dept) => (
                  <tr key={dept.id} className="border-b border-border/50 last:border-0 hover:bg-muted/20 transition-colors">
                    {editingId === dept.id ? (
                      <>
                        <td className="p-3 pl-5">
                          <input
                            type="text"
                            value={editCode}
                            onChange={(e) => setEditCode(e.target.value)}
                            className="w-full px-2.5 py-1.5 rounded-lg border border-indigo-300 text-sm font-semibold outline-none focus:ring-2 focus:ring-indigo-500/20 bg-white"
                            autoFocus
                          />
                        </td>
                        <td className="p-3">
                          <input
                            type="text"
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            className="w-full px-2.5 py-1.5 rounded-lg border border-indigo-300 text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 bg-white"
                          />
                        </td>
                        <td className="p-3">
                          <span className="text-xs px-2 py-1 rounded-full bg-green-50 text-green-600 font-medium">Active</span>
                        </td>
                        <td className="p-3 pr-5">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleSave(dept.id)}
                              disabled={isSaving}
                              className="w-8 h-8 rounded-lg bg-green-50 text-green-600 hover:bg-green-100 flex items-center justify-center transition-colors"
                              title="Save"
                            >
                              {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                            </button>
                            <button
                              onClick={cancelEdit}
                              className="w-8 h-8 rounded-lg bg-muted text-muted-foreground hover:bg-muted/80 flex items-center justify-center transition-colors"
                              title="Cancel"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="p-3 pl-5">
                          <span className="text-sm font-bold text-foreground bg-indigo-50 px-2.5 py-1 rounded-lg">{dept.code}</span>
                        </td>
                        <td className="p-3">
                          <span className="text-sm text-foreground">{dept.name}</span>
                        </td>
                        <td className="p-3">
                          <span className={cn(
                            "text-xs px-2 py-1 rounded-full font-medium",
                            dept.isActive ? "bg-green-50 text-green-600" : "bg-red-50 text-red-600"
                          )}>
                            {dept.isActive ? "Active" : "Inactive"}
                          </span>
                        </td>
                        <td className="p-3 pr-5">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => startEdit(dept)}
                              className="w-8 h-8 rounded-lg hover:bg-indigo-50 text-muted-foreground hover:text-indigo-600 flex items-center justify-center transition-colors"
                              title="Edit"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDelete(dept)}
                              className="w-8 h-8 rounded-lg hover:bg-red-50 text-muted-foreground hover:text-red-600 flex items-center justify-center transition-colors"
                              title="Delete"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create Department Modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 p-0 sm:p-6">
          <div className="bg-white rounded-t-2xl sm:rounded-2xl p-5 sm:p-6 w-full max-w-md shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center">
                  <BookOpen className="w-5 h-5 text-indigo-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-foreground">Add Department</h3>
                  <p className="text-xs text-muted-foreground">Create a new college department</p>
                </div>
              </div>
              <button onClick={() => setShowCreate(false)} className="w-8 h-8 rounded-lg hover:bg-muted flex items-center justify-center">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Code */}
              <div>
                <label htmlFor="dept-code" className="block text-[10px] font-semibold text-muted-foreground uppercase mb-1.5">
                  Department Code *
                </label>
                <input
                  id="dept-code"
                  type="text"
                  value={createCode}
                  onChange={(e) => setCreateCode(e.target.value.toUpperCase())}
                  placeholder="e.g. CSE, MECH, AI&ML"
                  className="w-full px-3 py-2.5 rounded-lg border border-border text-sm outline-none bg-white text-foreground focus:border-indigo-400 transition-colors font-semibold"
                  maxLength={20}
                />
              </div>

              {/* Name */}
              <div>
                <label htmlFor="dept-name" className="block text-[10px] font-semibold text-muted-foreground uppercase mb-1.5">
                  Full Name *
                </label>
                <input
                  id="dept-name"
                  type="text"
                  value={createName}
                  onChange={(e) => setCreateName(e.target.value)}
                  placeholder="e.g. Computer Science & Engineering"
                  className="w-full px-3 py-2.5 rounded-lg border border-border text-sm outline-none bg-white text-foreground focus:border-indigo-400 transition-colors"
                  maxLength={100}
                />
              </div>

              {/* Preview */}
              {createCode.trim() && createName.trim() && (
                <div className="p-3 rounded-xl bg-indigo-50 border border-indigo-100">
                  <p className="text-[10px] text-indigo-600 uppercase tracking-wider font-medium mb-1">Preview</p>
                  <p className="text-sm font-semibold text-foreground">
                    <span className="bg-white px-2 py-0.5 rounded text-indigo-700 font-bold mr-2">{createCode.trim().toUpperCase()}</span>
                    {createName.trim()}
                  </p>
                </div>
              )}

              {/* Actions */}
              <div className="flex flex-col gap-2">
                <button
                  onClick={handleCreate}
                  disabled={isCreating || !createCode.trim() || !createName.trim()}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white text-sm font-semibold shadow-lg shadow-indigo-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  {isCreating ? <><Loader2 className="w-4 h-4 animate-spin" /> Creating...</> :
                    <><Plus className="w-4 h-4" /> Add Department</>}
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
