"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  Home,
  LayoutGrid,
  Zap,
  FileText,
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
} from "lucide-react";

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

  return (
    <aside className="fixed left-4 top-1/2 -translate-y-1/2 z-40 i-sidebar px-2 py-4 flex flex-col items-center gap-1.5">
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
  );
}
