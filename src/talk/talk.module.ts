import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Talk } from './talk.entity';
import { TalkService } from './talk.service';
import { TalkResolver } from './talk.resolver';
import { SpeakerLoader } from './speaker-loader.service';
import { SpeakerModule } from '../speaker/speaker.module';

@Module({
  imports: [TypeOrmModule.forFeature([Talk]), SpeakerModule],
  providers: [TalkService, TalkResolver, SpeakerLoader],
  exports: [TalkService],
})
export class TalkModule {}
