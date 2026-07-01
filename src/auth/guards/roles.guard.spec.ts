import { Reflector } from '@nestjs/core';
import { Role } from '../../common/enums/role.enum';
import { createMockGqlExecutionContext } from '../../test-utils/mock-gql-context';
import { RolesGuard } from './roles.guard';

describe('RolesGuard', () => {
  function build(requiredRoles: Role[] | undefined) {
    const reflector = {
      getAllAndOverride: jest.fn().mockReturnValue(requiredRoles),
    } as unknown as Reflector;
    return { guard: new RolesGuard(reflector), reflector };
  }

  it('allows access when no roles are required', () => {
    const { guard } = build(undefined);
    const context = createMockGqlExecutionContext({
      req: { user: { role: Role.ATTENDEE } },
    });

    expect(guard.canActivate(context)).toBe(true);
  });

  it('allows access when the user role is included in the required roles', () => {
    const { guard } = build([Role.ORGANIZER]);
    const context = createMockGqlExecutionContext({
      req: { user: { role: Role.ORGANIZER } },
    });

    expect(guard.canActivate(context)).toBe(true);
  });

  it('denies access when the user role is not included in the required roles', () => {
    const { guard } = build([Role.ORGANIZER]);
    const context = createMockGqlExecutionContext({
      req: { user: { role: Role.ATTENDEE } },
    });

    expect(guard.canActivate(context)).toBe(false);
  });

  it('denies access when there is no authenticated user', () => {
    const { guard } = build([Role.ORGANIZER]);
    const context = createMockGqlExecutionContext({ req: {} });

    expect(guard.canActivate(context)).toBe(false);
  });
});
