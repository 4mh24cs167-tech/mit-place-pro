import Sidebar from "@/components/layout/Sidebar";

export default function PrincipalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background purple-glow">
      <Sidebar role="principal" />
      <main className="ml-[72px]">{children}</main>
    </div>
  );
}
