// Día 7 · texturas de ruido baratas: UNA base fbm de 256 (5 octavas) por periodo, y variantes (contraste/sesgo) por
// remapeo del alfa — no se recalcula el ruido por cada textura (las del kit cuestan ~60 ms cada una).
import {clamp} from '../../lib/util';
import {cached, makeCanvas, noiseTile} from '../kit/paint';

const base = (period: number) => noiseTile({seed: 71, size: 256, period, oct: 5, contrast: 1});
export const tile = (o: {period?: number; contrast?: number; bias?: number; ox?: number; oy?: number}) => {
	const {period = 4, contrast = 1.6, bias = 0, ox = 0, oy = 0} = o;
	return cached(`d07tile:${period}:${contrast}:${bias}:${ox}:${oy}`, () => {
		const b = base(period);
		const src = b.getContext('2d')!.getImageData(0, 0, 256, 256).data;
		const c = makeCanvas(256, 256);
		const g = c.getContext('2d')!;
		const img = g.createImageData(256, 256);
		const d = img.data;
		for (let y = 0; y < 256; y++)
			for (let x = 0; x < 256; x++) {
				// desplazamiento con envoltura: variantes que no coinciden entre sí
				const sx = (x + ox) & 255;
				const sy = (y + oy) & 255;
				const v = src[(sy * 256 + sx) * 4 + 3] / 255;
				const i = (y * 256 + x) * 4;
				d[i] = d[i + 1] = d[i + 2] = 255;
				d[i + 3] = Math.round(clamp((v - 0.5) * contrast + 0.5 + bias) * 255);
			}
		g.putImageData(img, 0, 0);
		return c;
	});
};
