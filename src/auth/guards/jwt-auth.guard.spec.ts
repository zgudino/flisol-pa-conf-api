import { createMockGqlExecutionContext } from '../../test-utils/mock-gql-context';
import { JwtAuthGuard } from './jwt-auth.guard';

describe('JwtAuthGuard', () => {
  it('extracts the underlying HTTP request from the GraphQL context', () => {
    const guard = new JwtAuthGuard();
    const req = { headers: { authorization: 'Bearer token' } };
    const context = createMockGqlExecutionContext({ req });

    expect(guard.getRequest(context)).toBe(req);
  });
});
