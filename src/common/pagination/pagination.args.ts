import { ArgsType, Field, Int } from '@nestjs/graphql';
import { IsInt, IsOptional, Max, Min } from 'class-validator';

// Argumentos de paginación reutilizables en cualquier query con @Args()
// Ejemplo: conferences(limit: 10, offset: 0) { items { id } total hasNextPage }
@ArgsType()
export class PaginationArgs {
  @Field(() => Int, {
    nullable: true,
    defaultValue: 10,
    description: 'Cantidad de resultados a retornar',
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  limit: number = 10;

  @Field(() => Int, {
    nullable: true,
    defaultValue: 0,
    description: 'Cantidad de resultados a saltear',
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  offset: number = 0;
}
