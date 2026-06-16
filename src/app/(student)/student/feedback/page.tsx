"use client";

import Header from "@/components/layout/Header";
import Sidebar from "@/components/layout/Sidebar";
import { cn } from "@/lib/utils";
import { studentApi } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import {
  Star, Loader2, AlertCircle, MessageSquare, CheckCircle2,
  ChevronDown, ChevronUp, ThumbsUp, ThumbsDown, Send, X,
  Calendar, Building2, AlertTriangle,
} from "lucide-react";
import { useState, useEffect, useCallback } from "react";

interface PendingDrive {
  driveId: string;
  driveTitle: string;
  driveDate: string | null;
  status: string;
}

interface SubmittedFeedback {
  id: string;
  driveId: string;
  overallRating: number;
  processRating: number;
  communicationRating: number;
  difficultyLevel: string;
  roundsFaced: string;
  interviewExperience: string;
  questionsAsked: string | null;
  tips: string | null;
  wouldRecommend: boolean;
  comments: string | null;
  createdAt: string;
  drive: { id: string; title: string; driveDate: string | null } | null;
}

const STAR_LABELS = ["", "Poor", "Fair", "Good", "Very Good", "Excellent"];

function StarRating({ value, onChange, label }: { value: number; onChange: (v: number) => void; label: string }) {
  const [hover, setHover] = useState(0);
  return (
    <div className="space-y-1">
      <label className="text-sm font-medium text-foreground">{label} <span className="text-red-500">*</span></label>
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((s) => (
          <button key={s} type="button" onMouseEnter={() => setHover(s)} onMouseLeave={() => setHover(0)}
            onClick={() => onChange(s)} className="transition-transform hover:scale-110">
            <Star className={cn("w-7 h-7 transition-colors", (hover || value) >= s ? "text-amber-400 fill-amber-400" : "text-gray-300")} />
          </button>
        ))}
        <span className="ml-2 text-sm text-muted-foreground">{STAR_LABELS[hover || value] || ""}</span>
      </div>
    </div>
  );
}

export default function StudentFeedbackPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [pending, setPending] = useState<PendingDrive[]>([]);
  const [submitted, setSubmitted] = useState<SubmittedFeedback[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ type: "success" | "error"; msg: string } | null>(null);

  // ─── Form State ────────
  const [showForm, setShowForm] = useState(false);
  const [formDrive, setFormDrive] = useState<PendingDrive | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    overallRating: 0, processRating: 0, communicationRating: 0,
    difficultyLevel: "", roundsFaced: "", interviewExperience: "",
    questionsAsked: "", tips: "", wouldRecommend: true, comments: "",
  });

  const showToast = (type: "success" | "error", msg: string) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 4000);
  };

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [pendingRes, submittedRes] = await Promise.allSettled([
        studentApi.getPendingFeedback(),
        studentApi.getMyFeedback(),
      ]);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      if (pendingRes.status === "fulfilled") setPending((pendingRes.value as any)?.data || []);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      if (submittedRes.status === "fulfilled") setSubmitted((submittedRes.value as any)?.data || []);
    } catch { /* */ } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const openForm = (drive: PendingDrive) => {
    setFormDrive(drive);
    setForm({ overallRating: 0, processRating: 0, communicationRating: 0, difficultyLevel: "", roundsFaced: "", interviewExperience: "", questionsAsked: "", tips: "", wouldRecommend: true, comments: "" });
    setShowForm(true);
  };

  const handleSubmit = async () => {
    if (!formDrive) return;
    if (!form.overallRating || !form.processRating || !form.communicationRating) { showToast("error", "Please rate all required fields"); return; }
    if (!form.difficultyLevel) { showToast("error", "Please select difficulty level"); return; }
    if (!form.roundsFaced.trim()) { showToast("error", "Please describe the rounds you faced"); return; }
    if (!form.interviewExperience.trim()) { showToast("error", "Please describe your interview experience"); return; }

    setSubmitting(true);
    try {
      await studentApi.submitDriveFeedback(formDrive.driveId, form);
      showToast("success", "Feedback submitted successfully! Thank you.");
      setShowForm(false);
      fetchData();
    } catch (err) {
      showToast("error", err instanceof Error ? err.message : "Failed to submit feedback");
    } finally { setSubmitting(false); }
  };

  return (
    <div className="page-enter">
      <Header userName={user?.email || ""} userRole="Student" />
      <div className="flex">
        <Sidebar role="student" />
        <main className="flex-1 p-4 sm:p-8 ml-16 sm:ml-56 mt-16 max-w-6xl">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground">Drive Feedback</h1>
            <p className="text-muted-foreground mt-1">Share your experience to help future students</p>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
            </div>
          ) : (
            <>
              {/* ── Pending Feedback Alert ── */}
              {pending.length > 0 && (
                <div className="mb-8 p-4 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-2xl">
                  <div className="flex items-center gap-2 mb-3">
                    <AlertTriangle className="w-5 h-5 text-amber-600" />
                    <h2 className="text-lg font-semibold text-amber-800">Pending Feedback ({pending.length})</h2>
                  </div>
                  <p className="text-sm text-amber-700 mb-4">Please submit feedback for the following drives before registering for new ones.</p>
                  <div className="space-y-3">
                    {pending.map((d) => (
                      <div key={d.driveId} className="flex items-center justify-between p-3 bg-white/80 rounded-xl border border-amber-100">
                        <div className="flex items-center gap-3">
                          <Building2 className="w-5 h-5 text-amber-600" />
                          <div>
                            <p className="font-medium text-foreground">{d.driveTitle}</p>
                            {d.driveDate && <p className="text-xs text-muted-foreground flex items-center gap-1"><Calendar className="w-3 h-3" />{d.driveDate}</p>}
                          </div>
                        </div>
                        <button onClick={() => openForm(d)}
                          className="px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl text-sm font-medium shadow-lg shadow-amber-500/20 hover:shadow-amber-500/30 transition-all">
                          Give Feedback
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ── Submitted Feedback ── */}
              <div>
                <h2 className="text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500" /> Submitted Feedback ({submitted.length})
                </h2>
                {submitted.length === 0 ? (
                  <div className="text-center py-16 bg-card rounded-2xl border border-border">
                    <MessageSquare className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-40" />
                    <p className="text-muted-foreground">No feedback submitted yet</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {submitted.map((fb) => (
                      <div key={fb.id} className="bg-card border border-border rounded-2xl overflow-hidden">
                        <button onClick={() => setExpandedId(expandedId === fb.id ? null : fb.id)}
                          className="w-full flex items-center justify-between p-4 hover:bg-accent/30 transition-colors">
                          <div className="flex items-center gap-3 text-left">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-100 to-violet-100 flex items-center justify-center">
                              <MessageSquare className="w-5 h-5 text-indigo-600" />
                            </div>
                            <div>
                              <p className="font-medium text-foreground">{fb.drive?.title || "Drive"}</p>
                              <p className="text-xs text-muted-foreground">{fb.drive?.driveDate || ""} · {new Date(fb.createdAt).toLocaleDateString()}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="flex items-center gap-1">
                              {[1, 2, 3, 4, 5].map((s) => (
                                <Star key={s} className={cn("w-4 h-4", fb.overallRating >= s ? "text-amber-400 fill-amber-400" : "text-gray-200")} />
                              ))}
                            </div>
                            {expandedId === fb.id ? <ChevronUp className="w-5 h-5 text-muted-foreground" /> : <ChevronDown className="w-5 h-5 text-muted-foreground" />}
                          </div>
                        </button>
                        {expandedId === fb.id && (
                          <div className="px-4 pb-4 border-t border-border pt-4 space-y-3">
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                              <div className="p-3 bg-accent/30 rounded-xl text-center">
                                <p className="text-xs text-muted-foreground">Overall</p>
                                <p className="text-lg font-bold text-foreground">{fb.overallRating}/5</p>
                              </div>
                              <div className="p-3 bg-accent/30 rounded-xl text-center">
                                <p className="text-xs text-muted-foreground">Process</p>
                                <p className="text-lg font-bold text-foreground">{fb.processRating}/5</p>
                              </div>
                              <div className="p-3 bg-accent/30 rounded-xl text-center">
                                <p className="text-xs text-muted-foreground">Communication</p>
                                <p className="text-lg font-bold text-foreground">{fb.communicationRating}/5</p>
                              </div>
                              <div className="p-3 bg-accent/30 rounded-xl text-center">
                                <p className="text-xs text-muted-foreground">Difficulty</p>
                                <p className={cn("text-lg font-bold capitalize", fb.difficultyLevel === "easy" ? "text-emerald-600" : fb.difficultyLevel === "moderate" ? "text-amber-600" : "text-red-600")}>{fb.difficultyLevel}</p>
                              </div>
                            </div>
                            <div><p className="text-xs font-medium text-muted-foreground mb-1">Rounds Faced</p><p className="text-sm text-foreground">{fb.roundsFaced}</p></div>
                            <div><p className="text-xs font-medium text-muted-foreground mb-1">Interview Experience</p><p className="text-sm text-foreground whitespace-pre-wrap">{fb.interviewExperience}</p></div>
                            {fb.questionsAsked && <div><p className="text-xs font-medium text-muted-foreground mb-1">Questions Asked</p><p className="text-sm text-foreground whitespace-pre-wrap">{fb.questionsAsked}</p></div>}
                            {fb.tips && <div><p className="text-xs font-medium text-muted-foreground mb-1">Tips</p><p className="text-sm text-foreground whitespace-pre-wrap">{fb.tips}</p></div>}
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-muted-foreground">Would recommend:</span>
                              {fb.wouldRecommend ? <ThumbsUp className="w-4 h-4 text-emerald-500" /> : <ThumbsDown className="w-4 h-4 text-red-500" />}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}

          {/* ── Feedback Form Modal ── */}
          {showForm && formDrive && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
              <div className="bg-card rounded-2xl border border-border shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between p-5 border-b border-border sticky top-0 bg-card z-10">
                  <div>
                    <h2 className="text-lg font-bold text-foreground">Feedback: {formDrive.driveTitle}</h2>
                    <p className="text-xs text-muted-foreground">Fields marked with * are required</p>
                  </div>
                  <button onClick={() => setShowForm(false)} className="p-2 hover:bg-accent rounded-xl transition-colors">
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <div className="p-5 space-y-5">
                  {/* Ratings */}
                  <StarRating label="Overall Experience" value={form.overallRating} onChange={(v) => setForm(p => ({ ...p, overallRating: v }))} />
                  <StarRating label="Process & Organization" value={form.processRating} onChange={(v) => setForm(p => ({ ...p, processRating: v }))} />
                  <StarRating label="Communication" value={form.communicationRating} onChange={(v) => setForm(p => ({ ...p, communicationRating: v }))} />

                  {/* Difficulty */}
                  <div>
                    <label className="text-sm font-medium text-foreground">Difficulty Level <span className="text-red-500">*</span></label>
                    <div className="flex gap-3 mt-2">
                      {(["easy", "moderate", "hard"] as const).map((d) => (
                        <button key={d} type="button" onClick={() => setForm(p => ({ ...p, difficultyLevel: d }))}
                          className={cn("px-5 py-2.5 rounded-xl text-sm font-medium border transition-all capitalize",
                            form.difficultyLevel === d
                              ? d === "easy" ? "bg-emerald-50 border-emerald-300 text-emerald-700" : d === "moderate" ? "bg-amber-50 border-amber-300 text-amber-700" : "bg-red-50 border-red-300 text-red-700"
                              : "bg-white border-border text-muted-foreground hover:border-foreground/30"
                          )}>
                          {d}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Rounds Faced */}
                  <div>
                    <label className="text-sm font-medium text-foreground">Rounds Faced <span className="text-red-500">*</span></label>
                    <input type="text" placeholder="e.g., Aptitude, GD, Technical Interview, HR"
                      value={form.roundsFaced} onChange={(e) => setForm(p => ({ ...p, roundsFaced: e.target.value }))}
                      className="w-full mt-1 px-4 py-2.5 bg-white border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30" />
                  </div>

                  {/* Interview Experience */}
                  <div>
                    <label className="text-sm font-medium text-foreground">Interview Experience <span className="text-red-500">*</span></label>
                    <textarea rows={4} placeholder="Describe your experience in detail..."
                      value={form.interviewExperience} onChange={(e) => setForm(p => ({ ...p, interviewExperience: e.target.value }))}
                      className="w-full mt-1 px-4 py-2.5 bg-white border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 resize-none" />
                  </div>

                  {/* Questions Asked */}
                  <div>
                    <label className="text-sm font-medium text-foreground">Key Questions Asked</label>
                    <textarea rows={3} placeholder="List important questions you were asked..."
                      value={form.questionsAsked} onChange={(e) => setForm(p => ({ ...p, questionsAsked: e.target.value }))}
                      className="w-full mt-1 px-4 py-2.5 bg-white border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 resize-none" />
                  </div>

                  {/* Tips */}
                  <div>
                    <label className="text-sm font-medium text-foreground">Tips for Future Students</label>
                    <textarea rows={3} placeholder="Any advice for students preparing for this company?"
                      value={form.tips} onChange={(e) => setForm(p => ({ ...p, tips: e.target.value }))}
                      className="w-full mt-1 px-4 py-2.5 bg-white border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 resize-none" />
                  </div>

                  {/* Would Recommend */}
                  <div>
                    <label className="text-sm font-medium text-foreground">Would you recommend this company? <span className="text-red-500">*</span></label>
                    <div className="flex gap-3 mt-2">
                      <button type="button" onClick={() => setForm(p => ({ ...p, wouldRecommend: true }))}
                        className={cn("flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium border transition-all",
                          form.wouldRecommend ? "bg-emerald-50 border-emerald-300 text-emerald-700" : "bg-white border-border text-muted-foreground")}>
                        <ThumbsUp className="w-4 h-4" /> Yes
                      </button>
                      <button type="button" onClick={() => setForm(p => ({ ...p, wouldRecommend: false }))}
                        className={cn("flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium border transition-all",
                          !form.wouldRecommend ? "bg-red-50 border-red-300 text-red-700" : "bg-white border-border text-muted-foreground")}>
                        <ThumbsDown className="w-4 h-4" /> No
                      </button>
                    </div>
                  </div>

                  {/* Additional Comments */}
                  <div>
                    <label className="text-sm font-medium text-foreground">Additional Comments</label>
                    <textarea rows={2} placeholder="Anything else you'd like to share..."
                      value={form.comments} onChange={(e) => setForm(p => ({ ...p, comments: e.target.value }))}
                      className="w-full mt-1 px-4 py-2.5 bg-white border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 resize-none" />
                  </div>
                </div>

                {/* Submit */}
                <div className="flex justify-end gap-3 p-5 border-t border-border sticky bottom-0 bg-card">
                  <button onClick={() => setShowForm(false)} className="px-5 py-2.5 text-sm text-muted-foreground hover:text-foreground border border-border rounded-xl transition-colors">
                    Cancel
                  </button>
                  <button onClick={handleSubmit} disabled={submitting}
                    className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded-xl text-sm font-medium shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/30 transition-all disabled:opacity-50">
                    {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    Submit Feedback
                  </button>
                </div>
              </div>
            </div>
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
