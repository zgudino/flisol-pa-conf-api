import { Field, InputType } from '@nestjs/graphql';
import { IsEmail, IsString, MinLength } from 'class-validator';

// DTO de entrada para la mutación login
// class-validator valida automáticamente gracias al ValidationPipe global en main.ts
@InputType()
export class LoginInput {
  @Field()
  @IsEmail({}, { message: 'El email no tiene un formato válido' })
  email: string;

  @Field()
  @IsString()
  @MinLength(6, { message: 'La contraseña debe tener al menos 6 caracteres' })
  password: string;
}
