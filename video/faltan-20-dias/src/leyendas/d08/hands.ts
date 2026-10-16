// Día 8 · manos 2D con esqueleto: palma + 4 dedos de 3 falanges + pulgar, cada falange una cápsula que gira en
// su articulación (el doblez se lee como escorzo). Material pictórico (paintShape) y, para la abuela, grabado.
import {clamp, hash, lerp, rgba} from '../../lib/util';
import {type Ctx} from '../kit/paint';
import {paintShape} from '../kit/shade';
import {smoothPath} from '../kit/rig';
import {P, ribbonColor, softShadow, type V2} from './core';

export type Skin = {hi: string; mid: string; lo: string; rim?: string; rimA?: number; bounce?: string};
export const SKIN_POV: Skin = {hi: '#c48a62', mid: '#9a6442', lo: '#4c2c1a', rim: '#8fb8b4', rimA: 0.75, bounce: '#ffb37a'};
export const SKIN_KID: Skin = {hi: '#e2b48a', mid: '#bf8a62', lo: '#6e4630', rim: '#ffe2b0', rimA: 0.5};
export const SKIN_ABU: Skin = {hi: '#d9b088', mid: '#a87a54', lo: '#5a3a24', rim: '#ffe0a8', rimA: 0.55};

export type HandPose = {
	x: number;
	y: number;
	rot: number; // 0 = dedos hacia arriba
	s: number; // px por unidad (la mano mide ~190 u de muñeca a punta)
	side: 'L' | 'R';
	view: 'dorsal' | 'palm';
	spread?: number;
	curl?: [number, number, number, number];
	thumb?: number; // 0 abierto … 1 recogido
	thumbAng?: number;
	forearm?: number;
	forearmW?: number;
	light?: number; // ángulo de la luz en pantalla
	skin: Skin;
	engraved?: number;
	ring?: boolean;
	alpha?: number;
	shadow?: {dx: number; dy: number; a: number};
};

const FING = [
	{b: [-31, -95] as V2, a: -0.09, as: -0.14, L: [36, 24, 19], w: [19, 17, 15.5, 13.5]},
	{b: [-10, -101] as V2, a: -0.015, as: -0.04, L: [40, 27, 21], w: [20, 18, 16, 14]},
	{b: [11, -98] as V2, a: 0.06, as: 0.09, L: [37, 25, 20], w: [18.5, 17, 15, 13]},
	{b: [30, -87] as V2, a: 0.14, as: 0.22, L: [28, 19, 16], w: [16, 14.5, 13, 11.5]},
];
const PALM: V2[] = [
	[-35, 4],
	[-40, -26],
	[-42, -62],
	[-39, -92],
	[-22, -104],
	[0, -106],
	[19, -103],
	[35, -94],
	[43, -80],
	[44, -48],
	[40, -14],
	[33, 4],
];

type Seg = {a: V2; b: V2; ra: number; rb: number; vis: number};
export const handGeom = (p: HandPose) => {
	const spread = p.spread ?? 0.3;
	const curl = p.curl ?? [0.15, 0.15, 0.18, 0.22];
	const dorsal = p.view === 'dorsal';
	const fingers: Seg[][] = [];
	FING.forEach((F, i) => {
		const c = clamp(curl[i], 0, 1.2);
		const ang = [c * 1.35, c * 1.6, c * 1.0];
		let cum = 0;
		const a0 = F.a + F.as * spread + c * (i - 1.5) * -0.08;
		const dir: V2 = [Math.sin(a0), -Math.cos(a0)];
		let pt: V2 = [F.b[0], F.b[1]];
		const segs: Seg[] = [];
		for (let k = 0; k < 3; k++) {
			cum += ang[k];
			let f = Math.cos(cum);
			if (dorsal) f = Math.max(0.1, f);
			const L = F.L[k] * f;
			const nb: V2 = [pt[0] + dir[0] * L, pt[1] + dir[1] * L];
			segs.push({a: pt, b: nb, ra: (F.w[k] / 2) * (1 + (1 - Math.abs(f)) * 0.08), rb: F.w[k + 1] / 2, vis: f});
			pt = nb;
		}
		fingers.push(segs);
	});
	// pulgar: sale del costado de la palma
	const th = p.thumb ?? 0.2;
	const ta = (p.thumbAng ?? -0.85) + th * 0.75;
	const tdir: V2 = [Math.sin(ta), -Math.cos(ta)];
	let tp: V2 = [-30, -24];
	const tL = [36, 29, 24];
	const tW = [25, 21, 18.5, 15];
	const thumb: Seg[] = [];
	let tc = 0;
	for (let k = 0; k < 3; k++) {
		tc += th * (k === 0 ? 0.3 : 0.8);
		const f = Math.max(0.2, Math.cos(tc));
		const d2: V2 = [tdir[0] * Math.cos(tc * 0.5) - tdir[1] * Math.sin(tc * 0.5) * 0.4, tdir[1] * Math.cos(tc * 0.5) + tdir[0] * Math.sin(tc * 0.5) * 0.4];
		const nb: V2 = [tp[0] + d2[0] * tL[k] * f, tp[1] + d2[1] * tL[k] * f];
		thumb.push({a: tp, b: nb, ra: tW[k] / 2, rb: tW[k + 1] / 2, vis: f});
		tp = nb;
	}
	return {fingers, thumb};
};

const capsule = (q: Ctx, s: Seg) => {
	const th = Math.atan2(s.b[1] - s.a[1], s.b[0] - s.a[0]);
	q.moveTo(s.a[0] + Math.cos(th - Math.PI / 2) * s.ra, s.a[1] + Math.sin(th - Math.PI / 2) * s.ra);
	q.lineTo(s.b[0] + Math.cos(th - Math.PI / 2) * s.rb, s.b[1] + Math.sin(th - Math.PI / 2) * s.rb);
	q.arc(s.b[0], s.b[1], s.rb, th - Math.PI / 2, th + Math.PI / 2, false);
	q.lineTo(s.a[0] + Math.cos(th + Math.PI / 2) * s.ra, s.a[1] + Math.sin(th + Math.PI / 2) * s.ra);
	q.arc(s.a[0], s.a[1], s.ra, th + Math.PI / 2, th + (Math.PI * 3) / 2, false);
	q.closePath();
};

export const handPath = (p: HandPose, geom = handGeom(p), withForearm = true) => (q: Ctx) => {
	smoothPath(q, PALM, true);
	if (withForearm) {
		const L = p.forearm ?? 260;
		const fw = p.forearmW ?? 1;
		q.moveTo(-36 * fw, -6);
		q.bezierCurveTo(-40 * fw, L * 0.3, -46 * fw, L * 0.7, -50 * fw, L);
		q.lineTo(50 * fw, L);
		q.bezierCurveTo(46 * fw, L * 0.7, 40 * fw, L * 0.3, 34 * fw, -6);
		q.closePath();
	}
	for (const f of geom.fingers) for (const s of f) capsule(q, s);
	for (const s of geom.thumb) capsule(q, s);
};

const mirrorOf = (p: HandPose) => ((p.side === 'R') === (p.view === 'dorsal') ? 1 : -1);
export const handXf = (g: Ctx, p: HandPose) => {
	g.translate(p.x, p.y);
	g.rotate(p.rot);
	g.scale(p.s * mirrorOf(p), p.s);
};
// punto local → pantalla
export const handPt = (p: HandPose, lx: number, ly: number): V2 => {
	const m = mirrorOf(p);
	const x = lx * p.s * m;
	const y = ly * p.s;
	const c = Math.cos(p.rot);
	const s = Math.sin(p.rot);
	return [p.x + x * c - y * s, p.y + x * s + y * c];
};

export const drawHand = (g: Ctx, p: HandPose) => {
	const geom = handGeom(p);
	const path = handPath(p, geom, (p.forearm ?? 260) > 0);
	const m = mirrorOf(p);
	const L = p.light ?? -Math.PI * 0.7;
	let la = L - p.rot;
	if (m < 0) la = Math.PI - la;
	const fl = p.forearm ?? 260;
	const box: [number, number, number, number] = [-80, -210, 160, 220 + Math.max(0, fl)];
	if (p.shadow) {
		g.save();
		const sh = p.shadow;
		softShadow(g, (q) => {
			q.save();
			handXf(q, p);
			path(q);
			q.restore();
		}, [p.x - 260 * p.s, p.y - 260 * p.s, 520 * p.s, 520 * p.s + fl * p.s], '#1a0c04', sh.a, sh.dx, sh.dy, 0.18, 3);
		g.restore();
	}
	g.save();
	g.globalAlpha *= p.alpha ?? 1;
	handXf(g, p);
	const sk = p.skin;
	paintShape(
		g,
		path,
		box,
		{
			fill: (q, b) => {
				const gr = q.createLinearGradient(b[0], 0, b[0] + b[2], 0);
				gr.addColorStop(0, sk.hi);
				gr.addColorStop(0.55, sk.mid);
				gr.addColorStop(1, sk.lo);
				return gr;
			},
			light: la,
			shadow: {color: sk.lo, width: 16, alpha: 0.85, blur: 10},
			rim: sk.rim ? {color: sk.rim, width: 4.5, alpha: sk.rimA ?? 0.6, blur: 2.5} : undefined,
			texture: {seed: 120, scale: 0.12, alpha: 0.12, color: '#2a1408'},
		},
		p.s * 1.0,
	);
	// detalles
	g.lineCap = 'round';
	const ink = rgba(sk.lo, 0.7);
	const dorsal = p.view === 'dorsal';
	geom.fingers.forEach((segs, i) => {
		// separación entre dedos (sombra en el lado contrario a la luz)
		for (let k = 0; k < 3; k++) {
			const s = segs[k];
			if (Math.abs(s.vis) < 0.2) continue;
			const th = Math.atan2(s.b[1] - s.a[1], s.b[0] - s.a[0]);
			const mx = (s.a[0] + s.b[0]) / 2;
			const my = (s.a[1] + s.b[1]) / 2;
			// pliegues de articulación
			if (k > 0) {
				g.strokeStyle = rgba(sk.lo, dorsal ? 0.45 : 0.55);
				g.lineWidth = 1.1;
				for (let j = -1; j <= (dorsal ? 1 : 0); j++) {
					const ox = Math.cos(th) * j * 2.2;
					const oy = Math.sin(th) * j * 2.2;
					g.beginPath();
					const r = s.ra * 0.62;
					g.moveTo(s.a[0] + ox + Math.cos(th - Math.PI / 2) * r, s.a[1] + oy + Math.sin(th - Math.PI / 2) * r);
					g.quadraticCurveTo(s.a[0] + ox + Math.cos(th) * (dorsal ? -2.5 : 2), s.a[1] + oy + Math.sin(th) * (dorsal ? -2.5 : 2), s.a[0] + ox + Math.cos(th + Math.PI / 2) * r, s.a[1] + oy + Math.sin(th + Math.PI / 2) * r);
					g.stroke();
				}
			}
			void mx;
			void my;
		}
		// uña
		const d = segs[2];
		if (dorsal && d.vis > 0.45) {
			const th = Math.atan2(d.b[1] - d.a[1], d.b[0] - d.a[0]);
			const cx = lerp(d.a[0], d.b[0], 0.62);
			const cy = lerp(d.a[1], d.b[1], 0.62);
			g.save();
			g.translate(cx, cy);
			g.rotate(th);
			g.fillStyle = rgba('#e8c8b0', 0.55);
			g.beginPath();
			g.ellipse(0, 0, Math.hypot(d.b[0] - d.a[0], d.b[1] - d.a[1]) * 0.42, d.rb * 0.68, 0, 0, Math.PI * 2);
			g.fill();
			g.strokeStyle = rgba(sk.lo, 0.5);
			g.lineWidth = 0.9;
			g.stroke();
			g.fillStyle = 'rgba(255,248,236,0.45)';
			g.beginPath();
			g.ellipse(2, -d.rb * 0.25, 3, 1.3, 0, 0, Math.PI * 2);
			g.fill();
			g.restore();
		}
		if (p.ring && i === 2) {
			const s = segs[0];
			const th = Math.atan2(s.b[1] - s.a[1], s.b[0] - s.a[0]);
			const cx = lerp(s.a[0], s.b[0], 0.45);
			const cy = lerp(s.a[1], s.b[1], 0.45);
			g.save();
			g.translate(cx, cy);
			g.rotate(th);
			g.fillStyle = '#8a8a86';
			g.fillRect(-3.2, -s.ra * 1.02, 6.4, s.ra * 2.04);
			g.fillStyle = 'rgba(255,255,250,0.85)';
			g.fillRect(-1.2, -s.ra * 0.9, 1.8, s.ra * 1.2);
			g.restore();
		}
	});
	if (dorsal) {
		// nudillos y tendones
		g.strokeStyle = rgba(sk.hi, 0.35);
		g.lineWidth = 2;
		for (const F of FING) {
			g.beginPath();
			g.moveTo(F.b[0] * 0.5, -18);
			g.quadraticCurveTo(F.b[0] * 0.85, -55, F.b[0], F.b[1] + 4);
			g.stroke();
		}
	} else {
		// líneas de la palma
		g.strokeStyle = ink;
		g.lineWidth = 1.3;
		g.beginPath();
		g.moveTo(-36, -70);
		g.bezierCurveTo(-10, -78, 20, -80, 40, -72);
		g.moveTo(-38, -58);
		g.bezierCurveTo(-14, -52, 10, -48, 30, -40);
		g.moveTo(-30, -66);
		g.bezierCurveTo(-18, -40, -16, -18, -12, 0);
		g.stroke();
	}
	if (p.engraved) {
		// grabado: achurado que sigue la forma + manchas de edad (la abuela)
		g.save();
		g.beginPath();
		path(g);
		g.clip();
		const k = p.engraved;
		const gr = g.createLinearGradient(-50, 0, 50, 0);
		gr.addColorStop(0, rgba('#2a160a', 0.05 * k));
		gr.addColorStop(0.5, rgba('#2a160a', 0.35 * k));
		gr.addColorStop(1, rgba('#2a160a', 0.75 * k));
		g.strokeStyle = gr;
		g.lineWidth = 0.9;
		for (let y = -200; y < (p.forearm ?? 260); y += 3.4) {
			g.beginPath();
			g.moveTo(-60, y);
			g.bezierCurveTo(-20, y - 6, 20, y - 6, 60, y + 2);
			g.stroke();
		}
		g.strokeStyle = rgba('#2a160a', 0.4 * k);
		g.lineWidth = 0.7;
		for (let y = -110; y < 40; y += 5) {
			g.beginPath();
			g.moveTo(10, y - 30);
			g.lineTo(60, y + 20);
			g.stroke();
		}
		if (dorsal) {
			for (let i = 0; i < 26; i++) {
				const x = -36 + hash(i, 501) * 72;
				const y = -95 + hash(i, 502) * 100;
				g.fillStyle = rgba('#5a3418', (0.18 + hash(i, 503) * 0.3) * k);
				g.beginPath();
				g.ellipse(x, y, 1.5 + hash(i, 504) * 2.8, 1.2 + hash(i, 505) * 2.2, 0, 0, Math.PI * 2);
				g.fill();
			}
			// venas
			g.strokeStyle = rgba('#7a5a44', 0.45 * k);
			g.lineWidth = 2.2;
			g.beginPath();
			g.moveTo(-14, 10);
			g.bezierCurveTo(-18, -20, -6, -40, -12, -70);
			g.moveTo(8, 12);
			g.bezierCurveTo(14, -18, 4, -44, 14, -72);
			g.stroke();
			// arrugas de nudillo
			g.strokeStyle = rgba('#2a160a', 0.55 * k);
			g.lineWidth = 0.9;
			geom.fingers.forEach((segs) => {
				const s = segs[1];
				for (let j = 0; j < 3; j++) {
					g.beginPath();
					g.ellipse(s.a[0], s.a[1] + j * 2.4 - 2, s.ra * 0.55, 1.6, 0, Math.PI * 0.1, Math.PI * 0.9);
					g.stroke();
				}
			});
		}
		g.restore();
	}
	g.restore();
	return geom;
};

// ---------------------------------------------------------------- listón en la muñeca (vueltas + nudo) o marca pálida
export const wristBand = (g: Ctx, p: HandPose, o: {wraps: number; knot?: number; tails?: number; bare?: number; dim?: number; tailWave?: number}) => {
	g.save();
	handXf(g, p);
	const y0 = 14;
	const dim = o.dim ?? 1;
	if (o.bare) {
		g.strokeStyle = rgba('#efd2bb', 0.4 * o.bare);
		g.lineWidth = 2.2;
		g.beginPath();
		g.moveTo(-37, y0 - 2);
		g.quadraticCurveTo(0, y0 + 4, 37, y0 - 1);
		g.stroke();
		g.strokeStyle = rgba('#6a3a26', 0.3 * o.bare);
		g.lineWidth = 1;
		g.beginPath();
		g.moveTo(-36, y0 + 1.5);
		g.quadraticCurveTo(0, y0 + 7.5, 36, y0 + 2);
		g.stroke();
	}
	const band = (k: number, frac: number) => {
		const yy = y0 + (k ? 7 : -3);
		const slope = k ? -5 : 6;
		g.lineCap = 'butt';
		g.strokeStyle = 'rgba(20,6,3,0.55)';
		g.lineWidth = 10;
		g.beginPath();
		g.moveTo(-40, yy - slope + 2);
		g.lineTo(lerp(-40, 40, frac), yy + slope * (frac * 2 - 1) + 2);
		g.stroke();
		const N = 12;
		for (let i = 0; i < N * frac; i++) {
			const u0 = i / N;
			const u1 = Math.min(frac, (i + 1) / N);
			const col = ribbonColor(i * 18 + k * 50);
			g.strokeStyle = `rgb(${Math.round(col[0] * dim)},${Math.round(col[1] * dim)},${Math.round(col[2] * dim)})`;
			g.lineWidth = 8;
			g.beginPath();
			g.moveTo(lerp(-40, 40, u0), yy + slope * (u0 * 2 - 1));
			g.lineTo(lerp(-40, 40, u1), yy + slope * (u1 * 2 - 1));
			g.stroke();
		}
		g.strokeStyle = rgba('#f3a27e', 0.4 * dim);
		g.lineWidth = 1.4;
		g.beginPath();
		g.moveTo(-38, yy + slope * -1 - 2.5);
		g.lineTo(lerp(-38, 38, frac), yy + slope * (frac * 2 - 1) - 2.5);
		g.stroke();
	};
	if (o.wraps > 0) band(0, clamp(o.wraps));
	if (o.wraps > 1) band(1, clamp(o.wraps - 1));
	if (o.knot) {
		const k = clamp(o.knot);
		const kx = 4;
		const ky = y0 + 2;
		g.fillStyle = `rgb(${Math.round(110 * dim)},${Math.round(36 * dim)},${Math.round(22 * dim)})`;
		g.beginPath();
		g.ellipse(kx, ky, 7 + 2 * k, 6 + 1.5 * k, 0.3, 0, Math.PI * 2);
		g.fill();
		g.fillStyle = `rgb(${Math.round(201 * dim)},${Math.round(85 * dim)},${Math.round(59 * dim)})`;
		g.beginPath();
		g.ellipse(kx - 1.5, ky - 1.5, 4 + k, 3 + k * 0.6, 0.3, 0, Math.PI * 2);
		g.fill();
		const tl = (o.tails ?? 1) * 26;
		const wv = o.tailWave ?? 0;
		for (const sd of [-1, 1]) {
			g.strokeStyle = 'rgba(20,6,3,0.5)';
			g.lineWidth = 8;
			g.lineCap = 'round';
			g.beginPath();
			g.moveTo(kx, ky + 3);
			g.quadraticCurveTo(kx + sd * 10 + wv * 3, ky + tl * 0.6, kx + sd * (8 + tl * 0.3) + wv * 5, ky + tl + 2);
			g.stroke();
			const col = ribbonColor(sd * 40 + 20);
			g.strokeStyle = `rgb(${Math.round(col[0] * dim)},${Math.round(col[1] * dim)},${Math.round(col[2] * dim)})`;
			g.lineWidth = 6.5;
			g.beginPath();
			g.moveTo(kx, ky + 3);
			g.quadraticCurveTo(kx + sd * 10 + wv * 3, ky + tl * 0.6, kx + sd * (8 + tl * 0.3) + wv * 5, ky + tl);
			g.stroke();
			// puntas deshilachadas
			g.strokeStyle = `rgba(${Math.round(168 * dim)},${Math.round(58 * dim)},${Math.round(37 * dim)},0.8)`;
			g.lineWidth = 0.8;
			for (let j = -2; j <= 2; j++) {
				const ex = kx + sd * (8 + tl * 0.3) + wv * 5 + j * 1.3;
				const ey = ky + tl;
				g.beginPath();
				g.moveTo(ex, ey);
				g.lineTo(ex + j * 0.6, ey + 4 + Math.abs(j));
				g.stroke();
			}
		}
	}
	g.restore();
};

// manga con puño de sudadera (cubre el antebrazo desde 'at')
export const sleeve = (g: Ctx, p: HandPose, at: number, color = '#1b1917', rib = '#2a2724', width = 1.25) => {
	g.save();
	handXf(g, p);
	const L = (p.forearm ?? 260) + 40;
	const path = (q: Ctx) => {
		q.moveTo(-44 * width, at);
		q.bezierCurveTo(-52 * width, at + L * 0.3, -60 * width, at + L * 0.7, -66 * width, at + L);
		q.lineTo(66 * width, at + L);
		q.bezierCurveTo(60 * width, at + L * 0.7, 52 * width, at + L * 0.3, 44 * width, at);
		q.quadraticCurveTo(0, at - 6, -44 * width, at);
	};
	paintShape(g, path, [-70 * width, at - 10, 140 * width, L + 20], {fill: color, light: -Math.PI * 0.7, shadow: {color: '#050403', width: 20, alpha: 0.8}, rim: {color: P.moon, width: 3, alpha: 0.35}, texture: {seed: 130, scale: 0.2, alpha: 0.2}}, p.s);
	g.strokeStyle = rib;
	g.lineWidth = 1.6;
	for (let x = -40; x <= 40; x += 6) {
		g.beginPath();
		g.moveTo(x * width, at + 2);
		g.lineTo(x * width * 1.03, at + 26);
		g.stroke();
	}
	g.restore();
};
