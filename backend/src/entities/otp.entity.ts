import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index } from 'typeorm';

@Entity('otp_records')
@Index('idx_otp_email', ['email'])
export class OtpRecord {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255 })
  email: string;

  @Column({ type: 'varchar', length: 255 })
  otpHash: string;

  @Column({ type: 'timestamptz' })
  expiresAt: Date;

  @Column({ type: 'smallint', default: 0 })
  failedAttempts: number;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;
}
