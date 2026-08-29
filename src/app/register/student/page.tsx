"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { registerApi } from "@/lib/api";
import { GraduationCap, Mail, KeyRound, CheckCircle2, ArrowLeft, Loader2, Eye, EyeOff } from "lucide-react";

export default function StudentRegisterPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const handleSendOtp = async () => {
    if (!fullName.trim()) return setError("Please enter your full name");
    if (!email.trim()) return setError("Please enter your email");
    setError("");
    setLoading(true);
    try {
      await registerApi.sendOtp(email);
      setStep(2);
      setSuccess("OTP sent to your email!");
    } catch (err: any) {
      setError(err?.message || "Failed to send OTP");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!otp.trim()) return setError("Please enter the OTP");
    setError("");
    setLoading(true);
    try {
      await registerApi.verifyOtp(email, otp);
      setStep(3);
      setSuccess("Email verified!");
    } catch (err: any) {
      setError(err?.message || "Invalid OTP");
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async () => {
    if (!password) return setError("Please enter a password");
    if (password.length < 8) return setError("Password must be at least 8 characters");
    if (password !== confirmPassword) return setError("Passwords do not match");
    setError("");
    setLoading(true);
    try {
      await registerApi.registerStudent({ fullName, email, password, otp });
      setSuccess("Registration successful! Redirecting to login...");
      setTimeout(() => router.push("/login"), 2000);
    } catch (err: any) {
      setError(err?.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 mb-4">
            <GraduationCap className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">Student Registration</h1>
          <p className="text-muted-foreground mt-1">Create your MITM PlacePro account</p>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                step >= s ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
              }`}>
                {step > s ? <CheckCircle2 className="w-4 h-4" /> : s}
              </div>
              {s < 3 && <div className={`w-8 h-0.5 ${step > s ? "bg-primary" : "bg-muted"}`} />}
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
          {success && !error && (
            <div className="mb-4 p-3 rounded-xl bg-green-50 border border-green-200 text-green-700 text-sm">
              {success}
            </div>
          )}

          {/* Step 1: Name & Email */}
          {step === 1 && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Full Name</label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Enter your full name"
                  className="w-full px-4 py-2.5 rounded-xl border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
              </div>
              <button
                onClick={handleSendOtp}
                disabled={loading}
                className="w-full py-2.5 rounded-xl bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />}
                Send OTP
              </button>
            </div>
          )}

          {/* Step 2: OTP Verification */}
          {step === 2 && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">Enter the 6-digit OTP sent to <strong>{email}</strong></p>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">OTP Code</label>
                <input
                  type="text"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  placeholder="Enter 6-digit OTP"
                  maxLength={6}
                  className="w-full px-4 py-2.5 rounded-xl border border-input bg-background text-foreground text-center text-lg tracking-widest placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
              <button
                onClick={handleVerifyOtp}
                disabled={loading || otp.length !== 6}
                className="w-full py-2.5 rounded-xl bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                Verify OTP
              </button>
              <button onClick={() => { setStep(1); setError(""); setSuccess(""); }} className="w-full text-sm text-muted-foreground hover:text-foreground">
                ← Back
              </button>
            </div>
          )}

          {/* Step 3: Set Password */}
          {step === 3 && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Password</label>
                <div className="relative">
                  <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Min 8 characters"
                    className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Confirm Password</label>
                <div className="relative">
                  <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    type={showConfirm ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter password"
                    className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                  <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                    {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <button
                onClick={handleRegister}
                disabled={loading}
                className="w-full py-2.5 rounded-xl bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                Complete Registration
              </button>
            </div>
          )}
        </div>

        {/* Back to login */}
        <div className="text-center mt-4">
          <a href="/login" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="w-4 h-4" /> Back to Login
          </a>
        </div>
      </div>
    </div>
  );
}
