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
    const smtpHost = this.configService.get<string>('SMTP_HOST', 'smtp.gmail.com');
    const smtpPort = this.configService.get<number>('SMTP_PORT', 587);
    const smtpUser = this.configService.get<string>('SMTP_USER', '');
    const smtpPass = this.configService.get<string>('SMTP_PASS', '');

    this.transporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpPort === 465,
      auth: smtpUser
        ? { user: smtpUser, pass: smtpPass }
        : undefined,
    });
  }

  async sendCompanyCredentials(credentials: CompanyCredentials): Promise<boolean> {
    const fromEmail = this.configService.get<string>('SMTP_FROM', 'noreply@mitm-placepro.com');
    const fromName = this.configService.get<string>('SMTP_FROM_NAME', 'MITM PlacePro');

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 0; background-color: #f4f4f7; }
          .container { max-width: 600px; margin: 40px auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.08); }
          .header { background: linear-gradient(135deg, #6366f1, #8b5cf6); padding: 32px; text-align: center; }
          .header h1 { color: #ffffff; margin: 0; font-size: 24px; font-weight: 700; }
          .header p { color: rgba(255,255,255,0.85); margin: 8px 0 0; font-size: 14px; }
          .body { padding: 32px; }
          .greeting { font-size: 18px; font-weight: 600; color: #1a1a2e; margin-bottom: 16px; }
          .message { font-size: 14px; color: #4a4a68; line-height: 1.7; margin-bottom: 24px; }
          .credentials-box { background: #f8f9ff; border: 1px solid #e0e3ff; border-radius: 12px; padding: 24px; margin-bottom: 24px; }
          .cred-row { display: flex; justify-content: space-between; align-items: center; padding: 10px 0; border-bottom: 1px solid #e8e8f0; }
          .cred-row:last-child { border-bottom: none; }
          .cred-label { font-size: 12px; color: #6b7280; text-transform: uppercase; font-weight: 600; letter-spacing: 0.5px; }
          .cred-value { font-size: 15px; font-weight: 600; color: #1a1a2e; font-family: 'Courier New', monospace; }
          .btn { display: inline-block; background: linear-gradient(135deg, #6366f1, #8b5cf6); color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 10px; font-weight: 600; font-size: 14px; text-align: center; }
          .btn-container { text-align: center; margin: 24px 0; }
          .warning { background: #fef3c7; border: 1px solid #f59e0b; border-radius: 8px; padding: 14px 18px; font-size: 13px; color: #92400e; margin-bottom: 24px; }
          .footer { background: #f8f9fa; padding: 24px 32px; text-align: center; font-size: 12px; color: #9ca3af; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎓 MITM PlacePro</h1>
            <p>Campus Placement Management Portal</p>
          </div>
          <div class="body">
            <p class="greeting">Welcome, ${credentials.hrName || credentials.companyName}!</p>
            <p class="message">
              Your company <strong>${credentials.companyName}</strong> has been registered on the MITM PlacePro portal for campus recruitment.
              Below are your login credentials to access the company dashboard.
            </p>
            
            <div class="credentials-box">
              <div class="cred-row">
                <span class="cred-label">Email / Login ID</span>
                <span class="cred-value">${credentials.email}</span>
              </div>
              <div class="cred-row">
                <span class="cred-label">Temporary Password</span>
                <span class="cred-value">${credentials.temporaryPassword}</span>
              </div>
            </div>

            <div class="warning">
              ⚠️ <strong>Important:</strong> You will be asked to change your password upon first login. Please keep your credentials secure.
            </div>

            <div class="btn-container">
              <a href="${credentials.loginUrl}" class="btn">Login to Dashboard →</a>
            </div>

            <p class="message">
              After logging in, you can:
            </p>
            <ul style="font-size: 14px; color: #4a4a68; line-height: 2;">
              <li>Post job listings and internship opportunities</li>
              <li>Review and shortlist student applications</li>
              <li>Schedule interview slots and manage rounds</li>
              <li>Track placement progress in real-time</li>
            </ul>
          </div>
          <div class="footer">
            <p>This is an automated email from MITM PlacePro.</p>
            <p>If you did not expect this email, please contact the placement cell.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    try {
      await this.transporter.sendMail({
        from: `"${fromName}" <${fromEmail}>`,
        to: credentials.email,
        subject: `🎓 Welcome to MITM PlacePro - Your Company Login Credentials`,
        html: htmlContent,
      });
      this.logger.log(`Credentials email sent to ${credentials.email}`);
      return true;
    } catch (error) {
      this.logger.error(`Failed to send email to ${credentials.email}`, error);
      return false;
    }
  }
}
