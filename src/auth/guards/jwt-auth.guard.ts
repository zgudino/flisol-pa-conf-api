import { Injectable, ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { GqlExecutionContext } from '@nestjs/graphql';

// Guard reutilizable para proteger queries y mutations con JWT
//
// Uso en un resolver:
//   @UseGuards(JwtAuthGuard)
//   @Query(() => Attendee)
//   me(@CurrentUser() user: Attendee) { return user; }
//
// IMPORTANTE: NestJS usa el contexto HTTP por defecto para los guards.
// En GraphQL hay que extraer el request del contexto GQL manualmente.
// Sin este override, el guard no encuentra el token y siempre falla.
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  getRequest(context: ExecutionContext) {
    // Convierte el contexto de ejecución NestJS al contexto GraphQL
    // para extraer el request con el header Authorization
    const ctx = GqlExecutionContext.create(context);
    return ctx.getContext<{ req: unknown }>().req;
  }
}
