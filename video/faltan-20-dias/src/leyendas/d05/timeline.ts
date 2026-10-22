// Día 5 · «No voltees» · El Charro Negro — mapa de frames (30 fps). Toda la sincronía vive aquí
// y se copia en scripts/leyendas/d05.py (EV). Notas del crítico aplicadas (ver plan.md).
import {clamp, lerp} from '../../lib/util';
import type {PostOpts} from '../kit/post';

export const FPS = 30;
export const LEN = 1305; // 43.5 s (lockup: fecha completa ≥ 2 s antes del dip)
export const s2f = (s: number) => Math.round(s * FPS);

export type BeatId = 'hook' | 'camino' | 'sombra' | 'silencio' | 'arco' | 'noparp' | 'vacio' | 'columna' | 'trato' | 'recoge' | 'jump' | 'cabalgata' | 'sindueno' | 'vuelve' | 'cinco';

export const B: Record<BeatId, [number, number]> = {
	hook: [0, 72],
	camino: [72, 150],
	sombra: [150, 228],
	silencio: [228, 288],
	arco: [288, 369],
	noparp: [369, 474],
	vacio: [474, 510],
	columna: [510, 654],
	trato: [654, 780],
	recoge: [780, 868],
	jump: [868, 906],
	cabalgata: [906, 1014],
	sindueno: [1014, 1098],
	vuelve: [1098, 1179],
	cinco: [1179, LEN],
};
export const ORDER: BeatId[] = ['hook', 'camino', 'sombra', 'silencio', 'arco', 'noparp', 'vacio', 'columna', 'trato', 'recoge', 'jump', 'cabalgata', 'sindueno', 'vuelve', 'cinco'];
export const beatOf = (f: number): BeatId => {
	for (const id of ORDER) if (f < B[id][1]) return id;
	return 'cinco';
};

type R = [number, number];
// momentos clave (frames)
export const EV = {
	flareUp: 6,
	hoof1: 15,
	hoof2: 39,
	walk: [72, 228] as R,
	cross: 102,
	quiote: 117,
	lookDown: [150, 180] as R,
	whistleCut: 180,
	shadowEats: 216,
	freeze: 228,
	ear: 252,
	exhale: 258,
	blink1: [288, 300] as R,
	horseBreath1: 324,
	blink2: [369, 375] as R,
	scrape: 390,
	fight: [411, 432] as R,
	blink3: [432, 437] as R,
	blink4: [474, 488] as R,
	sub: [479, 482] as R,
	silence: [477, 496] as R,
	pans: [488, 504] as R,
	flameRight: 498,
	whipR: [510, 527] as R,
	tilt: [537, 600] as R,
	buttons: [545, 595] as R,
	eyesOn: 591,
	title: [606, 657] as R,
	deal: 654,
	palmUp: [672, 700] as R,
	toss: 726,
	slow: [726, 744] as R,
	tiltDown: [744, 762] as R,
	coinHit: 759,
	coinFlat: 777,
	flameBack: 786,
	shadowOnCoin: 810,
	holdBreath: 816,
	touch: 837,
	lift: [840, 868] as R,
	grab: 868,
	whip180: [868, 873] as R,
	land: 873,
	yank: [897, 905] as R,
	gallop: [906, 1005] as R,
	lidsClose: [1005, 1014] as R,
	black: [1014, 1029] as R,
	fadeIn: [1029, 1047] as R,
	ridersCross: 1068,
	fogSwallow: 1086,
	coinDrop: 1098,
	coinFace: 1179,
	charcoal: 1188,
	crumble: [1209, 1230] as R,
	lockup: 1212,
	sting: 1266,
	endDip: LEN - 8,
};

// ventanas de parpadeo (sin texto dentro)
export const BLINKS: R[] = [EV.blink1, EV.blink2, EV.fight, EV.blink3, EV.blink4, EV.lidsClose];

// paleta del episodio
export const P = {
	brown: '#231305',
	cempa: '#F26D3D',
	gold: '#F5C242',
	sand: '#E0BB8F',
	green: '#1F5C48',
	terra: '#A83A25',
	bone: '#D9CDB6',
	night0: '#0B1416',
	night1: '#16303A',
	moonRim: '#9FC3C4',
	cloudRim: '#6E8A84',
	silver: '#C9D8D6',
	body: '#0B0704',
	eyeCore: '#FFF1C9',
	lid: '#1A0805',
	shadowInk: '#0D1A1F',
	charcoal: '#0D0A08',
};

export const INK: [number, number, number] = [0.137, 0.075, 0.02];
export const INK_DEEP: [number, number, number] = [0.043, 0.027, 0.012];
export const INK_LUMBRE: [number, number, number] = [0.478, 0.29, 0.086];

// ---------- presets de post (style.json) ----------
export const FAROL: PostOpts = {contrast: 1.07, saturation: 0.88, shadows: [0.004, 0.01, 0.02], highlights: [0.035, 0.018, -0.008], bloom: 0.55, bloomThr: 0.72, halation: 0.35, ca: 1.4, vignette: 0.55, grain: 0.07, hatch: 0.24, hatchScale: 5, hatchAngle: 0.56, hatchInk: INK};
export const LUNA: PostOpts = {contrast: 1.08, saturation: 0.85, shadows: [0, 0.012, 0.028], highlights: [0.015, 0.01, 0], bloom: 0.5, bloomThr: 0.72, halation: 0.2, ca: 1.5, vignette: 0.6, grain: 0.07, hatch: 0.28, hatchScale: 5, hatchAngle: 0.56, hatchInk: INK};
export const LUMBRE: PostOpts = {contrast: 1.08, saturation: 1.0, shadows: [0.012, 0.004, 0], highlights: [0.05, 0.02, -0.015], bloom: 1.0, bloomThr: 0.62, halation: 0.5, ca: 1.6, vignette: 0.5, grain: 0.065, hatch: 0.22, hatchScale: 5, hatchAngle: 0.56, hatchInk: INK_LUMBRE};
export const CIFRA: PostOpts = {contrast: 1.06, saturation: 0.95, shadows: [0.01, 0.005, 0], highlights: [0.03, 0.015, -0.01], bloom: 0.75, bloomThr: 0.6, halation: 0.35, ca: 1.2, vignette: 0.8, grain: 0.065, hatch: 0.12, hatchScale: 5, hatchAngle: 0.56, hatchInk: INK};
export const ROTULO_ADD: PostOpts = {bloom: 0.7, bloomThr: 0.6, vignette: 0.8, hatch: 0.15};

const mixNum = (a: number | undefined, b: number | undefined, k: number) => (a === undefined ? b : b === undefined ? a : lerp(a, b, k));
const mixVec = (a: [number, number, number] | undefined, b: [number, number, number] | undefined, k: number): [number, number, number] | undefined =>
	a && b ? [lerp(a[0], b[0], k), lerp(a[1], b[1], k), lerp(a[2], b[2], k)] : (a ?? b);
export const mixPost = (a: PostOpts, b: PostOpts, k: number): PostOpts => {
	const kk = clamp(k);
	const out: PostOpts = {...a};
	for (const key of Object.keys(b) as (keyof PostOpts)[]) {
		const va = a[key];
		const vb = b[key];
		if (Array.isArray(vb) || Array.isArray(va)) (out as Record<string, unknown>)[key] = mixVec(va as [number, number, number], vb as [number, number, number], kk);
		else (out as Record<string, unknown>)[key] = mixNum(va as number, vb as number, kk);
	}
	return out;
};

// SUSTO (firma de la serie): flash ≤ 0.6, ca 8 → 0 en 12 f, hatch +0.25 durante 4–13 f. Sin glitch en d5.
export const susto = (base: PostOpts, f: number, f0: number, flash = 0.4): PostOpts => {
	const d = f - f0;
	if (d < 0 || d > 14) return base;
	return {
		...base,
		flash: d < 6 ? flash * Math.pow(1 - d / 6, 2) : 0,
		exposure: (base.exposure ?? 1) * (d < 4 ? 1.1 : 1),
		ca: lerp(base.ca ?? 1.4, 8, Math.exp(-d / 4)),
		hatch: Math.min(0.75, (base.hatch ?? 0.24) + (d <= 10 ? 0.25 * (1 - d / 12) : 0)),
	};
};
