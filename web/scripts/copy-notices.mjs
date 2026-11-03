// Include the existing notices verbatim in the static distribution.
import { copyFile, mkdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const output = new URL('../app/dist/licenses/', import.meta.url);
await mkdir(output, { recursive: true });
for (const [source, name] of [
  ['../../LICENSE', 'GPL-3.0.txt'],
  ['../app/src/playback/automix/LICENSE', 'AutoMix-AGPL-3.0.txt'],
  ['../app/src/playback/automix/NOTICE.md', 'AutoMix-NOTICE.md'],
]) {
  await copyFile(new URL(source, import.meta.url), new URL(name, output));
}
const revision = /^[0-9a-f]{40}$/i.test(process.env.COMMIT_REF ?? '') ? process.env.COMMIT_REF : 'main';
await writeFile(new URL('index.html', output), `<!doctype html>
<html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Credits and licenses</title><body>
<h1>Credits and licenses</h1>
<p>Based on <a href="https://github.com/kushagrasinghx/BitChord">BitChord</a>.
This fork adds Netlify configuration, optional Listen Together, mobile layout improvements and local audio playback (2026-11-03).</p>
<p>The application is licensed under <a href="GPL-3.0.txt">GPLv3</a>, without warranty.
You may redistribute and modify it under that license.</p>
<p>AutoMix: Copyright (C) 2026 David Finnegan, <a href="AutoMix-AGPL-3.0.txt">AGPLv3</a>.
See the <a href="AutoMix-NOTICE.md">existing AutoMix and dependency notices</a>.</p>
<p><a href="https://github.com/ajinit/ZynPlayer/tree/${revision}">${revision === 'main' ? 'Source repository' : 'Corresponding source for this build'}</a>, including original source notices and dependency manifests.</p>
<p><a href="/local">Return to the player</a></p></body></html>`);
console.log(`Preserved license notices in ${fileURLToPath(output)}`);
