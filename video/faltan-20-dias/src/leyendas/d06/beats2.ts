// G2 · 14.5–28.8 s (frames 435–864): vuelo sobre los techos, la abuela se duerme, quietud, tecolote,
// el orbe en la ventana (sombra de la cruz), el techo.
import {noise2D} from '@remotion/noise';
import {E, clamp, hash, lerp, ramp, rgba} from '../../lib/util';
import {glow, type Ctx} from '../kit/paint';
import type {PostOpts} from '../kit/post';
import {HOUSES, ridgeNear, WIN} from './exterior';
import {orbShare, type Light} from './light';
import {shake} from '../kit/stage';
import {mirrorXf} from './mirror';
import {paintOrb, ignite, sparkBurst} from './orb';
import {paintOwl} from './owl';
import {espejo, susto} from './post';
import {abuelaPose, orbPos} from './poses';
import {CEIL_Y, SILL} from './room';
import {EV, FPS, P} from './timeline';
import {candleK, candleLight, compose, paintRoomScene, SCISSORS_X} from './world';

// recorte: todo lo que está por encima del cerro cercano (los orbes se esconden detrás)
const clipAboveNear = (g: Ctx) => {
	g.beginPath();
	g.moveTo(WIN.x0 - 10, WIN.y0 - 10);
	for (let x = WIN.x0 - 10; x <= WIN.x1 + 10; x += 10) g.lineTo(x, ridgeNear(x));
	g.lineTo(WIN.x1 + 10, WIN.y0 - 10);
	g.closePath();
	g.clip();
};

const ORB_START = [EV.ignite, EV.orb2, EV.orb3];
export const villageOrbs = (f: number) =>
	[0, 1, 2]
		.filter((i) => f >= ORB_START[i] && f < EV.dip + 6)
		.map((i) => {
			const df = f - ORB_START[i];
			const r = i === 0 ? 25 + 8 * clamp((f - 435) / 72) : ignite(df, 20) + 10 * clamp((f - 470) / 37);
			const [x, y] = orbPos(i, f);
			const [px, py] = orbPos(i, f - 1);
			return {i, x, y, r, vx: x - px, vy: y - py, df};
		});

// ---------- techos 435–516 ----------
export const paintRoofs = (g: Ctx, f: number): PostOpts => {
	const t = f / FPS;
	const ck = candleK(f) * 0.9;
	const orbs = villageOrbs(f);
	const lights: Light[] = [candleLight(ck), ...orbs.map((o) => ({x: o.x, y: o.y, r: o.r * 3, color: P.cempa, a: 1, kind: 'orb' as const}))];
	compose(g, f, {
		lights,
		world: () =>
			paintRoomScene(g, {
				f,
				focus: 1,
				ext: {windowsLit: (i) => 1 - clamp((f - lerp(EV.windowsDark[0], EV.windowsDark[1], HOUSES[i].off)) / 4)},
				outside: (q) => {
					q.save();
					clipAboveNear(q);
					for (const o of orbs) {
						// charco de luz cálida que se desliza sobre los techos
						glow(q, o.x, ridgeNear(o.x) + 20, 90, P.cempa, 0.25);
						paintOrb(q, {...o, t, seed: o.i + 1});
						if (o.i > 0) sparkBurst(q, o.x, o.y, o.df, 16, o.i * 9, 0.4);
					}
					q.restore();
				},
				abuela: abuelaPose(f),
				cradle: {f},
				scissors: {open: 1},
				candle: {k: ck},
			}),
	});
	return espejo({orb: orbShare(lights)});
};

// ---------- se duerme 516–600 ----------
export const paintDoze = (g: Ctx, f: number): PostOpts => {
	const ck = candleK(f) * 0.92;
	compose(g, f, {
		lights: [candleLight(ck)],
		world: () => paintRoomScene(g, {f, focus: ramp(f, [516, 546], [1, 0]), ext: {fog: 0.9}, abuela: abuelaPose(f), cradle: {f}, scissors: {open: 1}, candle: {k: ck}}),
	});
	return espejo({});
};

// ---------- quietud 600–660 ----------
export const paintStill = (g: Ctx, f: number): PostOpts => {
	const ck = 0.92;
	compose(g, f, {
		lights: [candleLight(ck)],
		world: () => paintRoomScene(g, {f, focus: 0, ext: {fog: 1.4}, abuela: abuelaPose(f), cradle: {f}, scissors: {open: 1}, candle: {k: ck, lean: 0}}),
	});
	return espejo({vignette: lerp(0.38, 0.53, clamp((f - 600) / 30))});
};

// ---------- tecolote 660–702 ----------
export const paintOwlBeat = (g: Ctx, f: number): PostOpts => {
	const t = f / FPS;
	const ck = candleK(f) * 0.92;
	const land = E.out(clamp((f - EV.owlLand) / 6));
	const launch = clamp((f - EV.owlLaunch) / 12);
	const x = lerp(700, 380, E.in(launch));
	const y = lerp(SILL.y - 560, SILL.y, land) - 700 * E.in(launch);
	const flap = f < EV.owlLand + 15 ? 0.5 + 0.5 * Math.cos(((f - EV.owlLand) / 5) * Math.PI) : launch > 0 ? 0.5 + 0.5 * Math.cos(f * 1.3) : 0;
	const head = f >= EV.owlSnap && f < EV.owlSnap + 5 ? Math.sin(((f - EV.owlSnap) / 5) * Math.PI) * 1.4 : 0;
	const under = clamp((f - EV.underlight) / 8);
	const sh = shake(t, EV.owlLand / FPS, 4, 0.2);
	const xf = mirrorXf(f);
	compose(g, f, {
		xf: {...xf, dx: xf.dx + sh.x, dy: xf.dy + sh.y},
		lights: [candleLight(ck), ...(under > 0 ? [{x: 650, y: SILL.y + 60, r: 200, color: P.cempa, a: under, kind: 'orb' as const}] : [])],
		world: () =>
			paintRoomScene(g, {
				f,
				focus: 0,
				ext: {fog: 1.2},
				outside: (q) => {
					if (under > 0) glow(q, 650, WIN.y1 + 80, 320, P.cempa, 0.6 * under);
				},
				abuela: abuelaPose(f),
				cradle: {f},
				scissors: {open: 1},
				candle: {k: ck},
				extra: (q) => paintOwl(q, {x, y, wing: flap, head, s: 1, under}),
			}),
	});
	const p = espejo({orb: under * 0.5});
	return f >= EV.owlLand && f < EV.owlLand + 6 ? {...p, flash: 0.12 * (1 - (f - EV.owlLand) / 6), ca: 4} : p;
};

// ---------- el orbe en la ventana 702–786 ----------
export const windowOrb = (f: number) => {
	const rise = E.out(clamp((f - EV.orbRise[0]) / (EV.orbRise[1] - EV.orbRise[0])));
	const drop = E.in(clamp((f - EV.orbDrop[0]) / (EV.orbDrop[1] - EV.orbDrop[0])));
	const push = clamp((f - (EV.flinch - 12)) / 12) * (1 - clamp((f - EV.flinch) / 6));
	return {x: 650, y: lerp(1250, 720, rise) + 600 * drop, r: 150 * (1 + 0.1 * push), crumple: f >= EV.flinch ? Math.exp(-(f - EV.flinch) / 5) * Math.abs(Math.cos((f - EV.flinch) * 0.9)) : 0, vis: 1 - drop};
};

export const paintWindowBeat = (g: Ctx, f: number): PostOpts => {
	const t = f / FPS;
	const o = windowOrb(f);
	const L = o.vis;
	const ck = candleK(f) * lerp(0.92, 0.6, L);
	const flash = f >= EV.flinch && f < EV.flinch + 6 ? 1 - (f - EV.flinch) / 6 : 0;
	const cross = f >= EV.crossFull[0] && f < EV.crossFull[1] ? Math.sin(((f - EV.crossFull[0]) / (EV.crossFull[1] - EV.crossFull[0])) * Math.PI) : 0;
	const lights: Light[] = [candleLight(ck), {x: o.x, y: o.y, r: o.r * 2, color: P.cempa, a: L, kind: 'orb'}];
	compose(g, f, {
		lights,
		world: () =>
			paintRoomScene(g, {
				f,
				focus: 0.6,
				ext: {fog: 1.2},
				outside: (q) => {
					paintOrb(q, {x: o.x, y: o.y, r: o.r, t, seed: 4, eyes: 1, crumple: o.crumple, a: L});
					sparkBurst(q, SCISSORS_X, SILL.y - 80, f - EV.flinch, 150, 33, 1);
				},
				abuela: abuelaPose(f),
				cradle: {f},
				scissors: {open: 1, flash},
				candle: {k: ck},
				orbPools: [{x: o.x, y: 1300, r: 900, a: 0.35 * L}],
				extra: (q) => {
					// sombra proyectada de la cruz (stub: barrido diagonal oscuro por el piso)
					const sw = clamp((f - EV.orbRise[0]) / 24);
					if (sw > 0 && sw < 1 && L > 0.5) {
						q.save();
						q.globalCompositeOperation = 'multiply';
						q.filter = 'blur(30px)';
						q.strokeStyle = 'rgba(80,50,30,0.6)';
						q.lineWidth = 120;
						const cx = SCISSORS_X;
						const cy = lerp(1400, 2200, sw);
						const s = lerp(1.5, 5, sw);
						q.beginPath();
						q.moveTo(cx - 140 * s, cy - 140 * s);
						q.lineTo(cx + 140 * s, cy + 140 * s);
						q.moveTo(cx + 140 * s, cy - 140 * s);
						q.lineTo(cx - 140 * s, cy + 140 * s);
						q.stroke();
						q.restore();
					}
				},
			}),
		glass: {cross},
	});
	const share = orbShare(lights);
	return espejo({orb: share, attack: L});
};

// ---------- el techo 786–864 ----------
export const paintRoofBeat = (g: Ctx, f: number): PostOpts => {
	const t = f / FPS;
	const leak = clamp((f - EV.knocks[1]) / 20);
	const ck = candleK(f) * 0.9;
	const lx = lerp(300, 900, clamp((f - EV.knocks[1]) / 48));
	const lean = -0.35 * leak;
	compose(g, f, {
		lights: [candleLight(ck), ...(leak > 0 ? [{x: lx, y: CEIL_Y - 120, r: 220, color: P.cempa, a: leak * 0.7, kind: 'orb' as const}] : [])],
		world: () =>
			paintRoomScene(g, {
				f,
				focus: 0,
				ext: {fog: 1.2},
				abuela: abuelaPose(f),
				cradle: {f, wriggle: f >= EV.whimper && f < EV.whimper + 18 ? 1 : 0},
				scissors: {open: 1},
				candle: {k: ck, lean},
				extra: (q) => {
					// luz que se cuela entre los carrizos
					if (leak > 0) {
						q.save();
						q.globalCompositeOperation = 'lighter';
						for (let k = 0; k < 9; k++) {
							const y = CEIL_Y - 40 - k * 28;
							q.strokeStyle = rgba(P.cempa, 0.35 * leak * (0.5 + 0.5 * noise2D('lk' + k, t * 2, 0)));
							q.lineWidth = 3;
							q.beginPath();
							q.moveTo(lx - 260, y);
							q.lineTo(lx + 260, y);
							q.stroke();
						}
						q.restore();
					}
					// tierrita que cae + brasas
					const k1 = f - EV.knocks[0];
					if (k1 > 0) {
						q.fillStyle = 'rgba(200,170,120,0.7)';
						for (let i = 0; i < 40; i++) {
							const st = hash(i, 3) * 20;
							const df = k1 - st;
							if (df < 0) continue;
							const x = 560 + hash(i, 4) * 260 + Math.sin(df * 0.2 + i) * 4;
							const y = CEIL_Y + 0.6 * df * df * 0.25;
							if (y > 1300) continue;
							q.fillRect(x, y, 2, 3);
						}
					}
					if (leak > 0) {
						q.save();
						q.globalCompositeOperation = 'lighter';
						for (let i = 0; i < 25; i++) {
							const df = f - EV.knocks[1] - hash(i, 9) * 30;
							if (df < 0) continue;
							const x = 560 + hash(i, 10) * 280 + Math.sin(df * 0.08 + i) * 20;
							const y = CEIL_Y + df * 5;
							if (y > 1150) continue;
							q.fillStyle = rgba(P.gold, 0.8);
							q.fillRect(x, y, 3, 3);
						}
						q.restore();
					}
				},
			}),
	});
	const s = f >= EV.knocks[0] && f < EV.knocks[0] + 6 ? 1 : 0;
	return espejo({orb: leak * 0.5, exposure: 1 - 0.03 * s});
};
