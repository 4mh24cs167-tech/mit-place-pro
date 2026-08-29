"use client";

/**
 * Auto-generates a professional offer letter PDF from placement data
 * using html2pdf.js (already installed in the project).
 */

interface OfferLetterData {
  studentName: string;
  usn: string;
  department: string;
  cgpa: number | null;
  jobTitle: string;
  companyName: string;
  companySector?: string;
  companyWebsite?: string;
  companyHqCity?: string;
  ctcLpa: string;
  joiningDate?: string;
  workMode?: string;
  workLocation?: string;
  bondYears?: number;
  driveName?: string;
  offerDate: string;
}

function buildOfferLetterHtml(data: OfferLetterData): string {
  return `
    <div style="font-family: 'Georgia', serif; max-width: 700px; margin: 0 auto; padding: 50px 60px; color: #1a1a2e;">
      <!-- Company Header -->
      <div style="border-bottom: 3px solid #2d2d6b; padding-bottom: 20px; margin-bottom: 30px;">
        <h1 style="margin: 0; font-size: 24px; color: #2d2d6b; letter-spacing: 1px;">${data.companyName}</h1>
        <div style="margin-top: 6px; font-size: 12px; color: #666;">
          ${[data.companySector, data.companyHqCity, data.companyWebsite].filter(Boolean).join(" | ")}
        </div>
      </div>

      <!-- Date & Reference -->
      <div style="text-align: right; font-size: 13px; color: #555; margin-bottom: 30px;">
        <p style="margin: 0;">Date: ${data.offerDate}</p>
        <p style="margin: 4px 0 0;">Ref: MITM/OFFER/${Date.now().toString().slice(-6)}</p>
      </div>

      <!-- Addressee -->
      <div style="margin-bottom: 24px;">
        <p style="font-size: 14px; margin: 0;">To,</p>
        <p style="font-size: 15px; font-weight: 600; margin: 4px 0 0;">${data.studentName}</p>
        <p style="font-size: 13px; color: #555; margin: 2px 0 0;">USN: ${data.usn} | Dept: ${data.department}${data.cgpa ? ` | CGPA: ${data.cgpa}` : ""}</p>
      </div>

      <!-- Subject -->
      <p style="font-size: 14px; margin: 0 0 20px;"><strong>Subject: Offer of Employment — ${data.jobTitle}</strong></p>

      <!-- Salutation -->
      <p style="font-size: 14px; margin: 0 0 16px;">Dear <strong>${data.studentName}</strong>,</p>

      <!-- Body -->
      <p style="font-size: 13px; line-height: 1.8; margin: 0 0 16px; text-align: justify;">
        We are pleased to inform you that based on your outstanding performance during the campus recruitment process${data.driveName ? ` (${data.driveName})` : ""} conducted at <strong>Maharaja Institute of Technology, Mysuru (MITM)</strong>, you have been selected for the position of <strong>${data.jobTitle}</strong> at <strong>${data.companyName}</strong>.
      </p>

      <!-- Offer Details -->
      <div style="background: #f8f9ff; border: 1px solid #e0e3ff; border-radius: 8px; padding: 20px; margin: 20px 0;">
        <h3 style="font-size: 14px; color: #2d2d6b; margin: 0 0 12px; text-transform: uppercase; letter-spacing: 1px;">Offer Details</h3>
        <table style="width: 100%; font-size: 13px; border-collapse: collapse;">
          <tr>
            <td style="padding: 6px 0; color: #555; width: 40%;">Position</td>
            <td style="padding: 6px 0; font-weight: 600;">${data.jobTitle}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #555;">Annual CTC</td>
            <td style="padding: 6px 0; font-weight: 600;">${data.ctcLpa}</td>
          </tr>
          ${data.workMode ? `<tr>
            <td style="padding: 6px 0; color: #555;">Work Mode</td>
            <td style="padding: 6px 0;">${data.workMode}</td>
          </tr>` : ""}
          ${data.workLocation ? `<tr>
            <td style="padding: 6px 0; color: #555;">Work Location</td>
            <td style="padding: 6px 0;">${data.workLocation}</td>
          </tr>` : ""}
          ${data.joiningDate ? `<tr>
            <td style="padding: 6px 0; color: #555;">Expected Joining Date</td>
            <td style="padding: 6px 0;">${data.joiningDate}</td>
          </tr>` : ""}
          ${data.bondYears ? `<tr>
            <td style="padding: 6px 0; color: #555;">Service Bond</td>
            <td style="padding: 6px 0;">${data.bondYears} year(s)</td>
          </tr>` : ""}
        </table>
      </div>

      <p style="font-size: 13px; line-height: 1.8; margin: 0 0 16px; text-align: justify;">
        We are confident that your skills and dedication will be a valuable addition to our team. Please confirm your acceptance of this offer at the earliest.
      </p>

      <p style="font-size: 13px; line-height: 1.8; margin: 0 0 30px; text-align: justify;">
        We look forward to welcoming you aboard!
      </p>

      <!-- Closing -->
      <div style="margin-top: 40px;">
        <p style="font-size: 13px; margin: 0;">Warm regards,</p>
        <p style="font-size: 15px; font-weight: 600; margin: 8px 0 0; color: #2d2d6b;">${data.companyName}</p>
        <p style="font-size: 12px; color: #888; margin: 4px 0 0;">Campus Recruitment Team</p>
      </div>

      <!-- Footer -->
      <div style="margin-top: 50px; padding-top: 15px; border-top: 1px solid #eee; text-align: center;">
        <p style="font-size: 10px; color: #aaa; margin: 0;">This offer letter was generated via MITM PlacePro — Campus Placement Portal</p>
        <p style="font-size: 10px; color: #aaa; margin: 2px 0 0;">Maharaja Institute of Technology, Mysuru</p>
      </div>
    </div>
  `;
}

export async function generateOfferLetterPdf(data: OfferLetterData): Promise<Blob> {
  const html2pdf = (await import("html2pdf.js")).default;
  const html = buildOfferLetterHtml(data);
  const container = document.createElement("div");
  container.innerHTML = html;
  document.body.appendChild(container);
  try {
    const blob: Blob = await html2pdf()
      .set({
        margin: [15, 10, 15, 10],
        filename: `Offer_Letter_${data.studentName.replace(/\s+/g, "_")}.pdf`,
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

export function downloadOfferLetter(blob: Blob, studentName: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `Offer_Letter_${studentName.replace(/\s+/g, "_")}.pdf`;
  a.click();
  URL.revokeObjectURL(url);
}

export function previewOfferLetterHtml(data: OfferLetterData): string {
  return buildOfferLetterHtml(data);
}
