// Día 8 · G1 (frames 0–522): B1 piedra · B2 memoria · B3 bajada al río · B4 el río.
// ESQUELETO (etapa 1): entorno, luz y cámara bloqueados; los detalles finos llegan en la etapa G1.
import {noise2D} from '@remotion/noise';
import {H, W, clamp, hash, lerp, rgba} from '../../lib/util';
import {cached, fogBand, glow, makeCanvas, type Ctx} from '../kit/paint';
import {flame2D, marigold, smoke} from '../kit/fx';
import type {PostOpts} from '../kit/post';
import type {Cam} from '../kit/stage';
import {P, S, beamAt, beamCone, beamWarm, blink, darkMap, eyePair, fillBg, litPlane, petal, ring, seg, smooth, spr, torch, vignetteOval, type Beam, type V2} from './core';
import {beamFog, edgeRoot, frond} from './fx8';
import {camPt, stoneM, stonePOVAlbedo, stonePOVMoon, type PrintSet, type StoneCam} from './stone';
import {drawSprite, fern} from './flora';
import {SKIN_ABU, SKIN_KID, SKIN_POV, drawHand, sleeve, wristBand, type HandPose} from './hands';
import {EYE_H, VIEW0, forestLayout, forestScene, planeXf, type View} from './forest';
import {B, EV, POST_MEMORY, POST_NIGHT} from './timeline';

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
	return {...POST_NIGHT, flash: smooth(bloom) * 0.95, bloom: POST_NIGHT.bloom! + bloom * 0.6};
};

// ---------------------------------------------------------------- B2 · memoria (90–246)
const hule = () =>
	cached('d8hule', () => {
		const c = makeCanvas(W + 200, H + 200);
		const g = c.getContext('2d')!;
		g.fillStyle = '#d8c6a0';
		g.fillRect(0, 0, c.width, c.height);
		// estampado floral (muy simple: el detalle llega en G1)
		for (let y = 0; y < c.height; y += 150) {
			for (let x = (y / 150) % 2 ? 75 : 0; x < c.width; x += 150) {
				g.fillStyle = 'rgba(31,92,72,0.45)';
				for (let k = 0; k < 5; k++) {
					const a = (k / 5) * Math.PI * 2;
					g.beginPath();
					g.ellipse(x + Math.cos(a) * 18, y + Math.sin(a) * 18, 16, 9, a, 0, Math.PI * 2);
					g.fill();
				}
				g.fillStyle = 'rgba(168,58,37,0.55)';
				g.beginPath();
				g.arc(x, y, 11, 0, Math.PI * 2);
				g.fill();
			}
		}
		return c;
	});

const ABU_R = (lf: number): HandPose => ({x: 700 + Math.sin(lf * 0.13) * 40, y: 1010 + Math.cos(lf * 0.13) * 30, rot: -2.2, s: 1.55, side: 'R', view: 'dorsal', skin: SKIN_ABU, engraved: 1, ring: true, curl: [0.5, 0.55, 0.6, 0.6], thumb: 0.5, forearm: 320});
const ABU_L = (lf: number): HandPose => ({x: 380 - Math.sin(lf * 0.13) * 30, y: 1060 - Math.cos(lf * 0.13) * 20, rot: 2.0, s: 1.5, side: 'L', view: 'dorsal', skin: SKIN_ABU, engraved: 1, curl: [0.45, 0.5, 0.55, 0.6], thumb: 0.4, forearm: 320});

export const paintB2 = (g: Ctx, f: number): PostOpts => {
	const t = sec(f);
	const lf = f - B.b2[0];
	const u = seg(f, B.b2[0], B.b2[1]);
	const zoom = 1 + 0.06 * (0.5 - 0.5 * Math.cos(Math.PI * u));
	const weave = {x: Math.sin(t * 0.8 * Math.PI * 2) * 1.5, y: Math.cos(t * 0.8 * Math.PI * 2 + 1) * 1.5};
	fillBg(g, P.bg);
	g.save();
	g.translate(W / 2 + weave.x, H / 2 + weave.y);
	g.scale(zoom, zoom);
	g.translate(-W / 2, -H / 2);
	g.drawImage(hule(), -100, -100);
	// pétalos sueltos y jarro (bloque)
	for (let i = 0; i < 7; i++) petal(g, 160 + hash(i, 3) * 760, 1450 + hash(i, 4) * 260, hash(i, 5) * 6, 26, i % 2 ? P.cempa : P.gold);
	g.fillStyle = '#7a3a22';
	g.beginPath();
	g.ellipse(210, 640, 110, 100, 0, 0, Math.PI * 2);
	g.fill();
	// sombra del péndulo (2 s de periodo)
	const sw = Math.sin((t - sec(B.b2[0])) * Math.PI) * 0.35;
	g.save();
	g.translate(540, -200);
	g.rotate(sw);
	g.fillStyle = 'rgba(35,19,5,0.25)';
	g.fillRect(-14, 0, 28, 1500);
	g.beginPath();
	g.arc(0, 1500, 70, 0, Math.PI * 2);
	g.fill();
	g.restore();
	// muñeca joven (palma arriba) con el listón
	const kid: HandPose = {x: 540, y: 1180, rot: -0.35, s: 1.6, side: 'L', view: 'palm', skin: SKIN_KID, curl: [0.25, 0.22, 0.25, 0.3], thumb: 0.2, forearm: 420, spread: 0.25};
	sleeve(g, kid, 180, '#2b2622', '#3a342e');
	drawHand(g, kid);
	wristBand(g, kid, {wraps: 2 * seg(f, EV.wrap0, EV.wrap1), knot: seg(f, EV.wrap1, EV.knot1), tails: 1});
	// manos de la abuela (bloque de movimiento)
	const lift = smooth(seg(f, EV.lift0, B.b2[1]));
	const r = ABU_R(lf);
	const l = ABU_L(lf);
	const part = smooth(seg(f, EV.wrap1, EV.knot1)) * (1 - smooth(seg(f, EV.knot1, EV.knot1 + 12)));
	l.x -= part * 120;
	r.x += part * 120;
	const pat = Math.max(0, 1 - Math.abs(f - EV.pat1) / 3) + Math.max(0, 1 - Math.abs(f - EV.pat2) / 3);
	r.y += pat * 14 - lift * 900;
	l.y -= lift * 900;
	l.x -= seg(f, EV.knot1, EV.knot1 + 20) * 400;
	drawHand(g, l);
	drawHand(g, r);
	// veladora
	const vx = 860;
	const vy = 520;
	g.fillStyle = 'rgba(230,210,170,0.25)';
	g.fillRect(vx - 60, vy - 40, 120, 190);
	flame2D(g, vx, vy, 16, t, 4);
	g.restore();
	// luz que respira de la vela + viñeta ovalada
	const br = 0.9 + 0.1 * noise2D('vel', t * 3, 0);
	g.save();
	g.globalCompositeOperation = 'soft-light';
	const lg = g.createRadialGradient(860, 520, 40, 700, 900, 1300);
	lg.addColorStop(0, rgba(P.gold, 0.75 * br));
	lg.addColorStop(1, rgba(P.bg, 0.9));
	g.fillStyle = lg;
	g.fillRect(0, 0, W, H);
	g.restore();
	glow(g, 860, 500, 300, P.gold, 0.25 * br);
	// fuga de luz dorada (5.0–7.0 s)
	const lk = seg(f, EV.leak0, EV.leak1);
	if (lk > 0 && lk < 1) glow(g, lerp(-200, 1300, lk), 900, 700, '#ffcf7a', 0.22 * Math.sin(lk * Math.PI));
	vignetteOval(g, 0.85, '#120803', 0.3);
	// humo de la veladora que se lleva el recuerdo
	const sm = seg(f, EV.smoke0, B.b2[1]);
	if (sm > 0) smoke(g, {x: 640, y: 1800, h: 1900, w: 1200, t, seed: 5, color: '#e8dcc4', alpha: 0.7 * sm});
	return {...POST_MEMORY, flash: 1 - smooth(seg(f, B.b2[0], B.b2[0] + 12))};
};

// ---------------------------------------------------------------- B3 · bajé al río (246–348)
const B3_LAYOUT = () => forestLayout('b3', 3, [16000, 9000, 5200, 3000, 1800], {ferns: 8});
const skyNight = (g: Ctx, top: string, bot: string, moonX: number, moonY: number, moonA = 1) => {
	const gr = g.createLinearGradient(0, 0, 0, H);
	gr.addColorStop(0, top);
	gr.addColorStop(1, bot);
	g.fillStyle = gr;
	g.fillRect(0, 0, W, H);
	if (moonA > 0) {
		glow(g, moonX, moonY, 260, '#9fc4c0', 0.25 * moonA);
		g.fillStyle = rgba('#e6ecdf', 0.9 * moonA);
		g.beginPath();
		g.arc(moonX, moonY, 26, 0, Math.PI * 2);
		g.fill();
		g.fillStyle = top;
		g.beginPath();
		g.arc(moonX + 11, moonY - 5, 24, 0, Math.PI * 2);
		g.fill();
	}
};
export const paintB3 = (g: Ctx, f: number): PostOpts => {
	const t = sec(f);
	const lt = t - sec(B.b3[0]);
	const step = Math.sin(lt * 1.8 * Math.PI * 2);
	const tilt = spr(t - sec(EV.tiltDown), 220, 18);
	const cam: Cam = {x: 0, y: Math.abs(step) * 6, z: lt * 280, zoom: 1};
	const view: View = {yaw: noise2D('b3y', lt * 0.35, 0) * 20, pitch: -260 * tilt + 120, roll: step * 0.008};
	skyNight(g, '#0b1d26', '#1c3a3e', 820 + view.yaw * 0.2, 420 + view.pitch, 1);
	const dark = darkMap({x: 0, y: 0, r: 1, power: 0}, 0.5, '#081a20');
	forestScene(g, {cam, view, t, layout: B3_LAYOUT(), dark, fogColor: '#3a5a60', moon: 1, fogBands: 0.4});
	// mata de cempasúchil silvestre en la orilla (el único color cálido)
	litPlane(g, darkMap({x: 0, y: 0, r: 1, power: 0}, 0.25, '#081a20'), (q) =>
		planeXf(q, cam, view, 1300, () => {
			const pick = seg(f, EV.snap, EV.pick1);
			for (let i = 0; i < 9; i++) {
				const gone = i < 3 && f >= EV.snap ? 1 : 0;
				if (gone) continue;
				const sw = ring(t - sec(EV.snap), 2.2, 0.8) * 0.15 * (i % 2 ? 1 : -1);
				const bx = 120 + (i - 4) * 70;
				const by = EYE_H - 240 - hash(i, 5) * 160;
				q.strokeStyle = '#2f4a22';
				q.lineWidth = 7;
				q.beginPath();
				q.moveTo(bx, EYE_H + 40);
				q.quadraticCurveTo(bx + sw * 200, (by + EYE_H) / 2, bx + sw * 300, by);
				q.stroke();
				marigold(q, bx + sw * 300, by, 34 + hash(i, 6) * 10, i, i);
			}
			void pick;
		}),
	);
	// mano izquierda con el listón que corta tres tallos
	const hk = seg(f, EV.pick0, EV.snap);
	const out = seg(f, EV.snap + 3, EV.pick1);
	if (hk > 0 && out < 1) {
		const hand: HandPose = {x: lerp(-60, 420, smooth(hk)) - out * 500, y: lerp(1900, 1450, smooth(hk)) + out * 300, rot: 0.5, s: 1.7, side: 'L', view: 'dorsal', skin: SKIN_POV, curl: f >= EV.snap ? [0.9, 0.9, 0.9, 0.9] : [0.3, 0.3, 0.35, 0.4], thumb: f >= EV.snap ? 0.8 : 0.3, forearm: 520};
		sleeve(g, hand, 150);
		drawHand(g, hand);
		wristBand(g, hand, {wraps: 2, knot: 1, tails: 1, dim: 0.7});
	}
	// el humo del recuerdo se vuelve niebla (disolución de entrada)
	const dis = 1 - seg(f, B.b3[0], EV.smoke1);
	if (dis > 0) {
		g.fillStyle = rgba('#3a2a1a', dis * 0.85);
		g.fillRect(0, 0, W, H);
		smoke(g, {x: 540, y: 1900, h: 2000, w: 1300, t, seed: 5, color: '#cfc4b0', alpha: 0.8 * dis});
	}
	return {...POST_NIGHT, hatch: 0.45};
};

// ---------------------------------------------------------------- B4 · el río (348–522)
const B4_BEHIND = () => forestLayout('b4behind', 11, [9000, 4200, 2200], {ferns: 6});
const reflSky = (f: number, lf: number) => {
	const c = cached('d8reflsky', () => makeCanvas(W, H));
	const g = c.getContext('2d')!;
	g.setTransform(1, 0, 0, 1, 0, 0);
	skyNight(g, '#163338', '#0a1517', 540, 300, 0.8);
	// copas de árboles (silueta)
	g.fillStyle = '#05090a';
	g.beginPath();
	g.moveTo(0, 0);
	for (let x = 0; x <= W; x += 40) g.lineTo(x, 380 + noise2D('can', x * 0.004, 0) * 160 + Math.abs(x - 540) * 0.25);
	g.lineTo(W, 0);
	g.fill();
	// cabeza encapuchada del narrador (al centro) y, detrás de su hombro, el chaneque
	const yl = 1056;
	g.fillStyle = '#040707';
	g.beginPath();
	g.ellipse(540, yl - 300, 150, 190, 0, 0, Math.PI * 2);
	g.moveTo(300, yl);
	g.quadraticCurveTo(540, yl - 260, 780, yl);
	g.fill();
	if (f >= EV.refl0 && f < EV.whipTurn) {
		const tilt = f >= EV.reflTilt ? 0.21 * spr((f - EV.reflTilt) / 30, 900, 30) : 0;
		g.save();
		g.translate(780, yl - 170);
		g.rotate(tilt);
		g.fillStyle = '#050808';
		g.beginPath();
		g.ellipse(0, 0, 62, 58, 0, 0, Math.PI * 2);
		g.ellipse(0, -40, 120, 22, 0, 0, Math.PI * 2);
		g.fill();
		eyePair(g, 0, 6, 5, {alpha: 0.95, spread: 3.2});
		g.restore();
	}
	void lf;
	return c;
};
export const paintB4 = (g: Ctx, f: number): PostOpts => {
	const t = sec(f);
	const lf = f - B.b4[0];
	const turn = f < EV.whipBack ? spr(t - sec(EV.whipTurn), 180, 16) : 1 - spr(t - sec(EV.whipBack), 180, 16);
	const pan = turn * 1500;
	const breath = {x: noise2D('b4x', t * 0.25, 0) * 6, y: noise2D('b4y', 0, t * 0.25) * 5};
	const held = f >= EV.whipBack;
	const beam: Beam = held
		? {x: 400 + spr(t - sec(EV.whipBack) - 0.15, 120, 12) * 0, y: 900 - (1 - spr(t - sec(EV.whipBack) - 0.1, 160, 14)) * 500, r: 520, squash: 0.75, power: torch(f, EV.whipBack, undefined) || 0.95}
		: {x: 360, y: 930, r: 430, squash: 0.62, angle: -0.15, power: 0.9};
	fillBg(g, P.ink);
	const dark = darkMap({...beam, x: beam.x - pan + breath.x, y: beam.y + breath.y}, 0.93);
	// agua quieta con el cielo reflejado (45 % inferior)
	const yl = 1056;
	const ripple = clamp(1 - (t - sec(EV.cup1)) / 1.0) * (f >= EV.cup0 ? 1 : 0);
	const sky = reflSky(f, lf);
	g.save();
	g.translate(-pan + breath.x, breath.y);
	g.save();
	g.translate(0, yl * 2);
	g.scale(1, -1);
	g.globalAlpha = 0.9;
	g.drawImage(sky, 0, 0, W, yl, 0, 0, W, yl);
	g.restore();
	g.fillStyle = rgba('#0a1d20', 0.35 + ripple * 0.2);
	g.fillRect(-200, yl, W + 400, H - yl);
	g.restore();
	// orilla y roca plana (con o sin el ramo)
	litPlane(g, dark, (q) => {
		q.save();
		q.translate(-pan + breath.x, breath.y);
		const gr = q.createLinearGradient(0, 600, 0, yl);
		gr.addColorStop(0, '#16110a');
		gr.addColorStop(1, '#2a2216');
		q.fillStyle = gr;
		q.fillRect(-200, 560, W + 400, yl - 560 + 4);
		q.fillStyle = '#4a4c44';
		q.beginPath();
		q.ellipse(380, 930, 260, 90, -0.05, 0, Math.PI * 2);
		q.fill();
		if (f < EV.whipTurn) for (let i = 0; i < 6; i++) marigold(q, 330 + i * 26, 905 + (i % 2) * 14, 30, i, i);
		if (held) {
			for (let i = 0; i < 9; i++) {
				if (i === 8 && f >= EV.petalPop) continue;
				const px = 470 + i * 70 + (i === 8 ? 0 : 0);
				petal(q, px, 880 - i * 34, i, 22 * (1 - i * 0.07), P.cempa);
			}
			if (f >= EV.petalPop) petal(q, 1080, 600, 1, 15, P.cempa, 0, 0.4);
		}
		// linterna atorada en una piedra (derecha)
		if (!held) {
			q.fillStyle = '#1d1a16';
			q.save();
			q.translate(980, 960);
			q.rotate(-0.12);
			q.fillRect(-90, -22, 180, 44);
			q.restore();
		}
		q.restore();
	});
	// lo que hay detrás (giro de 150°): orilla oscura con contrafuertes y un helecho que aún se mece
	if (turn > 0.02) {
		const cam: Cam = {x: 0, y: 0, z: 0, zoom: 1};
		const view: View = {...VIEW0, yaw: 1500 - pan, pitch: 200};
		forestScene(g, {cam, view, t, layout: B4_BEHIND(), dark: darkMap({x: 0, y: 0, r: 1, power: 0}, 0.9), moon: 1.2, fogBands: 0.2, sway: (i, j) => (i === 2 && j === 1 ? ring(t - sec(EV.whipTurn), 1.6, 1.0) * 0.3 : 0)});
	}
	// manos
	if (f >= EV.cup0 && f < EV.cup1 + 6) {
		const k = smooth(seg(f, EV.cup0, EV.cup0 + 10)) * (1 - smooth(seg(f, EV.cup1 - 6, EV.cup1 + 6)));
		const L: HandPose = {x: 430, y: lerp(2100, 1450, k), rot: 0.35, s: 1.8, side: 'L', view: 'palm', skin: SKIN_POV, curl: [0.45, 0.45, 0.5, 0.55], thumb: 0.4, forearm: 520};
		const R: HandPose = {x: 650, y: lerp(2100, 1450, k), rot: -0.35, s: 1.8, side: 'R', view: 'palm', skin: SKIN_POV, curl: [0.45, 0.45, 0.5, 0.55], thumb: 0.4, forearm: 520};
		sleeve(g, L, 150);
		sleeve(g, R, 150);
		drawHand(g, L);
		drawHand(g, R);
		wristBand(g, L, {wraps: 2, knot: 1, tails: 1, dim: 0.6});
	}
	if (f >= EV.wrist0) {
		const k = smooth(seg(f, EV.wrist0, EV.wrist0 + 20));
		const rot = 0.2 + 0.44 * smooth(seg(f, EV.wrist0, EV.wrist1));
		const L: HandPose = {x: 470, y: lerp(2150, 1250, k), rot, s: 1.9, side: 'L', view: 'dorsal', skin: SKIN_POV, spread: 0.3 + 0.4 * seg(f, EV.wrist0 + 20, EV.wrist1), curl: [0.15, 0.12, 0.15, 0.2], thumb: 0.15, forearm: 560};
		sleeve(g, L, 190);
		drawHand(g, L);
		wristBand(g, L, {wraps: 0, bare: 1});
	}
	beamWarm(g, beam);
	if (held) beamCone(g, 820, 2050, beam, t, 0.06, 4);
	return {...POST_NIGHT, ca: turn > 0.05 && turn < 0.95 ? 3 : POST_NIGHT.ca};
};

export {S};
