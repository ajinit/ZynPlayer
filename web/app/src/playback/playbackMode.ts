export type PlaybackMode = 'auto' | 'youtube' | 'extension';
export type PlaybackBackend = 'youtube' | 'extension';

/** Also recognizes Safari's standalone Home Screen user agent. */
export function isIPhoneSafari(userAgent = navigator.userAgent): boolean {
  return /iPhone|iPod/.test(userAgent) && /AppleWebKit/.test(userAgent) && !/CriOS|FxiOS|EdgiOS|OPiOS/.test(userAgent);
}

export function choosePlaybackBackend(mode: PlaybackMode, extensionReady: boolean, iPhoneSafari: boolean): PlaybackBackend {
  if (mode === 'youtube') return 'youtube';
  if (mode === 'extension') return 'extension';
  return iPhoneSafari || !extensionReady ? 'youtube' : 'extension';
}

export function readPlaybackMode(): PlaybackMode {
  try {
    const value = localStorage.getItem('zynplayer:playback-mode');
    return value === 'youtube' || value === 'extension' ? value : 'auto';
  } catch { return 'auto'; }
}
