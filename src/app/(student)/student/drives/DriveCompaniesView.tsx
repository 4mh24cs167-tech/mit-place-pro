"use client";

import { cn } from "@/lib/utils";
import { studentApi } from "@/lib/api";
import {
  ArrowLeft, Building2, Briefcase, Loader2, CheckCircle2,
  AlertCircle, MapPin, IndianRupee, Users, ChevronDown, ChevronUp,
  CalendarDays, X, Sparkles, GraduationCap, FileText,
} from "lucide-react";
import { useState, useEffect, useCallback } from "react";

interface JobDetail {
  id: string;
  title: string;
  description: string;
  ctcMinLpa: number | null;
  ctcMaxLpa: number | null;
  workMode: string | null;
  workLocation: string | null;
  requiredSkills: string[];
  allowedDepartments: string[];
  totalVacancies: number;
  jobType: string;
  attending: boolean;
  minCgpa?: number;
  minTenthPercent?: number;
  minTwelfthPercent?: number;
  maxBacklogs?: number;
  jdFileUrl?: string | null;
}

interface CompanyEntry {
  companyId: string;
  companyName: string;
  companyWebsite: string | null;
  companyDescription: string | null;
  companyLogo: string | null;
  jobs: JobDetail[];
}

interface DriveCompaniesData {
  driveId: string;
  driveTitle: string;
  driveDate: string | null;
  description: string | null;
  companies: CompanyEntry[];
}

interface Props {
  driveId: string;
  onBack: () => void;
}

export default function DriveCompaniesView({ driveId, onBack }: Props) {
  const [data, setData] = useState<DriveCompaniesData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [attendingJob, setAttendingJob] = useState<string | null>(null);
  const [expandedCompanies, setExpandedCompanies] = useState<Set<string>>(new Set());
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const res = await studentApi.getDriveCompanies(driveId) as any;
      setData(res?.data || null);
      // Expand all companies by default
      if (res?.data?.companies) {
        setExpandedCompanies(new Set(res.data.companies.map((c: CompanyEntry) => c.companyId)));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load drive companies");
    } finally {
      setLoading(false);
    }
  }, [driveId]);

  useEffect(() => { fetchData(); }, [fetchData]);

  useEffect(() => {
    if (toast) {
      const t = setTimeout(() => setToast(null), 4000);
      return () => clearTimeout(t);
    }
  }, [toast]);

  const handleAttend = async (jobId: string) => {
    try {
      setAttendingJob(jobId);
      await studentApi.attendDriveJob(driveId, jobId);
      setToast({ message: "You are now attending this company session!", type: "success" });
      await fetchData();
    } catch (err) {
      setToast({
        message: err instanceof Error ? err.message : "Failed to attend",
        type: "error",
      });
    } finally {
      setAttendingJob(null);
    }
  };

  const toggleCompany = (companyId: string) => {
    setExpandedCompanies(prev => {
      const n = new Set(prev);
      if (n.has(companyId)) n.delete(companyId); else n.add(companyId);
      return n;
    });
  };

  const totalJobs = data?.companies.reduce((sum, c) => sum + c.jobs.length, 0) || 0;
  const attendedJobs = data?.companies.reduce((sum, c) => sum + c.jobs.filter(j => j.attending).length, 0) || 0;

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Toast */}
      {toast && (
        <div className="fixed top-4 right-4 z-50 animate-in slide-in-from-top-2">
          <div className={cn(
            "px-4 py-3 rounded-xl shadow-lg border flex items-center gap-2.5 text-sm font-medium max-w-sm",
            toast.type === "success"
              ? "bg-emerald-50 text-emerald-800 border-emerald-200"
              : "bg-red-50 text-red-800 border-red-200"
          )}>
            {toast.type === "success" ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
            )}
            {toast.message}
            <button onClick={() => setToast(null)} className="ml-auto opacity-60 hover:opacity-100">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Back button */}
      <button onClick={onBack} className="flex items-center gap-2 text-muted-foreground hover:text-foreground text-sm transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back to Drives
      </button>

      {/* Loading */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
          <p className="text-muted-foreground text-sm">Loading companies...</p>
        </div>
      )}

      {/* Error */}
      {error && !loading && (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center">
            <AlertCircle className="w-7 h-7 text-red-500" />
          </div>
          <p className="text-red-600 text-sm">{error}</p>
          <button onClick={fetchData} className="px-4 py-2 bg-foreground text-white rounded-xl text-sm font-medium">Retry</button>
        </div>
      )}

      {/* Content */}
      {data && !loading && (
        <>
          {/* Drive header */}
          <div className="i-card p-5 sm:p-6">
            <h1 className="text-xl sm:text-2xl font-bold text-foreground">{data.driveTitle}</h1>
            <div className="flex flex-wrap items-center gap-3 mt-2 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <Building2 className="w-3.5 h-3.5" /> {data.companies.length} {data.companies.length === 1 ? "Company" : "Companies"}
              </span>
              <span className="flex items-center gap-1">
                <Briefcase className="w-3.5 h-3.5" /> {totalJobs} {totalJobs === 1 ? "Role" : "Roles"}
              </span>
              {data.driveDate && (
                <span className="flex items-center gap-1">
                  <CalendarDays className="w-3.5 h-3.5" />
                  {new Date(data.driveDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                </span>
              )}
            </div>
            {data.description && (
              <p className="text-sm text-muted-foreground mt-3">{data.description}</p>
            )}

            {/* Quick stats */}
            <div className="grid grid-cols-3 gap-3 mt-4">
              <div className="bg-indigo-50 rounded-xl p-3 text-center">
                <p className="text-xl font-bold text-indigo-600">{data.companies.length}</p>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider mt-0.5">Companies</p>
              </div>
              <div className="bg-violet-50 rounded-xl p-3 text-center">
                <p className="text-xl font-bold text-violet-600">{totalJobs}</p>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider mt-0.5">Roles</p>
              </div>
              <div className="bg-emerald-50 rounded-xl p-3 text-center">
                <p className="text-xl font-bold text-emerald-600">{attendedJobs}</p>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider mt-0.5">Attending</p>
              </div>
            </div>
          </div>

          {/* Companies */}
          <div className="space-y-4">
            {data.companies.map((company) => {
              const isExpanded = expandedCompanies.has(company.companyId);
              const attendingCount = company.jobs.filter(j => j.attending).length;

              return (
                <div key={company.companyId} className="i-card overflow-hidden">
                  {/* Company header */}
                  <button
                    onClick={() => toggleCompany(company.companyId)}
                    className="w-full flex items-center justify-between p-4 sm:p-5 hover:bg-muted/30 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-indigo-100 to-violet-100 flex items-center justify-center text-sm font-bold text-indigo-700 flex-shrink-0">
                        {company.companyLogo || company.companyName.charAt(0)}
                      </div>
                      <div className="text-left">
                        <h3 className="text-sm font-semibold text-foreground">{company.companyName}</h3>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {company.jobs.length} {company.jobs.length === 1 ? "role" : "roles"}
                          {attendingCount > 0 && (
                            <span className="text-emerald-600 ml-1">· {attendingCount} attending</span>
                          )}
                        </p>
                      </div>
                    </div>
                    {isExpanded ? (
                      <ChevronUp className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                    )}
                  </button>

                  {/* Jobs list */}
                  {isExpanded && (
                    <div className="border-t border-border/50">
                      {company.jobs.map((job, jobIdx) => (
                        <div
                          key={job.id}
                          className={cn(
                            "p-4 sm:p-5",
                            jobIdx > 0 && "border-t border-border/30"
                          )}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-2">
                                <Briefcase className="w-4 h-4 text-violet-500 flex-shrink-0" />
                                <h4 className="text-sm font-semibold text-foreground">{job.title}</h4>
                                {job.jobType === "internship" && (
                                  <span className="px-2 py-0.5 bg-blue-50 border border-blue-100 rounded text-[10px] font-medium text-blue-600">Internship</span>
                                )}
                              </div>

                              {job.description && (
                                <p className="text-xs text-muted-foreground mb-3 line-clamp-3">{job.description}</p>
                              )}

                              <div className="grid grid-cols-2 gap-2">
                                {(job.ctcMinLpa != null || job.ctcMaxLpa != null) && (
                                  <div className="flex items-center gap-1.5 text-xs">
                                    <IndianRupee className="w-3 h-3 text-emerald-500" />
                                    <span className="text-foreground font-medium">
                                      {job.ctcMinLpa || 0} - {job.ctcMaxLpa || 0} LPA
                                    </span>
                                  </div>
                                )}
                                {job.workMode && (
                                  <div className="flex items-center gap-1.5 text-xs">
                                    <MapPin className="w-3 h-3 text-blue-500" />
                                    <span className="text-foreground font-medium">{job.workMode}</span>
                                    {job.workLocation && <span className="text-muted-foreground">({job.workLocation})</span>}
                                  </div>
                                )}
                                {job.totalVacancies > 0 && (
                                  <div className="flex items-center gap-1.5 text-xs">
                                    <Users className="w-3 h-3 text-amber-500" />
                                    <span className="text-foreground font-medium">{job.totalVacancies} vacancies</span>
                                  </div>
                                )}
                              </div>

                              {job.requiredSkills && job.requiredSkills.length > 0 && (
                                <div className="flex flex-wrap gap-1.5 mt-2.5">
                                  {job.requiredSkills.map((skill) => (
                                    <span key={skill} className="px-2 py-0.5 bg-slate-50 border border-slate-200 rounded text-[10px] font-medium text-slate-600">
                                      {skill}
                                    </span>
                                  ))}
                                </div>
                              )}

                              {/* Minimum Qualifications */}
                              {((job.minCgpa && job.minCgpa > 0) || (job.minTenthPercent && job.minTenthPercent > 0) || (job.minTwelfthPercent && job.minTwelfthPercent > 0) || (job.maxBacklogs !== undefined && job.maxBacklogs >= 0)) && (
                                <div className="mt-3 p-2.5 bg-amber-50/50 border border-amber-100 rounded-lg">
                                  <p className="text-[10px] font-semibold text-amber-700 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                                    <GraduationCap className="w-3 h-3" /> Minimum Qualifications
                                  </p>
                                  <div className="flex flex-wrap gap-2">
                                    {job.minCgpa !== undefined && job.minCgpa > 0 && (
                                      <span className="px-2 py-0.5 bg-white border border-amber-200 rounded text-[10px] font-medium text-amber-800">
                                        CGPA ≥ {job.minCgpa}
                                      </span>
                                    )}
                                    {job.minTenthPercent !== undefined && job.minTenthPercent > 0 && (
                                      <span className="px-2 py-0.5 bg-white border border-amber-200 rounded text-[10px] font-medium text-amber-800">
                                        10th ≥ {job.minTenthPercent}%
                                      </span>
                                    )}
                                    {job.minTwelfthPercent !== undefined && job.minTwelfthPercent > 0 && (
                                      <span className="px-2 py-0.5 bg-white border border-amber-200 rounded text-[10px] font-medium text-amber-800">
                                        12th ≥ {job.minTwelfthPercent}%
                                      </span>
                                    )}
                                    {job.maxBacklogs !== undefined && job.maxBacklogs >= 0 && (
                                      <span className="px-2 py-0.5 bg-white border border-amber-200 rounded text-[10px] font-medium text-amber-800">
                                        Max Backlogs: {job.maxBacklogs}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              )}

                              {/* JD PDF Link */}
                              {job.jdFileUrl && (
                                <a
                                  href={job.jdFileUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="mt-2.5 inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 border border-indigo-100 rounded-lg text-xs font-medium text-indigo-700 hover:bg-indigo-100 transition-colors"
                                >
                                  <FileText className="w-3.5 h-3.5" />
                                  View Job Description PDF
                                </a>
                              )}
                            </div>

                            {/* Attend button */}
                            <div className="flex-shrink-0">
                              {job.attending ? (
                                <div className="flex items-center gap-1.5 px-4 py-2 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-semibold text-emerald-700">
                                  <CheckCircle2 className="w-4 h-4" />
                                  Attending
                                </div>
                              ) : (
                                <button
                                  onClick={() => handleAttend(job.id)}
                                  disabled={attendingJob === job.id}
                                  className={cn(
                                    "flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold transition-all",
                                    "bg-gradient-to-r from-indigo-600 to-violet-600 text-white",
                                    "hover:from-indigo-700 hover:to-violet-700",
                                    "disabled:opacity-60 disabled:cursor-not-allowed",
                                    "shadow-sm"
                                  )}
                                >
                                  {attendingJob === job.id ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                  ) : (
                                    <Sparkles className="w-4 h-4" />
                                  )}
                                  {attendingJob === job.id ? "Joining..." : "Attend"}
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
