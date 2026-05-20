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

  constructor(private readonly configService: ConfigService) {
    this.initTransporter();
  }

  private async initTransporter() {
    const smtpHost = this.configService.get<string>(
      'SMTP_HOST',
      'smtp.gmail.com',
    );
    const smtpPort = this.configService.get<number>('SMTP_PORT', 587);
    if (!this.transporter) return false;

    const fromEmail = this.configService.get<string>(
      'SMTP_FROM',
      'test@mitm.edu',
    );
    const fromName = this.configService.get<string>(
      'SMTP_FROM_NAME',
      'MITM PlacePro',
    );

    const otpDigits = otp
      .split('')
      .map(
        (d) => `
      <span style="display:inline-block;width:44px;height:52px;line-height:52px;text-align:center;
        font-size:24px;font-weight:700;color:#1a1a2e;background:#f0f0ff;border:2px solid #e0e3ff;
        border-radius:10px;margin:0 3px;font-family:'Courier New',monospace;">${d}</span>
    `,
      )
      .join('');

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head><meta charset="utf-8"></head>
      <body style="font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;margin:0;padding:0;background:#f4f4f7;">
        <div style="max-width:520px;margin:40px auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
          <div style="background:linear-gradient(135deg,#6366f1,#8b5cf6);padding:32px;text-align:center;">
            <h1 style="color:#fff;margin:0;font-size:22px;font-weight:700;">🔐 Password Reset</h1>
            <p style="color:rgba(255,255,255,0.85);margin:8px 0 0;font-size:14px;">MITM PlacePro</p>
          </div>
          <div style="padding:32px;">
            <p style="font-size:16px;font-weight:600;color:#1a1a2e;margin-bottom:8px;">Hello,</p>
            <p style="font-size:14px;color:#4a4a68;line-height:1.7;margin-bottom:24px;">
              We received a request to reset the password for <strong>${email}</strong>.
              Use the OTP below to complete the process.
            </p>
            <div style="text-align:center;padding:24px 0;">
              ${otpDigits}
            </div>
            <div style="background:#fef3c7;border:1px solid #f59e0b;border-radius:8px;padding:14px 18px;font-size:13px;color:#92400e;margin:20px 0;">
              ⏱ This OTP expires in <strong>10 minutes</strong>. Do not share it with anyone.
            </div>
            <p style="font-size:13px;color:#9ca3af;line-height:1.6;">
              If you didn't request this, you can safely ignore this email. Your password will not be changed.
            </p>
          </div>
          <div style="background:#f8f9fa;padding:20px 32px;text-align:center;font-size:12px;color:#9ca3af;">
            <p>This is an automated email from MITM PlacePro.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    try {
      await this.transporter.sendMail({
        from: `"${fromName}" <${fromEmail}>`,
        to: email,
        subject: '🔐 Your Password Reset OTP - MITM PlacePro',
        html: htmlContent,
      });
      this.logger.log(`OTP email sent to ${email}`);
      return true;
    } catch (error) {
      this.logger.error(`Failed to send OTP email to ${email}`, error);
      return false;
    }
  }

  // ─── Round Result Emails ────────────────────────
  async sendRoundSelectedEmail(data: {
    email: string;
    studentName: string;
    jobTitle: string;
    companyName: string;
    roundNumber: number;
    totalRounds: number;
    loginUrl: string;
  }): Promise<boolean> {
    if (!this.transporter) return false;
    const fromEmail = this.configService.get<string>(
      'SMTP_FROM',
      'test@mitm.edu',
    );
    const fromName = this.configService.get<string>(
      'SMTP_FROM_NAME',
      'MITM PlacePro',
    );
    const isFinal = data.roundNumber >= data.totalRounds;

    const htmlContent = `
      <!DOCTYPE html><html><head><meta charset="utf-8"></head>
      <body style="font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;margin:0;padding:0;background:#f4f4f7;">
        <div style="max-width:600px;margin:40px auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
          <div style="background:linear-gradient(135deg,#059669,#10b981);padding:32px;text-align:center;">
            <h1 style="color:#fff;margin:0;font-size:24px;">🎉 ${isFinal ? "Congratulations! You're Placed!" : `Round ${data.roundNumber} — Selected!`}</h1>
            <p style="color:rgba(255,255,255,0.85);margin:8px 0 0;font-size:14px;">MITM PlacePro</p>
          </div>
          <div style="padding:32px;">
            <p style="font-size:18px;font-weight:600;color:#1a1a2e;margin-bottom:16px;">Hi ${data.studentName},</p>
            <p style="font-size:14px;color:#4a4a68;line-height:1.7;margin-bottom:24px;">
              ${
                isFinal
                  ? `We are thrilled to inform you that you have been <strong>selected</strong> for the <strong>${data.jobTitle}</strong> role at <strong>${data.companyName}</strong>! 🎓`
                  : `Great news! You have <strong>cleared Round ${data.roundNumber}</strong> for the <strong>${data.jobTitle}</strong> position at <strong>${data.companyName}</strong>.`
              }
            </p>
            <div style="background:#ecfdf5;border:1px solid #a7f3d0;border-radius:12px;padding:20px;margin-bottom:24px;text-align:center;">
              <p style="font-size:13px;color:#065f46;font-weight:600;margin:0 0 4px;">
                ${isFinal ? '✅ PLACEMENT CONFIRMED' : `✅ ROUND ${data.roundNumber} OF ${data.totalRounds} — CLEARED`}
              </p>
              <p style="font-size:12px;color:#047857;margin:0;">
                ${isFinal ? 'Your placement details will be shared soon.' : `Please prepare for Round ${data.roundNumber + 1}. Check your dashboard for details.`}
              </p>
            </div>
            <div style="text-align:center;margin:24px 0;">
              <a href="${data.loginUrl}" style="display:inline-block;background:linear-gradient(135deg,#059669,#10b981);color:#fff;text-decoration:none;padding:14px 32px;border-radius:10px;font-weight:600;font-size:14px;">View Dashboard →</a>
            </div>
          </div>
          <div style="background:#f8f9fa;padding:20px 32px;text-align:center;font-size:12px;color:#9ca3af;">
            <p>This is an automated email from MITM PlacePro.</p>
          </div>
        </div>
      </body></html>
    `;

    try {
      await this.transporter.sendMail({
        from: `"${fromName}" <${fromEmail}>`,
        to: data.email,
        subject: isFinal
          ? `🎉 Congratulations! You're placed at ${data.companyName} — MITM PlacePro`
          : `✅ Round ${data.roundNumber} Cleared — ${data.jobTitle} at ${data.companyName}`,
        html: htmlContent,
      });
      return true;
    } catch (error) {
      this.logger.error(
        `Failed to send round-selected email to ${data.email}`,
        error,
      );
      return false;
    }
  }

  async sendRoundRejectedEmail(data: {
    email: string;
    studentName: string;
    jobTitle: string;
    companyName: string;
    roundNumber: number;
    loginUrl: string;
  }): Promise<boolean> {
    if (!this.transporter) return false;
    const fromEmail = this.configService.get<string>(
      'SMTP_FROM',
      'test@mitm.edu',
    );
    const fromName = this.configService.get<string>(
      'SMTP_FROM_NAME',
      'MITM PlacePro',
    );

    const htmlContent = `
      <!DOCTYPE html><html><head><meta charset="utf-8"></head>
      <body style="font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;margin:0;padding:0;background:#f4f4f7;">
        <div style="max-width:600px;margin:40px auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
          <div style="background:linear-gradient(135deg,#6366f1,#8b5cf6);padding:32px;text-align:center;">
            <h1 style="color:#fff;margin:0;font-size:24px;">Round ${data.roundNumber} Update</h1>
            <p style="color:rgba(255,255,255,0.85);margin:8px 0 0;font-size:14px;">MITM PlacePro</p>
          </div>
          <div style="padding:32px;">
            <p style="font-size:18px;font-weight:600;color:#1a1a2e;margin-bottom:16px;">Hi ${data.studentName},</p>
            <p style="font-size:14px;color:#4a4a68;line-height:1.7;margin-bottom:24px;">
              Thank you for participating in Round ${data.roundNumber} for the <strong>${data.jobTitle}</strong> position at <strong>${data.companyName}</strong>.
              After careful evaluation, we regret to inform you that you have not been selected to advance to the next round.
            </p>
            <div style="background:#fef3c7;border:1px solid #f59e0b;border-radius:12px;padding:20px;margin-bottom:24px;">
              <p style="font-size:13px;color:#92400e;margin:0;">
                💪 Don't be discouraged! Keep working on your skills and stay active on the portal for more opportunities. Every experience is a step forward.
              </p>
            </div>
            <div style="text-align:center;margin:24px 0;">
              <a href="${data.loginUrl}" style="display:inline-block;background:linear-gradient(135deg,#6366f1,#8b5cf6);color:#fff;text-decoration:none;padding:14px 32px;border-radius:10px;font-weight:600;font-size:14px;">Explore More Opportunities →</a>
            </div>
          </div>
          <div style="background:#f8f9fa;padding:20px 32px;text-align:center;font-size:12px;color:#9ca3af;">
            <p>This is an automated email from MITM PlacePro.</p>
          </div>
        </div>
      </body></html>
    `;

    try {
      await this.transporter.sendMail({
        from: `"${fromName}" <${fromEmail}>`,
        to: data.email,
        subject: `Round ${data.roundNumber} Result — ${data.jobTitle} at ${data.companyName}`,
        html: htmlContent,
      });
      return true;
    } catch (error) {
      this.logger.error(
        `Failed to send round-rejected email to ${data.email}`,
        error,
      );
      return false;
    }
  }
}
