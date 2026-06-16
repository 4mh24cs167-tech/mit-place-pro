"use client";

import Header from "@/components/layout/Header";
import Sidebar from "@/components/layout/Sidebar";
import { cn } from "@/lib/utils";
import { adminApi } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import {
  Star, Loader2, AlertCircle, MessageSquare, CheckCircle2,
  ChevronDown, ChevronUp, ThumbsUp, ThumbsDown, Download,
  BarChart3, Users, Building2, TrendingUp,
} from "lucide-react";
import { useState, useEffect, useCallback } from "react";

interface Drive { id: string; title: string; driveDate: string | null; status: string; }
interface StudentFeedbackItem {
  id: string; overallRating: number; processRating: number; communicationRating: number;
  difficultyLevel: string; roundsFaced: string; interviewExperience: string;
  questionsAsked: string | null; tips: string | null; wouldRecommend: boolean; comments: string | null;
  createdAt: string; student: { fullName: string; usn: string; department: string } | null;
}
interface CompanyFeedbackItem {
  id: string; technicalRating: number; communicationRating: number; attitudeRating: number;
  overallRating: number; strengths: string | null; areasOfImprovement: string | null;
  remarks: string | null; recommendForHire: string; createdAt: string;
  student: { fullName: string; usn: string; department: string } | null;
}
interface FeedbackSummary {
  studentFeedback: {
    total: number; avgOverallRating: number; avgProcessRating: number; avgCommunicationRating: number;
    difficultyBreakdown: { easy: number; moderate: number; hard: number }; recommendPercent: number;
  };
  companyFeedback: {
    total: number; avgTechnicalRating: number; avgCommunicationRating: number;
    avgAttitudeRating: number; avgOverallRating: number;
    hireBreakdown: { yes: number; no: number; maybe: number };
  };
}

function Stars({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <Star key={s} className={cn("w-3.5 h-3.5", rating >= s ? "text-amber-400 fill-amber-400" : "text-gray-200")} />
      ))}
    </div>
  );
}

function StatCard({ label, value, icon: Icon, color }: { label: string; value: string | number; icon: React.ElementType; color: string }) {
  return (
    <div className="p-4 bg-card border border-border rounded-2xl">
      <div className="flex items-center gap-3">
        <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", color)}>
          <Icon className="w-5 h-5" />
        </div>
        <div>
          <p className="text-2xl font-bold text-foreground">{value}</p>
          <p className="text-xs text-muted-foreground">{label}</p>
        </div>
      </div>
    </div>
  );
}

export default function AdminFeedbackPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [drives, setDrives] = useState<Drive[]>([]);
  const [selectedDriveId, setSelectedDriveId] = useState("");
  const [activeTab, setActiveTab] = useState<"student" | "company">("student");
  const [studentFeedback, setStudentFeedback] = useState<StudentFeedbackItem[]>([]);
  const [companyFeedback, setCompanyFeedback] = useState<CompanyFeedbackItem[]>([]);
  const [summary, setSummary] = useState<FeedbackSummary | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [feedbackLoading, setFeedbackLoading] = useState(false);
  const [toast, setToast] = useState<{ type: "success" | "error"; msg: string } | null>(null);

  const showToast = (type: "success" | "error", msg: string) => { setToast({ type, msg }); setTimeout(() => setToast(null), 4000); };

  // Fetch drives list
  useEffect(() => {
    (async () => {
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const res = await adminApi.listDrives() as any;
        const list = res?.data || [];
        setDrives(list);
        if (list.length > 0) setSelectedDriveId(list[0].id);
      } catch { /* */ } finally { setLoading(false); }
    })();
  }, []);

  // Fetch feedback for selected drive
  const fetchFeedback = useCallback(async () => {
    if (!selectedDriveId) return;
    setFeedbackLoading(true);
    try {
      const [sfRes, cfRes, sumRes] = await Promise.allSettled([
        adminApi.getDriveStudentFeedback(selectedDriveId),
        adminApi.getDriveCompanyFeedback(selectedDriveId),
        adminApi.getDriveFeedbackSummary(selectedDriveId),
      ]);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      if (sfRes.status === "fulfilled") setStudentFeedback((sfRes.value as any)?.data || []);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      if (cfRes.status === "fulfilled") setCompanyFeedback((cfRes.value as any)?.data || []);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      if (sumRes.status === "fulfilled") setSummary((sumRes.value as any)?.data || null);
    } catch { /* */ } finally { setFeedbackLoading(false); }
  }, [selectedDriveId]);

  useEffect(() => { fetchFeedback(); }, [fetchFeedback]);

  const handleExport = () => {
    const data = activeTab === "student" ? studentFeedback : companyFeedback;
    if (data.length === 0) { showToast("error", "No data to export"); return; }
    const driveName = drives.find(d => d.id === selectedDriveId)?.title || "drive";

    if (activeTab === "student") {
      const headers = ["Name", "USN", "Dept", "Overall", "Process", "Communication", "Difficulty", "Rounds", "Experience", "Questions", "Tips", "Recommend", "Comments", "Date"];
      const rows = studentFeedback.map(f => [
        f.student?.fullName || "", f.student?.usn || "", f.student?.department || "",
        f.overallRating, f.processRating, f.communicationRating, f.difficultyLevel,
        f.roundsFaced, f.interviewExperience, f.questionsAsked || "", f.tips || "",
        f.wouldRecommend ? "Yes" : "No", f.comments || "", new Date(f.createdAt).toLocaleDateString(),
      ]);
      const csv = [headers.join(","), ...rows.map(r => r.map(v => `"${v}"`).join(","))].join("\n");
      const blob = new Blob([csv], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a"); a.href = url;
      a.download = `student_feedback_${driveName.replace(/\s+/g, "_")}.csv`;
      a.click(); URL.revokeObjectURL(url);
    } else {
      const headers = ["Name", "USN", "Dept", "Technical", "Communication", "Attitude", "Overall", "Strengths", "Improvements", "Remarks", "Recommend Hire", "Date"];
      const rows = companyFeedback.map(f => [
        f.student?.fullName || "", f.student?.usn || "", f.student?.department || "",
        f.technicalRating, f.communicationRating, f.attitudeRating, f.overallRating,
        f.strengths || "", f.areasOfImprovement || "", f.remarks || "",
        f.recommendForHire, new Date(f.createdAt).toLocaleDateString(),
      ]);
      const csv = [headers.join(","), ...rows.map(r => r.map(v => `"${v}"`).join(","))].join("\n");
      const blob = new Blob([csv], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a"); a.href = url;
      a.download = `company_feedback_${driveName.replace(/\s+/g, "_")}.csv`;
      a.click(); URL.revokeObjectURL(url);
    }
    showToast("success", "Exported successfully");
  };

  return (
    <div className="page-enter">
      <Header userName={user?.email || ""} userRole="Admin" />
      <div className="flex">
        <Sidebar role="admin" />
        <main className="flex-1 p-4 sm:p-8 ml-16 sm:ml-56 mt-16 max-w-6xl">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Feedback Dashboard</h1>
              <p className="text-muted-foreground mt-1">View student and company feedback for each drive</p>
            </div>
            <select value={selectedDriveId} onChange={(e) => setSelectedDriveId(e.target.value)}
              className="px-4 py-2.5 bg-white border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 max-w-xs">
              {drives.map((d) => <option key={d.id} value={d.id}>{d.title} {d.driveDate ? `(${d.driveDate})` : ""}</option>)}
            </select>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-indigo-500" /></div>
          ) : drives.length === 0 ? (
            <div className="text-center py-16 bg-card rounded-2xl border border-border">
              <MessageSquare className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-40" />
              <p className="text-muted-foreground">No drives found</p>
            </div>
          ) : (
            <>
              {/* ── Summary Stats ── */}
              {summary && !feedbackLoading && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
                  <StatCard label="Student Feedback" value={summary.studentFeedback.total} icon={Users} color="bg-indigo-100 text-indigo-600" />
                  <StatCard label="Avg Rating" value={summary.studentFeedback.avgOverallRating || "—"} icon={Star} color="bg-amber-100 text-amber-600" />
                  <StatCard label="Company Feedback" value={summary.companyFeedback.total} icon={Building2} color="bg-violet-100 text-violet-600" />
                  <StatCard label="Recommend %" value={`${summary.studentFeedback.recommendPercent}%`} icon={TrendingUp} color="bg-emerald-100 text-emerald-600" />
                </div>
              )}

              {/* ── Tabs + Export ── */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex gap-1 bg-accent/50 p-1 rounded-xl">
                  {(["student", "company"] as const).map((tab) => (
                    <button key={tab} onClick={() => { setActiveTab(tab); setExpandedId(null); }}
                      className={cn("px-5 py-2 rounded-lg text-sm font-medium transition-all capitalize",
                        activeTab === tab ? "bg-white text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground")}>
                      {tab} ({tab === "student" ? studentFeedback.length : companyFeedback.length})
                    </button>
                  ))}
                </div>
                <button onClick={handleExport}
                  className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded-xl text-sm font-medium shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/30 transition-all">
                  <Download className="w-4 h-4" /> Export
                </button>
              </div>

              {feedbackLoading ? (
                <div className="flex items-center justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-indigo-500" /></div>
              ) : (
                <>
                  {/* ── Student Feedback Tab ── */}
                  {activeTab === "student" && (
                    studentFeedback.length === 0 ? (
                      <div className="text-center py-16 bg-card rounded-2xl border border-border">
                        <MessageSquare className="w-10 h-10 text-muted-foreground mx-auto mb-2 opacity-40" />
                        <p className="text-muted-foreground text-sm">No student feedback for this drive yet</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {studentFeedback.map((fb) => (
                          <div key={fb.id} className="bg-card border border-border rounded-2xl overflow-hidden">
                            <button onClick={() => setExpandedId(expandedId === fb.id ? null : fb.id)}
                              className="w-full flex items-center justify-between p-4 hover:bg-accent/30 transition-colors">
                              <div className="flex items-center gap-3 text-left">
                                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center text-white text-xs font-bold">
                                  {fb.student?.fullName?.split(" ").map(n => n[0]).join("").slice(0, 2) || "?"}
                                </div>
                                <div>
                                  <p className="font-medium text-foreground text-sm">{fb.student?.fullName || "Student"}</p>
                                  <p className="text-xs text-muted-foreground">{fb.student?.usn} · {fb.student?.department}</p>
                                </div>
                              </div>
                              <div className="flex items-center gap-3">
                                <Stars rating={fb.overallRating} />
                                <span className={cn("px-2 py-0.5 rounded-full text-xs font-medium capitalize",
                                  fb.difficultyLevel === "easy" ? "bg-emerald-50 text-emerald-600" : fb.difficultyLevel === "moderate" ? "bg-amber-50 text-amber-600" : "bg-red-50 text-red-600")}>
                                  {fb.difficultyLevel}
                                </span>
                                {expandedId === fb.id ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                              </div>
                            </button>
                            {expandedId === fb.id && (
                              <div className="px-4 pb-4 border-t border-border pt-3 space-y-3 text-sm">
                                <div className="grid grid-cols-3 gap-2">
                                  <div className="p-2 bg-accent/30 rounded-lg text-center"><p className="text-xs text-muted-foreground">Overall</p><p className="font-bold">{fb.overallRating}/5</p></div>
                                  <div className="p-2 bg-accent/30 rounded-lg text-center"><p className="text-xs text-muted-foreground">Process</p><p className="font-bold">{fb.processRating}/5</p></div>
                                  <div className="p-2 bg-accent/30 rounded-lg text-center"><p className="text-xs text-muted-foreground">Communication</p><p className="font-bold">{fb.communicationRating}/5</p></div>
                                </div>
                                <div><p className="text-xs font-medium text-muted-foreground">Rounds</p><p>{fb.roundsFaced}</p></div>
                                <div><p className="text-xs font-medium text-muted-foreground">Experience</p><p className="whitespace-pre-wrap">{fb.interviewExperience}</p></div>
                                {fb.questionsAsked && <div><p className="text-xs font-medium text-muted-foreground">Questions</p><p className="whitespace-pre-wrap">{fb.questionsAsked}</p></div>}
                                {fb.tips && <div><p className="text-xs font-medium text-muted-foreground">Tips</p><p className="whitespace-pre-wrap">{fb.tips}</p></div>}
                                <div className="flex items-center gap-2">
                                  <span className="text-xs text-muted-foreground">Recommends:</span>
                                  {fb.wouldRecommend ? <ThumbsUp className="w-4 h-4 text-emerald-500" /> : <ThumbsDown className="w-4 h-4 text-red-500" />}
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )
                  )}

                  {/* ── Company Feedback Tab ── */}
                  {activeTab === "company" && (
                    companyFeedback.length === 0 ? (
                      <div className="text-center py-16 bg-card rounded-2xl border border-border">
                        <Building2 className="w-10 h-10 text-muted-foreground mx-auto mb-2 opacity-40" />
                        <p className="text-muted-foreground text-sm">No company feedback for this drive yet</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {companyFeedback.map((fb) => (
                          <div key={fb.id} className="bg-card border border-border rounded-2xl overflow-hidden">
                            <button onClick={() => setExpandedId(expandedId === fb.id ? null : fb.id)}
                              className="w-full flex items-center justify-between p-4 hover:bg-accent/30 transition-colors">
                              <div className="flex items-center gap-3 text-left">
                                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-pink-500 flex items-center justify-center text-white text-xs font-bold">
                                  {fb.student?.fullName?.split(" ").map(n => n[0]).join("").slice(0, 2) || "?"}
                                </div>
                                <div>
                                  <p className="font-medium text-foreground text-sm">{fb.student?.fullName || "Student"}</p>
                                  <p className="text-xs text-muted-foreground">{fb.student?.usn} · {fb.student?.department}</p>
                                </div>
                              </div>
                              <div className="flex items-center gap-3">
                                <Stars rating={fb.overallRating} />
                                <span className={cn("px-2 py-0.5 rounded-full text-xs font-medium",
                                  fb.recommendForHire === "yes" ? "bg-emerald-50 text-emerald-600" : fb.recommendForHire === "no" ? "bg-red-50 text-red-600" : "bg-amber-50 text-amber-600")}>
                                  {fb.recommendForHire}
                                </span>
                                {expandedId === fb.id ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                              </div>
                            </button>
                            {expandedId === fb.id && (
                              <div className="px-4 pb-4 border-t border-border pt-3 space-y-3 text-sm">
                                <div className="grid grid-cols-4 gap-2">
                                  <div className="p-2 bg-accent/30 rounded-lg text-center"><p className="text-xs text-muted-foreground">Technical</p><p className="font-bold">{fb.technicalRating}/5</p></div>
                                  <div className="p-2 bg-accent/30 rounded-lg text-center"><p className="text-xs text-muted-foreground">Communication</p><p className="font-bold">{fb.communicationRating}/5</p></div>
                                  <div className="p-2 bg-accent/30 rounded-lg text-center"><p className="text-xs text-muted-foreground">Attitude</p><p className="font-bold">{fb.attitudeRating}/5</p></div>
                                  <div className="p-2 bg-accent/30 rounded-lg text-center"><p className="text-xs text-muted-foreground">Overall</p><p className="font-bold">{fb.overallRating}/5</p></div>
                                </div>
                                {fb.strengths && <div><p className="text-xs font-medium text-muted-foreground">Strengths</p><p>{fb.strengths}</p></div>}
                                {fb.areasOfImprovement && <div><p className="text-xs font-medium text-muted-foreground">Areas of Improvement</p><p>{fb.areasOfImprovement}</p></div>}
                                {fb.remarks && <div><p className="text-xs font-medium text-muted-foreground">Remarks</p><p>{fb.remarks}</p></div>}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )
                  )}
                </>
              )}
            </>
          )}

          {/* Toast */}
          {toast && (
            <div className={cn("fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-3 rounded-xl shadow-2xl text-white text-sm font-medium animate-slide-up",
              toast.type === "success" ? "bg-emerald-600" : "bg-red-600")}>
              {toast.type === "success" ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
              {toast.msg}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
