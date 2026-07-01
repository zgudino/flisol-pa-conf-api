import {
  ArgumentsHost,
  ConflictException,
  ForbiddenException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { GraphQLError } from 'graphql';
import { GqlHttpExceptionFilter } from './gql-exception.filter';

describe('GqlHttpExceptionFilter', () => {
  const filter = new GqlHttpExceptionFilter();

  const fakeHost = {
    getType: () => 'graphql',
    getArgs: () => [undefined, undefined, {}, undefined],
  } as unknown as ArgumentsHost;

  it.each([
    [new NotFoundException('Talk no encontrada'), 'NOT_FOUND'],
    [new UnauthorizedException('Credenciales inválidas'), 'UNAUTHENTICATED'],
    [new ForbiddenException('Sin permisos'), 'FORBIDDEN'],
    [new ConflictException('Ya existe'), 'CONFLICT'],
  ])('maps %s to extensions.code %s', (exception, code) => {
    try {
      filter.catch(exception, fakeHost);
      fail('expected filter.catch to throw');
    } catch (error) {
      expect(error).toBeInstanceOf(GraphQLError);
      expect((error as GraphQLError).extensions.code).toBe(code);
      expect((error as GraphQLError).message).toBe(exception.message);
    }
  });

  it('joins array validation messages with "; "', () => {
    const exception = new (class extends ConflictException {
      constructor() {
        super({ message: ['field a is invalid', 'field b is invalid'] });
      }
    })();

    try {
      filter.catch(exception, fakeHost);
      fail('expected filter.catch to throw');
    } catch (error) {
      expect((error as GraphQLError).message).toBe(
        'field a is invalid; field b is invalid',
      );
    }
  });
});
