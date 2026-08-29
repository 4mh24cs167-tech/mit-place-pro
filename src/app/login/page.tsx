"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
/* eslint-disable @next/next/no-img-element */
import { ArrowRight, AlertCircle, Eye, EyeOff, Mail, Lock, Sparkles } from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const { login } = useAuth();

  const handleLogin = async () => {
    if (!email || !password) return;
    setIsLoading(true);
    setError(null);

    try {
      const result = await login(email, password);
      if (result.success) {
        const role = result.role || "student";
        router.push(`/${role}/dashboard`);
      } else {
        setError(result.error || "Invalid email or password. Please try again.");
      }
    } catch {
      setError("Unable to connect. Please check your internet and try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Panel - Branding (hidden on mobile) */}
      <div className="hidden lg:flex lg:w-[55%] relative overflow-hidden bg-gradient-to-br from-[#1a1a2e] via-[#16213e] to-[#0f3460]">
        {/* Animated gradient orbs */}
        <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] rounded-full bg-gradient-to-br from-violet-600/30 to-indigo-600/20 blur-3xl animate-pulse" />
        <div className="absolute bottom-[-15%] right-[-5%] w-[400px] h-[400px] rounded-full bg-gradient-to-br from-cyan-500/20 to-blue-600/15 blur-3xl animate-pulse" style={{ animationDelay: "1s" }} />
        <div className="absolute top-[40%] left-[30%] w-[300px] h-[300px] rounded-full bg-gradient-to-br from-purple-500/15 to-pink-500/10 blur-3xl animate-pulse" style={{ animationDelay: "2s" }} />

        {/* Grid pattern overlay */}
        <div className="absolute inset-0 opacity-[0.04]" style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
          backgroundSize: "60px 60px",
        }} />

        {/* Content */}
        <div className="relative z-10 flex flex-col p-12 w-full h-full">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <img src="/mitm-logo.png" alt="MITM Logo" className="w-12 h-12 rounded-2xl object-cover border border-white/10" />
            <div>
              <span className="text-xl font-bold text-white tracking-tight">MITM PlacePro</span>
              <p className="text-xs text-white/40">Campus Placement Portal</p>
            </div>
          </div>

          {/* Hero text */}
          <div className="max-w-md my-auto">
            <h1 className="text-4xl xl:text-5xl font-bold text-white leading-tight mb-5">
              Your career journey
              <span className="block mt-1 bg-gradient-to-r from-violet-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent">
                starts here.
              </span>
            </h1>
            <p className="text-base text-white/50 leading-relaxed">
              Connecting students, companies, and administrators in a seamless
              placement ecosystem powered by intelligent matching.
            </p>
          </div>
        </div>
      </div>

      {/* Right Panel - Login Form */}
      <div className="flex-1 flex items-center justify-center bg-background purple-glow p-6 sm:p-8">
        <div className="w-full max-w-[420px]">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center justify-center gap-3 mb-10">
            <img src="/mitm-logo.png" alt="MITM Logo" className="w-11 h-11 rounded-2xl object-cover" />
            <div>
              <span className="text-xl font-bold text-foreground tracking-tight">MITM PlacePro</span>
              <p className="text-xs text-muted-foreground">Campus Placement Portal</p>
            </div>
          </div>

          {/* Welcome */}
          <div className="mb-8">
            <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">Welcome back</h2>
            <p className="text-sm text-muted-foreground">Sign in to your account to continue</p>
          </div>

          {/* Error */}
          {error && (
            <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-red-50 border border-red-200 mb-6 animate-in fade-in slide-in-from-top-2 duration-300">
              <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {/* Form */}
          <form onSubmit={(e) => { e.preventDefault(); handleLogin(); }} className="space-y-4 mb-6">
            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wider">
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
                  className="w-full pl-11 pr-4 py-3 rounded-xl border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-foreground/20 focus:border-foreground transition-all placeholder:text-muted-foreground/50"
                  autoComplete="email"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label htmlFor="password" className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => router.push("/change-password")}
                  className="text-xs font-medium text-indigo-600 hover:text-indigo-700 transition-colors"
                >
                  Forgot password?
                </button>
              </div>
              <div className="relative group">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-foreground transition-colors" />
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full pl-11 pr-11 py-3 rounded-xl border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-foreground/20 focus:border-foreground transition-all placeholder:text-muted-foreground/50"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  aria-label="Toggle password visibility"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Login button */}
            <button
              type="submit"
              disabled={!email || !password || isLoading}
              className={`w-full flex items-center justify-center gap-2 py-3.5 rounded-xl text-sm font-semibold transition-all duration-200 ${
                !email || !password || isLoading
                  ? "bg-foreground/30 text-white/50 cursor-not-allowed"
                  : "bg-foreground text-white hover:bg-foreground/90 shadow-lg shadow-foreground/10 hover:shadow-foreground/20 active:scale-[0.99]"
              }`}
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  Sign In
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Registration links */}
          <div className="flex items-center gap-3 pt-2">
            <div className="h-px flex-1 bg-border" />
            <span className="text-xs text-muted-foreground">New here?</span>
            <div className="h-px flex-1 bg-border" />
          </div>
          <div className="flex gap-3 mt-4">
            <a
              href="/register/student"
              className="flex-1 text-center py-2.5 rounded-xl border border-border text-sm font-medium text-foreground hover:bg-secondary transition-colors"
            >
              Register as Student
            </a>
            <a
              href="/register/company"
              className="flex-1 text-center py-2.5 rounded-xl border border-border text-sm font-medium text-foreground hover:bg-secondary transition-colors"
            >
              Register as Company
            </a>
          </div>

          {/* Divider with role info */}
          <div className="mt-8 pt-6 border-t border-border/50">
            <p className="text-xs text-muted-foreground text-center mb-3">
              Access for all roles
            </p>
            <div className="flex items-center justify-center gap-3 flex-wrap">
              {[
                { emoji: "🏛️", label: "Admin" },
                { emoji: "🎓", label: "Student" },
                { emoji: "🏢", label: "Company" },
                { emoji: "📊", label: "Principal" },
              ].map((role) => (
                <div
                  key={role.label}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-muted/50 border border-border/50"
                >
                  <span className="text-sm">{role.emoji}</span>
                  <span className="text-[10px] font-medium text-muted-foreground">{role.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Footer */}
          <p className="text-[11px] text-muted-foreground text-center mt-8">
            MITM College, Mysuru · Placement Cell Portal
          </p>
          <p className="text-[10px] text-muted-foreground/60 text-center mt-1">
            Developed by Yashas N, Varshith V, Vishesh G Devanur, Vinod Patel, Bhavish S, Yashavanth B N — CSE Department &amp; Shreyas M — ISE Department
          </p>
        </div>
      </div>
    </div>
  );
}
