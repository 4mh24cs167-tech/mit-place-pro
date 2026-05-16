"use client";

import Header from "@/components/layout/Header";
import { cn } from "@/lib/utils";
import {
  HelpCircle,
  MessageCircle,
  Settings,
  Plus,
  ArrowUpRight,
  Calendar,
  CheckCircle2,
  TrendingUp,
  SlidersHorizontal,
} from "lucide-react";

/* ───── Mock Data ───── */
const activityBlocks = [
  { title: "Infosys Drive", subtitle: "Round 1 — Aptitude", start: 1, span: 3, color: "activity-green" as const, people: 45 },
  { title: "TCS Shortlisting", subtitle: "ATS Screening", start: 3.5, span: 2.5, color: "activity-gray" as const, people: 120 },
  { title: "Wipro HR", subtitle: "Final Round", start: 5, span: 2, color: "activity-purple" as const, people: 18 },
];

const timeSlots = ["07:00", "08:00", "09:00", "10:00", "11:00", "12:00", "01:00", "02:00"];

const todoItems = [
  { task: "Review Infosys JD & Approve", subtitle: "Placement Drive Preparation", date: "Today", time: "10:00 AM - 11:45 AM", done: true },
  { task: "Upload TCS Offer Letters", subtitle: "Offer Management", date: "Today", time: "2:00 PM - 3:00 PM", done: false },
  { task: "Verify Wipro Eligibility List", subtitle: "Student Screening", date: "Tomorrow", time: "9:00 AM - 10:30 AM", done: false },
];

const summaryData = [
  { month: "Jan", value: 245 },
  { month: "Feb", value: 280 },
  { month: "Mar", value: 310 },
  { month: "Apr", value: 290 },
  { month: "May", value: 360 },
  { month: "Jun", value: 340 },
  { month: "Jul", value: 380 },
  { month: "Aug", value: 345 },
  { month: "Sep", value: 390 },
  { month: "Oct", value: 420 },
];

export default function AdminDashboardPage() {
  const maxVal = Math.max(...summaryData.map((d) => d.value));

  return (
    <div className="page-enter">
      <Header
        userName="Dr. Placement Head"
        userRole="Admin"
        greeting="Good morning, Dr. Admin!"
        subtitle="Let's make this day productive."
      />

      <div className="px-8 pb-10">
        {/* Stats row — matching reference: big numbers inline with greeting */}
        <div className="flex items-center gap-8 mb-8 -mt-2">
          <div className="flex-1" />
          <div>
            <p className="text-sm text-muted-foreground">Students Placed</p>
            <p className="text-4xl font-bold text-foreground tracking-tight">
              2,543
              <span className="stat-arrow text-muted-foreground">↗</span>
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Placement Rate</p>
            <p className="text-4xl font-bold text-foreground tracking-tight">
              82%
              <span className="stat-arrow text-muted-foreground">↗</span>
            </p>
          </div>
          <button className="i-btn-dark">
            <Plus className="w-4 h-4" />
            Add Drive
          </button>
        </div>

        {/* Two-column card grid */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
          {/* AI Chat / Assistant Card */}
          <div className="lg:col-span-2 i-card p-6 flex flex-col">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <button className="i-btn-icon !w-9 !h-9">
                  <HelpCircle className="w-4 h-4 text-muted-foreground" />
                </button>
                <button className="i-btn-icon !w-9 !h-9">
                  <MessageCircle className="w-4 h-4 text-muted-foreground" />
                </button>
                <button className="i-btn-icon !w-9 !h-9">
                  <Settings className="w-4 h-4 text-muted-foreground" />
                </button>
              </div>
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-yellow-300 to-green-400 flex items-center justify-center border-2 border-purple-400">
                <span className="text-lg">🤖</span>
              </div>
            </div>

            <div className="flex-1 space-y-4 mb-6">
              <div className="chat-bubble">
                <p className="text-sm text-foreground leading-relaxed">
                  Hi there! I&apos;m your placement assistant.<br />
                  How can I help you today?
                </p>
                <span className="text-[10px] text-muted-foreground float-right mt-1">9:32</span>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 rounded-2xl border border-border bg-white">
              <input
                type="text"
                placeholder="Write a message"
                className="flex-1 text-sm bg-transparent outline-none text-foreground placeholder:text-muted-foreground"
              />
              <button className="text-muted-foreground hover:text-foreground transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                </svg>
              </button>
              <button className="text-muted-foreground hover:text-foreground transition-colors">😊</button>
              <button className="text-muted-foreground hover:text-foreground transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                </svg>
              </button>
            </div>
          </div>

          {/* Activity Timeline (Gantt-like) */}
          <div className="lg:col-span-3 i-card p-6">
            <div className="flex items-start justify-between mb-5">
              <div>
                <h2 className="text-lg font-semibold text-foreground">My activity</h2>
                <p className="text-sm text-muted-foreground">What is waiting for you today</p>
              </div>
              <button className="i-btn-icon">
                <Calendar className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>

            {/* Time axis */}
            <div className="relative">
              <div className="flex items-center border-b border-border pb-2 mb-4">
                {timeSlots.map((t, i) => (
                  <div key={t} className={cn("flex-1 text-xs", i === 5 ? "font-bold text-foreground" : "text-muted-foreground")}>
                    {t}
                  </div>
                ))}
              </div>

              {/* Current time line */}
              <div className="absolute top-0 bottom-0 left-[62.5%] w-px bg-foreground z-10">
                <div className="w-2 h-2 rounded-full bg-foreground -ml-[3px] -mt-1" />
              </div>

              {/* Activity blocks */}
              <div className="space-y-3 relative">
                {activityBlocks.map((block, i) => (
                  <div
                    key={i}
                    className={cn("rounded-xl px-4 py-3 relative", block.color)}
                    style={{
                      marginLeft: `${(block.start / 8) * 100}%`,
                      width: `${(block.span / 8) * 100}%`,
                    }}
                  >
                    <p className="text-sm font-semibold text-foreground">{block.title}</p>
                    <p className="text-[11px] text-muted-foreground">{block.subtitle}</p>
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
                      <div className="w-7 h-7 rounded-full bg-white/70 flex items-center justify-center text-[10px] font-bold shadow-sm border border-white">
                        👤
                      </div>
                      <div className="w-7 h-7 rounded-full bg-accent-green/60 flex items-center justify-center text-[10px] font-bold text-foreground shadow-sm">
                        +{block.people}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Bottom row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mt-5">
          {/* To-do list */}
          <div className="i-card p-6">
            <div className="flex items-start justify-between mb-5">
              <div>
                <h2 className="text-lg font-semibold text-foreground">To-do list</h2>
                <p className="text-sm text-muted-foreground">
                  {new Date().toLocaleDateString("en-US", { weekday: "long", day: "numeric", month: "long" })}
                </p>
              </div>
              <button className="i-btn-icon">
                <ArrowUpRight className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>

            <div className="space-y-4">
              {todoItems.map((item, i) => (
                <div key={i} className="flex items-start gap-3 pb-4 border-b border-border last:border-0 last:pb-0">
                  <div className={cn(
                    "w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5",
                    item.done ? "bg-accent-green" : "border-2 border-border"
                  )}>
                    {item.done && <CheckCircle2 className="w-4 h-4 text-foreground" />}
                  </div>
                  <div className="flex-1">
                    <p className={cn(
                      "text-sm font-semibold",
                      item.done ? "text-muted-foreground line-through" : "text-foreground"
                    )}>
                      {item.task}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">{item.subtitle}</p>
                    <p className="text-xs text-muted-foreground mt-1.5">
                      <span className="font-medium text-foreground">{item.date}</span> {item.time}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Summary chart */}
          <div className="i-card p-6">
            <div className="flex items-start justify-between mb-5">
              <div>
                <h2 className="text-lg font-semibold text-foreground">Summary</h2>
                <p className="text-sm text-muted-foreground">Track your performance</p>
              </div>
              <div className="flex items-center gap-2">
                <button className="i-btn-icon !w-9 !h-9">
                  <SlidersHorizontal className="w-4 h-4 text-muted-foreground" />
                </button>
                <button className="i-btn-icon !w-9 !h-9">
                  <ArrowUpRight className="w-4 h-4 text-muted-foreground" />
                </button>
              </div>
            </div>

            {/* Line chart */}
            <div className="relative h-48">
              {/* Y-axis labels */}
              <div className="absolute left-0 top-0 bottom-6 flex flex-col justify-between text-[10px] text-muted-foreground">
                <span>400</span>
                <span>300</span>
                <span>200</span>
                <span>100</span>
              </div>

              {/* Chart area */}
              <div className="ml-8 h-full relative">
                <svg className="w-full h-[calc(100%-24px)]" viewBox="0 0 400 160" preserveAspectRatio="none">
                  {/* Grid lines */}
                  {[0, 1, 2, 3].map((i) => (
                    <line key={i} x1="0" y1={i * 40 + 20} x2="400" y2={i * 40 + 20}
                      stroke="oklch(0.9 0.01 280)" strokeWidth="1" strokeDasharray="4 4" />
                  ))}

                  {/* Line path */}
                  <polyline
                    fill="none"
                    stroke="oklch(0.15 0.02 270)"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    points={summaryData
                      .map((d, i) => {
                        const x = (i / (summaryData.length - 1)) * 380 + 10;
                        const y = 140 - ((d.value / maxVal) * 120);
                        return `${x},${y}`;
                      })
                      .join(" ")}
                  />

                  {/* Data points */}
                  {summaryData.map((d, i) => {
                    const x = (i / (summaryData.length - 1)) * 380 + 10;
                    const y = 140 - ((d.value / maxVal) * 120);
                    return (
                      <g key={i}>
                        <circle cx={x} cy={y} r="4" fill="white" stroke="oklch(0.15 0.02 270)" strokeWidth="2" />
                        {i === 4 && (
                          <>
                            <circle cx={x} cy={y} r="4" fill="oklch(0.82 0.15 135)" stroke="oklch(0.72 0.15 135)" strokeWidth="1.5" />
                            <rect x={x - 18} y={y - 26} width="36" height="20" rx="6"
                              fill="oklch(0.18 0.02 270)" />
                            <text x={x} y={y - 13} textAnchor="middle" fontSize="10" fontWeight="600" fill="white">
                              {d.value}
                            </text>
                          </>
                        )}
                      </g>
                    );
                  })}
                </svg>

                {/* X-axis */}
                <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
                  {summaryData.map((d) => (
                    <span key={d.month}>{d.month}</span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
