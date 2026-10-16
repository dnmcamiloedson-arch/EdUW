// Día 8 · efectos propios de G1: niebla dentro del haz, fronda pinnada procedural (se dobla con onda viajera),
// raíz/peña oscura de borde, desenfoque de movimiento por subcuadros.
import {noise2D} from '@remotion/noise';
import {H, W, clamp, hash, lerp, mixRGB, rgba} from '../../lib/util';
import {fogBand, type Ctx} from '../kit/paint';
import {paintShape} from '../kit/shade';
import {P, scratch, type Beam, type V2} from './core';

// niebla que solo se ve donde el haz la toca (bandas de niebla enmascaradas por el cono de luz, en 'screen')
export const beamFog = (g: Ctx, b: Beam, t: number, o: {y0: number; y1: number; a?: number; seed?: number; speed?: number; color?: string}) => {
	if (b.power <= 0.02) return;
	const {c, g: q} = scratch(5);
	fogBand(q, {y0: o.y0, y1: o.y1, color: o.color ?? '#EDE3CF', t, seed: o.seed ?? 31, alpha: 1, speed: o.speed ?? 16, scale: 1.3});
	fogBand(q, {y0: o.y0 + (o.y1 - o.y0) * 0.3, y1: o.y1 + 120, color: o.color ?? '#EDE3CF', t: t * 0.7 + 9, seed: (o.seed ?? 31) + 1, alpha: 0.7, speed: -(o.speed ?? 16) * 0.6, scale: 1.0});
	q.globalCompositeOperation = 'destination-in';
	q.translate(b.x, b.y);
	q.rotate(b.angle ?? 0);
	q.scale(1, b.squash ?? 0.82);
	const gr = q.createRadialGradient(0, 0, 0, 0, 0, b.r * 1.1);
	gr.addColorStop(0, `rgba(0,0,0,${clamp(b.power)})`);
	gr.addColorStop(0.55, `rgba(0,0,0,${clamp(b.power) * 0.6})`);
	gr.addColorStop(1, 'rgba(0,0,0,0)');
	q.fillStyle = gr;
	q.fillRect(-b.r * 1.2, -b.r * 1.2, b.r * 2.4, b.r * 2.4);
	q.setTransform(1, 0, 0, 1, 0, 0);
	g.save();
	g.globalCompositeOperation = 'screen';
	g.globalAlpha = o.a ?? 0.3;
	g.drawImage(c, 0, 0);
	g.restore();
};

// ---------------------------------------------------------------- fronda de helecho procedural
// bend(u) = curvatura extra (rad) en la posición u∈[0,1] del raquis (onda viajera → la punta llega tarde)
export type FrondOpts = {x: number; y: number; L: number; ang: number; curl?: number; bend?: (u: number) => number; seed?: number; col?: string; dark?: string; flip?: 1 | -1; rim?: string; rimA?: number; mode?: 'albedo' | 'rim'; width?: number; droop?: number};
export const frondSpine = (o: FrondOpts): V2[] => {
	const N = 26;
	const pts: V2[] = [[o.x, o.y]];
	let a = o.ang;
	const fl = o.flip ?? 1;
	const seg = o.L / N;
	for (let k = 1; k <= N; k++) {
		const u = k / N;
		a += ((o.curl ?? 0.9) / N) * (0.4 + u * 1.6) * fl + (o.bend ? o.bend(u) / N : 0) + (o.droop ?? 0) * u * 0.06;
		const [px, py] = pts[k - 1];
		pts.push([px + Math.cos(a) * seg, py + Math.sin(a) * seg]);
	}
	return pts;
};
export const frond = (g: Ctx, o: FrondOpts) => {
	const sp = frondSpine(o);
	const N = sp.length - 1;
	const seed = o.seed ?? 1;
	const col = o.col ?? '#34502a';
	const dark = o.dark ?? rgba(mixRGB(col, '#060d07', 0.5));
	const rimMode = o.mode === 'rim';
	const wk = o.width ?? 1;
	g.save();
	g.lineCap = 'round';
	g.lineJoin = 'round';
	for (let k = 1; k < N; k++) {
		const u = k / N;
		const [x, y] = sp[k];
		const [x1, y1] = sp[k + 1];
		const a = Math.atan2(y1 - y, x1 - x);
		const pl = o.L * 0.16 * wk * Math.sin(Math.PI * Math.min(1, 0.12 + u * 1.02)) * (0.88 + hash(k, seed) * 0.24);
		if (pl < 3) continue;
		for (const sd of [-1, 1]) {
			// pinnas alternas, inclinadas hacia la punta, con leve caída
			const off = sd > 0 ? 0 : 0.5;
			const bx = lerp(x, x1, off);
			const by = lerp(y, y1, off);
			const pa = a + sd * (1.05 - u * 0.35) + 0.12;
			const ex = bx + Math.cos(pa) * pl;
			const ey = by + Math.sin(pa) * pl + pl * 0.12;
			const nx = Math.cos(pa - Math.PI / 2);
			const ny = Math.sin(pa - Math.PI / 2);
			const wv = pl * 0.2;
			const cx = (bx + ex) / 2 + nx * wv * 0.3;
			const cy = (by + ey) / 2 + ny * wv * 0.3;
			if (rimMode) {
				// filo de luna del lado de arriba de cada pinna
				g.strokeStyle = rgba(o.rim ?? P.moon, (o.rimA ?? 0.6) * (sd < 0 ? 1 : 0.45));
				g.lineWidth = 1.4;
				g.beginPath();
				g.moveTo(bx + nx * wv * 0.4, by + ny * wv * 0.4);
				g.quadraticCurveTo(cx + nx * wv * 0.9, cy + ny * wv * 0.9, ex, ey);
				g.stroke();
				continue;
			}
			g.fillStyle = sd < 0 ? col : dark;
			g.beginPath();
			g.moveTo(bx + nx * wv * 0.5, by + ny * wv * 0.5);
			g.quadraticCurveTo(cx + nx * wv, cy + ny * wv, ex, ey);
			g.quadraticCurveTo(cx - nx * wv, cy - ny * wv, bx - nx * wv * 0.5, by - ny * wv * 0.5);
			g.closePath();
			g.fill();
			g.strokeStyle = rgba('#0c1609', 0.45);
			g.lineWidth = 0.9;
			g.beginPath();
			g.moveTo(bx, by);
			g.lineTo(lerp(bx, ex, 0.85), lerp(by, ey, 0.85));
			g.stroke();
		}
	}
	if (!rimMode) {
		g.strokeStyle = rgba(mixRGB(col, '#0a1208', 0.55));
		g.lineWidth = Math.max(2, o.L * 0.011);
		g.beginPath();
		sp.forEach(([x, y], k) => (k ? g.lineTo(x, y) : g.moveTo(x, y)));
		g.stroke();
	}
	g.restore();
	return sp;
};

// ---------------------------------------------------------------- raíz/peña de borde (silueta casi negra con filo de luna)
export const edgeRoot = (g: Ctx, pts: V2[], o: {mode: 'albedo' | 'rim'; col?: string; rim?: string; rimA?: number; light?: number}) => {
	const path = (q: Ctx) => {
		q.moveTo(pts[0][0], pts[0][1]);
		for (let i = 1; i < pts.length - 1; i++) {
			const mx = (pts[i][0] + pts[i + 1][0]) / 2;
			const my = (pts[i][1] + pts[i + 1][1]) / 2;
			q.quadraticCurveTo(pts[i][0], pts[i][1], mx, my);
		}
		q.lineTo(pts[pts.length - 1][0], pts[pts.length - 1][1]);
		q.closePath();
	};
	let x0 = 1e9;
	let y0 = 1e9;
	let x1 = -1e9;
	let y1 = -1e9;
	for (const [x, y] of pts) {
		x0 = Math.min(x0, x);
		y0 = Math.min(y0, y);
		x1 = Math.max(x1, x);
		y1 = Math.max(y1, y);
	}
	if (o.mode === 'albedo') {
		paintShape(g, path, [x0, y0, x1 - x0, y1 - y0], {fill: o.col ?? '#2a2118', light: o.light ?? -Math.PI * 0.6, shadow: {color: '#080503', width: 40, alpha: 0.8}, texture: {seed: 177, scale: 0.6, alpha: 0.4}}, 0.5);
	} else {
		g.save();
		g.beginPath();
		path(g);
		g.clip();
		g.strokeStyle = rgba(o.rim ?? P.moon, o.rimA ?? 0.5);
		g.lineWidth = 5;
		g.translate(3, 4);
		g.beginPath();
		path(g);
		g.stroke();
		g.restore();
	}
};

// ---------------------------------------------------------------- desenfoque de movimiento por subcuadros
// pinta n subcuadros de la función (u∈[0,1) dentro del frame) y los promedia en un lienzo propio
export const subframes = (g: Ctx, n: number, paintAt: (q: Ctx, du: number) => void, idx = 6) => {
	if (n <= 1) {
		paintAt(g, 0);
		return;
	}
	const {c: acc, g: ag} = scratch(idx);
	for (let k = 0; k < n; k++) {
		const {c, g: q} = scratch(idx + 1);
		paintAt(q, k / n - 0.5);
		q.setTransform(1, 0, 0, 1, 0, 0);
		ag.globalAlpha = 1 / (k + 1);
		ag.drawImage(c, 0, 0);
	}
	ag.globalAlpha = 1;
	g.drawImage(acc, 0, 0);
};

export const nz = (id: string, t: number, hz: number, k = 0) => noise2D(id, t * hz, k);
export {H, W};
