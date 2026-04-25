import { registerAs } from '@nestjs/config';
import type { LoggerOptions } from 'typeorm';

export const databaseConfig = registerAs('database', () => {
  const isDevelopment = process.env.NODE_ENV === 'development';
  const synchronize = isDevelopment && process.env.DB_SYNCHRONIZE !== 'false';
  const logging: LoggerOptions =
    process.env.DB_LOGGING === 'true' && isDevelopment
      ? ['query', 'error']
      : ['error'];

  return {
    host: process.env.DB_HOST ?? 'localhost',
    port: parseInt(process.env.DB_PORT ?? '5432', 10),
    user: process.env.DB_USER ?? 'postgres',
    password: process.env.DB_PASSWORD ?? 'postgres',
    name: process.env.DB_NAME ?? 'conf_api',
    synchronize,
    logging,
  };
});

export type DatabaseConfig = ReturnType<typeof databaseConfig>;
