import { registerEnumType } from '@nestjs/graphql';

// Roles disponibles en el sistema
// ATTENDEE   → participante estándar — puede inscribirse a conferencias y workshops
// SPEAKER    → orador — puede ver sus talks asignadas
// ORGANIZER  → organizador — puede crear/editar conferencias, talks y workshops
export enum Role {
  ATTENDEE = 'ATTENDEE',
  SPEAKER = 'SPEAKER',
  ORGANIZER = 'ORGANIZER',
}

registerEnumType(Role, {
  name: 'Role',
  description: 'Rol del usuario en el sistema',
});
