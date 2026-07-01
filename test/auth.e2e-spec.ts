import { INestApplication } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { App } from 'supertest/types';
import { AuthService } from '../src/auth/auth.service';
import { Role } from '../src/common/enums/role.enum';
import { createTestApp, gqlRequest, resetSchema } from './utils/test-app';

const LOGIN_MUTATION = `
  mutation Login($input: LoginInput!) {
    login(input: $input) {
      token
      user { id email role }
    }
  }
`;

const ME_QUERY = `query { me { id email role } }`;

interface LoginResult {
  login: { token: string; user: { id: string; email: string; role: string } };
}

interface MeResult {
  me: { id: string; email: string; role: string };
}

describe('Auth (e2e)', () => {
  let app: INestApplication<App>;
  let dataSource: DataSource;
  let authService: AuthService;

  beforeAll(async () => {
    ({ app, dataSource } = await createTestApp());
    authService = app.get(AuthService);
    await resetSchema(dataSource);
    await authService.register(
      'Ada Lovelace',
      'ada@example.com',
      'super-secret',
      Role.ATTENDEE,
    );
  });

  afterAll(async () => {
    await app.close();
  });

  describe('login', () => {
    it('returns a JWT and the user for valid credentials', async () => {
      const res = await gqlRequest<LoginResult>(app, LOGIN_MUTATION, {
        input: { email: 'ada@example.com', password: 'super-secret' },
      });

      expect(res.body.errors).toBeUndefined();
      expect(res.body.data?.login.token).toEqual(expect.any(String));
      expect(res.body.data?.login.user).toMatchObject({
        email: 'ada@example.com',
        role: Role.ATTENDEE,
      });
    });

    it('returns UNAUTHENTICATED for a wrong password', async () => {
      const res = await gqlRequest<LoginResult>(app, LOGIN_MUTATION, {
        input: { email: 'ada@example.com', password: 'wrong-password' },
      });

      expect(res.body.data).toBeNull();
      expect(res.body.errors?.[0].extensions?.code).toBe('UNAUTHENTICATED');
    });

    it('returns UNAUTHENTICATED for an unknown email without leaking existence', async () => {
      const res = await gqlRequest<LoginResult>(app, LOGIN_MUTATION, {
        input: { email: 'ghost@example.com', password: 'whatever1' },
      });

      expect(res.body.errors?.[0].extensions?.code).toBe('UNAUTHENTICATED');
    });

    it('rejects invalid input shape via the global ValidationPipe', async () => {
      const res = await gqlRequest<LoginResult>(app, LOGIN_MUTATION, {
        input: { email: 'not-an-email', password: '123' },
      });

      expect(res.body.errors?.[0].extensions?.code).toBe('BAD_USER_INPUT');
    });
  });

  describe('me', () => {
    it('rejects the request when no token is provided', async () => {
      const res = await gqlRequest<MeResult>(app, ME_QUERY);

      expect(res.body.errors?.[0].extensions?.code).toBe('UNAUTHENTICATED');
    });

    it('rejects the request when the token is malformed', async () => {
      const res = await gqlRequest<MeResult>(
        app,
        ME_QUERY,
        undefined,
        'not-a-jwt',
      );

      expect(res.body.errors?.[0].extensions?.code).toBe('UNAUTHENTICATED');
    });

    it('returns the authenticated user for a valid token', async () => {
      const login = await gqlRequest<LoginResult>(app, LOGIN_MUTATION, {
        input: { email: 'ada@example.com', password: 'super-secret' },
      });
      const token = login.body.data?.login.token;

      const res = await gqlRequest<MeResult>(app, ME_QUERY, undefined, token);

      expect(res.body.errors).toBeUndefined();
      expect(res.body.data?.me).toMatchObject({ email: 'ada@example.com' });
    });
  });
});
