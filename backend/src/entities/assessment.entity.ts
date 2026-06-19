import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn,
  ManyToOne, JoinColumn, OneToMany, Index, Unique,
} from 'typeorm';
import { User } from './user.entity';
import { Student } from './student.entity';

// ─── Assessment ──────────────────────────────────
export type AssessmentType = 'aptitude' | 'technical' | 'coding' | 'interview' | 'custom';
export type AssessmentStatus = 'draft' | 'active' | 'expired' | 'archived';

@Entity('assessments')
@Index('idx_assessments_status', ['status'])
@Index('idx_assessments_created_at', ['createdAt'])
export class Assessment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 200 })
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  /** Multiple types: ["aptitude","technical"] */
  @Column({ type: 'text', array: true, default: '{}' })
  types: string[];

  /** Department codes targeted, e.g. ["CSE","ISE","AI&ML"] */
  @Column({ type: 'text', array: true, default: '{}' })
  departments: string[];

  /** Optional batch IDs filter */
  @Column({ type: 'text', array: true, default: '{}', name: 'batch_ids' })
  batchIds: string[];

  @Column({ type: 'varchar', length: 20, default: 'draft' })
  status: AssessmentStatus;

  @Column({ type: 'timestamptz', nullable: true })
  deadline: Date | null;

  @Column({ type: 'decimal', precision: 6, scale: 2, nullable: true, name: 'max_score' })
  maxScore: number | null;

  @Column({ type: 'uuid', name: 'created_by' })
  createdBy: string;

  @ManyToOne(() => User, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'created_by' })
  creator: User;

  @OneToMany(() => AssessmentLink, (l) => l.assessment, { cascade: true })
  links: AssessmentLink[];

  @OneToMany(() => AssessmentSchedule, (s) => s.assessment, { cascade: true })
  schedules: AssessmentSchedule[];

  @OneToMany(() => AssessmentSubmission, (s) => s.assessment, { cascade: true })
  submissions: AssessmentSubmission[];

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz', name: 'updated_at' })
  updatedAt: Date;
}

// ─── Assessment Schedule (Batch/Time Slot) ───────
@Entity('assessment_schedules')
@Index('idx_asch_assessment_id', ['assessmentId'])
export class AssessmentSchedule {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'assessment_id' })
  assessmentId: string;

  @ManyToOne(() => Assessment, (a) => a.schedules, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'assessment_id' })
  assessment: Assessment;

  /** e.g. "Batch A", "Batch 1" */
  @Column({ type: 'varchar', length: 100, name: 'batch_label', default: 'Batch 1' })
  batchLabel: string;

  /** Departments in this batch, e.g. ["CSE","ISE"] */
  @Column({ type: 'text', array: true, default: '{}' })
  departments: string[];

  @Column({ type: 'date', name: 'schedule_date' })
  scheduleDate: string;

  /** e.g. "10:00 AM" */
  @Column({ type: 'varchar', length: 20, nullable: true, name: 'start_time' })
  startTime: string | null;

  /** e.g. "12:00 PM" */
  @Column({ type: 'varchar', length: 20, nullable: true, name: 'end_time' })
  endTime: string | null;

  @Column({ type: 'varchar', length: 200, nullable: true })
  venue: string | null;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt: Date;
}

// ─── Assessment Link ─────────────────────────────
@Entity('assessment_links')
@Index('idx_assessment_links_assessment_id', ['assessmentId'])
export class AssessmentLink {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'assessment_id' })
  assessmentId: string;

  @ManyToOne(() => Assessment, (a) => a.links, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'assessment_id' })
  assessment: Assessment;

  @Column({ type: 'varchar', length: 200 })
  title: string;

  @Column({ type: 'varchar', length: 1000 })
  url: string;

  @Column({ type: 'varchar', length: 50, default: 'custom' })
  platform: string;

  @Column({ type: 'smallint', default: 0, name: 'display_order' })
  displayOrder: number;

  @Column({ type: 'text', nullable: true })
  instructions: string | null;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt: Date;
}

// ─── Assessment Submission ───────────────────────
export type SubmissionStatus = 'pending' | 'attempted' | 'completed' | 'absent';

@Entity('assessment_submissions')
@Unique(['assessmentId', 'studentId'])
@Index('idx_asub_assessment_id', ['assessmentId'])
@Index('idx_asub_student_id', ['studentId'])
@Index('idx_asub_status', ['status'])
export class AssessmentSubmission {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'assessment_id' })
  assessmentId: string;

  @ManyToOne(() => Assessment, (a) => a.submissions, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'assessment_id' })
  assessment: Assessment;

  @Column({ type: 'uuid', name: 'student_id' })
  studentId: string;

  @ManyToOne(() => Student, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'student_id' })
  student: Student;

  /** Link to the student's assigned batch/schedule */
  @Column({ type: 'uuid', nullable: true, name: 'schedule_id' })
  scheduleId: string | null;

  @ManyToOne(() => AssessmentSchedule, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'schedule_id' })
  schedule: AssessmentSchedule | null;

  @Column({ type: 'varchar', length: 20, default: 'pending' })
  status: SubmissionStatus;

  @Column({ type: 'decimal', precision: 6, scale: 2, nullable: true })
  score: number | null;

  @Column({ type: 'text', nullable: true })
  remarks: string | null;

  @Column({ type: 'timestamptz', nullable: true, name: 'attempted_at' })
  attemptedAt: Date | null;

  @Column({ type: 'timestamptz', nullable: true, name: 'graded_at' })
  gradedAt: Date | null;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz', name: 'updated_at' })
  updatedAt: Date;
}
