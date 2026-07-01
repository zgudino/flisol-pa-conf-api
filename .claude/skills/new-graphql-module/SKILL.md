---
name: new-graphql-module
description: Scaffold a new GraphQL domain module (entity, DTO, service, resolver, module) for this NestJS + TypeORM API, following the conventions in CLAUDE.md.
disable-model-invocation: true
---

Scaffold a new module for: $ARGUMENTS (entity name in PascalCase, e.g. "Sponsor").

Reference the `workshop` module as the canonical example of every convention below — read these before generating anything:
- Entity: [src/workshop/workshop.entity.ts](../../../src/workshop/workshop.entity.ts)
- Service: [src/workshop/workshop.service.ts](../../../src/workshop/workshop.service.ts)
- Resolver: [src/workshop/workshop.resolver.ts](../../../src/workshop/workshop.resolver.ts)
- Module: [src/workshop/workshop.module.ts](../../../src/workshop/workshop.module.ts)
- Paginated type: [src/workshop/paginated-workshops.type.ts](../../../src/workshop/paginated-workshops.type.ts)
- Create DTO: [src/workshop/dto/create-workshop.input.ts](../../../src/workshop/dto/create-workshop.input.ts)

Also read [CLAUDE.md](../../../CLAUDE.md) in full before generating — it documents the union-error and DataLoader patterns referenced below, which don't apply to every module but must be used correctly when they do.

## Files to generate

For a module named `<name>` (e.g. `sponsor`), create under `src/<name>/`:

1. **`<name>.entity.ts`** — `@ObjectType()` + `@Entity()`. Use `@PrimaryColumn({ type: 'uuid', default: () => 'uuidv7()' })` for the ID (this project's convention, not `@PrimaryGeneratedColumn('uuid')`). Any relation to another entity follows the `@ManyToOne` + `@JoinColumn()` + separate `xId: string` column pattern shown in `workshop.entity.ts`. **Never** put `@Field()` on a password or credential column.

2. **`dto/create-<name>.input.ts`** — `@InputType()` with `class-validator` decorators on every field (`@IsString()`, `@IsNotEmpty()`, `@IsOptional()`, `@IsUUID('7')` for foreign keys, etc.) matching the entity's shape.

3. **`paginated-<name>s.type.ts`** — a one-liner extending the `Paginated<T>` factory:
   ```ts
   @ObjectType()
   export class Paginated<Name>s extends Paginated(<Name>) {}
   ```
   Do not hand-write `items`/`total`/`limit`/`offset`/`hasNextPage` fields yourself.

4. **`<name>.service.ts`** — `@Injectable()`, inject the TypeORM repository via `@InjectRepository`. Provide `findAll(pagination: PaginationArgs)` returning the paginated shape, and `findOneOrFail(id: string)` that throws `NotFoundException` when missing — **never return `null`** from a single-entity lookup. Validation/conflict errors during `create` use `BadRequestException` / `ConflictException`, not silent failures.

5. **`<name>.resolver.ts`** — keep it thin; delegate all logic to the service. Public reads (`@Query`) usually need no guard. Mutations that create/update/delete get `@UseGuards(JwtAuthGuard, RolesGuard)` + `@Roles(Role.<APPROPRIATE_ROLE>)` — ask which role if it's not obvious from context. Use `@ResolveField()` for any computed/derived field (counts, booleans) rather than storing it denormalized.

6. **`<name>.module.ts`** — `TypeOrmModule.forFeature([<Name>])` in imports, service + resolver in providers, service in exports if other modules will need it.

## Extra patterns — only if applicable

**If this module needs a union error return type** (an expected business-flow failure, e.g. "capacity full", "already registered" — not invalid state): define it with `createUnionType()` and a `resolveType` using `instanceof`. Every place that returns an error member must use `Object.assign(new ErrorClass(), { message: '...' })`, never a plain object literal — `resolveType` cannot identify a plain object.

**If this module needs a DataLoader** (resolving a field that would otherwise N+1-query, e.g. a parent's related child count/list): the loader service must be `@Injectable({ scope: Scope.REQUEST })` and its batch function must return results in the exact same order as the input ID array:
```ts
return ids.map((id) => items.find((item) => item.id === id)!);
```
See [src/talk/speaker-loader.service.ts](../../../src/talk/speaker-loader.service.ts) or [src/workshop-enrollment/enrollment-count-loader.service.ts](../../../src/workshop-enrollment/enrollment-count-loader.service.ts) for real examples.

## After generating

1. Register the new module in [src/app.module.ts](../../../src/app.module.ts) `imports`.
2. Run `npm run lint` and `npm run build` to confirm it compiles cleanly.
3. If DB sync is off, remind the user a migration or `DB_SYNCHRONIZE=true` local run is needed to create the new table.
