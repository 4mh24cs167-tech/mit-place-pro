"use client";

import Header from "@/components/layout/Header";
import { companyApi } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { cn } from "@/lib/utils";
import {
  Plus,
  ArrowUpRight,
  CheckCircle2,
  SlidersHorizontal,
  Users,
  Briefcase,
  Loader2,
  X,
  MapPin,
  DollarSign,
  Clock,
  FileText,
  GraduationCap,
} from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";

interface Job {
  id: string;
  title?: string;
  description?: string;
  totalApplicants?: number;
  selected?: number;
  status?: string;
  ctcMinLpa?: number | null;
  ctcMaxLpa?: number | null;
  workLocation?: string | null;
  totalVacancies?: number;
  allowedDepartments?: string[];
  jobType?: string;
  stipendAmount?: number | null;
  bondYears?: number | null;
  createdAt?: string;
}

interface Candidate {
  name: string;
  dept: string;
  ats: number;
  status: string;
}

export default function CompanyDashboardPage() {
  const { user } = useAuth();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [showCreateJob, setShowCreateJob] = useState(false);
  const [jobForm, setJobForm] = useState({ title: "", description: "", location: "", ctcMinLpa: "", ctcMaxLpa: "", minQualification: "UG", minQualificationScore: "", openPositions: "1", eligibleDepartments: "", jobType: "placement", stipendAmount: "", bondYears: "", bondAmountInr: "" });
  const [jobSaving, setJobSaving] = useState(false);
  const [jobError, setJobError] = useState("");
  const [jobSuccess, setJobSuccess] = useState("");

  // ─── React Query: Profile ──────────────────────
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: profileData } = useQuery<any>({
    queryKey: ["company", "profile"],
    queryFn: async () => {
      const res = await companyApi.getProfile();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return (res as any)?.data;
    },
  });

  const isPendingApproval = profileData?.isApproved === false;

  // ─── React Query: Jobs ─────────────────────────
  const { data: jobs = [], isLoading: loading } = useQuery<Job[]>({
    queryKey: ["company", "jobs"],
    queryFn: async () => {
      const res = await companyApi.getJobs();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const data = (res as any)?.data;
      return Array.isArray(data) ? data : [];
    },
    enabled: !isPendingApproval,
  });

  // ─── React Query: Top Candidates ───────────────
  const { data: candidates = [] } = useQuery<Candidate[]>({
    queryKey: ["company", "candidates", jobs[0]?.id],
    queryFn: async () => {
      const candRes = await companyApi.getCandidates(jobs[0].id);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const candData = (candRes as any)?.data;
      if (!Array.isArray(candData)) return [];
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return candData.slice(0, 5).map((c: any) => ({
        name: c.studentName || "Candidate",
        dept: c.department || "—",
        ats: c.atsScore || 0,
        status: c.finalResult || "pending",
      }));
    },
    enabled: !isPendingApproval && jobs.length > 0,
  });

  const fetchData = () => {
    queryClient.invalidateQueries({ queryKey: ["company"] });
  };

  // Pipeline from jobs
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const totalApplicants = jobs.reduce((sum, j: any) => sum + (j.totalApplicants || 0), 0);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const totalSelected = jobs.reduce((sum, j: any) => sum + (j.selected || 0), 0);

  const pipelineStages = [
    { name: "Applied", count: totalApplicants, color: "bg-muted" },
    { name: "ATS Cleared", count: Math.round(totalApplicants * 0.65), color: "activity-green" },
    { name: "Round 1", count: Math.round(totalApplicants * 0.38), color: "activity-gray" },
    { name: "Round 2", count: Math.round(totalApplicants * 0.18), color: "activity-purple" },
    { name: "Selected", count: totalSelected, color: "bg-accent-green" },
  ];

  const maxCount = Math.max(...pipelineStages.map(s => s.count), 1);

  if (isPendingApproval) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center border border-border">
          <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Clock className="w-8 h-8 text-amber-600" />
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-3">Pending Admin Approval</h1>
          <p className="text-muted-foreground mb-8 leading-relaxed">
            Thank you for completing your profile! Your company account is currently under review by the placement cell. You will be notified via email once approved.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="w-full bg-foreground text-white font-medium py-3 rounded-xl hover:opacity-90 transition-colors"
          >
            Refresh Status
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="page-enter">
      <Header
        userName={user?.email?.split("@")[0] || "Company User"}
        userRole="Company"
        greeting={(() => { const h = new Date().getHours(); return h < 12 ? "Good morning!" : h < 17 ? "Good afternoon!" : "Good evening!"; })()}
        subtitle="Let's make this day productive."
      />

      <div className="px-4 sm:px-6 md:px-8 pb-10">
        
        {/* WhatsApp Banner */}
        <div className="mb-8 p-4 bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-100 rounded-2xl flex flex-col sm:flex-row items-center gap-6 shadow-sm">
          <div className="flex-shrink-0 bg-white p-2 rounded-xl border border-emerald-100 shadow-sm">
            <img src="/whatsapp-qr.jpg" alt="WhatsApp QR Code" className="w-24 h-24 object-contain rounded-lg" />
          </div>
          <div className="flex-1 text-center sm:text-left">
            <h3 className="text-lg font-bold text-emerald-900 mb-1">Join the Official WhatsApp Group</h3>
            <p className="text-sm text-emerald-700 mb-4">
              Scan the QR code or click the button to join the MITM SRP Job Fair WhatsApp group for important updates and communication.
            </p>
            <a 
              href="https://chat.whatsapp.com/JrpzXtGDdGPHCdAl527Ig8" 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-medium px-4 py-2 rounded-xl transition-colors text-sm"
            >
              Join WhatsApp Group
            </a>
          </div>
        </div>

        {/* Stats row */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-8 mb-6 sm:mb-8 -mt-2">
          <div className="hidden sm:block flex-1" />
          <div className="grid grid-cols-2 sm:flex gap-4 sm:gap-8 w-full sm:w-auto">
            {loading ? (
              [1, 2].map(i => (
                <div key={i} className="animate-pulse">
                  <div className="h-3 bg-muted rounded w-20 mb-2" />
                  <div className="h-8 bg-muted rounded w-12" />
                </div>
              ))
            ) : (
              <>
                <div>
                  <p className="text-xs sm:text-sm text-muted-foreground">Total Applicants</p>
                  <p className="text-2xl sm:text-4xl font-bold text-foreground tracking-tight">
                    {totalApplicants}<span className="stat-arrow text-muted-foreground">↗</span>
                  </p>
                </div>
                <div>
                  <p className="text-xs sm:text-sm text-muted-foreground">Offers Sent</p>
                  <p className="text-2xl sm:text-4xl font-bold text-foreground tracking-tight">
                    {totalSelected}<span className="stat-arrow text-muted-foreground">↗</span>
                  </p>
                </div>
              </>
            )}
          </div>
          <button
            onClick={() => setShowCreateJob(true)}
            className="i-btn-dark w-full sm:w-auto justify-center"
          >
            <Plus className="w-4 h-4" />
            Post Job
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
          {/* Recruitment funnel */}
          <div className="lg:col-span-3 i-card p-6">
            <div className="flex items-start justify-between mb-5">
              <div>
                <h2 className="text-lg font-semibold text-foreground">Recruitment Pipeline</h2>
                <p className="text-sm text-muted-foreground">Candidate flow through stages</p>
              </div>
              <button className="i-btn-icon" title="Filter pipeline">
                <SlidersHorizontal className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>

            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3, 4, 5].map(i => (
                  <div key={i} className="flex items-center gap-4 animate-pulse">
                    <div className="h-3 bg-muted rounded w-20" />
                    <div className="flex-1 h-10 bg-muted/50 rounded-xl" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                {pipelineStages.map((stage) => (
                  <div key={stage.name} className="flex items-center gap-4">
                    <span className="text-xs text-muted-foreground w-16 sm:w-24 text-right flex-shrink-0">{stage.name}</span>
                    <div className="flex-1 h-10 bg-muted/50 rounded-xl overflow-hidden relative">
                      <div
                        className={cn("h-full rounded-xl flex items-center px-4 transition-all duration-700", stage.color)}
                        style={{ width: `${Math.max((stage.count / maxCount) * 100, 8)}%` }}
                      >
                        <span className="text-xs font-bold text-foreground">{stage.count}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Top Candidates */}
          <div className="lg:col-span-2 i-card p-6">
            <div className="flex items-start justify-between mb-5">
              <div>
                <h2 className="text-lg font-semibold text-foreground">Top Candidates</h2>
                <p className="text-sm text-muted-foreground">Highest ATS scores</p>
              </div>
              <button
                onClick={() => router.push("/company/candidates")}
                className="i-btn-icon"
                title="View all candidates"
              >
                <ArrowUpRight className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>

            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className="flex items-center gap-3 p-3 animate-pulse">
                    <div className="w-9 h-9 rounded-full bg-muted" />
                    <div className="flex-1 space-y-1">
                      <div className="h-3 bg-muted rounded w-2/3" />
                      <div className="h-2 bg-muted rounded w-1/4" />
                    </div>
                    <div className="h-3 bg-muted rounded w-8" />
                  </div>
                ))}
              </div>
            ) : candidates.length === 0 ? (
              <div className="text-center py-8">
                <Users className="w-10 h-10 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">No candidates yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {candidates.map((c, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 rounded-xl hover:bg-muted/30 transition-colors">
                    <div className="w-9 h-9 rounded-full bg-muted flex items-center justify-center text-xs font-bold text-foreground">
                      {c.name.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{c.name}</p>
                      <p className="text-[10px] text-muted-foreground">{c.dept}</p>
                    </div>
                    <div className="text-right">
                      <p className={cn(
                        "text-xs font-bold",
                        c.ats >= 90 ? "text-green-600" : c.ats >= 80 ? "text-blue-600" : "text-amber-600"
                      )}>
                        {c.ats}%
                      </p>
                      <p className="text-[10px] text-muted-foreground">{c.status}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Posted Jobs */}
        <div className="i-card p-6 mt-5">
          <div className="flex items-start justify-between mb-5">
            <div>
              <h2 className="text-lg font-semibold text-foreground">Posted Jobs</h2>
              <p className="text-sm text-muted-foreground">{jobs.length} {jobs.length === 1 ? "role" : "roles"} posted</p>
            </div>
            <button
              onClick={() => setShowCreateJob(true)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white text-xs font-semibold shadow-sm hover:shadow-md transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
              New Job
            </button>
          </div>

          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="flex items-center gap-4 p-4 rounded-xl bg-muted/30 animate-pulse">
                  <div className="w-10 h-10 rounded-xl bg-muted" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-muted rounded w-1/3" />
                    <div className="h-3 bg-muted rounded w-1/2" />
                  </div>
                  <div className="h-4 bg-muted rounded w-16" />
                </div>
              ))}
            </div>
          ) : jobs.length === 0 ? (
            <div className="text-center py-10">
              <Briefcase className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-sm font-medium text-foreground mb-1">No jobs posted yet</p>
              <p className="text-xs text-muted-foreground">Click &quot;New Job&quot; to post your first role.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {jobs.map((job) => {
                const jobTypeLabel = job.jobType === "internship" ? "Internship" : job.jobType === "internship_plus_placement" ? "Intern + FTE" : "Full Time";
                const jobTypeColor = job.jobType === "internship" ? "bg-blue-50 text-blue-700 border-blue-100" : job.jobType === "internship_plus_placement" ? "bg-purple-50 text-purple-700 border-purple-100" : "bg-emerald-50 text-emerald-700 border-emerald-100";

                return (
                  <div
                    key={job.id}
                    className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 p-4 rounded-xl border border-border hover:bg-muted/20 transition-colors"
                  >
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-100 to-violet-100 flex items-center justify-center flex-shrink-0">
                      <Briefcase className="w-5 h-5 text-indigo-600" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-sm font-semibold text-foreground">{job.title || "Untitled"}</h3>
                        <span className={cn("px-2 py-0.5 rounded text-[10px] font-semibold border", jobTypeColor)}>
                          {jobTypeLabel}
                        </span>
                        {job.status && job.status !== "active" && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-100 capitalize">
                            {job.status}
                          </span>
                        )}
                      </div>
                      <div className="flex flex-wrap items-center gap-3 mt-1.5 text-xs text-muted-foreground">
                        {(job.ctcMinLpa != null || job.ctcMaxLpa != null) && (
                          <span className="flex items-center gap-1">
                            <DollarSign className="w-3 h-3 text-emerald-500" />
                            {job.ctcMinLpa || 0}–{job.ctcMaxLpa || 0} LPA
                          </span>
                        )}
                        {job.workLocation && (
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-blue-500" />
                            {job.workLocation}
                          </span>
                        )}
                        {(job.totalVacancies ?? 0) > 0 && (
                          <span className="flex items-center gap-1">
                            <Users className="w-3 h-3 text-amber-500" />
                            {job.totalVacancies} {(job.totalVacancies ?? 0) === 1 ? "vacancy" : "vacancies"}
                          </span>
                        )}
                        {job.allowedDepartments && job.allowedDepartments.length > 0 && (
                          <span className="flex items-center gap-1">
                            <GraduationCap className="w-3 h-3 text-violet-500" />
                            {job.allowedDepartments.join(", ")}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-4 flex-shrink-0">
                      <div className="text-center">
                        <p className="text-lg font-bold text-foreground">{job.totalApplicants || 0}</p>
                        <p className="text-[10px] text-muted-foreground uppercase">Applicants</p>
                      </div>
                      <div className="text-center">
                        <p className="text-lg font-bold text-emerald-600">{job.selected || 0}</p>
                        <p className="text-[10px] text-muted-foreground uppercase">Selected</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Bottom row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mt-5">
          <div className="i-card p-6">
            <div className="flex items-start justify-between mb-5">
              <div>
                <h2 className="text-lg font-semibold text-foreground">To-do list</h2>
                <p className="text-sm text-muted-foreground">
                  {new Date().toLocaleDateString("en-US", { weekday: "long", day: "numeric", month: "long" })}
                </p>
              </div>
              <button
                onClick={() => router.push("/company/offers")}
                className="i-btn-icon"
                title="View offers"
              >
                <ArrowUpRight className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>
            <div className="space-y-4">
              {[
                { task: `Review ${totalApplicants > 0 ? totalApplicants : "pending"} applications`, done: false },
                { task: "Schedule Round 2 interviews", done: false },
                { task: "Send offer letters to selected", done: totalSelected > 0 },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-3 pb-4 border-b border-border last:border-0 last:pb-0">
                  <div className={cn(
                    "w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0",
                    item.done ? "bg-accent-green" : "border-2 border-border"
                  )}>
                    {item.done && <CheckCircle2 className="w-4 h-4 text-foreground" />}
                  </div>
                  <p className={cn("text-sm", item.done ? "text-muted-foreground line-through" : "text-foreground font-medium")}>
                    {item.task}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="i-card p-6">
            <div className="flex items-start justify-between mb-5">
              <div>
                <h2 className="text-lg font-semibold text-foreground">Summary</h2>
                <p className="text-sm text-muted-foreground">Track your recruitment</p>
              </div>
              <div className="flex items-center gap-2">
                <button className="i-btn-icon !w-9 !h-9">
                  <SlidersHorizontal className="w-4 h-4 text-muted-foreground" />
                </button>
                <button className="i-btn-icon !w-9 !h-9">
                  <ArrowUpRight className="w-4 h-4 text-muted-foreground" />
                </button>
              </div>
            </div>
            {loading ? (
              <div className="grid grid-cols-2 gap-4">
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className="p-4 rounded-xl bg-muted/30 animate-pulse">
                    <div className="h-8 bg-muted rounded w-12 mx-auto mb-2" />
                    <div className="h-3 bg-muted rounded w-16 mx-auto" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                {[
                  { label: "Avg Time to Hire", value: "—", icon: "⏱️" },
                  { label: "Acceptance Rate", value: totalApplicants > 0 ? `${Math.round((totalSelected / totalApplicants) * 100)}%` : "—", icon: "✅" },
                  { label: "JDs Posted", value: String(jobs.length), icon: "📝" },
                  { label: "Rounds Complete", value: "—", icon: "🎯" },
                ].map((s) => (
                  <div key={s.label} className="p-4 rounded-xl bg-muted/30 text-center">
                    <span className="text-2xl">{s.icon}</span>
                    <p className="text-xl font-bold text-foreground mt-1">{s.value}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">{s.label}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Create Job Modal ─────────────────────── */}
      {showCreateJob && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
            <div className="bg-gradient-to-r from-indigo-600 to-violet-600 px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center">
                  <Briefcase className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Post New Job</h3>
                  <p className="text-xs text-white/70">Fill in the details to post a job</p>
                </div>
              </div>
              <button onClick={() => { setShowCreateJob(false); setJobError(""); setJobSuccess(""); }} className="p-1.5 rounded-lg hover:bg-white/20 transition-colors">
                <X className="w-5 h-5 text-white" />
              </button>
            </div>

            <div className="px-6 py-5 space-y-4 max-h-[60vh] overflow-y-auto">
              {jobError && <div className="px-3 py-2 rounded-lg bg-red-50 text-red-600 text-xs font-medium">{jobError}</div>}
              {jobSuccess && <div className="px-3 py-2 rounded-lg bg-emerald-50 text-emerald-600 text-xs font-medium">{jobSuccess}</div>}

              <div>
                <label className="text-xs font-semibold text-gray-700 mb-1 flex items-center gap-1.5">
                  <Briefcase className="w-3.5 h-3.5 text-indigo-500" /> Job Title <span className="text-red-500">*</span>
                </label>
                <input type="text" value={jobForm.title} onChange={(e) => setJobForm(f => ({ ...f, title: e.target.value }))} placeholder="e.g. Software Engineer" className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400" />
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-700 mb-1 flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-indigo-500" /> Description
                </label>
                <textarea value={jobForm.description} onChange={(e) => setJobForm(f => ({ ...f, description: e.target.value }))} placeholder="Job description, responsibilities..." rows={3} className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 resize-none" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-gray-700 mb-1 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-indigo-500" /> Location
                  </label>
                  <input type="text" value={jobForm.location} onChange={(e) => setJobForm(f => ({ ...f, location: e.target.value }))} placeholder="e.g. Bengaluru" className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-700 mb-1 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-indigo-500" /> Positions
                  </label>
                  <input type="number" value={jobForm.openPositions} onChange={(e) => setJobForm(f => ({ ...f, openPositions: e.target.value }))} placeholder="1" className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-gray-700 mb-1 flex items-center gap-1.5">
                    <DollarSign className="w-3.5 h-3.5 text-indigo-500" /> Min CTC (LPA)
                  </label>
                  <input type="number" step="0.1" value={jobForm.ctcMinLpa} onChange={(e) => setJobForm(f => ({ ...f, ctcMinLpa: e.target.value }))} placeholder="e.g. 4" className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-700 mb-1 flex items-center gap-1.5">
                    <DollarSign className="w-3.5 h-3.5 text-indigo-500" /> Max CTC (LPA)
                  </label>
                  <input type="number" step="0.1" value={jobForm.ctcMaxLpa} onChange={(e) => setJobForm(f => ({ ...f, ctcMaxLpa: e.target.value }))} placeholder="e.g. 8" className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-gray-700 mb-1 flex items-center gap-1.5">
                    <GraduationCap className="w-3.5 h-3.5 text-indigo-500" /> Minimum Qualification
                  </label>
                  <select value={jobForm.minQualification} onChange={(e) => setJobForm(f => ({ ...f, minQualification: e.target.value }))} className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 bg-white">
                    <option value="SSLC">SSLC</option>
                    <option value="PUC">PUC / Diploma</option>
                    <option value="UG">Undergraduate (UG)</option>
                    <option value="PG">Postgraduate (PG)</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-700 mb-1 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-indigo-500" /> Min. {jobForm.minQualification === "UG" || jobForm.minQualification === "PG" ? "CGPA" : "Percentage"}
                  </label>
                  <input type="number" step="0.1" value={jobForm.minQualificationScore} onChange={(e) => setJobForm(f => ({ ...f, minQualificationScore: e.target.value }))} placeholder={jobForm.minQualification === "UG" || jobForm.minQualification === "PG" ? "e.g. 6.5" : "e.g. 65"} className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400" />
                </div>
              </div>
              
              <div>
                <label className="text-xs font-semibold text-gray-700 mb-1 flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-indigo-500" /> Departments
                </label>
                <input type="text" value={jobForm.eligibleDepartments} onChange={(e) => setJobForm(f => ({ ...f, eligibleDepartments: e.target.value }))} placeholder="CSE, ISE, ECE" className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-gray-700 mb-1 flex items-center gap-1.5">
                    <Briefcase className="w-3.5 h-3.5 text-indigo-500" /> Nature of Recruitment
                  </label>
                  <select value={jobForm.jobType} onChange={(e) => setJobForm(f => ({ ...f, jobType: e.target.value }))} className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 bg-white">
                    <option value="placement">Full Time (Placement)</option>
                    <option value="internship">Internship</option>
                    <option value="internship_plus_placement">Internship + Placement</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-700 mb-1 flex items-center gap-1.5">
                    <DollarSign className="w-3.5 h-3.5 text-indigo-500" /> Stipend (if Intern)
                  </label>
                  <input type="number" value={jobForm.stipendAmount} onChange={(e) => setJobForm(f => ({ ...f, stipendAmount: e.target.value }))} placeholder="e.g. 20000" className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-gray-700 mb-1 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-indigo-500" /> Bond / Service (Years)
                  </label>
                  <input type="number" step="0.5" value={jobForm.bondYears} onChange={(e) => setJobForm(f => ({ ...f, bondYears: e.target.value }))} placeholder="e.g. 2" className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-700 mb-1 flex items-center gap-1.5">
                    <DollarSign className="w-3.5 h-3.5 text-indigo-500" /> Bond Penalty (INR)
                  </label>
                  <input type="number" value={jobForm.bondAmountInr} onChange={(e) => setJobForm(f => ({ ...f, bondAmountInr: e.target.value }))} placeholder="e.g. 100000" className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400" />
                </div>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-end gap-3">
              <button onClick={() => { setShowCreateJob(false); setJobError(""); setJobSuccess(""); }} className="px-4 py-2 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors">
                Cancel
              </button>
              <button
                disabled={jobSaving}
                onClick={async () => {
                  if (!jobForm.title.trim()) { setJobError("Job title is required"); return; }
                  setJobSaving(true);
                  setJobError("");
                  try {
                    let minCgpa: number | undefined;
                    let minTenthPercent: number | undefined;
                    let minTwelfthPercent: number | undefined;
                    
                    const score = jobForm.minQualificationScore ? Number(jobForm.minQualificationScore) : undefined;
                    if (score) {
                      if (jobForm.minQualification === "SSLC") minTenthPercent = score;
                      else if (jobForm.minQualification === "PUC") minTwelfthPercent = score;
                      else minCgpa = score; // UG and PG
                    }

                    const payload: Record<string, unknown> = {
                      title: jobForm.title.trim(),
                      description: jobForm.description.trim() || jobForm.title.trim(),
                      workLocation: jobForm.location.trim() || undefined,
                      totalVacancies: Number(jobForm.openPositions) || 1,
                      ctcMinLpa: jobForm.ctcMinLpa ? Number(jobForm.ctcMinLpa) : undefined,
                      ctcMaxLpa: jobForm.ctcMaxLpa ? Number(jobForm.ctcMaxLpa) : undefined,
                      minCgpa,
                      minTenthPercent,
                      minTwelfthPercent,
                      allowedDepartments: jobForm.eligibleDepartments ? jobForm.eligibleDepartments.split(",").map(d => d.trim()).filter(Boolean) : undefined,
                      jobType: jobForm.jobType,
                      stipendAmount: jobForm.stipendAmount ? Number(jobForm.stipendAmount) : undefined,
                      bondYears: jobForm.bondYears ? Number(jobForm.bondYears) : undefined,
                      bondAmountInr: jobForm.bondAmountInr ? Number(jobForm.bondAmountInr) : undefined,
                    };
                    await companyApi.createJob(payload);
                    setJobSuccess("Job posted successfully!");
                    setTimeout(() => {
                      setShowCreateJob(false);
                      setJobSuccess("");
                      setJobForm({ title: "", description: "", location: "", ctcMinLpa: "", ctcMaxLpa: "", minQualification: "UG", minQualificationScore: "", openPositions: "1", eligibleDepartments: "", jobType: "placement", stipendAmount: "", bondYears: "", bondAmountInr: "" });
                      queryClient.invalidateQueries({ queryKey: ["company", "jobs"] });
                    }, 1200);
                  } catch {
                    setJobError("Failed to create job. Please try again.");
                  } finally {
                    setJobSaving(false);
                  }
                }}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white text-sm font-semibold hover:shadow-lg transition-all disabled:opacity-50 flex items-center gap-2"
              >
                {jobSaving ? <><Loader2 className="w-4 h-4 animate-spin" /> Creating...</> : <><Plus className="w-4 h-4" /> Post Job</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
