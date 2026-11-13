import {Config} from '@remotion/cli/config';
import fs from 'fs';

// En el servidor de edición se usa el Chromium preinstalado; en tu computadora Remotion descarga el suyo.
// Se busca cualquier versión instalada en /opt/pw-browsers (cambia de nombre entre servidores).
const BASE = '/opt/pw-browsers';
const candidatos = fs.existsSync(BASE)
  ? fs
      .readdirSync(BASE)
      .filter((d) => d.startsWith('chromium_headless_shell-'))
      .flatMap((d) => [`${BASE}/${d}/chrome-headless-shell-linux64/chrome-headless-shell`, `${BASE}/${d}/chrome-linux/headless_shell`])
  : [];
const CHROME = candidatos.find((c) => fs.existsSync(c));
if (CHROME) Config.setBrowserExecutable(CHROME);
Config.setVideoImageFormat('jpeg');
Config.setJpegQuality(95);
