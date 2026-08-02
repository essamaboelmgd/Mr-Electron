import { useEffect, useRef } from 'react';
import { recordVideoEvent } from '@/services/coursesService';

type Provider = 'youtube' | 'vimeo' | 'bunny';
export interface VideoSource { url: string; provider: Provider; videoId?: string; }

interface Props { lessonId: string; title: string; source: VideoSource; }

interface YouTubePlayer {
  getCurrentTime: () => number;
  getDuration: () => number;
  destroy: () => void;
}

interface PlayerPayload { seconds?: number; duration?: number; }

interface PlayerJsInstance {
  on: (event: string, callback: (payload?: PlayerPayload) => void) => void;
  off?: (event: string, callback: (payload?: PlayerPayload) => void) => void;
}

declare global {
  interface Window {
    YT?: { Player: new (element: HTMLElement, options: Record<string, unknown>) => YouTubePlayer };
    onYouTubeIframeAPIReady?: () => void;
    playerjs?: { Player: new (iframe: HTMLIFrameElement) => PlayerJsInstance };
  }
}

let youtubeApiPromise: Promise<void> | null = null;
let playerJsPromise: Promise<void> | null = null;

const loadExternalScript = (src: string, ready: () => boolean, callbackName?: 'onYouTubeIframeAPIReady') => new Promise<void>((resolve, reject) => {
  if (ready()) { resolve(); return; }
  const script = document.querySelector(`script[src="${src}"]`) as HTMLScriptElement | null;
  const finish = () => { if (ready()) resolve(); else reject(new Error('مشغل الفيديو غير متاح.')); };
  if (callbackName) {
    const previous = window[callbackName];
    window[callbackName] = () => { previous?.(); finish(); };
  }
  if (script) { script.addEventListener('load', finish, { once: true }); script.addEventListener('error', () => reject(new Error('تعذر تحميل مشغل الفيديو.')), { once: true }); return; }
  const element = document.createElement('script');
  element.src = src; element.async = true; element.onload = finish; element.onerror = () => reject(new Error('تعذر تحميل مشغل الفيديو.'));
  document.head.appendChild(element);
});

const loadYouTubeApi = () => youtubeApiPromise ||= loadExternalScript('https://www.youtube.com/iframe_api', () => Boolean(window.YT?.Player), 'onYouTubeIframeAPIReady');
const loadPlayerJs = () => playerJsPromise ||= loadExternalScript('https://cdn.jsdelivr.net/npm/player.js@0.1.0/dist/player-0.1.0.min.js', () => Boolean(window.playerjs?.Player));

const makeSessionId = () => {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID();
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
};

const youtubeUrl = (source: VideoSource) => {
  const url = new URL(source.url);
  url.searchParams.set('enablejsapi', '1');
  url.searchParams.set('origin', window.location.origin);
  url.searchParams.set('playsinline', '1');
  url.searchParams.set('rel', '0');
  url.searchParams.set('modestbranding', '1');
  url.searchParams.set('fs', '0');
  url.searchParams.set('disablekb', '1');
  return url.toString();
};

export default function VideoPlayer({ lessonId, title, source }: Props) {
  const youtubeHost = useRef<HTMLDivElement | null>(null);
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const sessionRef = useRef(makeSessionId());
  const lastSampleRef = useRef({ position: 0, at: Date.now(), duration: 0, playing: false });

  useEffect(() => {
    let disposed = false;
    let timer: number | undefined;
    let youtubePlayer: YouTubePlayer | null = null;
    let playerJs: PlayerJsInstance | null = null;
    const sessionId = sessionRef.current;

    const send = (event: 'play' | 'pause' | 'timeupdate' | 'ended' | 'seeked', position: number, duration: number, delta: number) => {
      void recordVideoEvent(lessonId, { sessionId, event, positionSeconds: Math.max(0, position || 0), durationSeconds: Math.max(0, duration || 0), watchedDeltaSeconds: Math.min(30, Math.max(0, delta || 0)) }).catch(() => undefined);
    };
    const markOpened = () => send('timeupdate', 0, 0, 0);
    const flush = (event: 'pause' | 'timeupdate' | 'ended', position: number, duration: number, playing: boolean) => {
      const now = Date.now();
      const state = lastSampleRef.current;
      const elapsed = playing && state.playing ? Math.min(30, Math.max(0, (now - state.at) / 1000)) : 0;
      const distance = position >= state.position && position - state.position <= 30 ? position - state.position : 0;
      send(event, position, duration, Math.max(elapsed, distance));
      lastSampleRef.current = { position, duration, at: now, playing };
    };

    const mountYouTube = () => {
      if (disposed || !youtubeHost.current || !window.YT?.Player || !source.videoId) return;
      youtubePlayer = new window.YT.Player(youtubeHost.current, {
        videoId: source.videoId,
        playerVars: { autoplay: 0, controls: 1, enablejsapi: 1, fs: 0, modestbranding: 1, playsinline: 1, rel: 0, origin: window.location.origin },
        events: {
          onReady: () => markOpened(),
          onStateChange: (event: { data: number }) => {
            if (!youtubePlayer) return;
            const current = youtubePlayer.getCurrentTime();
            const duration = youtubePlayer.getDuration();
            if (event.data === 1) { lastSampleRef.current = { position: current, duration, at: Date.now(), playing: true }; send('play', current, duration, 0); }
            if (event.data === 2) flush('pause', current, duration, false);
            if (event.data === 0) flush('ended', current, duration, true);
          }
        }
      });
      timer = window.setInterval(() => { if (youtubePlayer && lastSampleRef.current.playing) flush('timeupdate', youtubePlayer.getCurrentTime(), youtubePlayer.getDuration(), true); }, 10000);
    };

    const mountPlayerJs = () => {
      if (disposed || !iframeRef.current || !window.playerjs?.Player) return;
      playerJs = new window.playerjs.Player(iframeRef.current);
      markOpened();
      playerJs.on('ready', markOpened);
      playerJs.on('play', (payload) => { const position = Number(payload?.seconds || 0); const duration = Number(payload?.duration || 0); lastSampleRef.current = { position, duration, at: Date.now(), playing: true }; send('play', position, duration, 0); });
      playerJs.on('pause', (payload) => { flush('pause', Number(payload?.seconds || lastSampleRef.current.position), Number(payload?.duration || lastSampleRef.current.duration), false); });
      playerJs.on('timeupdate', (payload) => { const position = Number(payload?.seconds || 0); const duration = Number(payload?.duration || lastSampleRef.current.duration); flush('timeupdate', position, duration, true); });
      playerJs.on('seeked', (payload) => { const position = Number(payload?.seconds || lastSampleRef.current.position); const duration = Number(payload?.duration || lastSampleRef.current.duration); send('seeked', position, duration, 0); lastSampleRef.current = { position, duration, at: Date.now(), playing: lastSampleRef.current.playing }; });
      playerJs.on('ended', (payload) => flush('ended', Number(payload?.seconds || lastSampleRef.current.position), Number(payload?.duration || lastSampleRef.current.duration), true));
    };

    if (source.provider === 'youtube' && source.videoId) {
      loadYouTubeApi().then(mountYouTube).catch(markOpened);
    } else {
      loadPlayerJs().then(mountPlayerJs).catch(markOpened);
    }
    return () => { disposed = true; if (timer) window.clearInterval(timer); youtubePlayer?.destroy(); playerJs = null; };
  }, [lessonId, source.provider, source.url, source.videoId]);

  return <div className="video-player-shell">
    {source.provider === 'youtube' && source.videoId ? <div className="video-player-host" ref={youtubeHost} /> : <iframe ref={iframeRef} src={source.provider === 'youtube' ? youtubeUrl(source) : source.url} title={title} allow="autoplay; fullscreen; picture-in-picture" allowFullScreen referrerPolicy="strict-origin-when-cross-origin" />}
    <span className="video-watermark" aria-hidden="true">mr electron · مشاهدة تعليمية</span>
  </div>;
}
