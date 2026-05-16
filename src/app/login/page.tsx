"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { GraduationCap, ArrowRight, Moon, Settings } from "lucide-react";

type Role = "admin" | "student" | "company" | "principal";

const roles: { id: Role; label: string; emoji: string; description: string }[] = [
  { id: "admin", label: "Placement Admin", emoji: "🏛️", description: "Manage drives, students, and companies" },
  { id: "student", label: "Student", emoji: "🎓", description: "Apply to jobs and track progress" },
  { id: "company", label: "Company HR", emoji: "🏢", description: "Post jobs and manage candidates" },
  { id: "principal", label: "Principal", emoji: "📊", description: "View analytics and reports" },
];

export default function LoginPage() {
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleLogin = () => {
    if (!selectedRole) return;
    setIsLoading(true);
    setTimeout(() => {
      router.push(`/${selectedRole}/dashboard`);
    }, 600);
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
          <p className="text-sm text-muted-foreground text-center mb-8">Select your role to continue</p>

          {/* Role selector */}
          <div className="space-y-3 mb-8">
            {roles.map((role) => (
              <button
                key={role.id}
                onClick={() => setSelectedRole(role.id)}
                className={cn(
                  "w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all text-left",
                  selectedRole === role.id
                    ? "border-foreground bg-foreground/[0.03] shadow-sm"
                    : "border-border hover:border-muted-foreground/30 hover:bg-muted/50"
                )}
              >
                <div className="w-11 h-11 rounded-xl bg-muted flex items-center justify-center text-xl flex-shrink-0">
                  {role.emoji}
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">{role.label}</p>
                  <p className="text-xs text-muted-foreground">{role.description}</p>
                </div>
                {selectedRole === role.id && (
                  <div className="ml-auto w-5 h-5 rounded-full bg-foreground flex items-center justify-center flex-shrink-0">
                    <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                )}
              </button>
            ))}
          </div>

          {/* Login button */}
          <button
            onClick={handleLogin}
            disabled={!selectedRole || isLoading}
            className={cn(
              "w-full i-btn-dark justify-center py-3.5 text-base",
              (!selectedRole || isLoading) && "opacity-40 cursor-not-allowed"
            )}
          >
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                Continue
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
