import { Field, ID, ObjectType } from '@nestjs/graphql';
import { Conference } from 'src/conference/conference.entity';
import { Speaker } from 'src/speaker/speaker.entity';
import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
  Unique,
} from 'typeorm';

@ObjectType()
@Entity()
@Unique(['conferenceId', 'title'])
@Unique(['speakerId', 'startTime'])
export class Talk {
  @Field(() => ID)
  @PrimaryColumn({ type: 'uuid', default: () => 'uuidv7()' })
  id: string;

  @Field()
  @Column()
  title: string;

  @Field({ nullable: true })
  @Column({ nullable: true })
  description: string;

  @Field()
  @Column({ type: 'timestamptz' })
  startTime: Date;

  @Field()
  @Column({ type: 'timestamptz' })
  endTime: Date;

  @Field(() => Speaker)
  @ManyToOne(() => Speaker)
  @JoinColumn()
  speaker: Speaker;

  @ManyToOne(() => Conference)
  @JoinColumn()
  conference: Conference;

  @Column()
  conferenceId: string;

  @Column()
  speakerId: string;
}
