// Día 8 · el listón que se vuelve número: centro del «8» de Rye (OCHO_PATH) = recorrido del listón, contorno
// (OCHO_GLYPH) = rótulo. Mecha que corre por el listón, crecimiento del trazo recortado al glifo, glifo final.
import {clamp, hash, lerp, rgba} from '../../lib/util';
import {cached, glow, makeCanvas, type Ctx} from '../kit/paint';
import {OCHO_GLYPH} from './ocho';
import {OCHO} from './stone';
import {P, arcTable, ribbon, scratch, type V2} from './core';

export const GX = 240; // caja del glifo (pantalla, a tamaño de rótulo)
export const GY = 590;
export const GW = 600;
export const GH = 680;

export const glyphPath = () => cached('d8glyphP2D', () => new Path2D(OCHO_GLYPH));
export const OCHO_ARC = cached('d8ochoArc', () => arcTable(OCHO, true));
export const OCHO_TOTAL = () => OCHO_ARC[OCHO_ARC.length - 1];

// punto y tangente por fracción de longitud de arco (0..1, cerrado)
export const ochoAt = (u: number): {p: V2; d: V2; i: number} => {
	const cum = OCHO_ARC;
	const n = OCHO.length;
	const L = cum[n];
	const s = (((u % 1) + 1) % 1) * L;
	let lo = 0;
	let hi = n;
	while (hi - lo > 1) {
		const m = (lo + hi) >> 1;
		if (cum[m] <= s) lo = m;
		else hi = m;
	}
	const a = OCHO[lo % n];
	const b = OCHO[(lo + 1) % n];
	const seg = cum[lo + 1] - cum[lo] || 1;
	const k = (s - cum[lo]) / seg;
	const dx = b[0] - a[0];
	const dy = b[1] - a[1];
	const dl = Math.hypot(dx, dy) || 1;
	return {p: [lerp(a[0], b[0], k), lerp(a[1], b[1], k)], d: [dx / dl, dy / dl], i: lo};
};

// arte del glifo: degradado oro → cempasúchil, grabado interior, borde oscuro (cacheado, coordenadas de pantalla)
export const glyphArt = () =>
	cached('d8glyphArt', () => {
		const c = makeCanvas(GW, GH);
		const g = c.getContext('2d')!;
		g.translate(-GX, -GY);
		const path = glyphPath();
		g.save();
		g.clip(path);
		const gr = g.createLinearGradient(0, 610, 0, 1250);
		gr.addColorStop(0, '#FFE08A');
		gr.addColorStop(0.35, P.gold);
		gr.addColorStop(0.75, '#F49A3E');
		gr.addColorStop(1, P.cempa);
		g.fillStyle = gr;
		g.fillRect(GX, GY, GW, GH);
		// grabado: líneas finas diagonales, más densas abajo
		g.strokeStyle = rgba('#8a3412', 0.28);
		g.lineWidth = 1.4;
		for (let k = -GH; k < GW + GH; k += 7) {
			g.beginPath();
			g.moveTo(GX + k, GY);
			g.lineTo(GX + k - GH * 0.6, GY + GH);
			g.stroke();
		}
		g.strokeStyle = rgba('#7a2a0e', 0.18);
		for (let k = -GH; k < GW + GH; k += 11) {
			g.beginPath();
			g.moveTo(GX + k, GY + GH);
			g.lineTo(GX + k - GH * 0.5, GY);
			g.stroke();
		}
		// sombra interior del contorno
		g.strokeStyle = rgba('#5a1e08', 0.55);
		g.lineWidth = 10;
		g.stroke(path);
		g.restore();
		g.strokeStyle = rgba('#FFE7A0', 0.5);
		g.lineWidth = 1.5;
		g.stroke(path);
		return c;
	});

// glifo final con pulso de brasa
export const drawGlyph8 = (g: Ctx, o: {alpha?: number; pulse?: number; glowK?: number} = {}) => {
	const {alpha = 1, pulse = 0, glowK = 1} = o;
	if (alpha <= 0) return;
	glow(g, 540, 930, 520, P.cempa, 0.22 * glowK * alpha * (0.85 + 0.15 * pulse), 0.3);
	g.save();
	g.globalAlpha = alpha;
	g.drawImage(glyphArt(), GX, GY);
	if (pulse > 0) {
		g.globalCompositeOperation = 'lighter';
		g.globalAlpha = alpha * 0.18 * pulse;
		g.drawImage(glyphArt(), GX, GY);
	}
	g.restore();
};

// crecimiento: el trazo del listón engorda desde 18 px hasta llenar el glifo (recortado al contorno)
export const swell = (g: Ctx, u: number) => {
	if (u <= 0) return;
	if (u >= 1) {
		drawGlyph8(g);
		return;
	}
	const {c, g: q} = scratch(5);
	q.save();
	q.clip(glyphPath());
	q.lineCap = 'round';
	q.lineJoin = 'round';
	q.lineWidth = lerp(18, 440, u * u * (3 - 2 * u));
	q.strokeStyle = '#fff';
	q.beginPath();
	OCHO.forEach(([x, y], i) => (i ? q.lineTo(x, y) : q.moveTo(x, y)));
	q.closePath();
	q.stroke();
	q.restore();
	q.globalCompositeOperation = 'source-in';
	q.drawImage(glyphArt(), GX, GY);
	q.globalCompositeOperation = 'source-over';
	glow(g, 540, 930, 520, P.cempa, 0.22 * u, 0.3);
	g.drawImage(c, 0, 0);
};

// mecha: el listón (en pantalla, 18 px) se vuelve incandescente detrás de una cabeza de brasa que lo recorre
export const fuse = (g: Ctx, u: number, t: number, dim = 1) => {
	const n = OCHO.length;
	const pts = [...OCHO, OCHO[0]];
	const head = Math.floor(clamp(u) * n);
	// parte aún sin encender
	if (head < n) ribbon(g, pts, {w: 18, from: head, to: n, shadow: 0.6, dim});
	// parte encendida: núcleo terracota con brillo dorado
	if (head > 0) {
		g.save();
		g.lineCap = 'round';
		g.lineJoin = 'round';
		g.globalCompositeOperation = 'lighter';
		for (const [w, col, a] of [
			[46, P.cempa, 0.18],
			[24, P.gold, 0.45],
			[12, '#FFE9A8', 0.8],
		] as [number, string, number][]) {
			g.strokeStyle = rgba(col, a);
			g.lineWidth = w;
			g.beginPath();
			for (let i = 0; i <= head && i < pts.length; i++) (i ? g.lineTo(pts[i][0], pts[i][1]) : g.moveTo(pts[i][0], pts[i][1]));
			g.stroke();
		}
		g.globalCompositeOperation = 'source-over';
		g.strokeStyle = rgba(P.terra, 0.55);
		g.lineWidth = 4;
		g.beginPath();
		for (let i = 0; i <= head && i < pts.length; i++) (i ? g.lineTo(pts[i][0], pts[i][1]) : g.moveTo(pts[i][0], pts[i][1]));
		g.stroke();
		g.restore();
	}
	if (u > 0 && u < 1) {
		const {p, d} = ochoAt(u);
		glow(g, p[0], p[1], 90, P.gold, 0.9, 0.12);
		glow(g, p[0], p[1], 34, '#FFF4D0', 1, 0.3);
		// chispas perpendiculares (deterministas por frame)
		g.save();
		g.globalCompositeOperation = 'lighter';
		const fr = Math.floor(t * 30);
		for (let k = 0; k < 30; k++) {
			const age = hash(k, fr) * 0.35;
			const side = hash(k, fr + 7) > 0.5 ? 1 : -1;
			const sp = 120 + hash(k, fr + 3) * 260;
			const back = hash(k, fr + 5) * 40;
			const x = p[0] - d[0] * back + -d[1] * side * sp * age;
			const y = p[1] - d[1] * back + d[0] * side * sp * age + 300 * age * age;
			g.fillStyle = rgba(k % 3 ? P.gold : P.cempa, 0.9 * (1 - age / 0.35));
			g.beginPath();
			g.arc(x, y, 1.6 + hash(k, fr + 9) * 1.8, 0, Math.PI * 2);
			g.fill();
		}
		g.restore();
	}
};
