// Cámara POV estenopeica del viajero (el Cam del kit no tiene yaw/pitch): mundo en metros, x a la derecha,
// y hacia arriba (suelo = 0), z hacia adelante (dirección de marcha). Centro óptico en (540, 820).
import {noise2D} from '@remotion/noise';
import {W, clamp} from '../../lib/util';
import type {Ctx} from '../kit/paint';

export const CX = W / 2;
export const CY = 820;
export const FOCAL = 1400;

export type Pov = {x: number; z: number; eyeH: number; yaw: number; pitch: number; roll: number; zoom: number; ox: number; oy: number};
export const POV0: Pov = {x: 0, z: 0, eyeH: 1.62, yaw: 0, pitch: 0, roll: 0, zoom: 1, ox: 0, oy: 0};
export const pov = (o: Partial<Pov>): Pov => ({...POV0, ...o});
export const deg = (d: number) => (d * Math.PI) / 180;

// proyección: regresa [sx, sy, depth] (depth ≤ 0 → detrás de la cámara)
export const proj = (c: Pov, x: number, y: number, z: number): [number, number, number] => {
	let dx = x - c.x;
	const dy = y - c.eyeH;
	let dz = z - c.z;
	const cy = Math.cos(c.yaw);
	const sy = Math.sin(c.yaw);
	const rx = dx * cy - dz * sy;
	dz = dx * sy + dz * cy;
	dx = rx;
	const cp = Math.cos(c.pitch);
	const sp = Math.sin(c.pitch);
	const ry = dy * cp - dz * sp;
	const rz = dy * sp + dz * cp;
	const fz = Math.max(0.01, rz);
	const f = FOCAL * c.zoom;
	return [CX + c.ox + (f * dx) / fz, CY + c.oy - (f * ry) / fz, rz];
};
// escala en px por metro a una profundidad
export const pxPerM = (c: Pov, depth: number) => (FOCAL * c.zoom) / Math.max(0.01, depth);
export const horizonY = (c: Pov) => CY + c.oy + FOCAL * c.zoom * Math.tan(c.pitch);

// aplica roll (y zoom de pantalla extra) alrededor del centro óptico
export const withRoll = (g: Ctx, c: Pov, fn: () => void) => {
	g.save();
	g.translate(CX, CY);
	g.rotate(c.roll);
	g.translate(-CX, -CY);
	fn();
	g.restore();
};

// ---------- caminata: fase del paso → bob (|sin|, fondo agudo), balanceo, roll y talonazos ----------
// period(t) en s; regresa fase acumulada integrada (determinista, analítica por tramos)
export const stepPhase = (t: number, t0: number, tFast0: number, tFast1: number, p0 = 0.56, p1 = 0.4) => {
	if (t <= t0) return 0;
	// frecuencia lineal entre tFast0 y tFast1
	const f0 = 1 / p0;
	const f1 = 1 / p1;
	const a = Math.min(t, tFast0) - t0;
	let ph = Math.max(0, a) * f0;
	if (t > tFast0) {
		const u = Math.min(t, tFast1) - tFast0;
		const k = (f1 - f0) / (tFast1 - tFast0);
		ph += f0 * u + 0.5 * k * u * u;
	}
	if (t > tFast1) ph += (t - tFast1) * f1;
	return ph; // en pasos
};
export const walkOffset = (phase: number, amp: number, swayAmp = 6) => {
	const s = Math.sin(phase * Math.PI);
	const bob = (1 - Math.abs(s)) * amp; // fondo agudo en cada talonazo
	return {
		oy: bob - amp * 0.5,
		ox: Math.sin(phase * Math.PI * 0.5) * swayAmp,
		roll: deg(0.5) * Math.sin(phase * Math.PI * 0.5),
		heel: Math.pow(1 - clamp(Math.abs(s) * 4), 2), // pulso en cada talonazo
	};
};

// deriva de respiración / temblor
export const breathe = (t: number, amp = 3, hz = 0.25) => Math.sin(t * Math.PI * 2 * hz) * amp;
export const tremor = (t: number, amp: number, seed = 1) => ({x: noise2D('trx' + seed, t * 3, 0) * amp, y: noise2D('try' + seed, 0, t * 3) * amp});

// desenfoque de movimiento por submuestras: pinta fn(u) n veces con alpha acumulada (u ∈ [0,1])
export const subsample = (g: Ctx, n: number, fn: (u: number) => void) => {
	if (n <= 1) {
		fn(0.5);
		return;
	}
	for (let i = 0; i < n; i++) {
		g.save();
		g.globalAlpha = i === 0 ? 1 : 1 / (i + 1);
		fn(i / (n - 1));
		g.restore();
	}
};
