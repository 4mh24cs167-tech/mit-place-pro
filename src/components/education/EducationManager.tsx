"use client";

import { useState, useEffect, useCallback } from "react";
import { studentApi } from "@/lib/api";
import {
  GraduationCap, Plus, Trash2, Edit3, Upload, Eye, X, Lock,
  AlertCircle, CheckCircle2, Loader2, FileText, ExternalLink, Save,
} from "lucide-react";

/* ═══════════════════════════════════════════════════ */
/* Types                                               */
/* ═══════════════════════════════════════════════════ */
type QualType = "SSLC" | "PUC" | "DIPLOMA" | "UG" | "PG";

interface EducationRecord {
  id: string;
  qualificationType: QualType;
  courseName?: string | null;
  collegeName?: string | null;
  university?: string | null;
  board?: string | null;
  stream?: string | null;
  specialization?: string | null;
  registrationNumber?: string | null;
  startYear?: number | null;
  passingYear?: number | null;
  percentage?: number | null;
  cgpa?: number | null;
  documentDriveUrl?: string | null;
  documentFileName?: string | null;
  documentFileType?: string | null;
}

const QUAL_ORDER: QualType[] = ["SSLC", "PUC", "DIPLOMA", "UG", "PG"];
const QUAL_LABELS: Record<QualType, string> = {
  SSLC: "SSLC (10th Standard)",
  PUC: "PUC (12th / Higher Secondary)",
  DIPLOMA: "Diploma",
  UG: "Undergraduate (UG)",
  PG: "Postgraduate (PG)",
};
const QUAL_ICONS: Record<QualType, string> = {
  SSLC: "🏫", PUC: "🎓", DIPLOMA: "📜", UG: "🎒", PG: "🧑‍🎓",
};
const QUAL_COLORS: Record<QualType, { bg: string; border: string; text: string; badge: string }> = {
  SSLC: { bg: "bg-emerald-50/60", border: "border-emerald-200", text: "text-emerald-700", badge: "bg-emerald-100 text-emerald-700" },
  PUC: { bg: "bg-violet-50/60", border: "border-violet-200", text: "text-violet-700", badge: "bg-violet-100 text-violet-700" },
  DIPLOMA: { bg: "bg-orange-50/60", border: "border-orange-200", text: "text-orange-700", badge: "bg-orange-100 text-orange-700" },
  UG: { bg: "bg-blue-50/60", border: "border-blue-200", text: "text-blue-700", badge: "bg-blue-100 text-blue-700" },
  PG: { bg: "bg-pink-50/60", border: "border-pink-200", text: "text-pink-700", badge: "bg-pink-100 text-pink-700" },
};

const BOARD_OPTIONS = ["CBSE", "ICSE", "State Board", "Karnataka PUC", "Other"];
const STREAM_OPTIONS = ["Science", "Commerce", "Arts", "Other"];
const inputCls = "w-full px-3.5 py-2.5 rounded-xl border border-border/60 text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 bg-white/80 transition-all";

/* ═══════════════════════════════════════════════════ */
/* Dependency Logic                                    */
/* ═══════════════════════════════════════════════════ */
function canAddQual(qual: QualType, existing: QualType[]): { allowed: boolean; reason?: string } {
  if (existing.includes(qual)) return { allowed: false, reason: "Already added" };

  if (qual === "UG") {
    if (!existing.includes("SSLC"))
      return { allowed: false, reason: "Requires SSLC" };
    if (!existing.includes("PUC") && !existing.includes("DIPLOMA"))
      return { allowed: false, reason: "Requires PUC or Diploma" };
  }
  if (qual === "PG") {
    if (!existing.includes("SSLC"))
      return { allowed: false, reason: "Requires SSLC" };
    if (!existing.includes("PUC") && !existing.includes("DIPLOMA"))
      return { allowed: false, reason: "Requires PUC or Diploma" };
    if (!existing.includes("UG"))
      return { allowed: false, reason: "Requires UG" };
  }
  return { allowed: true };
}

function getRemoveWarning(qual: QualType, existing: QualType[]): string | null {
  if (qual === "SSLC" && (existing.includes("UG") || existing.includes("PG"))) {
    return "SSLC cannot be removed while UG/PG exists. Remove them first.";
  }
  if ((qual === "PUC" || qual === "DIPLOMA") && existing.includes("UG")) {
    const other = qual === "PUC" ? "DIPLOMA" : "PUC";
    if (!existing.includes(other)) return `Cannot remove ${qual} while UG exists. Remove UG first or add ${other}.`;
  }
  if (qual === "UG" && existing.includes("PG")) {
    return "UG cannot be removed while PG exists. Remove PG first.";
  }
  return null;
}

/* ═══════════════════════════════════════════════════ */
/* Main Component                                      */
/* ═══════════════════════════════════════════════════ */
export default function EducationManager({ editing = true }: { editing?: boolean }) {
  const [records, setRecords] = useState<EducationRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [addingType, setAddingType] = useState<QualType | null>(null);
  const [toast, setToast] = useState<{ type: "success" | "error"; msg: string } | null>(null);
  const [uploading, setUploading] = useState<string | null>(null);

  const showToast = (type: "success" | "error", msg: string) => {
    setToast({ type, msg }); setTimeout(() => setToast(null), 3500);
  };

  const fetchRecords = useCallback(async () => {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const res: any = await studentApi.getEducations();
      setRecords(res?.data || []);
    } catch { /* ignore */ } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchRecords(); }, [fetchRecords]);

  const existingTypes = records.map((r) => r.qualificationType);

  /* ─── Add new qualification ─────────────── */
  const handleAdd = async (form: Record<string, unknown>) => {
    setSaving("new");
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const res: any = await studentApi.addEducation(form);
      showToast("success", `${form.qualificationType} added successfully!`);
      setAddingType(null);
      setShowAdd(false);
      await fetchRecords();
      // Auto-enter edit mode for new record
      if (res?.data?.id) setEditingId(res.data.id);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to add qualification";
      showToast("error", msg);
    } finally { setSaving(null); }
  };

  /* ─── Update ──────────────────────────────── */
  const handleUpdate = async (id: string, data: Record<string, unknown>) => {
    setSaving(id);
    try {
      await studentApi.updateEducation(id, data);
      showToast("success", "Education details saved!");
      setEditingId(null);
      await fetchRecords();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to update";
      showToast("error", msg);
    } finally { setSaving(null); }
  };

  /* ─── Delete ──────────────────────────────── */
  const handleDelete = async (id: string, qual: QualType) => {
    const warning = getRemoveWarning(qual, existingTypes);
    if (warning) { showToast("error", warning); return; }
    if (!confirm(`Remove ${QUAL_LABELS[qual]}? This action cannot be undone.`)) return;
    setSaving(id);
    try {
      await studentApi.deleteEducation(id);
      showToast("success", `${qual} removed`);
      await fetchRecords();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to remove";
      showToast("error", msg);
    } finally { setSaving(null); }
  };

  /* ─── File upload ─────────────────────────── */
  const handleFileUpload = async (id: string, file: File) => {
    const ext = file.name.split(".").pop()?.toLowerCase() || "";
    if (!["jpg", "jpeg", "pdf"].includes(ext)) {
      showToast("error", "Unsupported file format. Please upload a JPG, JPEG, or PDF file.");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      showToast("error", "File size exceeds 2MB limit.");
      return;
    }
    setUploading(id);
    try {
      await studentApi.uploadEducationDocument(id, file);
      showToast("success", "Document uploaded!");
      await fetchRecords();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Upload failed";
      showToast("error", msg);
    } finally { setUploading(null); }
  };

  /* ═══════════════════════════════════════════ */
  /* Render                                      */
  /* ═══════════════════════════════════════════ */
  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-indigo-500" />
      </div>
    );
  }

  // Sort records by QUAL_ORDER
  const sorted = [...records].sort((a, b) => QUAL_ORDER.indexOf(a.qualificationType) - QUAL_ORDER.indexOf(b.qualificationType));

  return (
    <div className="space-y-4">
      {/* Header + Add Button */}
      {editing && (
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground">Add your academic qualifications one by one</p>
          <button
            onClick={() => setShowAdd(!showAdd)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white text-xs font-semibold shadow-md hover:shadow-lg transition-all"
          >
            <Plus className="w-3.5 h-3.5" /> Add Qualification
          </button>
        </div>
      )}

      {/* Add Dropdown */}
      {showAdd && editing && (
        <div className="p-4 rounded-xl border border-indigo-200 bg-indigo-50/30 space-y-3">
          <p className="text-sm font-semibold text-foreground">Select Qualification to Add</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
            {QUAL_ORDER.map((q) => {
              const { allowed, reason } = canAddQual(q, existingTypes);
              return (
                <button
                  key={q}
                  disabled={!allowed}
                  onClick={() => { setAddingType(q); setShowAdd(false); }}
                  className={`flex items-center gap-2 p-3 rounded-xl border text-left text-sm transition-all ${
                    allowed
                      ? "border-indigo-200 bg-white hover:border-indigo-400 hover:shadow-sm cursor-pointer"
                      : "border-border/40 bg-muted/30 opacity-60 cursor-not-allowed"
                  }`}
                >
                  <span className="text-lg">{QUAL_ICONS[q]}</span>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground truncate">{q}</p>
                    {!allowed && (
                      <p className="text-[10px] text-red-500 flex items-center gap-1 mt-0.5">
                        <Lock className="w-3 h-3" /> {reason}
                      </p>
                    )}
                  </div>
                  {allowed && <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />}
                </button>
              );
            })}
          </div>
          <button onClick={() => setShowAdd(false)} className="text-xs text-muted-foreground hover:text-foreground">Cancel</button>
        </div>
      )}

      {/* New Qualification Form */}
      {addingType && editing && (
        <QualificationForm
          qualType={addingType}
          onSave={(data) => handleAdd({ qualificationType: addingType, ...data })}
          onCancel={() => setAddingType(null)}
          saving={saving === "new"}
        />
      )}

      {/* Empty State */}
      {sorted.length === 0 && !addingType && (
        <div className="flex flex-col items-center gap-3 py-8 text-center">
          <GraduationCap className="w-10 h-10 text-muted-foreground/30" />
          <p className="text-sm text-muted-foreground">No qualifications added yet</p>
          <p className="text-xs text-muted-foreground/60">Click &quot;Add Qualification&quot; to get started</p>
        </div>
      )}

      {/* Qualification Cards */}
      {sorted.map((rec) => (
        <QualificationCard
          key={rec.id}
          record={rec}
          editing={editing}
          isEditing={editingId === rec.id}
          saving={saving === rec.id}
          uploading={uploading === rec.id}
          onEdit={() => setEditingId(editingId === rec.id ? null : rec.id)}
          onDelete={() => handleDelete(rec.id, rec.qualificationType)}
          onUpdate={(data) => handleUpdate(rec.id, data)}
          onUpload={(file) => handleFileUpload(rec.id, file)}
          onCancel={() => setEditingId(null)}
        />
      ))}

      {/* Toast */}
      {toast && (
        <div className={`fixed bottom-6 right-6 z-50 px-4 py-3 rounded-xl shadow-lg text-sm font-medium ${
          toast.type === "success" ? "bg-emerald-600 text-white" : "bg-red-600 text-white"
        }`}>
          {toast.msg}
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════ */
/* Qualification Form (Add New)                        */
/* ═══════════════════════════════════════════════════ */
function QualificationForm({
  qualType, onSave, onCancel, saving, initialData,
}: {
  qualType: QualType;
  onSave: (data: Record<string, unknown>) => void;
  onCancel: () => void;
  saving: boolean;
  initialData?: EducationRecord;
}) {
  const [form, setForm] = useState<Record<string, string>>({
    collegeName: initialData?.collegeName || "",
    courseName: initialData?.courseName || "",
    university: initialData?.university || "",
    board: initialData?.board || "",
    stream: initialData?.stream || "",
    specialization: initialData?.specialization || "",
    registrationNumber: initialData?.registrationNumber || "",
    startYear: initialData?.startYear?.toString() || "",
    passingYear: initialData?.passingYear?.toString() || "",
    percentage: initialData?.percentage?.toString() || "",
    cgpa: initialData?.cgpa?.toString() || "",
    documentDriveUrl: initialData?.documentDriveUrl || "",
  });

  const set = (k: string, v: string) => setForm((p) => ({ ...p, [k]: v }));
  const c = QUAL_COLORS[qualType];

  const handleSubmit = () => {
    const data: Record<string, unknown> = {};
    if (form.collegeName) data.collegeName = form.collegeName;
    if (form.courseName) data.courseName = form.courseName;
    if (form.university) data.university = form.university;
    if (form.board) data.board = form.board;
    if (form.stream) data.stream = form.stream;
    if (form.specialization) data.specialization = form.specialization;
    if (form.registrationNumber) data.registrationNumber = form.registrationNumber;
    if (form.startYear) data.startYear = Number(form.startYear);
    if (form.passingYear) data.passingYear = Number(form.passingYear);
    if (form.percentage) data.percentage = Number(form.percentage);
    if (form.cgpa) data.cgpa = Number(form.cgpa);
    if (form.documentDriveUrl) data.documentDriveUrl = form.documentDriveUrl;
    onSave(data);
  };

  const isHigherEd = qualType === "UG" || qualType === "PG";
  const isDiploma = qualType === "DIPLOMA";

  return (
    <div className={`p-5 rounded-xl border-2 ${c.border} ${c.bg} space-y-4`}>
      <div className="flex items-center justify-between">
        <h3 className={`text-sm font-bold ${c.text} flex items-center gap-2`}>
          <span className="text-lg">{QUAL_ICONS[qualType]}</span>
          {initialData ? "Edit" : "Add"} {QUAL_LABELS[qualType]}
        </h3>
        <button onClick={onCancel} className="p-1 rounded-lg hover:bg-white/60"><X className="w-4 h-4" /></button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* SSLC: School Name */}
        {qualType === "SSLC" && (
          <div className="sm:col-span-2">
            <label className="block text-[10px] font-semibold text-muted-foreground uppercase mb-1">School Name</label>
            <input type="text" value={form.collegeName} onChange={(e) => set("collegeName", e.target.value)} placeholder="Enter school name" className={inputCls} />
          </div>
        )}

        {/* PUC: College Name */}
        {qualType === "PUC" && (
          <div className="sm:col-span-2">
            <label className="block text-[10px] font-semibold text-muted-foreground uppercase mb-1">College Name</label>
            <input type="text" value={form.collegeName} onChange={(e) => set("collegeName", e.target.value)} placeholder="Enter PUC college name" className={inputCls} />
          </div>
        )}

        {/* Diploma/UG/PG: Course + College */}
        {(isDiploma || isHigherEd) && (
          <>
            <div className="sm:col-span-2">
              <label className="block text-[10px] font-semibold text-muted-foreground uppercase mb-1">
                Course Name {isHigherEd && <span className="text-red-400">*</span>}
              </label>
              <input type="text" value={form.courseName} onChange={(e) => set("courseName", e.target.value)}
                placeholder={qualType === "UG" ? "e.g. B.E. / B.Tech / B.Sc" : qualType === "PG" ? "e.g. M.Tech / MBA / MCA" : "e.g. Diploma in CS"}
                className={inputCls} />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-[10px] font-semibold text-muted-foreground uppercase mb-1">
                College / Institution Name <span className="text-red-400">*</span>
              </label>
              <input type="text" value={form.collegeName} onChange={(e) => set("collegeName", e.target.value)}
                placeholder="e.g. Maharaja Institute of Technology, Mysuru" className={inputCls} />
            </div>
          </>
        )}

        {/* University (UG/PG/Diploma) */}
        {(isHigherEd || isDiploma) && (
          <div>
            <label className="block text-[10px] font-semibold text-muted-foreground uppercase mb-1">University / Board</label>
            <input type="text" value={form.university} onChange={(e) => set("university", e.target.value)} placeholder="e.g. VTU" className={inputCls} />
          </div>
        )}

        {/* Specialization (UG/PG/Diploma) */}
        {(isHigherEd || isDiploma) && (
          <div>
            <label className="block text-[10px] font-semibold text-muted-foreground uppercase mb-1">
              {isHigherEd ? "Branch / Specialization" : "Specialization"}
            </label>
            <input type="text" value={form.specialization} onChange={(e) => set("specialization", e.target.value)}
              placeholder={isHigherEd ? "e.g. Computer Science" : "e.g. CS"} className={inputCls} />
          </div>
        )}

        {/* Board (SSLC/PUC) */}
        {(qualType === "SSLC" || qualType === "PUC") && (
          <div>
            <label className="block text-[10px] font-semibold text-muted-foreground uppercase mb-1">Board</label>
            <select value={form.board} onChange={(e) => set("board", e.target.value)} className={inputCls}>
              <option value="">Select Board...</option>
              {BOARD_OPTIONS.map((b) => <option key={b} value={b}>{b}</option>)}
            </select>
          </div>
        )}

        {/* Stream (PUC) */}
        {qualType === "PUC" && (
          <div>
            <label className="block text-[10px] font-semibold text-muted-foreground uppercase mb-1">Stream</label>
            <select value={form.stream} onChange={(e) => set("stream", e.target.value)} className={inputCls}>
              <option value="">Select Stream...</option>
              {STREAM_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        )}

        {/* Registration Number */}
        <div>
          <label className="block text-[10px] font-semibold text-muted-foreground uppercase mb-1">
            {isHigherEd ? "USN / Registration No." : "Registration / Roll No."}
          </label>
          <input type="text" value={form.registrationNumber} onChange={(e) => set("registrationNumber", e.target.value)} placeholder="Enter" className={inputCls} />
        </div>

        {/* Start Year (UG/PG) */}
        {isHigherEd && (
          <div>
            <label className="block text-[10px] font-semibold text-muted-foreground uppercase mb-1">Start Year</label>
            <input type="number" value={form.startYear} onChange={(e) => set("startYear", e.target.value)} placeholder="e.g. 2023" className={inputCls} />
          </div>
        )}

        {/* Passing Year */}
        <div>
          <label className="block text-[10px] font-semibold text-muted-foreground uppercase mb-1">
            {isHigherEd ? "Passing / Expected Year" : "Passing Year"}
          </label>
          <input type="number" value={form.passingYear} onChange={(e) => set("passingYear", e.target.value)} placeholder="e.g. 2025" className={inputCls} />
        </div>

        {/* Percentage */}
        <div>
          <label className="block text-[10px] font-semibold text-muted-foreground uppercase mb-1">Percentage</label>
          <input type="number" step="0.01" value={form.percentage} onChange={(e) => set("percentage", e.target.value)} placeholder="e.g. 85.5" className={inputCls} />
        </div>

        {/* CGPA */}
        <div>
          <label className="block text-[10px] font-semibold text-muted-foreground uppercase mb-1">CGPA</label>
          <input type="number" step="0.01" value={form.cgpa} onChange={(e) => set("cgpa", e.target.value)} placeholder="e.g. 8.5" className={inputCls} />
        </div>
      </div>

      {/* Document Section */}
      <div className="pt-3 border-t border-border/30">
        <label className="block text-[10px] font-semibold text-muted-foreground uppercase mb-2">
          {qualType} Document / Certificate
        </label>
        <p className="text-[10px] text-muted-foreground mb-2">You can either upload the document or provide a Drive link, or both.</p>
        <input type="text" value={form.documentDriveUrl} onChange={(e) => set("documentDriveUrl", e.target.value)}
          placeholder="Google Drive / Document Link (optional)" className={inputCls} />
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end gap-2 pt-2">
        <button onClick={onCancel} className="px-4 py-2 rounded-xl text-sm font-medium text-muted-foreground hover:bg-muted/50 transition-colors">Cancel</button>
        <button onClick={handleSubmit} disabled={saving}
          className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white text-sm font-semibold shadow-md hover:shadow-lg transition-all disabled:opacity-50">
          {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
          {initialData ? "Save Changes" : "Add Qualification"}
        </button>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════ */
/* Qualification Card (View/Edit)                      */
/* ═══════════════════════════════════════════════════ */
function QualificationCard({
  record, editing, isEditing, saving, uploading, onEdit, onDelete, onUpdate, onUpload, onCancel,
}: {
  record: EducationRecord;
  editing: boolean;
  isEditing: boolean;
  saving: boolean;
  uploading: boolean;
  onEdit: () => void;
  onDelete: () => void;
  onUpdate: (data: Record<string, unknown>) => void;
  onUpload: (file: File) => void;
  onCancel: () => void;
}) {
  const q = record.qualificationType;
  const c = QUAL_COLORS[q];

  if (isEditing) {
    return (
      <QualificationForm
        qualType={q}
        initialData={record}
        onSave={onUpdate}
        onCancel={onCancel}
        saving={saving}
      />
    );
  }

  return (
    <div className={`p-4 rounded-xl border ${c.border} ${c.bg} transition-all`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0">
          <span className="text-xl mt-0.5">{QUAL_ICONS[q]}</span>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${c.badge}`}>{q}</span>
              <h4 className="text-sm font-bold text-foreground">
                {record.courseName || QUAL_LABELS[q]}
              </h4>
            </div>
            {record.collegeName && (
              <p className="text-xs text-muted-foreground mt-0.5">{record.collegeName}</p>
            )}
            {record.university && (
              <p className="text-xs text-muted-foreground">{record.university}</p>
            )}
            <div className="flex items-center gap-3 mt-1.5 flex-wrap">
              {record.percentage && (
                <span className={`text-xs font-semibold ${c.text} bg-white/60 px-2 py-0.5 rounded-full`}>
                  {record.percentage}%
                </span>
              )}
              {record.cgpa && (
                <span className={`text-xs font-semibold ${c.text} bg-white/60 px-2 py-0.5 rounded-full`}>
                  CGPA {record.cgpa}
                </span>
              )}
              {record.board && <span className="text-xs text-muted-foreground">{record.board}</span>}
              {record.stream && <span className="text-xs text-muted-foreground">· {record.stream}</span>}
              {record.specialization && <span className="text-xs text-muted-foreground">· {record.specialization}</span>}
              {record.passingYear && <span className="text-xs text-muted-foreground">· {record.passingYear}</span>}
              {record.registrationNumber && <span className="text-xs text-muted-foreground">· {record.registrationNumber}</span>}
            </div>

            {/* Document status */}
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              {record.documentFileName && (
                <span className="inline-flex items-center gap-1 text-[10px] font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                  <CheckCircle2 className="w-3 h-3" /> {record.documentFileName}
                </span>
              )}
              {record.documentDriveUrl && (
                <a href={record.documentDriveUrl} target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-[10px] font-medium text-indigo-600 hover:text-indigo-700">
                  <ExternalLink className="w-3 h-3" /> Drive Link
                </a>
              )}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        {editing && (
          <div className="flex items-center gap-1 shrink-0">
            {/* Upload */}
            <label className="p-1.5 rounded-lg hover:bg-white/60 cursor-pointer transition-colors" title="Upload Document">
              {uploading ? <Loader2 className="w-4 h-4 animate-spin text-indigo-500" /> : <Upload className="w-4 h-4 text-muted-foreground" />}
              <input type="file" accept=".jpg,.jpeg,.pdf" className="hidden"
                onChange={(e) => { const f = e.target.files?.[0]; if (f) onUpload(f); e.target.value = ""; }} />
            </label>
            <button onClick={onEdit} className="p-1.5 rounded-lg hover:bg-white/60 transition-colors" title="Edit">
              <Edit3 className="w-4 h-4 text-muted-foreground" />
            </button>
            <button onClick={onDelete} className="p-1.5 rounded-lg hover:bg-red-50 transition-colors" title="Remove">
              {saving ? <Loader2 className="w-4 h-4 animate-spin text-red-400" /> : <Trash2 className="w-4 h-4 text-red-400" />}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
