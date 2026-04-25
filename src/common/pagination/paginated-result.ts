import { Type } from '@nestjs/common';
import { Field, Int, ObjectType } from '@nestjs/graphql';

// Función genérica que crea un @ObjectType paginado para cualquier entidad.
// Evita duplicar la misma estructura en cada módulo.
//
// Uso:
//   @ObjectType()
//   export class PaginatedConferences extends Paginated(Conference) {}
//
// Resultado en el schema:
//   type PaginatedConferences {
//     items:       [Conference!]!
//     total:       Int!
//     limit:       Int!
//     offset:      Int!
//     hasNextPage: Boolean!
//   }
export function Paginated<T>(ItemType: Type<T>) {
  @ObjectType({ isAbstract: true })
  abstract class PaginatedType {
    @Field(() => [ItemType])
    items: T[];

    @Field(() => Int, { description: 'Total de registros sin paginación' })
    total: number;

    @Field(() => Int)
    limit: number;

    @Field(() => Int)
    offset: number;

    @Field({
      description: 'true si hay más resultados después del offset actual',
    })
    hasNextPage: boolean;
  }
  return PaginatedType;
}
