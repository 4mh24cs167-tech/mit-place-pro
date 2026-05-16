import Sidebar from "@/components/layout/Sidebar";

export default function StudentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background purple-glow">
      <Sidebar role="student" />
      <main className="ml-[72px]">{children}</main>
    </div>
  );
}
