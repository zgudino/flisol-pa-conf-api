import { Logger, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { GqlHttpExceptionFilter } from './common/filters/gql-exception.filter';
import { AppConfig } from './config/app.config';

const logger = new Logger('Bootstrap');

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const config = app.get(ConfigService);

  const { host, port, environment } = config.get<AppConfig>('app')!;

  // Valida todos los DTOs con class-validator automáticamente
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true, // convierte tipos primitivos (string "3" -> number 3)
      whitelist: true, // elimina propiedades que no estén en el DTO
      forbidNonWhitelisted: true, // lanza error si llegan propiedades no declaradas
    }),
  );

  // Convierte HttpException en GraphQLError con extensions.code pre-establecido
  app.useGlobalFilters(new GqlHttpExceptionFilter());

  await app.listen(port, host);
  logger.log(
    `Server listening at ${await app.getUrl()} in ${environment} mode`,
  );
}

bootstrap().catch((reason) => {
  logger.error('Error starting server', reason);
  process.exit(1);
});
