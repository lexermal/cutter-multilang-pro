import { spawn } from 'child_process';
import path from 'path';

export async function extractAudio(videoPath: string, projectDir: string): Promise<string> {
  const audioPath = path.join(projectDir, 'audio.mp3');

  return new Promise((resolve, reject) => {
    const proc = spawn('ffmpeg', [
      '-i', videoPath,
      '-vn',
      '-acodec', 'libmp3lame',
      '-q:a', '2',
      '-y',
      audioPath,
    ]);

    let stderr = '';
    proc.stderr.on('data', (data) => { stderr += data.toString(); });

    proc.on('close', (code) => {
      if (code === 0) resolve(audioPath);
      else reject(new Error(`ffmpeg audio extraction failed (code ${code}): ${stderr}`));
    });

    proc.on('error', (err) => reject(new Error(`Failed to spawn ffmpeg: ${err.message}`)));
  });
}

export async function getVideoDuration(videoPath: string): Promise<number> {
  return new Promise((resolve, reject) => {
    const proc = spawn('ffprobe', [
      '-v', 'error',
      '-show_entries', 'format=duration',
      '-of', 'default=noprint_wrappers=1:nokey=1',
      videoPath,
    ]);

    let stdout = '';
    proc.stdout.on('data', (data) => { stdout += data.toString(); });

    proc.on('close', (code) => {
      if (code === 0) resolve(parseFloat(stdout.trim()));
      else reject(new Error('Failed to get video duration'));
    });

    proc.on('error', (err) => reject(err));
  });
}

interface CutSegment {
  start: number;
  end: number;
}

export async function renderWithCuts(
  videoPath: string,
  projectDir: string,
  cuts: CutSegment[],
  speed: number,
): Promise<string> {
  const outputPath = path.join(projectDir, 'output.mp4');
  const duration = await getVideoDuration(videoPath);

  // Sort cuts by start time and merge overlapping
  const sorted = [...cuts].sort((a, b) => a.start - b.start);
  const merged: CutSegment[] = [];
  for (const cut of sorted) {
    const last = merged[merged.length - 1];
    if (last && cut.start <= last.end + 0.05) {
      last.end = Math.max(last.end, cut.end);
    } else {
      merged.push({ ...cut });
    }
  }

  // Compute keep intervals (inverse of cuts)
  const keeps: CutSegment[] = [];
  let pos = 0;
  for (const cut of merged) {
    if (cut.start > pos + 0.05) {
      keeps.push({ start: pos, end: cut.start });
    }
    pos = cut.end;
  }
  if (pos < duration - 0.05) {
    keeps.push({ start: pos, end: duration });
  }

  if (keeps.length === 0) {
    throw new Error('Nothing to keep — all content would be cut');
  }

  // Build ffmpeg filter complex
  const filterParts: string[] = [];
  const concatInputs: string[] = [];

  keeps.forEach((k, i) => {
    filterParts.push(
      `[0:v]trim=start=${k.start.toFixed(3)}:end=${k.end.toFixed(3)},setpts=PTS-STARTPTS[v${i}]`
    );
    filterParts.push(
      `[0:a]atrim=start=${k.start.toFixed(3)}:end=${k.end.toFixed(3)},asetpts=PTS-STARTPTS[a${i}]`
    );
    concatInputs.push(`[v${i}][a${i}]`);
  });

  filterParts.push(
    `${concatInputs.join('')}concat=n=${keeps.length}:v=1:a=1[outv][outa]`
  );

  // Apply speed adjustment
  if (Math.abs(speed - 1.0) > 0.01) {
    filterParts.push(`[outv]setpts=${(1 / speed).toFixed(4)}*PTS[finalv]`);
    // atempo only accepts 0.5-2.0 range
    const clampedSpeed = Math.min(2.0, Math.max(0.5, speed));
    filterParts.push(`[outa]atempo=${clampedSpeed.toFixed(4)}[finala]`);
  }

  const finalV = Math.abs(speed - 1.0) > 0.01 ? '[finalv]' : '[outv]';
  const finalA = Math.abs(speed - 1.0) > 0.01 ? '[finala]' : '[outa]';

  const filterComplex = filterParts.join(';\n');

  return new Promise((resolve, reject) => {
    const args = [
      '-i', videoPath,
      '-filter_complex', filterComplex,
      '-map', finalV,
      '-map', finalA,
      '-c:v', 'libx264',
      '-preset', 'fast',
      '-c:a', 'aac',
      '-y',
      outputPath,
    ];

    console.log('[ffmpeg] Running render with', keeps.length, 'keep segments, speed:', speed);
    const proc = spawn('ffmpeg', args);

    let stderr = '';
    proc.stderr.on('data', (data) => { stderr += data.toString(); });

    proc.on('close', (code) => {
      if (code === 0) resolve(outputPath);
      else reject(new Error(`ffmpeg render failed (code ${code}): ${stderr.slice(-500)}`));
    });

    proc.on('error', (err) => reject(new Error(`Failed to spawn ffmpeg: ${err.message}`)));
  });
}
