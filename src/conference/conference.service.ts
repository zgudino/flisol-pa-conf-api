import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { QueryFailedError, Repository } from 'typeorm';
import { PaginationArgs } from '../common/pagination/pagination.args';
import { Conference } from './conference.entity';
import { CreateConferenceInput } from './dto/create-conference.input';
import { PaginatedConferences } from './paginated-conferences.type';

@Injectable()
export class ConferenceService {
  constructor(
    @InjectRepository(Conference)
    private readonly repo: Repository<Conference>,
  ) {}

  // Paginación simple: retorna items, total y hasNextPage
  async findAll(pagination: PaginationArgs): Promise<PaginatedConferences> {
    const { limit, offset } = pagination;
    const [items, total] = await this.repo.findAndCount({
      take: limit,
      skip: offset,
      order: { date: 'ASC' },
    });
    return { items, total, limit, offset, hasNextPage: offset + limit < total };
  }

  // Lanza NotFoundException si no existe — se formatea como NOT_FOUND en GraphQL
  async findOneOrFail(id: string): Promise<Conference> {
    const conference = await this.repo.findOneBy({ id });
    if (!conference) {
      throw new NotFoundException(`Conferencia con ID ${id} no encontrada`);
    }
    return conference;
  }

  async create(input: CreateConferenceInput): Promise<Conference> {
    const conference = this.repo.create({
      ...input,
      date: new Date(input.date),
    });
    try {
      return await this.repo.save(conference);
    } catch (err) {
      if (
        err instanceof QueryFailedError &&
        (err as QueryFailedError & { code: string }).code === '23505'
      ) {
        throw new ConflictException(
          `Ya existe una conferencia con el nombre "${input.name}"`,
        );
      }
      throw err;
    }
  }
}
