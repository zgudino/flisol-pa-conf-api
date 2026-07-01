import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { createMockRepository } from '../test-utils/mock-repository';
import { WorkshopEnrollment } from './workshop-enrollment.entity';
import {
  AlreadyEnrolledError,
  ConferenceNotRegisteredError,
  EnrollSuccess,
  WorkshopEnrollmentService,
  WorkshopFullError,
} from './workshop-enrollment.service';

describe('WorkshopEnrollmentService', () => {
  let service: WorkshopEnrollmentService;
  let repo: ReturnType<typeof createMockRepository<WorkshopEnrollment>>;
  let em: {
    findOne: jest.Mock;
    countBy: jest.Mock;
    create: jest.Mock;
    save: jest.Mock;
  };
  let dataSource: { transaction: jest.Mock };

  const workshop = {
    id: 'workshop-1',
    capacity: 2,
    conference: { id: 'conf-1' },
  };

  beforeEach(async () => {
    em = {
      findOne: jest.fn(),
      countBy: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
    };
    dataSource = { transaction: jest.fn((cb: any) => cb(em)) };
    repo = createMockRepository<WorkshopEnrollment>();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WorkshopEnrollmentService,
        {
          provide: getRepositoryToken(WorkshopEnrollment),
          useValue: repo,
        },
        { provide: DataSource, useValue: dataSource },
      ],
    }).compile();

    service = module.get(WorkshopEnrollmentService);
  });

  describe('enrollInWorkshop', () => {
    it('throws NotFoundException when the workshop does not exist', async () => {
      em.findOne.mockResolvedValue(null);

      await expect(
        service.enrollInWorkshop('attendee-1', 'workshop-1'),
      ).rejects.toThrow(NotFoundException);
    });

    it('returns AlreadyEnrolledError when already enrolled', async () => {
      em.findOne.mockResolvedValue(workshop);
      em.countBy.mockResolvedValueOnce(1); // already enrolled

      const result = await service.enrollInWorkshop('attendee-1', 'workshop-1');

      expect(result).toBeInstanceOf(AlreadyEnrolledError);
    });

    it('returns ConferenceNotRegisteredError when not registered in the conference', async () => {
      em.findOne.mockResolvedValue(workshop);
      em.countBy
        .mockResolvedValueOnce(0) // not already enrolled
        .mockResolvedValueOnce(0); // not registered in conference

      const result = await service.enrollInWorkshop('attendee-1', 'workshop-1');

      expect(result).toBeInstanceOf(ConferenceNotRegisteredError);
    });

    it('returns WorkshopFullError when the workshop is at capacity', async () => {
      em.findOne.mockResolvedValue(workshop);
      em.countBy
        .mockResolvedValueOnce(0) // not already enrolled
        .mockResolvedValueOnce(1) // registered in conference
        .mockResolvedValueOnce(2); // current enrollments == capacity

      const result = await service.enrollInWorkshop('attendee-1', 'workshop-1');

      expect(result).toBeInstanceOf(WorkshopFullError);
      expect(em.save).not.toHaveBeenCalled();
    });

    it('creates the enrollment and returns EnrollSuccess when eligible', async () => {
      em.findOne
        .mockResolvedValueOnce(workshop) // workshop lookup
        .mockResolvedValueOnce({ id: 'enrollment-1' }); // final findOne after save
      em.countBy
        .mockResolvedValueOnce(0)
        .mockResolvedValueOnce(1)
        .mockResolvedValueOnce(0);
      em.create.mockReturnValue({ id: 'enrollment-1' });
      em.save.mockResolvedValue({ id: 'enrollment-1' });

      const result = await service.enrollInWorkshop('attendee-1', 'workshop-1');

      expect(result).toBeInstanceOf(EnrollSuccess);
    });
  });

  describe('countsByWorkshopIds', () => {
    it('maps the raw group-by result into { workshopId, count }', async () => {
      const getRawMany = jest.fn().mockResolvedValue([
        { workshopId: 'w1', count: '3' },
        { workshopId: 'w2', count: '0' },
      ]);
      const qb = {
        select: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        groupBy: jest.fn().mockReturnThis(),
        getRawMany,
      };
      repo.createQueryBuilder!.mockReturnValue(qb);

      const result = await service.countsByWorkshopIds(['w1', 'w2']);

      expect(result).toEqual([
        { workshopId: 'w1', count: 3 },
        { workshopId: 'w2', count: 0 },
      ]);
    });
  });
});
