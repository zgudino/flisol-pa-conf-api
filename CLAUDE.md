# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

Proyecto del taller: De REST a GraphQL: Construye APIs modernas con NestJS
FLISol Panamá 2026 · Stack: NestJS · GraphQL (code-first) · TypeORM · PostgreSQL · TypeScript

---

## Comandos de desarrollo

```bash
docker compose up -d          # Iniciar Postgres
cp .env.sample .env           # Configurar variables (revisar JWT_SECRET)
# ⚠  .env.sample usa DB_SYNCHRONIZE=false; cámbialo a true para desarrollo local
npm install
npm run start:dev             # Iniciar en modo watch — http://localhost:3000/graphql
npm run repl                  # NestJS REPL interactivo
npm run build                 # Compilar a dist/
npm run format                # Prettier — formatear src/ y test/
npm run lint                  # ESLint con autofix
npm test                      # Jest (unit tests en src/**/*.spec.ts)
npm run test:e2e              # Jest e2e (test/jest-e2e.json) — levanta su propio Postgres vía Testcontainers, solo requiere Docker corriendo
npx jest --testPathPattern=conference  # Ejecutar un solo test
```

---

## Arquitectura

```
src/
  config/              app.config, database.config, jwt.config — NestJS ConfigModule tipado
  auth/
    strategies/        JwtStrategy — extrae y valida el token JWT
    guards/            JwtAuthGuard, RolesGuard
    decorators/        @CurrentUser(), @Roles()
    enums/             Role (ATTENDEE, SPEAKER, ORGANIZER)
    interfaces/        JwtPayload — forma del payload del token
    dto/               LoginInput con class-validator
    types/             AuthPayload (@ObjectType de retorno del login)
  conference/          Entidad + DTO + servicio + resolver (paginación + RBAC)
  talk/                Entidad + SpeakerLoader (DataLoader)
  workshop/            Entidad + DTO + servicio + resolver
  attendee/            Entidad con password y role
  registration/        Junction Attendee ↔ Conference (union errors)
  workshop-enrollment/ Junction Attendee ↔ Workshop (union errors + DataLoader)
  speaker/             Entidad provista completa
  common/
    pagination/        Paginated<T> factory function, PaginationArgs
    errors/            formatError, BusinessError
    filters/           GqlExceptionFilter
    enums/             role.enum (duplicado de auth/enums — usar el de auth en resolvers)
  main.ts              ValidationPipe global
  app.module.ts        Configuración central (GraphQL, TypeORM, JWT)
```

---

## Modelo de dominio

```
Conference ──< Talk >── Speaker
Conference ──< Workshop
Conference ──< Registration >── Attendee
Workshop   ──< WorkshopEnrollment >── Attendee
```

---

## Patrones clave de implementación

### Paginación con `Paginated<T>`

```ts
// common/pagination/paginated-result.ts exporta una factory function.
// Cada módulo crea su propio tipo paginado así:
@ObjectType()
export class PaginatedConferences extends Paginated(Conference) {}
// El tipo resultante expone: items, total, limit, offset, hasNextPage
```

### DataLoader (N+1)

Los loaders tienen `Scope.REQUEST` para que cada request tenga su propio caché.
La función batch **debe** devolver los resultados en el mismo orden que los IDs de entrada:

```ts
return ids.map((id) => items.find((item) => item.id === id)!);
```

### Union types — instancias, no objetos planos

`resolveType` identifica el tipo por `instanceof`. Usar `Object.assign(new ErrorClass(), { ... })`, nunca un objeto literal:

```ts
return Object.assign(new WorkshopFullError(), { message: 'Lleno.' });
// NO: return { message: 'Lleno.' }  ← resolveType no puede identificarlo
```

### Config tipado con NestJS ConfigModule

Los configs en `src/config/` usan `registerAs` + inyección tipada:

```ts
inject: [databaseConfig.KEY],
useFactory: (config: ConfigType<typeof databaseConfig>) => ({ ... })
```

---

## Dos patrones de error — cuándo usar cada uno

### Patrón A: union return types → errores de flujo de negocio esperado

El schema los refleja. El cliente los maneja con inline fragments.

```
WorkshopFullError, AlreadyEnrolledError, CapacityFullError
```

### Patrón B: excepciones NestJS → estado inválido / infraestructura

El `formatError` en `app.module.ts` los convierte a `extensions.code` en `errors[]`.

```
NotFoundException    → NOT_FOUND
UnauthorizedException → UNAUTHENTICATED
ForbiddenException   → FORBIDDEN
ConflictException    → CONFLICT
```

---

## Convenciones

- Los mensajes de commits siempre deben estar escritos en inglés.
- Resolvers delgados — lógica de negocio en los servicios.
- `findOneOrFail` en servicios — nunca retornar null, siempre `NotFoundException`.
- Contraseñas: nunca `@Field()` en entidades, nunca texto plano en BD.
- DataLoaders con `Scope.REQUEST` — caché por petición, nunca compartir entre requests.
- Union types con `createUnionType()` — siempre definir `resolveType`.
- `DB_SYNCHRONIZE=true` solo en desarrollo local — nunca en producción.
