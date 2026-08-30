"use client";

import Sidebar from "@/components/layout/Sidebar";
import { studentApi } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Loader2, UserCircle2, ShieldAlert } from "lucide-react";

export default function StudentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isLoading: authLoading } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [checkingProfile, setCheckingProfile] = useState(true);
  const [profileComplete, setProfileComplete] = useState<boolean | null>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!user || user.role !== "student") {
      setCheckingProfile(false);
      return;
    }

    const checkProfile = async () => {
      try {
        const res = await studentApi.getProfile();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const data = (res as any)?.data;
        setProfileComplete(!!data?.profileComplete);
      } catch {
        // If profile fails to load, allow access (don't lock them out on API failure)
        setProfileComplete(true);
      } finally {
        setCheckingProfile(false);
      }
    };

    checkProfile();
  }, [user, authLoading]);

  // Profile page is always accessible (that's where they complete it)
  const isProfilePage = pathname === "/student/profile";

  // Show loading while checking
  if (checkingProfile || authLoading) {
    return (
      <div className="min-h-screen bg-background purple-glow">
        <Sidebar role="student" />
        <main className="md:ml-[72px] pb-20 md:pb-0 flex items-center justify-center min-h-screen">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
            <p className="text-sm text-muted-foreground">Loading...</p>
          </div>
        </main>
      </div>
    );
  }

  // If profile is NOT complete and user tries to visit non-profile pages → show gate
  if (profileComplete === false && !isProfilePage) {
    return (
      <div className="min-h-screen bg-background purple-glow">
        <Sidebar role="student" />
        <main className="md:ml-[72px] pb-20 md:pb-0 flex items-center justify-center min-h-screen px-4">
          <div className="max-w-md w-full text-center space-y-6">
            {/* Icon */}
            <div className="relative mx-auto w-20 h-20">
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-amber-400/20 to-orange-500/20 animate-pulse" />
              <div className="relative w-20 h-20 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-lg shadow-amber-500/30">
                <ShieldAlert className="w-10 h-10 text-white" />
              </div>
            </div>

            {/* Message */}
            <div>
              <h2 className="text-xl font-bold text-foreground">Complete Your Profile First</h2>
              <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
                Before you can access placement features, you must complete your profile with all required information. 
                This is a one-time setup.
              </p>
            </div>

            {/* Required fields list */}
            <div className="i-card p-4 text-left">
              <p className="text-xs font-semibold text-muted-foreground uppercase mb-3">Required Information</p>
              <div className="grid grid-cols-2 gap-2 text-xs text-foreground">
                {["Full Name", "Phone Number", "Date of Birth", "Gender", "Education (min 1)", "Resume", "Skills (min 1)"].map((field) => (
                  <div key={field} className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                    {field}
                  </div>
                ))}
              </div>
            </div>

            {/* CTA Button */}
            <button
              onClick={() => router.push("/student/profile")}
              className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-semibold text-sm shadow-lg shadow-indigo-500/30 hover:shadow-xl hover:shadow-indigo-500/40 transition-all active:scale-[0.98]"
            >
              <UserCircle2 className="w-4 h-4" />
              Complete Profile Now
            </button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background purple-glow">
      <Sidebar role="student" />
      <main className="md:ml-[72px] pb-20 md:pb-0">{children}</main>
    </div>
  );
}
