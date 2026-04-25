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

  // TODO Bloque 4 — Implementa enrollInWorkshop()
  //
  // Patrón B — estado inválido → NotFoundException (aparece en errors[] del response)
  //   Si el workshop no existe: throw new NotFoundException(...)
  //
  // Patrón A — flujo de negocio esperado → union type (cliente maneja con inline fragments)
  //   Si ya inscripto:            return Object.assign(new AlreadyEnrolledError(), { message: '...' })
  //   Bonus — si no registrado:   return Object.assign(new ConferenceNotRegisteredError(), { message: '...' })
  //   Si lleno:                   return Object.assign(new WorkshopFullError(), { message: '...' })
  //   Si ok:                      crear WorkshopEnrollment en transacción y return EnrollSuccess
  //
  // Tip: usá this.dataSource.transaction(async (em) => { ... })
  //      para ejecutar todo en una sola transacción
  //
  // Ver WORKSHOP_GUIDE.md → "Bloque 4 — Ejercicio: enrollInWorkshop"
  async enrollInWorkshop(
    _attendeeId: string,
    _workshopId: string,
  ): Promise<
    | EnrollSuccess
    | WorkshopFullError
    | AlreadyEnrolledError
    | ConferenceNotRegisteredError
  > {
    throw new Error('Not implemented — ver Bloque 4');
  }
}
