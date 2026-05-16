import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StudentController } from './student.controller';
import { StudentService } from './student.service';
import { Student } from '../entities/student.entity';
import { Job } from '../entities/job.entity';
import { Application } from '../entities/application.entity';
import { Cv } from '../entities/cv.entity';
import { InterviewSlot } from '../entities/interview-slot.entity';
import { Notification } from '../entities/notification.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Student,
      Job,
      Application,
      Cv,
      InterviewSlot,
      Notification,
    ]),
  ],
  controllers: [StudentController],
  providers: [StudentService],
})
export class StudentModule {}
