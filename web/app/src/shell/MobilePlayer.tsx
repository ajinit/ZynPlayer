import { BackwardIcon, ForwardIcon, PauseIcon, PlayIcon } from '@/components/icons/Transport';
import { usePlayer } from '@/state/player';
import { useUi } from '@/state/ui';

/** Touch controls remain reachable when the desktop player is hidden. */
export function MobilePlayer() {
  const track = usePlayer((s) => s.nowPlaying);
  const status = usePlayer((s) => s.status);
  const error = usePlayer((s) => s.error);
  const hasNext = usePlayer((s) => s.index + 1 < s.queue.length || s.repeat !== 'off' || (s.autoplay && s.index >= 0));
  const { togglePlay, previous, next } = usePlayer.getState();
  const setFullScreen = useUi((s) => s.setFullScreen);
  const playing = status === 'playing' || status === 'buffering';
  return (
    <section aria-label="Mobile player" className="glass-pill absolute right-3 bottom-(--player-bottom-offset) left-3 z-[calc(var(--z-web-chrome)-1)] hidden min-h-14 items-center gap-1 rounded-[16px] px-2 max-sm:flex">
      <button className="min-w-0 flex-1 px-2 py-2 text-left" disabled={!track} onClick={() => setFullScreen(true)} aria-label={track ? `Open player: ${track.title}` : 'No track selected'}>
        <span className="block truncate type-body-emphasized">{track?.title || 'No track selected'}</span>
        <span className="block truncate type-callout text-secondary" role={error ? 'status' : undefined}>{error || track?.artist || 'Choose music to begin'}</span>
      </button>
      <button className="grid size-11 shrink-0 place-items-center disabled:opacity-40" aria-label="Previous" disabled={!track} onClick={previous}><BackwardIcon size={24} /></button>
      <button className="grid size-11 shrink-0 place-items-center disabled:opacity-40" aria-label={playing ? 'Pause' : 'Play'} disabled={!track} onClick={togglePlay}>{playing ? <PauseIcon size={26} /> : <PlayIcon size={26} />}</button>
      <button className="grid size-11 shrink-0 place-items-center disabled:opacity-40" aria-label="Next" disabled={!track || !hasNext} onClick={next}><ForwardIcon size={24} /></button>
    </section>
  );
}
