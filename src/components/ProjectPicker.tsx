'use client';

import { useEffect, useState } from 'react';

interface ProjectSummary {
  projectId: string;
  url?: string;
  createdAt: string;
  step: string;
}

interface ProjectPickerProps {
  onSelect: (projectId: string) => void;
  currentProjectId: string | null;
}

export default function ProjectPicker({ onSelect, currentProjectId }: ProjectPickerProps) {
  const [projects, setProjects] = useState<ProjectSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/projects')
      .then((res) => res.json())
      .then((data) => setProjects(data.projects || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="border-b border-[var(--border)] px-6 py-3 text-sm text-gray-400">
        Loading projects...
      </div>
    );
  }

  if (projects.length === 0) {
    return (
      <div className="border-b border-[var(--border)] px-6 py-3 text-sm text-gray-500">
        No saved projects yet.
      </div>
    );
  }

  const stepLabels: Record<string, string> = {
    downloaded: 'Downloaded',
    transcribed: 'Transcribed',
    analyzed: 'Analyzed',
    rendered: 'Rendered',
  };

  return (
    <div className="border-b border-[var(--border)] px-6 py-3 max-h-[200px] overflow-y-auto">
      <div className="text-xs text-gray-400 mb-2 font-medium">Recent Projects</div>
      <div className="space-y-1">
        {projects.map((p) => {
          const isCurrent = p.projectId === currentProjectId;
          const date = new Date(p.createdAt);
          const timeStr = date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

          return (
            <button
              key={p.projectId}
              onClick={() => onSelect(p.projectId)}
              disabled={isCurrent}
              className={`w-full text-left px-3 py-2 rounded text-sm flex items-center gap-3 transition-colors
                ${isCurrent
                  ? 'bg-[var(--accent)]/20 border border-[var(--accent)]/40 cursor-default'
                  : 'bg-[var(--surface)] hover:bg-[var(--surface-hover)] border border-transparent'
                }`}
            >
              <span className="font-mono text-xs text-gray-500 w-24 shrink-0">{p.projectId}</span>
              <span className="flex-1 truncate text-gray-300">{p.url || 'Unknown URL'}</span>
              <span className="text-xs text-gray-500">{stepLabels[p.step] || p.step}</span>
              <span className="text-xs text-gray-600">{timeStr}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
