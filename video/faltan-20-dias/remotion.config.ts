import {Config} from '@remotion/cli/config';

// Chromium headless preinstalado en el contenedor (evita descargar otro navegador).
const HEADLESS = '/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell';
Config.setBrowserExecutable(process.env.REMOTION_BROWSER ?? HEADLESS);
Config.setVideoImageFormat('jpeg'); // ~25 % más rápido que png; la calidad final la decide el encode x264
Config.setJpegQuality(95);
Config.setPixelFormat('yuv420p');
Config.setCodec('h264');
Config.setCrf(14);
Config.setChromiumOpenGlRenderer('swiftshader'); // ~3× más rápido que swangle en este contenedor
Config.setConcurrency(4);
