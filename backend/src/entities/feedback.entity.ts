import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn,
  ManyToOne, JoinColumn, Unique, Index,
} from 'typeorm';
import { Drive } from './drive.entity';
import { Student } from './student.entity';
import { Company } from './company.entity';

// ─── Student → Drive Feedback ────────────────────
@Entity('student_drive_feedback')
@Unique(['driveId', 'studentId'])
@Index('idx_sdf_drive_id', ['driveId'])
@Index('idx_sdf_student_id', ['studentId'])
export class StudentDriveFeedback {
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

  @Column({ type: 'smallint', name: 'overall_rating' })
  overallRating: number;

  @Column({ type: 'smallint', name: 'process_rating' })
  processRating: number;

  @Column({ type: 'smallint', name: 'communication_rating' })
  communicationRating: number;

  @Column({ type: 'varchar', length: 20, name: 'difficulty_level' })
  difficultyLevel: string;

  @Column({ type: 'text', name: 'rounds_faced' })
  roundsFaced: string;

  @Column({ type: 'text', name: 'interview_experience' })
  interviewExperience: string;

  @Column({ type: 'text', nullable: true, name: 'questions_asked' })
  questionsAsked: string | null;

  @Column({ type: 'text', nullable: true })
  tips: string | null;

  @Column({ type: 'boolean', default: true, name: 'would_recommend' })
  wouldRecommend: boolean;

  @Column({ type: 'text', nullable: true })
  comments: string | null;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz', name: 'updated_at' })
  updatedAt: Date;
}

// ─── Company → Student Feedback ──────────────────
@Entity('company_student_feedback')
@Unique(['driveId', 'studentId', 'companyId'])
@Index('idx_csf_drive_id', ['driveId'])
@Index('idx_csf_student_id', ['studentId'])
@Index('idx_csf_company_id', ['companyId'])
export class CompanyStudentFeedback {
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

  @Column({ type: 'uuid', name: 'company_id' })
  companyId: string;

  @ManyToOne(() => Company, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'company_id' })
  company: Company;

  @Column({ type: 'smallint', name: 'technical_rating' })
  technicalRating: number;

  @Column({ type: 'smallint', name: 'communication_rating' })
  communicationRating: number;

  @Column({ type: 'smallint', name: 'attitude_rating' })
  attitudeRating: number;

  @Column({ type: 'smallint', name: 'overall_rating' })
  overallRating: number;

  @Column({ type: 'text', nullable: true })
  strengths: string | null;

  @Column({ type: 'text', nullable: true, name: 'areas_of_improvement' })
  areasOfImprovement: string | null;

  @Column({ type: 'text', nullable: true })
  remarks: string | null;

  @Column({ type: 'varchar', length: 10, name: 'recommend_for_hire' })
  recommendForHire: string;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz', name: 'updated_at' })
  updatedAt: Date;
}
