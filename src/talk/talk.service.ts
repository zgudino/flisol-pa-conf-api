import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PaginationArgs } from '../common/pagination/pagination.args';
import { CreateTalkInput } from './dto/create-talk.input';
import { Talk } from './talk.entity';

@Injectable()
export class TalkService {
  constructor(
    @InjectRepository(Talk)
    private readonly repo: Repository<Talk>,
  ) {}

  async create(input: CreateTalkInput): Promise<Talk> {
    const [duplicateTitle, speakerConflict] = await Promise.all([
      this.repo.findOne({
        where: { conferenceId: input.conferenceId, title: input.title },
      }),
      this.repo.findOne({
        where: {
          speakerId: input.speakerId,
          startTime: new Date(input.startTime),
        },
      }),
    ]);

    if (duplicateTitle)
      throw new ConflictException(
        'Ya existe una charla con ese título en esta conferencia',
      );
    if (speakerConflict)
      throw new ConflictException(
        'El ponente ya tiene una charla programada a esa hora',
      );

    const talk = this.repo.create({
      ...input,
      startTime: new Date(input.startTime),
      endTime: new Date(input.endTime),
    });
    return this.repo.save(talk);
  }

  async findAll(pagination: PaginationArgs) {
    const { limit, offset } = pagination;
    const [items, total] = await this.repo.findAndCount({
      take: limit,
      skip: offset,
      order: { startTime: 'ASC' },
    });
    return { items, total, limit, offset, hasNextPage: offset + limit < total };
  }

  // Retorna las talks de una conferencia con paginación
  async findByConferenceId(conferenceId: string, pagination: PaginationArgs) {
    const { limit, offset } = pagination;
    const [items, total] = await this.repo.findAndCount({
      where: { conference: { id: conferenceId } },
      take: limit,
      skip: offset,
      order: { startTime: 'ASC' },
    });
    return { items, total, limit, offset, hasNextPage: offset + limit < total };
  }

  async findOneOrFail(id: string): Promise<Talk> {
    const talk = await this.repo.findOneBy({ id });
    if (!talk) throw new NotFoundException(`Talk con ID ${id} no encontrada`);
    return talk;
  }
}
