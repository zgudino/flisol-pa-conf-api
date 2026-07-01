import { UnauthorizedException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Attendee } from '../../attendee/attendee.entity';
import { Role } from '../../common/enums/role.enum';
import {
  createMockRepository,
  MockRepository,
} from '../../test-utils/mock-repository';
import { jwtConfig } from '../../config/jwt.config';
import { JwtStrategy } from './jwt.strategy';

describe('JwtStrategy', () => {
  let strategy: JwtStrategy;
  let attendeeRepo: MockRepository<Attendee>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JwtStrategy,
        {
          provide: jwtConfig.KEY,
          useValue: { secret: 'test-secret', expiresIn: '15m' },
        },
        {
          provide: getRepositoryToken(Attendee),
          useValue: createMockRepository<Attendee>(),
        },
      ],
    }).compile();

    strategy = module.get(JwtStrategy);
    attendeeRepo = module.get(getRepositoryToken(Attendee));
  });

  it('returns the attendee for a payload with a valid subject', async () => {
    const user = {
      id: 'attendee-1',
      email: 'ada@example.com',
      role: Role.ATTENDEE,
    };
    attendeeRepo.findOneBy!.mockResolvedValue(user);

    const result = await strategy.validate({
      sub: 'attendee-1',
      email: 'ada@example.com',
      role: Role.ATTENDEE,
    });

    expect(attendeeRepo.findOneBy).toHaveBeenCalledWith({ id: 'attendee-1' });
    expect(result).toBe(user);
  });

  it('throws UnauthorizedException when the attendee no longer exists', async () => {
    attendeeRepo.findOneBy!.mockResolvedValue(null);

    await expect(
      strategy.validate({
        sub: 'deleted-user',
        email: 'ghost@example.com',
        role: Role.ATTENDEE,
      }),
    ).rejects.toThrow(UnauthorizedException);
  });
});
