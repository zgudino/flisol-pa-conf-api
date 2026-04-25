import { Logger } from '@nestjs/common';
import { repl } from '@nestjs/core';
import { AppModule } from './app.module';

const logger = new Logger('Repl');

async function bootstrap() {
  await repl(AppModule);
}

bootstrap().catch((reason) => {
  logger.error('Error starting REPL', reason);
  process.exit(1);
});
