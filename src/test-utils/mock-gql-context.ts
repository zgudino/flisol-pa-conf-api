import { ExecutionContext } from '@nestjs/common';

// Construye un ExecutionContext falso equivalente al que NestJS arma para
// un resolver GraphQL, de forma que GqlExecutionContext.create(context)
// pueda extraer { req } vía ctx.getContext().
export function createMockGqlExecutionContext(options: {
  req?: unknown;
  handler?: (...args: unknown[]) => unknown;
  target?: new (...args: unknown[]) => unknown;
}): ExecutionContext {
  const handler = options.handler ?? (() => undefined);
  const target = options.target ?? class Dummy {};

  return {
    getType: () => 'graphql',
    getClass: () => target,
    getHandler: () => handler,
    getArgs: () => [undefined, undefined, { req: options.req }, undefined],
    getArgByIndex: (index: number) =>
      [undefined, undefined, { req: options.req }, undefined][index],
    switchToHttp: () => {
      throw new Error('Not implemented in GraphQL mock context');
    },
    switchToRpc: () => {
      throw new Error('Not implemented in GraphQL mock context');
    },
    switchToWs: () => {
      throw new Error('Not implemented in GraphQL mock context');
    },
  } as unknown as ExecutionContext;
}
