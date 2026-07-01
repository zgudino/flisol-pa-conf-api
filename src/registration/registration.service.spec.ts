import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { createMockRepository } from '../test-utils/mock-repository';
import { Registration } from './registration.entity';
import {
  AlreadyRegisteredError,
  CapacityFullError,
  RegistrationService,
  RegistrationSuccess,
} from './registration.service';

describe('RegistrationService', () => {
  let service: RegistrationService;
  let em: {
    findOneBy: jest.Mock;
    countBy: jest.Mock;
    create: jest.Mock;
    save: jest.Mock;
    findOne: jest.Mock;
  };
  let dataSource: { transaction: jest.Mock };

  beforeEach(async () => {
    em = {
      findOneBy: jest.fn(),
      countBy: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      findOne: jest.fn(),
    };
    dataSource = {
      transaction: jest.fn((cb: any) => cb(em)),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RegistrationService,
        {
          provide: getRepositoryToken(Registration),
          useValue: createMockRepository<Registration>(),
        },
        { provide: DataSource, useValue: dataSource },
      ],
    }).compile();

    service = module.get(RegistrationService);
  });

  it('throws NotFoundException when the conference does not exist', async () => {
    em.findOneBy.mockResolvedValue(null);

    await expect(
      service.registerForConference('attendee-1', 'missing-conf'),
    ).rejects.toThrow(NotFoundException);
  });

  it('returns AlreadyRegisteredError when the attendee is already registered', async () => {
    em.findOneBy.mockResolvedValue({ id: 'conf-1', capacity: 100 });
    em.countBy.mockResolvedValueOnce(1); // already registered

    const result = await service.registerForConference('attendee-1', 'conf-1');

    expect(result).toBeInstanceOf(AlreadyRegisteredError);
    expect(em.save).not.toHaveBeenCalled();
  });

  it('returns CapacityFullError when the conference is full', async () => {
    em.findOneBy.mockResolvedValue({ id: 'conf-1', capacity: 1 });
    em.countBy
      .mockResolvedValueOnce(0) // not already registered
      .mockResolvedValueOnce(1); // current registrations == capacity

    const result = await service.registerForConference('attendee-1', 'conf-1');

    expect(result).toBeInstanceOf(CapacityFullError);
    expect(em.save).not.toHaveBeenCalled();
  });

  it('creates the registration and returns RegistrationSuccess when there is room', async () => {
    em.findOneBy.mockResolvedValue({ id: 'conf-1', capacity: 100 });
    em.countBy.mockResolvedValueOnce(0).mockResolvedValueOnce(5);
    const created = { id: 'reg-1' };
    em.create.mockReturnValue(created);
    em.save.mockResolvedValue(created);
    const saved = {
      id: 'reg-1',
      attendee: { id: 'attendee-1' },
      conference: { id: 'conf-1' },
    };
    em.findOne.mockResolvedValue(saved);

    const result = await service.registerForConference('attendee-1', 'conf-1');

    expect(result).toBeInstanceOf(RegistrationSuccess);
    expect((result as RegistrationSuccess).registration).toBe(saved);
  });
});
