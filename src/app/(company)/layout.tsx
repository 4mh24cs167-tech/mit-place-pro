"use client";

import Sidebar from "@/components/layout/Sidebar";
import CompanyOnboarding from "@/components/company/CompanyOnboarding";
import { companyApi } from "@/lib/api";
import { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";

export default function CompanyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [profileComplete, setProfileComplete] = useState<boolean | null>(null);
  const [profileData, setProfileData] = useState<any | null>(null);

  useEffect(() => {
    const checkProfile = async () => {
      try {
        const res = await companyApi.getProfile();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const data = (res as any)?.data;
        if (data) {
          setProfileComplete(!!data.profileComplete);
          setProfileData(data);
        } else {
          setProfileComplete(true); // fallback: don't block
        }
      } catch {
        setProfileComplete(true); // fallback on error
      }
    };
    checkProfile();
  }, []);

  // Loading state
  if (profileComplete === null) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background purple-glow">
      <Sidebar role="company" isApproved={profileData?.isApproved !== false} />
      <main className="md:ml-[72px] pb-20 md:pb-0">{children}</main>
      {!profileComplete && (
        <CompanyOnboarding
          initialData={profileData || undefined}
          onComplete={() => {
            setProfileComplete(true);
            window.location.reload();
          }}
        />
      )}
    </div>
  );
}
