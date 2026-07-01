import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { Attendee } from '../attendee/attendee.entity';
import { Role } from '../common/enums/role.enum';
import {
  createMockRepository,
  MockRepository,
} from '../test-utils/mock-repository';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  let service: AuthService;
  let attendeeRepo: MockRepository<Attendee>;
  let jwtService: { sign: jest.Mock };

  beforeEach(async () => {
    jwtService = { sign: jest.fn().mockReturnValue('signed.jwt.token') };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: getRepositoryToken(Attendee),
          useValue: createMockRepository<Attendee>(),
        },
        { provide: JwtService, useValue: jwtService },
      ],
    }).compile();

    service = module.get(AuthService);
    attendeeRepo = module.get(getRepositoryToken(Attendee));
  });

  afterEach(() => jest.clearAllMocks());

  describe('register', () => {
    it('hashes the password and persists a new attendee', async () => {
      attendeeRepo.findOneBy!.mockResolvedValue(null);
      const created = {
        id: 'attendee-1',
        name: 'Ada',
        email: 'ada@example.com',
        role: Role.ATTENDEE,
      };
      attendeeRepo.create!.mockReturnValue(created);
      attendeeRepo.save!.mockResolvedValue(created);

      const result = await service.register(
        'Ada',
        'ada@example.com',
        'password123',
      );

      expect(attendeeRepo.findOneBy).toHaveBeenCalledWith({
        email: 'ada@example.com',
      });
      const createArg = attendeeRepo.create!.mock.calls[0][0];
      expect(createArg.password).not.toBe('password123');
      expect(await bcrypt.compare('password123', createArg.password)).toBe(
        true,
      );
      expect(result).toEqual({ token: 'signed.jwt.token', user: created });
      expect(jwtService.sign).toHaveBeenCalledWith({
        sub: created.id,
        email: created.email,
        role: created.role,
      });
    });

    it('throws ConflictException when the email is already registered', async () => {
      attendeeRepo.findOneBy!.mockResolvedValue({ id: 'existing' });

      await expect(
        service.register('Ada', 'ada@example.com', 'password123'),
      ).rejects.toThrow(ConflictException);
      expect(attendeeRepo.save).not.toHaveBeenCalled();
    });

    it('defaults the role to ATTENDEE when not provided', async () => {
      attendeeRepo.findOneBy!.mockResolvedValue(null);
      attendeeRepo.create!.mockImplementation((data: any) => data);
      attendeeRepo.save!.mockImplementation((data: any) => data);

      await service.register('Ada', 'ada@example.com', 'password123');

      expect(attendeeRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ role: Role.ATTENDEE }),
      );
    });
  });

  describe('login', () => {
    it('returns a signed AuthPayload for valid credentials', async () => {
      const hashed = await bcrypt.hash('password123', 10);
      const user = {
        id: 'attendee-1',
        email: 'ada@example.com',
        password: hashed,
        role: Role.ATTENDEE,
      };
      attendeeRepo.findOneBy!.mockResolvedValue(user);

      const result = await service.login({
        email: 'ada@example.com',
        password: 'password123',
      });

      expect(result).toEqual({ token: 'signed.jwt.token', user });
    });

    it('throws UnauthorizedException when the email does not exist', async () => {
      attendeeRepo.findOneBy!.mockResolvedValue(null);

      await expect(
        service.login({ email: 'missing@example.com', password: 'whatever' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('throws UnauthorizedException when the password does not match', async () => {
      const hashed = await bcrypt.hash('correct-password', 10);
      attendeeRepo.findOneBy!.mockResolvedValue({
        id: 'attendee-1',
        email: 'ada@example.com',
        password: hashed,
        role: Role.ATTENDEE,
      });

      await expect(
        service.login({ email: 'ada@example.com', password: 'wrong' }),
      ).rejects.toThrow(UnauthorizedException);
      expect(jwtService.sign).not.toHaveBeenCalled();
    });
  });

  describe('hashPassword', () => {
    it('produces a bcrypt hash different from the plain input', async () => {
      const hashed = await service.hashPassword('mySecret');
      expect(hashed).not.toBe('mySecret');
      expect(await bcrypt.compare('mySecret', hashed)).toBe(true);
    });
  });
});
