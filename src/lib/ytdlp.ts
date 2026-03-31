import { spawn } from 'child_process';
import path from 'path';

export async function downloadVideo(url: string, projectDir: string): Promise<string> {
  const outputPath = path.join(projectDir, 'video.mp4');

  return new Promise((resolve, reject) => {
    const proc = spawn('yt-dlp', [
      '-f', 'bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best',
      '--merge-output-format', 'mp4',
      '-o', outputPath,
      '--no-playlist',
      url,
    ]);

    let stderr = '';
    proc.stderr.on('data', (data) => { stderr += data.toString(); });
    proc.stdout.on('data', (data) => { console.log('[yt-dlp]', data.toString().trim()); });

    proc.on('close', (code) => {
      if (code === 0) {
        resolve(outputPath);
      } else {
        reject(new Error(`yt-dlp exited with code ${code}: ${stderr}`));
      }
    });

    proc.on('error', (err) => {
      reject(new Error(`Failed to spawn yt-dlp. Is it installed? ${err.message}`));
    });
  });
}
