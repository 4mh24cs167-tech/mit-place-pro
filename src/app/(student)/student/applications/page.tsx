"use client";

import Header from "@/components/layout/Header";
import { studentApi } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { cn } from "@/lib/utils";
import {
  Building2,
  MapPin,
  Clock,
  Star,
  ChevronRight,
  FileText,
  IndianRupee,
  Briefcase,
  Loader2,
  Video,
  Users,
  UserCheck,
  Link2,
  Calendar,
  ExternalLink,
} from "lucide-react";
import { useState, useEffect, useCallback } from "react";

interface ApplicationData {
  id: string;
  status?: string;
  result?: string;
  currentRound?: number;
  atsScore?: number;
  createdAt?: string;
  updatedAt?: string;
  job?: {
    title?: string;
    ctcMinLpa?: number;
    ctcMaxLpa?: number;
    company?: { name?: string; hqCity?: string };
  };
  interviewSlot?: { date?: string; time?: string; venue?: string; roundName?: string };
}

interface MeetingInfo {
  id: string;
  meetingType?: string;
  roundNumber?: number;
  jobTitle?: string | null;
  companyName?: string | null;
  meetingLink?: string | null;
  scheduledDate?: string | null;
  scheduledTime?: string | null;
  venue?: string | null;
  instructions?: string | null;
  groupName?: string | null;
  personalLink?: string | null;
  scheduledStart?: string | null;
  scheduledEnd?: string | null;
  status?: string;
  meetingStatus?: string;
}

const statusMap: Record<string, { label: string; color: string; bg: string }> = {
  pending: { label: "Pending", color: "text-amber-600", bg: "bg-amber-50" },
  round1: { label: "Round 1", color: "text-blue-600", bg: "bg-blue-50" },
  round2: { label: "Round 2", color: "text-indigo-600", bg: "bg-indigo-50" },
  round3: { label: "Round 3", color: "text-violet-600", bg: "bg-violet-50" },
  selected: { label: "Selected ✨", color: "text-emerald-600", bg: "bg-emerald-50" },
  offered: { label: "Selected ✨", color: "text-emerald-600", bg: "bg-emerald-50" },
  rejected: { label: "Not Selected", color: "text-red-600", bg: "bg-red-50" },
};

function getStatusKey(app: ApplicationData): string {
  if (app.result === "selected" || app.result === "offered") return "selected";
  if (app.result === "rejected") return "rejected";
  if ((app.currentRound || 0) >= 3) return "round3";
  if ((app.currentRound || 0) === 2) return "round2";
  if ((app.currentRound || 0) === 1) return "round1";
  return "pending";
}

export default function StudentApplicationsPage() {
  const { user } = useAuth();
  const [applications, setApplications] = useState<ApplicationData[]>([]);
  const [meetings, setMeetings] = useState<MeetingInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  const fetchApplications = useCallback(async () => {
    try {
      setLoading(true);
      const res = await studentApi.getApplications();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const data = (res as any)?.data;
      setApplications(Array.isArray(data) ? data : []);
    } catch {
      setApplications([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchApplications();
    // Fetch meetings
    const fetchMeetings = async () => {
      try {
        const res = await studentApi.getMeetings();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const data = (res as any)?.data;
        if (Array.isArray(data)) setMeetings(data);
      } catch {
        setMeetings([]);
      }
    };
    fetchMeetings();
  }, [fetchApplications]);

  const filtered = applications.filter((a) => {
    if (filter === "all") return true;
    return getStatusKey(a) === filter;
  });

  const selectedCount = applications.filter((a) => ["selected", "offered"].includes(a.result || "")).length;
  const activeCount = applications.filter((a) => !["selected", "offered", "rejected"].includes(a.result || "")).length;
  const pendingCount = applications.filter((a) => getStatusKey(a) === "pending").length;
  const rejectedCount = applications.filter((a) => a.result === "rejected").length;

  return (
    <div className="page-enter">
      <Header
        userName={user?.email?.split("@")[0] || "Student"}
        userRole="Student"
        greeting="My Applications"
        subtitle={`${applications.length} total · ${activeCount} in progress · ${selectedCount} offers received`}
      />

      <div className="px-4 sm:px-6 md:px-8 pb-10 space-y-4 sm:space-y-6">
        {/* Quick stats */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {[
            { label: "Total", count: applications.length, filterVal: "all" },
            { label: "In Progress", count: activeCount, filterVal: "round1" },
            { label: "Pending", count: pendingCount, filterVal: "pending" },
            { label: "Selected", count: selectedCount, filterVal: "selected" },
            { label: "Rejected", count: rejectedCount, filterVal: "rejected" },
          ].map((s) => (
            <button
              key={s.label}
              onClick={() => setFilter(s.filterVal)}
              className={cn(
                "i-card p-3 text-center transition-all cursor-pointer",
                filter === s.filterVal && "ring-2 ring-primary/30"
              )}
            >
              {loading ? (
                <div className="animate-pulse">
                  <div className="h-5 bg-muted rounded w-8 mx-auto mb-1" />
                  <div className="h-3 bg-muted rounded w-12 mx-auto" />
                </div>
              ) : (
                <>
                  <p className="text-lg font-bold text-foreground">{s.count}</p>
                  <p className="text-[10px] text-muted-foreground">{s.label}</p>
                </>
              )}
            </button>
          ))}
        </div>

        {/* Application cards */}
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="i-card p-5 animate-pulse">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-muted" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-muted rounded w-1/3" />
                    <div className="h-3 bg-muted rounded w-1/4" />
                    <div className="h-3 bg-muted rounded w-1/2" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="i-card p-12 text-center">
            <Briefcase className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
            <h3 className="text-lg font-semibold text-foreground mb-1">
              {filter === "all" ? "No applications yet" : "No applications in this category"}
            </h3>
            <p className="text-sm text-muted-foreground">
              {filter === "all" ? "Browse eligible jobs and start applying!" : "Try a different filter"}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map((app) => {
              const statusKey = getStatusKey(app);
              const st = statusMap[statusKey] || statusMap.pending;
              const companyName = app.job?.company?.name || "Company";
              const ctcLabel = app.job?.ctcMinLpa
                ? `${app.job.ctcMinLpa}${app.job.ctcMaxLpa ? ` - ${app.job.ctcMaxLpa}` : ""} LPA`
                : "—";
              const appliedDate = app.createdAt ? new Date(app.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—";

              return (
                <div key={app.id} className="i-card p-4 sm:p-5 group cursor-pointer">
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                    <div className="flex items-start gap-3 sm:gap-4">
                      <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-indigo-100 to-violet-100 flex items-center justify-center text-sm sm:text-base font-bold text-indigo-700 flex-shrink-0">
                        {companyName.charAt(0)}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="text-sm font-semibold text-foreground">{companyName}</h3>
                          <span className={cn("text-[10px] font-semibold px-2 py-0.5 rounded-full", st.bg, st.color)}>
                            {st.label}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">{app.job?.title || "—"}</p>
                        <div className="flex items-center gap-3 sm:gap-4 mt-2 text-[10px] text-muted-foreground flex-wrap">
                          <div className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {app.job?.company?.hqCity || "—"}</div>
                          <div className="flex items-center gap-1"><IndianRupee className="w-3 h-3" /> {ctcLabel}</div>
                          <div className="flex items-center gap-1"><Clock className="w-3 h-3" /> Applied {appliedDate}</div>
                        </div>
                      </div>
                    </div>

                    <div className="flex sm:flex-col items-center sm:items-end gap-2">
                      <div className={cn(
                        "flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border",
                        (app.atsScore || 0) >= 80 ? "bg-emerald-50 text-emerald-600 border-emerald-200" :
                        (app.atsScore || 0) >= 65 ? "bg-blue-50 text-blue-600 border-blue-200" :
                        "bg-amber-50 text-amber-600 border-amber-200"
                      )}>
                        <Star className="w-3 h-3" />
                        ATS: {app.atsScore ?? "—"}%
                      </div>
                      <ChevronRight className="w-4 h-4 text-muted-foreground hidden sm:block opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </div>

                  {/* Current round info */}
                  <div className="mt-3 pt-3 border-t border-border/50 flex items-center gap-2 text-xs">
                    <FileText className="w-3.5 h-3.5 text-muted-foreground" />
                    <span className="text-muted-foreground">
                      Current: <strong className="text-foreground">
                        {app.interviewSlot?.roundName || (app.currentRound ? `Round ${app.currentRound}` : "Pending Review")}
                      </strong>
                    </span>
                    {app.interviewSlot?.date && <span className="text-muted-foreground">· {app.interviewSlot.date}</span>}
                    {app.interviewSlot?.time && <span className="text-primary font-medium">@ {app.interviewSlot.time}</span>}
                  </div>

                  {/* Meeting Info Banner */}
                  {(() => {
                    const meeting = meetings.find(m => m.jobTitle === app.job?.title && m.companyName === app.job?.company?.name);
                    if (!meeting || !meeting.meetingLink) return null;
                    const typeIcons: Record<string, React.ElementType> = { virtual: Video, group_discussion: Users, one_on_one: UserCheck };
                    const typeLabels: Record<string, string> = { virtual: "Virtual", group_discussion: "Group Discussion", one_on_one: "One-on-One" };
                    const typeColors: Record<string, string> = { virtual: "bg-blue-50 text-blue-700 border-blue-200", group_discussion: "bg-pink-50 text-pink-700 border-pink-200", one_on_one: "bg-violet-50 text-violet-700 border-violet-200" };
                    const MeetIcon = typeIcons[meeting.meetingType || ""] || Video;
                    return (
                      <div className="mt-3 p-3 rounded-xl border-2 border-indigo-100 bg-gradient-to-r from-indigo-50/60 to-violet-50/60">
                        <div className="flex items-center justify-between flex-wrap gap-2">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-lg bg-indigo-100 flex items-center justify-center">
                              <MeetIcon className="w-3.5 h-3.5 text-indigo-600" />
                            </div>
                            <div>
                              <span className={cn("text-[10px] font-semibold px-2 py-0.5 rounded-full border", typeColors[meeting.meetingType || ""] || "bg-blue-50 text-blue-700 border-blue-200")}>
                                {typeLabels[meeting.meetingType || ""] || "Meeting"} · Round {meeting.roundNumber}
                              </span>
                              <div className="flex items-center gap-2 mt-1 text-[10px] text-muted-foreground">
                                {meeting.scheduledDate && (
                                  <span className="flex items-center gap-0.5"><Calendar className="w-2.5 h-2.5" />{meeting.scheduledDate}</span>
                                )}
                                {meeting.scheduledTime && (
                                  <span className="flex items-center gap-0.5"><Clock className="w-2.5 h-2.5" />{meeting.scheduledTime}</span>
                                )}
                                {meeting.groupName && (
                                  <span className="flex items-center gap-0.5"><Users className="w-2.5 h-2.5" />{meeting.groupName}</span>
                                )}
                              </div>
                            </div>
                          </div>
                          <a
                            href={meeting.meetingLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-indigo-600 text-white text-[10px] font-semibold hover:bg-indigo-700 transition-colors"
                          >
                            <ExternalLink className="w-3 h-3" />
                            Join Meeting
                          </a>
                        </div>
                        {meeting.instructions && (
                          <p className="mt-2 text-[10px] text-muted-foreground bg-white/60 rounded-lg px-2 py-1 border border-indigo-100">
                            📋 {meeting.instructions}
                          </p>
                        )}
                      </div>
                    );
                  })()}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
