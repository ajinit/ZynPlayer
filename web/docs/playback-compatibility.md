# Playback and phone compatibility audit

This is the earlier baseline audit. The proposed extension-free player is
documented in [extension-free-playback.md](extension-free-playback.md), including
its separate validation limits. Earlier playback requirements below describe
the baseline, not the new optional IFrame path.

Audited 2026-11-03. A successful website build establishes neither streaming
service access nor iPhone playback. Branding has not been changed.

## What the current code requires

- YouTube catalog requests and playback use the companion extension. In
  `app/src/state/player.ts`, `startAt` refuses playback without `extensionReady()`.
  Search, account libraries and playlists also depend on that bridge.
- The website uses the browser's existing YouTube session through the extension,
  not a new public OAuth login. Cookies/signatures are handled in the extension.
  Netlify hosting does not authorize account access or unlock restricted tracks.
- The streaming path uses Shaka, direct media requests or a SABR adapter,
  browser codecs and Web Audio. AutoMix adds WASM/worker processing. This change
  does not alter any of those service-specific paths or extend their access.
- Listen Together only synchronizes a party; each device still needs a working,
  authorized playback source. It is disabled when its server setting is absent.
- Desktop Chromium/Firefox streaming results in `youtube-playback.md` and
  `youtube-signin.md` are upstream observations. They were not reproduced with
  real accounts or commercial music during this work; their unresolved checks
  remain unresolved.

## Browser matrix

| Browser | Interface | Existing YouTube path | Local audio |
| --- | --- | --- | --- |
| Desktop Chromium/Firefox | Responsive layouts | Requires separately installed, trusted-origin extension; current service access not retested | Chromium decode/play/time advancement confirmed |
| Android Chrome | Phone layout | Desktop Chrome extension cannot be installed normally | Standards-based native player; Android device untested |
| Firefox Android | Phone layout | Extension API audit/lint completed; installation, session access and actual playback unverified | Native player; Android device untested |
| iPhone Safari | Phone layout implemented; real device untested | Supplied Chrome/Firefox packages cannot be installed in Safari | Native player; iPhone codec/background behavior untested |

Changing browsers on iPhone does **not** make this extension available. Safari
Web Extensions require separate packaging/distribution and compatibility work;
none is supplied here. Adding the site to the Home Screen also does not remove
the extension dependency.

## Firefox Android investigation

Mozilla documents Android WebExtensions, but advises an API review, `web-ext
lint`, and testing on an Android device/emulator. Its compatibility guide says
not to add `gecko_android` compatibility ranges before explicitly verifying them.

The generated Firefox manifest and extension code use cookies, storage,
permissions, tabs, runtime messaging and declarativeNetRequest session/dynamic
rules. Mozilla/MDN browser-compat-data lists Android support for the principal
APIs; runtime messaging uses a Firefox content-script relay rather than relying
on a webpage's Chromium-only direct connection. This is encouraging static
evidence, not proof that account cookies, origin rules or streaming work.

`web-ext 10.8.0 lint` on the Firefox build: **0 errors, 2 warnings**. Existing
`gecko.strict_min_version=128` predates `data_collection_permissions` support
(Firefox 140, Firefox Android 142). This change leaves the manifest compatibility
claim unchanged rather than declaring Android support based on lint alone.
There is no Android emulator/ADB or physical device attached to this cloud task.

Before claiming support, test a signed build on Firefox Android: installation,
origin-scoped relay discovery, permissions, legitimate signed-out playback,
explicitly authorized sign-in, seek/pause/next, long playback, screen rotation,
backgrounding and lock-screen behavior. Do not use planted account cookies or
bypass service refusals. Desktop instructions using `about:debugging` are not
an Android end-user installation guide; signed AMO distribution is separate.

## Extension-free choices for iPhone

### Implemented: user-selected local audio

Open **Local music** (`/local`), select files from the device's file picker, and
use native audio controls. There are no uploads, ads, service accounts or paid
features. The catalog is only files the listener owns or has permission to use;
it is not the YouTube/Spotify catalog. Formats depend on browser/device codecs;
unprotected MP3/AAC are common choices, not a guarantee for every file.

A local playlist switches files without network requests. Each new file requires
a Play tap; leaving the page stops playback and discards the selection. Reloads
require selecting files again. There is no offline download service or library
storage. Background/lock-screen playback is controlled by iOS/browser behavior
and is not promised. Hosting your own recordings or licensed tracks later would
require appropriate distribution rights, HTTPS and suitable media responses.

### Researched next option: official YouTube embeds

A visible official YouTube iframe player can operate without this companion
extension. It is a separate playback integration, not a fallback to extracted
audio URLs. Its catalog is only videos YouTube allows to be embedded; availability
can vary by video, region, age, account and rights. Search through the official
Data API would need its own project, quota and approved credential handling.
The simplest initial design would accept a video link instead of promising
full catalog search or account-library access.

Keep YouTube's player, branding, ads and controls. Do not extract audio, hide
the video as an audio-only service, block advertisements, or defeat embedding,
sign-in, age, subscription or DRM restrictions. A site login does not substitute
for YouTube's own authentication. Autoplay often requires a user gesture.
Do not promise background playback or continued playback with the iPhone locked.
YouTube's service terms and content rights still apply; GPL rights to this
application do not license music or grant streaming-service access.

Official Spotify embeds/MusicKit would likewise be separate integrations with
restricted catalogs/behavior, service terms and possible account/subscription
requirements. Full Spotify Web Playback SDK playback requires Premium; Apple's
full catalog generally requires an Apple Music subscription and developer setup.
They are not free substitutes for these subscriptions. Their current iPhone
capabilities and approval requirements need direct service-documentation review
before implementation. No such integration or credentials were added.

## Evidence and sources

- [Mozilla Android extension development](https://extensionworkshop.com/documentation/develop/developing-extensions-for-firefox-for-android/): inspected the authoritative source in [mozilla/extension-workshop](https://github.com/mozilla/extension-workshop/blob/main/src/content/documentation/develop/developing-extensions-for-firefox-for-android.md).
- [MDN browser compatibility data](https://github.com/mdn/browser-compat-data/tree/main/webextensions/api): inspected cookies, runtime, tabs, permissions, scripting and declarativeNetRequest data.
- [MDN native audio](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/audio) and [autoplay](https://developer.mozilla.org/en-US/docs/Web/Media/Guides/Autoplay): inspected their source in mdn/content.
- [Official YouTube player sample](https://github.com/youtube/api-samples/blob/master/player/index.html): inspected. Review the [IFrame API](https://developers.google.com/youtube/iframe_api_reference) and [developer policies](https://developers.google.com/youtube/terms/developer-policies) before implementation. Those live documentation hosts were blocked by this cloud environment's network policy; current service terms were not independently revalidated here.

Cloud Chromium smoke checks exercised 320, 390, 667 (landscape), 768 and 1280px
viewports, navigation/search entry, native audio decode and playback clock,
local playlist switching, disabled party/invite pages, and absence of party or
presence requests. These are emulation checks, not real Safari/Android tests or
proof of audible hardware output. Synthetic playlist layouts with long titles and visible touch actions were also
checked at those widths. Commercial-catalog playback remains untested.
