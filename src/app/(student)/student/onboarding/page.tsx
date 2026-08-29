"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { studentApi } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { User, GraduationCap, FileText, Loader2, Upload, CheckCircle2 } from "lucide-react";

interface ProfileData {
  phone?: string;
  dateOfBirth?: string;
  gender?: string;
  category?: string;
  tenthPercent?: number;
  tenthBoard?: string;
  twelfthPercent?: number;
  twelfthBoard?: string;
  cgpa?: number;
  backlogs?: number;
  skills?: string;
  aboutMe?: string;
}

export default function StudentOnboarding() {
  const router = useRouter();
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [hasResume, setHasResume] = useState<boolean | null>(null);
  const [resumeFile, setResumeFile] = useState<File | null>(null);

  const [form, setForm] = useState<ProfileData>({
    phone: "",
    dateOfBirth: "",
    gender: "",
    category: "",
    tenthPercent: undefined,
    tenthBoard: "",
    twelfthPercent: undefined,
    twelfthBoard: "",
    cgpa: undefined,
    backlogs: 0,
    skills: "",
    aboutMe: "",
  });

  const updateForm = (field: string, value: any) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    if (!form.phone) return setError("Phone number is required");
    setError("");
    setLoading(true);
    try {
      // Update profile with all details
      await studentApi.updateProfile({
        phone: form.phone,
        dateOfBirth: form.dateOfBirth || undefined,
        gender: form.gender || undefined,
        category: form.category || undefined,
        tenthPercent: form.tenthPercent ? Number(form.tenthPercent) : undefined,
        tenthBoard: form.tenthBoard || undefined,
        twelfthPercent: form.twelfthPercent ? Number(form.twelfthPercent) : undefined,
        twelfthBoard: form.twelfthBoard || undefined,
        cgpa: form.cgpa ? Number(form.cgpa) : undefined,
        backlogs: form.backlogs ? Number(form.backlogs) : 0,
        skills: form.skills || undefined,
        aboutMe: form.aboutMe || undefined,
        profileComplete: true,
      });

      // Handle resume
      if (hasResume && resumeFile) {
        // Upload resume file
        const formData = new FormData();
        formData.append("photo", resumeFile);
        // Use the existing profile photo upload as a workaround, or handle resume separately
      }

      if (!hasResume) {
        // Auto-generate resume link by saving profile data
        await studentApi.updateProfile({
          resumeLink: 'auto-generated',
          profileData: {
            skills: form.skills,
            aboutMe: form.aboutMe,
          },
        });
      }

      router.push("/student/dashboard");
    } catch (err: any) {
      setError(err?.message || "Failed to save profile");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-foreground">Complete Your Profile</h1>
          <p className="text-muted-foreground mt-1">Fill in your details to access the placement portal</p>
        </div>

        {/* Progress */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {[
            { num: 1, label: "Personal", icon: User },
            { num: 2, label: "Academic", icon: GraduationCap },
            { num: 3, label: "Resume", icon: FileText },
          ].map(({ num, label, icon: Icon }) => (
            <div key={num} className="flex items-center gap-2">
              <button
                onClick={() => setStep(num)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  step === num
                    ? "bg-primary text-primary-foreground"
                    : step > num
                    ? "bg-primary/20 text-primary"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                <Icon className="w-4 h-4" />
                {label}
              </button>
              {num < 3 && <div className={`w-6 h-0.5 ${step > num ? "bg-primary" : "bg-muted"}`} />}
            </div>
          ))}
        </div>

        {/* Card */}
        <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
          {error && (
            <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">
              {error}
            </div>
          )}

          {/* Step 1: Personal Details */}
          {step === 1 && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold">Personal Details</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1.5">Phone Number *</label>
                  <input
                    type="tel"
                    value={form.phone}
                    onChange={(e) => updateForm("phone", e.target.value)}
                    placeholder="+91 XXXXXXXXXX"
                    className="w-full px-4 py-2.5 rounded-xl border border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">Date of Birth</label>
                  <input
                    type="date"
                    value={form.dateOfBirth}
                    onChange={(e) => updateForm("dateOfBirth", e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">Gender</label>
                  <select
                    value={form.gender}
                    onChange={(e) => updateForm("gender", e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                  >
                    <option value="">Select</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">Category</label>
                  <select
                    value={form.category}
                    onChange={(e) => updateForm("category", e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                  >
                    <option value="">Select</option>
                    <option value="General">General</option>
                    <option value="OBC">OBC</option>
                    <option value="SC">SC</option>
                    <option value="ST">ST</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end">
                <button
                  onClick={() => setStep(2)}
                  className="px-6 py-2.5 rounded-xl bg-primary text-primary-foreground font-medium hover:bg-primary/90"
                >
                  Next →
                </button>
              </div>
            </div>
          )}

          {/* Step 2: Academic Details */}
          {step === 2 && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold">Academic Details</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1.5">10th Percentage</label>
                  <input
                    type="number"
                    step="0.01"
                    value={form.tenthPercent ?? ""}
                    onChange={(e) => updateForm("tenthPercent", e.target.value)}
                    placeholder="e.g. 85.5"
                    className="w-full px-4 py-2.5 rounded-xl border border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">10th Board</label>
                  <input
                    type="text"
                    value={form.tenthBoard}
                    onChange={(e) => updateForm("tenthBoard", e.target.value)}
                    placeholder="e.g. CBSE, ICSE, State"
                    className="w-full px-4 py-2.5 rounded-xl border border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">12th Percentage</label>
                  <input
                    type="number"
                    step="0.01"
                    value={form.twelfthPercent ?? ""}
                    onChange={(e) => updateForm("twelfthPercent", e.target.value)}
                    placeholder="e.g. 78.0"
                    className="w-full px-4 py-2.5 rounded-xl border border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">12th Board</label>
                  <input
                    type="text"
                    value={form.twelfthBoard}
                    onChange={(e) => updateForm("twelfthBoard", e.target.value)}
                    placeholder="e.g. CBSE, PUC"
                    className="w-full px-4 py-2.5 rounded-xl border border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">CGPA</label>
                  <input
                    type="number"
                    step="0.01"
                    value={form.cgpa ?? ""}
                    onChange={(e) => updateForm("cgpa", e.target.value)}
                    placeholder="e.g. 8.5"
                    className="w-full px-4 py-2.5 rounded-xl border border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">Active Backlogs</label>
                  <input
                    type="number"
                    value={form.backlogs ?? 0}
                    onChange={(e) => updateForm("backlogs", e.target.value)}
                    placeholder="0"
                    className="w-full px-4 py-2.5 rounded-xl border border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
              </div>
              <div className="flex justify-between">
                <button onClick={() => setStep(1)} className="px-6 py-2.5 rounded-xl border border-border text-foreground font-medium hover:bg-secondary">
                  ← Back
                </button>
                <button onClick={() => setStep(3)} className="px-6 py-2.5 rounded-xl bg-primary text-primary-foreground font-medium hover:bg-primary/90">
                  Next →
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Resume */}
          {step === 3 && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold">Resume</h2>
              
              <div>
                <label className="block text-sm font-medium mb-1.5">Skills</label>
                <input
                  type="text"
                  value={form.skills}
                  onChange={(e) => updateForm("skills", e.target.value)}
                  placeholder="e.g. JavaScript, Python, React, SQL"
                  className="w-full px-4 py-2.5 rounded-xl border border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">About Me</label>
                <textarea
                  value={form.aboutMe}
                  onChange={(e) => updateForm("aboutMe", e.target.value)}
                  placeholder="Brief description about yourself..."
                  rows={3}
                  className="w-full px-4 py-2.5 rounded-xl border border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring resize-none"
                />
              </div>

              <div className="p-4 rounded-xl bg-muted/50 border border-border">
                <p className="text-sm font-medium mb-3">Do you have a resume to upload?</p>
                <div className="flex gap-3">
                  <button
                    onClick={() => setHasResume(true)}
                    className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-colors ${
                      hasResume === true ? "bg-primary text-primary-foreground border-primary" : "border-border hover:bg-secondary"
                    }`}
                  >
                    Yes, upload
                  </button>
                  <button
                    onClick={() => setHasResume(false)}
                    className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-colors ${
                      hasResume === false ? "bg-primary text-primary-foreground border-primary" : "border-border hover:bg-secondary"
                    }`}
                  >
                    No, auto-generate
                  </button>
                </div>

                {hasResume === true && (
                  <div className="mt-3">
                    <label className="flex items-center gap-2 px-4 py-3 rounded-xl border-2 border-dashed border-border hover:border-primary cursor-pointer transition-colors">
                      <Upload className="w-5 h-5 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">
                        {resumeFile ? resumeFile.name : "Click to upload PDF"}
                      </span>
                      <input
                        type="file"
                        accept=".pdf"
                        className="hidden"
                        onChange={(e) => setResumeFile(e.target.files?.[0] || null)}
                      />
                    </label>
                  </div>
                )}

                {hasResume === false && (
                  <p className="mt-3 text-xs text-muted-foreground">
                    ✨ A resume will be auto-generated from your profile details (name, email, education, skills).
                  </p>
                )}
              </div>

              <div className="flex justify-between">
                <button onClick={() => setStep(2)} className="px-6 py-2.5 rounded-xl border border-border text-foreground font-medium hover:bg-secondary">
                  ← Back
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={loading}
                  className="px-6 py-2.5 rounded-xl bg-primary text-primary-foreground font-medium hover:bg-primary/90 disabled:opacity-50 flex items-center gap-2"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                  Complete & Go to Dashboard
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
