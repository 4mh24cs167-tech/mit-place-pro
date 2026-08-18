"use client";

import { cn } from "@/lib/utils";
import { adminApi } from "@/lib/api";
import {
  Plus, X, Loader2, Briefcase, Building2, AlertTriangle, ChevronRight, CheckSquare, Square,
} from "lucide-react";
import { useState, useEffect, useCallback } from "react";

interface Company { id: string; name: string; industry?: string; }
interface Job { id: string; title: string; companyId: string; company?: { name: string }; allowedDepartments?: string[] }



interface Props {
  onClose: () => void;
  onCreated: () => void;
  showToast: (type: "success" | "error", msg: string) => void;
}

export default function CreateDriveModal({ onClose, onCreated, showToast }: Props) {
  const [title, setTitle] = useState("");
  const [driveType, setDriveType] = useState<"single" | "multiple">("single");

  // Company → Job selection
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loadingCompanies, setLoadingCompanies] = useState(true);
  const [selectedCompanyId, setSelectedCompanyId] = useState("");

  const [jobs, setJobs] = useState<Job[]>([]);
  const [loadingJobs, setLoadingJobs] = useState(false);
  const [selectedJobIds, setSelectedJobIds] = useState<string[]>([]);

  const [driveDate, setDriveDate] = useState("");
  const [description, setDescription] = useState("");
  const [selectedDepts, setSelectedDepts] = useState<string[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [DEPARTMENTS, setDepartments] = useState<string[]>([]);
  const [batches, setBatches] = useState<Array<{ id: string; name: string; department: string; year: number }>>([]);
  const [selectedBatchIds, setSelectedBatchIds] = useState<string[]>([]);

  // Fetch companies on mount
  const fetchCompanies = useCallback(async () => {
    setLoadingCompanies(true);
    try {
      const res = await adminApi.listCompanies();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const d = res.data as any;
      setCompanies(Array.isArray(d) ? d : d?.data || []);
    } catch { /* ignore */ }
    finally { setLoadingCompanies(false); }
  }, []);

  useEffect(() => {
    fetchCompanies();
    (async () => {
      try {
        const res = await adminApi.listDepartments();
        if (res.data) setDepartments((res.data as Array<{ code: string }>).map(d => d.code));
        const batchesRes = await adminApi.listBatches();
        if (batchesRes.data) setBatches(batchesRes.data as any);
      } catch { /* empty */ }
    })();
  }, [fetchCompanies]);

  // Fetch jobs when a company is selected
  const fetchJobsForCompany = useCallback(async (companyId: string) => {
    setLoadingJobs(true);
    setSelectedJobIds([]);
    try {
      const res = await adminApi.listJobs();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const d = res.data as any;
      const allJobs: Job[] = Array.isArray(d) ? d : d?.data || [];
      // Filter jobs belonging to the selected company
      const companyJobs = allJobs.filter((j) => j.companyId === companyId || j.company?.name === companies.find(c => c.id === companyId)?.name);
      setJobs(companyJobs);
    } catch { /* ignore */ }
    finally { setLoadingJobs(false); }
  }, [companies]);

  useEffect(() => {
    if (selectedCompanyId) {
      fetchJobsForCompany(selectedCompanyId);
    } else {
      setJobs([]);
      setSelectedJobIds([]);
    }
  }, [selectedCompanyId, fetchJobsForCompany]);

  const toggleDept = (dept: string) => {
    setSelectedDepts((prev) =>
      prev.includes(dept) ? prev.filter((d) => d !== dept) : [...prev, dept]
    );
  };

  const toggleBatch = (batchId: string) => {
    setSelectedBatchIds((prev) =>
      prev.includes(batchId) ? prev.filter((id) => id !== batchId) : [...prev, batchId]
    );
  };

  const toggleJobSelect = (jobId: string) => {
    setSelectedJobIds((prev) =>
      prev.includes(jobId) ? prev.filter((id) => id !== jobId) : [...prev, jobId]
    );
  };

  const handleCreate = async () => {
    if (selectedJobIds.length === 0) { showToast("error", "Please select at least one job role"); return; }
    setIsCreating(true);
    try {
      const company = companies.find((c) => c.id === selectedCompanyId);
      const selectedJobs = jobs.filter((j) => selectedJobIds.includes(j.id));
      const jobTitles = selectedJobs.map((j) => j.title).join(", ");
      await adminApi.createDrive({
        title: title || `${company?.name || "Company"} - ${jobTitles}`,
        type: driveType,
        jobIds: selectedJobIds,
        jobId: selectedJobIds[0],
        description: description || undefined,
        driveDate: driveDate || undefined,
        departments: selectedDepts.length > 0 ? selectedDepts : undefined,
        batchIds: selectedBatchIds.length > 0 ? selectedBatchIds : undefined,
      });
      showToast("success", "Drive created successfully! Eligible students auto-registered.");
      onCreated();
    } catch (err: unknown) {
      showToast("error", err instanceof Error ? err.message : "Failed to create drive");
    } finally {
      setIsCreating(false);
    }
  };

  const selectedCompany = companies.find(c => c.id === selectedCompanyId);

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-6 bg-black/50">
      <div className="bg-white rounded-t-2xl sm:rounded-2xl w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-border sticky top-0 bg-white z-10 rounded-t-2xl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center">
              <Plus className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-foreground">Create New Drive</h2>
              <p className="text-xs text-muted-foreground">Select a company & job to start</p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-muted flex items-center justify-center text-muted-foreground">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-5">
          {/* Drive Type */}
          <div>
            <label className="block text-[10px] font-semibold text-muted-foreground uppercase mb-2">Drive Type *</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setDriveType("single")}
                className={cn(
                  "px-4 py-3 rounded-xl border text-sm font-medium transition-all",
                  driveType === "single"
                    ? "bg-indigo-50 border-indigo-200 text-indigo-700"
                    : "bg-white border-border text-muted-foreground hover:border-indigo-200"
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
                    ? "bg-indigo-50 border-indigo-200 text-indigo-700"
                    : "bg-white border-border text-muted-foreground hover:border-indigo-200"
                )}
              >
                <Building2 className="w-5 h-5 mx-auto mb-1" />
                Multiple Companies
                <span className="absolute top-1 right-1 px-1.5 py-0.5 bg-amber-50 text-amber-600 text-[8px] font-bold rounded-md border border-amber-200">WIP</span>
              </button>
            </div>
          </div>

          {/* WIP Banner */}
          {driveType === "multiple" && (
            <div className="flex items-center gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl">
              <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0" />
              <p className="text-amber-700 text-sm">Multi-company drives are a work in progress. Please use single company mode for now.</p>
            </div>
          )}

          {/* ── Step 1: Select Company ── */}
          <div className="p-4 rounded-xl bg-gradient-to-r from-indigo-50 to-violet-50 border border-indigo-100">
            <p className="text-xs font-semibold text-indigo-700 uppercase mb-3 flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5" /> Step 1: Select Company *
            </p>
            {loadingCompanies ? (
              <div className="flex items-center justify-center py-4 gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                <span className="text-muted-foreground text-sm">Loading companies...</span>
              </div>
            ) : companies.length === 0 ? (
              <p className="text-muted-foreground text-sm py-3 text-center">No companies found. Register a company first.</p>
            ) : (
              <div className="space-y-2 max-h-36 overflow-y-auto pr-1">
                {companies.map((company) => (
                  <button
                    key={company.id}
                    onClick={() => setSelectedCompanyId(company.id)}
                    className={cn(
                      "w-full text-left px-4 py-3 rounded-xl border transition-all text-sm flex items-center justify-between",
                      selectedCompanyId === company.id
                        ? "bg-indigo-600 border-indigo-600 text-white"
                        : "bg-white border-border text-foreground hover:border-indigo-300"
                    )}
                  >
                    <div>
                      <p className="font-medium">{company.name}</p>
                      {company.industry && (
                        <p className={cn("text-xs mt-0.5", selectedCompanyId === company.id ? "text-indigo-200" : "text-muted-foreground")}>{company.industry}</p>
                      )}
                    </div>
                    <ChevronRight className={cn("w-4 h-4 flex-shrink-0", selectedCompanyId === company.id ? "text-white" : "text-muted-foreground")} />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* ── Step 2: Select Job (shows only after company selected) ── */}
          {selectedCompanyId && (
            <div className="p-4 rounded-xl bg-gradient-to-r from-violet-50 to-purple-50 border border-violet-100">
              <p className="text-xs font-semibold text-violet-700 uppercase mb-3 flex items-center gap-1.5">
                <Briefcase className="w-3.5 h-3.5" /> Step 2: Select Job by {selectedCompany?.name} *
              </p>
              {loadingJobs ? (
                <div className="flex items-center justify-center py-4 gap-2">
                  <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                  <span className="text-muted-foreground text-sm">Loading jobs...</span>
                </div>
              ) : jobs.length === 0 ? (
                <p className="text-muted-foreground text-sm py-3 text-center">No jobs posted by {selectedCompany?.name}. The company needs to post a job first.</p>
              ) : (
                <div className="space-y-2 max-h-36 overflow-y-auto pr-1">
                  {jobs.map((job) => {
                    const isSelected = selectedJobIds.includes(job.id);
                    return (
                      <button
                        key={job.id}
                        onClick={() => toggleJobSelect(job.id)}
                        className={cn(
                          "w-full text-left px-4 py-3 rounded-xl border transition-all text-sm flex items-center justify-between",
                          isSelected
                            ? "bg-violet-600 border-violet-600 text-white"
                            : "bg-white border-border text-foreground hover:border-violet-300"
                        )}
                      >
                        <div>
                          <p className="font-medium">{job.title}</p>
                          {job.allowedDepartments && job.allowedDepartments.length > 0 && (
                            <p className={cn("text-xs mt-0.5", isSelected ? "text-violet-200" : "text-muted-foreground")}>
                              Depts: {job.allowedDepartments.join(", ")}
                            </p>
                          )}
                        </div>
                        {isSelected ? (
                          <CheckSquare className="w-4 h-4 text-white flex-shrink-0" />
                        ) : (
                          <Square className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Title */}
          <div>
            <label className="block text-[10px] font-semibold text-muted-foreground uppercase mb-1.5">Drive Title (auto-generated if blank)</label>
            <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. TCS Campus Drive 2026"
              className="w-full px-3 py-2.5 rounded-lg border border-border text-sm outline-none bg-white text-foreground focus:border-indigo-400 transition-colors placeholder:text-muted-foreground" />
          </div>

          {/* Date */}
          <div>
            <label className="block text-[10px] font-semibold text-muted-foreground uppercase mb-1.5">Drive Date</label>
            <input type="date" value={driveDate} onChange={(e) => setDriveDate(e.target.value)}
              className="w-full px-3 py-2.5 rounded-lg border border-border text-sm outline-none bg-white text-foreground focus:border-indigo-400 transition-colors" />
          </div>

          {/* Departments */}
          <div>
            <label className="block text-[10px] font-semibold text-muted-foreground uppercase mb-1.5">Target Departments</label>
            <div className="grid grid-cols-4 gap-2">
              {DEPARTMENTS.map((dept) => (
                <button
                  key={dept}
                  onClick={() => toggleDept(dept)}
                  className={cn(
                    "px-3 py-2 rounded-lg text-xs font-semibold border transition-all",
                    selectedDepts.includes(dept)
                      ? "bg-indigo-600 border-indigo-600 text-white"
                      : "bg-white border-border text-foreground hover:border-indigo-300"
                  )}
                >
                  {dept}
                </button>
              ))}
            </div>
            <p className="text-muted-foreground text-xs mt-1.5">Leave empty to use job&apos;s allowed departments</p>
          </div>

          {/* Batches */}
          <div>
            <label className="block text-[10px] font-semibold text-muted-foreground uppercase mb-1.5">Target Batches</label>
            <div className="grid grid-cols-4 gap-2">
              {batches
                .filter(b => selectedDepts.length === 0 || selectedDepts.includes(b.department))
                .map((batch) => (
                <button
                  key={batch.id}
                  onClick={() => toggleBatch(batch.id)}
                  className={cn(
                    "px-3 py-2 rounded-lg text-xs font-semibold border transition-all",
                    selectedBatchIds.includes(batch.id)
                      ? "bg-indigo-600 border-indigo-600 text-white"
                      : "bg-white border-border text-foreground hover:border-indigo-300"
                  )}
                >
                  {batch.name || `${batch.department} ${batch.year}`}
                </button>
              ))}
            </div>
            <p className="text-muted-foreground text-xs mt-1.5">Leave empty to include all batches</p>
          </div>

          {/* Description */}
          <div>
            <label className="block text-[10px] font-semibold text-muted-foreground uppercase mb-1.5">Description</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} placeholder="Drive details, instructions, etc."
              className="w-full px-3 py-2.5 rounded-lg border border-border text-sm outline-none bg-white text-foreground focus:border-indigo-400 transition-colors resize-none placeholder:text-muted-foreground" />
          </div>
        </div>

        {/* Footer */}
        <div className="flex flex-col gap-2 p-5 border-t border-border">
          <button
            onClick={handleCreate}
            disabled={isCreating || selectedJobIds.length === 0 || driveType === "multiple"}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white text-sm font-semibold shadow-lg shadow-indigo-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {isCreating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            {isCreating ? "Creating..." : "Create Drive"}
          </button>
          <button onClick={onClose}
            className="w-full flex items-center justify-center px-4 py-2.5 rounded-xl border border-border text-sm font-medium text-foreground hover:bg-muted/50 transition-colors">
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
