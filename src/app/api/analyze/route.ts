import { NextRequest, NextResponse } from 'next/server';
import { TranscribedWord, Segment } from '@/types';
import { detectSilence } from '@/lib/analysis/silence';
import { detectFillers } from '@/lib/analysis/fillers';
import { detectRepetitions } from '@/lib/analysis/repetitions';
import { loadProjectState, saveProjectState } from '@/lib/project';

export async function POST(request: NextRequest) {
  try {
    const { projectId, words, types } = await request.json() as {
      projectId?: string;
      words: TranscribedWord[];
      types: ('silence' | 'filler' | 'repetition')[];
    };

    if (!words || !types) {
      return NextResponse.json({ error: 'Missing words or types' }, { status: 400 });
    }

    const segments: Segment[] = [];

    for (const type of types) {
      switch (type) {
        case 'silence':
          segments.push(...detectSilence(words));
          break;
        case 'filler':
          segments.push(...detectFillers(words));
          break;
        case 'repetition':
          segments.push(...detectRepetitions(words));
          break;
      }
    }

    segments.sort((a, b) => a.start - b.start);

    // Save progress if projectId provided
    if (projectId) {
      const existing = loadProjectState(projectId);
      if (existing) {
        const merged = [...(existing.segments || [])];
        for (const seg of segments) {
          if (!merged.some((s) => s.id === seg.id)) {
            merged.push(seg);
          }
        }
        saveProjectState({
          ...existing,
          step: 'analyzed',
          segments: merged,
        });
      }
    }

    return NextResponse.json({ segments });
  } catch (error) {
    console.error('[analyze] Error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
