import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Conference } from './conference.entity';
import { ConferenceService } from './conference.service';
import { ConferenceResolver } from './conference.resolver';
import { TalkModule } from 'src/talk/talk.module';
import { WorkshopModule } from 'src/workshop/workshop.module';

@Module({
  imports: [TypeOrmModule.forFeature([Conference]), TalkModule, WorkshopModule],
  providers: [ConferenceService, ConferenceResolver],
  exports: [ConferenceService],
})
export class ConferenceModule {}
