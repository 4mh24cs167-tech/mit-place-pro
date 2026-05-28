import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, DeleteDateColumn, ManyToOne, JoinColumn, Index } from 'typeorm';
import { User } from './user.entity';
import { Batch } from './batch.entity';

@Entity('students')
@Index('idx_students_department', ['department'])
@Index('idx_students_batch_id', ['batchId'])
@Index('idx_students_placement_status', ['placementStatus'])
@Index('idx_students_user_id', ['userId'])
@Index('idx_students_dept_profile', ['department', 'profileComplete'])
export class Student {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'user_id' })
  userId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ type: 'varchar', length: 20, unique: true })
  usn: string;

  @Column({ type: 'varchar', length: 100, name: 'full_name' })
  fullName: string;

  @Column({ type: 'varchar', length: 15, nullable: true })
  phone: string | null;

  @Column({ type: 'date', nullable: true, name: 'date_of_birth' })
  dateOfBirth: Date | null;

  @Column({ type: 'varchar', length: 20, nullable: true })
  gender: string | null;

  @Column({ type: 'jsonb', nullable: true, name: 'address_json' })
  addressJson: Record<string, string> | null;

  @Column({ type: 'varchar', length: 500, nullable: true, name: 'photo_s3_key' })
  photoS3Key: string | null;

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true, name: 'tenth_percent' })
  tenthPercent: number | null;

  @Column({ type: 'varchar', length: 50, nullable: true, name: 'tenth_board' })
  tenthBoard: string | null;

  @Column({ type: 'smallint', nullable: true, name: 'tenth_year' })
  tenthYear: number | null;

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true, name: 'twelfth_percent' })
  twelfthPercent: number | null;

  @Column({ type: 'varchar', length: 50, nullable: true, name: 'twelfth_board' })
  twelfthBoard: string | null;

  @Column({ type: 'smallint', nullable: true, name: 'twelfth_year' })
  twelfthYear: number | null;

  @Column({ type: 'varchar', length: 20, nullable: true, name: 'twelfth_stream' })
  twelfthStream: string | null;

  @Column({ type: 'decimal', precision: 4, scale: 2, nullable: true })
  cgpa: number | null;

  @Column({ type: 'smallint', default: 0 })
  backlogs: number;

  @Column({ type: 'varchar', length: 50 })
  department: string;

  @Column({ type: 'uuid', nullable: true, name: 'batch_id' })
  batchId: string | null;

  @ManyToOne(() => Batch, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'batch_id' })
  batch: Batch | null;

  @Column({ type: 'smallint', nullable: true })
  semester: number | null;

  @Column({ type: 'varchar', length: 500, nullable: true, name: 'drive_link' })
  driveLink: string | null;

  @Column({ type: 'varchar', length: 500, nullable: true, name: 'resume_link' })
  resumeLink: string | null;

  @Column({ type: 'bigint', nullable: true, name: 'family_income' })
  familyIncome: number | null;

  @Column({ type: 'varchar', length: 10, nullable: true })
  category: string | null;

  @Column({ type: 'jsonb', default: {}, name: 'profile_data' })
  profileData: Record<string, unknown>;

  @Column({ type: 'boolean', default: false, name: 'profile_complete' })
  profileComplete: boolean;

  @Column({ type: 'enum', enum: ['none', 'shortlisted', 'interview_scheduled', 'offered', 'placed', 'not_placed'], default: 'none', name: 'placement_status' })
  placementStatus: string;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz', name: 'updated_at' })
  updatedAt: Date;

  @DeleteDateColumn({ type: 'timestamptz', name: 'deleted_at' })
  deletedAt: Date | null;
}
