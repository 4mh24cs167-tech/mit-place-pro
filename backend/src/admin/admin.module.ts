import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { BulkUploadService } from './bulk-upload.service';
import { EmailService } from './email.service';
import { User } from '../entities/user.entity';
import { Student } from '../entities/student.entity';
import { Company } from '../entities/company.entity';
import { Job } from '../entities/job.entity';
import { Application } from '../entities/application.entity';
import { Notification } from '../entities/notification.entity';
import { AuditLog } from '../entities/audit-log.entity';
import { InterviewSlot } from '../entities/interview-slot.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      User,
      Student,
      Company,
      Job,
      Application,
      Notification,
      AuditLog,
      InterviewSlot,
    ]),
  ],
  controllers: [AdminController],
  providers: [AdminService, BulkUploadService, EmailService],
})
export class AdminModule {}
