// La cámara ES el espejo: péndulo amortiguado colgado de su clavo. El reflejo gira 2θ alrededor del clavo (540, −180);
// el vidrio (capa de pantalla) nunca se mueve. 31.75–36.2 s: el espejo va en las manos de la abuela.
import {noise2D} from '@remotion/noise';
import {E, clamp, lerp} from '../../lib/util';
import type {Ctx} from '../kit/paint';
import {EV, FPS} from './timeline';

const DEG = Math.PI / 180;
const PERIOD = 2.8;
type Imp = {t: number; a: number; tau: number; p?: number};
const IMPULSES: Imp[] = [
	{t: 2.3, a: 0.5, tau: 2.5},
	{t: 14.5, a: 0.2, tau: 2.0},
	{t: 23.5, a: 0.15, tau: 1.8},
	{t: 26.2, a: 0.3, tau: 1.6},
	{t: 27.35, a: -0.35, tau: 1.5},
	{t: 28.55, a: 0.4, tau: 1.5},
	{t: 29.9, a: -0.32, tau: 1.6},
	{t: 36.2, a: 1.2, tau: 0.8, p: 1.9}, // golpe al recolgarlo
];

// ángulo del espejo en grados (fuera del modo en mano)
export const mirrorTheta = (f: number) => {
	const t = f / FPS;
	let th = 0;
	for (const im of IMPULSES) {
		if (t < im.t) continue;
		const u = t - im.t;
		th += im.a * Math.exp(-u / im.tau) * Math.sin((2 * Math.PI * u) / (im.p ?? PERIOD));
	}
	// 20–22 s: quietud total
	const still = 1 - clamp((t - 19.6) / 0.4) * (1 - clamp((t - 22) / 0.2));
	th *= still;
	// recolgado chueco 3° → enderezado a 0 en 38.5–38.9 s
	if (f >= EV.rehang) th += 3 * (1 - E.inOut(clamp((f - EV.straighten[0]) / (EV.straighten[1] - EV.straighten[0]))));
	return th;
};

export type MirrorXf = {
	rot: number; // rotación del mundo (rad)
	px: number; // pivote
	py: number;
	dx: number;
	dy: number;
	held: boolean; // en las manos de la abuela
	whip: number; // 0..1 progreso del latigazo (solo 958–968)
	zoom: number;
};

export const HELD: [number, number] = [952, EV.rehang]; // 31.75 s → 36.2 s

export const mirrorXf = (f: number): MirrorXf => {
	const t = f / FPS;
	if (f < HELD[0] || f >= HELD[1]) {
		const th = mirrorTheta(f);
		return {rot: 2 * th * DEG, px: 540, py: -180, dx: 0, dy: 0, held: false, whip: 0, zoom: 1};
	}
	// en mano: cae 40 px e inclina −8° (easeOut 0.2 s), latigazo, rebote 5 %, temblor 6 px / 9 Hz
	const th0 = mirrorTheta(HELD[0]);
	const off = E.out(clamp((f - HELD[0]) / 6));
	const whip = clamp((f - EV.whip[0]) / (EV.whip[1] - EV.whip[0]));
	const after = f >= EV.whip[1];
	const trem = clamp((f - EV.whip[1]) / 4);
	const tx = (noise2D('d6trx', t * 9, 0) * 6 + noise2D('d6trx2', t * 2.2, 0) * 4) * trem;
	const ty = (noise2D('d6try', 0, t * 9) * 6 + noise2D('d6try2', 0, t * 1.9) * 4) * trem;
	const tr = noise2D('d6trr', t * 5, 3) * 0.006 * trem;
	// tras el latigazo la vista se endereza con rebote (resorte subamortiguado simple)
	const u = clamp((f - EV.whip[1]) / 12);
	const spring = after ? 1 - Math.exp(-5 * u) * Math.cos(9 * u) : 0;
	const tilt = lerp(lerp(2 * th0 * DEG, -8 * DEG, off), 0, spring) + tr;
	const drop = lerp(40 * off, 0, spring);
	return {rot: tilt, px: 540, py: 960, dx: tx, dy: drop + ty, held: true, whip: f >= EV.whip[0] && f < EV.whip[1] ? whip : after ? 1 : 0, zoom: 1};
};

// pinta fn con la transformación del reflejo
export const withWorld = (g: Ctx, xf: MirrorXf, fn: () => void) => {
	g.save();
	g.translate(xf.px + xf.dx, xf.py + xf.dy);
	if (xf.rot) g.rotate(xf.rot);
	if (xf.zoom !== 1) {
		g.translate(0, 960 - xf.py);
		g.scale(xf.zoom, xf.zoom);
		g.translate(0, xf.py - 960);
	}
	g.translate(-xf.px, -xf.py);
	fn();
	g.restore();
};

// pantalla → mundo (para colocar luces en el vidrio, dobles fantasma, etc.)
export const toScreen = (xf: MirrorXf, x: number, y: number): [number, number] => {
	const c = Math.cos(xf.rot);
	const s = Math.sin(xf.rot);
	let X = x - xf.px;
	let Y = y - xf.py;
	if (xf.zoom !== 1) {
		const cy = 960 - xf.py;
		X = X * xf.zoom;
		Y = (Y - cy) * xf.zoom + cy;
	}
	return [xf.px + xf.dx + X * c - Y * s, xf.py + xf.dy + X * s + Y * c];
};
