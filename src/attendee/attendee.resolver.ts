import { UseGuards } from '@nestjs/common';
import { Args, Query, Resolver } from '@nestjs/graphql';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../auth/enums/role.enum';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { PaginationArgs } from '../common/pagination/pagination.args';
import { Attendee } from './attendee.entity';
import { AttendeeService } from './attendee.service';
import { PaginatedAttendees } from './paginated-attendees.type';

@Resolver(() => Attendee)
export class AttendeeResolver {
  constructor(private readonly attendeeService: AttendeeService) {}

  // Solo organizadores pueden listar todos los participantes
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ORGANIZER)
  @Query(() => PaginatedAttendees, {
    description: 'Lista paginada de participantes (requiere rol ORGANIZER)',
  })
  attendees(@Args() pagination: PaginationArgs): Promise<PaginatedAttendees> {
    return this.attendeeService.findAll(pagination);
  }
}
