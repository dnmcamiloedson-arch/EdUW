// Día 7 · cadenas verlet en 3D (fleco del sarape, colas) con simulación INCREMENTAL determinista: se simula desde el
// frame 0 hasta el frame pedido y se guarda cada frame; pedir un frame anterior solo lee. El resultado es idéntico
// sin importar el orden en que se rendericen los frames (siempre se avanza igual desde 0), y un still aislado solo
// paga hasta su frame (no todo el episodio).
import type {V3} from './world';

export type ChainSpec = {
	n: number; // puntos por hebra (incluye el ancla)
	seg: number; // largo de segmento (m)
	strands: number;
	anchors: (f: number) => V3[]; // una por hebra (m, mundo)
	rest?: (f: number, s: number) => V3; // dirección inicial (unitaria)
	gravity?: number; // m/frame²
	damping?: number;
	wind?: (f: number, s: number, i: number) => V3;
	iters?: number;
	substeps?: number;
	floor?: number; // y mínima (piso)
	stiff?: number; // 0..1: tendencia a conservar la dirección de reposo (colas rígidas)
};
type State = {frames: Float32Array[]; p: Float32Array; q: Float32Array};
const store = new Map<string, State>();

export const chainFrame = (key: string, spec: ChainSpec, f: number): Float32Array => {
	const fi = Math.max(0, Math.floor(f));
	let st = store.get(key);
	const {n, seg, strands, substeps = 2} = spec;
	const N = n * strands * 3;
	if (!st) {
		const p = new Float32Array(N);
		const q = new Float32Array(N);
		const A = spec.anchors(0);
		for (let s = 0; s < strands; s++) {
			const d = spec.rest ? spec.rest(0, s) : ([0, -1, 0] as V3);
			for (let i = 0; i < n; i++) {
				const o = (s * n + i) * 3;
				p[o] = q[o] = A[s][0] + d[0] * seg * i;
				p[o + 1] = q[o + 1] = A[s][1] + d[1] * seg * i;
				p[o + 2] = q[o + 2] = A[s][2] + d[2] * seg * i;
			}
		}
		st = {frames: [], p, q};
		store.set(key, st);
		// asentar
		for (let k = 0; k < 40; k++) step(st, spec, 0, 0, true);
		st.frames.push(st.p.slice());
	}
	while (st.frames.length <= fi) {
		const f1 = st.frames.length;
		for (let s = 0; s < substeps; s++) step(st, spec, f1 - 1 + (s + 1) / substeps, f1, false);
		st.frames.push(st.p.slice());
	}
	return st.frames[fi];
};

const step = (st: State, spec: ChainSpec, ff: number, fInt: number, warm: boolean) => {
	const {n, seg, strands, gravity = 0.0109, damping = 0.94, iters = 4, substeps = 2, floor = -1e9, stiff = 0} = spec;
	const {p, q} = st;
	const A = spec.anchors(warm ? 0 : ff);
	const g = gravity / (substeps * substeps);
	for (let s = 0; s < strands; s++) {
		const rd = stiff > 0 && spec.rest ? spec.rest(warm ? 0 : fInt, s) : null;
		for (let i = 1; i < n; i++) {
			const o = (s * n + i) * 3;
			const w = spec.wind ? spec.wind(warm ? 0 : ff, s, i) : null;
			for (let c = 0; c < 3; c++) {
				const x = p[o + c];
				let acc = c === 1 ? -g : 0;
				if (w) acc += w[c] / (substeps * substeps);
				p[o + c] = x + (x - q[o + c]) * damping + acc;
				q[o + c] = x;
			}
		}
		const o0 = s * n * 3;
		p[o0] = q[o0] = A[s][0];
		p[o0 + 1] = q[o0 + 1] = A[s][1];
		p[o0 + 2] = q[o0 + 2] = A[s][2];
		for (let it = 0; it < iters; it++) {
			for (let i = 1; i < n; i++) {
				const a = (s * n + i - 1) * 3;
				const b = (s * n + i) * 3;
				const dx = p[b] - p[a];
				const dy = p[b + 1] - p[a + 1];
				const dz = p[b + 2] - p[a + 2];
				const d = Math.hypot(dx, dy, dz) || 1e-6;
				const e = (d - seg) / d;
				if (i === 1) {
					p[b] -= dx * e;
					p[b + 1] -= dy * e;
					p[b + 2] -= dz * e;
				} else {
					p[b] -= dx * e * 0.5;
					p[b + 1] -= dy * e * 0.5;
					p[b + 2] -= dz * e * 0.5;
					p[a] += dx * e * 0.5;
					p[a + 1] += dy * e * 0.5;
					p[a + 2] += dz * e * 0.5;
				}
				if (rd) {
					// rigidez: empuja cada punto hacia la dirección de reposo desde el anterior
					const tx = p[a] + rd[0] * seg;
					const ty = p[a + 1] + rd[1] * seg;
					const tz = p[a + 2] + rd[2] * seg;
					const k = stiff * (1 - i / (n + 1));
					p[b] += (tx - p[b]) * k;
					p[b + 1] += (ty - p[b + 1]) * k;
					p[b + 2] += (tz - p[b + 2]) * k;
				}
				if (p[b + 1] < floor) p[b + 1] = floor;
			}
		}
	}
};
// lee la hebra s como puntos V3
export const strand = (fr: Float32Array, n: number, s: number): V3[] => {
	const out: V3[] = [];
	for (let i = 0; i < n; i++) {
		const o = (s * n + i) * 3;
		out.push([fr[o], fr[o + 1], fr[o + 2]]);
	}
	return out;
};
