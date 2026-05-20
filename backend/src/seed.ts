import { DataSource } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import * as dotenv from 'dotenv';
dotenv.config();

// ── Import ALL entities so synchronize: true creates every table ──
import { User } from './entities/user.entity';
import { Student } from './entities/student.entity';
import { Batch } from './entities/batch.entity';
import { Department } from './entities/department.entity';
import { Company } from './entities/company.entity';
import { Job } from './entities/job.entity';
import { CompanyAvailability } from './entities/company-availability.entity';
import { Cv } from './entities/cv.entity';
import { Application } from './entities/application.entity';
import { InterviewSlot } from './entities/interview-slot.entity';
import { OfferLetter } from './entities/offer-letter.entity';
import { PlacementPoster } from './entities/placement-poster.entity';
import { Notification } from './entities/notification.entity';
import { AuditLog } from './entities/audit-log.entity';
import { Drive, DriveRegistration, DriveSlot } from './entities/drive.entity';

const AppDataSource = new DataSource({
  type: 'postgres',
  url: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  synchronize: true,
  logging: ['error'],
  entities: [
    User, Student, Batch, Department, Company, Job, CompanyAvailability, Cv,
    Application, InterviewSlot, OfferLetter, PlacementPoster,
    Notification, AuditLog, Drive, DriveRegistration, DriveSlot,
  ],
});

async function seed() {
  console.log('🌱 Connecting to database...');
  await AppDataSource.initialize();
  const qr = AppDataSource.createQueryRunner();
  console.log('✅ Connected! Schema synchronised.\n');

  // ── NUKE everything with TRUNCATE CASCADE (instant, no FK issues) ──
  console.log('🧹 TRUNCATING ALL tables (CASCADE)...');
  const tables = [
    'drive_slots', 'drive_registrations', 'drives',
    'placement_posters', 'offer_letters',
    'notifications', 'interview_slots', 'applications',
    'cvs', 'jobs', 'company_availability',
    'students', 'batches', 'departments', 'companies',
    'audit_logs', 'users',
  ];
  for (const t of tables) {
    await qr.query(`TRUNCATE TABLE "${t}" CASCADE`).catch(() => {});
  }
  console.log('✅ All tables truncated.\n');

  // ── Helper ──
  const hash = (pw: string) => bcrypt.hashSync(pw, 10);
  const uuid = () => crypto.randomUUID();

  // ══════════════════════════════════════════════════
  //  ONLY ADMIN + PRINCIPAL — Password: Place@2026
  // ══════════════════════════════════════════════════
  console.log('👤 Creating admin & principal users...');
  const adminId = uuid();
  const principalId = uuid();
  const password = 'Place@2026';

  await qr.query(`INSERT INTO users (id, email, password_hash, role, must_change_password, is_active) VALUES
    ('${adminId}',     'admin@mitm.edu.in',     '${hash(password)}', 'admin',     false, true),
    ('${principalId}', 'principal@mitm.edu.in',  '${hash(password)}', 'principal', false, true)
  `);

  // ── Seed default departments ──
  console.log('🏛️  Seeding default departments...');
  const departments = [
    { code: 'CSE', name: 'Computer Science & Engineering' },
    { code: 'ISE', name: 'Information Science & Engineering' },
    { code: 'ECE', name: 'Electronics & Communication Engineering' },
    { code: 'EEE', name: 'Electrical & Electronics Engineering' },
    { code: 'MECH', name: 'Mechanical Engineering' },
    { code: 'CIVIL', name: 'Civil Engineering' },
    { code: 'AI&ML', name: 'Artificial Intelligence & Machine Learning' },
    { code: 'AI&DS', name: 'Artificial Intelligence & Data Science' },
  ];
  const deptValues = departments
    .map((d) => `('${uuid()}', '${d.code}', '${d.name}', true)`)
    .join(',\n    ');
  await qr.query(`INSERT INTO departments (id, code, name, is_active) VALUES\n    ${deptValues}`);

  // ══════════════════════════════════════════════════
  //  SUMMARY
  // ══════════════════════════════════════════════════
  console.log('\n═══════════════════════════════════════');
  console.log('  🌱 SEED DATA COMPLETE');
  console.log('═══════════════════════════════════════');
  console.log('  Users:  2 (1 admin + 1 principal)');
  console.log('  Departments: 8 (CSE, ISE, ECE, EEE, MECH, CIVIL, AI&ML, AI&DS)');
  console.log('  All other tables: EMPTY');
  console.log('═══════════════════════════════════════');
  console.log('\n🔑 LOGIN CREDENTIALS:');
  console.log('  Admin:     admin@mitm.edu.in     / Place@2026');
  console.log('  Principal: principal@mitm.edu.in  / Place@2026');
  console.log('═══════════════════════════════════════\n');

  await AppDataSource.destroy();
  console.log('✅ Done! Database connection closed.');
}

seed().catch((err) => {
  console.error('❌ Seed failed:', err);
  process.exit(1);
});
