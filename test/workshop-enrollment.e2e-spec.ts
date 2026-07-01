import { INestApplication } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { App } from 'supertest/types';
import { AuthService } from '../src/auth/auth.service';
import { Role } from '../src/common/enums/role.enum';
import { createTestApp, gqlRequest, resetSchema } from './utils/test-app';

const CREATE_CONFERENCE_MUTATION = `
  mutation CreateConference($input: CreateConferenceInput!) {
    createConference(input: $input) { id }
  }
`;

const CREATE_WORKSHOP_MUTATION = `
  mutation CreateWorkshop($input: CreateWorkshopInput!) {
    createWorkshop(input: $input) { id capacity }
  }
`;

const REGISTER_MUTATION = `
  mutation Register($input: RegisterForConferenceInput!) {
    registerForConference(input: $input) { __typename }
  }
`;

const ENROLL_MUTATION = `
  mutation Enroll($input: EnrollInWorkshopInput!) {
    enrollInWorkshop(input: $input) {
      __typename
      ... on EnrollSuccess { enrollment { id } }
      ... on WorkshopFullError { message }
      ... on AlreadyEnrolledError { message }
      ... on ConferenceNotRegisteredError { message }
    }
  }
`;

const WORKSHOP_FIELDS_QUERY = `
  query Workshops {
    workshops {
      items { id enrolledCount availableSeats isFull capacity }
    }
  }
`;

interface CreateConferenceResult {
  createConference: { id: string };
}

interface CreateWorkshopResult {
  createWorkshop: { id: string; capacity: number };
}

interface EnrollResult {
  enrollInWorkshop: { __typename: string; message?: string };
}

interface WorkshopFieldsResult {
  workshops: {
    items: {
      id: string;
      enrolledCount: number;
      availableSeats: number;
      isFull: boolean;
      capacity: number;
    }[];
  };
}

describe('WorkshopEnrollment (e2e)', () => {
  let app: INestApplication<App>;
  let dataSource: DataSource;
  let organizerToken: string;
  let attendee1Token: string;
  let attendee2Token: string;
  let outsiderToken: string;
  let conferenceId: string;
  let workshopId: string;

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
    outsiderToken = (
      await authService.register(
        'Outsider',
        'outsider@example.com',
        'outsider-pw',
        Role.ATTENDEE,
      )
    ).token;

    const conference = await gqlRequest<CreateConferenceResult>(
      app,
      CREATE_CONFERENCE_MUTATION,
      {
        input: {
          name: 'Workshop Host Conf',
          date: '2026-04-25T09:00:00.000Z',
          venue: 'Ciudad del Saber',
          capacity: 100,
        },
      },
      organizerToken,
    );
    conferenceId = conference.body.data!.createConference.id;

    const workshop = await gqlRequest<CreateWorkshopResult>(
      app,
      CREATE_WORKSHOP_MUTATION,
      {
        input: {
          title: 'De REST a GraphQL',
          capacity: 1,
          level: 'INTERMEDIATE',
          startTime: '2026-04-25T10:00:00.000Z',
          endTime: '2026-04-25T13:00:00.000Z',
          conferenceId,
        },
      },
      organizerToken,
    );
    workshopId = workshop.body.data!.createWorkshop.id;

    await gqlRequest(
      app,
      REGISTER_MUTATION,
      { input: { conferenceId } },
      attendee1Token,
    );
    await gqlRequest(
      app,
      REGISTER_MUTATION,
      { input: { conferenceId } },
      attendee2Token,
    );
  });

  afterAll(async () => {
    await app.close();
  });

  it('returns ConferenceNotRegisteredError when the attendee never registered for the conference', async () => {
    const res = await gqlRequest<EnrollResult>(
      app,
      ENROLL_MUTATION,
      { input: { workshopId } },
      outsiderToken,
    );

    expect(res.body.data?.enrollInWorkshop.__typename).toBe(
      'ConferenceNotRegisteredError',
    );
  });

  it('enrolls a registered attendee successfully', async () => {
    const res = await gqlRequest<EnrollResult>(
      app,
      ENROLL_MUTATION,
      { input: { workshopId } },
      attendee1Token,
    );

    expect(res.body.data?.enrollInWorkshop.__typename).toBe('EnrollSuccess');
  });

  it('returns AlreadyEnrolledError on a duplicate enrollment', async () => {
    const res = await gqlRequest<EnrollResult>(
      app,
      ENROLL_MUTATION,
      { input: { workshopId } },
      attendee1Token,
    );

    expect(res.body.data?.enrollInWorkshop.__typename).toBe(
      'AlreadyEnrolledError',
    );
  });

  it('returns WorkshopFullError once capacity is reached', async () => {
    const res = await gqlRequest<EnrollResult>(
      app,
      ENROLL_MUTATION,
      { input: { workshopId } },
      attendee2Token,
    );

    expect(res.body.data?.enrollInWorkshop.__typename).toBe(
      'WorkshopFullError',
    );
  });

  it('exposes enrolledCount, availableSeats and isFull via the DataLoader-backed resolvers', async () => {
    const res = await gqlRequest<WorkshopFieldsResult>(
      app,
      WORKSHOP_FIELDS_QUERY,
    );

    const workshop = res.body.data?.workshops.items.find(
      (w) => w.id === workshopId,
    );
    expect(workshop).toMatchObject({
      capacity: 1,
      enrolledCount: 1,
      availableSeats: 0,
      isFull: true,
    });
  });
});
