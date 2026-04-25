import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigType } from '@nestjs/config';
import { GraphQLModule } from '@nestjs/graphql';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Request } from 'express';
import { AttendeeModule } from './attendee/attendee.module';
import { AuthModule } from './auth/auth.module';
import { formatError } from './common/errors/error-formatter';
import { ConferenceModule } from './conference/conference.module';
import { appConfig } from './config/app.config';
import { databaseConfig } from './config/database.config';
import { jwtConfig } from './config/jwt.config';
import { RegistrationModule } from './registration/registration.module';
import { SpeakerModule } from './speaker/speaker.module';
import { TalkModule } from './talk/talk.module';
import { WorkshopEnrollmentModule } from './workshop-enrollment/workshop-enrollment.module';
import { WorkshopModule } from './workshop/workshop.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig, databaseConfig, jwtConfig],
    }),

    // GraphQL code-first (SDL se genera automáticamente)
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      autoSchemaFile: true,
      sortSchema: true,
      playground: true,

      // Pasa el request al contexto para que los guards puedan leer el token JWT
      context: ({ req }: { req: Request }) => ({ req }),

      // Formatea todos los errores antes de enviarlos al cliente
      // Oculta el stack trace en producción, normaliza los códigos de error
      formatError,
    }),

    // TypeORM PostgreSQL
    TypeOrmModule.forRootAsync({
      inject: [databaseConfig.KEY],
      useFactory: (config: ConfigType<typeof databaseConfig>) => {
        return {
          type: 'postgres',
          host: config.host,
          port: config.port,
          username: config.user,
          password: config.password,
          database: config.name,
          synchronize: config.synchronize, // NUNCA en producción asigne `true`
          autoLoadEntities: true,
          logging: config.logging,
        };
      },
    }),

    AuthModule,
    ConferenceModule,
    TalkModule,
    WorkshopModule,
    AttendeeModule,
    RegistrationModule,
    WorkshopEnrollmentModule,
    SpeakerModule,
  ],
  providers: [],
})
export class AppModule {}
