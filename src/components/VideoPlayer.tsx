'use client';

import React, { useRef, useImperativeHandle, forwardRef, useEffect, useState } from 'react';
import { Film, Volume2 } from 'lucide-react';

export interface VideoPlayerRef {
  seekTo: (timeStr: string) => void;
}

interface VideoPlayerProps {
  videoUrl?: string | null;
  localFile?: File | null;
  mediaType?: 'video' | 'audio';
}

export const parseTimeToSeconds = (timeStr: string): number => {
  if (!timeStr) return 0;
  const clean = timeStr.replace(/[\[\]]/g, '').trim();
  const parts = clean.split(':').map((p) => parseInt(p, 10));
  if (parts.length === 3) {
    return parts[0] * 3600 + parts[1] * 60 + parts[2];
  } else if (parts.length === 2) {
    return parts[0] * 60 + parts[1];
  }
  return 0;
};

export const getYouTubeVideoId = (url?: string | null): string | null => {
  if (!url) return null;
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  return match && match[2].length === 11 ? match[2] : null;
};

const VideoPlayer = forwardRef<VideoPlayerRef, VideoPlayerProps>(
  ({ videoUrl, localFile, mediaType = 'video' }, ref) => {
    const iframeRef = useRef<HTMLIFrameElement>(null);
    const mediaRef = useRef<HTMLVideoElement | HTMLAudioElement>(null);
    const [localUrl, setLocalUrl] = useState<string | null>(null);

    const ytId = getYouTubeVideoId(videoUrl);

    useEffect(() => {
      if (localFile) {
        const url = URL.createObjectURL(localFile);
        setLocalUrl(url);
        return () => {
          URL.revokeObjectURL(url);
        };
      } else {
        setLocalUrl(null);
      }
    }, [localFile]);

    useImperativeHandle(ref, () => ({
      seekTo: (timeStr: string) => {
        const seconds = parseTimeToSeconds(timeStr);
        if (ytId && iframeRef.current) {
          iframeRef.current.contentWindow?.postMessage(
            JSON.stringify({
              event: 'command',
              func: 'seekTo',
              args: [seconds, true],
            }),
            '*'
          );
          iframeRef.current.contentWindow?.postMessage(
            JSON.stringify({
              event: 'command',
              func: 'playVideo',
              args: [],
            }),
            '*'
          );
        } else if (mediaRef.current) {
          mediaRef.current.currentTime = seconds;
          mediaRef.current.play().catch(() => {});
        }
      },
    }));

    if (!ytId && !localUrl) {
      return (
        <div className="w-full aspect-video rounded-2xl bg-dark-card/60 border border-slate-800 flex flex-col items-center justify-center text-slate-500 p-6 text-center">
          <div className="w-12 h-12 rounded-xl bg-slate-800/80 flex items-center justify-center text-slate-400 mb-3 border border-slate-700/50">
            <Film className="w-6 h-6" />
          </div>
          <p className="text-sm font-medium text-slate-300">Media pleyer kutilmoqda</p>
          <p className="text-xs text-slate-500 mt-1 max-w-xs">
            YouTube havola kiriting yoki kompyuteringizdan video/audio yuklang
          </p>
        </div>
      );
    }

    if (ytId) {
      return (
        <div className="w-full aspect-video rounded-2xl overflow-hidden border border-slate-800 shadow-2xl bg-black relative group">
          <iframe
            ref={iframeRef}
            src={`https://www.youtube.com/embed/${ytId}?enablejsapi=1&origin=${typeof window !== 'undefined' ? window.location.origin : ''}`}
            title="YouTube video player"
            className="w-full h-full border-0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      );
    }

    if (localUrl && mediaType === 'audio') {
      return (
        <div className="w-full rounded-2xl bg-dark-card border border-slate-800 p-6 flex flex-col items-center justify-center shadow-xl">
          <div className="w-14 h-14 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 mb-4">
            <Volume2 className="w-7 h-7" />
          </div>
          <p className="text-sm font-semibold text-slate-200 mb-1">{localFile?.name || 'Yuklangan audio'}</p>
          <p className="text-xs text-slate-400 mb-4">
            {localFile?.size ? `${(localFile.size / (1024 * 1024)).toFixed(1)} MB` : ''}
          </p>
          <audio ref={mediaRef as any} src={localUrl} controls className="w-full max-w-md accent-blue-500" />
        </div>
      );
    }

    return (
      <div className="w-full aspect-video rounded-2xl overflow-hidden border border-slate-800 shadow-2xl bg-black">
        <video
          ref={mediaRef as any}
          src={localUrl!}
          controls
          className="w-full h-full object-contain"
        />
      </div>
    );
  }
);

VideoPlayer.displayName = 'VideoPlayer';
export default VideoPlayer;
