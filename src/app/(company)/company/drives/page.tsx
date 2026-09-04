"use client";

import Header from "@/components/layout/Header";
import { cn } from "@/lib/utils";
import { companyApi } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import {
  Briefcase, CalendarDays, Clock, MapPin, Users, Loader2,
  AlertCircle, ChevronDown, ChevronUp, Building2, Download,
  FileText, GraduationCap, Mail, Phone, User,
} from "lucide-react";
import { useState, useEffect, useCallback } from "react";

interface SlotData {
  id: string;
  timeSlot: string;
  classroom: string | null;
  departments: string[];
  studentCount: number;
}

interface CompanyDrive {
  id: string;
  title: string;
  status: string;
  driveDate: string | null;
  departments: string[];
  jobTitle: string;
  slots: SlotData[];
  createdAt: string;
}

interface AttendeeStudent {
  studentId: string;
  fullName: string;
  usn: string;
  department: string;
  cgpa: number | null;
  email: string;
  phone: string | null;
  semester: number | null;
  resumeLink: string | null;
  attendedAt: string;
}

interface AttendeeJob {
  jobId: string;
  jobTitle: string;
  students: AttendeeStudent[];
}

interface AttendeesData {
  jobs: AttendeeJob[];
  totalAttendees: number;
}

const statusColors: Record<string, { label: string; dot: string; bg: string; text: string }> = {
  scheduled: { label: "Scheduled", dot: "bg-blue-400", bg: "bg-blue-50", text: "text-blue-700" },
  open: { label: "Open", dot: "bg-emerald-400", bg: "bg-emerald-50", text: "text-emerald-700" },
  screening: { label: "Screening", dot: "bg-amber-400", bg: "bg-amber-50", text: "text-amber-700" },
  completed: { label: "Completed", dot: "bg-gray-400", bg: "bg-gray-100", text: "text-gray-700" },
  cancelled: { label: "Cancelled", dot: "bg-red-400", bg: "bg-red-50", text: "text-red-700" },
};

export default function CompanyDrivesPage() {
  const { user } = useAuth();
  const [drives, setDrives] = useState<CompanyDrive[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedDrive, setExpandedDrive] = useState<string | null>(null);
  const [attendeesData, setAttendeesData] = useState<Record<string, AttendeesData>>({});
  const [loadingAttendees, setLoadingAttendees] = useState<string | null>(null);

  const fetchDrives = useCallback(async () => {
    try {
      setLoading(true);
      const res = await companyApi.getDrives();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const data = (res as any)?.data;
      setDrives(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load drives");
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchAttendees = useCallback(async (driveId: string) => {
    if (attendeesData[driveId]) return; // Already loaded
    try {
      setLoadingAttendees(driveId);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const res = await companyApi.getDriveAttendees(driveId) as any;
      const data = res?.data;
      if (data) {
        setAttendeesData(prev => ({ ...prev, [driveId]: data }));
      }
    } catch {
      // Silently fail — attendees section just won't show
    } finally {
      setLoadingAttendees(null);
    }
  }, [attendeesData]);

  useEffect(() => {
    fetchDrives();
  }, [fetchDrives]);

  const handleExpand = (driveId: string) => {
    const isExpanded = expandedDrive === driveId;
    setExpandedDrive(isExpanded ? null : driveId);
    if (!isExpanded) {
      fetchAttendees(driveId);
    }
  };

  const totalSlots = drives.reduce((acc, d) => acc + d.slots.length, 0);
  const totalStudents = drives.reduce((acc, d) => d.slots.reduce((s, sl) => s + sl.studentCount, 0) + acc, 0);
  const activeDrives = drives.filter((d) => d.status !== "completed" && d.status !== "cancelled");

  return (
    <div className="page-enter">
      <Header
        userName={user?.email?.split("@")[0] || "HR"}
        userRole="Company"
        greeting="Drive Schedule"
        subtitle={`${drives.length} drive${drives.length !== 1 ? "s" : ""} · ${totalStudents} students allocated`}
      />

      <div className="px-4 sm:px-6 md:px-8 pb-10 space-y-6">
        {/* Quick Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: "Total Drives", value: drives.length, icon: Briefcase, colors: "from-indigo-50 to-violet-50 text-indigo-600" },
            { label: "Active", value: activeDrives.length, icon: CalendarDays, colors: "from-emerald-50 to-teal-50 text-emerald-600" },
            { label: "Total Slots", value: totalSlots, icon: Clock, colors: "from-blue-50 to-cyan-50 text-blue-600" },
            { label: "Students", value: totalStudents, icon: Users, colors: "from-amber-50 to-orange-50 text-amber-600" },
          ].map((s) => (
            <div key={s.label} className={cn("i-card p-4 bg-gradient-to-br", s.colors.split(" ")[0], s.colors.split(" ")[1])}>
              <s.icon className={cn("w-5 h-5 mb-2", s.colors.split(" ")[2])} />
              {loading ? (
                <div className="animate-pulse">
                  <div className="h-6 bg-white/50 rounded w-8 mb-1" />
                  <div className="h-3 bg-white/50 rounded w-16" />
                </div>
              ) : (
                <>
                  <p className="text-2xl font-bold text-foreground">{s.value}</p>
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">{s.label}</p>
                </>
              )}
            </div>
          ))}
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
            <p className="text-sm text-muted-foreground">Loading your drive schedule...</p>
          </div>
        ) : error ? (
          <div className="i-card p-6 text-center">
            <AlertCircle className="w-10 h-10 text-red-400 mx-auto mb-3" />
            <p className="text-sm text-red-600">{error}</p>
          </div>
        ) : drives.length === 0 ? (
          <div className="i-card p-12 text-center">
            <Building2 className="w-14 h-14 text-muted-foreground/30 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-1">No drives scheduled</h3>
            <p className="text-sm text-muted-foreground">
              Drives scheduled by the admin for your company will appear here with slot details.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {drives.map((drive) => {
              const isExpanded = expandedDrive === drive.id;
              const sc = statusColors[drive.status] || statusColors.open;
              const driveStudents = drive.slots.reduce((s, sl) => s + sl.studentCount, 0);
              const driveAttendees = attendeesData[drive.id];

              return (
                <div key={drive.id} className="i-card overflow-hidden">
                  {/* Clickable header */}
                  <button
                    onClick={() => handleExpand(drive.id)}
                    className="w-full p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-left hover:bg-muted/30 transition-colors"
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-indigo-100 to-violet-100 flex items-center justify-center text-sm font-bold text-indigo-700 flex-shrink-0">
                        {drive.title.charAt(0)}
                      </div>
                      <div>
                        <h3 className="text-sm font-semibold text-foreground">{drive.title}</h3>
                        <p className="text-xs text-muted-foreground">{drive.jobTitle}</p>
                        {drive.driveDate && (
                          <p className="text-[10px] text-primary font-medium mt-0.5 flex items-center gap-1">
                            <CalendarDays className="w-3 h-3" />
                            {new Date(drive.driveDate).toLocaleDateString("en-US", {
                              weekday: "short", month: "short", day: "numeric",
                            })}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className={cn("text-[10px] font-semibold px-2.5 py-1 rounded-full flex items-center gap-1", sc.bg, sc.text)}>
                        <span className={cn("w-1.5 h-1.5 rounded-full", sc.dot)} />
                        {sc.label}
                      </span>
                      <span className="text-xs text-muted-foreground">{drive.slots.length} slot{drive.slots.length !== 1 ? "s" : ""} · {driveStudents} students</span>
                      {isExpanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                    </div>
                  </button>

                  {/* Expanded content */}
                  {isExpanded && (
                    <div className="border-t border-border/50">
                      {/* Slot Schedule */}
                      {drive.slots.length > 0 && (
                        <div className="p-4 sm:p-5">
                          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                            Slot Allocation Schedule
                          </p>
                          <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                              <thead>
                                <tr className="border-b border-border/50">
                                  <th className="text-left text-[10px] font-semibold text-muted-foreground uppercase tracking-wider p-2.5">Time Slot</th>
                                  <th className="text-left text-[10px] font-semibold text-muted-foreground uppercase tracking-wider p-2.5">Classroom</th>
                                  <th className="text-left text-[10px] font-semibold text-muted-foreground uppercase tracking-wider p-2.5">Departments</th>
                                  <th className="text-right text-[10px] font-semibold text-muted-foreground uppercase tracking-wider p-2.5">Students</th>
                                </tr>
                              </thead>
                              <tbody>
                                {drive.slots.map((slot, idx) => (
                                  <tr key={slot.id} className={cn("border-b border-border/30 last:border-b-0", idx % 2 === 0 && "bg-muted/10")}>
                                    <td className="p-2.5">
                                      <div className="flex items-center gap-2">
                                        <Clock className="w-3.5 h-3.5 text-blue-500" />
                                        <span className="text-sm font-medium text-foreground">{slot.timeSlot}</span>
                                      </div>
                                    </td>
                                    <td className="p-2.5">
                                      <div className="flex items-center gap-2">
                                        <MapPin className="w-3.5 h-3.5 text-violet-500" />
                                        <span className="text-sm text-foreground">{slot.classroom || "—"}</span>
                                      </div>
                                    </td>
                                    <td className="p-2.5">
                                      <div className="flex flex-wrap gap-1">
                                        {slot.departments.map((d) => (
                                          <span key={d} className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100">
                                            {d}
                                          </span>
                                        ))}
                                      </div>
                                    </td>
                                    <td className="p-2.5 text-right">
                                      <span className="inline-flex items-center gap-1 text-sm font-semibold text-foreground">
                                        <Users className="w-3.5 h-3.5 text-emerald-500" />
                                        {slot.studentCount}
                                      </span>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}

                      {/* Attendees / Applicants */}
                      <div className="border-t border-border/50 p-4 sm:p-5">
                        <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-1.5">
                          <Users className="w-3.5 h-3.5" />
                          Student Applications ({driveAttendees?.totalAttendees || 0})
                        </p>

                        {loadingAttendees === drive.id ? (
                          <div className="flex items-center justify-center py-6 gap-2">
                            <Loader2 className="w-5 h-5 animate-spin text-indigo-500" />
                            <span className="text-xs text-muted-foreground">Loading applicants...</span>
                          </div>
                        ) : driveAttendees && driveAttendees.jobs.length > 0 ? (
                          <div className="space-y-4">
                            {driveAttendees.jobs.map((jobGroup) => (
                              <div key={jobGroup.jobId} className="border border-border/50 rounded-xl overflow-hidden">
                                <div className="px-4 py-2.5 bg-gradient-to-r from-indigo-50 to-violet-50 flex items-center justify-between">
                                  <div className="flex items-center gap-2">
                                    <Briefcase className="w-4 h-4 text-indigo-600" />
                                    <span className="text-sm font-semibold text-foreground">{jobGroup.jobTitle}</span>
                                  </div>
                                  <span className="text-xs font-medium text-indigo-600">{jobGroup.students.length} applicant{jobGroup.students.length !== 1 ? "s" : ""}</span>
                                </div>

                                {jobGroup.students.length > 0 && (
                                  <div className="overflow-x-auto">
                                    <table className="w-full text-sm">
                                      <thead>
                                        <tr className="border-b border-border/50 bg-muted/20">
                                          <th className="text-left text-[10px] font-semibold text-muted-foreground uppercase p-2.5">Student</th>
                                          <th className="text-left text-[10px] font-semibold text-muted-foreground uppercase p-2.5">USN</th>
                                          <th className="text-left text-[10px] font-semibold text-muted-foreground uppercase p-2.5">Dept</th>
                                          <th className="text-left text-[10px] font-semibold text-muted-foreground uppercase p-2.5">CGPA</th>
                                          <th className="text-left text-[10px] font-semibold text-muted-foreground uppercase p-2.5">Contact</th>
                                          <th className="text-center text-[10px] font-semibold text-muted-foreground uppercase p-2.5">Resume</th>
                                        </tr>
                                      </thead>
                                      <tbody>
                                        {jobGroup.students.map((student, idx) => (
                                          <tr key={student.studentId} className={cn("border-b border-border/20 last:border-b-0", idx % 2 === 0 && "bg-muted/5")}>
                                            <td className="p-2.5">
                                              <div className="flex items-center gap-2">
                                                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-indigo-100 to-violet-100 flex items-center justify-center text-[10px] font-bold text-indigo-700 flex-shrink-0">
                                                  {student.fullName?.charAt(0) || "?"}
                                                </div>
                                                <span className="text-sm font-medium text-foreground">{student.fullName}</span>
                                              </div>
                                            </td>
                                            <td className="p-2.5">
                                              <span className="text-xs font-mono text-muted-foreground">{student.usn || "—"}</span>
                                            </td>
                                            <td className="p-2.5">
                                              <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100">
                                                {student.department || "—"}
                                              </span>
                                            </td>
                                            <td className="p-2.5">
                                              <span className="text-sm font-semibold text-foreground">{student.cgpa ?? "—"}</span>
                                            </td>
                                            <td className="p-2.5">
                                              <div className="flex flex-col gap-0.5">
                                                {student.email && (
                                                  <a href={`mailto:${student.email}`} className="text-[10px] text-indigo-600 hover:underline flex items-center gap-1">
                                                    <Mail className="w-3 h-3" /> {student.email}
                                                  </a>
                                                )}
                                                {student.phone && (
                                                  <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                                                    <Phone className="w-3 h-3" /> {student.phone}
                                                  </span>
                                                )}
                                              </div>
                                            </td>
                                            <td className="p-2.5 text-center">
                                              {student.resumeLink ? (
                                                <a
                                                  href={student.resumeLink}
                                                  target="_blank"
                                                  rel="noopener noreferrer"
                                                  className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-50 border border-emerald-200 rounded-lg text-[10px] font-semibold text-emerald-700 hover:bg-emerald-100 transition-colors"
                                                >
                                                  <Download className="w-3 h-3" /> Resume
                                                </a>
                                              ) : (
                                                <span className="text-[10px] text-muted-foreground">—</span>
                                              )}
                                            </td>
                                          </tr>
                                        ))}
                                      </tbody>
                                    </table>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-sm text-muted-foreground text-center py-4">
                            No students have applied to this drive yet.
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
