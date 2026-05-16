import type { Metadata } from "next";
import Sidebar from "@/components/layout/Sidebar";

export const metadata: Metadata = {
  title: "Company Dashboard — MITM PlacePro",
  description: "Company HR Dashboard for MITM College Placements",
};

export default function CompanyLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar role="company" />
      <main className="flex-1 ml-[260px] transition-all duration-300">
        {children}
      </main>
    </div>
  );
}
