"use client";

import React, { useState, useEffect } from "react";
import Header from "@/components/layout/Header";
import { cn } from "@/lib/utils";
import { studentApi } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import {
  Loader2,
  Plus,
  Building2,
  Briefcase,
  FileText,
  CheckCircle,
  Calendar,
  MapPin,
  Download,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  Clock,
  Link as LinkIcon,
  User
} from "lucide-react";
import Link from "next/link";

export default function InternshipPermissionPage() {
  const { user } = useAuth();
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [profile, setProfile] = useState<any>(null);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const initialFormData = {
    // Section A
    mentorName: "",
    // Section B
    companyName: "",
    companyWebsite: "",
    companyAddress: "",
    domain: "",
    role: "",
    projectTitle: "",
    startDate: "",
    endDate: "",
    duration: "",
    mode: "",
    location: "",
    expectedHours: "",
    academicRelated: "",
    // Section C
    opportunitySource: "",
    collegeFacilitated: "",
    sourcePersonName: "",
    isStipendProvided: "",
    stipendAmount: "",
    otherBenefits: "",
    ppoPossibility: "",
    ppoDetails: "",
    // Section D
    hrName: "",
    hrDesignation: "",
    hrEmail: "",
    hrPhone: "",
    // Section E
    docOfferLetter: false,
    docConfirmationEmail: false,
    docJobDescription: false,
    docJoiningInstructions: false,
    docNoc: false,
    docOther: false,
    // Section F
    agreedToUndertaking: false,
  };

  const [formData, setFormData] = useState(initialFormData);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [profileRes, submissionsRes] = await Promise.all([
          studentApi.getProfile(),
          studentApi.getMyInternshipPermissions().catch(() => ({ data: [] }))
        ]);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        setProfile((profileRes as any)?.data || profileRes);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        setSubmissions((submissionsRes as any)?.data || []);
      } catch (err) {
        console.error(err);
        showToast("Failed to load data. Please try again.", "error");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const showToast = (message: string, type: "success" | "error") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 5000);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData((prev) => ({ ...prev, [name]: checked }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleRadioChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.agreedToUndertaking) {
      showToast("You must agree to the undertaking to submit the form.", "error");
      return;
    }

    try {
      setIsSubmitting(true);
      // Map form fields to backend entity field names
      const payload = {
        mentorName: formData.mentorName,
        companyName: formData.companyName,
        companyWebsite: formData.companyWebsite || null,
        companyAddress: formData.companyAddress || null,
        internshipDomain: formData.domain,
        internshipRole: formData.role,
        projectTitle: formData.projectTitle || null,
        startDate: formData.startDate,
        endDate: formData.endDate,
        totalDuration: formData.duration,
        mode: formData.mode,
        workLocation: formData.location || null,
        workingHours: formData.expectedHours || null,
        isRelatedToBranch: formData.academicRelated,
        opportunitySource: formData.opportunitySource,
        facilitatedByCollege: formData.collegeFacilitated === 'yes',
        sourcePerson: formData.sourcePersonName || null,
        stipendProvided: formData.isStipendProvided === 'yes',
        stipendAmount: formData.stipendAmount || null,
        otherBenefits: formData.otherBenefits || null,
        ppoPossible: formData.ppoPossibility,
        ppoDetails: formData.ppoDetails || null,
        hrName: formData.hrName || null,
        hrDesignation: formData.hrDesignation || null,
        hrEmail: formData.hrEmail || null,
        hrPhone: formData.hrPhone || null,
        documentsChecklist: [
          formData.docOfferLetter,
          formData.docConfirmationEmail,
          formData.docJobDescription,
          formData.docJoiningInstructions,
          formData.docNoc,
          formData.docOther,
        ],
        declarationAccepted: formData.agreedToUndertaking,
      };
      await studentApi.submitInternshipPermission(payload);
      
      showToast("Internship permission request submitted successfully!", "success");
      setFormData(initialFormData);
      setShowForm(false);
      
      // Refresh submissions
      const res = await studentApi.getMyInternshipPermissions().catch(() => ({ data: [] }));
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      setSubmissions((res as any)?.data || []);
    } catch (err) {
      console.error(err);
      showToast("Failed to submit form. Please try again.", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col h-screen bg-background">
        <Header userName={user?.email || "Student"} userRole="Student" />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
        </div>
      </div>
    );
  }

  const inputClass = "w-full px-4 py-2.5 bg-white border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30";
  const labelClass = "text-sm font-medium text-foreground mb-1.5 block";
  const requiredStar = <span className="text-red-500 ml-1">*</span>;
  const sectionHeaderClass = "text-base font-semibold text-foreground flex items-center gap-2 mb-4 mt-8 pt-4 border-t border-border";

  return (
    <div className="page-enter flex flex-col min-h-screen bg-background">
      <Header userName={user?.email || "Student"} userRole="Student" />
      
      <div className="flex-1 px-4 sm:px-6 md:px-8 pt-6 pb-24 sm:pb-10 max-w-5xl mx-auto w-full">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-foreground">Internship Permission</h1>
          <p className="text-muted-foreground mt-1">Submit and manage your external internship permission requests.</p>
        </div>

        {/* New Request Button */}
        <div className="mb-8">
          <button
            onClick={() => setShowForm(!showForm)}
            className="w-full i-card p-4 flex items-center justify-between hover:border-indigo-500/30 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <Plus className="w-5 h-5" />
              </div>
              <div className="text-left">
                <h3 className="font-semibold text-foreground">New Internship Permission Request</h3>
                <p className="text-sm text-muted-foreground">Fill out the form to request permission for an external internship</p>
              </div>
            </div>
            {showForm ? <ChevronUp className="w-5 h-5 text-muted-foreground" /> : <ChevronDown className="w-5 h-5 text-muted-foreground" />}
          </button>
        </div>

        {/* Form Section */}
        {showForm && (
          <div className="i-card p-6 mb-8 animate-in fade-in slide-in-from-top-4 duration-300">
            <form onSubmit={handleSubmit} className="space-y-6">
              
              {/* Section A */}
              <div>
                <h3 className="text-base font-semibold text-foreground flex items-center gap-2 mb-4">
                  <User className="w-5 h-5 text-indigo-500" />
                  Section A: Student Basic Details
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className={labelClass}>Name</label>
                    <input type="text" className={cn(inputClass, "bg-gray-50")} value={profile?.fullName || ""} disabled />
                  </div>
                  <div>
                    <label className={labelClass}>USN</label>
                    <input type="text" className={cn(inputClass, "bg-gray-50")} value={profile?.usn || ""} disabled />
                  </div>
                  <div>
                    <label className={labelClass}>Branch</label>
                    <input type="text" className={cn(inputClass, "bg-gray-50")} value={profile?.department || ""} disabled />
                  </div>
                  <div>
                    <label className={labelClass}>Student Mobile Number</label>
                    <input type="text" className={cn(inputClass, "bg-gray-50")} value={profile?.phone || ""} disabled />
                  </div>
                  <div>
                    <label className={labelClass}>Personal Email ID</label>
                    <input type="text" className={cn(inputClass, "bg-gray-50")} value={profile?.user?.email || user?.email || ""} disabled />
                  </div>
                  <div>
                    <label className={labelClass}>Mentor Name{requiredStar}</label>
                    <input 
                      type="text" 
                      name="mentorName"
                      className={inputClass} 
                      value={formData.mentorName} 
                      onChange={handleInputChange} 
                      required 
                    />
                  </div>
                </div>
              </div>

              {/* Section B */}
              <div>
                <h3 className={sectionHeaderClass}>
                  <Building2 className="w-5 h-5 text-indigo-500" />
                  Section B: External Internship Details
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
                    <label className={labelClass}>Name of Company / Organization{requiredStar}</label>
                    <input type="text" name="companyName" className={inputClass} value={formData.companyName} onChange={handleInputChange} required />
                  </div>
                  <div>
                    <label className={labelClass}>Company Website</label>
                    <input type="url" name="companyWebsite" className={inputClass} value={formData.companyWebsite} onChange={handleInputChange} />
                  </div>
                  <div>
                    <label className={labelClass}>Internship Domain / Area{requiredStar}</label>
                    <input type="text" name="domain" className={inputClass} value={formData.domain} onChange={handleInputChange} required />
                  </div>
                  <div className="sm:col-span-2">
                    <label className={labelClass}>Company Address</label>
                    <textarea name="companyAddress" className={cn(inputClass, "min-h-[80px]")} value={formData.companyAddress} onChange={handleInputChange}></textarea>
                  </div>
                  <div>
                    <label className={labelClass}>Internship Role / Designation{requiredStar}</label>
                    <input type="text" name="role" className={inputClass} value={formData.role} onChange={handleInputChange} required />
                  </div>
                  <div>
                    <label className={labelClass}>Internship Project / Work Title (if known)</label>
                    <input type="text" name="projectTitle" className={inputClass} value={formData.projectTitle} onChange={handleInputChange} />
                  </div>
                  <div>
                    <label className={labelClass}>Internship Start Date{requiredStar}</label>
                    <input type="date" name="startDate" className={inputClass} value={formData.startDate} onChange={handleInputChange} required />
                  </div>
                  <div>
                    <label className={labelClass}>Internship End Date{requiredStar}</label>
                    <input type="date" name="endDate" className={inputClass} value={formData.endDate} onChange={handleInputChange} required />
                  </div>
                  <div>
                    <label className={labelClass}>Total Duration{requiredStar}</label>
                    <input type="text" name="duration" placeholder="e.g., 2 Months, 8 Weeks" className={inputClass} value={formData.duration} onChange={handleInputChange} required />
                  </div>
                  <div>
                    <label className={labelClass}>Place of Internship / Work Location</label>
                    <input type="text" name="location" className={inputClass} value={formData.location} onChange={handleInputChange} />
                  </div>
                  <div>
                    <label className={labelClass}>Expected Working Hours / Schedule</label>
                    <input type="text" name="expectedHours" placeholder="e.g., 9 AM to 5 PM, Mon-Fri" className={inputClass} value={formData.expectedHours} onChange={handleInputChange} />
                  </div>
                  
                  <div className="sm:col-span-2 space-y-4">
                    <div>
                      <label className={labelClass}>Mode of Internship{requiredStar}</label>
                      <div className="flex flex-wrap gap-4 mt-2">
                        {["On-site", "Remote", "Online", "Hybrid"].map((opt) => (
                          <label key={opt} className="flex items-center gap-2 cursor-pointer">
                            <input type="radio" name="mode" value={opt} checked={formData.mode === opt} onChange={() => handleRadioChange("mode", opt)} className="w-4 h-4 text-indigo-600 border-gray-300 focus:ring-indigo-500" required />
                            <span className="text-sm">{opt}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className={labelClass}>Is the internship related to your academic branch?{requiredStar}</label>
                      <div className="flex flex-wrap gap-4 mt-2">
                        {["Yes", "No", "Partially"].map((opt) => (
                          <label key={opt} className="flex items-center gap-2 cursor-pointer">
                            <input type="radio" name="academicRelated" value={opt} checked={formData.academicRelated === opt} onChange={() => handleRadioChange("academicRelated", opt)} className="w-4 h-4 text-indigo-600 border-gray-300 focus:ring-indigo-500" required />
                            <span className="text-sm">{opt}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Section C */}
              <div>
                <h3 className={sectionHeaderClass}>
                  <Briefcase className="w-5 h-5 text-indigo-500" />
                  Section C: Internship Opportunity Details
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
                    <label className={labelClass}>How was the internship opportunity obtained?{requiredStar}</label>
                    <div className="flex flex-wrap gap-4 mt-2">
                      {["On-Campus", "Off-Campus", "Faculty", "Alumni", "Self", "Internship Portal", "Other"].map((opt) => (
                        <label key={opt} className="flex items-center gap-2 cursor-pointer">
                          <input type="radio" name="opportunitySource" value={opt} checked={formData.opportunitySource === opt} onChange={() => handleRadioChange("opportunitySource", opt)} className="w-4 h-4 text-indigo-600 border-gray-300 focus:ring-indigo-500" required />
                          <span className="text-sm">{opt}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className={labelClass}>Was the opportunity facilitated by the College?{requiredStar}</label>
                    <div className="flex flex-wrap gap-4 mt-2">
                      {["Yes", "No"].map((opt) => (
                        <label key={opt} className="flex items-center gap-2 cursor-pointer">
                          <input type="radio" name="collegeFacilitated" value={opt} checked={formData.collegeFacilitated === opt} onChange={() => handleRadioChange("collegeFacilitated", opt)} className="w-4 h-4 text-indigo-600 border-gray-300 focus:ring-indigo-500" required />
                          <span className="text-sm">{opt}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className={labelClass}>Name of person / source through whom opportunity was obtained</label>
                    <input type="text" name="sourcePersonName" className={inputClass} value={formData.sourcePersonName} onChange={handleInputChange} />
                  </div>
                  
                  <div>
                    <label className={labelClass}>Is a stipend provided?{requiredStar}</label>
                    <div className="flex flex-wrap gap-4 mt-2">
                      {["Yes", "No"].map((opt) => (
                        <label key={opt} className="flex items-center gap-2 cursor-pointer">
                          <input type="radio" name="isStipendProvided" value={opt} checked={formData.isStipendProvided === opt} onChange={() => handleRadioChange("isStipendProvided", opt)} className="w-4 h-4 text-indigo-600 border-gray-300 focus:ring-indigo-500" required />
                          <span className="text-sm">{opt}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                  {formData.isStipendProvided === "Yes" && (
                    <div>
                      <label className={labelClass}>Stipend Amount per Month (if applicable)</label>
                      <input type="text" name="stipendAmount" className={inputClass} value={formData.stipendAmount} onChange={handleInputChange} />
                    </div>
                  )}

                  <div className="sm:col-span-2">
                    <label className={labelClass}>Other benefits provided by company, if any</label>
                    <input type="text" name="otherBenefits" className={inputClass} value={formData.otherBenefits} onChange={handleInputChange} />
                  </div>

                  <div>
                    <label className={labelClass}>Is there a possibility of PPO?{requiredStar}</label>
                    <div className="flex flex-wrap gap-4 mt-2">
                      {["Yes", "No", "Not Confirmed"].map((opt) => (
                        <label key={opt} className="flex items-center gap-2 cursor-pointer">
                          <input type="radio" name="ppoPossibility" value={opt} checked={formData.ppoPossibility === opt} onChange={() => handleRadioChange("ppoPossibility", opt)} className="w-4 h-4 text-indigo-600 border-gray-300 focus:ring-indigo-500" required />
                          <span className="text-sm">{opt}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                  {(formData.ppoPossibility === "Yes" || formData.ppoPossibility === "Not Confirmed") && (
                    <div>
                      <label className={labelClass}>If PPO is possible, mention details/conditions</label>
                      <input type="text" name="ppoDetails" className={inputClass} value={formData.ppoDetails} onChange={handleInputChange} />
                    </div>
                  )}
                </div>
              </div>

              {/* Section D */}
              <div>
                <h3 className={sectionHeaderClass}>
                  <User className="w-5 h-5 text-indigo-500" />
                  Section D: Company / HR / Internship Supervisor Details
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className={labelClass}>Company HR / Authorized Contact Name</label>
                    <input type="text" name="hrName" className={inputClass} value={formData.hrName} onChange={handleInputChange} />
                  </div>
                  <div>
                    <label className={labelClass}>HR / Authorized Contact Designation</label>
                    <input type="text" name="hrDesignation" className={inputClass} value={formData.hrDesignation} onChange={handleInputChange} />
                  </div>
                  <div>
                    <label className={labelClass}>Official HR Email ID</label>
                    <input type="email" name="hrEmail" className={inputClass} value={formData.hrEmail} onChange={handleInputChange} />
                  </div>
                  <div>
                    <label className={labelClass}>HR / Company Contact Number</label>
                    <input type="text" name="hrPhone" className={inputClass} value={formData.hrPhone} onChange={handleInputChange} />
                  </div>
                </div>
              </div>

              {/* Section E */}
              <div>
                <h3 className={sectionHeaderClass}>
                  <FileText className="w-5 h-5 text-indigo-500" />
                  Section E: Documents to be Submitted Before Joining
                </h3>
                <div className="space-y-3">
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input type="checkbox" name="docOfferLetter" checked={formData.docOfferLetter} onChange={handleInputChange} className="mt-1 w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500" />
                    <span className="text-sm">Internship Offer Letter / Internship Appointment Letter issued by the Company</span>
                  </label>
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input type="checkbox" name="docConfirmationEmail" checked={formData.docConfirmationEmail} onChange={handleInputChange} className="mt-1 w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500" />
                    <span className="text-sm">Internship Confirmation Email / Screenshot of confirmation</span>
                  </label>
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input type="checkbox" name="docJobDescription" checked={formData.docJobDescription} onChange={handleInputChange} className="mt-1 w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500" />
                    <span className="text-sm">Internship Job Description / Role Description, if available</span>
                  </label>
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input type="checkbox" name="docJoiningInstructions" checked={formData.docJoiningInstructions} onChange={handleInputChange} className="mt-1 w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500" />
                    <span className="text-sm">Company-issued joining instructions, if available</span>
                  </label>
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input type="checkbox" name="docNoc" checked={formData.docNoc} onChange={handleInputChange} className="mt-1 w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500" />
                    <span className="text-sm">NOC / Permission document, if applicable</span>
                  </label>
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input type="checkbox" name="docOther" checked={formData.docOther} onChange={handleInputChange} className="mt-1 w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500" />
                    <span className="text-sm">Any other supporting document from the Company</span>
                  </label>
                </div>
                <div className="mt-4 p-4 bg-muted/50 rounded-xl border border-border text-sm text-muted-foreground flex gap-3">
                  <AlertCircle className="w-5 h-5 text-indigo-500 shrink-0" />
                  <p>
                    <strong>Document submission note:</strong> The student shall submit/upload clear and authentic copies of the above documents along with this form. The offer letter and confirmation evidence should clearly establish the company, role, internship period and student identity wherever applicable.
                  </p>
                </div>
              </div>

              {/* Section F */}
              <div>
                <h3 className={sectionHeaderClass}>
                  <CheckCircle className="w-5 h-5 text-indigo-500" />
                  Section F: Student Undertaking / Declaration
                </h3>
                <div className="text-sm text-muted-foreground space-y-2 pl-5 list-decimal mb-6">
                  <ol className="list-decimal space-y-2">
                    <li>I hereby declare that the information furnished in this form and the documents submitted by me are true, complete and authentic to the best of my knowledge.</li>
                    <li>I understand that the external internship is subject to verification and approval by the College / Department and that submission of this form does not automatically constitute permission to join the internship.</li>
                    <li>I undertake to follow the rules, regulations, code of conduct and working requirements of both the College and the Company during the internship.</li>
                    <li>I undertake to maintain regular attendance and complete the internship for the approved duration. Any change in company, role, duration, location or other material internship details will be informed to the Department and approval will be obtained wherever required.</li>
                    <li>I understand that the College may contact the Company / HR / Internship Supervisor to verify the internship details, attendance, performance and completion.</li>
                    <li>I undertake that, after completion of the internship, I will submit the Internship Completion Certificate duly issued/authenticated by the Company HR or an authorized Company official, along with proof of attendance/completion.</li>
                    <li>I further undertake to submit the internship report, student feedback, company/HR evaluation and any other document prescribed by the Department within the stipulated time.</li>
                    <li>I understand that failure to submit the required completion documents or submission of false/incorrect information may result in action as per the rules of the Institution.</li>
                  </ol>
                </div>
                <label className="flex items-start gap-3 cursor-pointer p-4 bg-indigo-50/50 rounded-xl border border-indigo-100">
                  <input 
                    type="checkbox" 
                    name="agreedToUndertaking" 
                    checked={formData.agreedToUndertaking} 
                    onChange={handleInputChange} 
                    className="mt-1 w-5 h-5 rounded text-indigo-600 focus:ring-indigo-500 border-indigo-300" 
                    required
                  />
                  <span className="text-sm font-medium text-indigo-900">
                    I have read, understood and agree to the above undertaking and declaration.{requiredStar}
                  </span>
                </label>
              </div>

              {/* Section G */}
              <div>
                <h3 className={sectionHeaderClass}>
                  <FileText className="w-5 h-5 text-indigo-500" />
                  Section G: Request for Permission
                </h3>
                <div className="p-4 bg-gray-50 rounded-xl border border-border text-sm text-foreground">
                  <p>
                    I request the Department to grant me permission to undertake the above-mentioned external internship during the stated period. I confirm that I will comply with the academic, attendance and institutional requirements applicable to external internships.
                  </p>
                </div>
              </div>

              <div className="pt-6 border-t border-border flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-5 py-2.5 text-sm font-medium text-foreground bg-white border border-border rounded-xl hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2.5 text-sm font-medium bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded-xl hover:opacity-90 transition-opacity disabled:opacity-70 flex items-center gap-2"
                >
                  {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  {isSubmitting ? "Submitting..." : "Submit Request"}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Previous Submissions */}
        <div>
          <h2 className="text-lg font-bold text-foreground mb-4">Previous Submissions</h2>
          
          {submissions.length === 0 ? (
            <div className="i-card p-10 flex flex-col items-center justify-center text-center">
              <div className="w-16 h-16 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-500 mb-4">
                <FileText className="w-8 h-8" />
              </div>
              <h3 className="text-base font-semibold text-foreground mb-1">No requests found</h3>
              <p className="text-sm text-muted-foreground max-w-sm">
                You haven't submitted any internship permission requests yet. Click the button above to create one.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {submissions.map((sub) => (
                <div key={sub.id} className="i-card p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <Building2 className="w-4 h-4 text-muted-foreground" />
                      <h3 className="font-semibold text-foreground">{sub.companyName || "Unknown Company"}</h3>
                    </div>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Briefcase className="w-4 h-4" />
                        {sub.domain || "N/A"}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        Submitted on: {new Date(sub.createdAt || Date.now()).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  
                  <Link 
                    href={`/student/internship-permission/${sub.id}/print`}
                    className="flex-shrink-0 flex items-center justify-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 rounded-lg text-sm font-medium transition-colors"
                  >
                    <Download className="w-4 h-4" />
                    Download
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Toast Notification */}
      {toast && (
        <div className={`fixed bottom-6 right-6 px-4 py-3 rounded-lg shadow-lg text-sm font-medium flex items-center gap-2 animate-in slide-in-from-bottom-5 z-50 ${
          toast.type === "success" ? "bg-green-600 text-white" : "bg-red-600 text-white"
        }`}>
          {toast.type === "success" ? <CheckCircle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
          {toast.message}
        </div>
      )}
    </div>
  );
}
