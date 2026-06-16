"use client";

import Header from "@/components/layout/Header";
import { cn } from "@/lib/utils";
import { studentApi } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import {
  Megaphone, Building2, Briefcase, CalendarDays, Loader2,
  CheckCircle2, AlertCircle, Clock, XCircle, ChevronRight,
  IndianRupee, GraduationCap, Send, Ban, AlertTriangle, MessageSquare, X,
} from "lucide-react";
import { useState, useEffect, useCallback } from "react";

interface AvailableDrive {
  id: string;
  title: string;
  type: string;
  status: string;
  driveDate: string | null;
  departments: string[];
  description: string | null;
  company: string;
  jobTitle: string;
  ctcRange: string | null;
  alreadyRegistered: boolean;
  registrationStatus: string | null;
  createdAt: string;
}

const regStatusConfig: Record<string, { label: string; color: string; bg: string; icon: React.ElementType }> = {
  pending: { label: "Pending Approval", color: "text-amber-700", bg: "bg-amber-50 border-amber-200", icon: Clock },
  approved: { label: "Approved", color: "text-emerald-700", bg: "bg-emerald-50 border-emerald-200", icon: CheckCircle2 },
  rejected: { label: "Rejected", color: "text-red-700", bg: "bg-red-50 border-red-200", icon: XCircle },
  declined: { label: "Declined", color: "text-slate-700", bg: "bg-slate-50 border-slate-300", icon: Ban },
};

export default function StudentDrivesPage() {
  const { user } = useAuth();
  const [drives, setDrives] = useState<AvailableDrive[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [registering, setRegistering] = useState<string | null>(null);
  const [declining, setDeclining] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const [pendingFeedback, setPendingFeedback] = useState<{ driveId: string; driveTitle: string }[]>([]);
  const [showFeedbackGate, setShowFeedbackGate] = useState(false);

  const fetchDrives = useCallback(async () => {
    try {
      setLoading(true);
      const res = await studentApi.getAvailableDrives();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const data = (res as any)?.data;
      setDrives(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load drives");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDrives();
  }, [fetchDrives]);

  // Auto-dismiss toast
  useEffect(() => {
    if (toast) {
      const t = setTimeout(() => setToast(null), 4000);
      return () => clearTimeout(t);
    }
  }, [toast]);

  const handleRegister = async (driveId: string) => {
    // Check pending feedback first
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const pfRes = await studentApi.getPendingFeedback() as any;
      const pf = pfRes?.data || [];
      setPendingFeedback(pf);
      if (pf.length > 0) {
        setShowFeedbackGate(true);
        return;
      }
    } catch { /* continue with registration if check fails */ }

    try {
      setRegistering(driveId);
      await studentApi.registerForDrive(driveId);
      setToast({ message: "Registration submitted! Awaiting admin approval.", type: "success" });
      await fetchDrives();
    } catch (err) {
      setToast({
        message: err instanceof Error ? err.message : "Failed to register",
        type: "error",
      });
    } finally {
      setRegistering(null);
    }
  };

  const handleDecline = async (driveId: string) => {
    try {
      setDeclining(driveId);
      await studentApi.declineDrive(driveId);
      setToast({ message: "Drive declined successfully.", type: "success" });
      await fetchDrives();
    } catch (err) {
      setToast({
        message: err instanceof Error ? err.message : "Failed to decline",
        type: "error",
      });
    } finally {
      setDeclining(null);
    }
  };

  const openDrives = drives.filter((d) => !d.alreadyRegistered);
  const registeredDrives = drives.filter((d) => d.alreadyRegistered);

  return (
    <div className="page-enter">
      <Header
        userName={user?.email?.split("@")[0] || "Student"}
        userRole="Student"
        greeting="Placement Drives"
        subtitle={`${openDrives.length} available · ${registeredDrives.length} registered`}
      />

      {/* Toast */}
      {toast && (
        <div className="fixed top-4 right-4 z-50 animate-in slide-in-from-top-2">
          <div
            className={cn(
              "px-4 py-3 rounded-xl shadow-lg border flex items-center gap-2.5 text-sm font-medium max-w-sm",
              toast.type === "success"
                ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                : "bg-red-50 text-red-800 border-red-200"
            )}
          >
            {toast.type === "success" ? (
              <CheckCircle2 className="w-4.5 h-4.5 text-emerald-600 flex-shrink-0" />
            ) : (
              <AlertCircle className="w-4.5 h-4.5 text-red-600 flex-shrink-0" />
            )}
            {toast.message}
          </div>
        </div>
      )}

      <div className="px-4 sm:px-6 md:px-8 pb-10 space-y-6">
        {/* Quick Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: "Available", value: openDrives.length, icon: Megaphone, gradient: "from-indigo-50 to-violet-50", iconColor: "text-indigo-600" },
            { label: "Registered", value: registeredDrives.length, icon: Send, gradient: "from-blue-50 to-cyan-50", iconColor: "text-blue-600" },
            { label: "Pending", value: registeredDrives.filter((d) => d.registrationStatus === "pending").length, icon: Clock, gradient: "from-amber-50 to-orange-50", iconColor: "text-amber-600" },
            { label: "Approved", value: registeredDrives.filter((d) => d.registrationStatus === "approved").length, icon: CheckCircle2, gradient: "from-emerald-50 to-teal-50", iconColor: "text-emerald-600" },
          ].map((stat) => (
            <div key={stat.label} className={cn("i-card p-4 bg-gradient-to-br", stat.gradient)}>
              <div className="flex items-center justify-between mb-2">
                <stat.icon className={cn("w-5 h-5", stat.iconColor)} />
              </div>
              {loading ? (
                <div className="animate-pulse">
                  <div className="h-6 bg-white/50 rounded w-8 mb-1" />
                  <div className="h-3 bg-white/50 rounded w-16" />
                </div>
              ) : (
                <>
                  <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                  <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">{stat.label}</p>
                </>
              )}
            </div>
          ))}
        </div>

        {/* Loading / Error / Empty */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
            <p className="text-sm text-muted-foreground">Loading available drives...</p>
          </div>
        ) : error ? (
          <div className="i-card p-6 text-center">
            <AlertCircle className="w-10 h-10 text-red-400 mx-auto mb-3" />
            <p className="text-sm text-red-600">{error}</p>
          </div>
        ) : drives.length === 0 ? (
          <div className="i-card p-12 text-center">
            <Megaphone className="w-14 h-14 text-muted-foreground/30 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-1">No drives available</h3>
            <p className="text-sm text-muted-foreground">
              When new placement drives are posted, they&apos;ll appear here for you to register.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* ─── Available Drives (not registered) ─── */}
            {openDrives.length > 0 && (
              <div className="space-y-4">
                <h2 className="text-sm font-semibold text-foreground uppercase tracking-wider flex items-center gap-2">
                  <Megaphone className="w-4 h-4 text-indigo-500" />
                  Available Drives
                </h2>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {openDrives.map((drive) => (
                    <div
                      key={drive.id}
                      className="i-card overflow-hidden group hover:shadow-md transition-all duration-200"
                    >
                      {/* Card Header */}
                      <div className="p-4 sm:p-5 border-b border-border/50">
                        <div className="flex items-start gap-3">
                          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-indigo-100 to-violet-100 flex items-center justify-center text-sm font-bold text-indigo-700 flex-shrink-0">
                            {drive.company.charAt(0)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="text-sm font-semibold text-foreground truncate">{drive.company}</h3>
                            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                              <Briefcase className="w-3 h-3" />
                              {drive.jobTitle}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Card Details */}
                      <div className="p-4 sm:p-5 space-y-3">
                        {drive.description && (
                          <p className="text-xs text-muted-foreground line-clamp-2">{drive.description}</p>
                        )}

                        <div className="grid grid-cols-2 gap-2.5">
                          {drive.driveDate && (
                            <div className="flex items-center gap-2 text-xs">
                              <CalendarDays className="w-3.5 h-3.5 text-blue-500" />
                              <span className="text-foreground font-medium">
                                {new Date(drive.driveDate).toLocaleDateString("en-IN", {
                                  day: "numeric", month: "short", year: "numeric",
                                })}
                              </span>
                            </div>
                          )}
                          {drive.ctcRange && (
                            <div className="flex items-center gap-2 text-xs">
                              <IndianRupee className="w-3.5 h-3.5 text-emerald-500" />
                              <span className="text-foreground font-medium">{drive.ctcRange}</span>
                            </div>
                          )}
                          {drive.departments.length > 0 && (
                            <div className="flex items-center gap-2 text-xs col-span-2">
                              <GraduationCap className="w-3.5 h-3.5 text-violet-500" />
                              <span className="text-muted-foreground">{drive.departments.join(", ")}</span>
                            </div>
                          )}
                        </div>

                        {/* Action Buttons */}
                        <div className="flex gap-2 mt-2">
                          <button
                            onClick={() => handleRegister(drive.id)}
                            disabled={registering === drive.id || declining === drive.id}
                            className={cn(
                              "flex-1 py-2.5 px-4 rounded-xl text-sm font-semibold",
                              "bg-gradient-to-r from-indigo-600 to-violet-600 text-white",
                              "hover:from-indigo-700 hover:to-violet-700",
                              "active:scale-[0.98] transition-all duration-150",
                              "disabled:opacity-60 disabled:cursor-not-allowed",
                              "flex items-center justify-center gap-2 shadow-sm"
                            )}
                          >
                            {registering === drive.id ? (
                              <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Registering...
                              </>
                            ) : (
                              <>
                                <Send className="w-4 h-4" />
                                Attend Drive
                              </>
                            )}
                          </button>
                          <button
                            onClick={() => handleDecline(drive.id)}
                            disabled={declining === drive.id || registering === drive.id}
                            className={cn(
                              "py-2.5 px-4 rounded-xl text-sm font-semibold",
                              "bg-slate-100 text-slate-700 border border-slate-200",
                              "hover:bg-slate-200 hover:border-slate-300",
                              "active:scale-[0.98] transition-all duration-150",
                              "disabled:opacity-60 disabled:cursor-not-allowed",
                              "flex items-center justify-center gap-2"
                            )}
                          >
                            {declining === drive.id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <>
                                <Ban className="w-4 h-4" />
                                Decline
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ─── Registered Drives ─── */}
            {registeredDrives.length > 0 && (
              <div className="space-y-4">
                <h2 className="text-sm font-semibold text-foreground uppercase tracking-wider flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  My Registrations
                </h2>
                <div className="space-y-3">
                  {registeredDrives.map((drive) => {
                    const sc = regStatusConfig[drive.registrationStatus || "pending"] || regStatusConfig.pending;
                    const StatusIcon = sc.icon;
                    return (
                      <div key={drive.id} className="i-card p-4 sm:p-5">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-gray-100 to-slate-100 flex items-center justify-center text-sm font-bold text-gray-600 flex-shrink-0">
                              {drive.company.charAt(0)}
                            </div>
                            <div>
                              <h4 className="text-sm font-semibold text-foreground">{drive.company}</h4>
                              <p className="text-xs text-muted-foreground">{drive.jobTitle}</p>
                              {drive.driveDate && (
                                <p className="text-[10px] text-muted-foreground mt-0.5 flex items-center gap-1">
                                  <CalendarDays className="w-3 h-3" />
                                  {new Date(drive.driveDate).toLocaleDateString("en-IN", {
                                    day: "numeric", month: "short", year: "numeric",
                                  })}
                                </p>
                              )}
                            </div>
                          </div>
                          <div className={cn("flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border self-start sm:self-center", sc.bg, sc.color)}>
                            <StatusIcon className="w-3.5 h-3.5" />
                            {sc.label}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Feedback Gate Modal ── */}
      {showFeedbackGate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl border border-amber-200 shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between p-5 border-b border-amber-100">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-600" />
                <h2 className="text-lg font-bold text-foreground">Feedback Required</h2>
              </div>
              <button onClick={() => setShowFeedbackGate(false)} className="p-2 hover:bg-accent rounded-xl transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <p className="text-sm text-muted-foreground">
                Please submit feedback for the following drives before registering for new ones:
              </p>
              <div className="space-y-2">
                {pendingFeedback.map((pf) => (
                  <div key={pf.driveId} className="flex items-center gap-2 p-3 bg-amber-50 rounded-xl border border-amber-100">
                    <MessageSquare className="w-4 h-4 text-amber-600 flex-shrink-0" />
                    <span className="text-sm font-medium text-amber-800">{pf.driveTitle}</span>
                  </div>
                ))}
              </div>
              <a href="/student/feedback"
                className="flex items-center justify-center gap-2 w-full px-5 py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl text-sm font-medium shadow-lg shadow-amber-500/20 hover:shadow-amber-500/30 transition-all">
                <MessageSquare className="w-4 h-4" /> Go to Feedback Page
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
