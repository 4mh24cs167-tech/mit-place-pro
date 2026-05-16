import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, DeleteDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from './user.entity';

@Entity('companies')
export class Company {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'user_id' })
  userId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ type: 'varchar', length: 150 })
  name: string;

  @Column({ type: 'varchar', length: 500, nullable: true, name: 'logo_s3_key' })
  logoS3Key: string | null;

  @Column({ type: 'varchar', length: 300, nullable: true })
  website: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true, name: 'hq_city' })
  hqCity: string | null;

  @Column({ type: 'varchar', length: 50, nullable: true })
  sector: string | null;

  @Column({ type: 'varchar', length: 30, nullable: true, name: 'annual_turnover_range' })
  annualTurnoverRange: string | null;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true, name: 'hr_name' })
  hrName: string | null;

  @Column({ type: 'varchar', length: 15, nullable: true, name: 'hr_phone' })
  hrPhone: string | null;

  @Column({ type: 'boolean', default: false, name: 'profile_complete' })
  profileComplete: boolean;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz', name: 'updated_at' })
  updatedAt: Date;

  @DeleteDateColumn({ type: 'timestamptz', name: 'deleted_at' })
  deletedAt: Date | null;
}
