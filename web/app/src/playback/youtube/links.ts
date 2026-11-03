export type YouTubeSelection =
  | { kind: 'video'; videoId: string; startSeconds: number }
  | { kind: 'playlist'; playlistId: string; index: number; startSeconds: number };

const videoIdPattern = /^[A-Za-z0-9_-]{11}$/;
const playlistIdPattern = /^[A-Za-z0-9_-]{10,150}$/;

function timestamp(value: string | null): number {
  if (!value) return 0;
  if (/^\d+$/.test(value)) return Math.min(Number(value), 604800);
  const match = /^(?:(\d+)h)?(?:(\d+)m)?(?:(\d+)s)?$/.exec(value);
  return match ? Math.min(Number(match[1] || 0) * 3600 + Number(match[2] || 0) * 60 + Number(match[3] || 0), 604800) : 0;
}

/** Accept only YouTube links; never embed arbitrary user-provided URLs. */
export function parseYouTubeLink(input: string): YouTubeSelection | null {
  let url: URL;
  try { url = new URL(input.trim()); } catch { return null; }
  if (!['https:', 'http:'].includes(url.protocol) || url.username || url.password || url.port) return null;
  const host = url.hostname.toLowerCase();
  if (!['youtube.com', 'www.youtube.com', 'm.youtube.com', 'music.youtube.com', 'youtu.be', 'www.youtu.be'].includes(host)) return null;
  const parts = url.pathname.split('/').filter(Boolean);
  const startSeconds = timestamp(url.searchParams.get('t') ?? url.searchParams.get('start'));
  const playlistId = url.searchParams.get('list');
  // A watch URL with a list opens its playlist, honoring YouTube's one-based index.
  if (playlistId && playlistIdPattern.test(playlistId) && ['/watch', '/playlist', '/'].includes(url.pathname)) {
    const rawIndex = Number(url.searchParams.get('index') || 1);
    return { kind: 'playlist', playlistId, index: Number.isInteger(rawIndex) && rawIndex > 0 ? Math.min(rawIndex - 1, 4999) : 0, startSeconds };
  }
  const videoId = host.endsWith('youtu.be') ? parts[0]
    : url.pathname === '/watch' ? url.searchParams.get('v')
    : ['shorts', 'embed', 'live'].includes(parts[0] || '') ? parts[1] : null;
  return videoId && videoIdPattern.test(videoId) ? { kind: 'video', videoId, startSeconds } : null;
}

export function youtubeLink(selection: YouTubeSelection): string {
  return selection.kind === 'playlist'
    ? 'https://www.youtube.com/playlist?list=' + encodeURIComponent(selection.playlistId)
    : 'https://www.youtube.com/watch?v=' + encodeURIComponent(selection.videoId);
}
