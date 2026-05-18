import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToOne, DeleteDateColumn } from 'typeorm';

export enum UserRole {
  ADMIN = 'admin',
  COMPANY = 'company',
  STUDENT = 'student',
  PRINCIPAL = 'principal',
}

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255, unique: true })
  email: string;

  @Column({ type: 'varchar', length: 255, name: 'password_hash' })
  passwordHash: string;

  @Column({ type: 'enum', enum: UserRole })
  role: UserRole;

  @Column({ type: 'boolean', default: true, name: 'must_change_password' })
  mustChangePassword: boolean;

  @Column({ type: 'boolean', default: true, name: 'is_active' })
  isActive: boolean;

  @Column({ type: 'timestamptz', nullable: true, name: 'last_login_at' })
  lastLoginAt: Date | null;

  @Column({ type: 'varchar', length: 6, nullable: true, name: 'reset_otp' })
  resetOtp: string | null;

  @Column({ type: 'timestamptz', nullable: true, name: 'reset_otp_expires_at' })
  resetOtpExpiresAt: Date | null;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz', name: 'updated_at' })
  updatedAt: Date;

  @DeleteDateColumn({ type: 'timestamptz', name: 'deleted_at' })
  deletedAt: Date | null;
}
