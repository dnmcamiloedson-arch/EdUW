// Movimiento natural para personajes 2D: cadenas y telas con física verlet precalculada (deterministas:
// se simulan una vez desde el frame 0 y se guardan todos los frames), IK de dos huesos y resortes.
import {noise2D} from '@remotion/noise';
import {cached} from './paint';

export type V2 = [number, number];

// ---------- Cadena (cabello, rebozo, crin, cola, cuerda) ----------
// anchor(f) da la posición del primer punto en el frame f; wind(f, i) una fuerza en px/frame².
export type ChainOpts = {
	key: string;
	frames: number;
	n: number;
	seg: number;
	anchor: (f: number) => V2;
	dir?: V2; // dirección inicial de la cadena
	gravity?: number;
	damping?: number;
	stiffness?: number; // iteraciones de restricción
	wind?: (f: number, i: number) => V2;
	substeps?: number;
};
export const simChain = (o: ChainOpts) =>
	cached(`chain:${o.key}`, () => {
		const {frames, n, seg, anchor, dir = [0, 1], gravity = 0.35, damping = 0.96, stiffness = 6, wind, substeps = 2} = o;
		const out = new Float32Array(frames * n * 2);
		const p = new Float32Array(n * 2);
		const q = new Float32Array(n * 2);
		const a0 = anchor(0);
		for (let i = 0; i < n; i++) {
			p[i * 2] = q[i * 2] = a0[0] + dir[0] * seg * i;
			p[i * 2 + 1] = q[i * 2 + 1] = a0[1] + dir[1] * seg * i;
		}
		// asentar la cadena antes del frame 0 para que no "caiga" al empezar
		const step = (f: number, warm: boolean) => {
			for (let s = 0; s < substeps; s++) {
				const ff = warm ? 0 : f - 1 + (s + 1) / substeps;
				const a = anchor(Math.max(0, ff));
				const g = gravity / (substeps * substeps);
				for (let i = 1; i < n; i++) {
					const x = p[i * 2];
					const y = p[i * 2 + 1];
					let fx = 0;
					let fy = g;
					if (wind) {
						const w = wind(Math.max(0, ff), i);
						fx += w[0] / (substeps * substeps);
						fy += w[1] / (substeps * substeps);
					}
					p[i * 2] = x + (x - q[i * 2]) * damping + fx;
					p[i * 2 + 1] = y + (y - q[i * 2 + 1]) * damping + fy;
					q[i * 2] = x;
					q[i * 2 + 1] = y;
				}
				p[0] = q[0] = a[0];
				p[1] = q[1] = a[1];
				for (let k = 0; k < stiffness; k++)
					for (let i = 1; i < n; i++) {
						const dx = p[i * 2] - p[(i - 1) * 2];
						const dy = p[i * 2 + 1] - p[(i - 1) * 2 + 1];
						const d = Math.hypot(dx, dy) || 1e-6;
						const e = (d - seg) / d;
						if (i === 1) {
							p[i * 2] -= dx * e;
							p[i * 2 + 1] -= dy * e;
						} else {
							p[i * 2] -= dx * e * 0.5;
							p[i * 2 + 1] -= dy * e * 0.5;
							p[(i - 1) * 2] += dx * e * 0.5;
							p[(i - 1) * 2 + 1] += dy * e * 0.5;
						}
					}
			}
		};
		for (let k = 0; k < 90; k++) step(0, true);
		for (let f = 0; f < frames; f++) {
			if (f > 0) step(f, false);
			out.set(p, f * n * 2);
		}
		return out;
	});
export const chainAt = (data: Float32Array, n: number, f: number): V2[] => {
	const frames = data.length / (n * 2);
	const fi = Math.max(0, Math.min(frames - 1, Math.floor(f)));
	const fj = Math.min(frames - 1, fi + 1);
	const u = Math.max(0, Math.min(1, f - fi));
	const pts: V2[] = [];
	for (let i = 0; i < n; i++) {
		const a = (fi * n + i) * 2;
		const b = (fj * n + i) * 2;
		pts.push([data[a] + (data[b] - data[a]) * u, data[a + 1] + (data[b + 1] - data[a + 1]) * u]);
	}
	return pts;
};

// ---------- Tela (velo, vestido, sarape, bandera): rejilla con puntos fijos ----------
export type ClothOpts = {
	key: string;
	frames: number;
	cols: number;
	rows: number;
	spacing: number;
	pin: (f: number, c: number, r: number) => V2 | null; // posición forzada del punto (o null si es libre)
	rest: (c: number, r: number) => V2; // posición inicial
	gravity?: number;
	damping?: number;
	iterations?: number;
	wind?: (f: number, c: number, r: number) => V2;
};
export const simCloth = (o: ClothOpts) =>
	cached(`cloth:${o.key}`, () => {
		const {frames, cols, rows, spacing, pin, rest, gravity = 0.3, damping = 0.97, iterations = 5, wind} = o;
		const N = cols * rows;
		const p = new Float32Array(N * 2);
		const q = new Float32Array(N * 2);
		for (let r = 0; r < rows; r++)
			for (let c = 0; c < cols; c++) {
				const v = rest(c, r);
				const i = (r * cols + c) * 2;
				p[i] = q[i] = v[0];
				p[i + 1] = q[i + 1] = v[1];
			}
		const links: [number, number, number][] = [];
		for (let r = 0; r < rows; r++)
			for (let c = 0; c < cols; c++) {
				const i = r * cols + c;
				if (c < cols - 1) links.push([i, i + 1, spacing]);
				if (r < rows - 1) links.push([i, i + cols, spacing]);
				if (c < cols - 1 && r < rows - 1) links.push([i, i + cols + 1, spacing * Math.SQRT2 * 1.02]);
				if (c > 0 && r < rows - 1) links.push([i, i + cols - 1, spacing * Math.SQRT2 * 1.02]);
			}
		const out = new Float32Array(frames * N * 2);
		const step = (f: number) => {
			for (let r = 0; r < rows; r++)
				for (let c = 0; c < cols; c++) {
					const k = r * cols + c;
					const i = k * 2;
					const x = p[i];
					const y = p[i + 1];
					let fx = 0;
					let fy = gravity;
					if (wind) {
						const w = wind(f, c, r);
						fx += w[0];
						fy += w[1];
					}
					p[i] = x + (x - q[i]) * damping + fx;
					p[i + 1] = y + (y - q[i + 1]) * damping + fy;
					q[i] = x;
					q[i + 1] = y;
				}
			for (let it = 0; it < iterations; it++) {
				for (const [a, b, L] of links) {
					const dx = p[b * 2] - p[a * 2];
					const dy = p[b * 2 + 1] - p[a * 2 + 1];
					const d = Math.hypot(dx, dy) || 1e-6;
					const e = ((d - L) / d) * 0.5;
					p[a * 2] += dx * e;
					p[a * 2 + 1] += dy * e;
					p[b * 2] -= dx * e;
					p[b * 2 + 1] -= dy * e;
				}
				for (let r = 0; r < rows; r++)
					for (let c = 0; c < cols; c++) {
						const v = pin(f, c, r);
						if (v) {
							const i = (r * cols + c) * 2;
							p[i] = v[0];
							p[i + 1] = v[1];
						}
					}
			}
		};
		for (let k = 0; k < 120; k++) step(0);
		for (let f = 0; f < frames; f++) {
			if (f > 0) step(f);
			out.set(p, f * N * 2);
		}
		return out;
	});
export const clothAt = (data: Float32Array, cols: number, rows: number, f: number) => {
	const N = cols * rows;
	const frames = data.length / (N * 2);
	const fi = Math.max(0, Math.min(frames - 1, Math.floor(f)));
	const fj = Math.min(frames - 1, fi + 1);
	const u = Math.max(0, Math.min(1, f - fi));
	const out = new Float32Array(N * 2);
	for (let i = 0; i < N * 2; i++) out[i] = data[fi * N * 2 + i] + (data[fj * N * 2 + i] - data[fi * N * 2 + i]) * u;
	return out;
};

// Viento suave y racheado (px/frame²)
export const gust = (seed: number, strength = 0.12, freq = 0.03) => (f: number, i: number): V2 => [
	(0.6 + 0.4 * noise2D('gx' + seed, f * freq, i * 0.15)) * strength,
	noise2D('gy' + seed, f * freq * 1.3, i * 0.2) * strength * 0.35,
];

// ---------- IK de dos huesos (brazo, pierna) ----------
export const ik2 = (root: V2, target: V2, L1: number, L2: number, bendSign = 1): {mid: V2; end: V2} => {
	const dx = target[0] - root[0];
	const dy = target[1] - root[1];
	const d = Math.min(Math.hypot(dx, dy), L1 + L2 - 1e-3);
	const base = Math.atan2(dy, dx);
	const a = Math.acos(Math.max(-1, Math.min(1, (L1 * L1 + d * d - L2 * L2) / (2 * L1 * d))));
	const ang = base + a * bendSign;
	const mid: V2 = [root[0] + Math.cos(ang) * L1, root[1] + Math.sin(ang) * L1];
	const b2 = Math.atan2(target[1] - mid[1], target[0] - mid[0]);
	return {mid, end: [mid[0] + Math.cos(b2) * L2, mid[1] + Math.sin(b2) * L2]};
};

// Resorte críticamente amortiguado sobre una señal (seguimiento con inercia, sin rebote)
export const springFollow = (key: string, frames: number, target: (f: number) => number, omega = 0.25) =>
	cached(`spring:${key}`, () => {
		const out = new Float32Array(frames);
		let x = target(0);
		let v = 0;
		for (let f = 0; f < frames; f++) {
			const tg = target(f);
			const a = omega * omega * (tg - x) - 2 * omega * v;
			v += a;
			x += v;
			out[f] = x;
		}
		return out;
	});
export const sampleF = (arr: Float32Array, f: number) => {
	const i = Math.max(0, Math.min(arr.length - 1, Math.floor(f)));
	const j = Math.min(arr.length - 1, i + 1);
	return arr[i] + (arr[j] - arr[i]) * Math.max(0, Math.min(1, f - i));
};

// Curva suave por puntos (Catmull-Rom → Bézier) para siluetas orgánicas
export const smoothPath = (ctx: CanvasRenderingContext2D, pts: V2[], close = false, tension = 0.5) => {
	const n = pts.length;
	if (n < 2) return;
	ctx.moveTo(pts[0][0], pts[0][1]);
	const get = (i: number) => (close ? pts[(i + n) % n] : pts[Math.max(0, Math.min(n - 1, i))]);
	const last = close ? n : n - 1;
	for (let i = 0; i < last; i++) {
		const p0 = get(i - 1);
		const p1 = get(i);
		const p2 = get(i + 1);
		const p3 = get(i + 2);
		const k = tension / 3;
		ctx.bezierCurveTo(p1[0] + (p2[0] - p0[0]) * k, p1[1] + (p2[1] - p0[1]) * k, p2[0] - (p3[0] - p1[0]) * k, p2[1] - (p3[1] - p1[1]) * k, p2[0], p2[1]);
	}
	if (close) ctx.closePath();
};
