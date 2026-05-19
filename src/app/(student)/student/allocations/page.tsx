"use client";

import Header from "@/components/layout/Header";
import { cn } from "@/lib/utils";
import { studentApi } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import {
  Clock, MapPin, Building2, Users, CalendarDays, Loader2,
  CheckCircle2, AlertCircle, Briefcase,
} from "lucide-react";
import { useState, useEffect, useCallback } from "react";

interface SlotData {
  id: string;
  timeSlot: string;
  classroom: string | null;
  departments: string[];
  studentCount: number;
}

interface DriveAllocation {
  driveId: string;
  title: string;
  status: string;
  driveDate: string | null;
  company: string;
  jobTitle: string;
  registrationStatus: string;
  slots: SlotData[];
}

const statusConfig: Record<string, { label: string; color: string; bg: string; icon: React.ElementType }> = {
  scheduled: { label: "Scheduled", color: "text-blue-600", bg: "bg-blue-50", icon: CalendarDays },
  open: { label: "Open", color: "text-emerald-600", bg: "bg-emerald-50", icon: CheckCircle2 },
  screening: { label: "Screening", color: "text-amber-600", bg: "bg-amber-50", icon: AlertCircle },
  completed: { label: "Completed", color: "text-gray-600", bg: "bg-gray-100", icon: CheckCircle2 },
  cancelled: { label: "Cancelled", color: "text-red-600", bg: "bg-red-50", icon: AlertCircle },
};

export default function StudentAllocationsPage() {
  const { user } = useAuth();
  const [allocations, setAllocations] = useState<DriveAllocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAllocations = useCallback(async () => {
    try {
      setLoading(true);
      const res = await studentApi.getDriveAllocations();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const data = (res as any)?.data;
      setAllocations(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load allocations");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAllocations();
  }, [fetchAllocations]);

  const scheduledDrives = allocations.filter((a) => a.slots.length > 0);
  const pendingDrives = allocations.filter((a) => a.slots.length === 0);

  return (
    <div className="page-enter">
      <Header
        userName={user?.email?.split("@")[0] || "Student"}
        userRole="Student"
        greeting="My Allocations"
        subtitle={`${scheduledDrives.length} scheduled · ${pendingDrives.length} pending`}
      />

      <div className="px-4 sm:px-6 md:px-8 pb-10 space-y-6">
        {/* Quick Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: "Total Drives", value: allocations.length, icon: Briefcase, color: "from-indigo-50 to-violet-50 text-indigo-600" },
            { label: "Scheduled", value: scheduledDrives.length, icon: CalendarDays, color: "from-blue-50 to-cyan-50 text-blue-600" },
            { label: "Pending", value: pendingDrives.length, icon: Clock, color: "from-amber-50 to-orange-50 text-amber-600" },
            { label: "Companies", value: new Set(allocations.map((a) => a.company)).size, icon: Building2, color: "from-emerald-50 to-teal-50 text-emerald-600" },
          ].map((stat) => (
            <div key={stat.label} className={cn("i-card p-4 bg-gradient-to-br", stat.color.split(" ")[0], stat.color.split(" ")[1])}>
              <div className="flex items-center justify-between mb-2">
                <stat.icon className={cn("w-5 h-5", stat.color.split(" ")[2])} />
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
            <p className="text-sm text-muted-foreground">Loading your drive allocations...</p>
          </div>
        ) : error ? (
          <div className="i-card p-6 text-center">
            <AlertCircle className="w-10 h-10 text-red-400 mx-auto mb-3" />
            <p className="text-sm text-red-600">{error}</p>
          </div>
        ) : allocations.length === 0 ? (
          <div className="i-card p-12 text-center">
            <CalendarDays className="w-14 h-14 text-muted-foreground/30 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-1">No drive allocations yet</h3>
            <p className="text-sm text-muted-foreground">
              When you&apos;re approved for a placement drive, your slot allocations will appear here.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* ─── Scheduled Drives (with slots) ─── */}
            {scheduledDrives.length > 0 && (
              <div className="space-y-4">
                <h2 className="text-sm font-semibold text-foreground uppercase tracking-wider flex items-center gap-2">
                  <CalendarDays className="w-4 h-4 text-blue-500" />
                  Scheduled Drives
                </h2>
                {scheduledDrives.map((drive) => {
                  const sc = statusConfig[drive.status] || statusConfig.open;
                  return (
                    <div key={drive.driveId} className="i-card overflow-hidden">
                      {/* Drive Header */}
                      <div className="p-4 sm:p-5 border-b border-border/50">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <div className="flex items-start gap-3">
                            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-indigo-100 to-violet-100 flex items-center justify-center text-sm font-bold text-indigo-700 flex-shrink-0">
                              {drive.company.charAt(0)}
                            </div>
                            <div>
                              <h3 className="text-sm font-semibold text-foreground">{drive.company}</h3>
                              <p className="text-xs text-muted-foreground">{drive.jobTitle}</p>
                              {drive.driveDate && (
                                <p className="text-[10px] text-primary font-medium mt-0.5 flex items-center gap-1">
                                  <CalendarDays className="w-3 h-3" />
                                  {new Date(drive.driveDate).toLocaleDateString("en-US", {
                                    weekday: "short", month: "short", day: "numeric", year: "numeric",
                                  })}
                                </p>
                              )}
                            </div>
                          </div>
                          <span className={cn("text-[10px] font-semibold px-2.5 py-1 rounded-full self-start sm:self-center", sc.bg, sc.color)}>
                            {sc.label}
                          </span>
                        </div>
                      </div>

                      {/* Slot Cards */}
                      <div className="p-4 sm:p-5 space-y-3">
                        <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                          Your Slot{drive.slots.length > 1 ? "s" : ""}
                        </p>
                        {drive.slots.map((slot) => (
                          <div key={slot.id} className="flex flex-col sm:flex-row sm:items-center gap-3 p-3.5 rounded-xl bg-gradient-to-r from-blue-50/80 to-indigo-50/80 border border-blue-100">
                            {/* Time */}
                            <div className="flex items-center gap-2.5 sm:min-w-[180px]">
                              <div className="w-9 h-9 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                                <Clock className="w-4.5 h-4.5 text-blue-600" />
                              </div>
                              <div>
                                <p className="text-sm font-semibold text-foreground">{slot.timeSlot}</p>
                                <p className="text-[10px] text-muted-foreground">Time Slot</p>
                              </div>
                            </div>

                            {/* Classroom */}
                            {slot.classroom && (
                              <div className="flex items-center gap-2.5 sm:min-w-[150px]">
                                <div className="w-9 h-9 rounded-lg bg-violet-100 flex items-center justify-center flex-shrink-0">
                                  <MapPin className="w-4.5 h-4.5 text-violet-600" />
                                </div>
                                <div>
                                  <p className="text-sm font-semibold text-foreground">{slot.classroom}</p>
                                  <p className="text-[10px] text-muted-foreground">Classroom</p>
                                </div>
                              </div>
                            )}

                            {/* Students */}
                            <div className="flex items-center gap-2.5">
                              <div className="w-9 h-9 rounded-lg bg-emerald-100 flex items-center justify-center flex-shrink-0">
                                <Users className="w-4.5 h-4.5 text-emerald-600" />
                              </div>
                              <div>
                                <p className="text-sm font-semibold text-foreground">{slot.studentCount} students</p>
                                <p className="text-[10px] text-muted-foreground">{slot.departments.join(", ")}</p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* ─── Pending Drives (no slots yet) ─── */}
            {pendingDrives.length > 0 && (
              <div className="space-y-3">
                <h2 className="text-sm font-semibold text-foreground uppercase tracking-wider flex items-center gap-2">
                  <Clock className="w-4 h-4 text-amber-500" />
                  Awaiting Schedule
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {pendingDrives.map((drive) => {
                    const sc = statusConfig[drive.status] || statusConfig.open;
                    return (
                      <div key={drive.driveId} className="i-card p-4 group">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-50 to-orange-50 flex items-center justify-center text-sm font-bold text-amber-700 flex-shrink-0">
                              {drive.company.charAt(0)}
                            </div>
                            <div>
                              <h4 className="text-sm font-semibold text-foreground">{drive.company}</h4>
                              <p className="text-xs text-muted-foreground">{drive.jobTitle}</p>
                            </div>
                          </div>
                          <span className={cn("text-[10px] font-semibold px-2.5 py-1 rounded-full flex-shrink-0", sc.bg, sc.color)}>
                            {sc.label}
                          </span>
                        </div>
                        <div className="mt-3 pt-3 border-t border-border/50 flex items-center gap-2 text-xs text-muted-foreground">
                          <Clock className="w-3.5 h-3.5" />
                          <span>Slot assignment pending — check back later</span>
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
    </div>
  );
}
