import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Registration } from './registration.entity';
import { RegistrationService } from './registration.service';
import { RegistrationResolver } from './registration.resolver';

@Module({
  imports: [TypeOrmModule.forFeature([Registration])],
  providers: [RegistrationService, RegistrationResolver],
  exports: [RegistrationService],
})
export class RegistrationModule {}
