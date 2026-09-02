"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { authApi } from "@/lib/api";
/* eslint-disable @next/next/no-img-element */
import {
  ArrowLeft,
  AlertCircle,
  CheckCircle,
  ShieldCheck,
  Mail,
  Lock,
  Eye,
  EyeOff,
  Send,
  KeyRound,
  RefreshCw,
} from "lucide-react";

type Step = "email" | "otp" | "password";

export default function ChangePasswordPage() {
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);
  const router = useRouter();

  // Cooldown timer for resend
  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  const passwordRequirements = [
    { label: "At least 8 characters", met: newPassword.length >= 8 },
    { label: "Uppercase letter", met: /[A-Z]/.test(newPassword) },
    { label: "Lowercase letter", met: /[a-z]/.test(newPassword) },
    { label: "A number", met: /[0-9]/.test(newPassword) },
  ];

  const allRequirementsMet = passwordRequirements.every((r) => r.met);
  const passwordsMatch = newPassword === confirmPassword && confirmPassword.length > 0;

  // ─── Step 1: Send OTP ───
  const handleSendOtp = async () => {
    if (!email) return;
    setIsLoading(true);
    setError(null);

    try {
      await authApi.forgotPassword(email);
      setStep("otp");
      setCooldown(60);
      setTimeout(() => otpRefs.current[0]?.focus(), 100);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to send OTP.";
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  // ─── Step 2: Verify OTP ───
  const handleVerifyOtp = async () => {
    const otpString = otp.join("");
    if (otpString.length !== 6) return;
    setIsLoading(true);
    setError(null);

    try {
      await authApi.verifyOtp(email, otpString);
      setStep("password");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Invalid or expired OTP.";
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  // ─── Step 3: Reset Password ───
  const handleResetPassword = async () => {
    if (!allRequirementsMet || !passwordsMatch) return;
    setIsLoading(true);
    setError(null);

    try {
      const otpString = otp.join("");
      await authApi.resetPassword(email, otpString, newPassword);
      setSuccess(true);
      setTimeout(() => router.push("/login"), 3000);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Password reset failed.";
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  // ─── OTP input handlers ───
  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);
    if (value && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    const newOtp = [...otp];
    pasted.split("").forEach((d, i) => { newOtp[i] = d; });
    setOtp(newOtp);
    const nextEmpty = pasted.length < 6 ? pasted.length : 5;
    otpRefs.current[nextEmpty]?.focus();
  };

  const stepConfig = {
    email: { icon: Mail, title: "Forgot Password", subtitle: "Enter your email to receive a reset code" },
    otp: { icon: KeyRound, title: "Enter OTP", subtitle: `We sent a 6-digit code to ${email}` },
    password: { icon: Lock, title: "New Password", subtitle: "Choose a strong new password" },
  };
  const currentStep = stepConfig[step];
  const StepIcon = currentStep.icon;

  // ─── Success Screen ───
  if (success) {
    return (
      <div className="min-h-screen bg-background purple-glow flex items-center justify-center p-6">
        <div className="w-full max-w-md text-center">
          <div className="i-card p-10">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-emerald-100 to-green-100 flex items-center justify-center mx-auto mb-5">
              <CheckCircle className="w-10 h-10 text-emerald-600" />
            </div>
            <h2 className="text-2xl font-bold text-foreground mb-2">Password Reset!</h2>
            <p className="text-sm text-muted-foreground mb-6">
              Your password has been changed successfully.<br />
              Redirecting to login...
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
          <img src="/udyogamitra-logo.jpg" alt="UdyogaMITra Logo" className="w-12 h-12 rounded-full object-cover scale-110 bg-white shadow-sm" />
          <span className="text-xl font-bold text-foreground tracking-tight">UdyogaMITra</span>
        </div>

        {/* Card */}
        <div className="i-card p-6 sm:p-8">
          {/* Back */}
          <button
            onClick={() => {
              if (step === "otp") setStep("email");
              else if (step === "password") setStep("otp");
              else router.push("/login");
            }}
            className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors mb-5"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            {step === "email" ? "Back to login" : "Back"}
          </button>

          {/* Header */}
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-violet-50 border border-violet-200/50 flex items-center justify-center">
              <StepIcon className="w-5 h-5 text-violet-600" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">{currentStep.title}</h1>
              <p className="text-xs text-muted-foreground">{currentStep.subtitle}</p>
            </div>
          </div>

          {/* Step Progress */}
          <div className="flex items-center gap-2 my-5">
            <div className={`h-1 flex-1 rounded-full transition-colors duration-300 ${step === "email" ? "bg-foreground" : "bg-emerald-500"}`} />
            <div className={`h-1 flex-1 rounded-full transition-colors duration-300 ${step === "otp" ? "bg-foreground" : step === "password" ? "bg-emerald-500" : "bg-muted"}`} />
            <div className={`h-1 flex-1 rounded-full transition-colors duration-300 ${step === "password" ? "bg-foreground" : "bg-muted"}`} />
          </div>

          {/* Error */}
          {error && (
            <div className="flex items-start gap-2 p-3 rounded-xl bg-red-50 border border-red-200 mb-5 animate-in fade-in slide-in-from-top-2 duration-300">
              <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {/* ─── STEP 1: Email ───────────────────── */}
          {step === "email" && (
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
                    onKeyDown={(e) => e.key === "Enter" && handleSendOtp()}
                    autoComplete="email"
                    autoFocus
                  />
                </div>
              </div>
              <button
                onClick={handleSendOtp}
                disabled={!email || isLoading}
                className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold transition-all ${
                  !email || isLoading
                    ? "bg-foreground/30 text-white/50 cursor-not-allowed"
                    : "bg-foreground text-white hover:bg-foreground/90 active:scale-[0.99]"
                }`}
              >
                {isLoading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    Send OTP
                  </>
                )}
              </button>
            </div>
          )}

          {/* ─── STEP 2: OTP ────────────────────── */}
          {step === "otp" && (
            <div className="space-y-5 animate-in fade-in duration-300">
              {/* OTP boxes */}
              <div className="flex justify-center gap-2 sm:gap-3" onPaste={handleOtpPaste}>
                {otp.map((digit, idx) => (
                  <input
                    key={idx}
                    ref={(el) => { otpRefs.current[idx] = el; }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpChange(idx, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                    className="w-12 h-14 sm:w-14 sm:h-16 rounded-xl border-2 border-border bg-background text-center text-xl sm:text-2xl font-bold text-foreground focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-violet-500 transition-all"
                    aria-label={`OTP digit ${idx + 1}`}
                  />
                ))}
              </div>

              {/* Resend */}
              <div className="text-center">
                {cooldown > 0 ? (
                  <p className="text-xs text-muted-foreground">
                    Resend OTP in <span className="font-semibold text-foreground">{cooldown}s</span>
                  </p>
                ) : (
                  <button
                    onClick={handleSendOtp}
                    disabled={isLoading}
                    className="text-xs font-medium text-violet-600 hover:text-violet-700 inline-flex items-center gap-1.5 transition-colors"
                  >
                    <RefreshCw className="w-3 h-3" />
                    Resend OTP
                  </button>
                )}
              </div>

              <button
                onClick={handleVerifyOtp}
                disabled={otp.join("").length !== 6 || isLoading}
                className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold transition-all ${
                  otp.join("").length !== 6 || isLoading
                    ? "bg-foreground/30 text-white/50 cursor-not-allowed"
                    : "bg-foreground text-white hover:bg-foreground/90 active:scale-[0.99]"
                }`}
              >
                {isLoading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4" />
                    Verify OTP
                  </>
                )}
              </button>
            </div>
          )}

          {/* ─── STEP 3: New Password ───────────── */}
          {step === "password" && (
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
                    autoFocus
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

                {newPassword.length > 0 && (
                  <div className="mt-3 grid grid-cols-2 gap-1.5">
                    {passwordRequirements.map((req) => (
                      <div key={req.label} className="flex items-center gap-1.5">
                        <div className={`w-3.5 h-3.5 rounded-full flex items-center justify-center ${
                          req.met ? "bg-emerald-100" : "bg-gray-100"
                        }`}>
                          {req.met ? (
                            <CheckCircle className="w-2.5 h-2.5 text-emerald-600" />
                          ) : (
                            <div className="w-1 h-1 rounded-full bg-gray-400" />
                          )}
                        </div>
                        <span className={`text-[10px] transition-colors ${req.met ? "text-emerald-600 font-medium" : "text-muted-foreground"}`}>
                          {req.label}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <label htmlFor="confirmPwd" className="block text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wider">
                  Confirm Password
                </label>
                <div className="relative group">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-foreground transition-colors" />
                  <input
                    id="confirmPwd"
                    type={showConfirm ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter password"
                    className="w-full pl-11 pr-11 py-3 rounded-xl border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-foreground/20 focus:border-foreground transition-all"
                    onKeyDown={(e) => e.key === "Enter" && handleResetPassword()}
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
                    ) : "Passwords do not match"}
                  </p>
                )}
              </div>

              <button
                onClick={handleResetPassword}
                disabled={!allRequirementsMet || !passwordsMatch || isLoading}
                className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold transition-all mt-1 ${
                  !allRequirementsMet || !passwordsMatch || isLoading
                    ? "bg-foreground/30 text-white/50 cursor-not-allowed"
                    : "bg-foreground text-white hover:bg-foreground/90 active:scale-[0.99]"
                }`}
              >
                {isLoading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : "Reset Password"}
              </button>
            </div>
          )}
        </div>

        <p className="text-[11px] text-muted-foreground text-center mt-6">
          MITM College, Mysuru · UdyogaMITra
        </p>
      </div>
    </div>
  );
}
