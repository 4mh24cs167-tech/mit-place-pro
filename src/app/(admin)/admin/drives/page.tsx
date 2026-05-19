"use client";

import Header from "@/components/layout/Header";
import { cn } from "@/lib/utils";
import { adminApi } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import {
  Briefcase, Plus, Loader2, AlertCircle, X, Eye, Trash2,
  Users, Clock, CheckCircle2, XCircle, Calendar, Building2,
  Search, Filter,
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

const statusConfig: Record<string, { label: string; bg: string; color: string; icon: typeof CheckCircle2 }> = {
  draft: { label: "Draft", bg: "bg-gray-50", color: "text-gray-600", icon: Clock },
  open: { label: "Open", bg: "bg-blue-50", color: "text-blue-600", icon: Clock },
  screening: { label: "Screening", bg: "bg-amber-50", color: "text-amber-600", icon: Filter },
  scheduled: { label: "Scheduled", bg: "bg-emerald-50", color: "text-emerald-600", icon: Calendar },
  completed: { label: "Completed", bg: "bg-purple-50", color: "text-purple-600", icon: CheckCircle2 },
  cancelled: { label: "Cancelled", bg: "bg-red-50", color: "text-red-600", icon: XCircle },
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
    <div className="page-enter">
      <Header userName={user?.email || "Admin"} userRole="Admin"
        greeting="Drive Management" subtitle="Create placement drives, manage applicants, and allocate slots" />

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
        {/* Stats Row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: "Total Drives", value: drives.length, icon: Briefcase, color: "bg-amber-50 text-amber-600" },
            { label: "Active", value: drives.filter(d => ["open","screening"].includes(d.status)).length, icon: Clock, color: "bg-blue-50 text-blue-600" },
            { label: "Scheduled", value: drives.filter(d => d.status === "scheduled").length, icon: Calendar, color: "bg-green-50 text-green-600" },
            { label: "Total Applicants", value: drives.reduce((a, d) => a + d.totalRegistrations, 0), icon: Users, color: "bg-purple-50 text-purple-600" },
          ].map((card) => (
            <div key={card.label} className="i-card p-5 flex items-start gap-4">
              <div className={cn("w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0", card.color)}>
                <card.icon className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{card.label}</p>
                {isLoading ? (
                  <div className="h-8 w-16 rounded bg-muted animate-pulse mt-1" />
                ) : (
                  <p className="text-2xl font-bold text-foreground tracking-tight">
                    {card.value}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Search + Create */}
        <div className="space-y-3">
          <div className="flex items-center bg-white rounded-xl border border-border px-3 w-full">
            <Search className="w-4 h-4 text-muted-foreground flex-shrink-0" />
            <input type="text" placeholder="Search drives by title or company..." value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 bg-transparent px-3 py-2.5 text-sm outline-none text-foreground placeholder:text-muted-foreground min-w-0" />
          </div>

          <div className="flex items-center justify-end">
            <button onClick={() => setShowCreate(true)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white text-xs sm:text-sm font-semibold shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/30 transition-all">
              <Plus className="w-3.5 h-3.5" /> New Drive
            </button>
          </div>
        </div>

        {/* Loading */}
        {isLoading && (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="i-card p-5">
                <div className="flex items-start gap-3 mb-4">
                  <div className="w-12 h-12 rounded-2xl bg-muted animate-pulse" />
                  <div className="space-y-2 flex-1">
                    <div className="h-4 w-3/4 bg-muted animate-pulse rounded" />
                    <div className="h-3 w-1/2 bg-muted animate-pulse rounded" />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-3 mb-4">
                  {[1, 2, 3].map((j) => <div key={j} className="h-14 rounded-lg bg-muted animate-pulse" />)}
                </div>
                <div className="h-2 bg-muted animate-pulse rounded-full" />
              </div>
            ))}
          </div>
        )}

        {/* Error */}
        {error && !isLoading && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mb-4">
              <AlertCircle className="w-7 h-7 text-red-500" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-1">{error}</h3>
            <button onClick={fetchDrives}
              className="mt-4 flex items-center gap-2 px-4 py-2.5 rounded-xl bg-foreground text-white text-sm font-medium">
              Retry
            </button>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && !error && filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
              <Briefcase className="w-7 h-7 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-1">
              {searchQuery ? "No Matching Drives" : "No Drives Yet"}
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              {searchQuery ? "Try a different search term." : "Create your first placement drive to get started."}
            </p>
            {!searchQuery && (
              <button onClick={() => setShowCreate(true)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-foreground text-white text-sm font-medium">
                <Plus className="w-4 h-4" /> Create Drive
              </button>
            )}
          </div>
        )}

        {/* Drive Cards */}
        {!isLoading && !error && filtered.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filtered.map((drive) => {
              const sc = statusConfig[drive.status] || statusConfig.draft;
              const StatusIcon = sc.icon;
              return (
                <div key={drive.id} className="i-card p-5 cursor-pointer group">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors truncate">
                        {drive.title}
                      </h4>
                      <p className="text-[11px] text-muted-foreground flex items-center gap-1.5 mt-0.5">
                        <Building2 className="w-3.5 h-3.5 flex-shrink-0" />
                        <span className="truncate">{drive.company}</span>
                      </p>
                    </div>
                    <span className={cn("text-[10px] font-semibold px-2.5 py-1 rounded-full flex items-center gap-1 flex-shrink-0", sc.bg, sc.color)}>
                      <StatusIcon className="w-3 h-3" /> {sc.label}
                    </span>
                  </div>

                  {drive.departments.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-3">
                      {drive.departments.map((d) => (
                        <span key={d} className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-600 font-medium">{d}</span>
                      ))}
                    </div>
                  )}

                  <div className="grid grid-cols-3 gap-3 mb-4">
                    <div className="text-center p-2 rounded-lg bg-muted/40">
                      <p className="text-lg font-bold text-foreground">{drive.totalRegistrations}</p>
                      <p className="text-[10px] text-muted-foreground uppercase">Total</p>
                    </div>
                    <div className="text-center p-2 rounded-lg bg-muted/40">
                      <p className="text-lg font-bold text-green-600">{drive.approved}</p>
                      <p className="text-[10px] text-muted-foreground uppercase">Approved</p>
                    </div>
                    <div className="text-center p-2 rounded-lg bg-muted/40">
                      <p className="text-lg font-bold text-amber-600">{drive.pending}</p>
                      <p className="text-[10px] text-muted-foreground uppercase">Pending</p>
                    </div>
                  </div>

                  {drive.driveDate && (
                    <div className="flex items-center gap-2 mb-3">
                      <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">
                        {new Date(drive.driveDate).toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" })}
                      </span>
                    </div>
                  )}

                  <div className="flex items-center gap-2">
                    <button onClick={() => setSelectedDriveId(drive.id)}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/30 transition-all">
                      <Eye className="w-4 h-4" /> Manage
                    </button>
                    <button onClick={() => handleDelete(drive.id, drive.title)}
                      className="flex items-center justify-center p-2.5 rounded-xl border border-border hover:bg-red-50 hover:border-red-200 hover:text-red-600 text-muted-foreground transition-all"
                      title="Delete Drive">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {showCreate && <CreateDriveModal onClose={() => setShowCreate(false)} onCreated={() => { setShowCreate(false); fetchDrives(); }} showToast={showToast} />}
    </div>
  );
}
