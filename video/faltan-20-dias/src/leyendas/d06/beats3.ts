// G3 · 28.8–45 s (frames 864–1350): alimentarse, la abuela despierta (arranca el espejo y latigazo), el rostro,
// EL GOLPE (mano de fuego), amanecer, el aliento revela el 6, lockup + seis luces.
import {noise2D} from '@remotion/noise';
import {E, clamp, hash, lerp, ramp, rgba} from '../../lib/util';
import {glow, type Ctx} from '../kit/paint';
import type {PostOpts} from '../kit/post';
import {shake} from '../kit/stage';
import {paintAbuela, paintEyeECU, paintFingers} from './abuela';
import {CRADLE} from './cradle';
import {paintCrack} from './glass';
import {orbShare, type Light} from './light';
import {mirrorXf, withWorld, HELD} from './mirror';
import {paintOrb, sparkBurst} from './orb';
import {AMANECER, CIFRA, espejo, mixPost, susto} from './post';
import {abuelaDawn, abuelaPose} from './poses';
import {RW, roomCanvas} from './room';
import {carveSix, paintSixEmber, paintSixSolid} from './six';
import {paintFireHand, paintWitchFace} from './face';
import {EV, FPS, LEN, P} from './timeline';
import {candleK, candleLight, compose, paintRoomScene} from './world';

const CRACK = {x: 560, y: 1010};

// ---------- alimentarse 864–936 ----------
const feedOrb = (f: number) => ({x: CRADLE.cx + 10, y: lerp(-160, 80, E.inOut(clamp((f - EV.feed[0]) / (EV.feed[1] - EV.feed[0])))), r: 210});

export const paintFeed = (g: Ctx, f: number): PostOpts => {
	const t = f / FPS;
	const o = feedOrb(f);
	const ck = candleK(f) * 0.75;
	const bundleY = CRADLE.cy - 36;
	const lights: Light[] = [candleLight(ck), {x: o.x, y: o.y + 80, r: 360, color: P.cempa, a: 1, kind: 'orb'}];
	compose(g, f, {
		lights,
		world: () =>
			paintRoomScene(g, {
				f,
				focus: 0,
				abuela: abuelaPose(f),
				scissors: {open: 1},
				candle: {k: ck, lean: -0.3},
				orbPools: [{x: o.x, y: o.y + 300, r: 1000, a: 0.45}],
				cradle: {
					f,
					hand: clamp((f - 880) / 24),
					wriggle: f >= EV.whimper2 && f < EV.whimper2 + 14 ? 0.6 : 0,
					inner: (q) => {
						// siete tentáculos de flama que se detienen a 40 px del bulto (stub)
						q.save();
						q.globalCompositeOperation = 'lighter';
						for (let k = 0; k < 7; k++) {
							const x0 = o.x - 150 + k * 50;
							const tip = [x0 * 0.7 + CRADLE.cx * 0.3 + Math.sin(t * 2 + k) * 14, bundleY - 40 - 20 * Math.abs(k - 3)];
							q.strokeStyle = rgba(P.cempa, 0.6);
							q.lineWidth = 10 - Math.abs(k - 3);
							q.beginPath();
							q.moveTo(x0, o.y + 120);
							q.quadraticCurveTo(x0 + Math.sin(t * 3 + k) * 30, (o.y + tip[1]) / 2 + 60, tip[0], tip[1]);
							q.stroke();
						}
						// motas de energía vital que suben en espiral
						for (let i = 0; i < 14; i++) {
							const u = ((t * 0.5 + hash(i, 4)) % 1);
							const x = CRADLE.cx + Math.sin(u * 9 + i) * 40 * (1 - u);
							const y = lerp(bundleY - 20, o.y + 40, u);
							q.fillStyle = rgba(P.bone, 0.9 * (1 - u));
							q.beginPath();
							q.arc(x, y, 3, 0, Math.PI * 2);
							q.fill();
						}
						q.restore();
					},
				},
				extra: (q) => paintOrb(q, {x: o.x, y: o.y, r: o.r, t, seed: 4, lower: true, pulse: 0.5 + 0.5 * Math.sin(t * 11)}),
			}),
	});
	return espejo({orb: orbShare(lights), attack: 0.8});
};

// ---------- set cercano del clímax (techo oscuro, carrizo, muro) ----------
const paintCloseSet = (g: Ctx) => {
	g.fillStyle = P.floor;
	g.fillRect(RW.x, RW.y, RW.w, RW.h);
	g.save();
	g.translate(540, 760);
	g.scale(2.2, 2.2);
	g.translate(-690, -420);
	g.drawImage(roomCanvas(), RW.x, RW.y);
	g.restore();
	g.save();
	g.globalCompositeOperation = 'multiply';
	g.fillStyle = 'rgba(70,40,22,1)';
	g.fillRect(RW.x, RW.y, RW.w, RW.h);
	g.restore();
};

// ---------- despierta 936–978 ----------
export const paintWake = (g: Ctx, f: number): PostOpts => {
	const t = f / FPS;
	const xf = mirrorXf(f);
	const o = feedOrb(EV.feed[1]);
	const ck = candleK(f) * 0.75;
	const whip = xf.whip;
	const roomA = 1 - E.inOut(clamp(whip));
	const fill = clamp((f - EV.fill[0]) / (EV.fill[1] - EV.fill[0]));
	const near = fill > 0.75 && f < EV.whip[0] ? 1 : 0;
	const lights: Light[] = [candleLight(ck), {x: o.x, y: o.y + 80, r: 360, color: P.cempa, a: 1, kind: 'orb'}];
	compose(g, f, {
		xf,
		lights,
		world: () => {
			if (roomA > 0) {
				g.save();
				g.translate(-1400 * E.in(clamp(whip)), 0);
				g.globalAlpha = roomA;
				paintRoomScene(g, {f, focus: 0, abuela: abuelaPose(f), scissors: {open: 1}, candle: {k: ck}, cradle: {f, hand: 1}, extra: (q) => paintOrb(q, {x: o.x, y: o.y, r: o.r, t, seed: 4, lower: true})});
				g.restore();
			}
			if (whip > 0) {
				g.save();
				g.globalAlpha = E.inOut(clamp(whip));
				g.translate(1400 * (1 - E.out(clamp(whip))), 0);
				paintCloseSet(g);
				paintOrb(g, {x: 540, y: 900, r: 330, t, seed: 4, eyes: 1});
				g.restore();
			}
			if (near) {
				g.fillStyle = 'rgba(8,4,2,0.94)';
				g.fillRect(RW.x, RW.y, RW.w, RW.h);
			}
		},
		above: (q) => paintFingers(q, {k: clamp((f - EV.tearOff + 2) / 6), t}),
	});
	return espejo({orb: orbShare(lights), attack: 0.8, exposure: near ? 0.7 : 1});
};

// ---------- el rostro 978–1026 ----------
export const paintFace = (g: Ctx, f: number): PostOpts => {
	const fr = Math.min(f, EV.freeze); // congelado desde 1014
	const t = fr / FPS;
	const curtain = E.inOut(clamp((fr - EV.faceOpen[0]) / (EV.faceOpen[1] - EV.faceOpen[0])));
	const morph = E.inOut(clamp((fr - EV.morph[0]) / (EV.morph[1] - EV.morph[0])));
	const lunge = E.in(clamp((f - EV.lunge[0]) / (EV.lunge[1] - EV.lunge[0])));
	const s = lerp(1, 3.2, Math.pow(lunge, 3));
	compose(g, f, {
		lights: [{x: 540, y: 900, r: 500, color: P.cempa, a: 1, kind: 'orb'}],
		world: () => {
			paintCloseSet(g);
			g.save();
			g.translate(540, 900);
			g.scale(s, s);
			g.translate(-540, -900);
			paintOrb(g, {x: 540, y: 900, r: 330, t, seed: 4, curtain});
			paintWitchFace(g, {x: 540, y: 900, s: 1.15, morph, a: curtain, t});
			g.restore();
		},
		above: (q) => paintFingers(q, {k: 1, t: f / FPS}),
	});
	return espejo({orb: 1, attack: 1, hatch: 0.3});
};

// hollín en el vidrio desde el golpe hasta que el rebozo lo limpia
const sootOnGlass = (g: Ctx, f: number) => {
	if (f < EV.slam) return;
	const t = f / FPS;
	const df = f - EV.slam;
	const cool = clamp(df / 45);
	const wiped = E.inOut(clamp((f - EV.wipe2[0]) / (EV.wipe2[1] - EV.wipe2[0])));
	const a = 1 - wiped * 0.92;
	if (a > 0.02) {
		paintFireHand(g, {x: CRACK.x, y: CRACK.y + 40, s: 1.6, a, soot: clamp(df / 2), cool, t});
		// rastro del índice (ilegible: corrido, roto por la grieta, velado por humo) — stub
		const drag = clamp((f - EV.drag[0]) / (EV.drag[1] - EV.drag[0]));
		if (drag > 0) {
			g.save();
			g.globalAlpha = a;
			g.filter = 'blur(6px)';
			g.strokeStyle = rgba(P.soot, 0.85);
			g.lineWidth = 60;
			g.lineCap = 'round';
			g.beginPath();
			g.moveTo(CRACK.x - 60, CRACK.y - 260);
			g.quadraticCurveTo(CRACK.x - 260 * drag, CRACK.y - 120 + 200 * drag, CRACK.x - 120 * drag, CRACK.y + 140 * drag);
			g.stroke();
			g.restore();
		}
	}
	const crackA = f < EV.rehang ? 1 : f < EV.fogGone[0] ? 0.7 : 0.35;
	paintCrack(g, CRACK.x, CRACK.y, clamp(df / 4), crackA);
};

// ---------- EL GOLPE 1026–1086 ----------
export const paintSlam = (g: Ctx, f: number): PostOpts => {
	const t = f / FPS;
	const df = f - EV.slam;
	const xf = mirrorXf(f);
	const sh = shake(t, EV.slam / FPS, 30, 0.5);
	const exitU = clamp((f - EV.exit[0]) / (EV.exit[1] - EV.exit[0]));
	const yank = clamp((f - EV.drag[0]) / (EV.drag[1] - EV.drag[0]));
	// el orbe arrancado hacia atrás (en el cuarto visto con el espejo en mano)
	const roomBack = E.inOut(clamp((f - EV.drag[0]) / 12));
	const ox = lerp(540, 650, E.inOut(exitU));
	const oy = lerp(900, 700, E.inOut(yank)) - 120 * exitU;
	const or = lerp(330, 60, E.out(yank)) * lerp(1, 0.05, E.in(exitU));
	compose(g, f, {
		xf: {...xf, dx: xf.dx + sh.x, dy: xf.dy + sh.y},
		lights: [{x: ox, y: oy, r: or * 1.5 + 20, color: P.cempa, a: 1 - exitU * 0.8, kind: 'orb'}],
		world: () => {
			if (roomBack < 1) {
				g.save();
				g.globalAlpha = 1 - roomBack;
				paintCloseSet(g);
				g.restore();
			}
			if (roomBack > 0) {
				g.save();
				g.globalAlpha = roomBack;
				paintRoomScene(g, {f, focus: 0.3, abuela: null, scissors: {open: 1, flash: f >= 1035 && f < 1041 ? 1 : 0}, cradle: {f, hand: 0.6}, candle: {k: 0.8}});
				g.restore();
			}
			if (or > 0.5 && f < EV.exit[1]) paintOrb(g, {x: ox, y: oy, r: or, t, seed: 4, vx: (ox - 540) * 0.05, vy: -6});
			sparkBurst(g, 650, 580, f - EV.exit[1], 40, 61, 0.6);
		},
		onGlass: (q) => sootOnGlass(q, f),
		above: (q) => paintFingers(q, {k: 1, t}),
	});
	return susto(espejo({orb: 1 - exitU, attack: 1 - exitU, hatch: 0.3}), df, {flash: 0.6, ca: 12});
};

// ---------- amanecer 1086–1152 ----------
export const paintDawn = (g: Ctx, f: number): PostOpts => {
	const lapse = E.inOut(clamp((f - EV.lapse[0]) / (EV.lapse[1] - EV.lapse[0])));
	const ck = candleK(f) * lerp(0.85, 0.5, lapse);
	compose(g, f, {
		lights: [candleLight(ck, lapse)],
		world: () => paintRoomScene(g, {f, focus: 0, ext: {dawn: lapse, fog: 0.4}, abuela: abuelaDawn(f), scissors: {open: 1}, cradle: {f, hand: 1, grasp: clamp((f - EV.grasp) / 9)}, candle: {k: ck, stub: lapse}}),
		onGlass: (q) => sootOnGlass(q, f),
		above: (q) => paintFingers(q, {k: 1 - clamp((f - EV.fingersOut[0]) / (EV.fingersOut[1] - EV.fingersOut[0])), t: f / FPS}),
	});
	return mixPost(espejo({}), {...AMANECER, hatch: 0.12}, lapse);
};

// ---------- el aliento revela el 6 1152–1244 ----------
const dawnEye = (g: Ctx, f: number) => {
	const widen = E.inOut(clamp((f - (EV.breath2 + 6)) / 18));
	paintEyeECU(g, {cx: 540, cy: 860, s: 1.1, lid: 1, widen, light: 'dawn'});
};

export const paintBreath = (g: Ctx, f: number): PostOpts => {
	const t = f / FPS;
	const fogU = E.out(clamp((f - EV.breath2) / 12));
	const ember = E.inOut(clamp((f - EV.ember6) / 12));
	compose(g, f, {
		lights: [{x: 760, y: 820, r: 400, color: '#FFE2A8', a: 0.6, kind: 'dawn'}],
		world: () => {
			paintRoomScene(g, {f, focus: 0, ext: {dawn: 1, fog: 0.3}, abuela: null, scissors: {open: 1}, cradle: {f, hand: 0}, candle: {k: 0.5, stub: 1}});
			const near = E.inOut(clamp((f - EV.straighten[0]) / 10));
			if (near > 0) {
				g.save();
				g.globalAlpha = near;
				dawnEye(g, f);
				g.restore();
			}
		},
		fog: f >= EV.breath2 ? {t, puffs: [{x: 540, y: 900, r: 1400 * fogU + 1, a: 0.9}], carve: (q) => carveSix(q), veil: 0.66} : null,
		onGlass: (q) => {
			sootOnGlass(q, f);
			paintSixEmber(q, ember * 0.8);
		},
	});
	return mixPost(espejo({}), {...AMANECER, hatch: 0.1}, 1);
};

// ---------- lockup 1244–1350 ----------
export const SIX_LIGHTS: [number, number][] = [
	[500, 945],
	[585, 945],
	[700, 905],
	[790, 918],
	[875, 902],
	[945, 922],
];

export const paintLockup = (g: Ctx, f: number): PostOpts => {
	const t = f / FPS;
	const night = E.inOut(clamp((f - EV.night[0]) / (EV.night[1] - EV.night[0])));
	const fogA = 1 - E.inOut(clamp((f - EV.fogGone[0]) / (EV.fogGone[1] - EV.fogGone[0])));
	const sixK = E.out(clamp((f - EV.lockup) / 10));
	const push = lerp(1, 1.02, clamp((f - EV.lockup) / (LEN - EV.lockup)));
	const xf = {...mirrorXf(f), zoom: push};
	const cool = clamp((f - EV.endDip) / 8);
	const lights: Light[] = [];
	compose(g, f, {
		xf,
		lights,
		world: () => {
			paintRoomScene(g, {
				f,
				focus: 0.5,
				ext: {dawn: 1 - night, fog: 0.6},
				outside: (q) => {
					SIX_LIGHTS.forEach(([x, y], i) => {
						const on = clamp((f - EV.sixOn - i * 2.4) / 3);
						const off = clamp((f - EV.sixOff - (5 - i) * 1.8) / 3);
						const k = on * (1 - off) * (1 + 0.06 * Math.sin(t * 2 * Math.PI * 0.8 + i));
						if (k <= 0) return;
						glow(q, x, y, 26, P.cempa, 0.8 * k);
						glow(q, x, y, 6, P.core, k);
					});
				},
				abuela: null,
				scissors: {open: 1},
				cradle: {f},
				candle: {k: lerp(0.5, 0.35, night), stub: 1},
				darken: night * 0.55,
			});
			if (fogA > 0) {
				g.save();
				g.globalAlpha = fogA;
				dawnEye(g, f);
				g.restore();
			}
		},
		fog: fogA > 0.01 ? {t, puffs: [{x: 540, y: 900, r: 1400 * fogA + 1, a: 0.9 * fogA}], carve: (q) => carveSix(q), veil: 0.66} : null,
		onGlass: (q) => {
			sootOnGlass(q, f);
			paintSixSolid(q, t, sixK, cool);
		},
	});
	void noise2D;
	void withWorld;
	void HELD;
	void paintAbuela;
	return {...mixPost(espejo({}), CIFRA, night), fade: clamp((f - (LEN - 6)) / 6)};
};
