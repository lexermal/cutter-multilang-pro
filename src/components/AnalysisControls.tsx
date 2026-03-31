'use client';

import { Segment } from '@/types';

interface AnalysisControlsProps {
  onAnalyze: (types: ('silence' | 'filler' | 'repetition')[]) => void;
  segments: Segment[];
  onToggleAllType: (type: Segment['type'], selected: boolean) => void;
  disabled: boolean;
}

export default function AnalysisControls({
  onAnalyze,
  segments,
  onToggleAllType,
  disabled,
}: AnalysisControlsProps) {
  const types: { key: Segment['type']; label: string; color: string; bg: string }[] = [
    { key: 'silence', label: 'Silences', color: 'text-blue-300', bg: 'bg-blue-600 hover:bg-blue-700' },
    { key: 'filler', label: 'Fillers', color: 'text-amber-300', bg: 'bg-amber-600 hover:bg-amber-700' },
    { key: 'repetition', label: 'Repetitions', color: 'text-red-300', bg: 'bg-red-600 hover:bg-red-700' },
  ];

  return (
    <div className="flex items-center gap-3">
      <span className="text-xs text-gray-400 font-medium">Detect:</span>
      {types.map(({ key, label, color, bg }) => {
        const ofType = segments.filter((s) => s.type === key);
        const selectedCount = ofType.filter((s) => s.selected).length;
        const hasRun = ofType.length > 0;

        return (
          <div key={key} className="flex items-center gap-1">
            <button
              onClick={() => onAnalyze([key])}
              disabled={disabled}
              className={`${bg} px-3 py-1.5 rounded text-xs font-medium transition-colors
                disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {label}
            </button>
            {hasRun && (
              <button
                onClick={() => onToggleAllType(key, selectedCount < ofType.length)}
                className={`${color} text-[10px] font-mono px-2 py-1 rounded
                  bg-[var(--surface)] hover:bg-[var(--surface-hover)] transition-colors`}
                title={`${selectedCount}/${ofType.length} selected — click to ${selectedCount < ofType.length ? 'select' : 'deselect'} all`}
              >
                {selectedCount}/{ofType.length}
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}
