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
import {paintMothOnGlass, paintMothPowder} from './moth';
import {paintCrossShadow} from './cross';
import {espejo, susto} from './post';
import {abuelaPose, orbPos} from './poses';
import {CEIL_Y, RW, SILL} from './room';
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
		// 657–659: algo oscuro cruza el cuarto hacia el espejo (3 cuadros, borroso)
		above: f >= EV.owlLand - 3 ? (q) => paintMothOnGlass(q, f) : undefined,
	});
	return espejo({vignette: lerp(0.38, 0.53, clamp((f - 600) / 30))});
};

// ---------- mariposa negra en el vidrio 660–702 (sustituye al tecolote: notas del crítico #2) ----------
export const paintOwlBeat = (g: Ctx, f: number): PostOpts => {
	const t = f / FPS;
	const ck = candleK(f) * 0.92;
	// contraluz naranja que sube desde abajo de la repisa
	const under = E.out(clamp((f - EV.underlight) / 8));
	const sh1 = shake(t, EV.owlLand / FPS, 4, 0.2);
	const sh2 = shake(t, (EV.owlLand + 6) / FPS, 2.5, 0.15, 22, 5);
	const xf = mirrorXf(f);
	compose(g, f, {
		xf: {...xf, dx: xf.dx + sh1.x + sh2.x, dy: xf.dy + sh1.y + sh2.y},
		lights: [candleLight(ck), ...(under > 0 ? [{x: 650, y: SILL.y + 60, r: 220, color: P.cempa, a: under, kind: 'orb' as const}] : [])],
		world: () =>
			paintRoomScene(g, {
				f,
				focus: 0,
				ext: {fog: 1.2},
				outside: (q) => {
					if (under > 0) {
						glow(q, 650, WIN.y1 + 120, 360, P.cempa, 0.55 * under);
						glow(q, 650, WIN.y1 + 40, 160, P.gold, 0.35 * under);
					}
				},
				abuela: abuelaPose(f),
				cradle: {f},
				scissors: {open: 1},
				candle: {k: ck},
				orbPools: under > 0 ? [{x: 650, y: SILL.y + 40, r: 520, a: 0.18 * under}] : [],
			}),
		above: (q) => {
			paintMothPowder(q, f);
			paintMothOnGlass(q, f);
		},
	});
	const p = espejo({orb: under * 0.45});
	const k = f >= EV.owlLand && f < EV.owlLand + 4 ? 1 - (f - EV.owlLand) / 4 : 0;
	return k > 0 ? {...p, flash: 0.1 * k, ca: 2 + 4 * k} : p;
};

// ---------- el orbe en la ventana 702–786 ----------
export const windowOrb = (f: number) => {
	const rise = E.out(clamp((f - EV.orbRise[0]) / (EV.orbRise[1] - EV.orbRise[0])));
	const drop = E.in(clamp((f - EV.orbDrop[0]) / (EV.orbDrop[1] - EV.orbDrop[0])));
	// se acerca a la ventana (crece) y choca con el plano de las tijeras
	const push = E.inOut(clamp((f - (EV.flinch - 14)) / 14)) * (1 - E.out(clamp((f - EV.flinch) / 8)));
	const t = f / FPS;
	const bob = Math.sin(t * 2 * Math.PI * 0.6) * 6 * rise;
	return {
		x: 650 + 30 * push + noise2D('wox', t * 0.8, 0) * 10,
		y: lerp(1290, 700, rise) + bob + 640 * drop - 20 * push,
		r: 150 * (1 + 0.16 * push),
		crumple: f >= EV.flinch ? Math.exp(-(f - EV.flinch) / 6) * (0.7 + 0.3 * Math.abs(Math.cos((f - EV.flinch) * 0.9))) : 0,
		vis: 1 - drop,
	};
};

// sombra de la cruz: barre el piso hacia el espejo (704–714), luego cubre el vidrio 8 cuadros (714–722)
const CROSS_SWEEP: [number, number] = [703, EV.crossFull[0]];
export const paintWindowBeat = (g: Ctx, f: number): PostOpts => {
	const t = f / FPS;
	const o = windowOrb(f);
	const L = o.vis;
	const ck = candleK(f) * lerp(0.92, 0.55, L);
	const flash = f >= EV.flinch && f < EV.flinch + 6 ? 1 - (f - EV.flinch) / 6 : 0;
	const [c0, c1] = EV.crossFull;
	const glassCross = f >= c0 - 1 && f < c1 + 2 ? Math.min(clamp((f - (c0 - 1)) / 2), clamp((c1 + 2 - f) / 3)) : 0;
	const lights: Light[] = [candleLight(ck), {x: o.x, y: o.y, r: o.r * 2.2, color: P.cempa, a: L, kind: 'orb'}];
	const sh = shake(t, EV.flinch / FPS, 5, 0.3);
	const xf = mirrorXf(f);
	compose(g, f, {
		xf: {...xf, dx: xf.dx + sh.x, dy: xf.dy + sh.y},
		lights,
		world: () =>
			paintRoomScene(g, {
				f,
				focus: 0.6,
				ext: {fog: 1.2},
				outside: (q) => {
					paintOrb(q, {x: o.x, y: o.y, r: o.r, t, seed: 4, eyes: 1, crumple: o.crumple, a: L, big: 1, pulse: o.crumple});
					sparkBurst(q, SCISSORS_X, SILL.y - 80, f - EV.flinch, 150, 33, 1.2);
				},
				abuela: abuelaPose(f),
				cradle: {f, glowFrom: [o.x, o.y, L]},
				scissors: {open: 1, flash},
				candle: {k: ck},
				orbPools: [
					{x: o.x, y: 1250, r: 950, a: 0.32 * L},
					{x: o.x, y: SILL.y - 40, r: 420, a: 0.25 * L},
				],
				extra: (q) => {
					// la cruz proyectada por el piso, sobre la cuna y la madre dormida, hacia el espejo
					const u = clamp((f - CROSS_SWEEP[0]) / (CROSS_SWEEP[1] - CROSS_SWEEP[0]));
					if (f >= CROSS_SWEEP[0] && f < c0 + 1 && L > 0.3) {
						const e = E.in(u);
						paintCrossShadow(q, {
							cx: lerp(880, 560, e),
							cy: lerp(1210, 1640, e),
							k: lerp(2.4, 10, e),
							squash: lerp(1, 0.25, e),
							rot: lerp(0.08, 0, e),
							a: 0.6 * Math.min(1, u * 4 + 0.3) * (f >= c0 ? 0.4 : 1),
							soft: lerp(4, 26, e),
							thick: lerp(3, 7, e),
						});
					}
					// tras el choque: las hojas proyectan dos rayos de sombra cortos que tiemblan
				},
			}),
		onGlass: glassCross > 0 ? (q) => paintCrossShadow(q, {cx: 545, cy: 1010, k: lerp(11.5, 13.5, clamp((f - c0) / (c1 - c0))), squash: 0, rot: 0, a: 0.42 * glassCross, soft: 24, thick: 10}) : undefined,
		above: (q) => paintMothPowder(q, f),
	});
	const share = orbShare(lights);
	const p = espejo({orb: share, attack: L, exposure: 1 + 0.1 * L});
	return flash > 0 ? susto(p, f - EV.flinch, {flash: 0.25, ca: 6, minor: true}) : p;
};

// ---------- el techo 786–864 ----------
// rendijas reales entre carrizos (misma sucesión que room.ts paintCeiling)
const REED_GAPS: number[] = (() => {
	const h = CEIL_Y - RW.y;
	const out: number[] = [];
	let y = CEIL_Y - 4;
	let i = 0;
	while (y > RW.y - 20) {
		const u = (CEIL_Y - y) / h;
		const th = 4 + u * u * 22;
		out.push(y - th / 2);
		y -= th * (1.05 + hash(i, 34) * 0.15);
		i++;
	}
	return out;
})();
const LEAK_GAPS = REED_GAPS.filter((y) => y > 40 && y < CEIL_Y - 6).filter((_, i) => i % 3 === 1);

export const paintRoofBeat = (g: Ctx, f: number): PostOpts => {
	const t = f / FPS;
	const [k1f, k2f] = EV.knocks;
	const leak = E.out(clamp((f - k2f) / 14));
	const ck = candleK(f) * 0.9;
	const lean = -0.35 * leak;
	const sh1 = shake(t, k1f / FPS, 2.2, 0.25, 18, 7);
	const sh2 = shake(t, k2f / FPS, 3.2, 0.3, 18, 8);
	const xf = mirrorXf(f);
	// el fuego camina sobre el techo de izquierda a derecha
	const fx = lerp(380, 700, E.inOut(clamp((f - k2f) / 36)));
	compose(g, f, {
		xf: {...xf, dx: xf.dx + sh1.x + sh2.x, dy: xf.dy + sh1.y + sh2.y},
		lights: [candleLight(ck), ...(leak > 0 ? [{x: fx, y: CEIL_Y - 140, r: 260, color: P.cempa, a: leak * 0.8, kind: 'orb' as const}] : [])],
		world: () =>
			paintRoomScene(g, {
				f,
				focus: 0,
				ext: {fog: 1.2},
				abuela: abuelaPose(f),
				cradle: {f, wriggle: f >= EV.whimper && f < EV.whimper + 18 ? 1 : 0, glowFrom: leak > 0 ? [fx, CEIL_Y, 0.5 * leak] : undefined},
				scissors: {open: 1},
				candle: {k: ck, lean},
				extra: (q) => {
					// luz que se cuela por las rendijas del carrizo y se desliza
					if (leak > 0) {
						q.save();
						q.globalCompositeOperation = 'lighter';
						LEAK_GAPS.forEach((y, k) => {
							const fl = 0.55 + 0.45 * noise2D('lk' + k, t * 3, 0);
							const span = 60 + 70 * hash(k, 21);
							const cx = fx + (hash(k, 22) - 0.5) * 260 + (hash(k, 23) - 0.5) * 60 * Math.sin(t * 2 + k);
							const gr = q.createLinearGradient(cx - span, 0, cx + span, 0);
							gr.addColorStop(0, rgba(P.cempa, 0));
							gr.addColorStop(0.5, rgba(P.gold, 0.75 * leak * fl));
							gr.addColorStop(1, rgba(P.cempa, 0));
							q.strokeStyle = gr;
							q.lineWidth = 2.2;
							q.beginPath();
							q.moveTo(cx - span, y);
							q.lineTo(cx + span, y);
							q.stroke();
							const gw = q.createLinearGradient(cx - span, 0, cx + span, 0);
							gw.addColorStop(0, rgba(P.cempa, 0));
							gw.addColorStop(0.5, rgba(P.cempa, 0.14 * leak * fl));
							gw.addColorStop(1, rgba(P.cempa, 0));
							q.strokeStyle = gw;
							q.lineWidth = 12;
							q.stroke();
						});
						// haces finos de luz polvosa que bajan hacia la cuna
						for (let k = 0; k < 3; k++) {
							const x0 = fx + (k - 1) * 110;
							const fl = 0.6 + 0.4 * noise2D('sh' + k, t * 2.5, 1);
							const gr = q.createLinearGradient(0, CEIL_Y - 30, 0, 1180);
							gr.addColorStop(0, rgba(P.cempa, 0.13 * leak * fl));
							gr.addColorStop(1, rgba(P.cempa, 0));
							q.fillStyle = gr;
							q.beginPath();
							q.moveTo(x0 - 6, CEIL_Y - 30);
							q.lineTo(x0 + 6, CEIL_Y - 30);
							q.lineTo(lerp(x0, 690, 0.5) + 70, 1180);
							q.lineTo(lerp(x0, 690, 0.5) - 70, 1180);
							q.closePath();
							q.fill();
						}
						q.restore();
					}
					// tierrita que cae entre los carrizos (dos tandas, una por golpe)
					q.save();
					q.lineCap = 'round';
					for (let i = 0; i < 40; i++) {
						const kf = i < 22 ? k1f : k2f;
						const df = f - kf - hash(i, 3) * 16;
						if (df < 0) continue;
						const x0 = (i < 22 ? 600 : 520) + hash(i, 4) * 300;
						const g0 = 0.5 + hash(i, 5) * 0.4;
						const y = CEIL_Y - 8 + 0.5 * g0 * df * df;
						if (y > 1260) continue;
						const v = g0 * df;
						const x = x0 + Math.sin(df * 0.15 + i) * 3;
						const lit = 0.45 + 0.4 * clamp(1 - Math.abs(x - fx) / 300) * leak;
						q.strokeStyle = rgba(i % 3 ? '#cfae7c' : P.sand, lit * (1 - clamp((y - 1150) / 110)));
						q.lineWidth = 1.6 + hash(i, 6) * 1.6;
						q.beginPath();
						q.moveTo(x, y - Math.min(18, v * 0.8));
						q.lineTo(x, y);
						q.stroke();
					}
					// polvo que se suelta en cada golpe
					for (const kf of [k1f, k2f]) {
						const d = f - kf;
						if (d >= 0 && d < 30) glow(q, kf === k1f ? 740 : 660, CEIL_Y + 10 + d * 1.5, 120 + d * 4, '#b89a70', 0.18 * (1 - d / 30));
					}
					q.restore();
					// brasas que bajan despacio hacia la cuna
					if (leak > 0) {
						q.save();
						q.globalCompositeOperation = 'lighter';
						for (let i = 0; i < 25; i++) {
							const df = f - k2f - 4 - hash(i, 9) * 34;
							if (df < 0) continue;
							const x0 = fx - 220 + hash(i, 10) * 440;
							const x = lerp(x0, 690 + (hash(i, 12) - 0.5) * 260, clamp(df / 70)) + Math.sin(df * 0.09 + i) * 18;
							const y = CEIL_Y - 10 + df * (2.4 + hash(i, 11) * 2.2);
							if (y > 1180) continue;
							const life = 1 - clamp(df / 60);
							const tw = 0.6 + 0.4 * Math.sin(df * 0.7 + i * 2.1);
							glow(q, x, y, 9, P.cempa, 0.5 * life * tw);
							q.fillStyle = rgba(life > 0.5 ? P.core : P.gold, 0.9 * tw * (0.35 + 0.65 * life));
							q.beginPath();
							q.arc(x, y, 1.6 + 0.8 * life, 0, Math.PI * 2);
							q.fill();
						}
						q.restore();
					}
				},
			}),
	});
	const s = f >= k1f && f < k1f + 4 ? 1 : f >= k2f && f < k2f + 4 ? 1 : 0;
	return espejo({orb: leak * 0.5, exposure: 1 - 0.04 * s});
};
