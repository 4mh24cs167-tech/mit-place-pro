"use client";

import Header from "@/components/layout/Header";
import { cn } from "@/lib/utils";
import {
  FileText,
  Upload,
  Plus,
  Trash2,
  Download,
  Eye,
  CheckCircle2,
  Star,
  Clock,
  AlertCircle,
} from "lucide-react";
import { useState } from "react";

const cvs = [
  { id: "cv1", title: "General SDE Resume", targetRole: "Software Engineer", version: 3, fileSize: "245 KB", isActive: true, uploadedAt: "May 10, 2026", atsScores: [{ company: "Infosys", score: 82 }, { company: "TCS", score: 76 }] },
  { id: "cv2", title: "Data Science Resume", targetRole: "Data Scientist / ML Engineer", version: 1, fileSize: "198 KB", isActive: false, uploadedAt: "May 8, 2026", atsScores: [] },
  { id: "cv3", title: "Embedded Systems CV", targetRole: "Embedded Engineer", version: 2, fileSize: "312 KB", isActive: false, uploadedAt: "Apr 28, 2026", atsScores: [{ company: "Bosch", score: 68 }] },
];

export default function StudentCVPage() {
  const [dragActive, setDragActive] = useState(false);

  return (
    <div className="page-enter">
      <Header
        userName="Arjun Sharma"
        userRole="Student"
        greeting="My CVs"
        subtitle="Manage multiple versions of your resume for different roles"
      />

      <div className="px-8 pb-10 space-y-6">
        {/* Upload area */}
        <div
          className={cn(
            "i-card p-8 border-2 border-dashed transition-all text-center cursor-pointer",
            dragActive ? "border-primary bg-primary/5" : "border-border hover:border-primary/40"
          )}
          onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
          onDragLeave={() => setDragActive(false)}
          onDrop={(e) => { e.preventDefault(); setDragActive(false); }}
        >
          <div className="w-14 h-14 rounded-2xl bg-indigo-50 flex items-center justify-center mx-auto mb-4">
            <Upload className="w-7 h-7 text-indigo-600" />
          </div>
          <h3 className="text-base font-semibold text-foreground">Upload New CV</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Drag & drop your PDF here, or <span className="text-primary font-medium">browse files</span>
          </p>
          <p className="text-[10px] text-muted-foreground mt-2">PDF only · Max 2 MB · Max 5 CVs allowed</p>
        </div>

        {/* Info banner */}
        <div className="flex items-center gap-3 p-4 rounded-xl bg-blue-50 border border-blue-200">
          <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0" />
          <p className="text-xs text-blue-700">
            <strong>Tip:</strong> Tailor your CV for each role. The ATS engine scores your resume against each company&apos;s
            job description — a higher score significantly improves your shortlisting chances.
          </p>
        </div>

        {/* CV Cards */}
        <div className="space-y-4">
          {cvs.map((cv) => (
            <div key={cv.id} className={cn(
              "i-card p-5 transition-all",
              cv.isActive && "ring-2 ring-primary/20"
            )}>
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4">
                  <div className={cn(
                    "w-12 h-12 rounded-xl flex items-center justify-center",
                    cv.isActive ? "bg-indigo-100" : "bg-slate-100"
                  )}>
                    <FileText className={cn("w-6 h-6", cv.isActive ? "text-indigo-600" : "text-slate-500")} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-semibold text-foreground">{cv.title}</h3>
                      {cv.isActive && (
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600 inline-flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> Active
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">Target: {cv.targetRole}</p>
                    <div className="flex items-center gap-3 mt-2 text-[10px] text-muted-foreground">
                      <span>v{cv.version}</span>
                      <span>·</span>
                      <span>{cv.fileSize}</span>
                      <span>·</span>
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {cv.uploadedAt}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <button className="p-2 rounded-lg hover:bg-muted transition-colors" title="Preview">
                    <Eye className="w-4 h-4 text-muted-foreground" />
                  </button>
                  <button className="p-2 rounded-lg hover:bg-muted transition-colors" title="Download">
                    <Download className="w-4 h-4 text-muted-foreground" />
                  </button>
                  {!cv.isActive && (
                    <button className="p-2 rounded-lg hover:bg-red-50 transition-colors" title="Delete">
                      <Trash2 className="w-4 h-4 text-red-400" />
                    </button>
                  )}
                </div>
              </div>

              {/* ATS Scores */}
              {cv.atsScores.length > 0 && (
                <div className="mt-4 pt-3 border-t border-border/50">
                  <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">ATS Scores</p>
                  <div className="flex flex-wrap gap-2">
                    {cv.atsScores.map((score) => (
                      <div key={score.company} className={cn(
                        "flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg border",
                        score.score >= 80 ? "bg-emerald-50 text-emerald-600 border-emerald-200" :
                        score.score >= 65 ? "bg-blue-50 text-blue-600 border-blue-200" :
                        "bg-amber-50 text-amber-600 border-amber-200"
                      )}>
                        <Star className="w-3 h-3" />
                        {score.company}: {score.score}%
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {!cv.isActive && (
                <div className="mt-3 pt-3 border-t border-border/50">
                  <button className="text-xs text-primary font-medium hover:underline">Set as Active CV</button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
