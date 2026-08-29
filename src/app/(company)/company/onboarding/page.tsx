"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { companyApi } from "@/lib/api";
import { Building2, Globe, MapPin, Briefcase, User, Loader2, CheckCircle2 } from "lucide-react";

export default function CompanyOnboarding() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    sector: "",
    hrName: "",
    hqCity: "",
    website: "",
    description: "",
    annualTurnoverRange: "",
  });

  const updateForm = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    if (!form.sector) return setError("Please select your industry sector");
    setError("");
    setLoading(true);
    try {
      await companyApi.updateProfile({
        ...form,
        profileComplete: true,
      });
      router.push("/company/dashboard");
    } catch (err: any) {
      setError(err?.message || "Failed to save company details");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 mb-4">
            <Building2 className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">Complete Company Profile</h1>
          <p className="text-muted-foreground mt-1">Fill in your company details to start posting jobs</p>
        </div>

        {/* Card */}
        <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
          {error && (
            <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1.5">Industry Sector *</label>
                <select
                  value={form.sector}
                  onChange={(e) => updateForm("sector", e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="">Select sector</option>
                  <option value="Information Technology">Information Technology</option>
                  <option value="Manufacturing">Manufacturing</option>
                  <option value="Finance & Banking">Finance & Banking</option>
                  <option value="Healthcare">Healthcare</option>
                  <option value="Consulting">Consulting</option>
                  <option value="E-Commerce">E-Commerce</option>
                  <option value="Education">Education</option>
                  <option value="Automotive">Automotive</option>
                  <option value="Telecommunications">Telecommunications</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Annual Turnover Range</label>
                <select
                  value={form.annualTurnoverRange}
                  onChange={(e) => updateForm("annualTurnoverRange", e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="">Select range</option>
                  <option value="< 1 Cr">Less than 1 Cr</option>
                  <option value="1-10 Cr">1 - 10 Cr</option>
                  <option value="10-50 Cr">10 - 50 Cr</option>
                  <option value="50-100 Cr">50 - 100 Cr</option>
                  <option value="100+ Cr">100+ Cr</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">HR Contact Name</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    type="text"
                    value={form.hrName}
                    onChange={(e) => updateForm("hrName", e.target.value)}
                    placeholder="HR contact person"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">HQ City</label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    type="text"
                    value={form.hqCity}
                    onChange={(e) => updateForm("hqCity", e.target.value)}
                    placeholder="e.g. Bangalore"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-1.5">Company Website</label>
                <div className="relative">
                  <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    type="url"
                    value={form.website}
                    onChange={(e) => updateForm("website", e.target.value)}
                    placeholder="https://www.company.com"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-1.5">Company Description</label>
                <textarea
                  value={form.description}
                  onChange={(e) => updateForm("description", e.target.value)}
                  placeholder="Brief description about your company, what you do, and your culture..."
                  rows={4}
                  className="w-full px-4 py-2.5 rounded-xl border border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring resize-none"
                />
              </div>
            </div>

            <button
              onClick={handleSubmit}
              disabled={loading}
              className="w-full py-2.5 rounded-xl bg-primary text-primary-foreground font-medium hover:bg-primary/90 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
              Complete Profile & Go to Dashboard
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
