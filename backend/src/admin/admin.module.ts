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
import { StudentDriveFeedback, CompanyDriveFeedback } from '../entities/feedback.entity';
import { Assessment, AssessmentLink, AssessmentSubmission, AssessmentSchedule } from '../entities/assessment.entity';
import { FeedbackService } from './feedback.service';
import { AssessmentService } from './assessment.service';

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
      StudentDriveFeedback,
      CompanyDriveFeedback,
      Assessment,
      AssessmentLink,
      AssessmentSubmission,
      AssessmentSchedule,
    ]),
  ],
  controllers: [AdminController],
  providers: [AdminService, BulkUploadService, DriveService, EmailService, FeedbackService, AssessmentService],
  exports: [EmailService, FeedbackService, AssessmentService],
})
export class AdminModule {}
