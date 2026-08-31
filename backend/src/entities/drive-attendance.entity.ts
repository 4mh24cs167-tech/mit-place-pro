import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn,
  ManyToOne, JoinColumn, Index, Unique,
} from 'typeorm';
import { Drive } from './drive.entity';
import { Student } from './student.entity';
import { Job } from './job.entity';
import { Company } from './company.entity';

/**
 * Records a student's attendance (opt-in) for a specific company/job
 * within a multi-company drive.
 *
 * Flow: Student joins a drive → then clicks "Attend" per company/job
 * → a DriveAttendance record is created.
 * Companies see their attendees through this table.
 */
@Entity('drive_attendances')
@Index('idx_da_drive_id', ['driveId'])
@Index('idx_da_student_id', ['studentId'])
@Index('idx_da_job_id', ['jobId'])
@Index('idx_da_company_id', ['companyId'])
@Unique('uq_da_drive_student_job', ['driveId', 'studentId', 'jobId'])
export class DriveAttendance {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'drive_id' })
  driveId: string;

  @ManyToOne(() => Drive, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'drive_id' })
  drive: Drive;

  @Column({ type: 'uuid', name: 'student_id' })
  studentId: string;

  @ManyToOne(() => Student, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'student_id' })
  student: Student;

  @Column({ type: 'uuid', name: 'job_id' })
  jobId: string;

  @ManyToOne(() => Job, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'job_id' })
  job: Job;

  @Column({ type: 'uuid', name: 'company_id' })
  companyId: string;

  @ManyToOne(() => Company, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'company_id' })
  company: Company;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt: Date;
}
