"use client";

import Header from "@/components/layout/Header";
import { cn } from "@/lib/utils";
import { studentApi } from "@/lib/api";
import {
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  GraduationCap,
  Briefcase,
  Code,
  Award,
  Globe,
  Edit3,
  Plus,
  ExternalLink,
  GitBranch,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Save,
} from "lucide-react";
import { useState, useEffect, useCallback } from "react";

interface StudentProfile {
  id: string;
  usn: string;
  fullName: string;
  phone: string | null;
  dateOfBirth: string | null;
  gender: string | null;
  addressJson: Record<string, string> | null;
  department: string;
  semester: number | null;
  cgpa: number | null;
  tenthPercent: number | null;
  tenthBoard: string | null;
  tenthYear: number | null;
  twelfthPercent: number | null;
  twelfthBoard: string | null;
  twelfthYear: number | null;
  twelfthStream: string | null;
  backlogs: number;
  driveLink: string | null;
  familyIncome: number | null;
  category: string | null;
  profileData: Record<string, unknown>;
  profileComplete: boolean;
  placementStatus: string;
  user?: { email: string };
}

export default function StudentProfilePage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [toast, setToast] = useState<{ type: "success" | "error"; msg: string } | null>(null);

  // Editable fields
  const [phone, setPhone] = useState("");
  const [cgpa, setCgpa] = useState("");
  const [tenthPercent, setTenthPercent] = useState("");
  const [twelfthPercent, setTwelfthPercent] = useState("");
  const [backlogs, setBacklogs] = useState("");

  const fetchProfile = useCallback(async () => {
    try {
      setLoading(true);
      const res = await studentApi.getProfile();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const data = (res as any)?.data as StudentProfile;
      if (data) {
        setProfile(data);
        setPhone(data.phone || "");
        setCgpa(data.cgpa?.toString() || "");
        setTenthPercent(data.tenthPercent?.toString() || "");
        setTwelfthPercent(data.twelfthPercent?.toString() || "");
        setBacklogs(data.backlogs?.toString() || "0");
      }
    } catch {
      // silently handle
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const handleSave = async () => {
    if (!profile) return;
    try {
      setSaving(true);
      await studentApi.updateProfile({
        phone: phone || undefined,
        cgpa: cgpa ? parseFloat(cgpa) : undefined,
        tenthPercent: tenthPercent ? parseFloat(tenthPercent) : undefined,
        twelfthPercent: twelfthPercent ? parseFloat(twelfthPercent) : undefined,
        activeBacklogs: backlogs ? parseInt(backlogs) : undefined,
      });
      setToast({ type: "success", msg: "Profile updated successfully" });
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

  return (
    <div className="page-enter">
      <Header
        userName={profile?.fullName || "Student"}
        userRole="Student"
        greeting="My Profile"
        subtitle="Manage your academic and professional profile"
      />

      {/* Toast */}
      {toast && (
        <div className={cn(
          "fixed top-6 right-6 z-50 flex items-center gap-2 px-4 py-3 rounded-xl shadow-lg text-sm font-medium animate-in slide-in-from-top-2",
          toast.type === "success" ? "bg-emerald-600 text-white" : "bg-red-600 text-white"
        )}>
          {toast.type === "success" ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          {toast.msg}
        </div>
      )}

      <div className="px-8 pb-10 space-y-6">
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
            {/* Profile header */}
            <div className="i-card p-6">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-5">
                  <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white text-2xl font-bold shadow-lg shadow-indigo-500/30">
                    {profile.fullName?.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-foreground">{profile.fullName}</h2>
                    <p className="text-sm text-muted-foreground mt-0.5">{profile.usn} · {profile.department}</p>
                    <div className="flex items-center gap-3 mt-2 flex-wrap">
                      {(() => {
                        const st = placementLabel[profile.placementStatus] || placementLabel.none;
                        return (
                          <span className={cn("text-[10px] font-semibold px-2.5 py-1 rounded-full", st.bg, st.color)}>
                            {st.label}
                          </span>
                        );
                      })()}
                      {profile.profileComplete && (
                        <span className="text-[10px] font-semibold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-600 inline-flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> Profile Complete
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => {
                    if (editing) handleSave();
                    else setEditing(true);
                  }}
                  disabled={saving}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all",
                    editing
                      ? "bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-lg shadow-indigo-500/20"
                      : "bg-muted text-foreground hover:bg-muted/80"
                  )}
                >
                  {saving ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : editing ? (
                    <Save className="w-4 h-4" />
                  ) : (
                    <Edit3 className="w-4 h-4" />
                  )}
                  {editing ? "Save" : "Edit Profile"}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left: Contact & Personal */}
              <div className="space-y-6">
                <div className="i-card p-5 space-y-4">
                  <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                    <User className="w-4 h-4 text-indigo-500" /> Contact
                  </h3>
                  <div className="space-y-3 text-xs">
                    <div className="flex items-center gap-3 text-muted-foreground">
                      <Mail className="w-3.5 h-3.5 flex-shrink-0" />
                      <span>{profile.user?.email || "—"}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Phone className="w-3.5 h-3.5 flex-shrink-0 text-muted-foreground" />
                      {editing ? (
                        <input
                          type="text"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          className="px-2 py-1.5 rounded-lg border border-border bg-white text-xs outline-none flex-1"
                          placeholder="+91 XXXXX XXXXX"
                        />
                      ) : (
                        <span className="text-muted-foreground">{profile.phone || "Not set"}</span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-muted-foreground">
                      <Calendar className="w-3.5 h-3.5 flex-shrink-0" />
                      <span>{profile.dateOfBirth ? new Date(profile.dateOfBirth).toLocaleDateString() : "Not set"}</span>
                    </div>
                    <div className="flex items-center gap-3 text-muted-foreground">
                      <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
                      <span>
                        {profile.addressJson
                          ? Object.values(profile.addressJson).filter(Boolean).join(", ")
                          : "Not set"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Social links */}
                <div className="i-card p-5 space-y-3">
                  <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                    <Globe className="w-4 h-4 text-indigo-500" /> Links
                  </h3>
                  {linkedin && (
                    <a href={linkedin} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-xs text-indigo-600 hover:underline">
                      <ExternalLink className="w-3 h-3" /> LinkedIn
                    </a>
                  )}
                  {github && (
                    <a href={github} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-xs text-indigo-600 hover:underline">
                      <GitBranch className="w-3 h-3" /> GitHub
                    </a>
                  )}
                  {!linkedin && !github && (
                    <p className="text-xs text-muted-foreground">No links added yet</p>
                  )}
                </div>
              </div>

              {/* Center: Academics */}
              <div className="space-y-6">
                <div className="i-card p-5 space-y-4">
                  <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                    <GraduationCap className="w-4 h-4 text-indigo-500" /> Academics
                  </h3>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 rounded-xl bg-muted/30">
                      <p className="text-[10px] text-muted-foreground uppercase">CGPA</p>
                      {editing ? (
                        <input
                          type="number"
                          step="0.01"
                          value={cgpa}
                          onChange={(e) => setCgpa(e.target.value)}
                          className="w-full mt-1 px-2 py-1.5 rounded-lg border border-border bg-white text-sm font-bold outline-none"
                          placeholder="0.00"
                        />
                      ) : (
                        <p className="text-lg font-bold text-foreground">{profile.cgpa ?? "—"}</p>
                      )}
                    </div>
                    <div className="p-3 rounded-xl bg-muted/30">
                      <p className="text-[10px] text-muted-foreground uppercase">Semester</p>
                      <p className="text-lg font-bold text-foreground">{profile.semester ?? "—"}</p>
                    </div>
                    <div className="p-3 rounded-xl bg-muted/30">
                      <p className="text-[10px] text-muted-foreground uppercase">10th %</p>
                      {editing ? (
                        <input
                          type="number"
                          step="0.01"
                          value={tenthPercent}
                          onChange={(e) => setTenthPercent(e.target.value)}
                          className="w-full mt-1 px-2 py-1.5 rounded-lg border border-border bg-white text-sm font-bold outline-none"
                          placeholder="0.00"
                        />
                      ) : (
                        <p className="text-lg font-bold text-foreground">{profile.tenthPercent ?? "—"}%</p>
                      )}
                    </div>
                    <div className="p-3 rounded-xl bg-muted/30">
                      <p className="text-[10px] text-muted-foreground uppercase">12th %</p>
                      {editing ? (
                        <input
                          type="number"
                          step="0.01"
                          value={twelfthPercent}
                          onChange={(e) => setTwelfthPercent(e.target.value)}
                          className="w-full mt-1 px-2 py-1.5 rounded-lg border border-border bg-white text-sm font-bold outline-none"
                          placeholder="0.00"
                        />
                      ) : (
                        <p className="text-lg font-bold text-foreground">{profile.twelfthPercent ?? "—"}%</p>
                      )}
                    </div>
                    <div className="p-3 rounded-xl bg-muted/30 col-span-2">
                      <p className="text-[10px] text-muted-foreground uppercase">Active Backlogs</p>
                      {editing ? (
                        <input
                          type="number"
                          value={backlogs}
                          onChange={(e) => setBacklogs(e.target.value)}
                          className="w-full mt-1 px-2 py-1.5 rounded-lg border border-border bg-white text-sm font-bold outline-none"
                          placeholder="0"
                        />
                      ) : (
                        <p className="text-lg font-bold text-foreground">{profile.backlogs}</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Education boards */}
                <div className="i-card p-5 space-y-4">
                  <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                    <Award className="w-4 h-4 text-indigo-500" /> Education Details
                  </h3>
                  <div className="space-y-3 text-xs text-muted-foreground">
                    <div className="flex justify-between items-center">
                      <span>10th Board</span>
                      <span className="font-medium text-foreground">{profile.tenthBoard || "—"}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>10th Year</span>
                      <span className="font-medium text-foreground">{profile.tenthYear || "—"}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>12th Board</span>
                      <span className="font-medium text-foreground">{profile.twelfthBoard || "—"}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>12th Year</span>
                      <span className="font-medium text-foreground">{profile.twelfthYear || "—"}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>12th Stream</span>
                      <span className="font-medium text-foreground">{profile.twelfthStream || "—"}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right: Skills & extra */}
              <div className="space-y-6">
                <div className="i-card p-5 space-y-4">
                  <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                    <Code className="w-4 h-4 text-indigo-500" /> Skills
                  </h3>
                  {skills.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {skills.map((skill) => (
                        <span
                          key={skill}
                          className="text-[10px] font-semibold px-2.5 py-1.5 rounded-full bg-indigo-50 text-indigo-600"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-4">
                      <p className="text-xs text-muted-foreground">No skills added yet</p>
                      <button className="text-xs text-indigo-600 mt-1 hover:underline inline-flex items-center gap-1">
                        <Plus className="w-3 h-3" /> Add Skills
                      </button>
                    </div>
                  )}
                </div>

                <div className="i-card p-5 space-y-4">
                  <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                    <Award className="w-4 h-4 text-indigo-500" /> Certifications
                  </h3>
                  {certifications.length > 0 ? (
                    <div className="space-y-2">
                      {certifications.map((cert) => (
                        <div key={cert} className="flex items-center gap-2 text-xs text-foreground">
                          <CheckCircle2 className="w-3 h-3 text-emerald-500 flex-shrink-0" />
                          {cert}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-4">
                      <p className="text-xs text-muted-foreground">No certifications added</p>
                      <button className="text-xs text-indigo-600 mt-1 hover:underline inline-flex items-center gap-1">
                        <Plus className="w-3 h-3" /> Add Certification
                      </button>
                    </div>
                  )}
                </div>

                <div className="i-card p-5 space-y-4">
                  <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                    <Briefcase className="w-4 h-4 text-indigo-500" /> Additional
                  </h3>
                  <div className="space-y-2 text-xs text-muted-foreground">
                    <div className="flex justify-between items-center">
                      <span>Category</span>
                      <span className="font-medium text-foreground">{profile.category || "—"}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Family Income</span>
                      <span className="font-medium text-foreground">
                        {profile.familyIncome ? `₹${Number(profile.familyIncome).toLocaleString()}` : "—"}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Gender</span>
                      <span className="font-medium text-foreground capitalize">{profile.gender || "—"}</span>
                    </div>
                    {profile.driveLink && (
                      <a href={profile.driveLink} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-indigo-600 hover:underline">
                        <ExternalLink className="w-3 h-3" /> Resume Drive Link
                      </a>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
