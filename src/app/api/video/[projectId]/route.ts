import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { getProjectDir } from '@/lib/project';

export async function GET(
  request: NextRequest,
  { params }: { params: { projectId: string } }
) {
  try {
    const { projectId } = params;
    const type = request.nextUrl.searchParams.get('type');
    const projectDir = getProjectDir(projectId);
    const filename = type === 'output' ? 'output.mp4' : 'video.mp4';
    const filePath = path.join(projectDir, filename);

    if (!fs.existsSync(filePath)) {
      return NextResponse.json({ error: 'Video not found' }, { status: 404 });
    }

    const stat = fs.statSync(filePath);
    const fileSize = stat.size;
    const range = request.headers.get('range');

    if (range) {
      const parts = range.replace(/bytes=/, '').split('-');
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
      const chunkSize = end - start + 1;

      const buffer = Buffer.alloc(chunkSize);
      const fd = fs.openSync(filePath, 'r');
      fs.readSync(fd, buffer, 0, chunkSize, start);
      fs.closeSync(fd);

      return new Response(buffer, {
        status: 206,
        headers: {
          'Content-Range': `bytes ${start}-${end}/${fileSize}`,
          'Accept-Ranges': 'bytes',
          'Content-Length': String(chunkSize),
          'Content-Type': 'video/mp4',
        },
      });
    }

    // For full file requests, read the whole file into a buffer
    const buffer = fs.readFileSync(filePath);

    return new Response(buffer, {
      headers: {
        'Content-Length': String(fileSize),
        'Content-Type': 'video/mp4',
        'Accept-Ranges': 'bytes',
      },
    });
  } catch (error) {
    console.error('[video] Error:', error);
    return NextResponse.json({ error: 'Failed to serve video' }, { status: 500 });
  }
}
