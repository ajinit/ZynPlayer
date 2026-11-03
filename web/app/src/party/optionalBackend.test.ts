// @vitest-environment happy-dom
import { afterEach, expect, it, vi } from 'vitest';

vi.mock('@/config', () => ({ config: { partyServerUrl: '' } }));
import { createParty, joinParty, previewParty, resumeSession } from './listenTogether';
import { startLivePresence } from '@/playback/livePresence';

afterEach(() => { vi.unstubAllGlobals(); sessionStorage.clear(); });

it('never sends party or presence requests to static hosting without a configured backend', async () => {
  const fetch = vi.fn();
  const socket = vi.fn();
  vi.stubGlobal('fetch', fetch);
  vi.stubGlobal('WebSocket', socket);
  for (const operation of [createParty({ autoplayEnabled: false }), joinParty('ABC123'), previewParty('ABC123')]) {
    await expect(operation).rejects.toThrow('Listen Together is not enabled');
  }
  sessionStorage.setItem('bitchord:party-session', JSON.stringify({ code: 'ABC123', token: 'local-test', server: 'https://previous.example' }));
  resumeSession();
  startLivePresence()();
  expect(fetch).not.toHaveBeenCalled();
  expect(socket).not.toHaveBeenCalled();
});
