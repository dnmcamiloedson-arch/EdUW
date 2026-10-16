// Día 7 · el «7» de Rye: máscara offscreen a escala del lockup (tinta de y 470 a 1040 en pantalla base), en el
// espacio del mapa de luz (1/4 de resolución). La sombra del sombrero y la caña se funde con ella (snap al glifo).
import {cached, makeCanvas} from '../kit/paint';
import {LH, LW, LX0, LY0, Q} from './light';
import type {V2} from './world';

export const G7 = {top: 470, bottom: 1040, cx: 548};

const fontOk = () => {
	try {
		return typeof document !== 'undefined' && document.fonts.check('400 100px Rye');
	} catch {
		return false;
	}
};

const build = () => {
	const c = makeCanvas(LW, LH);
	const g = c.getContext('2d')!;
	const probe = 400;
	g.font = `400 ${probe}px Rye`;
	const m = g.measureText('7');
	const inkH = m.actualBoundingBoxAscent + m.actualBoundingBoxDescent;
	const size = (probe * (G7.bottom - G7.top)) / Math.max(1, inkH) / Q;
	g.font = `400 ${size}px Rye`;
	const m2 = g.measureText('7');
	const w = m2.actualBoundingBoxLeft + m2.actualBoundingBoxRight;
	const x = (G7.cx - LX0) / Q - w / 2 + m2.actualBoundingBoxLeft;
	const y = (G7.top - LY0) / Q + m2.actualBoundingBoxAscent;
	g.fillStyle = '#000';
	g.fillText('7', x, y);
	return {canvas: c, inkW: w * Q};
};

// máscara del glifo (null si la fuente aún no está lista: no se cachea un glifo equivocado)
export const glyph7 = () => (fontOk() ? cached('d07:glyph7', build) : null);

// contorno aproximado del 7 en pantalla base (barra superior + asta diagonal) — reposo de la sombra sombrero+caña
export const SEVEN_REST: V2[] = [
	[352, 482],
	[402, 470],
	[560, 478],
	[742, 470],
	[756, 500],
	[690, 640],
	[600, 840],
	[548, 1040],
	[462, 1040],
	[520, 860],
	[612, 640],
	[668, 548],
	[540, 540],
	[400, 556],
	[350, 560],
];
