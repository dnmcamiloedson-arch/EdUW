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
import {smoothPath} from '../kit/rig';
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
	// SUSTO: la cara del chaneque sube desde abajo a la derecha (bloque; la cara grabada llega en G3)
	if (f >= EV.jump && f < EV.jumpEnd) {
		const lf = f - EV.jump;
		const sc = lf < 4 ? lerp(0.55, 1.04, expoOut(lf / 4)) : lerp(1.04, 1.0, smooth(clamp((lf - 4) / 6)));
		const jit = (hash(lf, 3) - 0.5) * 2;
		g.save();
		g.translate(640 + jit + (1 - sc) * 500, 1180 + (1 - sc) * 900);
		g.rotate(0.21 * clamp(lf / 2));
		g.scale(sc, sc);
		const sk = g.createLinearGradient(0, 400, 0, -400);
		sk.addColorStop(0, '#8a6a48');
		sk.addColorStop(0.5, '#3a2a1a');
		sk.addColorStop(1, '#0d0906');
		g.fillStyle = sk;
		g.beginPath();
		g.ellipse(0, 0, 430, 470, 0, 0, Math.PI * 2);
		g.fill();
		g.fillStyle = '#120c06';
		g.beginPath();
		g.ellipse(0, -380, 700, 120, 0, 0, Math.PI * 2);
		g.fill();
		eyePair(g, 0, -60, 46, {pupil: lf >= 3 ? 0.14 : 0.32, spread: 5.2, glow: 1.2});
		g.strokeStyle = '#1a0e06';
		g.lineWidth = 14;
		g.lineCap = 'round';
		g.beginPath();
		g.moveTo(-230 - lf * 3, 200);
		g.quadraticCurveTo(0, 290 + lf * 2, 230 + lf * 3, 200);
		g.stroke();
		g.restore();
	}
	const scare = f >= EV.jump && f < EV.jumpEnd;
	return {...POST_NIGHT, hatch: scare ? 0.7 : POST_NIGHT.hatch, ca: f === EV.jump ? 10 : POST_NIGHT.ca, flash: f === EV.jump ? 0.35 : 0};
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
	return {...POST_TITLE, flash: f >= EV.slam && f < EV.slam + 2 ? 0.25 : 0};
};

// ---------------------------------------------------------------- B9 · amanecer (1014–1122)
export const paintB9 = (g: Ctx, f: number): PostOpts => {
	const t = sec(f);
	const lf = f - B.b9[0];
	const rise = -60 * smooth(seg(f, EV.rise0, B.b9[1]));
	const rack = smooth(seg(f, B.b9[0], EV.rack1));
	const sky = g.createLinearGradient(0, 0, 0, 1300);
	sky.addColorStop(0, '#5E6E78');
	sky.addColorStop(0.65, '#b9a27a');
	sky.addColorStop(1, P.gold);
	g.fillStyle = sky;
	g.fillRect(0, 0, W, H);
	glow(g, 760, 1180 - rise, 520, '#ffd98a', 0.45);
	// línea de árboles (silueta)
	g.save();
	g.translate(0, -rise * 0.3);
	g.fillStyle = '#2b2f2e';
	g.beginPath();
	g.moveTo(0, H);
	for (let x = 0; x <= W; x += 30) g.lineTo(x, 1120 - Math.abs(noise2D('tl', x * 0.006, 0)) * 360 - (hash(Math.floor(x / 90), 3) > 0.7 ? 160 : 0));
	g.lineTo(W, H);
	g.fill();
	g.restore();
	for (let k = 0; k < 3; k++) fogBand(g, {y0: 980 + k * 120 - lf * (0.6 + k * 0.4), y1: 1260 + k * 120 - lf * (0.6 + k * 0.4), color: '#e8e0cc', t: t + k * 4, seed: 70 + k, alpha: 0.35 * (1 - seg(f, B.b9[0], B.b9[1]) * 0.6), speed: 8 + k * 4});
	// camino de tierra en primer plano
	g.save();
	g.translate(0, -rise);
	const dirt = g.createLinearGradient(0, 1250, 0, H);
	dirt.addColorStop(0, '#6a5038');
	dirt.addColorStop(1, '#2e2014');
	g.fillStyle = dirt;
	g.beginPath();
	g.moveTo(0, 1300);
	g.quadraticCurveTo(540, 1230, W, 1290);
	g.lineTo(W, H + 100);
	g.lineTo(0, H + 100);
	g.fill();
	// mano con el ramo SECO (desaturado, pétalos rizados)
	const hand: HandPose = {x: 380, y: 1640, rot: 1.2, s: 2.0, side: 'R', view: 'dorsal', skin: SKIN_POV, curl: [0.85, 0.9, 0.9, 0.9], thumb: 0.8, forearm: 600};
	sleeve(g, hand, 180);
	for (let i = 0; i < 14; i++) petal(g, 560 + (hash(i, 1) - 0.5) * 160, 1500 + (hash(i, 2) - 0.5) * 120, hash(i, 3) * 6, 34, P.cempa, 0.9);
	drawHand(g, hand);
	wristBand(g, hand, {wraps: 0, bare: 1});
	// pétalos secos que se desmoronan y vuelan
	for (let i = 0; i < 10; i++) {
		const st = (hash(i, 9) * 3 + lf / 30) % 3;
		petal(g, 600 + st * 220 + Math.sin(st * 3 + i) * 30, 1480 - st * 160 + Math.cos(st * 2 + i) * 40, st * 4 + i, 18, P.cempa, 1, 1 - st / 3);
	}
	g.restore();
	void rack;
	const fadeIn = 1 - Math.exp(-5 * seg(f, B.b9[0], EV.dawnIn1));
	return {...POST_DAWN, hatch: 0.5 * (1 - seg(f, B.b9[0], B.b9[1])), fade: 1 - fadeIn};
};

// ---------------------------------------------------------------- B10–B11 · la piedra vista desde arriba
// coordenadas de la cara superior (u, v) = espacio del «8» del rótulo − (540, 930): a zoom 1 el listón ES el glifo
const topDown = (g: Ctx, f: number, o: {zoom: number; rot: number; dim?: number; liston?: boolean}) => {
	const t = sec(f);
	fillBg(g, '#3a3226');
	g.save();
	g.translate(OCHO_CX, OCHO_CY);
	g.rotate(o.rot);
	g.scale(o.zoom, o.zoom);
	// suelo: tierra húmeda
	g.fillStyle = '#4a3c2a';
	g.fillRect(-2000, -2600, 4000, 5200);
	// piedra
	const gr = g.createRadialGradient(-120, -160, 60, 0, 0, 700);
	gr.addColorStop(0, '#7d8679');
	gr.addColorStop(0.7, '#556055');
	gr.addColorStop(1, '#2c332c');
	g.fillStyle = 'rgba(20,14,8,0.5)';
	g.beginPath();
	smoothPath(g, STONE.map(([u, v]) => [u * 1.05 + 30, v * 1.05 + 40] as [number, number]), true);
	g.fill();
	g.fillStyle = gr;
	g.beginPath();
	smoothPath(g, STONE, true);
	g.fill();
	// huellas en anillos
	for (const p of PRINTS.rings) footprint(g, p.u, p.v, p.a, 72, 1, p.side, 0, 0, 0.85);
	// pétalos secos en anillo
	for (const pr of PETAL_RING) petal(g, pr.u, pr.v, pr.a, pr.s, pr.tone > 0.5 ? P.gold : P.cempa, 0.75);
	g.translate(-OCHO_CX, -OCHO_CY);
	if (o.liston !== false) ribbon(g, [...OCHO, OCHO[0]], {w: 18, shadow: 0.6});
	g.restore();
	void t;
};

export const paintB10 = (g: Ctx, f: number): PostOpts => {
	const t = sec(f);
	const u = seg(f, B.b10[0], B.b10[1]);
	const e = 1 - Math.pow(1 - u, 3);
	topDown(g, f, {zoom: lerp(0.78, 0.7, e), rot: lerp(8, 0, e) * (Math.PI / 180)});
	// rayo de sol dorado que entra entre los troncos
	beamFx(g, -120, 200, 520, 1000, 80, 520, '#ffd98a', 0.22 + 0.04 * Math.sin(t * 2));
	return {...POST_DAWN, hatch: 0.12};
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
	// remate: huellas que caminan hacia la cámara
	if (f >= EV.prints0) {
		const n = Math.min(8, Math.floor((f - EV.prints0) / 3.6) + 1);
		for (let i = 0; i < n; i++) footprint(g, 900 - i * 34 + (i % 2) * 40, 1600 + i * 30, 2.6, 46 + i * 7, 0.55, i % 2 ? 1 : -1, 0.6, 0.4, 0.95);
	}
	if (f >= EV.eyes2) eyePair(g, 190, 1660, 11, {open: clamp((f - EV.eyes2) / 2) * blink(f, EV.eyes2 + 4)});
	// palmada de lodo en el lente (abajo a la izquierda, fuera del texto)
	let kick = 0;
	if (f >= EV.slap) {
		const slide = 30 * smooth(seg(f, EV.slap + 2, B.b12[1]));
		kick = f === EV.slap ? 14 : 0;
		g.save();
		g.translate(230, 1660 + slide);
		g.fillStyle = rgba('#3a2410', 0.92);
		g.beginPath();
		g.ellipse(0, 40, 90, 80, 0, 0, Math.PI * 2);
		for (let k = 0; k < 4; k++) {
			const a = -2.3 + k * 0.42;
			g.ellipse(Math.cos(a) * 130, 20 + Math.sin(a) * 130, 22, 70, a + Math.PI / 2, 0, Math.PI * 2);
		}
		g.fill();
		g.restore();
	}
	return {...POST_TITLE, hatch: 0.12, bloom: 0.75, ...(kick ? {ca: 6} : {})};
};

void mixRGB;
void spr;
void S;
