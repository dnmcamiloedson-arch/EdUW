// Párpados del viajero: los únicos cortes del episodio. Arcos elípticos más anchos que el cuadro, borde difuminado,
// pestañas borrosas cerca del cierre, translucidez cálida #1A0805. El de arriba baja más rápido que el de abajo.
import {noise2D} from '@remotion/noise';
import {E, H, W, clamp, rgba} from '../../lib/util';
import type {Ctx} from '../kit/paint';
import {EV, P} from './timeline';

// curva de un parpadeo: cerrar c frames, sostener h, abrir o (con sobreimpulso al abrir)
const blink = (f: number, f0: number, c = 3, h = 4, o = 5) => {
	const d = f - f0;
	if (d < 0 || d > c + h + o + 4) return 0;
	if (d < c) return E.in(d / c);
	if (d < c + h) return 1;
	const u = (d - c - h) / o;
	if (u < 1) return 1 - E.out(u);
	return -0.06 * Math.sin(((d - c - h - o) / 4) * Math.PI); // sobreimpulso (párpado se abre de más ≈ 8 px)
};

// cierre 0..1 (negativo = sobreimpulso), más intrusión de la pelea
export const lidState = (f: number): {close: number; fight: number} => {
	let close = 0;
	close += blink(f, EV.blink1[0], 3, 4, 5);
	close += blink(f, EV.blink2[0], 2, 1, 3);
	close += blink(f, EV.blink3[0], 2, 1, 2);
	// parpadeo tartamudo #4: cierra 3, abre a medias 4, cierra 3, abre 5
	const d4 = f - EV.blink4[0];
	if (d4 >= 0 && d4 < 3) close = Math.max(close, E.in(d4 / 3));
	else if (d4 >= 3 && d4 < 5) close = Math.max(close, 1 - 0.55 * E.out((d4 - 3) / 2));
	else if (d4 >= 5 && d4 < 8) close = Math.max(close, 0.45 + 0.55 * ((d4 - 5) / 2 > 1 ? 1 : (d4 - 5) / 2));
	else if (d4 >= 8 && d4 < 9) close = Math.max(close, 1);
	else if (d4 >= 9 && d4 < 14) close = Math.max(close, 1 - E.out((d4 - 9) / 5));
	// cierre final lento (33.5 → 33.8 s) que no vuelve a abrir
	if (f >= EV.lidsClose[0] && f < EV.black[1]) close = Math.max(close, E.inOut(clamp((f - EV.lidsClose[0]) / (EV.lidsClose[1] - EV.lidsClose[0]))));
	let fight = 0;
	if (f >= EV.fight[0] && f < EV.fight[1] + 2) {
		const u = (f - EV.fight[0]) / (EV.fight[1] - EV.fight[0]);
		fight = clamp(Math.sin(Math.min(1, u) * Math.PI) * 0.6 + u * 0.4);
	}
	return {close, fight};
};

// pinta los párpados encima del mundo (antes de post). close 0..1, fight 0..1
export const paintLids = (g: Ctx, f: number, t: number, s = lidState(f)) => {
	const {close, fight} = s;
	if (close < 0.01 && fight < 0.01) return; // ojos abiertos (el sobreimpulso no se ve: bordes fuera de cuadro)
	const trem = fight > 0 ? Math.sin(t * Math.PI * 2 * 9) * 10 * fight + noise2D('lidf', t * 9, 0) * 8 * fight : 0;
	const intr = fight * (40 + 80 * (0.5 + 0.5 * Math.sin(t * 5.3))) + trem;
	const c = clamp(close);
	const over = close < 0 ? -close : 0; // sobreimpulso: los bordes se retiran 8 px más
	const topY = (H * 0.56) * E.inOut(c) * 1.02 + intr - over * 130; // borde del párpado superior (centro)
	const botY = H - (H * 0.46) * E.inOut(Math.pow(c, 1.25)) * 1.02 - intr * 0.8 + over * 130;
	if (topY <= -60 && botY >= H + 60) return;
	const curv = 160; // curvatura del arco (más ancho que el cuadro)
	// pelea: refracción húmeda — el cuadro se embarra en un anillo radial (copia ampliada) antes de los párpados
	if (fight > 0.01) {
		const cw = g.canvas.width;
		const ch = g.canvas.height;
		for (const [z, a] of [[1 + 0.018 * fight, 0.2], [1 + 0.04 * fight, 0.12]] as const) {
			g.save();
			g.globalAlpha = a * fight;
			g.drawImage(g.canvas, 0, 0, cw, ch, W / 2 - (W * z) / 2, H * 0.47 - (H * z) / 2, W * z, H * z);
			g.restore();
		}
	}
	const lid = (edge: number, up: boolean) => {
		g.save();
		g.filter = 'blur(20px)';
		g.fillStyle = rgba(P.lid, 0.97);
		g.beginPath();
		if (up) {
			g.moveTo(-200, -200);
			g.lineTo(W + 200, -200);
			g.lineTo(W + 200, edge - curv);
			g.quadraticCurveTo(W / 2, edge + curv, -200, edge - curv);
		} else {
			g.moveTo(-200, H + 200);
			g.lineTo(W + 200, H + 200);
			g.lineTo(W + 200, edge + curv * 0.7);
			g.quadraticCurveTo(W / 2, edge - curv * 0.7, -200, edge + curv * 0.7);
		}
		g.closePath();
		g.fill();
		g.restore();
		// menisco húmedo: brillo cálido del farol en el borde del párpado durante la pelea
		if (fight > 0.01) {
			g.save();
			g.filter = 'blur(4px)';
			g.globalCompositeOperation = 'lighter';
			g.strokeStyle = rgba(P.sand, 0.22 * fight);
			g.lineWidth = 7;
			g.beginPath();
			const e2 = up ? edge + 18 : edge - 18;
			if (up) {
				g.moveTo(W + 200, e2 - curv);
				g.quadraticCurveTo(W / 2, e2 + curv, -200, e2 - curv);
			} else {
				g.moveTo(W + 200, e2 + curv * 0.7);
				g.quadraticCurveTo(W / 2, e2 - curv * 0.7, -200, e2 + curv * 0.7);
			}
			g.stroke();
			g.restore();
		}
		// pestañas borrosas cerca del cierre
		if (c > 0.55 && c < 0.995) {
			g.save();
			g.filter = 'blur(3px)';
			g.strokeStyle = rgba('#050201', 0.6 * (c - 0.55) / 0.45);
			g.lineWidth = 3;
			for (let i = 0; i < 46; i++) {
				const x = 40 + (i / 45) * (W - 80);
				const u = (x - W / 2) / (W / 2);
				const by = up ? edge - curv * u * u : edge + curv * 0.7 * u * u;
				g.beginPath();
				g.moveTo(x, by + (up ? -4 : 4));
				g.lineTo(x + u * 14, by + (up ? 26 : -26));
				g.stroke();
			}
			g.restore();
		}
	};
	if (topY > -60) lid(topY, true);
	if (botY < H + 60) lid(botY, false);
	// translucidez cálida con los ojos cerrados
	if (c > 0.98) {
		g.fillStyle = rgba(P.lid, 1);
		g.fillRect(0, 0, W, H);
		g.fillStyle = rgba('#3a120a', 0.18);
		g.fillRect(0, H * 0.3, W, H * 0.4);
	}
};
