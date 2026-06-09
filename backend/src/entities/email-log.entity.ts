import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index } from 'typeorm';

export type EmailType = 'company_credentials' | 'otp_reset' | 'round_selected' | 'round_rejected' | 'drive_announcement' | 'other';

@Entity('email_logs')
@Index('idx_email_logs_type', ['emailType'])
@Index('idx_email_logs_created_at', ['createdAt'])
export class EmailLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 50, name: 'email_type' })
  emailType: EmailType;

  @Column({ type: 'varchar', length: 500 })
  subject: string;

  @Column({ type: 'jsonb', default: '[]' })
  recipients: string[];

  @Column({ type: 'int', name: 'recipient_count', default: 1 })
  recipientCount: number;

  @Column({ type: 'boolean', default: false })
  success: boolean;

  @Column({ type: 'text', nullable: true, name: 'error_message' })
  errorMessage: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;
}
