// Día 7 · capa offscreen por actor: se pinta en un lienzo del tamaño de su caja, se tiñe con la luz que recibe y se
// compone con desenfoque de profundidad (DOF) sin tocar el resto del cuadro.
import {makeCanvas, type Ctx} from '../kit/paint';

const pool: HTMLCanvasElement[] = [];
let used = 0;
export const resetLayers = () => {
	used = 0;
};
const take = (w: number, h: number) => {
	if (used >= pool.length) pool.push(makeCanvas(8, 8));
	const c = pool[used++];
	const W2 = Math.max(8, Math.ceil(w));
	const H2 = Math.max(8, Math.ceil(h));
	if (c.width < W2 || c.height < H2) {
		c.width = Math.max(c.width, W2);
		c.height = Math.max(c.height, H2);
	}
	return c;
};

export type LayerOpts = {blur?: number; shade?: {color: string; a: number}; alpha?: number; op?: GlobalCompositeOperation};
// box en coordenadas actuales del mundo (px de pantalla base); fn dibuja en esas mismas coordenadas
export const inLayer = (g: Ctx, box: [number, number, number, number], o: LayerOpts, fn: (q: Ctx) => void) => {
	const blur = Math.max(0, o.blur ?? 0);
	const pad = Math.ceil(blur * 2.2) + 4;
	const [bx, by, bw, bh] = box;
	if (bw <= 0 || bh <= 0) return;
	// resolución reducida cuando el desenfoque es grande (más barato y se ve igual)
	const res = blur > 10 ? 0.5 : 1;
	const c = take((bw + pad * 2) * res, (bh + pad * 2) * res);
	const q = c.getContext('2d')!;
	q.setTransform(1, 0, 0, 1, 0, 0);
	q.globalCompositeOperation = 'source-over';
	q.globalAlpha = 1;
	q.filter = 'none';
	q.clearRect(0, 0, c.width, c.height);
	q.setTransform(res, 0, 0, res, (pad - bx) * res, (pad - by) * res);
	fn(q);
	if (o.shade && o.shade.a > 0.001) {
		q.setTransform(1, 0, 0, 1, 0, 0);
		q.globalCompositeOperation = 'source-atop';
		q.globalAlpha = Math.min(1, o.shade.a);
		q.fillStyle = o.shade.color;
		q.fillRect(0, 0, c.width, c.height);
		q.globalAlpha = 1;
		q.globalCompositeOperation = 'source-over';
	}
	g.save();
	if (o.alpha !== undefined) g.globalAlpha *= o.alpha;
	if (o.op) g.globalCompositeOperation = o.op;
	if (blur > 0.4) g.filter = `blur(${blur.toFixed(1)}px)`;
	g.drawImage(c, 0, 0, (bw + pad * 2) * res, (bh + pad * 2) * res, bx - pad, by - pad, bw + pad * 2, bh + pad * 2);
	g.restore();
};
