"use client";

import Header from "@/components/layout/Header";
import { cn } from "@/lib/utils";
import {
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  GraduationCap,
  Briefcase,
  Code,
  Award,
  Globe,
  Edit3,
  Plus,
  ExternalLink,
  GitBranch,
} from "lucide-react";

const profileData = {
  fullName: "Arjun Sharma",
  headline: "Final Year CSE Student | Full Stack Developer | Open Source Enthusiast",
  usn: "4MT21CS001",
  email: "arjun.sharma@mitm.edu.in",
  phone: "+91 98765 43210",
  dob: "March 15, 2003",
  gender: "Male",
  address: "42, MG Road, Mysuru, Karnataka - 570001",
  department: "Computer Science & Engineering",
  semester: 8,
  cgpa: 8.75,
  tenthPercent: 92.5,
  tenthBoard: "CBSE",
  tenthYear: 2019,
  twelfthPercent: 88.0,
  twelfthBoard: "Karnataka State Board",
  twelfthYear: 2021,
  twelfthStream: "Science",
  backlogs: 0,
  category: "General",
  about: "Passionate full-stack developer with a strong foundation in data structures, algorithms, and system design. Experienced in building scalable web applications using React, Node.js, and cloud technologies. Active contributor to open-source projects with a keen interest in AI/ML applications.",
  skills: ["React", "Next.js", "Node.js", "TypeScript", "Python", "PostgreSQL", "MongoDB", "Docker", "AWS", "Git", "System Design", "Data Structures"],
  experience: [
    { company: "Google Summer of Code", role: "Open Source Contributor", period: "May 2025 - Aug 2025", description: "Contributed to Mozilla Firefox's developer tools. Implemented 3 new features and fixed 12 bugs.", isCurrent: false },
    { company: "TechStartup Inc.", role: "Full Stack Intern", period: "Jan 2025 - Apr 2025", description: "Built RESTful APIs using NestJS and designed frontend dashboards with React & Tailwind CSS.", isCurrent: false },
  ],
  projects: [
    { title: "SmartBus — Real-Time Transit Tracker", description: "Full-stack app for tracking city buses in real-time using GPS + WebSockets.", tech: ["React Native", "Node.js", "Socket.io", "PostgreSQL"], github: "https://github.com", demo: "https://smartbus.app" },
    { title: "CodeReview AI", description: "AI-powered code review assistant using GPT-4 API for automated PR reviews.", tech: ["Python", "FastAPI", "OpenAI", "React"], github: "https://github.com" },
    { title: "MITM Attendance System", description: "QR-code based attendance system deployed across 12 departments.", tech: ["Next.js", "Firebase", "QR.js"], github: "https://github.com" },
  ],
  certifications: [
    { name: "AWS Cloud Practitioner", issuer: "Amazon Web Services", date: "Dec 2025" },
    { name: "Meta Front-End Developer", issuer: "Meta / Coursera", date: "Sep 2025" },
    { name: "Google Data Analytics", issuer: "Google / Coursera", date: "Jun 2025" },
  ],
  achievements: [
    "1st Place — National Hackathon (HackMIT 2025)",
    "Published paper in IEEE Conference on IoT",
    "College Coding Club President (2024-2026)",
    "500+ problems solved on LeetCode",
  ],
  languages: [
    { name: "English", proficiency: "Fluent" },
    { name: "Hindi", proficiency: "Native" },
    { name: "Kannada", proficiency: "Conversational" },
  ],
};

export default function StudentProfilePage() {
  return (
    <div className="page-enter">
      <Header
        userName="Arjun Sharma"
        userRole="Student"
        greeting="My Profile"
        subtitle="Your LinkedIn-style placement profile"
      />

      <div className="px-8 pb-10 space-y-6">
        {/* Profile banner */}
        <div className="i-card overflow-hidden">
          <div className="h-32 bg-gradient-to-r from-indigo-600 via-violet-600 to-purple-600 relative">
            <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'40\' height=\'40\' viewBox=\'0 0 40 40\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'%23fff\' fill-opacity=\'0.1\'%3E%3Cpath d=\'M0 40L40 0H20L0 20M40 40V20L20 40\'/%3E%3C/g%3E%3C/svg%3E")' }} />
          </div>
          <div className="px-6 pb-6 relative">
            <div className="flex items-end gap-5 -mt-12">
              <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-indigo-400 to-violet-500 flex items-center justify-center text-2xl font-bold text-white border-4 border-white shadow-lg">
                AS
              </div>
              <div className="pb-1 flex-1">
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="text-xl font-bold text-foreground">{profileData.fullName}</h2>
                    <p className="text-sm text-muted-foreground mt-0.5">{profileData.headline}</p>
                  </div>
                  <button className="flex items-center gap-2 px-4 py-2 rounded-xl border border-border bg-white text-sm font-medium text-foreground hover:bg-muted/50 transition-colors">
                    <Edit3 className="w-4 h-4" />
                    Edit Profile
                  </button>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-6 mt-4 text-xs text-muted-foreground flex-wrap">
              <div className="flex items-center gap-1.5"><GraduationCap className="w-3.5 h-3.5" /> {profileData.department} · Sem {profileData.semester}</div>
              <div className="flex items-center gap-1.5"><Mail className="w-3.5 h-3.5" /> {profileData.email}</div>
              <div className="flex items-center gap-1.5"><Phone className="w-3.5 h-3.5" /> {profileData.phone}</div>
              <div className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5" /> Mysuru, Karnataka</div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left column */}
          <div className="space-y-6">
            {/* Academics */}
            <div className="i-card p-5">
              <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
                <GraduationCap className="w-4 h-4 text-indigo-500" /> Academics
              </h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">CGPA</span>
                  <span className="text-sm font-bold text-foreground">{profileData.cgpa}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">10th ({profileData.tenthBoard})</span>
                  <span className="text-sm font-bold text-foreground">{profileData.tenthPercent}%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">12th ({profileData.twelfthBoard})</span>
                  <span className="text-sm font-bold text-foreground">{profileData.twelfthPercent}%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Backlogs</span>
                  <span className={cn("text-sm font-bold", profileData.backlogs === 0 ? "text-emerald-600" : "text-red-600")}>{profileData.backlogs}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">USN</span>
                  <span className="text-xs font-mono font-medium text-foreground">{profileData.usn}</span>
                </div>
              </div>
            </div>

            {/* Skills */}
            <div className="i-card p-5">
              <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                <Code className="w-4 h-4 text-indigo-500" /> Skills
              </h3>
              <div className="flex flex-wrap gap-2">
                {profileData.skills.map((skill) => (
                  <span key={skill} className="text-[11px] px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-600 font-medium border border-indigo-100">
                    {skill}
                  </span>
                ))}
              </div>
            </div>

            {/* Languages */}
            <div className="i-card p-5">
              <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                <Globe className="w-4 h-4 text-indigo-500" /> Languages
              </h3>
              <div className="space-y-2">
                {profileData.languages.map((lang) => (
                  <div key={lang.name} className="flex items-center justify-between">
                    <span className="text-xs text-foreground font-medium">{lang.name}</span>
                    <span className="text-[10px] text-muted-foreground">{lang.proficiency}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Certifications */}
            <div className="i-card p-5">
              <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                <Award className="w-4 h-4 text-indigo-500" /> Certifications
              </h3>
              <div className="space-y-3">
                {profileData.certifications.map((cert) => (
                  <div key={cert.name} className="pb-3 border-b border-border/50 last:border-0 last:pb-0">
                    <p className="text-xs font-medium text-foreground">{cert.name}</p>
                    <p className="text-[10px] text-muted-foreground">{cert.issuer} · {cert.date}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right column */}
          <div className="lg:col-span-2 space-y-6">
            {/* About */}
            <div className="i-card p-5">
              <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                <User className="w-4 h-4 text-indigo-500" /> About
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{profileData.about}</p>
            </div>

            {/* Experience */}
            <div className="i-card p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <Briefcase className="w-4 h-4 text-indigo-500" /> Experience
                </h3>
                <button className="p-1.5 rounded-lg hover:bg-muted transition-colors">
                  <Plus className="w-4 h-4 text-muted-foreground" />
                </button>
              </div>
              <div className="space-y-5">
                {profileData.experience.map((exp, i) => (
                  <div key={i} className="flex gap-4 pb-5 border-b border-border/50 last:border-0 last:pb-0">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center text-xs font-bold text-slate-600 flex-shrink-0">
                      {exp.company.charAt(0)}
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-foreground">{exp.role}</h4>
                      <p className="text-xs text-muted-foreground">{exp.company} · {exp.period}</p>
                      <p className="text-xs text-muted-foreground mt-2 leading-relaxed">{exp.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Projects */}
            <div className="i-card p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <Code className="w-4 h-4 text-indigo-500" /> Projects
                </h3>
                <button className="p-1.5 rounded-lg hover:bg-muted transition-colors">
                  <Plus className="w-4 h-4 text-muted-foreground" />
                </button>
              </div>
              <div className="space-y-4">
                {profileData.projects.map((proj, i) => (
                  <div key={i} className="p-4 rounded-xl border border-border/50 hover:border-primary/20 hover:bg-muted/20 transition-all">
                    <div className="flex items-start justify-between">
                      <h4 className="text-sm font-semibold text-foreground">{proj.title}</h4>
                      <div className="flex items-center gap-1.5">
                        {proj.github && (
                          <button className="p-1.5 rounded-lg hover:bg-muted transition-colors">
                            <GitBranch className="w-3.5 h-3.5 text-muted-foreground" />
                          </button>
                        )}
                        {proj.demo && (
                          <button className="p-1.5 rounded-lg hover:bg-muted transition-colors">
                            <ExternalLink className="w-3.5 h-3.5 text-muted-foreground" />
                          </button>
                        )}
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">{proj.description}</p>
                    <div className="flex flex-wrap gap-1.5 mt-2.5">
                      {proj.tech.map((t) => (
                        <span key={t} className="text-[10px] px-2 py-0.5 rounded-full bg-violet-50 text-violet-600 font-medium">
                          {t}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Achievements */}
            <div className="i-card p-5">
              <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                <Award className="w-4 h-4 text-indigo-500" /> Achievements
              </h3>
              <ul className="space-y-2">
                {profileData.achievements.map((ach, i) => (
                  <li key={i} className="flex items-start gap-2.5 text-sm text-muted-foreground">
                    <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 mt-1.5 flex-shrink-0" />
                    {ach}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
