import { UseGuards } from '@nestjs/common';
import {
  Args,
  Mutation,
  Parent,
  Query,
  ResolveField,
  Resolver,
} from '@nestjs/graphql';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { Role } from 'src/auth/enums/role.enum';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { PaginationArgs } from 'src/common/pagination/pagination.args';
import { Speaker } from 'src/speaker/speaker.entity';
import { CreateTalkInput } from './dto/create-talk.input';
import { PaginatedTalks } from './paginated-talks.type';
import { SpeakerLoader } from './speaker-loader.service';
import { Talk } from './talk.entity';
import { TalkService } from './talk.service';

@Resolver(() => Talk)
export class TalkResolver {
  constructor(
    private readonly talkService: TalkService,
    private readonly speakerLoader: SpeakerLoader,
  ) {}

  @Query(() => PaginatedTalks, {
    description: 'Lista paginada de charlas de una conferencia',
  })
  talks(@Args() pagination: PaginationArgs) {
    return this.talkService.findAll(pagination);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ORGANIZER)
  @Mutation(() => Talk, {
    description: 'Crea una nueva charla (requiere rol ORGANIZER)',
  })
  createTalk(@Args('input') input: CreateTalkInput): Promise<Talk> {
    return this.talkService.create(input);
  }

  @ResolveField(() => Speaker)
  speaker(@Parent() talk: Talk): Promise<Speaker> {
    // TODO Bloque 3 — SpeakerLoader usa una implementación naive que produce N+1
    // Implementá el DataLoader real en src/talk/speaker-loader.service.ts
    return this.speakerLoader.load(talk.speakerId);
  }
}
