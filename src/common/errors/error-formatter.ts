import { GraphQLError, GraphQLFormattedError } from 'graphql';

// Formateador global de errores GraphQL — se registra en GraphQLModule.forRoot()
//
// Responsabilidades:
//   1. Preservar extensions.code (establecido por el filtro para HttpException,
//      o INTERNAL_SERVER_ERROR como fallback para errores inesperados)
//   2. Ocultar el stack trace en producción
export function formatError(error: GraphQLError): GraphQLFormattedError {
  const code =
    (error.extensions?.['code'] as string | undefined) ??
    'INTERNAL_SERVER_ERROR';

  const isProduction = process.env.NODE_ENV === 'production';

  return {
    message: error.message,
    locations: error.locations,
    path: error.path,
    extensions: {
      code,
      ...(!isProduction && {
        exception: error.extensions?.['exception'],
      }),
    },
  };
}
