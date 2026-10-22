// Día 8 · B4 · EL RÍO (f348–522). POV hincado en la orilla de un remanso, mirando abajo ~50°.
// Encuadre: monte oscuro arriba → repisa de piedra con la roca plana (ramo) y la linterna atorada a la derecha →
// agua quieta (45 % inferior) con el cielo reflejado, la capucha del narrador y, tras su hombro, el chaneque.
// 354–381 manos beben · 384–411 reflejo (inclina la cabeza 400) · 412 giro de 150° (6 subcuadros) · 429 regreso,
// la mano agarra la linterna: la roca está VACÍA, rastro de pétalos · 465 un pétalo salta fuera del haz (sin tween)
// · 480–519 la mano izquierda sube al haz: muñeca desnuda.
import {noise2D} from '@remotion/noise';
import {H, W, clamp, hash, lerp, rgba} from '../../lib/util';
import {blurred, cached, fogBand, glow, makeCanvas, type Ctx} from '../kit/paint';
import {marigold} from '../kit/fx';
import {paintShape} from '../kit/shade';
import type {PostOpts} from '../kit/post';
import {P, beamCone, beamWarm, darkMap, easeInOut, eyePair, litPlane, petal, ring, scratch, seg, smooth, spr, torch, type Beam, type V2} from './core';
import {SKIN_POV, drawHand, handPt, sleeve, wristBand, type HandPose} from './hands';
import {B, EV, POST_NIGHT} from './timeline';
import {MOONRIM, fernClump, ground, trunk} from './barranca';
import {frond} from './fx8';
import {chanequeSil} from './chaneque';

const sec = (f: number) => f / 30;
const SHORE = (x: number) => 1060 + Math.sin(x * 0.006 + 1) * 16 + noise2D('shore', x * 0.01, 0) * 8;
const ROCK = {x: 372, y: 872, rx: 250, ry: 80};
const LENS: V2 = [918, 934];
const PAN = 1320; // píxeles de pantalla que equivalen al giro de 150°

// ---------------------------------------------------------------- orilla (lienzo estático)
const bank = () =>
	cached('d8b4bank', () => {
		const c = makeCanvas(W, H);
		const g = c.getContext('2d')!;
		// monte arriba: suelo que sube hacia lo oscuro, contrafuertes, raíces, helechos
		const gr = g.createLinearGradient(0, 0, 0, 760);
		gr.addColorStop(0, '#070a09');
		gr.addColorStop(1, '#151b16');
		g.fillStyle = gr;
		g.fillRect(0, 0, W, 800);
		trunk(g, {x: 90, gy: 640, w: 230, h: 900, seed: 301, kind: 'ceiba', fog: 0.05, rim: 0.8});
		trunk(g, {x: 930, gy: 600, w: 150, h: 800, seed: 302, kind: 'amate', fog: 0.08, rim: 0.7});
		ground(g, 640, 0.05, 303, {amp: 30, bottom: 900});
		fernClump(g, 700, 660, 210, 304, 0.05, 6, 0.4);
		fernClump(g, 280, 650, 170, 305, 0.05, 5, 0.4);
		// sendero de hojarasca pisada que sube desde la roca hacia el monte
		g.strokeStyle = 'rgba(60,52,36,0.35)';
		g.lineCap = 'round';
		g.lineWidth = 90;
		g.beginPath();
		g.moveTo(560, 860);
		g.bezierCurveTo(640, 760, 520, 660, 420, 540);
		g.stroke();
		// repisa: grava, arena húmeda
		const sh = g.createLinearGradient(0, 700, 0, 1100);
		sh.addColorStop(0, '#1d211b');
		sh.addColorStop(1, '#262a22');
		g.fillStyle = sh;
		g.beginPath();
		g.moveTo(0, 760);
		for (let x = 0; x <= W; x += 20) g.lineTo(x, 740 + noise2D('ledge', x * 0.005, 2) * 40);
		g.lineTo(W, SHORE(W));
		for (let x = W; x >= 0; x -= 10) g.lineTo(x, SHORE(x));
		g.closePath();
		g.fill();
		for (let i = 0; i < 700; i++) {
			const x = hash(i, 311) * W;
			const y = lerp(740, SHORE(x), hash(i, 312));
			const r = 1.5 + hash(i, 313) * 5;
			g.fillStyle = hash(i, 314) < 0.5 ? 'rgba(80,84,72,0.5)' : 'rgba(12,14,11,0.6)';
			g.beginPath();
			g.ellipse(x, y, r, r * 0.6, 0, 0, Math.PI * 2);
			g.fill();
		}
		// banda mojada en la orilla con puntos especulares
		g.save();
		g.beginPath();
		for (let x = 0; x <= W; x += 10) g.lineTo(x, SHORE(x) - 34);
		for (let x = W; x >= 0; x -= 10) g.lineTo(x, SHORE(x) + 2);
		g.closePath();
		g.clip();
		g.fillStyle = 'rgba(8,12,12,0.55)';
		g.fillRect(0, 900, W, 300);
		for (let i = 0; i < 140; i++) {
			const x = hash(i, 321) * W;
			g.fillStyle = `rgba(170,200,196,${0.15 + hash(i, 322) * 0.3})`;
			g.fillRect(x, SHORE(x) - 4 - hash(i, 323) * 26, 2, 1.4);
		}
		g.restore();
		// piedras de la orilla (musgo, filo de luna)
		const stone = (x: number, y: number, rx: number, ry: number, seed: number) => {
			paintShape(
				g,
				(q) => q.ellipse(x, y, rx, ry, (hash(seed, 1) - 0.5) * 0.3, 0, Math.PI * 2),
				[x - rx - 6, y - ry - 6, rx * 2 + 12, ry * 2 + 12],
				{
					fill: (q, b) => {
						const gg = q.createLinearGradient(0, b[1], 0, b[1] + b[3]);
						gg.addColorStop(0, '#4a554d');
						gg.addColorStop(1, '#151a17');
						return gg;
					},
					light: -2.3,
					shadow: {color: '#070908', width: ry * 0.6, alpha: 0.85},
					rim: {color: MOONRIM, width: 3, alpha: 0.35},
					texture: {seed: 330 + (seed % 4), scale: 0.5, alpha: 0.35, color: '#0a0d0b'},
				},
			);
			g.fillStyle = 'rgba(40,82,56,0.5)';
			g.beginPath();
			g.ellipse(x - rx * 0.15, y - ry * 0.45, rx * 0.6, ry * 0.25, 0, 0, Math.PI * 2);
			g.fill();
		};
		stone(760, 1010, 90, 40, 341);
		stone(140, 1030, 120, 44, 342);
		stone(610, 1046, 60, 24, 343);
		stone(1010, 985, 110, 52, 344);
		// roca plana: cara lateral oscura + cubierta clara con musgo
		paintShape(
			g,
			(q) => {
				q.ellipse(ROCK.x, ROCK.y + 26, ROCK.rx, ROCK.ry + 14, -0.04, 0, Math.PI * 2);
			},
			[ROCK.x - ROCK.rx - 8, ROCK.y - ROCK.ry, ROCK.rx * 2 + 16, ROCK.ry * 2 + 50],
			{fill: '#1a1e1a', light: -2.2, shadow: {color: '#050605', width: 30, alpha: 0.9}, texture: {seed: 351, scale: 0.5, alpha: 0.4}},
		);
		paintShape(
			g,
			(q) => q.ellipse(ROCK.x, ROCK.y, ROCK.rx, ROCK.ry, -0.04, 0, Math.PI * 2),
			[ROCK.x - ROCK.rx - 6, ROCK.y - ROCK.ry - 6, ROCK.rx * 2 + 12, ROCK.ry * 2 + 12],
			{
				fill: (q, b) => {
					const gg = q.createRadialGradient(b[0] + b[2] * 0.4, b[1] + b[3] * 0.35, 10, b[0] + b[2] * 0.5, b[1] + b[3] * 0.5, ROCK.rx);
					gg.addColorStop(0, '#6d746a');
					gg.addColorStop(1, '#353b34');
					return gg;
				},
				light: -2.2,
				shadow: {color: '#151814', width: 26, alpha: 0.6},
				rim: {color: MOONRIM, width: 2.5, alpha: 0.3},
				texture: {seed: 352, scale: 0.45, alpha: 0.45, color: '#151812'},
			},
		);
		for (let i = 0; i < 9; i++) {
			g.fillStyle = `rgba(48,92,62,${0.3 + hash(i, 361) * 0.3})`;
			g.beginPath();
			g.ellipse(ROCK.x - 200 + hash(i, 362) * 400, ROCK.y - 40 + hash(i, 363) * 80, 14 + hash(i, 364) * 30, 6 + hash(i, 365) * 8, 0, 0, Math.PI * 2);
			g.fill();
		}
		return c;
	});

// lo que hay detrás del narrador (giro de 150°): contrafuertes, raíces, monte cerrado
const behind = () =>
	cached('d8b4behind', () => {
		const c = makeCanvas(W, H);
		const g = c.getContext('2d')!;
		const gr = g.createLinearGradient(0, 0, 0, H);
		gr.addColorStop(0, '#05090a');
		gr.addColorStop(1, '#0d1311');
		g.fillStyle = gr;
		g.fillRect(0, 0, W, H);
		trunk(g, {x: 840, gy: 1180, w: 150, h: 1400, seed: 401, kind: 'amate', fog: 0.25, rim: 0.6});
		trunk(g, {x: 330, gy: 1360, w: 330, h: 1600, seed: 402, kind: 'ceiba', fog: 0.05, rim: 1});
		ground(g, 1350, 0.02, 403, {amp: 50, bottom: H + 40});
		fernClump(g, 120, 1380, 260, 404, 0, 6, 0.45);
		return c;
	});

// ---------------------------------------------------------------- reflejo (cielo, copas, capucha, chaneque)
const RH = H - 1000;
const reflBase = () =>
	cached('d8b4reflbase', () => {
		const c = makeCanvas(W, RH);
		const g = c.getContext('2d')!;
		// cielo reflejado: más claro sobre el narrador (lo que está arriba de él), frío hacia las orillas
		const lg = g.createLinearGradient(0, 0, 0, RH);
		lg.addColorStop(0, '#132c30');
		lg.addColorStop(0.45, '#2c5356');
		lg.addColorStop(1, '#223f42');
		g.fillStyle = lg;
		g.fillRect(0, 0, W, RH);
		const gr = g.createRadialGradient(560, 520, 20, 560, 560, 620);
		gr.addColorStop(0, 'rgba(110,150,146,0.55)');
		gr.addColorStop(1, 'rgba(110,150,146,0)');
		g.fillStyle = gr;
		g.fillRect(0, 0, W, RH);
		for (let i = 0; i < 30; i++) {
			g.fillStyle = `rgba(220,232,224,${0.1 + hash(i, 371) * 0.3})`;
			g.fillRect(hash(i, 372) * W, 120 + hash(i, 373) * 600, 1.6, 1.6);
		}
		glow(g, 250, 250, 140, '#9fc4c0', 0.25);
		g.fillStyle = '#dfe8dc';
		g.beginPath();
		g.arc(250, 250, 17, 0, Math.PI * 2);
		g.fill();
		g.fillStyle = '#26484b';
		g.beginPath();
		g.arc(257, 246, 16, 0, Math.PI * 2);
		g.fill();
		// copas y troncos en los bordes, suaves (en su propio lienzo, desenfocado)
		const cc = makeCanvas(W, RH);
		const q = cc.getContext('2d')!;
		q.fillStyle = 'rgba(4,12,13,0.82)';
		for (let i = 0; i < 34; i++) {
			const sd = i % 2 ? 1 : -1;
			const y = hash(i, 381) * RH * 1.1 - 60;
			const x = sd < 0 ? -90 + hash(i, 382) * 150 : W + 90 - hash(i, 382) * 150;
			const r = 50 + hash(i, 383) * 70;
			q.beginPath();
			for (let k = 0; k < 8; k++) {
				const a = (k / 8) * Math.PI * 2 + hash(k, 384 + i) * 0.6;
				q.ellipse(x + Math.cos(a) * r * 0.6, y + Math.sin(a) * r * 0.5, r * 0.5, r * 0.26, a, 0, Math.PI * 2);
			}
			q.fill();
		}
		for (let i = 0; i < 16; i++) {
			const x = hash(i, 385) * W;
			const r = 60 + hash(i, 386) * 80;
			q.beginPath();
			q.ellipse(x, -10 + hash(i, 387) * 50, r, r * 0.45, 0, 0, Math.PI * 2);
			q.fill();
		}
		q.strokeStyle = '#030707';
		q.lineCap = 'round';
		for (let i = 0; i < 4; i++) {
			const sd = i % 2 ? 1 : -1;
			q.lineWidth = 30 + hash(i, 392) * 26;
			q.beginPath();
			q.moveTo(540 + sd * 700, -40 + i * 140);
			q.lineTo(540 + sd * (330 + hash(i, 393) * 80), 160 + i * 150);
			q.stroke();
		}
		const b = blurred(cc, 14, 'd8b4canopy');
		g.drawImage(b.canvas, -b.pad, -b.pad);
		return c;
	});
const hood = (g: Ctx, x: number, y: number, rot: number) => {
	g.save();
	g.translate(x, y);
	g.rotate(rot);
	g.fillStyle = '#030606';
	g.beginPath();
	// hombros y capucha
	g.moveTo(-300, 380);
	g.bezierCurveTo(-290, 200, -200, 140, -130, 110);
	g.bezierCurveTo(-170, 20, -160, -150, -40, -196);
	g.quadraticCurveTo(0, -214, 46, -194);
	g.bezierCurveTo(166, -146, 172, 30, 128, 110);
	g.bezierCurveTo(206, 140, 290, 200, 300, 380);
	g.closePath();
	g.fill();
	// filo del cielo a contraluz
	g.strokeStyle = 'rgba(140,184,180,0.35)';
	g.lineWidth = 3;
	g.beginPath();
	g.moveTo(-138, 104);
	g.bezierCurveTo(-176, 16, -160, -150, -40, -194);
	g.quadraticCurveTo(0, -212, 46, -192);
	g.bezierCurveTo(166, -144, 170, 30, 124, 104);
	g.stroke();
	g.restore();
};

// ---------------------------------------------------------------- cámara / giro
const turnX = (t: number) => (t < sec(EV.whipBack) ? spr(t - sec(EV.whipTurn), 180, 16) : 1 - spr(t - sec(EV.whipBack), 180, 16));
const whipping = (f: number) => (f >= EV.whipTurn - 1 && f < EV.whipTurn + 12) || (f >= EV.whipBack - 1 && f < EV.whipBack + 12);

// ---------------------------------------------------------------- manos que beben
const cupPose = (f: number, side: 'L' | 'R'): HandPose => {
	const enter = easeInOut(seg(f, EV.cup0, 366));
	const lift = easeInOut(seg(f, 371, EV.cup1 + 4));
	const sd = side === 'L' ? -1 : 1;
	const y = lerp(2260, 1520, enter) + lift * 760;
	const s = lerp(1.9, 1.62, enter) + lift * 0.55;
	const scoop = smooth(seg(f, 364, 372));
	return {x: 540 + sd * lerp(150, 92, enter) * (1 + lift * 0.3), y, rot: sd * lerp(0.42, 0.24, scoop), s, side, view: 'palm', skin: SKIN_POV, curl: [0.4 + scoop * 0.15, 0.42 + scoop * 0.15, 0.45 + scoop * 0.15, 0.5 + scoop * 0.15], thumb: 0.35, spread: 0.06, forearm: 620, light: -2.2};
};
const RIPPLES: {f: number; x: number; y: number; s: number}[] = [
	{f: 365, x: 540, y: 1460, s: 1.3},
	...Array.from({length: 12}, (_, i) => ({f: 374 + Math.round(hash(i, 411) * 9), x: 540 + (hash(i, 412) - 0.5) * 320, y: 1480 + hash(i, 413) * 260, s: 0.35 + hash(i, 414) * 0.35})),
];

// ---------------------------------------------------------------- linterna en la mano (RIG-01)
const heldAim = (f: number): V2 => {
	const t = sec(f);
	const up = spr(t - sec(EV.whipBack) - 0.12, 130, 11);
	const a0: V2 = [800, 1240];
	const rock: V2 = [ROCK.x + 40, ROCK.y - 10];
	let p: V2 = [lerp(a0[0], rock[0], up), lerp(a0[1], rock[1], up)];
	const follow = easeInOut(seg(f, 440, 462));
	p = [lerp(p[0], 470, follow * 0.9), lerp(p[1], 700, follow)];
	const toHand = spr(t - sec(EV.wrist0) - 0.25, 110, 13);
	p = [lerp(p[0], 520, toHand), lerp(p[1], 1150, toHand)];
	// temblor de miedo (8 Hz) y respiración de pánico (1.2 Hz)
	const fear = f >= EV.silence ? 1 : 0.4;
	p[0] += (noise2D('b4ax', t * 8, 0) * 5 + Math.sin(t * 1.2 * Math.PI * 2) * 6) * fear;
	p[1] += (noise2D('b4ay', 0, t * 8) * 5 + Math.cos(t * 1.2 * Math.PI * 2) * 4) * fear;
	return p;
};
const TORCH_BASE: V2 = [1150, 2160];
const drawHeldTorch = (g: Ctx, aim: V2) => {
	const a = Math.atan2(aim[1] - TORCH_BASE[1], aim[0] - TORCH_BASE[0]);
	const head: V2 = [TORCH_BASE[0] + Math.cos(a) * 330, TORCH_BASE[1] + Math.sin(a) * 330];
	g.save();
	g.translate(head[0], head[1]);
	g.rotate(a);
	paintShape(g, (q) => q.roundRect(-330, -30, 300, 60, 10), [-334, -34, 308, 68], {fill: '#1e1e1c', light: -Math.PI / 2 - a, shadow: {color: '#050505', width: 14, alpha: 0.8}, rim: {color: MOONRIM, width: 2, alpha: 0.4}});
	paintShape(g, (q) => q.roundRect(-40, -40, 52, 80, 8), [-44, -44, 60, 88], {fill: '#2b2b28', light: -Math.PI / 2 - a, rim: {color: '#d9cdb6', width: 2, alpha: 0.5}});
	g.fillStyle = '#fff4dc';
	g.beginPath();
	g.ellipse(12, 0, 5, 34, 0, 0, Math.PI * 2);
	g.fill();
	g.restore();
	glow(g, head[0], head[1], 140, '#ffe9c2', 0.35);
	// puño alrededor del mango
	const fist: HandPose = {x: TORCH_BASE[0] + Math.cos(a) * 120, y: TORCH_BASE[1] + Math.sin(a) * 120, rot: a + Math.PI / 2 + 0.15, s: 1.8, side: 'R', view: 'dorsal', skin: SKIN_POV, curl: [0.95, 0.95, 0.95, 0.95], thumb: 0.85, spread: 0, forearm: 520, light: -2.4};
	sleeve(g, fist, 120, '#141413', '#22221f');
	drawHand(g, fist);
};

// linterna tirada en la piedra (antes de que la agarre)
const drawLyingTorch = (g: Ctx) => {
	g.save();
	g.translate(LENS[0], LENS[1]);
	g.rotate(Math.PI - 0.12);
	paintShape(g, (q) => q.roundRect(-6, -24, 230, 48, 9), [-10, -28, 240, 56], {fill: '#20201e', light: Math.PI / 2, shadow: {color: '#050505', width: 12, alpha: 0.85}, rim: {color: MOONRIM, width: 2, alpha: 0.35}, texture: {seed: 421, scale: 0.3, alpha: 0.2}});
	for (let k = 0; k < 8; k++) {
		g.fillStyle = 'rgba(0,0,0,0.45)';
		g.fillRect(90 + k * 14, -24, 5, 48);
	}
	paintShape(g, (q) => q.roundRect(-20, -32, 40, 64, 7), [-24, -36, 48, 72], {fill: '#2d2c29', light: Math.PI / 2, rim: {color: '#d9cdb6', width: 2, alpha: 0.4}});
	g.fillStyle = '#fff3d6';
	g.beginPath();
	g.ellipse(-20, 0, 5, 26, 0, 0, Math.PI * 2);
	g.fill();
	g.restore();
	glow(g, LENS[0] - 10, LENS[1] + 2, 120, '#ffe7bc', 0.4);
};

// ---------------------------------------------------------------- pétalos: ramo, rastro, salto
const TRAIL: V2[] = [
	[560, 846],
	[606, 800],
	[598, 748],
	[556, 700],
	[516, 664],
	[474, 630],
	[442, 600],
	[420, 574],
	[404, 552],
];
const POP_I = 6;
const bunchOnRock = (g: Ctx) => {
	const heads: [number, number, number][] = [
		[300, 846, 0.3],
		[350, 864, 1.1],
		[322, 884, 2.0],
	];
	g.lineCap = 'round';
	g.strokeStyle = '#2a4523';
	g.lineWidth = 6;
	for (const [hx, hy] of heads) {
		g.beginPath();
		g.moveTo(hx + 10, hy + 6);
		g.quadraticCurveTo(hx + 90, hy + 14, hx + 170, hy + 2);
		g.stroke();
	}
	heads.forEach(([hx, hy, r], i) => marigold(g, hx, hy, 30, r, 3 + i, i % 2));
};

// ---------------------------------------------------------------- escena frontal (todo lo que se ve antes/después del giro)
const front = (q: Ctx, f: number, beam: Beam, held: boolean, aim: V2) => {
	const t = sec(f);
	q.fillStyle = P.ink;
	q.fillRect(0, 0, W, H);
	// agua: reflejo con ondas (estrías desplazadas) y tinte
	const {c: rc, g: rg} = scratch(12, W, RH);
	rg.drawImage(reflBase(), 0, 0);
	const jerk = f >= EV.whipTurn - 2 ? smooth(seg(f, EV.whipTurn - 2, EV.whipTurn + 1)) : 0;
	const showCh = f >= EV.cup1 - 2 && f < EV.whipTurn + 2;
	let eyeAt: V2 | null = null;
	let tilt = 0;
	if (showCh) {
		tilt = f >= EV.reflTilt ? 0.21 * clamp(spr(sec(f - EV.reflTilt), 900, 30), 0, 1.2) : 0;
		glow(rg, 800, 470, 300, '#86b0ae', 0.16);
		rg.save();
		rg.translate(812, 690);
		rg.scale(1.18, 1.18);
		const e = chanequeSil(rg, {headTilt: tilt, armL: 0.32, armR: -0.28, fringe: (i) => noise2D('chf', i * 0.3, t * 0.4) * 0.15}, {fill: '#020505', rim: '#9cc8c4', rimA: 0.5, rimSide: -1});
		rg.restore();
		eyeAt = [812 + e[0] * 1.18, 690 + e[1] * 1.18];
	}
	rg.save();
	rg.translate(540 + jerk * 50, 640);
	rg.scale(0.92, 0.92);
	hood(rg, 0, 0, jerk * 0.18);
	rg.restore();
	// ondas: amplitud que decae tras beber
	const amp = (f >= 365 ? 16 * Math.exp(-(f - 365) / 9) : 0) + (f >= 374 ? 7 * Math.exp(-(f - 374) / 12) : 0) + 0.6;
	const y0 = 1000;
	q.save();
	q.beginPath();
	q.moveTo(0, H);
	for (let x = 0; x <= W; x += 10) q.lineTo(x, SHORE(x) - 6);
	q.lineTo(W, H);
	q.closePath();
	q.clip();
	const strip = 4;
	for (let yy = 0; yy < RH; yy += strip) {
		const off = Math.sin(yy * 0.07 + t * 3.1) * amp + noise2D('b4rf', yy * 0.02, t * 0.8) * amp * 0.8;
		q.drawImage(rc, 0, yy, W, strip, off, y0 + yy, W, strip);
	}
	const tg = q.createLinearGradient(0, y0, 0, H);
	tg.addColorStop(0, 'rgba(4,14,16,0.25)');
	tg.addColorStop(1, 'rgba(3,10,12,0.55)');
	q.fillStyle = tg;
	q.fillRect(0, y0, W, RH);
	// ojos del chaneque (emisivos, en el agua)
	if (eyeAt) {
		const ox = Math.sin((eyeAt[1] - 0) * 0.07 + t * 3.1) * amp;
		eyePair(q, eyeAt[0] + ox, y0 + eyeAt[1], 3.8, {alpha: 0.9 * clamp(seg(f, EV.cup1 + 2, EV.refl0)), tilt, spread: 3.6, glow: 0.8});
	}
	// anillos de las gotas
	for (const r of RIPPLES) {
		const d = f - r.f;
		if (d < 0 || d > 40) continue;
		const rr = (30 + d * 10) * r.s;
		const a = Math.exp(-d / 9) * 0.5;
		q.strokeStyle = rgba('#a9cfcc', a);
		q.lineWidth = 2;
		q.beginPath();
		q.ellipse(r.x, r.y, rr, rr * 0.4, 0, 0, Math.PI * 2);
		q.stroke();
		q.strokeStyle = rgba('#020606', a * 0.8);
		q.beginPath();
		q.ellipse(r.x, r.y + 3, rr * 0.92, rr * 0.36, 0, 0, Math.PI * 2);
		q.stroke();
	}
	// destellos sueltos del agua
	for (let i = 0; i < 40; i++) {
		const x = (hash(i, 431) * W + t * 12 * (0.5 + hash(i, 432))) % W;
		const y = 1080 + hash(i, 433) * 800;
		const tw = Math.max(0, Math.sin(t * (1.5 + hash(i, 434) * 3) + i * 2));
		q.fillStyle = rgba('#b8d6d2', 0.25 * tw);
		q.fillRect(x, y, 6 + hash(i, 435) * 10, 1.4);
	}
	q.restore();
	// orilla con la luz de la linterna (mapa por plano)
	const dark = darkMap(beam, 0.84, '#050c0d', 7);
	litPlane(q, dark, (a) => {
		a.drawImage(bank(), 0, 0);
		if (f < EV.whipTurn + 6) bunchOnRock(a);
		else {
			petal(a, ROCK.x + 20, ROCK.y - 16, 2.2, 20, P.cempa);
			petal(a, ROCK.x + 120, ROCK.y + 6, 0.6, 18, P.gold);
			TRAIL.forEach(([x, y], i) => {
				if (i === POP_I && f >= EV.petalPop) {
					petal(a, x - 92, y + 6, 1.9 + i, 22 * (1 - i * 0.075), P.cempa);
					return;
				}
				petal(a, x, y, i * 1.7 + 0.4, 22 * (1 - i * 0.075), i % 3 ? P.cempa : P.gold);
			});
		}
	});
	if (!held) drawLyingTorch(q);
	beamWarm(q, beam);
	if (!held) beamCone(q, LENS[0] - 20, LENS[1], beam, t, 0.05, 6);
	else beamCone(q, TORCH_BASE[0] - 150, TORCH_BASE[1] - 290, beam, t, 0.035, 7);
	fogBand(q, {y0: 560, y1: 980, color: '#2e4c50', t, seed: 41, alpha: 0.2, speed: 10});
	void aim;
};

// ---------------------------------------------------------------- B4
export const paintB4 = (g: Ctx, f: number): PostOpts => {
	const t = sec(f);
	const held = f >= EV.whipBack;
	const aim = held ? heldAim(f) : ([ROCK.x + 30, ROCK.y - 6] as V2);
	const beam: Beam = held ? {x: aim[0], y: aim[1], r: 470, squash: 0.74, angle: -0.1, power: 0.97 * (0.96 + 0.04 * noise2D('b4fl', t * 9, 0))} : {x: ROCK.x + 40, y: ROCK.y - 6, r: 430, squash: 0.52, angle: -0.04, power: torch(f, -10) * 0.9};
	const br: V2 = [noise2D('b4bx', t * 0.25, 0) * 6, noise2D('b4by', 0, t * 0.25) * 5];
	const X = turnX(t);
	const drawFront = (q: Ctx) => front(q, f, beam, held, aim);
	const drawBehind = (q: Ctx, dx: number) => {
		q.drawImage(behind(), dx, 0);
		// helecho que aún se mece (alguien acaba de pasar)
		const sw = ring(t - sec(EV.whipTurn) + 0.35, 1.6, 1.0);
		q.save();
		q.translate(dx, 0);
		for (const mode of ['albedo', 'rim'] as const) frond(q, {x: 760, y: 1400, L: 620, ang: -1.9 + sw * 0.35, curl: 1.1, flip: 1, seed: 451, col: '#24391f', mode, rimA: 0.6, droop: 0.4, bend: (u) => sw * 1.4 * Math.sin(Math.PI * 0.5 * u)});
		q.restore();
		q.fillStyle = rgba('#03080a', 0.35);
		q.fillRect(dx, 0, W, H);
	};
	g.save();
	g.translate(br[0], br[1]);
	if (whipping(f)) {
		// 6 subcuadros del giro, promediados
		const {c: fc, g: fq} = scratch(10);
		drawFront(fq);
		const {c: bc, g: bq} = scratch(11);
		drawBehind(bq, 0);
		const {c: acc, g: aq} = scratch(13);
		aq.fillStyle = '#000';
		aq.fillRect(0, 0, W, H);
		aq.globalCompositeOperation = 'lighter';
		const NS = 16;
		aq.globalAlpha = 1 / NS;
		for (let k = 0; k < NS; k++) {
			const xk = turnX(t + ((k + 0.5) / NS - 0.5) / 30) * PAN;
			aq.drawImage(fc, -xk, 0);
			aq.drawImage(bc, PAN - xk, 0);
		}
		aq.globalAlpha = 1;
		aq.globalCompositeOperation = 'source-over';
		g.drawImage(acc, 0, 0);
	} else if (X > 0.5) {
		drawBehind(g, PAN - X * PAN);
	} else {
		drawFront(g);
	}
	// manos: beber (354–381) y la izquierda desnuda en el haz (480–519)
	if (f >= EV.cup0 && f < EV.cup1 + 6) {
		const dk = darkMap({...beam, power: 0}, 0.55, '#071416', 8);
		litPlane(g, dk, (q) => {
			for (const sd of ['L', 'R'] as const) {
				const p = cupPose(f, sd);
				sleeve(q, p, 200, '#141413', '#22221f');
				drawHand(q, p);
				if (sd === 'L') wristBand(q, p, {wraps: 2, knot: 1, tails: 1, dim: 0.75});
			}
			// gotas que caen de vuelta al agua
			if (f >= 371) {
				for (let i = 0; i < 14; i++) {
					const f0 = 371 + hash(i, 441) * 10;
					const d = f - f0;
					if (d < 0 || d > 12) continue;
					const p = cupPose(f0, i % 2 ? 'L' : 'R');
					const tip = handPt(p, (hash(i, 442) - 0.5) * 60, -150);
					const x = tip[0] + (hash(i, 443) - 0.5) * 30;
					const y = tip[1] - d * 9 + d * d * 0.5;
					q.fillStyle = 'rgba(200,226,222,0.7)';
					q.beginPath();
					q.ellipse(x, y, 2.2, 3.4, 0, 0, Math.PI * 2);
					q.fill();
				}
			}
		});
	}
	if (held && X < 0.5) {
		if (f >= EV.wrist0) {
			const k = easeInOut(seg(f, EV.wrist0, EV.wrist0 + 22));
			const turn = easeInOut(seg(f, EV.wrist0 + 4, EV.wrist0 + 40));
			const L: HandPose = {x: 470 + turn * 20, y: lerp(2240, 1290, k), rot: 0.12 + 0.44 * turn, s: 1.95, side: 'L', view: 'dorsal', skin: SKIN_POV, spread: 0.12 + 0.5 * smooth(seg(f, EV.wrist0 + 16, EV.wrist1)), curl: [0.2, 0.16, 0.18, 0.24].map((c) => c * (1 - 0.6 * turn)) as [number, number, number, number], thumb: 0.2, forearm: 600, light: -2.0};
			const dk = darkMap(beam, 0.86, '#050c0d', 8);
			litPlane(g, dk, (q) => {
				sleeve(q, L, 210, '#141413', '#22221f');
				drawHand(q, L);
				wristBand(q, L, {wraps: 0, bare: 1});
			});
			beamWarm(g, beam, 0.6);
		}
		drawHeldTorch(g, aim);
	}
	g.restore();
	const ca = whipping(f) ? 3.5 : POST_NIGHT.ca!;
	return {...POST_NIGHT, ca, hatch: f >= EV.refl0 && f < EV.whipTurn ? 0.62 : POST_NIGHT.hatch};
};
