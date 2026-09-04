"use client";

import Header from "@/components/layout/Header";
import { companyApi } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { cn } from "@/lib/utils";
import {
  Briefcase,
  Plus,
  Search,
  MapPin,
  DollarSign,
  Users,
  GraduationCap,
  Clock,
  FileText,
  CheckCircle2,
  AlertCircle,
  Loader2,
  X,
  ChevronDown,
  ChevronUp,
  ArrowUpRight,
  ShieldAlert,
} from "lucide-react";
import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";

interface Job {
  id: string;
  title: string;
  description?: string;
  requiredSkills?: string[];
  allowedDepartments?: string[];
  minCgpa?: number;
  minTenthPercent?: number;
  minTwelfthPercent?: number;
  maxBacklogs?: number;
  ctcMinLpa?: number | null;
  ctcMaxLpa?: number | null;
  totalVacancies?: number;
  status?: string;
  jobType?: string;
  stipendAmount?: number | null;
  bondYears?: number | null;
  bondAmountInr?: number | null;
  workLocation?: string | null;
  createdAt?: string;
  totalApplicants?: number;
  selected?: number;
}

export default function CompanyJobsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const queryClient = useQueryClient();

  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [expandedDesc, setExpandedDesc] = useState<Record<string, boolean>>({});
  const [publishingId, setPublishingId] = useState<string | null>(null);

  // Modal State
  const [showCreateJob, setShowCreateJob] = useState(false);
  const [jobSaving, setJobSaving] = useState(false);
  const [jobError, setJobError] = useState("");
  const [jobSuccess, setJobSuccess] = useState("");
  const [jobForm, setJobForm] = useState({
    title: "",
    description: "",
    location: "",
    ctcMinLpa: "",
    ctcMaxLpa: "",
    minQualification: "UG",
    minQualificationScore: "",
    openPositions: "1",
    jobType: "placement",
    stipendAmount: "",
    bondYears: "",
    bondAmountInr: "",
  });
  const [jdFile, setJdFile] = useState<File | null>(null);

  // Fetch Jobs
  const {
    data: jobs = [],
    isLoading,
    error,
  } = useQuery<Job[]>({
    queryKey: ["company", "jobs"],
    queryFn: async () => {
      const res = await companyApi.getJobs();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const data = (res as any)?.data;
      return Array.isArray(data) ? data : [];
    },
  });

  // Filtered jobs
  const filteredJobs = useMemo(() => {
    return jobs.filter((job) => {
      const matchesSearch =
        searchQuery === "" ||
        job.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        job.workLocation?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        job.allowedDepartments?.some((d) =>
          d.toLowerCase().includes(searchQuery.toLowerCase())
        );

      const matchesType =
        typeFilter === "all" ||
        (typeFilter === "placement" && (!job.jobType || job.jobType === "placement")) ||
        job.jobType === typeFilter;

      const matchesStatus =
        statusFilter === "all" || job.status === statusFilter;

      return matchesSearch && matchesType && matchesStatus;
    });
  }, [jobs, searchQuery, typeFilter, statusFilter]);

  // Aggregate stats
  const totalVacancies = jobs.reduce(
    (sum, j) => sum + (Number(j.totalVacancies) || 0),
    0
  );
  const activeJobs = jobs.filter(
    (j) => j.status === "active" || j.status === "open"
  ).length;
  const totalApplicants = jobs.reduce(
    (sum, j) => sum + (Number(j.totalApplicants) || 0),
    0
  );

  const toggleExpand = (id: string) => {
    setExpandedDesc((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handlePublish = async (jobId: string) => {
    try {
      setPublishingId(jobId);
      await companyApi.publishJob(jobId);
      queryClient.invalidateQueries({ queryKey: ["company", "jobs"] });
    } catch {
      alert("Failed to publish job. Please try again.");
    } finally {
      setPublishingId(null);
    }
  };

  return (
    <div className="page-enter">
      <Header
        userName={user?.email?.split("@")[0] || "Company User"}
        userRole="Company"
        greeting="Posted Jobs"
        subtitle={`${jobs.length} job${jobs.length !== 1 ? "s" : ""} posted · Manage your open positions and roles`}
      />

      <div className="px-4 sm:px-6 md:px-8 pb-12 space-y-6">
        {/* Top Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            {
              label: "Total Posted Jobs",
              value: jobs.length,
              icon: Briefcase,
              color: "from-indigo-50 to-violet-50 text-indigo-600 border-indigo-100/60",
            },
            {
              label: "Active Openings",
              value: activeJobs,
              icon: CheckCircle2,
              color: "from-emerald-50 to-teal-50 text-emerald-600 border-emerald-100/60",
            },
            {
              label: "Total Vacancies",
              value: totalVacancies,
              icon: Users,
              color: "from-blue-50 to-cyan-50 text-blue-600 border-blue-100/60",
            },
            {
              label: "Total Applicants",
              value: totalApplicants,
              icon: GraduationCap,
              color: "from-purple-50 to-pink-50 text-purple-600 border-purple-100/60",
            },
          ].map((stat) => (
            <div
              key={stat.label}
              className={cn(
                "i-card p-4 sm:p-5 bg-gradient-to-br border flex items-center gap-4",
                stat.color
              )}
            >
              <div className="w-11 h-11 rounded-2xl bg-white/80 shadow-sm flex items-center justify-center flex-shrink-0">
                <stat.icon className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xl sm:text-2xl font-bold text-foreground">
                  {isLoading ? "—" : stat.value}
                </p>
                <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
                  {stat.label}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Action & Filters Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-border shadow-sm">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-muted-foreground absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by title, location, department..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-sm rounded-xl border border-border/80 bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 placeholder:text-muted-foreground/60"
            />
          </div>

          {/* Filters & Post Button */}
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-3 py-2 rounded-xl border border-border bg-background text-xs sm:text-sm text-foreground outline-none cursor-pointer focus:border-indigo-400"
            >
              <option value="all">All Types</option>
              <option value="placement">Full Time</option>
              <option value="internship">Internship</option>
              <option value="internship_plus_placement">Intern + FTE</option>
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 rounded-xl border border-border bg-background text-xs sm:text-sm text-foreground outline-none cursor-pointer focus:border-indigo-400"
            >
              <option value="all">All Statuses</option>
              <option value="open">Open</option>
              <option value="active">Active</option>
              <option value="draft">Draft</option>
              <option value="closed">Closed</option>
            </select>

            <button
              onClick={() => setShowCreateJob(true)}
              className="flex items-center gap-1.5 px-4 sm:px-5 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white text-xs sm:text-sm font-semibold shadow-md shadow-indigo-500/20 hover:shadow-indigo-500/30 transition-all ml-auto"
            >
              <Plus className="w-4 h-4" />
              <span>Post Job</span>
            </button>
          </div>
        </div>

        {/* Error State */}
        {error && (
          <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-600 flex items-center gap-3">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <p className="text-sm font-medium">
              Failed to load jobs. Please check your connection and try again.
            </p>
          </div>
        )}

        {/* Loading State */}
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="i-card p-6 animate-pulse space-y-4">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-muted" />
                  <div className="flex-1 space-y-2">
                    <div className="h-5 bg-muted rounded w-1/3" />
                    <div className="h-3 bg-muted rounded w-1/4" />
                  </div>
                </div>
                <div className="h-4 bg-muted rounded w-3/4" />
                <div className="h-4 bg-muted rounded w-1/2" />
              </div>
            ))}
          </div>
        ) : filteredJobs.length === 0 ? (
          /* Empty State */
          <div className="i-card p-12 text-center border-dashed border-2">
            <div className="w-14 h-14 rounded-2xl bg-indigo-50 flex items-center justify-center mx-auto mb-4 text-indigo-600">
              <Briefcase className="w-7 h-7" />
            </div>
            <h3 className="text-base font-semibold text-foreground mb-1">
              {searchQuery || typeFilter !== "all" || statusFilter !== "all"
                ? "No matching jobs found"
                : "No jobs posted yet"}
            </h3>
            <p className="text-xs sm:text-sm text-muted-foreground max-w-sm mx-auto mb-6">
              {searchQuery || typeFilter !== "all" || statusFilter !== "all"
                ? "Try adjusting your search filters to find what you're looking for."
                : "Post your first role to start accepting student applications and campus hiring."}
            </p>
            <button
              onClick={() => setShowCreateJob(true)}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white text-xs sm:text-sm font-semibold shadow-md shadow-indigo-500/20 hover:shadow-indigo-500/30 transition-all"
            >
              <Plus className="w-4 h-4" />
              Post New Job
            </button>
          </div>
        ) : (
          /* Job Cards List */
          <div className="space-y-4">
            {filteredJobs.map((job) => {
              const jobTypeLabel =
                job.jobType === "internship"
                  ? "Internship"
                  : job.jobType === "internship_plus_placement"
                  ? "Intern + FTE"
                  : "Full Time";

              const jobTypeBadgeClass =
                job.jobType === "internship"
                  ? "bg-blue-50 text-blue-700 border-blue-200"
                  : job.jobType === "internship_plus_placement"
                  ? "bg-purple-50 text-purple-700 border-purple-200"
                  : "bg-emerald-50 text-emerald-700 border-emerald-200";

              const status = job.status || "open";
              const isDraft = status === "draft";

              return (
                <div
                  key={job.id}
                  className="i-card p-5 sm:p-6 transition-all hover:shadow-md border border-border space-y-4"
                >
                  {/* Top Bar: Title, Badges, Actions */}
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                    <div className="flex items-start gap-3.5">
                      <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-indigo-100 to-violet-100 flex items-center justify-center text-indigo-600 flex-shrink-0 mt-0.5">
                        <Briefcase className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="text-base font-bold text-foreground">
                            {job.title}
                          </h3>
                          <span
                            className={cn(
                              "px-2.5 py-0.5 rounded-full text-[11px] font-semibold border",
                              jobTypeBadgeClass
                            )}
                          >
                            {jobTypeLabel}
                          </span>
                          <span
                            className={cn(
                              "px-2.5 py-0.5 rounded-full text-[11px] font-semibold border capitalize flex items-center gap-1",
                              isDraft
                                ? "bg-amber-50 text-amber-700 border-amber-200"
                                : status === "closed"
                                ? "bg-gray-100 text-gray-700 border-gray-200"
                                : "bg-emerald-50 text-emerald-700 border-emerald-200"
                            )}
                          >
                            <span
                              className={cn(
                                "w-1.5 h-1.5 rounded-full",
                                isDraft
                                  ? "bg-amber-500"
                                  : status === "closed"
                                  ? "bg-gray-500"
                                  : "bg-emerald-500"
                              )}
                            />
                            {status}
                          </span>
                        </div>
                        {job.createdAt && (
                          <p className="text-[11px] text-muted-foreground mt-0.5">
                            Posted on{" "}
                            {new Date(job.createdAt).toLocaleDateString(
                              "en-US",
                              {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                              }
                            )}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Right side actions */}
                    <div className="flex items-center gap-2 self-end sm:self-auto">
                      {isDraft && (
                        <button
                          onClick={() => handlePublish(job.id)}
                          disabled={publishingId === job.id}
                          className="px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-semibold shadow-sm transition-all disabled:opacity-50 flex items-center gap-1.5"
                        >
                          {publishingId === job.id ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <CheckCircle2 className="w-3.5 h-3.5" />
                          )}
                          Publish
                        </button>
                      )}
                      <button
                        onClick={() => router.push(`/company/candidates`)}
                        className="px-3.5 py-1.5 rounded-xl border border-border bg-white text-foreground hover:bg-muted/40 text-xs font-semibold transition-all flex items-center gap-1.5 shadow-sm"
                      >
                        <span>View Candidates</span>
                        <ArrowUpRight className="w-3.5 h-3.5 text-muted-foreground" />
                      </button>
                    </div>
                  </div>

                  {/* Highlights Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 py-3 px-4 rounded-xl bg-muted/20 border border-border/50 text-xs">
                    {/* Compensation */}
                    <div>
                      <span className="text-[10px] text-muted-foreground uppercase font-medium block mb-0.5">
                        {job.jobType === "internship" ? "Stipend" : "CTC Range"}
                      </span>
                      <div className="flex items-center gap-1 font-semibold text-foreground">
                        <DollarSign className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                        {job.jobType === "internship" && job.stipendAmount ? (
                          `₹${job.stipendAmount.toLocaleString()}/mo`
                        ) : job.ctcMinLpa || job.ctcMaxLpa ? (
                          `${job.ctcMinLpa || 0} – ${job.ctcMaxLpa || 0} LPA`
                        ) : (
                          "Disclosed Later"
                        )}
                      </div>
                    </div>

                    {/* Location */}
                    <div>
                      <span className="text-[10px] text-muted-foreground uppercase font-medium block mb-0.5">
                        Location
                      </span>
                      <div className="flex items-center gap-1 font-semibold text-foreground">
                        <MapPin className="w-3.5 h-3.5 text-blue-600 flex-shrink-0" />
                        <span className="truncate">
                          {job.workLocation || "On-site"}
                        </span>
                      </div>
                    </div>

                    {/* Vacancies */}
                    <div>
                      <span className="text-[10px] text-muted-foreground uppercase font-medium block mb-0.5">
                        Open Positions
                      </span>
                      <div className="flex items-center gap-1 font-semibold text-foreground">
                        <Users className="w-3.5 h-3.5 text-amber-600 flex-shrink-0" />
                        <span>
                          {job.totalVacancies ?? 1}{" "}
                          {(job.totalVacancies ?? 1) === 1
                            ? "Position"
                            : "Positions"}
                        </span>
                      </div>
                    </div>

                    {/* Qualification / Score */}
                    <div>
                      <span className="text-[10px] text-muted-foreground uppercase font-medium block mb-0.5">
                        Min Requirement
                      </span>
                      <div className="flex items-center gap-1 font-semibold text-foreground">
                        <GraduationCap className="w-3.5 h-3.5 text-violet-600 flex-shrink-0" />
                        <span>
                          {job.minCgpa
                            ? `${job.minCgpa} CGPA`
                            : job.minTenthPercent
                            ? `${job.minTenthPercent}%`
                            : "Any"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Allowed Departments & Bond details */}
                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    {job.allowedDepartments &&
                      job.allowedDepartments.length > 0 && (
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-muted-foreground text-[11px] font-medium">
                            Eligible Depts:
                          </span>
                          {job.allowedDepartments.map((dept) => (
                            <span
                              key={dept}
                              className="px-2 py-0.5 rounded-lg bg-indigo-50/70 border border-indigo-100 text-indigo-700 text-[10px] font-semibold"
                            >
                              {dept}
                            </span>
                          ))}
                        </div>
                      )}

                    {job.bondYears && job.bondYears > 0 && (
                      <div className="flex items-center gap-1 text-[11px] text-amber-700 bg-amber-50 px-2 py-0.5 rounded-lg border border-amber-200">
                        <ShieldAlert className="w-3 h-3 text-amber-600" />
                        <span>
                          {job.bondYears} Yr Bond
                          {job.bondAmountInr
                            ? ` (₹${job.bondAmountInr.toLocaleString()})`
                            : ""}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Description */}
                  {job.description && (
                    <div>
                      <p
                        className={cn(
                          "text-xs sm:text-sm text-foreground/80 leading-relaxed whitespace-pre-line",
                          !expandedDesc[job.id] && "line-clamp-2"
                        )}
                      >
                        {job.description}
                      </p>
                      {job.description.length > 150 && (
                        <button
                          onClick={() => toggleExpand(job.id)}
                          className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 mt-1 inline-flex items-center gap-0.5"
                        >
                          {expandedDesc[job.id] ? (
                            <>
                              Show less <ChevronUp className="w-3 h-3" />
                            </>
                          ) : (
                            <>
                              Read full description{" "}
                              <ChevronDown className="w-3 h-3" />
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  )}

                  {/* Metrics Footer */}
                  <div className="pt-3 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
                    <div className="flex items-center gap-6">
                      <div>
                        <span className="font-bold text-foreground text-sm">
                          {job.totalApplicants || 0}
                        </span>{" "}
                        Applicants
                      </div>
                      <div>
                        <span className="font-bold text-emerald-600 text-sm">
                          {job.selected || 0}
                        </span>{" "}
                        Selected
                      </div>
                    </div>

                    <button
                      onClick={() => router.push(`/company/candidates`)}
                      className="text-indigo-600 hover:text-indigo-700 font-semibold flex items-center gap-1 hover:underline"
                    >
                      <span>Review Pipeline</span>
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Create Job Modal ─────────────────────── */}
      {showCreateJob && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="bg-gradient-to-r from-indigo-600 to-violet-600 px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center">
                  <Briefcase className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Post New Job</h3>
                  <p className="text-xs text-white/70">
                    Fill in the details to post a job opening
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowCreateJob(false);
                  setJobError("");
                  setJobSuccess("");
                }}
                className="p-1.5 rounded-lg hover:bg-white/20 transition-colors"
              >
                <X className="w-5 h-5 text-white" />
              </button>
            </div>

            <div className="px-6 py-5 space-y-4 max-h-[65vh] overflow-y-auto">
              {jobError && (
                <div className="px-3.5 py-2.5 rounded-xl bg-red-50 border border-red-200 text-red-600 text-xs font-medium flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{jobError}</span>
                </div>
              )}
              {jobSuccess && (
                <div className="px-3.5 py-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-600 text-xs font-medium flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                  <span>{jobSuccess}</span>
                </div>
              )}

              <div>
                <label className="text-xs font-semibold text-foreground mb-1 flex items-center gap-1.5">
                  <Briefcase className="w-3.5 h-3.5 text-indigo-500" /> Job Title{" "}
                  <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={jobForm.title}
                  onChange={(e) =>
                    setJobForm((f) => ({ ...f, title: e.target.value }))
                  }
                  placeholder="e.g. Full Stack Developer"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-border text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 bg-background text-foreground"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-foreground mb-1 flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-indigo-500" /> Description
                </label>
                <textarea
                  value={jobForm.description}
                  onChange={(e) =>
                    setJobForm((f) => ({ ...f, description: e.target.value }))
                  }
                  placeholder="Job description, responsibilities, skills..."
                  rows={3}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-border text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 resize-none bg-background text-foreground"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-foreground mb-1 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-indigo-500" /> Location
                  </label>
                  <input
                    type="text"
                    value={jobForm.location}
                    onChange={(e) =>
                      setJobForm((f) => ({ ...f, location: e.target.value }))
                    }
                    placeholder="e.g. Mysuru / Bengaluru"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-border text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 bg-background text-foreground"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-foreground mb-1 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-indigo-500" /> Positions
                  </label>
                  <input
                    type="number"
                    value={jobForm.openPositions}
                    onChange={(e) =>
                      setJobForm((f) => ({ ...f, openPositions: e.target.value }))
                    }
                    placeholder="1"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-border text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 bg-background text-foreground"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-foreground mb-1 flex items-center gap-1.5">
                    <DollarSign className="w-3.5 h-3.5 text-indigo-500" /> Min CTC
                    (LPA)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={jobForm.ctcMinLpa}
                    onChange={(e) =>
                      setJobForm((f) => ({ ...f, ctcMinLpa: e.target.value }))
                    }
                    placeholder="e.g. 4.5"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-border text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 bg-background text-foreground"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-foreground mb-1 flex items-center gap-1.5">
                    <DollarSign className="w-3.5 h-3.5 text-indigo-500" /> Max CTC
                    (LPA)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={jobForm.ctcMaxLpa}
                    onChange={(e) =>
                      setJobForm((f) => ({ ...f, ctcMaxLpa: e.target.value }))
                    }
                    placeholder="e.g. 8.0"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-border text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 bg-background text-foreground"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-foreground mb-1 flex items-center gap-1.5">
                    <GraduationCap className="w-3.5 h-3.5 text-indigo-500" /> Min
                    Qualification
                  </label>
                  <select
                    value={jobForm.minQualification}
                    onChange={(e) =>
                      setJobForm((f) => ({
                        ...f,
                        minQualification: e.target.value,
                      }))
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl border border-border text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 bg-background text-foreground"
                  >
                    <option value="SSLC">SSLC</option>
                    <option value="PUC">PUC / Diploma</option>
                    <option value="UG">Undergraduate (UG)</option>
                    <option value="PG">Postgraduate (PG)</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-foreground mb-1 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-indigo-500" /> Min.{" "}
                    {jobForm.minQualification === "UG" ||
                    jobForm.minQualification === "PG"
                      ? "CGPA"
                      : "Percentage"}
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={jobForm.minQualificationScore}
                    onChange={(e) =>
                      setJobForm((f) => ({
                        ...f,
                        minQualificationScore: e.target.value,
                      }))
                    }
                    placeholder={
                      jobForm.minQualification === "UG" ||
                      jobForm.minQualification === "PG"
                        ? "e.g. 6.5"
                        : "e.g. 65"
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl border border-border text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 bg-background text-foreground"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-foreground mb-1 flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-indigo-500" /> Job Description PDF
                </label>
                <input
                  type="file"
                  accept=".pdf"
                  onChange={(e) => setJdFile(e.target.files?.[0] || null)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-border text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 bg-background text-foreground file:mr-3 file:rounded-lg file:border-0 file:bg-indigo-50 file:px-3 file:py-1 file:text-xs file:font-semibold file:text-indigo-700"
                />
                {jdFile && (
                  <p className="text-[10px] text-emerald-600 mt-1">✓ {jdFile.name}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-foreground mb-1 flex items-center gap-1.5">
                    <Briefcase className="w-3.5 h-3.5 text-indigo-500" /> Nature
                    of Recruitment
                  </label>
                  <select
                    value={jobForm.jobType}
                    onChange={(e) =>
                      setJobForm((f) => ({ ...f, jobType: e.target.value }))
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl border border-border text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 bg-background text-foreground"
                  >
                    <option value="placement">Full Time (Placement)</option>
                    <option value="internship">Internship</option>
                    <option value="internship_plus_placement">
                      Internship + Placement
                    </option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-foreground mb-1 flex items-center gap-1.5">
                    <DollarSign className="w-3.5 h-3.5 text-indigo-500" /> Stipend
                    (if Intern)
                  </label>
                  <input
                    type="number"
                    value={jobForm.stipendAmount}
                    onChange={(e) =>
                      setJobForm((f) => ({
                        ...f,
                        stipendAmount: e.target.value,
                      }))
                    }
                    placeholder="e.g. 20000"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-border text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 bg-background text-foreground"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-foreground mb-1 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-indigo-500" /> Bond (Years)
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    value={jobForm.bondYears}
                    onChange={(e) =>
                      setJobForm((f) => ({ ...f, bondYears: e.target.value }))
                    }
                    placeholder="e.g. 2"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-border text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 bg-background text-foreground"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-foreground mb-1 flex items-center gap-1.5">
                    <DollarSign className="w-3.5 h-3.5 text-indigo-500" /> Bond
                    Penalty (INR)
                  </label>
                  <input
                    type="number"
                    value={jobForm.bondAmountInr}
                    onChange={(e) =>
                      setJobForm((f) => ({
                        ...f,
                        bondAmountInr: e.target.value,
                      }))
                    }
                    placeholder="e.g. 100000"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-border text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 bg-background text-foreground"
                  />
                </div>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-border flex items-center justify-end gap-3 bg-muted/20">
              <button
                onClick={() => {
                  setShowCreateJob(false);
                  setJobError("");
                  setJobSuccess("");
                }}
                className="px-4 py-2 rounded-xl text-sm font-medium text-muted-foreground hover:bg-muted/50 transition-colors"
              >
                Cancel
              </button>
              <button
                disabled={jobSaving}
                onClick={async () => {
                  if (!jobForm.title.trim()) {
                    setJobError("Job title is required");
                    return;
                  }
                  setJobSaving(true);
                  setJobError("");
                  try {
                    let minCgpa: number | undefined;
                    let minTenthPercent: number | undefined;
                    let minTwelfthPercent: number | undefined;

                    const score = jobForm.minQualificationScore
                      ? Number(jobForm.minQualificationScore)
                      : undefined;
                    if (score) {
                      if (jobForm.minQualification === "SSLC")
                        minTenthPercent = score;
                      else if (jobForm.minQualification === "PUC")
                        minTwelfthPercent = score;
                      else minCgpa = score;
                    }

                    const payload: Record<string, unknown> = {
                      title: jobForm.title.trim(),
                      description:
                        jobForm.description.trim() || jobForm.title.trim(),
                      workLocation: jobForm.location.trim() || undefined,
                      totalVacancies: Number(jobForm.openPositions) || 1,
                      ctcMinLpa: jobForm.ctcMinLpa
                        ? Number(jobForm.ctcMinLpa)
                        : undefined,
                      ctcMaxLpa: jobForm.ctcMaxLpa
                        ? Number(jobForm.ctcMaxLpa)
                        : undefined,
                      minCgpa,
                      minTenthPercent,
                      minTwelfthPercent,
                      jobType: jobForm.jobType,
                      stipendAmount: jobForm.stipendAmount
                        ? Number(jobForm.stipendAmount)
                        : undefined,
                      bondYears: jobForm.bondYears
                        ? Number(jobForm.bondYears)
                        : undefined,
                      bondAmountInr: jobForm.bondAmountInr
                        ? Number(jobForm.bondAmountInr)
                        : undefined,
                    };

                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    const jobRes = await companyApi.createJob(payload) as any;
                    const newJobId = jobRes?.data?.id;

                    // Upload JD PDF if provided
                    if (jdFile && newJobId) {
                      try {
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        const presignedRes = await companyApi.getJdPresignedUrl(newJobId, jdFile.name, jdFile.type) as any;
                        const { presignedUrl, key, publicUrl } = presignedRes?.data || {};
                        if (presignedUrl) {
                          await fetch(presignedUrl, {
                            method: 'PUT',
                            body: jdFile,
                            headers: { 'Content-Type': jdFile.type },
                          });
                          await companyApi.confirmJdUpload(newJobId, key, publicUrl);
                        }
                      } catch {
                        // JD upload failed but job was created
                      }
                    }
                    setJobSuccess("Job posted successfully!");
                    setTimeout(() => {
                      setShowCreateJob(false);
                      setJobSuccess("");
                      setJobForm({
                        title: "",
                        description: "",
                        location: "",
                        ctcMinLpa: "",
                        ctcMaxLpa: "",
                        minQualification: "UG",
                        minQualificationScore: "",
                        openPositions: "1",
                        jobType: "placement",
                        stipendAmount: "",
                        bondYears: "",
                        bondAmountInr: "",
                      });
                      setJdFile(null);
                      queryClient.invalidateQueries({
                        queryKey: ["company", "jobs"],
                      });
                    }, 1000);
                  } catch {
                    setJobError("Failed to create job. Please try again.");
                  } finally {
                    setJobSaving(false);
                  }
                }}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white text-sm font-semibold hover:shadow-lg transition-all disabled:opacity-50 flex items-center gap-2"
              >
                {jobSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Creating...
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4" /> Post Job
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
