import {Config} from '@remotion/cli/config';
import fs from 'fs';

// En el servidor de edición se usa el Chromium preinstalado; en tu computadora Remotion descarga el suyo.
const CHROME = '/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell';
if (fs.existsSync(CHROME)) Config.setBrowserExecutable(CHROME);
Config.setVideoImageFormat('jpeg');
Config.setJpegQuality(95);
