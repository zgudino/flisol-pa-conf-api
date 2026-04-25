import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Attendee } from './attendee.entity';
import { AttendeeResolver } from './attendee.resolver';
import { AttendeeService } from './attendee.service';

@Module({
  imports: [TypeOrmModule.forFeature([Attendee])],
  providers: [AttendeeService, AttendeeResolver],
  exports: [AttendeeService],
})
export class AttendeeModule {}
