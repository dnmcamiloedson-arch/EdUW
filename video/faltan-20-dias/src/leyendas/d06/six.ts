// El «6» que dejó el dedo de la bruja: UNA máscara (glifo Rye a tamaño y posición exactos del lockup) maneja los
// cuatro estados — rastro de hollín, trazo limpio en el vaho, borde de brasa y numeral sólido.
import {noise2D} from '@remotion/noise';
import {clamp, hash, rgba} from '../../lib/util';
import {cached, glow, makeCanvas, type Ctx} from '../kit/paint';
import {P} from './timeline';

export const SIX = {top: 540, bottom: 1120, cx: 540};
export const SIX_BOX = {x: 180, y: 500, w: 720, h: 680};

const fontOk = () => {
	try {
		return typeof document !== 'undefined' && document.fonts.check('400 100px Rye');
	} catch {
		return false;
	}
};

const buildMask = () => {
	const c = makeCanvas(SIX_BOX.w, SIX_BOX.h);
	const g = c.getContext('2d')!;
	const probe = 400;
	g.font = `400 ${probe}px Rye`;
	const m = g.measureText('6');
	const inkH = m.actualBoundingBoxAscent + m.actualBoundingBoxDescent;
	const size = (probe * (SIX.bottom - SIX.top)) / Math.max(1, inkH);
	g.font = `400 ${size}px Rye`;
	const m2 = g.measureText('6');
	const w = m2.actualBoundingBoxLeft + m2.actualBoundingBoxRight;
	const x = SIX.cx - SIX_BOX.x - w / 2 + m2.actualBoundingBoxLeft;
	const y = SIX.top - SIX_BOX.y + m2.actualBoundingBoxAscent;
	g.fillStyle = '#000';
	g.fillText('6', x, y);
	return c;
};

// máscara (null si la fuente aún no carga: no se cachea un glifo equivocado)
export const sixMask = () => (fontOk() ? cached('d06:sixMask', buildMask) : null);

// recorta la máscara del 6 en un contexto en coordenadas de pantalla (p. ej. el vaho, destination-out)
export const carveSix = (q: Ctx, a = 1) => {
	const m = sixMask();
	if (!m) return;
	q.save();
	q.globalCompositeOperation = 'destination-out';
	q.globalAlpha = a;
	q.drawImage(m, SIX_BOX.x, SIX_BOX.y);
	q.restore();
};

// numeral «brasa» horneado (degradado + borde terracota + achurado inferior)
const brasa = () =>
	cached('d06:sixBrasa', () => {
		const m = sixMask()!;
		const c = makeCanvas(SIX_BOX.w, SIX_BOX.h);
		const g = c.getContext('2d')!;
		// borde exterior 2 px
		for (const [dx, dy] of [
			[-2, 0],
			[2, 0],
			[0, -2],
			[0, 2],
		])
			g.drawImage(m, dx, dy);
		g.globalCompositeOperation = 'source-in';
		g.fillStyle = P.terra;
		g.fillRect(0, 0, c.width, c.height);
		g.globalCompositeOperation = 'source-over';
		const fill = makeCanvas(SIX_BOX.w, SIX_BOX.h);
		const q = fill.getContext('2d')!;
		q.drawImage(m, 0, 0);
		q.globalCompositeOperation = 'source-in';
		const top = SIX.top - SIX_BOX.y;
		const bot = SIX.bottom - SIX_BOX.y;
		const gr = q.createLinearGradient(0, top, 0, bot);
		gr.addColorStop(0, '#FFF1C9');
		gr.addColorStop(0.35, P.gold);
		gr.addColorStop(1, P.cempa);
		q.fillStyle = gr;
		q.fillRect(0, 0, c.width, c.height);
		// achurado grabado en el 60 % inferior
		q.globalCompositeOperation = 'source-atop';
		q.strokeStyle = rgba(P.terra, 0.3);
		q.lineWidth = 1.6;
		const y0 = top + (bot - top) * 0.4;
		for (let k = -c.height; k < c.width + c.height; k += 5) {
			q.beginPath();
			q.moveTo(k, y0);
			q.lineTo(k + (c.height - y0) * Math.tan(0.6), c.height);
			q.stroke();
		}
		g.drawImage(fill, 0, 0);
		return c;
	});

// numeral sólido con halo pulsante y brasas que suben. k: 0..1 aparición; cool: 0..1 enfría hacia terracota (dip)
export const paintSixSolid = (g: Ctx, t: number, k: number, cool = 0) => {
	const m = sixMask();
	if (!m || k <= 0) return;
	const cy = (SIX.top + SIX.bottom) / 2;
	glow(g, SIX.cx, cy, (SIX.bottom - SIX.top) * 0.6 * (1 + 0.06 * Math.sin(t * 2 * Math.PI * 0.8)), P.cempa, 0.35 * k * (1 - cool * 0.6));
	g.save();
	g.globalAlpha = k;
	g.drawImage(brasa(), SIX_BOX.x, SIX_BOX.y);
	if (cool > 0) {
		g.globalAlpha = k * cool * 0.7;
		g.globalCompositeOperation = 'multiply';
		g.fillStyle = P.terra;
		const tmp = cached('d06:sixCool', () => {
			const c = makeCanvas(SIX_BOX.w, SIX_BOX.h);
			const q = c.getContext('2d')!;
			q.drawImage(m, 0, 0);
			q.globalCompositeOperation = 'source-in';
			q.fillStyle = P.terra;
			q.fillRect(0, 0, c.width, c.height);
			return c;
		});
		g.drawImage(tmp, SIX_BOX.x, SIX_BOX.y);
	}
	g.restore();
	// brasas que suben desde la parte alta del 6
	g.save();
	g.globalCompositeOperation = 'lighter';
	for (let i = 0; i < 12; i++) {
		const life = 1.6 + hash(i, 5) * 1.4;
		const u = ((t + hash(i, 6) * life) % life) / life;
		const x = SIX.cx - 120 + hash(i, 7) * 240 + noise2D('sxe' + i, t * 0.8, 0) * 20;
		const y = SIX.top + 30 - u * 160;
		g.fillStyle = rgba(i % 2 ? P.gold : P.cempa, (1 - u) * 0.8 * k);
		g.fillRect(x, y, 2.5, 2.5);
	}
	g.restore();
	void clamp;
};

// borde de brasa del trazo limpio (40.2 s): halo naranja tenue alrededor de la máscara
export const paintSixEmber = (g: Ctx, k: number) => {
	const m = sixMask();
	if (!m || k <= 0) return;
	const c = cached('d06:sixEmber', () => {
		const out = makeCanvas(SIX_BOX.w, SIX_BOX.h);
		const q = out.getContext('2d')!;
		q.filter = 'blur(6px)';
		q.drawImage(m, 0, 0);
		q.filter = 'none';
		q.globalCompositeOperation = 'destination-out';
		q.drawImage(m, 0, 0);
		q.globalCompositeOperation = 'source-in';
		q.fillStyle = P.cempa;
		q.fillRect(0, 0, out.width, out.height);
		return out;
	});
	g.save();
	g.globalCompositeOperation = 'lighter';
	g.globalAlpha = k;
	g.drawImage(c, SIX_BOX.x, SIX_BOX.y);
	g.restore();
};
