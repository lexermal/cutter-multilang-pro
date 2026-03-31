'use client';

import { forwardRef, useEffect } from 'react';

interface VideoPlayerProps {
  src: string | null;
  onTimeUpdate: (time: number) => void;
}

const VideoPlayer = forwardRef<HTMLVideoElement, VideoPlayerProps>(
  ({ src, onTimeUpdate }, ref) => {
    useEffect(() => {
      const video = (ref as React.RefObject<HTMLVideoElement>)?.current;
      if (!video) return;

      const handleTimeUpdate = () => {
        onTimeUpdate(video.currentTime);
      };

      video.addEventListener('timeupdate', handleTimeUpdate);
      return () => video.removeEventListener('timeupdate', handleTimeUpdate);
    }, [ref, onTimeUpdate]);

    if (!src) {
      return (
        <div className="aspect-video bg-[var(--surface)] flex items-center justify-center text-gray-500 text-sm">
          No video loaded
        </div>
      );
    }

    return (
      <video
        ref={ref}
        src={src}
        controls
        className="w-full aspect-video bg-black"
      />
    );
  }
);

VideoPlayer.displayName = 'VideoPlayer';
export default VideoPlayer;
