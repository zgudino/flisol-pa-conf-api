import { Field, InputType } from '@nestjs/graphql';
import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
} from 'class-validator';

@InputType()
export class CreateSpeakerInput {
  @Field()
  @IsString()
  @IsNotEmpty({ message: 'El nombre no puede estar vacío' })
  name: string;

  @Field()
  @IsEmail({}, { message: 'El email debe ser una dirección válida' })
  @IsNotEmpty({ message: 'El email no puede estar vacío' })
  email: string;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  bio?: string;

  @Field({ nullable: true })
  @IsUrl({}, { message: 'avatarUrl debe ser una URL válida' })
  @IsOptional()
  avatarUrl?: string;
}
