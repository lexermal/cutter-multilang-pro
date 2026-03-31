import { TranscribedWord, Segment } from '@/types';
import { nanoid } from 'nanoid';

const SILENCE_THRESHOLD = 0.7; // seconds

export function detectSilence(words: TranscribedWord[]): Segment[] {
  const segments: Segment[] = [];

  for (let i = 0; i < words.length - 1; i++) {
    const gap = words[i + 1].start - words[i].end;
    if (gap > SILENCE_THRESHOLD) {
      segments.push({
        id: nanoid(),
        startWordIndex: i,
        endWordIndex: i + 1,
        start: words[i].end,
        end: words[i + 1].start,
        type: 'silence',
        selected: true,
        label: `${gap.toFixed(1)}s pause`,
      });
    }
  }

  return segments;
}
