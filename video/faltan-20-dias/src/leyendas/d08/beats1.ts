// Día 8 · G1 (frames 0–522): B1 piedra · B2 memoria · B3 bajada al río · B4 el río.
// ESQUELETO (etapa 1): entorno, luz y cámara bloqueados; los detalles finos llegan en la etapa G1.
import {noise2D} from '@remotion/noise';
import {H, W, clamp, rgba} from '../../lib/util';
import {type Ctx} from '../kit/paint';
import type {PostOpts} from '../kit/post';
import {P, S, beamAt, beamCone, beamWarm, blink, darkMap, eyePair, fillBg, litPlane, ring, seg, smooth, spr, torch, type Beam, type V2} from './core';
import {beamFog, edgeRoot, frond} from './fx8';
import {camPt, stoneM, stonePOVAlbedo, stonePOVMoon, type PrintSet, type StoneCam} from './stone';
import {B, EV, POST_NIGHT} from './timeline';

const sec = (f: number) => f / 30;

// ---------------------------------------------------------------- piedra POV (B1 y los regresos de B6/B7)
// encuadre idéntico en las cuatro apariciones: solo cambian huellas, cámara en mano y linterna.
// Capas (lejos → cerca): suelo + piedra + huellas + agua → ojos del borde → raíz del borde → helecho → luz → cono → niebla.
export type StoneShotOpts = {prints: PrintSet; cam: StoneCam; beam: Beam; liston?: number; petals?: boolean; fern?: number; eyes?: {x: number; y: number; open: number; s?: number}; cone?: number; coneFrom?: V2; fog?: number};
// raíz oscura en el borde izquierdo (hueco de los ojos) — espacio de la escena de la piedra
const ROOT_L: V2[] = [
	[-160, 1760],
	[-160, 1330],
	[-40, 1270],
	[80, 1290],
	[190, 1370],
	[280, 1500],
	[330, 1640],
	[320, 1760],
];
const fernBend = (sw: number) => (u: number) => sw * Math.sin(Math.PI * 0.5 * u) * 1.8;
export const stoneShot = (g: Ctx, f: number, o: StoneShotOpts) => {
	const t = sec(f);
	const dark = darkMap(o.beam, 0.94);
	const light = (x: number, y: number) => beamAt(o.beam, x, y);
	fillBg(g, P.ink);
	litPlane(
		g,
		dark,
		(q) => stonePOVAlbedo(q, t, o.cam, {prints: o.prints, liston: o.liston, petals: o.petals}),
		(q) => stonePOVMoon(q, t, o.cam, light, {prints: o.prints, liston: o.liston, hot: [o.beam.x, o.beam.y], power: o.beam.power}),
	);
	// ojos en la orilla oscura: van detrás de la raíz del borde (la raíz los tapa por abajo)
	if (o.eyes && o.eyes.open > 0) {
		const [ex, ey] = camPt(o.cam, o.eyes.x, o.eyes.y);
		eyePair(g, ex, ey, o.eyes.s ?? 11, {open: o.eyes.open, alpha: 0.95, spread: 3.1, look: 0.35});
	}
	litPlane(
		g,
		dark,
		(q) => {
			q.save();
			stoneM(q, o.cam);
			edgeRoot(q, ROOT_L, {mode: 'albedo'});
			q.restore();
		},
		(q) => {
			q.save();
			stoneM(q, o.cam);
			edgeRoot(q, ROOT_L, {mode: 'rim', rimA: 0.35});
			q.restore();
		},
	);
	// helecho a la derecha: tres frondas desde el borde; la principal se mece tras el «roce»
	const sw = o.fern ?? 0;
	const fronds = (mode: 'albedo' | 'rim') => (q: Ctx) => {
		q.save();
		stoneM(q, o.cam);
		frond(q, {x: 1520, y: 1560, L: 640, ang: -2.55, curl: -0.9, flip: 1, bend: fernBend(sw * 0.4), seed: 3, col: '#2c4624', mode, rimA: 0.55, droop: 0.3});
		frond(q, {x: 1560, y: 1500, L: 760, ang: -2.25 + sw * 0.25, curl: -1.1, flip: 1, bend: fernBend(sw), seed: 5, col: '#34502a', mode, rimA: 0.7, droop: 0.5});
		frond(q, {x: 1500, y: 1620, L: 520, ang: -2.9 + sw * 0.1, curl: -0.6, flip: 1, bend: fernBend(sw * 0.5), seed: 9, col: '#29411f', mode, rimA: 0.45});
		q.restore();
	};
	litPlane(g, dark, fronds('albedo'), fronds('rim'));
	beamWarm(g, o.beam);
	const cf = o.coneFrom ?? [880, 2100];
	beamCone(g, cf[0], cf[1], o.beam, t, o.cone ?? 0.07, 3);
	beamFog(g, o.beam, t, {y0: 760, y1: 1500, a: (o.fog ?? 1) * 0.32, seed: 33, speed: 18});
};

// ---------------------------------------------------------------- B1 · cold open (0–90)
// cabeza (H) y mano/linterna (L) como resortes separados: la mano se adelanta en el látigo y se queda atrás al volver
const B1_WHIP = 430;
const b1Head = (t: number) => B1_WHIP * (spr(t - sec(EV.whip1) + 0.03, 220, 18) - spr(t - 1.95, 60, 14));
const b1Hand = (t: number) => B1_WHIP * (spr(t - sec(EV.whip1) + 0.08, 260, 20) - spr(t - 2.2, 50, 13));
const b1Cam = (t: number): StoneCam => {
	const hx = noise2D('b1x', t * 0.35, 0) * 5 + noise2D('b1x2', t * 1.1, 0) * 2;
	const hy = noise2D('b1y', 0, t * 0.35) * 5 + noise2D('b1y2', 0, t * 1.1) * 2;
	const r = noise2D('b1r', t * 0.35, 3) * 0.007;
	const h = b1Head(t);
	return {x: hx - h, y: hy, zoom: 1, roll: r - h * 0.00018};
};
export const paintB1 = (g: Ctx, f: number): PostOpts => {
	const t = sec(f);
	const cam = b1Cam(t);
	const pw = torch(f, EV.torchOn);
	const bloom = f >= EV.bloom ? seg(f, EV.bloom, B.b1[1]) : 0;
	const breath = noise2D('b1br', t * 0.25, 1) * 10;
	const beam: Beam = {x: 560 + (b1Hand(t) - b1Head(t)) * 0.9 + breath, y: 1150 + breath * 0.6, r: 590 * (1 + bloom * 0.6), squash: 0.8, power: pw * (1 + bloom * 2.2)};
	const fernSwing = ring(t - sec(EV.whip1) + 0.1, 1.6, 1.2) * 0.32;
	// ojos: anclados al suelo donde la orilla queda fuera de la luz en f71
	const ex = 150 + b1Head(sec(EV.eyes1 + 2));
	const d = f - EV.eyes1;
	const eyeK = d >= 0 && d < 7 ? clamp(d / 1.5) * blink(f, EV.eyes1 + 2) * (d < 6 ? 1 : 0) : 0;
	stoneShot(g, f, {prints: 1, cam, beam, fern: fernSwing, eyes: {x: ex, y: 1180, open: eyeK}});
	// 0.00–0.15 s: silencio digital, solo grano sobre el negro
	if (f < EV.torchOn) {
		g.fillStyle = rgba(P.ink, 0.9);
		g.fillRect(0, 0, W, H);
	}
	return {...POST_NIGHT, flash: smooth(bloom) * 0.95, bloom: POST_NIGHT.bloom! + bloom * 0.6};
};

export {paintB2} from './b2';

export {paintB3} from './b3';

export {paintB4} from './b4';

export {S};
