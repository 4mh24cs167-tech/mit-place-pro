"use client";

import Header from "@/components/layout/Header";
import { cn } from "@/lib/utils";
import { studentApi } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import {
  ClipboardCheck, Loader2, AlertCircle, ExternalLink,
  Clock, Trophy, CheckCircle2, XCircle, Lock, Calendar, MapPin, Layers, Link2, KeyRound,
} from "lucide-react";
import { useState, useEffect } from "react";

/* eslint-disable @typescript-eslint/no-explicit-any */

interface ScheduleInfo {
  batchLabel: string; scheduleDate: string;
  startTime: string | null; endTime: string | null; venue: string | null;
}
interface SubItemInfo {
  id: string; title: string; type: string; description: string | null;
  scheduleDate: string | null; startTime: string | null; endTime: string | null;
  is24Hours: boolean; links: { title: string; url: string; platform?: string }[];
}

interface AssessmentItem {
  id: string; assessmentId: string; title: string; description: string | null;
  types: string[]; status: string; score: number | null; maxScore: number | null;
  remarks: string | null; deadline: string | null; isExpired: boolean;
  links: { id: string; title: string; url: string; platform: string; instructions: string | null }[];
  subItems: SubItemInfo[];
  gradedAt: string | null; attemptedAt: string | null;
  schedule: ScheduleInfo | null;
  credentials: { loginId: string; password: string } | null;
}

const TYPE_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  aptitude: { bg: "bg-indigo-50", text: "text-indigo-700", border: "border-indigo-200" },
  technical: { bg: "bg-violet-50", text: "text-violet-700", border: "border-violet-200" },
  coding: { bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200" },
  interview: { bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200" },
  custom: { bg: "bg-slate-50", text: "text-slate-700", border: "border-slate-200" },
};

function getDaysLeft(deadline: string): { text: string; urgent: boolean } {
  const diff = new Date(deadline).getTime() - Date.now();
  if (diff < 0) return { text: "Expired", urgent: true };
  const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
  if (days === 0) return { text: "Due today", urgent: true };
  if (days === 1) return { text: "1 day left", urgent: true };
  if (days <= 3) return { text: `${days} days left`, urgent: true };
  return { text: `${days} days left`, urgent: false };
}

export default function StudentAssessmentsPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [assessments, setAssessments] = useState<AssessmentItem[]>([]);
  const [toast, setToast] = useState<{ type: "success" | "error"; msg: string } | null>(null);

  const showToast = (type: "success" | "error", msg: string) => { setToast({ type, msg }); setTimeout(() => setToast(null), 4000); };

  useEffect(() => {
    (async () => {
      try {
        const res = await studentApi.getMyAssessments() as any;
        setAssessments(res?.data || []);
      } catch { showToast("error", "Failed to load assessments"); } finally { setLoading(false); }
    })();
  }, []);

  const active = assessments.filter(a => a.status === "pending" && !a.isExpired);
  const graded = assessments.filter(a => a.status === "completed");
  const expired = assessments.filter(a => (a.isExpired && a.status === "pending") || a.status === "absent");

  return (
    <div className="page-enter">
      <Header userName={user?.email || ""} userRole="Student" greeting="My Assessments" subtitle="Track your tests and scores" />

      <div className="px-4 sm:px-6 md:px-8 pb-24 sm:pb-10 -mt-2 space-y-6">
        {loading ? (
          <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-indigo-500" /></div>
        ) : assessments.length === 0 ? (
          <div className="text-center py-16 i-card">
            <ClipboardCheck className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-40" />
            <p className="text-muted-foreground font-medium">No assessments assigned</p>
            <p className="text-sm text-muted-foreground mt-1">Your placement cell will assign tests when available</p>
          </div>
        ) : (
          <>
            {/* ── Active Tests ── */}
            {active.length > 0 && (
              <section>
                <h2 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-amber-500" /> Active Tests ({active.length})
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {active.map(a => {
                    const dl = a.deadline ? getDaysLeft(a.deadline) : null;
                    const hasSubItems = (a.subItems || []).length > 0;
                    return (
                      <div key={a.id} className="i-card p-4 border-l-4 border-l-amber-400 hover:shadow-md transition-all">
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div>
                            <h3 className="font-semibold text-foreground">{a.title}</h3>
                            <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                              {(a.types || []).map(t => {
                                const tc = TYPE_COLORS[t] || TYPE_COLORS.custom;
                                return <span key={t} className={cn("px-2 py-0.5 rounded-full text-[10px] font-semibold border capitalize", tc.bg, tc.text, tc.border)}>{t}</span>;
                              })}
                            </div>
                          </div>
                          {dl && (
                            <span className={cn("px-2 py-1 rounded-lg text-[10px] font-semibold flex-shrink-0 flex items-center gap-1",
                              dl.urgent ? "bg-red-50 text-red-600" : "bg-amber-50 text-amber-600")}>
                              <Clock className="w-3 h-3" /> {dl.text}
                            </span>
                          )}
                        </div>

                        {/* Schedule / Batch Info */}
                        {a.schedule && (
                          <div className="mb-3 p-2.5 bg-blue-50/60 rounded-xl border border-blue-100">
                            <p className="text-xs font-semibold text-blue-700 mb-1">{a.schedule.batchLabel}</p>
                            <div className="flex flex-wrap items-center gap-2 text-[11px] text-blue-600">
                              <span className="flex items-center gap-0.5"><Calendar className="w-3 h-3" /> {new Date(a.schedule.scheduleDate).toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short", year: "numeric" })}</span>
                              {a.schedule.startTime && (
                                <span className="flex items-center gap-0.5"><Clock className="w-3 h-3" /> {a.schedule.startTime}{a.schedule.endTime ? ` – ${a.schedule.endTime}` : ""}</span>
                              )}
                              {a.schedule.venue && (
                                <span className="flex items-center gap-0.5"><MapPin className="w-3 h-3" /> {a.schedule.venue}</span>
                              )}
                            </div>
                          </div>
                        )}

                        {a.description && <p className="text-xs text-muted-foreground mb-3 line-clamp-2">{a.description}</p>}

                        {/* Test Platform Credentials */}
                        {a.credentials && (
                          <div className="mb-3 p-3 bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl border border-amber-200">
                            <div className="flex items-center gap-1.5 mb-2">
                              <KeyRound className="w-4 h-4 text-amber-600" />
                              <span className="text-xs font-bold text-amber-700">Your Test Credentials</span>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                              <div className="p-2 bg-white rounded-lg border border-amber-100">
                                <p className="text-[10px] font-semibold text-muted-foreground uppercase">Login ID</p>
                                <p className="text-sm font-mono font-bold text-foreground select-all">{a.credentials.loginId}</p>
                              </div>
                              <div className="p-2 bg-white rounded-lg border border-amber-100">
                                <p className="text-[10px] font-semibold text-muted-foreground uppercase">Password</p>
                                <p className="text-sm font-mono font-bold text-foreground select-all">{a.credentials.password}</p>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Sub-Items with their own links & timings */}
                        {hasSubItems && (
                          <div className="space-y-2.5 mb-3">
                            {a.subItems.map(si => {
                              const siTypeColor = TYPE_COLORS[si.type] || TYPE_COLORS.custom;
                              return (
                                <div key={si.id} className="p-3 bg-gradient-to-r from-violet-50/80 to-indigo-50/80 rounded-xl border border-violet-100">
                                  <div className="flex items-center gap-2 mb-1.5">
                                    <Layers className="w-3.5 h-3.5 text-violet-500 flex-shrink-0" />
                                    <h4 className="text-sm font-bold text-foreground">{si.title}</h4>
                                    <span className={cn("px-2 py-0.5 rounded-full text-[10px] font-semibold border capitalize", siTypeColor.bg, siTypeColor.text, siTypeColor.border)}>{si.type}</span>
                                  </div>
                                  {si.description && <p className="text-[11px] text-muted-foreground mb-1.5">{si.description}</p>}

                                  {/* Sub-item timing */}
                                  <div className="flex flex-wrap items-center gap-2 text-[11px] mb-2">
                                    {si.is24Hours ? (
                                      <span className="flex items-center gap-0.5 text-emerald-600 font-semibold bg-emerald-50 px-2 py-0.5 rounded-full">
                                        <Clock className="w-3 h-3" /> 24 Hours Access
                                      </span>
                                    ) : (
                                      <>
                                        {si.scheduleDate && (
                                          <span className="flex items-center gap-0.5 text-muted-foreground">
                                            <Calendar className="w-3 h-3" /> {new Date(si.scheduleDate).toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" })}
                                          </span>
                                        )}
                                        {si.startTime && (
                                          <span className="flex items-center gap-0.5 text-muted-foreground">
                                            <Clock className="w-3 h-3" /> {si.startTime}{si.endTime ? ` – ${si.endTime}` : ""}
                                          </span>
                                        )}
                                      </>
                                    )}
                                  </div>

                                  {/* Sub-item links */}
                                  {si.links.length > 0 && (
                                    <div className="space-y-1.5">
                                      {si.links.map((l, li) => (
                                        <a key={li} href={l.url} target="_blank" rel="noopener noreferrer"
                                          className="flex items-center justify-between p-2 bg-white rounded-lg border border-violet-100 hover:border-indigo-300 hover:shadow-sm transition-all group">
                                          <div className="flex items-center gap-2 min-w-0 flex-1">
                                            <Link2 className="w-3.5 h-3.5 text-indigo-500 flex-shrink-0" />
                                            <span className="text-xs font-medium text-foreground truncate">{l.title}</span>
                                          </div>
                                          <ExternalLink className="w-3.5 h-3.5 text-muted-foreground group-hover:text-indigo-600 flex-shrink-0 ml-2 transition-colors" />
                                        </a>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        )}

                        {/* Direct links (legacy / top-level) */}
                        {a.links.length > 0 && (
                          <div className="space-y-1.5">
                            {a.links.map(l => (
                              <a key={l.id} href={l.url} target="_blank" rel="noopener noreferrer"
                                className="flex items-center justify-between p-2.5 bg-gradient-to-r from-indigo-50 to-violet-50 rounded-xl border border-indigo-100 hover:shadow-sm transition-all group">
                                <div className="min-w-0 flex-1">
                                  <p className="text-sm font-medium text-foreground truncate">{l.title}</p>
                                  {l.instructions && <p className="text-[10px] text-muted-foreground truncate">{l.instructions}</p>}
                                </div>
                                <ExternalLink className="w-4 h-4 text-indigo-500 group-hover:text-indigo-700 flex-shrink-0 ml-2 transition-colors" />
                              </a>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </section>
            )}

            {/* ── Graded / Completed ── */}
            {graded.length > 0 && (
              <section>
                <h2 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-1.5">
                  <Trophy className="w-4 h-4 text-emerald-500" /> Completed ({graded.length})
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {graded.map(a => {
                    const scorePercent = a.score != null && a.maxScore ? Math.round((+a.score / +a.maxScore) * 100) : null;
                    return (
                      <div key={a.id} className="i-card p-4 border-l-4 border-l-emerald-500">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <h3 className="font-semibold text-foreground truncate">{a.title}</h3>
                            <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                              {(a.types || []).map(t => {
                                const tc = TYPE_COLORS[t] || TYPE_COLORS.custom;
                                return <span key={t} className={cn("px-2 py-0.5 rounded-full text-[10px] font-semibold border capitalize", tc.bg, tc.text, tc.border)}>{t}</span>;
                              })}
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-700 flex items-center gap-0.5">
                                <CheckCircle2 className="w-3 h-3" /> Completed
                              </span>
                            </div>
                            {a.schedule && (
                              <p className="text-[10px] text-muted-foreground mt-1.5 flex items-center gap-1">
                                <Calendar className="w-3 h-3" /> {a.schedule.batchLabel} — {new Date(a.schedule.scheduleDate).toLocaleDateString()}
                              </p>
                            )}
                            {a.remarks && <p className="text-xs text-muted-foreground mt-2 italic">&ldquo;{a.remarks}&rdquo;</p>}
                          </div>
                          {a.score != null && (
                            <div className="flex-shrink-0 text-center">
                              <div className="relative w-14 h-14">
                                <svg className="w-14 h-14 -rotate-90" viewBox="0 0 56 56">
                                  <circle cx="28" cy="28" r="24" fill="none" stroke="#e5e7eb" strokeWidth="4" />
                                  <circle cx="28" cy="28" r="24" fill="none"
                                    stroke={scorePercent && scorePercent >= 60 ? "#10b981" : scorePercent && scorePercent >= 40 ? "#f59e0b" : "#ef4444"}
                                    strokeWidth="4" strokeDasharray={`${(scorePercent || 0) * 1.508} 151`} strokeLinecap="round" />
                                </svg>
                                <div className="absolute inset-0 flex items-center justify-center">
                                  <span className="text-xs font-bold text-foreground">{a.score}</span>
                                </div>
                              </div>
                              {a.maxScore && <p className="text-[10px] text-muted-foreground mt-0.5">/{a.maxScore}</p>}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            )}

            {/* ── Expired / Absent ── */}
            {expired.length > 0 && (
              <section>
                <h2 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-1.5">
                  <XCircle className="w-4 h-4 text-red-400" /> Expired / Absent ({expired.length})
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {expired.map(a => (
                    <div key={a.id} className="i-card p-4 border-l-4 border-l-red-300 opacity-70">
                      <h3 className="font-semibold text-foreground">{a.title}</h3>
                      <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                        {(a.types || []).map(t => {
                          const tc = TYPE_COLORS[t] || TYPE_COLORS.custom;
                          return <span key={t} className={cn("px-2 py-0.5 rounded-full text-[10px] font-semibold border capitalize", tc.bg, tc.text, tc.border)}>{t}</span>;
                        })}
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-red-100 text-red-600 flex items-center gap-0.5">
                          {a.status === "absent" ? <><XCircle className="w-3 h-3" /> Absent</> : <><Lock className="w-3 h-3" /> Expired</>}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </>
        )}
      </div>

      {toast && (
        <div className={cn("fixed bottom-6 left-1/2 -translate-x-1/2 z-[60] px-5 py-3 rounded-xl shadow-lg text-sm font-medium flex items-center gap-2",
          toast.type === "success" ? "bg-emerald-600 text-white" : "bg-red-600 text-white")}>
          {toast.type === "success" ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          {toast.msg}
        </div>
      )}
    </div>
  );
}
