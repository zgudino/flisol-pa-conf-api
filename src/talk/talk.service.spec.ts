import { ConflictException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import {
  createMockRepository,
  MockRepository,
} from '../test-utils/mock-repository';
import { Talk } from './talk.entity';
import { TalkService } from './talk.service';

describe('TalkService', () => {
  let service: TalkService;
  let repo: MockRepository<Talk>;

  const input = {
    title: 'GraphQL en profundidad',
    description: 'desc',
    startTime: '2026-04-25T10:00:00.000Z',
    endTime: '2026-04-25T11:00:00.000Z',
    conferenceId: 'conf-1',
    speakerId: 'speaker-1',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TalkService,
        {
          provide: getRepositoryToken(Talk),
          useValue: createMockRepository<Talk>(),
        },
      ],
    }).compile();

    service = module.get(TalkService);
    repo = module.get(getRepositoryToken(Talk));
  });

  describe('create', () => {
    it('creates the talk when there is no title or schedule conflict', async () => {
      repo.findOne!.mockResolvedValue(null);
      repo.create!.mockImplementation((data: any) => data);
      repo.save!.mockImplementation((data: any) =>
        Promise.resolve({ id: 'talk-1', ...data }),
      );

      const result = await service.create(input);

      expect(result.id).toBe('talk-1');
      expect(repo.create).toHaveBeenCalledWith({
        ...input,
        startTime: new Date(input.startTime),
        endTime: new Date(input.endTime),
      });
    });

    it('throws ConflictException on a duplicate title in the same conference', async () => {
      repo.findOne!.mockImplementation(({ where }: any) =>
        Promise.resolve(where.title ? { id: 'existing' } : null),
      );

      await expect(service.create(input)).rejects.toThrow(ConflictException);
    });

    it('throws ConflictException when the speaker has a schedule conflict', async () => {
      repo.findOne!.mockImplementation(({ where }: any) =>
        Promise.resolve(where.speakerId ? { id: 'existing' } : null),
      );

      await expect(service.create(input)).rejects.toThrow(ConflictException);
    });
  });

  describe('findAll / findByConferenceId', () => {
    it('paginates all talks ordered by startTime', async () => {
      repo.findAndCount!.mockResolvedValue([[{ id: 't1' }], 1]);

      const result = await service.findAll({ limit: 10, offset: 0 });

      expect(repo.findAndCount).toHaveBeenCalledWith({
        take: 10,
        skip: 0,
        order: { startTime: 'ASC' },
      });
      expect(result.total).toBe(1);
    });

    it('scopes talks to a given conference', async () => {
      repo.findAndCount!.mockResolvedValue([[{ id: 't1' }], 1]);

      await service.findByConferenceId('conf-1', { limit: 10, offset: 0 });

      expect(repo.findAndCount).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { conference: { id: 'conf-1' } },
        }),
      );
    });
  });

  describe('findOneOrFail', () => {
    it('throws NotFoundException when the talk does not exist', async () => {
      repo.findOneBy!.mockResolvedValue(null);

      await expect(service.findOneOrFail('missing')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
