import type { Metadata } from "next";
import Sidebar from "@/components/layout/Sidebar";

export const metadata: Metadata = {
  title: "Admin Dashboard — MITM PlacePro",
  description: "Placement Admin Dashboard for MITM College",
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar role="admin" />
      <main className="flex-1 ml-[260px] transition-all duration-300">
        {children}
      </main>
    </div>
  );
}
