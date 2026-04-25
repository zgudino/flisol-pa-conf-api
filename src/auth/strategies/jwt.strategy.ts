import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import type { ConfigType } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { InjectRepository } from '@nestjs/typeorm';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { jwtConfig } from 'src/config/jwt.config';
import { Repository } from 'typeorm';
import { Attendee } from '../../attendee/attendee.entity';
import { JwtPayload } from '../interfaces/jwt-payload.interface';

// Estrategia JWT de Passport
// Se ejecuta automáticamente cuando se usa @UseGuards(JwtAuthGuard) en un resolver
//
// Flujo:
//   1. Extrae el token del header "Authorization: Bearer <token>"
//   2. Verifica la firma con JWT_SECRET
//   3. Llama a validate() con el payload decodificado
//   4. El valor retornado por validate() se inyecta en request.user
//      y luego es accesible con @CurrentUser() en el resolver
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    @Inject(jwtConfig.KEY)
    config: ConfigType<typeof jwtConfig>,
    @InjectRepository(Attendee)
    private readonly attendeeRepository: Repository<Attendee>,
  ) {
    super({
      // Extrae el token del header Authorization: Bearer <token>
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      // Rechaza tokens expirados automáticamente
      ignoreExpiration: false,
      secretOrKey: config.secret,
    });
  }

  // Se llama con el payload ya verificado y decodificado
  // Si retorna null o lanza excepción → 401 UNAUTHENTICATED
  async validate(payload: JwtPayload): Promise<Attendee> {
    const user = await this.attendeeRepository.findOneBy({ id: payload.sub });
    if (!user) {
      throw new UnauthorizedException('Token inválido — usuario no encontrado');
    }
    return user; // disponible como request.user y via @CurrentUser()
  }
}
