"use client";

import Header from "@/components/layout/Header";
import { adminApi } from "@/lib/api";
import { cn } from "@/lib/utils";
import {
  Search,
  Plus,
  Globe,
  MapPin,
  Mail,
  Phone,
  MoreHorizontal,
  ExternalLink,
  CheckCircle2,
  XCircle,
  Building2,
  X,
  Loader2,
} from "lucide-react";
import { useState, useEffect, useCallback } from "react";

interface Company {
  id: string;
  name: string;
  sector?: string;
  hqCity?: string;
  website?: string;
  profileComplete?: boolean;
  isActive?: boolean;
  email?: string;
  hrName?: string;
  description?: string;
  _count?: { jobs: number };
}

export default function AdminCompaniesPage() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [sectorFilter, setSectorFilter] = useState("all");
  const [showAddModal, setShowAddModal] = useState(false);
  const [addLoading, setAddLoading] = useState(false);
  const [addError, setAddError] = useState("");
  const [formData, setFormData] = useState({
    name: "",
    sector: "Information Technology",
    hqCity: "",
    website: "",
    email: "",
    hrName: "",
    description: "",
    password: "",
  });

  const fetchCompanies = useCallback(async () => {
    try {
      setLoading(true);
      const res = await adminApi.listCompanies({ search: searchQuery || undefined });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const list = (res as any)?.data || (res as any)?.companies || [];
      setCompanies(Array.isArray(list) ? list : []);
    } catch {
      setCompanies([]);
    } finally {
      setLoading(false);
    }
  }, [searchQuery]);

  useEffect(() => {
    fetchCompanies();
  }, [fetchCompanies]);

  // Auto-refresh every 30s
  useEffect(() => {
    const id = setInterval(fetchCompanies, 30000);
    return () => clearInterval(id);
  }, [fetchCompanies]);

  const handleAddCompany = async () => {
    if (!formData.name || !formData.email || !formData.password) {
      setAddError("Name, email, and password are required");
      return;
    }
    try {
      setAddLoading(true);
      setAddError("");
      await adminApi.createCompany(formData);
      setShowAddModal(false);
      setFormData({ name: "", sector: "Information Technology", hqCity: "", website: "", email: "", hrName: "", description: "", password: "" });
      await fetchCompanies();
    } catch (err: unknown) {
      setAddError(err instanceof Error ? err.message : "Failed to add company");
    } finally {
      setAddLoading(false);
    }
  };

  const filtered = companies.filter((c) => {
    const matchSector = sectorFilter === "all" || c.sector === sectorFilter;
    return matchSector;
  });

  const sectors = [...new Set(companies.map(c => c.sector).filter(Boolean))];

  return (
    <div className="page-enter">
      <Header
        userName="Dr. Placement Head"
        userRole="Admin"
        greeting="Companies"
        subtitle={`${companies.length} companies registered for campus recruitment`}
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
              {sectors.map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white text-sm font-semibold shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/30 transition-all"
          >
            <Plus className="w-4 h-4" />
            Add Company
          </button>
        </div>

        {/* Loading skeleton */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="i-card p-6 animate-pulse">
                <div className="flex items-start gap-4 mb-4">
                  <div className="w-14 h-14 rounded-2xl bg-muted" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-muted rounded w-1/2" />
                    <div className="h-3 bg-muted rounded w-1/3" />
                  </div>
                </div>
                <div className="h-3 bg-muted rounded w-full mb-2" />
                <div className="h-3 bg-muted rounded w-2/3" />
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="i-card p-12 text-center">
            <Building2 className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
            <h3 className="text-lg font-semibold text-foreground mb-1">No companies found</h3>
            <p className="text-sm text-muted-foreground">
              {searchQuery ? "Try adjusting your search" : "Add your first company to get started"}
            </p>
          </div>
        ) : (
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
                        <span className="text-xs text-muted-foreground">{company.sector || "—"}</span>
                        {company.hqCity && (
                          <>
                            <span className="text-muted-foreground">·</span>
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <MapPin className="w-3 h-3" />
                              {company.hqCity}
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={cn(
                      "text-[10px] font-semibold px-2.5 py-1 rounded-full",
                      company.isActive !== false ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-600"
                    )}>
                      {company.isActive !== false ? "Active" : "Inactive"}
                    </span>
                    <button className="p-1.5 rounded-lg hover:bg-muted transition-colors opacity-0 group-hover:opacity-100">
                      <MoreHorizontal className="w-4 h-4 text-muted-foreground" />
                    </button>
                  </div>
                </div>

                {company.description && (
                  <p className="text-xs text-muted-foreground line-clamp-2 mb-4">
                    {company.description}
                  </p>
                )}

                <div className="grid grid-cols-2 gap-3 mb-4">
                  {company.email && (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Mail className="w-3.5 h-3.5" />
                      <span className="truncate">{company.email}</span>
                    </div>
                  )}
                  {company.hrName && (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Phone className="w-3.5 h-3.5" />
                      <span>{company.hrName}</span>
                    </div>
                  )}
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
                  {company._count && (
                    <span className="text-[10px] font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">
                      {company._count.jobs} Jobs
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Company Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-semibold text-foreground">Add New Company</h2>
              <button onClick={() => setShowAddModal(false)} className="p-1.5 rounded-lg hover:bg-muted">
                <X className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>

            {addError && (
              <div className="mb-4 p-3 rounded-lg bg-red-50 text-red-600 text-sm">{addError}</div>
            )}

            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">Company Name *</label>
                  <input value={formData.name} onChange={e => setFormData(p => ({ ...p, name: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg border border-border text-sm outline-none focus:ring-2 focus:ring-primary/20" />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">Sector</label>
                  <select value={formData.sector} onChange={e => setFormData(p => ({ ...p, sector: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg border border-border text-sm outline-none">
                    <option>Information Technology</option>
                    <option>Manufacturing</option>
                    <option>Finance & Banking</option>
                    <option>Healthcare</option>
                    <option>Consulting</option>
                    <option>E-Commerce</option>
                    <option>Other</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">Email *</label>
                  <input type="email" value={formData.email} onChange={e => setFormData(p => ({ ...p, email: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg border border-border text-sm outline-none focus:ring-2 focus:ring-primary/20" />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">Password *</label>
                  <input type="password" value={formData.password} onChange={e => setFormData(p => ({ ...p, password: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg border border-border text-sm outline-none focus:ring-2 focus:ring-primary/20" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">HQ City</label>
                  <input value={formData.hqCity} onChange={e => setFormData(p => ({ ...p, hqCity: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg border border-border text-sm outline-none focus:ring-2 focus:ring-primary/20" />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">HR Contact Name</label>
                  <input value={formData.hrName} onChange={e => setFormData(p => ({ ...p, hrName: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg border border-border text-sm outline-none focus:ring-2 focus:ring-primary/20" />
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Website</label>
                <input value={formData.website} onChange={e => setFormData(p => ({ ...p, website: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg border border-border text-sm outline-none focus:ring-2 focus:ring-primary/20" />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Description</label>
                <textarea value={formData.description} onChange={e => setFormData(p => ({ ...p, description: e.target.value }))} rows={2}
                  className="w-full px-3 py-2 rounded-lg border border-border text-sm outline-none focus:ring-2 focus:ring-primary/20 resize-none" />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 mt-5">
              <button onClick={() => setShowAddModal(false)} className="px-4 py-2 rounded-lg border border-border text-sm font-medium hover:bg-muted transition-colors">
                Cancel
              </button>
              <button onClick={handleAddCompany} disabled={addLoading}
                className="flex items-center gap-2 px-5 py-2 rounded-lg bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 transition-colors disabled:opacity-50">
                {addLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                Add Company
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
