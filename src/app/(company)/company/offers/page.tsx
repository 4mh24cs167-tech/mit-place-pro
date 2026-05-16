"use client";

import Header from "@/components/layout/Header";
import { cn, getInitials, formatLPA } from "@/lib/utils";
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
  Filter,
} from "lucide-react";

const offers = [
  { id: "o1", student: "Priya Patel", usn: "4MT21CS002", dept: "CSE", role: "Software Engineer", ctcLPA: 4.5, joiningDate: "Jul 1, 2026", status: "accepted" as const, issuedOn: "May 16, 2026", letterSent: true },
  { id: "o2", student: "Ananya Iyer", usn: "4MT21CS006", dept: "CSE", role: "Software Engineer", ctcLPA: 4.5, joiningDate: "Jul 1, 2026", status: "pending" as const, issuedOn: "May 16, 2026", letterSent: true },
  { id: "o3", student: "Meera Nair", usn: "4MT21CS007", dept: "CSE", role: "Senior Software Engineer", ctcLPA: 6.8, joiningDate: "Jul 15, 2026", status: "pending" as const, issuedOn: "May 16, 2026", letterSent: false },
  { id: "o4", student: "Dev Patel", usn: "4MT21CS008", dept: "CSE", role: "Software Engineer", ctcLPA: 4.5, joiningDate: "Jul 1, 2026", status: "draft" as const, issuedOn: "", letterSent: false },
  { id: "o5", student: "Arjun Sharma", usn: "4MT21CS001", dept: "CSE", role: "Software Engineer", ctcLPA: 4.5, joiningDate: "Jul 1, 2026", status: "declined" as const, issuedOn: "May 14, 2026", letterSent: true },
];

const statusMap = {
  accepted: { label: "Accepted", color: "text-emerald-600", bg: "bg-emerald-50", icon: CheckCircle2 },
  pending: { label: "Pending", color: "text-amber-600", bg: "bg-amber-50", icon: Clock },
  draft: { label: "Draft", color: "text-slate-500", bg: "bg-slate-50", icon: FileText },
  declined: { label: "Declined", color: "text-red-600", bg: "bg-red-50", icon: Clock },
};

export default function CompanyOffersPage() {
  const acceptedCount = offers.filter((o) => o.status === "accepted").length;
  const pendingCount = offers.filter((o) => o.status === "pending").length;

  return (
    <div className="page-enter">
      <Header
        userName="HR Manager"
        userRole="Company"
        greeting="Offer Letters"
        subtitle={`${offers.length} offers · ${acceptedCount} accepted · ${pendingCount} pending response`}
      />

      <div className="px-8 pb-10 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="glass-card p-4 text-center">
            <p className="text-2xl font-bold text-foreground">{offers.length}</p>
            <p className="text-[10px] text-muted-foreground mt-1">Total Offers</p>
          </div>
          <div className="glass-card p-4 text-center">
            <p className="text-2xl font-bold text-emerald-600">{acceptedCount}</p>
            <p className="text-[10px] text-muted-foreground mt-1">Accepted</p>
          </div>
          <div className="glass-card p-4 text-center">
            <p className="text-2xl font-bold text-amber-600">{pendingCount}</p>
            <p className="text-[10px] text-muted-foreground mt-1">Pending</p>
          </div>
          <div className="glass-card p-4 text-center">
            <p className="text-2xl font-bold text-indigo-600">
              {formatLPA(Math.max(...offers.map((o) => o.ctcLPA)))}
            </p>
            <p className="text-[10px] text-muted-foreground mt-1">Highest CTC</p>
          </div>
        </div>

        {/* Action bar */}
        <div className="flex items-center justify-between">
          <h3 className="text-base font-semibold text-foreground">Offer Management</h3>
          <button className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white text-sm font-semibold shadow-lg shadow-indigo-500/20">
            <Plus className="w-4 h-4" />
            Create Offer
          </button>
        </div>

        {/* Offer cards */}
        <div className="space-y-4">
          {offers.map((offer) => {
            const st = statusMap[offer.status];
            const StatusIcon = st.icon;
            return (
              <div key={offer.id} className="glass-card p-5">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-100 to-violet-100 flex items-center justify-center text-sm font-bold text-indigo-700">
                      {getInitials(offer.student)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-semibold text-foreground">{offer.student}</h3>
                        <span className={cn("text-[10px] font-semibold px-2.5 py-1 rounded-full inline-flex items-center gap-1", st.bg, st.color)}>
                          <StatusIcon className="w-3 h-3" /> {st.label}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">{offer.usn} · {offer.dept} · {offer.role}</p>
                      <div className="flex items-center gap-4 mt-2 text-[10px] text-muted-foreground">
                        <div className="flex items-center gap-1"><IndianRupee className="w-3 h-3" /> {formatLPA(offer.ctcLPA)}</div>
                        <div className="flex items-center gap-1"><Calendar className="w-3 h-3" /> Joining: {offer.joiningDate}</div>
                        {offer.issuedOn && <div className="flex items-center gap-1"><Clock className="w-3 h-3" /> Issued: {offer.issuedOn}</div>}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {offer.status === "draft" && (
                      <button className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-700 transition-colors">
                        <Send className="w-3.5 h-3.5" /> Send Offer
                      </button>
                    )}
                    {!offer.letterSent && offer.status !== "draft" && (
                      <button className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-violet-50 text-violet-600 text-xs font-semibold hover:bg-violet-100 transition-colors">
                        <Mail className="w-3.5 h-3.5" /> Email Letter
                      </button>
                    )}
                    <button className="p-2 rounded-lg hover:bg-muted transition-colors" title="Preview Offer"><Eye className="w-4 h-4 text-muted-foreground" /></button>
                    <button className="p-2 rounded-lg hover:bg-muted transition-colors" title="Download PDF"><Download className="w-4 h-4 text-muted-foreground" /></button>
                  </div>
                </div>

                {offer.letterSent && (
                  <div className="mt-3 pt-3 border-t border-border/50 flex items-center gap-1.5 text-[10px] text-emerald-600">
                    <CheckCircle2 className="w-3 h-3" />
                    Offer letter sent to student&apos;s email
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
