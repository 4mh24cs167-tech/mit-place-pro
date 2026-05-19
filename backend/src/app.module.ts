import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './auth/auth.module';
import { AdminModule } from './admin/admin.module';
import { StudentModule } from './student/student.module';
import { CompanyModule } from './company/company.module';
import {
  User,
  Student,
  Batch,
  Company,
  Job,
  CompanyAvailability,
  Cv,
  Application,
  InterviewSlot,
  OfferLetter,
  PlacementPoster,
  Notification,
  AuditLog,
  Drive,
  DriveRegistration,
  DriveSlot,
} from './entities';

const entities = [
  User,
  Student,
  Batch,
  Company,
  Job,
  CompanyAvailability,
  Cv,
  Application,
  InterviewSlot,
  OfferLetter,
  PlacementPoster,
  Notification,
  AuditLog,
  Drive,
  DriveRegistration,
  DriveSlot,
];

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        url: config.get<string>('DATABASE_URL'),
        entities,
        synchronize: true,
        ssl: { rejectUnauthorized: false },
        logging: config.get('NODE_ENV') === 'development',
      }),
    }),
    AuthModule,
    AdminModule,
    StudentModule,
    CompanyModule,
  ],
})
export class AppModule {}
