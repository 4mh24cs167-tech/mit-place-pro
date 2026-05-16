import type { Metadata } from "next";
import Sidebar from "@/components/layout/Sidebar";

export const metadata: Metadata = {
  title: "Principal Dashboard — MITM PlacePro",
  description: "Principal Analytics Dashboard for MITM College Placements",
};

export default function PrincipalLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar role="principal" />
      <main className="flex-1 ml-[260px] transition-all duration-300">
        {children}
      </main>
    </div>
  );
}
