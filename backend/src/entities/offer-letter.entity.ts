import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Application } from './application.entity';

@Entity('offer_letters')
export class OfferLetter {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', unique: true, name: 'application_id' })
  applicationId: string;

  @ManyToOne(() => Application, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'application_id' })
  application: Application;

  @Column({ type: 'varchar', length: 500, name: 's3_key' })
  s3Key: string;

  @Column({ type: 'decimal', precision: 6, scale: 2, name: 'offered_ctc_lpa' })
  offeredCtcLpa: number;

  @Column({ type: 'date', nullable: true, name: 'joining_date' })
  joiningDate: Date | null;

  @Column({ type: 'uuid', name: 'uploaded_by' })
  uploadedBy: string;

  @Column({ type: 'timestamptz', default: () => 'NOW()', name: 'uploaded_at' })
  uploadedAt: Date;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt: Date;
}
