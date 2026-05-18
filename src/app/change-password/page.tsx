"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { authApi } from "@/lib/api";
import {
  GraduationCap,
  Lock,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle,
  ShieldCheck,
  ArrowLeft,
  Mail,
} from "lucide-react";

export default function ChangePasswordPage() {
  const [step, setStep] = useState<"login" | "change">("login");
  const [email, setEmail] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const router = useRouter();
  const { user, login } = useAuth();

  const passwordRequirements = [
    { label: "At least 8 characters", met: newPassword.length >= 8 },
    { label: "Contains uppercase letter", met: /[A-Z]/.test(newPassword) },
    { label: "Contains lowercase letter", met: /[a-z]/.test(newPassword) },
    { label: "Contains a number", met: /[0-9]/.test(newPassword) },
  ];

  const allRequirementsMet = passwordRequirements.every((r) => r.met);
  const passwordsMatch = newPassword === confirmPassword && confirmPassword.length > 0;

  // Step 1: Verify identity by logging in first
  const handleVerify = async () => {
    if (!email || !currentPassword) return;
    setIsLoading(true);
    setError(null);

    try {
      const result = await login(email, currentPassword);
      if (result.success) {
        setStep("change");
      } else {
        setError("Invalid email or password. Please check and try again.");
      }
    } catch {
      setError("Connection error. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Step 2: Change the password
  const handleChangePassword = async () => {
    if (!allRequirementsMet || !passwordsMatch) return;
    setIsLoading(true);
    setError(null);

    try {
      await authApi.changePassword(currentPassword, newPassword);
      setSuccess(true);

      // Update stored user to clear mustChangePassword
      if (typeof window !== "undefined") {
        const storedRaw = localStorage.getItem("auth_user");
        if (storedRaw) {
          try {
            const stored = JSON.parse(storedRaw);
            stored.mustChangePassword = false;
            localStorage.setItem("auth_user", JSON.stringify(stored));
          } catch {
            // ignore
          }
        }
      }

      setTimeout(() => {
        const role = user?.role || "student";
        router.push(`/${role}/dashboard`);
      }, 2500);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to change password. Please try again.";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  // Success state
  if (success) {
    return (
      <div className="min-h-screen bg-background purple-glow flex items-center justify-center p-6">
        <div className="w-full max-w-md text-center">
          <div className="i-card p-10">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-emerald-100 to-green-100 flex items-center justify-center mx-auto mb-5">
              <CheckCircle className="w-10 h-10 text-emerald-600" />
            </div>
            <h2 className="text-2xl font-bold text-foreground mb-2">Password Updated!</h2>
            <p className="text-sm text-muted-foreground mb-6">
              Your password has been changed successfully.<br />
              Redirecting you to the dashboard...
            </p>
            <div className="w-8 h-8 border-2 border-foreground/20 border-t-foreground rounded-full animate-spin mx-auto" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background purple-glow flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="w-11 h-11 rounded-2xl bg-foreground flex items-center justify-center">
            <GraduationCap className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-bold text-foreground tracking-tight">MITM PlacePro</span>
        </div>

        {/* Card */}
        <div className="i-card p-6 sm:p-8">
          {/* Back button */}
          <button
            onClick={() => (step === "change" ? setStep("login") : router.push("/login"))}
            className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors mb-5"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            {step === "change" ? "Back" : "Back to login"}
          </button>

          {/* Header */}
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200/50 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">
                {step === "login" ? "Change Password" : "Set New Password"}
              </h1>
              <p className="text-xs text-muted-foreground">
                {step === "login" ? "Verify your identity first" : "Choose a strong new password"}
              </p>
            </div>
          </div>

          {/* Step indicator */}
          <div className="flex items-center gap-2 my-5">
            <div className={`h-1 flex-1 rounded-full transition-colors ${step === "login" ? "bg-foreground" : "bg-emerald-500"}`} />
            <div className={`h-1 flex-1 rounded-full transition-colors ${step === "change" ? "bg-foreground" : "bg-muted"}`} />
          </div>

          {/* Error */}
          {error && (
            <div className="flex items-start gap-2 p-3 rounded-xl bg-red-50 border border-red-200 mb-5 animate-in fade-in slide-in-from-top-2 duration-300">
              <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {/* STEP 1: Verify identity */}
          {step === "login" && (
            <div className="space-y-4 animate-in fade-in duration-300">
              <div>
                <label htmlFor="email" className="block text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wider">
                  Email Address
                </label>
                <div className="relative group">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-foreground transition-colors" />
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full pl-11 pr-4 py-3 rounded-xl border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-foreground/20 focus:border-foreground transition-all"
                    onKeyDown={(e) => e.key === "Enter" && handleVerify()}
                  />
                </div>
              </div>
              <div>
                <label htmlFor="currentPwd" className="block text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wider">
                  Current / Temporary Password
                </label>
                <div className="relative group">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-foreground transition-colors" />
                  <input
                    id="currentPwd"
                    type={showCurrent ? "text" : "password"}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Enter current password"
                    className="w-full pl-11 pr-11 py-3 rounded-xl border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-foreground/20 focus:border-foreground transition-all"
                    onKeyDown={(e) => e.key === "Enter" && handleVerify()}
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrent(!showCurrent)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    aria-label="Toggle visibility"
                  >
                    {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                onClick={handleVerify}
                disabled={!email || !currentPassword || isLoading}
                className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold transition-all mt-2 ${
                  !email || !currentPassword || isLoading
                    ? "bg-foreground/30 text-white/50 cursor-not-allowed"
                    : "bg-foreground text-white hover:bg-foreground/90 active:scale-[0.99]"
                }`}
              >
                {isLoading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  "Verify & Continue"
                )}
              </button>
            </div>
          )}

          {/* STEP 2: Set new password */}
          {step === "change" && (
            <div className="space-y-4 animate-in fade-in duration-300">
              <div>
                <label htmlFor="newPwd" className="block text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wider">
                  New Password
                </label>
                <div className="relative group">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-foreground transition-colors" />
                  <input
                    id="newPwd"
                    type={showNew ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Create a strong password"
                    className="w-full pl-11 pr-11 py-3 rounded-xl border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-foreground/20 focus:border-foreground transition-all"
                    onKeyDown={(e) => e.key === "Enter" && handleChangePassword()}
                  />
                  <button
                    type="button"
                    onClick={() => setShowNew(!showNew)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    aria-label="Toggle visibility"
                  >
                    {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                {/* Strength indicator */}
                {newPassword.length > 0 && (
                  <div className="mt-3 space-y-1.5">
                    {passwordRequirements.map((req) => (
                      <div key={req.label} className="flex items-center gap-2">
                        <div className={`w-4 h-4 rounded-full flex items-center justify-center transition-colors ${
                          req.met ? "bg-emerald-100" : "bg-gray-100"
                        }`}>
                          {req.met ? (
                            <CheckCircle className="w-3 h-3 text-emerald-600" />
                          ) : (
                            <div className="w-1.5 h-1.5 rounded-full bg-gray-400" />
                          )}
                        </div>
                        <span className={`text-xs transition-colors ${req.met ? "text-emerald-600 font-medium" : "text-muted-foreground"}`}>
                          {req.label}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <label htmlFor="confirmPwd" className="block text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wider">
                  Confirm New Password
                </label>
                <div className="relative group">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-foreground transition-colors" />
                  <input
                    id="confirmPwd"
                    type={showConfirm ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter your new password"
                    className="w-full pl-11 pr-11 py-3 rounded-xl border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-foreground/20 focus:border-foreground transition-all"
                    onKeyDown={(e) => e.key === "Enter" && handleChangePassword()}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm(!showConfirm)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    aria-label="Toggle visibility"
                  >
                    {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {confirmPassword.length > 0 && (
                  <p className={`text-xs mt-1.5 flex items-center gap-1 ${passwordsMatch ? "text-emerald-600" : "text-red-500"}`}>
                    {passwordsMatch ? (
                      <><CheckCircle className="w-3 h-3" /> Passwords match</>
                    ) : (
                      "Passwords do not match"
                    )}
                  </p>
                )}
              </div>

              <button
                onClick={handleChangePassword}
                disabled={!allRequirementsMet || !passwordsMatch || isLoading}
                className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold transition-all mt-2 ${
                  !allRequirementsMet || !passwordsMatch || isLoading
                    ? "bg-foreground/30 text-white/50 cursor-not-allowed"
                    : "bg-foreground text-white hover:bg-foreground/90 active:scale-[0.99]"
                }`}
              >
                {isLoading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  "Update Password"
                )}
              </button>
            </div>
          )}
        </div>

        <p className="text-[11px] text-muted-foreground text-center mt-6">
          MITM College, Mysuru · Placement Cell Portal
        </p>
      </div>
    </div>
  );
}
