import { UseGuards } from '@nestjs/common';
import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { Attendee } from '../attendee/attendee.entity';
import { AuthService } from './auth.service';
import { CurrentUser } from './decorators/current-user.decorator';
import { LoginInput } from './dto/login.input';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { AuthPayload } from './types/auth-payload.type';

@Resolver()
export class AuthResolver {
  constructor(private readonly authService: AuthService) {}

  // Mutación de login — retorna un JWT y los datos del usuario
  // El input es validado automáticamente por ValidationPipe (IsEmail, MinLength)
  @Mutation(() => AuthPayload, {
    description: 'Inicia sesión y retorna un JWT',
  })
  login(@Args('input') input: LoginInput): Promise<AuthPayload> {
    return this.authService.login(input);
  }

  // Query protegida — ejemplo de uso de @UseGuards + @CurrentUser()
  // El cliente debe enviar: Authorization: Bearer <token>
  // Si el token falta o es inválido → error UNAUTHENTICATED en errors[]
  @UseGuards(JwtAuthGuard)
  @Query(() => Attendee, {
    description: 'Retorna el usuario actualmente autenticado',
  })
  me(@CurrentUser() user: Attendee): Attendee {
    return user;
  }
}
