import { useEffect, useRef, useState } from 'react';
import { BackwardIcon, ForwardIcon, PauseIcon, PlayIcon } from '@/components/icons/Transport';
import { getPlaybackDuration, getPlayhead, iframePlayer, stopPlayback, usePlayer } from '@/state/player';
import { youtubeLink } from '@/playback/youtube/links';
import { clock } from './useScrubber';

/** Always in the shell, outside route content; never hidden, covered by our full-screen player, or audio-only. */
export function YouTubeSurface() {
  const host = useRef<HTMLDivElement>(null);
  const [attempt, setAttempt] = useState(0);
  const [seconds, setSeconds] = useState(0);
  const [draft, setDraft] = useState<number | null>(null);
  const selection = usePlayer((s) => s.youtubeSelection);
  const status = usePlayer((s) => s.status);
  const error = usePlayer((s) => s.error);
  const notice = usePlayer((s) => s.playbackNotice);
  const track = usePlayer((s) => s.nowPlaying);
  const hasNext = usePlayer((s) => s.youtubeSelection?.kind === 'playlist' || s.index + 1 < s.queue.length || s.repeat !== 'off');
  const { togglePlay, previous, next, seek } = usePlayer.getState();
  useEffect(() => host.current ? iframePlayer.attach(host.current) : undefined, [attempt]);
  useEffect(() => {
    const element = host.current;
    if (!element || typeof IntersectionObserver === 'undefined') return;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry && entry.intersectionRatio < 0.98 && usePlayer.getState().status === 'playing') {
        iframePlayer.pause();
        usePlayer.setState({ playbackNotice: 'Keep the whole YouTube video visible, then tap Play to continue.' });
      }
    }, { threshold: [0, 0.98, 1] });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);
  useEffect(() => {
    const timer = window.setInterval(() => setSeconds(getPlayhead()?.sec ?? 0), 500);
    return () => clearInterval(timer);
  }, []);
  const duration = getPlaybackDuration();
  const playing = status === 'playing' || status === 'buffering';
  return (
    <section className="youtube-surface border-t border-divider bg-page px-3 py-2" aria-label="Visible YouTube player">
      <div className="youtube-frame mx-auto w-full max-w-[420px]" ref={host} />
      <div className="youtube-controls mx-auto flex w-full max-w-[700px] min-w-0 flex-col gap-1">
        <div className="flex min-w-0 items-center gap-1">
          <span className="min-w-0 flex-1 truncate type-callout-emphasized">{track?.title || 'YouTube'}</span>
          <button className="grid size-11 shrink-0 place-items-center" aria-label="Previous" onClick={previous}><BackwardIcon size={24} /></button>
          <button className="grid size-11 shrink-0 place-items-center" aria-label={playing ? 'Pause' : 'Play'} onClick={togglePlay}>{playing ? <PauseIcon size={26} /> : <PlayIcon size={26} />}</button>
          <button className="grid size-11 shrink-0 place-items-center disabled:opacity-40" aria-label="Next" disabled={!hasNext} onClick={next}><ForwardIcon size={24} /></button>
          <button className="min-h-11 shrink-0 px-2 type-callout" onClick={stopPlayback}>Stop</button>
        </div>
        <label className="flex min-h-11 items-center gap-2 type-callout">
          <span className="tabular-nums">{clock(draft ?? seconds)}</span>
          <input type="range" className="min-w-0 flex-1 accent-key" aria-label="Seek YouTube video" min={0} max={duration || 1} step={1}
            disabled={!duration || status === 'error'} value={Math.min(draft ?? seconds, duration || 1)}
            onChange={(event) => setDraft(Number(event.currentTarget.value))}
            onPointerUp={(event) => { seek(Number(event.currentTarget.value)); setDraft(null); }}
            onPointerCancel={() => setDraft(null)}
            onKeyUp={(event) => { seek(Number(event.currentTarget.value)); setDraft(null); }}
            onBlur={(event) => { if (draft !== null) seek(Number(event.currentTarget.value)); setDraft(null); }} />
          <span className="tabular-nums">{clock(duration)}</span>
        </label>
        {error ? (
          <div role="alert" className="type-callout text-red">
            {error}{' '}
            <button className="min-h-11 px-2 underline" onClick={() => {
              usePlayer.setState({ status: 'loading', error: null });
              setAttempt((value) => value + 1);
              if (selection) iframePlayer.select(selection);
            }}>Retry</button>
          </div>
        ) : notice ? <p role="status" className="type-callout text-secondary">{notice}</p> : null}
        <p className="type-callout text-secondary">
          Keep the video visible and this app in the foreground. Use your device’s volume buttons.{' '}
          {selection && <a href={youtubeLink(selection)} target="_blank" rel="noopener" className="inline-flex min-h-11 items-center underline">Open on YouTube</a>}
        </p>
      </div>
    </section>
  );
}
