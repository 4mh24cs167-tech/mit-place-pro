import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Application } from './application.entity';

@Entity('placement_posters')
export class PlacementPoster {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'application_id' })
  applicationId: string;

  @ManyToOne(() => Application, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'application_id' })
  application: Application;

  @Column({ type: 'varchar', length: 50, name: 'template_id' })
  templateId: string;

  @Column({ type: 'varchar', length: 500, nullable: true, name: 's3_key_square' })
  s3KeySquare: string | null;

  @Column({ type: 'varchar', length: 500, nullable: true, name: 's3_key_banner' })
  s3KeyBanner: string | null;

  @Column({ type: 'enum', enum: ['queued', 'generating', 'done', 'failed'], default: 'queued' })
  status: string;

  @Column({ type: 'boolean', default: false })
  published: boolean;

  @Column({ type: 'timestamptz', nullable: true, name: 'generated_at' })
  generatedAt: Date | null;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz', name: 'updated_at' })
  updatedAt: Date;
}
