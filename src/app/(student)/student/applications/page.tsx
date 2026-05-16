"use client";

import Header from "@/components/layout/Header";
import { cn } from "@/lib/utils";
import {
  Building2,
  MapPin,
  Clock,
  Star,
  CheckCircle2,
  XCircle,
  ChevronRight,
  FileText,
  IndianRupee,
  Filter,
  Search,
} from "lucide-react";
import { useState } from "react";

const myApplications = [
  { id: "a1", company: "Infosys", role: "Software Engineer", location: "Bengaluru", ctc: "4.5 LPA", appliedOn: "May 5, 2026", atsScore: 82, status: "round2", round: "Technical Interview", roundDate: "May 19, 2026", roundTime: "10:30 AM" },
  { id: "a2", company: "TCS", role: "Systems Engineer", location: "Multiple", ctc: "3.6 LPA", appliedOn: "May 3, 2026", atsScore: 76, status: "selected", round: "Offer Released", roundDate: "May 15, 2026" },
  { id: "a3", company: "Wipro", role: "Project Engineer", location: "Bengaluru", ctc: "4.0 LPA", appliedOn: "May 7, 2026", atsScore: 80, status: "round1", round: "Online Assessment", roundDate: "May 21, 2026", roundTime: "02:00 PM" },
  { id: "a4", company: "Bosch", role: "Embedded Engineer", location: "Bengaluru", ctc: "6.2 LPA", appliedOn: "May 1, 2026", atsScore: 62, status: "rejected", round: "ATS Screening", roundDate: "May 4, 2026" },
  { id: "a5", company: "Google", role: "SDE Intern", location: "Hyderabad", ctc: "₹1.2L/month", appliedOn: "May 10, 2026", atsScore: 91, status: "pending", round: "Pending Approval" },
];

const statusMap: Record<string, { label: string; color: string; bg: string }> = {
  pending: { label: "Pending", color: "text-amber-600", bg: "bg-amber-50" },
  round1: { label: "Round 1", color: "text-blue-600", bg: "bg-blue-50" },
  round2: { label: "Round 2", color: "text-indigo-600", bg: "bg-indigo-50" },
  round3: { label: "Round 3", color: "text-violet-600", bg: "bg-violet-50" },
  selected: { label: "Selected ✨", color: "text-emerald-600", bg: "bg-emerald-50" },
  rejected: { label: "Not Selected", color: "text-red-600", bg: "bg-red-50" },
};

export default function StudentApplicationsPage() {
  const [filter, setFilter] = useState("all");

  const filtered = myApplications.filter((a) =>
    filter === "all" || a.status === filter
  );

  const selectedCount = myApplications.filter((a) => a.status === "selected").length;
  const activeCount = myApplications.filter((a) => !["selected", "rejected"].includes(a.status)).length;

  return (
    <div className="page-enter">
      <Header
        userName="Arjun Sharma"
        userRole="Student"
        greeting="My Applications"
        subtitle={`${myApplications.length} total · ${activeCount} in progress · ${selectedCount} offers received`}
      />

      <div className="px-8 pb-10 space-y-6">
        {/* Quick stats */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {[
            { label: "Total", count: myApplications.length, active: filter === "all", filter: "all" },
            { label: "In Progress", count: activeCount, active: filter === "round1" || filter === "round2", filter: "round1" },
            { label: "Pending", count: myApplications.filter(a => a.status === "pending").length, active: filter === "pending", filter: "pending" },
            { label: "Selected", count: selectedCount, active: filter === "selected", filter: "selected" },
            { label: "Rejected", count: myApplications.filter(a => a.status === "rejected").length, active: filter === "rejected", filter: "rejected" },
          ].map((s) => (
            <button
              key={s.label}
              onClick={() => setFilter(s.filter)}
              className={cn(
                "i-card p-3 text-center transition-all cursor-pointer",
                s.active && "ring-2 ring-primary/30"
              )}
            >
              <p className="text-lg font-bold text-foreground">{s.count}</p>
              <p className="text-[10px] text-muted-foreground">{s.label}</p>
            </button>
          ))}
        </div>

        {/* Application cards */}
        <div className="space-y-4">
          {filtered.map((app) => {
            const st = statusMap[app.status];
            return (
              <div key={app.id} className="i-card p-5 group cursor-pointer">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-100 to-violet-100 flex items-center justify-center text-base font-bold text-indigo-700">
                      {app.company.charAt(0)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-semibold text-foreground">{app.company}</h3>
                        <span className={cn("text-[10px] font-semibold px-2 py-0.5 rounded-full", st.bg, st.color)}>
                          {st.label}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">{app.role}</p>
                      <div className="flex items-center gap-4 mt-2 text-[10px] text-muted-foreground">
                        <div className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {app.location}</div>
                        <div className="flex items-center gap-1"><IndianRupee className="w-3 h-3" /> {app.ctc}</div>
                        <div className="flex items-center gap-1"><Clock className="w-3 h-3" /> Applied {app.appliedOn}</div>
                      </div>
                    </div>
                  </div>

                  <div className="text-right flex flex-col items-end gap-2">
                    <div className={cn(
                      "flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border",
                      app.atsScore >= 80 ? "bg-emerald-50 text-emerald-600 border-emerald-200" :
                      app.atsScore >= 65 ? "bg-blue-50 text-blue-600 border-blue-200" :
                      "bg-amber-50 text-amber-600 border-amber-200"
                    )}>
                      <Star className="w-3 h-3" />
                      ATS: {app.atsScore}%
                    </div>
                    <ChevronRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </div>

                {/* Current round info */}
                <div className="mt-3 pt-3 border-t border-border/50 flex items-center gap-2 text-xs">
                  <FileText className="w-3.5 h-3.5 text-muted-foreground" />
                  <span className="text-muted-foreground">Current: <strong className="text-foreground">{app.round}</strong></span>
                  {app.roundDate && <span className="text-muted-foreground">· {app.roundDate}</span>}
                  {app.roundTime && <span className="text-primary font-medium">@ {app.roundTime}</span>}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
