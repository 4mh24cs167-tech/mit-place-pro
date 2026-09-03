import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { RequestLoggerMiddleware } from './common/request-logger.middleware';
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
  Department,
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
  DriveCompanyJob,
  DriveAttendance,
} from './entities';
import { RoundMeeting, MeetingGroup, MeetingAssignment } from './entities';
import { EmailLog } from './entities';
import { StudentDriveFeedback, CompanyDriveFeedback } from './entities';
import { Assessment, AssessmentLink, AssessmentSubmission, AssessmentSchedule, AssessmentSubItem, AssessmentCredential } from './entities';
import { InternshipPermission } from './entities';
import { StudentEducation } from './entities';
import { OtpRecord } from './entities';

const entities = [
  OtpRecord,
  User,
  Student,
  Batch,
  Department,
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
  DriveCompanyJob,
  DriveAttendance,
  RoundMeeting,
  MeetingGroup,
  MeetingAssignment,
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
  StudentEducation,
];

import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { CacheModule } from '@nestjs/cache-manager';

@Module({
  imports: [
    CacheModule.register({
      isGlobal: true,
      ttl: 60000, // 60 seconds caching
    }),
    ConfigModule.forRoot({ isGlobal: true }),
    EventEmitterModule.forRoot(),
    ThrottlerModule.forRoot([{
      ttl: 60000,
      limit: 100,
    }]),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        url: config.get<string>('DATABASE_URL'),
        entities,
        synchronize: false,
        ssl: { rejectUnauthorized: false },
        logging: config.get('NODE_ENV') === 'development',
        // Connection pool tuning for 50K users
        extra: {
          max: 20,                    // Max pool size (up from default 10)
          idleTimeoutMillis: 30000,   // Close idle connections after 30s
          connectionTimeoutMillis: 5000, // Fail fast if can't connect in 5s
          keepAlive: true,            // Prevent Neon cold-start disconnects
          keepAliveInitialDelayMillis: 10000,
        },
      }),
    }),
    AuthModule,
    AdminModule,
    StudentModule,
    CompanyModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(RequestLoggerMiddleware).forRoutes('*');
  }
}
