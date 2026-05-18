"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  Home,
  LogOut,
  Users,
  Building2,
  FileCheck2,
  CalendarClock,
  Image as ImageIcon,
  BarChart3,
  UserCircle,
  Briefcase,
  ClipboardList,
  Award,
  BookOpen,
  Eye,
  FileText,
  Menu,
  X,
} from "lucide-react";
import { useState, useEffect } from "react";

interface SidebarProps {
  role: "admin" | "company" | "student" | "principal";
}

const navConfigs = {
  admin: [
    { label: "Dashboard", href: "/admin/dashboard", icon: Home },
    { label: "Students", href: "/admin/students", icon: Users },
    { label: "Companies", href: "/admin/companies", icon: Building2 },
    { label: "Applications", href: "/admin/applications", icon: FileCheck2 },
    { label: "Slots", href: "/admin/slots", icon: CalendarClock },
    { label: "Posters", href: "/admin/posters", icon: ImageIcon },
    { label: "Analytics", href: "/admin/analytics", icon: BarChart3 },
  ],
  company: [
    { label: "Dashboard", href: "/company/dashboard", icon: Home },
    { label: "Candidates", href: "/company/candidates", icon: Users },
    { label: "Rounds", href: "/company/rounds", icon: ClipboardList },
    { label: "Offers", href: "/company/offers", icon: Award },
  ],
  student: [
    { label: "Dashboard", href: "/student/dashboard", icon: Home },
    { label: "Profile", href: "/student/profile", icon: UserCircle },
    { label: "CVs", href: "/student/cv", icon: FileText },
    { label: "Applications", href: "/student/applications", icon: Briefcase },
    { label: "Slots", href: "/student/slots", icon: CalendarClock },
  ],
  principal: [
    { label: "Analytics", href: "/principal/analytics", icon: BarChart3 },
    { label: "Departments", href: "/principal/departments", icon: BookOpen },
    { label: "Companies", href: "/principal/companies", icon: Building2 },
    { label: "Reports", href: "/principal/reports", icon: Eye },
  ],
};

export default function Sidebar({ role }: SidebarProps) {
  const pathname = usePathname();
  const navItems = navConfigs[role];
  const [mobileOpen, setMobileOpen] = useState(false);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [mobileOpen]);

  return (
    <>
      {/* ── Mobile Bottom Navigation Bar (< md) ── */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-white/95 backdrop-blur-xl border-t border-border shadow-[0_-2px_16px_rgba(0,0,0,0.06)]">
        <div className="flex items-center justify-around px-1 py-1.5 max-w-md mx-auto">
          {navItems.slice(0, 5).map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-xl transition-all min-w-[52px]",
                  isActive
                    ? "text-indigo-600"
                    : "text-muted-foreground"
                )}
              >
                <Icon className={cn("w-5 h-5", isActive && "stroke-[2.5]")} />
                <span className={cn("text-[9px] font-medium leading-none", isActive && "font-semibold")}>{item.label}</span>
              </Link>
            );
          })}
          {navItems.length > 5 && (
            <button
              onClick={() => setMobileOpen(true)}
              className="flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-xl text-muted-foreground min-w-[52px]"
            >
              <Menu className="w-5 h-5" />
              <span className="text-[9px] font-medium leading-none">More</span>
            </button>
          )}
        </div>
      </nav>

      {/* ── Mobile "More" drawer overlay ── */}
      {mobileOpen && (
        <div className="fixed inset-0 z-[60] md:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setMobileOpen(false)} />
          <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-2xl shadow-2xl p-5 pb-8 animate-in slide-in-from-bottom duration-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-semibold text-foreground">Menu</h3>
              <button onClick={() => setMobileOpen(false)} className="w-8 h-8 rounded-lg hover:bg-muted flex items-center justify-center">
                <X className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>
            <div className="grid grid-cols-4 gap-3">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex flex-col items-center gap-1.5 p-3 rounded-xl transition-all",
                      isActive
                        ? "bg-indigo-50 text-indigo-600"
                        : "text-muted-foreground hover:bg-muted"
                    )}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="text-[10px] font-medium">{item.label}</span>
                  </Link>
                );
              })}
              <Link
                href="/login"
                className="flex flex-col items-center gap-1.5 p-3 rounded-xl text-red-500 hover:bg-red-50 transition-all"
              >
                <LogOut className="w-5 h-5" />
                <span className="text-[10px] font-medium">Logout</span>
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* ── Desktop Left Sidebar (≥ md) ── */}
      <aside className="hidden md:flex fixed left-4 top-1/2 -translate-y-1/2 z-40 i-sidebar px-2 py-4 flex-col items-center gap-1.5">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive =
            pathname === item.href || pathname.startsWith(item.href + "/");

          return (
            <Link
              key={item.href}
              href={item.href}
              title={item.label}
              className={cn(
                "w-10 h-10 flex items-center justify-center rounded-xl transition-all duration-200 group relative",
                isActive
                  ? "bg-foreground text-white shadow-md"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <Icon className="w-[18px] h-[18px]" />
              {/* Tooltip */}
              <span className="absolute left-14 bg-dark text-white text-[11px] font-medium px-2.5 py-1 rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap shadow-lg">
                {item.label}
              </span>
            </Link>
          );
        })}

        {/* Divider */}
        <div className="w-6 h-px bg-border my-2" />

        {/* Logout */}
        <Link
          href="/login"
          title="Logout"
          className="w-10 h-10 flex items-center justify-center rounded-xl text-muted-foreground hover:bg-red-50 hover:text-red-500 transition-all"
        >
          <LogOut className="w-[18px] h-[18px]" />
        </Link>
      </aside>
    </>
  );
}
