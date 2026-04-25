import { Injectable, NotFoundException } from '@nestjs/common';
import { Field, ObjectType } from '@nestjs/graphql';
import { InjectRepository } from '@nestjs/typeorm';
import { Registration } from 'src/registration/registration.entity';
import { Workshop } from 'src/workshop/workshop.entity';
import { DataSource, Repository } from 'typeorm';
import { WorkshopEnrollment } from './workshop-enrollment.entity';

@ObjectType()
export class EnrollSuccess {
  @Field(() => WorkshopEnrollment)
  enrollment: WorkshopEnrollment;
}

@ObjectType()
export class WorkshopFullError {
  @Field()
  message: string;
}

@ObjectType()
export class AlreadyEnrolledError {
  @Field()
  message: string;
}

@ObjectType()
export class ConferenceNotRegisteredError {
  @Field()
  message: string;
}

@Injectable()
export class WorkshopEnrollmentService {
  constructor(
    @InjectRepository(WorkshopEnrollment)
    private readonly repo: Repository<WorkshopEnrollment>,
    private readonly dataSource: DataSource,
  ) {}

  countByWorkshopId(workshopId: string): Promise<number> {
    return this.repo.countBy({ workshop: { id: workshopId } });
  }

  // Versión batch — usada por EnrollmentCountLoader para resolver el N+1
  async countsByWorkshopIds(
    workshopIds: string[],
  ): Promise<{ workshopId: string; count: number }[]> {
    const results = await this.repo
      .createQueryBuilder('e')
      .select('e.workshopId', 'workshopId')
      .addSelect('COUNT(*)', 'count')
      .where('e.workshopId IN (:...ids)', { ids: workshopIds })
      .groupBy('e.workshopId')
      .getRawMany<{ workshopId: string; count: number }>();
    return results.map((r) => ({
      workshopId: r.workshopId,
      count: Number(r.count),
    }));
  }

  // Patrón B — estado inválido → NotFoundException
  //   Si el workshop no existe: throw new NotFoundException(...)
  //
  // Patrón A — flujo de negocio esperado → union type
  //   Si ya inscripto:  return AlreadyEnrolledError
  //   Si lleno:         return WorkshopFullError
  //   Si ok:            crear WorkshopEnrollment en transacción → EnrollSuccess
  //
  // Bonus: verificar que el attendee esté registrado en la conferencia
  async enrollInWorkshop(
    attendeeId: string,
    workshopId: string,
  ): Promise<EnrollSuccess | WorkshopFullError | AlreadyEnrolledError> {
    return this.dataSource.transaction(async (em) => {
      // Patrón B: estado inválido → excepción (llega en errors[] con code: NOT_FOUND)
      const workshop = await em.findOne(Workshop, {
        where: { id: workshopId },
        relations: ['conference'],
      });
      if (!workshop) {
        throw new NotFoundException(
          `Workshop con ID ${workshopId} no encontrado`,
        );
      }

      // Patrón A: flujo esperado → union type (cliente lo maneja con inline fragments)

      // ¿Ya está inscripto?
      const alreadyEnrolled = await em.countBy(WorkshopEnrollment, {
        attendee: { id: attendeeId },
        workshop: { id: workshopId },
      });
      if (alreadyEnrolled > 0) {
        return Object.assign(new AlreadyEnrolledError(), {
          message: 'Ya estás inscripto en este workshop.',
        });
      }

      // ¿Registrado en la conferencia? (requisito previo)
      const registeredInConference = await em.countBy(Registration, {
        attendee: { id: attendeeId },
        conference: { id: workshop.conference.id },
      });
      if (registeredInConference === 0) {
        return Object.assign(new ConferenceNotRegisteredError(), {
          message:
            'Debés registrarte en la conferencia antes de inscribirte en un workshop.',
        });
      }

      // ¿Hay cupo?
      const currentCount = await em.countBy(WorkshopEnrollment, {
        workshop: { id: workshopId },
      });
      if (currentCount >= workshop.capacity) {
        return Object.assign(new WorkshopFullError(), {
          message: 'Este workshop está lleno.',
        });
      }

      // Todo ok — inscribir
      const enrollment = em.create(WorkshopEnrollment, {
        attendee: { id: attendeeId },
        workshop: { id: workshopId },
      });
      await em.save(enrollment);
      const saved = await em.findOne(WorkshopEnrollment, {
        where: { id: enrollment.id },
        relations: ['attendee', 'workshop'],
      });
      return Object.assign(new EnrollSuccess(), { enrollment: saved });
    });
  }
}
