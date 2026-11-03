import { describe, expect, it } from 'vitest';
import { choosePlaybackBackend, isIPhoneSafari } from './playbackMode';

describe('extension-free fallback', () => {
  it('keeps automatic desktop extension playback when available', () => {
    expect(choosePlaybackBackend('auto', true, false)).toBe('extension');
  });
  it('automatically uses YouTube without the extension, including during detection', () => {
    expect(choosePlaybackBackend('auto', false, false)).toBe('youtube');
    expect(choosePlaybackBackend('auto', false, true)).toBe('youtube');
  });
  it('prefers YouTube on iPhone Safari even if stale extension data exists', () => {
    expect(choosePlaybackBackend('auto', true, true)).toBe('youtube');
  });
  it('honors explicit modes and never silently substitutes extraction for an embed error', () => {
    expect(choosePlaybackBackend('youtube', true, false)).toBe('youtube');
    expect(choosePlaybackBackend('extension', false, true)).toBe('extension');
  });
  it('recognizes Safari and standalone iPhone agents', () => {
    expect(isIPhoneSafari('Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 Version/18.0 Mobile/15E148 Safari/604.1')).toBe(true);
    expect(isIPhoneSafari('Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148')).toBe(true);
    expect(isIPhoneSafari('Mozilla/5.0 (iPhone) AppleWebKit/605.1.15 CriOS/140.0 Mobile/15E148 Safari/604.1')).toBe(false);
    expect(isIPhoneSafari('Mozilla/5.0 (Macintosh) AppleWebKit/605.1.15 Safari/605.1.15')).toBe(false);
  });
});
