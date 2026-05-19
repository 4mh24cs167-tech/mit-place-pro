import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('batches')
export class Batch {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /** e.g. "CSE 2026" */
  @Column({ type: 'varchar', length: 100 })
  name: string;

  @Column({ type: 'varchar', length: 50 })
  department: string;

  /** Graduation / batch year (e.g. 2026) */
  @Column({ type: 'smallint' })
  year: number;

  /** Current semester the batch is in */
  @Column({ type: 'smallint', default: 1, name: 'current_semester' })
  currentSemester: number;

  /** Number of students in this batch (denormalized for quick access) */
  @Column({ type: 'int', default: 0, name: 'student_count' })
  studentCount: number;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz', name: 'updated_at' })
  updatedAt: Date;
}
