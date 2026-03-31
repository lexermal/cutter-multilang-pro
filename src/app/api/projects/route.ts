import { NextResponse } from 'next/server';
import { listProjects } from '@/lib/project';

export async function GET() {
  try {
    const projects = listProjects();
    // Return lightweight summaries (no words/segments to keep it fast)
    const summaries = projects.map(({ projectId, url, createdAt, step }) => ({
      projectId,
      url,
      createdAt,
      step,
    }));
    return NextResponse.json({ projects: summaries });
  } catch (error) {
    console.error('[projects] Error:', error);
    return NextResponse.json({ error: 'Failed to list projects' }, { status: 500 });
  }
}
