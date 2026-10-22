// Día 8 · B5 · LA VOZ (f522–738). Bosque de noche por planos de profundidad (15 m → 1.7 m + fronda al frente):
// búsqueda con la linterna, una silueta cruza ENTRE el tronco medio y el cercano (la luz llega tarde: solo niebla
// girando), silencio, látigo a la izquierda (rama que rebota y un par de ojos que parpadea), la luz se hunde,
// cero digital y 40 pares de ojos se abren a la vez, cada uno en su hueco de profundidad (los planos más cercanos
// los tapan), se ladean 15° y parpadean juntos.
import {noise2D} from '@remotion/noise';
import {H, W, clamp, hash, lerp, rgba} from '../../lib/util';
import {blurred, cached, fogBand, makeCanvas, type Ctx} from '../kit/paint';
import type {PostOpts} from '../kit/post';
import {P, beamAt, beamCone, beamWarm, blink, darkMap, easeInOut, eyeOpen, eyePair, fillBg, litPlane, petal, ring, seg, smooth, spr, type Beam, type V2} from './core';
import {branch, canopy, fernClump, ground, platLeaf, treeFern, trunk} from './barranca';
import {chanequeSil} from './chaneque';
import {beamFog} from './fx8';
import {B, EV, POST_NIGHT} from './timeline';

const sec = (f: number) => f / 30;

// ---------------------------------------------------------------- planos anchos (la cabeza gira hasta 30°)
export type XPlane = {key: string; z: number; rf: number; blur?: number; ml?: number; mr?: number; mt?: number; mb?: number; draw: (g: Ctx) => void};
// giro de cabeza = traslación (x, y) + alabeo; zoom/k escalan alrededor del pivote (ox, oy)
export type XView = {x: number; y: number; roll: number; zoom: number; ox?: number; oy?: number};
const mg = (pl: XPlane) => ({ml: pl.ml ?? 900, mr: pl.mr ?? 330, mt: pl.mt ?? 300, mb: pl.mb ?? 560});
export const xSprite = (pl: XPlane) =>
	cached(`d8xp:${pl.key}`, () => {
		const m = mg(pl);
		const c = makeCanvas((W + m.ml + m.mr) * pl.rf, (H + m.mt + m.mb) * pl.rf);
		const g = c.getContext('2d')!;
		g.scale(pl.rf, pl.rf);
		g.translate(m.ml, m.mt);
		pl.draw(g);
		if (!pl.blur) return {c, pad: 0};
		const b = blurred(c, pl.blur * pl.rf, `d8xp:${pl.key}`);
		return {c: b.canvas, pad: b.pad};
	});
export const xXf = (g: Ctx, v: XView, k = 1) => {
	const ox = v.ox ?? W / 2;
	const oy = v.oy ?? H / 2;
	g.translate(ox + v.x, oy + v.y);
	if (v.roll) g.rotate(v.roll);
	g.scale(v.zoom * k, v.zoom * k);
	g.translate(-ox, -oy);
};
export const xPt = (v: XView, x: number, y: number, k = 1): V2 => {
	const ox = v.ox ?? W / 2;
	const oy = v.oy ?? H / 2;
	let px = (x - ox) * v.zoom * k;
	let py = (y - oy) * v.zoom * k;
	if (v.roll) {
		const c = Math.cos(v.roll);
		const s = Math.sin(v.roll);
		[px, py] = [px * c - py * s, px * s + py * c];
	}
	return [ox + v.x + px, oy + v.y + py];
};
export const xDraw = (g: Ctx, pl: XPlane, v: XView, k = 1, dyn?: (q: Ctx) => void, alpha = 1) => {
	const sp = xSprite(pl);
	const m = mg(pl);
	g.save();
	xXf(g, v, k);
	g.globalAlpha = alpha;
	g.drawImage(sp.c, -m.ml - sp.pad / pl.rf, -m.mt - sp.pad / pl.rf, sp.c.width / pl.rf, sp.c.height / pl.rf);
	g.globalAlpha = 1;
	if (dyn) dyn(g);
	g.restore();
};

// perspectiva: horizonte, px por metro a la profundidad z (mm), línea de suelo (ojo a 1.5 m)
export const HZ = 900;
export const pxm = (z: number) => 1100000 / z;
export const gyAt = (z: number) => HZ + 1.5 * pxm(z);

// ---------------------------------------------------------------- bosque de la voz
export const B5Z = [15000, 11000, 8000, 5500, 3200, 1700];
const FOGK = [0.8, 0.68, 0.54, 0.4, 0.22, 0.06];
const RFK = [0.55, 0.6, 0.7, 0.8, 0.95, 1];
type TS = {x: number; w: number};
const B5T: TS[][] = B5Z.map((z, i) => {
	if (i === 4)
		return [
			{x: -780, w: 170},
			{x: -470, w: 230},
			{x: 330, w: 190}, // de detrás de este sale la silueta
			{x: 960, w: 260},
			{x: 1330, w: 200},
		];
	if (i === 5)
		return [
			{x: -860, w: 440},
			{x: -120, w: 320}, // detrás de este se esconde
			{x: 1290, w: 480},
		];
	const n = [16, 12, 9, 7][i];
	return Array.from({length: n}, (_, k) => ({x: -880 + (k + 0.15 + hash(k, 610 + i) * 0.7) * (2300 / n), w: pxm(z) * (0.45 + hash(k, 620 + i) * 0.75)}));
});
const b5Plane = (i: number): XPlane => ({
	key: 'b5p' + i,
	z: B5Z[i],
	rf: RFK[i],
	draw: (g) => {
		const z = B5Z[i];
		const fog = FOGK[i];
		const gy = gyAt(z);
		const s = pxm(z);
		if (i >= 1) canopy(g, 40 + i * 24, fog, 700 + i, -900, W + 330, 0.55 + i * 0.08);
		B5T[i].forEach((t, k) =>
			trunk(g, {x: t.x, gy: gy + 8, w: t.w, h: gy + 420, seed: 640 + i * 20 + k, kind: (k + i) % 3 ? 'ceiba' : 'amate', fog, rim: 0.5 + 0.1 * (5 - i) / 5, lean: (hash(k, 660 + i) - 0.5) * 0.05}),
		);
		ground(g, gy, fog, 680 + i, {x0: -900, x1: W + 330, bottom: H + 560, amp: 16 + s * 0.05});
		const nf = [0, 5, 6, 6, 6, 3][i];
		for (let k = 0; k < nf; k++) fernClump(g, -860 + hash(k, 690 + i) * 2250, gy + 4 + hash(k, 695 + i) * s * 0.15, s * (0.45 + hash(k, 698 + i) * 0.45), 700 + i * 10 + k, fog, 5, 0.45);
		if (i === 4) {
			treeFern(g, 1180, gy + 6, 560, 1.0, 731, fog);
			// el final del rastro de pétalos (donde apunta la linterna)
			for (let k = 0; k < 4; k++) petal(g, 600 - k * 46 + hash(k, 733) * 20, gy + 40 + k * 12 + hash(k, 734) * 10, hash(k, 735) * 6, 15 - k * 1.5, k % 2 ? P.gold : P.cempa);
		}
		if (i === 3) for (let k = 0; k < 3; k++) petal(g, 470 - k * 30, gy + 10 + k * 4, hash(k, 736) * 6, 9 - k, P.cempa);
	},
});
export const B5P = B5Z.map((_, i) => b5Plane(i));
// fronda cercanísima (abajo, desenfocada): tapa a medias el par de ojos más cercano
const B5FG: XPlane = {
	key: 'b5fg',
	z: 1100,
	rf: 0.5,
	blur: 8,
	draw: (g) => {
		fernClump(g, 380, 2060, 470, 801, 0, 7, 0.4);
		fernClump(g, -420, 2080, 520, 802, 0, 7, 0.4);
		fernClump(g, 1160, 2080, 460, 804, 0, 6, 0.4);
		platLeaf(g, W + 260, 1620, 640, 100, -2.6, -0.7, 803, '#101a14', 0.3);
	},
};

// ---------------------------------------------------------------- ojos por hueco de profundidad
type ES = {i: number; x: number; y: number; s: number; tilt0: number; a: number};
const PER = [9, 9, 8, 7, 4, 2]; // hueco i = entre el plano i y el i+1 (más cerca = menos)
export const B5_EYES = () =>
	cached('d8b5eyes3', () => {
		const out: ES[] = [];
		PER.forEach((n, i) => {
			const z = B5Z[i] * 0.88;
			const front = B5T[i + 1] ?? [];
			for (let k = 0; k < n; k++) {
				const h = (q: number) => hash(k, 900 + i * 13 + q);
				const s = clamp(64000 / z, 6, 34);
				let x = lerp(-560, 500, (k + 0.2 + h(1) * 0.6) / n);
				// asomados al borde de un tronco más cercano (ese tronco tapa parte del par)
				const near = front.filter((t) => Math.abs(t.x - x) < 260);
				if (near.length && h(2) < 0.65) {
					const t = near[0];
					const sd = h(3) < 0.5 ? -1 : 1;
					x = t.x + sd * (t.w * 0.62 + s * 1.5);
				}
				const y = gyAt(z) - 0.45 * pxm(z) + (h(4) - 0.5) * 0.35 * pxm(z);
				out.push({i, x, y, s, tilt0: (h(5) - 0.5) * 0.28, a: lerp(0.85, 1, 1 - i / 5)});
			}
		});
		return out;
	});
// el más cercano (1 m, abajo a la derecha, detrás de la fronda)
const NEAREST: ES = {i: 6, x: 300, y: 1650, s: 40, tilt0: -0.08, a: 1};

// ---------------------------------------------------------------- cámara y linterna
const DART_Z = 2500;
const dartX = (f: number) => lerp(250, 10, easeInOut(seg(f, EV.dart0, EV.dart1)));
export const b5View = (f: number): XView => {
	const t = sec(f);
	const lt = t - sec(B.b5[0]);
	// búsqueda 0.4 Hz ±10° (≈ ±176 px) desde 549; en 576 la cabeza salta tarde hacia donde pasó la silueta y luego
	// vuelve despacio al centro (588–606); 606–660 quietud total
	const sIn = smooth(seg(f, EV.search0, EV.search0 + 10));
	const search = f < EV.dart1 + 1 ? Math.sin((t - sec(EV.search0)) * 0.4 * Math.PI * 2) * 176 * sIn : 0;
	const s576 = Math.sin((sec(EV.dart1 + 1) - sec(EV.search0)) * 0.4 * Math.PI * 2) * 176;
	const late = f > EV.dart1 ? lerp(s576, s576 + 150, clamp(spr(t - sec(EV.dart1 + 1), 260, 20), 0, 1.2)) * (1 - easeInOut(seg(f, EV.search1, EV.still0))) : 0;
	const whip = 577 * spr(t - sec(EV.whipL), 220, 18);
	const sink = -213 * easeInOut(seg(f, EV.sink0, EV.sink1));
	const trem = f >= EV.zero ? noise2D('b5tr', t * 8, 0) * 2.2 : 0;
	const still = f >= EV.still0 && f < EV.whipL ? 0.25 : 1;
	return {
		x: search + late + whip + (noise2D('b5h', lt * 0.3, 0) * 7 + noise2D('b5h2', lt * 1.1, 0) * 2) * still + trem,
		y: 60 + sink + (noise2D('b5v', 0, lt * 0.3) * 5 + noise2D('b5v2', 0, lt * 1.1) * 1.5) * still + noise2D('b5tv', t * 8, 3) * (f >= EV.zero ? 1.6 : 0),
		roll: noise2D('b5r', lt * 0.3, 1) * 0.005 * still,
		zoom: 1 + 0.04 * easeInOut(seg(f, EV.erupt, B.b5[1])),
	};
};
export const b5Beam = (f: number): Beam => {
	const t = sec(f);
	const fear = f >= EV.still0 ? (f >= EV.zero ? 16 : 11) : 5;
	const sinkY = 70 * easeInOut(seg(f, EV.sink0, EV.sink1));
	return {
		x: 540 + noise2D('b5aim', t * 8, 2) * fear + noise2D('b5aim2', t * 0.7, 0) * 14,
		y: 1150 + sinkY + noise2D('b5aimy', t * 8, 5) * fear * 0.7,
		r: 470,
		squash: 0.85,
		power: 0.93 + 0.07 * noise2D('b5fl', t * 6, 0),
	};
};

// remolino de niebla inyectado a lo largo del camino de la silueta (decae en 1.5 s)
const vortex = (g: Ctx, v: XView, f: number, beam: Beam) => {
	if (f < EV.dart0 + 2) return;
	const age = sec(f - EV.dart0 - 2);
	const dec = Math.exp(-age / 1.5);
	if (dec < 0.03) return;
	const k = 1;
	g.save();
	g.globalCompositeOperation = 'screen';
	for (let j = 0; j < 16; j++) {
		const u = j / 15;
		const px = lerp(250, 10, u);
		const py = gyAt(DART_Z) - 0.25 * pxm(DART_Z) - Math.sin(u * Math.PI) * 30;
		const delay = clamp(age - (1 - u) * 0.27);
		if (delay <= 0) continue;
		const a = j * 0.9 + delay * (2.6 - u) * 2.2;
		const rr = (18 + 70 * Math.sqrt(delay)) * (0.7 + hash(j, 951) * 0.6);
		const [sx, sy] = xPt(v, px + Math.cos(a) * rr, py + Math.sin(a) * rr * 0.55, k);
		const lit = 0.25 + 0.75 * beamAt(beam, sx, sy);
		const R = 60 + 90 * Math.sqrt(delay);
		const gr = g.createRadialGradient(sx, sy, 0, sx, sy, R);
		gr.addColorStop(0, rgba('#d9dccd', 0.13 * dec * lit));
		gr.addColorStop(1, rgba('#d9dccd', 0));
		g.fillStyle = gr;
		g.fillRect(sx - R, sy - R, 2 * R, 2 * R);
	}
	g.restore();
};

// silueta que cruza (8 frames) con 3 subcuadros de desenfoque de movimiento
const dart = (g: Ctx, v: XView, f: number) => {
	if (f < EV.dart0 || f > EV.dart1 + 1) return;
	const sc = (0.56 * pxm(DART_Z)) / 300;
	for (let j = 2; j >= 0; j--) {
		const ff = f - j * 0.4;
		const u = seg(ff, EV.dart0, EV.dart1);
		const ph = u * Math.PI * 7;
		const [sx, sy] = xPt(v, dartX(ff), gyAt(DART_Z) - Math.abs(Math.sin(ph)) * 14);
		g.save();
		g.globalAlpha = j === 0 ? 1 : 0.32;
		g.translate(sx, sy);
		g.scale(sc * v.zoom, sc * v.zoom);
		chanequeSil(
			g,
			{crouch: 0.5, lean: -0.45, stride: ph, strideAmp: 44, armL: 0.9 * Math.sin(ph), armR: -0.9 * Math.sin(ph), headTilt: -0.12, fringe: (i) => 0.55 + 0.25 * Math.sin(ph * 2 + i)},
			{fill: '#090706', rim: '#9FC3C4', rimA: 0.45, rimSide: 1},
		);
		g.restore();
	}
};

const branchHit = EV.whipL - 8;
const lowBranch = (q: Ctx, f: number) => {
	const b = ring(sec(f - branchHit), 2.2, 0.55) * 46;
	const pts: V2[] = [];
	for (let k = 0; k <= 6; k++) {
		const u = k / 6;
		pts.push([lerp(-640, -130, u), lerp(830, 905, u) + b * u * u - Math.sin(u * Math.PI) * 24]);
	}
	for (let k = 0; k < 6; k++) branch(q, pts[k][0], pts[k][1], pts[k + 1][0], pts[k + 1][1], 22 - k * 3, 0.06, 777 + k);
	for (let k = 1; k <= 6; k++) {
		const [x, y] = pts[k];
		platLeaf(q, x, y, 120 - k * 6, 30, 1.2 + hash(k, 781) * 0.9 + b * 0.004, 0.4, 782 + k, '#111b15', 0.35);
	}
};

// ---------------------------------------------------------------- B5
export const paintB5 = (g: Ctx, f: number): PostOpts => {
	const t = sec(f);
	const v = b5View(f);
	const beam = b5Beam(f);
	fillBg(g, '#04090a');
	const dFar = darkMap(beam, 0.56, '#081517', 7);
	const dNear = darkMap(beam, 0.8, '#050d0f', 10);
	const eyes = B5_EYES();
	const open = eyeOpen(f + 1, EV.erupt);
	const tiltAll = 0.26 * clamp(spr(t - sec(EV.tiltAll), 900, 30), 0, 1.3);
	const blinkAll = blink(f, EV.blinkAll);
	const drawEyes = (i: number) => {
		if (open <= 0) return;
		for (const e of i === 6 ? [NEAREST] : eyes) {
			if (e.i !== i) continue;
			const [x, y] = xPt(v, e.x, e.y);
			if (x < -80 || x > W + 80 || y < -80 || y > H + 80) continue;
			const o = open * blinkAll;
			// cerrados del todo no dejan rendija encendida
			eyePair(g, x, y, e.s * v.zoom, {open: o, tilt: e.tilt0 + tiltAll, alpha: e.a * smooth(clamp(o / 0.3)), look: (540 - x) / 900});
		}
	};
	// cielo casi negro con brillo de luna difuso en la niebla alta
	const sky = g.createLinearGradient(0, v.y, 0, v.y + 1300);
	sky.addColorStop(0, '#030707');
	sky.addColorStop(1, '#0f2124');
	g.fillStyle = sky;
	g.fillRect(0, 0, W, H);
	for (let i = 0; i < 6; i++) {
		const pl = B5P[i];
		litPlane(g, i < 3 ? dFar : dNear, (q) => xDraw(q, pl, v, 1, i === 5 ? (qq) => lowBranch(qq, f) : undefined));
		// niebla entre planos (pegada al suelo de ese plano)
		const gy = xPt(v, 540, gyAt(B5Z[i]))[1];
		if (i < 5) fogBand(g, {y0: gy - 260 + i * 30, y1: gy + 90 + i * 40, color: '#35504f', t, seed: 41 + i, alpha: [0.42, 0.34, 0.28, 0.2, 0.14][i], speed: 8 + i * 4, scale: 1.4});
		drawEyes(i);
		// un solo par, hondo, detrás de la rama (660–666)
		if (i === 2 && f >= EV.whipL && f < EV.whipL + 7) {
			const [x, y] = xPt(v, -250, gyAt(7000) - 0.45 * pxm(7000));
			eyePair(g, x, y, 12 * v.zoom, {open: blink(f, EV.whipL + 1) * clamp((f - EV.whipL + 1) / 2), alpha: 0.95});
		}
		if (i === 4) {
			// niebla baja tocada por la linterna: fondo claro para que la silueta se lea a contraluz
			beamFog(g, beam, t, {y0: gy - 330, y1: gy + 200, a: 0.42, seed: 57, speed: 12});
			vortex(g, v, f, beam);
			dart(g, v, f);
		}
		if (i === 3) beamFog(g, beam, t, {y0: gy - 420, y1: gy + 60, a: 0.22, seed: 51, speed: 10});
	}
	drawEyes(6);
	litPlane(g, dNear, (q) => xDraw(q, B5FG, v));
	beamWarm(g, beam);
	beamCone(g, 780, 2080, beam, t, 0.075, 5);
	fogBand(g, {y0: 1240, y1: 1920, color: '#1d3033', t, seed: 27, alpha: 0.16, speed: 14});
	// cero digital (712–720): todo se queda inmóvil y un poco más oscuro
	if (f >= EV.zero && f < EV.erupt) {
		g.fillStyle = rgba(P.ink, 0.18);
		g.fillRect(0, 0, W, H);
	}
	return {...POST_NIGHT, bloom: open > 0 ? 0.7 : 0.5, ca: f === EV.erupt ? 4 : POST_NIGHT.ca};
};
