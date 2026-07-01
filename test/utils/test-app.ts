import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { DataSource } from 'typeorm';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../../src/app.module';
import { GqlHttpExceptionFilter } from '../../src/common/filters/gql-exception.filter';

// Arranca la app completa (AppModule) contra el Postgres real levantado con
// `docker compose up -d`, replicando el bootstrap de src/main.ts.
export async function createTestApp(): Promise<{
  app: INestApplication<App>;
  dataSource: DataSource;
}> {
  const moduleRef = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();

  const app = moduleRef.createNestApplication<INestApplication<App>>();
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  );
  app.useGlobalFilters(new GqlHttpExceptionFilter());
  await app.init();

  const dataSource = moduleRef.get(DataSource);

  return { app, dataSource };
}

// Recrea el esquema desde cero — aísla cada archivo de e2e-spec de los demás.
// Requiere ejecutar los tests de e2e en serie (ver test/jest-e2e.json: maxWorkers 1).
export async function resetSchema(dataSource: DataSource): Promise<void> {
  await dataSource.synchronize(true);
}

export interface GraphQLResponse<T> {
  status: number;
  body: {
    data: T | null;
    errors?: Array<{
      message: string;
      extensions?: { code?: string };
    }>;
  };
}

export async function gqlRequest<T = Record<string, unknown>>(
  app: INestApplication<App>,
  query: string,
  variables?: Record<string, unknown>,
  token?: string,
): Promise<GraphQLResponse<T>> {
  const req = request(app.getHttpServer())
    .post('/graphql')
    .send({ query, variables });

  if (token) req.set('Authorization', `Bearer ${token}`);

  const res = await req;
  return res as unknown as GraphQLResponse<T>;
}
