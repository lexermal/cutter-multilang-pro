import { TranscribedWord, Segment } from '@/types';
import { nanoid } from 'nanoid';

function normalize(word: string): string {
  return word.toLowerCase().replace(/[.,!?;:'"]/g, '').trim();
}

export function detectRepetitions(words: TranscribedWord[]): Segment[] {
  const segments: Segment[] = [];
  const used = new Set<number>();

  // Detect consecutive identical words (e.g., "the the", "I I I")
  for (let i = 0; i < words.length - 1; i++) {
    if (used.has(i)) continue;

    const w = normalize(words[i].word);
    if (w.length < 2) continue; // skip single chars

    let j = i + 1;
    while (j < words.length && normalize(words[j].word) === w) {
      j++;
    }

    if (j > i + 1) {
      // Mark all repetitions after the first occurrence
      for (let k = i + 1; k < j; k++) {
        segments.push({
          id: nanoid(),
          startWordIndex: k,
          endWordIndex: k,
          start: words[k].start,
          end: words[k].end,
          type: 'repetition',
          selected: true,
          label: `repeated: "${words[k].word}"`,
        });
        used.add(k);
      }
    }
  }

  // Detect short phrase repetitions (2-word phrases repeated within 6-word window)
  for (let i = 0; i < words.length - 3; i++) {
    if (used.has(i) || used.has(i + 1)) continue;

    const phrase = normalize(words[i].word) + ' ' + normalize(words[i + 1].word);
    if (phrase.length < 4) continue;

    for (let j = i + 2; j < Math.min(i + 8, words.length - 1); j++) {
      if (used.has(j) || used.has(j + 1)) continue;

      const candidate = normalize(words[j].word) + ' ' + normalize(words[j + 1].word);
      if (phrase === candidate) {
        segments.push({
          id: nanoid(),
          startWordIndex: j,
          endWordIndex: j + 1,
          start: words[j].start,
          end: words[j + 1].end,
          type: 'repetition',
          selected: true,
          label: `repeated: "${words[j].word} ${words[j + 1].word}"`,
        });
        used.add(j);
        used.add(j + 1);
      }
    }
  }

  return segments.sort((a, b) => a.start - b.start);
}
