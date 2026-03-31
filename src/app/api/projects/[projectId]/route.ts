import { NextRequest, NextResponse } from 'next/server';
import { loadProjectState } from '@/lib/project';

export async function GET(
  _request: NextRequest,
  { params }: { params: { projectId: string } }
) {
  try {
    const { projectId } = params;
    const state = loadProjectState(projectId);

    if (!state) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    return NextResponse.json(state);
  } catch (error) {
    console.error('[project load] Error:', error);
    return NextResponse.json({ error: 'Failed to load project' }, { status: 500 });
  }
}
