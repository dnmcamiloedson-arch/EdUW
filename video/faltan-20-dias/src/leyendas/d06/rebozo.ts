// Rebozo de la madre: rejilla 10×14 en coordenadas locales del cuerpo. La fila de arriba va fija (capucha y hombros);
// las demás siguen su forma de reposo con resortes cada vez más blandos hacia el borde, más la inercia del cuerpo
// (aceleración del cuerpo en el mundo) y el arrastre del aire: así el rebozo se retrasa, columpia y asienta.
// 18 barbas (flecos) = simChain del kit colgadas del borde inferior. Todo precalculado y determinista.
import {noise2D} from '@remotion/noise';
import {cached} from '../kit/paint';
import {chainAt, simChain, type V2} from '../kit/rig';
import {COLS, ROWS, restCloth, solveBody} from './rig06';
import {poseAt} from './poses';
import {LEN} from './timeline';

const F = LEN + 4;
const N = COLS * ROWS;

type Root = {x: number; y: number; s: number};
const roots = () =>
	cached('d06:rebozoRoots', () => {
		const out: Root[] = [];
		let last: Root = {x: 1000, y: 1700, s: 1.4};
		for (let f = 0; f < F; f++) {
			const p = poseAt(f);
			if (p) last = {x: p.x, y: p.y + (p.bob ?? 0) * (p.s ?? 1), s: p.s ?? 1};
			out.push(last);
		}
		return out;
	});

const bodyAt = (f: number) => {
	const p = poseAt(f);
	return solveBody({m: p?.seated ?? 0, lean: p?.lean ?? 0, head: p?.head ?? 0, walk: p?.walk ?? null});
};

// aceleración y velocidad del cuerpo en unidades locales
const motion = (f: number) => {
	const R = roots();
	const a = R[Math.max(0, f - 2)];
	const b = R[Math.max(0, f - 1)];
	const c = R[f];
	const s = c.s;
	return {ax: (c.x - 2 * b.x + a.x) / s, ay: (c.y - 2 * b.y + a.y) / s, vx: (c.x - b.x) / s, vy: (c.y - b.y) / s};
};

export const rebozoSim = () =>
	cached('d06:rebozoSim', () => {
		const out = new Float32Array(F * N * 2);
		const p = new Float32Array(N * 2);
		const v = new Float32Array(N * 2);
		const b0 = bodyAt(0);
		for (let r = 0; r < ROWS; r++)
			for (let c = 0; c < COLS; c++) {
				const q = restCloth(b0, c, r);
				const i = (r * COLS + c) * 2;
				p[i] = q[0];
				p[i + 1] = q[1];
			}
		for (let f = 0; f < F; f++) {
			const b = bodyAt(f);
			const mo = motion(f);
			for (let r = 0; r < ROWS; r++) {
				const vv = r / (ROWS - 1);
				const k = 0.05 + 0.6 * Math.pow(1 - vv, 3);
				const w = Math.pow(vv, 1.3);
				for (let c = 0; c < COLS; c++) {
					const i = (r * COLS + c) * 2;
					const q = restCloth(b, c, r);
					if (r === 0) {
						p[i] = q[0];
						p[i + 1] = q[1];
						v[i] = v[i + 1] = 0;
						continue;
					}
					const gx = noise2D('d6rbx', f * 0.03, c * 0.2 + r * 0.1) * 0.12 * w;
					const gy = noise2D('d6rby', f * 0.025, c * 0.15) * 0.05 * w;
					v[i] += k * (q[0] - p[i]) - mo.ax * 0.9 * w - mo.vx * 0.04 * w + gx;
					v[i + 1] += k * (q[1] - p[i + 1]) - mo.ay * 0.9 * w - mo.vy * 0.03 * w + gy;
					v[i] *= 0.84;
					v[i + 1] *= 0.84;
					p[i] += v[i];
					p[i + 1] += v[i + 1];
				}
			}
			out.set(p, f * N * 2);
		}
		return out;
	});

// rejilla del rebozo en el frame f (local)
export const rebozoAt = (f: number): Float32Array => {
	const data = rebozoSim();
	const fi = Math.max(0, Math.min(F - 2, Math.floor(f)));
	const u = Math.max(0, Math.min(1, f - fi));
	const outA = new Float32Array(N * 2);
	for (let i = 0; i < N * 2; i++) outA[i] = data[fi * N * 2 + i] + (data[(fi + 1) * N * 2 + i] - data[fi * N * 2 + i]) * u;
	return outA;
};

export const gridPt = (G: Float32Array, c: number, r: number): V2 => [G[(r * COLS + c) * 2], G[(r * COLS + c) * 2 + 1]];
// punto del borde inferior en u ∈ [0,1] (interpolado entre columnas)
export const bottomAt = (G: Float32Array, u: number): V2 => {
	const x = u * (COLS - 1);
	const c = Math.min(COLS - 2, Math.floor(x));
	const t = x - c;
	const a = gridPt(G, c, ROWS - 1);
	const b = gridPt(G, c + 1, ROWS - 1);
	return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
};

export const FRINGE = 18;
const FR_N = 6;
const FR_SEG = 7.5;
export const fringeAt = (f: number): V2[][] => {
	const out: V2[][] = [];
	for (let i = 0; i < FRINGE; i++) {
		const u = 0.03 + (i / (FRINGE - 1)) * 0.94;
		const data = simChain({
			key: `d06fr${i}`,
			frames: F,
			n: FR_N,
			seg: FR_SEG,
			gravity: 0.32,
			damping: 0.9,
			anchor: (ff) => {
				const D = rebozoSim();
				const fi = Math.max(0, Math.min(F - 1, Math.floor(ff)));
				const x = u * (COLS - 1);
				const c = Math.min(COLS - 2, Math.floor(x));
				const t = x - c;
				const ia = (fi * N + (ROWS - 1) * COLS + c) * 2;
				const ib = ia + 2;
				return [D[ia] + (D[ib] - D[ia]) * t, D[ia + 1] + (D[ib + 1] - D[ia + 1]) * t];
			},
			wind: (ff, k) => {
				const mo = motion(Math.max(0, Math.min(F - 1, Math.floor(ff))));
				return [-mo.ax * 0.5 - mo.vx * 0.03 + noise2D('d6frw', ff * 0.04, i * 0.3 + k * 0.1) * 0.05, -mo.ay * 0.5];
			},
		});
		out.push(chainAt(data, FR_N, f));
	}
	return out;
};
