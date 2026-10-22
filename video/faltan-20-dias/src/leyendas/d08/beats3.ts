// Día 8 · G3 (frames 849–1335): B7 el 8 en la piedra + susto · B8 título · B9 amanecer · B10 ocho días ·
// B11 el listón se vuelve número · B12 rótulo + remate. ESQUELETO (etapa 1): entorno, luz y cámara bloqueados.
import {noise2D} from '@remotion/noise';
import {H, W, clamp, hash, lerp, mixRGB, rgba} from '../../lib/util';
import {beam as beamFx, fogBand, glow, type Ctx} from '../kit/paint';
import {particles} from '../kit/fx';
import type {PostOpts} from '../kit/post';
import {P, S, eyePair, expoOut, fillBg, footprint, petal, ribbon, seg, smooth, spr, torch, blink, type Beam} from './core';
import {OCHO, PETAL_RING, PRINTS, STONE} from './stone';
import {OCHO_CX, OCHO_CY} from './ocho';
import {SKIN_POV, drawHand, sleeve, wristBand, type HandPose} from './hands';
import {drawGlyph8, fuse, swell} from './finale';
import {stoneShot} from './beats1';
import {HZN, crumble, dawnBG, dew, dewBeads, drawTop, driedHead, handprint, roadLayer} from './g3env';
import {blurred} from '../kit/paint';
import {easeInOut as easeIO, scratch} from './core';
import {faceState, scareFace} from './face';
import {B, EV, POST_DAWN, POST_NIGHT, POST_TITLE} from './timeline';

const sec = (f: number) => f / 30;

// ---------------------------------------------------------------- B7 · el 8 en la piedra + SUSTO (849–948)
export const paintB7 = (g: Ctx, f: number): PostOpts => {
	const t = sec(f);
	const u = seg(f, B.b7[0], EV.jump - 3);
	const zoom = 1 + 0.16 * u * u;
	const hh = {x: noise2D('b7x', t * 0.3, 0) * 3, y: noise2D('b7y', 0, t * 0.3) * 3};
	const sh = f >= EV.jump ? Math.exp(-(t - sec(EV.jump)) / 0.13) * 14 : 0;
	const cam = {x: hh.x + noise2D('b7sx', t * 22, 0) * sh, y: hh.y + noise2D('b7sy', 0, t * 22) * sh, zoom, roll: 0};
	const drop = f >= EV.jumpEnd ? smooth(seg(f, EV.jumpEnd, EV.jumpEnd + 4)) : 0;
	const pw = torch(f, -100, EV.torchDie);
	const beam: Beam = {x: 540, y: 1100 + drop * 700, r: 600, squash: 0.8, power: pw};
	stoneShot(g, f, {prints: 4, cam, beam, liston: 1, petals: true});
	// mano izquierda (muñeca desnuda) que tiembla y se acerca al listón
	if (f >= EV.reach0) {
		const k = smooth(seg(f, EV.reach0, EV.jump));
		const tr = noise2D('b7tr', t * 8, 0) * 2;
		const L: HandPose = {x: 520 + tr, y: lerp(2150, 1500, k) + tr, rot: 0.1, s: 1.9, side: 'L', view: 'dorsal', skin: SKIN_POV, curl: [0.25, 0.2, 0.25, 0.3], thumb: 0.2, forearm: 560, spread: 0.35};
		sleeve(g, L, 190);
		drawHand(g, L);
		wristBand(g, L, {wraps: 0, bare: 1});
	}
	// SUSTO (RIG-07): la cara grabada del chaneque viejo embiste desde abajo a la derecha, a ~25 cm del lente
	if (f >= EV.jump && f < EV.jumpEnd) {
		const lf = f - EV.jump;
		const scAt = (q: number) => (q < 4 ? lerp(0.55, 1.04, expoOut(Math.max(0, q) / 4)) : lerp(1.04, 1.0, smooth(clamp((q - 4) / 6))));
		const draw = (q: number, a: number) => {
			const sc = scAt(q);
			const jit = (hash(lf, 3) - 0.5) * 6;
			g.save();
			g.globalAlpha = a;
			g.translate(560 + jit + (1 - sc) * 620, 1180 + (1 - sc) * 1000);
			g.rotate(0.21 * smooth(clamp(q / 2.5)) - 0.03 * Math.sin(q * 0.7) * clamp(q / 4));
			g.scale(sc * 0.9, sc * 0.9);
			scareFace(g, faceState(Math.max(0, q)));
			g.restore();
		};
		// embiste: dos fantasmas de sub-cuadro para el desenfoque de movimiento
		if (lf < 2) for (const d of [0.66, 0.33]) draw(lf - d, 0.35);
		draw(lf, 1);
	}
	const scare = f >= EV.jump && f < EV.jumpEnd;
	return {...POST_NIGHT, hatch: scare ? 0.7 : POST_NIGHT.hatch, ca: f === EV.jump ? 10 : POST_NIGHT.ca, flash: f === EV.jump ? 0.14 : 0};
};

// ---------------------------------------------------------------- B8 · negro · título (948–1014)
export const paintB8 = (g: Ctx, f: number): PostOpts => {
	const t = sec(f);
	fillBg(g, P.ink);
	if (f >= EV.slam) {
		const k = smooth(seg(f, EV.slam, EV.slam + 20));
		fogBand(g, {y0: 600, y1: 1300, color: '#3a2a1c', t, seed: 61, alpha: 0.5 * k, speed: 8});
		glow(g, 540, 900, 620, P.cempa, 0.12 * k);
		// estallido de lodo y hojas al golpe (balístico con arrastre)
		const lt = t - sec(EV.slam);
		for (let i = 0; i < 70; i++) {
			const a = -Math.PI / 2 + (hash(i, 801) - 0.5) * 2.6;
			const v = 500 + hash(i, 802) * 1300;
			const drag = 2.2;
			const d = (v / drag) * (1 - Math.exp(-drag * lt));
			const x = 540 + Math.cos(a) * d * 1.2 + (hash(i, 803) - 0.5) * 300;
			const y = 960 + Math.sin(a) * d + 420 * lt * lt;
			if (y > H + 20) continue;
			g.fillStyle = i % 4 ? '#2a1a0e' : '#2f4a22';
			g.beginPath();
			g.ellipse(x, y, 3 + hash(i, 804) * 6, 2 + hash(i, 805) * 4, hash(i, 806) * 6 + lt * 5, 0, Math.PI * 2);
			g.fill();
		}
	}
	// hundimiento en la niebla
	const sink = seg(f, EV.sink, B.b8[1]);
	if (sink > 0) fogBand(g, {y0: 1920 - sink * 1900, y1: 1920, color: '#8a8a80', t, seed: 62, alpha: sink, speed: 10});
	return {...POST_TITLE, flash: f === EV.slam ? 0.05 : 0, ca: f === EV.slam ? 4 : POST_TITLE.ca};
};

// ---------------------------------------------------------------- B9 · amanecer (1014–1122)
export const paintB9 = (g: Ctx, f: number): PostOpts => {
	const t = sec(f);
	const lf = f - B.b9[0];
	const rise = 60 * easeIO(seg(f, EV.rise0, B.b9[1])); // al incorporarse, la escena baja
	const rack = smooth(seg(f, B.b9[0], EV.rack1)); // 0: foco en la mano · 1: foco en los árboles
	const hh = {x: noise2D('b9x', t * 0.25, 0) * 4, y: noise2D('b9y', 0, t * 0.25) * 3};
	// fondo (cielo + árboles) con foco que entra: nítido y desenfocado en caché, fundidos
	const bg = dawnBG();
	const bgB = blurred(bg, 14, 'd8dawnBG');
	const by = rise * 0.6 + hh.y;
	g.drawImage(bg, hh.x * 0.3, by);
	if (rack < 1) {
		g.globalAlpha = 1 - rack;
		g.drawImage(bgB.canvas, -bgB.pad + hh.x * 0.3, -bgB.pad + by);
		g.globalAlpha = 1;
	}
	// niebla que se levanta en capas
	const lift = seg(f, B.b9[0], B.b9[1]);
	for (let k = 0; k < 3; k++) {
		const y = HZN - 140 + k * 70 - lf * (0.35 + k * 0.3) + by;
		fogBand(g, {y0: y, y1: y + 260, color: '#e9dfc8', t: t + k * 4, seed: 70 + k, alpha: 0.42 * (1 - lift * 0.55) * (1 - k * 0.15), speed: 10 + k * 6});
	}
	// camino
	const road = roadLayer();
	const ry = rise * 0.6 + hh.y;
	g.drawImage(road, 0, HZN, W, H - HZN, hh.x * 0.6, HZN + ry, W, H - HZN);
	dew(g, t, HZN + 6 + ry, ry);
	// primer plano: mano con el ramo SECO, desenfocado según el foco (un solo blur por cuadro)
	const {c: fc, g: q} = scratch(4);
	q.translate(hh.x, rise + hh.y * 1.4);
	const hand: HandPose = {x: 380, y: 1640, rot: 1.2, s: 2.0, side: 'R', view: 'dorsal', skin: SKIN_POV, curl: [0.85, 0.9, 0.9, 0.9], thumb: 0.8, forearm: 600};
	const fist: [number, number] = [612, 1560];
	const heads: [number, number, number, number][] = [
		[560, 1330, 62, -0.3],
		[700, 1372, 70, 0.4],
		[628, 1262, 56, 0.1],
	];
	const breeze = noise2D('b9br', t * 0.6, 0) * 0.05;
	q.lineCap = 'round';
	for (const [hx, hy] of heads) {
		q.strokeStyle = '#4a3a20';
		q.lineWidth = 7;
		q.beginPath();
		q.moveTo(fist[0], fist[1]);
		q.quadraticCurveTo((fist[0] + hx) / 2 + 12, (fist[1] + hy) / 2, hx + breeze * 300, hy);
		q.stroke();
		// hojitas secas en el tallo
		q.fillStyle = '#5a4424';
		q.beginPath();
		q.ellipse((fist[0] + hx) / 2 + 18, (fist[1] + hy) / 2 + 10, 26, 8, -0.8, 0, Math.PI * 2);
		q.fill();
	}
	heads.forEach(([hx, hy, r, rot], i) => driedHead(q, hx + breeze * 300, hy, r, rot + breeze * 2, 950 + i * 7, 0.15 + 0.25 * lift));
	sleeve(q, hand, 180);
	drawHand(q, hand);
	wristBand(q, hand, {wraps: 0, bare: 1});
	// luz de amanecer: filo dorado desde el sol (arriba a la derecha) sobre la mano
	q.globalCompositeOperation = 'source-atop';
	const lg = q.createLinearGradient(900, 1100, 400, 1800);
	lg.addColorStop(0, 'rgba(255,214,140,0.35)');
	lg.addColorStop(1, 'rgba(30,18,8,0.35)');
	q.fillStyle = lg;
	q.fillRect(0, 1000, W, 920);
	q.globalCompositeOperation = 'source-over';
	const fb = rack * 10;
	if (fb > 0.4) g.filter = `blur(${fb.toFixed(1)}px)`;
	g.drawImage(fc, 0, 0);
	g.filter = 'none';
	// pétalos que se desmoronan (cerca de la cámara, siguen el foco del primer plano)
	crumble(g, t, heads.map(([hx, hy]) => [hx + hh.x, hy + rise] as [number, number]));
	const fadeIn = 1 - Math.exp(-5 * seg(f, B.b9[0], EV.dawnIn1));
	return {...POST_DAWN, hatch: 0.5 * (1 - lift), fade: (1 - fadeIn) * 0.9};
};

// ---------------------------------------------------------------- B10–B11 · la piedra vista desde arriba
// coordenadas de la cara superior (u, v) = espacio del «8» del rótulo − (540, 930): a zoom 1 el listón ES el glifo
const topDown = (g: Ctx, f: number, o: {zoom: number; rot: number; liston?: boolean}) => {
	const t = sec(f);
	fillBg(g, '#2e261c');
	g.save();
	g.translate(OCHO_CX, OCHO_CY);
	g.rotate(o.rot);
	g.scale(o.zoom, o.zoom);
	drawTop(g);
	g.translate(-OCHO_CX, -OCHO_CY);
	if (o.liston !== false) {
		ribbon(g, [...OCHO, OCHO[0]], {w: 18, shadow: 0.6});
		dewBeads(g, OCHO, t);
	}
	g.restore();
};

export const paintB10 = (g: Ctx, f: number): PostOpts => {
	const t = sec(f);
	const u = seg(f, B.b10[0], B.b10[1]);
	const e = 1 - Math.pow(1 - u, 3);
	topDown(g, f, {zoom: lerp(0.78, 0.7, e), rot: lerp(8, 0, e) * (Math.PI / 180)});
	// rayo de sol dorado que entra entre los troncos
	beamFx(g, -120, 200, 520, 1000, 80, 520, '#ffd98a', 0.22 + 0.04 * Math.sin(t * 2));
	glow(g, 470, 930, 420, '#ffd98a', 0.12);
	// motas en el rayo
	particles(g, {kind: 'dust', n: 26, t, seed: 83, x: 0, y: 300, w: 700, h: 900, alpha: 0.5});
	// un pétalo seco cae (vista cenital: llega grande y desenfocado, se encoge hasta posarse junto al 8)
	const pf = seg(f, EV.petalFall, EV.petalFall + 14);
	if (f >= EV.petalFall) {
		const land: [number, number] = [790, 1185];
		const k = pf * pf;
		const sc = lerp(4.2, 1, k);
		const x = lerp(980, land[0], easeIO(pf)) + Math.sin(pf * 9) * 40 * (1 - pf);
		const y = lerp(820, land[1], easeIO(pf));
		g.fillStyle = rgba('#0b0703', 0.35 * pf);
		g.beginPath();
		g.ellipse(land[0] + 14 * (1 - pf) + 6, land[1] + 10, 16, 10, 0.6, 0, Math.PI * 2);
		g.fill();
		if (pf < 0.85) g.filter = `blur(${((1 - pf) * 8).toFixed(1)}px)`;
		petal(g, x, y, 0.6 + pf * 4 * (1 - pf), 30 * sc, '#c4a272', 0.8);
		g.filter = 'none';
	}
	return {...POST_DAWN, hatch: 0.12, vignette: 1.0};
};

export const paintB11 = (g: Ctx, f: number): PostOpts => {
	const t = sec(f);
	const u = smooth(seg(f, B.b11[0], EV.fuse1 - 6));
	topDown(g, f, {zoom: lerp(0.7, 1, u), rot: 0, liston: false});
	// todo se oscurece a café profundo con brasas
	const dk = smooth(seg(f, EV.fuse0, EV.fuse1));
	g.fillStyle = rgba(P.bg, dk);
	g.fillRect(0, 0, W, H);
	particles(g, {kind: 'embers', n: Math.round(40 * dk), t, seed: 81});
	const zoom = lerp(0.7, 1, u);
	g.save();
	g.translate(OCHO_CX, OCHO_CY);
	g.scale(zoom, zoom);
	g.translate(-OCHO_CX, -OCHO_CY);
	const fu = seg(f, EV.fuse0, EV.fuse1);
	fuse(g, fu < 1 ? (fu < 0.5 ? 2 * fu * fu : 1 - Math.pow(-2 * fu + 2, 2) / 2) : 1, t);
	g.restore();
	swell(g, seg(f, EV.swell0, EV.swell1));
	return {...POST_TITLE, hatch: 0.15, bloom: 0.8};
};

// ---------------------------------------------------------------- B12 · rótulo + remate (1227–1335)
export const paintB12 = (g: Ctx, f: number): PostOpts => {
	const t = sec(f);
	fillBg(g, P.bg);
	particles(g, {kind: 'embers', n: 36, t, seed: 82});
	const pulse = 0.5 + 0.5 * Math.sin(t * 0.8 * Math.PI * 2);
	drawGlyph8(g, {pulse});
	// franja de suelo oscura abajo (solo imagen)
	const gr = g.createLinearGradient(0, 1560, 0, H);
	gr.addColorStop(0, rgba('#0b0703', 0));
	gr.addColorStop(1, '#0b0703');
	g.fillStyle = gr;
	g.fillRect(0, 1560, W, H - 1560);
	// remate: huellas de lodo que salen de lo oscuro abajo a la derecha y caminan hacia la cámara
	if (f >= EV.prints0) {
		const n = Math.min(8, Math.floor((f - EV.prints0) / 3.6) + 1);
		for (let i = 0; i < n; i++) {
			const age = (f - EV.prints0 - i * 3.6) / 30;
			const pop = clamp(age / 0.08);
			const d = i / 7; // 0 lejos → 1 cerca
			const x = lerp(900, 640, d) + (i % 2 ? 26 : -26) * (1 + d);
			const y = lerp(1610, 1810, d * d);
			const sz = lerp(30, 74, d);
			glow(g, x, y, sz * 2.2, '#c9773a', 0.22 * pop);
			footprint(g, x, y, Math.PI + 0.35, sz * (0.85 + 0.15 * pop), 0.5, i % 2 ? 1 : -1, 1, 0.9, pop);
		}
	}
	if (f >= EV.eyes2) eyePair(g, 190, 1660, 16, {open: clamp((f - EV.eyes2) / 2) * blink(f, EV.eyes2 + 4), glow: 1.2});
	// palmada de lodo en el lente (abajo a la izquierda, x 70–390, y 1500–1820)
	let kick = 0;
	if (f >= EV.slap) {
		const slide = 30 * smooth(seg(f, EV.slap + 2, B.b12[1]));
		kick = f === EV.slap ? 1 : 0;
		handprint(g, 228, 1690, 0.82, slide, 1);
	}
	return {...POST_TITLE, hatch: 0.12, bloom: 0.75, ...(kick ? {ca: 6, flash: 0.08} : {})};
};

void mixRGB;
void spr;
void S;
