import { Injectable, NotFoundException } from '@nestjs/common';
import { Field, ObjectType } from '@nestjs/graphql';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Conference } from '../conference/conference.entity';
import { Registration } from './registration.entity';

@ObjectType()
export class RegistrationSuccess {
  @Field(() => Registration)
  registration: Registration;
}

@ObjectType()
export class AlreadyRegisteredError {
  @Field()
  message: string;
}

@ObjectType()
export class CapacityFullError {
  @Field()
  message: string;
}

@Injectable()
export class RegistrationService {
  constructor(
    @InjectRepository(Registration)
    private readonly repo: Repository<Registration>,
    private readonly dataSource: DataSource,
  ) {}

  countByConferenceId(conferenceId: string): Promise<number> {
    return this.repo.countBy({ conference: { id: conferenceId } });
  }

  async existsByAttendeeAndConference(
    attendeeId: string,
    conferenceId: string,
  ): Promise<boolean> {
    const n = await this.repo.countBy({
      attendee: { id: attendeeId },
      conference: { id: conferenceId },
    });
    return n > 0;
  }

  // Patrón B — estado inválido → NotFoundException (no union type)
  //   Si la conferencia no existe: throw new NotFoundException(...)
  //
  // Patrón A — flujo esperado → union type
  //   Si está llena: return Object.assign(new CapacityFullError(), { message: '...' })
  //   Si ok: crear Registration dentro de una transacción → RegistrationSuccess
  async registerForConference(attendeeId: string, conferenceId: string) {
    return this.dataSource.transaction(async (em) => {
      // Patrón B: no existe → excepción
      const conference = await em.findOneBy(Conference, { id: conferenceId });
      if (!conference)
        throw new NotFoundException(
          `Conferencia ${conferenceId} no encontrada`,
        );

      // Patrón A: ya registrado → union type
      const alreadyRegistered = await em.countBy(Registration, {
        attendee: { id: attendeeId },
        conference: { id: conferenceId },
      });
      if (alreadyRegistered > 0)
        return Object.assign(new AlreadyRegisteredError(), {
          message: 'Ya estás inscrito en esta conferencia.',
        });

      // Patrón A: llena → union type
      const count = await em.countBy(Registration, {
        conference: { id: conferenceId },
      });
      if (count >= conference.capacity)
        return Object.assign(new CapacityFullError(), {
          message: 'La conferencia está llena.',
        });

      const registration = em.create(Registration, {
        attendee: { id: attendeeId },
        conference: { id: conferenceId },
      });
      await em.save(registration);
      const saved = await em.findOne(Registration, {
        where: { id: registration.id },
        relations: ['attendee', 'conference'],
      });
      return Object.assign(new RegistrationSuccess(), { registration: saved });
    });
  }
}
