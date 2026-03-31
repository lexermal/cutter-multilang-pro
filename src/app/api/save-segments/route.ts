import { NextRequest, NextResponse } from 'next/server';
import { Segment } from '@/types';
import { loadProjectState, saveProjectState } from '@/lib/project';

export async function POST(request: NextRequest) {
  try {
    const { projectId, segments } = await request.json() as {
      projectId: string;
      segments: Segment[];
    };

    if (!projectId || !segments) {
      return NextResponse.json({ error: 'Missing projectId or segments' }, { status: 400 });
    }

    const existing = loadProjectState(projectId);
    if (!existing) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    saveProjectState({
      ...existing,
      segments,
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('[save-segments] Error:', error);
    return NextResponse.json({ error: 'Failed to save segments' }, { status: 500 });
  }
}
