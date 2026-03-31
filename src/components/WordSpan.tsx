'use client';

import { TranscribedWord, Segment } from '@/types';

interface WordSpanProps {
  word: TranscribedWord;
  wordIndex: number;
  segments: Segment[];
  isCurrentWord: boolean;
  onSeek: (time: number) => void;
  onToggleSegment: (segmentId: string) => void;
}

export default function WordSpan({
  word,
  wordIndex,
  segments,
  isCurrentWord,
  onSeek,
  onToggleSegment,
}: WordSpanProps) {
  // Find segments that include this word
  const matchingSegments = segments.filter(
    (s) => wordIndex >= s.startWordIndex && wordIndex <= s.endWordIndex
  );

  const hasSegment = matchingSegments.length > 0;
  const isSelected = matchingSegments.some((s) => s.selected);
  const segmentType = matchingSegments[0]?.type;

  let className = 'cursor-pointer px-[1px] py-[2px] rounded transition-all hover:opacity-80 ';

  if (isCurrentWord) {
    className += 'font-bold underline underline-offset-2 ';
  }

  if (hasSegment) {
    if (isSelected) {
      className += 'line-through opacity-40 ';
    }

    switch (segmentType) {
      case 'silence':
        className += isSelected ? 'bg-blue-900/30 ' : 'bg-blue-900/50 border-b-2 border-blue-400 ';
        break;
      case 'filler':
        className += isSelected ? 'bg-amber-900/30 ' : 'bg-amber-900/50 border-b-2 border-amber-400 ';
        break;
      case 'repetition':
        className += isSelected ? 'bg-red-900/30 ' : 'bg-red-900/50 border-b-2 border-red-400 ';
        break;
    }
  }

  const handleClick = (e: React.MouseEvent) => {
    if (e.shiftKey && matchingSegments.length > 0) {
      // Shift+click to toggle cut selection
      onToggleSegment(matchingSegments[0].id);
    } else {
      // Regular click to seek
      onSeek(word.start);
    }
  };

  return (
    <span
      className={className}
      onClick={handleClick}
      title={
        hasSegment
          ? `${matchingSegments[0].label} (Shift+click to ${isSelected ? 'keep' : 'cut'})`
          : `${word.start.toFixed(1)}s`
      }
    >
      {word.word}
    </span>
  );
}
