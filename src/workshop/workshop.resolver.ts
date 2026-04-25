import { UseGuards } from '@nestjs/common';
import {
  Args,
  Int,
  Mutation,
  Parent,
  Query,
  ResolveField,
  Resolver,
} from '@nestjs/graphql';
import { WorkshopEnrollmentService } from 'src/workshop-enrollment/workshop-enrollment.service';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../auth/enums/role.enum';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { PaginationArgs } from '../common/pagination/pagination.args';
import { CreateWorkshopInput } from './dto/create-workshop.input';
import { PaginatedWorkshops } from './paginated-workshops.type';
import { Workshop } from './workshop.entity';
import { WorkshopService } from './workshop.service';

@Resolver(() => Workshop)
export class WorkshopResolver {
  constructor(
    private readonly workshopService: WorkshopService,
    private readonly enrollmentService: WorkshopEnrollmentService,
  ) {}

  @Query(() => PaginatedWorkshops)
  workshops(@Args() pagination: PaginationArgs): Promise<PaginatedWorkshops> {
    return this.workshopService.findAll(pagination);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ORGANIZER)
  @Mutation(() => Workshop, {
    description: 'Crea un nuevo taller (requiere rol ORGANIZER)',
  })
  createWorkshop(@Args('input') input: CreateWorkshopInput): Promise<Workshop> {
    return this.workshopService.create(input);
  }

  // TODO Bloque 2 — Agrega los campos computados del Workshop
  // Usá this.enrollmentService.countByWorkshopId(workshop.id) para obtener el conteo
  //
  // @ResolveField(() => Int)
  // async enrolledCount(@Parent() workshop: Workshop): Promise<number> {
  //   return this.enrollmentService.countByWorkshopId(workshop.id);
  // }
  //
  // @ResolveField(() => Int)
  // async availableSeats(@Parent() workshop: Workshop): Promise<number> {
  //   const count = await this.enrollmentService.countByWorkshopId(workshop.id);
  //   return workshop.capacity - count;
  // }
  //
  // @ResolveField(() => Boolean)
  // async isFull(@Parent() workshop: Workshop): Promise<boolean> {
  //   const count = await this.enrollmentService.countByWorkshopId(workshop.id);
  //   return count >= workshop.capacity;
  // }
  //
  // Ver WORKSHOP_GUIDE.md → "Bloque 2 — Campos computados en WorkshopResolver"
}
