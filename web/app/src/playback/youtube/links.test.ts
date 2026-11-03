import { describe, expect, it } from 'vitest';
import { parseYouTubeLink, youtubeLink } from './links';

describe('YouTube links', () => {
  it.each([
    'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    'https://youtu.be/dQw4w9WgXcQ',
    'https://m.youtube.com/watch?v=dQw4w9WgXcQ',
    'https://music.youtube.com/watch?v=dQw4w9WgXcQ',
    'https://www.youtube.com/shorts/dQw4w9WgXcQ',
    'https://www.youtube.com/live/dQw4w9WgXcQ',
    'https://www.youtube.com/embed/dQw4w9WgXcQ',
  ])('accepts %s', (url) => {
    expect(parseYouTubeLink(url)).toEqual({ kind: 'video', videoId: 'dQw4w9WgXcQ', startSeconds: 0 });
  });
  it('keeps timestamps and canonicalizes outbound links', () => {
    const selection = parseYouTubeLink(' https://youtu.be/dQw4w9WgXcQ?t=1h2m3s ');
    expect(selection).toEqual({ kind: 'video', videoId: 'dQw4w9WgXcQ', startSeconds: 3723 });
    expect(youtubeLink(selection!)).toBe('https://www.youtube.com/watch?v=dQw4w9WgXcQ');
  });
  it('accepts playlists and converts the one-based index to zero-based', () => {
    expect(parseYouTubeLink('https://www.youtube.com/watch?v=dQw4w9WgXcQ&list=PLabcdefghijk&index=3&t=23')).toEqual({
      kind: 'playlist', playlistId: 'PLabcdefghijk', index: 2, startSeconds: 23,
    });
    expect(parseYouTubeLink('https://www.youtube.com/playlist?list=PLabcdefghijk&index=-1')).toEqual({
      kind: 'playlist', playlistId: 'PLabcdefghijk', index: 0, startSeconds: 0,
    });
  });
  it.each([
    'javascript:alert(1)', 'file:///etc/passwd', 'https://youtube.com.evil.test/watch?v=dQw4w9WgXcQ',
    'https://evil.test/youtube.com/watch?v=dQw4w9WgXcQ', 'https://youtube.com@evil.test/watch?v=dQw4w9WgXcQ',
    'https://user:password@youtube.com/watch?v=dQw4w9WgXcQ', 'https://youtube.com:444/watch?v=dQw4w9WgXcQ',
    'https://www.youtube.com/watch?v=invalid', 'https://www.youtube.com/playlist?list=bad',
    'not a URL',
  ])('rejects unsupported input %s', (url) => expect(parseYouTubeLink(url)).toBeNull());
});
