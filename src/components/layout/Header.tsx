"use client";

import { cn } from "@/lib/utils";
import {
  Search,
  Moon,
  Settings,
  GraduationCap,
} from "lucide-react";

interface HeaderProps {
  userName: string;
  userRole: string;
  greeting?: string;
  subtitle?: string;
}

export default function Header({
  userName,
  userRole,
  greeting,
  subtitle,
}: HeaderProps) {
  const initials = userName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <header className="px-8 pt-6 pb-2">
      {/* Top bar */}
      <div className="flex items-center justify-between mb-8">
        {/* Logo */}
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-full bg-foreground flex items-center justify-center">
            <GraduationCap className="w-4.5 h-4.5 text-white" />
          </div>
          <span className="text-base font-semibold text-foreground tracking-tight">
            MITM PlacePro
          </span>
        </div>

        {/* Center controls */}
        <div className="flex items-center gap-2">
          <button className="i-btn-icon">
            <Moon className="w-4 h-4 text-muted-foreground" />
          </button>
          <button className="i-btn-icon">
            <Settings className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>

        {/* Right side */}
        <div className="flex items-center gap-3">
          <button className="i-btn-icon">
            <Search className="w-4 h-4 text-muted-foreground" />
          </button>
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-300 to-purple-400 flex items-center justify-center text-xs font-bold text-white border-2 border-white shadow-sm cursor-pointer">
            {initials}
          </div>
        </div>
      </div>

      {/* Greeting row — matching reference layout */}
      {greeting && (
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center gap-3">
            <button className="i-btn-icon !w-9 !h-9">
              <svg className="w-4 h-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <div>
              <h1 className="text-3xl font-bold text-foreground tracking-tight">
                {greeting}
              </h1>
              {subtitle && (
                <p className="text-sm text-muted-foreground mt-0.5">
                  {subtitle}
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
