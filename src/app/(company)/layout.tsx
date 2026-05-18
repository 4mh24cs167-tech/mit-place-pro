import Sidebar from "@/components/layout/Sidebar";

export default function CompanyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background purple-glow">
      <Sidebar role="company" />
      <main className="md:ml-[72px] pb-20 md:pb-0">{children}</main>
    </div>
  );
}
