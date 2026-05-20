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

export default function CompanyRoundsPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [rounds, setRounds] = useState<RoundData[]>([]);
  const [toast, setToast] = useState<{ type: "success" | "error"; msg: string } | null>(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"add" | "edit">("add");
  const [editingIndex, setEditingIndex] = useState<number>(-1);
  const [roundTitle, setRoundTitle] = useState("");
  const [roundType, setRoundType] = useState("technical");
  const [savingRound, setSavingRound] = useState(false);

  const showToast = (type: "success" | "error", msg: string) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 3000);
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

  // Generate round data from job + candidates
  const fetchRoundData = useCallback(async () => {
    if (!selectedJob) return;
    try {
      const res = await companyApi.getCandidates(selectedJob.id);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const candidates = (res as any)?.data;
      
      const config = selectedJob.roundsConfig && selectedJob.roundsConfig.length > 0
        ? selectedJob.roundsConfig
        : [
            { title: "Online Assessment", type: "aptitude" },
            { title: "Technical Interview", type: "technical" },
            { title: "HR Interview", type: "hr" }
          ].slice(0, selectedJob.numRounds || 3);
          
      const numRounds = config.length;
      const totalCandidates = Array.isArray(candidates) ? candidates.length : 0;

      const generatedRounds: RoundData[] = [];
      for (let i = 1; i <= numRounds; i++) {
        let qualified = 0;
        let pending = 0;
        let roundStatus: RoundData["status"] = "upcoming";
        const roundConfig = config[i - 1];

        if (Array.isArray(candidates)) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          qualified = candidates.filter((c: any) => c.currentRound > i || c.finalResult === "selected").length;
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          pending = candidates.filter((c: any) => c.currentRound === i && c.finalResult === "pending").length;
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const inThisRound = candidates.filter((c: any) => c.currentRound >= i).length;

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

  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  useEffect(() => {
    fetchRoundData();
  }, [fetchRoundData]);

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
    } catch (err) {
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

  return (
    <div className="page-enter">
      <Header
        userName={user?.email?.split("@")[0] || "HR"}
        userRole="Company"
        greeting="Interview Rounds"
        subtitle="Design and manage your recruitment pipeline rounds"
      />

      <div className="px-8 pb-10 space-y-6">
        {/* Job selector */}
        {jobs.length > 1 && (
          <div className="flex items-center gap-3">
            <label className="text-sm font-medium text-foreground">Job:</label>
            <select
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
                  return (
                    <div key={i} className="flex items-center gap-2 flex-shrink-0">
                      <div
                        className={cn(
                          "flex items-center gap-3 px-5 py-3 rounded-xl border transition-all cursor-pointer hover:shadow-md",
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
                return (
                  <div key={i} className="i-card p-6 relative group">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-4">
                        <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center", tc.bg)}>
                          <Icon className={cn("w-6 h-6", tc.color)} />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="text-base font-semibold text-foreground">{round.title}</h3>
                            <span className={cn("text-[10px] font-semibold px-2.5 py-1 rounded-full", sc.bg, sc.color)}>
                              {sc.label}
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">Round {round.roundNumber} of {rounds.length}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
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

      {/* Round Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-border">
              <h2 className="text-lg font-bold">{modalMode === "add" ? "Add Round" : "Edit Round"}</h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-2 rounded-xl hover:bg-muted text-muted-foreground"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <label className="text-sm font-semibold text-foreground mb-1 block">Round Title</label>
                <input
                  type="text"
                  value={roundTitle}
                  onChange={(e) => setRoundTitle(e.target.value)}
                  placeholder="e.g. Technical Interview"
                  className="w-full px-4 py-2.5 rounded-xl border border-border bg-muted/30 outline-none focus:border-primary transition-colors"
                />
              </div>
              
              <div>
                <label className="text-sm font-semibold text-foreground mb-1 block">Round Type</label>
                <select
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
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-5 py-2.5 text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveRound}
                disabled={savingRound}
                className="px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold shadow-sm hover:opacity-90 transition-all disabled:opacity-50"
              >
                {savingRound ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  modalMode === "add" ? "Add Round" : "Save Changes"
                )}
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
