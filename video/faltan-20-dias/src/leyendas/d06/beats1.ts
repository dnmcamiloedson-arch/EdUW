// G1 · 0–14.5 s (frames 0–435): gancho (vaho y ojo), el cuarto, tijeras en cruz, el fogón, ignición + título.
import {E, clamp, hash, lerp, ramp, rgba} from '../../lib/util';
import {blurred, glow, type Ctx} from '../kit/paint';
import {paintShape, vgrad} from '../kit/shade';
import {chainAt, simChain, smoothPath, type V2} from '../kit/rig';
import type {PostOpts} from '../kit/post';
import {paintEyeECU} from './abuela';
import {HUT} from './exterior';
import {paintShadowPuppet} from './puppet';
import type {Light} from './light';
import {orbShare} from './light';
import {ignite, paintOrb, sparkBurst} from './orb';
import {espejo, mixPost} from './post';
import {abuelaPose, orbPos, scissorsHand} from './poses';
import {paintVeladora, RW, roomCanvas} from './room';
import {EV, FPS, P} from './timeline';
import {candleK, candleLight, compose, paintRoomScene, SCISSORS_X} from './world';

// tijeras: estado en función del frame (en la mano 192–227, paradas en la repisa desde el tock 228)
export const scissorsState = (f: number) => {
	if (f < EV.scissorsLift) return null;
	const u = clamp((f - EV.scissorsOpen) / 15);
	const open = u <= 0 ? 0 : Math.min(1.045, 1 - Math.pow(1 - u, 3) + 0.12 * Math.sin(u * Math.PI) * (1 - u));
	const hand = scissorsHand(f);
	if (hand) return {open, held: [hand[0] - 2, hand[1] + 34] as [number, number]};
	return {open: 1};
};

// ---------- gancho 0–66 ----------
const fogHook = (f: number) => {
	const u = E.out(clamp((f - EV.breathHook) / 15));
	return {x: 540, y: 900, r: 560 * u + 1, a: 0.88 * clamp((f - EV.breathHook) / 3)};
};
// recorrido del rebozo sobre el vidrio: arco que sube de abajo-izquierda a arriba-derecha
const WIPE: [V2, V2, V2] = [
	[-180, 1480],
	[330, 760],
	[1280, 420],
];
const wipeAt = (u: number): {p: V2; a: number} => {
	const [p0, p1, p2] = WIPE;
	const x = (1 - u) * (1 - u) * p0[0] + 2 * (1 - u) * u * p1[0] + u * u * p2[0];
	const y = (1 - u) * (1 - u) * p0[1] + 2 * (1 - u) * u * p1[1] + u * u * p2[1];
	const dx = 2 * (1 - u) * (p1[0] - p0[0]) + 2 * u * (p2[0] - p1[0]);
	const dy = 2 * (1 - u) * (p1[1] - p0[1]) + 2 * u * (p2[1] - p1[1]);
	return {p: [x, y], a: Math.atan2(dy, dx)};
};
const wipeU = (f: number) => {
	const k = (f - EV.wipe1[0]) / (EV.wipe1[1] - EV.wipe1[0]);
	return k <= 0 ? k * 0.4 : k >= 1 ? 1 + (k - 1) * 0.6 : E.inOut(k);
};
// máscara destination-out del trazo (con orillas rayadas, como deja la tela)
const wipeMask = (q: Ctx, f: number) => {
	const u1 = clamp(wipeU(f));
	if (u1 <= 0) return;
	q.save();
	q.globalCompositeOperation = 'destination-out';
	q.lineCap = 'round';
	q.lineJoin = 'round';
	const N = Math.max(2, Math.ceil(u1 * 40));
	const pts: V2[] = [];
	for (let i = 0; i <= N; i++) pts.push(wipeAt((i / N) * u1).p);
	const stroke = (w: number, off: number, a: number) => {
		q.strokeStyle = `rgba(0,0,0,${a})`;
		q.lineWidth = w;
		q.beginPath();
		pts.forEach((p, i) => {
			const nx = i < pts.length - 1 ? -(pts[i + 1][1] - p[1]) : -(p[1] - pts[i - 1][1]);
			const ny = i < pts.length - 1 ? pts[i + 1][0] - p[0] : p[0] - pts[i - 1][0];
			const L = Math.hypot(nx, ny) || 1;
			const x = p[0] + (nx / L) * off;
			const y = p[1] + (ny / L) * off;
			if (i) q.lineTo(x, y);
			else q.moveTo(x, y);
		});
		q.stroke();
	};
	stroke(330, 0, 1);
	for (let k = 0; k < 14; k++) stroke(6 + hash(k, 5) * 16, (k < 7 ? -1 : 1) * (170 + hash(k, 6) * 46), 0.35 + hash(k, 7) * 0.4);
	q.restore();
};
// esquina del rebozo (de cerca, nítida sobre el vidrio) con 8 barbas en simChain
const CLOTH: V2[] = [
	[150, -10],
	[70, -150],
	[-420, -290],
	[-640, 160],
	[-260, 300],
	[120, 140],
];
const clothXf = (f: number) => {
	const w = wipeAt(wipeU(f));
	// la tela se tuerce un poco al arrancar y frenar
	return {p: w.p, a: w.a + 0.25 * Math.sin(clamp((f - EV.wipe1[0]) / 20) * Math.PI)};
};
const toW = (xf: {p: V2; a: number}, q: V2): V2 => [xf.p[0] + q[0] * Math.cos(xf.a) - q[1] * Math.sin(xf.a), xf.p[1] + q[0] * Math.sin(xf.a) + q[1] * Math.cos(xf.a)];
const hookFringe = (f: number) => {
	const out: V2[][] = [];
	for (let i = 0; i < 8; i++) {
		const t = i / 7;
		const local: V2 = [lerp(150, 120, t) + 4, lerp(-10, 140, t)];
		const data = simChain({key: `d06hookfr${i}`, frames: 80, n: 7, seg: 16, gravity: 0.6, damping: 0.9, dir: [1, 0.3], anchor: (ff) => toW(clothXf(ff), local)});
		out.push(chainAt(data, 7, f));
	}
	return out;
};
const paintWipeCloth = (q: Ctx, f: number) => {
	const k = (f - EV.wipe1[0]) / (EV.wipe1[1] - EV.wipe1[0]);
	if (k < -0.3 || k > 1.25) return;
	const drawAt = (ff: number, alpha: number) => {
		const xf = clothXf(ff);
		q.save();
		q.globalAlpha = alpha;
		q.translate(xf.p[0], xf.p[1]);
		q.rotate(xf.a);
		const path = (g: Ctx) => smoothPath(g, CLOTH, true, 0.45);
		paintShape(q, path, [-660, -310, 830, 630], {fill: vgrad('#c4502e', '#4a1609', P.terra), light: -Math.PI / 2, rim: {color: '#F5B04A', width: 12, alpha: 0.55}, shadow: {color: '#1a0603', width: 90, alpha: 0.75}, texture: {seed: 5, alpha: 0.28, scale: 1.4}}, 0.5);
		q.save();
		q.beginPath();
		path(q);
		q.clip();
		for (const [y, w, c, a] of [
			[-120, 34, P.green, 0.9],
			[-92, 5, P.bone, 0.4],
			[-148, 5, P.bone, 0.4],
			[60, 40, P.green, 0.9],
			[94, 6, P.bone, 0.35],
			[200, 12, P.green, 0.7],
		] as [number, number, string, number][]) {
			q.strokeStyle = rgba(c, a);
			q.lineWidth = w;
			q.beginPath();
			q.moveTo(-700, y + 40);
			q.bezierCurveTo(-400, y - 10, -100, y + 20, 200, y - 6);
			q.stroke();
		}
		// pliegues de la tela apretada contra el vidrio
		q.lineWidth = 14;
		for (let i = 0; i < 6; i++) {
			q.strokeStyle = 'rgba(25,6,2,0.3)';
			q.beginPath();
			q.moveTo(-600 + i * 110, -300);
			q.quadraticCurveTo(-520 + i * 120, 0, -560 + i * 130, 320);
			q.stroke();
		}
		q.restore();
		q.restore();
	};
	// desenfoque direccional barato: dos ecos hacia atrás del movimiento
	drawAt(f - 1.2, 0.25);
	drawAt(f - 0.6, 0.4);
	drawAt(f, 1);
	q.lineCap = 'round';
	for (const ch of hookFringe(f)) {
		q.strokeStyle = '#5a1a0e';
		q.lineWidth = 6;
		q.beginPath();
		smoothPath(q, ch, false);
		q.stroke();
		q.strokeStyle = 'rgba(245,176,74,0.35)';
		q.lineWidth = 2;
		q.stroke();
	}
};

export const EYE = {x: 480, y: 830, s: 1.1};
export const STAR = {x: 880, y: 640};
const starAt = (f: number) => {
	if (f < EV.star[0]) return null;
	const df = f - EV.star[0];
	const rise = E.out(clamp(df / 9));
	const sink = E.in(clamp((f - (EV.star[1] - 2)) / 8));
	const a = clamp(df / 3) * (1 - sink);
	if (a <= 0.01) return null;
	return {x: STAR.x + 6 * rise, y: STAR.y + 60 - 60 * rise + 50 * sink, a, pulse: 0.75 + 0.25 * Math.sin(df * 1.4)};
};

export const paintHook = (g: Ctx, f: number): PostOpts => {
	const t = f / FPS;
	const blinkK = f >= EV.blink && f < EV.blink + 9 ? (f < EV.blink + 4 ? 1 - (f - EV.blink + 1) / 4 : (f - EV.blink - 3) / 5) : 1;
	const st = starAt(f);
	const ck = candleK(f);
	const lights: Light[] = [candleLight(ck * clamp(f / 3))];
	if (st) lights.push({x: st.x, y: st.y, r: 34, color: P.cempa, a: st.a * st.pulse, kind: 'orb'});
	// a 1.9 s empieza a echarse para atrás
	const back = E.inOut(clamp((f - 57) / 12));
	compose(g, f, {
		lights,
		world: () => {
			// cuarto lejano, muy desenfocado
			const b = blurred(roomCanvas(), 16, 'd06:roomFar2');
			g.save();
			g.globalAlpha = 0.85 * clamp((f - 1) / 3);
			g.drawImage(b.canvas, RW.x - b.pad, RW.y - b.pad);
			g.restore();
			// la luz que se suelta del cerro (subliminal)
			if (st) {
				glow(g, st.x, st.y, 46, P.cempa, 0.8 * st.a * st.pulse);
				glow(g, st.x, st.y, 10, P.core, st.a);
			}
			paintVeladora(g, t, {blur: 22, flame: ck});
			// el ojo de la madre a 15 cm
			paintEyeECU(g, {cx: EYE.x + 30 * back, cy: EYE.y - 10 * back, s: EYE.s * (1 - 0.06 * back), lid: blinkK, light: 'candle', a: clamp((f - 2) / 4), look: 0.15 * Math.sin(t * 0.9)});
		},
		fog: {t, puffs: [fogHook(f)], wipe: (q) => wipeMask(q, f), veil: 0.62},
		onGlass: (q) => paintWipeCloth(q, f),
	});
	return espejo({exposure: lerp(0.35, 1, clamp(f / 5)), orb: orbShare(lights) * 0.3});
};

// ---------- el cuarto 66–177 ----------
export const paintRoom = (g: Ctx, f: number): PostOpts => {
	const t = f / FPS;
	const ck = candleK(f);
	const u = E.in(clamp((f - 66) / 20));
	compose(g, f, {
		lights: [candleLight(ck)],
		world: () => {
			paintRoomScene(g, {f, focus: 0, abuela: abuelaPose(f), cradle: {f}});
			// la cara se retira hacia la derecha mientras ella se voltea
			if (u < 1) paintEyeECU(g, {cx: lerp(EYE.x + 30, 1500, u), cy: lerp(EYE.y - 10, 760, u), s: EYE.s * lerp(0.94, 1.2, u), lid: 1, light: 'candle', a: 1 - u});
		},
	});
	void t;
	return espejo({});
};

// ---------- tijeras en cruz 177–270 ----------
export const paintScissorsBeat = (g: Ctx, f: number): PostOpts => {
	const ck = candleK(f);
	const sc = scissorsState(f);
	const flash = f >= EV.scissorsOpen && f < EV.scissorsOpen + 6 ? 1 - (f - EV.scissorsOpen) / 6 : 0;
	compose(g, f, {
		lights: [candleLight(ck)],
		world: () => paintRoomScene(g, {f, focus: ramp(f, [240, 270], [0, 0.4]), abuela: abuelaPose(f), cradle: {f}, scissors: sc ? {...sc, flash: flash * 0.4} : null}),
	});
	return espejo({});
};

// ---------- el fogón 270–360 ----------
export const paintFogon = (g: Ctx, f: number): PostOpts => {
	const ck = candleK(f) * ramp(f, [270, 290], [1, 0.88]);
	const focus = ramp(f, [270, 300], [0.4, 1]);
	compose(g, f, {
		lights: [candleLight(ck), {x: HUT.x + 14, y: HUT.y - 14, r: 50, color: P.cempa, a: 0.6, kind: 'spark'}],
		world: () =>
			paintRoomScene(g, {
				f,
				focus,
				ext: {hut: 1 + 0.4 * ramp(f, EV.shadowArms, [0, 1])},
				outside: (q) => paintShadowPuppet(q, f),
				abuela: abuelaPose(f),
				cradle: {f},
				scissors: {open: 1},
				candle: {k: ck},
			}),
	});
	return espejo({exposure: ramp(f, [270, 290], [1, 0.85])});
};

// ---------- ignición + título 360–435 ----------
export const firstOrb = (f: number) => {
	const df = f - EV.ignite;
	const r = df < 24 ? ignite(df, 25) * E.out(clamp(df / 24)) : 25;
	const [x, y] = orbPos(0, f);
	const [px, py] = orbPos(0, f - 1);
	return {x, y, r, vx: x - px, vy: y - py};
};

export const paintTitleBeat = (g: Ctx, f: number): PostOpts => {
	const t = f / FPS;
	const ck = candleK(f) * 0.88;
	const flare = f >= EV.collapse && f < EV.collapse + 8 ? 2 - (f - EV.collapse) / 8 : 0;
	const o = f >= EV.ignite ? firstOrb(f) : null;
	const lights: Light[] = [candleLight(ck)];
	if (o) lights.push({x: o.x, y: o.y, r: o.r * 3, color: P.cempa, a: 1, kind: 'orb'});
	compose(g, f, {
		lights,
		world: () => {
			paintRoomScene(g, {
				f,
				focus: 1,
				ext: {hut: f < EV.collapse ? 1.4 : flare},
				outside: (q) => {
					if (f < EV.collapse + 4) paintShadowPuppet(q, Math.min(f, EV.fray[1]), {collapse: clamp((f - EV.collapse + 1) / 4)});
					if (o) {
						paintOrb(q, {...o, t, seed: 1, eyes: f % 23 === 0 ? 1 : 0});
						sparkBurst(q, HUT.x, HUT.y - HUT.h - 4, f - EV.ignite, 24, 7, 0.5);
					}
				},
				abuela: abuelaPose(f),
				cradle: {f},
				scissors: {open: 1},
				candle: {k: ck},
			});
			// escrim radial del rótulo
			g.save();
			const rg = g.createRadialGradient(540, 1260, 40, 540, 1260, 620);
			rg.addColorStop(0, rgba(P.ink, 0.55 * clamp((f - 360) / 8)));
			rg.addColorStop(1, rgba(P.ink, 0));
			g.fillStyle = rg;
			g.fillRect(-80, 600, 1240, 1300);
			g.restore();
		},
	});
	const share = orbShare(lights);
	return mixPost(espejo({orb: share, exposure: 0.9}), {bloom: 0.7, bloomThr: 0.6, vignette: 0.8, hatch: 0.15}, clamp((f - 360) / 8));
};
