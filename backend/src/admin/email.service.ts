import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

interface CompanyCredentials {
  companyName: string;
  hrName?: string;
  email: string;
  temporaryPassword: string;
  loginUrl: string;
}

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter: nodemailer.Transporter;
  private readonly logoUrl: string;
  private readonly fromName = 'MITM PlacePro';

  constructor(private readonly configService: ConfigService) {
    const frontendUrl = this.configService.get<string>('FRONTEND_URL', 'https://mitm-placepro.vercel.app');
    this.logoUrl = `${frontendUrl}/mitm-logo.png`;
    this.initTransporter();
  }

  private async initTransporter() {
    const smtpHost = this.configService.get<string>('SMTP_HOST', 'smtp-relay.brevo.com');
    const smtpPort = this.configService.get<number>('SMTP_PORT', 587);
    const smtpUser = this.configService.get<string>('SMTP_USER', '');
    const smtpPass = this.configService.get<string>('SMTP_PASS', '');

    if (!smtpUser || !smtpPass) {
      this.logger.warn('⚠️ No SMTP credentials — emails will be logged but NOT sent.');
      return;
    }

    // Try primary port, then fallback to 465 SSL
    const portsToTry = [smtpPort, smtpPort === 587 ? 465 : 587];

    for (const port of portsToTry) {
      try {
        this.transporter = nodemailer.createTransport({
          host: smtpHost,
          port,
          secure: port === 465,
          auth: { user: smtpUser, pass: smtpPass },
          connectionTimeout: 8000,
          greetingTimeout: 8000,
          socketTimeout: 15000,
        });

        await this.transporter.verify();
        this.logger.log(`✅ Email service connected via ${smtpHost}:${port}`);
        return; // success — stop trying
      } catch (err) {
        this.logger.warn(`❌ SMTP port ${port} failed: ${(err as Error).message}`);
        this.transporter = null as unknown as nodemailer.Transporter;
      }
    }

    this.logger.error('❌ All SMTP ports failed. Emails will NOT be sent.');
  }

  // ─── Shared HTML wrapper with college logo ──────
  private wrapHtml(title: string, headerBg: string, body: string): string {
    return `<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${title}</title></head>
<body style="margin:0;padding:0;background:#f4f4f7;font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f7;padding:32px 16px;">
<tr><td align="center">
<table width="100%" style="max-width:600px;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
  <!-- Header with Logo -->
  <tr><td style="background:${headerBg};padding:28px 32px;text-align:center;">
    <img src="${this.logoUrl}" alt="MITM Logo" width="64" height="64" style="display:block;margin:0 auto 12px;border-radius:12px;background:rgba(255,255,255,0.15);padding:4px;" />
    <h1 style="margin:0;color:#ffffff;font-size:22px;font-weight:700;letter-spacing:-0.5px;">MITM PlacePro</h1>
    <p style="margin:6px 0 0;color:rgba(255,255,255,0.8);font-size:13px;">${title}</p>
  </td></tr>
  <!-- Body -->
  <tr><td style="padding:28px 32px 36px;">${body}</td></tr>
  <!-- Footer -->
  <tr><td style="padding:20px 32px;background:#f8f9fa;border-top:1px solid #e5e7eb;text-align:center;">
    <p style="margin:0;font-size:11px;color:#9ca3af;">Maharaja Institute of Technology, Mysuru</p>
    <p style="margin:4px 0 0;font-size:11px;color:#9ca3af;">This is an automated email from MITM PlacePro. Please do not reply.</p>
  </td></tr>
</table>
</td></tr></table>
</body></html>`;
  }

  private getFrom(): string {
    const smtpUser = this.configService.get<string>('SMTP_USER', '');
    const fromEmail = this.configService.get<string>('SMTP_FROM', smtpUser);
    return `"${this.fromName}" <${fromEmail}>`;
  }

  // ═══════════════════════════════════════════════════
  // 1. Company Welcome / Credentials Email
  // ═══════════════════════════════════════════════════
  async sendCompanyCredentials(credentials: CompanyCredentials): Promise<boolean> {
    if (!this.transporter) return false;

    const body = `
      <p style="font-size:18px;font-weight:600;color:#1a1a2e;margin:0 0 16px;">Welcome, ${credentials.hrName || credentials.companyName}!</p>
      <p style="font-size:14px;color:#4a4a68;line-height:1.7;margin:0 0 24px;">
        Your company <strong>${credentials.companyName}</strong> has been registered on the MITM PlacePro portal for campus recruitment.
        Below are your login credentials to access the company dashboard.
      </p>

      <div style="background:#f8f9ff;border:1px solid #e0e3ff;border-radius:12px;padding:24px;margin:0 0 24px;">
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td style="padding:10px 0;font-size:12px;color:#6b7280;text-transform:uppercase;font-weight:600;letter-spacing:0.5px;width:140px;">Email / Login ID</td>
            <td style="padding:10px 0;font-size:15px;font-weight:600;color:#1a1a2e;font-family:'Courier New',monospace;">${credentials.email}</td>
          </tr>
          <tr style="border-top:1px solid #e8e8f0;">
            <td style="padding:10px 0;font-size:12px;color:#6b7280;text-transform:uppercase;font-weight:600;">Password</td>
            <td style="padding:10px 0;">
              <span style="font-size:15px;font-weight:700;color:#1a1a2e;font-family:'Courier New',monospace;background:#fef3c7;padding:6px 14px;border-radius:8px;display:inline-block;">${credentials.temporaryPassword}</span>
            </td>
          </tr>
        </table>
      </div>

      <div style="background:#fef3c7;border:1px solid #f59e0b;border-radius:8px;padding:14px 18px;font-size:13px;color:#92400e;margin:0 0 24px;">
        ⚠️ <strong>Important:</strong> You will be asked to change your password upon first login. Please keep your credentials secure.
      </div>

      <div style="text-align:center;margin:24px 0;">
        <a href="${credentials.loginUrl}" style="display:inline-block;background:linear-gradient(135deg,#6366f1,#8b5cf6);color:#fff;text-decoration:none;padding:14px 32px;border-radius:10px;font-weight:600;font-size:14px;">Login to Dashboard →</a>
      </div>

      <p style="font-size:14px;color:#4a4a68;line-height:1.7;margin:0 0 8px;">After logging in, you can:</p>
      <ul style="font-size:14px;color:#4a4a68;line-height:2;margin:0;padding-left:20px;">
        <li>Post job listings and internship opportunities</li>
        <li>Review and shortlist student applications</li>
        <li>Schedule interview slots and manage rounds</li>
        <li>Track placement progress in real-time</li>
      </ul>
    `;

    try {
      await this.transporter.sendMail({
        from: this.getFrom(),
        to: credentials.email,
        subject: `🎓 Welcome to MITM PlacePro — Your Company Login Credentials`,
        html: this.wrapHtml('Welcome to MITM PlacePro', 'linear-gradient(135deg,#6366f1,#8b5cf6)', body),
      });
      this.logger.log(`✅ Company credentials email sent to ${credentials.email}`);
      return true;
    } catch (error) {
      this.logger.error(`❌ Failed to send company email to ${credentials.email}`, error);
      return false;
    }
  }

  // ═══════════════════════════════════════════════════
  // 2. OTP / Password Reset Email
  // ═══════════════════════════════════════════════════
  async sendOtpEmail(email: string, otp: string): Promise<boolean> {
    if (!this.transporter) {
      this.logger.warn('SMTP not configured. OTP email skipped. OTP for debug: ' + otp);
      return false;
    }

    const otpDigits = otp.split('').map(d => `
      <span style="display:inline-block;width:44px;height:52px;line-height:52px;text-align:center;
        font-size:24px;font-weight:700;color:#1a1a2e;background:#f0f0ff;border:2px solid #e0e3ff;
        border-radius:10px;margin:0 3px;font-family:'Courier New',monospace;">${d}</span>
    `).join('');

    const body = `
      <p style="font-size:16px;font-weight:600;color:#1a1a2e;margin:0 0 8px;">Hello,</p>
      <p style="font-size:14px;color:#4a4a68;line-height:1.7;margin:0 0 24px;">
        We received a request to reset the password for <strong>${email}</strong>.
        Use the OTP below to complete the process.
      </p>
      <div style="text-align:center;padding:24px 0;">
        ${otpDigits}
      </div>
      <div style="background:#fef3c7;border:1px solid #f59e0b;border-radius:8px;padding:14px 18px;font-size:13px;color:#92400e;margin:20px 0;">
        ⏱ This OTP expires in <strong>10 minutes</strong>. Do not share it with anyone.
      </div>
      <p style="font-size:13px;color:#9ca3af;line-height:1.6;margin:0;">
        If you didn't request this, you can safely ignore this email. Your password will not be changed.
      </p>
    `;

    try {
      await this.transporter.sendMail({
        from: this.getFrom(),
        to: email,
        subject: '🔐 Your Password Reset OTP — MITM PlacePro',
        html: this.wrapHtml('Password Reset', 'linear-gradient(135deg,#6366f1,#8b5cf6)', body),
      });
      this.logger.log(`✅ OTP email sent to ${email}`);
      return true;
    } catch (error) {
      this.logger.error(`❌ Failed to send OTP email to ${email}`, error);
      return false;
    }
  }

  // ═══════════════════════════════════════════════════
  // 3. Round Selected / Placed Email
  // ═══════════════════════════════════════════════════
  async sendRoundSelectedEmail(data: {
    email: string; studentName: string; jobTitle: string;
    companyName: string; roundNumber: number; totalRounds: number; loginUrl: string;
  }): Promise<boolean> {
    if (!this.transporter) return false;
    const isFinal = data.roundNumber >= data.totalRounds;

    const body = `
      <p style="font-size:18px;font-weight:600;color:#1a1a2e;margin:0 0 16px;">Hi ${data.studentName},</p>
      <p style="font-size:14px;color:#4a4a68;line-height:1.7;margin:0 0 24px;">
        ${isFinal
          ? `We are thrilled to inform you that you have been <strong>selected</strong> for the <strong>${data.jobTitle}</strong> role at <strong>${data.companyName}</strong>! 🎓`
          : `Great news! You have <strong>cleared Round ${data.roundNumber}</strong> for the <strong>${data.jobTitle}</strong> position at <strong>${data.companyName}</strong>.`
        }
      </p>
      <div style="background:#ecfdf5;border:1px solid #a7f3d0;border-radius:12px;padding:20px;margin:0 0 24px;text-align:center;">
        <p style="font-size:16px;color:#065f46;font-weight:700;margin:0 0 4px;">
          ${isFinal ? '🏆 PLACEMENT CONFIRMED' : `✅ ROUND ${data.roundNumber} OF ${data.totalRounds} — CLEARED`}
        </p>
        <p style="font-size:13px;color:#047857;margin:0;">
          ${isFinal ? 'Your placement details will be shared soon.' : `Please prepare for Round ${data.roundNumber + 1}. Check your dashboard for details.`}
        </p>
      </div>
      <div style="text-align:center;margin:24px 0;">
        <a href="${data.loginUrl}" style="display:inline-block;background:linear-gradient(135deg,#059669,#10b981);color:#fff;text-decoration:none;padding:14px 32px;border-radius:10px;font-weight:600;font-size:14px;">View Dashboard →</a>
      </div>
    `;

    const headerBg = isFinal
      ? 'linear-gradient(135deg,#059669,#10b981)'
      : 'linear-gradient(135deg,#2563eb,#3b82f6)';
    const title = isFinal ? 'Congratulations! You\'re Placed!' : `Round ${data.roundNumber} — Selected!`;

    try {
      await this.transporter.sendMail({
        from: this.getFrom(),
        to: data.email,
        subject: isFinal
          ? `🎉 Congratulations! You're placed at ${data.companyName} — MITM PlacePro`
          : `✅ Round ${data.roundNumber} Cleared — ${data.jobTitle} at ${data.companyName}`,
        html: this.wrapHtml(title, headerBg, body),
      });
      this.logger.log(`✅ Round-selected email sent to ${data.email}`);
      return true;
    } catch (error) {
      this.logger.error(`❌ Failed to send round-selected email to ${data.email}`, error);
      return false;
    }
  }

  // ═══════════════════════════════════════════════════
  // 4. Round Rejected Email
  // ═══════════════════════════════════════════════════
  async sendRoundRejectedEmail(data: {
    email: string; studentName: string; jobTitle: string;
    companyName: string; roundNumber: number; loginUrl: string;
  }): Promise<boolean> {
    if (!this.transporter) return false;

    const body = `
      <p style="font-size:18px;font-weight:600;color:#1a1a2e;margin:0 0 16px;">Hi ${data.studentName},</p>
      <p style="font-size:14px;color:#4a4a68;line-height:1.7;margin:0 0 24px;">
        Thank you for participating in Round ${data.roundNumber} for the <strong>${data.jobTitle}</strong> position at <strong>${data.companyName}</strong>.
        After careful evaluation, we regret to inform you that you have not been selected to advance to the next round.
      </p>
      <div style="background:#fef3c7;border:1px solid #f59e0b;border-radius:12px;padding:20px;margin:0 0 24px;">
        <p style="font-size:13px;color:#92400e;margin:0;">
          💪 Don't be discouraged! Keep working on your skills and stay active on the portal for more opportunities. Every experience is a step forward.
        </p>
      </div>
      <div style="text-align:center;margin:24px 0;">
        <a href="${data.loginUrl}" style="display:inline-block;background:linear-gradient(135deg,#6366f1,#8b5cf6);color:#fff;text-decoration:none;padding:14px 32px;border-radius:10px;font-weight:600;font-size:14px;">Explore More Opportunities →</a>
      </div>
    `;

    try {
      await this.transporter.sendMail({
        from: this.getFrom(),
        to: data.email,
        subject: `Round ${data.roundNumber} Result — ${data.jobTitle} at ${data.companyName}`,
        html: this.wrapHtml(`Round ${data.roundNumber} Update`, 'linear-gradient(135deg,#6366f1,#8b5cf6)', body),
      });
      this.logger.log(`✅ Round-rejected email sent to ${data.email}`);
      return true;
    } catch (error) {
      this.logger.error(`❌ Failed to send round-rejected email to ${data.email}`, error);
      return false;
    }
  }

  // ═══════════════════════════════════════════════════
  // 5. Drive Announcement Email
  // ═══════════════════════════════════════════════════
  async sendDriveAnnouncementEmail(data: {
    emails: string[]; driveName: string; companyName: string;
    driveDate?: string; description?: string; eligibleDepartments?: string[];
  }): Promise<number> {
    if (!this.transporter || data.emails.length === 0) return 0;
    const loginUrl = this.configService.get<string>('FRONTEND_URL', 'https://mitm-placepro.vercel.app');

    const body = `
      <p style="font-size:16px;font-weight:600;color:#1a1a2e;margin:0 0 16px;">Hello Students,</p>
      <p style="font-size:14px;color:#4a4a68;line-height:1.7;margin:0 0 24px;">
        A new placement drive has been announced! Here are the details:
      </p>

      <div style="background:#ecfdf5;border:1px solid #a7f3d0;border-radius:12px;padding:24px;margin:0 0 24px;">
        <p style="margin:0 0 4px;font-size:11px;color:#065f46;text-transform:uppercase;letter-spacing:1px;font-weight:600;">Company</p>
        <p style="margin:0 0 16px;font-size:20px;font-weight:700;color:#1a1a2e;">${data.companyName}</p>

        <p style="margin:0 0 4px;font-size:11px;color:#065f46;text-transform:uppercase;letter-spacing:1px;font-weight:600;">Drive Name</p>
        <p style="margin:0 0 16px;font-size:16px;font-weight:600;color:#4f46e5;">${data.driveName}</p>

        ${data.driveDate ? `
          <p style="margin:0 0 4px;font-size:11px;color:#065f46;text-transform:uppercase;letter-spacing:1px;font-weight:600;">Date</p>
          <p style="margin:0 0 16px;font-size:14px;color:#1a1a2e;">📅 ${data.driveDate}</p>
        ` : ''}

        ${data.eligibleDepartments?.length ? `
          <p style="margin:0 0 4px;font-size:11px;color:#065f46;text-transform:uppercase;letter-spacing:1px;font-weight:600;">Eligible Departments</p>
          <p style="margin:0;font-size:14px;color:#1a1a2e;">${data.eligibleDepartments.join(', ')}</p>
        ` : ''}
      </div>

      ${data.description ? `
        <p style="font-size:14px;color:#4a4a68;line-height:1.7;margin:0 0 24px;background:#f9fafb;padding:14px 18px;border-radius:8px;border-left:4px solid #4f46e5;">
          ${data.description}
        </p>
      ` : ''}

      <div style="text-align:center;margin:24px 0;">
        <a href="${loginUrl}/student/drives" style="display:inline-block;background:linear-gradient(135deg,#059669,#10b981);color:#fff;text-decoration:none;padding:14px 32px;border-radius:10px;font-weight:600;font-size:14px;">
          View Drive Details →
        </a>
      </div>

      <p style="font-size:13px;color:#9ca3af;text-align:center;margin:0;">Check eligibility and register on your dashboard.</p>
    `;

    const htmlContent = this.wrapHtml('New Placement Drive', 'linear-gradient(135deg,#059669,#10b981)', body);

    // Send in batches of 50 (BCC for privacy)
    let sentCount = 0;
    const batchSize = 50;
    for (let i = 0; i < data.emails.length; i += batchSize) {
      const batch = data.emails.slice(i, i + batchSize);
      try {
        await this.transporter.sendMail({
          from: this.getFrom(),
          bcc: batch,
          subject: `🚀 New Drive: ${data.companyName} — ${data.driveName}`,
          html: htmlContent,
        });
        sentCount += batch.length;
        this.logger.log(`📧 Drive announcement batch sent: ${batch.length} emails`);
      } catch (error) {
        this.logger.error(`❌ Failed to send drive announcement batch`, error);
      }
    }
    return sentCount;
  }
}
