"use client";

import Header from "@/components/layout/Header";
import { MOCK_COMPANIES } from "@/constants";
import { cn, getInitials } from "@/lib/utils";
import {
  Search,
  Plus,
  Globe,
  MapPin,
  Mail,
  Phone,
  Building2,
  MoreHorizontal,
  ExternalLink,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { useState } from "react";

export default function AdminCompaniesPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [sectorFilter, setSectorFilter] = useState("all");

  const filtered = MOCK_COMPANIES.filter((c) => {
    const matchSearch = c.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchSector = sectorFilter === "all" || c.sector === sectorFilter;
    return matchSearch && matchSector;
  });

  return (
    <div className="page-enter">
      <Header
        userName="Dr. Placement Head"
        userRole="Admin"
        greeting="Companies"
        subtitle={`${MOCK_COMPANIES.length} companies registered for campus recruitment`}
      />

      <div className="px-8 pb-10 space-y-6">
        {/* Action Bar */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 flex-1 max-w-lg">
            <div className="flex items-center flex-1 bg-white rounded-xl border border-border px-3">
              <Search className="w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search companies..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 bg-transparent px-3 py-2.5 text-sm outline-none text-foreground placeholder:text-muted-foreground"
              />
            </div>
            <select
              value={sectorFilter}
              onChange={(e) => setSectorFilter(e.target.value)}
              className="px-3 py-2.5 rounded-xl border border-border bg-white text-sm text-foreground outline-none cursor-pointer"
            >
              <option value="all">All Sectors</option>
              <option value="Information Technology">IT</option>
              <option value="Manufacturing">Manufacturing</option>
              <option value="Finance & Banking">Finance</option>
            </select>
          </div>
          <button className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white text-sm font-semibold shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/30 transition-all">
            <Plus className="w-4 h-4" />
            Add Company
          </button>
        </div>

        {/* Company Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {filtered.map((company) => (
            <div key={company.id} className="i-card p-6 group cursor-pointer">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-100 to-teal-100 flex items-center justify-center text-lg font-bold text-emerald-700 border border-emerald-200/50">
                    {company.name.charAt(0)}
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-foreground group-hover:text-primary transition-colors">
                      {company.name}
                    </h3>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs text-muted-foreground">{company.sector}</span>
                      <span className="text-muted-foreground">·</span>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <MapPin className="w-3 h-3" />
                        {company.hqCity}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={cn(
                    "text-[10px] font-semibold px-2.5 py-1 rounded-full",
                    company.isActive ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-600"
                  )}>
                    {company.isActive ? "Active" : "Inactive"}
                  </span>
                  <button className="p-1.5 rounded-lg hover:bg-muted transition-colors opacity-0 group-hover:opacity-100">
                    <MoreHorizontal className="w-4 h-4 text-muted-foreground" />
                  </button>
                </div>
              </div>

              <p className="text-xs text-muted-foreground line-clamp-2 mb-4">
                {company.description}
              </p>

              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Mail className="w-3.5 h-3.5" />
                  <span className="truncate">{company.email}</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Phone className="w-3.5 h-3.5" />
                  <span>{company.hrName}</span>
                </div>
                {company.website && (
                  <div className="flex items-center gap-2 text-xs text-primary col-span-2">
                    <Globe className="w-3.5 h-3.5" />
                    <span className="truncate hover:underline">{company.website}</span>
                    <ExternalLink className="w-3 h-3" />
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-border/50">
                <div className="flex items-center gap-2">
                  {company.profileComplete ? (
                    <div className="flex items-center gap-1.5 text-[10px] font-medium text-emerald-600">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Profile Complete
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 text-[10px] font-medium text-amber-600">
                      <XCircle className="w-3.5 h-3.5" />
                      Profile Incomplete
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-[10px] font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">2 Jobs</span>
                  <span className="text-[10px] font-semibold text-violet-600 bg-violet-50 px-2 py-0.5 rounded-full">45 Candidates</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
