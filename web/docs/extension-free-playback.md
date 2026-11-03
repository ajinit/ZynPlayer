# Extension-free YouTube playback

## Behavior

ZynPlayer adds a visible official YouTube IFrame Player beside the existing
BitChord engines. The extension engine and native Local Music page remain.
Automatic mode chooses the extension on a capable desktop and the YouTube
player without it. iPhone Safari, including its standalone Home Screen agent,
defaults to the YouTube player even if stale extension detection data exists.
The YouTube page also lets users choose either engine explicitly.

Open /youtube, paste a full video or playlist URL, and choose Open player.
Tap Play in the YouTube video to satisfy Safari's gesture requirement. Watch,
short, Shorts, live, embed and music.youtube.com video links are accepted.
A watch URL with a list opens that playlist, with its index if supplied.
The application never downloads playlist contents or resolves media URLs.
The official player handles linked playlist navigation and availability.

The existing player store routes play/pause, previous, next and seek to the
selected backend. A persistent visible surface presents these controls with
44px touch targets and a native range input. Linked playlists use YouTube's
next/previous; ordinary app queues advance individual embedded videos. YouTube
reports live durations, so seeking is disabled when no finite duration is known.
YouTube mode uses the device's volume controls. Full-screen video is available
through YouTube's own controls; BitChord's artwork full-screen overlay is not
used over the embedded player.

Saved links can be named, filtered, reordered with tap controls, and removed.
They persist only in this browser, up to 100 links. They are bookmarks to
videos/playlists, not a replacement for editing a YouTube account playlist.
The existing catalog search and account library still require the extension.
The Search page links directly to the extension-free link and saved-link page.

## Boundaries and fallbacks

- The video stays visible outside scrolling route content, at least 200px high.
  No audio extraction, hidden video, ad suppression, media proxy, restricted
  content bypass or automatic extraction fallback is added.
- YouTube pauses when the page becomes hidden or its surface leaves the visible
  viewport. It does not automatically resume when the app returns.
- Autoplay may be refused, including after a track ends. A message directs the
  user to tap the visible player. Background, lock-screen and offline YouTube
  playback are not provided.
- Private, removed, embedding-disabled and other unavailable content produce
  readable messages. Retry and Open on YouTube remain available. Error 153
  explains the playback-origin problem. No application code disables ads.
- AutoMix, crossfade, radio, BitChord history reporting and Listen Together
  remain features of the desktop extension path. They are not applied to
  YouTube IFrame playback. YouTube itself controls any account/history behavior
  inside its player. Listen Together cannot synchronize this adapter.
- Starting Local Music cancels pending streaming loads and stops the active
  engine, including an embedded video. Local files use browser-native audio.
  Files and temporary object URLs are not uploaded.
- The manifest and Apple metadata support online Home Screen launching.
  There is no service worker and no offline caching of the app or YouTube.
  Native audio formats, Safari gestures and standalone behavior need real
  device verification.

## Validation for this change

The Codex Cloud executor failed during container creation before any commands
could run. Tests, type checks, production builds, browser automation, and real
Netlify preview checks could not be run in that environment. New Vitest suites
cover URL parsing, mode fallback, the adapter's lifecycle and controls, API
errors, gesture/background behavior and store integration/cancelled loads.
GitHub's existing Web workflow is expected to run the full workspace checks
on the pull request. Inspect its actual result; added tests are not proof
that those tests have passed.

No real iPhone, Safari or Home Screen PWA test was performed. No production
deployment was requested or performed. netlify.toml is unchanged.

## Device and preview checks still required

1. Run pnpm install --frozen-lockfile, pnpm typecheck, pnpm test and pnpm build
   from web/. Also run Netlify's build command in its configured environment.
2. In a reviewed deploy preview, refresh /youtube, /local and /search directly.
   Check extension downloads and the desktop extension engine on that origin.
3. On actual iPhones, test narrow portrait (320/375px), standard and large
   portrait, landscape, keyboard opening, display cutouts and large text.
4. Paste an embeddable video, seek, pause/resume, and play a public playlist.
   Use next/previous in both the app controls and YouTube's controls. Confirm
   a blocked autoplay requires a tap and never starts an alternative engine.
5. Check a video that disallows embedding and an unavailable/private video.
   Confirm the error and outbound YouTube action work. Exercise Retry after
   reconnecting or allowing the official script through a content blocker.
6. Select local MP3/AAC files while a video is loading/playing. Confirm only
   native audio plays. Test native seeks and selecting another local file.
7. Add to Home Screen and repeat the checks online. Switch apps, lock/unlock
   and return; the YouTube video must pause and require a fresh tap.
8. On desktop, verify Automatic and explicit Extension mode retain original
   playback, AutoMix and queue behavior. These services were not retested here.
