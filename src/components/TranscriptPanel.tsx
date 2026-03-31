'use client';

import { useMemo } from 'react';
import { TranscribedWord, Segment } from '@/types';
import WordSpan from './WordSpan';
import SilenceMarker from './SilenceMarker';

interface TranscriptPanelProps {
  words: TranscribedWord[];
  paragraphs: number[][];
  segments: Segment[];
  currentTime: number;
  onSeek: (time: number) => void;
  onToggleSegment: (segmentId: string) => void;
}

export default function TranscriptPanel({
  words,
  paragraphs,
  segments,
  currentTime,
  onSeek,
  onToggleSegment,
}: TranscriptPanelProps) {
  // Find the current word index based on playback time
  const currentWordIndex = useMemo(() => {
    for (let i = 0; i < words.length; i++) {
      if (currentTime >= words[i].start && currentTime <= words[i].end) {
        return i;
      }
    }
    return -1;
  }, [words, currentTime]);

  // Build a map of silence segments between word pairs
  const silenceMap = useMemo(() => {
    const map = new Map<number, Segment>();
    for (const seg of segments) {
      if (seg.type === 'silence') {
        map.set(seg.startWordIndex, seg);
      }
    }
    return map;
  }, [segments]);

  // Count selected cuts
  const selectedCount = segments.filter((s) => s.selected).length;
  const totalCount = segments.length;

  return (
    <div>
      <div className="flex items-center gap-4 mb-4 text-xs text-gray-400">
        <span>{words.length} words</span>
        <span>{paragraphs.length} paragraphs</span>
        {totalCount > 0 && (
          <span>{selectedCount}/{totalCount} segments marked for cut</span>
        )}
        <span className="ml-auto text-gray-500">
          Click word to seek | Shift+click to toggle cut
        </span>
      </div>

      {/* Legend */}
      {totalCount > 0 && (
        <div className="flex gap-4 mb-4 text-xs">
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 rounded bg-blue-900/60 border border-blue-500/30" />
            Silence
          </span>
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 rounded bg-amber-900/60 border border-amber-500/30" />
            Filler
          </span>
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 rounded bg-red-900/60 border border-red-500/30" />
            Repetition
          </span>
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 rounded bg-gray-700 line-through" />
            Selected for cut
          </span>
        </div>
      )}

      {/* Paragraphs */}
      <div className="space-y-4">
        {paragraphs.map((wordIndices, pIdx) => {
          const firstWord = words[wordIndices[0]];
          const startTime = firstWord ? formatTime(firstWord.start) : '';

          return (
            <div key={pIdx} className="group">
              <span className="text-[10px] font-mono text-gray-500 mr-2 select-none">
                {startTime}
              </span>
              <span className="leading-relaxed text-[15px]">
                {wordIndices.map((wIdx, i) => (
                  <span key={wIdx}>
                    <WordSpan
                      word={words[wIdx]}
                      wordIndex={wIdx}
                      segments={segments}
                      isCurrentWord={wIdx === currentWordIndex}
                      onSeek={onSeek}
                      onToggleSegment={onToggleSegment}
                    />
                    {/* Show silence marker between words if detected */}
                    {i < wordIndices.length - 1 && silenceMap.has(wIdx) && (
                      <SilenceMarker
                        segment={silenceMap.get(wIdx)!}
                        onToggle={onToggleSegment}
                        onSeek={onSeek}
                      />
                    )}
                    {' '}
                  </span>
                ))}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}
