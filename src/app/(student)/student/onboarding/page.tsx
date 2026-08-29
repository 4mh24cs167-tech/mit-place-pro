"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { studentApi } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { generateResumePdf, downloadResumePdf } from "@/lib/resume-generator";
import { User, GraduationCap, FileText, Loader2, Upload, CheckCircle2, Plus, Trash2, AlertCircle } from "lucide-react";
import EducationManager from "@/components/education/EducationManager";

/* ═══════════════════════════════════════════════════ */
/* Types                                               */
/* ═══════════════════════════════════════════════════ */
type EduLevel = "SSLC" | "PUC" | "Diploma" | "UG" | "PG";

interface EducationEntry {
  level: EduLevel;
  percentage?: number;
  board?: string;
  year?: number;
  stream?: string;
  collegeName?: string;
  courseName?: string;
  driveLink?: string;
  file?: File | null;
}

interface ProfileData {
  fullName?: string;
  phone?: string;
  dateOfBirth?: string;
  gender?: string;
  category?: string;
  collegeName?: string;
  cgpa?: number;
  backlogs?: number;
  semester?: number;
  familyIncome?: number;
  skills?: string;
  aboutMe?: string;
}

const EDU_LEVELS: EduLevel[] = ["SSLC", "PUC", "Diploma", "UG", "PG"];
const EDU_LABELS: Record<EduLevel, string> = {
  SSLC: "SSLC (10th Standard)",
  PUC: "PUC (12th / Higher Secondary)",
  Diploma: "Diploma",
  UG: "Undergraduate (B.E. / B.Tech / B.Sc etc.)",
  PG: "Postgraduate (M.Tech / MBA / M.Sc etc.)",
};

/* Prerequisites: what you need before adding a level */
const PREREQUISITES: Record<EduLevel, EduLevel[]> = {
  SSLC: [],
  PUC: ["SSLC"],
  Diploma: ["SSLC"],
  UG: ["SSLC"], // need SSLC + (PUC or Diploma)
  PG: ["SSLC", "UG"], // need SSLC + (PUC or Diploma) + UG
};

const inputClass = "w-full px-4 py-2.5 rounded-xl border border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring text-sm";

/* ═══════════════════════════════════════════════════ */
/* Component                                           */
/* ═══════════════════════════════════════════════════ */
export default function StudentOnboarding() {
  const router = useRouter();
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [hasResume, setHasResume] = useState<boolean | null>(null);
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [studentName, setStudentName] = useState("");

  const [form, setForm] = useState<ProfileData>({
    fullName: "",
    phone: "",
    dateOfBirth: "",
    gender: "",
    category: "",
    collegeName: "",
    cgpa: undefined,
    backlogs: 0,
    semester: undefined,
    familyIncome: undefined,
    skills: "",
    aboutMe: "",
  });

  const [educations, setEducations] = useState<EducationEntry[]>([]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const updateForm = (field: string, value: any) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  // Fetch student profile to get full name for resume
  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    studentApi.getProfile().then((res: any) => {
      const profile = res?.data || res;
      if (profile?.fullName) setStudentName(profile.fullName);
    }).catch(() => {});
  }, []);

  /* ─── Education helpers ─────────────────────────── */
  const addedLevels = educations.map((e) => e.level);
  const hasPucOrDiploma = addedLevels.includes("PUC") || addedLevels.includes("Diploma");

  const canAddLevel = (level: EduLevel): boolean => {
    if (addedLevels.includes(level)) return false; // already added
    // PUC and Diploma are mutually exclusive path to UG
    if (level === "PUC" && addedLevels.includes("Diploma")) return false;
    if (level === "Diploma" && addedLevels.includes("PUC")) return false;
    // Check prerequisites
    for (const prereq of PREREQUISITES[level]) {
      if (!addedLevels.includes(prereq)) return false;
    }
    // UG needs PUC or Diploma
    if (level === "UG" && !hasPucOrDiploma) return false;
    // PG needs UG
    if (level === "PG" && !addedLevels.includes("UG")) return false;
    return true;
  };

  const addEducation = (level: EduLevel) => {
    if (!canAddLevel(level)) return;
    setEducations((prev) => [...prev, { level, file: null }]);
  };

  const removeEducation = (level: EduLevel) => {
    // Also remove dependents
    const dependents: EduLevel[] = [];
    if (level === "SSLC") dependents.push("PUC", "Diploma", "UG", "PG");
    if (level === "PUC" || level === "Diploma") dependents.push("UG", "PG");
    if (level === "UG") dependents.push("PG");
    setEducations((prev) => prev.filter((e) => e.level !== level && !dependents.includes(e.level)));
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const updateEdu = (level: EduLevel, field: string, value: any) => {
    setEducations((prev) => prev.map((e) => (e.level === level ? { ...e, [field]: value } : e)));
  };

  const getEdu = (level: EduLevel) => educations.find((e) => e.level === level);

  const availableLevels = EDU_LEVELS.filter((l) => canAddLevel(l));

  /* ─── Submit ────────────────────────────────────── */
  const handleSubmit = async () => {
    if (!form.phone) return setError("Phone number is required");
    setError("");
    setLoading(true);
    try {
      const sslc = getEdu("SSLC");
      const puc = getEdu("PUC");
      const diploma = getEdu("Diploma");
      const ug = getEdu("UG");
      const pg = getEdu("PG");

      await studentApi.updateProfile({
        fullName: form.fullName || undefined,
        phone: form.phone,
        dateOfBirth: form.dateOfBirth || undefined,
        gender: form.gender || undefined,
        category: form.category || undefined,
        tenthPercent: sslc?.percentage ? Number(sslc.percentage) : undefined,
        tenthBoard: sslc?.board || undefined,
        tenthYear: sslc?.year ? Number(sslc.year) : undefined,
        twelfthPercent: puc?.percentage ? Number(puc.percentage) : diploma?.percentage ? Number(diploma.percentage) : undefined,
        twelfthBoard: puc?.board || diploma?.board || undefined,
        twelfthYear: puc?.year ? Number(puc.year) : diploma?.year ? Number(diploma.year) : undefined,
        twelfthStream: puc?.stream || (diploma ? "Diploma" : undefined),
        cgpa: form.cgpa ? Number(form.cgpa) : undefined,
        backlogs: form.backlogs ? Number(form.backlogs) : 0,
        semester: form.semester ? Number(form.semester) : undefined,
        familyIncome: form.familyIncome ? Number(form.familyIncome) : undefined,
        skills: form.skills || undefined,
        aboutMe: form.aboutMe || undefined,
        profileComplete: true,
        profileData: {
          collegeName: form.collegeName,
          educations: educations.map(({ level, percentage, board, year, stream, collegeName, courseName, driveLink }) => ({
            level, percentage, board, year, stream, collegeName, courseName, driveLink,
          })),
          ugCourseName: ug?.courseName,
          ugCollegeName: ug?.collegeName,
          pgCourseName: pg?.courseName,
          pgCollegeName: pg?.collegeName,
          diplomaCollegeName: diploma?.collegeName,
          skills: form.skills,
          aboutMe: form.aboutMe,
        },
      });

      // Handle resume
      if (hasResume && resumeFile) {
        await studentApi.updateProfile({ resumeLink: resumeFile.name });
      }

      if (hasResume === false) {
        try {
          const pdfBlob = await generateResumePdf({
            fullName: studentName || user?.email?.split("@")[0] || "Student",
            email: user?.email || "",
            phone: form.phone,
            gender: form.gender,
            category: form.category,
            dateOfBirth: form.dateOfBirth,
            tenthPercent: sslc?.percentage ? Number(sslc.percentage) : undefined,
            tenthBoard: sslc?.board,
            twelfthPercent: puc?.percentage ? Number(puc.percentage) : diploma?.percentage ? Number(diploma.percentage) : undefined,
            twelfthBoard: puc?.board || diploma?.board,
            cgpa: form.cgpa ? Number(form.cgpa) : undefined,
            backlogs: form.backlogs ? Number(form.backlogs) : undefined,
            skills: form.skills,
            aboutMe: form.aboutMe,
          });
          downloadResumePdf(pdfBlob, `Resume_${Date.now()}.pdf`);
          await studentApi.updateProfile({
            resumeLink: "auto-generated",
            profileData: { skills: form.skills, aboutMe: form.aboutMe },
          });
        } catch (pdfErr) {
          console.warn("Resume generation failed:", pdfErr);
          await studentApi.updateProfile({
            resumeLink: "auto-generated",
            profileData: { skills: form.skills, aboutMe: form.aboutMe },
          });
        }
      }

      router.push("/student/dashboard");
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      setError(err?.message || "Failed to save profile");
    } finally {
      setLoading(false);
    }
  };

  /* ═══════════════════════════════════════════════════ */
  /* Render                                              */
  /* ═══════════════════════════════════════════════════ */
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
            { num: 2, label: "Education", icon: GraduationCap },
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

          {/* ══════════════════════════════════════════ */}
          {/* Step 1: Personal Details                   */}
          {/* ══════════════════════════════════════════ */}
          {step === 1 && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold">Personal Details</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1.5">Full Name</label>
                  <input type="text" value={form.fullName || ""} onChange={(e) => updateForm("fullName", e.target.value)} placeholder="Your full name" className={inputClass} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">Phone Number *</label>
                  <input type="tel" value={form.phone || ""} onChange={(e) => updateForm("phone", e.target.value)} placeholder="+91 XXXXXXXXXX" className={inputClass} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">Date of Birth</label>
                  <input type="date" value={form.dateOfBirth} onChange={(e) => updateForm("dateOfBirth", e.target.value)} className={inputClass} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">Gender</label>
                  <select value={form.gender} onChange={(e) => updateForm("gender", e.target.value)} className={inputClass}>
                    <option value="">Select</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">Category</label>
                  <select value={form.category} onChange={(e) => updateForm("category", e.target.value)} className={inputClass}>
                    <option value="">Select</option>
                    <option value="General">General</option>
                    <option value="OBC">OBC</option>
                    <option value="SC">SC</option>
                    <option value="ST">ST</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">College Name</label>
                  <input type="text" value={form.collegeName || ""} onChange={(e) => updateForm("collegeName", e.target.value)} placeholder="e.g. Maharaja Institute of Technology, Mysuru" className={inputClass} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">Family Income (INR/year)</label>
                  <input type="number" value={form.familyIncome ?? ""} onChange={(e) => updateForm("familyIncome", e.target.value)} placeholder="e.g. 500000" className={inputClass} />
                </div>
              </div>
              <div className="flex justify-end">
                <button onClick={() => setStep(2)} className="px-6 py-2.5 rounded-xl bg-primary text-primary-foreground font-medium hover:bg-primary/90">
                  Next →
                </button>
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════════ */}
          {/* Step 2: Education Details                  */}
          {/* ══════════════════════════════════════════ */}
          {step === 2 && (
            <div className="space-y-5">
              <h2 className="text-lg font-semibold">Education & Qualifications</h2>

              {/* Current UG Details (always shown) */}
              <div className="p-4 rounded-xl bg-indigo-50/50 border border-indigo-100">
                <h3 className="text-sm font-semibold text-indigo-700 mb-3">Current UG Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-medium mb-1">CGPA</label>
                    <input type="number" step="0.01" value={form.cgpa ?? ""} onChange={(e) => updateForm("cgpa", e.target.value)} placeholder="e.g. 8.5" className={inputClass} />
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1">Semester</label>
                    <input type="number" value={form.semester ?? ""} onChange={(e) => updateForm("semester", e.target.value)} placeholder="e.g. 6" className={inputClass} />
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1">Active Backlogs</label>
                    <input type="number" value={form.backlogs ?? 0} onChange={(e) => updateForm("backlogs", e.target.value)} placeholder="0" className={inputClass} />
                  </div>
                </div>
              </div>

              {/* Dynamic Education Manager */}
              <EducationManager editing={true} />

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

          {/* ══════════════════════════════════════════ */}
          {/* Step 3: Resume                             */}
          {/* ══════════════════════════════════════════ */}
          {step === 3 && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold">Resume</h2>

              <div>
                <label className="block text-sm font-medium mb-1.5">Skills</label>
                <input type="text" value={form.skills} onChange={(e) => updateForm("skills", e.target.value)} placeholder="e.g. JavaScript, Python, React, SQL" className={inputClass} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">About Me</label>
                <textarea value={form.aboutMe} onChange={(e) => updateForm("aboutMe", e.target.value)} placeholder="Brief description about yourself..." rows={3} className={`${inputClass} resize-none`} />
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
                      <input type="file" accept=".pdf,.jpg,.jpeg,.png" className="hidden" onChange={(e) => setResumeFile(e.target.files?.[0] || null)} />
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

/* ═══════════════════════════════════════════════════ */
/* Education Card Component                            */
/* ═══════════════════════════════════════════════════ */
function EducationCard({
  edu,
  updateEdu,
  removeEducation,
}: {
  edu: EducationEntry;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  updateEdu: (level: EduLevel, field: string, value: any) => void;
  removeEducation: (level: EduLevel) => void;
}) {
  const isHigherEd = edu.level === "UG" || edu.level === "PG";
  const isDiploma = edu.level === "Diploma";
  const bgColors: Record<EduLevel, string> = {
    SSLC: "bg-emerald-50/50 border-emerald-100",
    PUC: "bg-violet-50/50 border-violet-100",
    Diploma: "bg-orange-50/50 border-orange-100",
    UG: "bg-blue-50/50 border-blue-100",
    PG: "bg-pink-50/50 border-pink-100",
  };
  const iconColors: Record<EduLevel, string> = {
    SSLC: "text-emerald-600",
    PUC: "text-violet-600",
    Diploma: "text-orange-600",
    UG: "text-blue-600",
    PG: "text-pink-600",
  };

  return (
    <div className={`p-4 rounded-xl border ${bgColors[edu.level]}`}>
      <div className="flex items-center justify-between mb-3">
        <h3 className={`text-sm font-semibold ${iconColors[edu.level]}`}>
          {EDU_LABELS[edu.level]}
        </h3>
        <button onClick={() => removeEducation(edu.level)} className="p-1 rounded-lg hover:bg-red-100 text-red-400 hover:text-red-600 transition-colors" title="Remove">
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {/* Course Name (UG/PG only) */}
        {isHigherEd && (
          <div className="md:col-span-2">
            <label className="block text-xs font-medium mb-1">Course Name *</label>
            <input type="text" value={edu.courseName || ""} onChange={(e) => updateEdu(edu.level, "courseName", e.target.value)} placeholder={edu.level === "UG" ? "e.g. B.E. Computer Science" : "e.g. M.Tech AI & ML"} className={inputClass} />
          </div>
        )}

        {/* College Name (UG/PG/Diploma) */}
        {(isHigherEd || isDiploma) && (
          <div className="md:col-span-2">
            <label className="block text-xs font-medium mb-1">College / Institution Name *</label>
            <input type="text" value={edu.collegeName || ""} onChange={(e) => updateEdu(edu.level, "collegeName", e.target.value)} placeholder="e.g. Maharaja Institute of Technology, Mysuru" className={inputClass} />
          </div>
        )}

        <div>
          <label className="block text-xs font-medium mb-1">Percentage / CGPA</label>
          <input type="number" step="0.01" value={edu.percentage ?? ""} onChange={(e) => updateEdu(edu.level, "percentage", e.target.value)} placeholder="e.g. 85.5" className={inputClass} />
        </div>

        {/* Board (SSLC/PUC) */}
        {(edu.level === "SSLC" || edu.level === "PUC") && (
          <div>
            <label className="block text-xs font-medium mb-1">Board</label>
            <select value={edu.board || ""} onChange={(e) => updateEdu(edu.level, "board", e.target.value)} className={inputClass}>
              <option value="">Select...</option>
              <option value="CBSE">CBSE</option>
              <option value="ICSE">ICSE</option>
              <option value="State Board">State Board</option>
              <option value="Karnataka PUC">Karnataka PUC</option>
              <option value="Other">Other</option>
            </select>
          </div>
        )}

        <div>
          <label className="block text-xs font-medium mb-1">Year of Passing</label>
          <input type="number" value={edu.year ?? ""} onChange={(e) => updateEdu(edu.level, "year", e.target.value)} placeholder="e.g. 2022" className={inputClass} />
        </div>

        {/* Stream (PUC only) */}
        {edu.level === "PUC" && (
          <div>
            <label className="block text-xs font-medium mb-1">Stream</label>
            <select value={edu.stream || ""} onChange={(e) => updateEdu(edu.level, "stream", e.target.value)} className={inputClass}>
              <option value="">Select Stream</option>
              <option value="Science">Science</option>
              <option value="Commerce">Commerce</option>
              <option value="Arts">Arts</option>
            </select>
          </div>
        )}
      </div>

      {/* Document Upload */}
      <div className="mt-3 space-y-2">
        <label className="block text-xs font-medium">
          {edu.level} Marks Card
        </label>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          <input
            type="text"
            value={edu.driveLink || ""}
            onChange={(e) => updateEdu(edu.level, "driveLink", e.target.value)}
            placeholder="Google Drive link (optional)"
            className={inputClass}
          />
          <label className="flex items-center gap-2 px-3 py-2 rounded-xl border border-dashed border-input hover:border-primary cursor-pointer transition-colors">
            <Upload className="w-4 h-4 text-muted-foreground shrink-0" />
            <span className="text-xs text-muted-foreground truncate">
              {edu.file ? edu.file.name : "Upload JPG/PDF"}
            </span>
            <input
              type="file"
              accept=".pdf,.jpg,.jpeg,.png"
              className="hidden"
              onChange={(e) => updateEdu(edu.level, "file", e.target.files?.[0] || null)}
            />
          </label>
        </div>
      </div>
    </div>
  );
}
