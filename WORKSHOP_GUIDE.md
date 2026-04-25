# Guía del Taller
## De REST a GraphQL: Construye APIs modernas con NestJS
### FLISol Panamá 2026

**Duración:** 2.5 horas · **Rama:** `starter` (estás aquí) · `solution` (completo)

---

## Inicio rápido

```bash
git clone <url> && cd conf-api
git checkout starter          # rama del taller (este archivo)
cp .env.example .env          # completar JWT_SECRET
docker compose up -d
npm install
npm run start:dev
# http://localhost:3000/graphql
```

---

## Qué ya está provisto en la rama `starter`

| Módulo | Estado |
|--------|--------|
| `auth/` — login, JWT, guards, decoradores | ✅ Completo |
| `speaker/` — entidad, queries | ✅ Completo |
| `attendee/` — entidad, queries | ✅ Completo |
| `registration/` — `registerForConference` (demo del Bloque 4) | ✅ Completo |
| `common/` — paginación, errores, scalars | ✅ Completo |
| Módulos, servicios y DTOs de todos los módulos | ✅ Completo |
| Entidad `Conference` | ⬜ Bloque 1 — Demo |
| Entidades `Talk` y `Workshop` | ⬜ Bloque 2 — Ejercicio |
| Relaciones en `ConferenceResolver` | ⬜ Bloque 2 — Ejercicio |
| Campos computados en `WorkshopResolver` | ⬜ Bloque 2 — Ejercicio |
| DataLoaders (`SpeakerLoader`, `EnrollmentCountLoader`) | ⬜ Bloque 3 — Ejercicio |
| Mutación `enrollInWorkshop` | ⬜ Bloque 4 — Ejercicio |

> Cada archivo a completar tiene un comentario `// TODO Bloque N` que indica exactamente dónde escribir.

---

## Dos patrones de error — leer antes de empezar

Esta distinción es fundamental en todo el taller:

| Situación | Herramienta | Resultado en la respuesta |
|---|---|---|
| Flujo de negocio **esperado** | Union return type | En el campo de la mutación |
| Estado **inválido** / infraestructura | Excepción NestJS | En el array `errors[]` |

```typescript
// Patrón B — estado inválido → excepción (llega en errors[] con code: NOT_FOUND)
const workshop = await this.repo.findOneBy({ id });
if (!workshop) throw new NotFoundException(`Workshop ${id} no encontrado`);

// Patrón A — flujo esperado → union type (el cliente usa inline fragments)
if (count >= workshop.capacity)
  return Object.assign(new WorkshopFullError(), { message: 'Este workshop está lleno.' });
```

---

## Bloque 1 — Entidad `Conference` — *Demo (instructor)* `(0:25 – 0:45)`

> Buscá el comentario `// TODO Bloque 1` en `src/conference/conference.entity.ts` para saber dónde escribir.

**Archivo:** `src/conference/conference.entity.ts`

```typescript
@ObjectType()
@Entity()
export class Conference {
  @Field(() => ID)
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Field()
  @Column()
  name: string;

  @Field()
  @Column({ type: 'timestamptz' })
  date: Date;

  @Field()
  @Column()
  venue: string;

  @Field(() => Int)
  @Column()
  capacity: number;
}
```

**Verificar** — la query ya está paginada con `PaginationArgs`:
```graphql
query {
  conferences(limit: 5, offset: 0) {
    items { id name venue }
    total
    hasNextPage
  }
}
```

---

## Bloque 2 — Entidades, relaciones y campos computados — *Ejercicio* `(0:45 – 1:20)`

> Buscá los comentarios `// TODO Bloque 2` en los archivos indicados para saber dónde escribir.

### Entidad Talk — `src/talk/talk.entity.ts`

```typescript
@ObjectType()
@Entity()
export class Talk {
  @Field(() => ID)
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Field()
  @Column()
  title: string;

  @Field({ nullable: true })
  @Column({ nullable: true })
  description: string;

  @Field()
  @Column({ type: 'timestamptz' })
  startTime: Date;

  @Field()
  @Column({ type: 'timestamptz' })
  endTime: Date;

  @Field(() => Speaker)
  @ManyToOne(() => Speaker)
  @JoinColumn()
  speaker: Speaker;

  @ManyToOne(() => Conference)
  @JoinColumn()
  conference: Conference;

  // FKs explícitas — necesarias para el DataLoader en el Bloque 3
  @Column()
  conferenceId: string;

  @Column()
  speakerId: string;
}
```

### Entidad Workshop — `src/workshop/workshop.entity.ts`

```typescript
@ObjectType()
@Entity()
export class Workshop {
  @Field(() => ID)
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Field()
  @Column()
  title: string;

  @Field(() => Int)
  @Column()
  capacity: number;

  @Field(() => WorkshopLevel)
  @Column({ type: 'enum', enum: WorkshopLevel })
  level: WorkshopLevel;

  @Field()
  @Column({ type: 'timestamptz' })
  startTime: Date;

  @Field()
  @Column({ type: 'timestamptz' })
  endTime: Date;

  @ManyToOne(() => Conference)
  @JoinColumn()
  conference: Conference;

  @Column()
  conferenceId: string;
}
```

### Relaciones en ConferenceResolver

```typescript
@ResolveField()
talks(@Parent() conf: Conference, @Args() pagination: PaginationArgs) {
  return this.talkService.findByConferenceId(conf.id, pagination);
}

@ResolveField()
workshops(@Parent() conf: Conference, @Args() pagination: PaginationArgs) {
  return this.workshopService.findByConferenceId(conf.id, pagination);
}
```

### Campos computados en WorkshopResolver

```typescript
@ResolveField(() => Int)
async enrolledCount(@Parent() workshop: Workshop): Promise<number> {
  return this.enrollmentService.countByWorkshopId(workshop.id);
}

@ResolveField(() => Int)
async availableSeats(@Parent() workshop: Workshop): Promise<number> {
  const count = await this.enrollmentService.countByWorkshopId(workshop.id);
  return workshop.capacity - count;
}

@ResolveField(() => Boolean)
async isFull(@Parent() workshop: Workshop): Promise<boolean> {
  const count = await this.enrollmentService.countByWorkshopId(workshop.id);
  return count >= workshop.capacity;
}
```

---

## Bloque 3 — N+1 & DataLoader — *Ejercicio* `(1:20 – 1:50)`

> Buscá los comentarios `// TODO Bloque 3` en los archivos indicados para saber dónde escribir.

### Detectar el N+1

`logging: ['query']` ya está activo. Ejecutá esta query y contá las SQL en la terminal:

```graphql
query {
  conferences(limit: 5) {
    items {
      talks(limit: 10) {
        items { title speaker { name } }
      }
    }
  }
}
```

Con 10 talks: 11 queries. Con 50 talks: 51 queries. Ese es el N+1.

### Estado inicial en la rama `starter` (naive — N+1 presente)

El `SpeakerLoader` en la rama `starter` usa llamadas directas al servicio:

```typescript
// src/talk/speaker-loader.service.ts — estado inicial
load(id: string): Promise<Speaker> {
  return this.speakerService.findOneOrFail(id); // 1 query por speaker → N+1
}
```

Tu tarea: reemplazá esta implementación con un `DataLoader` real (ver abajo).

### SpeakerLoader — `src/talk/speaker-loader.service.ts`

```typescript
@Injectable({ scope: Scope.REQUEST })
export class SpeakerLoader {
  loader: DataLoader<string, Speaker>;

  constructor(private readonly speakerService: SpeakerService) {
    this.loader = new DataLoader(async (ids: readonly string[]) => {
      const speakers = await speakerService.findByIds([...ids]);
      // IMPORTANTE: retornar en el MISMO orden que los ids de entrada
      return ids.map(id => speakers.find(s => s.id === id));
    });
  }

  load(id: string): Promise<Speaker> {
    return this.loader.load(id);
  }
}
```

Usar en TalkResolver:
```typescript
@ResolveField(() => Speaker)
speaker(@Parent() talk: Talk): Promise<Speaker> {
  return this.speakerLoader.load(talk.speakerId);
}
```

### EnrollmentCountLoader — `src/workshop-enrollment/enrollment-count-loader.service.ts`

```typescript
@Injectable({ scope: Scope.REQUEST })
export class EnrollmentCountLoader {
  loader: DataLoader<string, number>;

  constructor(private readonly enrollmentService: WorkshopEnrollmentService) {
    this.loader = new DataLoader(async (ids: readonly string[]) => {
      const counts = await enrollmentService.countsByWorkshopIds([...ids]);
      return ids.map(id => counts.find(c => c.workshopId === id)?.count ?? 0);
    });
  }

  load(workshopId: string): Promise<number> {
    return this.loader.load(workshopId);
  }
}
```

---

## Bloque 4 — Mutaciones, union errors, autenticación — *Demo + Ejercicio* `(1:50 – 2:25)`

> El instructor demuestra `registerForConference` (ya implementado en `src/registration/`).
> Tu ejercicio: implementá `enrollInWorkshop` — buscá `// TODO Bloque 4` en los archivos indicados.

### Demo: registerForConference

```typescript
// registration.service.ts
async registerForConference(attendeeId: string, conferenceId: string) {
  return this.dataSource.transaction(async (em) => {
    // Patrón B: no existe → excepción
    const conference = await em.findOneBy(Conference, { id: conferenceId });
    if (!conference) throw new NotFoundException(`Conferencia ${conferenceId} no encontrada`);

    // Patrón A: llena → union type
    const count = await em.countBy(Registration, { conference: { id: conferenceId } });
    if (count >= conference.capacity)
      return Object.assign(new CapacityFullError(), { message: 'La conferencia está llena.' });

    const registration = em.create(Registration, {
      attendee:   { id: attendeeId },
      conference: { id: conferenceId },
    });
    await em.save(registration);
    return Object.assign(new RegistrationSuccess(), { registration });
  });
}
```

Union type y mutación con `@CurrentUser()`:
```typescript
// registration.resolver.ts
export const RegisterForConferenceResult = createUnionType({
  name: 'RegisterForConferenceResult',
  types: () => [RegistrationSuccess, CapacityFullError] as const,
  resolveType(value) {
    if (value instanceof RegistrationSuccess) return RegistrationSuccess;
    if (value instanceof CapacityFullError)   return CapacityFullError;
  },
});

@UseGuards(JwtAuthGuard)
@Mutation(() => RegisterForConferenceResult)
registerForConference(
  @CurrentUser() user: Attendee,      // attendeeId viene del token, no del input
  @Args('input') input: RegisterForConferenceInput,
) {
  return this.registrationService.registerForConference(user.id, input.conferenceId);
}
```

### Ejercicio: enrollInWorkshop

Implementar en `workshop-enrollment.service.ts` y `workshop-enrollment.resolver.ts`:
- `NotFoundException` si el workshop no existe
- `AlreadyEnrolledError` si ya está inscripto
- `WorkshopFullError` si no hay cupos
- `EnrollSuccess` si todo ok
- Bonus: `ConferenceNotRegisteredError`

```graphql
mutation {
  enrollInWorkshop(input: { workshopId: "..." }) {
    ... on EnrollSuccess        { enrollment { id enrolledAt } }
    ... on WorkshopFullError    { message }
    ... on AlreadyEnrolledError { message }
  }
}
```

---

## Probar autenticación en Playground

```graphql
# 1. Login
mutation {
  login(input: { email: "organizer@flisol.pa", password: "secret123" }) {
    token
    user { id name role }
  }
}

# 2. Copiar el token → HTTP Headers (botón inferior):
# { "Authorization": "Bearer <token>" }

# 3. Verificar sesión
query { me { id name email role } }

# 4. Crear conferencia (requiere rol ORGANIZER)
mutation {
  createConference(input: {
    name: "FLISol Panamá 2026"
    date: "2026-04-25T09:00:00.000Z"
    venue: "Colegio De La Salle"
    capacity: 200
  }) { id name }
}
```

---

## Referencia rápida

| Decorador | Propósito |
|---|---|
| `@ObjectType()` / `@InputType()` / `@ArgsType()` | Tipos GraphQL |
| `@Field()` | Expone propiedad en el schema |
| `@Resolver()` / `@Query()` / `@Mutation()` | Operaciones |
| `@ResolveField()` + `@Parent()` | Campos computados / relaciones |
| `@Args()` | Inyecta argumentos |
| `@CurrentUser()` | Usuario autenticado del JWT |
| `@UseGuards(JwtAuthGuard)` | Requiere token válido |
| `@UseGuards(JwtAuthGuard, RolesGuard)` + `@Roles(Role.X)` | Requiere rol |
| `createUnionType()` | Union type code-first |

---

## ¿Trabado? Revisá esto primero

1. **Entidad no aparece en el schema** — ¿en `TypeOrmModule.forFeature([])`? ¿`@ObjectType()` presente?
2. **Guard falla en GraphQL** — `JwtAuthGuard` necesita sobreescribir `getRequest()` para el contexto GQL
3. **Token rechazado** — verificar `JWT_SECRET` en `.env`
4. **DataLoader orden incorrecto** — la función batch DEBE retornar en el mismo orden que los ids de entrada
5. **Union type no resuelve** — `resolveType` debe retornar la clase, no un string
6. **Validación no dispara** — `ValidationPipe` en `main.ts` + `@InputType()` en el DTO
7. **password visible en schema** — eliminar `@Field()` del campo `password` en `Attendee`
