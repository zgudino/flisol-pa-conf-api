import { GraphQLError } from 'graphql';
import { formatError } from './error-formatter';

describe('formatError', () => {
  const originalEnv = process.env.NODE_ENV;

  afterEach(() => {
    process.env.NODE_ENV = originalEnv;
  });

  it('preserves the extensions.code set upstream', () => {
    const error = new GraphQLError('Not found', {
      extensions: { code: 'NOT_FOUND' },
    });

    const formatted = formatError(error);

    expect(formatted.extensions?.code).toBe('NOT_FOUND');
    expect(formatted.message).toBe('Not found');
  });

  it('falls back to INTERNAL_SERVER_ERROR when no code is present', () => {
    const error = new GraphQLError('Boom');

    const formatted = formatError(error);

    expect(formatted.extensions?.code).toBe('INTERNAL_SERVER_ERROR');
  });

  it('hides the exception details in production', () => {
    process.env.NODE_ENV = 'production';
    const error = new GraphQLError('Boom', {
      extensions: { code: 'INTERNAL_SERVER_ERROR', exception: { stack: 'x' } },
    });

    const formatted = formatError(error);

    expect(formatted.extensions?.exception).toBeUndefined();
  });

  it('exposes the exception details outside production', () => {
    process.env.NODE_ENV = 'development';
    const exception = { stack: 'trace' };
    const error = new GraphQLError('Boom', {
      extensions: { code: 'INTERNAL_SERVER_ERROR', exception },
    });

    const formatted = formatError(error);

    expect(formatted.extensions?.exception).toEqual(exception);
  });
});
