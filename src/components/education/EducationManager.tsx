"use client";

import { useState, useEffect, useCallback } from "react";
import { studentApi } from "@/lib/api";
import {
  GraduationCap, Plus, Trash2, Edit3, X,
  CheckCircle2, Loader2, Save, Lock,
} from "lucide-react";

/* ═══════════════════════════════════════════════════ */
/* Types                                               */
/* ═══════════════════════════════════════════════════ */
type QualType = "SSLC" | "PUC" | "DIPLOMA" | "ITI" | "UG" | "PG";

interface EducationRecord {
  id: string;
  qualificationType: QualType;
  specialization?: string | null;
  percentage?: number | null;
  cgpa?: number | null;
}

const QUAL_ORDER: QualType[] = ["SSLC", "PUC", "DIPLOMA", "ITI", "UG", "PG"];
const QUAL_LABELS: Record<QualType, string> = {
  SSLC: "SSLC (10th Standard)",
  PUC: "PUC (12th / Higher Secondary)",
  DIPLOMA: "Diploma",
  ITI: "ITI",
  UG: "Undergraduate (UG)",
  PG: "Postgraduate (PG)",
};
const QUAL_ICONS: Record<QualType, string> = {
  SSLC: "🏫", PUC: "🎓", DIPLOMA: "📜", ITI: "🔧", UG: "🎒", PG: "🧑‍🎓",
};
const QUAL_COLORS: Record<QualType, { bg: string; border: string; text: string; badge: string }> = {
  SSLC: { bg: "bg-emerald-50/60", border: "border-emerald-200", text: "text-emerald-700", badge: "bg-emerald-100 text-emerald-700" },
  PUC: { bg: "bg-violet-50/60", border: "border-violet-200", text: "text-violet-700", badge: "bg-violet-100 text-violet-700" },
  DIPLOMA: { bg: "bg-orange-50/60", border: "border-orange-200", text: "text-orange-700", badge: "bg-orange-100 text-orange-700" },
  ITI: { bg: "bg-amber-50/60", border: "border-amber-200", text: "text-amber-700", badge: "bg-amber-100 text-amber-700" },
  UG: { bg: "bg-blue-50/60", border: "border-blue-200", text: "text-blue-700", badge: "bg-blue-100 text-blue-700" },
  PG: { bg: "bg-pink-50/60", border: "border-pink-200", text: "text-pink-700", badge: "bg-pink-100 text-pink-700" },
};

const NEEDS_SPECIALIZATION: QualType[] = ["ITI", "DIPLOMA", "UG", "PG"];

const inputCls = "w-full px-3.5 py-2.5 rounded-xl border border-border/60 text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 bg-white/80 transition-all";

/* ═══════════════════════════════════════════════════ */
/* Dependency Logic                                    */
/* ═══════════════════════════════════════════════════ */
function canAddQual(qual: QualType, existing: QualType[]): { allowed: boolean; reason?: string } {
  if (existing.includes(qual)) return { allowed: false, reason: "Already added" };
  if (qual === "UG") {
    if (!existing.includes("SSLC")) return { allowed: false, reason: "Requires SSLC" };
    if (!existing.includes("PUC") && !existing.includes("DIPLOMA") && !existing.includes("ITI"))
      return { allowed: false, reason: "Requires PUC, Diploma, or ITI" };
  }
  if (qual === "PG") {
    if (!existing.includes("SSLC")) return { allowed: false, reason: "Requires SSLC" };
    if (!existing.includes("UG")) return { allowed: false, reason: "Requires UG" };
  }
  return { allowed: true };
}

function getRemoveWarning(qual: QualType, existing: QualType[]): string | null {
  if (qual === "SSLC" && (existing.includes("UG") || existing.includes("PG")))
    return "SSLC cannot be removed while UG/PG exists. Remove them first.";
  if ((qual === "PUC" || qual === "DIPLOMA" || qual === "ITI") && existing.includes("UG")) {
    const others = ["PUC", "DIPLOMA", "ITI"].filter(q => q !== qual) as QualType[];
    if (!others.some(o => existing.includes(o))) return `Cannot remove ${qual} while UG exists. Remove UG first.`;
  }
  if (qual === "UG" && existing.includes("PG"))
    return "UG cannot be removed while PG exists. Remove PG first.";
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

  const handleAdd = async (form: Record<string, unknown>) => {
    setSaving("new");
    try {
      await studentApi.addEducation(form);
      showToast("success", `${form.qualificationType} added successfully!`);
      setAddingType(null); setShowAdd(false);
      await fetchRecords();
    } catch (err: unknown) {
      showToast("error", err instanceof Error ? err.message : "Failed to add qualification");
    } finally { setSaving(null); }
  };

  const handleUpdate = async (id: string, data: Record<string, unknown>) => {
    setSaving(id);
    try {
      await studentApi.updateEducation(id, data);
      showToast("success", "Education details saved!");
      setEditingId(null); await fetchRecords();
    } catch (err: unknown) {
      showToast("error", err instanceof Error ? err.message : "Failed to update");
    } finally { setSaving(null); }
  };

  const handleDelete = async (id: string, qual: QualType) => {
    const warning = getRemoveWarning(qual, existingTypes);
    if (warning) { showToast("error", warning); return; }
    if (!confirm(`Remove ${QUAL_LABELS[qual]}? This action cannot be undone.`)) return;
    setSaving(id);
    try {
      await studentApi.deleteEducation(id);
      showToast("success", `${qual} removed`); await fetchRecords();
    } catch (err: unknown) {
      showToast("error", err instanceof Error ? err.message : "Failed to remove");
    } finally { setSaving(null); }
  };

  if (loading) {
    return (<div className="flex items-center justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-indigo-500" /></div>);
  }

  const sorted = [...records].sort((a, b) => QUAL_ORDER.indexOf(a.qualificationType) - QUAL_ORDER.indexOf(b.qualificationType));

  return (
    <div className="space-y-4">
      {editing && (
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground">Add your academic qualifications one by one</p>
          <button onClick={() => setShowAdd(!showAdd)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white text-xs font-semibold shadow-md hover:shadow-lg transition-all">
            <Plus className="w-3.5 h-3.5" /> Add Qualification
          </button>
        </div>
      )}

      {showAdd && editing && (
        <div className="p-4 rounded-xl border border-indigo-200 bg-indigo-50/30 space-y-3">
          <p className="text-sm font-semibold text-foreground">Select Qualification to Add</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {QUAL_ORDER.map((q) => {
              const { allowed, reason } = canAddQual(q, existingTypes);
              return (
                <button key={q} disabled={!allowed}
                  onClick={() => { setAddingType(q); setShowAdd(false); }}
                  className={`flex items-center gap-2 p-3 rounded-xl border text-left text-sm transition-all ${
                    allowed ? "border-indigo-200 bg-white hover:border-indigo-400 hover:shadow-sm cursor-pointer"
                      : "border-border/40 bg-muted/30 opacity-60 cursor-not-allowed"}`}>
                  <span className="text-lg">{QUAL_ICONS[q]}</span>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground truncate">{q}</p>
                    {!allowed && (<p className="text-[10px] text-red-500 flex items-center gap-1 mt-0.5"><Lock className="w-3 h-3" /> {reason}</p>)}
                  </div>
                  {allowed && <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />}
                </button>
              );
            })}
          </div>
          <button onClick={() => setShowAdd(false)} className="text-xs text-muted-foreground hover:text-foreground">Cancel</button>
        </div>
      )}

      {addingType && editing && (
        <QualificationForm qualType={addingType}
          onSave={(data) => handleAdd({ qualificationType: addingType, ...data })}
          onCancel={() => setAddingType(null)} saving={saving === "new"} />
      )}

      {sorted.length === 0 && !addingType && (
        <div className="flex flex-col items-center gap-3 py-8 text-center">
          <GraduationCap className="w-10 h-10 text-muted-foreground/30" />
          <p className="text-sm text-muted-foreground">No qualifications added yet</p>
          <p className="text-xs text-muted-foreground/60">Click &quot;Add Qualification&quot; to get started</p>
        </div>
      )}

      {sorted.map((rec) => (
        <QualificationCard key={rec.id} record={rec} editing={editing}
          isEditing={editingId === rec.id} saving={saving === rec.id}
          onEdit={() => setEditingId(editingId === rec.id ? null : rec.id)}
          onDelete={() => handleDelete(rec.id, rec.qualificationType)}
          onUpdate={(data) => handleUpdate(rec.id, data)}
          onCancel={() => setEditingId(null)} />
      ))}

      {toast && (
        <div className={`fixed bottom-6 right-6 z-50 px-4 py-3 rounded-xl shadow-lg text-sm font-medium ${
          toast.type === "success" ? "bg-emerald-600 text-white" : "bg-red-600 text-white"}`}>
          {toast.msg}
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════ */
/* Qualification Form (Simplified)                     */
/* ═══════════════════════════════════════════════════ */
function QualificationForm({ qualType, onSave, onCancel, saving, initialData }: {
  qualType: QualType; onSave: (data: Record<string, unknown>) => void;
  onCancel: () => void; saving: boolean; initialData?: EducationRecord;
}) {
  const [specialization, setSpecialization] = useState(initialData?.specialization || "");
  const [evalType, setEvalType] = useState<"percentage" | "cgpa">(initialData?.cgpa ? "cgpa" : "percentage");
  const [percentage, setPercentage] = useState(initialData?.percentage?.toString() || "");
  const [cgpa, setCgpa] = useState(initialData?.cgpa?.toString() || "");

  const c = QUAL_COLORS[qualType];
  const needsSpec = NEEDS_SPECIALIZATION.includes(qualType);

  const handleSubmit = () => {
    const data: Record<string, unknown> = {};
    if (needsSpec && specialization) data.specialization = specialization;
    if (evalType === "percentage" && percentage) {
      data.percentage = Number(percentage); data.cgpa = null;
    } else if (evalType === "cgpa" && cgpa) {
      data.cgpa = Number(cgpa); data.percentage = null;
    }
    onSave(data);
  };

  const getSpecPlaceholder = () => {
    switch (qualType) {
      case "ITI": return "e.g. Fitter, Electrician, Turner";
      case "DIPLOMA": return "e.g. Computer Science, Mechanical";
      case "UG": return "e.g. Computer Science & Engineering";
      case "PG": return "e.g. Software Engineering, MBA Finance";
      default: return "";
    }
  };

  return (
    <div className={`p-5 rounded-xl border-2 ${c.border} ${c.bg} space-y-4`}>
      <div className="flex items-center justify-between">
        <h3 className={`text-sm font-bold ${c.text} flex items-center gap-2`}>
          <span className="text-lg">{QUAL_ICONS[qualType]}</span>
          {initialData ? "Edit" : "Add"} {QUAL_LABELS[qualType]}
        </h3>
        <button onClick={onCancel} className="p-1 rounded-lg hover:bg-white/60"><X className="w-4 h-4" /></button>
      </div>

      <div className="space-y-4">
        {needsSpec && (
          <div>
            <label className="block text-[10px] font-semibold text-muted-foreground uppercase mb-1">
              Specialization / Branch / Trade <span className="text-red-400">*</span>
            </label>
            <input type="text" value={specialization} onChange={(e) => setSpecialization(e.target.value)}
              placeholder={getSpecPlaceholder()} className={inputCls} />
          </div>
        )}

        <div>
          <label className="block text-[10px] font-semibold text-muted-foreground uppercase mb-2">
            Academic Performance <span className="text-red-400">*</span>
          </label>
          <div className="flex items-center gap-6 mb-3">
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input type="radio" name={`eval-${qualType}-${initialData?.id || "new"}`}
                checked={evalType === "percentage"} onChange={() => { setEvalType("percentage"); setCgpa(""); }}
                className="w-3.5 h-3.5 accent-indigo-600" />
              <span className="text-xs font-medium text-foreground">Percentage (%)</span>
            </label>
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input type="radio" name={`eval-${qualType}-${initialData?.id || "new"}`}
                checked={evalType === "cgpa"} onChange={() => { setEvalType("cgpa"); setPercentage(""); }}
                className="w-3.5 h-3.5 accent-indigo-600" />
              <span className="text-xs font-medium text-foreground">CGPA / GPA</span>
            </label>
          </div>
          {evalType === "percentage" ? (
            <input type="number" step="0.01" min="0" max="100" value={percentage}
              onChange={(e) => setPercentage(e.target.value)} placeholder="e.g. 85.50" className={inputCls} />
          ) : (
            <input type="number" step="0.01" min="0" max="10" value={cgpa}
              onChange={(e) => setCgpa(e.target.value)} placeholder="e.g. 8.42" className={inputCls} />
          )}
        </div>
      </div>

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
/* Qualification Card (View)                           */
/* ═══════════════════════════════════════════════════ */
function QualificationCard({ record, editing, isEditing, saving, onEdit, onDelete, onUpdate, onCancel }: {
  record: EducationRecord; editing: boolean; isEditing: boolean; saving: boolean;
  onEdit: () => void; onDelete: () => void; onUpdate: (data: Record<string, unknown>) => void; onCancel: () => void;
}) {
  const q = record.qualificationType;
  const c = QUAL_COLORS[q] || QUAL_COLORS.SSLC;

  if (isEditing) {
    return <QualificationForm qualType={q} initialData={record} onSave={onUpdate} onCancel={onCancel} saving={saving} />;
  }

  return (
    <div className={`p-4 rounded-xl border ${c.border} ${c.bg} transition-all`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0">
          <span className="text-xl mt-0.5">{QUAL_ICONS[q] || "📄"}</span>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${c.badge}`}>{q}</span>
              <h4 className="text-sm font-bold text-foreground">{QUAL_LABELS[q] || q}</h4>
            </div>
            <div className="flex items-center gap-3 mt-1.5 flex-wrap">
              {record.percentage && (
                <span className={`text-xs font-semibold ${c.text} bg-white/60 px-2 py-0.5 rounded-full`}>{record.percentage}%</span>
              )}
              {record.cgpa && (
                <span className={`text-xs font-semibold ${c.text} bg-white/60 px-2 py-0.5 rounded-full`}>CGPA {record.cgpa}</span>
              )}
              {record.specialization && (
                <span className="text-xs text-muted-foreground">· {record.specialization}</span>
              )}
            </div>
          </div>
        </div>
        {editing && (
          <div className="flex items-center gap-1 shrink-0">
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
