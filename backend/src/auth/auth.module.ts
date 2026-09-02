import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { User } from '../entities/user.entity';
import { EmailLog } from '../entities/email-log.entity';
import { Student } from '../entities/student.entity';
import { Department } from '../entities/department.entity';
import { Company } from '../entities/company.entity';
import { Batch } from '../entities/batch.entity';
import { OtpRecord } from '../entities/otp.entity';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './jwt.strategy';
import { RolesGuard } from './auth.decorators';
import { EmailService } from '../admin/email.service';

@Module({
  imports: [
    ConfigModule,
    TypeOrmModule.forFeature([User, EmailLog, Student, Department, Company, Batch, OtpRecord]),
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (config: ConfigService) => ({
        secret: (() => {
          const s = config.get<string>('JWT_SECRET');
          if (!s || s.length < 16) throw new Error('FATAL: JWT_SECRET is missing or too short');
          return s;
        })(),
        signOptions: { expiresIn: '15m' as const },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, RolesGuard, EmailService],
  exports: [AuthService, JwtStrategy, PassportModule],
})
export class AuthModule {}

