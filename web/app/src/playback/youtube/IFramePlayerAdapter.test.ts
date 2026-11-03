// @vitest-environment happy-dom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { IFramePlayerAdapter, loadIFrameAPI, youtubeErrorMessage, type IFrameAPI } from './IFramePlayerAdapter';

describe('visible YouTube adapter', () => {
  let events: ConstructorParameters<IFrameAPI['Player']>[1]['events'];
  const callbacks = { snapshot: vi.fn(), ended: vi.fn(), error: vi.fn(), notice: vi.fn() };
  const player = {
    cueVideoById: vi.fn(), loadVideoById: vi.fn(), cuePlaylist: vi.fn(), loadPlaylist: vi.fn(),
    playVideo: vi.fn(), pauseVideo: vi.fn(), stopVideo: vi.fn(), nextVideo: vi.fn(), previousVideo: vi.fn(),
    seekTo: vi.fn(), getCurrentTime: vi.fn(() => 23), getDuration: vi.fn(() => 120),
    getPlayerState: vi.fn(() => 5), getVideoData: vi.fn(() => ({ video_id: 'dQw4w9WgXcQ', title: 'Title', author: 'Artist' })), destroy: vi.fn(),
  };
  let configuration: ConstructorParameters<IFrameAPI['Player']>[1];
  const api: IFrameAPI = {
    Player: class {
      constructor(_element: HTMLElement, options: ConstructorParameters<IFrameAPI['Player']>[1]) {
        configuration = options;
        events = options.events;
        return player;
      }
    } as IFrameAPI['Player'],
  };
  let adapter: IFramePlayerAdapter;
  let release: (() => void) | undefined;
  const video = { kind: 'video' as const, videoId: 'dQw4w9WgXcQ', startSeconds: 10 };
  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();
    player.getDuration.mockReturnValue(120);
    player.getPlayerState.mockReturnValue(5);
    Object.defineProperty(document, 'hidden', { configurable: true, value: false });
    adapter = new IFramePlayerAdapter(callbacks, async () => api);
  });
  afterEach(() => { release?.(); release = undefined; vi.useRealTimers(); vi.restoreAllMocks(); });
  async function attach() {
    release = adapter.attach(document.createElement('div'));
    await Promise.resolve();
  }

  it('cues a selection made before readiness with native controls and inline video', async () => {
    adapter.select(video);
    await attach();
    expect(player.cueVideoById).not.toHaveBeenCalled();
    events.onReady();
    expect(player.cueVideoById).toHaveBeenCalledWith({ videoId: video.videoId, startSeconds: 10 });
    expect(configuration.playerVars).toEqual({ playsinline: 1, controls: 1, autoplay: 0, origin: window.location.origin });
    expect(player.loadVideoById).not.toHaveBeenCalled();
    adapter.play();
    expect(player.playVideo).toHaveBeenCalledOnce();
  });
  it('can cancel autoplay before readiness without a stale play starting later', async () => {
    adapter.select(video, true);
    adapter.pause();
    await attach();
    events.onReady();
    expect(player.cueVideoById).toHaveBeenCalledOnce();
    expect(player.loadVideoById).not.toHaveBeenCalled();
  });
  it('routes supported controls and clamps seek without seeking unknown live durations', async () => {
    await attach();
    events.onReady();
    adapter.select(video, true);
    expect(player.loadVideoById).toHaveBeenCalledOnce();
    adapter.pause();
    adapter.seek(500);
    expect(player.pauseVideo).toHaveBeenCalledOnce();
    expect(player.seekTo).toHaveBeenCalledWith(120, true);
    adapter.seek(-10);
    expect(player.seekTo).toHaveBeenLastCalledWith(0, true);
    adapter.seek(Number.NaN);
    player.getDuration.mockReturnValue(0);
    adapter.seek(30);
    expect(player.seekTo).toHaveBeenCalledTimes(2);
  });
  it('leaves linked playlist progression to YouTube and single-video progression to the app', async () => {
    await attach();
    events.onReady();
    adapter.select({ kind: 'playlist', playlistId: 'PLabcdefghijk', index: 2, startSeconds: 0 });
    expect(player.cuePlaylist).toHaveBeenCalledWith({ listType: 'playlist', list: 'PLabcdefghijk', index: 2, startSeconds: 0 });
    adapter.next();
    adapter.previous();
    expect(player.nextVideo).toHaveBeenCalledOnce();
    expect(player.previousVideo).toHaveBeenCalledOnce();
    events.onStateChange({ data: 0 });
    expect(callbacks.ended).not.toHaveBeenCalled();
    adapter.select(video);
    events.onStateChange({ data: 0 });
    expect(callbacks.ended).toHaveBeenCalledOnce();
  });
  it('reports real player metadata and explains blocked autoplay and embeds', async () => {
    await attach();
    events.onReady();
    adapter.select(video);
    events.onAutoplayBlocked();
    expect(callbacks.notice).toHaveBeenLastCalledWith(expect.stringContaining('requires a tap'));
    expect(callbacks.snapshot).toHaveBeenLastCalledWith({ videoId: video.videoId, title: 'Title', author: 'Artist', duration: 120, seconds: 23, state: 5 });
    events.onError({ data: 150 });
    expect(callbacks.error).toHaveBeenLastCalledWith(expect.stringContaining('owner does not allow'));
  });
  it('pauses when backgrounded and requires a fresh tap on return', async () => {
    await attach();
    events.onReady();
    adapter.select(video);
    Object.defineProperty(document, 'hidden', { configurable: true, value: true });
    document.dispatchEvent(new Event('visibilitychange'));
    expect(player.pauseVideo).toHaveBeenCalledOnce();
    adapter.play();
    expect(player.playVideo).not.toHaveBeenCalled();
    Object.defineProperty(document, 'hidden', { configurable: true, value: false });
    document.dispatchEvent(new Event('visibilitychange'));
    expect(player.playVideo).not.toHaveBeenCalled();
  });
  it('refuses playback while the video surface is outside the viewport', async () => {
    await attach();
    events.onReady();
    adapter.select(video);
    adapter.setVisible(false);
    adapter.play();
    expect(player.playVideo).not.toHaveBeenCalled();
    player.getPlayerState.mockReturnValue(1);
    events.onStateChange({ data: 1 });
    expect(player.pauseVideo).toHaveBeenCalled();
    adapter.setVisible(true);
    expect(player.playVideo).not.toHaveBeenCalled();
    adapter.play();
    expect(player.playVideo).toHaveBeenCalledOnce();
  });
  it('destroys the player, stops polling, and cancels selections on stop', async () => {
    await attach();
    events.onReady();
    adapter.select(video);
    adapter.stop();
    events.onStateChange({ data: 1 });
    expect(callbacks.snapshot).not.toHaveBeenCalled();
    expect(player.stopVideo).toHaveBeenCalledOnce();
    release!();
    release = undefined;
    expect(player.destroy).toHaveBeenCalledOnce();
    vi.advanceTimersByTime(2000);
    expect(callbacks.snapshot).not.toHaveBeenCalled();
  });
  it('does not construct a player after its surface unmounts during API loading', async () => {
    let resolve!: (value: IFrameAPI) => void;
    adapter = new IFramePlayerAdapter(callbacks, () => new Promise((done) => { resolve = done; }));
    release = adapter.attach(document.createElement('div'));
    release();
    release = undefined;
    resolve(api);
    await Promise.resolve();
    expect(player.cueVideoById).not.toHaveBeenCalled();
    expect(player.destroy).not.toHaveBeenCalled();
  });
  it('reports both script rejection and a player that never becomes ready', async () => {
    adapter = new IFramePlayerAdapter(callbacks, async () => { throw new Error('Network unavailable'); });
    release = adapter.attach(document.createElement('div'));
    await Promise.resolve();
    await Promise.resolve();
    expect(callbacks.error).toHaveBeenCalledWith('Network unavailable');
    release();
    adapter = new IFramePlayerAdapter(callbacks, async () => api);
    await attach();
    vi.advanceTimersByTime(15000);
    expect(callbacks.error).toHaveBeenLastCalledWith(expect.stringContaining('did not become ready'));
  });
  it('loads only the official script, reports network failure, and allows a retry', async () => {
    const host = window as Window & { YT?: IFrameAPI; onYouTubeIframeAPIReady?: () => void };
    delete host.YT;
    const scripts: HTMLScriptElement[] = [];
    // Keep scripts detached: the test never executes or fetches YouTube code.
    const append = vi.spyOn(document.head, 'append').mockImplementation((...nodes) => {
      scripts.push(nodes[0] as HTMLScriptElement);
    });
    const pending = loadIFrameAPI();
    const failure = expect(pending).rejects.toThrow('YouTube could not load');
    expect(scripts[0]!.src).toBe('https://www.youtube.com/iframe_api');
    scripts[0]!.dispatchEvent(new Event('error'));
    await failure;
    const retry = loadIFrameAPI();
    expect(append).toHaveBeenCalledTimes(2);
    expect(scripts[1]).not.toBe(scripts[0]);
    host.YT = api;
    host.onYouTubeIframeAPIReady!();
    expect(await retry).toBe(api);
    delete host.YT;
  });
  it.each([2, 5, 100, 101, 150, 153, 999])('explains YouTube error %s', (code) => {
    expect(youtubeErrorMessage(code).length).toBeGreaterThan(30);
  });
});
