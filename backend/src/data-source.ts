import 'reflect-metadata';
import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
import { join } from 'path';

dotenv.config();

export const AppDataSource = new DataSource({
  type: 'postgres',
  url: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  synchronize: false,
  logging: true,
  entities: [join(__dirname, '**/*.entity{.ts,.js}')],
  migrations: [join(__dirname, 'migrations/*{.ts,.js}')],
  subscribers: [],
});

