import { Repository } from 'typeorm';

// Fábrica de repositorios TypeORM mockeados para tests unitarios.
// Cada método relevante se reemplaza por un jest.fn() para poder
// controlar su comportamiento (mockResolvedValue, mockReturnValue, etc.)
export type MockRepository<T extends object = any> = {
  [K in keyof Repository<T>]?: jest.Mock;
};

export function createMockRepository<
  T extends object = any,
>(): MockRepository<T> {
  return {
    find: jest.fn(),
    findBy: jest.fn(),
    findOne: jest.fn(),
    findOneBy: jest.fn(),
    findAndCount: jest.fn(),
    countBy: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    createQueryBuilder: jest.fn(),
  };
}
