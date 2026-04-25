import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Speaker } from './speaker.entity';
import { SpeakerService } from './speaker.service';
import { SpeakerResolver } from './speaker.resolver';

@Module({
  imports: [TypeOrmModule.forFeature([Speaker])],
  providers: [SpeakerService, SpeakerResolver],
  exports: [SpeakerService],
})
export class SpeakerModule {}
