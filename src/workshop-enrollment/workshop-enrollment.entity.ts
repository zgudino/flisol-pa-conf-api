import { Field, ID, ObjectType } from '@nestjs/graphql';
import {
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
} from 'typeorm';
import { Attendee } from '../attendee/attendee.entity';
import { Workshop } from '../workshop/workshop.entity';

// Tabla de unión: registra que un participante se inscribió a un workshop
@ObjectType()
@Entity()
export class WorkshopEnrollment {
  @Field(() => ID)
  @PrimaryColumn({ type: 'uuid', default: () => 'uuidv7()' })
  id: string;

  @Field(() => Attendee)
  @ManyToOne(() => Attendee)
  @JoinColumn()
  attendee: Attendee;

  @Field(() => Workshop)
  @ManyToOne(() => Workshop)
  @JoinColumn()
  workshop: Workshop;

  @Field()
  @CreateDateColumn()
  enrolledAt: Date;
}
