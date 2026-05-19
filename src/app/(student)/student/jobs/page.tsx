"use client";

import Header from "@/components/layout/Header";
import { studentApi } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { cn } from "@/lib/utils";
import {
  Search,
  Briefcase,
  Building2,
  MapPin,
  IndianRupee,
  Clock,
  Users,
  ChevronDown,
  Check,
  X,
  Loader2,
  GraduationCap,
  Sparkles,
  Filter,
  ArrowUpRight,
  CalendarDays,
  BadgeCheck,
  Zap,
  Tag,
} from "lucide-react";
import { useState, useEffect, useCallback, useMemo } from "react";

interface JobPosting {
  id: string;
  title: string;
  companyName?: string;
  companyLogo?: string;
  description: string;
  ctcMinLpa?: number | null;
  ctcMaxLpa?: number | null;
  totalVacancies: number;
  workMode?: string | null;
  workLocation?: string | null;
  requiredSkills?: string[];
  allowedDepartments?: string[];
  jobType?: string;
  isUnpaid?: boolean;
  internshipDuration?: string | null;
  stipendAmount?: number | null;
  joiningDate?: string | null;
  bondYears?: number | null;
  createdAt?: string;
  alreadyApplied: boolean;
  applicationStatus?: string | null;
  applicationId?: string | null;
}

type FilterType = "all" | "placement" | "internship";

export default function StudentJobsPage() {
  const { user } = useAuth();
  const [jobs, setJobs] = useState<JobPosting[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<FilterType>("all");
  const [applyingId, setApplyingId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const fetchJobs = useCallback(async () => {
    try {
      setLoading(true);
      const res = await studentApi.getEligibleJobs();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const data = (res as any)?.data;
      setJobs(Array.isArray(data) ? data : []);
    } catch {
      setJobs([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  // Auto-dismiss toast
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const handleApply = async (jobId: string) => {
    setApplyingId(jobId);
    try {
      await studentApi.applyForJob(jobId);
      setToast({ message: "Application submitted successfully!", type: "success" });
      // Update local state
      setJobs((prev) =>
        prev.map((j) => (j.id === jobId ? { ...j, alreadyApplied: true } : j))
      );
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to apply";
      setToast({ message, type: "error" });
    } finally {
      setApplyingId(null);
    }
  };

  // Filtered jobs
  const filtered = useMemo(() => {
    let result = jobs;
    if (typeFilter !== "all") {
      result = result.filter((j) => (j.jobType || "placement") === typeFilter);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (j) =>
          j.title.toLowerCase().includes(q) ||
          j.companyName?.toLowerCase().includes(q) ||
          j.description?.toLowerCase().includes(q) ||
          j.requiredSkills?.some((s) => s.toLowerCase().includes(q))
      );
    }
    return result;
  }, [jobs, typeFilter, search]);

  // Counts
  const totalCount = jobs.length;
  const placementCount = jobs.filter((j) => (j.jobType || "placement") === "placement").length;
  const internshipCount = jobs.filter((j) => j.jobType === "internship").length;
  const appliedCount = jobs.filter((j) => j.alreadyApplied).length;

  const formatCtc = (job: JobPosting) => {
    if (job.isUnpaid) return "Unpaid";
    if (job.jobType === "internship" && job.stipendAmount) {
      return `₹${Number(job.stipendAmount).toLocaleString("en-IN")}/mo`;
    }
    if (job.ctcMinLpa) {
      return job.ctcMaxLpa
        ? `${job.ctcMinLpa} – ${job.ctcMaxLpa} LPA`
        : `${job.ctcMinLpa} LPA`;
    }
    return "Not disclosed";
  };

  const timeAgo = (dateStr?: string) => {
    if (!dateStr) return "";
    const diff = Date.now() - new Date(dateStr).getTime();
    const days = Math.floor(diff / 86400000);
    if (days === 0) return "Today";
    if (days === 1) return "Yesterday";
    if (days < 7) return `${days}d ago`;
    if (days < 30) return `${Math.floor(days / 7)}w ago`;
    return `${Math.floor(days / 30)}mo ago`;
  };

  return (
    <div className="page-enter">
      <Header
        userName={user?.email?.split("@")[0] || "Student"}
        userRole="Student"
        greeting="Job Board"
        subtitle={`${totalCount} eligible opportunities · ${appliedCount} applied`}
      />

      <div className="px-4 sm:px-6 md:px-8 pb-10 space-y-5">
        {/* ── Search + Filter Bar ── */}
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search by role, company, or skill..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-border bg-white text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 transition-all"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-muted flex items-center justify-center hover:bg-muted-foreground/20 transition-colors"
              >
                <X className="w-3 h-3 text-muted-foreground" />
              </button>
            )}
          </div>

          {/* Type filter pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 scrollbar-hide">
            {([
              { key: "all" as FilterType, label: "All", count: totalCount, icon: Sparkles },
              { key: "placement" as FilterType, label: "Placement", count: placementCount, icon: Briefcase },
              { key: "internship" as FilterType, label: "Internship", count: internshipCount, icon: GraduationCap },
            ]).map((f) => (
              <button
                key={f.key}
                onClick={() => setTypeFilter(f.key)}
                className={cn(
                  "flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all whitespace-nowrap border",
                  typeFilter === f.key
                    ? "bg-foreground text-white border-foreground shadow-md"
                    : "bg-white text-muted-foreground border-border hover:border-foreground/20 hover:text-foreground"
                )}
              >
                <f.icon className="w-3.5 h-3.5" />
                {f.label}
                <span className={cn(
                  "ml-0.5 text-[10px] px-1.5 py-0.5 rounded-full",
                  typeFilter === f.key ? "bg-white/20" : "bg-muted"
                )}>
                  {f.count}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* ── Job Listings ── */}
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="i-card p-5 animate-pulse">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-muted flex-shrink-0" />
                  <div className="flex-1 space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="h-4 bg-muted rounded w-32" />
                      <div className="h-5 bg-muted rounded-full w-20" />
                    </div>
                    <div className="h-3 bg-muted rounded w-24" />
                    <div className="flex gap-2">
                      <div className="h-5 bg-muted rounded-full w-14" />
                      <div className="h-5 bg-muted rounded-full w-16" />
                      <div className="h-5 bg-muted rounded-full w-12" />
                    </div>
                    <div className="h-3 bg-muted rounded w-full" />
                    <div className="h-3 bg-muted rounded w-3/4" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="i-card p-16 text-center">
            <div className="relative mx-auto w-16 h-16 mb-4">
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-indigo-400/20 to-violet-500/20 animate-pulse" />
              <div className="relative w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-500/30">
                <Briefcase className="w-7 h-7 text-white" />
              </div>
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-1">
              {search || typeFilter !== "all"
                ? "No matching jobs found"
                : "No eligible jobs right now"}
            </h3>
            <p className="text-sm text-muted-foreground max-w-sm mx-auto">
              {search || typeFilter !== "all"
                ? "Try adjusting your search or filter criteria"
                : "New opportunities are posted regularly. Check back soon!"}
            </p>
            {(search || typeFilter !== "all") && (
              <button
                onClick={() => { setSearch(""); setTypeFilter("all"); }}
                className="mt-4 text-sm font-medium text-primary hover:underline"
              >
                Clear all filters
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map((job) => {
              const isExpanded = expandedId === job.id;
              const isInternship = job.jobType === "internship";
              const postedAgo = timeAgo(job.createdAt);

              return (
                <div
                  key={job.id}
                  className={cn(
                    "i-card overflow-hidden transition-all duration-200",
                    isExpanded && "ring-2 ring-primary/20"
                  )}
                >
                  {/* Main card content */}
                  <div
                    className="p-4 sm:p-5 cursor-pointer"
                    onClick={() => setExpandedId(isExpanded ? null : job.id)}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                      {/* Left: Logo + Info */}
                      <div className="flex items-start gap-3 sm:gap-4 min-w-0">
                        {/* Company avatar */}
                        <div className={cn(
                          "w-11 h-11 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center text-sm sm:text-base font-bold flex-shrink-0 shadow-sm",
                          isInternship
                            ? "bg-gradient-to-br from-emerald-100 to-teal-100 text-emerald-700"
                            : "bg-gradient-to-br from-indigo-100 to-violet-100 text-indigo-700"
                        )}>
                          {job.companyLogo || job.companyName?.charAt(0) || "?"}
                        </div>

                        <div className="min-w-0 flex-1">
                          {/* Title row */}
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="text-sm font-semibold text-foreground truncate">
                              {job.title}
                            </h3>
                            {/* Type badge */}
                            <span className={cn(
                              "text-[10px] font-semibold px-2 py-0.5 rounded-full flex-shrink-0",
                              isInternship
                                ? "bg-emerald-50 text-emerald-600 border border-emerald-200"
                                : "bg-indigo-50 text-indigo-600 border border-indigo-200"
                            )}>
                              {isInternship ? "Internship" : "Placement"}
                            </span>
                            {job.isUnpaid && (
                              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-50 text-amber-600 border border-amber-200 flex-shrink-0">
                                Unpaid
                              </span>
                            )}
                            {job.alreadyApplied && (
                              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-green-50 text-green-600 border border-green-200 flex items-center gap-0.5 flex-shrink-0">
                                <BadgeCheck className="w-3 h-3" /> Applied
                              </span>
                            )}
                          </div>

                          {/* Company name */}
                          <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                            <Building2 className="w-3 h-3" />
                            {job.companyName || "Company"}
                          </p>

                          {/* Meta tags */}
                          <div className="flex items-center gap-3 sm:gap-4 mt-2 text-[10px] text-muted-foreground flex-wrap">
                            <div className="flex items-center gap-1">
                              <IndianRupee className="w-3 h-3" />
                              <span className="font-medium text-foreground">{formatCtc(job)}</span>
                            </div>
                            {job.workLocation && (
                              <div className="flex items-center gap-1">
                                <MapPin className="w-3 h-3" /> {job.workLocation}
                              </div>
                            )}
                            {job.workMode && (
                              <div className="flex items-center gap-1">
                                <Briefcase className="w-3 h-3" /> {job.workMode}
                              </div>
                            )}
                            {job.totalVacancies > 0 && (
                              <div className="flex items-center gap-1">
                                <Users className="w-3 h-3" /> {job.totalVacancies} positions
                              </div>
                            )}
                            {isInternship && job.internshipDuration && (
                              <div className="flex items-center gap-1">
                                <Clock className="w-3 h-3" /> {job.internshipDuration}
                              </div>
                            )}
                            {postedAgo && (
                              <div className="flex items-center gap-1">
                                <CalendarDays className="w-3 h-3" /> {postedAgo}
                              </div>
                            )}
                          </div>

                          {/* Skills tags (compact on mobile) */}
                          {job.requiredSkills && job.requiredSkills.length > 0 && (
                            <div className="flex items-center gap-1.5 mt-2.5 flex-wrap">
                              {job.requiredSkills.slice(0, isExpanded ? undefined : 4).map((skill) => (
                                <span
                                  key={skill}
                                  className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-muted/60 text-muted-foreground border border-border/50"
                                >
                                  {skill}
                                </span>
                              ))}
                              {!isExpanded && job.requiredSkills.length > 4 && (
                                <span className="text-[10px] text-muted-foreground">
                                  +{job.requiredSkills.length - 4} more
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Right: CTA + chevron */}
                      <div className="flex sm:flex-col items-center sm:items-end gap-2 flex-shrink-0">
                        {job.alreadyApplied ? (
                          <div className="flex items-center gap-1.5 text-xs font-semibold text-green-600 px-3 py-2 rounded-xl bg-green-50 border border-green-200">
                            <Check className="w-3.5 h-3.5" />
                            Applied
                          </div>
                        ) : (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleApply(job.id);
                            }}
                            disabled={applyingId === job.id}
                            className={cn(
                              "flex items-center gap-1.5 text-xs font-semibold px-4 py-2 rounded-xl transition-all",
                              "bg-foreground text-white hover:bg-foreground/90 shadow-md hover:shadow-lg active:scale-[0.97]",
                              applyingId === job.id && "opacity-70 cursor-not-allowed"
                            )}
                          >
                            {applyingId === job.id ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <Zap className="w-3.5 h-3.5" />
                            )}
                            {applyingId === job.id ? "Applying..." : "Apply Now"}
                          </button>
                        )}
                        <ChevronDown
                          className={cn(
                            "w-4 h-4 text-muted-foreground transition-transform hidden sm:block",
                            isExpanded && "rotate-180"
                          )}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Expanded details */}
                  {isExpanded && (
                    <div className="px-4 sm:px-5 pb-5 pt-0 space-y-4 border-t border-border/50 mt-0">
                      <div className="pt-4">
                        {/* Description */}
                        <div>
                          <h4 className="text-xs font-semibold text-foreground uppercase tracking-wide mb-1.5">
                            About this role
                          </h4>
                          <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
                            {job.description || "No description provided."}
                          </p>
                        </div>

                        {/* Details grid */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
                          {job.ctcMinLpa && (
                            <div className="p-3 rounded-xl bg-muted/30 border border-border/50">
                              <p className="text-[10px] text-muted-foreground uppercase font-semibold">
                                {isInternship ? "Stipend" : "Package"}
                              </p>
                              <p className="text-sm font-bold text-foreground mt-0.5">
                                {formatCtc(job)}
                              </p>
                            </div>
                          )}
                          {job.totalVacancies > 0 && (
                            <div className="p-3 rounded-xl bg-muted/30 border border-border/50">
                              <p className="text-[10px] text-muted-foreground uppercase font-semibold">Openings</p>
                              <p className="text-sm font-bold text-foreground mt-0.5">{job.totalVacancies}</p>
                            </div>
                          )}
                          {job.bondYears && (
                            <div className="p-3 rounded-xl bg-muted/30 border border-border/50">
                              <p className="text-[10px] text-muted-foreground uppercase font-semibold">Bond</p>
                              <p className="text-sm font-bold text-foreground mt-0.5">{job.bondYears} year{job.bondYears > 1 ? "s" : ""}</p>
                            </div>
                          )}
                          {job.joiningDate && (
                            <div className="p-3 rounded-xl bg-muted/30 border border-border/50">
                              <p className="text-[10px] text-muted-foreground uppercase font-semibold">Joining</p>
                              <p className="text-sm font-bold text-foreground mt-0.5">{job.joiningDate}</p>
                            </div>
                          )}
                          {isInternship && job.internshipDuration && (
                            <div className="p-3 rounded-xl bg-muted/30 border border-border/50">
                              <p className="text-[10px] text-muted-foreground uppercase font-semibold">Duration</p>
                              <p className="text-sm font-bold text-foreground mt-0.5">{job.internshipDuration}</p>
                            </div>
                          )}
                        </div>

                        {/* Departments */}
                        {job.allowedDepartments && job.allowedDepartments.length > 0 && (
                          <div className="mt-4">
                            <h4 className="text-xs font-semibold text-foreground uppercase tracking-wide mb-1.5">
                              Eligible Departments
                            </h4>
                            <div className="flex flex-wrap gap-1.5">
                              {job.allowedDepartments.map((dept) => (
                                <span
                                  key={dept}
                                  className="text-[10px] font-medium px-2.5 py-1 rounded-lg bg-violet-50 text-violet-600 border border-violet-200"
                                >
                                  {dept}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* All skills */}
                        {job.requiredSkills && job.requiredSkills.length > 0 && (
                          <div className="mt-4">
                            <h4 className="text-xs font-semibold text-foreground uppercase tracking-wide mb-1.5">
                              Required Skills
                            </h4>
                            <div className="flex flex-wrap gap-1.5">
                              {job.requiredSkills.map((skill) => (
                                <span
                                  key={skill}
                                  className="text-[10px] font-medium px-2.5 py-1 rounded-lg bg-blue-50 text-blue-600 border border-blue-200"
                                >
                                  {skill}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Bottom CTA */}
                        <div className="mt-5 pt-4 border-t border-border/50 flex items-center justify-between">
                          <p className="text-xs text-muted-foreground">
                            {postedAgo && `Posted ${postedAgo}`}
                          </p>
                          {!job.alreadyApplied ? (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleApply(job.id);
                              }}
                              disabled={applyingId === job.id}
                              className={cn(
                                "flex items-center gap-2 text-sm font-semibold px-5 py-2.5 rounded-xl transition-all",
                                "bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-lg shadow-indigo-500/30 hover:shadow-xl hover:shadow-indigo-500/40 active:scale-[0.97]",
                                applyingId === job.id && "opacity-70 cursor-not-allowed"
                              )}
                            >
                              {applyingId === job.id ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <ArrowUpRight className="w-4 h-4" />
                              )}
                              {applyingId === job.id ? "Submitting..." : "Apply for this role"}
                            </button>
                          ) : (
                            <div className="flex items-center gap-2 text-sm font-semibold text-green-600">
                              <BadgeCheck className="w-4 h-4" />
                              Application submitted
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Toast Notification ── */}
      {toast && (
        <div
          className={cn(
            "fixed bottom-24 md:bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-5 py-3 rounded-xl shadow-2xl text-sm font-medium transition-all animate-in slide-in-from-bottom-4 duration-300",
            toast.type === "success"
              ? "bg-emerald-600 text-white"
              : "bg-red-600 text-white"
          )}
        >
          {toast.type === "success" ? (
            <Check className="w-4 h-4" />
          ) : (
            <X className="w-4 h-4" />
          )}
          {toast.message}
          <button onClick={() => setToast(null)} className="ml-2 opacity-70 hover:opacity-100">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}
