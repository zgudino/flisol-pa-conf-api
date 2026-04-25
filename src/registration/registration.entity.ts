import { Field, ID, ObjectType } from '@nestjs/graphql';
import {
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
  Unique,
} from 'typeorm';
import { Attendee } from '../attendee/attendee.entity';
import { Conference } from '../conference/conference.entity';

// Tabla de unión: registra que un participante se inscribió a una conferencia
@ObjectType()
@Entity()
@Unique(['attendee', 'conference'])
export class Registration {
  @Field(() => ID)
  @PrimaryColumn({ type: 'uuid', default: () => 'uuidv7()' })
  id: string;

  @Field(() => Attendee)
  @ManyToOne(() => Attendee)
  @JoinColumn()
  attendee: Attendee;

  @Field(() => Conference)
  @ManyToOne(() => Conference)
  @JoinColumn()
  conference: Conference;

  @Field()
  @CreateDateColumn()
  registeredAt: Date;
}
