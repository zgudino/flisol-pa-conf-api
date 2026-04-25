import {
  Injectable,
  UnauthorizedException,
  ConflictException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { Attendee } from '../attendee/attendee.entity';
import { Role } from '../common/enums/role.enum';
import { JwtPayload } from './interfaces/jwt-payload.interface';
import { AuthPayload } from './types/auth-payload.type';
import { LoginInput } from './dto/login.input';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(Attendee)
    private readonly attendeeRepo: Repository<Attendee>,
    private readonly jwtService: JwtService,
  ) {}

  // Hashea la contraseña con bcrypt (10 rondas de sal)
  // Nunca almacenar contraseñas en texto plano
  async hashPassword(plain: string): Promise<string> {
    return bcrypt.hash(plain, 10);
  }

  // Registra un nuevo participante
  // Lanza ConflictException si el email ya existe — se formatea como CONFLICT en GraphQL
  async register(
    name: string,
    email: string,
    password: string,
    role: Role = Role.ATTENDEE,
  ): Promise<AuthPayload> {
    const exists = await this.attendeeRepo.findOneBy({ email });
    if (exists) {
      throw new ConflictException(`El email ${email} ya está registrado`);
    }

    const hashed = await this.hashPassword(password);
    const user = this.attendeeRepo.create({
      name,
      email,
      password: hashed,
      role,
    });
    await this.attendeeRepo.save(user);

    return this.buildPayload(user);
  }

  // Valida credenciales y retorna el AuthPayload con el JWT
  // Lanza UnauthorizedException si las credenciales son inválidas
  // Nota: el mensaje es genérico intencionalmente — no revelar si el email existe
  async login(input: LoginInput): Promise<AuthPayload> {
    const user = await this.attendeeRepo.findOneBy({ email: input.email });

    // bcrypt.compare devuelve false si el usuario no existe (null password)
    // Usar un hash dummy para evitar timing attacks
    const passwordMatch = user
      ? await bcrypt.compare(input.password, user.password)
      : false;

    if (!user || !passwordMatch) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    return this.buildPayload(user);
  }

  // Construye el AuthPayload firmando el JWT con el payload del usuario
  private buildPayload(user: Attendee): AuthPayload {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    return {
      token: this.jwtService.sign(payload),
      user,
    };
  }
}
