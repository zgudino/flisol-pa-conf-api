import { INestApplication } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { App } from 'supertest/types';
import { AuthService } from '../src/auth/auth.service';
import { Role } from '../src/common/enums/role.enum';
import { createTestApp, gqlRequest, resetSchema } from './utils/test-app';

const CREATE_CONFERENCE_MUTATION = `
  mutation CreateConference($input: CreateConferenceInput!) {
    createConference(input: $input) { id capacity }
  }
`;

const REGISTER_MUTATION = `
  mutation Register($input: RegisterForConferenceInput!) {
    registerForConference(input: $input) {
      __typename
      ... on RegistrationSuccess {
        registration { id attendee { id } conference { id } }
      }
      ... on AlreadyRegisteredError { message }
      ... on CapacityFullError { message }
    }
  }
`;

interface CreateConferenceResult {
  createConference: { id: string; capacity: number };
}

interface RegisterResult {
  registerForConference: {
    __typename: string;
    registration?: {
      id: string;
      attendee: { id: string };
      conference: { id: string };
    };
    message?: string;
  };
}

describe('Registration (e2e)', () => {
  let app: INestApplication<App>;
  let dataSource: DataSource;
  let organizerToken: string;
  let attendee1Token: string;
  let attendee2Token: string;
  let attendee3Token: string;
  let conferenceId: string;

  beforeAll(async () => {
    ({ app, dataSource } = await createTestApp());
    const authService = app.get(AuthService);
    await resetSchema(dataSource);

    organizerToken = (
      await authService.register(
        'Org Anizer',
        'organizer@example.com',
        'organizer-pw',
        Role.ORGANIZER,
      )
    ).token;
    attendee1Token = (
      await authService.register(
        'Attendee One',
        'attendee1@example.com',
        'attendee-pw',
        Role.ATTENDEE,
      )
    ).token;
    attendee2Token = (
      await authService.register(
        'Attendee Two',
        'attendee2@example.com',
        'attendee-pw',
        Role.ATTENDEE,
      )
    ).token;
    attendee3Token = (
      await authService.register(
        'Attendee Three',
        'attendee3@example.com',
        'attendee-pw',
        Role.ATTENDEE,
      )
    ).token;

    const conference = await gqlRequest<CreateConferenceResult>(
      app,
      CREATE_CONFERENCE_MUTATION,
      {
        input: {
          name: 'Small Capacity Conf',
          date: '2026-04-25T09:00:00.000Z',
          venue: 'Ciudad del Saber',
          capacity: 2,
        },
      },
      organizerToken,
    );
    conferenceId = conference.body.data!.createConference.id;
  });

  afterAll(async () => {
    await app.close();
  });

  it('returns NOT_FOUND when the conference does not exist', async () => {
    const res = await gqlRequest<RegisterResult>(
      app,
      REGISTER_MUTATION,
      { input: { conferenceId: '018f7f2b-0000-7000-8000-000000000000' } },
      attendee1Token,
    );

    expect(res.body.errors?.[0].extensions?.code).toBe('NOT_FOUND');
  });

  it('registers the first attendee successfully', async () => {
    const res = await gqlRequest<RegisterResult>(
      app,
      REGISTER_MUTATION,
      { input: { conferenceId } },
      attendee1Token,
    );

    expect(res.body.data?.registerForConference.__typename).toBe(
      'RegistrationSuccess',
    );
    expect(
      res.body.data?.registerForConference.registration?.conference.id,
    ).toBe(conferenceId);
  });

  it('returns AlreadyRegisteredError on a duplicate registration', async () => {
    const res = await gqlRequest<RegisterResult>(
      app,
      REGISTER_MUTATION,
      { input: { conferenceId } },
      attendee1Token,
    );

    expect(res.body.data?.registerForConference.__typename).toBe(
      'AlreadyRegisteredError',
    );
  });

  it('returns CapacityFullError once the conference reaches capacity', async () => {
    const second = await gqlRequest<RegisterResult>(
      app,
      REGISTER_MUTATION,
      { input: { conferenceId } },
      attendee2Token,
    );
    expect(second.body.data?.registerForConference.__typename).toBe(
      'RegistrationSuccess',
    );

    const third = await gqlRequest<RegisterResult>(
      app,
      REGISTER_MUTATION,
      { input: { conferenceId } },
      attendee3Token,
    );
    expect(third.body.data?.registerForConference.__typename).toBe(
      'CapacityFullError',
    );
  });
});
