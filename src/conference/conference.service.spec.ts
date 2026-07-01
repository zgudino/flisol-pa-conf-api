import { ConflictException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { QueryFailedError } from 'typeorm';
import {
  createMockRepository,
  MockRepository,
} from '../test-utils/mock-repository';
import { Conference } from './conference.entity';
import { ConferenceService } from './conference.service';

describe('ConferenceService', () => {
  let service: ConferenceService;
  let repo: MockRepository<Conference>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ConferenceService,
        {
          provide: getRepositoryToken(Conference),
          useValue: createMockRepository<Conference>(),
        },
      ],
    }).compile();

    service = module.get(ConferenceService);
    repo = module.get(getRepositoryToken(Conference));
  });

  describe('findAll', () => {
    it('paginates and reports hasNextPage correctly', async () => {
      const items = [{ id: '1' }, { id: '2' }];
      repo.findAndCount!.mockResolvedValue([items, 5]);

      const result = await service.findAll({ limit: 2, offset: 0 });

      expect(repo.findAndCount).toHaveBeenCalledWith({
        take: 2,
        skip: 0,
        order: { date: 'ASC' },
      });
      expect(result).toEqual({
        items,
        total: 5,
        limit: 2,
        offset: 0,
        hasNextPage: true,
      });
    });

    it('reports hasNextPage false on the last page', async () => {
      repo.findAndCount!.mockResolvedValue([[{ id: '1' }], 3]);

      const result = await service.findAll({ limit: 10, offset: 0 });

      expect(result.hasNextPage).toBe(false);
    });
  });

  describe('findOneOrFail', () => {
    it('returns the conference when found', async () => {
      const conference = { id: 'conf-1' };
      repo.findOneBy!.mockResolvedValue(conference);

      await expect(service.findOneOrFail('conf-1')).resolves.toBe(conference);
    });

    it('throws NotFoundException when missing', async () => {
      repo.findOneBy!.mockResolvedValue(null);

      await expect(service.findOneOrFail('missing')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('create', () => {
    it('creates and saves a conference with a parsed date', async () => {
      const input = {
        name: 'FLISol',
        date: '2026-04-25T09:00:00.000Z',
        venue: 'Panama',
        capacity: 100,
      };
      repo.create!.mockImplementation((data: any) => data);
      repo.save!.mockImplementation((data: any) =>
        Promise.resolve({ id: 'conf-1', ...data }),
      );

      const result = await service.create(input);

      expect(repo.create).toHaveBeenCalledWith({
        ...input,
        date: new Date(input.date),
      });
      expect(result.id).toBe('conf-1');
    });

    it('translates a unique-constraint violation into ConflictException', async () => {
      const input = {
        name: 'FLISol',
        date: '2026-04-25T09:00:00.000Z',
        venue: 'Panama',
        capacity: 100,
      };
      repo.create!.mockImplementation((data: any) => data);
      const dbError = new QueryFailedError('query', [], new Error('dup'));
      (dbError as any).code = '23505';
      repo.save!.mockRejectedValue(dbError);

      await expect(service.create(input)).rejects.toThrow(ConflictException);
    });

    it('rethrows unrelated database errors', async () => {
      const input = {
        name: 'FLISol',
        date: '2026-04-25T09:00:00.000Z',
        venue: 'Panama',
        capacity: 100,
      };
      repo.create!.mockImplementation((data: any) => data);
      const dbError = new QueryFailedError('query', [], new Error('other'));
      (dbError as any).code = '23000';
      repo.save!.mockRejectedValue(dbError);

      await expect(service.create(input)).rejects.toThrow(QueryFailedError);
    });
  });
});
