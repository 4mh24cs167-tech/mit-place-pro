"use client";

/* eslint-disable @next/next/no-img-element */

interface HeaderProps {
  userName: string;
  userRole: string;
  greeting?: string;
  subtitle?: string;
}

export default function Header({
  userName,
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
    <header className="px-4 sm:px-6 md:px-8 pt-4 sm:pt-6 pb-2">
      {/* Top bar */}
      <div className="flex items-center justify-between mb-4 sm:mb-8">
        {/* Logo */}
        <div className="flex items-center gap-2">
          <img src="/mitm-logo.png" alt="MITM Logo" className="w-8 h-8 sm:w-9 sm:h-9 rounded-full object-cover" />
          <span className="text-sm sm:text-base font-semibold text-foreground tracking-tight">
            MITM PlacePro
          </span>
        </div>

        {/* User avatar */}
        <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-violet-300 to-purple-400 flex items-center justify-center text-[10px] sm:text-xs font-bold text-white border-2 border-white shadow-sm cursor-pointer">
          {initials}
        </div>
      </div>

      {/* Greeting row */}
      {greeting && (
        <div className="mb-4 sm:mb-6">
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-foreground tracking-tight">
            {greeting}
          </h1>
          {subtitle && (
            <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
              {subtitle}
            </p>
          )}
        </div>
      )}
    </header>
  );
}
