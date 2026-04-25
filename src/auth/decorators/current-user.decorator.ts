import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';

// Decorador de parámetro @CurrentUser()
// Extrae el usuario autenticado del contexto GraphQL y lo inyecta en el parámetro
// del resolver. El usuario fue colocado en request.user por JwtStrategy.validate().
//
// Uso en un resolver (requiere @UseGuards(JwtAuthGuard) previo):
//   @UseGuards(JwtAuthGuard)
//   @Query(() => Attendee)
//   me(@CurrentUser() user: Attendee): Attendee {
//     return user;
//   }
export const CurrentUser = createParamDecorator(
  (_data: unknown, context: ExecutionContext) => {
    const ctx = GqlExecutionContext.create(context);
    return ctx.getContext<{ req: { user: unknown } }>().req.user;
  },
);
