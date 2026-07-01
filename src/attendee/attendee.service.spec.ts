import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import {
  createMockRepository,
  MockRepository,
} from '../test-utils/mock-repository';
import { Attendee } from './attendee.entity';
import { AttendeeService } from './attendee.service';

describe('AttendeeService', () => {
  let service: AttendeeService;
  let repo: MockRepository<Attendee>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AttendeeService,
        {
          provide: getRepositoryToken(Attendee),
          useValue: createMockRepository<Attendee>(),
        },
      ],
    }).compile();

    service = module.get(AttendeeService);
    repo = module.get(getRepositoryToken(Attendee));
  });

  describe('findAll', () => {
    it('paginates attendees ordered by name', async () => {
      repo.findAndCount!.mockResolvedValue([[{ id: 'a1' }], 1]);

      const result = await service.findAll({ limit: 10, offset: 0 });

      expect(repo.findAndCount).toHaveBeenCalledWith({
        take: 10,
        skip: 0,
        order: { name: 'ASC' },
      });
      expect(result).toEqual({
        items: [{ id: 'a1' }],
        total: 1,
        limit: 10,
        offset: 0,
        hasNextPage: false,
      });
    });
  });

  describe('findOneOrFail', () => {
    it('returns the attendee when found', async () => {
      const attendee = { id: 'a1' };
      repo.findOneBy!.mockResolvedValue(attendee);

      await expect(service.findOneOrFail('a1')).resolves.toBe(attendee);
    });

    it('throws NotFoundException when missing', async () => {
      repo.findOneBy!.mockResolvedValue(null);

      await expect(service.findOneOrFail('missing')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
