'use client';

import { Segment } from '@/types';

interface SilenceMarkerProps {
  segment: Segment;
  onToggle: (id: string) => void;
  onSeek: (time: number) => void;
}

export default function SilenceMarker({ segment, onToggle, onSeek }: SilenceMarkerProps) {
  return (
    <span
      className={`inline-flex items-center mx-1 px-2 py-0.5 rounded text-[10px] font-mono cursor-pointer
        transition-all hover:opacity-80
        ${segment.selected
          ? 'bg-blue-900/40 text-blue-300 line-through opacity-50'
          : 'bg-blue-900/60 text-blue-200 border border-blue-500/30'
        }`}
      onClick={(e) => {
        if (e.shiftKey) {
          onToggle(segment.id);
        } else {
          onSeek(segment.start);
        }
      }}
      title={`${segment.label} (Shift+click to ${segment.selected ? 'keep' : 'cut'})`}
    >
      ⏸ {segment.label}
    </span>
  );
}
