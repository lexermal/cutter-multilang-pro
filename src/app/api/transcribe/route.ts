import { NextRequest, NextResponse } from 'next/server';
import { getProjectDir, loadProjectState, saveProjectState } from '@/lib/project';
import { transcribeAudio } from '@/lib/openai-transcribe';

export async function POST(request: NextRequest) {
  try {
    const { projectId } = await request.json();

    if (!projectId) {
      return NextResponse.json({ error: 'Missing projectId' }, { status: 400 });
    }

    const projectDir = getProjectDir(projectId);
    console.log(`[transcribe] Starting transcription for project ${projectId}`);

    const result = await transcribeAudio(projectDir);
    console.log(`[transcribe] Got ${result.words.length} words in ${result.paragraphs.length} paragraphs`);

    // Save progress
    const existing = loadProjectState(projectId);
    saveProjectState({
      ...existing!,
      projectId,
      createdAt: existing?.createdAt || new Date().toISOString(),
      step: 'transcribed',
      words: result.words,
      paragraphs: result.paragraphs,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('[transcribe] Error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
