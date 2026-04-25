import { Field, ID, Int, ObjectType } from '@nestjs/graphql';
import { Column, Entity, PrimaryColumn } from 'typeorm';

// TODO Bloque 1 — Agrega @ObjectType() y @Entity() a la clase,
// luego decora cada propiedad con @Field() y @Column() (o @PrimaryColumn)
// Ver WORKSHOP_GUIDE.md → "Bloque 1 — Entidad Conference"
export class Conference {
  id: string;
  name: string;
  date: Date;
  venue: string;
  capacity: number;
}
