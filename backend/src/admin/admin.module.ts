import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { BulkUploadService } from './bulk-upload.service';
import { DriveService } from './drive.service';
import { EmailService } from './email.service';
import { User } from '../entities/user.entity';
import { Student } from '../entities/student.entity';
import { Batch } from '../entities/batch.entity';
import { Department } from '../entities/department.entity';
import { Company } from '../entities/company.entity';
import { Job } from '../entities/job.entity';
import { Application } from '../entities/application.entity';
import { Notification } from '../entities/notification.entity';
import { AuditLog } from '../entities/audit-log.entity';
import { InterviewSlot } from '../entities/interview-slot.entity';
import { Drive, DriveRegistration, DriveSlot } from '../entities/drive.entity';
import { EmailLog } from '../entities/email-log.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      User,
      Student,
      Batch,
      Department,
      Company,
      Job,
      Application,
      Notification,
      AuditLog,
      InterviewSlot,
      Drive,
      DriveRegistration,
      DriveSlot,
      EmailLog,
    ]),
  ],
  controllers: [AdminController],
  providers: [AdminService, BulkUploadService, DriveService, EmailService],
  exports: [EmailService],
})
export class AdminModule {}
