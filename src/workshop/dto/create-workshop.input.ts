import { Field, ID, InputType, Int } from '@nestjs/graphql';
import {
  IsDateString,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Min,
} from 'class-validator';
import { WorkshopLevel } from '../workshop.entity';

@InputType()
export class CreateWorkshopInput {
  @Field()
  @IsString()
  @IsNotEmpty()
  title: string;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  description?: string;

  @Field(() => Int)
  @IsInt()
  @Min(1, { message: 'La capacidad debe ser al menos 1' })
  capacity: number;

  @Field(() => WorkshopLevel)
  @IsEnum(WorkshopLevel, {
    message: 'El nivel debe ser BEGINNER, INTERMEDIATE o ADVANCED',
  })
  level: WorkshopLevel;

  @Field()
  @IsDateString()
  startTime: string;

  @Field()
  @IsDateString()
  endTime: string;

  @Field(() => ID)
  @IsUUID('7')
  conferenceId: string;
}
