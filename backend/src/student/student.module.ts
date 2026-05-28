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
    ]),
    UploadModule,
  ],
  controllers: [StudentController],
  providers: [StudentService],
})
export class StudentModule {}

