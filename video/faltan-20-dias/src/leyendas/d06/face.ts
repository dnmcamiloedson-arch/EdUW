// El rostro verdadero de la bruja (solo lo revela el espejo) y la mano de fuego que se estampa en el vidrio.
// STUB de etapa 1: trazos de brasa básicos con la topología final (cejas, ojos, pómulos, boca); G3 lo refina.
import {clamp, lerp, rgba} from '../../lib/util';
import {glow, type Ctx} from '../kit/paint';
import {P} from './timeline';

// morph: 0 hambrienta → 0.5 reconocimiento → 1 horror
export const paintWitchFace = (g: Ctx, o: {x: number; y: number; s: number; morph: number; a: number; t: number}) => {
	const {x, y, s, morph, a, t} = o;
	if (a <= 0) return;
	const lid = lerp(0.4, 1.15, clamp(morph));
	const brow = lerp(0, -24, clamp(morph));
	const mouthH = lerp(6, 90, clamp((morph - 0.3) / 0.7));
	const tr = Math.sin(t * 40) * 2;
	g.save();
	g.translate(x + tr, y);
	g.scale(s, s);
	const stroke = (path: () => void, w: number) => {
		g.globalCompositeOperation = 'lighter';
		g.strokeStyle = rgba(P.cempa, 0.55 * a);
		g.lineWidth = w * 3.2;
		g.beginPath();
		path();
		g.stroke();
		g.strokeStyle = rgba(P.core, 0.95 * a);
		g.lineWidth = w;
		g.beginPath();
		path();
		g.stroke();
		g.globalCompositeOperation = 'source-over';
	};
	g.lineCap = 'round';
	// contorno del rostro (pómulos fuertes, sin nariz ganchuda)
	stroke(() => {
		g.moveTo(-150, -170);
		g.bezierCurveTo(-190, -40, -170, 90, -100, 170);
		g.bezierCurveTo(-50, 230, 50, 230, 100, 170);
		g.bezierCurveTo(170, 90, 190, -40, 150, -170);
	}, 4);
	// cejas
	for (const sx of [-1, 1])
		stroke(() => {
			g.moveTo(sx * 30, -78 + brow);
			g.quadraticCurveTo(sx * 75, -98 + brow * 1.2, sx * 120, -80 + brow * 0.6);
		}, 5);
	// ojos (carbones blanco-oro)
	for (const sx of [-1, 1]) {
		stroke(() => {
			g.ellipse(sx * 72, -40, 36, 16 * lid, 0, 0, Math.PI * 2);
		}, 3);
		glow(g, sx * 72, -40, 26, P.core, 0.9 * a, 0.3);
	}
	// nariz recta
	stroke(() => {
		g.moveTo(0, -40);
		g.lineTo(-6, 40);
		g.lineTo(10, 48);
	}, 3);
	// boca
	stroke(() => {
		g.ellipse(0, 110, 30 + mouthH * 0.1, mouthH * 0.5 + 3, 0, 0, Math.PI * 2);
	}, 4);
	g.restore();
};

// mano de fuego (5 dedos + palma) y huella de hollín con grietas de brasa
export const paintFireHand = (g: Ctx, o: {x: number; y: number; s: number; a: number; soot: number; cool: number; t: number}) => {
	const {x, y, s, a, soot, cool} = o;
	if (a <= 0) return;
	g.save();
	g.translate(x, y);
	g.scale(s, s);
	const hand = () => {
		g.beginPath();
		g.ellipse(0, 60, 150, 170, 0, 0, Math.PI * 2);
		const fingers: [number, number, number][] = [
			[-120, -120, -0.5],
			[-55, -200, -0.15],
			[10, -220, 0],
			[75, -195, 0.15],
			[175, 0, 0.9],
		];
		for (const [fx, fy, ang] of fingers) {
			g.save();
			g.translate(fx * 0.6, fy * 0.3);
			g.rotate(ang);
			g.roundRect(-28, -230, 56, 240, 28);
			g.restore();
		}
	};
	if (soot < 1) {
		g.globalCompositeOperation = 'lighter';
		g.fillStyle = rgba(P.cempa, 0.8 * a * (1 - soot));
		hand();
		g.fill();
		g.globalCompositeOperation = 'source-over';
	}
	if (soot > 0) {
		g.fillStyle = rgba(P.soot, 0.92 * a * soot);
		hand();
		g.fill();
		g.strokeStyle = rgba(P.cempa, (1 - cool) * 0.9 * a * soot);
		g.lineWidth = 3;
		g.beginPath();
		for (let k = 0; k < 9; k++) {
			const an = (k / 9) * Math.PI * 2;
			g.moveTo(0, 60);
			g.lineTo(Math.cos(an) * 140, 60 + Math.sin(an) * 150);
		}
		g.stroke();
	}
	g.restore();
};
