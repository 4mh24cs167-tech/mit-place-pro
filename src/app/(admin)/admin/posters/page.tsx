"use client";

import Header from "@/components/layout/Header";
import { adminApi } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { cn } from "@/lib/utils";
import {
  Image,
  Loader2,
  Briefcase,
  Calendar,
  Building2,
  Users,
  Palette,
  AlertCircle,
} from "lucide-react";
import { useState, useEffect, useCallback } from "react";

interface DrivePoster {
  id: string;
  title: string;
  company: string;
  driveDate: string | null;
  departments: string[];
  totalRegistrations: number;
  status: string;
}

const gradientColors = [
  "from-blue-600 to-indigo-700",
  "from-slate-700 to-slate-900",
  "from-violet-600 to-purple-700",
  "from-red-600 to-rose-700",
  "from-emerald-600 to-teal-700",
  "from-amber-600 to-orange-700",
  "from-pink-600 to-fuchsia-700",
  "from-cyan-600 to-sky-700",
];

export default function AdminPostersPage() {
  const { user } = useAuth();
  const [drives, setDrives] = useState<DrivePoster[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDrives = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await adminApi.listDrives();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const data = (res as any)?.data;
      if (Array.isArray(data)) {
        setDrives(data.map((d: DrivePoster) => ({
          id: d.id,
          title: d.title || "Untitled Drive",
          company: d.company || "—",
          driveDate: d.driveDate,
          departments: d.departments || [],
          totalRegistrations: d.totalRegistrations || 0,
          status: d.status || "draft",
        })));
      }
    } catch {
      setError("Failed to load drives for poster generation");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDrives();
  }, [fetchDrives]);

  return (
    <div className="page-enter">
      <Header
        userName={user?.email || "Admin"}
        userRole="Admin"
        greeting="Placement Posters"
        subtitle="Auto-generated posters from active placement drives"
      />

      <div className="px-4 sm:px-6 md:px-8 pb-10 space-y-6">
        {/* Info */}
        <div className="i-card p-5 flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-pink-50 flex items-center justify-center flex-shrink-0">
            <Palette className="w-6 h-6 text-pink-600" />
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-semibold text-foreground">Drive-Based Poster Generation</h3>
            <p className="text-xs text-muted-foreground mt-1">
              Posters are generated from your active placement drives. Each poster includes company name,
              drive details, eligible departments, and the MITM branding.
            </p>
          </div>
        </div>

        {/* Loading */}
        {loading && (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          </div>
        )}

        {/* Error */}
        {error && !loading && (
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
        {!loading && !error && drives.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
              <Image className="w-7 h-7 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-1">No Drives Available</h3>
            <p className="text-sm text-muted-foreground">
              Create placement drives first to generate announcement posters.
            </p>
          </div>
        )}

        {/* Poster Grid — generated from real drives */}
        {!loading && !error && drives.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {drives.map((drive, idx) => {
              const gradient = gradientColors[idx % gradientColors.length];
              return (
                <div key={drive.id} className="i-card overflow-hidden group cursor-pointer">
                  {/* Poster preview */}
                  <div className={cn(
                    "h-48 bg-gradient-to-br relative flex flex-col items-center justify-center p-6 text-center",
                    gradient
                  )}>
                    <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center mb-3">
                      <span className="text-white text-lg font-bold">{drive.company.charAt(0)}</span>
                    </div>
                    <h4 className="text-white text-sm font-bold leading-tight">{drive.title}</h4>
                    <p className="text-white/70 text-[10px] mt-2">
                      MITM College {drive.driveDate ? `· ${new Date(drive.driveDate).toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" })}` : ""}
                    </p>

                    {/* Departments overlay */}
                    {drive.departments.length > 0 && (
                      <div className="absolute bottom-3 left-3 right-3 flex flex-wrap gap-1 justify-center">
                        {drive.departments.slice(0, 4).map((d) => (
                          <span key={d} className="text-[8px] px-1.5 py-0.5 rounded-full bg-white/20 text-white font-medium">{d}</span>
                        ))}
                        {drive.departments.length > 4 && (
                          <span className="text-[8px] px-1.5 py-0.5 rounded-full bg-white/20 text-white font-medium">
                            +{drive.departments.length - 4}
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <Building2 className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                        <p className="text-sm font-semibold text-foreground truncate">{drive.company}</p>
                      </div>
                      <span className={cn(
                        "text-[10px] font-semibold px-2 py-0.5 rounded-full flex-shrink-0",
                        drive.status === "open" || drive.status === "screening"
                          ? "bg-blue-50 text-blue-600"
                          : drive.status === "completed"
                          ? "bg-emerald-50 text-emerald-600"
                          : "bg-gray-50 text-gray-600"
                      )}>
                        {drive.status.charAt(0).toUpperCase() + drive.status.slice(1)}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 mt-2">
                      {drive.driveDate && (
                        <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {new Date(drive.driveDate).toLocaleDateString("en-US", { day: "numeric", month: "short" })}
                        </span>
                      )}
                      <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                        <Users className="w-3 h-3" />
                        {drive.totalRegistrations} applicants
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
