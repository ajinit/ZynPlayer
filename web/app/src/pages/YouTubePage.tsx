import { useState } from 'react';
import { PrefetchLink } from '@/components/PrefetchLink';
import { PageHeader } from '@/components/PageHeader';
import { parseYouTubeLink, youtubeLink } from '@/playback/youtube/links';
import type { PlaybackMode } from '@/playback/playbackMode';
import { usePlayer } from '@/state/player';

const STORAGE_KEY = 'zynplayer:saved-links';
interface SavedLink { title: string; url: string }
function readLinks(): SavedLink[] {
  try {
    const links: unknown = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    return Array.isArray(links) ? links.filter((item): item is SavedLink =>
      typeof item?.title === 'string' && typeof item?.url === 'string' && !!parseYouTubeLink(item.url)).slice(0, 100) : [];
  } catch { return []; }
}
const button = 'min-h-11 rounded-[8px] bg-quinary px-3 py-2 type-body';

export default function YouTubePage() {
  const mode = usePlayer((s) => s.playbackMode);
  const [link, setLink] = useState('');
  const [name, setName] = useState('');
  const [filter, setFilter] = useState('');
  const [saved, setSaved] = useState(readLinks);
  const [message, setMessage] = useState('');
  function update(links: SavedLink[]) {
    setSaved(links);
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(links)); }
    catch { setMessage('These links are available this visit, but your browser could not save them for later.'); }
  }
  function open(url: string) {
    const selection = parseYouTubeLink(url);
    if (!selection) { setMessage('Paste a full YouTube video or playlist link, such as https://www.youtube.com/watch?v=…'); return; }
    setMessage('');
    usePlayer.getState().playYouTube(selection);
  }
  function save() {
    const selection = parseYouTubeLink(link);
    if (!selection) { setMessage('Enter a supported YouTube video or playlist link before saving.'); return; }
    const url = youtubeLink(selection);
    if (saved.some((item) => item.url === url)) { setMessage('That link is already saved.'); return; }
    if (saved.length >= 100) { setMessage('You can save up to 100 links. Remove a link to add another.'); return; }
    setMessage('');
    update([...saved, { url, title: name.trim() || (selection.kind === 'playlist' ? 'YouTube playlist' : 'YouTube video') }]);
  }
  function move(index: number, direction: number) {
    const next = [...saved];
    const destination = index + direction;
    if (destination < 0 || destination >= next.length) return;
    [next[index], next[destination]] = [next[destination]!, next[index]!];
    update(next);
  }
  return (
    <div className="mx-auto max-w-[760px]">
      <PageHeader title="YouTube player" />
      <div className="mx-(--body-gutter) mt-4 flex min-w-0 flex-col gap-4">
        <p className="type-body-tall text-secondary">Play supported videos and playlists through YouTube’s visible player. No extension or API key is needed. Tap the video’s Play button to begin.</p>
        <div className="flex flex-wrap gap-2">
          <PrefetchLink to="/local" className={button}>Local music</PrefetchLink>
          <a className={button} href="https://www.youtube.com/" target="_blank" rel="noopener">Find music on YouTube ↗</a>
        </div>
        <label className="flex flex-col gap-2 type-body">
          Playback mode
          <select className="min-h-11 w-full rounded-[8px] bg-quinary p-3" value={mode} onChange={(event) => usePlayer.getState().setPlaybackMode(event.currentTarget.value as PlaybackMode)}>
            <option value="auto">Automatic (YouTube player without an extension)</option>
            <option value="youtube">YouTube player — no extension</option>
            <option value="extension">Desktop extension engine</option>
          </select>
        </label>
        <form className="flex min-w-0 flex-col gap-3" onSubmit={(event) => { event.preventDefault(); open(link); }}>
          <label className="flex min-w-0 flex-col gap-2 type-body-emphasized">
            YouTube video or playlist link
            <input type="url" required value={link} onChange={(event) => setLink(event.currentTarget.value)} placeholder="https://www.youtube.com/watch?v=…" autoCapitalize="none" autoCorrect="off" spellCheck={false} className="min-h-11 w-full min-w-0 rounded-[8px] border border-divider bg-page p-3" />
          </label>
          <label className="flex min-w-0 flex-col gap-2 type-body">
            Name for saved link (optional)
            <input value={name} maxLength={120} onChange={(event) => setName(event.currentTarget.value)} className="min-h-11 w-full min-w-0 rounded-[8px] border border-divider bg-page p-3" />
          </label>
          <div className="flex flex-wrap gap-2">
            <button type="submit" className={button}>Open player</button>
            <button type="button" className={button} onClick={save}>Save link</button>
          </div>
        </form>
        {message && <p role="status" className="type-body text-key">{message}</p>}
        <h2 className="type-title-3-emphasized">Saved links</h2>
        <label className="flex flex-col gap-2 type-body">
          Search saved links
          <input type="search" value={filter} onChange={(event) => setFilter(event.currentTarget.value)} className="min-h-11 min-w-0 rounded-[8px] border border-divider bg-page p-3" />
        </label>
        <ol aria-label="Saved YouTube links" className="flex flex-col gap-3">
          {saved.map((item, index) => item.title.toLowerCase().includes(filter.toLowerCase()) ? (
            <li key={item.url} className="flex min-w-0 flex-wrap items-center gap-1 rounded-[8px] bg-quinary p-2">
              <button className="min-h-11 min-w-0 flex-1 px-2 text-left [overflow-wrap:anywhere]" onClick={() => open(item.url)}>{item.title}</button>
              <button className="min-h-11 min-w-11 px-2 disabled:opacity-40" aria-label={'Move ' + item.title + ' up'} disabled={index === 0} onClick={() => move(index, -1)}>↑</button>
              <button className="min-h-11 min-w-11 px-2 disabled:opacity-40" aria-label={'Move ' + item.title + ' down'} disabled={index === saved.length - 1} onClick={() => move(index, 1)}>↓</button>
              <button className="min-h-11 px-2" aria-label={'Remove ' + item.title} onClick={() => update(saved.filter((_, at) => at !== index))}>Remove</button>
            </li>
          ) : null)}
        </ol>
        {!saved.length && <p className="type-callout text-secondary">Save a video or playlist link to find it here later on this browser.</p>}
        <p className="type-callout text-secondary">YouTube manages the tracks inside linked playlists. Saved links stay in this browser; they do not modify your YouTube account. Catalog search and account libraries still use the desktop extension. Ads, unavailable videos, region and embedding restrictions are controlled by YouTube. Background, lock-screen and offline YouTube playback are unavailable here.</p>
      </div>
    </div>
  );
}
