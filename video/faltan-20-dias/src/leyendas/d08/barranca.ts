// Día 8 · barranca veracruzana (B3 y la orilla de B4): troncos de amate y ceiba con contrafuertes y filo de luna,
// lianas, helechos arborescentes, platanillo, suelo con hojarasca, tecolote. Cada plano se pinta UNA vez en un
// lienzo (coordenadas = pantalla con la cámara en z0 = 0) y se escala por frame según su profundidad (2.5D).
import {noise2D} from '@remotion/noise';
import {H, W, clamp, hash, lerp, mixRGB, rgba} from '../../lib/util';
import {blurred, cached, makeCanvas, type Ctx} from '../kit/paint';
import {paintShape} from '../kit/shade';
import {smoothPath} from '../kit/rig';
import type {V2} from './core';
import {frond} from './fx8';

export const MOONRIM = '#9FC3C4';
export const FOGC = '#3b5c61';
const mixc = (a: string, b: string, k: number) => rgba(mixRGB(a, b, clamp(k)));

// ---------------------------------------------------------------- planos 2.5D
export const MX = 240; // margen lateral del lienzo de plano
export const MT = 260; // margen superior
export const MB = 620; // margen inferior (la panorámica hacia abajo descubre suelo)
export type BPlane = {key: string; z: number; rf: number; blur?: number; draw: (g: Ctx) => void};
export type BView = {x: number; y: number; roll: number}; // giro de cabeza = traslación de pantalla
export const planeSprite = (pl: BPlane) =>
	cached(`d8bp:${pl.key}`, () => {
		const c = makeCanvas(Math.ceil((W + MX * 2) * pl.rf), Math.ceil((H + MT + MB) * pl.rf));
		const g = c.getContext('2d')!;
		g.scale(pl.rf, pl.rf);
		g.translate(MX, MT);
		pl.draw(g);
		if (!pl.blur) return {c, pad: 0};
		const b = blurred(c, pl.blur * pl.rf, `d8bp:${pl.key}`);
		return {c: b.canvas, pad: b.pad};
	});
export const planeK = (z: number, camZ: number) => z / Math.max(1, z - camZ);
// transforma de coordenadas del plano (pantalla a z0) a pantalla actual
export const planeXf = (g: Ctx, z: number, camZ: number, v: BView) => {
	const k = planeK(z, camZ);
	g.translate(W / 2 + v.x, H / 2 + v.y);
	if (v.roll) g.rotate(v.roll);
	g.scale(k, k);
	g.translate(-W / 2, -H / 2);
	return k;
};
export const planePt = (z: number, camZ: number, v: BView, x: number, y: number): V2 => {
	const k = planeK(z, camZ);
	let px = (x - W / 2) * k;
	let py = (y - H / 2) * k;
	if (v.roll) {
		const c = Math.cos(v.roll);
		const s = Math.sin(v.roll);
		[px, py] = [px * c - py * s, px * s + py * c];
	}
	return [W / 2 + v.x + px, H / 2 + v.y + py];
};
export const drawPlane = (g: Ctx, pl: BPlane, camZ: number, v: BView, dyn?: (q: Ctx, k: number) => void) => {
	if (pl.z <= camZ + 30) return;
	const sp = planeSprite(pl);
	g.save();
	const k = planeXf(g, pl.z, camZ, v);
	g.drawImage(sp.c, -MX - sp.pad / pl.rf, -MT - sp.pad / pl.rf, sp.c.width / pl.rf, sp.c.height / pl.rf);
	if (dyn) dyn(g, k);
	g.restore();
};

// ---------------------------------------------------------------- tronco con contrafuertes
export type TrunkSpec = {x: number; gy: number; w: number; h: number; seed: number; lean?: number; kind: 'ceiba' | 'amate'; fog: number; rim?: number; light?: number};
const trunkOutline = (s: TrunkSpec) => {
	const N = 22;
	const L: V2[] = [];
	const R: V2[] = [];
	const lean = s.lean ?? 0;
	const flare = s.kind === 'ceiba' ? 1.9 : 1.15;
	const ub = Math.min(0.4, (s.w * (s.kind === 'ceiba' ? 2.2 : 1.3)) / s.h);
	for (let i = 0; i <= N; i++) {
		const u = i / N;
		const y = s.gy - u * s.h;
		const cx = s.x + lean * s.h * u * u + noise2D('tk' + s.seed, u * 2.2, 0) * Math.min(s.w * 0.18, 16);
		let hw = (s.w / 2) * (1 - 0.18 * u) * (1 + noise2D('tw' + s.seed, u * 3, 1) * 0.06);
		const b = u < ub ? Math.pow(1 - u / ub, 2.4) : 0;
		const bl = hw + s.w * flare * b * (0.8 + hash(s.seed, 1) * 0.5);
		const br = hw + s.w * flare * b * (0.8 + hash(s.seed, 2) * 0.5);
		hw = Math.max(hw, 2);
		L.push([cx - bl, y]);
		R.push([cx + br, y]);
	}
	return {L, R};
};
export const trunk = (g: Ctx, s: TrunkSpec) => {
	const {L, R} = trunkOutline(s);
	const lit = mixc('#566f6b', FOGC, s.fog);
	const mid = mixc('#22302d', FOGC, s.fog);
	const drk = mixc('#090f0e', FOGC, s.fog * 0.9);
	const path = (q: Ctx) => {
		q.moveTo(L[0][0], L[0][1] + 30);
		for (const p of L) q.lineTo(p[0], p[1]);
		for (let i = R.length - 1; i >= 0; i--) q.lineTo(R[i][0], R[i][1]);
		q.lineTo(R[0][0], R[0][1] + 30);
		q.closePath();
	};
	const x0 = Math.min(...L.map((p) => p[0])) - 10;
	const x1 = Math.max(...R.map((p) => p[0])) + 10;
	const box: [number, number, number, number] = [x0, s.gy - s.h - 10, x1 - x0, s.h + 50];
	paintShape(
		g,
		path,
		box,
		{
			fill: (q, b) => {
				const cx = s.x;
				const gr = q.createLinearGradient(cx - s.w * 0.7, 0, cx + s.w * 0.7, 0);
				gr.addColorStop(0, lit);
				gr.addColorStop(0.35, mid);
				gr.addColorStop(1, drk);
				void b;
				return gr;
			},
			light: s.light ?? -2.6,
			shadow: {color: drk, width: Math.max(6, s.w * 0.25), alpha: 0.85, blur: Math.max(3, s.w * 0.08)},
			texture: {seed: 160 + (s.seed % 5), scale: 0.5, alpha: 0.32, color: '#050807'},
		},
		1,
	);
	// corteza: estrías verticales y líquenes (recortados al tronco)
	g.save();
	g.beginPath();
	path(g);
	g.clip();
	g.lineCap = 'round';
	const n = Math.round(s.w / 7);
	for (let i = 0; i < n; i++) {
		const u = (i + 0.5) / n;
		const lw = 0.8 + hash(i, s.seed + 3) * 1.6;
		g.strokeStyle = rgba('#040706', 0.25 + hash(i, s.seed + 4) * 0.3);
		g.lineWidth = lw;
		g.beginPath();
		const y0 = s.gy - hash(i, s.seed + 5) * s.h * 0.3;
		for (let k = 0; k <= 12; k++) {
			const v = k / 12;
			const yy = lerp(y0, s.gy - s.h, v);
			const iL = Math.round(clamp((s.gy - yy) / s.h) * 22);
			const xl = L[Math.min(22, iL)][0];
			const xr = R[Math.min(22, iL)][0];
			const xx = lerp(xl, xr, u) + noise2D('bk' + s.seed, i * 0.7, v * 4) * 3;
			if (k) g.lineTo(xx, yy);
			else g.moveTo(xx, yy);
		}
		g.stroke();
	}
	// líquenes pálidos del lado de luna
	for (let i = 0; i < Math.round(s.h / 40); i++) {
		const v = hash(i, s.seed + 9);
		const iL = Math.round(v * 22);
		const xl = L[iL][0];
		const xr = R[iL][0];
		const xx = lerp(xl, xr, hash(i, s.seed + 10) * 0.45);
		g.fillStyle = rgba(mixRGB('#7f9a90', FOGC, s.fog), 0.12 + hash(i, s.seed + 11) * 0.15);
		g.beginPath();
		g.ellipse(xx, s.gy - v * s.h, 3 + hash(i, s.seed + 12) * s.w * 0.08, 2 + hash(i, s.seed + 13) * 5, 0, 0, Math.PI * 2);
		g.fill();
	}
	g.restore();
	// contrafuerte de frente (ceiba): aleta clara con su filo
	if (s.kind === 'ceiba') {
		const fx = s.x + (hash(s.seed, 6) - 0.5) * s.w * 0.4;
		const top = s.gy - s.h * Math.min(0.32, (s.w * 2) / s.h);
		const foot = s.gy + 20;
		const spread = s.w * 0.55;
		const fin = (q: Ctx) => {
			q.moveTo(fx - s.w * 0.08, top);
			q.quadraticCurveTo(fx - spread * 0.2, lerp(top, foot, 0.7), fx - spread * 0.55, foot);
			q.lineTo(fx + spread * 0.25, foot);
			q.quadraticCurveTo(fx + spread * 0.05, lerp(top, foot, 0.6), fx + s.w * 0.06, top);
			q.closePath();
		};
		paintShape(g, fin, [fx - spread, top - 4, spread * 1.6, foot - top + 8], {fill: mid, light: s.light ?? -2.6, shadow: {color: drk, width: 8, alpha: 0.7}, rim: {color: mixc(MOONRIM, FOGC, s.fog), width: 2.2, alpha: (s.rim ?? 1) * 0.5}});
	}
	// filo de luna en el contorno izquierdo
	if ((s.rim ?? 1) > 0) {
		g.save();
		g.beginPath();
		path(g);
		g.clip();
		g.strokeStyle = mixc(MOONRIM, FOGC, s.fog * 0.8);
		g.globalAlpha = (s.rim ?? 1) * (0.75 - s.fog * 0.4);
		g.lineWidth = Math.max(2, s.w * 0.035);
		g.beginPath();
		smoothPath(g, L.map(([x, y]) => [x + 0.5, y] as V2));
		g.stroke();
		g.globalAlpha *= 0.35;
		g.lineWidth = Math.max(4, s.w * 0.1);
		g.beginPath();
		smoothPath(g, L.map(([x, y]) => [x + s.w * 0.04, y] as V2));
		g.stroke();
		g.restore();
	}
	// raíces de amate que serpentean sobre el suelo
	if (s.kind === 'amate') {
		for (let r = 0; r < 4; r++) {
			const sd = r % 2 ? 1 : -1;
			const len = s.w * (1.2 + hash(r, s.seed + 20) * 1.4);
			const x0r = s.x + sd * s.w * 0.3;
			const pts: V2[] = [];
			for (let k = 0; k <= 8; k++) {
				const u = k / 8;
				pts.push([x0r + sd * len * u, s.gy - s.w * 0.25 * (1 - u) + Math.sin(u * 5 + r) * s.w * 0.05 + u * s.w * 0.12 * (r % 3)]);
			}
			g.lineCap = 'round';
			g.strokeStyle = mid;
			g.lineWidth = s.w * (0.22 - r * 0.03);
			g.beginPath();
			smoothPath(g, pts);
			g.stroke();
			g.strokeStyle = mixc(MOONRIM, FOGC, s.fog);
			g.globalAlpha = (s.rim ?? 1) * 0.35;
			g.lineWidth = Math.max(1.5, s.w * 0.025);
			g.beginPath();
			smoothPath(
				g,
				pts.map(([x, y]) => [x, y - s.w * (0.1 - r * 0.012)] as V2),
			);
			g.stroke();
			g.globalAlpha = 1;
		}
	}
};

// rama horizontal (para el tecolote) — sale de un tronco
export const branch = (g: Ctx, x0: number, y0: number, x1: number, y1: number, w: number, fog: number, seed: number) => {
	const pts: V2[] = [];
	for (let k = 0; k <= 10; k++) {
		const u = k / 10;
		pts.push([lerp(x0, x1, u), lerp(y0, y1, u) - Math.sin(u * Math.PI) * w * 0.8 + noise2D('br' + seed, u * 3, 0) * w * 0.4]);
	}
	g.lineCap = 'round';
	for (let k = 0; k < 10; k++) {
		g.strokeStyle = mixc('#1c2826', FOGC, fog);
		g.lineWidth = lerp(w, w * 0.35, k / 10);
		g.beginPath();
		g.moveTo(pts[k][0], pts[k][1]);
		g.lineTo(pts[k + 1][0], pts[k + 1][1]);
		g.stroke();
	}
	g.strokeStyle = mixc(MOONRIM, FOGC, fog);
	g.globalAlpha = 0.5;
	g.lineWidth = 2;
	g.beginPath();
	smoothPath(g, pts.map(([x, y], k) => [x, y - lerp(w, w * 0.35, k / 10) * 0.42] as V2));
	g.stroke();
	g.globalAlpha = 1;
};

// ---------------------------------------------------------------- suelo de la barranca con hojarasca
export const ground = (g: Ctx, gy: number, fog: number, seed: number, o: {x0?: number; x1?: number; bottom?: number; amp?: number; slope?: number} = {}) => {
	const x0 = o.x0 ?? -MX;
	const x1 = o.x1 ?? W + MX;
	const bottom = o.bottom ?? H + MB;
	const amp = o.amp ?? 40;
	const slope = o.slope ?? 0;
	const edge: V2[] = [];
	for (let x = x0; x <= x1; x += 24) edge.push([x, gy + noise2D('gd' + seed, x * 0.004, 0) * amp + (x - W / 2) * slope]);
	const path = (q: Ctx) => {
		q.moveTo(x0, bottom);
		for (const p of edge) q.lineTo(p[0], p[1]);
		q.lineTo(x1, bottom);
		q.closePath();
	};
	const gr = g.createLinearGradient(0, gy - amp, 0, bottom);
	gr.addColorStop(0, mixc('#1d2a24', FOGC, fog));
	gr.addColorStop(0.25, mixc('#121a16', FOGC, fog * 0.9));
	gr.addColorStop(1, mixc('#070b09', FOGC, fog * 0.7));
	g.fillStyle = gr;
	g.beginPath();
	path(g);
	g.fill();
	// hojarasca: hojas pequeñas, las de arriba tocadas por la luna
	g.save();
	g.beginPath();
	path(g);
	g.clip();
	const n = Math.round(((x1 - x0) * (bottom - gy)) / 2600);
	for (let i = 0; i < n; i++) {
		const x = lerp(x0, x1, hash(i, seed + 1));
		const yv = hash(i, seed + 2);
		const y = gy - amp + yv * yv * (bottom - gy + amp);
		const s = (3 + hash(i, seed + 3) * 7) * (1 + yv * 1.5);
		const lit = clamp(1 - yv * 3) * 0.6;
		g.fillStyle = lit > 0.1 && hash(i, seed + 4) < 0.45 ? mixc('#6f8a80', FOGC, fog) : mixc(hash(i, seed + 5) < 0.5 ? '#2a3326' : '#3a3424', FOGC, fog);
		g.globalAlpha = 0.25 + hash(i, seed + 6) * 0.4;
		g.beginPath();
		g.ellipse(x, y, s, s * 0.38, hash(i, seed + 7) * Math.PI, 0, Math.PI * 2);
		g.fill();
	}
	g.globalAlpha = 1;
	g.restore();
	// filo de luna sobre la cresta del suelo
	g.strokeStyle = mixc(MOONRIM, FOGC, fog);
	g.globalAlpha = 0.28 * (1 - fog * 0.6);
	g.lineWidth = 2;
	g.beginPath();
	edge.forEach((p, i) => (i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1])));
	g.stroke();
	g.globalAlpha = 1;
	return edge;
};

// matorral de helechos (albedo + filo)
export const fernClump = (g: Ctx, x: number, y: number, s: number, seed: number, fog: number, n = 5, rimA = 0.5) => {
	const col = mixc('#2c4426', FOGC, fog);
	for (const mode of ['albedo', 'rim'] as const)
		for (let i = 0; i < n; i++) {
			const a = -Math.PI / 2 + (i / (n - 1) - 0.5) * 2.2 + (hash(i, seed) - 0.5) * 0.3;
			frond(g, {x: x + (hash(i, seed + 1) - 0.5) * s * 0.3, y, L: s * (0.7 + hash(i, seed + 2) * 0.5), ang: a, curl: (a > -Math.PI / 2 ? 1 : -1) * (0.6 + hash(i, seed + 3) * 0.5), flip: a > -Math.PI / 2 ? 1 : -1, seed: seed + i, col, mode, rimA: rimA * (1 - fog * 0.7), droop: 0.4});
		}
};

// helecho arborescente: tallo escamoso + corona de frondas largas
export const treeFern = (g: Ctx, x: number, gy: number, h: number, s: number, seed: number, fog: number) => {
	const top: V2 = [x + (hash(seed, 1) - 0.5) * h * 0.15, gy - h];
	g.lineCap = 'round';
	g.strokeStyle = mixc('#1a201a', FOGC, fog);
	g.lineWidth = 16 * s;
	g.beginPath();
	g.moveTo(x, gy + 10);
	g.quadraticCurveTo(x + (top[0] - x) * 0.3 + 10 * s, gy - h * 0.5, top[0], top[1]);
	g.stroke();
	g.strokeStyle = rgba('#050806', 0.5);
	g.lineWidth = 2;
	for (let k = 0; k < h / 14; k++) {
		const v = k / (h / 14);
		const yy = gy - v * h;
		const xx = lerp(x, top[0], v);
		g.beginPath();
		g.moveTo(xx - 7 * s, yy);
		g.lineTo(xx + 7 * s, yy - 4);
		g.stroke();
	}
	g.strokeStyle = mixc(MOONRIM, FOGC, fog);
	g.globalAlpha = 0.4;
	g.lineWidth = 2;
	g.beginPath();
	g.moveTo(x - 7 * s, gy);
	g.quadraticCurveTo(x + (top[0] - x) * 0.3 + 3 * s, gy - h * 0.5, top[0] - 7 * s, top[1]);
	g.stroke();
	g.globalAlpha = 1;
	const col = mixc('#2a4224', FOGC, fog);
	for (const mode of ['albedo', 'rim'] as const)
		for (let i = 0; i < 9; i++) {
			const a = -Math.PI + (i / 8) * Math.PI + (hash(i, seed + 4) - 0.5) * 0.25;
			const right = Math.cos(a) > 0;
			frond(g, {x: top[0], y: top[1], L: 300 * s * (0.8 + hash(i, seed + 5) * 0.4), ang: a, curl: right ? 1.1 : -1.1, flip: right ? 1 : -1, seed: seed * 7 + i, col, mode, rimA: 0.55 * (1 - fog * 0.6), droop: 1.2, width: 1.1});
		}
};

// hoja de platanillo (heliconia): paleta larga con rasgaduras y nervaduras
export const platLeaf = (g: Ctx, x: number, y: number, L: number, wd: number, ang: number, bend: number, seed: number, col = '#16241a', rimA = 0.5) => {
	const N = 20;
	const mid: V2[] = [];
	let a = ang;
	for (let k = 0; k <= N; k++) {
		const u = k / N;
		if (k) {
			a += (bend / N) * (0.5 + u);
			mid.push([mid[k - 1][0] + Math.cos(a) * (L / N), mid[k - 1][1] + Math.sin(a) * (L / N)]);
		} else mid.push([x, y]);
	}
	const side = (sd: number) =>
		mid.map(([px, py], k) => {
			const u = k / N;
			const k2 = Math.min(N - 1, k);
			const dx = mid[k2 + 1][0] - mid[k2][0];
			const dy = mid[k2 + 1][1] - mid[k2][1];
			const l = Math.hypot(dx, dy) || 1;
			const tear = hash(Math.floor(u * 9), seed + (sd > 0 ? 1 : 2)) < 0.35 && k % 2 === 0 ? 0.35 : 1;
			const w = wd * Math.pow(Math.sin(Math.PI * Math.min(1, u * 1.05)), 0.6) * tear;
			return [px + (-dy / l) * w * sd, py + (dx / l) * w * sd] as V2;
		});
	const A = side(1);
	const Bs = side(-1);
	const path = (q: Ctx) => {
		q.moveTo(mid[0][0], mid[0][1]);
		for (const p of A) q.lineTo(p[0], p[1]);
		for (let i = Bs.length - 1; i >= 0; i--) q.lineTo(Bs[i][0], Bs[i][1]);
		q.closePath();
	};
	const xs = [...A, ...Bs].map((p) => p[0]);
	const ys = [...A, ...Bs].map((p) => p[1]);
	const box: [number, number, number, number] = [Math.min(...xs) - 6, Math.min(...ys) - 6, Math.max(...xs) - Math.min(...xs) + 12, Math.max(...ys) - Math.min(...ys) + 12];
	paintShape(g, path, box, {fill: col, light: -2.4, shadow: {color: '#040705', width: wd * 0.5, alpha: 0.8}, rim: {color: MOONRIM, width: 3, alpha: rimA}, texture: {seed: 171, scale: 0.4, alpha: 0.2}}, 0.6);
	g.save();
	g.beginPath();
	path(g);
	g.clip();
	g.strokeStyle = 'rgba(150,190,180,0.12)';
	g.lineWidth = 1.2;
	for (let k = 1; k < N; k += 1) {
		for (const [S, sd] of [
			[A, 1],
			[Bs, -1],
		] as [V2[], number][]) {
			void sd;
			g.beginPath();
			g.moveTo(mid[k][0], mid[k][1]);
			g.lineTo(lerp(mid[k][0], S[Math.min(N, k + 2)][0], 1), lerp(mid[k][1], S[Math.min(N, k + 2)][1], 1));
			g.stroke();
		}
	}
	g.strokeStyle = 'rgba(160,200,190,0.3)';
	g.lineWidth = 2.5;
	g.beginPath();
	smoothPath(g, mid);
	g.stroke();
	g.restore();
};

// copa: masas de hojas oscuras que cuelgan del borde superior (con filo de luna arriba a la izquierda)
export const canopy = (g: Ctx, y: number, fog: number, seed: number, x0 = -MX, x1 = W + MX, dens = 1) => {
	const n = Math.round(((x1 - x0) / 60) * dens);
	for (let pass = 0; pass < 2; pass++)
		for (let i = 0; i < n; i++) {
			const x = lerp(x0, x1, hash(i, seed));
			const yy = y + (hash(i, seed + 1) - 0.3) * 160;
			const r = 30 + hash(i, seed + 2) * 70;
			if (pass === 0) {
				g.fillStyle = mixc(hash(i, seed + 3) < 0.5 ? '#0d1612' : '#111c15', FOGC, fog);
				g.beginPath();
				for (let k = 0; k < 7; k++) {
					const a = (k / 7) * Math.PI * 2 + hash(i * 7 + k, seed) * 0.5;
					g.ellipse(x + Math.cos(a) * r * 0.6, yy + Math.sin(a) * r * 0.45, r * 0.55, r * 0.28, a, 0, Math.PI * 2);
				}
				g.fill();
			} else if (hash(i, seed + 4) < 0.5) {
				g.strokeStyle = mixc(MOONRIM, FOGC, fog);
				g.globalAlpha = 0.25 * (1 - fog * 0.5);
				g.lineWidth = 2;
				g.beginPath();
				g.arc(x - r * 0.2, yy - r * 0.1, r * 0.55, Math.PI * 1.05, Math.PI * 1.55);
				g.stroke();
				g.globalAlpha = 1;
			}
		}
	g.fillStyle = mixc('#0b130f', FOGC, fog);
	g.fillRect(x0, -MT, x1 - x0, y - 40 + MT);
};

// liana colgante (se mece un poco) — dibujar por frame en coordenadas del plano
export const liana = (g: Ctx, x0: number, y0: number, x1: number, y1: number, sag: number, w: number, fog: number, sway: number) => {
	const pts: V2[] = [];
	for (let k = 0; k <= 16; k++) {
		const u = k / 16;
		pts.push([lerp(x0, x1, u) + Math.sin(u * Math.PI) * sway, lerp(y0, y1, u) + Math.sin(u * Math.PI) * sag]);
	}
	g.lineCap = 'round';
	g.strokeStyle = mixc('#141c18', FOGC, fog);
	g.lineWidth = w;
	g.beginPath();
	smoothPath(g, pts);
	g.stroke();
	g.strokeStyle = mixc(MOONRIM, FOGC, fog);
	g.globalAlpha = 0.35;
	g.lineWidth = Math.max(1, w * 0.25);
	g.beginPath();
	smoothPath(g, pts.map(([x, y]) => [x - w * 0.3, y - w * 0.2] as V2));
	g.stroke();
	g.globalAlpha = 1;
};

// tecolote posado: yaw 1 = de perfil (pico a la izquierda), 0 = de frente
export const owl = (g: Ctx, x: number, y: number, s: number, yaw: number, tilt: number, fog: number) => {
	const body = mixc('#2a2a22', FOGC, fog);
	const dark = mixc('#12130f', FOGC, fog);
	g.save();
	g.translate(x, y);
	g.scale(s / 40, s / 40);
	// cuerpo
	const bp = (q: Ctx) => {
		q.moveTo(0, 0);
		q.bezierCurveTo(-26, -2, -30, -40, -20, -62);
		q.bezierCurveTo(-10, -76, 12, -76, 20, -62);
		q.bezierCurveTo(30, -40, 26, -2, 0, 0);
	};
	paintShape(g, bp, [-32, -80, 64, 84], {fill: body, light: -2.5, shadow: {color: dark, width: 12, alpha: 0.8}, rim: {color: MOONRIM, width: 2.5, alpha: 0.6}, texture: {seed: 180, scale: 0.25, alpha: 0.35}});
	// moteado del pecho
	g.fillStyle = rgba('#0c0d0a', 0.5);
	for (let i = 0; i < 14; i++) {
		g.beginPath();
		g.ellipse(-12 + hash(i, 3) * 24, -10 - hash(i, 4) * 44, 2.2, 1.2, 0, 0, Math.PI * 2);
		g.fill();
	}
	// patas sobre la rama
	g.strokeStyle = dark;
	g.lineWidth = 3;
	g.beginPath();
	g.moveTo(-6, -2);
	g.lineTo(-8, 4);
	g.moveTo(6, -2);
	g.lineTo(8, 4);
	g.stroke();
	// cabeza (gira): disco facial, penachos, ojos
	g.save();
	g.translate(0, -70);
	g.rotate(tilt);
	const hp = (q: Ctx) => {
		q.ellipse(0, 0, 22, 19, 0, 0, Math.PI * 2);
		// penachos
		q.moveTo(-16 + yaw * 6, -12);
		q.lineTo(-20 + yaw * 8, -30);
		q.lineTo(-8 + yaw * 6, -16);
		q.moveTo(16 - yaw * 10, -12);
		q.lineTo(20 - yaw * 14, -30);
		q.lineTo(8 - yaw * 10, -16);
	};
	paintShape(g, hp, [-26, -34, 52, 56], {fill: body, light: -2.5, shadow: {color: dark, width: 9, alpha: 0.75}, rim: {color: MOONRIM, width: 2.5, alpha: 0.65}});
	const ex = (sd: number) => (sd * 9 - yaw * 13) * (sd < 0 ? 1 : Math.max(0, 1 - yaw * 1.2));
	for (const sd of [-1, 1]) {
		const vis = sd < 0 ? 1 : clamp(1 - yaw * 1.3);
		if (vis <= 0.05) continue;
		g.fillStyle = rgba('#c9b46a', 0.85 * vis * (1 - fog * 0.5));
		g.beginPath();
		g.arc(ex(sd), -1, 4.2, 0, Math.PI * 2);
		g.fill();
		g.fillStyle = '#050505';
		g.beginPath();
		g.arc(ex(sd), -1, 2.1, 0, Math.PI * 2);
		g.fill();
	}
	g.fillStyle = rgba('#8a7a50', 0.8);
	g.beginPath();
	g.moveTo(-yaw * 22, 3);
	g.lineTo(-yaw * 22 - 3 - yaw * 4, 9);
	g.lineTo(-yaw * 22 + 3, 8);
	g.fill();
	g.restore();
	g.restore();
};
