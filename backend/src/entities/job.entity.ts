import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, OneToMany, Index } from 'typeorm';
import { Company } from './company.entity';

@Entity('jobs')
@Index('idx_jobs_company_id', ['companyId'])
@Index('idx_jobs_status', ['status'])
export class Job {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'company_id' })
  companyId: string;

  @ManyToOne(() => Company, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'company_id' })
  company: Company;

  @Column({ type: 'varchar', length: 150 })
  title: string;

  @Column({ type: 'text' })
  description: string;

  @Column({ type: 'text', array: true, default: '{}', name: 'required_skills' })
  requiredSkills: string[];

  @Column({ type: 'text', array: true, default: '{}', name: 'allowed_departments' })
  allowedDepartments: string[];

  @Column({ type: 'decimal', precision: 4, scale: 2, default: 0, name: 'min_cgpa' })
  minCgpa: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0, name: 'min_tenth_percent' })
  minTenthPercent: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0, name: 'min_twelfth_percent' })
  minTwelfthPercent: number;

  @Column({ type: 'smallint', default: 0, name: 'max_backlogs' })
  maxBacklogs: number;

  @Column({ type: 'decimal', precision: 6, scale: 2, nullable: true, name: 'ctc_min_lpa' })
  ctcMinLpa: number | null;

  @Column({ type: 'decimal', precision: 6, scale: 2, nullable: true, name: 'ctc_max_lpa' })
  ctcMaxLpa: number | null;

  @Column({ type: 'integer', name: 'total_vacancies' })
  totalVacancies: number;

  @Column({ type: 'smallint', default: 1, name: 'num_rounds' })
  numRounds: number;

  @Column({ type: 'jsonb', default: '[]', name: 'rounds_config' })
  roundsConfig: Record<string, unknown>[];

  @Column({ type: 'smallint', default: 30, name: 'time_per_candidate_min' })
  timePerCandidateMin: number;

  @Column({ type: 'varchar', length: 20, nullable: true, name: 'work_mode' })
  workMode: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true, name: 'work_location' })
  workLocation: string | null;

  @Column({ type: 'smallint', nullable: true, name: 'bond_years' })
  bondYears: number | null;

  @Column({ type: 'bigint', nullable: true, name: 'bond_amount_inr' })
  bondAmountInr: number | null;

  @Column({ type: 'varchar', length: 50, nullable: true, name: 'joining_date' })
  joiningDate: string | null;

  @Column({ type: 'varchar', length: 20, default: 'placement', name: 'job_type' })
  jobType: string; // 'placement' | 'internship'

  @Column({ type: 'boolean', default: false, name: 'is_unpaid' })
  isUnpaid: boolean;

  @Column({ type: 'varchar', length: 50, nullable: true, name: 'internship_duration' })
  internshipDuration: string | null; // e.g. "3 months", "6 months"

  @Column({ type: 'decimal', precision: 8, scale: 2, nullable: true, name: 'stipend_amount' })
  stipendAmount: number | null; // monthly stipend in INR

  @Column({ type: 'varchar', length: 500, nullable: true, name: 'jd_file_url' })
  jdFileUrl: string | null;

  @Column({ type: 'enum', enum: ['draft', 'open', 'closed'], default: 'draft' })
  status: string;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz', name: 'updated_at' })
  updatedAt: Date;
}
