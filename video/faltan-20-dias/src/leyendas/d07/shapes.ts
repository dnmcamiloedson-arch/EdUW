// Día 7 · contornos de las sombras (metros, y hacia arriba, mirando a +x). Se re-muestrean a 96 puntos con inicio
// alineado para poder transformarlos entre sí (humano → encorvado → arqueado → medio bestia → coyote).
// ESQUELETO (etapa 1): siluetas aproximadas; G1/G2 las redibujan con anatomía y morph escalonado.
import type {V2} from './world';

export const NPTS = 96;

// re-muestreo por longitud de arco
export const resample = (pts: V2[], n = NPTS): V2[] => {
	const m = pts.length;
	const acc = [0];
	for (let i = 1; i <= m; i++) {
		const a = pts[i - 1];
		const b = pts[i % m];
		acc.push(acc[i - 1] + Math.hypot(b[0] - a[0], b[1] - a[1]));
	}
	const tot = acc[m];
	const out: V2[] = [];
	let j = 0;
	for (let k = 0; k < n; k++) {
		const d = (k / n) * tot;
		while (j < m - 1 && acc[j + 1] < d) j++;
		const a = pts[j];
		const b = pts[(j + 1) % m];
		const u = (d - acc[j]) / Math.max(1e-6, acc[j + 1] - acc[j]);
		out.push([a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u]);
	}
	return out;
};
export const morph = (a: V2[], b: V2[], u: number, stagger?: (i: number) => number): V2[] =>
	a.map((p, i) => {
		const k = stagger ? Math.max(0, Math.min(1, (u - stagger(i)) / Math.max(1e-3, 1 - stagger(i)))) : u;
		return [p[0] + (b[i][0] - p[0]) * k, p[1] + (b[i][1] - p[1]) * k];
	});

// cabeza con sombrero (perfil) — de la nuca al cuello por arriba
const HAT_HEAD: V2[] = [
	[-0.07, 1.45],
	[-0.1, 1.56],
	[-0.12, 1.665],
	[-0.29, 1.7],
	[-0.13, 1.725],
	[-0.1, 1.84],
	[-0.02, 1.88],
	[0.07, 1.86],
	[0.11, 1.735],
	[0.3, 1.715],
	[0.13, 1.685],
	[0.12, 1.6],
	[0.14, 1.55],
	[0.1, 1.51],
	[0.09, 1.47],
	[0.06, 1.42],
];
// cabeza de coyote (perfil): orejas paradas, hocico largo — el cuadro subliminal
const COYOTE_HEAD: V2[] = [
	[-0.07, 1.45],
	[-0.1, 1.58],
	[-0.07, 1.66],
	[-0.09, 1.86],
	[-0.01, 1.7],
	[0.03, 1.72],
	[0.06, 1.88],
	[0.1, 1.69],
	[0.17, 1.64],
	[0.33, 1.58],
	[0.34, 1.55],
	[0.18, 1.5],
	[0.12, 1.46],
	[0.06, 1.42],
];
// cabeza que ya volteó: de frente, con dos orejas donde estaba el ala
const FRONT_EARS: V2[] = [
	[-0.08, 1.45],
	[-0.12, 1.56],
	[-0.14, 1.66],
	[-0.16, 1.84],
	[-0.06, 1.71],
	[0.0, 1.72],
	[0.06, 1.71],
	[0.16, 1.84],
	[0.14, 1.66],
	[0.12, 1.56],
	[0.08, 1.45],
];
// cuerpo (sin cabeza): del cuello por delante, sarape, piernas, y de regreso por la espalda
const body = (step: number): V2[] => {
	const a = Math.sin(step) * 0.12;
	return [
		[0.06, 1.42],
		[0.15, 1.36],
		[0.19, 1.1],
		[0.21, 0.86],
		[0.1, 0.84],
		[0.1 + a * 0.5, 0.45],
		[0.12 + a, 0.06],
		[0.24 + a, 0.0],
		[0.05 + a, 0.0],
		[0.04 + a * 0.6, 0.42],
		[0.0, 0.74],
		[-0.03 - a * 0.6, 0.42],
		[-0.05 - a, 0.04],
		[0.06 - a, 0.0],
		[-0.1 - a, 0.0],
		[-0.1 - a * 0.5, 0.45],
		[-0.12, 0.84],
		[-0.19, 0.86],
		[-0.18, 1.2],
		[-0.15, 1.37],
	];
};
export type Head = 'hat' | 'coyote' | 'front';
export const humanOutline = (step: number, head: Head = 'hat'): V2[] => {
	const h = head === 'hat' ? HAT_HEAD : head === 'coyote' ? COYOTE_HEAD : FRONT_EARS;
	return [...body(step), ...h.slice(0, -1)];
};
// ojos de la sombra cuando ya voltea (metros, tarjeta local)
export const FRONT_EYES: V2[] = [
	[-0.05, 1.6],
	[0.05, 1.6],
];

// claves de la transformación (aproximadas; G2 las redibuja)
export const HUNCHED: V2[] = [
	[0.1, 1.3], [0.25, 1.25], [0.3, 1.0], [0.24, 0.8], [0.12, 0.8], [0.14, 0.4], [0.18, 0.0], [0.04, 0.0], [0.02, 0.5],
	[-0.04, 0.5], [-0.06, 0.0], [-0.18, 0.0], [-0.12, 0.45], [-0.2, 0.85], [-0.24, 1.2], [-0.12, 1.42], [-0.12, 1.66],
	[-0.04, 1.52], [0.04, 1.52], [0.12, 1.68], [0.14, 1.46], [0.26, 1.42],
];
export const COYOTE4: V2[] = [
	[0.42, 0.62], [0.62, 0.55], [0.6, 0.5], [0.4, 0.5], [0.34, 0.4], [0.32, 0.0], [0.27, 0.0], [0.26, 0.38], [0.06, 0.4],
	[-0.2, 0.42], [-0.26, 0.0], [-0.31, 0.0], [-0.32, 0.4], [-0.45, 0.44], [-0.7, 0.2], [-0.62, 0.46], [-0.4, 0.62],
	[0.0, 0.66], [0.3, 0.68], [0.36, 0.84], [0.4, 0.7], [0.46, 0.84],
];
// el nahual «entre formas», de frente (camina hacia el foco): cabeza de coyote, orejas altas, brazos largos, cola
export const BIPED_FRONT: V2[] = [
	[0.0, 1.66], [0.05, 1.66], [0.13, 1.92], [0.12, 1.66], [0.1, 1.52], [0.2, 1.46], [0.3, 1.4], [0.33, 1.0], [0.35, 0.62],
	[0.29, 0.6], [0.26, 0.98], [0.2, 0.9], [0.16, 0.5], [0.15, 0.0], [0.06, 0.0], [0.04, 0.5], [-0.04, 0.5], [-0.06, 0.0],
	[-0.15, 0.0], [-0.16, 0.5], [-0.2, 0.9], [-0.26, 0.98], [-0.29, 0.6], [-0.35, 0.62], [-0.33, 1.0], [-0.3, 1.4], [-0.2, 1.46],
	[-0.1, 1.52], [-0.12, 1.66], [-0.13, 1.92], [-0.05, 1.66],
];
export const BIPED_EYES: V2[] = [
	[-0.045, 1.58],
	[0.045, 1.58],
];
