"use client";

import Header from "@/components/layout/Header";
import { cn } from "@/lib/utils";
import { studentApi } from "@/lib/api";
import {
  User, Mail, Phone, Calendar, GraduationCap, Award, Globe, Edit3, ExternalLink, GitBranch,
  Loader2, CheckCircle2, AlertCircle, Save, ShieldCheck, Code, Briefcase, Plus,
} from "lucide-react";
import { useState, useEffect, useCallback } from "react";

interface StudentProfile {
  id: string; usn: string; fullName: string; phone: string | null;
  dateOfBirth: string | null; gender: string | null;
  addressJson: Record<string, string> | null; department: string;
  semester: number | null; cgpa: number | null;
  tenthPercent: number | null; tenthBoard: string | null; tenthYear: number | null;
  twelfthPercent: number | null; twelfthBoard: string | null;
  twelfthYear: number | null; twelfthStream: string | null;
  backlogs: number; driveLink: string | null; familyIncome: number | null;
  category: string | null; profileData: Record<string, unknown>;
  profileComplete: boolean; placementStatus: string;
  user?: { email: string };
}

const GENDER_OPTIONS = ["Male", "Female", "Other"];
const CATEGORY_OPTIONS = ["General", "OBC", "SC", "ST", "EWS", "Other"];
const STREAM_OPTIONS = ["Science", "Commerce", "Arts"];
const BOARD_OPTIONS = ["CBSE", "ICSE", "State Board", "IB", "Other"];

export default function StudentProfilePage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [toast, setToast] = useState<{ type: "success" | "error"; msg: string } | null>(null);

  // Form fields
  const [form, setForm] = useState({
    fullName: "", phone: "", dateOfBirth: "", gender: "",
    semester: "", cgpa: "", tenthPercent: "", tenthBoard: "", tenthYear: "",
    twelfthPercent: "", twelfthBoard: "", twelfthYear: "", twelfthStream: "",
    backlogs: "0", familyIncome: "", category: "", driveLink: "",
  });

  const setField = (key: string, val: string) => setForm((p) => ({ ...p, [key]: val }));

  const fetchProfile = useCallback(async () => {
    try {
      setLoading(true);
      const res = await studentApi.getProfile();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const data = (res as any)?.data as StudentProfile;
      if (data) {
        setProfile(data);
        setForm({
          fullName: data.fullName || "",
          phone: data.phone || "",
          dateOfBirth: data.dateOfBirth ? data.dateOfBirth.split("T")[0] : "",
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
        });
        // Auto-enter edit mode if profile is incomplete
        if (!data.profileComplete) setEditing(true);
      }
    } catch { /* silently handle */ } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchProfile(); }, [fetchProfile]);

  const mandatoryFilled = !!(
    form.fullName && form.phone && form.dateOfBirth && form.gender &&
    form.tenthPercent && form.twelfthPercent && form.cgpa
  );

  const handleSave = async () => {
    if (!profile) return;
    if (!mandatoryFilled) {
      setToast({ type: "error", msg: "Please fill all required fields (marked with *)" });
      setTimeout(() => setToast(null), 3000);
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
      });
      setToast({ type: "success", msg: "Profile updated successfully!" });
      setEditing(false);
      fetchProfile();
    } catch {
      setToast({ type: "error", msg: "Failed to update profile" });
    } finally {
      setSaving(false);
      setTimeout(() => setToast(null), 3000);
    }
  };

  const skills = (profile?.profileData?.skills as string[]) || [];
  const certifications = (profile?.profileData?.certifications as string[]) || [];
  const linkedin = (profile?.profileData?.linkedin as string) || "";
  const github = (profile?.profileData?.github as string) || "";

  const placementLabel: Record<string, { label: string; color: string; bg: string }> = {
    none: { label: "Not Applied", color: "text-slate-500", bg: "bg-slate-50" },
    shortlisted: { label: "Shortlisted", color: "text-blue-600", bg: "bg-blue-50" },
    interview_scheduled: { label: "Interview", color: "text-violet-600", bg: "bg-violet-50" },
    offered: { label: "Offered", color: "text-amber-600", bg: "bg-amber-50" },
    placed: { label: "Placed", color: "text-emerald-600", bg: "bg-emerald-50" },
    not_placed: { label: "Not Placed", color: "text-red-600", bg: "bg-red-50" },
  };

  // Reusable input component
  const InputField = ({ label, value, onChange, type = "text", placeholder = "", required = false, disabled = false }: {
    label: string; value: string; onChange: (v: string) => void; type?: string;
    placeholder?: string; required?: boolean; disabled?: boolean;
  }) => (
    <div>
      <label className="block text-[10px] font-semibold text-muted-foreground uppercase mb-1.5">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {editing && !disabled ? (
        <input type={type} value={value} onChange={(e) => onChange(e.target.value)}
          className={cn("w-full px-3 py-2 rounded-lg border text-sm outline-none transition-colors bg-white",
            required && !value ? "border-amber-300 focus:border-amber-500" : "border-border focus:border-indigo-500"
          )} placeholder={placeholder} step={type === "number" ? "0.01" : undefined} />
      ) : (
        <p className="text-sm font-medium text-foreground">{value || "—"}</p>
      )}
    </div>
  );

  const SelectField = ({ label, value, onChange, options, required = false }: {
    label: string; value: string; onChange: (v: string) => void; options: string[]; required?: boolean;
  }) => (
    <div>
      <label className="block text-[10px] font-semibold text-muted-foreground uppercase mb-1.5">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {editing ? (
        <select value={value} onChange={(e) => onChange(e.target.value)}
          className={cn("w-full px-3 py-2 rounded-lg border text-sm outline-none transition-colors bg-white",
            required && !value ? "border-amber-300" : "border-border"
          )}>
          <option value="">Select...</option>
          {options.map((o) => <option key={o} value={o}>{o}</option>)}
        </select>
      ) : (
        <p className="text-sm font-medium text-foreground capitalize">{value || "—"}</p>
      )}
    </div>
  );

  return (
    <div className="page-enter">
      <Header userName={profile?.fullName || "Student"} userRole="Student"
        greeting={!profile?.profileComplete ? "Complete Your Profile" : "My Profile"}
        subtitle={!profile?.profileComplete ? "Fill in all required fields to access placement features" : "Manage your academic and professional profile"} />

      {toast && (
        <div className={cn("fixed top-6 right-6 z-50 flex items-center gap-2 px-4 py-3 rounded-xl shadow-lg text-sm font-medium animate-in slide-in-from-top-2",
          toast.type === "success" ? "bg-emerald-600 text-white" : "bg-red-600 text-white")}>
          {toast.type === "success" ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          {toast.msg}
        </div>
      )}

      <div className="px-4 sm:px-6 md:px-8 pb-10 space-y-6">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
            <p className="text-sm text-muted-foreground">Loading profile...</p>
          </div>
        ) : !profile ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <AlertCircle className="w-10 h-10 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">Profile not found</p>
          </div>
        ) : (
          <>
            {/* Incomplete banner */}
            {!profile.profileComplete && (
              <div className="flex items-center gap-3 p-4 rounded-xl bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200">
                <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-sm font-semibold text-amber-800">Profile Incomplete</p>
                  <p className="text-xs text-amber-600">Fill all fields marked with * to unlock placement features.</p>
                </div>
                {!editing && (
                  <button onClick={() => setEditing(true)}
                    className="px-4 py-2 rounded-lg bg-amber-600 text-white text-xs font-semibold hover:bg-amber-700 transition-colors">
                    Complete Now
                  </button>
                )}
              </div>
            )}

            {/* Profile header card */}
            <div className="i-card p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
                <div className="flex items-start gap-4 sm:gap-5">
                  <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white text-xl sm:text-2xl font-bold shadow-lg shadow-indigo-500/30 flex-shrink-0">
                    {profile.fullName?.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                  </div>
                  <div className="min-w-0">
                    <h2 className="text-lg sm:text-xl font-bold text-foreground truncate">{profile.fullName}</h2>
                    <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">{profile.usn} · {profile.department}</p>
                    <div className="flex items-center gap-2 mt-2 flex-wrap">
                      {(() => {
                        const st = placementLabel[profile.placementStatus] || placementLabel.none;
                        return <span className={cn("text-[10px] font-semibold px-2.5 py-1 rounded-full", st.bg, st.color)}>{st.label}</span>;
                      })()}
                      {profile.profileComplete && (
                        <span className="text-[10px] font-semibold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-600 inline-flex items-center gap-1">
                          <ShieldCheck className="w-3 h-3" /> Verified
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <button onClick={() => { if (editing) handleSave(); else setEditing(true); }} disabled={saving}
                  className={cn("flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all w-full sm:w-auto justify-center",
                    editing ? "bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-lg shadow-indigo-500/20" : "bg-muted text-foreground hover:bg-muted/80")}>
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : editing ? <Save className="w-4 h-4" /> : <Edit3 className="w-4 h-4" />}
                  {editing ? (saving ? "Saving..." : "Save Profile") : "Edit Profile"}
                </button>
              </div>
            </div>

            {/* Form sections */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Personal Info */}
              <div className="i-card p-5 space-y-4">
                <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <User className="w-4 h-4 text-indigo-500" /> Personal Information
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <InputField label="Full Name" value={form.fullName} onChange={(v) => setField("fullName", v)} required placeholder="John Doe" />
                  <InputField label="Phone" value={form.phone} onChange={(v) => setField("phone", v)} required placeholder="+91 9876543210" />
                  <InputField label="Date of Birth" value={form.dateOfBirth} onChange={(v) => setField("dateOfBirth", v)} type="date" required />
                  <SelectField label="Gender" value={form.gender} onChange={(v) => setField("gender", v)} options={GENDER_OPTIONS} required />
                  <SelectField label="Category" value={form.category} onChange={(v) => setField("category", v)} options={CATEGORY_OPTIONS} />
                  <InputField label="Family Income (₹/yr)" value={form.familyIncome} onChange={(v) => setField("familyIncome", v)} type="number" placeholder="500000" />
                </div>
                <div className="pt-2 border-t border-border">
                  <p className="text-[10px] font-semibold text-muted-foreground uppercase mb-1.5">Email</p>
                  <p className="text-sm text-muted-foreground flex items-center gap-2"><Mail className="w-3.5 h-3.5" />{profile.user?.email || "—"}</p>
                </div>
              </div>

              {/* Academic Info */}
              <div className="i-card p-5 space-y-4">
                <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <GraduationCap className="w-4 h-4 text-indigo-500" /> Academic Details
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  <InputField label="CGPA" value={form.cgpa} onChange={(v) => setField("cgpa", v)} type="number" required placeholder="8.50" />
                  <InputField label="Semester" value={form.semester} onChange={(v) => setField("semester", v)} type="number" placeholder="6" />
                  <InputField label="Backlogs" value={form.backlogs} onChange={(v) => setField("backlogs", v)} type="number" placeholder="0" />
                </div>
                <div className="pt-3 border-t border-border">
                  <p className="text-xs font-semibold text-foreground mb-3">10th Standard</p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    <InputField label="Percentage" value={form.tenthPercent} onChange={(v) => setField("tenthPercent", v)} type="number" required placeholder="92.4" />
                    <SelectField label="Board" value={form.tenthBoard} onChange={(v) => setField("tenthBoard", v)} options={BOARD_OPTIONS} />
                    <InputField label="Year" value={form.tenthYear} onChange={(v) => setField("tenthYear", v)} type="number" placeholder="2020" />
                  </div>
                </div>
                <div className="pt-3 border-t border-border">
                  <p className="text-xs font-semibold text-foreground mb-3">12th Standard</p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    <InputField label="Percentage" value={form.twelfthPercent} onChange={(v) => setField("twelfthPercent", v)} type="number" required placeholder="88.6" />
                    <SelectField label="Board" value={form.twelfthBoard} onChange={(v) => setField("twelfthBoard", v)} options={BOARD_OPTIONS} />
                    <InputField label="Year" value={form.twelfthYear} onChange={(v) => setField("twelfthYear", v)} type="number" placeholder="2022" />
                  </div>
                  <div className="mt-3">
                    <SelectField label="Stream" value={form.twelfthStream} onChange={(v) => setField("twelfthStream", v)} options={STREAM_OPTIONS} />
                  </div>
                </div>
              </div>

              {/* Links & Resume */}
              <div className="i-card p-5 space-y-4">
                <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <Globe className="w-4 h-4 text-indigo-500" /> Links & Resume
                </h3>
                <InputField label="Resume Drive Link" value={form.driveLink} onChange={(v) => setField("driveLink", v)} placeholder="https://drive.google.com/..." />
                {linkedin && <a href={linkedin} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-xs text-indigo-600 hover:underline"><ExternalLink className="w-3 h-3" /> LinkedIn</a>}
                {github && <a href={github} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-xs text-indigo-600 hover:underline"><GitBranch className="w-3 h-3" /> GitHub</a>}
              </div>

              {/* Skills & Certs */}
              <div className="space-y-6">
                <div className="i-card p-5 space-y-3">
                  <h3 className="text-sm font-semibold text-foreground flex items-center gap-2"><Code className="w-4 h-4 text-indigo-500" /> Skills</h3>
                  {skills.length > 0 ? (
                    <div className="flex flex-wrap gap-2">{skills.map((s) => <span key={s} className="text-[10px] font-semibold px-2.5 py-1.5 rounded-full bg-indigo-50 text-indigo-600">{s}</span>)}</div>
                  ) : (<p className="text-xs text-muted-foreground">No skills added yet</p>)}
                </div>
                <div className="i-card p-5 space-y-3">
                  <h3 className="text-sm font-semibold text-foreground flex items-center gap-2"><Award className="w-4 h-4 text-indigo-500" /> Certifications</h3>
                  {certifications.length > 0 ? (
                    <div className="space-y-2">{certifications.map((c) => <div key={c} className="flex items-center gap-2 text-xs text-foreground"><CheckCircle2 className="w-3 h-3 text-emerald-500 flex-shrink-0" />{c}</div>)}</div>
                  ) : (<p className="text-xs text-muted-foreground">No certifications added</p>)}
                </div>
              </div>
            </div>

            {/* Save floating button for mobile */}
            {editing && (
              <div className="fixed bottom-24 left-0 right-0 px-4 md:hidden z-40">
                <button onClick={handleSave} disabled={saving}
                  className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-semibold text-sm shadow-xl shadow-indigo-500/30">
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  {saving ? "Saving..." : `Save Profile${!mandatoryFilled ? " (Fill required fields)" : ""}`}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
