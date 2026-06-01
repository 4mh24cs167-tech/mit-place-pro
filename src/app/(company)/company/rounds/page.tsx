"use client";

import Header from "@/components/layout/Header";
import { cn } from "@/lib/utils";
import { companyApi } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import {
  Plus,
  Users,
  CheckCircle2,
  Code2,
  FileText,
  MessageSquare,
  Edit3,
  Trash2,
  ChevronRight,
  Loader2,
  AlertCircle,
  X,
  Video,
  Link2,
  Calendar,
  Clock,
  UserCheck,
  Send,
  Eye,
  Shuffle,
} from "lucide-react";
import { useState, useEffect, useCallback } from "react";

interface RoundConfig {
  title: string;
  type: string;
}

interface Job {
  id: string;
  title: string;
  status: string;
  numRounds: number;
  roundsConfig: RoundConfig[];
  createdAt: string;
}

interface Candidate {
  applicationId: string;
  studentId: string;
  studentName: string;
  usn: string;
  department: string;
  currentRound: number;
  finalResult: string;
}

interface MeetingGroupData {
  id: string;
  groupName: string;
  meetingLink: string | null;
  scheduledDate: string | null;
  scheduledTime: string | null;
  maxParticipants: number | null;
  students: { studentId: string; studentName: string | null; status: string }[];
}

interface MeetingAssignment {
  id: string;
  studentId: string;
  studentName: string | null;
  personalLink: string | null;
  scheduledStart: string | null;
  scheduledEnd: string | null;
  groupId: string | null;
  status: string;
}

interface MeetingData {
  id: string;
  jobId: string;
  roundNumber: number;
  meetingType: string;
  meetingLink: string | null;
  scheduledDate: string | null;
  scheduledTime: string | null;
  venue: string | null;
  instructions: string | null;
  status: string;
  createdAt: string;
  groups: MeetingGroupData[];
  assignments: MeetingAssignment[];
}

interface RoundData {
  roundNumber: number;
  title: string;
  type: string;
  totalCandidates: number;
  qualified: number;
  pending: number;
  status: "completed" | "in_progress" | "upcoming";
}

const roundTypeConfig: Record<string, { icon: React.ElementType; color: string; bg: string }> = {
  aptitude: { icon: FileText, color: "text-blue-600", bg: "bg-blue-50" },
  technical: { icon: Code2, color: "text-violet-600", bg: "bg-violet-50" },
  hr: { icon: MessageSquare, color: "text-emerald-600", bg: "bg-emerald-50" },
  coding: { icon: Code2, color: "text-orange-600", bg: "bg-orange-50" },
  gd: { icon: Users, color: "text-pink-600", bg: "bg-pink-50" },
  default: { icon: FileText, color: "text-slate-600", bg: "bg-slate-50" },
};

const statusConfig = {
  completed: { label: "Completed", color: "text-emerald-600", bg: "bg-emerald-50" },
  in_progress: { label: "In Progress", color: "text-blue-600", bg: "bg-blue-50" },
  upcoming: { label: "Upcoming", color: "text-amber-600", bg: "bg-amber-50" },
};

// ─── Group Config for GD ───
interface GroupForm {
  groupName: string;
  meetingLink: string;
  scheduledDate: string;
  scheduledTime: string;
  studentIds: string[];
}

// ─── One-on-One Slot Form ───
interface SlotForm {
  studentId: string;
  studentName: string;
  personalLink: string;
  scheduledStart: string;
  scheduledEnd: string;
}

export default function CompanyRoundsPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [rounds, setRounds] = useState<RoundData[]>([]);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [meetings, setMeetings] = useState<MeetingData[]>([]);
  const [toast, setToast] = useState<{ type: "success" | "error"; msg: string } | null>(null);

  // Round Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"add" | "edit">("add");
  const [editingIndex, setEditingIndex] = useState<number>(-1);
  const [roundTitle, setRoundTitle] = useState("");
  const [roundType, setRoundType] = useState("technical");
  const [savingRound, setSavingRound] = useState(false);

  // Meeting Modal State
  const [isMeetingModalOpen, setIsMeetingModalOpen] = useState(false);
  const [meetingRound, setMeetingRound] = useState<number>(1);
  const [meetingType, setMeetingType] = useState<"virtual" | "group_discussion" | "one_on_one">("virtual");
  const [meetingLink, setMeetingLink] = useState("");
  const [meetingDate, setMeetingDate] = useState("");
  const [meetingTime, setMeetingTime] = useState("");
  const [meetingVenue, setMeetingVenue] = useState("");
  const [meetingInstructions, setMeetingInstructions] = useState("");
  const [savingMeeting, setSavingMeeting] = useState(false);

  // GD Groups
  const [gdGroups, setGdGroups] = useState<GroupForm[]>([]);
  const [studentsPerGroup, setStudentsPerGroup] = useState(5);

  // One-on-One Slots
  const [oneOnOneSlots, setOneOnOneSlots] = useState<SlotForm[]>([]);
  const [bulkLink, setBulkLink] = useState("");
  const [slotDuration, setSlotDuration] = useState(30);
  const [slotStartTime, setSlotStartTime] = useState("");

  // View Meeting Modal
  const [viewMeeting, setViewMeeting] = useState<MeetingData | null>(null);

  const showToast = (type: "success" | "error", msg: string) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 4000);
  };

  const fetchJobs = useCallback(async () => {
    try {
      setLoading(true);
      const res = await companyApi.listJobs();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const data = (res as any)?.data;
      if (Array.isArray(data) && data.length > 0) {
        setJobs(data);
        setSelectedJob(data[0]);
      }
    } catch {
      // silently handle
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchRoundData = useCallback(async () => {
    if (!selectedJob) return;
    try {
      const res = await companyApi.getCandidates(selectedJob.id);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const cands = (res as any)?.data;
      if (Array.isArray(cands)) setCandidates(cands);

      const config = selectedJob.roundsConfig && selectedJob.roundsConfig.length > 0
        ? selectedJob.roundsConfig
        : [
            { title: "Online Assessment", type: "aptitude" },
            { title: "Technical Interview", type: "technical" },
            { title: "HR Interview", type: "hr" }
          ].slice(0, selectedJob.numRounds || 3);

      const numRounds = config.length;
      const totalCandidates = Array.isArray(cands) ? cands.length : 0;

      const generatedRounds: RoundData[] = [];
      for (let i = 1; i <= numRounds; i++) {
        let qualified = 0;
        let pending = 0;
        let roundStatus: RoundData["status"] = "upcoming";
        const roundConfig = config[i - 1];

        if (Array.isArray(cands)) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          qualified = cands.filter((c: any) => c.currentRound > i || c.finalResult === "selected").length;
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          pending = cands.filter((c: any) => c.currentRound === i && c.finalResult === "pending").length;
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const inThisRound = cands.filter((c: any) => c.currentRound >= i).length;

          if (pending > 0) roundStatus = "in_progress";
          else if (qualified > 0 || inThisRound === 0) roundStatus = "completed";
        }

        generatedRounds.push({
          roundNumber: i,
          title: roundConfig.title || `Round ${i}`,
          type: roundConfig.type || "default",
          totalCandidates: i === 1 ? totalCandidates : qualified + pending,
          qualified,
          pending,
          status: roundStatus,
        });
      }

      setRounds(generatedRounds);
    } catch {
      setRounds([]);
    }
  }, [selectedJob]);

  const fetchMeetings = useCallback(async () => {
    if (!selectedJob) return;
    try {
      const res = await companyApi.getRoundMeetings(selectedJob.id);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const data = (res as any)?.data;
      if (Array.isArray(data)) setMeetings(data);
    } catch {
      setMeetings([]);
    }
  }, [selectedJob]);

  useEffect(() => { fetchJobs(); }, [fetchJobs]);
  useEffect(() => { fetchRoundData(); }, [fetchRoundData]);
  useEffect(() => { fetchMeetings(); }, [fetchMeetings]);

  // ─── Round CRUD ───
  const openAddModal = () => {
    setModalMode("add");
    setRoundTitle("");
    setRoundType("technical");
    setIsModalOpen(true);
  };

  const openEditModal = (index: number) => {
    setModalMode("edit");
    setEditingIndex(index);
    setRoundTitle(rounds[index].title);
    setRoundType(rounds[index].type);
    setIsModalOpen(true);
  };

  const saveRoundsConfig = async (newConfig: RoundConfig[]) => {
    if (!selectedJob) return;
    setSavingRound(true);
    try {
      await companyApi.updateJobRounds(selectedJob.id, newConfig as unknown as Record<string, unknown>[]);
      const updatedJob = { ...selectedJob, roundsConfig: newConfig, numRounds: newConfig.length };
      setSelectedJob(updatedJob);
      setJobs(jobs.map(j => j.id === updatedJob.id ? updatedJob : j));
      showToast("success", "Rounds updated successfully");
      setIsModalOpen(false);
    } catch {
      showToast("error", "Failed to update rounds");
    } finally {
      setSavingRound(false);
    }
  };

  const handleSaveRound = () => {
    if (!roundTitle.trim()) {
      showToast("error", "Please enter a round title");
      return;
    }
    if (!selectedJob) return;
    const currentConfig = selectedJob.roundsConfig && selectedJob.roundsConfig.length > 0
      ? [...selectedJob.roundsConfig]
      : rounds.map(r => ({ title: r.title, type: r.type }));

    if (modalMode === "add") {
      currentConfig.push({ title: roundTitle, type: roundType });
    } else {
      if (editingIndex >= 0) {
        currentConfig[editingIndex] = { title: roundTitle, type: roundType };
      }
    }
    saveRoundsConfig(currentConfig);
  };

  const handleDeleteRound = (index: number) => {
    if (!selectedJob) return;
    if (!confirm("Are you sure you want to delete this round?")) return;
    const currentConfig = selectedJob.roundsConfig && selectedJob.roundsConfig.length > 0
      ? [...selectedJob.roundsConfig]
      : rounds.map(r => ({ title: r.title, type: r.type }));
    currentConfig.splice(index, 1);
    saveRoundsConfig(currentConfig);
  };

  // ─── Meeting Scheduling ───
  const getMeetingForRound = (roundNumber: number) => {
    return meetings.find(m => m.roundNumber === roundNumber);
  };

  const openMeetingModal = (roundNumber: number) => {
    setMeetingRound(roundNumber);
    setMeetingType("virtual");
    setMeetingLink("");
    setMeetingDate("");
    setMeetingTime("");
    setMeetingVenue("");
    setMeetingInstructions("");
    setGdGroups([]);
    setOneOnOneSlots([]);
    setBulkLink("");
    setSlotDuration(30);
    setSlotStartTime("");
    setStudentsPerGroup(5);
    setIsMeetingModalOpen(true);
  };

  const getCandidatesForRound = (roundNumber: number) => {
    return candidates.filter(c => c.currentRound === roundNumber && c.finalResult === "pending");
  };

  // Auto-generate GD groups
  const autoGenerateGroups = () => {
    const roundCandidates = getCandidatesForRound(meetingRound);
    if (roundCandidates.length === 0) {
      showToast("error", "No candidates in this round");
      return;
    }

    const shuffled = [...roundCandidates].sort(() => Math.random() - 0.5);
    const groups: GroupForm[] = [];
    const numGroups = Math.ceil(shuffled.length / studentsPerGroup);

    for (let i = 0; i < numGroups; i++) {
      const groupStudents = shuffled.slice(i * studentsPerGroup, (i + 1) * studentsPerGroup);
      groups.push({
        groupName: `Group ${String.fromCharCode(65 + i)}`,
        meetingLink: "",
        scheduledDate: meetingDate,
        scheduledTime: "",
        studentIds: groupStudents.map(s => s.studentId),
      });
    }

    setGdGroups(groups);
    showToast("success", `Created ${numGroups} groups with ~${studentsPerGroup} students each`);
  };

  // Auto-generate one-on-one slots
  const autoGenerateSlots = () => {
    const roundCandidates = getCandidatesForRound(meetingRound);
    if (roundCandidates.length === 0) {
      showToast("error", "No candidates in this round");
      return;
    }

    const slots: SlotForm[] = roundCandidates.map((c, i) => {
      let start = "";
      let end = "";
      if (slotStartTime && meetingDate) {
        const [hours, mins] = slotStartTime.split(":").map(Number);
        const startDate = new Date(meetingDate);
        startDate.setHours(hours, mins + (i * slotDuration), 0, 0);
        const endDate = new Date(startDate.getTime() + slotDuration * 60000);
        start = startDate.toISOString();
        end = endDate.toISOString();
      }
      return {
        studentId: c.studentId,
        studentName: c.studentName || c.usn || "Student",
        personalLink: bulkLink,
        scheduledStart: start,
        scheduledEnd: end,
      };
    });

    setOneOnOneSlots(slots);
    showToast("success", `Generated ${slots.length} individual slots`);
  };

  const handleSubmitMeeting = async () => {
    if (!selectedJob) return;

    if (meetingType === "virtual" && !meetingLink.trim()) {
      showToast("error", "Please provide a meeting link");
      return;
    }

    if (meetingType === "group_discussion" && gdGroups.length === 0) {
      showToast("error", "Please create groups first");
      return;
    }

    if (meetingType === "one_on_one" && oneOnOneSlots.length === 0) {
      showToast("error", "Please generate slots first");
      return;
    }

    setSavingMeeting(true);
    try {
      const payload: Record<string, unknown> = {
        jobId: selectedJob.id,
        roundNumber: meetingRound,
        meetingType,
        meetingLink: meetingLink || undefined,
        scheduledDate: meetingDate || undefined,
        scheduledTime: meetingTime || undefined,
        venue: meetingVenue || undefined,
        instructions: meetingInstructions || undefined,
      };

      if (meetingType === "group_discussion") {
        payload.groups = gdGroups.map(g => ({
          groupName: g.groupName,
          meetingLink: g.meetingLink || undefined,
          scheduledDate: g.scheduledDate || undefined,
          scheduledTime: g.scheduledTime || undefined,
          studentIds: g.studentIds,
        }));
      }

      if (meetingType === "one_on_one") {
        payload.slots = oneOnOneSlots.map(s => ({
          studentId: s.studentId,
          personalLink: s.personalLink || undefined,
          scheduledStart: s.scheduledStart || undefined,
          scheduledEnd: s.scheduledEnd || undefined,
        }));
      }

      await companyApi.createRoundMeeting(payload);
      showToast("success", "Meeting scheduled successfully! Students have been notified.");
      setIsMeetingModalOpen(false);
      await fetchMeetings();
    } catch {
      showToast("error", "Failed to schedule meeting");
    } finally {
      setSavingMeeting(false);
    }
  };

  const handleDeleteMeeting = async (meetingId: string) => {
    if (!confirm("Are you sure you want to delete this meeting? Students will no longer see it.")) return;
    try {
      await companyApi.deleteRoundMeeting(meetingId);
      showToast("success", "Meeting deleted");
      await fetchMeetings();
    } catch {
      showToast("error", "Failed to delete meeting");
    }
  };

  const meetingTypeBadge = (type: string) => {
    const config: Record<string, { label: string; icon: React.ElementType; color: string; bg: string }> = {
      virtual: { label: "Virtual", icon: Video, color: "text-blue-700", bg: "bg-blue-50 border-blue-200" },
      group_discussion: { label: "Group Discussion", icon: Users, color: "text-pink-700", bg: "bg-pink-50 border-pink-200" },
      one_on_one: { label: "One-on-One", icon: UserCheck, color: "text-violet-700", bg: "bg-violet-50 border-violet-200" },
    };
    return config[type] || config.virtual;
  };

  return (
    <div className="page-enter">
      <Header
        userName={user?.email?.split("@")[0] || "HR"}
        userRole="Company"
        greeting="Interview Rounds"
        subtitle="Design and manage your recruitment pipeline rounds"
      />

      <div className="px-4 sm:px-8 pb-10 space-y-6">
        {/* Job selector */}
        {jobs.length > 1 && (
          <div className="flex items-center gap-3">
            <label className="text-sm font-medium text-foreground">Job:</label>
            <select
              id="job-selector"
              value={selectedJob?.id || ""}
              onChange={(e) => {
                const j = jobs.find((jj) => jj.id === e.target.value);
                if (j) setSelectedJob(j);
              }}
              className="px-3 py-2.5 rounded-xl border border-border bg-white text-sm outline-none cursor-pointer"
            >
              {jobs.map((j) => (
                <option key={j.id} value={j.id}>
                  {j.title}
                </option>
              ))}
            </select>
          </div>
        )}

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
            <p className="text-sm text-muted-foreground">Loading recruitment pipeline...</p>
          </div>
        ) : jobs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <AlertCircle className="w-10 h-10 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">No jobs found. Create a job first to manage rounds.</p>
          </div>
        ) : (
          <>
            {/* Pipeline visual */}
            <div className="i-card p-6">
              <h3 className="text-sm font-semibold text-foreground mb-5">Recruitment Pipeline</h3>
              <div className="flex items-center gap-2 overflow-x-auto pb-2">
                {rounds.map((round, i) => {
                  const tc = roundTypeConfig[round.type] || roundTypeConfig.default;
                  const sc = statusConfig[round.status];
                  const Icon = tc.icon;
                  const existingMeeting = getMeetingForRound(round.roundNumber);
                  return (
                    <div key={i} className="flex items-center gap-2 flex-shrink-0">
                      <div
                        className={cn(
                          "flex items-center gap-3 px-5 py-3 rounded-xl border transition-all cursor-pointer hover:shadow-md relative",
                          round.status === "in_progress"
                            ? "border-blue-300 bg-blue-50/50 ring-1 ring-blue-200"
                            : "border-border bg-white"
                        )}
                      >
                        <div className={cn("w-9 h-9 rounded-lg flex items-center justify-center", tc.bg)}>
                          <Icon className={cn("w-4 h-4", tc.color)} />
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-foreground whitespace-nowrap">{round.title}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className={cn("text-[10px] font-semibold", sc.color)}>{sc.label}</span>
                            <span className="text-[10px] text-muted-foreground">{round.totalCandidates} candidates</span>
                          </div>
                        </div>
                        {existingMeeting && (
                          <div className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-indigo-600 flex items-center justify-center">
                            <Video className="w-3 h-3 text-white" />
                          </div>
                        )}
                      </div>
                      <ChevronRight className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                    </div>
                  );
                })}
                <button
                  onClick={openAddModal}
                  className="flex items-center gap-2 px-4 py-3 rounded-xl border-2 border-dashed border-border text-sm text-muted-foreground hover:border-primary hover:text-primary transition-colors flex-shrink-0"
                >
                  <Plus className="w-4 h-4" />
                  Add Round
                </button>
              </div>
            </div>

            {/* Round details */}
            <div className="space-y-5">
              {rounds.map((round, i) => {
                const tc = roundTypeConfig[round.type] || roundTypeConfig.default;
                const sc = statusConfig[round.status];
                const Icon = tc.icon;
                const qualifiedPercent =
                  round.totalCandidates > 0 ? Math.round((round.qualified / round.totalCandidates) * 100) : 0;
                const existingMeeting = getMeetingForRound(round.roundNumber);
                const mtBadge = existingMeeting ? meetingTypeBadge(existingMeeting.meetingType) : null;

                return (
                  <div key={i} className="i-card p-6 relative group">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-4">
                        <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center", tc.bg)}>
                          <Icon className={cn("w-6 h-6", tc.color)} />
                        </div>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="text-base font-semibold text-foreground">{round.title}</h3>
                            <span className={cn("text-[10px] font-semibold px-2.5 py-1 rounded-full", sc.bg, sc.color)}>
                              {sc.label}
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">Round {round.roundNumber} of {rounds.length}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5">
                        {/* Schedule Meeting Button */}
                        {round.pending > 0 && !existingMeeting && (
                          <button
                            onClick={() => openMeetingModal(round.roundNumber)}
                            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-700 transition-colors shadow-sm"
                          >
                            <Video className="w-3.5 h-3.5" />
                            Schedule Meeting
                          </button>
                        )}
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => openEditModal(i)}
                            className="p-2 rounded-lg hover:bg-muted transition-colors"
                            title="Edit round"
                          >
                            <Edit3 className="w-4 h-4 text-muted-foreground" />
                          </button>
                          <button
                            onClick={() => handleDeleteRound(i)}
                            className="p-2 rounded-lg hover:bg-red-50 transition-colors"
                            title="Delete round"
                          >
                            <Trash2 className="w-4 h-4 text-red-400" />
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Meeting Info Banner */}
                    {existingMeeting && mtBadge && (
                      <div className="mt-4 p-4 rounded-xl border-2 border-indigo-100 bg-gradient-to-r from-indigo-50/80 to-violet-50/80">
                        <div className="flex items-center justify-between flex-wrap gap-2">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-lg bg-indigo-100 flex items-center justify-center">
                              <mtBadge.icon className="w-4.5 h-4.5 text-indigo-600" />
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className={cn("text-xs font-semibold px-2 py-0.5 rounded-full border", mtBadge.bg, mtBadge.color)}>
                                  {mtBadge.label}
                                </span>
                                <span className="text-[10px] text-muted-foreground">
                                  {existingMeeting.assignments?.length || 0} students assigned
                                </span>
                              </div>
                              <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                                {existingMeeting.scheduledDate && (
                                  <span className="flex items-center gap-1">
                                    <Calendar className="w-3 h-3" />
                                    {existingMeeting.scheduledDate}
                                  </span>
                                )}
                                {existingMeeting.scheduledTime && (
                                  <span className="flex items-center gap-1">
                                    <Clock className="w-3 h-3" />
                                    {existingMeeting.scheduledTime}
                                  </span>
                                )}
                                {existingMeeting.meetingLink && (
                                  <a
                                    href={existingMeeting.meetingLink}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-1 text-indigo-600 hover:underline font-medium"
                                  >
                                    <Link2 className="w-3 h-3" />
                                    Join Link
                                  </a>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() => setViewMeeting(existingMeeting)}
                              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-indigo-600 hover:bg-indigo-100 transition-colors"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              View Details
                            </button>
                            <button
                              onClick={() => handleDeleteMeeting(existingMeeting.id)}
                              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-red-600 hover:bg-red-50 transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        {/* Group summary for GD */}
                        {existingMeeting.meetingType === "group_discussion" && existingMeeting.groups.length > 0 && (
                          <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                            {existingMeeting.groups.map((g) => (
                              <div key={g.id} className="bg-white/80 rounded-lg p-2.5 border border-indigo-100">
                                <p className="text-xs font-semibold text-foreground">{g.groupName}</p>
                                <p className="text-[10px] text-muted-foreground">{g.students.length} students</p>
                                {g.meetingLink && (
                                  <a href={g.meetingLink} target="_blank" rel="noopener noreferrer" className="text-[10px] text-indigo-600 hover:underline flex items-center gap-0.5 mt-0.5">
                                    <Link2 className="w-2.5 h-2.5" /> Link
                                  </a>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Stats bar */}
                    <div className="grid grid-cols-3 gap-4 mt-5 pt-4 border-t border-border/50">
                      <div className="text-center">
                        <p className="text-lg font-bold text-foreground">{round.totalCandidates}</p>
                        <p className="text-[10px] text-muted-foreground">Total Candidates</p>
                      </div>
                      <div className="text-center">
                        <p className="text-lg font-bold text-emerald-600">{round.qualified}</p>
                        <p className="text-[10px] text-muted-foreground">Qualified ({qualifiedPercent}%)</p>
                      </div>
                      <div className="text-center">
                        <p className="text-lg font-bold text-amber-600">{round.pending}</p>
                        <p className="text-[10px] text-muted-foreground">Pending Review</p>
                      </div>
                    </div>

                    {/* Progress bar */}
                    {round.status !== "upcoming" && (
                      <div className="mt-4">
                        <div className="h-2 rounded-full bg-muted overflow-hidden">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-emerald-400 progress-fill"
                            style={{ width: `${qualifiedPercent}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* ═══ Round Add/Edit Modal ═══ */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-border">
              <h2 className="text-lg font-bold">{modalMode === "add" ? "Add Round" : "Edit Round"}</h2>
              <button onClick={() => setIsModalOpen(false)} className="p-2 rounded-xl hover:bg-muted text-muted-foreground">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label htmlFor="round-title-input" className="text-sm font-semibold text-foreground mb-1 block">Round Title</label>
                <input
                  id="round-title-input"
                  type="text"
                  value={roundTitle}
                  onChange={(e) => setRoundTitle(e.target.value)}
                  placeholder="e.g. Technical Interview"
                  className="w-full px-4 py-2.5 rounded-xl border border-border bg-muted/30 outline-none focus:border-primary transition-colors"
                />
              </div>
              <div>
                <label htmlFor="round-type-select" className="text-sm font-semibold text-foreground mb-1 block">Round Type</label>
                <select
                  id="round-type-select"
                  value={roundType}
                  onChange={(e) => setRoundType(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-border bg-muted/30 outline-none focus:border-primary transition-colors"
                >
                  <option value="aptitude">Online Assessment / Aptitude</option>
                  <option value="coding">Coding Round</option>
                  <option value="technical">Technical Interview</option>
                  <option value="hr">HR Interview</option>
                  <option value="gd">Group Discussion</option>
                  <option value="default">Other</option>
                </select>
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 p-6 border-t border-border bg-muted/10">
              <button onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors">
                Cancel
              </button>
              <button
                onClick={handleSaveRound}
                disabled={savingRound}
                className="px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold shadow-sm hover:opacity-90 transition-all disabled:opacity-50"
              >
                {savingRound ? <Loader2 className="w-4 h-4 animate-spin" /> : modalMode === "add" ? "Add Round" : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══ Schedule Meeting Modal ═══ */}
      {isMeetingModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden my-8">
            <div className="flex items-center justify-between p-6 border-b border-border bg-gradient-to-r from-indigo-50 to-violet-50">
              <div>
                <h2 className="text-lg font-bold text-foreground">Schedule Meeting</h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Round {meetingRound} · {getCandidatesForRound(meetingRound).length} candidates
                </p>
              </div>
              <button onClick={() => setIsMeetingModalOpen(false)} className="p-2 rounded-xl hover:bg-white/80 text-muted-foreground">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
              {/* Step 1: Meeting Type */}
              <div>
                <label className="text-sm font-semibold text-foreground mb-3 block">Meeting Type</label>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { value: "virtual" as const, label: "Virtual", icon: Video, desc: "Single link for all", color: "border-blue-300 bg-blue-50 ring-blue-200" },
                    { value: "group_discussion" as const, label: "Group Discussion", icon: Users, desc: "Create student groups", color: "border-pink-300 bg-pink-50 ring-pink-200" },
                    { value: "one_on_one" as const, label: "One-on-One", icon: UserCheck, desc: "Individual slots", color: "border-violet-300 bg-violet-50 ring-violet-200" },
                  ].map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => setMeetingType(opt.value)}
                      className={cn(
                        "flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all text-center",
                        meetingType === opt.value
                          ? `${opt.color} ring-2 shadow-sm`
                          : "border-border bg-white hover:border-muted-foreground/30"
                      )}
                    >
                      <opt.icon className={cn("w-6 h-6", meetingType === opt.value ? "text-indigo-600" : "text-muted-foreground")} />
                      <span className="text-xs font-semibold">{opt.label}</span>
                      <span className="text-[10px] text-muted-foreground">{opt.desc}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Common Fields */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="meeting-date" className="text-xs font-semibold text-foreground mb-1 block">Date</label>
                  <input
                    id="meeting-date"
                    type="date"
                    value={meetingDate}
                    onChange={(e) => setMeetingDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-border text-sm outline-none focus:border-primary"
                  />
                </div>
                <div>
                  <label htmlFor="meeting-time" className="text-xs font-semibold text-foreground mb-1 block">Time</label>
                  <input
                    id="meeting-time"
                    type="time"
                    value={meetingTime}
                    onChange={(e) => setMeetingTime(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-border text-sm outline-none focus:border-primary"
                  />
                </div>
              </div>

              {meetingType === "virtual" && (
                <div>
                  <label htmlFor="meeting-link-input" className="text-xs font-semibold text-foreground mb-1 block">Meeting Link *</label>
                  <input
                    id="meeting-link-input"
                    type="url"
                    value={meetingLink}
                    onChange={(e) => setMeetingLink(e.target.value)}
                    placeholder="https://zoom.us/j/... or https://meet.google.com/..."
                    className="w-full px-3 py-2 rounded-lg border border-border text-sm outline-none focus:border-primary"
                  />
                  <p className="text-[10px] text-muted-foreground mt-1">This link will be shared with all {getCandidatesForRound(meetingRound).length} candidates</p>
                </div>
              )}

              <div>
                <label htmlFor="meeting-venue" className="text-xs font-semibold text-foreground mb-1 block">Venue (optional)</label>
                <input
                  id="meeting-venue"
                  type="text"
                  value={meetingVenue}
                  onChange={(e) => setMeetingVenue(e.target.value)}
                  placeholder="Room 302, Main Building"
                  className="w-full px-3 py-2 rounded-lg border border-border text-sm outline-none focus:border-primary"
                />
              </div>

              <div>
                <label htmlFor="meeting-instructions" className="text-xs font-semibold text-foreground mb-1 block">Instructions (optional)</label>
                <textarea
                  id="meeting-instructions"
                  value={meetingInstructions}
                  onChange={(e) => setMeetingInstructions(e.target.value)}
                  placeholder="e.g. Please join 5 minutes early. Keep your camera on."
                  rows={3}
                  className="w-full px-3 py-2 rounded-lg border border-border text-sm outline-none focus:border-primary resize-none"
                />
              </div>

              {/* ─── GD Group Config ─── */}
              {meetingType === "group_discussion" && (
                <div className="border-2 border-pink-100 rounded-xl p-4 space-y-4 bg-pink-50/30">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
                      <Users className="w-4 h-4 text-pink-600" />
                      Group Configuration
                    </h4>
                    <div className="flex items-center gap-2">
                      <label htmlFor="students-per-group" className="text-xs text-muted-foreground">Students per group:</label>
                      <input
                        id="students-per-group"
                        type="number"
                        min={2}
                        max={20}
                        value={studentsPerGroup}
                        onChange={(e) => setStudentsPerGroup(Number(e.target.value))}
                        className="w-16 px-2 py-1 rounded-lg border border-border text-sm text-center outline-none"
                      />
                      <button
                        onClick={autoGenerateGroups}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-pink-600 text-white text-xs font-semibold hover:bg-pink-700 transition-colors"
                      >
                        <Shuffle className="w-3 h-3" />
                        Auto Group
                      </button>
                    </div>
                  </div>

                  {gdGroups.length > 0 && (
                    <div className="space-y-3">
                      {gdGroups.map((group, gi) => (
                        <div key={gi} className="bg-white rounded-lg p-3 border border-pink-100">
                          <div className="grid grid-cols-3 gap-2 mb-2">
                            <div>
                              <label htmlFor={`group-name-${gi}`} className="text-[10px] text-muted-foreground">Group Name</label>
                              <input
                                id={`group-name-${gi}`}
                                type="text"
                                value={group.groupName}
                                onChange={(e) => {
                                  const updated = [...gdGroups];
                                  updated[gi].groupName = e.target.value;
                                  setGdGroups(updated);
                                }}
                                className="w-full px-2 py-1.5 rounded-lg border border-border text-xs outline-none"
                              />
                            </div>
                            <div>
                              <label htmlFor={`group-link-${gi}`} className="text-[10px] text-muted-foreground">Meeting Link</label>
                              <input
                                id={`group-link-${gi}`}
                                type="url"
                                value={group.meetingLink}
                                onChange={(e) => {
                                  const updated = [...gdGroups];
                                  updated[gi].meetingLink = e.target.value;
                                  setGdGroups(updated);
                                }}
                                placeholder="https://..."
                                className="w-full px-2 py-1.5 rounded-lg border border-border text-xs outline-none"
                              />
                            </div>
                            <div>
                              <label htmlFor={`group-time-${gi}`} className="text-[10px] text-muted-foreground">Time</label>
                              <input
                                id={`group-time-${gi}`}
                                type="time"
                                value={group.scheduledTime}
                                onChange={(e) => {
                                  const updated = [...gdGroups];
                                  updated[gi].scheduledTime = e.target.value;
                                  setGdGroups(updated);
                                }}
                                className="w-full px-2 py-1.5 rounded-lg border border-border text-xs outline-none"
                              />
                            </div>
                          </div>
                          <div className="flex flex-wrap gap-1">
                            {group.studentIds.map((sid) => {
                              const cand = candidates.find(c => c.studentId === sid);
                              return (
                                <span key={sid} className="text-[10px] bg-pink-50 text-pink-700 px-2 py-0.5 rounded-full border border-pink-200">
                                  {cand?.studentName || cand?.usn || sid.slice(0, 8)}
                                </span>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                      <p className="text-[10px] text-muted-foreground text-center">
                        {gdGroups.length} groups · {gdGroups.reduce((sum, g) => sum + g.studentIds.length, 0)} students assigned
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* ─── One-on-One Config ─── */}
              {meetingType === "one_on_one" && (
                <div className="border-2 border-violet-100 rounded-xl p-4 space-y-4 bg-violet-50/30">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
                      <UserCheck className="w-4 h-4 text-violet-600" />
                      Individual Slots
                    </h4>
                    <div className="flex items-center gap-2 flex-wrap">
                      <div className="flex items-center gap-1">
                        <label htmlFor="slot-duration" className="text-xs text-muted-foreground">Duration:</label>
                        <input
                          id="slot-duration"
                          type="number"
                          min={10}
                          max={120}
                          value={slotDuration}
                          onChange={(e) => setSlotDuration(Number(e.target.value))}
                          className="w-14 px-2 py-1 rounded-lg border border-border text-xs text-center outline-none"
                        />
                        <span className="text-xs text-muted-foreground">min</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <label htmlFor="slot-start" className="text-xs text-muted-foreground">Start:</label>
                        <input
                          id="slot-start"
                          type="time"
                          value={slotStartTime}
                          onChange={(e) => setSlotStartTime(e.target.value)}
                          className="px-2 py-1 rounded-lg border border-border text-xs outline-none"
                        />
                      </div>
                      <button
                        onClick={autoGenerateSlots}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-violet-600 text-white text-xs font-semibold hover:bg-violet-700 transition-colors"
                      >
                        <Shuffle className="w-3 h-3" />
                        Generate Slots
                      </button>
                    </div>
                  </div>

                  <div>
                    <label htmlFor="bulk-link-input" className="text-[10px] text-muted-foreground mb-1 block">Default Link (applied to all)</label>
                    <input
                      id="bulk-link-input"
                      type="url"
                      value={bulkLink}
                      onChange={(e) => setBulkLink(e.target.value)}
                      placeholder="https://zoom.us/j/... (same link for all)"
                      className="w-full px-2 py-1.5 rounded-lg border border-border text-xs outline-none"
                    />
                  </div>

                  {oneOnOneSlots.length > 0 && (
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {oneOnOneSlots.map((slot, si) => (
                        <div key={si} className="bg-white rounded-lg p-3 border border-violet-100 grid grid-cols-4 gap-2 items-center">
                          <div>
                            <p className="text-xs font-semibold text-foreground truncate">{slot.studentName}</p>
                          </div>
                          <div>
                            <input
                              type="url"
                              value={slot.personalLink}
                              onChange={(e) => {
                                const updated = [...oneOnOneSlots];
                                updated[si].personalLink = e.target.value;
                                setOneOnOneSlots(updated);
                              }}
                              placeholder="Personal link"
                              className="w-full px-2 py-1 rounded border border-border text-[10px] outline-none"
                              aria-label={`Personal link for ${slot.studentName}`}
                            />
                          </div>
                          <div>
                            {slot.scheduledStart && (
                              <p className="text-[10px] text-muted-foreground">
                                {new Date(slot.scheduledStart).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                              </p>
                            )}
                          </div>
                          <div>
                            {slot.scheduledEnd && (
                              <p className="text-[10px] text-muted-foreground">
                                → {new Date(slot.scheduledEnd).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                      <p className="text-[10px] text-muted-foreground text-center">
                        {oneOnOneSlots.length} individual slots
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between gap-3 p-6 border-t border-border bg-muted/10">
              <p className="text-[10px] text-muted-foreground">
                <Send className="w-3 h-3 inline mr-1" />
                Students will be notified via email and in-app notifications
              </p>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setIsMeetingModalOpen(false)}
                  className="px-5 py-2.5 text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmitMeeting}
                  disabled={savingMeeting}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-semibold shadow-sm hover:bg-indigo-700 transition-all disabled:opacity-50"
                >
                  {savingMeeting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      Schedule & Notify
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ═══ View Meeting Details Modal ═══ */}
      {viewMeeting && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden my-8">
            <div className="flex items-center justify-between p-6 border-b border-border">
              <div>
                <h2 className="text-lg font-bold text-foreground">Meeting Details</h2>
                <p className="text-xs text-muted-foreground mt-0.5">Round {viewMeeting.roundNumber}</p>
              </div>
              <button onClick={() => setViewMeeting(null)} className="p-2 rounded-xl hover:bg-muted text-muted-foreground">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
              {(() => {
                const badge = meetingTypeBadge(viewMeeting.meetingType);
                return (
                  <span className={cn("text-xs font-semibold px-3 py-1 rounded-full border inline-flex items-center gap-1.5", badge.bg, badge.color)}>
                    <badge.icon className="w-3.5 h-3.5" />
                    {badge.label}
                  </span>
                );
              })()}

              {viewMeeting.meetingLink && (
                <div>
                  <p className="text-[10px] font-semibold text-muted-foreground uppercase mb-1">Meeting Link</p>
                  <a href={viewMeeting.meetingLink} target="_blank" rel="noopener noreferrer" className="text-sm text-indigo-600 hover:underline break-all">
                    {viewMeeting.meetingLink}
                  </a>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                {viewMeeting.scheduledDate && (
                  <div>
                    <p className="text-[10px] font-semibold text-muted-foreground uppercase mb-1">Date</p>
                    <p className="text-sm text-foreground">{viewMeeting.scheduledDate}</p>
                  </div>
                )}
                {viewMeeting.scheduledTime && (
                  <div>
                    <p className="text-[10px] font-semibold text-muted-foreground uppercase mb-1">Time</p>
                    <p className="text-sm text-foreground">{viewMeeting.scheduledTime}</p>
                  </div>
                )}
              </div>

              {viewMeeting.venue && (
                <div>
                  <p className="text-[10px] font-semibold text-muted-foreground uppercase mb-1">Venue</p>
                  <p className="text-sm text-foreground">{viewMeeting.venue}</p>
                </div>
              )}

              {viewMeeting.instructions && (
                <div>
                  <p className="text-[10px] font-semibold text-muted-foreground uppercase mb-1">Instructions</p>
                  <p className="text-sm text-foreground whitespace-pre-wrap">{viewMeeting.instructions}</p>
                </div>
              )}

              {/* Groups (GD) */}
              {viewMeeting.groups.length > 0 && (
                <div>
                  <p className="text-[10px] font-semibold text-muted-foreground uppercase mb-2">Groups ({viewMeeting.groups.length})</p>
                  <div className="space-y-2">
                    {viewMeeting.groups.map((g) => (
                      <div key={g.id} className="bg-muted/30 rounded-lg p-3 border border-border">
                        <div className="flex items-center justify-between mb-1">
                          <p className="text-sm font-semibold text-foreground">{g.groupName}</p>
                          {g.meetingLink && (
                            <a href={g.meetingLink} target="_blank" rel="noopener noreferrer" className="text-[10px] text-indigo-600 hover:underline flex items-center gap-0.5">
                              <Link2 className="w-3 h-3" /> Link
                            </a>
                          )}
                        </div>
                        {g.scheduledTime && <p className="text-[10px] text-muted-foreground mb-1">{g.scheduledDate} at {g.scheduledTime}</p>}
                        <div className="flex flex-wrap gap-1">
                          {g.students.map((s) => (
                            <span key={s.studentId} className="text-[10px] bg-white px-2 py-0.5 rounded-full border border-border">
                              {s.studentName || s.studentId.slice(0, 8)}
                            </span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Direct Assignments (virtual / 1:1) */}
              {viewMeeting.assignments.filter(a => !a.groupId).length > 0 && (
                <div>
                  <p className="text-[10px] font-semibold text-muted-foreground uppercase mb-2">
                    Assigned Students ({viewMeeting.assignments.filter(a => !a.groupId).length})
                  </p>
                  <div className="space-y-1.5 max-h-48 overflow-y-auto">
                    {viewMeeting.assignments.filter(a => !a.groupId).map((a) => (
                      <div key={a.id} className="flex items-center justify-between bg-muted/20 rounded-lg px-3 py-2 border border-border/50">
                        <span className="text-xs font-medium text-foreground">{a.studentName || a.studentId.slice(0, 8)}</span>
                        <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                          {a.personalLink && (
                            <a href={a.personalLink} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline flex items-center gap-0.5">
                              <Link2 className="w-2.5 h-2.5" /> Link
                            </a>
                          )}
                          {a.scheduledStart && (
                            <span>{new Date(a.scheduledStart).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <div className="flex items-center justify-end p-4 border-t border-border">
              <button onClick={() => setViewMeeting(null)} className="px-5 py-2 rounded-xl bg-muted text-sm font-semibold hover:bg-muted/80 transition-colors">
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className={cn(
          "fixed bottom-6 right-6 z-50 px-4 py-3 rounded-xl shadow-lg text-sm font-medium",
          toast.type === "success" ? "bg-emerald-600 text-white" : "bg-red-600 text-white"
        )}>
          {toast.msg}
        </div>
      )}
    </div>
  );
}
