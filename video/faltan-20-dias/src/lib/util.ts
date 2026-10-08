import {Easing, interpolate} from 'remotion';
import {noise2D, noise3D} from '@remotion/noise';

export const FPS = 30;
export const W = 1080;
export const H = 1920;

export const clamp = (x: number, a = 0, b = 1) => Math.min(b, Math.max(a, x));
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

// Curvas con intención: nada lineal.
export const E = {
	out: Easing.bezier(0.16, 1, 0.3, 1), // llegada larga y suave
	inOut: Easing.bezier(0.65, 0, 0.35, 1), // movimientos de cámara
	in: Easing.bezier(0.55, 0, 0.75, 0.2), // caídas / apagados
	soft: Easing.bezier(0.33, 0, 0.15, 1), // pull-back
	dolly: Easing.bezier(0.42, 0, 0.25, 1),
};

export const ramp = (
	f: number,
	range: [number, number],
	out: [number, number],
	easing: (t: number) => number = E.inOut,
) => interpolate(f, range, out, {easing, extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});

// Hash determinista (mismo resultado en cualquier pestaña del render paralelo).
export const hash = (n: number, seed = 0) => {
	let t = (Math.imul(n | 0, 374761393) + Math.imul(seed | 0, 668265263)) | 0;
	t = Math.imul(t ^ (t >>> 13), 1274126177);
	t ^= t >>> 16;
	return (t >>> 0) / 4294967296;
};

export const mulberry32 = (a: number) => () => {
	a |= 0;
	a = (a + 0x6d2b79f5) | 0;
	let t = Math.imul(a ^ (a >>> 15), 1 | a);
	t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
	return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};

// Ruido fractal (fBm) 1D/2D — base del parpadeo orgánico.
export const fbm = (id: string, x: number, y = 0, oct = 4) => {
	let a = 0.5;
	let f = 1;
	let s = 0;
	let n = 0;
	for (let i = 0; i < oct; i++) {
		s += a * noise2D(id + i, x * f, y * f);
		n += a;
		a *= 0.5;
		f *= 2.03;
	}
	return s / n;
};

// Intensidad de llama: respiración lenta + temblor rápido + "bajones" ocasionales.
export const flicker = (t: number, seed = 0) => {
	const base = fbm('flk' + seed, t * 1.7, 0.37, 4);
	const fast = noise2D('flf' + seed, t * 9.5, 3.3);
	const gutter = Math.max(0, noise2D('flg' + seed, t * 0.55, 7.1) - 0.5) * 2;
	return clamp(0.95 + 0.1 * base + 0.035 * fast - 0.22 * gutter, 0.6, 1.15);
};

// Curl noise 2D (campo sin divergencia) para humo.
export const curl = (x: number, y: number, z: number, s: number) => {
	const e = 0.5;
	const n = (a: number, b: number) => noise3D('curl', a * s, b * s, z);
	const dx = (n(x + e, y) - n(x - e, y)) / (2 * e);
	const dy = (n(x, y + e) - n(x, y - e)) / (2 * e);
	return [dy / s, -dx / s] as const;
};

const hex = (h: string) => {
	const v = parseInt(h.replace('#', ''), 16);
	return [(v >> 16) & 255, (v >> 8) & 255, v & 255];
};
export const mixRGB = (a: string, b: string, t: number) => {
	const A = hex(a);
	const B = hex(b);
	return A.map((c, i) => Math.round(lerp(c, B[i], clamp(t)))) as [number, number, number];
};
export const rgba = (c: [number, number, number] | string, a = 1) => {
	const v = typeof c === 'string' ? hex(c) : c;
	return `rgba(${v[0]},${v[1]},${v[2]},${a})`;
};
export const shade = (c: string, k: number, toward = '#0b0502') => mixRGB(toward, c, k);

export const C = {
	bg: '#231305',
	ink: '#0b0502',
	cempa: '#F26D3D',
	flama: '#F5C242',
	arena: '#E0BB8F',
	verde: '#1F5C48',
	terracota: '#A83A25',
	marfil: '#D9CDB6',
	pan: '#B8692E', // mezcla arena + terracota para la corteza
	core: '#FFF4D6',
};
