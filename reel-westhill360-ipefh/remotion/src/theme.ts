import {continueRender, delayRender, Easing, interpolate, staticFile} from 'remotion';

export const FPS = 30;
export const W = 1080;
export const H = 1920;

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
