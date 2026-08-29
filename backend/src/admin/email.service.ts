import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as nodemailer from 'nodemailer';
import { EmailLog, EmailType } from '../entities/email-log.entity';

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

  constructor(
    private readonly configService: ConfigService,
    @InjectRepository(EmailLog) private readonly emailLogRepo: Repository<EmailLog>,
  ) {
    const frontendUrl = this.configService.get<string>('FRONTEND_URL', 'https://mitm-placepro.vercel.app');
    this.logoUrl = `${frontendUrl}/mitm-logo.png`;
    this.initTransporter();
  }

  private async logEmail(emailType: EmailType, subject: string, recipients: string[], success: boolean, errorMessage?: string): Promise<void> {
    try {
      await this.emailLogRepo.save({
        emailType,
        subject,
        recipients,
        recipientCount: recipients.length,
        success,
        errorMessage: errorMessage || null,
      });
    } catch (err) {
      this.logger.warn(`Failed to log email: ${(err as Error).message}`);
    }
  }

  private async initTransporter() {
    const smtpHost = this.configService.get<string>('SMTP_HOST', 'smtp-relay.brevo.com');
    const smtpPort = Number(this.configService.get<number>('SMTP_PORT', 587));
    const smtpUser = this.configService.get<string>('SMTP_USER', '');
    const smtpPass = this.configService.get<string>('SMTP_PASS', '');

    if (!smtpUser || !smtpPass) {
      this.logger.warn('⚠️ No SMTP credentials — emails will be logged but NOT sent.');
      return;
    }

    // Always create a standard transporter during startup using the configured host/port
    this.transporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpPort === 465,
      auth: { user: smtpUser, pass: smtpPass },
      connectionTimeout: 10000,
      greetingTimeout: 10000,
      socketTimeout: 20000,
    });

    // Verify in background so it doesn't block startup or destroy the transporter permanently if it fails
    this.transporter.verify()
      .then(() => {
        this.logger.log(`✅ SMTP connection verified and ready via ${smtpHost}:${smtpPort}`);
      })
      .catch((err) => {
        this.logger.warn(`⚠️ SMTP connection verification failed on startup: ${err.message}. Outbound emails will attempt dynamic delivery (including Brevo HTTP API).`);
      });
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

  // ─── Central Dispatcher with Brevo HTTP API Bypass & NodeMailer SMTP fallback ───
  private async sendEmail(options: { to: string | string[]; subject: string; html: string }, emailType: EmailType = 'other'): Promise<boolean> {
    const smtpUser = this.configService.get<string>('SMTP_USER', '');
    const smtpPass = this.configService.get<string>('SMTP_PASS', '');
    const smtpFrom = this.configService.get<string>('SMTP_FROM', smtpUser);

    if (!smtpUser || !smtpPass) {
      this.logger.warn(`⚠️ No SMTP credentials configured. Email logged: [Subject: "${options.subject}"]`);
      const noCredRecipients = Array.isArray(options.to) ? options.to : [options.to];
      await this.logEmail(emailType, options.subject, noCredRecipients, false, 'No SMTP credentials configured');
      return false;
    }

    const recipients = Array.isArray(options.to) ? options.to : [options.to];

    // ─── 1. Attempt Brevo HTTP API First (Immune to Render Free Tier SMTP Outbound Blocks) ───
    if (smtpPass.startsWith('xsmtpsib-') || smtpPass.startsWith('xkeysib-')) {
      try {
        this.logger.log(`🔄 Attempting Brevo HTTP REST API to send to: ${recipients.join(', ')}`);
        
        const response = await fetch('https://api.brevo.com/v3/smtp/email', {
          method: 'POST',
          headers: {
            'api-key': smtpPass,
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
          body: JSON.stringify({
            sender: {
              name: this.fromName,
              email: smtpFrom,
            },
            to: recipients.map(email => ({ email })),
            subject: options.subject,
            htmlContent: options.html,
          }),
        });

        if (response.ok) {
          const resData = await response.json().catch(() => ({}));
          this.logger.log(`✅ Email sent successfully via Brevo HTTP API! Message ID: ${resData.messageId || 'N/A'}`);
          await this.logEmail(emailType, options.subject, recipients, true);
          return true;
        } else {
          const errText = await response.text();
          this.logger.warn(`⚠️ Brevo HTTP API status ${response.status}: ${errText}. Falling back to Nodemailer SMTP...`);
        }
      } catch (httpErr) {
        this.logger.warn(`⚠️ Brevo HTTP API failed: ${(httpErr as Error).message}. Falling back to Nodemailer SMTP...`);
      }
    }

    // ─── 2. Fallback to standard Nodemailer SMTP ───
    if (!this.transporter) {
      // Recreate transporter in case it was missing
      this.transporter = nodemailer.createTransport({
        host: this.configService.get<string>('SMTP_HOST', 'smtp-relay.brevo.com'),
        port: Number(this.configService.get<number>('SMTP_PORT', 587)),
        secure: Number(this.configService.get<number>('SMTP_PORT', 587)) === 465,
        auth: { user: smtpUser, pass: smtpPass },
        connectionTimeout: 8000,
      });
    }

    try {
      this.logger.log(`🔄 Attempting SMTP fallback to send to: ${recipients.join(', ')}`);
      
      const mailOptions: nodemailer.SendMailOptions = {
        from: this.getFrom(),
        subject: options.subject,
        html: options.html,
      };

      if (Array.isArray(options.to)) {
        mailOptions.bcc = options.to;
      } else {
        mailOptions.to = options.to;
      }

      await this.transporter.sendMail(mailOptions);
      this.logger.log(`✅ Email sent successfully via SMTP fallback!`);
      await this.logEmail(emailType, options.subject, recipients, true);
      return true;
    } catch (smtpErr) {
      this.logger.error(`❌ SMTP fallback failed completely: ${(smtpErr as Error).message}`);
      await this.logEmail(emailType, options.subject, recipients, false, (smtpErr as Error).message);
      return false;
    }
  }

  // ═══════════════════════════════════════════════════
  // 1. Company Welcome / Credentials Email
  // ═══════════════════════════════════════════════════
  async sendCompanyCredentials(credentials: CompanyCredentials): Promise<boolean> {
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

    return this.sendEmail({
      to: credentials.email,
      subject: `🎓 Welcome to MITM PlacePro — Your Company Login Credentials`,
      html: this.wrapHtml('Welcome to MITM PlacePro', 'linear-gradient(135deg,#6366f1,#8b5cf6)', body),
    }, 'company_credentials');
  }

  // ═══════════════════════════════════════════════════
  // 2. OTP / Password Reset Email
  // ═══════════════════════════════════════════════════
  async sendOtpEmail(email: string, otp: string): Promise<boolean> {
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

    return this.sendEmail({
      to: email,
      subject: '🔐 Your Password Reset OTP — MITM PlacePro',
      html: this.wrapHtml('Password Reset', 'linear-gradient(135deg,#6366f1,#8b5cf6)', body),
    }, 'otp_reset');
  }

  // ═══════════════════════════════════════════════════
  // 3. Round Selected / Placed Email
  // ═══════════════════════════════════════════════════
  async sendRoundSelectedEmail(data: {
    email: string; studentName: string; jobTitle: string;
    companyName: string; roundNumber: number; totalRounds: number; loginUrl: string;
  }): Promise<boolean> {
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

    return this.sendEmail({
      to: data.email,
      subject: isFinal
        ? `🎉 Congratulations! You're placed at ${data.companyName} — MITM PlacePro`
        : `✅ Round ${data.roundNumber} Cleared — ${data.jobTitle} at ${data.companyName}`,
      html: this.wrapHtml(title, headerBg, body),
    }, 'round_selected');
  }

  // ═══════════════════════════════════════════════════
  // 4. Round Rejected Email
  // ═══════════════════════════════════════════════════
  async sendRoundRejectedEmail(data: {
    email: string; studentName: string; jobTitle: string;
    companyName: string; roundNumber: number; loginUrl: string;
  }): Promise<boolean> {
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

    return this.sendEmail({
      to: data.email,
      subject: `Round ${data.roundNumber} Result — ${data.jobTitle} at ${data.companyName}`,
      html: this.wrapHtml(`Round ${data.roundNumber} Update`, 'linear-gradient(135deg,#6366f1,#8b5cf6)', body),
    }, 'round_rejected');
  }

  // ═══════════════════════════════════════════════════
  // 5. Drive Announcement Email
  // ═══════════════════════════════════════════════════
  async sendDriveAnnouncementEmail(data: {
    emails: string[]; driveName: string; companyName: string;
    driveDate?: string; description?: string; eligibleDepartments?: string[];
  }): Promise<number> {
    if (data.emails.length === 0) return 0;
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
      const success = await this.sendEmail({
        to: batch,
        subject: `🚀 New Drive: ${data.companyName} — ${data.driveName}`,
        html: htmlContent,
      }, 'drive_announcement');
      if (success) {
        sentCount += batch.length;
      }
    }
    return sentCount;
  }

  // ═══════════════════════════════════════════════════
  // 7. Meeting Scheduled Email
  // ═══════════════════════════════════════════════════
  async sendMeetingScheduledEmail(data: {
    email: string; studentName: string; jobTitle: string;
    companyName: string; roundNumber: number; meetingType: string;
    meetingLink: string | null; scheduledDate: string | null;
    scheduledTime: string | null; instructions: string | null;
    groupName: string | null; loginUrl: string;
  }): Promise<boolean> {
    const typeLabels: Record<string, string> = {
      virtual: '📹 Virtual Meeting',
      group_discussion: '👥 Group Discussion',
      one_on_one: '🎯 One-on-One Interview',
    };
    const typeLabel = typeLabels[data.meetingType] || 'Meeting';

    const body = `
      <p style="font-size:18px;font-weight:600;color:#1a1a2e;margin:0 0 16px;">Hi ${data.studentName},</p>
      <p style="font-size:14px;color:#4a4a68;line-height:1.7;margin:0 0 24px;">
        A <strong>${typeLabel}</strong> has been scheduled for <strong>${data.jobTitle}</strong> at <strong>${data.companyName}</strong> — Round ${data.roundNumber}.
      </p>

      <div style="background:#f0f4ff;border:1px solid #c7d2fe;border-radius:12px;padding:20px;margin:0 0 24px;">
        <p style="margin:0 0 4px;font-size:11px;color:#4338ca;text-transform:uppercase;letter-spacing:1px;font-weight:600;">Meeting Type</p>
        <p style="margin:0 0 16px;font-size:16px;font-weight:700;color:#1a1a2e;">${typeLabel}</p>

        ${data.groupName ? `
          <p style="margin:0 0 4px;font-size:11px;color:#4338ca;text-transform:uppercase;letter-spacing:1px;font-weight:600;">Your Group</p>
          <p style="margin:0 0 16px;font-size:14px;font-weight:600;color:#1a1a2e;">👥 ${data.groupName}</p>
        ` : ''}

        ${data.scheduledDate ? `
          <p style="margin:0 0 4px;font-size:11px;color:#4338ca;text-transform:uppercase;letter-spacing:1px;font-weight:600;">Date & Time</p>
          <p style="margin:0 0 16px;font-size:14px;color:#1a1a2e;">📅 ${data.scheduledDate}${data.scheduledTime ? ' at ' + data.scheduledTime : ''}</p>
        ` : ''}

        ${data.meetingLink ? `
          <p style="margin:0 0 4px;font-size:11px;color:#4338ca;text-transform:uppercase;letter-spacing:1px;font-weight:600;">Meeting Link</p>
          <p style="margin:0 0 16px;"><a href="${data.meetingLink}" style="font-size:14px;color:#4f46e5;font-weight:600;text-decoration:underline;">🔗 Join Meeting</a></p>
        ` : ''}
      </div>

      ${data.instructions ? `
        <div style="background:#fefce8;border:1px solid #fde68a;border-radius:8px;padding:14px 18px;margin:0 0 24px;">
          <p style="margin:0 0 4px;font-size:11px;color:#92400e;text-transform:uppercase;letter-spacing:1px;font-weight:600;">Instructions</p>
          <p style="margin:0;font-size:13px;color:#78350f;line-height:1.6;">${data.instructions}</p>
        </div>
      ` : ''}

      <div style="text-align:center;margin:24px 0;">
        <a href="${data.loginUrl}" style="display:inline-block;background:linear-gradient(135deg,#6366f1,#8b5cf6);color:#fff;text-decoration:none;padding:14px 32px;border-radius:10px;font-weight:600;font-size:14px;">View Dashboard →</a>
      </div>
    `;

    return this.sendEmail({
      to: data.email,
      subject: `${typeLabel} Scheduled — ${data.jobTitle} at ${data.companyName} (Round ${data.roundNumber})`,
      html: this.wrapHtml(`${typeLabel} — Round ${data.roundNumber}`, 'linear-gradient(135deg,#6366f1,#8b5cf6)', body),
    });
  }

  // ═══════════════════════════════════════════════════
  // 6. SMTP Diagnostics & Connections Verification
  // ═══════════════════════════════════════════════════
  async getSmtpStatus() {
    const smtpHost = this.configService.get<string>('SMTP_HOST', 'smtp-relay.brevo.com');
    const smtpPort = this.configService.get<number>('SMTP_PORT', 587);
    const smtpUser = this.configService.get<string>('SMTP_USER', '');
    const smtpPass = this.configService.get<string>('SMTP_PASS', '');
    const smtpFrom = this.configService.get<string>('SMTP_FROM', '');

    const details = {
      smtpHost,
      smtpPort: Number(smtpPort),
      smtpUser: smtpUser ? `${smtpUser.substring(0, 3)}...${smtpUser.split('@')[1] || ''}` : '(not configured)',
      smtpFrom,
      hasSmtpPass: !!smtpPass,
      isTransporterInitialized: !!this.transporter,
    };

    const portsToTest = [587, 465, 2525];
    const testResults: Array<{ port: number; secure: boolean; success: boolean; error: string | null }> = [];

    if (smtpUser && smtpPass) {
      for (const port of portsToTest) {
        try {
          const testTransporter = nodemailer.createTransport({
            host: smtpHost,
            port,
            secure: port === 465,
            auth: { user: smtpUser, pass: smtpPass },
            connectionTimeout: 4000,
            greetingTimeout: 4000,
            socketTimeout: 5000,
          });
          await testTransporter.verify();
          testResults.push({ port, secure: port === 465, success: true, error: null });
        } catch (err) {
          testResults.push({ port, secure: port === 465, success: false, error: (err as Error).message });
        }
      }
    }

    return {
      ...details,
      testResults,
    };
  }

  async sendDirectTestEmail(toEmail: string): Promise<{ success: boolean; message: string; error?: string }> {
    const success = await this.sendEmail({
      to: toEmail,
      subject: '🎓 MITM PlacePro SMTP Connection Test',
      html: this.wrapHtml(
        'SMTP Diagnostic Test',
        'linear-gradient(135deg,#3b82f6,#1d4ed8)',
        `<p style="font-size:16px;color:#1a1a2e;">Hello!</p>
         <p style="font-size:14px;color:#4a4a68;line-height:1.7;">
           This is a direct connection validation email triggered from the MITM PlacePro admin controls.
           If you are reading this, your outbound connection is fully active!
         </p>
         <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:12px 16px;margin:20px 0;font-size:13px;color:#166534;">
           ✅ SMTP / Brevo REST API communication completed successfully!
         </div>`
      ),
    });

    if (success) {
      return { success: true, message: `Email delivered successfully!` };
    } else {
      return { success: false, message: 'Failed to deliver email. Check backend logs.' };
    }
  }
}
