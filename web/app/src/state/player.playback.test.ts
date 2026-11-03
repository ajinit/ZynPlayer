// @vitest-environment happy-dom
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  extension: vi.fn(), load: vi.fn(), stop: vi.fn(async () => {}),
  select: vi.fn(), iframeStop: vi.fn(), next: vi.fn(), previous: vi.fn(),
  callbacks: null as null | { error(message: string): void },
}));
vi.mock('@/extension/useExtension', () => ({ extensionQueryKey: ['extension', 'detect'] }));
vi.mock('@/lib/queryClient', () => ({ queryClient: { getQueryData: mocks.extension } }));
vi.mock('@/playback/youtube/IFramePlayerAdapter', () => ({
  IFramePlayerAdapter: class {
    constructor(callbacks: { error(message: string): void }) { mocks.callbacks = callbacks; }
    select = mocks.select;
    stop = mocks.iframeStop;
    next = mocks.next;
    previous = mocks.previous;
    pause = vi.fn();
    play = vi.fn();
    seek = vi.fn();
    duration = () => 120;
    currentTime = () => 0;
  },
}));
vi.mock('@/playback/youtube/engine', () => ({
  YouTubeEngine: class {
    load = mocks.load;
    stop = mocks.stop;
  },
}));
import { stopPlayback, usePlayer } from './player';

const track = {
  videoId: 'dQw4w9WgXcQ', title: 'Queued song', artists: [], album: null,
  durationSec: null, explicit: false, thumbnail: null, index: null, plays: null,
};
describe('player backend integration', () => {
  beforeEach(() => {
    stopPlayback();
    vi.clearAllMocks();
    mocks.extension.mockReturnValue(null);
    usePlayer.setState({ playbackMode: 'auto', queue: [], index: -1, autoplay: false });
  });
  it('routes a normal queued song to the embed when no extension is available', () => {
    usePlayer.getState().playTrack(track, { title: 'Test', type: 'other' });
    expect(usePlayer.getState().backend).toBe('youtube');
    expect(mocks.select).toHaveBeenCalledWith({ kind: 'video', videoId: track.videoId, startSeconds: 0 }, true);
    expect(mocks.load).not.toHaveBeenCalled();
  });
  it('keeps explicit desktop mode and offers an understandable fallback', () => {
    usePlayer.getState().setPlaybackMode('extension');
    usePlayer.getState().playTrack(track, { title: 'Test', type: 'other' });
    expect(usePlayer.getState().status).toBe('error');
    expect(usePlayer.getState().error).toContain('Choose YouTube player or Local music');
    expect(mocks.select).not.toHaveBeenCalled();
  });
  it('never calls the extension engine to bypass an embedding error', () => {
    mocks.extension.mockReturnValue({ info: { capabilities: ['yt'] } });
    usePlayer.getState().playYouTube({ kind: 'video', videoId: track.videoId, startSeconds: 0 });
    mocks.callbacks!.error('The owner does not allow embedding.');
    expect(usePlayer.getState().status).toBe('error');
    expect(usePlayer.getState().backend).toBe('youtube');
    expect(mocks.load).not.toHaveBeenCalled();
  });
  it('routes linked playlist next and previous to the official player', () => {
    usePlayer.getState().playYouTube({ kind: 'playlist', playlistId: 'PLabcdefghijk', index: 0, startSeconds: 0 });
    usePlayer.getState().next();
    usePlayer.getState().previous();
    expect(mocks.next).toHaveBeenCalledOnce();
    expect(mocks.previous).toHaveBeenCalledOnce();
    expect(mocks.load).not.toHaveBeenCalled();
  });
  it('preserves desktop extension selection and discards late loads after Local music starts', async () => {
    mocks.extension.mockReturnValue({ info: { capabilities: ['yt'] } });
    let complete!: (value: unknown) => void;
    mocks.load.mockImplementation(() => new Promise((resolve) => { complete = resolve; }));
    usePlayer.getState().playTrack(track, { title: 'Test', type: 'other' });
    await vi.waitFor(() => expect(mocks.load).toHaveBeenCalledOnce());
    expect(usePlayer.getState().backend).toBe('extension');
    stopPlayback();
    complete({ videoId: track.videoId });
    await Promise.resolve();
    await Promise.resolve();
    expect(mocks.stop).toHaveBeenCalled();
    expect(usePlayer.getState().backend).toBeNull();
    expect(usePlayer.getState().nowPlaying).toBeNull();
    expect(usePlayer.getState().status).toBe('idle');
  });
});
