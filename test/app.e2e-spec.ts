import { INestApplication } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { App } from 'supertest/types';
import { createTestApp, gqlRequest, resetSchema } from './utils/test-app';

describe('App bootstrap (e2e)', () => {
  let app: INestApplication<App>;
  let dataSource: DataSource;

  beforeAll(async () => {
    ({ app, dataSource } = await createTestApp());
    await resetSchema(dataSource);
  });

  afterAll(async () => {
    await app.close();
  });

  it('serves the GraphQL schema at /graphql', async () => {
    const res = await gqlRequest<{ __schema: { queryType: { name: string } } }>(
      app,
      `query { __schema { queryType { name } } }`,
    );

    expect(res.status).toBe(200);
    expect(res.body.errors).toBeUndefined();
    expect(res.body.data?.__schema.queryType.name).toBe('Query');
  });

  it('returns a well-formed GraphQL error for a malformed query', async () => {
    const res = await gqlRequest(app, `query { doesNotExist }`);

    expect(res.body.errors?.[0].extensions?.code).toBeDefined();
  });
});
