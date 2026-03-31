import fs from 'fs';
import path from 'path';
import OpenAI from 'openai';
import { TranscribedWord } from '@/types';

const openai = new OpenAI();

export async function transcribeAudio(projectDir: string): Promise<{
  words: TranscribedWord[];
  paragraphs: number[][];
}> {
  const audioPath = path.join(projectDir, 'audio.mp3');

  const transcription = await openai.audio.transcriptions.create({
    file: fs.createReadStream(audioPath),
    model: 'gpt-4o-transcribe',
    response_format: 'verbose_json',
    timestamp_granularities: ['word'],
  });

  const words: TranscribedWord[] = (transcription.words || []).map((w) => ({
    word: w.word,
    start: w.start,
    end: w.end,
  }));

  // Split into paragraphs based on silence gaps > 1.5s
  const paragraphs: number[][] = [];
  let currentParagraph: number[] = [];

  words.forEach((word, i) => {
    currentParagraph.push(i);

    const nextWord = words[i + 1];
    if (nextWord && nextWord.start - word.end > 1.5) {
      paragraphs.push(currentParagraph);
      currentParagraph = [];
    }
  });

  if (currentParagraph.length > 0) {
    paragraphs.push(currentParagraph);
  }

  // Save transcription to project dir
  const transcriptionPath = path.join(projectDir, 'transcription.json');
  fs.writeFileSync(transcriptionPath, JSON.stringify({ words, paragraphs }, null, 2));

  return { words, paragraphs };
}
