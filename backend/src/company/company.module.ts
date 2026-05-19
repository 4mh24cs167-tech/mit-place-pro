import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CompanyController } from './company.controller';
import { CompanyService } from './company.service';
import { Company } from '../entities/company.entity';
import { Job } from '../entities/job.entity';
import { Application } from '../entities/application.entity';
import { CompanyAvailability } from '../entities/company-availability.entity';
import { InterviewSlot } from '../entities/interview-slot.entity';
import { Notification } from '../entities/notification.entity';
import { Student } from '../entities/student.entity';
import { Drive, DriveSlot } from '../entities/drive.entity';

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
    ]),
  ],
  controllers: [CompanyController],
  providers: [CompanyService],
})
export class CompanyModule {}
