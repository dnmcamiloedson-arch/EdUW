// Presets de post del episodio (guía de estilo): ESPEJO (base), LUMBRE (ataques), AMANECER, RÓTULO, CIFRA y SUSTO.
import {clamp, lerp} from '../../lib/util';
import type {PostOpts} from '../kit/post';
import {INK} from './timeline';
import {lumbreInk} from './light';

export const ESPEJO: PostOpts = {contrast: 1.06, saturation: 0.95, shadows: [0.01, 0.005, 0], highlights: [0.035, 0.015, -0.01], bloom: 0.6, bloomThr: 0.7, halation: 0.35, ca: 2.0, vignette: 0.38, grain: 0.06, hatch: 0.15, hatchScale: 5, hatchAngle: 0.6, hatchInk: INK};
export const LUMBRE: PostOpts = {bloom: 1.1, bloomThr: 0.62, halation: 0.5};
export const AMANECER: PostOpts = {contrast: 1.03, saturation: 0.9, shadows: [0.01, 0.012, 0.02], highlights: [0.04, 0.025, 0], bloom: 0.45, bloomThr: 0.75, halation: 0.3, ca: 1.2, grain: 0.065, vignette: 0.38};
export const CIFRA: PostOpts = {contrast: 1.06, saturation: 0.95, shadows: [0.01, 0.005, 0], highlights: [0.03, 0.015, -0.01], bloom: 0.75, bloomThr: 0.6, halation: 0.35, ca: 1.2, vignette: 0.8, grain: 0.065, hatch: 0.12, hatchInk: INK};

const mixNum = (a: number | undefined, b: number | undefined, k: number) => (a === undefined ? b : b === undefined ? a : lerp(a, b, k));
const mixVec = (a: [number, number, number] | undefined, b: [number, number, number] | undefined, k: number): [number, number, number] | undefined =>
	a && b ? [lerp(a[0], b[0], k), lerp(a[1], b[1], k), lerp(a[2], b[2], k)] : a ?? b;

// mezcla dos presets
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

// ESPEJO con la tinta del grabado entibiada por la luz de las brujas y el empuje de ataque
export const espejo = (o: {orb?: number; attack?: number; exposure?: number; vignette?: number; hatch?: number}): PostOpts => {
	const base = mixPost(ESPEJO, {...LUMBRE, exposure: 1.1}, o.attack ?? 0);
	return {
		...base,
		exposure: (base.exposure ?? 1) * (o.exposure ?? 1),
		vignette: o.vignette ?? base.vignette,
		hatch: o.hatch ?? base.hatch,
		hatchInk: lumbreInk(clamp(o.orb ?? 0)),
	};
};

// SUSTO sobre el preset activo: destello (≤ 0.6), ca, achurado que se sobresalta, exposición
export const susto = (p: PostOpts, df: number, o: {flash?: number; ca?: number; hatchUp?: number; minor?: boolean} = {}): PostOpts => {
	if (df < 0 || df > 14) return p;
	const flash = o.minor ? 0 : Math.min(0.6, o.flash ?? 0.5) * Math.max(0, 1 - df / 4);
	const ca = (o.ca ?? 8) * Math.exp(-df / 4);
	const hatchUp = (o.hatchUp ?? 0.25) * (df < 13 ? 1 : 0);
	return {...p, flash: Math.max(p.flash ?? 0, flash), ca: Math.max(p.ca ?? 0, ca), hatch: Math.min(0.75, (p.hatch ?? 0) + hatchUp), exposure: (p.exposure ?? 1) * (df < 3 ? 1.1 : 1)};
};
