import { Field, ID, Int, ObjectType, registerEnumType } from '@nestjs/graphql';
import { Conference } from 'src/conference/conference.entity';
import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
  Unique,
} from 'typeorm';

export enum WorkshopLevel {
  BEGINNER = 'BEGINNER',
  INTERMEDIATE = 'INTERMEDIATE',
  ADVANCED = 'ADVANCED',
}

registerEnumType(WorkshopLevel, {
  name: 'WorkshopLevel',
  description: 'Nivel de experiencia requerido para el workshop',
});

@ObjectType()
@Entity()
@Unique(['title', 'conferenceId'])
export class Workshop {
  @Field(() => ID)
  @PrimaryColumn({ type: 'uuid', default: () => 'uuidv7()' })
  id: string;

  @Field()
  @Column()
  title: string;

  @Field(() => Int)
  @Column()
  capacity: number;

  @Field(() => WorkshopLevel)
  @Column({ type: 'enum', enum: WorkshopLevel })
  level: WorkshopLevel;

  @Field()
  @Column({ type: 'timestamptz' })
  startTime: Date;

  @Field()
  @Column({ type: 'timestamptz' })
  endTime: Date;

  @ManyToOne(() => Conference)
  @JoinColumn()
  conference: Conference;

  @Column()
  conferenceId: string;
}
