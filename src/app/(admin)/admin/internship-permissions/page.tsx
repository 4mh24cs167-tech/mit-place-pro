"use client";

import React, { useState, useEffect, useMemo } from "react";
import Header from "@/components/layout/Header";
import { cn } from "@/lib/utils";
import { adminApi } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { InternshipPermission } from "@/types";
import { useRouter } from "next/navigation";
import {
  Search,
  Loader2,
  FileText,
  Download,
  ChevronDown,
  ChevronUp,
  Building,
  Calendar,
  Briefcase,
  User,
  CheckCircle2,
  XCircle,
  AlertCircle,
  GraduationCap,
  Users,
} from "lucide-react";

interface GroupedData {
  [department: string]: {
    [batchName: string]: InternshipPermission[];
  };
}

export default function InternshipPermissionsPage() {
  const router = useRouter();
  const { user } = useAuth();

  const [forms, setForms] = useState<InternshipPermission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [expandedDepts, setExpandedDepts] = useState<Set<string>>(new Set());
  const [expandedBatches, setExpandedBatches] = useState<Set<string>>(new Set());
  const [deptFilter, setDeptFilter] = useState("all");

  const fetchForms = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await adminApi.listInternshipPermissions();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      setForms(((res as any)?.data || []) as InternshipPermission[]);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "An unexpected error occurred";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchForms();
  }, []);

  const filteredForms = useMemo(() => {
    return forms.filter((form) => {
      const query = searchQuery.toLowerCase();
      const matchesSearch =
        (form.student?.fullName || "").toLowerCase().includes(query) ||
        (form.student?.usn || "").toLowerCase().includes(query) ||
        form.companyName.toLowerCase().includes(query);
      const dept = form.student?.department || "Unknown";
      const matchesDept = deptFilter === "all" || dept === deptFilter;
      return matchesSearch && matchesDept;
    });
  }, [forms, searchQuery, deptFilter]);

  // Group by department → batch
  const grouped: GroupedData = useMemo(() => {
    const result: GroupedData = {};
    filteredForms.forEach((form) => {
      const dept = form.student?.department || "Unknown";
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const batchName = (form.student as any)?.batch?.name || "Unassigned";
      if (!result[dept]) result[dept] = {};
      if (!result[dept][batchName]) result[dept][batchName] = [];
      result[dept][batchName].push(form);
    });
    return result;
  }, [filteredForms]);

  const departments = useMemo(() => {
    const depts = new Set(forms.map((f) => f.student?.department || "Unknown"));
    return Array.from(depts).sort();
  }, [forms]);

  // Auto-expand all departments on first load only
  const hasAutoExpanded = React.useRef(false);
  useEffect(() => {
    if (Object.keys(grouped).length > 0 && !hasAutoExpanded.current) {
      hasAutoExpanded.current = true;
      setExpandedDepts(new Set(Object.keys(grouped)));
      const allBatchKeys: string[] = [];
      Object.entries(grouped).forEach(([dept, batches]) => {
        Object.keys(batches).forEach((batch) => {
          allBatchKeys.push(`${dept}:${batch}`);
        });
      });
      setExpandedBatches(new Set(allBatchKeys));
    }
  }, [grouped]);

  const toggleDept = (dept: string) => {
    setExpandedDepts((prev) => {
      const next = new Set(prev);
      if (next.has(dept)) next.delete(dept);
      else next.add(dept);
      return next;
    });
  };

  const toggleBatch = (key: string) => {
    setExpandedBatches((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const handlePrint = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    router.push(`/admin/internship-permissions/${id}/print`);
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const renderChecklistIcon = (checked?: boolean) =>
    checked ? (
      <CheckCircle2 className="w-4 h-4 text-emerald-500" />
    ) : (
      <XCircle className="w-4 h-4 text-rose-400" />
    );

  const totalCount = filteredForms.length;

  return (
    <div className="page-enter min-h-screen pb-24 sm:pb-10">
      <Header userName={user?.email || "Admin"} userRole="Administrator" />

      <div className="px-4 sm:px-6 md:px-8 max-w-7xl mx-auto mt-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-neutral-900 flex items-center gap-2">
              <FileText className="w-6 h-6 text-indigo-600" />
              Internship Permissions
            </h1>
            <p className="text-neutral-500 mt-1">
              {totalCount} form{totalCount !== 1 ? "s" : ""} submitted
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            {/* Department filter */}
            <select
              value={deptFilter}
              onChange={(e) => setDeptFilter(e.target.value)}
              className="px-3 py-2 border border-neutral-200 rounded-lg text-sm bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="all">All Departments</option>
              {departments.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>

            {/* Search */}
            <div className="relative w-full sm:w-72">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-neutral-400" />
              </div>
              <input
                type="text"
                placeholder="Search by name, USN, company..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="block w-full pl-10 pr-3 py-2 border border-neutral-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm bg-white"
              />
            </div>
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-neutral-400">
            <Loader2 className="w-10 h-10 animate-spin text-indigo-500 mb-4" />
            <p>Loading permission forms...</p>
          </div>
        ) : error ? (
          <div className="i-card flex flex-col items-center justify-center py-16 text-center">
            <AlertCircle className="w-12 h-12 text-rose-500 mb-4" />
            <h3 className="text-lg font-medium text-neutral-900 mb-2">Failed to load forms</h3>
            <p className="text-neutral-500 mb-6">{error}</p>
            <button onClick={fetchForms} className="i-btn-dark">Try Again</button>
          </div>
        ) : Object.keys(grouped).length === 0 ? (
          <div className="i-card flex flex-col items-center justify-center py-16 text-center">
            <FileText className="w-12 h-12 text-neutral-300 mb-4" />
            <h3 className="text-lg font-medium text-neutral-900 mb-2">No forms found</h3>
            <p className="text-neutral-500 max-w-md mx-auto">
              {searchQuery
                ? `No forms match "${searchQuery}".`
                : "No internship permission forms have been submitted yet."}
            </p>
          </div>
        ) : (
          <div className="space-y-5">
            {Object.entries(grouped)
              .sort(([a], [b]) => a.localeCompare(b))
              .map(([dept, batches]) => {
                const isDeptOpen = expandedDepts.has(dept);
                const deptCount = Object.values(batches).reduce((sum, arr) => sum + arr.length, 0);

                return (
                  <div key={dept} className="rounded-xl border border-neutral-200 bg-white overflow-hidden shadow-sm">
                    {/* Department Header */}
                    <button
                      onClick={() => toggleDept(dept)}
                      className="w-full flex items-center justify-between px-5 py-4 hover:bg-neutral-50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-indigo-100 flex items-center justify-center">
                          <GraduationCap className="w-5 h-5 text-indigo-600" />
                        </div>
                        <div className="text-left">
                          <h3 className="font-bold text-neutral-900 text-base">Department: {dept}</h3>
                          <p className="text-sm text-neutral-500">
                            {Object.keys(batches).length} batch{Object.keys(batches).length !== 1 ? "es" : ""} · {deptCount} form{deptCount !== 1 ? "s" : ""}
                          </p>
                        </div>
                      </div>
                      {isDeptOpen ? (
                        <ChevronUp className="w-5 h-5 text-neutral-400" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-neutral-400" />
                      )}
                    </button>

                    {/* Batches inside department */}
                    {isDeptOpen && (
                      <div className="border-t border-neutral-100 px-4 pb-4 pt-2 space-y-3">
                        {Object.entries(batches)
                          .sort(([a], [b]) => a.localeCompare(b))
                          .map(([batchName, batchForms]) => {
                            const batchKey = `${dept}:${batchName}`;
                            const isBatchOpen = expandedBatches.has(batchKey);

                            return (
                              <div key={batchKey} className="rounded-lg border border-neutral-100 overflow-hidden">
                                {/* Batch Header */}
                                <button
                                  onClick={() => toggleBatch(batchKey)}
                                  className="w-full flex items-center justify-between px-4 py-3 bg-neutral-50/70 hover:bg-neutral-100/50 transition-colors"
                                >
                                  <div className="flex items-center gap-2.5">
                                    <Users className="w-4 h-4 text-violet-500" />
                                    <span className="font-semibold text-sm text-neutral-800">{batchName}</span>
                                    <span className="text-xs text-neutral-400 bg-neutral-200/60 px-2 py-0.5 rounded-full">
                                      {batchForms.length} form{batchForms.length !== 1 ? "s" : ""}
                                    </span>
                                  </div>
                                  {isBatchOpen ? (
                                    <ChevronUp className="w-4 h-4 text-neutral-400" />
                                  ) : (
                                    <ChevronDown className="w-4 h-4 text-neutral-400" />
                                  )}
                                </button>

                                {/* Forms inside batch */}
                                {isBatchOpen && (
                                  <div className="divide-y divide-neutral-100">
                                    {batchForms.map((form) => {
                                      const isExpanded = expandedId === form.id;
                                      const docLabels = [
                                        "Offer Letter", "Confirmation Email", "Job Description",
                                        "Joining Instructions", "NOC / Permission", "Other Document",
                                      ];

                                      return (
                                        <div key={form.id}>
                                          {/* Form Row */}
                                          <div className="px-4 py-3 flex flex-col lg:flex-row gap-3 justify-between">
                                            <div className="flex-1 min-w-0 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                                              <div>
                                                <div className="text-xs text-neutral-500 mb-0.5">Student</div>
                                                <div className="font-semibold text-sm text-neutral-900 truncate">
                                                  {form.student?.fullName || "N/A"}
                                                </div>
                                                <div className="text-xs font-medium text-indigo-600 bg-indigo-50 inline-block px-1.5 py-0.5 rounded mt-0.5">
                                                  {form.student?.usn || "N/A"}
                                                </div>
                                              </div>
                                              <div>
                                                <div className="text-xs text-neutral-500 mb-0.5 flex items-center gap-1">
                                                  <Building className="w-3 h-3" /> Company
                                                </div>
                                                <div className="text-sm font-medium text-neutral-900 truncate">
                                                  {form.companyName}
                                                </div>
                                                <div className="text-xs text-neutral-500 truncate mt-0.5">
                                                  {form.internshipDomain || "–"}
                                                </div>
                                              </div>
                                              <div>
                                                <div className="text-xs text-neutral-500 mb-0.5 flex items-center gap-1">
                                                  <Calendar className="w-3 h-3" /> Duration
                                                </div>
                                                <div className="text-xs text-neutral-800">
                                                  {formatDate(form.startDate)} – {formatDate(form.endDate)}
                                                </div>
                                                <span
                                                  className={cn(
                                                    "text-[10px] font-medium px-1.5 py-0.5 rounded-full mt-1 inline-block",
                                                    form.mode === "remote"
                                                      ? "bg-purple-100 text-purple-700"
                                                      : form.mode === "hybrid"
                                                      ? "bg-amber-100 text-amber-700"
                                                      : "bg-emerald-100 text-emerald-700"
                                                  )}
                                                >
                                                  {form.mode || "on-site"}
                                                </span>
                                              </div>
                                              <div>
                                                <div className="text-xs text-neutral-500 mb-0.5">Submitted</div>
                                                <div className="text-xs text-neutral-800">
                                                  {formatDate(form.createdAt)}
                                                </div>
                                              </div>
                                            </div>

                                            {/* Actions */}
                                            <div className="flex items-center gap-2">
                                              <button
                                                onClick={() => toggleExpand(form.id)}
                                                className={cn(
                                                  "text-xs font-medium px-3 py-1.5 rounded-lg border transition-colors",
                                                  isExpanded
                                                    ? "bg-indigo-50 text-indigo-700 border-indigo-200"
                                                    : "bg-white text-neutral-600 border-neutral-200 hover:bg-neutral-50"
                                                )}
                                              >
                                                {isExpanded ? "Hide" : "Details"}
                                              </button>
                                              <button
                                                onClick={(e) => handlePrint(form.id, e)}
                                                className="text-xs font-medium px-3 py-1.5 rounded-lg border border-neutral-200 bg-white text-neutral-600 hover:bg-neutral-50 transition-colors flex items-center gap-1"
                                              >
                                                <Download className="w-3 h-3" /> Download
                                              </button>
                                            </div>
                                          </div>

                                          {/* Expanded Details */}
                                          {isExpanded && (
                                            <div className="bg-neutral-50/80 border-t border-neutral-100 p-4 lg:p-5">
                                              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                <div className="space-y-4">
                                                  {/* Section A */}
                                                  <section>
                                                    <h4 className="text-xs font-bold tracking-wider text-neutral-500 uppercase mb-2 flex items-center gap-1.5">
                                                      <User className="w-3.5 h-3.5" /> Student Details
                                                    </h4>
                                                    <div className="bg-white rounded-lg border border-neutral-200 p-3 space-y-2 shadow-sm text-sm">
                                                      <div className="grid grid-cols-2 gap-2">
                                                        <div><span className="text-xs text-neutral-500">Name</span><div className="font-medium">{form.student?.fullName || "N/A"}</div></div>
                                                        <div><span className="text-xs text-neutral-500">USN</span><div className="font-medium">{form.student?.usn || "N/A"}</div></div>
                                                        <div><span className="text-xs text-neutral-500">Branch</span><div className="font-medium">{form.student?.department || "N/A"}</div></div>
                                                        <div><span className="text-xs text-neutral-500">Mentor</span><div className="font-medium">{form.mentorName || "N/A"}</div></div>
                                                      </div>
                                                    </div>
                                                  </section>

                                                  {/* Section B */}
                                                  <section>
                                                    <h4 className="text-xs font-bold tracking-wider text-neutral-500 uppercase mb-2 flex items-center gap-1.5">
                                                      <Building className="w-3.5 h-3.5" /> Internship Details
                                                    </h4>
                                                    <div className="bg-white rounded-lg border border-neutral-200 p-3 space-y-2 shadow-sm text-sm">
                                                      <div><span className="text-xs text-neutral-500">Company</span><div className="font-medium">{form.companyName}</div></div>
                                                      <div className="grid grid-cols-2 gap-2">
                                                        <div><span className="text-xs text-neutral-500">Domain</span><div className="font-medium">{form.internshipDomain}</div></div>
                                                        <div><span className="text-xs text-neutral-500">Role</span><div className="font-medium">{form.internshipRole}</div></div>
                                                        <div><span className="text-xs text-neutral-500">Mode</span><div className="font-medium">{form.mode}</div></div>
                                                        <div><span className="text-xs text-neutral-500">Duration</span><div className="font-medium">{form.totalDuration}</div></div>
                                                      </div>
                                                      {form.companyWebsite && (
                                                        <div><span className="text-xs text-neutral-500">Website</span>
                                                          <a href={form.companyWebsite.startsWith("http") ? form.companyWebsite : `https://${form.companyWebsite}`} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline text-sm block">{form.companyWebsite}</a>
                                                        </div>
                                                      )}
                                                    </div>
                                                  </section>

                                                  {/* Section C */}
                                                  <section>
                                                    <h4 className="text-xs font-bold tracking-wider text-neutral-500 uppercase mb-2 flex items-center gap-1.5">
                                                      <Briefcase className="w-3.5 h-3.5" /> Opportunity
                                                    </h4>
                                                    <div className="bg-white rounded-lg border border-neutral-200 p-3 text-sm shadow-sm">
                                                      <div className="grid grid-cols-2 gap-2">
                                                        <div><span className="text-xs text-neutral-500">Source</span><div className="font-medium">{form.opportunitySource}</div></div>
                                                        <div><span className="text-xs text-neutral-500">College facilitated</span><div className="font-medium">{form.facilitatedByCollege ? "Yes" : "No"}</div></div>
                                                        <div><span className="text-xs text-neutral-500">Stipend</span><div className="font-medium">{form.stipendProvided ? `₹${form.stipendAmount || "Yes"}` : "No"}</div></div>
                                                        <div><span className="text-xs text-neutral-500">PPO</span><div className="font-medium">{form.ppoPossible}</div></div>
                                                      </div>
                                                    </div>
                                                  </section>
                                                </div>

                                                <div className="space-y-4">
                                                  {/* Section D */}
                                                  <section>
                                                    <h4 className="text-xs font-bold tracking-wider text-neutral-500 uppercase mb-2 flex items-center gap-1.5">
                                                      <User className="w-3.5 h-3.5" /> HR / Supervisor
                                                    </h4>
                                                    <div className="bg-white rounded-lg border border-neutral-200 p-3 text-sm shadow-sm">
                                                      <div className="grid grid-cols-2 gap-2">
                                                        <div><span className="text-xs text-neutral-500">Name</span><div className="font-medium">{form.hrName || "N/A"}</div></div>
                                                        <div><span className="text-xs text-neutral-500">Designation</span><div className="font-medium">{form.hrDesignation || "N/A"}</div></div>
                                                        <div><span className="text-xs text-neutral-500">Email</span><div className="font-medium">{form.hrEmail || "N/A"}</div></div>
                                                        <div><span className="text-xs text-neutral-500">Phone</span><div className="font-medium">{form.hrPhone || "N/A"}</div></div>
                                                      </div>
                                                    </div>
                                                  </section>

                                                  {/* Section E */}
                                                  <section>
                                                    <h4 className="text-xs font-bold tracking-wider text-neutral-500 uppercase mb-2 flex items-center gap-1.5">
                                                      <FileText className="w-3.5 h-3.5" /> Documents
                                                    </h4>
                                                    <div className="bg-white rounded-lg border border-neutral-200 p-3 space-y-1.5 shadow-sm">
                                                      {docLabels.map((label, i) => (
                                                        <div key={i} className="flex items-center justify-between py-0.5">
                                                          <span className="text-sm text-neutral-700">{label}</span>
                                                          {renderChecklistIcon(form.documentsChecklist?.[i])}
                                                        </div>
                                                      ))}
                                                    </div>
                                                  </section>

                                                  {/* Section F */}
                                                  <section>
                                                    <h4 className="text-xs font-bold tracking-wider text-neutral-500 uppercase mb-2 flex items-center gap-1.5">
                                                      <CheckCircle2 className="w-3.5 h-3.5" /> Declaration
                                                    </h4>
                                                    <div className="bg-white rounded-lg border border-neutral-200 p-3 shadow-sm flex items-start gap-2">
                                                      {renderChecklistIcon(form.declarationAccepted)}
                                                      <span className="text-sm text-neutral-700">Student accepted the undertaking and declaration.</span>
                                                    </div>
                                                  </section>
                                                </div>
                                              </div>
                                            </div>
                                          )}
                                        </div>
                                      );
                                    })}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                      </div>
                    )}
                  </div>
                );
              })}
          </div>
        )}
      </div>
    </div>
  );
}
