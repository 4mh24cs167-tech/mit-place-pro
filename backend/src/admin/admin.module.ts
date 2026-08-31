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
import { DriveCompanyJob } from '../entities/drive-company-job.entity';
import { DriveAttendance } from '../entities/drive-attendance.entity';
import { EmailLog } from '../entities/email-log.entity';
import { StudentDriveFeedback, CompanyDriveFeedback } from '../entities/feedback.entity';
import { Assessment, AssessmentLink, AssessmentSubmission, AssessmentSchedule, AssessmentSubItem, AssessmentCredential } from '../entities/assessment.entity';
import { InternshipPermission } from '../entities/internship-permission.entity';
import { FeedbackService } from './feedback.service';
import { AssessmentService } from './assessment.service';
import { InternshipService } from './internship.service';

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
      DriveCompanyJob,
      DriveAttendance,
      EmailLog,
      StudentDriveFeedback,
      CompanyDriveFeedback,
      Assessment,
      AssessmentLink,
      AssessmentSubmission,
      AssessmentSchedule,
      AssessmentSubItem,
      AssessmentCredential,
      InternshipPermission,
    ]),
  ],
  controllers: [AdminController],
  providers: [AdminService, BulkUploadService, DriveService, EmailService, FeedbackService, AssessmentService, InternshipService],
  exports: [EmailService, FeedbackService, AssessmentService, InternshipService],
})
export class AdminModule {}
