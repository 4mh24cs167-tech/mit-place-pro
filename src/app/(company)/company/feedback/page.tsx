"use client";

import Header from "@/components/layout/Header";
import { cn } from "@/lib/utils";
import { companyApi } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import {
  Star, Loader2, AlertCircle, MessageSquare, CheckCircle2,
  ChevronDown, ChevronUp, Send, X, Calendar, Building2,
  AlertTriangle, ThumbsUp, ThumbsDown, School, Users,
  Wifi, Award,
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
  studentQualityRating: number;
  organizationRating: number;
  infrastructureRating: number;
  communicationRating: number;
  whatWentWell: string | null;
  areasOfImprovement: string | null;
  suggestions: string | null;
  wouldReturn: boolean;
  comments: string | null;
  createdAt: string;
  drive: { id: string; title: string; driveDate: string | null } | null;
}

const STAR_LABELS = ["", "Poor", "Fair", "Good", "Very Good", "Excellent"];

const RATING_FIELDS = [
  { key: "overallRating", label: "Overall Experience", icon: Star },
  { key: "studentQualityRating", label: "Student Quality", icon: Users },
  { key: "organizationRating", label: "Drive Organization", icon: Award },
  { key: "infrastructureRating", label: "College Infrastructure", icon: School },
  { key: "communicationRating", label: "Communication & Coordination", icon: Wifi },
] as const;

function StarRating({ value, onChange, label, icon: Icon }: { value: number; onChange: (v: number) => void; label: string; icon: React.ElementType }) {
  const [hover, setHover] = useState(0);
  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium text-foreground flex items-center gap-2">
        <Icon className="w-4 h-4 text-muted-foreground" />
        {label} <span className="text-red-500">*</span>
      </label>
      <div className="flex items-center gap-1.5">
        {[1, 2, 3, 4, 5].map((s) => (
          <button key={s} type="button" onMouseEnter={() => setHover(s)} onMouseLeave={() => setHover(0)}
            onClick={() => onChange(s)} className="transition-transform hover:scale-110 active:scale-95 p-0.5">
            <Star className={cn("w-7 h-7 sm:w-8 sm:h-8 transition-colors", (hover || value) >= s ? "text-amber-400 fill-amber-400" : "text-gray-300")} />
          </button>
        ))}
        <span className="ml-2 text-sm text-muted-foreground">{STAR_LABELS[hover || value] || ""}</span>
      </div>
    </div>
  );
}

export default function CompanyFeedbackPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [pending, setPending] = useState<PendingDrive[]>([]);
  const [submitted, setSubmitted] = useState<SubmittedFeedback[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ type: "success" | "error"; msg: string } | null>(null);

  // Form State
  const [showForm, setShowForm] = useState(false);
  const [formDrive, setFormDrive] = useState<PendingDrive | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    overallRating: 0, studentQualityRating: 0, organizationRating: 0,
    infrastructureRating: 0, communicationRating: 0,
    whatWentWell: "", areasOfImprovement: "", suggestions: "",
    wouldReturn: true, comments: "",
  });

  const showToast = (type: "success" | "error", msg: string) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 4000);
  };

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [pendingRes, submittedRes] = await Promise.allSettled([
        companyApi.getPendingFeedback(),
        companyApi.getMyFeedback(),
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
    setForm({
      overallRating: 0, studentQualityRating: 0, organizationRating: 0,
      infrastructureRating: 0, communicationRating: 0,
      whatWentWell: "", areasOfImprovement: "", suggestions: "",
      wouldReturn: true, comments: "",
    });
    setShowForm(true);
  };

  const handleSubmit = async () => {
    if (!formDrive) return;
    const missingRating = RATING_FIELDS.find(f => !form[f.key]);
    if (missingRating) { showToast("error", `Please rate: ${missingRating.label}`); return; }

    setSubmitting(true);
    try {
      await companyApi.submitDriveFeedback(formDrive.driveId, form);
      showToast("success", "Thank you for your feedback!");
      setShowForm(false);
      fetchData();
    } catch (err) {
      showToast("error", err instanceof Error ? err.message : "Failed to submit feedback");
    } finally { setSubmitting(false); }
  };

  return (
    <div className="page-enter">
      <Header userName={user?.email?.split("@")[0] || "HR"} userRole="Company" />

      <div className="px-4 sm:px-6 md:px-8 pb-24 sm:pb-10">
        {/* Page Title */}
        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Drive Feedback</h1>
          <p className="text-sm text-muted-foreground mt-1">Share your experience to help us improve our placement process</p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
          </div>
        ) : (
          <>
            {/* ── Pending Feedback Alert ── */}
            {pending.length > 0 && (
              <div className="mb-6 p-4 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-2xl">
                <div className="flex items-center gap-2 mb-3">
                  <AlertTriangle className="w-5 h-5 text-amber-600" />
                  <h2 className="text-base sm:text-lg font-semibold text-amber-800">Pending Feedback ({pending.length})</h2>
                </div>
                <p className="text-xs sm:text-sm text-amber-700 mb-4">We&apos;d love to hear about your experience with these drives.</p>
                <div className="space-y-2">
                  {pending.map((d) => (
                    <div key={d.driveId} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 bg-white/80 rounded-xl border border-amber-100">
                      <div className="flex items-center gap-3 min-w-0">
                        <Building2 className="w-5 h-5 text-amber-600 flex-shrink-0" />
                        <div className="min-w-0">
                          <p className="font-medium text-foreground text-sm truncate">{d.driveTitle}</p>
                          {d.driveDate && <p className="text-xs text-muted-foreground flex items-center gap-1"><Calendar className="w-3 h-3" />{d.driveDate}</p>}
                        </div>
                      </div>
                      <button onClick={() => openForm(d)}
                        className="w-full sm:w-auto px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl text-sm font-medium shadow-lg shadow-amber-500/20 hover:shadow-amber-500/30 transition-all text-center">
                        Give Feedback
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── Submitted Feedback ── */}
            <div>
              <h2 className="text-lg sm:text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-500" /> Submitted Feedback ({submitted.length})
              </h2>
              {submitted.length === 0 ? (
                <div className="text-center py-16 i-card">
                  <MessageSquare className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-40" />
                  <p className="text-muted-foreground">No feedback submitted yet</p>
                  {pending.length === 0 && <p className="text-xs text-muted-foreground mt-1">Feedback will be available after drives are completed</p>}
                </div>
              ) : (
                <div className="space-y-3">
                  {submitted.map((fb) => (
                    <div key={fb.id} className="i-card overflow-hidden">
                      <button onClick={() => setExpandedId(expandedId === fb.id ? null : fb.id)}
                        className="w-full flex items-center justify-between p-4 hover:bg-accent/30 transition-colors">
                        <div className="flex items-center gap-3 text-left min-w-0">
                          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-100 to-indigo-100 flex items-center justify-center flex-shrink-0">
                            <MessageSquare className="w-5 h-5 text-violet-600" />
                          </div>
                          <div className="min-w-0">
                            <p className="font-medium text-foreground text-sm truncate">{fb.drive?.title || "Drive"}</p>
                            <p className="text-xs text-muted-foreground">{new Date(fb.createdAt).toLocaleDateString()}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                          <div className="hidden sm:flex items-center gap-0.5">
                            {[1, 2, 3, 4, 5].map((s) => (
                              <Star key={s} className={cn("w-4 h-4", fb.overallRating >= s ? "text-amber-400 fill-amber-400" : "text-gray-200")} />
                            ))}
                          </div>
                          <span className="sm:hidden text-xs font-bold text-amber-600">{fb.overallRating}/5</span>
                          {fb.wouldReturn
                            ? <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600 font-medium">Would Return</span>
                            : <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-50 text-red-600 font-medium">Won&apos;t Return</span>
                          }
                          {expandedId === fb.id ? <ChevronUp className="w-5 h-5 text-muted-foreground" /> : <ChevronDown className="w-5 h-5 text-muted-foreground" />}
                        </div>
                      </button>
                      {expandedId === fb.id && (
                        <div className="px-4 pb-4 border-t border-border pt-4 space-y-3">
                          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                            {RATING_FIELDS.map(({ key, label }) => (
                              <div key={key} className="p-2.5 bg-accent/30 rounded-xl text-center">
                                <p className="text-[10px] text-muted-foreground">{label.replace("College ", "")}</p>
                                <p className="text-base font-bold text-foreground">{fb[key]}/5</p>
                              </div>
                            ))}
                          </div>
                          {fb.whatWentWell && <div><p className="text-xs font-medium text-muted-foreground mb-0.5">What Went Well</p><p className="text-sm text-foreground whitespace-pre-wrap">{fb.whatWentWell}</p></div>}
                          {fb.areasOfImprovement && <div><p className="text-xs font-medium text-muted-foreground mb-0.5">Areas of Improvement</p><p className="text-sm text-foreground whitespace-pre-wrap">{fb.areasOfImprovement}</p></div>}
                          {fb.suggestions && <div><p className="text-xs font-medium text-muted-foreground mb-0.5">Suggestions</p><p className="text-sm text-foreground whitespace-pre-wrap">{fb.suggestions}</p></div>}
                          {fb.comments && <div><p className="text-xs font-medium text-muted-foreground mb-0.5">Additional Comments</p><p className="text-sm text-foreground whitespace-pre-wrap">{fb.comments}</p></div>}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* ── Feedback Form Modal ── */}
      {showForm && formDrive && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-t-2xl sm:rounded-2xl border border-border shadow-2xl w-full sm:max-w-2xl max-h-[92vh] sm:max-h-[90vh] overflow-y-auto sm:mx-4">
            <div className="flex items-center justify-between p-4 sm:p-5 border-b border-border sticky top-0 bg-white z-10 rounded-t-2xl">
              <div className="min-w-0">
                <h2 className="text-base sm:text-lg font-bold text-foreground truncate">Feedback: {formDrive.driveTitle}</h2>
                <p className="text-xs text-muted-foreground">Rate your overall experience with this drive</p>
              </div>
              <button onClick={() => setShowForm(false)} className="p-2 hover:bg-accent rounded-xl transition-colors flex-shrink-0 ml-2">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 sm:p-5 space-y-5">
              {/* Ratings */}
              {RATING_FIELDS.map(({ key, label, icon }) => (
                <StarRating key={key} label={label} icon={icon} value={form[key]}
                  onChange={(v) => setForm(p => ({ ...p, [key]: v }))} />
              ))}

              {/* What went well */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">What Went Well</label>
                <textarea rows={3} placeholder="Tell us what you liked about the drive..."
                  value={form.whatWentWell} onChange={(e) => setForm(p => ({ ...p, whatWentWell: e.target.value }))}
                  className="w-full px-4 py-2.5 bg-white border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 resize-none" />
              </div>

              {/* Areas of improvement */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">Areas of Improvement</label>
                <textarea rows={3} placeholder="What could we do better?"
                  value={form.areasOfImprovement} onChange={(e) => setForm(p => ({ ...p, areasOfImprovement: e.target.value }))}
                  className="w-full px-4 py-2.5 bg-white border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 resize-none" />
              </div>

              {/* Suggestions */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">Suggestions</label>
                <textarea rows={3} placeholder="Any specific suggestions for future drives?"
                  value={form.suggestions} onChange={(e) => setForm(p => ({ ...p, suggestions: e.target.value }))}
                  className="w-full px-4 py-2.5 bg-white border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 resize-none" />
              </div>

              {/* Would Return */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">Would you like to return for future drives? <span className="text-red-500">*</span></label>
                <div className="flex gap-3">
                  <button type="button" onClick={() => setForm(p => ({ ...p, wouldReturn: true }))}
                    className={cn("flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium border transition-all",
                      form.wouldReturn ? "bg-emerald-50 border-emerald-300 text-emerald-700" : "bg-white border-border text-muted-foreground")}>
                    <ThumbsUp className="w-4 h-4" /> Yes, definitely!
                  </button>
                  <button type="button" onClick={() => setForm(p => ({ ...p, wouldReturn: false }))}
                    className={cn("flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium border transition-all",
                      !form.wouldReturn ? "bg-red-50 border-red-300 text-red-700" : "bg-white border-border text-muted-foreground")}>
                    <ThumbsDown className="w-4 h-4" /> Maybe not
                  </button>
                </div>
              </div>

              {/* Comments */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">Additional Comments</label>
                <textarea rows={2} placeholder="Anything else you'd like to share..."
                  value={form.comments} onChange={(e) => setForm(p => ({ ...p, comments: e.target.value }))}
                  className="w-full px-4 py-2.5 bg-white border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 resize-none" />
              </div>
            </div>

            {/* Submit */}
            <div className="flex gap-3 p-4 sm:p-5 border-t border-border sticky bottom-0 bg-white">
              <button onClick={() => setShowForm(false)} className="flex-1 sm:flex-none px-5 py-2.5 text-sm text-muted-foreground hover:text-foreground border border-border rounded-xl transition-colors">
                Cancel
              </button>
              <button onClick={handleSubmit} disabled={submitting}
                className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded-xl text-sm font-medium shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/30 transition-all disabled:opacity-50">
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                Submit Feedback
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className={cn("fixed bottom-20 sm:bottom-6 right-4 sm:right-6 z-50 flex items-center gap-3 px-5 py-3 rounded-xl shadow-2xl text-white text-sm font-medium",
          toast.type === "success" ? "bg-emerald-600" : "bg-red-600")}>
          {toast.type === "success" ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
          {toast.msg}
        </div>
      )}
    </div>
  );
}
