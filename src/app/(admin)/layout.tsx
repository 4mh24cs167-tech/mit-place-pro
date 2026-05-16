import Sidebar from "@/components/layout/Sidebar";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background purple-glow">
      <Sidebar role="admin" />
      <main className="ml-[72px]">{children}</main>
    </div>
  );
}
