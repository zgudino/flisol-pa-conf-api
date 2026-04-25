import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Workshop } from './workshop.entity';
import { WorkshopService } from './workshop.service';
import { WorkshopResolver } from './workshop.resolver';
import { WorkshopEnrollmentModule } from 'src/workshop-enrollment/workshop-enrollment.module';

@Module({
  imports: [TypeOrmModule.forFeature([Workshop]), WorkshopEnrollmentModule],
  providers: [WorkshopService, WorkshopResolver],
  exports: [WorkshopService],
})
export class WorkshopModule {}
