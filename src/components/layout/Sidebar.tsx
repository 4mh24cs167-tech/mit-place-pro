"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Users,
  Building2,
  FileCheck2,
  CalendarClock,
  Image,
  BarChart3,
  UserCircle,
  Briefcase,
  ClipboardList,
  Upload,
  Award,
  FileText,
  BookOpen,
  Eye,
  LogOut,
  ChevronLeft,
  GraduationCap,
} from "lucide-react";
import { useState } from "react";

interface SidebarProps {
  role: "admin" | "company" | "student" | "principal";
}

const navConfigs = {
  admin: [
    { label: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
    { label: "Students", href: "/admin/students", icon: Users },
    { label: "Companies", href: "/admin/companies", icon: Building2 },
    { label: "Applications", href: "/admin/applications", icon: FileCheck2 },
    { label: "Slot Manager", href: "/admin/slots", icon: CalendarClock },
    { label: "Posters", href: "/admin/posters", icon: Image },
    { label: "Analytics", href: "/admin/analytics", icon: BarChart3 },
  ],
  company: [
    { label: "Dashboard", href: "/company/dashboard", icon: LayoutDashboard },
    { label: "Profile & JD", href: "/company/profile", icon: Building2 },
    { label: "Candidates", href: "/company/candidates", icon: Users },
    { label: "Rounds", href: "/company/rounds", icon: ClipboardList },
    { label: "Offer Letters", href: "/company/offers", icon: Award },
  ],
  student: [
    { label: "Dashboard", href: "/student/dashboard", icon: LayoutDashboard },
    { label: "My Profile", href: "/student/profile", icon: UserCircle },
    { label: "My CVs", href: "/student/cv", icon: FileText },
    { label: "Applications", href: "/student/applications", icon: Briefcase },
    { label: "Interview Slots", href: "/student/slots", icon: CalendarClock },
  ],
  principal: [
    { label: "Analytics", href: "/principal/analytics", icon: BarChart3 },
    { label: "Department View", href: "/principal/departments", icon: BookOpen },
    { label: "Company View", href: "/principal/companies", icon: Building2 },
    { label: "Reports", href: "/principal/reports", icon: Eye },
  ],
};

const roleLabels = {
  admin: "Placement Admin",
  company: "Company HR",
  student: "Student",
  principal: "Principal",
};

const roleColors = {
  admin: "from-indigo-500 to-violet-600",
  company: "from-emerald-500 to-teal-600",
  student: "from-amber-500 to-orange-600",
  principal: "from-purple-500 to-fuchsia-600",
};

export default function Sidebar({ role }: SidebarProps) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const navItems = navConfigs[role];

  return (
    <aside
      className={cn(
        "sidebar-gradient fixed left-0 top-0 z-40 h-screen flex flex-col transition-all duration-300 ease-in-out",
        collapsed ? "w-[72px]" : "w-[260px]"
      )}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-6 border-b border-white/[0.06]">
        <div className={cn(
          "flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br",
          roleColors[role]
        )}>
          <GraduationCap className="w-5 h-5 text-white" />
        </div>
        {!collapsed && (
          <div className="flex flex-col">
            <span className="text-sm font-bold text-white tracking-tight">MITM PlacePro</span>
            <span className="text-[10px] text-slate-400 uppercase tracking-widest">{roleLabels[role]}</span>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto custom-scrollbar">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/");

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group",
                isActive
                  ? "bg-white/[0.12] text-white shadow-lg shadow-black/10"
                  : "text-slate-400 hover:text-white hover:bg-white/[0.06]",
                collapsed && "justify-center px-0"
              )}
            >
              <Icon
                className={cn(
                  "w-[18px] h-[18px] flex-shrink-0 transition-colors",
                  isActive ? "text-white" : "text-slate-500 group-hover:text-slate-300"
                )}
              />
              {!collapsed && <span>{item.label}</span>}
              {isActive && !collapsed && (
                <div className="ml-auto w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Collapse toggle */}
      <div className="px-3 py-3 border-t border-white/[0.06]">
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm text-slate-400 hover:text-white hover:bg-white/[0.06] transition-all"
        >
          <ChevronLeft
            className={cn(
              "w-[18px] h-[18px] transition-transform duration-300",
              collapsed && "rotate-180"
            )}
          />
          {!collapsed && <span>Collapse</span>}
        </button>

        <button className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-all mt-1">
          <LogOut className="w-[18px] h-[18px]" />
          {!collapsed && <span>Logout</span>}
        </button>
      </div>
    </aside>
  );
}
