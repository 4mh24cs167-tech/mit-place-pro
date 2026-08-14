import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn,
  ManyToOne, JoinColumn, Index,
} from 'typeorm';
import { Student } from './student.entity';

@Entity('internship_permissions')
@Index('idx_ip_student_id', ['studentId'])
export class InternshipPermission {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'student_id' })
  studentId: string;

  @ManyToOne(() => Student, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'student_id' })
  student: Student;

  @Column({ type: 'varchar', nullable: true, name: 'mentor_name' })
  mentorName: string | null;

  // ─── Section B: External Internship Details ────────
  @Column({ type: 'varchar', name: 'company_name' })
  companyName: string;

  @Column({ type: 'varchar', nullable: true, name: 'company_website' })
  companyWebsite: string | null;

  @Column({ type: 'text', nullable: true, name: 'company_address' })
  companyAddress: string | null;

  @Column({ type: 'varchar', name: 'internship_domain' })
  internshipDomain: string;

  @Column({ type: 'varchar', name: 'internship_role' })
  internshipRole: string;

  @Column({ type: 'varchar', nullable: true, name: 'project_title' })
  projectTitle: string | null;

  @Column({ type: 'date', name: 'start_date' })
  startDate: string;

  @Column({ type: 'date', name: 'end_date' })
  endDate: string;

  @Column({ type: 'varchar', name: 'total_duration' })
  totalDuration: string;

  @Column({ type: 'varchar', name: 'mode' })
  mode: string;

  @Column({ type: 'varchar', nullable: true, name: 'work_location' })
  workLocation: string | null;

  @Column({ type: 'varchar', nullable: true, name: 'working_hours' })
  workingHours: string | null;

  @Column({ type: 'varchar', name: 'is_related_to_branch' })
  isRelatedToBranch: string;

  // ─── Section C: Internship Opportunity Details ─────
  @Column({ type: 'varchar', name: 'opportunity_source' })
  opportunitySource: string;

  @Column({ type: 'boolean', default: false, name: 'facilitated_by_college' })
  facilitatedByCollege: boolean;

  @Column({ type: 'varchar', nullable: true, name: 'source_person' })
  sourcePerson: string | null;

  @Column({ type: 'boolean', default: false, name: 'stipend_provided' })
  stipendProvided: boolean;

  @Column({ type: 'varchar', nullable: true, name: 'stipend_amount' })
  stipendAmount: string | null;

  @Column({ type: 'text', nullable: true, name: 'other_benefits' })
  otherBenefits: string | null;

  @Column({ type: 'varchar', name: 'ppo_possible' })
  ppoPossible: string;

  @Column({ type: 'text', nullable: true, name: 'ppo_details' })
  ppoDetails: string | null;

  // ─── Section D: Company HR / Supervisor Details ────
  @Column({ type: 'varchar', nullable: true, name: 'hr_name' })
  hrName: string | null;

  @Column({ type: 'varchar', nullable: true, name: 'hr_designation' })
  hrDesignation: string | null;

  @Column({ type: 'varchar', nullable: true, name: 'hr_email' })
  hrEmail: string | null;

  @Column({ type: 'varchar', nullable: true, name: 'hr_phone' })
  hrPhone: string | null;

  // ─── Section E: Documents Checklist ────────────────
  @Column({ type: 'jsonb', default: [], name: 'documents_checklist' })
  documentsChecklist: boolean[];

  // ─── Section F: Declaration ────────────────────────
  @Column({ type: 'boolean', default: false, name: 'declaration_accepted' })
  declarationAccepted: boolean;

  // ─── Timestamps ────────────────────────────────────
  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz', name: 'updated_at' })
  updatedAt: Date;
}
