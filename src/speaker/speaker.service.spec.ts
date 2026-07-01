import { ConflictException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { QueryFailedError } from 'typeorm';
import {
  createMockRepository,
  MockRepository,
} from '../test-utils/mock-repository';
import { Speaker } from './speaker.entity';
import { SpeakerService } from './speaker.service';

describe('SpeakerService', () => {
  let service: SpeakerService;
  let repo: MockRepository<Speaker>;

  const input = { name: 'Ada Lovelace', email: 'ada@example.com' };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SpeakerService,
        {
          provide: getRepositoryToken(Speaker),
          useValue: createMockRepository<Speaker>(),
        },
      ],
    }).compile();

    service = module.get(SpeakerService);
    repo = module.get(getRepositoryToken(Speaker));
  });

  describe('create', () => {
    it('creates and saves a speaker', async () => {
      repo.create!.mockImplementation((data: any) => data);
      repo.save!.mockImplementation((data: any) =>
        Promise.resolve({ id: 'speaker-1', ...data }),
      );

      const result = await service.create(input);

      expect(result.id).toBe('speaker-1');
    });

    it('translates a unique-constraint violation into ConflictException', async () => {
      repo.create!.mockImplementation((data: any) => data);
      const dbError = new QueryFailedError('query', [], new Error('dup'));
      (dbError as any).code = '23505';
      repo.save!.mockRejectedValue(dbError);

      await expect(service.create(input)).rejects.toThrow(ConflictException);
    });

    it('rethrows unrelated database errors', async () => {
      repo.create!.mockImplementation((data: any) => data);
      const dbError = new QueryFailedError('query', [], new Error('other'));
      (dbError as any).code = '23000';
      repo.save!.mockRejectedValue(dbError);

      await expect(service.create(input)).rejects.toThrow(QueryFailedError);
    });
  });

  describe('findOneOrFail', () => {
    it('throws NotFoundException when missing', async () => {
      repo.findOneBy!.mockResolvedValue(null);

      await expect(service.findOneOrFail('missing')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('findByIds', () => {
    it('delegates to repo.findBy with an In() filter', async () => {
      const speakers = [{ id: 's1' }, { id: 's2' }];
      repo.findBy!.mockResolvedValue(speakers);

      const result = await service.findByIds(['s1', 's2']);

      expect(repo.findBy).toHaveBeenCalledTimes(1);
      expect(result).toBe(speakers);
    });
  });
});
