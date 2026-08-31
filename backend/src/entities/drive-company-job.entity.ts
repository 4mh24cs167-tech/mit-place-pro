import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn,
  ManyToOne, JoinColumn, Index,
} from 'typeorm';
import { Drive } from './drive.entity';
import { Company } from './company.entity';
import { Job } from './job.entity';

/**
 * Junction table linking a multi-company Drive to specific Company+Job pairs.
 * Each row means "Company X is participating in Drive Y with Job Z".
 */
@Entity('drive_company_jobs')
@Index('idx_dcj_drive_id', ['driveId'])
@Index('idx_dcj_company_id', ['companyId'])
@Index('idx_dcj_job_id', ['jobId'])
@Index('idx_dcj_drive_company', ['driveId', 'companyId'])
export class DriveCompanyJob {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'drive_id' })
  driveId: string;

  @ManyToOne(() => Drive, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'drive_id' })
  drive: Drive;

  @Column({ type: 'uuid', name: 'company_id' })
  companyId: string;

  @ManyToOne(() => Company, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'company_id' })
  company: Company;

  @Column({ type: 'uuid', name: 'job_id' })
  jobId: string;

  @ManyToOne(() => Job, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'job_id' })
  job: Job;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt: Date;
}
