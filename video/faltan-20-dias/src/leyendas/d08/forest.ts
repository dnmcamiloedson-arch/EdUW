// Día 8 · bosque de barranca por planos de profundidad (B3, B4 orilla, B5, B6). Mundo en mm: z = 1000 → 1 mm = 1 px.
// El suelo está en y = +EYE_H (ojo a 1.5 m). Paneo/inclinación de cabeza = traslación de pantalla (sin paralaje);
// caminar/correr = cam.x / cam.z (con paralaje). Cada plano se pinta solo, se oscurece con el mapa de la linterna
// y se compone lejos → cerca, así lo de adelante siempre tapa a lo de atrás (ojos incluidos, ver `after`).
import {H, W, hash, rgba} from '../../lib/util';
import {cached, fogBand, type Ctx} from '../kit/paint';
import {onPlane, type Cam} from '../kit/stage';
import {drawSprite, fern, trunk} from './flora';
import {P, litPlane} from './core';

export const EYE_H = 1500;

export type View = {yaw: number; pitch: number; roll: number}; // px, px, rad (cabeza)
export const VIEW0: View = {yaw: 0, pitch: 0, roll: 0};

export type Tree = {x: number; w: number; seed: number; kind: 'amate' | 'ceiba'; flip: 1 | -1};
export type Frond = {x: number; s: number; seed: number; flip: 1 | -1; rot: number};
export type FPlane = {z: number; trees: Tree[]; ferns: Frond[]};

// aplica cabeza (pantalla) + plano z (mundo) y llama fn con la escala del plano
export const planeXf = (q: Ctx, cam: Cam, view: View, z: number, fn: (s: number) => void) => {
	q.save();
	q.translate(W / 2 + view.yaw, H / 2 + view.pitch);
	if (view.roll) q.rotate(view.roll);
	q.translate(-W / 2, -H / 2);
	onPlane(q, cam, z, fn);
	q.restore();
};
// punto del mundo → pantalla con la cabeza aplicada
export const viewPt = (cam: Cam, view: View, x: number, y: number, z: number): [number, number, number] => {
	const s = 1000 * (cam.zoom ?? 1) / Math.max(1, z - cam.z);
	let px = (x - cam.x) * s;
	let py = (y - cam.y) * s;
	const r = view.roll + (cam.roll ?? 0);
	if (r) {
		const c = Math.cos(r);
		const sn = Math.sin(r);
		[px, py] = [px * c - py * sn, px * sn + py * c];
	}
	return [W / 2 + view.yaw + px, H / 2 + view.pitch + py, s];
};

// distribución determinista de troncos y helechos por plano (≈10 troncos por plano, cubre ±1.4·z de ancho)
export const forestLayout = (key: string, seed: number, zs: number[], o: {span?: number; gap?: number; ferns?: number} = {}) =>
	cached(`d8forest:${key}`, () => {
		const span = o.span ?? 1.45;
		const gap = o.gap ?? 0.27;
		return zs.map((z, i): FPlane => {
			const half = span * z + 1500;
			const trees: Tree[] = [];
			let x = -half + hash(i, seed) * gap * z;
			let k = 0;
			while (x < half) {
				const w = (0.11 + hash(k, seed + i * 7 + 1) * 0.12) * Math.min(z, 6000) * 0.55 + 260;
				trees.push({x, w, seed: seed * 31 + i * 17 + k, kind: hash(k, seed + i + 3) > 0.6 ? 'ceiba' : 'amate', flip: hash(k, seed + i + 4) > 0.5 ? 1 : -1});
				x += gap * z * (0.7 + hash(k, seed + i * 7 + 2) * 0.9) + w;
				k++;
			}
			const ferns: Frond[] = [];
			const nf = o.ferns ?? 9;
			for (let j = 0; j < nf; j++) {
				ferns.push({x: (hash(j, seed + i * 11 + 5) * 2 - 1) * half, s: 0.7 + hash(j, seed + i * 11 + 6) * 0.7, seed: (seed + i * 5 + j) % 7, flip: hash(j, seed + i + 8) > 0.5 ? 1 : -1, rot: (hash(j, seed + i + 9) - 0.5) * 0.5});
			}
			return {z, trees, ferns};
		});
	});

// colores por profundidad: lo lejano se funde con la niebla de luna
const fogFor = (z: number, near: number, far: number) => Math.max(0, Math.min(1, (z - near) / (far - near)));

export type ForestOpts = {
	cam: Cam;
	view: View;
	t: number;
	layout: FPlane[];
	dark: HTMLCanvasElement | null;
	fogColor?: string;
	fogNear?: number;
	fogFar?: number;
	moon?: number; // fuerza del borde de luna
	sway?: (i: number, j: number) => number; // rotación extra de helecho (resortes)
	after?: (i: number, z: number) => void; // se llama después de componer el plano i (ojos, siluetas de ese hueco)
	ground?: string;
	fogBands?: number; // alfa de las bandas de niebla entre planos
};

export const forestScene = (g: Ctx, o: ForestOpts) => {
	const {cam, view, t, layout, dark, fogColor = '#22403f', fogNear = 1500, fogFar = 16000, moon = 1, sway, after, ground = '#1a140c', fogBands = 0.35} = o;
	const sorted = layout.map((p, i) => ({p, i})).sort((a, b) => b.p.z - a.p.z);
	for (const {p, i} of sorted) {
		if (p.z <= cam.z + 200) continue;
		const fk = fogFor(p.z - cam.z, fogNear, fogFar);
		litPlane(
			g,
			dark,
			(q) => {
				planeXf(q, cam, view, p.z, (s) => {
					// suelo del plano: franja de hojarasca hasta abajo del cuadro
					const gy = EYE_H;
					const half = 1.6 * (p.z - cam.z) + 4000;
					const gr = q.createLinearGradient(0, gy - 80, 0, gy + 1200);
					gr.addColorStop(0, rgba(ground, 0));
					gr.addColorStop(0.08, ground);
					gr.addColorStop(1, '#0d0a06');
					q.fillStyle = gr;
					q.fillRect(cam.x - half, gy - 80, half * 2, 1200 + (p.z - cam.z) * 0.8);
					for (const tr of p.trees) {
						const sp = trunk(tr.seed % 3, 160, 2400, tr.kind);
						drawSprite(q, sp.albedo, tr.x, gy + 40, tr.w / 160, 0, tr.flip);
					}
					for (let j = 0; j < p.ferns.length; j++) {
						const fr = p.ferns[j];
						const sp = fern(fr.seed, 520, j % 2 ? '#3d5a2c' : '#33502a', 0.6);
						drawSprite(q, sp.albedo, fr.x, gy + 30, fr.s * (0.6 + p.z / 9000), fr.rot + (sway ? sway(i, j) : 0), fr.flip);
					}
					void s;
				});
				if (fk > 0.01) {
					q.globalCompositeOperation = 'source-atop';
					q.fillStyle = rgba(fogColor, fk * 0.85);
					q.fillRect(0, 0, W, H);
					q.globalCompositeOperation = 'source-over';
				}
			},
			moon > 0
				? (q) => {
						planeXf(q, cam, view, p.z, () => {
							q.globalAlpha = moon * (1 - fk * 0.8);
							for (const tr of p.trees) {
								const sp = trunk(tr.seed % 3, 160, 2400, tr.kind);
								drawSprite(q, sp.rim, tr.x, EYE_H + 40, tr.w / 160, 0, tr.flip);
							}
							q.globalAlpha = 1;
						});
					}
				: undefined,
		);
		if (fogBands > 0) {
			const [, sy] = (() => {
				const s = 1000 / Math.max(1, p.z - cam.z);
				return [0, H / 2 + view.pitch + (EYE_H - cam.y) * s];
			})();
			fogBand(g, {y0: sy - 260, y1: sy + 120, color: P.moon, t: t + i * 3.1, seed: 40 + i, alpha: fogBands * (0.5 + 0.5 * (1 - fk)), speed: 10 + i * 3});
		}
		if (after) after(i, p.z);
	}
};
