'use client';

interface CutControlsProps {
  speed: number;
  onSpeedChange: (speed: number) => void;
  onRender: () => void;
  disabled: boolean;
  segmentCount: number;
}

export default function CutControls({
  speed,
  onSpeedChange,
  onRender,
  disabled,
  segmentCount,
}: CutControlsProps) {
  return (
    <div className="flex items-center gap-4">
      {/* Speed control */}
      <div className="flex items-center gap-2">
        <label className="text-xs text-gray-400 font-medium">Speed:</label>
        <input
          type="range"
          min={0.8}
          max={1.5}
          step={0.05}
          value={speed}
          onChange={(e) => onSpeedChange(parseFloat(e.target.value))}
          className="w-24 accent-[var(--accent)]"
        />
        <span className="text-sm font-mono w-10 text-center">{speed.toFixed(2)}x</span>
      </div>

      {/* Render button */}
      <button
        onClick={onRender}
        disabled={disabled}
        className="bg-green-600 hover:bg-green-700 px-5 py-2 rounded-lg text-sm font-medium
          transition-colors disabled:opacity-50 disabled:cursor-not-allowed
          flex items-center gap-2"
      >
        {disabled ? (
          <>
            <span className="animate-spin">&#9696;</span>
            Rendering...
          </>
        ) : (
          <>
            Apply Cuts
            {segmentCount > 0 && (
              <span className="bg-green-800 px-2 py-0.5 rounded-full text-xs">
                {segmentCount}
              </span>
            )}
          </>
        )}
      </button>
    </div>
  );
}
