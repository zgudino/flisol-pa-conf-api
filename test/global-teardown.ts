import type { StartedPostgreSqlContainer } from '@testcontainers/postgresql';

declare global {
  var __POSTGRES_CONTAINER__: StartedPostgreSqlContainer | undefined;
}

export default async function globalTeardown(): Promise<void> {
  await globalThis.__POSTGRES_CONTAINER__?.stop();
}
