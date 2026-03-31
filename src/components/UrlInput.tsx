'use client';

import { useState } from 'react';

interface UrlInputProps {
  onSubmit: (url: string) => void;
  disabled: boolean;
}

export default function UrlInput({ onSubmit, disabled }: UrlInputProps) {
  const [url, setUrl] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (url.trim()) {
      onSubmit(url.trim());
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex-1 flex gap-2">
      <input
        type="text"
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        placeholder="Paste YouTube URL here..."
        disabled={disabled}
        className="flex-1 bg-[var(--surface)] border border-[var(--border)] rounded-lg px-4 py-2 text-sm
          placeholder:text-gray-500 focus:outline-none focus:border-[var(--accent)]
          disabled:opacity-50 disabled:cursor-not-allowed"
      />
      <button
        type="submit"
        disabled={disabled || !url.trim()}
        className="bg-[var(--accent)] hover:bg-[var(--accent-hover)] px-5 py-2 rounded-lg text-sm font-medium
          transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {disabled ? 'Processing...' : 'Download & Transcribe'}
      </button>
    </form>
  );
}
