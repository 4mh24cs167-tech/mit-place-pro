import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, Unique, Index } from 'typeorm';
import { Student } from './student.entity';
import { Job } from './job.entity';
import { Cv } from './cv.entity';

@Entity('applications')
@Unique(['studentId', 'jobId'])
@Index('idx_applications_job_id', ['jobId'])
@Index('idx_applications_student_id', ['studentId'])
@Index('idx_applications_admin_approved', ['adminApproved'])
@Index('idx_applications_job_approved', ['jobId', 'adminApproved'])
export class Application {
  @PrimaryGeneratedColumn('uuid')
  id: string;

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

  @Column({ type: 'uuid', nullable: true, name: 'cv_id' })
  cvId: string | null;

  @ManyToOne(() => Cv, { nullable: true })
  @JoinColumn({ name: 'cv_id' })
  cv: Cv | null;

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true, name: 'match_score' })
  matchScore: number | null;

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true, name: 'ats_score' })
  atsScore: number | null;

  @Column({ type: 'boolean', nullable: true, name: 'admin_approved' })
  adminApproved: boolean | null;

  @Column({ type: 'timestamptz', nullable: true, name: 'admin_approved_at' })
  adminApprovedAt: Date | null;

  @Column({ type: 'smallint', default: 0, name: 'current_round' })
  currentRound: number;

  @Column({ type: 'enum', enum: ['pending', 'selected', 'rejected'], default: 'pending', name: 'final_result' })
  finalResult: string;

  @Column({ type: 'decimal', precision: 6, scale: 2, nullable: true, name: 'offered_ctc_lpa' })
  offeredCtcLpa: number | null;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz', name: 'updated_at' })
  updatedAt: Date;
}
