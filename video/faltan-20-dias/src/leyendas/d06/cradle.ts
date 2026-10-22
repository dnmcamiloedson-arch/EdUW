// La cuna colgante (péndulo amortiguado precalculado) con sus cuatro mecates, el bulto de sarape y la manita.
// Orden de pintado: mecates traseros → borde trasero → bulto → manita → inner() (tentáculos) → borde delantero → mecates delanteros.
import {E, clamp, hash, rgba} from '../../lib/util';
import {cached, type Ctx} from '../kit/paint';
import {EV, FPS, LEN, P} from './timeline';

export const CRADLE = {px: 690, py: 300, cx: 690, cy: 1130, w: 360, h: 120};

// ángulo de la cuna en grados (señal analítica, determinista)
const angleRaw = (f: number) => {
	const t = f / FPS;
	let a = 0;
	const tp = EV.push / FPS;
	if (t > tp) a -= 3 * Math.exp(-(t - tp) / 5) * Math.sin((2 * Math.PI * (t - tp)) / 2.4);
	// meciendo con el mecate 9–17 s, se apaga hacia 21 s
	const rock = clamp((t - 9) / 1.2) * (t < 17 ? 1 : Math.exp(-(t - 17) / 1.4));
	a += 2.4 * rock * Math.sin((2 * Math.PI * (t - 9)) / 2.6);
	// vaivén solo por las corrientes 27–31 s
	for (const [ti, A] of [
		[27.0, 1.6],
		[28.4, -1.9],
		[29.6, 2.1],
		[30.7, -1.5],
	] as const) {
		if (t > ti) a += A * Math.exp(-(t - ti) / 1.3) * Math.sin((2 * Math.PI * (t - ti)) / 2.4);
	}
	return a;
};
export const cradleAngle = (f: number) => {
	const arr = cached('d06:cradleA', () => {
		const out = new Float32Array(LEN + 2);
		for (let i = 0; i < out.length; i++) out[i] = angleRaw(i);
		return out;
	});
	const i = Math.max(0, Math.min(arr.length - 2, Math.floor(f)));
	return arr[i] + (arr[i + 1] - arr[i]) * (f - i);
};

export type CradleOpts = {
	f: number;
	angle?: number; // grados (por defecto la señal precalculada)
	breathe?: number; // 0..1 amplitud de la respiración del bulto
	wriggle?: number; // 0..1
	hand?: number; // 0..1 la manita se asoma/sube 60 px
	grasp?: number; // 0..1 cierra los dedos
	light?: number; // 0..1 luz cálida de la veladora sobre la cuna
	inner?: (g: Ctx) => void; // entre el bulto y el borde delantero (tentáculos)
	glowFrom?: [number, number, number]; // x, y, intensidad de una luz de orbe para el contorno
};

export const paintCradle = (g: Ctx, o: CradleOpts) => {
	const {f, breathe = 1, wriggle = 0, hand = 0, grasp = 0, light = 1} = o;
	const ang = ((o.angle ?? cradleAngle(f)) * Math.PI) / 180;
	const t = f / FPS;
	const L = CRADLE.cy - CRADLE.py;
	const hw = CRADLE.w / 2;
	const top = -CRADLE.h * 0.35; // borde superior (local)
	// puntos de amarre en coordenadas locales de la cuna
	g.save();
	g.translate(CRADLE.px, CRADLE.py);
	g.rotate(-ang);
	g.translate(0, L);
	const rope = (x: number, back: boolean) => {
		g.strokeStyle = back ? '#2a1a0c' : '#4a3018';
		g.lineWidth = back ? 3 : 4;
		g.beginPath();
		g.moveTo(x, top);
		g.quadraticCurveTo(x * 0.5 + 4, top - L * 0.5, 0, -L);
		g.stroke();
		if (!back) {
			g.strokeStyle = rgba(P.gold, 0.25 * light);
			g.lineWidth = 1.2;
			g.stroke();
		}
	};
	rope(-hw + 40, true);
	rope(hw - 40, true);
	// borde trasero
	g.fillStyle = '#2a1608';
	g.beginPath();
	g.ellipse(0, top, hw - 6, 18, 0, Math.PI, Math.PI * 2);
	g.fill();
	// bulto (sarape a rayas naranja/verde desvaído)
	const br = 1 + 0.015 * breathe * Math.sin((2 * Math.PI * t) / 1.2);
	const wr = wriggle * Math.sin(t * 22) * 4;
	g.save();
	g.translate(wr, top + 6);
	g.scale(br, br);
	g.beginPath();
	g.ellipse(0, 0, hw * 0.62, 34, 0, Math.PI, Math.PI * 2);
	g.closePath();
	g.save();
	g.clip();
	for (let i = -8; i < 8; i++) {
		g.fillStyle = i % 3 === 0 ? '#7a8a5a' : i % 3 === 1 ? '#c8783e' : '#d9c09a';
		g.fillRect(i * 22, -40, 22, 48);
	}
	g.fillStyle = 'rgba(30,15,5,0.35)';
	g.fillRect(-hw, -40, hw * 2, 48);
	g.restore();
	g.restore();
	// manita (palma + cinco dedos de dos segmentos)
	if (hand > 0) {
		const hy = top - 14 - 60 * E.inOut(hand);
		const hx = 36;
		g.fillStyle = '#c99a72';
		g.beginPath();
		g.ellipse(hx, hy, 11, 13, 0, 0, Math.PI * 2);
		g.fill();
		for (let k = 0; k < 5; k++) {
			const a = -Math.PI / 2 + (k - 2) * 0.38;
			const curl = clamp(grasp + 0.25 * Math.sin(t * 3 + k));
			const l1 = 9 - Math.abs(k - 2) * 1.2;
			const x1 = hx + Math.cos(a) * 11;
			const y1 = hy + Math.sin(a) * 13;
			const x2 = x1 + Math.cos(a + curl * 1.2) * l1;
			const y2 = y1 + Math.sin(a + curl * 1.2) * l1;
			g.strokeStyle = '#c99a72';
			g.lineCap = 'round';
			g.lineWidth = 5;
			g.beginPath();
			g.moveTo(x1, y1);
			g.lineTo(x2, y2);
			g.lineTo(x2 + Math.cos(a + curl * 2.2) * l1 * 0.7, y2 + Math.sin(a + curl * 2.2) * l1 * 0.7);
			g.stroke();
		}
	}
	if (o.inner) {
		g.restore();
		o.inner(g);
		g.save();
		g.translate(CRADLE.px, CRADLE.py);
		g.rotate(-ang);
		g.translate(0, L);
	}
	// cuerpo de la cuna (caja de madera) y borde delantero
	const grd = g.createLinearGradient(-hw, 0, hw, 0);
	grd.addColorStop(0, '#6a4220');
	grd.addColorStop(0.5, '#4a2c14');
	grd.addColorStop(1, '#24140a');
	g.fillStyle = grd;
	g.beginPath();
	g.moveTo(-hw, top);
	g.lineTo(hw, top);
	g.quadraticCurveTo(hw - 10, CRADLE.h * 0.55, hw - 40, CRADLE.h * 0.62);
	g.lineTo(-hw + 40, CRADLE.h * 0.62);
	g.quadraticCurveTo(-hw + 10, CRADLE.h * 0.55, -hw, top);
	g.closePath();
	g.fill();
	// tablillas
	g.strokeStyle = 'rgba(15,8,3,0.5)';
	g.lineWidth = 2;
	for (let k = 1; k < 4; k++) {
		const y = top + (CRADLE.h * 0.97 * k) / 4;
		g.beginPath();
		g.moveTo(-hw + 8 + k * 6, y);
		g.lineTo(hw - 8 - k * 6, y);
		g.stroke();
	}
	// contorno cálido de la veladora (izquierda)
	g.strokeStyle = rgba(P.gold, 0.4 * light);
	g.lineWidth = 3;
	g.beginPath();
	g.moveTo(-hw, top);
	g.quadraticCurveTo(-hw + 10, CRADLE.h * 0.55, -hw + 40, CRADLE.h * 0.62);
	g.stroke();
	g.fillStyle = '#7a5028';
	g.fillRect(-hw, top - 3, hw * 2, 6);
	rope(-hw + 10, false);
	rope(hw - 10, false);
	g.restore();
	void hash;
};
