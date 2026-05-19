"use client";

import { cn } from "@/lib/utils";
import { adminApi } from "@/lib/api";
import {
  Plus, X, Loader2, Briefcase, Building2, AlertTriangle,
} from "lucide-react";
import { useState, useEffect, useCallback } from "react";

interface Job { id: string; title: string; company?: { name: string }; allowedDepartments?: string[] }

const DEPARTMENTS = ["CSE", "ISE", "ECE", "EEE", "MECH", "CIVIL", "AI&ML", "AI&DS"];

interface Props {
  onClose: () => void;
  onCreated: () => void;
  showToast: (type: "success" | "error", msg: string) => void;
}

export default function CreateDriveModal({ onClose, onCreated, showToast }: Props) {
  const [title, setTitle] = useState("");
  const [driveType, setDriveType] = useState<"single" | "multiple">("single");
  const [jobs, setJobs] = useState<Job[]>([]);
  const [selectedJobId, setSelectedJobId] = useState("");
  const [driveDate, setDriveDate] = useState("");
  const [description, setDescription] = useState("");
  const [selectedDepts, setSelectedDepts] = useState<string[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [loadingJobs, setLoadingJobs] = useState(true);

  const fetchJobs = useCallback(async () => {
    setLoadingJobs(true);
    try {
      const res = await adminApi.listJobs();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const d = res.data as any;
      setJobs(Array.isArray(d) ? d : d?.data || []);
    } catch { /* ignore */ }
    finally { setLoadingJobs(false); }
  }, []);

  useEffect(() => { fetchJobs(); }, [fetchJobs]);

  const toggleDept = (dept: string) => {
    setSelectedDepts((prev) =>
      prev.includes(dept) ? prev.filter((d) => d !== dept) : [...prev, dept]
    );
  };

  const handleCreate = async () => {
    if (!selectedJobId) { showToast("error", "Please select a job listing"); return; }
    setIsCreating(true);
    try {
      const job = jobs.find((j) => j.id === selectedJobId);
      await adminApi.createDrive({
        title: title || `${job?.company?.name || "Company"} - ${job?.title || "Drive"}`,
        type: driveType,
        jobId: selectedJobId,
        description: description || undefined,
        driveDate: driveDate || undefined,
        departments: selectedDepts.length > 0 ? selectedDepts : undefined,
      });
      showToast("success", "Drive created successfully! Eligible students auto-registered.");
      onCreated();
    } catch (err: unknown) {
      showToast("error", err instanceof Error ? err.message : "Failed to create drive");
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-[#12121a] border border-white/[0.08] rounded-2xl w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-white/[0.06] sticky top-0 bg-[#12121a] z-10">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-orange-500/15 border border-orange-500/20">
              <Plus className="w-5 h-5 text-orange-400" />
            </div>
            <h2 className="text-lg font-semibold text-white">Create New Drive</h2>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-white/5 text-white/40 hover:text-white/70 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-5">
          {/* Drive Type */}
          <div>
            <label className="block text-white/60 text-sm font-medium mb-2">Drive Type *</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setDriveType("single")}
                className={cn(
                  "px-4 py-3 rounded-xl border text-sm font-medium transition-all",
                  driveType === "single"
                    ? "bg-orange-500/15 border-orange-500/30 text-orange-300"
                    : "bg-white/[0.03] border-white/[0.06] text-white/50 hover:bg-white/[0.06]"
                )}
              >
                <Briefcase className="w-5 h-5 mx-auto mb-1" />
                Single Company
              </button>
              <button
                onClick={() => setDriveType("multiple")}
                className={cn(
                  "px-4 py-3 rounded-xl border text-sm font-medium transition-all relative overflow-hidden",
                  driveType === "multiple"
                    ? "bg-orange-500/15 border-orange-500/30 text-orange-300"
                    : "bg-white/[0.03] border-white/[0.06] text-white/50 hover:bg-white/[0.06]"
                )}
              >
                <Building2 className="w-5 h-5 mx-auto mb-1" />
                Multiple Companies
                <span className="absolute top-1 right-1 px-1.5 py-0.5 bg-amber-500/20 text-amber-300 text-[8px] font-bold rounded-md border border-amber-500/30">WIP</span>
              </button>
            </div>
          </div>

          {/* WIP Banner */}
          {driveType === "multiple" && (
            <div className="flex items-center gap-3 p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl">
              <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0" />
              <p className="text-amber-300 text-sm">Multi-company drives are a work in progress. Please use single company mode for now.</p>
            </div>
          )}

          {/* Job Selection */}
          <div>
            <label className="block text-white/60 text-sm font-medium mb-2">Select Job Listing *</label>
            {loadingJobs ? (
              <div className="flex items-center justify-center py-4 gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-white/40" />
                <span className="text-white/40 text-sm">Loading jobs...</span>
              </div>
            ) : jobs.length === 0 ? (
              <p className="text-white/30 text-sm py-3 text-center">No job listings found. Create a job first.</p>
            ) : (
              <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                {jobs.map((job) => (
                  <button
                    key={job.id}
                    onClick={() => setSelectedJobId(job.id)}
                    className={cn(
                      "w-full text-left px-4 py-3 rounded-xl border transition-all text-sm",
                      selectedJobId === job.id
                        ? "bg-orange-500/15 border-orange-500/30"
                        : "bg-white/[0.03] border-white/[0.06] hover:bg-white/[0.06]"
                    )}
                  >
                    <p className={cn("font-medium", selectedJobId === job.id ? "text-orange-300" : "text-white/70")}>{job.title}</p>
                    <p className="text-white/30 text-xs mt-0.5">{job.company?.name || "Unknown Company"}</p>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Title */}
          <div>
            <label className="block text-white/60 text-sm font-medium mb-2">Drive Title (auto-generated if blank)</label>
            <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. TCS Campus Drive 2026" className="w-full px-4 py-2.5 bg-white/[0.04] border border-white/[0.08] rounded-xl text-white text-sm placeholder:text-white/20 focus:outline-none focus:border-orange-500/40" />
          </div>

          {/* Date */}
          <div>
            <label className="block text-white/60 text-sm font-medium mb-2">Drive Date</label>
            <input type="date" value={driveDate} onChange={(e) => setDriveDate(e.target.value)} className="w-full px-4 py-2.5 bg-white/[0.04] border border-white/[0.08] rounded-xl text-white text-sm focus:outline-none focus:border-orange-500/40" />
          </div>

          {/* Departments */}
          <div>
            <label className="block text-white/60 text-sm font-medium mb-2">Target Departments</label>
            <div className="grid grid-cols-4 gap-2">
              {DEPARTMENTS.map((dept) => (
                <button
                  key={dept}
                  onClick={() => toggleDept(dept)}
                  className={cn(
                    "px-3 py-2 rounded-lg text-xs font-semibold border transition-all",
                    selectedDepts.includes(dept)
                      ? "bg-orange-500/20 border-orange-500/40 text-orange-300"
                      : "bg-white/[0.03] border-white/[0.06] text-white/50 hover:bg-white/[0.06]"
                  )}
                >
                  {dept}
                </button>
              ))}
            </div>
            <p className="text-white/20 text-xs mt-1.5">Leave empty to use job&apos;s allowed departments</p>
          </div>

          {/* Description */}
          <div>
            <label className="block text-white/60 text-sm font-medium mb-2">Description</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} placeholder="Drive details, instructions, etc." className="w-full px-4 py-2.5 bg-white/[0.04] border border-white/[0.08] rounded-xl text-white text-sm placeholder:text-white/20 focus:outline-none focus:border-orange-500/40 resize-none" />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center gap-3 p-5 border-t border-white/[0.06]">
          <button onClick={onClose} className="flex-1 px-4 py-2.5 bg-white/5 border border-white/10 text-white/60 rounded-xl text-sm font-medium hover:bg-white/10 transition-all">Cancel</button>
          <button
            onClick={handleCreate}
            disabled={isCreating || !selectedJobId || driveType === "multiple"}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all",
              isCreating || !selectedJobId || driveType === "multiple"
                ? "bg-orange-600/30 text-orange-300/50 cursor-not-allowed"
                : "bg-gradient-to-r from-orange-600 to-amber-600 text-white shadow-lg shadow-orange-500/20 hover:from-orange-500 hover:to-amber-500"
            )}
          >
            {isCreating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            {isCreating ? "Creating..." : "Create Drive"}
          </button>
        </div>
      </div>
    </div>
  );
}
