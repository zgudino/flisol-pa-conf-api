import { UseGuards } from '@nestjs/common';
import { Args, ID, Mutation, Query, Resolver } from '@nestjs/graphql';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../auth/enums/role.enum';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { PaginationArgs } from '../common/pagination/pagination.args';
import { CreateSpeakerInput } from './dto/create-speaker.input';
import { PaginatedSpeakers } from './paginated-speakers.type';
import { Speaker } from './speaker.entity';
import { SpeakerService } from './speaker.service';

@Resolver(() => Speaker)
export class SpeakerResolver {
  constructor(private readonly speakerService: SpeakerService) {}

  @Query(() => PaginatedSpeakers, { description: 'Lista paginada de speakers' })
  speakers(@Args() pagination: PaginationArgs): Promise<PaginatedSpeakers> {
    return this.speakerService.findAll(pagination);
  }

  @Query(() => Speaker)
  speaker(@Args('id', { type: () => ID }) id: string): Promise<Speaker> {
    return this.speakerService.findOneOrFail(id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ORGANIZER)
  @Mutation(() => Speaker, {
    description: 'Crea un nuevo speaker (requiere rol ORGANIZER)',
  })
  createSpeaker(@Args('input') input: CreateSpeakerInput): Promise<Speaker> {
    return this.speakerService.create(input);
  }
}
