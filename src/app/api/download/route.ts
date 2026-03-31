import { NextRequest, NextResponse } from 'next/server';
import { nanoid } from 'nanoid';
import { getProjectDir, saveProjectState } from '@/lib/project';
import { downloadVideo } from '@/lib/ytdlp';
import { extractAudio } from '@/lib/ffmpeg';

export async function POST(request: NextRequest) {
  try {
    const { url } = await request.json();

    if (!url || typeof url !== 'string') {
      return NextResponse.json({ error: 'Missing or invalid URL' }, { status: 400 });
    }

    const projectId = nanoid(10);
    const projectDir = getProjectDir(projectId);

    console.log(`[download] Starting download for project ${projectId}: ${url}`);

    const videoPath = await downloadVideo(url, projectDir);
    console.log(`[download] Video downloaded: ${videoPath}`);

    const audioPath = await extractAudio(videoPath, projectDir);
    console.log(`[download] Audio extracted: ${audioPath}`);

    saveProjectState({
      projectId,
      url,
      createdAt: new Date().toISOString(),
      step: 'downloaded',
    });

    return NextResponse.json({ projectId, videoPath, audioPath });
  } catch (error) {
    console.error('[download] Error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
