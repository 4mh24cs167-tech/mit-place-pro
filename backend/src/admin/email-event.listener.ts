import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { EmailService } from './email.service';

// ─── Event Payload Types ──────────────────────────
export interface RoundResultEmailEvent {
  type: 'round_selected' | 'round_rejected';
  email: string;
  studentName: string;
  jobTitle: string;
  companyName: string;
  roundNumber: number;
  totalRounds: number;
  loginUrl: string;
}

export interface MeetingEmailEvent {
  email: string;
  studentName: string;
  jobTitle: string;
  companyName: string;
  roundNumber: number;
  meetingType: string;
  meetingLink: string | null;
  scheduledDate: string | null;
  scheduledTime: string | null;
  instructions: string | null;
  groupName: string | null;
  loginUrl: string;
}

export interface CompanyApprovalEmailEvent {
  email: string;
  companyName: string;
}

// ─── Async Email Event Listener ───────────────────
@Injectable()
export class EmailEventListener {
  private readonly logger = new Logger(EmailEventListener.name);

  constructor(private readonly emailService: EmailService) {}

  @OnEvent('email.round_selected', { async: true })
  async handleRoundSelected(payload: RoundResultEmailEvent) {
    try {
      await this.emailService.sendRoundSelectedEmail(payload);
      this.logger.log(`Round selected email sent to ${payload.email}`);
    } catch (e) {
      this.logger.error(`Failed to send round selected email to ${payload.email}`, (e as Error).stack);
    }
  }

  @OnEvent('email.round_rejected', { async: true })
  async handleRoundRejected(payload: RoundResultEmailEvent) {
    try {
      await this.emailService.sendRoundRejectedEmail(payload);
      this.logger.log(`Round rejected email sent to ${payload.email}`);
    } catch (e) {
      this.logger.error(`Failed to send round rejected email to ${payload.email}`, (e as Error).stack);
    }
  }

  @OnEvent('email.meeting_scheduled', { async: true })
  async handleMeetingScheduled(payload: MeetingEmailEvent) {
    try {
      await this.emailService.sendMeetingScheduledEmail(payload);
      this.logger.log(`Meeting email sent to ${payload.email}`);
    } catch (e) {
      this.logger.error(`Failed to send meeting email to ${payload.email}`, (e as Error).stack);
    }
  }

  @OnEvent('email.company_approved', { async: true })
  async handleCompanyApproved(payload: CompanyApprovalEmailEvent) {
    try {
      await this.emailService.sendCompanyApprovalEmail(payload.email, payload.companyName);
      this.logger.log(`Approval email sent to ${payload.email}`);
    } catch (e) {
      this.logger.error(`Failed to send approval email to ${payload.email}`, (e as Error).stack);
    }
  }
}
