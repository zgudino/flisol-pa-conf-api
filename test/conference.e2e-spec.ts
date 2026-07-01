import { INestApplication } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { App } from 'supertest/types';
import { AuthService } from '../src/auth/auth.service';
import { Role } from '../src/common/enums/role.enum';
import { createTestApp, gqlRequest, resetSchema } from './utils/test-app';

const CONFERENCES_QUERY = `
  query Conferences($limit: Int, $offset: Int) {
    conferences(limit: $limit, offset: $offset) {
      items { id name }
      total
      limit
      offset
      hasNextPage
    }
  }
`;

const CONFERENCE_QUERY = `
  query Conference($id: ID!) {
    conference(id: $id) { id name }
  }
`;

const CREATE_CONFERENCE_MUTATION = `
  mutation CreateConference($input: CreateConferenceInput!) {
    createConference(input: $input) { id name }
  }
`;

interface CreateConferenceResult {
  createConference: { id: string; name: string };
}

interface ConferenceResult {
  conference: { id: string; name: string } | null;
}

interface ConferencesResult {
  conferences: {
    items: { id: string; name: string }[];
    total: number;
    limit: number;
    offset: number;
    hasNextPage: boolean;
  };
}

function conferenceInput(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    name: 'FLISol Panama 2026',
    date: '2026-04-25T09:00:00.000Z',
    venue: 'Ciudad del Saber',
    capacity: 200,
    ...overrides,
  };
}

describe('Conference (e2e)', () => {
  let app: INestApplication<App>;
  let dataSource: DataSource;
  let organizerToken: string;
  let attendeeToken: string;

  beforeAll(async () => {
    ({ app, dataSource } = await createTestApp());
    const authService = app.get(AuthService);
    await resetSchema(dataSource);

    const organizer = await authService.register(
      'Org Anizer',
      'organizer@example.com',
      'organizer-pw',
      Role.ORGANIZER,
    );
    organizerToken = organizer.token;

    const attendee = await authService.register(
      'Reg Ular',
      'attendee@example.com',
      'attendee-pw',
      Role.ATTENDEE,
    );
    attendeeToken = attendee.token;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('createConference (RBAC)', () => {
    it('rejects unauthenticated requests', async () => {
      const res = await gqlRequest<CreateConferenceResult>(
        app,
        CREATE_CONFERENCE_MUTATION,
        { input: conferenceInput({ name: 'No Auth Conf' }) },
      );

      expect(res.body.errors?.[0].extensions?.code).toBe('UNAUTHENTICATED');
    });

    it('rejects attendees without the ORGANIZER role', async () => {
      const res = await gqlRequest<CreateConferenceResult>(
        app,
        CREATE_CONFERENCE_MUTATION,
        { input: conferenceInput({ name: 'Attendee Conf' }) },
        attendeeToken,
      );

      expect(res.body.errors?.[0].extensions?.code).toBe('FORBIDDEN');
    });

    it('creates the conference for an ORGANIZER', async () => {
      const res = await gqlRequest<CreateConferenceResult>(
        app,
        CREATE_CONFERENCE_MUTATION,
        { input: conferenceInput({ name: 'Organizer Conf' }) },
        organizerToken,
      );

      expect(res.body.errors).toBeUndefined();
      expect(res.body.data?.createConference.name).toBe('Organizer Conf');
    });

    it('returns CONFLICT for a duplicate conference name', async () => {
      await gqlRequest<CreateConferenceResult>(
        app,
        CREATE_CONFERENCE_MUTATION,
        { input: conferenceInput({ name: 'Duplicate Conf' }) },
        organizerToken,
      );

      const res = await gqlRequest<CreateConferenceResult>(
        app,
        CREATE_CONFERENCE_MUTATION,
        { input: conferenceInput({ name: 'Duplicate Conf' }) },
        organizerToken,
      );

      expect(res.body.errors?.[0].extensions?.code).toBe('CONFLICT');
    });
  });

  describe('conference / conferences queries', () => {
    it('returns NOT_FOUND for an unknown id', async () => {
      const res = await gqlRequest<ConferenceResult>(app, CONFERENCE_QUERY, {
        id: '018f7f2b-0000-7000-8000-000000000000',
      });

      expect(res.body.errors?.[0].extensions?.code).toBe('NOT_FOUND');
    });

    it('paginates results and reports hasNextPage', async () => {
      for (const name of ['Page Conf A', 'Page Conf B', 'Page Conf C']) {
        await gqlRequest<CreateConferenceResult>(
          app,
          CREATE_CONFERENCE_MUTATION,
          { input: conferenceInput({ name }) },
          organizerToken,
        );
      }

      const firstPage = await gqlRequest<ConferencesResult>(
        app,
        CONFERENCES_QUERY,
        { limit: 2, offset: 0 },
      );
      expect(firstPage.body.data?.conferences.items).toHaveLength(2);
      expect(firstPage.body.data?.conferences.hasNextPage).toBe(true);

      const total = firstPage.body.data?.conferences.total;
      const lastPage = await gqlRequest<ConferencesResult>(
        app,
        CONFERENCES_QUERY,
        { limit: total, offset: 0 },
      );
      expect(lastPage.body.data?.conferences.hasNextPage).toBe(false);
      expect(lastPage.body.data?.conferences.total).toBe(total);
    });
  });
});
