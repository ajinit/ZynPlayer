import { useEffect, useRef, useState } from 'react';
import { PageHeader } from '@/components/PageHeader';
import { usePlayer } from '@/state/player';

/** User-selected audio stays on this device. No streaming-service requests. */
export default function LocalMusicPage() {
  const [files, setFiles] = useState<File[]>([]);
  const [index, setIndex] = useState(0);
  const [source, setSource] = useState('');
  const [error, setError] = useState('');
  const audio = useRef<HTMLAudioElement>(null);
  const file = files[index];

  useEffect(() => {
    setError('');
    if (!file) { setSource(''); return; }
    const url = URL.createObjectURL(file);
    setSource(url);
    return () => { URL.revokeObjectURL(url); };
  }, [file]);

  // Only one of the local and streaming players should play at a time.
  useEffect(() => usePlayer.subscribe((state) => {
    if (state.status === 'playing' || state.status === 'buffering') audio.current?.pause();
  }), []);

  return (
    <div className="mx-auto max-w-[700px]">
      <PageHeader title="Local music" />
      <div className="mx-(--body-gutter) mt-5 flex min-w-0 flex-col gap-5">
        <p className="type-body-tall text-secondary">Play audio files you own or have permission to use. No extension, account, subscription or upload is needed. MP3 and AAC/M4A are common options; supported formats depend on your browser.</p>
        <label className="flex min-w-0 flex-col gap-2 type-body-emphasized">
          Choose audio files
          <input type="file" accept="audio/*,.mp3,.m4a,.aac,.wav,.ogg,.flac" multiple className="w-full min-w-0 max-w-full rounded-[8px] bg-quinary p-3" onChange={(event) => {
            audio.current?.pause();
            setIndex(0);
            setFiles(Array.from(event.currentTarget.files ?? []));
          }} />
        </label>
        {file && (
          <section aria-label="Local audio player" className="flex min-w-0 flex-col gap-3">
            <h2 className="type-title-3-emphasized [overflow-wrap:anywhere]">{file.name}</h2>
            <audio ref={audio} src={source || undefined} controls preload="metadata" className="w-full" onPlay={() => {
              const player = usePlayer.getState();
              if (player.status === 'playing' || player.status === 'buffering') player.togglePlay();
            }} onError={() => setError('This file could not be played. Try a supported, unprotected MP3 or AAC file.')} />
            {error && <p role="alert" className="type-body text-red">{error}</p>}
            <p className="type-callout text-secondary">Tap Play to start each file. Background and lock-screen playback depend on your device. Files must be selected again after leaving this page or reloading.</p>
          </section>
        )}
        <ol aria-label="Local playlist" className="flex min-w-0 flex-col gap-1">
          {files.map((item, position) => (
            <li key={`${position}-${item.name}`} className="min-w-0">
              <button className="min-h-11 w-full rounded-[8px] bg-quinary px-3 py-2 text-left type-body aria-current:bg-nav-selected [overflow-wrap:anywhere]" aria-current={position === index ? 'true' : undefined} onClick={() => setIndex(position)}>{position + 1}. {item.name}</button>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}
