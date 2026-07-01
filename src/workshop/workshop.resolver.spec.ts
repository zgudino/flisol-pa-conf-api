import { WorkshopEnrollmentService } from 'src/workshop-enrollment/workshop-enrollment.service';
import { WorkshopService } from './workshop.service';
import { WorkshopResolver } from './workshop.resolver';
import { WorkshopLevel } from './workshop.entity';

describe('WorkshopResolver', () => {
  const workshop = {
    id: 'workshop-1',
    title: 'De REST a GraphQL',
    capacity: 10,
    level: WorkshopLevel.INTERMEDIATE,
    startTime: new Date(),
    endTime: new Date(),
    conferenceId: 'conf-1',
  };

  function build(enrolledCount: number) {
    const enrollmentService = {
      countByWorkshopId: jest.fn().mockResolvedValue(enrolledCount),
    } as unknown as WorkshopEnrollmentService;
    const workshopService = {} as WorkshopService;
    return new WorkshopResolver(workshopService, enrollmentService);
  }

  it('enrolledCount returns the raw enrollment count', async () => {
    const resolver = build(4);
    await expect(resolver.enrolledCount(workshop as any)).resolves.toBe(4);
  });

  it('availableSeats subtracts enrolled count from capacity', async () => {
    const resolver = build(4);
    await expect(resolver.availableSeats(workshop as any)).resolves.toBe(6);
  });

  it('isFull is false when there is still room', async () => {
    const resolver = build(4);
    await expect(resolver.isFull(workshop as any)).resolves.toBe(false);
  });

  it('isFull is true once enrollments reach capacity', async () => {
    const resolver = build(10);
    await expect(resolver.isFull(workshop as any)).resolves.toBe(true);
  });
});
