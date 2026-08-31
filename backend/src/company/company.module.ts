import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CompanyController } from './company.controller';
import { CompanyService } from './company.service';
import { AdminModule } from '../admin/admin.module';
import { Company } from '../entities/company.entity';
import { Job } from '../entities/job.entity';
import { Application } from '../entities/application.entity';
import { CompanyAvailability } from '../entities/company-availability.entity';
import { InterviewSlot } from '../entities/interview-slot.entity';
import { Notification } from '../entities/notification.entity';
import { Student } from '../entities/student.entity';
import { Drive, DriveSlot, DriveRegistration } from '../entities/drive.entity';
import { DriveCompanyJob } from '../entities/drive-company-job.entity';
import { DriveAttendance } from '../entities/drive-attendance.entity';
import { RoundMeeting, MeetingGroup, MeetingAssignment } from '../entities/round-meeting.entity';
import { StudentDriveFeedback, CompanyDriveFeedback } from '../entities/feedback.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Company,
      Job,
      Application,
      CompanyAvailability,
      InterviewSlot,
      Notification,
      Student,
      Drive,
      DriveSlot,
      DriveRegistration,
      DriveCompanyJob,
      DriveAttendance,
      RoundMeeting,
      MeetingGroup,
      MeetingAssignment,
      StudentDriveFeedback,
      CompanyDriveFeedback,
    ]),
    AdminModule,
  ],
  controllers: [CompanyController],
  providers: [CompanyService],
})
export class CompanyModule {}
