import { Easing } from "remotion";
import cfg from "../config.json";
import tl28 from "../assets/timeline/28.json";
import tl40 from "../assets/timeline/40.json";

export const config = cfg;
export type Palette = typeof cfg.palette;
export type LayoutId = keyof typeof cfg.layouts;
export type Layout = (typeof cfg.layouts)["9x16"];

export type Word = { text: string; start: number; end: number };
export type Caption = { start: number; end: number; showFrom: number; showTo: number; words: Word[] };
export type Section = {
  id: string;
  kind: string;
  accent: string;
  start: number;
  end: number;
  number?: number;
  label?: string;
  items?: string[];
  onScreen?: string;
  heart?: boolean;
};
export type Timeline = {
  variant: string;
  fps: number;
  duration: number;
  durationInFrames: number;
  sections: Section[];
  captions: Caption[];
  chimes: { t: number; number: number }[];
  disclaimer: { start: number; end: number; text: string };
  onScreen: { start: number; text: string };
  fadeOut: { start: number; end: number };
};

const TIMELINES: Record<string, Timeline> = { "28": tl28 as Timeline, "40": tl40 as Timeline };
export const getTimeline = (variant: string): Timeline => {
  const t = TIMELINES[variant];
  if (!t) throw new Error(`Variante sin timeline: ${variant}. Corre scripts/timeline.py`);
  return t;
};

/** Unidades de diseño: círculo de radio 300 centrado en el origen. */
export const DESIGN_R = 300;

export const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
/** progreso 0..1 de t entre a y b */
export const prog = (t: number, a: number, b: number) => clamp01((t - a) / (b - a));

// Curvas: ease-in-out suave (tipo sine) y ease-out para entradas.
export const easeInOut = Easing.bezier(0.45, 0, 0.55, 1);
export const easeOut = Easing.bezier(0.22, 1, 0.36, 1);
export const easeIn = Easing.bezier(0.5, 0, 0.75, 0);
/** sube con ease-out entre [a,b] */
export const ramp = (t: number, a: number, b: number, ease = easeInOut) => ease(prog(t, a, b));

/** Spring analítico de segundo orden (determinista, función pura del tiempo).
 *  zeta = 1 crítico (sin rebote); zeta < 1 rebote leve. response en segundos (≈ estilo Apple). */
export const springAt = (t: number, response = 0.5, zeta = 1) => {
  if (t <= 0) return 0;
  const w = (2 * Math.PI) / response;
  if (zeta >= 1) return 1 - (1 + w * t) * Math.exp(-w * t);
  const wd = w * Math.sqrt(1 - zeta * zeta);
  return 1 - Math.exp(-zeta * w * t) * (Math.cos(wd * t) + ((zeta * w) / wd) * Math.sin(wd * t));
};

/** Respiración: 0 = exhalado (min) … 1 = inhalado (max), sinusoidal. */
export const breath01 = (t: number, period: number) => 0.5 - 0.5 * Math.cos((2 * Math.PI * t) / period);

/** Pseudo-aleatorio determinista. */
export const rand = (seed: number) => {
  const x = Math.sin(seed * 12.9898 + 78.233) * 43758.5453;
  return x - Math.floor(x);
};

const hexToRgb = (h: string) => {
  const n = parseInt(h.replace("#", ""), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};
export const mix = (a: string, b: string, t: number) => {
  const A = hexToRgb(a);
  const B = hexToRgb(b);
  const c = A.map((v, i) => Math.round(lerp(v, B[i], clamp01(t))));
  return `#${c.map((v) => v.toString(16).padStart(2, "0")).join("")}`;
};
export const rgba = (h: string, a: number) => {
  const [r, g, b] = hexToRgb(h);
  return `rgba(${r},${g},${b},${a})`;
};

export const accentOf = (p: Palette, key: string) => (p as Record<string, string>)[key] ?? p.sky;

/** Sección activa y la anterior, con progreso de la transición (en segundos). */
export const sectionAt = (tl: Timeline, t: number) => {
  let i = tl.sections.findIndex((s) => t < s.end);
  if (i < 0) i = tl.sections.length - 1;
  return { index: i, section: tl.sections[i], prev: i > 0 ? tl.sections[i - 1] : null };
};

/** Visibilidad de una sección: entra en [start, start+tin] y sale en [end-tout, end+tail]. */
export const sectionPresence = (s: Section, t: number, tin = 0.5, tout = 0.45, tail = 0.05) =>
  ramp(t, s.start, s.start + tin) * (1 - ramp(t, s.end - tout, s.end + tail));
