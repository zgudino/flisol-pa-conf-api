import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
} from '@nestjs/common';
import { GqlArgumentsHost } from '@nestjs/graphql';
import { GraphQLError } from 'graphql';

// Mapa de códigos HTTP a códigos de error GraphQL estándar
const HTTP_STATUS_TO_GQL_CODE: Record<number, string> = {
  400: 'BAD_USER_INPUT',
  401: 'UNAUTHENTICATED',
  403: 'FORBIDDEN',
  404: 'NOT_FOUND',
  409: 'CONFLICT',
};

// Filtro de excepciones para transporte GraphQL
//
// Intercepta HttpException (NotFoundException, UnauthorizedException, etc.)
// antes de que Apollo Server las procese, y las convierte en GraphQLError
// con extensions.code ya establecido.
//
// Esto permite que formatError actúe solo como capa de presentación
// (ocultar stack trace en producción) sin inferir el código desde
// originalError.statusCode — una dependencia frágil del shape interno de NestJS.
@Catch(HttpException)
export class GqlHttpExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost): never {
    // Establece el contexto GraphQL para esta solicitud
    GqlArgumentsHost.create(host);

    const status = exception.getStatus();
    const code = HTTP_STATUS_TO_GQL_CODE[status] ?? 'INTERNAL_SERVER_ERROR';

    const response = exception.getResponse();
    let message: string;

    if (
      typeof response === 'object' &&
      response !== null &&
      'message' in response
    ) {
      const raw = (response as { message: string | string[] }).message;
      message = Array.isArray(raw) ? raw.join('; ') : raw;
    } else {
      message = exception.message;
    }

    throw new GraphQLError(message, {
      extensions: { code },
    });
  }
}
