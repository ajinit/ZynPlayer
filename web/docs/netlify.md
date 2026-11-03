# Deploying from GitHub to Netlify

The Android apps are in `app/`, `tv/` and `wearos/`; they do not run on Netlify.
The React website is `web/app/`. `web/extension/` builds separate Chrome/Firefox
extensions, and `web/shared/` defines their communication. `backend/` is a separate
Go Listen Together server. Netlify hosts the static site and extension downloads,
not that continuously running WebSocket server.

## Review first (no local development required)

1. Review and merge the pull request on GitHub when satisfied. If your repository
   is already connected to Netlify, check automatic publishing before merging:
   merging into its production branch can trigger production deployment.
2. In Netlify, import `ajinit/ZynPlayer` from GitHub. Use a deploy preview/branch
   for review before enabling production publishing. This change does not deploy
   anything itself.
3. Let the root `netlify.toml` supply base `web`, publish `app/dist`, Node 22,
   and the build command. Do not set the publish directory to `web/app/dist`
   again: it is relative to the base. Dependencies use `web/pnpm-lock.yaml`
   and pnpm 12.11.2 from `web/package.json`.
4. Leave `VITE_PARTY_SERVER_URL` unset. No dummy value is necessary. The
   standalone site, local music and extension packages build without a backend.
5. Open the preview's `/local`, select an audio file you are allowed to use,
   and tap Play. Reload `/local` and `/settings/listen-together` directly to
   check the SPA fallback. Existing files, including downloads, should still
   be served normally.

Netlify's command passes its actual `DEPLOY_PRIME_URL` and `URL` to
`BITCHORD_SITE_ORIGINS`. This scopes the built extensions to that preview and
site; it does not trust every Netlify subdomain. Rebuild/reinstall extensions
when those addresses change. Chrome and Firefox downloads are in the site's
Extension page. A Firefox ZIP is not a signed, persistently installable Android
add-on: see the compatibility audit before offering mobile installation.

Discord user-token automation is excluded from the Netlify extension builds
with the existing `DISCORD_PRESENCE=0` build flag. No new account integration,
request-header modification, extraction, DRM or advertisement handling is added.

## Optional Listen Together later

Deploy `backend/` on a host supporting persistent Go processes and WebSockets.
Set its `JAM_ALLOWED_ORIGINS` to the exact HTTPS website origins you operate.
Set Netlify's public `VITE_PARTY_SERVER_URL` to the real HTTPS backend origin,
then rebuild. Preview origins also need explicit backend authorization.
The backend synchronizes parties; it does not replace the extension or supply
music. Without a configured default backend the feature remains disabled even
for old sessions or invites naming a custom server.

`VITE_*` values are embedded in public JavaScript. Never put passwords, session
cookies, private signing keys or API secrets there. Local music needs none.

## Scope of validation

The exact TOML build command was run in Codex Cloud with the party variable
unset, using the actual localhost test origin for extension scoping. Static
configuration and the production bundle were tested locally; an actual Netlify
build and Netlify edge routing require a reviewed deploy preview. No production
site was deployed. Existing dependency/bundle warnings are recorded in the build
output. Original copyright/license files remain unchanged and are copied verbatim to
`/licenses/`, linked from the menu. On Netlify, the source link uses its actual
`COMMIT_REF` so it identifies the deployed version. The site bundles GPL/AGPL and
third-party code: preserve notices and make the deployed version's corresponding
source available, including future modifications.

## Extension-free player increment

The optional official YouTube player uses /youtube and requires no additional
Netlify environment variables or backend. See [extension-free-playback.md](extension-free-playback.md)
for behavior and current validation limits. The earlier build results above do
not verify this increment. Keep production publishing unchanged; review the PR
and its checks before any deployment.
