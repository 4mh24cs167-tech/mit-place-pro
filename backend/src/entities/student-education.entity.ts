import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, Unique, Index } from 'typeorm';
import { Student } from './student.entity';

export enum QualificationType {
  SSLC = 'SSLC',
  PUC = 'PUC',
  DIPLOMA = 'DIPLOMA',
  ITI = 'ITI',
  UG = 'UG',
  PG = 'PG',
}

@Entity('student_educations')
@Unique('uq_student_qualification', ['studentId', 'qualificationType'])
@Index('idx_student_educations_student', ['studentId'])
export class StudentEducation {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'student_id' })
  studentId: string;

  @ManyToOne(() => Student, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'student_id' })
  student: Student;

  @Column({ type: 'enum', enum: QualificationType, name: 'qualification_type' })
  qualificationType: QualificationType;

  @Column({ type: 'varchar', length: 150, nullable: true, name: 'course_name' })
  courseName: string | null;

  @Column({ type: 'varchar', length: 200, nullable: true, name: 'college_name' })
  collegeName: string | null;

  @Column({ type: 'varchar', length: 200, nullable: true })
  university: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  board: string | null;

  @Column({ type: 'varchar', length: 50, nullable: true })
  stream: string | null;

  @Column({ type: 'varchar', length: 150, nullable: true })
  specialization: string | null;

  @Column({ type: 'varchar', length: 50, nullable: true, name: 'registration_number' })
  registrationNumber: string | null;

  @Column({ type: 'smallint', nullable: true, name: 'start_year' })
  startYear: number | null;

  @Column({ type: 'smallint', nullable: true, name: 'passing_year' })
  passingYear: number | null;

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  percentage: number | null;

  @Column({ type: 'decimal', precision: 4, scale: 2, nullable: true })
  cgpa: number | null;

  @Column({ type: 'varchar', length: 500, nullable: true, name: 'document_drive_url' })
  documentDriveUrl: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true, name: 'document_file_name' })
  documentFileName: string | null;

  @Column({ type: 'varchar', length: 50, nullable: true, name: 'document_file_type' })
  documentFileType: string | null;

  @Column({ type: 'bytea', nullable: true, name: 'document_file_data', select: false })
  documentFileData: Buffer | null;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz', name: 'updated_at' })
  updatedAt: Date;
}
