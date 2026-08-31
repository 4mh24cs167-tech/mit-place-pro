"use client";

import { cn } from "@/lib/utils";
import { adminApi } from "@/lib/api";
import {
  Plus, X, Loader2, Briefcase, Building2, ChevronRight, CheckSquare, Square,
  ArrowLeft, ArrowRight, Trash2, Eye, CalendarDays, GraduationCap,
} from "lucide-react";
import { useState, useEffect, useCallback } from "react";

interface Company { id: string; name: string; industry?: string; }
interface Job { id: string; title: string; companyId: string; company?: { name: string }; allowedDepartments?: string[] }

/** A company + its selected jobs for the wizard */
interface CompanyJobSelection {
  companyId: string;
  companyName: string;
  jobIds: string[];
  jobTitles: string[];
}

interface Props {
  onClose: () => void;
  onCreated: () => void;
  showToast: (type: "success" | "error", msg: string) => void;
}

export default function CreateDriveModal({ onClose, onCreated, showToast }: Props) {
  const [title, setTitle] = useState("");
  const [driveType, setDriveType] = useState<"single" | "multiple">("single");

  // Company → Job selection (single-company mode)
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

  // ── Multi-company wizard state ──
  const [wizardStep, setWizardStep] = useState(1); // 1=Select Companies+Jobs, 2=Configure, 3=Review
  const [companyJobSelections, setCompanyJobSelections] = useState<CompanyJobSelection[]>([]);
  const [mcSelectedCompanyId, setMcSelectedCompanyId] = useState(""); // currently picking company
  const [mcJobs, setMcJobs] = useState<Job[]>([]); // jobs for current company
  const [mcLoadingJobs, setMcLoadingJobs] = useState(false);
  const [mcSelectedJobIds, setMcSelectedJobIds] = useState<string[]>([]); // jobs being picked

  // ── All jobs cache for multi-company ──
  const [allJobs, setAllJobs] = useState<Job[]>([]);

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
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        if (batchesRes.data) setBatches(batchesRes.data as any);
        // Pre-fetch all jobs for multi-company mode
        const jobsRes = await adminApi.listJobs();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const jd = jobsRes.data as any;
        setAllJobs(Array.isArray(jd) ? jd : jd?.data || []);
      } catch { /* empty */ }
    })();
  }, [fetchCompanies]);

  // Fetch jobs when a company is selected (single-company mode)
  const fetchJobsForCompany = useCallback(async (companyId: string) => {
    setLoadingJobs(true);
    setSelectedJobIds([]);
    try {
      const res = await adminApi.listJobs();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const d = res.data as any;
      const allJ: Job[] = Array.isArray(d) ? d : d?.data || [];
      const companyJobs = allJ.filter((j) => j.companyId === companyId || j.company?.name === companies.find(c => c.id === companyId)?.name);
      setJobs(companyJobs);
    } catch { /* ignore */ }
    finally { setLoadingJobs(false); }
  }, [companies]);

  useEffect(() => {
    if (driveType === "single" && selectedCompanyId) {
      fetchJobsForCompany(selectedCompanyId);
    } else if (driveType === "single") {
      setJobs([]);
      setSelectedJobIds([]);
    }
  }, [selectedCompanyId, fetchJobsForCompany, driveType]);

  // Multi-company: load jobs for the currently selected company
  useEffect(() => {
    if (driveType === "multiple" && mcSelectedCompanyId) {
      setMcLoadingJobs(true);
      setMcSelectedJobIds([]);
      const companyJobs = allJobs.filter(
        (j) => j.companyId === mcSelectedCompanyId || j.company?.name === companies.find(c => c.id === mcSelectedCompanyId)?.name
      );
      // Exclude jobs already selected for this company
      const existing = companyJobSelections.find(s => s.companyId === mcSelectedCompanyId);
      const alreadySelected = new Set(existing?.jobIds || []);
      const available = companyJobs.filter(j => !alreadySelected.has(j.id));
      setMcJobs(available);
      setMcLoadingJobs(false);
    } else {
      setMcJobs([]);
      setMcSelectedJobIds([]);
    }
  }, [mcSelectedCompanyId, driveType, allJobs, companies, companyJobSelections]);

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

  const toggleMcJobSelect = (jobId: string) => {
    setMcSelectedJobIds((prev) =>
      prev.includes(jobId) ? prev.filter((id) => id !== jobId) : [...prev, jobId]
    );
  };

  // ── Multi-company: Add selected company+jobs to the list ──
  const handleAddCompanyJobs = () => {
    if (!mcSelectedCompanyId || mcSelectedJobIds.length === 0) return;
    const company = companies.find(c => c.id === mcSelectedCompanyId);
    const selectedJobs = mcJobs.filter(j => mcSelectedJobIds.includes(j.id));

    // Check if this company already exists in selections
    const existingIdx = companyJobSelections.findIndex(s => s.companyId === mcSelectedCompanyId);
    if (existingIdx >= 0) {
      // Merge jobs
      const updated = [...companyJobSelections];
      updated[existingIdx] = {
        ...updated[existingIdx],
        jobIds: [...updated[existingIdx].jobIds, ...mcSelectedJobIds],
        jobTitles: [...updated[existingIdx].jobTitles, ...selectedJobs.map(j => j.title)],
      };
      setCompanyJobSelections(updated);
    } else {
      setCompanyJobSelections(prev => [...prev, {
        companyId: mcSelectedCompanyId,
        companyName: company?.name || "Unknown",
        jobIds: mcSelectedJobIds,
        jobTitles: selectedJobs.map(j => j.title),
      }]);
    }

    setMcSelectedCompanyId("");
    setMcSelectedJobIds([]);
  };

  const removeCompanySelection = (companyId: string) => {
    setCompanyJobSelections(prev => prev.filter(s => s.companyId !== companyId));
  };

  // ── Create drive (single or multi) ──
  const handleCreate = async () => {
    if (driveType === "single") {
      if (selectedJobIds.length === 0) { showToast("error", "Please select at least one job role"); return; }
      setIsCreating(true);
      try {
        const company = companies.find((c) => c.id === selectedCompanyId);
        const selectedJobs = jobs.filter((j) => selectedJobIds.includes(j.id));
        const jobTitles = selectedJobs.map((j) => j.title).join(", ");
        await adminApi.createDrive({
          title: title || `${company?.name || "Company"} - ${jobTitles}`,
          type: "single",
          jobIds: selectedJobIds,
          jobId: selectedJobIds[0],
          description: description || undefined,
          driveDate: driveDate || undefined,
          departments: selectedDepts.length > 0 ? selectedDepts : undefined,
          batchIds: selectedBatchIds.length > 0 ? selectedBatchIds : undefined,
        });
        showToast("success", "Drive created successfully! Eligible students notified.");
        onCreated();
      } catch (err: unknown) {
        showToast("error", err instanceof Error ? err.message : "Failed to create drive");
      } finally {
        setIsCreating(false);
      }
    } else {
      // Multi-company
      if (companyJobSelections.length === 0) { showToast("error", "Please add at least one company with jobs"); return; }
      setIsCreating(true);
      try {
        const companyNames = companyJobSelections.map(s => s.companyName).join(", ");
        await adminApi.createDrive({
          title: title || `Multi-Company Drive — ${companyNames}`,
          type: "multiple",
          companyJobs: companyJobSelections.map(s => ({
            companyId: s.companyId,
            jobIds: s.jobIds,
          })),
          description: description || undefined,
          driveDate: driveDate || undefined,
          departments: selectedDepts.length > 0 ? selectedDepts : undefined,
          batchIds: selectedBatchIds.length > 0 ? selectedBatchIds : undefined,
        });
        showToast("success", "Multi-company drive created! Students can now join.");
        onCreated();
      } catch (err: unknown) {
        showToast("error", err instanceof Error ? err.message : "Failed to create drive");
      } finally {
        setIsCreating(false);
      }
    }
  };

  const selectedCompany = companies.find(c => c.id === selectedCompanyId);
  const mcSelectedCompany = companies.find(c => c.id === mcSelectedCompanyId);

  // Companies not yet added to multi-company selection
  const availableMcCompanies = companies.filter(c => !companyJobSelections.some(s => s.companyId === c.id) || allJobs.filter(j => j.companyId === c.id).length > (companyJobSelections.find(s => s.companyId === c.id)?.jobIds.length || 0));

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
              <p className="text-xs text-muted-foreground">
                {driveType === "multiple" && wizardStep === 1 && "Step 1: Select companies & jobs"}
                {driveType === "multiple" && wizardStep === 2 && "Step 2: Configure drive details"}
                {driveType === "multiple" && wizardStep === 3 && "Step 3: Review & confirm"}
                {driveType === "single" && "Select a company & job to start"}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-muted flex items-center justify-center text-muted-foreground">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-5">
          {/* Drive Type (always visible) */}
          <div>
            <label className="block text-[10px] font-semibold text-muted-foreground uppercase mb-2">Drive Type *</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => { setDriveType("single"); setWizardStep(1); }}
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
                onClick={() => { setDriveType("multiple"); setWizardStep(1); }}
                className={cn(
                  "px-4 py-3 rounded-xl border text-sm font-medium transition-all",
                  driveType === "multiple"
                    ? "bg-indigo-50 border-indigo-200 text-indigo-700"
                    : "bg-white border-border text-muted-foreground hover:border-indigo-200"
                )}
              >
                <Building2 className="w-5 h-5 mx-auto mb-1" />
                Multiple Companies
              </button>
            </div>
          </div>

          {/* ════════════════════════════════════════════════════ */}
          {/* SINGLE COMPANY MODE (existing flow)                 */}
          {/* ════════════════════════════════════════════════════ */}
          {driveType === "single" && (
            <>
              {/* Step 1: Select Company */}
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

              {/* Step 2: Select Job */}
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
            </>
          )}

          {/* ════════════════════════════════════════════════════ */}
          {/* MULTI-COMPANY MODE — STEP 1: Select Companies+Jobs  */}
          {/* ════════════════════════════════════════════════════ */}
          {driveType === "multiple" && wizardStep === 1 && (
            <>
              {/* Already added companies */}
              {companyJobSelections.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-emerald-700 uppercase flex items-center gap-1.5">
                    <CheckSquare className="w-3.5 h-3.5" /> Selected Companies ({companyJobSelections.length})
                  </p>
                  {companyJobSelections.map((sel) => (
                    <div key={sel.companyId} className="flex items-center gap-3 p-3 bg-emerald-50 border border-emerald-200 rounded-xl">
                      <div className="w-9 h-9 rounded-lg bg-emerald-100 flex items-center justify-center text-xs font-bold text-emerald-700 flex-shrink-0">
                        {sel.companyName.charAt(0)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-foreground">{sel.companyName}</p>
                        <p className="text-xs text-muted-foreground truncate">{sel.jobTitles.join(", ")}</p>
                      </div>
                      <button onClick={() => removeCompanySelection(sel.companyId)}
                        className="w-7 h-7 rounded-lg hover:bg-red-100 flex items-center justify-center text-red-400 hover:text-red-600 transition-colors flex-shrink-0">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Select a company */}
              <div className="p-4 rounded-xl bg-gradient-to-r from-indigo-50 to-violet-50 border border-indigo-100">
                <p className="text-xs font-semibold text-indigo-700 uppercase mb-3 flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5" /> Select Company
                </p>
                {loadingCompanies ? (
                  <div className="flex items-center justify-center py-4 gap-2">
                    <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                    <span className="text-muted-foreground text-sm">Loading companies...</span>
                  </div>
                ) : availableMcCompanies.length === 0 ? (
                  <p className="text-muted-foreground text-sm py-3 text-center">All companies have been added.</p>
                ) : (
                  <div className="space-y-2 max-h-36 overflow-y-auto pr-1">
                    {availableMcCompanies.map((company) => (
                      <button
                        key={company.id}
                        onClick={() => setMcSelectedCompanyId(company.id)}
                        className={cn(
                          "w-full text-left px-4 py-3 rounded-xl border transition-all text-sm flex items-center justify-between",
                          mcSelectedCompanyId === company.id
                            ? "bg-indigo-600 border-indigo-600 text-white"
                            : "bg-white border-border text-foreground hover:border-indigo-300"
                        )}
                      >
                        <div>
                          <p className="font-medium">{company.name}</p>
                          {company.industry && (
                            <p className={cn("text-xs mt-0.5", mcSelectedCompanyId === company.id ? "text-indigo-200" : "text-muted-foreground")}>{company.industry}</p>
                          )}
                        </div>
                        <ChevronRight className={cn("w-4 h-4 flex-shrink-0", mcSelectedCompanyId === company.id ? "text-white" : "text-muted-foreground")} />
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Select jobs for the chosen company */}
              {mcSelectedCompanyId && (
                <div className="p-4 rounded-xl bg-gradient-to-r from-violet-50 to-purple-50 border border-violet-100">
                  <p className="text-xs font-semibold text-violet-700 uppercase mb-3 flex items-center gap-1.5">
                    <Briefcase className="w-3.5 h-3.5" /> Select Jobs by {mcSelectedCompany?.name} *
                  </p>
                  {mcLoadingJobs ? (
                    <div className="flex items-center justify-center py-4 gap-2">
                      <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                      <span className="text-muted-foreground text-sm">Loading jobs...</span>
                    </div>
                  ) : mcJobs.length === 0 ? (
                    <p className="text-muted-foreground text-sm py-3 text-center">No available jobs for {mcSelectedCompany?.name}.</p>
                  ) : (
                    <div className="space-y-2 max-h-36 overflow-y-auto pr-1">
                      {mcJobs.map((job) => {
                        const isSelected = mcSelectedJobIds.includes(job.id);
                        return (
                          <button
                            key={job.id}
                            onClick={() => toggleMcJobSelect(job.id)}
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

                  {/* Add button */}
                  {mcSelectedJobIds.length > 0 && (
                    <button
                      onClick={handleAddCompanyJobs}
                      className="mt-3 w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-violet-600 text-white text-sm font-semibold hover:bg-violet-700 transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                      Add {mcSelectedCompany?.name} with {mcSelectedJobIds.length} job{mcSelectedJobIds.length > 1 ? "s" : ""}
                    </button>
                  )}
                </div>
              )}
            </>
          )}

          {/* ════════════════════════════════════════════════════ */}
          {/* MULTI-COMPANY MODE — STEP 2: Configure Details      */}
          {/* ════════════════════════════════════════════════════ */}
          {driveType === "multiple" && wizardStep === 2 && (
            <>
              <div>
                <label className="block text-[10px] font-semibold text-muted-foreground uppercase mb-1.5">Drive Title (auto-generated if blank)</label>
                <input value={title} onChange={(e) => setTitle(e.target.value)}
                  placeholder={`Multi-Company Drive — ${companyJobSelections.map(s => s.companyName).join(", ")}`}
                  className="w-full px-3 py-2.5 rounded-lg border border-border text-sm outline-none bg-white text-foreground focus:border-indigo-400 transition-colors placeholder:text-muted-foreground" />
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-muted-foreground uppercase mb-1.5">Drive Date</label>
                <input type="date" value={driveDate} onChange={(e) => setDriveDate(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-lg border border-border text-sm outline-none bg-white text-foreground focus:border-indigo-400 transition-colors" />
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-muted-foreground uppercase mb-1.5">Target Departments</label>
                <div className="grid grid-cols-4 gap-2">
                  {DEPARTMENTS.map((dept) => (
                    <button key={dept} onClick={() => toggleDept(dept)}
                      className={cn(
                        "px-3 py-2 rounded-lg text-xs font-semibold border transition-all",
                        selectedDepts.includes(dept)
                          ? "bg-indigo-600 border-indigo-600 text-white"
                          : "bg-white border-border text-foreground hover:border-indigo-300"
                      )}>
                      {dept}
                    </button>
                  ))}
                </div>
                <p className="text-muted-foreground text-xs mt-1.5">Select departments to target (including GLOBAL for self-registered students)</p>
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-muted-foreground uppercase mb-1.5">Target Batches</label>
                <div className="grid grid-cols-4 gap-2">
                  {batches
                    .filter(b => selectedDepts.length === 0 || selectedDepts.includes(b.department))
                    .map((batch) => (
                    <button key={batch.id} onClick={() => toggleBatch(batch.id)}
                      className={cn(
                        "px-3 py-2 rounded-lg text-xs font-semibold border transition-all",
                        selectedBatchIds.includes(batch.id)
                          ? "bg-indigo-600 border-indigo-600 text-white"
                          : "bg-white border-border text-foreground hover:border-indigo-300"
                      )}>
                      {batch.name || `${batch.department} ${batch.year}`}
                    </button>
                  ))}
                </div>
                <p className="text-muted-foreground text-xs mt-1.5">Leave empty to include all batches</p>
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-muted-foreground uppercase mb-1.5">Description</label>
                <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} placeholder="Drive details, instructions, etc."
                  className="w-full px-3 py-2.5 rounded-lg border border-border text-sm outline-none bg-white text-foreground focus:border-indigo-400 transition-colors resize-none placeholder:text-muted-foreground" />
              </div>
            </>
          )}

          {/* ════════════════════════════════════════════════════ */}
          {/* MULTI-COMPANY MODE — STEP 3: Review & Confirm       */}
          {/* ════════════════════════════════════════════════════ */}
          {driveType === "multiple" && wizardStep === 3 && (
            <>
              <div className="p-4 rounded-xl bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200">
                <p className="text-xs font-semibold text-emerald-700 uppercase mb-3 flex items-center gap-1.5">
                  <Eye className="w-3.5 h-3.5" /> Review Your Selections
                </p>

                <div className="space-y-3">
                  {/* Drive Info */}
                  <div className="bg-white rounded-lg p-3 border border-emerald-100">
                    <p className="text-xs text-muted-foreground mb-1">Drive Title</p>
                    <p className="text-sm font-semibold text-foreground">
                      {title || `Multi-Company Drive — ${companyJobSelections.map(s => s.companyName).join(", ")}`}
                    </p>
                  </div>

                  {driveDate && (
                    <div className="bg-white rounded-lg p-3 border border-emerald-100 flex items-center gap-2">
                      <CalendarDays className="w-4 h-4 text-blue-500" />
                      <span className="text-sm text-foreground">{new Date(driveDate).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}</span>
                    </div>
                  )}

                  {/* Companies & Jobs */}
                  <div className="space-y-2">
                    <p className="text-xs text-muted-foreground font-medium">Companies & Roles ({companyJobSelections.length})</p>
                    {companyJobSelections.map((sel) => (
                      <div key={sel.companyId} className="bg-white rounded-lg p-3 border border-emerald-100">
                        <div className="flex items-center gap-2 mb-1.5">
                          <div className="w-7 h-7 rounded-md bg-indigo-100 flex items-center justify-center text-xs font-bold text-indigo-700">
                            {sel.companyName.charAt(0)}
                          </div>
                          <p className="text-sm font-semibold text-foreground">{sel.companyName}</p>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {sel.jobTitles.map((jt, i) => (
                            <span key={i} className="px-2 py-0.5 bg-violet-50 border border-violet-100 rounded text-[10px] font-medium text-violet-700">
                              {jt}
                            </span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Departments & Batches */}
                  {selectedDepts.length > 0 && (
                    <div className="bg-white rounded-lg p-3 border border-emerald-100">
                      <p className="text-xs text-muted-foreground mb-1.5 flex items-center gap-1"><GraduationCap className="w-3 h-3" /> Departments</p>
                      <div className="flex flex-wrap gap-1.5">
                        {selectedDepts.map(d => (
                          <span key={d} className="px-2 py-0.5 bg-indigo-50 border border-indigo-100 rounded text-[10px] font-medium text-indigo-600">{d}</span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Auto-approval note */}
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <p className="text-xs text-blue-700 font-medium">ℹ️ Students will be auto-approved when they join this multi-company drive. No manual approval needed.</p>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex flex-col gap-2 p-5 border-t border-border">
          {driveType === "single" && (
            <>
              <button
                onClick={handleCreate}
                disabled={isCreating || selectedJobIds.length === 0}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white text-sm font-semibold shadow-lg shadow-indigo-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {isCreating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                {isCreating ? "Creating..." : "Create Drive"}
              </button>
              <button onClick={onClose}
                className="w-full flex items-center justify-center px-4 py-2.5 rounded-xl border border-border text-sm font-medium text-foreground hover:bg-muted/50 transition-colors">
                Cancel
              </button>
            </>
          )}

          {driveType === "multiple" && (
            <div className="flex gap-2">
              {wizardStep > 1 && (
                <button
                  onClick={() => setWizardStep(wizardStep - 1)}
                  className="flex items-center justify-center gap-1.5 px-4 py-3 rounded-xl border border-border text-sm font-medium text-foreground hover:bg-muted/50 transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" /> Back
                </button>
              )}
              {wizardStep === 1 && (
                <button
                  onClick={() => setWizardStep(2)}
                  disabled={companyJobSelections.length === 0}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white text-sm font-semibold shadow-lg shadow-indigo-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  Next <ArrowRight className="w-4 h-4" />
                </button>
              )}
              {wizardStep === 2 && (
                <button
                  onClick={() => setWizardStep(3)}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white text-sm font-semibold shadow-lg shadow-indigo-500/20 transition-all"
                >
                  Review <ArrowRight className="w-4 h-4" />
                </button>
              )}
              {wizardStep === 3 && (
                <button
                  onClick={handleCreate}
                  disabled={isCreating}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white text-sm font-semibold shadow-lg shadow-emerald-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  {isCreating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                  {isCreating ? "Creating..." : "Create Multi-Company Drive"}
                </button>
              )}
              {wizardStep === 1 && (
                <button onClick={onClose}
                  className="flex items-center justify-center px-4 py-3 rounded-xl border border-border text-sm font-medium text-foreground hover:bg-muted/50 transition-colors">
                  Cancel
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
