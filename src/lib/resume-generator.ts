"use client";

/**
 * Auto-generates a professional ATS-friendly PDF resume from student profile data
 * using html2pdf.js (already installed in the project).
 */

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

function buildResumeHtml(data: ResumeData): string {
  const skillsList = Array.isArray(data.skills)
    ? data.skills
    : data.skills
    ? data.skills.split(",").map((s) => s.trim()).filter(Boolean)
    : [];

  const eduRecords = (data.educationRecords || [])
    .sort((a, b) => (QUAL_ORDER[a.qualificationType] || 9) - (QUAL_ORDER[b.qualificationType] || 9));

  return `
    <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 700px; margin: 0 auto; padding: 40px; color: #1a1a2e;">
      <!-- Header -->
      <div style="border-bottom: 3px solid #2d2d6b; padding-bottom: 20px; margin-bottom: 24px;">
        <h1 style="margin: 0; font-size: 28px; color: #2d2d6b; letter-spacing: 1px;">
          ${data.fullName || "Student"}
        </h1>
        <div style="margin-top: 8px; font-size: 13px; color: #555;">
          ${[data.email, data.phone].filter(Boolean).join(" • ")}
        </div>
        ${data.linkedin || data.github ? `
        <div style="margin-top: 4px; font-size: 12px; color: #666;">
          ${data.linkedin ? `LinkedIn: ${data.linkedin}` : ""}${data.linkedin && data.github ? " • " : ""}${data.github ? `GitHub: ${data.github}` : ""}
        </div>` : ""}
      </div>

      ${
        data.aboutMe
          ? `
      <!-- Career Objective -->
      <div style="margin-bottom: 24px;">
        <h2 style="font-size: 16px; color: #2d2d6b; text-transform: uppercase; letter-spacing: 2px; border-bottom: 1px solid #ddd; padding-bottom: 6px; margin-bottom: 10px;">
          Career Objective
        </h2>
        <p style="font-size: 13px; line-height: 1.6; color: #444; margin: 0;">
          ${data.aboutMe}
        </p>
      </div>`
          : ""
      }

      <!-- Education -->
      ${eduRecords.length > 0 ? `
      <div style="margin-bottom: 24px;">
        <h2 style="font-size: 16px; color: #2d2d6b; text-transform: uppercase; letter-spacing: 2px; border-bottom: 1px solid #ddd; padding-bottom: 6px; margin-bottom: 10px;">
          Education
        </h2>
        <table style="width: 100%; font-size: 13px; border-collapse: collapse;">
          ${eduRecords.map(edu => {
            const label = QUAL_LABELS[edu.qualificationType] || edu.qualificationType;
            const institution = edu.collegeName || "";
            const details = [
              edu.university || edu.board || "",
              edu.stream || edu.specialization || edu.courseName || "",
            ].filter(Boolean).join(" · ");
            const score = edu.cgpa ? `CGPA: ${edu.cgpa}` : edu.percentage ? `${edu.percentage}%` : "";
            const year = edu.passingYear ? `${edu.passingYear}` : "";
            return `
          <tr>
            <td style="padding: 8px 0; vertical-align: top;">
              <div style="font-weight: 600;">${label}</div>
              ${institution ? `<div style="font-size: 12px; color: #666;">${institution}</div>` : ""}
              ${details ? `<div style="font-size: 11px; color: #888;">${details}</div>` : ""}
            </td>
            <td style="padding: 8px 0; text-align: right; vertical-align: top; white-space: nowrap;">
              ${score ? `<div style="font-weight: 600;">${score}</div>` : ""}
              ${year ? `<div style="font-size: 11px; color: #888;">${year}</div>` : ""}
            </td>
          </tr>`;
          }).join("")}
        </table>
      </div>` : ""}

      ${
        skillsList.length > 0
          ? `
      <!-- Skills -->
      <div style="margin-bottom: 24px;">
        <h2 style="font-size: 16px; color: #2d2d6b; text-transform: uppercase; letter-spacing: 2px; border-bottom: 1px solid #ddd; padding-bottom: 6px; margin-bottom: 10px;">
          Skills
        </h2>
        <div style="display: flex; flex-wrap: wrap; gap: 8px;">
          ${skillsList
            .map(
              (skill) =>
                `<span style="display: inline-block; padding: 4px 14px; background: #eef0f8; color: #2d2d6b; border-radius: 20px; font-size: 12px; font-weight: 500;">${skill}</span>`
            )
            .join("")}
        </div>
      </div>`
          : ""
      }

      ${
        (data.certifications || []).length > 0
          ? `
      <!-- Certifications -->
      <div style="margin-bottom: 24px;">
        <h2 style="font-size: 16px; color: #2d2d6b; text-transform: uppercase; letter-spacing: 2px; border-bottom: 1px solid #ddd; padding-bottom: 6px; margin-bottom: 10px;">
          Certifications
        </h2>
        <ul style="margin: 0; padding-left: 20px; font-size: 13px; color: #444;">
          ${(data.certifications || []).map(c => `<li style="padding: 3px 0;">${c}</li>`).join("")}
        </ul>
      </div>`
          : ""
      }

      ${
        (data.languages || []).length > 0
          ? `
      <!-- Languages -->
      <div style="margin-bottom: 24px;">
        <h2 style="font-size: 16px; color: #2d2d6b; text-transform: uppercase; letter-spacing: 2px; border-bottom: 1px solid #ddd; padding-bottom: 6px; margin-bottom: 10px;">
          Languages Known
        </h2>
        <div style="font-size: 13px; color: #444;">
          ${(data.languages || []).join(", ")}
        </div>
      </div>`
          : ""
      }

      ${
        data.category
          ? `
      <!-- Additional Info -->
      <div style="margin-bottom: 24px;">
        <h2 style="font-size: 16px; color: #2d2d6b; text-transform: uppercase; letter-spacing: 2px; border-bottom: 1px solid #ddd; padding-bottom: 6px; margin-bottom: 10px;">
          Additional Information
        </h2>
        <p style="font-size: 13px; color: #444; margin: 0;">Category: ${data.category}</p>
      </div>`
          : ""
      }

      <!-- Footer -->
      <div style="margin-top: 32px; padding-top: 12px; border-top: 1px solid #eee; text-align: center;">
        <p style="font-size: 11px; color: #999; margin: 0;">
          Generated via MITM PlacePro • Campus Placement Portal
        </p>
      </div>
    </div>
  `;
}

// Load html2pdf.js from CDN to avoid Next.js module issues
function loadHtml2Pdf(): Promise<any> {
  return new Promise((resolve, reject) => {
    if ((window as any).html2pdf) {
      resolve((window as any).html2pdf);
      return;
    }
    const script = document.createElement("script");
    script.src = "https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.2/html2pdf.bundle.min.js";
    script.onload = () => resolve((window as any).html2pdf);
    script.onerror = () => reject(new Error("Failed to load html2pdf.js"));
    document.head.appendChild(script);
  });
}

export async function generateResumePdf(data: ResumeData): Promise<Blob> {
  const html2pdf = await loadHtml2Pdf();

  const html = buildResumeHtml(data);

  const container = document.createElement("div");
  container.innerHTML = html;
  document.body.appendChild(container);

  try {
    const blob: Blob = await html2pdf()
      .set({
        margin: [10, 10, 10, 10],
        filename: `${(data.fullName || "resume").replace(/\s+/g, "_")}_Resume.pdf`,
        image: { type: "jpeg", quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
      })
      .from(container)
      .outputPdf("blob");

    return blob;
  } finally {
    document.body.removeChild(container);
  }
}

export function previewResumeHtml(data: ResumeData): string {
  return buildResumeHtml(data);
}

export function downloadResumePdf(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  a.click();
  URL.revokeObjectURL(url);
}
