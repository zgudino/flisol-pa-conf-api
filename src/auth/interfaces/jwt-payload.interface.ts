import { Role } from '../../common/enums/role.enum';

// Shape del payload que se firma dentro del JWT
// sub   → ID del usuario (estándar JWT: "subject")
// email → incluido para evitar una query extra en cada request
// role  → incluido para que RolesGuard no necesite ir a la BD
export interface JwtPayload {
  sub: string;
  email: string;
  role: Role;
}
