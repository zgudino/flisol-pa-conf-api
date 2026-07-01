import { SpeakerService } from '../speaker/speaker.service';
import { SpeakerLoader } from './speaker-loader.service';

describe('SpeakerLoader', () => {
  it('batches concurrent loads into a single findByIds call, in request order', async () => {
    const speakers = [
      { id: 's1', name: 'Ada' },
      { id: 's2', name: 'Grace' },
      { id: 's3', name: 'Linus' },
    ];
    const findByIds = jest.fn().mockResolvedValue(speakers);
    const speakerService = { findByIds } as unknown as SpeakerService;

    const loader = new SpeakerLoader(speakerService);

    const [s3, s1, s2] = await Promise.all([
      loader.load('s3'),
      loader.load('s1'),
      loader.load('s2'),
    ]);

    expect(findByIds).toHaveBeenCalledTimes(1);
    expect(findByIds).toHaveBeenCalledWith(['s3', 's1', 's2']);
    expect(s3).toEqual(speakers[2]);
    expect(s1).toEqual(speakers[0]);
    expect(s2).toEqual(speakers[1]);
  });
});
