---
name: gen-test
description: Generate a Jest unit test file for a NestJS service or resolver in this repo, following this project's TypeORM repository-mocking and error-pattern conventions.
disable-model-invocation: true
---

Generate unit tests for: $ARGUMENTS (a file path under `src/`, e.g. `src/workshop/workshop.service.ts`).

This repo has jest fully configured (`npm test`, `npm run test:cov`) but zero `*.spec.ts` files under `src/` yet — there's no existing unit test to copy from, so follow the conventions below exactly. The only existing test is the e2e smoke test at [test/app.e2e-spec.ts](../../../test/app.e2e-spec.ts), which is not a pattern for unit tests (it boots the whole `AppModule`).

## Where the file goes

Colocate the spec next to the source file: `src/<module>/<name>.service.spec.ts` or `src/<module>/<name>.resolver.spec.ts`. The root jest config (`package.json`) picks up `*.spec.ts` anywhere under `src/` automatically.

## Testing a service

Services in this repo (see [src/workshop/workshop.service.ts](../../../src/workshop/workshop.service.ts) as reference) take an injected TypeORM `Repository<Entity>` via `@InjectRepository`. Mock the repository, don't hit a real DB:

```ts
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { Workshop } from './workshop.entity';
import { WorkshopService } from './workshop.service';

describe('WorkshopService', () => {
  let service: WorkshopService;
  let repo: jest.Mocked<Repository<Workshop>>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WorkshopService,
        {
          provide: getRepositoryToken(Workshop),
          useValue: {
            findOneBy: jest.fn(),
            findAndCount: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get(WorkshopService);
    repo = module.get(getRepositoryToken(Workshop));
  });

  it('throws NotFoundException when the entity does not exist', async () => {
    repo.findOneBy.mockResolvedValue(null);
    await expect(service.findOneOrFail('missing-id')).rejects.toThrow(
      NotFoundException,
    );
  });
});
```

Cover, per method:
- **Happy path** — correct repository calls with correct args, correct return shape.
- **`findOneOrFail`-style lookups** — assert `NotFoundException` is thrown when the repo returns `null`/`undefined`. Never assert a `null` return — this project's convention forbids services returning `null` for single-entity lookups.
- **Business validation** — e.g. `create()` methods that check for conflicts should assert `ConflictException`/`BadRequestException` on the invalid-input path (see `WorkshopService.create` for the pattern: date-order check, then duplicate check).
- **Pagination methods** — assert `hasNextPage` is computed correctly at the boundary (`offset + limit === total` vs `< total`).

## Testing a resolver

Resolvers are thin — mock the service(s) they depend on and assert delegation, not business logic (that's the service test's job):

```ts
describe('WorkshopResolver', () => {
  let resolver: WorkshopResolver;
  let service: jest.Mocked<WorkshopService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WorkshopResolver,
        { provide: WorkshopService, useValue: { findAll: jest.fn(), create: jest.fn() } },
        { provide: WorkshopEnrollmentService, useValue: { countByWorkshopId: jest.fn() } },
      ],
    }).compile();

    resolver = module.get(WorkshopResolver);
    service = module.get(WorkshopService);
  });

  it('delegates workshops query to the service', async () => {
    const paginationArgs = { limit: 10, offset: 0 };
    await resolver.workshops(paginationArgs as any);
    expect(service.findAll).toHaveBeenCalledWith(paginationArgs);
  });
});
```

If the resolver has `@ResolveField()` methods backed by a DataLoader, mock the loader's `.load(id)` method and assert it's called with the parent entity's ID — don't assert on internal batching behavior, that belongs in the loader's own test.

## Union error types

If the code under test can return a union error member (see CLAUDE.md's union-type pattern), assert the returned value is an `instanceof` the specific error class — not just that it has the right shape — since `resolveType` in production relies on `instanceof` too:

```ts
expect(result).toBeInstanceOf(WorkshopFullError);
```

## After generating

Run `npx jest --testPathPattern=<module-name>` to confirm the new spec passes before handing it back.
