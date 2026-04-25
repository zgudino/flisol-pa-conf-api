import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WorkshopEnrollment } from './workshop-enrollment.entity';
import { WorkshopEnrollmentService } from './workshop-enrollment.service';
import { WorkshopEnrollmentResolver } from './workshop-enrollment.resolver';
import { EnrollmentCountLoader } from './enrollment-count-loader.service';

@Module({
  imports: [TypeOrmModule.forFeature([WorkshopEnrollment])],
  providers: [
    WorkshopEnrollmentService,
    WorkshopEnrollmentResolver,
    EnrollmentCountLoader,
  ],
  exports: [WorkshopEnrollmentService, EnrollmentCountLoader],
})
export class WorkshopEnrollmentModule {}
