import path from 'path';
import fs from 'fs';
import { TranscribedWord, Segment } from '@/types';

const PROJECTS_DIR = path.join(process.cwd(), 'projects');

export interface ProjectData {
  projectId: string;
  url?: string;
  createdAt: string;
  step: 'downloaded' | 'transcribed' | 'analyzed' | 'rendered';
  words?: TranscribedWord[];
  paragraphs?: number[][];
  segments?: Segment[];
  speed?: number;
  outputPath?: string;
}

export function getProjectDir(projectId: string): string {
  const dir = path.join(PROJECTS_DIR, projectId);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  return dir;
}

export function getVideoPath(projectId: string): string {
  return path.join(getProjectDir(projectId), 'video.mp4');
}

export function getOutputPath(projectId: string): string {
  return path.join(getProjectDir(projectId), 'output.mp4');
}

function getStateFile(projectId: string): string {
  return path.join(getProjectDir(projectId), 'state.json');
}

export function saveProjectState(data: ProjectData): void {
  const filePath = getStateFile(data.projectId);
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
}

export function loadProjectState(projectId: string): ProjectData | null {
  const filePath = getStateFile(projectId);
  if (!fs.existsSync(filePath)) return null;
  const raw = fs.readFileSync(filePath, 'utf-8');
  return JSON.parse(raw) as ProjectData;
}

export function listProjects(): ProjectData[] {
  if (!fs.existsSync(PROJECTS_DIR)) return [];

  const entries = fs.readdirSync(PROJECTS_DIR, { withFileTypes: true });
  const projects: ProjectData[] = [];

  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    const state = loadProjectState(entry.name);
    if (state) projects.push(state);
  }

  // Most recent first
  projects.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  return projects;
}
