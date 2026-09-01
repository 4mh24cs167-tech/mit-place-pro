import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn,
  ManyToOne, JoinColumn, OneToMany, Index, Unique,
} from 'typeorm';
import { Company } from './company.entity';
import { Job } from './job.entity';
import { Student } from './student.entity';

export type DriveType = 'single' | 'multiple';
export type DriveStatus = 'draft' | 'open' | 'screening' | 'scheduled' | 'completed' | 'cancelled';

@Entity('drives')
@Index('idx_drives_status', ['status'])
@Index('idx_drives_job_id', ['jobId'])
@Index('idx_drives_created_at', ['createdAt'])
export class Drive {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 200 })
  title: string;

  @Column({ type: 'varchar', length: 20, default: 'single' })
  type: DriveType;

  @Column({ type: 'varchar', length: 20, default: 'open' })
  status: DriveStatus;

  @Column({ type: 'uuid', name: 'job_id', nullable: true })
  jobId: string | null;

  @ManyToOne(() => Job, { onDelete: 'CASCADE', nullable: true })
  @JoinColumn({ name: 'job_id' })
  job: Job | null;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ type: 'date', nullable: true, name: 'drive_date' })
  driveDate: string | null;

  @Column({ type: 'jsonb', nullable: true, default: '[]' })
  departments: string[];

  @Column({ type: 'jsonb', nullable: true, default: '[]', name: 'batch_ids' })
  batchIds: string[];

  @Column({ type: 'jsonb', nullable: true, default: '[]', name: 'job_ids' })
  jobIds: string[];

  @OneToMany(() => DriveRegistration, (reg) => reg.drive, { cascade: true })
  registrations: DriveRegistration[];

  @OneToMany(() => DriveSlot, (slot) => slot.drive, { cascade: true })
  slots: DriveSlot[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}

export type RegistrationStatus = 'pending' | 'approved' | 'rejected' | 'declined';

@Entity('drive_registrations')
@Unique(['driveId', 'studentId'])
@Index('idx_drive_reg_drive_id', ['driveId'])
@Index('idx_drive_reg_student_id', ['studentId'])
@Index('idx_drive_reg_drive_status', ['driveId', 'status'])
export class DriveRegistration {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'drive_id' })
  driveId: string;

  @ManyToOne(() => Drive, (d) => d.registrations, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'drive_id' })
  drive: Drive;

  @Column({ type: 'uuid', name: 'student_id' })
  studentId: string;

  @ManyToOne(() => Student, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'student_id' })
  student: Student;

  @Column({ type: 'varchar', length: 20, default: 'pending' })
  status: RegistrationStatus;

  @Column({ type: 'text', nullable: true, name: 'rejection_reason' })
  rejectionReason: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}

@Entity('drive_slots')
@Index('idx_drive_slots_drive_id', ['driveId'])
export class DriveSlot {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'drive_id' })
  driveId: string;

  @ManyToOne(() => Drive, (d) => d.slots, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'drive_id' })
  drive: Drive;

  @Column({ type: 'varchar', length: 100, name: 'time_slot' })
  timeSlot: string; // e.g. "11:00 AM - 2:00 PM"

  @Column({ type: 'varchar', length: 100, nullable: true })
  classroom: string | null;

  @Column({ type: 'jsonb', default: '[]' })
  departments: string[]; // departments assigned to this slot

  @Column({ type: 'int', default: 0, name: 'student_count' })
  studentCount: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
