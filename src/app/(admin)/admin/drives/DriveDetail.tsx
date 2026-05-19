"use client";

import Header from "@/components/layout/Header";
import { cn } from "@/lib/utils";
import { adminApi } from "@/lib/api";
import {
  ArrowLeft, Loader2, AlertCircle, X, Users, Clock,
  CheckCircle2, XCircle, UserX, UserCheck, ChevronDown,
  Building2, MapPin, Plus, Trash2, Search, Calendar,
} from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import SlotAllocator from "./SlotAllocator";

interface Registration {
  id: string;
  studentId: string;
  status: "pending" | "approved" | "rejected";
  rejectionReason: string | null;
  student: {
    fullName: string;
    usn: string;
    department: string;
    cgpa: number;
    email: string;
    semester: number;
  } | null;
}

interface DriveSlot {
  id: string;
  timeSlot: string;
  classroom: string | null;
  departments: string[];
  studentCount: number;
}

interface DriveDetailData {
  id: string;
  title: string;
  type: string;
  status: string;
  driveDate: string | null;
  departments: string[];
  description: string | null;
  company: string;
  jobTitle: string;
  jobId: string;
  registrations: Registration[];
  slots: DriveSlot[];
  createdAt: string;
}

interface Props {
  driveId: string;
  onBack: () => void;
  showToast: (type: "success" | "error", msg: string) => void;
  toast: { type: "success" | "error"; message: string } | null;
  setToast: (t: { type: "success" | "error"; message: string } | null) => void;
  userEmail: string;
}

const statusColors: Record<string, string> = {
  draft: "bg-gray-500/15 text-gray-400 border-gray-500/20",
  open: "bg-blue-500/15 text-blue-400 border-blue-500/20",
  screening: "bg-amber-500/15 text-amber-400 border-amber-500/20",
  scheduled: "bg-emerald-500/15 text-emerald-400 border-emerald-500/20",
  completed: "bg-purple-500/15 text-purple-400 border-purple-500/20",
  cancelled: "bg-red-500/15 text-red-400 border-red-500/20",
};

export default function DriveDetail({ driveId, onBack, showToast, toast, setToast, userEmail }: Props) {
  const [drive, setDrive] = useState<DriveDetailData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [rejectReason, setRejectReason] = useState("");
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);
  const [isApproving, setIsApproving] = useState(false);
  const [filterStatus, setFilterStatus] = useState<"all" | "pending" | "approved" | "rejected">("all");
  const [filterDept, setFilterDept] = useState<string>("all");
  const [searchQ, setSearchQ] = useState("");
  const [showSlotAllocator, setShowSlotAllocator] = useState(false);
  const [activeTab, setActiveTab] = useState<"applicants" | "slots">("applicants");

  const fetchDrive = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await adminApi.getDrive(driveId);
      setDrive(res.data as DriveDetailData);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load drive");
    } finally {
      setIsLoading(false);
    }
  }, [driveId]);

  useEffect(() => { fetchDrive(); }, [fetchDrive]);

  const filteredRegs = (drive?.registrations || []).filter((r) => {
    if (filterStatus !== "all" && r.status !== filterStatus) return false;
    if (filterDept !== "all" && r.student?.department !== filterDept) return false;
    if (searchQ) {
      const q = searchQ.toLowerCase();
      return (
        r.student?.fullName?.toLowerCase().includes(q) ||
        r.student?.usn?.toLowerCase().includes(q) ||
        r.student?.email?.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const toggleSelect = (studentId: string) => {
    setSelectedIds((prev) => {
      const n = new Set(prev);
      if (n.has(studentId)) n.delete(studentId); else n.add(studentId);
      return n;
    });
  };

  const toggleSelectAll = () => {
    const pendingIds = filteredRegs.filter(r => r.status === "pending").map(r => r.studentId);
    if (pendingIds.every((id) => selectedIds.has(id))) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(pendingIds));
    }
  };

  const handleReject = async () => {
    if (selectedIds.size === 0) return;
    setIsRejecting(true);
    try {
      const res = await adminApi.rejectDriveStudents(driveId, Array.from(selectedIds), rejectReason || undefined);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const d = res.data as any;
      showToast("success", `${d?.rejected || selectedIds.size} student(s) rejected`);
      setSelectedIds(new Set());
      setRejectReason("");
      setShowRejectModal(false);
      fetchDrive();
    } catch (err: unknown) {
      showToast("error", err instanceof Error ? err.message : "Failed to reject");
    } finally {
      setIsRejecting(false);
    }
  };

  const handleApproveAll = async () => {
    const pendingCount = drive?.registrations.filter((r) => r.status === "pending").length || 0;
    if (pendingCount === 0) { showToast("error", "No pending students to approve"); return; }
    if (!window.confirm(`Approve all ${pendingCount} pending student(s)? Rejected students will not be affected.`)) return;

    setIsApproving(true);
    try {
      const res = await adminApi.approveAllDrive(driveId);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const d = res.data as any;
      showToast("success", `${d?.approved || pendingCount} student(s) approved`);
      fetchDrive();
    } catch (err: unknown) {
      showToast("error", err instanceof Error ? err.message : "Failed to approve");
    } finally {
      setIsApproving(false);
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    try {
      await adminApi.updateDriveStatus(driveId, newStatus);
      showToast("success", `Drive status updated to ${newStatus}`);
      fetchDrive();
    } catch (err: unknown) {
      showToast("error", err instanceof Error ? err.message : "Failed to update status");
    }
  };

  const departments = [...new Set(drive?.registrations.map((r) => r.student?.department).filter(Boolean) as string[])];
  const pending = drive?.registrations.filter((r) => r.status === "pending").length || 0;
  const approved = drive?.registrations.filter((r) => r.status === "approved").length || 0;
  const rejected = drive?.registrations.filter((r) => r.status === "rejected").length || 0;

  return (
    <div className="min-h-screen bg-[#0a0a0f]">
      <Header userName={userEmail} userRole="admin" />

      {toast && (
        <div className="fixed top-6 right-6 z-50 animate-in slide-in-from-top-2 fade-in duration-300">
          <div className={cn("flex items-center gap-3 px-5 py-3 rounded-xl border shadow-2xl backdrop-blur-xl", toast.type === "success" ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300" : "bg-red-500/10 border-red-500/30 text-red-300")}>
            {toast.type === "success" ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
            <span className="text-sm font-medium">{toast.message}</span>
            <button onClick={() => setToast(null)} className="ml-2 opacity-60 hover:opacity-100"><X className="w-4 h-4" /></button>
          </div>
        </div>
      )}

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Back + Header */}
        <button onClick={onBack} className="flex items-center gap-2 text-white/40 hover:text-white/70 text-sm mb-6 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to Drives
        </button>

        {isLoading && (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <Loader2 className="w-8 h-8 text-orange-400 animate-spin" />
            <p className="text-white/40 text-sm">Loading drive details...</p>
          </div>
        )}

        {error && !isLoading && (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <AlertCircle className="w-8 h-8 text-red-400" />
            <p className="text-red-300 text-sm">{error}</p>
            <button onClick={fetchDrive} className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white/70 text-sm">Retry</button>
          </div>
        )}

        {drive && !isLoading && (
          <>
            {/* Drive Info */}
            <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-5 sm:p-6 mb-6">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                <div>
                  <h1 className="text-xl sm:text-2xl font-bold text-white">{drive.title}</h1>
                  <div className="flex flex-wrap items-center gap-3 mt-2 text-sm text-white/40">
                    <span className="flex items-center gap-1"><Building2 className="w-3.5 h-3.5" />{drive.company}</span>
                    {drive.driveDate && <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" />{new Date(drive.driveDate).toLocaleDateString()}</span>}
                  </div>
                  {drive.departments.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-3">
                      {drive.departments.map((d) => (
                        <span key={d} className="px-2.5 py-0.5 bg-white/[0.05] border border-white/[0.08] rounded text-xs font-medium text-white/50">{d}</span>
                      ))}
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <span className={cn("px-3 py-1.5 rounded-lg text-xs font-semibold border", statusColors[drive.status] || statusColors.draft)}>
                    {drive.status.charAt(0).toUpperCase() + drive.status.slice(1)}
                  </span>
                  <select value={drive.status} onChange={(e) => handleStatusChange(e.target.value)} className="px-3 py-1.5 bg-white/[0.04] border border-white/[0.08] rounded-lg text-white text-xs focus:outline-none">
                    {["draft","open","screening","scheduled","completed","cancelled"].map((s) => (
                      <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Quick Stats */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5">
                {[
                  { label: "Total", value: drive.registrations.length, col: "text-white" },
                  { label: "Pending", value: pending, col: "text-amber-400" },
                  { label: "Approved", value: approved, col: "text-emerald-400" },
                  { label: "Rejected", value: rejected, col: "text-red-400" },
                ].map((s) => (
                  <div key={s.label} className="bg-white/[0.03] rounded-xl p-3 text-center">
                    <p className={cn("text-xl font-bold", s.col)}>{s.value}</p>
                    <p className="text-[10px] text-white/30 uppercase tracking-wider mt-0.5">{s.label}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 p-1 bg-white/[0.03] border border-white/[0.06] rounded-xl mb-6 w-fit">
              {(["applicants", "slots"] as const).map((tab) => (
                <button key={tab} onClick={() => setActiveTab(tab)} className={cn("px-5 py-2 rounded-lg text-sm font-medium transition-all", activeTab === tab ? "bg-white/[0.08] text-white" : "text-white/40 hover:text-white/60")}>
                  {tab === "applicants" ? `Applicants (${drive.registrations.length})` : `Slots (${drive.slots.length})`}
                </button>
              ))}
            </div>

            {/* ── APPLICANTS TAB ── */}
            {activeTab === "applicants" && (
              <>
                {/* Actions Bar */}
                <div className="flex flex-col sm:flex-row gap-3 mb-4">
                  <div className="flex-1 relative">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                    <input value={searchQ} onChange={(e) => setSearchQ(e.target.value)} placeholder="Search students..." className="w-full pl-10 pr-4 py-2 bg-white/[0.04] border border-white/[0.08] rounded-xl text-white text-sm placeholder:text-white/30 focus:outline-none focus:border-orange-500/40" />
                  </div>
                  <div className="flex gap-2 overflow-x-auto">
                    <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value as typeof filterStatus)} className="px-3 py-2 bg-white/[0.04] border border-white/[0.08] rounded-xl text-white text-sm focus:outline-none min-w-[100px]">
                      <option value="all">All Status</option>
                      <option value="pending">Pending</option>
                      <option value="approved">Approved</option>
                      <option value="rejected">Rejected</option>
                    </select>
                    <select value={filterDept} onChange={(e) => setFilterDept(e.target.value)} className="px-3 py-2 bg-white/[0.04] border border-white/[0.08] rounded-xl text-white text-sm focus:outline-none min-w-[100px]">
                      <option value="all">All Depts</option>
                      {departments.map((d) => <option key={d} value={d}>{d}</option>)}
                    </select>
                  </div>
                </div>

                {/* Bulk Actions */}
                {pending > 0 && (
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-4 p-4 bg-white/[0.02] border border-white/[0.06] rounded-xl">
                    <button onClick={toggleSelectAll} className="flex items-center gap-2 px-3 py-1.5 bg-white/[0.05] border border-white/[0.08] rounded-lg text-white/60 text-xs font-medium hover:bg-white/[0.08] transition-all">
                      <input type="checkbox" readOnly checked={filteredRegs.filter(r => r.status === "pending").length > 0 && filteredRegs.filter(r => r.status === "pending").every(r => selectedIds.has(r.studentId))} className="rounded" />
                      Select All Pending
                    </button>
                    {selectedIds.size > 0 && (
                      <span className="text-white/40 text-xs">{selectedIds.size} selected</span>
                    )}
                    <div className="flex gap-2 sm:ml-auto">
                      {selectedIds.size > 0 && (
                        <button onClick={() => setShowRejectModal(true)} className="flex items-center gap-1.5 px-4 py-1.5 bg-red-500/15 text-red-300 border border-red-500/20 rounded-lg text-xs font-medium hover:bg-red-500/25 transition-all">
                          <UserX className="w-3.5 h-3.5" /> Reject Selected ({selectedIds.size})
                        </button>
                      )}
                      <button onClick={handleApproveAll} disabled={isApproving} className="flex items-center gap-1.5 px-4 py-1.5 bg-emerald-500/15 text-emerald-300 border border-emerald-500/20 rounded-lg text-xs font-medium hover:bg-emerald-500/25 transition-all disabled:opacity-50">
                        {isApproving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <UserCheck className="w-3.5 h-3.5" />}
                        Approve All Pending ({pending})
                      </button>
                    </div>
                  </div>
                )}

                {/* Student List */}
                {filteredRegs.length === 0 ? (
                  <div className="flex flex-col items-center py-12 gap-3">
                    <Users className="w-8 h-8 text-white/20" />
                    <p className="text-white/30 text-sm">No students match filters</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {filteredRegs.map((reg) => {
                      const s = reg.student;
                      const isPending = reg.status === "pending";
                      return (
                        <div key={reg.id} className={cn("flex items-center gap-3 p-4 bg-white/[0.02] border rounded-xl transition-all", selectedIds.has(reg.studentId) ? "border-orange-500/30 bg-orange-500/[0.04]" : "border-white/[0.06] hover:bg-white/[0.04]")}>
                          {isPending && (
                            <input type="checkbox" checked={selectedIds.has(reg.studentId)} onChange={() => toggleSelect(reg.studentId)} className="rounded flex-shrink-0" />
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3">
                              <p className="text-sm font-medium text-white truncate">{s?.fullName || "Unknown"}</p>
                              <span className="text-xs text-white/30 font-mono">{s?.usn}</span>
                            </div>
                            <div className="flex flex-wrap gap-2 mt-1">
                              <span className="text-xs text-white/40">{s?.department}</span>
                              <span className="text-xs text-white/20">•</span>
                              <span className="text-xs text-white/40">Sem {s?.semester}</span>
                              <span className="text-xs text-white/20">•</span>
                              <span className="text-xs text-white/40">CGPA {s?.cgpa}</span>
                            </div>
                          </div>
                          <span className={cn("px-2.5 py-1 rounded-lg text-[10px] font-semibold border flex-shrink-0",
                            reg.status === "approved" ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/20" :
                            reg.status === "rejected" ? "bg-red-500/15 text-red-400 border-red-500/20" :
                            "bg-amber-500/15 text-amber-400 border-amber-500/20"
                          )}>
                            {reg.status.charAt(0).toUpperCase() + reg.status.slice(1)}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </>
            )}

            {/* ── SLOTS TAB ── */}
            {activeTab === "slots" && (
              <>
                <div className="flex items-center justify-between mb-4">
                  <p className="text-white/40 text-sm">{drive.slots.length} slot(s) allocated</p>
                  {approved > 0 && (
                    <button onClick={() => setShowSlotAllocator(true)} className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-orange-600 to-amber-600 text-white rounded-xl text-sm font-medium shadow-lg shadow-orange-500/20 hover:from-orange-500 hover:to-amber-500 transition-all">
                      <Plus className="w-4 h-4" /> Allocate Slots
                    </button>
                  )}
                </div>

                {drive.slots.length === 0 ? (
                  <div className="flex flex-col items-center py-12 gap-3">
                    <Clock className="w-8 h-8 text-white/20" />
                    <p className="text-white/30 text-sm">{approved > 0 ? "No slots allocated yet. Click Allocate Slots to assign classrooms." : "Approve students first before allocating slots."}</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {drive.slots.map((slot) => (
                      <div key={slot.id} className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-5">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4 text-orange-400" />
                            <span className="text-white font-semibold text-sm">{slot.timeSlot}</span>
                          </div>
                          <span className="flex items-center gap-1 text-white/40 text-xs">
                            <Users className="w-3.5 h-3.5" /> {slot.studentCount}
                          </span>
                        </div>
                        {slot.classroom && (
                          <div className="flex items-center gap-1.5 text-white/50 text-sm mb-2">
                            <MapPin className="w-3.5 h-3.5" /> {slot.classroom}
                          </div>
                        )}
                        <div className="flex flex-wrap gap-1.5">
                          {slot.departments.map((d) => (
                            <span key={d} className="px-2 py-0.5 bg-orange-500/10 border border-orange-500/20 rounded text-[10px] font-medium text-orange-300">{d}</span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </>
        )}
      </main>

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-[#12121a] border border-white/[0.08] rounded-2xl w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between p-5 border-b border-white/[0.06]">
              <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                <UserX className="w-5 h-5 text-red-400" /> Reject {selectedIds.size} Student(s)
              </h2>
              <button onClick={() => setShowRejectModal(false)} className="p-2 rounded-lg hover:bg-white/5 text-white/40"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-5">
              <label className="block text-white/60 text-sm font-medium mb-2">Rejection Reason (optional)</label>
              <textarea value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} rows={3} placeholder="e.g. Does not meet criteria" className="w-full px-4 py-2.5 bg-white/[0.04] border border-white/[0.08] rounded-xl text-white text-sm placeholder:text-white/20 focus:outline-none focus:border-red-500/40 resize-none" />
            </div>
            <div className="flex items-center gap-3 p-5 border-t border-white/[0.06]">
              <button onClick={() => setShowRejectModal(false)} className="flex-1 px-4 py-2.5 bg-white/5 border border-white/10 text-white/60 rounded-xl text-sm font-medium hover:bg-white/10">Cancel</button>
              <button onClick={handleReject} disabled={isRejecting} className={cn("flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all", isRejecting ? "bg-red-600/30 text-red-300/50 cursor-not-allowed" : "bg-red-600 text-white hover:bg-red-500")}>
                {isRejecting ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserX className="w-4 h-4" />}
                {isRejecting ? "Rejecting..." : "Reject"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Slot Allocator */}
      {showSlotAllocator && drive && (
        <SlotAllocator
          driveId={driveId}
          departments={departments}
          onClose={() => setShowSlotAllocator(false)}
          onAllocated={() => { setShowSlotAllocator(false); fetchDrive(); }}
          showToast={showToast}
        />
      )}
    </div>
  );
}
