import { UseGuards } from '@nestjs/common';
import {
  Args,
  createUnionType,
  Field,
  ID,
  InputType,
  Mutation,
  Resolver,
} from '@nestjs/graphql';
import { IsUUID } from 'class-validator';
import { Attendee } from 'src/attendee/attendee.entity';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import {
  AlreadyEnrolledError,
  ConferenceNotRegisteredError,
  EnrollSuccess,
  WorkshopEnrollmentService,
  WorkshopFullError,
} from './workshop-enrollment.service';

// TODO Bloque 4 — Define el union type y agrega la mutación enrollInWorkshop
//
// Paso 1: Crea el union type con createUnionType():
//
//   export const EnrollInWorkshopResult = createUnionType({
//     name: 'EnrollInWorkshopResult',
//     types: () =>
//       [EnrollSuccess, WorkshopFullError, AlreadyEnrolledError, ConferenceNotRegisteredError] as const,
//     resolveType(value) {
//       if (value instanceof EnrollSuccess) return EnrollSuccess;
//       if (value instanceof WorkshopFullError) return WorkshopFullError;
//       if (value instanceof AlreadyEnrolledError) return AlreadyEnrolledError;
//       if (value instanceof ConferenceNotRegisteredError) return ConferenceNotRegisteredError;
//     },
//   });
//
// Paso 2: Agrega la mutación al resolver (el attendeeId viene del token, no del input):
//
//   @UseGuards(JwtAuthGuard)
//   @Mutation(() => EnrollInWorkshopResult)
//   enrollInWorkshop(
//     @CurrentUser() user: Attendee,
//     @Args('input') input: EnrollInWorkshopInput,
//   ) {
//     return this.enrollmentService.enrollInWorkshop(user.id, input.workshopId);
//   }
//
// Ver WORKSHOP_GUIDE.md → "Bloque 4 — Ejercicio: enrollInWorkshop"

@InputType()
class EnrollInWorkshopInput {
  @Field(() => ID)
  @IsUUID('7')
  workshopId: string;
}

@Resolver()
export class WorkshopEnrollmentResolver {
  constructor(private readonly enrollmentService: WorkshopEnrollmentService) {}
}
