"use client";

import Header from "@/components/layout/Header";
import { cn } from "@/lib/utils";
import { studentApi } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import {
  FileText,
  Upload,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Link2,
  Code,
  Award,
  Edit3,
  Save,
  X,
  GraduationCap,
  Briefcase,
  ShieldCheck,
} from "lucide-react";
import { useState, useEffect, useCallback, useRef } from "react";

interface StudentProfile {
  id: string;
  fullName: string;
  usn: string;
  department: string;
  semester: number | null;
  cgpa: number | null;
  driveLink: string | null;
  resumeLink: string | null;
  resumeFileName: string | null;
  profileComplete: boolean;
  placementStatus: string;
  profileData: Record<string, unknown>;
}

export default function StudentCVPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [editing, setEditing] = useState(false);
  const [driveLink, setDriveLink] = useState("");
  const [activeTab, setActiveTab] = useState<"upload" | "link">("upload");
  const [toast, setToast] = useState<{ type: "success" | "error"; msg: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchProfile = useCallback(async () => {
    try {
      setLoading(true);
      const res = await studentApi.getProfile();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const data = (res as any)?.data as StudentProfile;
      if (data) {
        setProfile(data);
        setDriveLink(data.driveLink || "");
      }
    } catch {
      /* silently handle */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchProfile(); }, [fetchProfile]);
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  /* ─── S3 Presigned Upload ─────────────────────────────── */
  const handleFileUpload = async (file: File) => {
    const allowed = ["application/pdf", "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document"];
    if (!allowed.includes(file.type)) {
      setToast({ type: "error", msg: "Only PDF, DOC, DOCX files are allowed" });
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setToast({ type: "error", msg: "File must be under 2MB" });
      return;
    }

    setUploading(true);
    setUploadProgress(10);
    try {
      // Step 1: Get presigned URL from backend
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const presignedRes: any = await studentApi.getResumePresignedUrl(file.name, file.type);
      const { presignedUrl, key, publicUrl } = presignedRes?.data || presignedRes;

      setUploadProgress(30);

      // Step 2: Upload directly to S3 (browser → S3, bypasses our server entirely)
      const s3Res = await fetch(presignedUrl, {
        method: "PUT",
        body: file,
        headers: { "Content-Type": file.type },
      });
      if (!s3Res.ok) throw new Error("Upload to S3 failed");

      setUploadProgress(80);

      // Step 3: Confirm upload to backend
      await studentApi.confirmResumeUpload(key, publicUrl, file.name);

      setUploadProgress(100);
      setToast({ type: "success", msg: "Resume uploaded successfully!" });
      setEditing(false);
      await fetchProfile();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Upload failed";
      // Fallback: if S3 not configured, tell user to use drive link
      if (msg.includes("not configured") || msg.includes("S3 bucket")) {
        setToast({ type: "error", msg: "Direct upload not configured yet. Please use the 'Drive Link' tab." });
        setActiveTab("link");
      } else {
        setToast({ type: "error", msg });
      }
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  /* ─── Drive Link Save ─────────────────────────────────── */
  const handleSave = async () => {
    try {
      setSaving(true);
      await studentApi.updateProfile({ driveLink: driveLink || undefined });
      setToast({ type: "success", msg: "Resume link updated!" });
      setEditing(false);
      fetchProfile();
    } catch {
      setToast({ type: "error", msg: "Failed to update resume link" });
    } finally {
      setSaving(false);
    }
  };

  const skills = (profile?.profileData?.skills as string[]) || [];
  const certifications = (profile?.profileData?.certifications as string[]) || [];
  const hasResume = !!(profile?.resumeLink || profile?.driveLink);

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
        userName={user?.email?.split("@")[0] || "Student"}
        userRole="Student"
        greeting="My CV / Resume"
        subtitle="Manage your resume link and placement profile"
      />

      {toast && (
        <div className={cn(
          "fixed top-6 right-6 z-50 flex items-center gap-2 px-4 py-3 rounded-xl shadow-lg text-sm font-medium animate-in slide-in-from-top-2",
          toast.type === "success" ? "bg-emerald-600 text-white" : "bg-red-600 text-white"
        )}>
          {toast.type === "success" ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          {toast.msg}
        </div>
      )}

      <div className="px-4 sm:px-6 md:px-8 pb-10 space-y-6">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
            <p className="text-sm text-muted-foreground">Loading your profile...</p>
          </div>
        ) : !profile ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <AlertCircle className="w-10 h-10 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">Profile not found</p>
          </div>
        ) : (
          <>
            {/* Profile snapshot card */}
            <div className="i-card p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row items-start gap-4 sm:gap-5">
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white text-xl sm:text-2xl font-bold shadow-lg shadow-indigo-500/30 flex-shrink-0">
                  {profile.fullName?.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                </div>
                <div className="min-w-0 flex-1">
                  <h2 className="text-lg sm:text-xl font-bold text-foreground truncate">{profile.fullName}</h2>
                  <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
                    {profile.usn} · {profile.department}
                    {profile.semester ? ` · Sem ${profile.semester}` : ""}
                    {profile.cgpa ? ` · CGPA ${profile.cgpa}` : ""}
                  </p>
                  <div className="flex items-center gap-2 mt-2 flex-wrap">
                    {(() => {
                      const st = placementLabel[profile.placementStatus] || placementLabel.none;
                      return <span className={cn("text-[10px] font-semibold px-2.5 py-1 rounded-full", st.bg, st.color)}>{st.label}</span>;
                    })()}
                    {profile.profileComplete && (
                      <span className="text-[10px] font-semibold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-600 inline-flex items-center gap-1">
                        <ShieldCheck className="w-3 h-3" /> Profile Complete
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Resume Card */}
            <div className="i-card p-5 sm:p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <FileText className="w-4 h-4 text-indigo-500" /> Resume / CV
                </h3>
                {!editing && (
                  <button onClick={() => setEditing(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-muted text-foreground hover:bg-muted/80 transition-colors">
                    <Edit3 className="w-3.5 h-3.5" />
                    {hasResume ? "Update" : "Add Resume"}
                  </button>
                )}
              </div>

              {/* Show existing resume */}
              {!editing && hasResume && (
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 p-4 rounded-xl bg-gradient-to-r from-indigo-50/80 to-violet-50/80 border border-indigo-100">
                  <div className="w-12 h-12 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                    {profile?.resumeLink ? <FileText className="w-6 h-6 text-indigo-600" /> : <Link2 className="w-6 h-6 text-indigo-600" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground">
                      {profile?.resumeFileName || "Resume uploaded"}
                    </p>
                    {(profile?.resumeLink || profile?.driveLink) && (
                      <a href={profile.resumeLink || profile.driveLink!} target="_blank" rel="noopener noreferrer"
                        className="text-xs text-indigo-600 hover:underline truncate block mt-0.5 max-w-full">
                        {profile.resumeLink ? "Uploaded to cloud storage" : profile.driveLink}
                      </a>
                    )}
                  </div>
                  <a href={profile?.resumeLink || profile?.driveLink!} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-700 transition-colors shadow-sm flex-shrink-0">
                    <ExternalLink className="w-3.5 h-3.5" /> View Resume
                  </a>
                </div>
              )}

              {/* Empty state */}
              {!editing && !hasResume && (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <div className="w-14 h-14 rounded-2xl bg-amber-50 flex items-center justify-center mx-auto mb-4">
                    <Upload className="w-7 h-7 text-amber-600" />
                  </div>
                  <h4 className="text-sm font-semibold text-foreground">No resume added yet</h4>
                  <p className="text-xs text-muted-foreground mt-1 max-w-sm">
                    Upload your resume PDF or add a link so companies can review it.
                  </p>
                  <button onClick={() => setEditing(true)}
                    className="mt-4 flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white text-xs font-semibold shadow-md hover:shadow-lg transition-all">
                    <Upload className="w-3.5 h-3.5" /> Add Resume
                  </button>
                </div>
              )}

              {/* Edit Form — tabbed: Upload File | Drive Link */}
              {editing && (
                <div className="space-y-4">
                  {/* Tabs */}
                  <div className="flex rounded-xl overflow-hidden border border-border/60">
                    <button onClick={() => setActiveTab("upload")}
                      className={cn("flex-1 py-2.5 text-xs font-semibold transition-colors flex items-center justify-center gap-1.5",
                        activeTab === "upload" ? "bg-indigo-600 text-white" : "bg-white text-muted-foreground hover:bg-muted/40")}>
                      <Upload className="w-3.5 h-3.5" /> Upload File
                    </button>
                    <button onClick={() => setActiveTab("link")}
                      className={cn("flex-1 py-2.5 text-xs font-semibold transition-colors flex items-center justify-center gap-1.5",
                        activeTab === "link" ? "bg-indigo-600 text-white" : "bg-white text-muted-foreground hover:bg-muted/40")}>
                      <Link2 className="w-3.5 h-3.5" /> Drive Link
                    </button>
                  </div>

                  {activeTab === "upload" && (
                    <div className="space-y-3">
                      <p className="text-[10px] text-muted-foreground">
                        Upload a PDF or DOCX (max 2MB). File is stored securely — your server is not involved.
                      </p>
                      <label className={cn(
                        "flex flex-col items-center gap-3 p-6 rounded-xl border-2 border-dashed cursor-pointer transition-colors",
                        uploading ? "border-indigo-300 bg-indigo-50/40 cursor-wait" : "border-indigo-200 hover:border-indigo-400 hover:bg-indigo-50/20"
                      )}>
                        {uploading ? (
                          <>
                            <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
                            <div className="w-full max-w-xs">
                              <div className="h-1.5 bg-indigo-100 rounded-full overflow-hidden">
                                <div className="h-full bg-indigo-600 rounded-full transition-all duration-500"
                                  style={{ width: `${uploadProgress}%` }} />
                              </div>
                              <p className="text-xs text-indigo-600 font-medium mt-1.5 text-center">Uploading... {uploadProgress}%</p>
                            </div>
                          </>
                        ) : (
                          <>
                            <Upload className="w-8 h-8 text-indigo-400" />
                            <div className="text-center">
                              <p className="text-sm font-medium text-foreground">Click to select file</p>
                              <p className="text-xs text-muted-foreground mt-1">PDF, DOC, DOCX — max 2MB</p>
                            </div>
                          </>
                        )}
                        <input ref={fileInputRef} type="file" accept=".pdf,.doc,.docx" className="hidden"
                          disabled={uploading}
                          onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFileUpload(f); }} />
                      </label>
                    </div>
                  )}

                  {activeTab === "link" && (
                    <div className="space-y-3">
                      <div>
                        <label className="block text-[10px] font-semibold text-muted-foreground uppercase mb-1.5">
                          Google Drive / Resume URL
                        </label>
                        <input type="url" value={driveLink} onChange={(e) => setDriveLink(e.target.value)}
                          placeholder="https://drive.google.com/file/d/..."
                          className="w-full px-3 py-2.5 rounded-lg border border-border text-sm outline-none transition-colors bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10" />
                        <p className="text-[10px] text-muted-foreground mt-1.5">
                          Set sharing to &quot;Anyone with the link can view&quot; in Google Drive.
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button onClick={handleSave} disabled={saving}
                          className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-gradient-to-r from-indigo-600 to-violet-600 text-white text-xs font-semibold shadow-md hover:shadow-lg transition-all disabled:opacity-60">
                          {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                          {saving ? "Saving..." : "Save Link"}
                        </button>
                        <button onClick={() => { setEditing(false); setDriveLink(profile?.driveLink || ""); }}
                          className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-muted text-foreground text-xs font-medium hover:bg-muted/80 transition-colors">
                          <X className="w-3.5 h-3.5" /> Cancel
                        </button>
                      </div>
                    </div>
                  )}

                  {activeTab === "upload" && !uploading && (
                    <button onClick={() => setEditing(false)}
                      className="text-xs text-muted-foreground hover:text-foreground transition-colors">Cancel</button>
                  )}
                </div>
              )}
            </div>

            {/* Info banner */}
            <div className="flex items-start gap-3 p-4 rounded-xl bg-blue-50 border border-blue-200">
              <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-blue-700">
                <strong>Tip:</strong> Tailor your resume for each role. The ATS engine scores your resume against each company&apos;s
                job description — a higher score significantly improves your shortlisting chances. Update your resume whenever you have a new version.
              </p>
            </div>

            {/* Skills & Certifications */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="i-card p-5 space-y-3">
                <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <Code className="w-4 h-4 text-indigo-500" /> Skills
                </h3>
                {skills.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {skills.map((s) => (
                      <span key={s} className="text-[10px] font-semibold px-2.5 py-1.5 rounded-full bg-indigo-50 text-indigo-600 border border-indigo-200">{s}</span>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6">
                    <Code className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
                    <p className="text-xs text-muted-foreground">No skills added yet</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">Update your profile to add skills</p>
                  </div>
                )}
              </div>

              <div className="i-card p-5 space-y-3">
                <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <Award className="w-4 h-4 text-indigo-500" /> Certifications
                </h3>
                {certifications.length > 0 ? (
                  <div className="space-y-2">
                    {certifications.map((c) => (
                      <div key={c} className="flex items-center gap-2 text-xs text-foreground">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />{c}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6">
                    <Award className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
                    <p className="text-xs text-muted-foreground">No certifications added</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">Update your profile to add certifications</p>
                  </div>
                )}
              </div>
            </div>

            {/* Placement Readiness */}
            <div className="i-card p-5 space-y-3">
              <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-indigo-500" /> Placement Readiness
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {[
                  { label: "Profile Complete", done: profile.profileComplete, icon: ShieldCheck },
                  { label: "Resume Added", done: hasResume, icon: FileText },
                  { label: "Skills Added", done: skills.length > 0, icon: Code },
                  { label: "CGPA Updated", done: !!profile.cgpa, icon: GraduationCap },
                ].map((item) => (
                  <div key={item.label} className={cn("flex items-center gap-3 p-3 rounded-xl border transition-colors",
                    item.done ? "bg-emerald-50/50 border-emerald-200 text-emerald-700" : "bg-amber-50/50 border-amber-200 text-amber-700")}>
                    <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0",
                      item.done ? "bg-emerald-100" : "bg-amber-100")}>
                      {item.done ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <AlertCircle className="w-4 h-4 text-amber-600" />}
                    </div>
                    <div>
                      <p className="text-xs font-semibold">{item.label}</p>
                      <p className="text-[10px] opacity-70">{item.done ? "Complete" : "Pending"}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
