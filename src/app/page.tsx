'use client';

import { useReducer, useRef, useCallback, useState, useEffect } from 'react';
import { ProjectState, ProjectAction, Segment } from '@/types';
import UrlInput from '@/components/UrlInput';
import VideoPlayer from '@/components/VideoPlayer';
import TranscriptPanel from '@/components/TranscriptPanel';
import AnalysisControls from '@/components/AnalysisControls';
import CutControls from '@/components/CutControls';
import ProjectPicker from '@/components/ProjectPicker';

const initialState: ProjectState = {
  projectId: null,
  videoPath: null,
  audioPath: null,
  words: [],
  paragraphs: [],
  segments: [],
  status: 'idle',
  error: null,
  outputPath: null,
  speed: 1.0,
};

function reducer(state: ProjectState, action: ProjectAction): ProjectState {
  switch (action.type) {
    case 'SET_STATUS':
      return { ...state, status: action.status, error: null };
    case 'SET_PROJECT':
      return { ...state, projectId: action.projectId };
    case 'SET_TRANSCRIPTION':
      return { ...state, words: action.words, paragraphs: action.paragraphs };
    case 'SET_SEGMENTS':
      return { ...state, segments: action.segments };
    case 'ADD_SEGMENTS':
      return {
        ...state,
        segments: [...state.segments, ...action.segments.filter(
          (s) => !state.segments.some((existing) => existing.id === s.id)
        )],
      };
    case 'TOGGLE_SEGMENT':
      return {
        ...state,
        segments: state.segments.map((s) =>
          s.id === action.segmentId ? { ...s, selected: !s.selected } : s
        ),
      };
    case 'TOGGLE_ALL_TYPE':
      return {
        ...state,
        segments: state.segments.map((s) =>
          s.type === action.segmentType ? { ...s, selected: action.selected } : s
        ),
      };
    case 'SET_OUTPUT':
      return { ...state, outputPath: action.outputPath, status: 'done' };
    case 'SET_ERROR':
      return { ...state, error: action.error, status: 'error' };
    case 'SET_SPEED':
      return { ...state, speed: action.speed };
    case 'RESET':
      return initialState;
    default:
      return state;
  }
}

export default function Home() {
  const [state, dispatch] = useReducer(reducer, initialState);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [showPicker, setShowPicker] = useState(false);

  // Auto-save segments when they change (debounced)
  useEffect(() => {
    if (!state.projectId || state.segments.length === 0) return;

    const timeout = setTimeout(() => {
      fetch('/api/save-segments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId: state.projectId, segments: state.segments }),
      }).catch(() => {}); // silent save
    }, 1000);

    return () => clearTimeout(timeout);
  }, [state.projectId, state.segments]);

  const loadProject = useCallback(async (projectId: string) => {
    dispatch({ type: 'SET_STATUS', status: 'downloading' }); // reuse as "loading"

    try {
      const res = await fetch(`/api/projects/${projectId}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      dispatch({ type: 'SET_PROJECT', projectId: data.projectId });

      if (data.words && data.words.length > 0) {
        dispatch({ type: 'SET_TRANSCRIPTION', words: data.words, paragraphs: data.paragraphs || [] });
      }
      if (data.segments && data.segments.length > 0) {
        dispatch({ type: 'SET_SEGMENTS', segments: data.segments });
      }
      if (data.speed) {
        dispatch({ type: 'SET_SPEED', speed: data.speed });
      }
      if (data.outputPath) {
        dispatch({ type: 'SET_OUTPUT', outputPath: data.outputPath });
      } else {
        dispatch({ type: 'SET_STATUS', status: 'idle' });
      }

      setShowPicker(false);
    } catch (error) {
      dispatch({
        type: 'SET_ERROR',
        error: error instanceof Error ? error.message : 'Failed to load project',
      });
    }
  }, []);

  const handleDownload = useCallback(async (url: string) => {
    dispatch({ type: 'SET_STATUS', status: 'downloading' });

    try {
      const res = await fetch('/api/download', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      dispatch({ type: 'SET_PROJECT', projectId: data.projectId });
      dispatch({ type: 'SET_STATUS', status: 'transcribing' });

      // Auto-start transcription
      const transcribeRes = await fetch('/api/transcribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId: data.projectId }),
      });

      const transcribeData = await transcribeRes.json();
      if (!transcribeRes.ok) throw new Error(transcribeData.error);

      dispatch({
        type: 'SET_TRANSCRIPTION',
        words: transcribeData.words,
        paragraphs: transcribeData.paragraphs,
      });
      dispatch({ type: 'SET_STATUS', status: 'idle' });
    } catch (error) {
      dispatch({
        type: 'SET_ERROR',
        error: error instanceof Error ? error.message : 'Download failed',
      });
    }
  }, []);

  const handleAnalyze = useCallback(async (types: ('silence' | 'filler' | 'repetition')[]) => {
    if (state.words.length === 0) return;

    dispatch({ type: 'SET_STATUS', status: 'analyzing' });

    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId: state.projectId, words: state.words, types }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      dispatch({ type: 'ADD_SEGMENTS', segments: data.segments });
      dispatch({ type: 'SET_STATUS', status: 'idle' });
    } catch (error) {
      dispatch({
        type: 'SET_ERROR',
        error: error instanceof Error ? error.message : 'Analysis failed',
      });
    }
  }, [state.projectId, state.words]);

  const handleRender = useCallback(async () => {
    if (!state.projectId) return;

    const selectedCuts = state.segments
      .filter((s) => s.selected)
      .map((s) => ({ start: s.start, end: s.end }));

    if (selectedCuts.length === 0 && Math.abs(state.speed - 1.0) < 0.01) {
      dispatch({ type: 'SET_ERROR', error: 'No cuts selected and speed is 1.0x — nothing to do' });
      return;
    }

    dispatch({ type: 'SET_STATUS', status: 'rendering' });

    try {
      const res = await fetch('/api/render', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: state.projectId,
          cuts: selectedCuts,
          speed: state.speed,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      dispatch({ type: 'SET_OUTPUT', outputPath: data.outputPath });
    } catch (error) {
      dispatch({
        type: 'SET_ERROR',
        error: error instanceof Error ? error.message : 'Render failed',
      });
    }
  }, [state.projectId, state.segments, state.speed]);

  const handleSeek = useCallback((time: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = time;
      videoRef.current.play();
    }
  }, []);

  const handleToggleSegment = useCallback((segmentId: string) => {
    dispatch({ type: 'TOGGLE_SEGMENT', segmentId });
  }, []);

  const handleToggleAllType = useCallback((type: Segment['type'], selected: boolean) => {
    dispatch({ type: 'TOGGLE_ALL_TYPE', segmentType: type, selected });
  }, []);

  const videoUrl = state.projectId ? `/api/video/${state.projectId}` : null;

  return (
    <main className="min-h-screen flex flex-col">
      {/* Header */}
      <div className="border-b border-[var(--border)] px-6 py-4">
        <div className="flex items-center gap-4 max-w-[1800px] mx-auto">
          <h1 className="text-lg font-semibold whitespace-nowrap">
            Cutter Multilang Pro
          </h1>
          <UrlInput
            onSubmit={handleDownload}
            disabled={state.status === 'downloading' || state.status === 'transcribing'}
          />
          <button
            onClick={() => setShowPicker(!showPicker)}
            className="px-3 py-2 rounded-lg text-sm bg-[var(--surface)] border border-[var(--border)]
              hover:bg-[var(--surface-hover)] transition-colors whitespace-nowrap"
          >
            {showPicker ? 'Close' : 'Open Project'}
          </button>
          <StatusBadge status={state.status} />
        </div>
      </div>

      {/* Project picker dropdown */}
      {showPicker && (
        <ProjectPicker
          onSelect={loadProject}
          currentProjectId={state.projectId}
        />
      )}

      {/* Error banner */}
      {state.error && (
        <div className="bg-red-900/50 border-b border-red-700 px-6 py-3 text-red-200 text-sm">
          {state.error}
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left: Transcript */}
        <div className="flex-1 overflow-y-auto p-6">
          {state.words.length > 0 ? (
            <TranscriptPanel
              words={state.words}
              paragraphs={state.paragraphs}
              segments={state.segments}
              currentTime={currentTime}
              onSeek={handleSeek}
              onToggleSegment={handleToggleSegment}
            />
          ) : (
            <div className="flex items-center justify-center h-full text-gray-500">
              {state.status === 'idle'
                ? 'Paste a YouTube URL above to get started'
                : state.status === 'downloading'
                ? 'Downloading video...'
                : state.status === 'transcribing'
                ? 'Transcribing audio...'
                : ''}
            </div>
          )}
        </div>

        {/* Right: Video */}
        <div className="w-[500px] min-w-[400px] border-l border-[var(--border)] flex flex-col">
          <div className="sticky top-0">
            <VideoPlayer
              ref={videoRef}
              src={videoUrl}
              onTimeUpdate={setCurrentTime}
            />
          </div>

          {/* Output video */}
          {state.outputPath && (
            <div className="p-4 border-t border-[var(--border)]">
              <h3 className="text-sm font-medium text-gray-400 mb-2">Output Preview</h3>
              <video
                src={state.outputPath}
                controls
                className="w-full rounded bg-black"
              />
              <a
                href={state.outputPath}
                download="output.mp4"
                className="mt-2 block text-center py-2 px-4 bg-green-600 hover:bg-green-700 rounded text-sm font-medium transition-colors"
              >
                Download Output
              </a>
            </div>
          )}
        </div>
      </div>

      {/* Bottom controls */}
      {state.words.length > 0 && (
        <div className="border-t border-[var(--border)] px-6 py-4">
          <div className="max-w-[1800px] mx-auto flex items-center gap-6 flex-wrap">
            <AnalysisControls
              onAnalyze={handleAnalyze}
              segments={state.segments}
              onToggleAllType={handleToggleAllType}
              disabled={state.status === 'analyzing' || state.status === 'rendering'}
            />
            <div className="flex-1" />
            <CutControls
              speed={state.speed}
              onSpeedChange={(speed) => dispatch({ type: 'SET_SPEED', speed })}
              onRender={handleRender}
              disabled={state.status === 'rendering'}
              segmentCount={state.segments.filter((s) => s.selected).length}
            />
          </div>
        </div>
      )}
    </main>
  );
}

function StatusBadge({ status }: { status: ProjectState['status'] }) {
  if (status === 'idle' || status === 'done') return null;

  const config: Record<string, { text: string; color: string }> = {
    downloading: { text: 'Downloading...', color: 'bg-blue-600' },
    transcribing: { text: 'Transcribing...', color: 'bg-purple-600' },
    analyzing: { text: 'Analyzing...', color: 'bg-yellow-600' },
    rendering: { text: 'Rendering...', color: 'bg-orange-600' },
    error: { text: 'Error', color: 'bg-red-600' },
  };

  const c = config[status];
  if (!c) return null;

  return (
    <span className={`${c.color} px-3 py-1 rounded-full text-xs font-medium animate-pulse`}>
      {c.text}
    </span>
  );
}
