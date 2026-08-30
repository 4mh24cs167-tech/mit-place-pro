"use client";

import Header from "@/components/layout/Header";
import { cn } from "@/lib/utils";
import { studentApi } from "@/lib/api";
import EducationManager from "@/components/education/EducationManager";
import { generateResumePdf, downloadResumePdf, previewResumeHtml } from "@/lib/resume-generator";
import {
  User, Mail, Phone, Calendar, GraduationCap, Award, Globe, Edit3,
  ExternalLink, Loader2, CheckCircle2, AlertCircle, Save, ShieldCheck,
  Code, Camera, X, Plus, FileText, Link2, GitBranch, MapPin, Upload, Eye,
  BookOpen, Building2, Trophy, Sparkles, ChevronDown, ChevronUp, Download,
} from "lucide-react";
import { useState, useEffect, useCallback, useRef } from "react";

/* ────────────────────────────────── Types ─────────────────────────────────── */

interface StudentProfile {
  id: string; usn: string; fullName: string; phone: string | null;
  dateOfBirth: string | null; gender: string | null;
  addressJson: Record<string, string> | null; department: string;
  semester: number | null; cgpa: number | null;
  tenthPercent: number | null; tenthBoard: string | null; tenthYear: number | null;
  twelfthPercent: number | null; twelfthBoard: string | null;
  twelfthYear: number | null; twelfthStream: string | null;
  backlogs: number; driveLink: string | null; resumeLink: string | null;
  familyIncome: number | null;
  category: string | null; profileData: Record<string, unknown>;
  profileComplete: boolean; placementStatus: string;
  photoUrl?: string | null;
  user?: { email: string };
  departmentType?: 'UG' | 'PG' | 'DEGREE';
  totalSemesters?: number;
}

const GENDER_OPTIONS = ["Male", "Female", "Other"];
const CATEGORY_OPTIONS = ["General", "OBC", "SC", "ST", "EWS", "Other"];
const STREAM_OPTIONS = ["Science", "Commerce", "Arts"];
const BOARD_OPTIONS = ["CBSE", "ICSE", "State Board", "IB", "Other"];
const DIPLOMA_BOARD_OPTIONS = ["AICTE", "State Board of Technical Education", "Other"];
const DIPLOMA_BRANCH_OPTIONS = ["Computer Science", "Information Science", "Electronics", "Electrical", "Mechanical", "Civil", "Other"];

/* ────────────────────────────── Stat Ring ─────────────────────────────────── */

function StatRing({ value, max, label, color }: { value: number; max: number; label: string; color: string }) {
  const pct = Math.min((value / max) * 100, 100);
  const r = 28; const c = 2 * Math.PI * r;
  const offset = c - (pct / 100) * c;
  return (
    <div className="flex flex-col items-center gap-1.5">
      <div className="relative w-16 h-16">
        <svg className="w-16 h-16 -rotate-90" viewBox="0 0 64 64">
          <circle cx="32" cy="32" r={r} fill="none" stroke="currentColor" strokeWidth="4" className="text-border/50" />
          <circle cx="32" cy="32" r={r} fill="none" stroke={color} strokeWidth="4"
            strokeDasharray={c} strokeDashoffset={offset} strokeLinecap="round"
            className="transition-all duration-1000 ease-out" />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-sm font-bold text-foreground">{value}</span>
        </div>
      </div>
      <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">{label}</span>
    </div>
  );
}

/* ──────────────────────────── Section Header ──────────────────────────────── */

function SectionHeader({ icon: Icon, title, children }: { icon: React.ElementType; title: string; children?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between mb-4">
      <h3 className="text-sm font-bold text-foreground flex items-center gap-2.5">
        <div className="p-1.5 rounded-lg bg-indigo-50"><Icon className="w-4 h-4 text-indigo-600" /></div>
        {title}
      </h3>
      {children}
    </div>
  );
}

/* ─────────────────────── Inline Input / Select ───────────────────────────── */

function InlineInput({ label, value, onChange, editing, type = "text", placeholder = "", required = false, disabled = false }: {
  label: string; value: string; onChange: (v: string) => void; editing: boolean; type?: string;
  placeholder?: string; required?: boolean; disabled?: boolean;
}) {
  return (
    <div>
      <label className="block text-[10px] font-semibold text-muted-foreground/80 uppercase tracking-wider mb-1.5">
        {label} {required && <span className="text-red-400">*</span>}
      </label>
      {editing && !disabled ? (
        <input type={type} value={value} onChange={(e) => onChange(e.target.value)}
          className={cn("w-full px-3.5 py-2.5 rounded-xl border text-sm outline-none transition-all bg-white/80 backdrop-blur-sm",
            "focus:ring-2 focus:ring-indigo-500/20",
            required && !value ? "border-amber-300 focus:border-amber-500" : "border-border/60 focus:border-indigo-500"
          )} placeholder={placeholder} step={type === "number" ? "0.01" : undefined} />
      ) : (
        <p className="text-sm font-medium text-foreground py-1">{value || <span className="text-muted-foreground/40">—</span>}</p>
      )}
    </div>
  );
}

function InlineSelect({ label, value, onChange, editing, options, required = false }: {
  label: string; value: string; onChange: (v: string) => void; editing: boolean; options: string[]; required?: boolean;
}) {
  return (
    <div>
      <label className="block text-[10px] font-semibold text-muted-foreground/80 uppercase tracking-wider mb-1.5">
        {label} {required && <span className="text-red-400">*</span>}
      </label>
      {editing ? (
        <select value={value} onChange={(e) => onChange(e.target.value)}
          className={cn("w-full px-3.5 py-2.5 rounded-xl border text-sm outline-none transition-all bg-white/80 backdrop-blur-sm",
            "focus:ring-2 focus:ring-indigo-500/20",
            required && !value ? "border-amber-300" : "border-border/60"
          )}>
          <option value="">Select...</option>
          {options.map((o) => <option key={o} value={o}>{o}</option>)}
        </select>
      ) : (
        <p className="text-sm font-medium text-foreground capitalize py-1">{value || <span className="text-muted-foreground/40">—</span>}</p>
      )}
    </div>
  );
}

/* ═══════════════════════════════ MAIN PAGE ════════════════════════════════ */

export default function StudentProfilePage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [toast, setToast] = useState<{ type: "success" | "error"; msg: string } | null>(null);
  const [aboutExpanded, setAboutExpanded] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form fields
  const [form, setForm] = useState({
    fullName: "", phone: "", dateOfBirth: "", gender: "",
    semester: "", cgpa: "", tenthPercent: "", tenthBoard: "", tenthYear: "",
    twelfthPercent: "", twelfthBoard: "", twelfthYear: "", twelfthStream: "",
    backlogs: "0", familyIncome: "", category: "", driveLink: "", resumeLink: "",
    aboutMe: "", linkedin: "", github: "",
    tenthMarksCardLink: "", twelfthMarksCardLink: "",
    qualificationType: "12th" as "12th" | "Diploma",
    diplomaBranch: "",
    collegeName: "",
    ugCourseName: "",
    // PG-specific
    ugDegreeName: "", ugUniversity: "", ugCgpa: "", ugYearOfPassing: "",
  });

  const [skills, setSkills] = useState<string[]>([]);
  const [newSkill, setNewSkill] = useState("");
  const [certifications, setCertifications] = useState<string[]>([]);
  const [newCert, setNewCert] = useState("");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [educationRecords, setEducationRecords] = useState<any[]>([]);
  const [resumeChoice, setResumeChoice] = useState<"" | "yes" | "no">("");
  const [resumePreviewHtml, setResumePreviewHtml] = useState("");
  const [generatingResume, setGeneratingResume] = useState(false);

  const setField = (key: string, val: string) => setForm((p) => ({ ...p, [key]: val }));

  const showToast = (type: "success" | "error", msg: string) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 3500);
  };

  /* ─── Fetch Profile ──────────────────────────────── */
  const fetchProfile = useCallback(async () => {
    try {
      setLoading(true);
      const res = await studentApi.getProfile();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const data = (res as any)?.data as StudentProfile;
      if (data) {
        setProfile(data);
        const pd = (data.profileData || {}) as Record<string, unknown>;
        setForm({
          fullName: data.fullName || "",
          phone: data.phone || "",
          dateOfBirth: data.dateOfBirth ? String(data.dateOfBirth).split("T")[0] : "",
          gender: data.gender || "",
          semester: data.semester?.toString() || "",
          cgpa: data.cgpa?.toString() || "",
          tenthPercent: data.tenthPercent?.toString() || "",
          tenthBoard: data.tenthBoard || "",
          tenthYear: data.tenthYear?.toString() || "",
          twelfthPercent: data.twelfthPercent?.toString() || "",
          twelfthBoard: data.twelfthBoard || "",
          twelfthYear: data.twelfthYear?.toString() || "",
          twelfthStream: data.twelfthStream || "",
          backlogs: data.backlogs?.toString() || "0",
          familyIncome: data.familyIncome?.toString() || "",
          category: data.category || "",
          driveLink: data.driveLink || "",
          resumeLink: data.resumeLink || "",
          aboutMe: (pd.aboutMe as string) || "",
          linkedin: (pd.linkedin as string) || "",
          github: (pd.github as string) || "",
          tenthMarksCardLink: (pd.tenthMarksCardLink as string) || "",
          twelfthMarksCardLink: (pd.twelfthMarksCardLink as string) || "",
          qualificationType: ((pd.qualificationType as string) || "12th") as "12th" | "Diploma",
          diplomaBranch: (pd.diplomaBranch as string) || "",
          collegeName: (pd.collegeName as string) || "",
          ugCourseName: (pd.ugCourseName as string) || "",
          // PG fields
          ugDegreeName: (pd.ugDegreeName as string) || "",
          ugUniversity: (pd.ugUniversity as string) || "",
          ugCgpa: (pd.ugCgpa as number)?.toString() || "",
          ugYearOfPassing: (pd.ugYearOfPassing as number)?.toString() || "",
        });
        setSkills((pd.skills as string[]) || []);
        setCertifications((pd.certifications as string[]) || []);
        if (!data.profileComplete) setEditing(true);
      }
    } catch { /* silently handle */ } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchProfile(); }, [fetchProfile]);

  // Fetch education records for Academic Highlights
  useEffect(() => {
    studentApi.getEducations().then((res: any) => {
      setEducationRecords(res?.data || []);
    }).catch(() => {});
  }, []);

  /* ─── Photo Upload ───────────────────────────────── */
  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const maxSize = 2 * 1024 * 1024;
    if (file.size > maxSize) {
      showToast("error", "Image must be under 2MB");
      return;
    }
    const validTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!validTypes.includes(file.type)) {
      showToast("error", "Only JPEG, PNG, or WebP images allowed");
      return;
    }

    try {
      setUploadingPhoto(true);
      const res = await studentApi.uploadProfilePhoto(file);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const photoUrl = (res as any)?.data?.photoUrl;
      if (photoUrl && profile) {
        setProfile({ ...profile, photoUrl });
      }
      showToast("success", "Profile photo updated!");
    } catch {
      showToast("error", "Failed to upload photo");
    } finally {
      setUploadingPhoto(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  /* ─── Add / Remove Skills ────────────────────────── */
  const addSkill = () => {
    const s = newSkill.trim();
    if (s && !skills.includes(s)) {
      setSkills([...skills, s]);
      setNewSkill("");
    }
  };
  const removeSkill = (s: string) => setSkills(skills.filter((x) => x !== s));

  /* ─── Add / Remove Certifications ────────────────── */
  const addCert = () => {
    const c = newCert.trim();
    if (c && !certifications.includes(c)) {
      setCertifications([...certifications, c]);
      setNewCert("");
    }
  };
  const removeCert = (c: string) => setCertifications(certifications.filter((x) => x !== c));

  /* ─── Save ───────────────────────────────────────── */
  const mandatoryFilled = !!(
    form.fullName && form.phone && form.dateOfBirth && form.gender
  );

  const handleSave = async () => {
    if (!profile) return;
    if (!mandatoryFilled) {
      showToast("error", "Please fill all required fields (marked with *)");
      return;
    }
    try {
      setSaving(true);
      await studentApi.updateProfile({
        fullName: form.fullName || undefined,
        phone: form.phone || undefined,
        dateOfBirth: form.dateOfBirth || undefined,
        gender: form.gender || undefined,
        semester: form.semester ? parseInt(form.semester) : undefined,
        cgpa: form.cgpa ? parseFloat(form.cgpa) : undefined,
        tenthPercent: form.tenthPercent ? parseFloat(form.tenthPercent) : undefined,
        tenthBoard: form.tenthBoard || undefined,
        tenthYear: form.tenthYear ? parseInt(form.tenthYear) : undefined,
        twelfthPercent: form.twelfthPercent ? parseFloat(form.twelfthPercent) : undefined,
        twelfthBoard: form.twelfthBoard || undefined,
        twelfthYear: form.twelfthYear ? parseInt(form.twelfthYear) : undefined,
        twelfthStream: form.twelfthStream || undefined,
        activeBacklogs: form.backlogs ? parseInt(form.backlogs) : 0,
        familyIncome: form.familyIncome ? parseInt(form.familyIncome) : undefined,
        category: form.category || undefined,
        driveLink: form.driveLink || undefined,
        resumeLink: form.resumeLink || undefined,
        skills,
        certifications,
        aboutMe: form.aboutMe || undefined,
        linkedin: form.linkedin || undefined,
        github: form.github || undefined,
        tenthMarksCardLink: form.tenthMarksCardLink || undefined,
        twelfthMarksCardLink: form.twelfthMarksCardLink || undefined,
        profileData: {
          qualificationType: form.qualificationType,
          diplomaBranch: form.diplomaBranch || undefined,
          collegeName: form.collegeName || undefined,
          ugCourseName: form.ugCourseName || undefined,
        },
        // PG-specific fields
        ugDegreeName: form.ugDegreeName || undefined,
        ugUniversity: form.ugUniversity || undefined,
        ugCgpa: form.ugCgpa ? parseFloat(form.ugCgpa) : undefined,
        ugYearOfPassing: form.ugYearOfPassing ? parseInt(form.ugYearOfPassing) : undefined,
      });
      showToast("success", "Profile updated successfully!");
      setEditing(false);
      fetchProfile();
    } catch {
      showToast("error", "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  const placementLabel: Record<string, { label: string; color: string; bg: string }> = {
    none: { label: "Not Applied", color: "text-slate-500", bg: "bg-slate-100" },
    shortlisted: { label: "Shortlisted", color: "text-blue-600", bg: "bg-blue-50" },
    interview_scheduled: { label: "Interview", color: "text-violet-600", bg: "bg-violet-50" },
    offered: { label: "Offered", color: "text-amber-600", bg: "bg-amber-50" },
    placed: { label: "Placed ✓", color: "text-emerald-600", bg: "bg-emerald-50" },
    not_placed: { label: "Not Placed", color: "text-red-600", bg: "bg-red-50" },
  };

  /* ═══════════════════════════════ RENDER ═════════════════════════════════ */

  if (loading) {
    return (
      <div className="page-enter">
        <Header userName="Student" userRole="Student" greeting="My Profile" subtitle="Loading..." />
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
          <p className="text-sm text-muted-foreground">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="page-enter">
        <Header userName="Student" userRole="Student" greeting="My Profile" subtitle="" />
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <AlertCircle className="w-10 h-10 text-muted-foreground/40" />
          <p className="text-sm text-muted-foreground">Profile not found</p>
        </div>
      </div>
    );
  }

  const st = placementLabel[profile.placementStatus] || placementLabel.none;
  const aboutMe = form.aboutMe || "";

  return (
    <div className="page-enter">
      <Header userName={profile.fullName || "Student"} userRole="Student"
        greeting={!profile.profileComplete ? "Complete Your Profile" : "My Profile"}
        subtitle={!profile.profileComplete ? "Fill in all required fields to access placement features" : ""} />

      {/* Toast */}
      {toast && (
        <div className={cn("fixed top-6 right-6 z-50 flex items-center gap-2.5 px-5 py-3 rounded-2xl shadow-2xl text-sm font-semibold",
          "animate-in slide-in-from-top-2 backdrop-blur-md",
          toast.type === "success" ? "bg-emerald-600/95 text-white" : "bg-red-600/95 text-white")}>
          {toast.type === "success" ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          {toast.msg}
        </div>
      )}

      {/* Hidden file input */}
      <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp"
        className="hidden" onChange={handlePhotoUpload} id="profile-photo-input" aria-label="Upload profile photo" />

      <div className="px-4 sm:px-6 md:px-8 pb-28 md:pb-10 space-y-5 max-w-5xl mx-auto">

        {/* ────────── Incomplete Banner ────────── */}
        {!profile.profileComplete && (
          <div className="flex items-center gap-3 p-4 rounded-2xl bg-gradient-to-r from-amber-50 via-orange-50 to-amber-50 border border-amber-200/80">
            <div className="p-2 rounded-xl bg-amber-100">
              <AlertCircle className="w-5 h-5 text-amber-600" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-bold text-amber-800">Profile Incomplete</p>
              <p className="text-xs text-amber-600">Fill all fields marked with * to unlock placement features.</p>
            </div>
          </div>
        )}

        {/* ════════════════════ HERO CARD ═════════════════════ */}
        <div className="i-card overflow-hidden">
          {/* Cover Banner */}
          <div className="h-32 sm:h-40 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-600 via-violet-600 to-purple-700" />
            <div className="absolute inset-0 opacity-[0.08]"
              style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")` }} />
            {/* Floating sparkle */}
            <div className="absolute top-4 right-4 sm:top-6 sm:right-6">
              <Sparkles className="w-5 h-5 text-white/30" />
            </div>
          </div>

          {/* Profile Info Area */}
          <div className="relative px-5 sm:px-8 pb-6">
            {/* Avatar */}
            <div className="relative -mt-14 sm:-mt-16 mb-4">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingPhoto}
                className="group relative w-24 h-24 sm:w-28 sm:h-28 rounded-full border-4 border-white shadow-xl overflow-hidden bg-gradient-to-br from-indigo-500 to-violet-600 cursor-pointer focus:outline-none focus:ring-4 focus:ring-indigo-500/20"
                aria-label="Change profile photo"
              >
                {profile.photoUrl ? (
                  <img src={profile.photoUrl} alt={profile.fullName}
                    className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-white text-2xl sm:text-3xl font-bold">
                    {profile.fullName?.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                  </div>
                )}
                {/* Camera overlay */}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all flex items-center justify-center">
                  {uploadingPhoto ? (
                    <Loader2 className="w-6 h-6 text-white animate-spin" />
                  ) : (
                    <Camera className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                  )}
                </div>
              </button>
            </div>

            {/* Name / Info Row */}
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
              <div className="min-w-0">
                <h1 className="text-xl sm:text-2xl font-extrabold text-foreground tracking-tight">{profile.fullName}</h1>
                <p className="text-sm text-muted-foreground mt-1 flex items-center gap-2 flex-wrap">
                  <span className="font-medium">{profile.usn}</span>
                  <span className="text-border">·</span>
                  <span className="flex items-center gap-1"><Building2 className="w-3.5 h-3.5" />{profile.department}</span>
                  {profile.semester && (
                    <>
                      <span className="text-border">·</span>
                      <span>Sem {profile.semester}</span>
                    </>
                  )}
                </p>
                {/* Badges */}
                <div className="flex items-center gap-2 mt-3 flex-wrap">
                  <span className={cn("text-[10px] font-bold px-3 py-1.5 rounded-full uppercase tracking-wide", st.bg, st.color)}>{st.label}</span>
                  {profile.profileComplete && (
                    <span className="text-[10px] font-bold px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-600 inline-flex items-center gap-1 uppercase tracking-wide">
                      <ShieldCheck className="w-3 h-3" /> Verified
                    </span>
                  )}
                </div>
                {/* Social Links */}
                {(form.linkedin || form.github || profile.user?.email) && !editing && (
                  <div className="flex items-center gap-3 mt-3">
                    {profile.user?.email && (
                      <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Mail className="w-3.5 h-3.5" />{profile.user.email}
                      </span>
                    )}
                    {form.linkedin && (
                      <a href={form.linkedin} target="_blank" rel="noopener noreferrer"
                        className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 font-medium">
                        <Globe className="w-3.5 h-3.5" />LinkedIn
                      </a>
                    )}
                    {form.github && (
                      <a href={form.github} target="_blank" rel="noopener noreferrer"
                        className="flex items-center gap-1 text-xs text-slate-700 hover:text-slate-900 font-medium">
                        <GitBranch className="w-3.5 h-3.5" />GitHub
                      </a>
                    )}
                  </div>
                )}
              </div>

              {/* Edit / Save Button */}
              <button onClick={() => { if (editing) handleSave(); else setEditing(true); }} disabled={saving}
                className={cn("flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all shrink-0",
                  editing
                    ? "bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-lg shadow-indigo-500/25 hover:shadow-xl hover:shadow-indigo-500/30 active:scale-[0.98]"
                    : "bg-white border border-border/60 text-foreground hover:bg-muted/60 shadow-sm")}>
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : editing ? <Save className="w-4 h-4" /> : <Edit3 className="w-4 h-4" />}
                {editing ? (saving ? "Saving..." : "Save Profile") : "Edit Profile"}
              </button>
            </div>
          </div>
        </div>

        {/* ════════════════ ABOUT SECTION ═════════════════ */}
        <div className="i-card p-5 sm:p-6">
          <SectionHeader icon={User} title="About" />
          {editing ? (
            <div className="space-y-3">
              <textarea value={form.aboutMe} onChange={(e) => setField("aboutMe", e.target.value)}
                rows={3} maxLength={1000} placeholder="Write a brief summary about yourself, your interests, and career goals..."
                className="w-full px-4 py-3 rounded-xl border border-border/60 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 bg-white/80 resize-none transition-all" />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <InlineInput label="LinkedIn URL" value={form.linkedin} onChange={(v) => setField("linkedin", v)}
                  editing={editing} placeholder="https://linkedin.com/in/yourname" />
                <InlineInput label="GitHub URL" value={form.github} onChange={(v) => setField("github", v)}
                  editing={editing} placeholder="https://github.com/yourname" />
              </div>
            </div>
          ) : (
            <div>
              {aboutMe ? (
                <div>
                  <p className={cn("text-sm text-muted-foreground leading-relaxed", !aboutExpanded && aboutMe.length > 200 && "line-clamp-3")}>
                    {aboutMe}
                  </p>
                  {aboutMe.length > 200 && (
                    <button onClick={() => setAboutExpanded(!aboutExpanded)}
                      className="flex items-center gap-1 text-xs font-semibold text-indigo-600 mt-2 hover:text-indigo-700">
                      {aboutExpanded ? <><ChevronUp className="w-3 h-3" />Show less</> : <><ChevronDown className="w-3 h-3" />Show more</>}
                    </button>
                  )}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground/50 italic">No bio added yet. Click Edit to add one.</p>
              )}
            </div>
          )}
        </div>

        {/* ════════════════ ACADEMIC STATS BAR ═════════════════ */}
        <div className="i-card p-5 sm:p-6">
          <SectionHeader icon={Trophy} title="Academic Highlights" />
          {(() => {
            const sslc = educationRecords.find((r: any) => r.qualificationType === "SSLC");
            const puc = educationRecords.find((r: any) => r.qualificationType === "PUC");
            const diploma = educationRecords.find((r: any) => r.qualificationType === "DIPLOMA");
            const ug = educationRecords.find((r: any) => r.qualificationType === "UG");
            const twelfthRec = puc || diploma;
            const tenthPct = Number(sslc?.percentage) || 0;
            const twelfthPct = Number(twelfthRec?.percentage) || 0;
            const ugCgpa = Number(ug?.cgpa) || Number(ug?.percentage) || Number(form.cgpa) || 0;
            return (
              <div className="flex items-center justify-around flex-wrap gap-4">
                <StatRing value={ugCgpa > 10 ? ugCgpa : ugCgpa} max={ugCgpa > 10 ? 100 : 10} label="CGPA" color="#6366f1" />
                <StatRing value={tenthPct} max={100} label="10th %" color="#10b981" />
                <StatRing value={twelfthPct} max={100} label={diploma ? "Diploma %" : "12th %"} color="#8b5cf6" />
                <div className="flex flex-col items-center gap-1.5">
                  <div className="w-16 h-16 rounded-full border-4 flex items-center justify-center"
                    style={{ borderColor: Number(form.backlogs) === 0 ? "#10b981" : "#ef4444" }}>
                    <span className="text-sm font-bold text-foreground">{form.backlogs || "0"}</span>
                  </div>
                  <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">Backlogs</span>
                </div>
              </div>
            );
          })()}
        </div>

        {/* ════════════════ MAIN CONTENT GRID ═════════════════ */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

          {/* ─── LEFT COLUMN (2/3) ─── */}
          <div className="lg:col-span-2 space-y-5">

            {/* Education & Qualifications */}
            <div className="i-card p-5 sm:p-6">
              <SectionHeader icon={GraduationCap} title="Education & Qualifications" />
              <EducationManager editing={editing} />
            </div>

            {/* Skills */}
            <div className="i-card p-5 sm:p-6">
              <SectionHeader icon={Code} title="Skills">
                {!editing && skills.length > 0 && (
                  <span className="text-[10px] font-bold text-muted-foreground bg-muted px-2.5 py-1 rounded-full">{skills.length} skills</span>
                )}
              </SectionHeader>
              {editing && (
                <div className="flex gap-2 mb-4">
                  <input value={newSkill} onChange={(e) => setNewSkill(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addSkill(); } }}
                    placeholder="Type a skill and press Enter..."
                    className="flex-1 px-3.5 py-2.5 rounded-xl border border-border/60 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 bg-white/80 transition-all" />
                  <button onClick={addSkill} type="button"
                    className="px-4 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-bold hover:bg-indigo-700 transition-colors flex items-center gap-1.5 shrink-0">
                    <Plus className="w-4 h-4" />Add
                  </button>
                </div>
              )}
              {skills.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {skills.map((s) => (
                    <span key={s} className={cn(
                      "inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-xl transition-all",
                      "bg-gradient-to-r from-indigo-50 to-violet-50 text-indigo-700 border border-indigo-100/60"
                    )}>
                      {s}
                      {editing && (
                        <button onClick={() => removeSkill(s)} type="button" className="hover:text-red-500 transition-colors" aria-label={`Remove ${s}`}>
                          <X className="w-3 h-3" />
                        </button>
                      )}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground/50 italic">{editing ? "Add your technical and soft skills" : "No skills added yet"}</p>
              )}
            </div>

            {/* Certifications */}
            <div className="i-card p-5 sm:p-6">
              <SectionHeader icon={Award} title="Certifications">
                {!editing && certifications.length > 0 && (
                  <span className="text-[10px] font-bold text-muted-foreground bg-muted px-2.5 py-1 rounded-full">{certifications.length}</span>
                )}
              </SectionHeader>
              {editing && (
                <div className="flex gap-2 mb-4">
                  <input value={newCert} onChange={(e) => setNewCert(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addCert(); } }}
                    placeholder="e.g. AWS Cloud Practitioner, NPTEL Java..."
                    className="flex-1 px-3.5 py-2.5 rounded-xl border border-border/60 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 bg-white/80 transition-all" />
                  <button onClick={addCert} type="button"
                    className="px-4 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-bold hover:bg-indigo-700 transition-colors flex items-center gap-1.5 shrink-0">
                    <Plus className="w-4 h-4" />Add
                  </button>
                </div>
              )}
              {certifications.length > 0 ? (
                <div className="space-y-2.5">
                  {certifications.map((c, i) => (
                    <div key={c} className="flex items-center gap-3 group">
                      <div className="flex flex-col items-center">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-sm">
                          <Award className="w-4 h-4 text-white" />
                        </div>
                        {i < certifications.length - 1 && <div className="w-px h-3 bg-border/40 mt-1" />}
                      </div>
                      <div className="flex-1 flex items-center justify-between py-1">
                        <span className="text-sm font-medium text-foreground">{c}</span>
                        {editing && (
                          <button onClick={() => removeCert(c)} type="button"
                            className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-600 transition-all" aria-label={`Remove ${c}`}>
                            <X className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground/50 italic">{editing ? "Add your certifications and achievements" : "No certifications added"}</p>
              )}
            </div>
          </div>

          {/* ─── RIGHT COLUMN (1/3) ─── */}
          <div className="space-y-5">

            {/* Personal Info */}
            <div className="i-card p-5 sm:p-6">
              <SectionHeader icon={User} title="Personal Info" />
              <div className="space-y-3">
                <InlineInput label="Full Name" value={form.fullName} onChange={(v) => setField("fullName", v)} editing={editing} required placeholder="John Doe" />
                <InlineInput label="Phone" value={form.phone} onChange={(v) => setField("phone", v)} editing={editing} required placeholder="+91 9876543210" />
                <InlineInput label="Date of Birth" value={form.dateOfBirth} onChange={(v) => setField("dateOfBirth", v)} editing={editing} type="date" required />
                <InlineSelect label="Gender" value={form.gender} onChange={(v) => setField("gender", v)} editing={editing} options={GENDER_OPTIONS} required />
                <InlineSelect label="Category" value={form.category} onChange={(v) => setField("category", v)} editing={editing} options={CATEGORY_OPTIONS} />
                <InlineInput label="Family Income (₹/yr)" value={form.familyIncome} onChange={(v) => setField("familyIncome", v)} editing={editing} type="number" placeholder="500000" />
                {/* Email (read-only) */}
                <div className="pt-2 border-t border-border/40">
                  <label className="block text-[10px] font-semibold text-muted-foreground/80 uppercase tracking-wider mb-1.5">Email</label>
                  <p className="text-sm text-muted-foreground flex items-center gap-2"><Mail className="w-3.5 h-3.5" />{profile.user?.email || "—"}</p>
                </div>
              </div>
            </div>


            {/* Resume */}
            <div className="i-card p-5 sm:p-6">
              <SectionHeader icon={FileText} title="Resume" />
              <div className="space-y-4">
                {/* Show existing resume if saved */}
                {form.resumeLink && !editing && (
                  form.resumeLink.startsWith("uploaded:") ? (
                    <a href={studentApi.getResumeDownloadUrl()} target="_blank" rel="noopener noreferrer"
                      className="flex items-center justify-between p-3 rounded-xl bg-indigo-50/50 border border-indigo-100 hover:bg-indigo-50 transition-colors group">
                      <span className="flex items-center gap-2 text-sm font-medium text-indigo-700"><FileText className="w-4 h-4" />View Resume — {form.resumeLink.replace("uploaded:", "")}</span>
                      <ExternalLink className="w-4 h-4 text-indigo-400 group-hover:text-indigo-600" />
                    </a>
                  ) : (
                    <a href={form.resumeLink} target="_blank" rel="noopener noreferrer"
                      className="flex items-center justify-between p-3 rounded-xl bg-indigo-50/50 border border-indigo-100 hover:bg-indigo-50 transition-colors group">
                      <span className="flex items-center gap-2 text-sm font-medium text-indigo-700"><FileText className="w-4 h-4" />View Resume</span>
                      <ExternalLink className="w-4 h-4 text-indigo-400 group-hover:text-indigo-600" />
                    </a>
                  )
                )}

                {editing && (
                  <div className="space-y-4">
                    <p className="text-sm font-medium text-foreground">Do you already have a resume?</p>
                    <div className="flex gap-3">
                      <button
                        onClick={() => { setResumeChoice("yes"); setResumePreviewHtml(""); }}
                        className={cn("flex-1 py-3 px-4 rounded-xl border-2 text-sm font-semibold transition-all",
                          resumeChoice === "yes" ? "border-indigo-500 bg-indigo-50 text-indigo-700" : "border-border hover:border-indigo-300 text-muted-foreground"
                        )}
                      >
                        ✅ Yes, I have a Resume
                      </button>
                      <button
                        onClick={() => setResumeChoice("no")}
                        className={cn("flex-1 py-3 px-4 rounded-xl border-2 text-sm font-semibold transition-all",
                          resumeChoice === "no" ? "border-violet-500 bg-violet-50 text-violet-700" : "border-border hover:border-violet-300 text-muted-foreground"
                        )}
                      >
                        📝 No, Create a Resume for Me
                      </button>
                    </div>

                    {/* YES path — upload file or paste link */}
                    {resumeChoice === "yes" && (
                      <div className="space-y-3 p-4 rounded-xl bg-indigo-50/30 border border-indigo-100/50">
                        {/* Direct Upload */}
                        <div>
                          <label className="block text-[10px] font-semibold text-muted-foreground uppercase mb-2">Upload Resume (PDF / DOC / DOCX, max 2MB)</label>
                          <label className="flex items-center gap-3 px-4 py-3 rounded-xl border-2 border-dashed border-indigo-200 hover:border-indigo-400 cursor-pointer transition-colors bg-white">
                            <Upload className="w-5 h-5 text-indigo-500 shrink-0" />
                            <span className="text-xs text-muted-foreground">Click to select your resume file</span>
                            <input type="file" accept=".pdf,.doc,.docx" className="hidden" onChange={async (e) => {
                              const file = e.target.files?.[0];
                              if (!file) return;
                              if (file.size > 2 * 1024 * 1024) { showToast("error", "File must be under 2MB"); return; }
                              try {
                                await studentApi.uploadResume(file);
                                setField("resumeLink", `uploaded:${file.name}`);
                                showToast("success", `Resume "${file.name}" uploaded!`);
                              } catch { showToast("error", "Failed to upload resume"); }
                            }} />
                          </label>
                          {form.resumeLink?.startsWith("uploaded:") && (
                            <p className="text-xs text-emerald-600 font-medium mt-2 flex items-center gap-1.5">
                              <CheckCircle2 className="w-3.5 h-3.5" /> Uploaded: {form.resumeLink.replace("uploaded:", "")}
                            </p>
                          )}
                        </div>
                        {/* Or paste link */}
                        <div className="pt-2 border-t border-border/30">
                          <p className="text-[10px] text-muted-foreground mb-1.5">Or paste a link instead:</p>
                          <InlineInput label="Resume Link (Google Drive / URL)" value={form.resumeLink?.startsWith("uploaded:") ? "" : form.resumeLink} onChange={(v) => setField("resumeLink", v)}
                            editing={editing} placeholder="https://drive.google.com/..." />
                        </div>
                      </div>
                    )}

                    {/* NO path — auto-generate */}
                    {resumeChoice === "no" && (
                      <div className="space-y-3 p-4 rounded-xl bg-violet-50/30 border border-violet-100/50">
                        <p className="text-xs text-muted-foreground">
                          We&apos;ll create a professional, ATS-friendly resume using your profile details — personal info, education, skills, certifications, and more.
                        </p>

                        <div className="flex gap-3">
                          <button
                            onClick={() => {
                              const html = previewResumeHtml({
                                fullName: form.fullName, email: profile?.user?.email || "", phone: form.phone,
                                gender: form.gender, category: form.category, aboutMe: form.aboutMe,
                                skills, certifications, department: profile?.department,
                                educationRecords, linkedin: form.linkedin, github: form.github,
                              });
                              setResumePreviewHtml(html);
                            }}
                            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-violet-100 text-violet-700 text-xs font-semibold hover:bg-violet-200 transition-colors"
                          >
                            <Eye className="w-3.5 h-3.5" /> Preview Resume
                          </button>

                          <button
                            disabled={generatingResume}
                            onClick={async () => {
                              setGeneratingResume(true);
                              try {
                                const blob = await generateResumePdf({
                                  fullName: form.fullName, email: profile?.user?.email || "", phone: form.phone,
                                  gender: form.gender, category: form.category, aboutMe: form.aboutMe,
                                  skills, certifications, department: profile?.department,
                                  educationRecords, linkedin: form.linkedin, github: form.github,
                                });
                                downloadResumePdf(blob, `${(form.fullName || "resume").replace(/\s+/g, "_")}_Resume.pdf`);
                                showToast("success", "Resume downloaded!");
                              } catch {
                                showToast("error", "Failed to generate resume");
                              } finally {
                                setGeneratingResume(false);
                              }
                            }}
                            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white text-xs font-semibold hover:opacity-90 transition-opacity"
                          >
                            {generatingResume ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
                            Download as PDF
                          </button>
                        </div>

                        {/* Resume Preview */}
                        {resumePreviewHtml && (
                          <div className="mt-4 border border-border rounded-xl overflow-hidden">
                            <div className="flex items-center justify-between px-4 py-2 bg-muted/50 border-b border-border">
                              <span className="text-xs font-semibold text-muted-foreground">Resume Preview</span>
                              <button onClick={() => setResumePreviewHtml("")} className="p-1 rounded hover:bg-muted"><X className="w-3.5 h-3.5" /></button>
                            </div>
                            <div className="p-4 bg-white max-h-[500px] overflow-y-auto" dangerouslySetInnerHTML={{ __html: resumePreviewHtml }} />
                          </div>
                        )}
                      </div>
                    )}

                    {!resumeChoice && !form.resumeLink && (
                      <p className="text-xs text-muted-foreground/50 italic">Choose an option above to set up your resume</p>
                    )}
                  </div>
                )}

                {!editing && !form.resumeLink && (
                  <p className="text-xs text-muted-foreground/50 italic">No resume added yet. Click Edit to add one.</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ════════════════ COMPLETE AND SAVE ═════════════════ */}
        {editing && (
          <div className="i-card p-5 sm:p-6">
            {(() => {
              const missing: string[] = [];
              if (!form.fullName) missing.push("Full Name");
              if (!form.phone) missing.push("Phone");
              if (!form.dateOfBirth) missing.push("Date of Birth");
              if (!form.gender) missing.push("Gender");
              if (educationRecords.length === 0) missing.push("At least 1 Education Qualification");
              if (!form.resumeLink) missing.push("Resume (upload or link)");
              if (skills.length === 0) missing.push("At least 1 Skill");

              return (
                <div className="space-y-4">
                  {missing.length > 0 && (
                    <div className="p-4 rounded-xl bg-amber-50 border border-amber-200">
                      <h3 className="text-sm font-bold text-amber-800 flex items-center gap-2 mb-2">
                        <AlertCircle className="w-4 h-4" /> Complete these before saving:
                      </h3>
                      <ul className="list-disc list-inside text-xs text-amber-700 space-y-1">
                        {missing.map((m) => <li key={m}>{m}</li>)}
                      </ul>
                    </div>
                  )}

                  <button
                    onClick={handleSave}
                    disabled={saving || missing.length > 0}
                    className={cn(
                      "w-full flex items-center justify-center gap-3 py-4 rounded-2xl text-base font-bold shadow-xl transition-all active:scale-[0.98]",
                      missing.length > 0
                        ? "bg-muted text-muted-foreground cursor-not-allowed"
                        : "bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-emerald-500/30 hover:shadow-2xl"
                    )}
                  >
                    {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle2 className="w-5 h-5" />}
                    {saving ? "Saving..." : missing.length > 0 ? `Complete ${missing.length} field${missing.length > 1 ? "s" : ""} above` : "✅ Complete & Save Profile"}
                  </button>
                </div>
              );
            })()}
          </div>
        )}

        {/* ────────── Mobile Floating Save Button ────────── */}
        {editing && (
          <div className="fixed bottom-24 left-0 right-0 px-4 md:hidden z-40">
            <button onClick={handleSave} disabled={saving} type="button"
              className="w-full flex items-center justify-center gap-2.5 py-3.5 rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-bold text-sm shadow-2xl shadow-indigo-500/30 active:scale-[0.98] transition-transform">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {saving ? "Saving..." : `Save Profile${!mandatoryFilled ? " (Fill required fields)" : ""}`}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
