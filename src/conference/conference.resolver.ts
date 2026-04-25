import { UseGuards } from '@nestjs/common';
import {
  Args,
  ID,
  Mutation,
  Parent,
  Query,
  ResolveField,
  Resolver,
} from '@nestjs/graphql';
import { PaginatedTalks } from 'src/talk/paginated-talks.type';
import { TalkService } from 'src/talk/talk.service';
import { PaginatedWorkshops } from 'src/workshop/paginated-workshops.type';
import { WorkshopService } from 'src/workshop/workshop.service';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../auth/enums/role.enum';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { PaginationArgs } from '../common/pagination/pagination.args';
import { Conference } from './conference.entity';
import { ConferenceService } from './conference.service';
import { CreateConferenceInput } from './dto/create-conference.input';
import { PaginatedConferences } from './paginated-conferences.type';

@Resolver(() => Conference)
export class ConferenceResolver {
  constructor(
    private readonly conferenceService: ConferenceService,
    private readonly talkService: TalkService,
    private readonly workshopService: WorkshopService,
  ) {}

  @Query(() => PaginatedConferences, {
    description: 'Lista paginada de conferencias',
  })
  conferences(@Args() pagination: PaginationArgs) {
    return this.conferenceService.findAll(pagination);
  }

  @Query(() => Conference, { nullable: true })
  conference(@Args('id', { type: () => ID }) id: string): Promise<Conference> {
    return this.conferenceService.findOneOrFail(id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ORGANIZER)
  @Mutation(() => Conference, {
    description: 'Crea una nueva conferencia (requiere rol ORGANIZER)',
  })
  createConference(
    @Args('input') input: CreateConferenceInput,
  ): Promise<Conference> {
    return this.conferenceService.create(input);
  }

  // TODO Bloque 2 — Agrega los ResolveField para las talks y workshops de una conferencia
  //
  // @ResolveField(() => PaginatedTalks)
  // talks(@Parent() conf: Conference, @Args() pagination: PaginationArgs) {
  //   return this.talkService.findByConferenceId(conf.id, pagination);
  // }
  //
  // @ResolveField(() => PaginatedWorkshops)
  // workshops(@Parent() conf: Conference, @Args() pagination: PaginationArgs) {
  //   return this.workshopService.findByConferenceId(conf.id, pagination);
  // }
  //
  // Ver WORKSHOP_GUIDE.md → "Bloque 2 — Relaciones en ConferenceResolver"
}
