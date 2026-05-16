import type { Metadata } from "next";
import Sidebar from "@/components/layout/Sidebar";

export const metadata: Metadata = {
  title: "Student Dashboard — MITM PlacePro",
  description: "Student Placement Dashboard for MITM College",
};

export default function StudentLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar role="student" />
      <main className="flex-1 ml-[260px] transition-all duration-300">
        {children}
      </main>
    </div>
  );
}
