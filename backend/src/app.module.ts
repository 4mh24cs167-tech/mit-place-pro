import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './auth/auth.module';
import { User } from './entities/user.entity';
import { Student } from './entities/student.entity';
import { Company } from './entities/company.entity';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        url: config.get<string>('DATABASE_URL'),
        entities: [User, Student, Company],
        synchronize: false, // We manage schema via Neon — never auto-sync
        ssl: { rejectUnauthorized: false },
        logging: config.get('NODE_ENV') === 'development',
      }),
    }),
    AuthModule,
  ],
})
export class AppModule {}
