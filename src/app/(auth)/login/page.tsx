"use client";

import { useState } from "react";
import { GraduationCap, Eye, EyeOff, ArrowRight, Shield, Briefcase, BookOpen } from "lucide-react";
import { cn } from "@/lib/utils";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email.trim()) {
      setError("Please enter your email address");
      return;
    }
    if (!password.trim()) {
      setError("Please enter your password");
      return;
    }

    setIsLoading(true);

    // Simulated login — redirect based on demo role
    setTimeout(() => {
      setIsLoading(false);
      if (email.includes("admin")) {
        window.location.href = "/admin/dashboard";
      } else if (email.includes("company") || email.includes("hr")) {
        window.location.href = "/company/dashboard";
      } else if (email.includes("principal")) {
        window.location.href = "/principal/analytics";
      } else {
        window.location.href = "/student/dashboard";
      }
    }, 1500);
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Panel — Branding */}
      <div className="hidden lg:flex lg:w-[55%] login-gradient relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute inset-0">
          <div className="absolute top-20 left-20 w-64 h-64 rounded-full bg-indigo-500/10 blur-3xl" />
          <div className="absolute bottom-32 right-16 w-80 h-80 rounded-full bg-violet-500/8 blur-3xl" />
          <div className="absolute top-1/2 left-1/3 w-48 h-48 rounded-full bg-purple-500/6 blur-2xl" />

          {/* Grid pattern */}
          <div className="absolute inset-0 opacity-[0.03]" style={{
            backgroundImage: `
              linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
              linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)
            `,
            backgroundSize: '40px 40px',
          }} />
        </div>

        <div className="relative z-10 flex flex-col justify-between p-12 w-full">
          {/* Top: Logo */}
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-400 to-violet-500 flex items-center justify-center">
              <GraduationCap className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">MITM PlacePro</h2>
              <p className="text-xs text-indigo-300 tracking-wider uppercase">Placement Portal</p>
            </div>
          </div>

          {/* Center: Hero text */}
          <div className="max-w-lg">
            <h1 className="text-5xl font-extrabold text-white leading-tight tracking-tight">
              Your Bridge to
              <span className="block bg-gradient-to-r from-indigo-300 via-violet-300 to-purple-300 bg-clip-text text-transparent">
                Career Success
              </span>
            </h1>
            <p className="text-lg text-indigo-200/80 mt-5 leading-relaxed">
              Streamlining campus placements with smart matching, automated scheduling, and AI-powered resume analysis.
            </p>

            {/* Feature cards */}
            <div className="mt-10 grid grid-cols-3 gap-3">
              {[
                { icon: Shield, label: "Secure RBAC", desc: "Role-based access" },
                { icon: Briefcase, label: "Smart ATS", desc: "AI resume scoring" },
                { icon: BookOpen, label: "Auto Slots", desc: "Conflict-free scheduling" },
              ].map((feat) => (
                <div key={feat.label} className="bg-white/[0.06] backdrop-blur-sm border border-white/[0.08] rounded-xl p-4">
                  <feat.icon className="w-5 h-5 text-indigo-300 mb-2" />
                  <p className="text-sm font-semibold text-white">{feat.label}</p>
                  <p className="text-[11px] text-indigo-300/70">{feat.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Bottom: Stats */}
          <div className="flex items-center gap-8">
            <div>
              <p className="text-3xl font-extrabold text-white">1,847</p>
              <p className="text-xs text-indigo-300">Students Registered</p>
            </div>
            <div className="w-px h-10 bg-white/10" />
            <div>
              <p className="text-3xl font-extrabold text-white">42</p>
              <p className="text-xs text-indigo-300">Active Companies</p>
            </div>
            <div className="w-px h-10 bg-white/10" />
            <div>
              <p className="text-3xl font-extrabold text-white">892</p>
              <p className="text-xs text-indigo-300">Students Placed</p>
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel — Login Form */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-12 bg-background">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-3 mb-10">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center">
              <GraduationCap className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-foreground">MITM PlacePro</h2>
              <p className="text-[10px] text-muted-foreground uppercase tracking-widest">Placement Portal</p>
            </div>
          </div>

          <div>
            <h2 className="text-2xl font-bold text-foreground tracking-tight">Welcome back</h2>
            <p className="text-sm text-muted-foreground mt-1">Sign in to your placement portal account</p>
          </div>

          <form onSubmit={handleSubmit} className="mt-8 space-y-5">
            {/* Email */}
            <div className="space-y-2">
              <label htmlFor="login-email" className="text-sm font-medium text-foreground">
                Email Address
              </label>
              <input
                id="login-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@mitm.edu.in"
                className="w-full px-4 py-3 rounded-xl border border-border bg-white text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                autoComplete="email"
              />
            </div>

            {/* Password */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label htmlFor="login-password" className="text-sm font-medium text-foreground">
                  Password
                </label>
                <button type="button" className="text-xs text-primary hover:underline">
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <input
                  id="login-password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full px-4 py-3 rounded-xl border border-border bg-white text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all pr-11"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-sm text-red-600">
                {error}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={isLoading}
              className={cn(
                "w-full flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl text-sm font-semibold text-white",
                "bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700",
                "shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/30",
                "transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary",
                isLoading && "opacity-80 cursor-not-allowed"
              )}
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  Sign in
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Demo accounts hint */}
          <div className="mt-8 p-4 rounded-xl bg-muted/50 border border-border">
            <p className="text-xs font-semibold text-muted-foreground mb-2">Demo Accounts</p>
            <div className="space-y-1.5 text-xs text-muted-foreground">
              <p><span className="font-medium text-foreground">Admin:</span> admin@mitm.edu.in / admin123</p>
              <p><span className="font-medium text-foreground">Company:</span> hr@infosys.com / company123</p>
              <p><span className="font-medium text-foreground">Student:</span> arjun@mitm.edu.in / 4MT21CS001</p>
              <p><span className="font-medium text-foreground">Principal:</span> principal@mitm.edu.in / principal123</p>
            </div>
          </div>

          <p className="text-[11px] text-muted-foreground text-center mt-8">
            © {new Date().getFullYear()} MITM College. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
}
