"use client";

import Header from "@/components/layout/Header";
import { cn } from "@/lib/utils";
import { adminApi } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import {
  Briefcase, Plus, Loader2, AlertCircle, X, Eye, Trash2,
  Users, Clock, CheckCircle2, XCircle, Calendar, Building2,
  ChevronRight, Search, Filter,
} from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import DriveDetail from "./DriveDetail";
import CreateDriveModal from "./CreateDriveModal";

interface DriveSummary {
  id: string;
  title: string;
  type: string;
  status: string;
  driveDate: string | null;
  departments: string[];
  company: string;
  jobTitle: string;
  jobId: string;
  totalRegistrations: number;
  approved: number;
  rejected: number;
  pending: number;
  slotsCount: number;
  createdAt: string;
}

const statusConfig: Record<string, { label: string; color: string; icon: typeof CheckCircle2 }> = {
  draft: { label: "Draft", color: "bg-gray-500/15 text-gray-400 border-gray-500/20", icon: Clock },
  open: { label: "Open", color: "bg-blue-500/15 text-blue-400 border-blue-500/20", icon: Clock },
  screening: { label: "Screening", color: "bg-amber-500/15 text-amber-400 border-amber-500/20", icon: Filter },
  scheduled: { label: "Scheduled", color: "bg-emerald-500/15 text-emerald-400 border-emerald-500/20", icon: Calendar },
  completed: { label: "Completed", color: "bg-purple-500/15 text-purple-400 border-purple-500/20", icon: CheckCircle2 },
  cancelled: { label: "Cancelled", color: "bg-red-500/15 text-red-400 border-red-500/20", icon: XCircle },
};

export default function AdminDrivesPage() {
  const { user } = useAuth();
  const [drives, setDrives] = useState<DriveSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDriveId, setSelectedDriveId] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const showToast = useCallback((type: "success" | "error", message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  }, []);

  const fetchDrives = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await adminApi.listDrives();
      setDrives((res.data || []) as DriveSummary[]);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load drives");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { fetchDrives(); }, [fetchDrives]);

  const handleDelete = async (id: string, title: string) => {
    if (!window.confirm(`Delete drive "${title}"? This cannot be undone.`)) return;
    try {
      await adminApi.deleteDrive(id);
      showToast("success", `Drive "${title}" deleted`);
      fetchDrives();
    } catch (err: unknown) {
      showToast("error", err instanceof Error ? err.message : "Failed to delete");
    }
  };

  const filtered = drives.filter((d) =>
    d.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    d.company.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (selectedDriveId) {
    return (
      <DriveDetail
        driveId={selectedDriveId}
        onBack={() => { setSelectedDriveId(null); fetchDrives(); }}
        showToast={showToast}
        toast={toast}
        setToast={setToast}
        userEmail={user?.email || "Admin"}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f]">
      <Header userName={user?.email || "Admin"} userRole="admin" />

      {toast && (
        <div className="fixed top-6 right-6 z-50 animate-in slide-in-from-top-2 fade-in duration-300">
          <div className={cn(
            "flex items-center gap-3 px-5 py-3 rounded-xl border shadow-2xl backdrop-blur-xl",
            toast.type === "success" ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300" : "bg-red-500/10 border-red-500/30 text-red-300"
          )}>
            {toast.type === "success" ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
            <span className="text-sm font-medium">{toast.message}</span>
            <button onClick={() => setToast(null)} className="ml-2 opacity-60 hover:opacity-100"><X className="w-4 h-4" /></button>
          </div>
        </div>
      )}

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-gradient-to-br from-orange-500/20 to-amber-500/20 border border-orange-500/20">
                <Briefcase className="w-6 h-6 text-orange-400" />
              </div>
              Drive Management
            </h1>
            <p className="text-white/50 mt-1.5 text-sm sm:text-base">Create placement drives, manage applicants, and allocate slots</p>
          </div>
          <button onClick={() => setShowCreate(true)} className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white rounded-xl font-medium shadow-lg shadow-orange-500/20 transition-all duration-200 text-sm">
            <Plus className="w-4 h-4" /> New Drive
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-8">
          {[
            { label: "Total Drives", value: drives.length, icon: Briefcase, col: "text-orange-400" },
            { label: "Active", value: drives.filter(d => ["open","screening"].includes(d.status)).length, icon: Clock, col: "text-blue-400" },
            { label: "Scheduled", value: drives.filter(d => d.status === "scheduled").length, icon: Calendar, col: "text-emerald-400" },
            { label: "Total Applicants", value: drives.reduce((a, d) => a + d.totalRegistrations, 0), icon: Users, col: "text-purple-400" },
          ].map((s) => (
            <div key={s.label} className="bg-white/[0.03] backdrop-blur-sm border border-white/[0.06] rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <s.icon className={cn("w-4 h-4", s.col)} />
                <span className="text-white/40 text-xs font-medium uppercase tracking-wider">{s.label}</span>
              </div>
              <p className="text-2xl font-bold text-white">{s.value}</p>
            </div>
          ))}
        </div>

        {/* Search */}
        <div className="relative mb-6">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
          <input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search drives..." className="w-full pl-10 pr-4 py-2.5 bg-white/[0.04] border border-white/[0.08] rounded-xl text-white text-sm placeholder:text-white/30 focus:outline-none focus:border-orange-500/40" />
        </div>

        {/* Loading / Error / Empty */}
        {isLoading && (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <Loader2 className="w-8 h-8 text-orange-400 animate-spin" />
            <p className="text-white/40 text-sm">Loading drives...</p>
          </div>
        )}

        {error && !isLoading && (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <AlertCircle className="w-8 h-8 text-red-400" />
            <p className="text-red-300 text-sm">{error}</p>
            <button onClick={fetchDrives} className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white/70 text-sm hover:bg-white/10 transition-colors">Retry</button>
          </div>
        )}

        {!isLoading && !error && filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <div className="p-4 rounded-2xl bg-orange-500/10 border border-orange-500/20">
              <Briefcase className="w-10 h-10 text-orange-400" />
            </div>
            <h3 className="text-xl font-semibold text-white">{searchQuery ? "No Matching Drives" : "No Drives Yet"}</h3>
            <p className="text-white/40 text-sm text-center max-w-md">
              {searchQuery ? "Try a different search term." : "Create your first placement drive to get started."}
            </p>
            {!searchQuery && (
              <button onClick={() => setShowCreate(true)} className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-orange-600 to-amber-600 text-white rounded-xl font-medium text-sm mt-2">
                <Plus className="w-4 h-4" /> Create Drive
              </button>
            )}
          </div>
        )}

        {/* Drive Cards */}
        {!isLoading && !error && filtered.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((drive) => {
              const sc = statusConfig[drive.status] || statusConfig.draft;
              const StatusIcon = sc.icon;
              return (
                <div key={drive.id} className="group bg-white/[0.03] backdrop-blur-sm border border-white/[0.06] rounded-2xl p-5 hover:bg-white/[0.05] hover:border-white/[0.1] transition-all duration-300">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-base font-semibold text-white truncate">{drive.title}</h3>
                      <p className="text-white/40 text-sm flex items-center gap-1.5 mt-0.5">
                        <Building2 className="w-3.5 h-3.5 flex-shrink-0" />
                        <span className="truncate">{drive.company}</span>
                      </p>
                    </div>
                    <span className={cn("px-2.5 py-1 rounded-lg text-[10px] font-semibold border flex items-center gap-1 flex-shrink-0", sc.color)}>
                      <StatusIcon className="w-3 h-3" /> {sc.label}
                    </span>
                  </div>

                  {drive.departments.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-3">
                      {drive.departments.map((d) => (
                        <span key={d} className="px-2 py-0.5 bg-white/[0.05] border border-white/[0.08] rounded text-[10px] font-medium text-white/50">{d}</span>
                      ))}
                    </div>
                  )}

                  <div className="grid grid-cols-3 gap-2 mb-4 bg-white/[0.02] rounded-xl p-3">
                    <div className="text-center">
                      <p className="text-lg font-bold text-white">{drive.totalRegistrations}</p>
                      <p className="text-[10px] text-white/30 uppercase tracking-wider">Total</p>
                    </div>
                    <div className="text-center border-x border-white/[0.06]">
                      <p className="text-lg font-bold text-emerald-400">{drive.approved}</p>
                      <p className="text-[10px] text-white/30 uppercase tracking-wider">Approved</p>
                    </div>
                    <div className="text-center">
                      <p className="text-lg font-bold text-amber-400">{drive.pending}</p>
                      <p className="text-[10px] text-white/30 uppercase tracking-wider">Pending</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button onClick={() => setSelectedDriveId(drive.id)} className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium bg-gradient-to-r from-orange-600/20 to-amber-600/20 text-orange-300 border border-orange-500/20 hover:from-orange-600/30 hover:to-amber-600/30 transition-all">
                      <Eye className="w-4 h-4" /> Manage
                    </button>
                    <button onClick={() => handleDelete(drive.id, drive.title)} className="flex items-center justify-center p-2.5 rounded-xl bg-red-500/10 text-red-400 border border-red-500/15 hover:bg-red-500/20 transition-all" title="Delete Drive">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {showCreate && <CreateDriveModal onClose={() => setShowCreate(false)} onCreated={() => { setShowCreate(false); fetchDrives(); }} showToast={showToast} />}
    </div>
  );
}
