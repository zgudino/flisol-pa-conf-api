import {
  PostgreSqlContainer,
  StartedPostgreSqlContainer,
} from '@testcontainers/postgresql';

// Postgres 18 es requerido: las entidades usan `default: () => 'uuidv7()'`,
// función nativa introducida en esa versión.
const POSTGRES_IMAGE = 'postgres:18-alpine';

declare global {
  var __POSTGRES_CONTAINER__: StartedPostgreSqlContainer | undefined;
}

// Levanta un Postgres efímero vía Testcontainers para toda la corrida de e2e
// (una sola vez, no por archivo) y expone la conexión a través de las mismas
// variables de entorno que lee src/config/database.config.ts.
export default async function globalSetup(): Promise<void> {
  const container = await new PostgreSqlContainer(POSTGRES_IMAGE)
    .withDatabase('conf_api_test')
    .withUsername('postgres')
    .withPassword('postgres')
    .start();

  globalThis.__POSTGRES_CONTAINER__ = container;

  process.env.DB_HOST = container.getHost();
  process.env.DB_PORT = String(container.getPort());
  process.env.DB_USER = container.getUsername();
  process.env.DB_PASSWORD = container.getPassword();
  process.env.DB_NAME = container.getDatabase();
  // El esquema se sincroniza explícitamente por archivo (ver resetSchema en
  // test/utils/test-app.ts) — se desactiva la sincronización automática al
  // bootstrapear la app para evitar carreras.
  process.env.DB_SYNCHRONIZE = 'false';
  process.env.DB_LOGGING = 'false';
  process.env.NODE_ENV = 'test';
  process.env.JWT_SECRET ??= 'e2e-test-secret';
  process.env.JWT_EXPIRES_IN ??= '15m';
}
