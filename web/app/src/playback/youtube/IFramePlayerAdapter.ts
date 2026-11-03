import type { YouTubeSelection } from './links';

export interface IFramePlayer {
  cueVideoById(options: { videoId: string; startSeconds: number }): void;
  loadVideoById(options: { videoId: string; startSeconds: number }): void;
  cuePlaylist(options: { listType: 'playlist'; list: string; index: number; startSeconds: number }): void;
  loadPlaylist(options: { listType: 'playlist'; list: string; index: number; startSeconds: number }): void;
  playVideo(): void;
  pauseVideo(): void;
  stopVideo(): void;
  nextVideo(): void;
  previousVideo(): void;
  seekTo(seconds: number, allowSeekAhead: boolean): void;
  getCurrentTime(): number;
  getDuration(): number;
  getPlayerState(): number;
  getVideoData(): { video_id?: string; title?: string; author?: string };
  destroy(): void;
}
interface PlayerOptions {
  width: string;
  height: string;
  playerVars: { playsinline: number; controls: number; autoplay: number; origin: string };
  events: {
    onReady(): void;
    onStateChange(event: { data: number }): void;
    onError(event: { data: number }): void;
    onAutoplayBlocked(): void;
  };
}
export interface IFrameAPI { Player: new (element: HTMLElement, options: PlayerOptions) => IFramePlayer }
type YouTubeWindow = Window & { YT?: IFrameAPI; onYouTubeIframeAPIReady?: () => void };

let apiPromise: Promise<IFrameAPI> | null = null;
/** One shared official script, with a bounded failure and a retry on the next attempt. */
export function loadIFrameAPI(): Promise<IFrameAPI> {
  const host = window as YouTubeWindow;
  if (host.YT?.Player) return Promise.resolve(host.YT);
  if (apiPromise) return apiPromise;
  const pending = new Promise<IFrameAPI>((resolve, reject) => {
    const script = document.createElement('script');
    const previous = host.onYouTubeIframeAPIReady;
    const finish = () => {
      clearTimeout(timer);
      if (host.onYouTubeIframeAPIReady === ready) host.onYouTubeIframeAPIReady = previous;
      script.onerror = null;
    };
    const fail = () => {
      finish();
      script.remove();
      reject(new Error('YouTube could not load. Check your connection or content blocker, then try the link again.'));
    };
    const ready = () => {
      finish();
      if (host.YT?.Player) resolve(host.YT);
      else reject(new Error('YouTube player is unavailable. Try again.'));
      previous?.();
    };
    const timer = window.setTimeout(fail, 15000);
    host.onYouTubeIframeAPIReady = ready;
    script.src = 'https://www.youtube.com/iframe_api';
    script.async = true;
    script.onerror = fail;
    document.head.append(script);
  });
  apiPromise = pending.catch((error: unknown) => { apiPromise = null; throw error; });
  return apiPromise;
}

export function youtubeErrorMessage(code: number): string {
  switch (code) {
    case 2: return 'This YouTube link is invalid. Try another video or playlist.';
    case 5: return 'YouTube could not play this video in your browser. Try again or open it on YouTube.';
    case 100: return 'This video is unavailable, private, or removed. Try another video.';
    case 101:
    case 150: return 'The owner does not allow this video to play on other websites. Open it on YouTube or choose another video.';
    case 153: return 'YouTube could not verify this website’s playback origin. Open the HTTPS site in Safari or open the video on YouTube.';
    default: return 'YouTube could not play this content. Availability can depend on your region, age, account, or the video owner. Try another video or open YouTube.';
  }
}

export interface IFrameSnapshot {
  videoId: string;
  title: string;
  author: string;
  duration: number;
  seconds: number;
  state: number;
}
interface Callbacks {
  snapshot(snapshot: IFrameSnapshot): void;
  ended(): void;
  error(message: string): void;
  notice(message: string | null): void;
}

/** Foreground, visible playback only. No media URLs, audio extraction, or Web Audio. */
export class IFramePlayerAdapter {
  private player: IFramePlayer | null = null;
  private ready = false;
  private generation = 0;
  private selection: YouTubeSelection | null = null;
  private autoplay = false;

  constructor(private callbacks: Callbacks, private loadAPI = loadIFrameAPI) {}

  attach(container: HTMLElement): () => void {
    const generation = ++this.generation;
    const target = document.createElement('div');
    container.replaceChildren(target);
    let timer: number | undefined;
    const active = () => generation === this.generation;
    const visible = () => {
      if (document.hidden) {
        this.pause();
        this.callbacks.notice('YouTube playback pauses when ZynPlayer is in the background. Return here and tap Play.');
      }
    };
    document.addEventListener('visibilitychange', visible);
    void this.loadAPI().then((api) => {
      if (!active()) return;
      timer = window.setTimeout(() => {
        if (active() && !this.ready) this.callbacks.error('YouTube did not become ready. Check your connection, then tap Retry or open YouTube.');
      }, 15000);
      this.player = new api.Player(target, {
        width: '100%', height: '100%',
        playerVars: { playsinline: 1, controls: 1, autoplay: 0, origin: window.location.origin },
        events: {
          onReady: () => {
            if (!active()) return;
            clearTimeout(timer);
            this.ready = true;
            this.applySelection();
            timer = window.setInterval(() => this.report(), 500);
          },
          onStateChange: ({ data }) => {
            if (!active() || !this.ready || !this.selection) return;
            if (data === 1 && document.hidden) { visible(); return; }
            this.report();
            // YouTube itself advances a linked playlist. App queues advance only individual videos.
            if (data === 0 && this.selection.kind === 'video') this.callbacks.ended();
          },
          onError: ({ data }) => { if (active()) { this.pause(); this.callbacks.error(youtubeErrorMessage(data)); } },
          onAutoplayBlocked: () => {
            if (!active()) return;
            this.callbacks.notice('Safari or YouTube requires a tap. Tap Play in the visible YouTube player to start.');
            this.report();
          },
        },
      });
    }).catch((error: unknown) => {
      if (active()) this.callbacks.error(error instanceof Error ? error.message : 'YouTube could not load. Try again.');
    });
    return () => {
      if (!active()) return;
      ++this.generation;
      clearInterval(timer);
      document.removeEventListener('visibilitychange', visible);
      this.ready = false;
      this.autoplay = false;
      this.player?.destroy();
      this.player = null;
      container.replaceChildren();
    };
  }

  select(selection: YouTubeSelection, autoplay = false): void {
    this.selection = selection;
    this.autoplay = autoplay;
    this.callbacks.notice('Tap Play in the visible YouTube player if playback does not start.');
    this.applySelection();
  }
  private applySelection(): void {
    if (!this.ready || !this.player || !this.selection) return;
    if (this.selection.kind === 'video') {
      const options = { videoId: this.selection.videoId, startSeconds: this.selection.startSeconds };
      if (this.autoplay && !document.hidden) this.player.loadVideoById(options);
      else this.player.cueVideoById(options);
    } else {
      const options = { listType: 'playlist' as const, list: this.selection.playlistId, index: this.selection.index, startSeconds: this.selection.startSeconds };
      if (this.autoplay && !document.hidden) this.player.loadPlaylist(options);
      else this.player.cuePlaylist(options);
    }
  }
  report(): void {
    if (!this.ready || !this.player || !this.selection) return;
    const data = this.player.getVideoData();
    if (this.selection.kind === 'video' && data.video_id !== this.selection.videoId) return;
    const state = this.player.getPlayerState();
    if (state === 1) this.callbacks.notice(null);
    this.callbacks.snapshot({
      videoId: data.video_id || '', title: data.title || '', author: data.author || '',
      duration: this.duration(), seconds: this.currentTime(), state,
    });
  }
  play(): void {
    this.autoplay = true;
    if (document.hidden) return;
    if (this.ready) this.player?.playVideo();
  }
  pause(): void {
    this.autoplay = false;
    if (this.ready) this.player?.pauseVideo();
  }
  stop(): void {
    this.autoplay = false;
    this.selection = null;
    if (this.ready) this.player?.stopVideo();
  }
  next(): void { if (this.ready && this.selection?.kind === 'playlist') this.player?.nextVideo(); }
  previous(): void { if (this.ready && this.selection?.kind === 'playlist') this.player?.previousVideo(); }
  seek(seconds: number): void {
    const duration = this.duration();
    if (this.ready && duration > 0 && Number.isFinite(seconds)) this.player?.seekTo(Math.max(0, Math.min(seconds, duration)), true);
  }
  currentTime(): number {
    const seconds = this.ready ? this.player?.getCurrentTime() : 0;
    return seconds && Number.isFinite(seconds) ? Math.max(0, seconds) : 0;
  }
  duration(): number {
    const duration = this.ready ? this.player?.getDuration() : 0;
    return duration && Number.isFinite(duration) ? Math.max(0, duration) : 0;
  }
}
