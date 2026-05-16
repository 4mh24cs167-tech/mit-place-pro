"use client";

import Header from "@/components/layout/Header";
import { cn } from "@/lib/utils";
import {
  CheckCircle2,
  Circle,
  FileText,
  Briefcase,
  CalendarClock,
  Award,
  ArrowRight,
  Download,
  Clock,
  MapPin,
  Building2,
  Star,
  TrendingUp,
} from "lucide-react";

// Journey steps
const journeySteps = [
  { label: "Profile Complete", icon: CheckCircle2, done: true },
  { label: "Shortlisted", icon: Briefcase, done: true },
  { label: "Interview Scheduled", icon: CalendarClock, done: true },
  { label: "Under Evaluation", icon: Clock, done: false, active: true },
  { label: "Offer Received", icon: Award, done: false },
];

const upcomingInterviews = [
  {
    id: "1",
    company: "Infosys Technologies",
    role: "Software Engineer",
    date: "May 18, 2026",
    time: "10:30 AM - 11:00 AM",
    round: "Technical Interview",
    venue: "Room 301, Admin Block",
    duration: "30 min",
  },
  {
    id: "2",
    company: "TCS",
    role: "Systems Engineer",
    date: "May 19, 2026",
    time: "2:00 PM - 2:20 PM",
    round: "Coding Round",
    venue: "Computer Lab 2",
    duration: "20 min",
  },
];

const myApplications = [
  { company: "Infosys", role: "Software Engineer", status: "Interview Scheduled", ctc: "4.5 - 6.0 LPA", atsScore: 82 },
  { company: "TCS", role: "Systems Engineer", status: "Shortlisted", ctc: "3.6 - 7.0 LPA", atsScore: 74 },
  { company: "Wipro", role: "Project Engineer", status: "Shortlisted", ctc: "3.8 - 5.5 LPA", atsScore: 68 },
];

export default function StudentDashboardPage() {
  return (
    <div className="page-enter">
      <Header
        userName="Arjun Sharma"
        userRole="Student"
        subtitle="Your placement journey is progressing well!"
      />

      <div className="px-8 pb-10 space-y-7">
        {/* Journey Progress */}
        <div className="glass-card p-6">
          <h3 className="text-base font-semibold text-foreground mb-5">Your Placement Journey</h3>
          <div className="flex items-center justify-between relative">
            {/* Connecting line */}
            <div className="absolute top-5 left-0 right-0 h-0.5 bg-border z-0" />
            <div className="absolute top-5 left-0 h-0.5 bg-indigo-500 z-0" style={{ width: "55%" }} />

            {journeySteps.map((step, i) => {
              const Icon = step.icon;
              return (
                <div key={step.label} className="flex flex-col items-center z-10 relative">
                  <div className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all",
                    step.done
                      ? "bg-indigo-500 border-indigo-500 text-white"
                      : step.active
                        ? "bg-white border-indigo-500 text-indigo-500 status-pulse"
                        : "bg-white border-border text-muted-foreground"
                  )}>
                    {step.done ? (
                      <CheckCircle2 className="w-5 h-5" />
                    ) : (
                      <Icon className="w-4 h-4" />
                    )}
                  </div>
                  <p className={cn(
                    "text-[11px] font-medium mt-2 text-center max-w-[80px]",
                    step.done ? "text-indigo-600" : step.active ? "text-foreground" : "text-muted-foreground"
                  )}>
                    {step.label}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Stats + Profile completion */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="glass-card p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-indigo-50 flex items-center justify-center">
              <FileText className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">3</p>
              <p className="text-xs text-muted-foreground">CVs Uploaded</p>
            </div>
          </div>

          <div className="glass-card p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center">
              <Briefcase className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">3</p>
              <p className="text-xs text-muted-foreground">Applications</p>
            </div>
          </div>

          <div className="glass-card p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-violet-50 flex items-center justify-center">
              <CalendarClock className="w-5 h-5 text-violet-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">2</p>
              <p className="text-xs text-muted-foreground">Upcoming Interviews</p>
            </div>
          </div>

          <div className="glass-card p-5">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs text-muted-foreground">Profile Completion</p>
              <p className="text-xs font-semibold text-emerald-600">80%</p>
            </div>
            <div className="h-2 rounded-full bg-muted overflow-hidden">
              <div className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 rounded-full progress-fill" style={{ width: "80%" }} />
            </div>
            <p className="text-[10px] text-muted-foreground mt-2">Add certifications & achievements to reach 100%</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Upcoming interviews */}
          <div className="lg:col-span-3 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-semibold text-foreground">Upcoming Interviews</h3>
              <button className="text-xs text-primary hover:underline font-medium flex items-center gap-1">
                View all <ArrowRight className="w-3 h-3" />
              </button>
            </div>

            {upcomingInterviews.map((interview) => (
              <div key={interview.id} className="glass-card p-5">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-100 to-violet-100 flex items-center justify-center text-sm font-bold text-indigo-700">
                      {interview.company.charAt(0)}
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-foreground">{interview.company}</h4>
                      <p className="text-xs text-muted-foreground mt-0.5">{interview.role}</p>
                      <div className="flex items-center gap-3 mt-2.5">
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <CalendarClock className="w-3.5 h-3.5" />
                          {interview.date}
                        </div>
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <Clock className="w-3.5 h-3.5" />
                          {interview.time}
                        </div>
                      </div>
                      <div className="flex items-center gap-3 mt-1.5">
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <MapPin className="w-3.5 h-3.5" />
                          {interview.venue}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] font-semibold px-2.5 py-1 rounded-full bg-violet-50 text-violet-600">
                      {interview.round}
                    </span>
                    <p className="text-[10px] text-muted-foreground mt-2">{interview.duration}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* My applications */}
          <div className="lg:col-span-2">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-semibold text-foreground">My Applications</h3>
            </div>
            <div className="space-y-3">
              {myApplications.map((app, i) => (
                <div key={i} className="glass-card p-4 cursor-pointer">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-indigo-500" />
                      <span className="text-sm font-semibold text-foreground">{app.company}</span>
                    </div>
                    <div className={cn(
                      "flex items-center gap-1.5 text-[10px] font-semibold px-2 py-0.5 rounded-full",
                      app.atsScore >= 80 ? "bg-emerald-50 text-emerald-600" :
                      app.atsScore >= 65 ? "bg-blue-50 text-blue-600" :
                      "bg-amber-50 text-amber-600"
                    )}>
                      <Star className="w-3 h-3" />
                      ATS: {app.atsScore}%
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">{app.role}</p>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-[10px] text-muted-foreground">CTC: {app.ctc}</span>
                    <span className={cn(
                      "text-[10px] font-semibold px-2 py-0.5 rounded-full",
                      app.status === "Interview Scheduled" ? "bg-violet-50 text-violet-600" : "bg-blue-50 text-blue-600"
                    )}>
                      {app.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
