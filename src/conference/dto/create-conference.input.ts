import { InputType, Field, Int } from '@nestjs/graphql';
import {
  IsString,
  IsNotEmpty,
  IsDateString,
  IsInt,
  Min,
} from 'class-validator';

// DTO para crear una conferencia
// class-validator valida automáticamente gracias al ValidationPipe global
@InputType()
export class CreateConferenceInput {
  @Field()
  @IsString()
  @IsNotEmpty({ message: 'El nombre no puede estar vacío' })
  name: string;

  @Field({ description: 'Fecha ISO 8601 — ej: 2026-04-25T09:00:00.000Z' })
  @IsDateString({}, { message: 'La fecha debe ser un string ISO 8601 válido' })
  date: string;

  @Field()
  @IsString()
  @IsNotEmpty({ message: 'El venue no puede estar vacío' })
  venue: string;

  @Field(() => Int)
  @IsInt()
  @Min(1, { message: 'La capacidad debe ser al menos 1' })
  capacity: number;
}
