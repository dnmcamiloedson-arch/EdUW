// Cámara 2.5D: el mundo está hecho de planos a distintas profundidades. El orden de las capas lo da la
// profundidad (z), así que nunca hay una montaña delante de lo que debería taparla.
// Unidades: x/y del mundo en píxeles "a profundidad de referencia" (z = REF), y hacia abajo como en el lienzo.
import {noise2D} from '@remotion/noise';
import {H, W, clamp, lerp} from '../../lib/util';
import type {Ctx} from './paint';

export const REF = 1000; // a esta distancia de la cámara, 1 unidad del mundo = 1 píxel

export type Cam = {x: number; y: number; z: number; roll?: number; zoom?: number};
export const CAM0: Cam = {x: 0, y: 0, z: 0, roll: 0, zoom: 1};

// escala de un plano a profundidad z (z > cam.z)
export const depthScale = (cam: Cam, z: number) => (REF * (cam.zoom ?? 1)) / Math.max(1, z - cam.z);

// Proyecta un punto del mundo (x, y en el plano z) a pantalla
export const project = (cam: Cam, x: number, y: number, z: number): [number, number, number] => {
	const s = depthScale(cam, z);
	let px = (x - cam.x) * s;
	let py = (y - cam.y) * s;
	const r = cam.roll ?? 0;
	if (r) {
		const c = Math.cos(r);
		const sn = Math.sin(r);
		[px, py] = [px * c - py * sn, px * sn + py * c];
	}
	return [W / 2 + px, H / 2 + py, s];
};

// Ejecuta fn con la transformación del plano z: dentro de fn se dibuja en coordenadas del mundo
export const onPlane = (ctx: Ctx, cam: Cam, z: number, fn: (s: number) => void) => {
	if (z <= cam.z + 1) return;
	const s = depthScale(cam, z);
	const r = cam.roll ?? 0;
	ctx.save();
	ctx.translate(W / 2, H / 2);
	if (r) ctx.rotate(r);
	ctx.scale(s, s);
	ctx.translate(-cam.x, -cam.y);
	fn(s);
	ctx.restore();
};

// Desenfoque de profundidad de campo (px de pantalla) para un plano z con el foco en focusZ
export const dof = (cam: Cam, z: number, focusZ: number, aperture = 26) => {
	const a = 1 / Math.max(1, z - cam.z);
	const b = 1 / Math.max(1, focusZ - cam.z);
	return Math.min(28, Math.abs(a - b) * REF * aperture * 0.06);
};

// Mezcla con la niebla según la distancia (0 cerca, 1 lejos)
export const fogAmount = (cam: Cam, z: number, near: number, far: number) => clamp((z - cam.z - near) / (far - near));

// ---------- Movimiento de cámara ----------
// Cámara en mano: ruido suave de baja frecuencia + temblor fino (amplitudes en px / rad)
export const handheld = (t: number, amp = 1, seed = 1) => ({
	x: (noise2D('hhx' + seed, t * 0.45, 0) * 14 + noise2D('hhx2' + seed, t * 2.1, 0) * 2.2) * amp,
	y: (noise2D('hhy' + seed, 0, t * 0.4) * 10 + noise2D('hhy2' + seed, 0, t * 2.3) * 1.8) * amp,
	roll: (noise2D('hhr' + seed, t * 0.33, 5) * 0.012 + noise2D('hhr2' + seed, t * 1.7, 5) * 0.002) * amp,
});

// Sacudida que decae (susto, golpe, frenazo): amplitud en px, duración en s
export const shake = (t: number, t0: number, amp: number, dur = 0.6, freq = 22, seed = 3) => {
	const u = (t - t0) / dur;
	if (u < 0 || u > 1) return {x: 0, y: 0, roll: 0};
	const k = Math.pow(1 - u, 2.2) * amp;
	return {
		x: noise2D('shx' + seed, t * freq, 0) * k,
		y: noise2D('shy' + seed, 0, t * freq) * k,
		roll: noise2D('shr' + seed, t * freq * 0.7, 2) * k * 0.0012,
	};
};

// Interpolación de cámara por claves con curva Catmull-Rom (movimiento continuo, sin quiebres)
export type Key = {t: number; cam: Cam};
const cr = (p0: number, p1: number, p2: number, p3: number, u: number) => 0.5 * (2 * p1 + (-p0 + p2) * u + (2 * p0 - 5 * p1 + 4 * p2 - p3) * u * u + (-p0 + 3 * p1 - 3 * p2 + p3) * u * u * u);
export const camPath = (keys: Key[], t: number, ease: (u: number) => number = (u) => u): Cam => {
	if (t <= keys[0].t) return {...keys[0].cam};
	const n = keys.length;
	if (t >= keys[n - 1].t) return {...keys[n - 1].cam};
	let i = 0;
	while (i < n - 2 && t > keys[i + 1].t) i++;
	const u = ease(clamp((t - keys[i].t) / (keys[i + 1].t - keys[i].t)));
	const k0 = keys[Math.max(0, i - 1)].cam;
	const k1 = keys[i].cam;
	const k2 = keys[i + 1].cam;
	const k3 = keys[Math.min(n - 1, i + 2)].cam;
	const f = (a: keyof Cam, d: number) => cr((k0[a] as number) ?? d, (k1[a] as number) ?? d, (k2[a] as number) ?? d, (k3[a] as number) ?? d, u);
	return {x: f('x', 0), y: f('y', 0), z: f('z', 0), roll: f('roll', 0), zoom: f('zoom', 1)};
};

export const addCam = (a: Cam, b: Partial<Cam>): Cam => ({x: a.x + (b.x ?? 0), y: a.y + (b.y ?? 0), z: a.z + (b.z ?? 0), roll: (a.roll ?? 0) + (b.roll ?? 0), zoom: (a.zoom ?? 1) * (b.zoom ?? 1)});
export const mixCam = (a: Cam, b: Cam, u: number): Cam => ({x: lerp(a.x, b.x, u), y: lerp(a.y, b.y, u), z: lerp(a.z, b.z, u), roll: lerp(a.roll ?? 0, b.roll ?? 0, u), zoom: lerp(a.zoom ?? 1, b.zoom ?? 1, u)});
