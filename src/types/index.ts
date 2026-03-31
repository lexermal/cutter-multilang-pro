export interface TranscribedWord {
  word: string;
  start: number;
  end: number;
}

export interface Segment {
  id: string;
  startWordIndex: number;
  endWordIndex: number;
  start: number;
  end: number;
  type: 'silence' | 'filler' | 'repetition';
  selected: boolean;
  label: string;
}

export interface ProjectState {
  projectId: string | null;
  videoPath: string | null;
  audioPath: string | null;
  words: TranscribedWord[];
  paragraphs: number[][];
  segments: Segment[];
  status: 'idle' | 'downloading' | 'transcribing' | 'analyzing' | 'rendering' | 'done' | 'error';
  error: string | null;
  outputPath: string | null;
  speed: number;
}

export type ProjectAction =
  | { type: 'SET_STATUS'; status: ProjectState['status'] }
  | { type: 'SET_PROJECT'; projectId: string }
  | { type: 'SET_TRANSCRIPTION'; words: TranscribedWord[]; paragraphs: number[][] }
  | { type: 'SET_SEGMENTS'; segments: Segment[] }
  | { type: 'ADD_SEGMENTS'; segments: Segment[] }
  | { type: 'TOGGLE_SEGMENT'; segmentId: string }
  | { type: 'TOGGLE_ALL_TYPE'; segmentType: Segment['type']; selected: boolean }
  | { type: 'SET_OUTPUT'; outputPath: string }
  | { type: 'SET_ERROR'; error: string }
  | { type: 'SET_SPEED'; speed: number }
  | { type: 'RESET' };
