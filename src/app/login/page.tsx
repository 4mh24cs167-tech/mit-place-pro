"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth-context";
import { GraduationCap, ArrowRight, AlertCircle, Eye, EyeOff } from "lucide-react";

type Role = "admin" | "student" | "company" | "principal";

const roles: { id: Role; label: string; emoji: string; description: string }[] = [
  { id: "admin", label: "Placement Admin", emoji: "🏛️", description: "Manage drives, students, and companies" },
  { id: "student", label: "Student", emoji: "🎓", description: "Apply to jobs and track progress" },
  { id: "company", label: "Company HR", emoji: "🏢", description: "Post jobs and manage candidates" },
  { id: "principal", label: "Principal", emoji: "📊", description: "View analytics and reports" },
];

export default function LoginPage() {
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const { login } = useAuth();

  const handleLogin = async () => {
    if (!selectedRole || !email || !password) return;
    setIsLoading(true);
    setError(null);

    try {
      const result = await login(email, password);
      if (result.success) {
        if (result.mustChangePassword) {
          router.push("/change-password");
        } else {
          const roleRoute = result.role || selectedRole;
          router.push(`/${roleRoute}/dashboard`);
        }
      } else {
        setError("Invalid credentials. Please check your email and password.");
      }
    } catch {
      setError("Connection error. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background purple-glow flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex items-center justify-center gap-3 mb-10">
          <div className="w-11 h-11 rounded-full bg-foreground flex items-center justify-center">
            <GraduationCap className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-bold text-foreground tracking-tight">MITM PlacePro</span>
        </div>

        {/* Login card */}
        <div className="i-card p-8">
          <h1 className="text-2xl font-bold text-foreground text-center mb-1">Welcome back</h1>
          <p className="text-sm text-muted-foreground text-center mb-8">Select your role and sign in</p>

          {/* Error */}
          {error && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-red-50 border border-red-200 mb-6">
              <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {/* Role selector */}
          <div className="grid grid-cols-2 gap-2 mb-6">
            {roles.map((role) => (
              <button
                key={role.id}
                onClick={() => setSelectedRole(role.id)}
                className={cn(
                  "flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all text-center",
                  selectedRole === role.id
                    ? "border-foreground bg-foreground/[0.03] shadow-sm"
                    : "border-border hover:border-muted-foreground/30 hover:bg-muted/50"
                )}
              >
                <span className="text-2xl">{role.emoji}</span>
                <span className="text-xs font-semibold text-foreground leading-tight">{role.label}</span>
              </button>
            ))}
          </div>

          {/* Credential inputs */}
          {selectedRole && (
            <div className="space-y-4 mb-6 animate-in fade-in slide-in-from-top-2 duration-300">
              <div>
                <label htmlFor="email" className="block text-xs font-medium text-muted-foreground mb-1.5">
                  Email Address
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@mitm.ac.in"
                  className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-foreground/20 focus:border-foreground transition-all"
                  onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                />
              </div>
              <div>
                <label htmlFor="password" className="block text-xs font-medium text-muted-foreground mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    className="w-full px-4 py-2.5 pr-10 rounded-xl border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-foreground/20 focus:border-foreground transition-all"
                    onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Login button */}
          <button
            onClick={handleLogin}
            disabled={!selectedRole || !email || !password || isLoading}
            className={cn(
              "w-full i-btn-dark justify-center py-3.5 text-base",
              (!selectedRole || !email || !password || isLoading) && "opacity-40 cursor-not-allowed"
            )}
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
        </div>

        <p className="text-xs text-muted-foreground text-center mt-6">
          MITM College, Mysuru · Placement Cell Portal
        </p>
      </div>
    </div>
  );
}
