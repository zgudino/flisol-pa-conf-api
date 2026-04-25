import { registerAs } from '@nestjs/config';
import type { StringValue } from 'ms';

export const jwtConfig = registerAs('jwt', () => ({
  secret: process.env.JWT_SECRET ?? '',
  expiresIn: (process.env.JWT_EXPIRES_IN ?? '15m') as StringValue,
}));

export type JwtConfig = ReturnType<typeof jwtConfig>;
