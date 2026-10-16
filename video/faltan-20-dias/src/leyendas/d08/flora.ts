// Día 8 · vegetación de barranca veracruzana: troncos de amate/ceiba con contrafuertes, helechos, platanillo,
// bejucos. Todo en sprites cacheados (albedo + borde de luna por separado) para pintar rápido cada frame.
import {noise2D} from '@remotion/noise';
import {clamp, hash, lerp, mixRGB, rgba} from '../../lib/util';
import {cached, drawTiled, makeCanvas, noiseTile, tinted, type Ctx} from '../kit/paint';
import {smoothPath} from '../kit/rig';
import type {V2} from './core';

export type Sprite = {c: HTMLCanvasElement; ox: number; oy: number}; // ox, oy = punto de anclaje (base) en el sprite

// borde de luz: la silueta menos la silueta corrida, suavizada (como la banda de paintShape pero cacheada)
const rimOf = (src: HTMLCanvasElement, dx: number, dy: number, color: string, blur: number) => {
	const c = makeCanvas(src.width, src.height);
	const g = c.getContext('2d')!;
	g.drawImage(src, 0, 0);
	g.globalCompositeOperation = 'source-in';
	g.fillStyle = color;
	g.fillRect(0, 0, c.width, c.height);
	g.globalCompositeOperation = 'destination-out';
	g.filter = `blur(${blur}px)`;
	g.drawImage(src, dx, dy);
	g.filter = 'none';
	return c;
};

// ---------------------------------------------------------------- tronco con contrafuertes
export const trunk = (seed: number, w = 200, h = 2200, kind: 'ceiba' | 'amate' = 'amate') =>
	cached(`d8trunk:${seed}:${w}:${h}:${kind}`, () => {
		const flare = kind === 'ceiba' ? 3.4 : 2.6;
		const CW = Math.ceil(w * flare + 120);
		const c = makeCanvas(CW, h + 40);
		const g = c.getContext('2d')!;
		const cx = CW / 2;
		const base = h;
		const lean = (hash(seed, 1) - 0.5) * w * 0.4;
		// silueta: tronco + aletas
		const sil = (q: Ctx) => {
			const pts: V2[] = [];
			const N = 14;
			for (let k = 0; k <= N; k++) {
				const u = k / N;
				const y = base - u * h;
				const ww = w * 0.5 * (1 - u * 0.18) * (1 + 0.04 * noise2D('tw' + seed, u * 6, 0));
				pts.push([cx - ww + lean * u, y]);
			}
			for (let k = N; k >= 0; k--) {
				const u = k / N;
				const y = base - u * h;
				const ww = w * 0.5 * (1 - u * 0.18) * (1 + 0.04 * noise2D('tw' + seed, u * 6, 3));
				pts.push([cx + ww + lean * u, y]);
			}
			smoothPath(q, pts, true);
			// contrafuertes
			const nf = kind === 'ceiba' ? 7 : 5;
			for (let k = 0; k < nf; k++) {
				const side = k % 2 ? 1 : -1;
				const ex = side * (w * 0.4 + hash(seed * 7 + k, 2) * w * (flare - 1) * 0.55);
				const top = base - (0.25 + hash(seed * 7 + k, 3) * 0.3) * w * 2.2;
				const thick = w * (0.1 + hash(seed * 7 + k, 4) * 0.12);
				q.moveTo(cx + side * w * 0.2, top);
				q.bezierCurveTo(cx + side * w * 0.42, top + w * 0.5, cx + ex * 0.6, base - w * 0.2, cx + ex, base + 4);
				q.lineTo(cx + ex - side * thick * 2.2, base + 6);
				q.bezierCurveTo(cx + ex * 0.4, base - w * 0.1, cx + side * w * 0.1, top + w * 0.7, cx - side * w * 0.05, top + w * 0.4);
				q.closePath();
			}
		};
		const mask = makeCanvas(CW, h + 40);
		const mg = mask.getContext('2d')!;
		mg.fillStyle = '#fff';
		mg.beginPath();
		sil(mg);
		mg.fill('nonzero');
		// cuerpo con degradado lateral (volumen), corteza estriada, musgo
		const gr = g.createLinearGradient(cx - w * 0.6, 0, cx + w * 0.6, 0);
		gr.addColorStop(0, '#8a8272');
		gr.addColorStop(0.35, '#6d6556');
		gr.addColorStop(0.8, '#3c362d');
		gr.addColorStop(1, '#25211b');
		g.fillStyle = gr;
		g.beginPath();
		sil(g);
		g.fill('nonzero');
		g.globalCompositeOperation = 'source-atop';
		// estrías verticales de corteza
		for (let i = 0; i < Math.round(w / 5); i++) {
			const x = cx - w * 1.4 + hash(i, seed + 10) * w * 2.8;
			g.strokeStyle = rgba(hash(i, seed + 11) < 0.6 ? '#1c1812' : '#a49a86', 0.12 + hash(i, seed + 12) * 0.22);
			g.lineWidth = 1 + hash(i, seed + 13) * 3;
			g.beginPath();
			g.moveTo(x, base + 10);
			let y = base;
			let xx = x;
			while (y > 0) {
				y -= 60 + hash(Math.round(y) + i, seed) * 80;
				xx += (hash(Math.round(y), seed + i) - 0.5) * 8;
				g.lineTo(xx, y);
			}
			g.stroke();
		}
		const tex = tinted(noiseTile({seed: 300 + (seed % 5), period: 5, oct: 6, contrast: 2.1}), '#120e09', `d8bark${seed % 5}`);
		drawTiled(g, tex, {w: CW, h: h + 40, scale: 0.9, alpha: 0.45, sy: 2.6, op: 'source-atop'});
		// musgo en el lado de la luz y en los contrafuertes
		for (let i = 0; i < 260; i++) {
			const y = base - Math.pow(hash(i, seed + 20), 1.6) * h * 0.85;
			const x = cx - w * 0.55 + hash(i, seed + 21) * w * (y > base - w ? flare : 0.9);
			const m = noise2D('tm' + seed, x * 0.01, y * 0.004);
			if (m < 0.1) continue;
			g.fillStyle = rgba(mixRGB('#1F5C48', '#4f6b2c', hash(i, seed + 22)), 0.25 + m * 0.5);
			g.beginPath();
			g.ellipse(x, y, 6 + hash(i, seed + 23) * 18, 4 + hash(i, seed + 24) * 10, 0, 0, Math.PI * 2);
			g.fill();
		}
		// sombra de contacto en la base
		const sh = g.createLinearGradient(0, base - w * 0.5, 0, base + 10);
		sh.addColorStop(0, 'rgba(8,6,4,0)');
		sh.addColorStop(1, 'rgba(8,6,4,0.75)');
		g.fillStyle = sh;
		g.fillRect(0, base - w * 0.5, CW, w * 0.6);
		g.globalCompositeOperation = 'source-over';
		const albedo: Sprite = {c, ox: cx, oy: base};
		const rim: Sprite = {c: rimOf(mask, 7, 2, '#8fb4b0', 2.5), ox: cx, oy: base};
		return {albedo, rim, w: CW, h: h + 40};
	});

// ---------------------------------------------------------------- fronda de helecho (pinnada)
export const fern = (seed: number, L = 520, col = '#3d5a2c', curl = 0.6) =>
	cached(`d8fern:${seed}:${L}:${col}:${curl}`, () => {
		const pad = L * 0.45;
		const c = makeCanvas(L * 1.25 + pad, L * 0.9 + pad);
		const g = c.getContext('2d')!;
		const ox = pad * 0.5;
		const oy = c.height - pad * 0.5;
		// raquis: arco que sube a la derecha y se enrosca en la punta
		const rach: V2[] = [];
		const N = 40;
		for (let k = 0; k <= N; k++) {
			const u = k / N;
			const a = -Math.PI * 0.32 + u * curl * 1.4;
			const r = L * u;
			rach.push([ox + Math.cos(a) * r * 0.95 + u * u * L * 0.1, oy + Math.sin(a) * r * 0.9 + u * u * L * 0.25]);
		}
		const dark = rgba(mixRGB(col, '#06100a', 0.45));
		g.lineCap = 'round';
		for (let k = 2; k < N; k++) {
			const u = k / N;
			const [x, y] = rach[k];
			const [x1, y1] = rach[k + 1];
			const a = Math.atan2(y1 - y, x1 - x);
			const pl = L * 0.2 * Math.sin(Math.PI * Math.min(1, u * 1.15)) * (0.85 + hash(k, seed) * 0.3);
			for (const sd of [-1, 1]) {
				const pa = a + sd * (1.15 - u * 0.25);
				const ex = x + Math.cos(pa) * pl;
				const ey = y + Math.sin(pa) * pl + pl * 0.18;
				// pinna con lóbulos
				g.fillStyle = sd < 0 ? col : dark;
				g.beginPath();
				g.moveTo(x, y);
				const lob = 6;
				for (let j = 0; j <= lob; j++) {
					const v = j / lob;
					const wv = pl * 0.16 * Math.sin(Math.PI * v) * (j % 2 ? 1.25 : 0.8);
					g.lineTo(lerp(x, ex, v) + Math.cos(pa - Math.PI / 2) * wv, lerp(y, ey, v) + Math.sin(pa - Math.PI / 2) * wv);
				}
				for (let j = lob; j >= 0; j--) {
					const v = j / lob;
					const wv = pl * 0.16 * Math.sin(Math.PI * v) * (j % 2 ? 1.25 : 0.8);
					g.lineTo(lerp(x, ex, v) + Math.cos(pa + Math.PI / 2) * wv, lerp(y, ey, v) + Math.sin(pa + Math.PI / 2) * wv);
				}
				g.closePath();
				g.fill();
			}
		}
		g.strokeStyle = rgba(mixRGB(col, '#0c140a', 0.6));
		g.lineWidth = Math.max(2, L * 0.012);
		g.beginPath();
		smoothPath(g, rach);
		g.stroke();
		const mask = makeCanvas(c.width, c.height);
		mask.getContext('2d')!.drawImage(c, 0, 0);
		return {albedo: {c, ox, oy} as Sprite, rim: {c: rimOf(mask, 4, 3, '#9cc0b4', 1.5), ox, oy} as Sprite};
	});

// ---------------------------------------------------------------- hoja de platanillo (heliconia)
export const platanillo = (seed: number, L = 900, col = '#2e4a26') =>
	cached(`d8plat:${seed}:${L}:${col}`, () => {
		const c = makeCanvas(L * 0.5, L * 1.15);
		const g = c.getContext('2d')!;
		const ox = c.width / 2;
		const oy = c.height - 10;
		const tip: V2 = [ox + (hash(seed, 1) - 0.5) * L * 0.15, oy - L];
		const wv = L * 0.18;
		const leafP = (q: Ctx) => {
			q.moveTo(ox, oy);
			q.bezierCurveTo(ox - wv * 0.3, oy - L * 0.25, ox - wv * 1.1, oy - L * 0.5, ox - wv * 0.9, oy - L * 0.72);
			q.bezierCurveTo(ox - wv * 0.7, oy - L * 0.9, tip[0] - 10, tip[1] + 40, tip[0], tip[1]);
			q.bezierCurveTo(tip[0] + 10, tip[1] + 40, ox + wv * 0.8, oy - L * 0.9, ox + wv, oy - L * 0.7);
			q.bezierCurveTo(ox + wv * 1.1, oy - L * 0.45, ox + wv * 0.3, oy - L * 0.25, ox, oy);
		};
		const gr = g.createLinearGradient(ox - wv, 0, ox + wv, 0);
		gr.addColorStop(0, rgba(mixRGB(col, '#9db07a', 0.2)));
		gr.addColorStop(0.5, col);
		gr.addColorStop(1, rgba(mixRGB(col, '#050a05', 0.55)));
		g.fillStyle = gr;
		g.beginPath();
		leafP(g);
		g.fill();
		g.globalCompositeOperation = 'destination-out';
		// rasgaduras de la hoja
		for (let k = 0; k < 7; k++) {
			const y = oy - L * (0.2 + hash(k, seed + 3) * 0.65);
			const sd = hash(k, seed + 4) < 0.5 ? -1 : 1;
			g.lineWidth = 2 + hash(k, seed + 5) * 3;
			g.beginPath();
			g.moveTo(ox + sd * wv * 1.2, y - 30);
			g.lineTo(ox + sd * 8, y + 25);
			g.stroke();
		}
		g.globalCompositeOperation = 'source-atop';
		g.strokeStyle = 'rgba(10,18,8,0.35)';
		g.lineWidth = 1.4;
		for (let k = 0; k < 26; k++) {
			const y = oy - L * (0.08 + (k / 26) * 0.8);
			g.beginPath();
			g.moveTo(ox, y);
			g.quadraticCurveTo(ox - wv * 0.6, y - 40, ox - wv * 1.1, y - 70);
			g.moveTo(ox, y);
			g.quadraticCurveTo(ox + wv * 0.6, y - 40, ox + wv * 1.1, y - 70);
			g.stroke();
		}
		g.strokeStyle = rgba(mixRGB(col, '#c8d0a0', 0.35), 0.8);
		g.lineWidth = 4;
		g.beginPath();
		g.moveTo(ox, oy);
		g.quadraticCurveTo(ox, oy - L * 0.5, tip[0], tip[1]);
		g.stroke();
		g.globalCompositeOperation = 'source-over';
		const mask = makeCanvas(c.width, c.height);
		mask.getContext('2d')!.drawImage(c, 0, 0);
		return {albedo: {c, ox, oy} as Sprite, rim: {c: rimOf(mask, 6, 2, '#9cc0b4', 2), ox, oy} as Sprite};
	});

// helecho arborescente: copa de frondas radiales sobre un tallo
export const treeFern = (seed: number, s = 1) =>
	cached(`d8tfern:${seed}:${s}`, () => {
		const L = 520 * s;
		const c = makeCanvas(L * 2.6, L * 3.2);
		const g = c.getContext('2d')!;
		const ox = c.width / 2;
		const oy = c.height - 8;
		const topY = oy - L * 1.9;
		g.fillStyle = '#3a3428';
		g.beginPath();
		g.moveTo(ox - 18 * s, oy);
		g.quadraticCurveTo(ox - 8 * s, oy - L, ox - 12 * s, topY);
		g.lineTo(ox + 12 * s, topY);
		g.quadraticCurveTo(ox + 14 * s, oy - L, ox + 20 * s, oy);
		g.fill();
		for (let k = 0; k < 11; k++) {
			const a = -Math.PI / 2 + ((k / 10) * 2 - 1) * 1.45 + (hash(k, seed) - 0.5) * 0.2;
			const sp = fern(seed * 13 + (k % 3), Math.round(L * (0.8 + hash(k, seed + 1) * 0.3)), k % 2 ? '#3f5c2e' : '#35502a', 0.35);
			g.save();
			g.translate(ox, topY);
			g.rotate(a + Math.PI * 0.32);
			if (Math.cos(a) < 0) g.scale(1, -1);
			g.drawImage(sp.albedo.c, -sp.albedo.ox, -sp.albedo.oy);
			g.restore();
		}
		const mask = makeCanvas(c.width, c.height);
		mask.getContext('2d')!.drawImage(c, 0, 0);
		return {albedo: {c, ox, oy} as Sprite, rim: {c: rimOf(mask, 5, 3, '#9cc0b4', 2), ox, oy} as Sprite};
	});

export const drawSprite = (g: Ctx, sp: Sprite, x: number, y: number, s = 1, rot = 0, flip = 1, alpha = 1) => {
	g.save();
	g.translate(x, y);
	if (rot) g.rotate(rot);
	g.scale(s * flip, s);
	g.globalAlpha *= alpha;
	g.drawImage(sp.c, -sp.ox, -sp.oy);
	g.restore();
};

// bejuco colgante (curva con caída)
export const liana = (g: Ctx, x0: number, y0: number, x1: number, y1: number, sag: number, w: number, col: string, sway = 0) => {
	g.strokeStyle = col;
	g.lineWidth = w;
	g.lineCap = 'round';
	g.beginPath();
	g.moveTo(x0, y0);
	g.bezierCurveTo(x0 + sway * 0.5, y0 + sag, x1 + sway, y1 + sag * 0.6, x1, y1);
	g.stroke();
};

export const clamp01 = clamp;
