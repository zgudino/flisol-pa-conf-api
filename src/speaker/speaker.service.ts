import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, QueryFailedError, Repository } from 'typeorm';
import { PaginationArgs } from '../common/pagination/pagination.args';
import { CreateSpeakerInput } from './dto/create-speaker.input';
import { PaginatedSpeakers } from './paginated-speakers.type';
import { Speaker } from './speaker.entity';

@Injectable()
export class SpeakerService {
  constructor(
    @InjectRepository(Speaker)
    private readonly repo: Repository<Speaker>,
  ) {}

  async findAll(pagination: PaginationArgs): Promise<PaginatedSpeakers> {
    const { limit, offset } = pagination;
    const [items, total] = await this.repo.findAndCount({
      take: limit,
      skip: offset,
      order: { name: 'ASC' },
    });
    return { items, total, limit, offset, hasNextPage: offset + limit < total };
  }

  async findOneOrFail(id: string): Promise<Speaker> {
    const speaker = await this.repo.findOneBy({ id });
    if (!speaker) {
      throw new NotFoundException(`Speaker con ID ${id} no encontrado`);
    }
    return speaker;
  }

  async create(input: CreateSpeakerInput): Promise<Speaker> {
    const speaker = this.repo.create({ ...input });
    try {
      return await this.repo.save(speaker);
    } catch (err) {
      if (
        err instanceof QueryFailedError &&
        (err as QueryFailedError & { code: string }).code === '23505'
      ) {
        throw new ConflictException(
          `Ya existe un speaker con el email "${input.email}"`,
        );
      }
      throw err;
    }
  }

  // Usado por SpeakerLoader — carga múltiples speakers en una sola query (batch)
  findByIds(ids: string[]): Promise<Speaker[]> {
    return this.repo.findBy({ id: In(ids) });
  }
}
