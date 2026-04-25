import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { GqlExecutionContext } from '@nestjs/graphql';
import { Role } from '../../common/enums/role.enum';
import { ROLES_KEY } from '../decorators/roles.decorator';

// Guard de autorización basado en roles (RBAC)
// Debe usarse SIEMPRE junto con JwtAuthGuard — primero autentica, luego autoriza:
//   @UseGuards(JwtAuthGuard, RolesGuard)
//   @Roles(Role.ORGANIZER)
//
// Flujo:
//   1. Lee los roles requeridos del metadata seteado por @Roles()
//   2. Extrae request.user (seteado por JwtAuthGuard / JwtStrategy)
//   3. Verifica que user.role esté incluido en los roles requeridos
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // Obtener los roles requeridos del decorator @Roles()
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // Si no hay @Roles() definido, el endpoint no requiere rol específico
    if (!requiredRoles || requiredRoles.length === 0) return true;

    // Extraer el usuario del contexto GraphQL (seteado por JwtStrategy.validate())
    const ctx = GqlExecutionContext.create(context);
    const { req } = ctx.getContext<{ req: { user?: { role: Role } } }>();
    const user = req.user;

    if (!user) return false;

    // Verificar si el rol del usuario está entre los roles requeridos
    return requiredRoles.includes(user.role);
  }
}
