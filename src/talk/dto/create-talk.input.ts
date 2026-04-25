import { Field, ID, InputType } from '@nestjs/graphql';
import {
  IsDateString,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  registerDecorator,
  ValidationArguments,
  ValidationOptions,
} from 'class-validator';

function IsAfter(property: string, options?: ValidationOptions) {
  return (object: object, propertyName: string) => {
    registerDecorator({
      name: 'isAfter',
      target: object.constructor,
      propertyName,
      constraints: [property],
      options,
      validator: {
        validate(value: string, args: ValidationArguments) {
          const [rel] = args.constraints as string[];
          const other = (args.object as Record<string, string>)[rel];
          return !!other && !!value && new Date(value) > new Date(other);
        },
        defaultMessage(args: ValidationArguments) {
          return `${args.property} debe ser posterior a ${args.constraints[0] as string}`;
        },
      },
    });
  };
}

@InputType()
export class CreateTalkInput {
  @Field()
  @IsString()
  @IsNotEmpty()
  title: string;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  description?: string;

  @Field()
  @IsDateString()
  startTime: string;

  @Field()
  @IsDateString()
  @IsAfter('startTime')
  endTime: string;

  @Field(() => ID)
  @IsUUID('7', { message: 'conferenceId debe ser un UUID válido' })
  conferenceId: string;

  @Field(() => ID)
  @IsUUID('7', { message: 'speakerId debe ser un UUID válido' })
  speakerId: string;
}
