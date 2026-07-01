import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import {
  createMockRepository,
  MockRepository,
} from '../test-utils/mock-repository';
import { Workshop, WorkshopLevel } from './workshop.entity';
import { WorkshopService } from './workshop.service';

describe('WorkshopService', () => {
  let service: WorkshopService;
  let repo: MockRepository<Workshop>;

  const input = {
    title: 'De REST a GraphQL',
    capacity: 30,
    level: WorkshopLevel.INTERMEDIATE,
    startTime: '2026-04-25T09:00:00.000Z',
    endTime: '2026-04-25T12:00:00.000Z',
    conferenceId: 'conf-1',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WorkshopService,
        {
          provide: getRepositoryToken(Workshop),
          useValue: createMockRepository<Workshop>(),
        },
      ],
    }).compile();

    service = module.get(WorkshopService);
    repo = module.get(getRepositoryToken(Workshop));
  });

  describe('create', () => {
    it('creates the workshop when the schedule and title are valid', async () => {
      repo.findOneBy!.mockResolvedValue(null);
      repo.create!.mockImplementation((data: any) => data);
      repo.save!.mockImplementation((data: any) =>
        Promise.resolve({ id: 'workshop-1', ...data }),
      );

      const result = await service.create(input);

      expect(result.id).toBe('workshop-1');
    });

    it('throws BadRequestException when endTime is not after startTime', async () => {
      await expect(
        service.create({
          ...input,
          startTime: input.endTime,
          endTime: input.startTime,
        }),
      ).rejects.toThrow(BadRequestException);
      expect(repo.findOneBy).not.toHaveBeenCalled();
    });

    it('throws ConflictException on a duplicate title within the conference', async () => {
      repo.findOneBy!.mockResolvedValue({ id: 'existing' });

      await expect(service.create(input)).rejects.toThrow(ConflictException);
    });
  });

  describe('findAll / findByConferenceId', () => {
    it('paginates all workshops', async () => {
      repo.findAndCount!.mockResolvedValue([[{ id: 'w1' }], 1]);

      const result = await service.findAll({ limit: 10, offset: 0 });

      expect(result.total).toBe(1);
    });

    it('scopes workshops to a given conference', async () => {
      repo.findAndCount!.mockResolvedValue([[], 0]);

      await service.findByConferenceId('conf-1', { limit: 10, offset: 0 });

      expect(repo.findAndCount).toHaveBeenCalledWith(
        expect.objectContaining({ where: { conference: { id: 'conf-1' } } }),
      );
    });
  });

  describe('findOneOrFail', () => {
    it('throws NotFoundException when the workshop does not exist', async () => {
      repo.findOneBy!.mockResolvedValue(null);

      await expect(service.findOneOrFail('missing')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
