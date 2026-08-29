import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StudentController } from './student.controller';
import { StudentService } from './student.service';
import { UploadModule } from '../upload/upload.module';
import { Student } from '../entities/student.entity';
import { Department } from '../entities/department.entity';
import { Job } from '../entities/job.entity';
import { Application } from '../entities/application.entity';
import { Cv } from '../entities/cv.entity';
import { InterviewSlot } from '../entities/interview-slot.entity';
import { Notification } from '../entities/notification.entity';
import { Drive, DriveRegistration, DriveSlot } from '../entities/drive.entity';
import { MeetingAssignment } from '../entities/round-meeting.entity';
import { StudentDriveFeedback, CompanyDriveFeedback } from '../entities/feedback.entity';
import { Assessment, AssessmentLink, AssessmentSubmission, AssessmentSchedule, AssessmentSubItem } from '../entities/assessment.entity';
import { InternshipPermission } from '../entities/internship-permission.entity';
import { StudentEducation } from '../entities/student-education.entity';
import { AdminModule } from '../admin/admin.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Student,
      Department,
      Job,
      Application,
      Cv,
      InterviewSlot,
      Notification,
      Drive,
      DriveRegistration,
      DriveSlot,
      MeetingAssignment,
      StudentDriveFeedback,
      CompanyDriveFeedback,
      Assessment,
      AssessmentLink,
      AssessmentSubmission,
      AssessmentSchedule,
      AssessmentSubItem,
      InternshipPermission,
      StudentEducation,
    ]),
    UploadModule,
    AdminModule,
  ],
  controllers: [StudentController],
  providers: [StudentService],
})
export class StudentModule {}

