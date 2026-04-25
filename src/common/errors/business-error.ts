// Clase base para errores de flujo de negocio que se retornan como union types.
//
// DISTINCIÓN IMPORTANTE:
//
//   BusinessError (esta clase) → flujo de negocio ESPERADO → union type GraphQL
//     Ejemplos: WorkshopFullError, AlreadyEnrolledError, CapacityFullError
//     El cliente los maneja con inline fragments (... on WorkshopFullError)
//
//   NotFoundException / ForbiddenException → estado INVÁLIDO → errors[] en respuesta
//     Ejemplos: workshop no encontrado, token expirado, sin permisos
//     El cliente los detecta en el array errors[] con extensions.code
//
// Esta clase base no se usa directamente — se extiende en los servicios.
export abstract class BusinessError {
  abstract readonly message: string;
}
