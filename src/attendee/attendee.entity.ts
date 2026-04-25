import { Field, ID, ObjectType } from '@nestjs/graphql';
import { Column, Entity, PrimaryColumn } from 'typeorm';
import { Role } from '../auth/enums/role.enum';

@ObjectType()
@Entity()
export class Attendee {
  @Field(() => ID)
  @PrimaryColumn({ type: 'uuid', default: () => 'uuidv7()' })
  id: string;

  @Field()
  @Column()
  name: string;

  @Field()
  @Column({ unique: true })
  email: string;

  // La contraseña NO se expone en el schema GraphQL (sin @Field)
  // Esto evita que se pueda consultar desde el Playground o la API
  @Column()
  password: string;

  @Field(() => Role)
  @Column({ type: 'enum', enum: Role, default: Role.ATTENDEE })
  role: Role;
}
