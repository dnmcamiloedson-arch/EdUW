// Pintura 2D de la serie de leyendas: lienzos persistentes, ruido tileable, niebla, brillos y luz.
// Todo es determinista: el mismo frame da el mismo cuadro en cualquier pestaña del render paralelo.
import {useState} from 'react';
import {H, W, clamp, hash, rgba} from '../../lib/util';

export type Ctx = CanvasRenderingContext2D;

export const makeCanvas = (w: number, h: number) => {
	const c = document.createElement('canvas');
	c.width = Math.max(1, Math.round(w));
	c.height = Math.max(1, Math.round(h));
	return c;
};

// Lienzo que vive mientras vive el componente; se repinta durante el render (antes de que WebGL lo lea).
export const useFrameCanvas = (w = W, h = H) => {
	const [c] = useState(() => makeCanvas(w, h));
	return c;
};

const memo = new Map<string, unknown>();
export const cached = <T>(key: string, fn: () => T): T => {
	if (!memo.has(key)) memo.set(key, fn());
	return memo.get(key) as T;
};

// ---------- Ruido de gradiente periódico (para texturas que se repiten sin costura) ----------
const gradTable = (px: number, py: number, seed: number) =>
	cached(`grad:${px}:${py}:${seed}`, () => {
		const g = new Float32Array(px * py * 2);
		for (let j = 0; j < py; j++)
			for (let i = 0; i < px; i++) {
				const a = hash(i * 1619 + j * 31337, seed) * Math.PI * 2;
				g[(j * px + i) * 2] = Math.cos(a);
				g[(j * px + i) * 2 + 1] = Math.sin(a);
			}
		return g;
	});
const fade = (t: number) => t * t * t * (t * (t * 6 - 15) + 10);
export const pnoise = (x: number, y: number, px: number, py: number, seed: number) => {
	const g = gradTable(px, py, seed);
	const x0 = Math.floor(x);
	const y0 = Math.floor(y);
	const fx = x - x0;
	const fy = y - y0;
	const i0 = ((x0 % px) + px) % px;
	const j0 = ((y0 % py) + py) % py;
	const i1 = (i0 + 1) % px;
	const j1 = (j0 + 1) % py;
	const d = (i: number, j: number, dx: number, dy: number) => g[(j * px + i) * 2] * dx + g[(j * px + i) * 2 + 1] * dy;
	const u = fade(fx);
	const v = fade(fy);
	const a = d(i0, j0, fx, fy) + (d(i1, j0, fx - 1, fy) - d(i0, j0, fx, fy)) * u;
	const b = d(i0, j1, fx, fy - 1) + (d(i1, j1, fx - 1, fy - 1) - d(i0, j1, fx, fy - 1)) * u;
	return a + (b - a) * v; // ~[-0.7, 0.7]
};

// fBm tileable en [0,1]
export const fbmTile = (x: number, y: number, period: number, oct: number, seed: number, gain = 0.5) => {
	let s = 0;
	let a = 1;
	let n = 0;
	let p = period;
	for (let o = 0; o < oct; o++) {
		s += a * pnoise((x * p) % p, (y * p) % p, p, p, seed + o * 17);
		n += a;
		a *= gain;
		p *= 2;
	}
	return clamp(0.5 + (s / n) * 0.95);
};

// Textura de niebla/nube: blanca, el ruido va en el alfa (se tiñe al dibujarla)
export const noiseTile = (opts: {seed: number; size?: number; period?: number; oct?: number; contrast?: number; bias?: number; ridged?: boolean}) => {
	const {seed, size = 512, period = 4, oct = 5, contrast = 1.6, bias = 0, ridged = false} = opts;
	return cached(`tile:${seed}:${size}:${period}:${oct}:${contrast}:${bias}:${ridged}`, () => {
		const c = makeCanvas(size, size);
		const g = c.getContext('2d')!;
		const img = g.createImageData(size, size);
		for (let y = 0; y < size; y++)
			for (let x = 0; x < size; x++) {
				let v = fbmTile(x / size, y / size, period, oct, seed);
				if (ridged) v = 1 - Math.abs(v * 2 - 1);
				v = clamp((v - 0.5) * contrast + 0.5 + bias);
				const i = (y * size + x) * 4;
				img.data[i] = img.data[i + 1] = img.data[i + 2] = 255;
				img.data[i + 3] = Math.round(v * 255);
			}
		g.putImageData(img, 0, 0);
		return c;
	});
};

// La misma textura teñida de un color (cacheada)
export const tinted = (tile: HTMLCanvasElement, color: string, key: string) =>
	cached(`tint:${key}:${color}`, () => {
		const c = makeCanvas(tile.width, tile.height);
		const g = c.getContext('2d')!;
		g.drawImage(tile, 0, 0);
		g.globalCompositeOperation = 'source-in';
		g.fillStyle = color;
		g.fillRect(0, 0, c.width, c.height);
		return c;
	});

// Dibuja una textura repetida que se desplaza (niebla, nubes, agua) dentro del rectángulo dado
export const drawTiled = (ctx: Ctx, tile: HTMLCanvasElement, o: {x?: number; y?: number; w?: number; h?: number; scale?: number; ox?: number; oy?: number; alpha?: number; op?: GlobalCompositeOperation; sy?: number}) => {
	const {x = 0, y = 0, w = W, h = H, scale = 1, ox = 0, oy = 0, alpha = 1, op = 'source-over', sy = 1} = o;
	const pat = ctx.createPattern(tile, 'repeat');
	if (!pat) return;
	const m = new DOMMatrix();
	m.translateSelf(x + ox, y + oy);
	m.scaleSelf(scale, scale * sy);
	pat.setTransform(m);
	ctx.save();
	ctx.globalAlpha *= alpha;
	ctx.globalCompositeOperation = op;
	ctx.fillStyle = pat;
	ctx.fillRect(x, y, w, h);
	ctx.restore();
};

// Banda de niebla: textura teñida enmascarada con un degradado vertical suave
export const fogBand = (ctx: Ctx, o: {y0: number; y1: number; color: string; t: number; seed?: number; scale?: number; speed?: number; alpha?: number; x?: number; w?: number}) => {
	const {y0, y1, color, t, seed = 7, scale = 1.6, speed = 18, alpha = 0.6, x = -40, w = W + 80} = o;
	const hh = Math.max(2, y1 - y0);
	const band = cached(`fogband:${Math.round(w)}:${Math.round(hh)}`, () => makeCanvas(w, hh));
	if (band.width !== Math.round(w) || band.height !== Math.round(hh)) {
		band.width = Math.round(w);
		band.height = Math.round(hh);
	}
	const g = band.getContext('2d')!;
	g.setTransform(1, 0, 0, 1, 0, 0);
	g.globalCompositeOperation = 'source-over';
	g.clearRect(0, 0, band.width, band.height);
	const tile = tinted(noiseTile({seed, period: 3, oct: 5, contrast: 1.5}), color, `fog${seed}`);
	drawTiled(g, tile, {w: band.width, h: band.height, scale, ox: -t * speed, sy: 0.45});
	drawTiled(g, tile, {w: band.width, h: band.height, scale: scale * 0.62, ox: t * speed * 0.55 + 200, oy: 90, alpha: 0.7, sy: 0.4});
	g.globalCompositeOperation = 'destination-in';
	const gr = g.createLinearGradient(0, 0, 0, band.height);
	gr.addColorStop(0, 'rgba(0,0,0,0)');
	gr.addColorStop(0.35, 'rgba(0,0,0,1)');
	gr.addColorStop(0.7, 'rgba(0,0,0,1)');
	gr.addColorStop(1, 'rgba(0,0,0,0)');
	g.fillStyle = gr;
	g.fillRect(0, 0, band.width, band.height);
	ctx.save();
	ctx.globalAlpha *= alpha;
	ctx.drawImage(band, x, y0);
	ctx.restore();
};

// Brillo aditivo (velas, ojos, faroles)
export const glow = (ctx: Ctx, x: number, y: number, r: number, color: string, a = 1, core = 0.18) => {
	if (a <= 0 || r <= 0) return;
	ctx.save();
	ctx.globalCompositeOperation = 'lighter';
	const g = ctx.createRadialGradient(x, y, 0, x, y, r);
	g.addColorStop(0, rgba(color, a));
	g.addColorStop(core, rgba(color, a * 0.55));
	g.addColorStop(0.5, rgba(color, a * 0.14));
	g.addColorStop(1, rgba(color, 0));
	ctx.fillStyle = g;
	ctx.fillRect(x - r, y - r, r * 2, r * 2);
	ctx.restore();
};

// Haz de luz (cono suave) desde (x0,y0) hacia (x1,y1)
export const beam = (ctx: Ctx, x0: number, y0: number, x1: number, y1: number, w0: number, w1: number, color: string, a = 0.3) => {
	const dx = x1 - x0;
	const dy = y1 - y0;
	const L = Math.hypot(dx, dy);
	const nx = -dy / L;
	const ny = dx / L;
	ctx.save();
	ctx.globalCompositeOperation = 'lighter';
	const g = ctx.createLinearGradient(x0, y0, x1, y1);
	g.addColorStop(0, rgba(color, a));
	g.addColorStop(1, rgba(color, 0));
	ctx.fillStyle = g;
	ctx.filter = `blur(${Math.max(2, w1 * 0.08)}px)`;
	ctx.beginPath();
	ctx.moveTo(x0 + nx * w0 * 0.5, y0 + ny * w0 * 0.5);
	ctx.lineTo(x1 + nx * w1 * 0.5, y1 + ny * w1 * 0.5);
	ctx.lineTo(x1 - nx * w1 * 0.5, y1 - ny * w1 * 0.5);
	ctx.lineTo(x0 - nx * w0 * 0.5, y0 - ny * w0 * 0.5);
	ctx.closePath();
	ctx.fill();
	ctx.restore();
};

// Copia desenfocada de un lienzo (caché por clave y radio) — profundidad de campo para capas estáticas
export const blurred = (src: HTMLCanvasElement, r: number, key: string) =>
	cached(`blur:${key}:${Math.round(r)}`, () => {
		const pad = Math.ceil(r * 2);
		const c = makeCanvas(src.width + pad * 2, src.height + pad * 2);
		const g = c.getContext('2d')!;
		g.filter = `blur(${r}px)`;
		g.drawImage(src, pad, pad);
		return {canvas: c, pad};
	});

// Grano de papel / piedra estático
export const speckle = (w: number, h: number, seed: number, density = 0.04, dark = true) =>
	cached(`speckle:${w}:${h}:${seed}:${density}:${dark}`, () => {
		const c = makeCanvas(w, h);
		const g = c.getContext('2d')!;
		const n = Math.round(w * h * density * 0.01);
		for (let i = 0; i < n; i++) {
			const a = 0.15 + hash(i, seed) * 0.5;
			g.fillStyle = dark ? `rgba(0,0,0,${a})` : `rgba(255,240,220,${a * 0.6})`;
			const s = 0.6 + hash(i, seed + 1) * 2.2;
			g.fillRect(hash(i, seed + 2) * w, hash(i, seed + 3) * h, s, s);
		}
		return c;
	});

// ---------- Linterna: todo oscuro salvo un cono con "cookie" (núcleo caliente, anillo y halo) ----------
export const flashlight = (ctx: Ctx, o: {x: number; y: number; r: number; dark?: number; color?: string; power?: number; squash?: number; angle?: number; seed?: number; t?: number}) => {
	const {x, y, r, dark = 0.94, color = '#EDE3CF', power = 1, squash = 0.8, angle = 0, seed = 1, t = 0} = o;
	const layer = cached(`flash:${W}x${H}`, () => makeCanvas(W, H));
	const g = layer.getContext('2d')!;
	g.setTransform(1, 0, 0, 1, 0, 0);
	g.globalCompositeOperation = 'source-over';
	g.clearRect(0, 0, W, H);
	g.fillStyle = `rgba(2,1,0,${dark})`;
	g.fillRect(0, 0, W, H);
	g.globalCompositeOperation = 'destination-out';
	g.translate(x, y);
	g.rotate(angle);
	g.scale(1, squash);
	const gr = g.createRadialGradient(0, 0, 0, 0, 0, r);
	const wob = 0.04 * Math.sin(t * 7 + seed);
	gr.addColorStop(0, `rgba(0,0,0,${power})`);
	gr.addColorStop(0.42 + wob, `rgba(0,0,0,${power * 0.96})`);
	gr.addColorStop(0.55, `rgba(0,0,0,${power * 0.72})`);
	gr.addColorStop(0.62, `rgba(0,0,0,${power * 0.82})`);
	gr.addColorStop(1, 'rgba(0,0,0,0)');
	g.fillStyle = gr;
	g.beginPath();
	g.arc(0, 0, r, 0, Math.PI * 2);
	g.fill();
	g.setTransform(1, 0, 0, 1, 0, 0);
	ctx.drawImage(layer, 0, 0);
	// calidez de la luz dentro del cono
	ctx.save();
	ctx.globalCompositeOperation = 'soft-light';
	ctx.translate(x, y);
	ctx.rotate(angle);
	ctx.scale(1, squash);
	const w = ctx.createRadialGradient(0, 0, 0, 0, 0, r * 0.9);
	w.addColorStop(0, rgba(color, 0.55 * power));
	w.addColorStop(1, rgba(color, 0));
	ctx.fillStyle = w;
	ctx.fillRect(-r, -r, r * 2, r * 2);
	ctx.restore();
};
