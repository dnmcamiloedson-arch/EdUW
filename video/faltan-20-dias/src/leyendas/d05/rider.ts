// El Charro Negro a caballo, DE FRENTE (planos LEJOS 130 px · MEDIO 320 px · CERCA 820 px · SUBLIMINAL).
// Dibujo de autor en capas (cada una con paintShape, así los bordes internos se leen con su propio rim):
//   A · atrás: barril del caballo, patas traseras, piernas del jinete, torso y brazos (+ botonadura, grecas, estribos, rodajas)
//   B · sarape negro al hombro izquierdo (simCloth 6×10 fijado en el hombro, ráfaga en el plano MEDIO)
//   C · adelante: pecho, cuello, patas delanteras (escarbado) y cabeza del caballo (+ freno, conchos, ollares, ojos)
//   D · cabeza y sombrero con ladeo (ala con galón de plata, copa con pilón, barboquejo) y el vacío con los ojos de brasa.
// Coordenadas normalizadas: x a la derecha, y hacia arriba, 1 = alto total (≈3 m); (cx, gy) = suelo bajo el caballo.
import {noise2D} from '@remotion/noise';
import {clamp, lerp, rgba} from '../../lib/util';
import {glow, type Ctx} from '../kit/paint';
import {clothAt, simCloth, smoothPath, type V2} from '../kit/rig';
import {paintShape, type Mat} from '../kit/shade';
import {emberEyes} from './charro';
import {P} from './timeline';

export type RiderOpts = {
	f: number;
	t: number;
	eyes: number; // 0..1 encendido de los ojos
	tilt?: number; // ladeo de la cabeza (rad)
	warm?: number; // cuánto le llega el farol (halo cálido)
	scrape?: number; // 0..1 pata delantera levantada (escarbado)
	headTurn?: number; // giro de la cabeza del caballo (-1..1)
	headDown?: number; // 0..1 cabeza baja
	ear?: number; // giro de oreja 0..1
	detail?: number; // 0 = lejos (sin detalle fino), 1 = cerca
	fog?: number; // 0..1 mezcla con la niebla (lejos)
};

// ---------- utilidades de forma ----------
const orient = (pts: V2[]): V2[] => {
	let a = 0;
	for (let i = 0; i < pts.length; i++) {
		const p = pts[i];
		const q = pts[(i + 1) % pts.length];
		a += p[0] * q[1] - q[0] * p[1];
	}
	return a < 0 ? pts.slice().reverse() : pts;
};
// extremidad: línea central con anchos → contorno cerrado
const limb = (c: V2[], w: number[]): V2[] => {
	const L: V2[] = [];
	const R: V2[] = [];
	for (let i = 0; i < c.length; i++) {
		const a = c[Math.max(0, i - 1)];
		const b = c[Math.min(c.length - 1, i + 1)];
		let nx = -(b[1] - a[1]);
		let ny = b[0] - a[0];
		const d = Math.hypot(nx, ny) || 1;
		nx /= d;
		ny /= d;
		L.push([c[i][0] + (nx * w[i]) / 2, c[i][1] + (ny * w[i]) / 2]);
		R.push([c[i][0] - (nx * w[i]) / 2, c[i][1] - (ny * w[i]) / 2]);
	}
	return [...L, ...R.reverse()];
};
const mirror = (pts: V2[]): V2[] => pts.map(([x, y]) => [-x, y] as V2);

// ---------- sarape (simCloth en unidades ×1000, y hacia abajo) ----------
const SC = 4;
const SR = 10;
const SSP = 27;
const sarapeWind = (f: number) => {
	// ráfaga en el plano MEDIO (13.0–14.2 s) y brisa el resto
	const g1 = clamp((f - 372) / 10) * (1 - clamp((f - 430) / 24));
	return 0.03 + 0.05 * (0.5 + 0.5 * noise2D('d5sw', f * 0.04, 0)) + 0.55 * g1 * (0.7 + 0.3 * noise2D('d5sg', f * 0.2, 1));
};
const sarapeSim = () =>
	simCloth({
		key: 'd5sarapeFront',
		frames: 500,
		cols: SC,
		rows: SR,
		spacing: SSP,
		pin: (_f, c, r) => (r === 0 ? [lerp(62, 138, c / (SC - 1)), lerp(-812, -784, c / (SC - 1))] : null),
		rest: (c, r) => [lerp(62, 138, c / (SC - 1)) + r * 3, lerp(-812, -784, c / (SC - 1)) + r * SSP],
		gravity: 0.28,
		damping: 0.95,
		iterations: 4,
		wind: (f, c, r) => {
			const w = sarapeWind(f);
			return [w * (0.2 + r / SR) * (0.6 + c / SC), -w * 0.35 * (r / SR) + noise2D('d5sy', f * 0.08, c + r) * w * 0.3];
		},
	});

const mat = (warm: number, fogK: number): Mat => ({
	fill: (g, b) => {
		const gr = g.createLinearGradient(0, b[1], 0, b[1] + b[3]);
		gr.addColorStop(0, fogK > 0 ? '#16201f' : '#121212');
		gr.addColorStop(0.5, '#0B0704');
		gr.addColorStop(1, '#080503');
		return gr;
	},
	light: -Math.PI / 2,
	rim: {color: P.moonRim, width: 2.5, alpha: 0.6, blur: 1.5},
	shadow: {color: '#000000', width: 9, alpha: 0.55, blur: 6},
	texture: {seed: 33, scale: 1.2, alpha: 0.12, color: '#3a3430'},
	halo: warm > 0.02 ? {color: P.cempa, r: 10, alpha: warm * 0.22} : undefined,
});

export const riderFront2 = (g: Ctx, cx: number, gy: number, u: number, o: RiderOpts) => {
	const {f, t, eyes, tilt = 0, warm = 0, scrape = 0, headTurn = 0, ear = 0} = o;
	const det = o.detail ?? clamp((u - 180) / 400);
	const fogK = o.fog ?? 0;
	const X = (x: number) => cx + x * u;
	const Y = (y: number) => gy - y * u;
	const S = (pts: V2[]): V2[] => orient(pts.map(([x, y]) => [X(x), Y(y)] as V2));
	const shape = (g2: Ctx, pts: V2[]) => smoothPath(g2, S(pts), true, 0.55);
	const ell = (g2: Ctx, x: number, y: number, rx: number, ry: number) => {
		g2.moveTo(X(x) + rx * u, Y(y));
		g2.ellipse(X(x), Y(y), rx * u, ry * u, 0, 0, Math.PI * 2);
	};
	const box = (x0: number, y0: number, x1: number, y1: number): [number, number, number, number] => [X(x0), Y(y1), (x1 - x0) * u, (y1 - y0) * u];
	const M = mat(warm, fogK);
	const res = u > 420 ? 0.4 : u > 200 ? 0.7 : 1;
	const chest = Math.sin(t * Math.PI * 2 * 0.28) * 0.0025; // el pecho sube ~2 px a 0.28 Hz (cerca)
	const ribs = Math.sin(t * Math.PI * 2 * 0.4) * 0.004;

	// ---------- A · atrás ----------
	const torso: V2[] = [
		[-0.078, 0.6], [-0.09, 0.68], [-0.11, 0.748], [-0.124, 0.786 + chest], [-0.1, 0.806 + chest], [-0.045, 0.814 + chest], [0, 0.817 + chest],
		[0.045, 0.814 + chest], [0.1, 0.806 + chest], [0.124, 0.786 + chest], [0.11, 0.748], [0.09, 0.68], [0.078, 0.6],
	];
	const thigh = (s: number) => limb([[0.07 * s, 0.61], [0.13 * s, 0.585], [0.166 * s, 0.548], [0.163 * s, 0.46], [0.16 * s, 0.39]], [0.07, 0.062, 0.052, 0.044, 0.038]);
	const arm = (s: number) => limb([[0.112 * s, 0.786 + chest], [0.132 * s, 0.745], [0.136 * s, 0.7], [0.096 * s, 0.662], [0.042 * s, 0.642]], [0.054, 0.048, 0.042, 0.036, 0.032]);
	const hind = (s: number) => limb([[0.1 * s, 0.43], [0.104 * s, 0.3], [0.1 * s, 0.17], [0.096 * s, 0.05], [0.098 * s, 0.006]], [0.07, 0.05, 0.04, 0.034, 0.048]);
	paintShape(
		g,
		(g2) => {
			ell(g2, 0, 0.47 + ribs, 0.165, 0.12 + ribs);
			shape(g2, hind(1));
			shape(g2, hind(-1));
			shape(g2, thigh(1));
			shape(g2, thigh(-1));
			ell(g2, 0.163, 0.37, 0.026, 0.024);
			ell(g2, -0.163, 0.37, 0.026, 0.024);
			shape(g2, torso);
			ell(g2, 0, 0.825, 0.03, 0.03);
			shape(g2, arm(1));
			shape(g2, arm(-1));
			ell(g2, 0.036, 0.638, 0.024, 0.02);
			ell(g2, -0.036, 0.638, 0.024, 0.02);
		},
		box(-0.24, 0, 0.24, 0.86),
		M,
		res,
	);
	if (det > 0.02) {
		g.save();
		g.globalCompositeOperation = 'lighter';
		// botonadura: 9 botones de plata por pierna en la costura exterior; un destello viaja de abajo hacia arriba
		for (const s of [-1, 1]) {
			const seam: V2[] = [[0.1 * s, 0.6], [0.15 * s, 0.578], [0.192 * s, 0.548], [0.186 * s, 0.46], [0.18 * s, 0.4]];
			for (let i = 0; i < 9; i++) {
				const k = (i / 8) * (seam.length - 1);
				const j = Math.min(seam.length - 2, Math.floor(k));
				const v = k - j;
				const bx = lerp(seam[j][0], seam[j + 1][0], v);
				const by = lerp(seam[j][1], seam[j + 1][1], v);
				const ph = ((t * 0.7 + (s > 0 ? 0.37 : 0)) % 1.6) / 1.6;
				const sp = Math.exp(-Math.pow((1 - i / 8 - ph) * 7, 2));
				const a = (0.3 + 0.7 * sp) * det;
				g.fillStyle = rgba(P.silver, a);
				g.beginPath();
				g.arc(X(bx), Y(by), Math.max(0.8, 0.0042 * u), 0, Math.PI * 2);
				g.fill();
				if (sp > 0.4) glow(g, X(bx), Y(by), 0.02 * u, P.silver, 0.35 * sp * det, 0.25);
			}
		}
		// grecas de plata en el borde de la chaqueta y solapas
		g.strokeStyle = rgba(P.silver, 0.32 * det);
		g.lineWidth = Math.max(0.7, 0.0028 * u);
		g.setLineDash([0.012 * u, 0.008 * u]);
		g.beginPath();
		g.moveTo(X(-0.082), Y(0.665));
		g.quadraticCurveTo(X(0), Y(0.652), X(0.082), Y(0.665));
		g.moveTo(X(-0.03), Y(0.815));
		g.quadraticCurveTo(X(-0.05), Y(0.74), X(-0.02), Y(0.668));
		g.stroke();
		g.setLineDash([]);
		g.restore();
		// estribos (madera oscura con canto de plata) y rodajas de estrella
		for (const s of [-1, 1]) {
			const sx = 0.163 * s;
			g.fillStyle = '#0d0906';
			g.beginPath();
			g.moveTo(X(sx - 0.022), Y(0.382));
			g.quadraticCurveTo(X(sx), Y(0.392), X(sx + 0.022), Y(0.382));
			g.lineTo(X(sx + 0.028), Y(0.352));
			g.quadraticCurveTo(X(sx), Y(0.344), X(sx - 0.028), Y(0.352));
			g.closePath();
			g.fill();
			g.strokeStyle = rgba(P.silver, 0.35 * det);
			g.lineWidth = Math.max(0.8, 0.0025 * u);
			g.beginPath();
			g.moveTo(X(sx + 0.028), Y(0.352));
			g.quadraticCurveTo(X(sx), Y(0.344), X(sx - 0.028), Y(0.352));
			g.stroke();
			// correa del estribo
			g.strokeStyle = rgba('#0a0705', 1);
			g.lineWidth = Math.max(1, 0.008 * u);
			g.beginPath();
			g.moveTo(X(sx * 0.82), Y(0.58));
			g.lineTo(X(sx), Y(0.388));
			g.stroke();
			// rodaja de 12 puntas que gira despacio
			const rx = X(sx + 0.03 * s);
			const ry = Y(0.372);
			const rr = 0.014 * u;
			g.save();
			g.globalCompositeOperation = 'lighter';
			g.strokeStyle = rgba(P.silver, 0.55 * det);
			g.lineWidth = Math.max(0.6, 0.0018 * u);
			g.beginPath();
			for (let i = 0; i < 12; i++) {
				const a = (i / 12) * Math.PI * 2 + t * 0.6 * s;
				g.moveTo(rx, ry);
				g.lineTo(rx + Math.cos(a) * rr, ry + Math.sin(a) * rr * 0.55);
			}
			g.stroke();
			g.restore();
		}
	}

	// ---------- B · sarape ----------
	const cl = clothAt(sarapeSim(), SC, SR, f);
	const CP = (c: number, r: number): V2 => {
		const i = (r * SC + c) * 2;
		return [X(cl[i] / 1000), gy + (cl[i + 1] / 1000) * u];
	};
	const outline: V2[] = [];
	for (let r = 0; r < SR; r++) outline.push(CP(0, r));
	for (let c = 1; c < SC; c++) outline.push(CP(c, SR - 1));
	for (let r = SR - 2; r >= 0; r--) outline.push(CP(SC - 1, r));
	for (let c = SC - 2; c > 0; c--) outline.push(CP(c, 0));
	const ol = orient(outline);
	let bx0 = 1e9, by0 = 1e9, bx1 = -1e9, by1 = -1e9;
	for (const [x, y] of ol) {
		bx0 = Math.min(bx0, x);
		by0 = Math.min(by0, y);
		bx1 = Math.max(bx1, x);
		by1 = Math.max(by1, y);
	}
	paintShape(g, (g2) => smoothPath(g2, ol, true, 0.5), [bx0, by0, bx1 - bx0, by1 - by0], {...M, fill: '#0d0806', shadow: undefined, texture: {seed: 33, scale: 0.8, alpha: 0.18, color: '#3a3430'}}, res);
	if (det > 0.02) {
		// franjas apagadas del sarape (terracota y hueso muy bajos) siguiendo las filas de la tela
		g.save();
		g.beginPath();
		smoothPath(g, ol, true, 0.5);
		g.clip();
		for (const [r0, col, a] of [[2, P.terra, 0.08], [6, P.terra, 0.07]] as [number, string, number][]) {
			g.fillStyle = rgba(col, a * det);
			g.beginPath();
			const top: V2[] = [];
			const bot: V2[] = [];
			for (let c = 0; c < SC; c++) {
				const p0 = CP(c, r0);
				const p1 = CP(c, r0 + 1);
				top.push([lerp(p0[0], p1[0], 0.15), lerp(p0[1], p1[1], 0.15)]);
				bot.push([lerp(p0[0], p1[0], 0.45), lerp(p0[1], p1[1], 0.45)]);
			}
			const poly = [...top, ...bot.reverse()];
			g.moveTo(poly[0][0], poly[0][1]);
			for (const p of poly) g.lineTo(p[0], p[1]);
			g.closePath();
			g.fill();
		}
		g.restore();
		// pliegues: sombras a lo largo de las columnas (la tela cae en tubos) y brillo frío en las crestas
		g.save();
		g.beginPath();
		smoothPath(g, ol, true, 0.5);
		g.clip();
		g.lineCap = 'round';
		for (let c = 0; c < SC; c++) {
			const pts: V2[] = [];
			for (let r = 0; r < SR; r++) pts.push(CP(c, r));
			const ridge = c % 2 === 0;
			g.strokeStyle = ridge ? rgba(P.moonRim, 0.07 * det) : 'rgba(0,0,0,0.55)';
			g.lineWidth = Math.max(1, (ridge ? 0.006 : 0.012) * u);
			g.beginPath();
			smoothPath(g, pts.map(([x, y]) => [x + (ridge ? 0 : 0.008 * u), y] as V2), false, 0.5);
			g.stroke();
		}
		g.restore();
		// fleco
		g.strokeStyle = rgba('#120b07', 1);
		g.lineWidth = Math.max(0.6, 0.0022 * u);
		g.beginPath();
		for (let c = 0; c < SC - 1; c++)
			for (let k = 0; k < 4; k++) {
				const p0 = CP(c, SR - 1);
				const p1 = CP(c + 1, SR - 1);
				const x = lerp(p0[0], p1[0], k / 4);
				const y = lerp(p0[1], p1[1], k / 4);
				const sw = noise2D('d5fr', f * 0.15, c * 4 + k) * 0.01 * u + sarapeWind(f) * 0.03 * u;
				g.moveTo(x, y);
				g.lineTo(x + sw, y + 0.022 * u);
			}
		g.stroke();
	}

	// ---------- C · caballo al frente ----------
	const ht = headTurn * 0.012;
	// cabeza del caballo en 3/4 hacia la izquierda de pantalla (se lee al instante como caballo); hd = cabeza baja
	const hd = o.headDown ?? 0;
	const H3 = (pts: V2[]): V2[] => pts.map(([x, y]) => [x + ht, y - hd * 0.05 + (0.668 - y) * hd * 0.15] as V2);
	const head = H3([
		[0.01, 0.668], [-0.02, 0.656], [-0.036, 0.636], [-0.05, 0.585], [-0.064, 0.525], [-0.076, 0.48], [-0.082, 0.458], [-0.072, 0.436], [-0.05, 0.432],
		[-0.034, 0.442], [-0.02, 0.472], [0.002, 0.515], [0.03, 0.548], [0.042, 0.59], [0.046, 0.625], [0.036, 0.655],
	]);
	const earL = H3([[-0.018, 0.652], [-0.034, 0.706], [-0.024, 0.71], [0.004, 0.668]]);
	const earR = H3([[0.012, 0.664], [0.022 + ear * 0.012, 0.712 - ear * 0.01], [0.032 + ear * 0.01, 0.708], [0.04, 0.656]]);
	const neck = H3([[-0.05, 0.55], [-0.035, 0.625], [0.0, 0.662], [0.048, 0.64], [0.072, 0.58], [0.064, 0.52]]);
	const chestP: V2[] = [
		[-0.116, 0.525], [-0.127, 0.45], [-0.112, 0.372], [-0.074, 0.336], [-0.034, 0.346], [0, 0.357], [0.034, 0.346], [0.074, 0.336], [0.112, 0.372], [0.127, 0.45], [0.116, 0.525],
		[0.062, 0.6], [0.04, 0.63], [-0.04, 0.63], [-0.062, 0.6],
	];
	const fore = (s: number, lift: number) =>
		limb(
			[
				[0.07 * s, 0.38], [0.068 * s, 0.29], [0.065 * s, 0.205 + lift * 0.02], [0.063 * s, 0.17 + lift * 0.035], [0.061 * s, 0.1 + lift * 0.06],
				[0.06 * s + lift * 0.004, 0.055 + lift * 0.075], [0.062 * s + lift * 0.006, 0.008 + lift * 0.09],
			],
			[0.076, 0.06, 0.058, 0.038, 0.034, 0.044, 0.058],
		);
	paintShape(
		g,
		(g2) => {
			shape(g2, chestP);
			shape(g2, neck);
			shape(g2, fore(-1, scrape));
			shape(g2, fore(1, 0));
		},
		box(-0.15, 0, 0.15, 0.68),
		M,
		res,
	);
	// cabeza del caballo en su propia capa: sombra proyectada sobre el pecho + rim cálido del farol abajo
	g.save();
	g.globalAlpha = 0.6;
	g.fillStyle = '#000000';
	g.filter = `blur(${Math.max(1, 0.01 * u)}px)`;
	g.beginPath();
	shape(g, head.map(([x, y]) => [x + 0.006, y - 0.012] as V2));
	g.fill();
	g.restore();
	paintShape(
		g,
		(g2) => {
			shape(g2, head);
			shape(g2, earL);
			shape(g2, earR);
		},
		box(-0.1, 0.38, 0.08, 0.73),
		{...M, light: warm > 0.3 ? Math.PI / 2 + 0.5 : -Math.PI / 2, rim: warm > 0.3 ? {color: P.cempa, width: 2.5, alpha: 0.45 * warm, blur: 2} : M.rim},
		res,
	);
	// brillo frío de luna sobre la caña nasal y la frente
	if (det > 0.05) {
		const hl = g.createLinearGradient(0, Y(0.65), 0, Y(0.43));
		hl.addColorStop(0, rgba(P.moonRim, 0.16 * det));
		hl.addColorStop(1, rgba(P.moonRim, 0));
		g.fillStyle = hl;
		g.beginPath();
		g.ellipse(X(ht - 0.05), Y(0.56 - hd * 0.05), 0.008 * u, 0.075 * u, -0.3, 0, Math.PI * 2);
		g.fill();
	}
	// freno y conchos de plata, riendas al guante
	if (det > 0.02) {
		const Q = (x: number, y: number): V2 => H3([[x, y]])[0];
		const L = (pts: V2[]) => {
			g.beginPath();
			pts.forEach(([x, y], i) => (i ? g.lineTo(X(x), Y(y)) : g.moveTo(X(x), Y(y))));
			g.stroke();
		};
		g.save();
		g.strokeStyle = rgba('#050302', 1);
		g.lineWidth = Math.max(0.8, 0.004 * u);
		L([Q(0.004, 0.662), Q(-0.02, 0.56), Q(-0.05, 0.46)]);
		L([Q(-0.07, 0.505), Q(-0.04, 0.5), Q(0.0, 0.512)]);
		g.strokeStyle = rgba('#070504', 1);
		for (const s2 of [-1, 1]) L([Q(-0.05, 0.46), [0.03 * s2, 0.55], [0.036 * s2, 0.636]]);
		g.globalCompositeOperation = 'lighter';
		const cc = Q(0.0, 0.6);
		glow(g, X(cc[0]), Y(cc[1]), 0.012 * u, P.silver, 0.5 * det, 0.3);
		const bt = Q(-0.05, 0.46);
		g.strokeStyle = rgba(P.silver, 0.5 * det);
		g.lineWidth = Math.max(0.6, 0.002 * u);
		g.beginPath();
		g.arc(X(bt[0]), Y(bt[1]), 0.005 * u, 0, Math.PI * 2);
		g.stroke();
		g.restore();
	}
	// ollar (interior con brillo naranja apagado) y ojo de brasa del caballo
	{
		const [nx0, ny0] = H3([[-0.071, 0.462]])[0];
		g.fillStyle = '#020101';
		g.beginPath();
		g.ellipse(X(nx0), Y(ny0), 0.006 * u, 0.01 * u, -0.5, 0, Math.PI * 2);
		g.fill();
		if (det > 0.1) glow(g, X(nx0), Y(ny0), 0.009 * u, P.terra, 0.25 * det, 0.3);
		const [ex0, ey0] = H3([[-0.02, 0.615]])[0];
		glow(g, X(ex0), Y(ey0), Math.max(1.5, 0.011 * u), P.terra, 0.6 * Math.min(1, eyes + 0.4), 0.3);
		g.fillStyle = rgba('#ff5a2a', 0.5 * Math.min(1, eyes + 0.3));
		g.beginPath();
		g.ellipse(X(ex0), Y(ey0), Math.max(0.8, 0.005 * u), Math.max(0.5, 0.0028 * u), -0.4, 0, Math.PI * 2);
		g.fill();
	}
	// vaho de los ollares cada 2.4 s
	const bu = (t % 2.4) / 2.4;
	if (bu < 0.6) {
		const [mx, my] = H3([[-0.08, 0.452]])[0];
		vaho(g, X(mx), Y(my), 0.11 * u, bu / 0.6, 0.11, warm, Math.floor(t / 2.4), -0.5);
	}

	// ---------- D · cabeza y sombrero (con ladeo) ----------
	g.save();
	const nx = X(0);
	const ny = Y(0.825 + chest);
	g.translate(nx, ny);
	g.rotate(tilt);
	g.translate(-nx, -ny);
	const brim: V2[] = [
		[-0.172, 0.918], [-0.158, 0.9], [-0.11, 0.882], [-0.055, 0.874], [0, 0.872], [0.055, 0.874], [0.11, 0.882], [0.158, 0.9], [0.172, 0.918],
		[0.158, 0.912], [0.11, 0.902], [0.055, 0.898], [0, 0.897], [-0.055, 0.898], [-0.11, 0.902], [-0.158, 0.912],
	];
	const crown: V2[] = [[-0.052, 0.896], [-0.047, 0.94], [-0.036, 0.985], [-0.02, 1.012], [-0.006, 1.022], [0, 1.016], [0.006, 1.022], [0.02, 1.012], [0.036, 0.985], [0.047, 0.94], [0.052, 0.896]];
	const dc = chest;
	const sh = (pts: V2[]) => pts.map(([x, y]) => [x, y + dc] as V2);
	paintShape(
		g,
		(g2) => {
			ell(g2, 0, 0.852 + dc, 0.036, 0.036);
			shape(g2, sh(brim));
			shape(g2, sh(crown));
		},
		box(-0.18, 0.8, 0.18, 1.03),
		M,
		res,
	);
	// el vacío bajo el ala: negro absoluto
	g.fillStyle = '#000000';
	g.beginPath();
	g.ellipse(X(0), Y(0.852 + dc), 0.03 * u, 0.026 * u, 0, 0, Math.PI * 2);
	g.fill();
	if (det > 0.02 || u > 120) {
		g.save();
		g.globalCompositeOperation = 'lighter';
		// galón de plata en el ala (destellos de guion que viajan) y toquilla
		g.strokeStyle = rgba(P.silver, 0.42);
		g.lineWidth = Math.max(0.7, 0.0035 * u);
		g.setLineDash([0.018 * u, 0.04 * u]);
		g.lineDashOffset = -t * 0.06 * u;
		g.beginPath();
		const bp = S(sh(brim.slice(0, 9)));
		g.moveTo(bp[0][0], bp[0][1]);
		for (const p of bp) g.lineTo(p[0], p[1]);
		g.stroke();
		g.setLineDash([]);
		g.strokeStyle = rgba(P.silver, 0.22);
		g.beginPath();
		g.moveTo(X(-0.05), Y(0.912 + dc));
		g.quadraticCurveTo(X(0), Y(0.906 + dc), X(0.05), Y(0.912 + dc));
		g.stroke();
		g.restore();
	}
	// barboquejo (se mece)
	if (det > 0.05) {
		const sw = Math.sin(t * 1.3) * 0.006 + noise2D('d5bq', t * 0.8, 0) * 0.004;
		g.strokeStyle = rgba('#1c1a18', 0.9);
		g.lineWidth = Math.max(0.6, 0.0022 * u);
		g.beginPath();
		g.moveTo(X(-0.03), Y(0.868 + dc));
		g.quadraticCurveTo(X(sw), Y(0.8 + dc), X(0.03), Y(0.868 + dc));
		g.stroke();
	}
	emberEyes(g, X(0), Y(0.853 + dc), 0.034 * u, 0.026 * u, eyes, t);
	g.restore();
};

// vaho: puff tibio que sube y se abre (pocos gradientes radiales, barato). u 0..1 = vida; dir = deriva lateral
export const vaho = (g: Ctx, x: number, y: number, w: number, u: number, alpha: number, warm: number, seed: number, dir = 0) => {
	if (u <= 0 || u >= 1) return;
	const a = Math.sin(Math.min(1, u / 0.85) * Math.PI) * alpha;
	if (a < 0.005) return;
	const col = warm > 0.3 ? '216,196,168' : '196,204,198';
	g.save();
	for (let i = 0; i < 5; i++) {
		const k = i / 4;
		const r = w * (0.25 + 0.55 * u) * (0.7 + 0.5 * k);
		const px = x + (dir * 0.6 * u + noise2D('vx' + seed, i, u * 2) * 0.35) * w;
		const py = y - (dir === 0 ? (0.1 + 0.45 * u) * w * (0.4 + 0.6 * k) : (0.15 + 0.85 * u) * w * (0.5 + 0.8 * k) * 0.6);
		const gr = g.createRadialGradient(px, py, 0, px, py, r);
		gr.addColorStop(0, `rgba(${col},${a * (1 - k * 0.4)})`);
		gr.addColorStop(1, `rgba(${col},0)`);
		g.fillStyle = gr;
		g.fillRect(px - r, py - r, r * 2, r * 2);
	}
	g.restore();
};
