import { TranscribedWord, Segment } from '@/types';
import { nanoid } from 'nanoid';

const FILLER_WORDS_EN = new Set([
  'um', 'uh', 'uhh', 'umm', 'uh-huh',
  'like', 'basically', 'actually', 'literally',
  'right', 'okay', 'so', 'well',
]);

const FILLER_WORDS_SV = new Set([
  'liksom', 'typ', 'eh', 'öh', 'ehm',
  'asså', 'alltså', 'ba', 'ju', 'va',
  'fattar', 'liksom', 'nä', 'ja',
]);

const FILLER_PHRASES = [
  ['you', 'know'],
  ['i', 'mean'],
  ['sort', 'of'],
  ['kind', 'of'],
  ['vet', 'du'],
];

function normalize(word: string): string {
  return word.toLowerCase().replace(/[.,!?;:'"]/g, '').trim();
}

export function detectFillers(words: TranscribedWord[]): Segment[] {
  const segments: Segment[] = [];
  const used = new Set<number>();

  // Check for filler phrases first (2-word)
  for (let i = 0; i < words.length - 1; i++) {
    const w1 = normalize(words[i].word);
    const w2 = normalize(words[i + 1].word);

    for (const phrase of FILLER_PHRASES) {
      if (w1 === phrase[0] && w2 === phrase[1]) {
        segments.push({
          id: nanoid(),
          startWordIndex: i,
          endWordIndex: i + 1,
          start: words[i].start,
          end: words[i + 1].end,
          type: 'filler',
          selected: true,
          label: `"${phrase.join(' ')}"`,
        });
        used.add(i);
        used.add(i + 1);
        break;
      }
    }
  }

  // Check single filler words
  for (let i = 0; i < words.length; i++) {
    if (used.has(i)) continue;
    const w = normalize(words[i].word);
    if (FILLER_WORDS_EN.has(w) || FILLER_WORDS_SV.has(w)) {
      segments.push({
        id: nanoid(),
        startWordIndex: i,
        endWordIndex: i,
        start: words[i].start,
        end: words[i].end,
        type: 'filler',
        selected: true,
        label: `"${words[i].word}"`,
      });
    }
  }

  return segments.sort((a, b) => a.start - b.start);
}
