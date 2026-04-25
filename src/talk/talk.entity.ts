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

// TODO Bloque 2 — Agrega @ObjectType() y @Entity() a la clase
// También agrega las constraints de unicidad con @Unique():
//   @Unique(['conferenceId', 'title'])
//   @Unique(['speakerId', 'startTime'])
//
// Luego decora cada propiedad con @Field() y @Column() (o @ManyToOne / @JoinColumn)
// Nota: speakerId y conferenceId son FKs explícitas, necesarias para el DataLoader del Bloque 3
//
// Ver WORKSHOP_GUIDE.md → "Bloque 2 — Entidad Talk"
export class Talk {
  id: string;
  title: string;
  description: string;
  startTime: Date;
  endTime: Date;
  speaker: Speaker;
  conference: Conference;
  conferenceId: string;
  speakerId: string;
}
