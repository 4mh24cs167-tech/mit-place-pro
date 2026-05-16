import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Job } from './job.entity';

@Entity('company_availability')
export class CompanyAvailability {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'job_id' })
  jobId: string;

  @ManyToOne(() => Job, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'job_id' })
  job: Job;

  @Column({ type: 'date' })
  date: Date;

  @Column({ type: 'time', name: 'start_time' })
  startTime: string;

  @Column({ type: 'time', name: 'end_time' })
  endTime: string;

  @Column({ type: 'time', nullable: true, name: 'break_start' })
  breakStart: string | null;

  @Column({ type: 'time', nullable: true, name: 'break_end' })
  breakEnd: string | null;

  @Column({ type: 'varchar', length: 300, nullable: true })
  venue: string | null;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt: Date;
}
