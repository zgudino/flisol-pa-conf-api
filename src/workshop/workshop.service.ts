import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PaginationArgs } from '../common/pagination/pagination.args';
import { CreateWorkshopInput } from './dto/create-workshop.input';
import { Workshop } from './workshop.entity';

@Injectable()
export class WorkshopService {
  constructor(
    @InjectRepository(Workshop)
    private readonly repo: Repository<Workshop>,
  ) {}

  async findAll(pagination: PaginationArgs) {
    const { limit, offset } = pagination;
    const [items, total] = await this.repo.findAndCount({
      take: limit,
      skip: offset,
      order: { startTime: 'ASC' },
    });
    return { items, total, limit, offset, hasNextPage: offset + limit < total };
  }

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

  async findOneOrFail(id: string): Promise<Workshop> {
    const workshop = await this.repo.findOneBy({ id });
    if (!workshop)
      throw new NotFoundException(`Workshop con ID ${id} no encontrado`);
    return workshop;
  }

  async create(input: CreateWorkshopInput): Promise<Workshop> {
    const start = new Date(input.startTime);
    const end = new Date(input.endTime);

    if (end <= start) {
      throw new BadRequestException('endTime debe ser posterior a startTime');
    }

    const exists = await this.repo.findOneBy({
      title: input.title,
      conferenceId: input.conferenceId,
    });
    if (exists) {
      throw new ConflictException(
        `Ya existe un workshop "${input.title}" en esta conferencia`,
      );
    }

    const workshop = this.repo.create({
      ...input,
      startTime: start,
      endTime: end,
      conference: { id: input.conferenceId },
    });
    return this.repo.save(workshop);
  }
}
