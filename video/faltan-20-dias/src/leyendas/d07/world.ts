// Día 7 · El Nahual — el mundo: un solo plano secuencia, agachados detrás de la cortina metálica de la tiendita.
// Metros: x a la derecha, y hacia arriba, z hacia adelante. Ojo en (0, 0.75, 0), F = 1500 px, horizonte en y = 780.
// Un solo foco (el de la tiendita) mueve todas las sombras: su péndulo e intensidad viven aquí.
import {noise2D} from '@remotion/noise';
import {E, FPS, clamp, lerp} from '../../lib/util';

export type V2 = [number, number];
export type V3 = [number, number, number];

export const F_ = 1500;
export const HZ = 780;
export const CX = 540;
export const EYE = 0.75;
export const WALL_Z = 4.2;
export const WALL_X0 = -0.8; // esquina de la casa; a la izquierda, el callejón
export const LEN = 1230;

export const sx = (x: number, z: number) => CX + (F_ * x) / z;
export const sy = (y: number, z: number) => HZ - (F_ * (y - EYE)) / z;
export const P = (x: number, y: number, z: number): V2 => [sx(x, z), sy(y, z)];
export const pxPerM = (z: number) => F_ / z;
export const WALL_BASE = sy(0, WALL_Z); // ≈ 1048
export const WALL_SX0 = sx(WALL_X0, WALL_Z); // ≈ 254
// del píxel de calle a su profundidad / posición
export const groundZ = (py: number) => (F_ * EYE) / Math.max(1e-3, py - HZ);
export const groundX = (px: number, z: number) => ((px - CX) * z) / F_;
export const wallX = (px: number) => ((px - CX) * WALL_Z) / F_;
export const wallY = (py: number) => EYE - ((py - HZ) * WALL_Z) / F_;

export const fr = (s: number) => Math.round(s * FPS);
export const sec = (f: number) => f / FPS;
export const seg = (f: number, a: number, b: number) => clamp((f - a) / (b - a));
export const smooth = (u: number) => u * u * (3 - 2 * u);

// ---------------------------------------------------------------- el foco
export const PIVOT: V3 = [-1.0, 2.31, 0.5];
// cable corto: el foco cuelga a 1.95 m, así la sombra del sombrero completo cae bajo el labio de la cortina
export const CABLE = 0.36;
export const SWING_T = 1.5;
export const KICKS: {t0: number; A: number; tau: number}[] = [
	{t0: 31.3, A: (22 * Math.PI) / 180, tau: 1.0},
	{t0: 34.6, A: (18 * Math.PI) / 180, tau: 1.2},
];
export const bulbTheta = (t: number) => {
	let th = 0.02 * noise2D('d07sway', t * 0.35, 0.5) + 0.01 * Math.sin((t * 2 * Math.PI) / SWING_T);
	for (const k of KICKS) {
		const u = t - k.t0;
		if (u > 0) th += k.A * Math.exp(-u / k.tau) * Math.sin((2 * Math.PI * u) / SWING_T) * clamp(u / 0.06);
	}
	return th;
};
export const bulbPos = (t: number): V3 => {
	const th = bulbTheta(t);
	const dx = CABLE * Math.sin(th);
	return [PIVOT[0] + dx, PIVOT[1] - CABLE * Math.cos(th), PIVOT[2] + 0.3 * dx];
};
export const BULB0: V3 = [PIVOT[0], PIVOT[1] - CABLE, PIVOT[2]];
// intensidad: zumbido + parpadeo del filamento (f30–33)
const FLICK: Record<number, number> = {30: 0.62, 31: 0.25, 32: 0.78};
export const bulbI = (f: number) => {
	const fi = Math.floor(f);
	const base = FLICK[fi] ?? 1;
	return base * (0.985 + 0.015 * noise2D('d07hum', f * 0.9, 0.1));
};
// irradiancia relativa (1 = pie del foco sobre la pared, a 3.7 m)
const IREF = 1 / (3.7 * 3.7);
export const irr = (L: V3, p: V3, n: V3) => {
	const dx = L[0] - p[0];
	const dy = L[1] - p[1];
	const dz = L[2] - p[2];
	const d2 = dx * dx + dy * dy + dz * dz;
	const d = Math.sqrt(d2);
	const c = Math.max(0, (dx * n[0] + dy * n[1] + dz * n[2]) / d);
	return (c / d2) / IREF;
};

// ---------------------------------------------------------------- la cortina (borde inferior en px de pantalla)
type SKey = {f: number; y: number; dur: number; bounce?: number};
const PULLS: SKey[] = [
	{f: 840, y: 540, dur: 6, bounce: 12},
	{f: 864, y: 650, dur: 6, bounce: 12},
	{f: 888, y: 760, dur: 6, bounce: 12},
];
export const shutterEdge = (f: number) => {
	let y = 430 + Math.sin(f * 0.21) * 0.6;
	for (const k of PULLS) {
		if (f < k.f) break;
		const prev = y;
		const u = clamp((f - k.f) / k.dur);
		y = lerp(prev, k.y, E.out(u));
		const b = f - k.f - k.dur;
		if (b >= 0 && b < 10) y += (k.bounce ?? 0) * Math.exp(-b / 2.2) * Math.cos(b * 1.4) * 0.6;
	}
	// cabezazo contra el labio
	if (f >= 945 && f < 957) y += 8 * Math.exp(-(f - 945) / 3) * Math.cos((f - 945) * 1.3);
	// portazo
	if (f >= 957 && f < 1020) y = lerp(760, 1960, E.in(clamp((f - 957) / 3)));
	// sube con un atorón
	if (f >= 1020) {
		const up = (u: number) => lerp(1960, 430, u);
		if (f < 1038) y = up(0.62 * E.inOut(clamp((f - 1020) / 18)));
		else if (f < 1044) y = up(0.62) + Math.sin((f - 1038) * 2.2) * 10 * Math.exp(-(f - 1038) / 2);
		else y = up(0.62 + 0.38 * E.out(clamp((f - 1044) / 18)));
	}
	return y;
};

// ---------------------------------------------------------------- cámara (transformación 2D del mundo)
type CK = {t: number; s: number; cx: number; cy: number; px?: number};
const CKEYS: CK[] = [
	{t: 0, s: 1.0, cx: 540, cy: 900},
	{t: 2.6, s: 1.0, cx: 540, cy: 900},
	{t: 6.6, s: 1.02, cx: 540, cy: 900},
	{t: 11.2, s: 1.05, cx: 520, cy: 880},
	{t: 16.0, s: 1.05, cx: 520, cy: 880},
	{t: 22.6, s: 1.1, cx: 640, cy: 760},
	{t: 24.6, s: 1.08, cx: 640, cy: 760, px: -40}, // G2: sigue al coyote hacia la derecha (mirada a la lente en cuadro)
	{t: 26.0, s: 1.06, cx: 640, cy: 760, px: -30},
	{t: 30.5, s: 1.0, cx: 540, cy: 900, px: 0},
	{t: 34.0, s: 1.0, cx: 540, cy: 760},
	{t: 38.2, s: 1.04, cx: 540, cy: 760},
	{t: 41.0, s: 1.05, cx: 540, cy: 760},
];
const crv = (p0: number, p1: number, p2: number, p3: number, u: number) => 0.5 * (2 * p1 + (-p0 + p2) * u + (2 * p0 - 5 * p1 + 4 * p2 - p3) * u * u + (-p0 + 3 * p1 - 3 * p2 + p3) * u * u * u);
const ckv = (k: CK) => [k.s, (1 - k.s) * k.cx + (k.px ?? 0), (1 - k.s) * k.cy];
const camBase = (t: number) => {
	const n = CKEYS.length;
	if (t <= CKEYS[0].t) return ckv(CKEYS[0]);
	if (t >= CKEYS[n - 1].t) return ckv(CKEYS[n - 1]);
	let i = 0;
	while (i < n - 2 && t > CKEYS[i + 1].t) i++;
	const u = E.inOut(clamp((t - CKEYS[i].t) / (CKEYS[i + 1].t - CKEYS[i].t)));
	const a = ckv(CKEYS[Math.max(0, i - 1)]);
	const b = ckv(CKEYS[i]);
	const c = ckv(CKEYS[i + 1]);
	const d = ckv(CKEYS[Math.min(n - 1, i + 2)]);
	return [0, 1, 2].map((j) => crv(a[j], b[j], c[j], d[j], u));
};
// amplitud (px) y frecuencia (Hz) de la respiración / cámara en mano
export const handAmp = (t: number) => {
	if (t < 11.2) return 2;
	if (t < 16) return lerp(2, 1, clamp((t - 11.2) / 0.5));
	if (t < 26) return lerp(1, 2, clamp((t - 16) / 0.6));
	if (t < 30.5) return lerp(2, 6, E.in(clamp((t - 26) / 4.5)));
	if (t < 31.2) return lerp(6, 0, clamp((t - 30.5) / 0.12));
	if (t < 34) return 0;
	if (t < 38.2) return 1.5;
	return 1;
};
export const handFreq = (t: number) => (t < 26 ? 0.22 : t < 30.5 ? lerp(0.22, 0.55, clamp((t - 26) / 4.5)) : 0.3);
// fase integrada (sin saltos cuando cambia la frecuencia)
const PHASE = (() => {
	const a = new Float32Array(LEN + 200);
	let ph = 0;
	for (let i = 0; i < a.length; i++) {
		a[i] = ph;
		ph += handFreq(i / FPS) / FPS;
	}
	return a;
})();
export type CamT = {s: number; ox: number; oy: number; roll: number; hx: number; hy: number};
export const camAt = (f: number): CamT => {
	const t = f / FPS;
	const [s0, ox0, oy0] = camBase(t);
	const fi = Math.max(0, Math.min(PHASE.length - 2, Math.floor(f)));
	const ph = PHASE[fi] + (PHASE[fi + 1] - PHASE[fi]) * (f - fi);
	const a = handAmp(t);
	let hx = (noise2D('d07hx', ph * 2.2, 0.3) * 0.8 + Math.sin(ph * Math.PI * 2) * 0.25) * a;
	let hy = (noise2D('d07hy', 0.7, ph * 2.0) * 0.6 + Math.sin(ph * Math.PI * 2 + 1.2) * 0.6) * a;
	let roll = noise2D('d07hr', ph * 1.4, 2.0) * 0.0009 * a;
	// golpe del susto: zoom 1.00 → 1.07 en 3 f + sacudida 38 px en 10 f
	let s = s0;
	let ox = ox0;
	let oy = oy0;
	if (f >= 936 && f < 957) {
		const pk = 1 + 0.07 * E.out(clamp((f - 936) / 3));
		ox = ox * pk + (1 - pk) * 560;
		oy = oy * pk + (1 - pk) * 700;
		s *= pk;
		const k = Math.pow(clamp(1 - (f - 936) / 10), 2);
		hx += noise2D('d07sk', f * 0.9, 0) * 38 * k;
		hy += noise2D('d07sk', 0, f * 0.9) * 38 * k;
		roll += noise2D('d07sr', f * 0.7, 3) * 0.02 * k;
	}
	return {s, ox, oy, roll, hx, hy};
};
// aplica la cámara del mundo al contexto
export const worldT = (g: CanvasRenderingContext2D, c: CamT) => {
	g.setTransform(1, 0, 0, 1, 0, 0);
	g.translate(CX + c.hx, 960 + c.hy);
	g.rotate(c.roll);
	g.translate(-CX, -960);
	g.transform(c.s, 0, 0, c.s, c.ox, c.oy);
};
// la cortina solo recibe la cámara en mano (y el golpe del susto), no el zoom del mundo
export const shutterT = (g: CanvasRenderingContext2D, c: CamT, f: number) => {
	g.setTransform(1, 0, 0, 1, 0, 0);
	g.translate(CX + c.hx * 1.15, 960 + c.hy * 1.15);
	g.rotate(c.roll);
	g.translate(-CX, -960);
	if (f >= 936 && f < 957) {
		const pk = 1 + 0.07 * E.out(clamp((f - 936) / 3));
		g.translate(560 * (1 - pk), 700 * (1 - pk));
		g.scale(pk, pk);
	}
};

// ---------------------------------------------------------------- foco de la lente (DOF)
type FK = [number, number];
const FKEYS: FK[] = [
	[0, 4.2],
	[19.5, 4.2],
	[20.2, 2.4],
	[25.4, 2.4],
	[26.4, 4.2],
	[35.6, 4.2],
	[35.75, 1.44],
	[36.0, 1.44],
	[36.4, 4.2],
];
export const focusZ = (f: number) => {
	const t = f / FPS;
	if (t <= FKEYS[0][0]) return FKEYS[0][1];
	for (let i = 0; i < FKEYS.length - 1; i++) {
		const [t0, z0] = FKEYS[i];
		const [t1, z1] = FKEYS[i + 1];
		if (t <= t1) {
			const u = E.inOut(clamp((t - t0) / (t1 - t0)));
			return 1 / lerp(1 / z0, 1 / z1, u);
		}
	}
	return FKEYS[FKEYS.length - 1][1];
};
export const blurFor = (z: number, f: number) => Math.min(28, 34 * Math.abs(1 / z - 1 / focusZ(f)));
