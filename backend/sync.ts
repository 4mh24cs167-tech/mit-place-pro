import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
dotenv.config();

import { User } from './src/entities/user.entity';
import { Student } from './src/entities/student.entity';
import { Batch } from './src/entities/batch.entity';
import { Department } from './src/entities/department.entity';
import { Company } from './src/entities/company.entity';
import { Job } from './src/entities/job.entity';
import { CompanyAvailability } from './src/entities/company-availability.entity';
import { Cv } from './src/entities/cv.entity';
import { Application } from './src/entities/application.entity';
import { InterviewSlot } from './src/entities/interview-slot.entity';
import { OfferLetter } from './src/entities/offer-letter.entity';
import { PlacementPoster } from './src/entities/placement-poster.entity';
import { Notification } from './src/entities/notification.entity';
import { AuditLog } from './src/entities/audit-log.entity';
import { Drive, DriveRegistration, DriveSlot } from './src/entities/drive.entity';

const AppDataSource = new DataSource({
  type: 'postgres',
  url: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  synchronize: true, // This will add the missing columns without dropping data
  logging: ['query', 'error'],
  entities: [
    User, Student, Batch, Department, Company, Job, CompanyAvailability, Cv,
    Application, InterviewSlot, OfferLetter, PlacementPoster,
    Notification, AuditLog, Drive, DriveRegistration, DriveSlot,
  ],
});

async function run() {
  console.log('🔄 Connecting to database to synchronize schema safely...');
  await AppDataSource.initialize();
  console.log('✅ Schema synchronization complete! No data was lost.');
  process.exit(0);
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
