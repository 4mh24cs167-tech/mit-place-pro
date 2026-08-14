"use client";

import React, { useState, useEffect } from "react";
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
  Printer,
  ChevronDown,
  ChevronUp,
  Building,
  Calendar,
  Briefcase,
  User,
  Phone,
  Mail,
  MapPin,
  CheckCircle2,
  XCircle,
  AlertCircle
} from "lucide-react";

export default function InternshipPermissionsPage() {
  const router = useRouter();
  const { user } = useAuth();
  
  const [forms, setForms] = useState<InternshipPermission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);

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

  const filteredForms = forms.filter((form) => {
    const query = searchQuery.toLowerCase();
    return (
      (form.student?.fullName || '').toLowerCase().includes(query) ||
      (form.student?.usn || '').toLowerCase().includes(query) ||
      form.companyName.toLowerCase().includes(query)
    );
  });

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

  const renderChecklistIcon = (checked?: boolean) => {
    return checked ? (
      <CheckCircle2 className="w-5 h-5 text-emerald-500" />
    ) : (
      <XCircle className="w-5 h-5 text-rose-500" />
    );
  };

  return (
    <div className="page-enter min-h-screen bg-neutral-50/50 pb-24 sm:pb-10">
      <Header
        userName={user?.email || "Admin"}
        userRole="Administrator"
      />

      <div className="px-4 sm:px-6 md:px-8 max-w-7xl mx-auto mt-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-neutral-900 flex items-center gap-2">
              <FileText className="w-6 h-6 text-indigo-600" />
              Internship Permissions
            </h1>
            <p className="text-neutral-500 mt-1">
              View external internship permission forms submitted by students
            </p>
          </div>

          <div className="relative w-full md:w-80">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-neutral-400" />
            </div>
            <input
              type="text"
              placeholder="Search by student, USN, or company..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="block w-full pl-10 pr-3 py-2 border border-neutral-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm transition-shadow bg-white"
            />
          </div>
        </div>

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
            <button onClick={fetchForms} className="i-btn-dark">
              Try Again
            </button>
          </div>
        ) : filteredForms.length === 0 ? (
          <div className="i-card flex flex-col items-center justify-center py-16 text-center">
            <FileText className="w-12 h-12 text-neutral-300 mb-4" />
            <h3 className="text-lg font-medium text-neutral-900 mb-2">No forms found</h3>
            <p className="text-neutral-500 max-w-md mx-auto">
              {searchQuery
                ? `No forms match your search "${searchQuery}".`
                : "No internship permission forms have been submitted yet."}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredForms.map((form) => {
              const isExpanded = expandedId === form.id;
              const docLabels = [
                'Offer Letter', 'Confirmation Email', 'Job Description',
                'Joining Instructions', 'NOC / Permission', 'Other Document',
              ];

              return (
                <div key={form.id} className="i-card overflow-hidden">
                  <div className="p-5 flex flex-col lg:flex-row gap-4 justify-between">
                    <div className="flex-1 min-w-0 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      {/* Student Info */}
                      <div>
                        <div className="text-sm text-neutral-500 mb-1">Student</div>
                        <div className="font-semibold text-neutral-900 truncate">
                          {form.student?.fullName || 'N/A'}
                        </div>
                        <div className="text-sm font-medium text-indigo-600 bg-indigo-50 inline-block px-2 py-0.5 rounded-md mt-1">
                          {form.student?.usn || 'N/A'}
                        </div>
                      </div>

                      {/* Company Info */}
                      <div>
                        <div className="text-sm text-neutral-500 mb-1 flex items-center gap-1.5">
                          <Building className="w-3.5 h-3.5" /> Company
                        </div>
                        <div className="font-medium text-neutral-900 truncate">
                          {form.companyName}
                        </div>
                        <div className="text-sm text-neutral-600 truncate mt-1">
                          {form.internshipDomain || "No domain specified"}
                        </div>
                      </div>

                      {/* Duration */}
                      <div>
                        <div className="text-sm text-neutral-500 mb-1 flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5" /> Duration
                        </div>
                        <div className="text-sm text-neutral-800">
                          {formatDate(form.startDate)} – {formatDate(form.endDate)}
                        </div>
                        <div className="mt-1.5">
                          <span
                            className={cn(
                              "text-xs font-medium px-2 py-0.5 rounded-full",
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
                      </div>

                      {/* Submitted Date */}
                      <div>
                        <div className="text-sm text-neutral-500 mb-1 flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5" /> Submitted
                        </div>
                        <div className="text-sm text-neutral-800">
                          {formatDate(form.createdAt)}
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 lg:flex-col lg:justify-center">
                      <button
                        onClick={() => toggleExpand(form.id)}
                        className={cn(
                          "text-sm font-medium px-3 py-1.5 rounded-lg border transition-colors",
                          isExpanded
                            ? "bg-indigo-50 text-indigo-700 border-indigo-200"
                            : "bg-white text-neutral-600 border-neutral-200 hover:bg-neutral-50"
                        )}
                      >
                        {isExpanded ? "Hide" : "View Details"}
                      </button>
                      <button
                        onClick={(e) => handlePrint(form.id, e)}
                        className="text-sm font-medium px-3 py-1.5 rounded-lg border border-neutral-200 bg-white text-neutral-600 hover:bg-neutral-50 transition-colors flex items-center gap-1.5"
                      >
                        <Printer className="w-3.5 h-3.5" /> Print
                      </button>
                    </div>
                  </div>

                  {/* Expanded Content */}
                  {isExpanded && (
                    <div className="bg-neutral-50/80 border-t border-neutral-100 p-5 lg:p-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* Column 1 */}
                        <div className="space-y-6">
                          {/* Section A */}
                          <section>
                            <h4 className="text-sm font-bold tracking-wider text-neutral-500 uppercase mb-3 flex items-center gap-2">
                              <User className="w-4 h-4" /> Section A: Student Details
                            </h4>
                            <div className="bg-white rounded-lg border border-neutral-200 p-4 space-y-3 shadow-sm">
                              <div className="grid grid-cols-2 gap-3">
                                <div>
                                  <div className="text-xs text-neutral-500">Full Name</div>
                                  <div className="text-sm font-medium text-neutral-900">{form.student?.fullName || 'N/A'}</div>
                                </div>
                                <div>
                                  <div className="text-xs text-neutral-500">USN</div>
                                  <div className="text-sm font-medium text-neutral-900">{form.student?.usn || 'N/A'}</div>
                                </div>
                                <div>
                                  <div className="text-xs text-neutral-500">Branch</div>
                                  <div className="text-sm font-medium text-neutral-900">{form.student?.department || 'N/A'}</div>
                                </div>
                                <div>
                                  <div className="text-xs text-neutral-500">Phone</div>
                                  <div className="text-sm font-medium text-neutral-900">{form.student?.phone || 'N/A'}</div>
                                </div>
                                <div className="col-span-2">
                                  <div className="text-xs text-neutral-500">Email</div>
                                  <div className="text-sm font-medium text-neutral-900">{form.student?.email || 'N/A'}</div>
                                </div>
                                <div className="col-span-2">
                                  <div className="text-xs text-neutral-500">Mentor Name</div>
                                  <div className="text-sm font-medium text-neutral-900">{form.mentorName || 'N/A'}</div>
                                </div>
                              </div>
                            </div>
                          </section>

                          {/* Section B */}
                          <section>
                            <h4 className="text-sm font-bold tracking-wider text-neutral-500 uppercase mb-3 flex items-center gap-2">
                              <Building className="w-4 h-4" /> Section B: Internship Details
                            </h4>
                            <div className="bg-white rounded-lg border border-neutral-200 p-4 space-y-3 shadow-sm">
                              <div>
                                <div className="text-xs text-neutral-500">Company Name</div>
                                <div className="text-sm font-medium text-neutral-900">{form.companyName}</div>
                              </div>
                              <div className="grid grid-cols-2 gap-3">
                                <div>
                                  <div className="text-xs text-neutral-500">Domain</div>
                                  <div className="text-sm font-medium text-neutral-900">{form.internshipDomain}</div>
                                </div>
                                <div>
                                  <div className="text-xs text-neutral-500">Role</div>
                                  <div className="text-sm font-medium text-neutral-900">{form.internshipRole}</div>
                                </div>
                                <div>
                                  <div className="text-xs text-neutral-500">Mode</div>
                                  <div className="text-sm font-medium text-neutral-900">{form.mode}</div>
                                </div>
                                <div>
                                  <div className="text-xs text-neutral-500">Duration</div>
                                  <div className="text-sm font-medium text-neutral-900">{form.totalDuration}</div>
                                </div>
                                <div>
                                  <div className="text-xs text-neutral-500">Start Date</div>
                                  <div className="text-sm font-medium text-neutral-900">{formatDate(form.startDate)}</div>
                                </div>
                                <div>
                                  <div className="text-xs text-neutral-500">End Date</div>
                                  <div className="text-sm font-medium text-neutral-900">{formatDate(form.endDate)}</div>
                                </div>
                              </div>
                              <div>
                                <div className="text-xs text-neutral-500">Company Website</div>
                                <div className="text-sm font-medium text-blue-600">
                                  {form.companyWebsite ? (
                                    <a href={form.companyWebsite.startsWith('http') ? form.companyWebsite : `https://${form.companyWebsite}`} target="_blank" rel="noopener noreferrer" className="hover:underline">
                                      {form.companyWebsite}
                                    </a>
                                  ) : "N/A"}
                                </div>
                              </div>
                              <div>
                                <div className="text-xs text-neutral-500">Related to Branch</div>
                                <div className="text-sm font-medium text-neutral-900">{form.isRelatedToBranch}</div>
                              </div>
                            </div>
                          </section>

                          {/* Section C */}
                          <section>
                            <h4 className="text-sm font-bold tracking-wider text-neutral-500 uppercase mb-3 flex items-center gap-2">
                              <Briefcase className="w-4 h-4" /> Section C: Opportunity Details
                            </h4>
                            <div className="bg-white rounded-lg border border-neutral-200 p-4 space-y-3 shadow-sm">
                              <div className="grid grid-cols-2 gap-3">
                                <div>
                                  <div className="text-xs text-neutral-500">Opportunity Source</div>
                                  <div className="text-sm font-medium text-neutral-900">{form.opportunitySource}</div>
                                </div>
                                <div>
                                  <div className="text-xs text-neutral-500">Facilitated by College</div>
                                  <div className="text-sm font-medium text-neutral-900">{form.facilitatedByCollege ? 'Yes' : 'No'}</div>
                                </div>
                                <div>
                                  <div className="text-xs text-neutral-500">Stipend</div>
                                  <div className="text-sm font-medium text-neutral-900">{form.stipendProvided ? `₹${form.stipendAmount || 'Yes'}` : 'No'}</div>
                                </div>
                                <div>
                                  <div className="text-xs text-neutral-500">PPO Possible</div>
                                  <div className="text-sm font-medium text-neutral-900">{form.ppoPossible}</div>
                                </div>
                              </div>
                            </div>
                          </section>
                        </div>

                        {/* Column 2 */}
                        <div className="space-y-6">
                          {/* Section D */}
                          <section>
                            <h4 className="text-sm font-bold tracking-wider text-neutral-500 uppercase mb-3 flex items-center gap-2">
                              <User className="w-4 h-4" /> Section D: HR/Supervisor
                            </h4>
                            <div className="bg-white rounded-lg border border-neutral-200 p-4 space-y-3 shadow-sm">
                              <div className="grid grid-cols-2 gap-3">
                                <div>
                                  <div className="text-xs text-neutral-500">Name</div>
                                  <div className="text-sm font-medium text-neutral-900">{form.hrName || 'N/A'}</div>
                                </div>
                                <div>
                                  <div className="text-xs text-neutral-500">Designation</div>
                                  <div className="text-sm font-medium text-neutral-900">{form.hrDesignation || 'N/A'}</div>
                                </div>
                                <div>
                                  <div className="text-xs text-neutral-500">Email</div>
                                  <div className="text-sm font-medium text-neutral-900">{form.hrEmail || 'N/A'}</div>
                                </div>
                                <div>
                                  <div className="text-xs text-neutral-500">Phone</div>
                                  <div className="text-sm font-medium text-neutral-900">{form.hrPhone || 'N/A'}</div>
                                </div>
                              </div>
                            </div>
                          </section>

                          {/* Section E */}
                          <section>
                            <h4 className="text-sm font-bold tracking-wider text-neutral-500 uppercase mb-3 flex items-center gap-2">
                              <FileText className="w-4 h-4" /> Section E: Documents
                            </h4>
                            <div className="bg-white rounded-lg border border-neutral-200 p-4 space-y-2 shadow-sm">
                              {docLabels.map((label, i) => (
                                <div key={i} className="flex items-center justify-between py-1 border-b border-neutral-100 last:border-0">
                                  <span className="text-sm text-neutral-700">{label}</span>
                                  {renderChecklistIcon(form.documentsChecklist?.[i])}
                                </div>
                              ))}
                            </div>
                          </section>

                          {/* Section F */}
                          <section>
                            <h4 className="text-sm font-bold tracking-wider text-neutral-500 uppercase mb-3 flex items-center gap-2">
                              <CheckCircle2 className="w-4 h-4" /> Section F: Declaration
                            </h4>
                            <div className="bg-white rounded-lg border border-neutral-200 p-4 shadow-sm">
                              <div className="flex items-start gap-3">
                                {renderChecklistIcon(form.declarationAccepted)}
                                <div className="text-sm text-neutral-700">
                                  Student has read, understood and agreed to the undertaking and declaration.
                                </div>
                              </div>
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
    </div>
  );
}

