import { WorkshopEnrollmentService } from './workshop-enrollment.service';
import { EnrollmentCountLoader } from './enrollment-count-loader.service';

describe('EnrollmentCountLoader', () => {
  it('batches concurrent loads and defaults to 0 for workshops with no enrollments', async () => {
    const countsByWorkshopIds = jest.fn().mockResolvedValue([
      { workshopId: 'w1', count: 3 },
      { workshopId: 'w3', count: 0 },
    ]);
    const enrollmentService = {
      countsByWorkshopIds,
    } as unknown as WorkshopEnrollmentService;

    const loader = new EnrollmentCountLoader(enrollmentService);

    const [w1, w2, w3] = await Promise.all([
      loader.load('w1'),
      loader.load('w2'), // not present in the batch result
      loader.load('w3'),
    ]);

    expect(countsByWorkshopIds).toHaveBeenCalledTimes(1);
    expect(countsByWorkshopIds).toHaveBeenCalledWith(['w1', 'w2', 'w3']);
    expect(w1).toBe(3);
    expect(w2).toBe(0);
    expect(w3).toBe(0);
  });
});
