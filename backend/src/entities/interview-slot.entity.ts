import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Application } from './application.entity';

@Entity('interview_slots')
export class InterviewSlot {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'application_id' })
  applicationId: string;

  @ManyToOne(() => Application, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'application_id' })
  application: Application;

  @Column({ type: 'smallint', name: 'round_number' })
  roundNumber: number;

  @Column({ type: 'timestamptz', name: 'scheduled_start' })
  scheduledStart: Date;

  @Column({ type: 'timestamptz', name: 'scheduled_end' })
  scheduledEnd: Date;

  @Column({ type: 'smallint', nullable: true, name: 'duration_override_min' })
  durationOverrideMin: number | null;

  @Column({ type: 'varchar', length: 300, nullable: true })
  venue: string | null;

  @Column({ type: 'enum', enum: ['pending', 'present', 'absent'], default: 'pending' })
  attendance: string;

  @Column({ type: 'enum', enum: ['pending', 'selected', 'rejected'], default: 'pending', name: 'round_result' })
  roundResult: string;

  @Column({ type: 'uuid', nullable: true, name: 'marked_by' })
  markedBy: string | null;

  @Column({ type: 'timestamptz', nullable: true, name: 'marked_at' })
  markedAt: Date | null;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz', name: 'updated_at' })
  updatedAt: Date;
}
