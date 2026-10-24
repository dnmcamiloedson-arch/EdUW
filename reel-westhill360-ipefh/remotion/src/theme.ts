import {continueRender, delayRender, Easing, interpolate, staticFile} from 'remotion';

export const FPS = 30;
export const W = 1080;
export const H = 1920;

// Zona segura de Instagram: en pantallas altas (iPhone) el reel se agranda para llenar la
// pantalla y recorta ~5% por lado; arriba queda la barra de estado. Todo texto vive dentro.
export const SAFE_X = 96;
export const SAFE_W = W - 2 * SAFE_X;
/** Tamaño de fuente que hace caber `text` en el ancho seguro (avg = ancho medio de letra en em) */
export const safeSize = (text: string, max: number, avg: number) => Math.min(max, Math.floor(SAFE_W / (text.length * avg)));

/** Efectos de sonido: nombres de uso → archivo. Los ref_* salen del video de referencia de sonidos. */
export const SFX_MAP: Record<string, string> = {
  whoosh: 'ref_swoosh_short',
  whoosh_largo: 'ref_swoosh',
  swipe: 'ref_swoosh_short',
  zoom: 'ref_flicker_v2',
  pop: 'ref_tap',
  click: 'ref_click',
  click_suave: 'ref_tap',
  shutter: 'ref_shutter',
  shutter_clicks: 'ref_shutter_clicks',
  flash: 'ref_flash_flicker',
  flicker: 'ref_flicker',
  digital: 'ref_digital',
  charge: 'ref_charge_taps',
  riser: 'ref_charge_swoosh',
  taps: 'ref_tap_x4',
  impact: 'impact',
  ding: 'ding',
};
export const sfxFile = (name: string) => `sfx/${SFX_MAP[name] ?? name}.wav`;

export const C = {
  azul: '#27639A', // azul Westhill
  azulClaro: '#3D8BD4',
  marino: '#14233C',
  amarillo: '#F2C230', // amarillo IPEFH
  fondo: '#EEF1F5',
  blanco: '#FFFFFF',
};

export const F = {
  sans: 'Montserrat',
  serif: 'Playfair Display',
  display: 'Anton',
  script: 'Yellowtail', // acento escrito a mano (estilo de la referencia)
  clasica: 'Cinzel', // serif clásica (estilo cartel del Titanic)
};

// Curvas tipo After Effects
export const ease = {
  out: Easing.bezier(0.16, 1, 0.3, 1), // easeOutExpo suave
  inOut: Easing.bezier(0.65, 0, 0.35, 1),
  in: Easing.bezier(0.7, 0, 0.84, 0),
  back: Easing.bezier(0.34, 1.56, 0.64, 1), // overshoot ligero
};

/** interpolate con clamp y easing por defecto */
export const tw = (
  frame: number,
  [a, b]: [number, number],
  [from, to]: [number, number],
  easing: (t: number) => number = ease.out,
) => interpolate(frame, [a, b], [from, to], {easing, extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});

const FONT_FILES: [string, string, string, string][] = [
  [F.sans, 'montserrat-latin-500-normal.woff2', '500', 'normal'],
  [F.sans, 'montserrat-latin-700-normal.woff2', '700', 'normal'],
  [F.sans, 'montserrat-latin-800-normal.woff2', '800', 'normal'],
  [F.sans, 'montserrat-latin-900-normal.woff2', '900', 'normal'],
  [F.serif, 'playfair-display-latin-600-italic.woff2', '600', 'italic'],
  [F.serif, 'playfair-display-latin-700-italic.woff2', '700', 'italic'],
  [F.display, 'anton-latin-400-normal.woff2', '400', 'normal'],
  [F.script, 'yellowtail-latin-400-normal.woff2', '400', 'normal'],
  [F.clasica, 'cinzel-latin-400-normal.woff2', '400', 'normal'],
  [F.clasica, 'cinzel-latin-700-normal.woff2', '700', 'normal'],
];

let loaded = false;
export const loadFonts = () => {
  if (loaded || typeof document === 'undefined') return;
  loaded = true;
  const handle = delayRender('fonts');
  Promise.all(
    FONT_FILES.map(([family, file, weight, style]) => {
      const face = new FontFace(family, `url(${staticFile(`fonts/${file}`)})`, {weight, style});
      (document.fonts as unknown as {add: (f: FontFace) => void}).add(face);
      return face.load();
    }),
  ).then(() => continueRender(handle));
};
