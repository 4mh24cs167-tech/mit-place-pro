import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

export enum DepartmentType {
  UG = 'UG',
  PG = 'PG',
  DEGREE = 'DEGREE',
}

/** Semester counts per department type */
export const SEMESTERS_BY_TYPE: Record<DepartmentType, number> = {
  [DepartmentType.UG]: 8,
  [DepartmentType.PG]: 4,
  [DepartmentType.DEGREE]: 6,
};

@Entity('departments')
export class Department {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /** Short code, e.g. "CSE", "AI&ML" */
  @Column({ type: 'varchar', length: 20, unique: true })
  code: string;

  /** Full name, e.g. "Computer Science & Engineering" */
  @Column({ type: 'varchar', length: 100 })
  name: string;

  /** UG / PG / DEGREE */
  @Column({ type: 'varchar', length: 10, default: 'UG' })
  type: DepartmentType;

  /** Total semesters for this department type (UG=8, PG=4, DEGREE=6) */
  @Column({ type: 'smallint', default: 8, name: 'total_semesters' })
  totalSemesters: number;

  @Column({ type: 'boolean', default: true, name: 'is_active' })
  isActive: boolean;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz', name: 'updated_at' })
  updatedAt: Date;
}
