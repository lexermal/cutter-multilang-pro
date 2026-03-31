import { NextRequest, NextResponse } from 'next/server';
import { getVideoPath, getProjectDir, loadProjectState, saveProjectState } from '@/lib/project';
import { renderWithCuts } from '@/lib/ffmpeg';

export async function POST(request: NextRequest) {
  try {
    const { projectId, cuts, speed } = await request.json() as {
      projectId: string;
      cuts: { start: number; end: number }[];
      speed: number;
    };

    if (!projectId || !cuts) {
      return NextResponse.json({ error: 'Missing projectId or cuts' }, { status: 400 });
    }

    const videoPath = getVideoPath(projectId);
    const projectDir = getProjectDir(projectId);

    console.log(`[render] Rendering project ${projectId} with ${cuts.length} cuts, speed ${speed}`);

    const outputPath = await renderWithCuts(videoPath, projectDir, cuts, speed || 1.0);
    console.log(`[render] Output: ${outputPath}`);

    const outputUrl = `/api/video/${projectId}?type=output`;

    // Save progress
    const existing = loadProjectState(projectId);
    if (existing) {
      saveProjectState({
        ...existing,
        step: 'rendered',
        speed: speed || 1.0,
        outputPath: outputUrl,
      });
    }

    return NextResponse.json({ outputPath: outputUrl });
  } catch (error) {
    console.error('[render] Error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
