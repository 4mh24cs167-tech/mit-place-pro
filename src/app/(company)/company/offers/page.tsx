"use client";

import Header from "@/components/layout/Header";
import { cn, getInitials, formatLPA } from "@/lib/utils";
import { companyApi } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import {
  Send,
  Download,
  Eye,
  FileText,
  CheckCircle2,
  Clock,
  IndianRupee,
  Calendar,
  Mail,
  Plus,
  Loader2,
  Award,
} from "lucide-react";
import { useState, useEffect, useCallback } from "react";

interface OfferCandidate {
  applicationId: string;
  studentName: string;
  usn: string;
  department: string;
  cgpa: number | null;
  matchScore: number;
  atsScore: number | null;
  currentRound: number;
  finalResult: string;
}

const statusMap = {
  selected: { label: "Offer Ready", color: "text-emerald-600", bg: "bg-emerald-50", icon: CheckCircle2 },
  pending: { label: "In Progress", color: "text-amber-600", bg: "bg-amber-50", icon: Clock },
  rejected: { label: "Rejected", color: "text-red-600", bg: "bg-red-50", icon: Clock },
};

export default function CompanyOffersPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [candidates, setCandidates] = useState<OfferCandidate[]>([]);
  const [jobs, setJobs] = useState<Array<{ id: string; title: string; ctcMaxLpa: number }>>([]);
  const [selectedJobId, setSelectedJobId] = useState<string>("");
  const [toast, setToast] = useState<{ type: "success" | "error"; msg: string } | null>(null);

  const showToast = (type: "success" | "error", msg: string) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchJobs = useCallback(async () => {
    try {
      const res = await companyApi.listJobs();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const data = (res as any)?.data;
      if (Array.isArray(data) && data.length > 0) {
        setJobs(data.map((j: { id: string; title: string; ctcMaxLpa?: number }) => ({
          id: j.id,
          title: j.title,
          ctcMaxLpa: j.ctcMaxLpa || 0,
        })));
        setSelectedJobId(data[0].id);
      }
    } catch {
      // silently handle
    }
  }, []);

  const fetchCandidates = useCallback(async () => {
    if (!selectedJobId) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const res = await companyApi.getCandidates(selectedJobId);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const data = (res as any)?.data;
      if (Array.isArray(data)) {
        setCandidates(data);
      }
    } catch {
      // silently handle
    } finally {
      setLoading(false);
    }
  }, [selectedJobId]);

  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  useEffect(() => {
    fetchCandidates();
  }, [fetchCandidates]);

  const selectedCandidates = candidates.filter((c) => c.finalResult === "selected");
  const pendingCandidates = candidates.filter(
    (c) => c.finalResult === "pending" || (c.finalResult !== "selected" && c.finalResult !== "rejected")
  );
  const currentJob = jobs.find((j) => j.id === selectedJobId);

  return (
    <div className="page-enter">
      <Header
        userName={user?.email?.split("@")[0] || "HR"}
        userRole="Company"
        greeting="Offer Letters"
        subtitle={`${selectedCandidates.length} selected · ${pendingCandidates.length} in pipeline`}
      />

      <div className="px-8 pb-10 space-y-6">
        {/* Job selector */}
        {jobs.length > 1 && (
          <div className="flex items-center gap-3">
            <label className="text-sm font-medium text-foreground">Job:</label>
            <select
              value={selectedJobId}
              onChange={(e) => setSelectedJobId(e.target.value)}
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

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="i-card p-4 text-center">
            <p className="text-2xl font-bold text-foreground">{candidates.length}</p>
            <p className="text-[10px] text-muted-foreground mt-1">Total Candidates</p>
          </div>
          <div className="i-card p-4 text-center">
            <p className="text-2xl font-bold text-emerald-600">{selectedCandidates.length}</p>
            <p className="text-[10px] text-muted-foreground mt-1">Selected</p>
          </div>
          <div className="i-card p-4 text-center">
            <p className="text-2xl font-bold text-amber-600">{pendingCandidates.length}</p>
            <p className="text-[10px] text-muted-foreground mt-1">In Pipeline</p>
          </div>
          <div className="i-card p-4 text-center">
            <p className="text-2xl font-bold text-indigo-600">
              {currentJob ? formatLPA(currentJob.ctcMaxLpa) : "—"}
            </p>
            <p className="text-[10px] text-muted-foreground mt-1">Max CTC</p>
          </div>
        </div>

        {/* Action bar */}
        <div className="flex items-center justify-between">
          <h3 className="text-base font-semibold text-foreground">Offer Management</h3>
          <button
            onClick={() => showToast("success", "Create Offer: coming in next update")}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white text-sm font-semibold shadow-lg shadow-indigo-500/20 hover:shadow-xl transition-all"
          >
            <Plus className="w-4 h-4" />
            Create Offer
          </button>
        </div>

        {/* Offer cards */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
            <p className="text-sm text-muted-foreground">Loading offers...</p>
          </div>
        ) : selectedCandidates.length === 0 && pendingCandidates.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <Award className="w-10 h-10 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">
              No candidates have been selected yet. Complete interview rounds first.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Selected candidates — ready for offer */}
            {selectedCandidates.length > 0 && (
              <>
                <h4 className="text-sm font-semibold text-emerald-700 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4" /> Ready for Offer ({selectedCandidates.length})
                </h4>
                {selectedCandidates.map((c) => (
                  <div key={c.applicationId} className="i-card p-5">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-100 to-green-100 flex items-center justify-center text-sm font-bold text-emerald-700">
                          {getInitials(c.studentName || "?")}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="text-sm font-semibold text-foreground">{c.studentName}</h3>
                            <span className="text-[10px] font-semibold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-600 inline-flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3" /> Selected
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {c.usn} · {c.department} · CGPA: {c.cgpa ?? "—"}
                          </p>
                          <div className="flex items-center gap-4 mt-2 text-[10px] text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <IndianRupee className="w-3 h-3" /> {currentJob ? formatLPA(currentJob.ctcMaxLpa) : "—"}
                            </div>
                            <div className="flex items-center gap-1">
                              ATS: {c.atsScore ?? "—"}% · Match: {c.matchScore}%
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => showToast("success", `Sending offer to ${c.studentName}...`)}
                          className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-700 transition-colors"
                        >
                          <Send className="w-3.5 h-3.5" /> Send Offer
                        </button>
                        <button
                          onClick={() => showToast("success", `Preview offer for ${c.studentName}`)}
                          className="p-2 rounded-lg hover:bg-muted transition-colors"
                          title="Preview"
                        >
                          <Eye className="w-4 h-4 text-muted-foreground" />
                        </button>
                        <button
                          onClick={() => showToast("success", `Downloading offer letter for ${c.studentName}...`)}
                          className="p-2 rounded-lg hover:bg-muted transition-colors"
                          title="Download PDF"
                        >
                          <Download className="w-4 h-4 text-muted-foreground" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </>
            )}

            {/* Pending — still in pipeline */}
            {pendingCandidates.length > 0 && (
              <>
                <h4 className="text-sm font-semibold text-amber-700 flex items-center gap-2 mt-4">
                  <Clock className="w-4 h-4" /> In Pipeline ({pendingCandidates.length})
                </h4>
                {pendingCandidates.slice(0, 5).map((c) => (
                  <div key={c.applicationId} className="i-card p-5 opacity-70">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-100 to-violet-100 flex items-center justify-center text-sm font-bold text-indigo-700">
                        {getInitials(c.studentName || "?")}
                      </div>
                      <div>
                        <h3 className="text-sm font-semibold text-foreground">{c.studentName}</h3>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {c.usn} · {c.department} · Round {c.currentRound}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </>
            )}
          </div>
        )}
      </div>
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
