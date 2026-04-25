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
import { Attendee } from '../attendee/attendee.entity';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import {
  AlreadyRegisteredError,
  CapacityFullError,
  RegistrationService,
  RegistrationSuccess,
} from './registration.service';

export const RegisterForConferenceResult = createUnionType({
  name: 'RegisterForConferenceResult',
  types: () =>
    [RegistrationSuccess, AlreadyRegisteredError, CapacityFullError] as const,
  resolveType(value) {
    if (value instanceof RegistrationSuccess) return RegistrationSuccess;
    if (value instanceof AlreadyRegisteredError) return AlreadyRegisteredError;
    if (value instanceof CapacityFullError) return CapacityFullError;
  },
});

@InputType()
class RegisterForConferenceInput {
  @IsUUID()
  @Field(() => ID)
  conferenceId: string;
}

@Resolver()
export class RegistrationResolver {
  constructor(private readonly registrationService: RegistrationService) {}

  @UseGuards(JwtAuthGuard)
  @Mutation(() => RegisterForConferenceResult)
  registerForConference(
    @CurrentUser() user: Attendee, // attendeeId viene del token, no del input
    @Args('input') input: RegisterForConferenceInput,
  ) {
    return this.registrationService.registerForConference(
      user.id,
      input.conferenceId,
    );
  }
}
