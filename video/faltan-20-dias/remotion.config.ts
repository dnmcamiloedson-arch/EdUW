import {Config} from '@remotion/cli/config';
import fs from 'node:fs';
import os from 'node:os';

// En el contenedor de Claude hay un Chromium preinstalado y no hay GPU.
// En cualquier otra computadora Remotion descarga su propio navegador y usa la GPU (ANGLE).
const HEADLESS = '/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell';
const enContenedor = fs.existsSync(HEADLESS);
const browser = process.env.REMOTION_BROWSER ?? (enContenedor ? HEADLESS : null);
if (browser) Config.setBrowserExecutable(browser);

type Gl = 'swiftshader' | 'angle' | 'egl' | 'swangle' | 'vulkan' | 'angle-egl';
Config.setChromiumOpenGlRenderer((process.env.REMOTION_GL as Gl) ?? (enContenedor ? 'swiftshader' : 'angle'));

// Usa todos los núcleos disponibles (sobrescribible con CONCURRENCY=n)
Config.setConcurrency(Number(process.env.CONCURRENCY) || os.cpus().length);

Config.setVideoImageFormat('jpeg'); // ~25 % más rápido que png; la calidad final la decide el encode x264
Config.setJpegQuality(95);
Config.setPixelFormat('yuv420p');
Config.setCodec('h264');
Config.setCrf(14);
