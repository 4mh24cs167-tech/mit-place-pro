"use client";

/**
 * Auto-generates a professional ATS-friendly PDF resume using jsPDF directly.
 * No html2pdf.js or CDN needed — pure jsPDF API calls.
 */

import { jsPDF } from "jspdf";

interface EducationRecord {
  qualificationType: string;
  collegeName?: string;
  courseName?: string;
  university?: string;
  board?: string;
  stream?: string;
  specialization?: string;
  percentage?: number;
  cgpa?: number;
  passingYear?: number;
}

interface ResumeData {
  fullName: string;
  email: string;
  phone?: string;
  gender?: string;
  category?: string;
  dateOfBirth?: string;
  skills?: string[] | string;
  certifications?: string[];
  languages?: string[];
  aboutMe?: string;
  department?: string;
  educationRecords?: EducationRecord[];
  linkedin?: string;
  github?: string;
}

const QUAL_ORDER: Record<string, number> = { PG: 1, UG: 2, DIPLOMA: 3, PUC: 4, SSLC: 5 };
const QUAL_LABELS: Record<string, string> = {
  SSLC: "10th / SSLC", PUC: "12th / PUC", DIPLOMA: "Diploma", UG: "Undergraduate", PG: "Postgraduate",
};

const COLORS = {
  primary: [45, 45, 107] as [number, number, number],
  text: [51, 51, 51] as [number, number, number],
  muted: [119, 119, 119] as [number, number, number],
  line: [200, 200, 200] as [number, number, number],
  skillBg: [238, 240, 248] as [number, number, number],
};

export async function generateResumePdf(data: ResumeData): Promise<Blob> {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();
  const margin = 20;
  const contentW = pageW - margin * 2;
  let y = 20;

  const checkPage = (needed: number) => {
    if (y + needed > 280) { doc.addPage(); y = 20; }
  };

  // ─── Header ───
  doc.setFontSize(24);
  doc.setTextColor(...COLORS.primary);
  doc.setFont("helvetica", "bold");
  doc.text(data.fullName || "Student", margin, y);
  y += 8;

  doc.setFontSize(10);
  doc.setTextColor(...COLORS.muted);
  doc.setFont("helvetica", "normal");
  const contactParts = [data.email, data.phone].filter(Boolean);
  if (contactParts.length) {
    doc.text(contactParts.join("  •  "), margin, y);
    y += 5;
  }

  const linkParts = [];
  if (data.linkedin) linkParts.push(`LinkedIn: ${data.linkedin}`);
  if (data.github) linkParts.push(`GitHub: ${data.github}`);
  if (linkParts.length) {
    doc.setFontSize(8);
    const linkText = linkParts.join("  •  ");
    const lines = doc.splitTextToSize(linkText, contentW);
    doc.text(lines, margin, y);
    y += lines.length * 4;
  }

  // Header line
  y += 2;
  doc.setDrawColor(...COLORS.primary);
  doc.setLineWidth(0.8);
  doc.line(margin, y, pageW - margin, y);
  y += 8;

  // ─── Section Helper ───
  const drawSection = (title: string) => {
    checkPage(15);
    doc.setFontSize(12);
    doc.setTextColor(...COLORS.primary);
    doc.setFont("helvetica", "bold");
    doc.text(title.toUpperCase(), margin, y);
    y += 1;
    doc.setDrawColor(...COLORS.line);
    doc.setLineWidth(0.3);
    doc.line(margin, y, pageW - margin, y);
    y += 6;
  };

  // ─── Career Objective ───
  if (data.aboutMe) {
    drawSection("Career Objective");
    doc.setFontSize(10);
    doc.setTextColor(...COLORS.text);
    doc.setFont("helvetica", "normal");
    const lines = doc.splitTextToSize(data.aboutMe, contentW);
    checkPage(lines.length * 5);
    doc.text(lines, margin, y);
    y += lines.length * 5 + 4;
  }

  // ─── Education ───
  const eduRecords = (data.educationRecords || [])
    .sort((a, b) => (QUAL_ORDER[a.qualificationType] || 9) - (QUAL_ORDER[b.qualificationType] || 9));

  if (eduRecords.length > 0) {
    drawSection("Education");

    for (const edu of eduRecords) {
      checkPage(18);
      const label = QUAL_LABELS[edu.qualificationType] || edu.qualificationType;
      const score = edu.cgpa ? `CGPA: ${edu.cgpa}` : edu.percentage ? `${edu.percentage}%` : "";

      doc.setFontSize(10);
      doc.setTextColor(...COLORS.text);
      doc.setFont("helvetica", "bold");
      doc.text(label, margin, y);

      if (score) {
        doc.setFont("helvetica", "bold");
        doc.text(score, pageW - margin, y, { align: "right" });
      }
      y += 4.5;

      if (edu.collegeName) {
        doc.setFontSize(9);
        doc.setTextColor(...COLORS.muted);
        doc.setFont("helvetica", "normal");
        doc.text(edu.collegeName, margin, y);
        if (edu.passingYear) {
          doc.text(String(edu.passingYear), pageW - margin, y, { align: "right" });
        }
        y += 4;
      }

      const details = [edu.university || edu.board, edu.stream || edu.specialization || edu.courseName]
        .filter(Boolean).join(" · ");
      if (details) {
        doc.setFontSize(8);
        doc.setTextColor(...COLORS.muted);
        doc.text(details, margin, y);
        y += 4;
      }
      y += 2;
    }
    y += 2;
  }

  // ─── Skills ───
  const skillsList = Array.isArray(data.skills)
    ? data.skills
    : data.skills ? data.skills.split(",").map(s => s.trim()).filter(Boolean) : [];

  if (skillsList.length > 0) {
    drawSection("Skills");
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");

    let xPos = margin;
    for (const skill of skillsList) {
      const textW = doc.getTextWidth(skill) + 8;
      if (xPos + textW > pageW - margin) {
        xPos = margin;
        y += 7;
        checkPage(8);
      }
      doc.setFillColor(...COLORS.skillBg);
      doc.roundedRect(xPos, y - 3.5, textW, 6, 3, 3, "F");
      doc.setTextColor(...COLORS.primary);
      doc.text(skill, xPos + 4, y);
      xPos += textW + 3;
    }
    y += 10;
  }

  // ─── Certifications ───
  if ((data.certifications || []).length > 0) {
    drawSection("Certifications");
    doc.setFontSize(9);
    doc.setTextColor(...COLORS.text);
    doc.setFont("helvetica", "normal");
    for (const cert of data.certifications!) {
      checkPage(6);
      const lines = doc.splitTextToSize(`•  ${cert}`, contentW - 4);
      doc.text(lines, margin + 2, y);
      y += lines.length * 4.5;
    }
    y += 4;
  }

  // ─── Languages ───
  if ((data.languages || []).length > 0) {
    drawSection("Languages Known");
    doc.setFontSize(9);
    doc.setTextColor(...COLORS.text);
    doc.setFont("helvetica", "normal");
    doc.text((data.languages || []).join(", "), margin, y);
    y += 8;
  }

  // ─── Additional Info ───
  if (data.category) {
    drawSection("Additional Information");
    doc.setFontSize(9);
    doc.setTextColor(...COLORS.text);
    doc.setFont("helvetica", "normal");
    doc.text(`Category: ${data.category}`, margin, y);
    y += 8;
  }

  // ─── Footer ───
  checkPage(12);
  y = Math.max(y, 270);
  doc.setDrawColor(...COLORS.line);
  doc.setLineWidth(0.2);
  doc.line(margin, y, pageW - margin, y);
  y += 4;
  doc.setFontSize(7);
  doc.setTextColor(160, 160, 160);
  doc.text("Generated via UdyogaMITra", pageW / 2, y, { align: "center" });

  return doc.output("blob");
}

// ─── Preview HTML (for inline preview in the UI) ───
export function previewResumeHtml(data: ResumeData): string {
  const skillsList = Array.isArray(data.skills)
    ? data.skills
    : data.skills ? data.skills.split(",").map(s => s.trim()).filter(Boolean) : [];

  const eduRecords = (data.educationRecords || [])
    .sort((a, b) => (QUAL_ORDER[a.qualificationType] || 9) - (QUAL_ORDER[b.qualificationType] || 9));

  return `
    <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 700px; margin: 0 auto; padding: 40px; color: #1a1a2e;">
      <div style="border-bottom: 3px solid #2d2d6b; padding-bottom: 20px; margin-bottom: 24px;">
        <h1 style="margin: 0; font-size: 28px; color: #2d2d6b;">${data.fullName || "Student"}</h1>
        <div style="margin-top: 8px; font-size: 13px; color: #555;">${[data.email, data.phone].filter(Boolean).join(" • ")}</div>
        ${data.linkedin || data.github ? `<div style="margin-top: 4px; font-size: 12px; color: #666;">${[data.linkedin ? `LinkedIn: ${data.linkedin}` : "", data.github ? `GitHub: ${data.github}` : ""].filter(Boolean).join(" • ")}</div>` : ""}
      </div>
      ${data.aboutMe ? `<div style="margin-bottom: 24px;"><h2 style="font-size: 16px; color: #2d2d6b; text-transform: uppercase; letter-spacing: 2px; border-bottom: 1px solid #ddd; padding-bottom: 6px; margin-bottom: 10px;">Career Objective</h2><p style="font-size: 13px; line-height: 1.6; color: #444; margin: 0;">${data.aboutMe}</p></div>` : ""}
      ${eduRecords.length > 0 ? `<div style="margin-bottom: 24px;"><h2 style="font-size: 16px; color: #2d2d6b; text-transform: uppercase; letter-spacing: 2px; border-bottom: 1px solid #ddd; padding-bottom: 6px; margin-bottom: 10px;">Education</h2>${eduRecords.map(edu => `<div style="margin-bottom: 8px;"><strong>${QUAL_LABELS[edu.qualificationType] || edu.qualificationType}</strong>${edu.cgpa ? ` — CGPA: ${edu.cgpa}` : edu.percentage ? ` — ${edu.percentage}%` : ""}${edu.collegeName ? `<br/><span style="font-size: 12px; color: #666;">${edu.collegeName}</span>` : ""}${edu.passingYear ? ` <span style="font-size: 11px; color: #888;">(${edu.passingYear})</span>` : ""}</div>`).join("")}</div>` : ""}
      ${skillsList.length > 0 ? `<div style="margin-bottom: 24px;"><h2 style="font-size: 16px; color: #2d2d6b; text-transform: uppercase; letter-spacing: 2px; border-bottom: 1px solid #ddd; padding-bottom: 6px; margin-bottom: 10px;">Skills</h2><div style="display: flex; flex-wrap: wrap; gap: 8px;">${skillsList.map(s => `<span style="display: inline-block; padding: 4px 14px; background: #eef0f8; color: #2d2d6b; border-radius: 20px; font-size: 12px;">${s}</span>`).join("")}</div></div>` : ""}
      ${(data.certifications || []).length > 0 ? `<div style="margin-bottom: 24px;"><h2 style="font-size: 16px; color: #2d2d6b; text-transform: uppercase; letter-spacing: 2px; border-bottom: 1px solid #ddd; padding-bottom: 6px; margin-bottom: 10px;">Certifications</h2><ul style="margin: 0; padding-left: 20px; font-size: 13px; color: #444;">${(data.certifications || []).map(c => `<li style="padding: 3px 0;">${c}</li>`).join("")}</ul></div>` : ""}
      <div style="margin-top: 32px; padding-top: 12px; border-top: 1px solid #eee; text-align: center;"><p style="font-size: 11px; color: #999; margin: 0;">Generated via UdyogaMITra</p></div>
    </div>
  `;
}

export function downloadResumePdf(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  a.click();
  URL.revokeObjectURL(url);
}
