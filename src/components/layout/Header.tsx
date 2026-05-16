"use client";

import { Bell, Search, Moon, Sun, Settings } from "lucide-react";
import { useState } from "react";
import { cn, getInitials } from "@/lib/utils";
import { MOCK_NOTIFICATIONS } from "@/constants";

interface HeaderProps {
  userName: string;
  userRole: string;
  greeting?: string;
  subtitle?: string;
}

export default function Header({ userName, userRole, greeting, subtitle }: HeaderProps) {
  const [showNotifications, setShowNotifications] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const unreadCount = MOCK_NOTIFICATIONS.filter((n) => !n.isRead).length;

  const getGreeting = () => {
    if (greeting) return greeting;
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  };

  return (
    <header className="flex items-center justify-between px-8 py-5">
      {/* Left: Greeting */}
      <div>
        <h1 className="text-2xl font-bold text-foreground tracking-tight">
          {getGreeting()}, {userName.split(" ")[0]}!
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          {subtitle || "Let's check your placement updates today."}
        </p>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-3">
        {/* Search */}
        <div className={cn(
          "flex items-center transition-all duration-300 rounded-xl border border-border bg-white/60 backdrop-blur-sm",
          showSearch ? "w-64 px-3" : "w-10 justify-center"
        )}>
          <button
            onClick={() => setShowSearch(!showSearch)}
            className="p-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <Search className="w-[18px] h-[18px]" />
          </button>
          {showSearch && (
            <input
              type="text"
              placeholder="Search students, companies..."
              className="flex-1 bg-transparent text-sm outline-none py-2 text-foreground placeholder:text-muted-foreground"
              autoFocus
            />
          )}
        </div>

        {/* Theme toggle */}
        <button className="p-2.5 rounded-xl border border-border bg-white/60 backdrop-blur-sm text-muted-foreground hover:text-foreground hover:bg-white transition-all">
          <Sun className="w-[18px] h-[18px]" />
        </button>

        {/* Settings */}
        <button className="p-2.5 rounded-xl border border-border bg-white/60 backdrop-blur-sm text-muted-foreground hover:text-foreground hover:bg-white transition-all">
          <Settings className="w-[18px] h-[18px]" />
        </button>

        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="p-2.5 rounded-xl border border-border bg-white/60 backdrop-blur-sm text-muted-foreground hover:text-foreground hover:bg-white transition-all relative"
          >
            <Bell className="w-[18px] h-[18px]" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center notification-dot" style={{ width: 'auto', minWidth: '18px', padding: '0 4px', height: '18px', top: '-4px', right: '-4px', animation: 'none' }}>
                {unreadCount}
              </span>
            )}
          </button>

          {/* Notification dropdown */}
          {showNotifications && (
            <div className="absolute right-0 top-full mt-2 w-[380px] bg-white rounded-2xl border border-border shadow-xl z-50 overflow-hidden page-enter">
              <div className="px-5 py-4 border-b border-border flex items-center justify-between">
                <h3 className="text-sm font-semibold text-foreground">Notifications</h3>
                <button className="text-xs text-primary hover:underline">Mark all read</button>
              </div>
              <div className="max-h-[360px] overflow-y-auto custom-scrollbar">
                {MOCK_NOTIFICATIONS.map((notif) => (
                  <div
                    key={notif.id}
                    className={cn(
                      "px-5 py-3.5 border-b border-border last:border-0 hover:bg-muted/50 transition-colors cursor-pointer",
                      !notif.isRead && "bg-primary/[0.03]"
                    )}
                  >
                    <div className="flex items-start gap-3">
                      {!notif.isRead && (
                        <div className="w-2 h-2 rounded-full bg-primary mt-1.5 flex-shrink-0" />
                      )}
                      <div className={cn(!notif.isRead ? "" : "pl-5")}>
                        <p className="text-sm font-medium text-foreground">{notif.title}</p>
                        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{notif.body}</p>
                        <p className="text-[10px] text-muted-foreground mt-1">
                          {new Date(notif.createdAt).toLocaleString("en-IN", {
                            dateStyle: "medium",
                            timeStyle: "short",
                          })}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="px-5 py-3 border-t border-border">
                <button className="w-full text-center text-xs text-primary font-medium hover:underline">
                  View all notifications
                </button>
              </div>
            </div>
          )}
        </div>

        {/* User avatar */}
        <div className="flex items-center gap-3 ml-2 pl-3 border-l border-border">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white text-xs font-bold">
            {getInitials(userName)}
          </div>
          <div className="hidden sm:block">
            <p className="text-sm font-semibold text-foreground leading-tight">{userName}</p>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wide">{userRole}</p>
          </div>
        </div>
      </div>
    </header>
  );
}
