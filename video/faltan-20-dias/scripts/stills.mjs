// Uso: [COMP=CuentaRegresiva PROPS='{"dias":19}'] node scripts/stills.mjs <outDir> <scale> f1 f2 ...
import {bundle} from '@remotion/bundler';
import {renderStill, selectComposition} from '@remotion/renderer';
import fs from 'node:fs';
import path from 'node:path';
const [outDir, scale, ...frames] = process.argv.slice(2);
const id = process.env.COMP ?? 'FaltanDias';
const inputProps = process.env.PROPS ? JSON.parse(process.env.PROPS) : {};
const serveUrl = await bundle({entryPoint: path.resolve('src/index.ts')});
const headless = '/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell';
const browserExecutable = fs.existsSync(headless) ? headless : null;
const chromiumOptions = {gl: fs.existsSync(headless) ? 'swiftshader' : 'angle'};
const composition = await selectComposition({serveUrl, id, inputProps, browserExecutable, chromiumOptions});
const tag = inputProps.dias ? `d${inputProps.dias}_` : '';
for (const f of frames) {
	const t0 = Date.now();
	await renderStill({composition, serveUrl, frame: Number(f), inputProps, output: path.join(outDir, `${tag}f${String(f).padStart(3, '0')}.png`), scale: Number(scale), browserExecutable, chromiumOptions});
	console.log('frame', f, Date.now() - t0, 'ms');
}
