"use client";

import Sidebar from "@/components/layout/Sidebar";
import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Loader2 } from "lucide-react";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;
    if (!user || (user.role !== "admin" && user.role !== "principal")) {
      router.replace("/login");
    }
  }, [user, isLoading, router]);

  // Show loading while checking auth
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background purple-glow flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
      </div>
    );
  }

  // Redirect non-admins (effect above handles navigation)
  if (!user || (user.role !== "admin" && user.role !== "principal")) {
    return (
      <div className="min-h-screen bg-background purple-glow flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background purple-glow">
      <Sidebar role="admin" />
      <main className="md:ml-[72px] pb-20 md:pb-0">{children}</main>
    </div>
  );
}
