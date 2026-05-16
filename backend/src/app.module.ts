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
} from './entities';

const entities = [
  User,
  Student,
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
        synchronize: false,
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
