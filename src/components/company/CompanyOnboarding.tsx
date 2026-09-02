"use client";

import { companyApi } from "@/lib/api";
import {
  Building2,
  Globe,
  MapPin,
  Briefcase,
  User,
  Phone,
  FileText,
  DollarSign,
  Loader2,
  CheckCircle2,
  Sparkles,
  Upload,
  Image as ImageIcon,
} from "lucide-react";
import { useState } from "react";

interface CompanyOnboardingProps {
  initialData?: {
    name?: string;
    website?: string;
    hqCity?: string;
    sector?: string;
    annualTurnoverRange?: string;
    description?: string;
    hrName?: string;
    hrPhone?: string;
  };
  onComplete: () => void;
}

const SECTORS = [
  "Information Technology",
  "Software Development",
  "Consulting",
  "Finance & Banking",
  "Manufacturing",
  "Healthcare",
  "E-Commerce",
  "Automotive",
  "Telecommunications",
  "Education",
  "Media & Entertainment",
  "Logistics",
  "Real Estate",
  "Energy",
  "Other",
];

const TURNOVER_RANGES = [
  "< ₹1 Cr",
  "₹1-10 Cr",
  "₹10-50 Cr",
  "₹50-100 Cr",
  "₹100-500 Cr",
  "₹500+ Cr",
];

export default function CompanyOnboarding({ initialData, onComplete }: CompanyOnboardingProps) {
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [logoUploading, setLogoUploading] = useState(false);
  const [logoUrl, setLogoUrl] = useState("");
  const [toast, setToast] = useState<{ type: "success" | "error"; msg: string } | null>(null);

  const showToast = (type: "success" | "error", msg: string) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 3000);
  };

  const [form, setForm] = useState({
    name: initialData?.name || "",
    website: initialData?.website || "",
    hqCity: initialData?.hqCity || "",
    sector: initialData?.sector || "",
    annualTurnoverRange: initialData?.annualTurnoverRange || "",
    description: initialData?.description || "",
    hrName: initialData?.hrName || "",
    hrPhone: initialData?.hrPhone || "",
  });

  const updateField = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setError("");
  };

  const handleNext = () => {
    if (step === 0) {
      if (!form.name.trim()) { setError("Company name is required"); return; }
      if (!form.sector) { setError("Please select an industry sector"); return; }
    }
    if (step === 1) {
      if (!form.hrName.trim()) { setError("HR contact name is required"); return; }
    }
    setStep((s) => s + 1);
  };

  const handleSubmit = async () => {
    try {
      setSaving(true);
      setError("");
      await companyApi.updateProfile(form);
      onComplete();
    } catch {
      setError("Failed to save profile. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const steps = [
    { title: "Company Details", desc: "Tell us about your organization" },
    { title: "HR Contact", desc: "Who should we reach out to?" },
    { title: "Review & Submit", desc: "Confirm your details" },
  ];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-300">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-violet-600 px-6 py-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Welcome to UdyogaMITra!</h2>
              <p className="text-xs text-white/80">Let&apos;s set up your company profile</p>
            </div>
          </div>
          {/* Step indicator */}
          <div className="flex items-center gap-2 mt-3">
            {steps.map((s, i) => (
              <div key={i} className="flex items-center gap-2 flex-1">
                <div className={`h-1.5 flex-1 rounded-full transition-all ${i <= step ? "bg-white" : "bg-white/30"}`} />
              </div>
            ))}
          </div>
          <p className="text-xs text-white/70 mt-2">
            Step {step + 1} of {steps.length}: {steps[step].title}
          </p>
        </div>

        {/* Body */}
        <div className="px-6 py-5">
          {error && (
            <div className="mb-4 px-3 py-2 rounded-lg bg-red-50 text-red-600 text-xs font-medium">
              {error}
            </div>
          )}

          {/* Step 0: Company Details */}
          {step === 0 && (
            <div className="space-y-4">
              
              {/* Logo Upload */}
              <div>
                <label className="text-xs font-semibold text-gray-700 mb-1.5 flex items-center gap-1.5">
                  <ImageIcon className="w-3.5 h-3.5 text-indigo-500" />
                  Company Logo
                </label>
                <div className="flex items-center gap-4">
                  {logoUrl ? (
                    <div className="w-12 h-12 rounded-xl border overflow-hidden bg-gray-50 flex items-center justify-center relative group">
                      <img src={logoUrl} alt="Logo" className="w-full h-full object-contain" />
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                        <label className="cursor-pointer p-1">
                          <Upload className="w-4 h-4 text-white" />
                          <input type="file" accept="image/*" className="hidden" onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (!file) return;
                            setLogoUploading(true);
                            try {
                              // eslint-disable-next-line @typescript-eslint/no-explicit-any
                              const presignedRes: any = await companyApi.getLogoPresignedUrl(file.name, file.type);
                              const { presignedUrl, key, publicUrl } = presignedRes?.data || presignedRes;
                              const s3Res = await fetch(presignedUrl, { method: "PUT", body: file, headers: { "Content-Type": file.type } });
                              if (!s3Res.ok) throw new Error("Upload failed");
                              await companyApi.confirmLogoUpload(key, publicUrl);
                              setLogoUrl(publicUrl);
                              showToast("success", "Logo uploaded!");
                            } catch {
                              showToast("error", "Failed to upload logo");
                            } finally {
                              setLogoUploading(false);
                            }
                          }} />
                        </label>
                      </div>
                    </div>
                  ) : (
                    <label className="flex flex-col items-center justify-center w-12 h-12 rounded-xl border-2 border-dashed border-indigo-200 hover:border-indigo-400 cursor-pointer bg-gray-50 transition-colors">
                      {logoUploading ? <Loader2 className="w-4 h-4 animate-spin text-indigo-500" /> : <Upload className="w-4 h-4 text-indigo-500" />}
                      <input type="file" accept="image/*" className="hidden" disabled={logoUploading} onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        setLogoUploading(true);
                        try {
                          // eslint-disable-next-line @typescript-eslint/no-explicit-any
                          const presignedRes: any = await companyApi.getLogoPresignedUrl(file.name, file.type);
                          const { presignedUrl, key, publicUrl } = presignedRes?.data || presignedRes;
                          const s3Res = await fetch(presignedUrl, { method: "PUT", body: file, headers: { "Content-Type": file.type } });
                          if (!s3Res.ok) throw new Error("Upload failed");
                          await companyApi.confirmLogoUpload(key, publicUrl);
                          setLogoUrl(publicUrl);
                          showToast("success", "Logo uploaded!");
                        } catch {
                          showToast("error", "Failed to upload logo");
                        } finally {
                          setLogoUploading(false);
                        }
                      }} />
                    </label>
                  )}
                  <div className="flex-1">
                    <p className="text-xs text-muted-foreground">
                      Upload your company logo (JPG, PNG). This will be shown to students.
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-700 mb-1.5 flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-indigo-500" />
                  Company Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => updateField("name", e.target.value)}
                  placeholder="e.g. Infosys Technologies"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 transition-all"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-700 mb-1.5 flex items-center gap-1.5">
                  <Briefcase className="w-3.5 h-3.5 text-indigo-500" />
                  Industry Sector <span className="text-red-500">*</span>
                </label>
                <select
                  value={form.sector}
                  onChange={(e) => updateField("sector", e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 transition-all cursor-pointer"
                >
                  <option value="">Select sector...</option>
                  {SECTORS.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-gray-700 mb-1.5 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-indigo-500" />
                    HQ City
                  </label>
                  <input
                    type="text"
                    value={form.hqCity}
                    onChange={(e) => updateField("hqCity", e.target.value)}
                    placeholder="e.g. Bengaluru"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 transition-all"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-700 mb-1.5 flex items-center gap-1.5">
                    <DollarSign className="w-3.5 h-3.5 text-indigo-500" />
                    Annual Turnover
                  </label>
                  <select
                    value={form.annualTurnoverRange}
                    onChange={(e) => updateField("annualTurnoverRange", e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 transition-all cursor-pointer"
                  >
                    <option value="">Select...</option>
                    {TURNOVER_RANGES.map((r) => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-700 mb-1.5 flex items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5 text-indigo-500" />
                  Website
                </label>
                <input
                  type="url"
                  value={form.website}
                  onChange={(e) => updateField("website", e.target.value)}
                  placeholder="https://www.company.com"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 transition-all"
                />
              </div>
            </div>
          )}

          {/* Step 1: HR Contact */}
          {step === 1 && (
            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-gray-700 mb-1.5 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-indigo-500" />
                  HR Contact Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={form.hrName}
                  onChange={(e) => updateField("hrName", e.target.value)}
                  placeholder="e.g. Priya Sharma"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 transition-all"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-700 mb-1.5 flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-indigo-500" />
                  HR Phone
                </label>
                <input
                  type="tel"
                  value={form.hrPhone}
                  onChange={(e) => updateField("hrPhone", e.target.value)}
                  placeholder="e.g. +91 98765 43210"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 transition-all"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-700 mb-1.5 flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-indigo-500" />
                  Company Description
                </label>
                <textarea
                  value={form.description}
                  onChange={(e) => updateField("description", e.target.value)}
                  placeholder="Brief description about your company, culture, and what you're looking for..."
                  rows={4}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 transition-all resize-none"
                />
              </div>
            </div>
          )}

          {/* Step 2: Review */}
          {step === 2 && (
            <div className="space-y-3">
              <div className="bg-gray-50 rounded-xl p-4 space-y-2.5">
                {[
                  { label: "Company", value: form.name, icon: Building2 },
                  { label: "Sector", value: form.sector, icon: Briefcase },
                  { label: "HQ City", value: form.hqCity || "—", icon: MapPin },
                  { label: "Website", value: form.website || "—", icon: Globe },
                  { label: "Turnover", value: form.annualTurnoverRange || "—", icon: DollarSign },
                  { label: "HR Contact", value: form.hrName, icon: User },
                  { label: "HR Phone", value: form.hrPhone || "—", icon: Phone },
                ].map((item) => {
                  const Icon = item.icon;
                  return (
                    <div key={item.label} className="flex items-center gap-3">
                      <Icon className="w-4 h-4 text-indigo-400 flex-shrink-0" />
                      <span className="text-xs text-gray-500 w-20 flex-shrink-0">{item.label}</span>
                      <span className="text-sm font-medium text-gray-900 truncate">{item.value}</span>
                    </div>
                  );
                })}
                {form.description && (
                  <div className="pt-2 border-t border-gray-200">
                    <p className="text-xs text-gray-500 mb-1">Description</p>
                    <p className="text-xs text-gray-700 leading-relaxed line-clamp-3">{form.description}</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between">
          {step > 0 ? (
            <button
              onClick={() => setStep((s) => s - 1)}
              className="px-4 py-2 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors"
            >
              Back
            </button>
          ) : (
            <div />
          )}

          {step < 2 ? (
            <button
              onClick={handleNext}
              className="px-6 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-500/20"
            >
              Continue
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={saving}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white text-sm font-semibold hover:shadow-lg hover:shadow-indigo-500/30 transition-all disabled:opacity-50 flex items-center gap-2"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Saving...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" /> Complete Setup
                </>
              )}
            </button>
          )}
        </div>
      </div>
      
      {toast && (
        <div className={`fixed bottom-4 right-4 px-4 py-3 rounded-lg shadow-lg text-sm font-medium flex items-center gap-2 z-[999] animate-in slide-in-from-bottom-2 ${toast.type === "success" ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-red-50 text-red-700 border border-red-200"}`}>
          {toast.type === "success" ? <CheckCircle2 className="w-4 h-4" /> : <Loader2 className="w-4 h-4" />}
          {toast.msg}
        </div>
      )}
    </div>
  );
}
