# CLAUDE.md — conf-api

Proyecto del taller: De REST a GraphQL: Construye APIs modernas con NestJS
FLISol Panamá 2026 · Stack: NestJS · GraphQL (code-first) · TypeORM · PostgreSQL · TypeScript

---

## Arquitectura

```
src/
  auth/
    strategies/        JwtStrategy — extrae y valida el token JWT
    guards/            JwtAuthGuard, RolesGuard
    decorators/        @CurrentUser(), @Roles()
    enums/             Role (ATTENDEE, SPEAKER, ORGANIZER)
    dto/               LoginInput con class-validator
    types/             AuthPayload (@ObjectType de retorno del login)
  conference/          Entidad + DTO + servicio + resolver (con paginación y RBAC)
  talk/                Entidad + SpeakerLoader (DataLoader)
  workshop/            Entidad + DTO + servicio + resolver
  attendee/            Entidad con password y role
  registration/        Junction Attendee ↔ Conference (union errors)
  workshop-enrollment/ Junction Attendee ↔ Workshop (union errors + DataLoader)
  speaker/             Entidad provista completa
  common/
    scalars/           DateTimeScalar
    pagination/        PaginationArgs, Paginated<T>
    errors/            formatError, BusinessError
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

## Dos patrones de error — cuándo usar cada uno

### Patrón A: union return types → errores de flujo de negocio esperado
El schema los refleja. El cliente los maneja con inline fragments.
```
WorkshopFullError, AlreadyEnrolledError, CapacityFullError
```

### Patrón B: excepciones NestJS → estado inválido / infraestructura
El error-formatter los convierte a extensions.code en errors[].
```
NotFoundException    → NOT_FOUND
UnauthorizedException → UNAUTHENTICATED
ForbiddenException   → FORBIDDEN
ConflictException    → CONFLICT
```

---

## Conceptos GraphQL cubiertos

| Concepto | Dónde |
|---|---|
| `@ObjectType` / `@Field` | Todas las entidades |
| `@InputType` + class-validator | DTOs en cada módulo |
| `@ArgsType` | PaginationArgs |
| `@ResolveField` + `@Parent` | Campos computados, DataLoader |
| Escalar personalizado | DateTimeScalar |
| Enum | WorkshopLevel, Role |
| DataLoader (N+1) | SpeakerLoader, EnrollmentCountLoader |
| Union return types | registerForConference, enrollInWorkshop |
| formatError | app.module.ts |
| Guards en GraphQL | JwtAuthGuard, RolesGuard |
| `@CurrentUser()` | registration.resolver, workshop-enrollment.resolver |

---

## Comandos de desarrollo

```bash
docker compose up -d          # Iniciar Postgres
cp .env.example .env          # Configurar variables
npm install                   # Instalar dependencias
npm run start:dev             # Iniciar en modo watch
# Playground: http://localhost:3000/graphql
```

---

## Convenciones

- Los mensajes de commits siempre deben estar escritos en inglés.
- Resolvers delgados — lógica de negocio en los servicios
- `findOneOrFail` en servicios — nunca retornar null, siempre NotFoundException
- Contraseñas: nunca @Field() en entidades, nunca texto plano en BD
- DataLoaders con Scope.REQUEST — caché por petición, nunca compartir entre requests
- Union types con `createUnionType()` — siempre definir `resolveType`
