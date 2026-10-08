// Uso: node scripts/stills.mjs <outDir> <scale> f1 f2 f3 ...
import {bundle} from '@remotion/bundler';
import {renderStill, selectComposition} from '@remotion/renderer';
import path from 'node:path';
const [outDir, scale, ...frames] = process.argv.slice(2);
const serveUrl = await bundle({entryPoint: path.resolve('src/index.ts')});
const browserExecutable = '/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell';
const composition = await selectComposition({serveUrl, id: 'FaltanDias', browserExecutable});
for (const f of frames) {
	const t0 = Date.now();
	await renderStill({composition, serveUrl, frame: Number(f), output: path.join(outDir, `f${String(f).padStart(3, '0')}.png`), scale: Number(scale), browserExecutable, chromiumOptions: {gl: 'swangle'}});
	console.log('frame', f, Date.now() - t0, 'ms');
}
