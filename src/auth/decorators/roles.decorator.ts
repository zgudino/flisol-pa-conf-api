import { SetMetadata } from '@nestjs/common';
import { Role } from '../../common/enums/role.enum';

// Clave usada para guardar/leer los roles en el metadata del decorador
export const ROLES_KEY = 'roles';

// Decorador @Roles() — especifica qué roles pueden acceder a un resolver
//
// Uso:
//   @UseGuards(JwtAuthGuard, RolesGuard)
//   @Roles(Role.ORGANIZER)
//   @Mutation(() => Conference)
//   createConference(...) {}
//
// Se puede combinar múltiples roles (OR — cualquiera de ellos):
//   @Roles(Role.ORGANIZER, Role.SPEAKER)
export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);
