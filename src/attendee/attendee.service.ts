import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PaginationArgs } from '../common/pagination/pagination.args';
import { Attendee } from './attendee.entity';
import { PaginatedAttendees } from './paginated-attendees.type';

@Injectable()
export class AttendeeService {
  constructor(
    @InjectRepository(Attendee)
    private readonly repo: Repository<Attendee>,
  ) {}

  async findAll(pagination: PaginationArgs): Promise<PaginatedAttendees> {
    const { limit, offset } = pagination;
    const [items, total] = await this.repo.findAndCount({
      take: limit,
      skip: offset,
      order: { name: 'ASC' },
    });
    return { items, total, limit, offset, hasNextPage: offset + limit < total };
  }

  // Lanza NotFoundException si el participante no existe
  // Se formatea como NOT_FOUND en la respuesta GraphQL por el error-formatter
  async findOneOrFail(id: string): Promise<Attendee> {
    const attendee = await this.repo.findOneBy({ id });
    if (!attendee) {
      throw new NotFoundException(`Participante con ID ${id} no encontrado`);
    }
    return attendee;
  }
}
