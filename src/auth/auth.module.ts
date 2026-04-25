import { Module } from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';
import { jwtConfig } from 'src/config/jwt.config';
import { Attendee } from '../attendee/attendee.entity';
import { AuthResolver } from './auth.resolver';
import { AuthService } from './auth.service';
import { JwtStrategy } from './strategies/jwt.strategy';

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),

    JwtModule.registerAsync({
      inject: [jwtConfig.KEY],
      useFactory: (config: ConfigType<typeof jwtConfig>) => ({
        secret: config.secret,
        signOptions: { expiresIn: config.expiresIn },
      }),
    }),

    // Requerido por JwtStrategy para buscar al asistente por el campo `sub` del token
    TypeOrmModule.forFeature([Attendee]),
  ],
  providers: [AuthService, AuthResolver, JwtStrategy],
  // JwtStrategy y PassportModule se exportan para que los guards funcionen en otros módulos
  exports: [JwtStrategy, PassportModule],
})
export class AuthModule {}
