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
  status: "pending" | "approved" | "rejected" | "declined";
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
  totalEligible?: number;
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

const statusConfig: Record<string, { bg: string; color: string }> = {
  draft: { bg: "bg-gray-50", color: "text-gray-600" },
  open: { bg: "bg-blue-50", color: "text-blue-600" },
  screening: { bg: "bg-amber-50", color: "text-amber-600" },
  scheduled: { bg: "bg-emerald-50", color: "text-emerald-600" },
  completed: { bg: "bg-purple-50", color: "text-purple-600" },
  cancelled: { bg: "bg-red-50", color: "text-red-600" },
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
  const [filterStatus, setFilterStatus] = useState<"all" | "pending" | "approved" | "rejected" | "declined">("all");
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
  const declined = drive?.registrations.filter((r) => r.status === "declined").length || 0;
  const totalEligible = drive?.totalEligible || 0;
  const notResponded = Math.max(0, totalEligible - (drive?.registrations.length || 0));

  return (
    <div className="page-enter">
      <Header userName={userEmail} userRole="Admin"
        greeting="Drive Details" subtitle={drive?.title || "Loading..."} />

      {toast && (
        <div className="fixed top-6 right-6 z-50 animate-in slide-in-from-top-2 fade-in duration-300">
          <div className={cn(
            "flex items-center gap-3 px-5 py-3 rounded-xl border shadow-2xl",
            toast.type === "success" ? "bg-green-50 border-green-200 text-green-700" : "bg-red-50 border-red-200 text-red-700"
          )}>
            {toast.type === "success" ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
            <span className="text-sm font-medium">{toast.message}</span>
            <button onClick={() => setToast(null)} className="ml-2 opacity-60 hover:opacity-100"><X className="w-4 h-4" /></button>
          </div>
        </div>
      )}

      <div className="px-4 sm:px-6 md:px-8 pb-10 space-y-4 sm:space-y-6">
        {/* Back button */}
        <button onClick={onBack} className="flex items-center gap-2 text-muted-foreground hover:text-foreground text-sm transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to Drives
        </button>

        {/* Loading */}
        {isLoading && (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
            <p className="text-muted-foreground text-sm">Loading drive details...</p>
          </div>
        )}

        {/* Error */}
        {error && !isLoading && (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center">
              <AlertCircle className="w-7 h-7 text-red-500" />
            </div>
            <p className="text-red-600 text-sm">{error}</p>
            <button onClick={fetchDrive} className="px-4 py-2 bg-foreground text-white rounded-xl text-sm font-medium">Retry</button>
          </div>
        )}

        {drive && !isLoading && (
          <>
            {/* Drive Info Card */}
            <div className="i-card p-5 sm:p-6">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                <div>
                  <h1 className="text-xl sm:text-2xl font-bold text-foreground">{drive.title}</h1>
                  <div className="flex flex-wrap items-center gap-3 mt-2 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1"><Building2 className="w-3.5 h-3.5" />{drive.company}</span>
                    {drive.driveDate && <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" />{new Date(drive.driveDate).toLocaleDateString()}</span>}
                  </div>
                  {drive.departments.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-3">
                      {drive.departments.map((d) => (
                        <span key={d} className="px-2.5 py-0.5 bg-indigo-50 border border-indigo-100 rounded text-xs font-medium text-indigo-600">{d}</span>
                      ))}
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {(() => {
                    const sc = statusConfig[drive.status] || statusConfig.draft;
                    return (
                      <span className={cn("px-3 py-1.5 rounded-lg text-xs font-semibold", sc.bg, sc.color)}>
                        {drive.status.charAt(0).toUpperCase() + drive.status.slice(1)}
                      </span>
                    );
                  })()}
                  <select value={drive.status} onChange={(e) => handleStatusChange(e.target.value)}
                    className="px-3 py-1.5 bg-white border border-border rounded-lg text-foreground text-xs focus:outline-none focus:border-indigo-400">
                    {["draft","open","screening","scheduled","completed","cancelled"].map((s) => (
                      <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Quick Stats */}
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-3 mt-5">
                {[
                  { label: "Total", value: drive.registrations.length, color: "text-foreground" },
                  { label: "Pending", value: pending, color: "text-amber-600" },
                  { label: "Approved", value: approved, color: "text-emerald-600" },
                  { label: "Rejected", value: rejected, color: "text-red-600" },
                  { label: "Declined", value: declined, color: "text-orange-600" },
                  { label: "Not Responded", value: notResponded, color: "text-slate-500" },
                ].map((s) => (
                  <div key={s.label} className="bg-muted/40 rounded-xl p-3 text-center">
                    <p className={cn("text-xl font-bold", s.color)}>{s.value}</p>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider mt-0.5">{s.label}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 p-1 bg-muted/40 border border-border rounded-xl w-fit">
              {(["applicants", "slots"] as const).map((tab) => (
                <button key={tab} onClick={() => setActiveTab(tab)} className={cn("px-5 py-2 rounded-lg text-sm font-medium transition-all", activeTab === tab ? "bg-white text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground")}>
                  {tab === "applicants" ? `Applicants (${drive.registrations.length})` : `Slots (${drive.slots.length})`}
                </button>
              ))}
            </div>

            {/* ── APPLICANTS TAB ── */}
            {activeTab === "applicants" && (
              <>
                {/* Actions Bar */}
                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="flex-1 flex items-center bg-white rounded-xl border border-border px-3">
                    <Search className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                    <input value={searchQ} onChange={(e) => setSearchQ(e.target.value)} placeholder="Search students..."
                      className="flex-1 bg-transparent px-3 py-2.5 text-sm outline-none text-foreground placeholder:text-muted-foreground min-w-0" />
                  </div>
                  <div className="flex gap-2 overflow-x-auto">
                    <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value as typeof filterStatus)}
                      className="px-3 py-2 bg-white border border-border rounded-xl text-foreground text-sm focus:outline-none min-w-[100px]">
                      <option value="all">All Status</option>
                      <option value="pending">Pending</option>
                      <option value="approved">Approved</option>
                      <option value="rejected">Rejected</option>
                      <option value="declined">Declined</option>
                    </select>
                    <select value={filterDept} onChange={(e) => setFilterDept(e.target.value)}
                      className="px-3 py-2 bg-white border border-border rounded-xl text-foreground text-sm focus:outline-none min-w-[100px]">
                      <option value="all">All Depts</option>
                      {departments.map((d) => <option key={d} value={d}>{d}</option>)}
                    </select>
                  </div>
                </div>

                {/* Bulk Actions */}
                {pending > 0 && (
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 p-4 i-card">
                    <button onClick={toggleSelectAll} className="flex items-center gap-2 px-3 py-1.5 bg-muted/50 border border-border rounded-lg text-muted-foreground text-xs font-medium hover:bg-muted transition-all">
                      <input type="checkbox" readOnly checked={filteredRegs.filter(r => r.status === "pending").length > 0 && filteredRegs.filter(r => r.status === "pending").every(r => selectedIds.has(r.studentId))} className="rounded" />
                      Select All Pending
                    </button>
                    {selectedIds.size > 0 && (
                      <span className="text-muted-foreground text-xs">{selectedIds.size} selected</span>
                    )}
                    <div className="flex gap-2 sm:ml-auto">
                      {selectedIds.size > 0 && (
                        <button onClick={() => setShowRejectModal(true)} className="flex items-center gap-1.5 px-4 py-1.5 bg-red-50 text-red-600 border border-red-200 rounded-lg text-xs font-medium hover:bg-red-100 transition-all">
                          <UserX className="w-3.5 h-3.5" /> Reject Selected ({selectedIds.size})
                        </button>
                      )}
                      <button onClick={handleApproveAll} disabled={isApproving} className="flex items-center gap-1.5 px-4 py-1.5 bg-emerald-50 text-emerald-600 border border-emerald-200 rounded-lg text-xs font-medium hover:bg-emerald-100 transition-all disabled:opacity-50">
                        {isApproving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <UserCheck className="w-3.5 h-3.5" />}
                        Approve All Pending ({pending})
                      </button>
                    </div>
                  </div>
                )}

                {/* Student List */}
                {filteredRegs.length === 0 ? (
                  <div className="flex flex-col items-center py-12 gap-3">
                    <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center">
                      <Users className="w-6 h-6 text-muted-foreground" />
                    </div>
                    <p className="text-muted-foreground text-sm">No students match filters</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {filteredRegs.map((reg) => {
                      const s = reg.student;
                      const isPending = reg.status === "pending";
                      return (
                        <div key={reg.id} className={cn("flex items-center gap-3 p-4 bg-white border rounded-xl transition-all", selectedIds.has(reg.studentId) ? "border-indigo-300 bg-indigo-50/30" : "border-border hover:border-indigo-200")}>
                          {isPending && (
                            <input type="checkbox" checked={selectedIds.has(reg.studentId)} onChange={() => toggleSelect(reg.studentId)} className="rounded flex-shrink-0" />
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3">
                              <p className="text-sm font-medium text-foreground truncate">{s?.fullName || "Unknown"}</p>
                              <span className="text-xs text-muted-foreground font-mono">{s?.usn}</span>
                            </div>
                            <div className="flex flex-wrap gap-2 mt-1">
                              <span className="text-xs text-muted-foreground">{s?.department}</span>
                              <span className="text-xs text-muted-foreground/40">•</span>
                              <span className="text-xs text-muted-foreground">Sem {s?.semester}</span>
                              <span className="text-xs text-muted-foreground/40">•</span>
                              <span className="text-xs text-muted-foreground">CGPA {s?.cgpa}</span>
                            </div>
                          </div>
                          <span className={cn("px-2.5 py-1 rounded-lg text-[10px] font-semibold flex-shrink-0",
                            reg.status === "approved" ? "bg-emerald-50 text-emerald-600" :
                            reg.status === "rejected" ? "bg-red-50 text-red-600" :
                            reg.status === "declined" ? "bg-orange-50 text-orange-600" :
                            "bg-amber-50 text-amber-600"
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
                <div className="flex items-center justify-between">
                  <p className="text-muted-foreground text-sm">{drive.slots.length} slot(s) allocated</p>
                  {approved > 0 && (
                    <button onClick={() => setShowSlotAllocator(true)} className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded-xl text-sm font-medium shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/30 transition-all">
                      <Plus className="w-4 h-4" /> Allocate Slots
                    </button>
                  )}
                </div>

                {drive.slots.length === 0 ? (
                  <div className="flex flex-col items-center py-12 gap-3">
                    <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center">
                      <Clock className="w-6 h-6 text-muted-foreground" />
                    </div>
                    <p className="text-muted-foreground text-sm">{approved > 0 ? "No slots allocated yet. Click Allocate Slots to assign classrooms." : "Approve students first before allocating slots."}</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {drive.slots.map((slot) => (
                      <div key={slot.id} className="i-card p-5">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4 text-indigo-500" />
                            <span className="text-foreground font-semibold text-sm">{slot.timeSlot}</span>
                          </div>
                          <span className="flex items-center gap-1 text-muted-foreground text-xs">
                            <Users className="w-3.5 h-3.5" /> {slot.studentCount}
                          </span>
                        </div>
                        {slot.classroom && (
                          <div className="flex items-center gap-1.5 text-muted-foreground text-sm mb-2">
                            <MapPin className="w-3.5 h-3.5" /> {slot.classroom}
                          </div>
                        )}
                        <div className="flex flex-wrap gap-1.5">
                          {slot.departments.map((d) => (
                            <span key={d} className="px-2 py-0.5 bg-indigo-50 border border-indigo-100 rounded text-[10px] font-medium text-indigo-600">{d}</span>
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
      </div>

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-6 bg-black/50">
          <div className="bg-white rounded-t-2xl sm:rounded-2xl w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between p-5 border-b border-border">
              <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
                <UserX className="w-5 h-5 text-red-500" /> Reject {selectedIds.size} Student(s)
              </h2>
              <button onClick={() => setShowRejectModal(false)} className="w-8 h-8 rounded-lg hover:bg-muted flex items-center justify-center text-muted-foreground"><X className="w-4 h-4" /></button>
            </div>
            <div className="p-5">
              <label className="block text-muted-foreground text-sm font-medium mb-2">Rejection Reason (optional)</label>
              <textarea value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} rows={3} placeholder="e.g. Does not meet criteria"
                className="w-full px-3 py-2.5 rounded-lg border border-border text-sm outline-none bg-white text-foreground focus:border-red-300 resize-none placeholder:text-muted-foreground" />
            </div>
            <div className="flex items-center gap-3 p-5 border-t border-border">
              <button onClick={() => setShowRejectModal(false)} className="flex-1 px-4 py-2.5 border border-border text-foreground rounded-xl text-sm font-medium hover:bg-muted/50">Cancel</button>
              <button onClick={handleReject} disabled={isRejecting} className={cn("flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all", isRejecting ? "bg-red-100 text-red-300 cursor-not-allowed" : "bg-red-600 text-white hover:bg-red-500")}>
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
