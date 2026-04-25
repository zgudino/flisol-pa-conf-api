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

// TODO Bloque 2 — Agrega @ObjectType() y @Entity() a la clase
// También agrega @Unique(['title', 'conferenceId']) para validar unicidad
// Luego decora cada propiedad con @Field() y @Column() (o @ManyToOne / @JoinColumn)
//
// Ver WORKSHOP_GUIDE.md → "Bloque 2 — Entidad Workshop"
export class Workshop {
  id: string;
  title: string;
  capacity: number;
  level: WorkshopLevel;
  startTime: Date;
  endTime: Date;
  conference: Conference;
  conferenceId: string;
}
