"use client";

/**
 * Auto-generates a professional PDF resume from student profile data
 * using html2pdf.js (already installed in the project).
 */

interface ResumeData {
  fullName: string;
  email: string;
  phone?: string;
  gender?: string;
  category?: string;
  dateOfBirth?: string;
  tenthPercent?: number;
  tenthBoard?: string;
  twelfthPercent?: number;
  twelfthBoard?: string;
  cgpa?: number;
  backlogs?: number;
  skills?: string;
  aboutMe?: string;
}

function buildResumeHtml(data: ResumeData): string {
  const skillsList = data.skills
    ? data.skills.split(",").map((s) => s.trim()).filter(Boolean)
    : [];

  return `
    <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 700px; margin: 0 auto; padding: 40px; color: #1a1a2e;">
      <!-- Header -->
      <div style="border-bottom: 3px solid #2d2d6b; padding-bottom: 20px; margin-bottom: 24px;">
        <h1 style="margin: 0; font-size: 28px; color: #2d2d6b; letter-spacing: 1px;">
          ${data.fullName || "Student"}
        </h1>
        <div style="margin-top: 8px; font-size: 13px; color: #555;">
          ${[data.email, data.phone, data.gender].filter(Boolean).join(" • ")}
        </div>
      </div>

      ${
        data.aboutMe
          ? `
      <!-- About -->
      <div style="margin-bottom: 24px;">
        <h2 style="font-size: 16px; color: #2d2d6b; text-transform: uppercase; letter-spacing: 2px; border-bottom: 1px solid #ddd; padding-bottom: 6px; margin-bottom: 10px;">
          About Me
        </h2>
        <p style="font-size: 13px; line-height: 1.6; color: #444; margin: 0;">
          ${data.aboutMe}
        </p>
      </div>`
          : ""
      }

      <!-- Education -->
      <div style="margin-bottom: 24px;">
        <h2 style="font-size: 16px; color: #2d2d6b; text-transform: uppercase; letter-spacing: 2px; border-bottom: 1px solid #ddd; padding-bottom: 6px; margin-bottom: 10px;">
          Education
        </h2>
        <table style="width: 100%; font-size: 13px; border-collapse: collapse;">
          ${
            data.cgpa
              ? `
          <tr>
            <td style="padding: 6px 0; font-weight: 600;">Degree (Current)</td>
            <td style="padding: 6px 0; text-align: right;">CGPA: ${data.cgpa}${data.backlogs ? ` | Backlogs: ${data.backlogs}` : ""}</td>
          </tr>`
              : ""
          }
          ${
            data.twelfthPercent
              ? `
          <tr>
            <td style="padding: 6px 0; font-weight: 600;">12th / PUC${data.twelfthBoard ? ` (${data.twelfthBoard})` : ""}</td>
            <td style="padding: 6px 0; text-align: right;">${data.twelfthPercent}%</td>
          </tr>`
              : ""
          }
          ${
            data.tenthPercent
              ? `
          <tr>
            <td style="padding: 6px 0; font-weight: 600;">10th / SSLC${data.tenthBoard ? ` (${data.tenthBoard})` : ""}</td>
            <td style="padding: 6px 0; text-align: right;">${data.tenthPercent}%</td>
          </tr>`
              : ""
          }
        </table>
      </div>

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

export async function generateResumePdf(data: ResumeData): Promise<Blob> {
  // Dynamic import html2pdf.js (client-side only)
  const html2pdf = (await import("html2pdf.js")).default;

  const html = buildResumeHtml(data);

  // Create a temporary container
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

export function downloadResumePdf(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  a.click();
  URL.revokeObjectURL(url);
}
