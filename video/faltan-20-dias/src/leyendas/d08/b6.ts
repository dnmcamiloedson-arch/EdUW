// Día 8 · B6 · CORRÍ (f738–849). Carrera POV por un corredor de planos que avanzan (se reciclan al fondo), con
// desenfoque de subcuadros en los planos cercanos, hojas que azotan el lente, lodo en cada pisada, ojos que corren
// al borde del cuadro y tres siluetas agachadas corriendo en paralelo entre los troncos (783–792). Cortes por
// coincidencia a la MISMA piedra de B1: 15 huellas (765), 40 (792) y cientos en anillos (819), la última se aquieta.
import {noise2D} from '@remotion/noise';
import {H, W, clamp, hash, lerp, rgba} from '../../lib/util';
import {fogBand, type Ctx} from '../kit/paint';
import type {PostOpts} from '../kit/post';
import {beamCone, beamWarm, darkMap, eyePair, fillBg, litPlane, seg, smooth, type Beam} from './core';
import {fernClump, ground, platLeaf, trunk} from './barranca';
import {chanequeSil} from './chaneque';
import {stoneShot} from './beats1';
import {B5P, HZ, pxm, xDraw, xPt, type XPlane, type XView} from './b5';
import {B, EV, POST_NIGHT} from './timeline';

const sec = (f: number) => f / 30;

// ---------------------------------------------------------------- planos del corredor (diseñados a 4 m)
const ZR = 4000;
const GYR = HZ + 1.5 * pxm(ZR);
const NP = 5;
const SPAN = 10000;
const ZNEAR = 900;
const SPEED = 170; // mm por frame (≈5 m/s)
const runPlane = (i: number): XPlane => ({
	key: 'b6r' + i,
	z: ZR,
	rf: 0.62,
	ml: 1000,
	mr: 1000,
	mt: 1500,
	mb: 320,
	draw: (g) => {
		const s = pxm(ZR);
		const xs: number[] = [];
		const nL = 2 + Math.floor(hash(i, 1101) * 2);
		const nR = 2 + Math.floor(hash(i, 1102) * 2);
		for (let k = 0; k < nL; k++) xs.push(lerp(-900, 260, (k + 0.2 + hash(k, 1103 + i) * 0.6) / nL));
		for (let k = 0; k < nR; k++) xs.push(lerp(820, 1980, (k + 0.2 + hash(k, 1104 + i) * 0.6) / nR));
		ground(g, GYR, 0, 1110 + i, {x0: -1000, x1: W + 1000, bottom: GYR + 300, amp: 14});
		xs.forEach((x, k) => trunk(g, {x, gy: GYR + 6, w: s * (0.45 + hash(k, 1105 + i) * 0.6), h: GYR + 1560, seed: 1120 + i * 10 + k, kind: (k + i) % 2 ? 'ceiba' : 'amate', fog: 0.04, rim: 0.6, lean: (hash(k, 1106 + i) - 0.5) * 0.06}));
		for (let k = 0; k < 4; k++) {
			const sd = k % 2 ? 1 : -1;
			fernClump(g, sd < 0 ? lerp(-700, 300, hash(k, 1107 + i)) : lerp(780, 1800, hash(k, 1107 + i)), GYR + 10 + hash(k, 1108 + i) * 30, s * (0.5 + hash(k, 1109 + i) * 0.5), 1130 + i * 10 + k, 0, 6, 0.5);
		}
		platLeaf(g, hash(i, 1111) < 0.5 ? 240 : 840, GYR + 20, s * 1.6, s * 0.28, hash(i, 1111) < 0.5 ? -1.1 : -2.05, hash(i, 1111) < 0.5 ? 0.6 : -0.6, 1112 + i, '#15231a', 0.5);
	},
});
const RUNP = Array.from({length: NP}, (_, i) => runPlane(i));

const runView = (f: number): XView => {
	const t = sec(f);
	const ph = t * 3 * Math.PI;
	return {
		x: noise2D('b6y', t * 0.9, 0) * 34 + Math.sin(ph * 0.5) * 10,
		y: -Math.abs(Math.sin(ph)) * 18 + 9 + noise2D('b6v', 0, t * 2) * 6,
		roll: Math.sin(ph) * 0.035 + noise2D('b6r', t * 1.5, 1) * 0.008,
		zoom: 1,
		ox: 540,
		oy: HZ,
	};
};
const runBeam = (f: number): Beam => {
	const t = sec(f);
	const ph = t * 3 * Math.PI;
	return {x: 540 + noise2D('b6bx', t * 2.5, 0) * 110, y: 1180 + Math.abs(Math.sin(ph)) * 40 + noise2D('b6by', 0, t * 2.5) * 70, r: 450, squash: 0.85, power: 0.93 + 0.07 * noise2D('b6fl', t * 5, 0)};
};

// hojas de platanillo que azotan el lente
const SLAPS: [number, number, number][] = [
	[744, -1, 900],
	[756, 1, 1250],
	[779, -1, 1100],
	[806, 1, 800],
	[813, -1, 1350],
];
const slaps = (g: Ctx, f: number) => {
	for (const [f0, sd, y0] of SLAPS) {
		const d = f - f0;
		if (d < 0 || d > 6) continue;
		for (let j = 3; j >= 0; j--) {
			const u = clamp((d - j * 0.35) / 6);
			const ang = sd < 0 ? lerp(-1.4, 0.35, u) : lerp(Math.PI + 1.4, Math.PI - 0.35, u);
			g.save();
			g.globalAlpha = j === 0 ? 0.95 : 0.3;
			platLeaf(g, sd < 0 ? -140 : W + 140, y0 + u * 260, 1250, 240, ang, sd * 0.5, 1150 + f0, '#070c09', 0.2);
			g.restore();
		}
	}
};
// lodo en cada pisada (3 Hz, cae con gravedad)
const mud = (g: Ctx, f: number) => {
	const step = Math.floor(f / 10) * 10;
	for (let s = step - 10; s <= step; s += 10) {
		const age = (f - s) / 30;
		if (age < 0 || age > 0.5) continue;
		const sd = (s / 10) % 2 ? 1 : -1;
		for (let i = 0; i < 16; i++) {
			const h = (q: number) => hash(i + s * 7, 1200 + q);
			const vx = sd * (200 + h(1) * 700) * (h(2) < 0.2 ? -0.5 : 1);
			const vy = -(700 + h(3) * 900);
			const x = 540 + sd * (120 + h(4) * 220) + vx * age;
			const y = 2000 + vy * age + 2600 * age * age;
			if (y > H + 20) continue;
			const r = 3 + h(5) * 8;
			g.fillStyle = rgba(h(6) < 0.5 ? '#2a1a0e' : '#4a2f18', 0.9);
			g.beginPath();
			g.ellipse(x, y, r, r * (1.3 + h(7)), Math.atan2(vy + 5200 * age, vx), 0, Math.PI * 2);
			g.fill();
		}
	}
};
// pares de ojos al borde del cuadro, a la par de la carrera (con estela)
const EDGE: [number, number, number][] = [
	[80, 1060, 11],
	[1000, 980, 9],
	[1012, 1330, 13],
	[60, 1420, 10],
];
const edgeEyes = (g: Ctx, f: number, v: XView, v1: XView) => {
	EDGE.forEach(([x, y, s], k) => {
		const on = noise2D('b6eon', f * 0.07, k * 3) > -0.15;
		if (!on) return;
		const jx = noise2D('b6ex', f * 0.05, k) * 40;
		const [ax, ay] = xPt(v, x + jx, y);
		const [bx, by] = xPt(v1, x + jx, y);
		for (let j = 4; j >= 0; j--) {
			const u = j / 4;
			eyePair(g, lerp(ax, bx, u) + (k % 2 ? 1 : -1) * u * 24, lerp(ay, by, u), s, {open: 1, alpha: j === 0 ? 0.9 : 0.22, glow: 0.8});
		}
	});
};
// tres siluetas agachadas corriendo en paralelo (783–792)
const runners = (g: Ctx, f: number, v: XView) => {
	const z = 3400;
	const k = ZR / z;
	const sc = (0.55 * pxm(z)) / 300;
	const t = sec(f);
	for (let i = 0; i < 3; i++) {
		const ph = (t * 2.5 + i * 0.37) * Math.PI * 2;
		const xr = 60 + i * 170 + (f - EV.parallel) * 3;
		const [sx, sy] = xPt(v, xr, GYR - Math.abs(Math.sin(ph)) * 22, k);
		g.save();
		g.translate(sx, sy);
		g.scale(sc, sc);
		const eye = chanequeSil(
			g,
			{crouch: 0.65, lean: 0.4, stride: ph, strideAmp: 40, armL: 0.8 * Math.sin(ph), armR: -0.8 * Math.sin(ph), headTilt: 0.1 * Math.sin(ph * 0.5), fringe: (j) => -0.3 + 0.45 * Math.sin(ph * 2 + j * 0.4)},
			{fill: '#070605', rim: '#9FC3C4', rimA: 0.5, rimSide: -1},
		);
		eyePair(g, eye[0] + 6, eye[1] + 4, 4.2, {open: 1, alpha: 0.9, glow: 0.7});
		g.restore();
	}
};

const runShot = (g: Ctx, f: number) => {
	const t = sec(f);
	const v = runView(f);
	const v1 = runView(f - 1);
	const beam = runBeam(f);
	const camZ = (f - B.b6[0]) * SPEED;
	fillBg(g, '#040809');
	const dark = darkMap(beam, 0.86, '#050d0f', 7);
	const dFar = darkMap(beam, 0.56, '#081517', 10);
	const sky = g.createLinearGradient(0, v.y, 0, v.y + 1300);
	sky.addColorStop(0, '#030707');
	sky.addColorStop(1, '#10232a');
	g.fillStyle = sky;
	g.fillRect(0, 0, W, H);
	// fondo lejano: los dos planos de niebla del bosque de la voz (sin paralaje a 11–15 m)
	for (let i = 0; i < 2; i++) litPlane(g, dFar, (q) => xDraw(q, B5P[i], {...v, ox: 540, oy: HZ}));
	// perspectiva aérea: lo lejano es niebla (los planos del corredor se funden con ella al alejarse)
	g.fillStyle = rgba('#2c4447', 0.62);
	g.fillRect(0, 0, W, H);
	fogBand(g, {y0: 820 + v.y, y1: 1200 + v.y, color: '#35504f', t, seed: 61, alpha: 0.4, speed: 30});
	const items: {z: number; draw: () => void}[] = [];
	for (let i = 0; i < NP; i++) {
		const z = ZNEAR + ((((i * SPAN) / NP - camZ) % SPAN) + SPAN) % SPAN;
		items.push({
			z,
			draw: () => {
				const fogK = clamp((z - 1800) / 8000) * 0.62;
				const alpha = smooth(seg(z, SPAN + ZNEAR - 50, SPAN - 1600));
				const samples = z < 2600 ? 4 : 1;
				litPlane(g, z > 6000 ? dFar : dark, (q) => {
					for (let j = 0; j < samples; j++) {
						const zz = z + (j / Math.max(1, samples - 1) - 0.5) * SPEED * 0.6;
						xDraw(q, RUNP[i], v, ZR / zz, undefined, alpha / (j + 1));
					}
					if (fogK > 0.01) {
						q.setTransform(1, 0, 0, 1, 0, 0);
						q.globalCompositeOperation = 'source-atop';
						q.fillStyle = rgba('#2c4447', fogK);
						q.fillRect(0, 0, W, H);
						q.globalCompositeOperation = 'source-over';
					}
				});
			},
		});
	}
	if (f >= EV.parallel && f < EV.cut3) items.push({
			z: 3400,
			draw: () => {
				const gy = xPt(v, 540, GYR, ZR / 3400)[1];
				fogBand(g, {y0: gy - 300, y1: gy + 40, x: -40, w: 700, color: '#4a6766', t, seed: 63, alpha: 0.45, speed: 40});
				runners(g, f, v);
			},
		});
	items.push({z: 2400, draw: () => edgeEyes(g, f, v, v1)});
	items.sort((a, b) => b.z - a.z);
	for (const it of items) it.draw();
	beamWarm(g, beam);
	beamCone(g, 780, 2080, beam, t, 0.06, 6);
	fogBand(g, {y0: 1250, y1: 1920, color: '#1d3033', t, seed: 62, alpha: 0.14, speed: 60});
	mud(g, f);
	slaps(g, f);
};

// ---------------------------------------------------------------- B6
export const paintB6 = (g: Ctx, f: number): PostOpts => {
	const t = sec(f);
	const cuts: [number, number, 2 | 3 | 4][] = [
		[EV.cut2, EV.run2, 2],
		[EV.cut3, EV.run3, 3],
		[EV.cut4, B.b6[1], 4],
	];
	for (const [a, b, pr] of cuts) {
		if (f >= a && f < b) {
			// el aliento de la carrera sigue en la cámara; en la última piedra se aquieta hasta quedar fija
			const decay = pr === 4 ? 1 - smooth(seg(f, a, b - 4)) : 1;
			const k = 12 * decay;
			const ph = t * 3 * Math.PI;
			const cam = {x: noise2D('b6sx', t * 3, 0) * k, y: noise2D('b6sy', 0, t * 3) * k - Math.abs(Math.sin(ph)) * 6 * decay, zoom: 1, roll: noise2D('b6sr', t * 2, 0) * 0.012 * decay};
			const beam: Beam = {x: 540 + cam.x * 2 + noise2D('b6sbx', t * 2, 4) * 30 * decay, y: 1130 + cam.y * 2, r: 640, squash: 0.8, power: 0.97};
			stoneShot(g, f, {prints: pr, cam, beam});
			// golpe de corte: un frame de luz más dura
			const hit = f - a;
			return {...POST_NIGHT, ca: hit === 0 ? 4 : POST_NIGHT.ca, flash: hit === 0 ? 0.12 : 0};
		}
	}
	runShot(g, f);
	return {...POST_NIGHT, ca: 2.4};
};
