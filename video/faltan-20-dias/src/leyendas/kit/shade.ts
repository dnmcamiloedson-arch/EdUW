// Material pictórico para formas 2D: cuerpo con degradado, sombra interior del lado opuesto a la luz,
// luz de contorno (rim) del lado de la luz, textura y halo. Así una silueta deja de verse "plana".
import {clamp, rgba} from '../../lib/util';
import {cached, drawTiled, makeCanvas, noiseTile, tinted, type Ctx} from './paint';

export type Box = [number, number, number, number]; // x, y, w, h (coordenadas actuales del ctx)
export type Mat = {
	fill: string | ((g: Ctx, b: Box) => CanvasGradient | string);
	light?: number; // ángulo de la luz en radianes (0 = desde la derecha, -π/2 = desde arriba)
	rim?: {color: string; width: number; alpha?: number; blur?: number};
	shadow?: {color: string; width: number; alpha?: number; blur?: number};
	texture?: {seed: number; scale?: number; alpha?: number; color?: string; op?: GlobalCompositeOperation};
	halo?: {color: string; r: number; alpha?: number};
	opacity?: number;
};

const pool = new Map<string, HTMLCanvasElement[]>();
const take = (w: number, h: number, i: number) => {
	const key = `${w}x${h}`;
	let arr = pool.get(key);
	if (!arr) pool.set(key, (arr = []));
	while (arr.length <= i) arr.push(makeCanvas(w, h));
	return arr[i];
};

// res: píxeles de lienzo por unidad del ctx actual (usa la escala del plano para no perder nitidez)
export const paintShape = (ctx: Ctx, path: (g: Ctx) => void, box: Box, mat: Mat, res = 1) => {
	const [bx, by, bw, bh] = box;
	const pad = Math.ceil(Math.max(mat.rim?.width ?? 0, mat.shadow?.width ?? 0, 4) * 2);
	const cw = Math.min(2400, Math.max(4, Math.ceil((bw + pad * 2) * res)));
	const ch = Math.min(2400, Math.max(4, Math.ceil((bh + pad * 2) * res)));
	const sx = cw / (bw + pad * 2);
	const sy = ch / (bh + pad * 2);
	const body = take(cw, ch, 0);
	const tmp = take(cw, ch, 1);
	const b = body.getContext('2d')!;
	const tm = tmp.getContext('2d')!;
	const setT = (g: Ctx, dx = 0, dy = 0) => g.setTransform(sx, 0, 0, sy, (pad - bx + dx) * sx, (pad - by + dy) * sy);
	b.setTransform(1, 0, 0, 1, 0, 0);
	b.globalCompositeOperation = 'source-over';
	b.globalAlpha = 1;
	b.filter = 'none';
	b.clearRect(0, 0, cw, ch);
	setT(b);
	b.fillStyle = typeof mat.fill === 'string' ? mat.fill : mat.fill(b, box);
	b.beginPath();
	path(b);
	b.fill();
	const L = mat.light ?? -Math.PI / 2;
	const lx = Math.cos(L);
	const ly = Math.sin(L);
	// banda del lado contrario a la luz (sombra) y del lado de la luz (rim)
	const band = (o: {color: string; width: number; alpha?: number; blur?: number}, toward: number, op: GlobalCompositeOperation) => {
		tm.setTransform(1, 0, 0, 1, 0, 0);
		tm.globalCompositeOperation = 'source-over';
		tm.filter = 'none';
		tm.clearRect(0, 0, cw, ch);
		setT(tm);
		tm.fillStyle = o.color;
		tm.beginPath();
		path(tm);
		tm.fill();
		tm.globalCompositeOperation = 'destination-out';
		tm.filter = `blur(${Math.max(0.5, (o.blur ?? o.width * 0.6) * sx)}px)`;
		setT(tm, lx * o.width * toward, ly * o.width * toward);
		tm.beginPath();
		path(tm);
		tm.fill();
		tm.filter = 'none';
		b.setTransform(1, 0, 0, 1, 0, 0);
		b.globalCompositeOperation = op;
		b.globalAlpha = o.alpha ?? 1;
		b.drawImage(tmp, 0, 0);
		b.globalAlpha = 1;
	};
	if (mat.shadow) band(mat.shadow, 1, 'source-atop');
	if (mat.texture) {
		const tx = mat.texture;
		const tile = tinted(noiseTile({seed: tx.seed, period: 6, oct: 5, contrast: 1.8}), tx.color ?? '#000000', `shadeTex${tx.seed}`);
		b.setTransform(1, 0, 0, 1, 0, 0);
		b.globalCompositeOperation = 'source-atop';
		drawTiled(b, tile, {w: cw, h: ch, scale: (tx.scale ?? 1) * sx, alpha: tx.alpha ?? 0.25, op: tx.op ?? 'source-atop'});
	}
	if (mat.rim) band(mat.rim, -1, 'source-atop');
	b.globalCompositeOperation = 'source-over';
	// al lienzo destino
	if (mat.halo) {
		const hx = bx + bw / 2;
		const hy = by + bh / 2;
		const r = mat.halo.r;
		ctx.save();
		ctx.globalCompositeOperation = 'lighter';
		const gr = ctx.createRadialGradient(hx, hy, 0, hx, hy, r);
		gr.addColorStop(0, rgba(mat.halo.color, mat.halo.alpha ?? 0.3));
		gr.addColorStop(1, rgba(mat.halo.color, 0));
		ctx.fillStyle = gr;
		ctx.fillRect(hx - r, hy - r, r * 2, r * 2);
		ctx.restore();
	}
	ctx.save();
	ctx.globalAlpha *= clamp(mat.opacity ?? 1);
	ctx.drawImage(body, bx - pad, by - pad, bw + pad * 2, bh + pad * 2);
	ctx.restore();
};

// Degradado vertical rápido para materiales
export const vgrad = (top: string, bottom: string, mid?: string) => (g: Ctx, b: Box) => {
	const gr = g.createLinearGradient(0, b[1], 0, b[1] + b[3]);
	gr.addColorStop(0, top);
	if (mid) gr.addColorStop(0.5, mid);
	gr.addColorStop(1, bottom);
	return gr;
};
export const rgrad = (inner: string, outer: string, cx = 0.5, cy = 0.4) => (g: Ctx, b: Box) => {
	const x = b[0] + b[2] * cx;
	const y = b[1] + b[3] * cy;
	const gr = g.createRadialGradient(x, y, 0, x, y, Math.max(b[2], b[3]) * 0.75);
	gr.addColorStop(0, inner);
	gr.addColorStop(1, outer);
	return gr;
};

// Textura estática de un plano completo (piedra, adobe, madera) en caché
export const surface = (key: string, w: number, h: number, base: string, layers: {seed: number; color: string; scale: number; alpha: number; op?: GlobalCompositeOperation}[]) =>
	cached(`surface:${key}`, () => {
		const c = makeCanvas(w, h);
		const g = c.getContext('2d')!;
		g.fillStyle = base;
		g.fillRect(0, 0, w, h);
		for (const L of layers) {
			const tile = tinted(noiseTile({seed: L.seed, period: 5, oct: 6, contrast: 1.7}), L.color, `surf${L.seed}`);
			drawTiled(g, tile, {w, h, scale: L.scale, alpha: L.alpha, op: L.op ?? 'source-over'});
		}
		return c;
	});
