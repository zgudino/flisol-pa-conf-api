import { Field, ObjectType } from '@nestjs/graphql';
import { Attendee } from '../../attendee/attendee.entity';

// Tipo de retorno del @ObjectType para la mutación login
// El cliente recibe el token JWT y los datos básicos del usuario
@ObjectType()
export class AuthPayload {
  @Field({
    description:
      'Token JWT — incluirlo en el header: Authorization: Bearer <token>',
  })
  token: string;

  @Field(() => Attendee)
  user: Attendee;
}
