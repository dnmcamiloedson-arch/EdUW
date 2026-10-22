// El farol de hojalata en la mano derecha del viajero: péndulo, llama-brújula (se inclina hacia el charro) y
// la mano que lo sostiene por el asa de alambre. La llama encoge y se azula cuando él está a menos de 6 m.
import {noise2D} from '@remotion/noise';
import {clamp, lerp, rgba} from '../../lib/util';
import {cached, glow, makeCanvas, type Ctx} from '../kit/paint';
import {paintShape} from '../kit/shade';
import {P} from './timeline';

// parpadeo del farol: ruido 0.85–1.0 a 7 Hz + vaivén de 0.7 Hz
export const lampK = (t: number) => clamp(0.85 + 0.075 * (1 + noise2D('d5lamp', t * 7, 0)) * 0.9 + 0.04 * Math.sin(t * Math.PI * 2 * 0.7), 0.82, 1.02);

// dirección de la llama en pantalla: ang (rad, 0 = arriba, + = a la derecha), stretch (alto relativo), blue 0..1
export type FlameDir = {ang: number; stretch: number; blue: number; size: number};
export const flameToward = (dx: number, dy: number, dist: number, size: number): FlameDir => {
	// dy > 0 → el charro está hacia el espectador/abajo (detrás): la llama se tiende hacia el borde inferior y se estira
	const raw = Math.atan2(dx, -dy);
	const ang = clamp(raw, -1.45, 1.45);
	const behind = clamp(dy / Math.max(1, Math.hypot(dx, dy)));
	const near = clamp((6 - dist) / 4);
	return {ang, stretch: 1 + 0.35 * behind - 0.3 * near, blue: near, size: size * (1 - 0.35 * near)};
};

const flame = (g: Ctx, s: number, t: number, d: FlameDir, a = 1) => {
	const flick = 0.85 + 0.15 * noise2D('d5fk', t * 9, 1);
	const hgt = s * 2.6 * flick * d.stretch;
	const sway = noise2D('d5fs', t * 2.2, 0) * 0.12;
	g.save();
	g.rotate(d.ang * 0.85);
	glow(g, 0, -hgt * 0.4, s * 7, '#ffb24a', 0.3 * a * flick);
	g.globalCompositeOperation = 'lighter';
	const layer = (k: number, col: string) => {
		const wv = s * 0.55 * k;
		const hh = hgt * k;
		g.fillStyle = col;
		g.beginPath();
		g.moveTo(0, 0);
		g.bezierCurveTo(-wv * 1.15, -hh * 0.18, -wv * 0.9, -hh * 0.62, sway * hh, -hh);
		g.bezierCurveTo(wv * 0.9, -hh * 0.62, wv * 1.15, -hh * 0.18, 0, 0);
		g.fill();
	};
	layer(1, rgba('#ff7a1e', 0.55 * a));
	layer(0.78, rgba('#ffbe46', 0.85 * a));
	layer(0.5, rgba('#fff5c8', 0.95 * a));
	g.globalCompositeOperation = 'source-over';
	g.fillStyle = `rgba(40,70,170,${0.3 + 0.45 * d.blue})`;
	g.beginPath();
	g.ellipse(0, -s * 0.12, s * (0.24 + 0.12 * d.blue), s * (0.3 + 0.25 * d.blue), 0, 0, Math.PI * 2);
	g.fill();
	g.restore();
};

// Farol colgando de la mano: (hx, hy) = punto del asa en la mano; swing = ángulo del péndulo (rad); sc = escala.
// Farol de hojalata: capuchón cónico con respiraderos, globo de vidrio con cuatro guardas de alambre, depósito
// con perilla de mecha. La luz sale del vidrio: ilumina el lado de abajo del capuchón y el canto del depósito.
const metal = (g: Ctx, x0: number, x1: number, k: number, warm: number) => {
	const gr = g.createLinearGradient(x0, 0, x1, 0);
	gr.addColorStop(0, '#0f0c09');
	gr.addColorStop(0.28, '#4a3d30');
	gr.addColorStop(0.4, rgba('#8a7356', 0.9));
	gr.addColorStop(0.55, '#2b231b');
	gr.addColorStop(0.85, rgba(P.terra, 0.25 + 0.3 * warm * k));
	gr.addColorStop(1, '#0d0a07');
	return gr;
};
export const paintFarol = (g: Ctx, o: {hx: number; hy: number; swing: number; sc: number; t: number; dir: FlameDir; k: number; hand?: boolean; handTone?: number}) => {
	const {hx, hy, swing, sc, t, dir, k} = o;
	const lit = clamp(dir.size, 0.2, 1.2) * k;
	g.save();
	g.translate(hx, hy);
	g.rotate(swing);
	g.scale(sc, sc);
	// asa de alambre (arco) con brillo
	g.lineCap = 'round';
	g.strokeStyle = '#1c1611';
	g.lineWidth = 4.5;
	g.beginPath();
	g.moveTo(-44, 74);
	g.bezierCurveTo(-46, 10, -14, -6, 0, -6);
	g.bezierCurveTo(14, -6, 46, 10, 44, 74);
	g.stroke();
	g.strokeStyle = rgba('#9a8a74', 0.45);
	g.lineWidth = 1.4;
	g.beginPath();
	g.moveTo(-42, 70);
	g.bezierCurveTo(-44, 12, -14, -3, 0, -3);
	g.stroke();
	// pivotes del asa
	g.fillStyle = '#2a2119';
	for (const x of [-44, 44]) {
		g.beginPath();
		g.arc(x, 76, 4.5, 0, Math.PI * 2);
		g.fill();
	}
	// capuchón: chimenea perforada + cono
	g.fillStyle = metal(g, -16, 16, k, 0.3);
	g.beginPath();
	g.moveTo(-13, 34);
	g.lineTo(13, 34);
	g.lineTo(15, 58);
	g.lineTo(-15, 58);
	g.closePath();
	g.fill();
	g.fillStyle = '#0a0806';
	g.beginPath();
	g.ellipse(0, 34, 13, 4, 0, 0, Math.PI * 2);
	g.fill();
	for (let i = 0; i < 4; i++) {
		g.fillStyle = rgba(P.gold, 0.55 * lit);
		g.beginPath();
		g.arc(-8 + i * 5.4, 47, 1.6, 0, Math.PI * 2);
		g.fill();
	}
	g.fillStyle = metal(g, -50, 50, k, 0.5);
	g.beginPath();
	g.moveTo(-16, 56);
	g.quadraticCurveTo(-30, 70, -50, 92);
	g.lineTo(50, 92);
	g.quadraticCurveTo(30, 70, 16, 56);
	g.closePath();
	g.fill();
	// canto inferior del cono iluminado desde el vidrio
	g.fillStyle = rgba(P.cempa, 0.55 * lit);
	g.fillRect(-50, 89, 100, 4);
	g.strokeStyle = rgba(P.moonRim, 0.35);
	g.lineWidth = 1.2;
	g.beginPath();
	g.moveTo(-16, 56);
	g.quadraticCurveTo(-30, 70, -50, 92);
	g.stroke();
	// globo de vidrio (abombado) con la llama
	const gy0 = 92;
	const gy1 = 206;
	const gm = (gy0 + gy1) / 2;
	const globe = (g2: Ctx) => {
		g2.beginPath();
		g2.moveTo(-36, gy0);
		g2.bezierCurveTo(-56, gy0 + 22, -56, gy1 - 22, -36, gy1);
		g2.lineTo(36, gy1);
		g2.bezierCurveTo(56, gy1 - 22, 56, gy0 + 22, 36, gy0);
		g2.closePath();
	};
	const gl = g.createRadialGradient(0, 170, 4, 0, 160, 70);
	gl.addColorStop(0, rgba('#fff0c0', 0.75 * lit));
	gl.addColorStop(0.35, rgba(P.gold, 0.5 * lit));
	gl.addColorStop(0.75, rgba(P.cempa, 0.32 * lit));
	gl.addColorStop(1, rgba(P.terra, 0.25 * lit));
	g.fillStyle = gl;
	globe(g);
	g.fill();
	// hollín arriba del vidrio
	const soot = g.createLinearGradient(0, gy0, 0, gy0 + 45);
	soot.addColorStop(0, 'rgba(12,8,5,0.75)');
	soot.addColorStop(1, 'rgba(12,8,5,0)');
	g.fillStyle = soot;
	globe(g);
	g.fill();
	g.save();
	g.translate(0, 182);
	g.rotate(-swing); // la llama busca la vertical (y luego la brújula)
	flame(g, 14 * dir.size, t, dir, k);
	g.restore();
	// reflejos del vidrio
	g.strokeStyle = rgba('#fff4d8', 0.5 * lit);
	g.lineWidth = 2.2;
	g.beginPath();
	g.moveTo(-40, gy0 + 16);
	g.bezierCurveTo(-49, gm - 10, -49, gm + 12, -41, gy1 - 18);
	g.stroke();
	g.strokeStyle = rgba(P.moonRim, 0.3);
	g.lineWidth = 1.5;
	g.beginPath();
	g.moveTo(38, gy0 + 14);
	g.bezierCurveTo(47, gm - 10, 47, gm + 10, 40, gy1 - 16);
	g.stroke();
	// guardas de alambre
	g.strokeStyle = '#17120d';
	g.lineWidth = 3.2;
	for (const [x0, bulge] of [[-30, -18], [0, 0], [30, 18]] as const) {
		g.beginPath();
		g.moveTo(x0 * 1.15, gy0 - 2);
		g.bezierCurveTo(x0 * 1.15 + bulge * 0.9, gy0 + 30, x0 * 1.15 + bulge * 0.9, gy1 - 30, x0 * 1.15, gy1 + 2);
		g.stroke();
	}
	g.beginPath();
	g.ellipse(0, gm, 52, 6, 0, 0, Math.PI);
	g.stroke();
	// depósito con perilla de la mecha
	g.fillStyle = metal(g, -48, 48, k, 0.8);
	g.beginPath();
	g.moveTo(-44, gy1);
	g.lineTo(44, gy1);
	g.quadraticCurveTo(50, gy1 + 20, 44, gy1 + 36);
	g.lineTo(-44, gy1 + 36);
	g.quadraticCurveTo(-50, gy1 + 20, -44, gy1);
	g.closePath();
	g.fill();
	g.fillStyle = rgba(P.gold, 0.6 * lit);
	g.fillRect(-44, gy1, 88, 3.5);
	g.strokeStyle = 'rgba(8,6,4,0.8)';
	g.lineWidth = 2;
	g.beginPath();
	g.moveTo(-46, gy1 + 18);
	g.lineTo(46, gy1 + 18);
	g.stroke();
	g.fillStyle = '#2a2119';
	g.beginPath();
	g.ellipse(52, gy1 + 14, 7, 5, 0, 0, Math.PI * 2);
	g.fill();
	g.restore();
	// mano derecha que sostiene el asa (manga de manta, piel en sombra con rim cálido)
	if (o.hand !== false) paintRightHand(g, hx, hy, sc, lit, swing);
	glow(g, hx + Math.sin(swing) * -150 * sc, hy + Math.cos(swing) * 150 * sc, 280 * sc * dir.size, P.cempa, 0.22 * k, 0.2);
	glow(g, hx + Math.sin(swing) * -160 * sc, hy + Math.cos(swing) * 160 * sc, 70 * sc * dir.size, P.gold, 0.35 * k, 0.3);
};

// mano derecha (vista desde arriba, el dorso hacia nosotros) cerrada sobre el asa; el antebrazo entra desde la esquina.
// Es estática (solo la luz cambia): se pinta una vez en un sprite y se modula con brillos.
const handArt = (g: Ctx) => {
	const lightUp = Math.PI / 2 + 0.4; // la luz viene de abajo (el farol)
	const arm = (g2: Ctx) => {
		g2.moveTo(6, 24);
		g2.bezierCurveTo(50, 110, 140, 300, 210, 520);
		g2.lineTo(470, 520);
		g2.bezierCurveTo(330, 280, 150, 60, 56, -6);
		g2.closePath();
	};
	paintShape(
		g,
		arm,
		[0, -10, 470, 532],
		{
			fill: (g2, b) => {
				const gr = g2.createLinearGradient(b[0], b[1], b[0] + b[2] * 0.6, b[1] + b[3]);
				gr.addColorStop(0, '#2a2119');
				gr.addColorStop(1, '#120e0a');
				return gr;
			},
			light: lightUp,
			rim: {color: P.cempa, width: 3, alpha: 0.28, blur: 3},
			shadow: {color: '#050302', width: 30, alpha: 0.6, blur: 10},
			texture: {seed: 33, scale: 0.6, alpha: 0.2, color: '#3a3430'},
		},
		0.35,
	);
	g.strokeStyle = 'rgba(6,4,2,0.5)';
	g.lineWidth = 4;
	g.lineCap = 'round';
	for (const [a, b, c2, d] of [[60, 100, 150, 70], [110, 190, 210, 150], [150, 290, 270, 250]] as const) {
		g.beginPath();
		g.moveTo(a, b);
		g.quadraticCurveTo((a + c2) / 2 + 10, (b + d) / 2 + 20, c2, d);
		g.stroke();
	}
	// doblez del puño de manta
	g.strokeStyle = rgba(P.sand, 0.18);
	g.lineWidth = 3;
	g.beginPath();
	g.moveTo(22, 58);
	g.quadraticCurveTo(60, 64, 92, 30);
	g.stroke();
	const hand = (g2: Ctx) => {
		g2.moveTo(-30, -2);
		g2.bezierCurveTo(-32, -16, -22, -24, -10, -24);
		g2.bezierCurveTo(4, -27, 20, -26, 32, -18);
		g2.bezierCurveTo(50, -6, 62, 14, 60, 34);
		g2.bezierCurveTo(48, 54, 22, 56, 6, 44);
		g2.bezierCurveTo(-10, 34, -24, 20, -30, -2);
		g2.closePath();
		g2.moveTo(-24, -4);
		g2.lineTo(24, -8);
		g2.bezierCurveTo(32, -6, 36, 4, 30, 10);
		g2.bezierCurveTo(18, 17, 4, 20, -10, 16);
		g2.bezierCurveTo(-20, 18, -30, 12, -28, 0);
		g2.closePath();
	};
	paintShape(
		g,
		hand,
		[-36, -30, 100, 90],
		{
			fill: (g2, b) => {
				const gr = g2.createLinearGradient(b[0], b[1], b[0], b[1] + b[3]);
				gr.addColorStop(0, '#1e1209');
				gr.addColorStop(0.55, '#2c1a0e');
				gr.addColorStop(1, '#3a2010');
				return gr;
			},
			light: lightUp,
			rim: {color: P.gold, width: 3, alpha: 0.3, blur: 2},
			shadow: {color: '#0a0503', width: 12, alpha: 0.55, blur: 6},
			texture: {seed: 33, scale: 0.5, alpha: 0.1, color: '#3a3430'},
		},
		1,
	);
	g.strokeStyle = 'rgba(8,4,2,0.5)';
	g.lineWidth = 1.6;
	for (let i = 0; i < 3; i++) {
		const x = -13 + i * 13;
		g.beginPath();
		g.moveTo(x, -22 + i);
		g.quadraticCurveTo(x - 2, -2, x + 1, 14);
		g.stroke();
	}
	// cuatro dedos doblados bajo el alambre
	g.strokeStyle = 'rgba(8,4,2,0.55)';
	g.lineWidth = 1.4;
	for (let i = 0; i < 4; i++) {
		g.beginPath();
		g.arc(-17 + i * 13, 10 + i * 0.5, 6.5, 0.15 * Math.PI, 0.85 * Math.PI);
		g.stroke();
	}
	g.strokeStyle = rgba(P.moonRim, 0.16);
	g.lineWidth = 2;
	g.beginPath();
	g.moveTo(-28, -10);
	g.bezierCurveTo(-24, -24, 10, -28, 32, -18);
	g.stroke();
};
const handSprite = () =>
	cached('d5rhand2', () => {
		const c = makeCanvas(336, 360);
		const g = c.getContext('2d')!;
		g.scale(0.6, 0.6);
		g.translate(70, 60);
		handArt(g);
		return c;
	});
export const paintRightHand = (g: Ctx, hx: number, hy: number, sc: number, k: number, swing = 0) => {
	g.drawImage(handSprite(), hx - 70 * sc, hy - 60 * sc, 560 * sc, 600 * sc);
	// luz cálida del vidrio en la parte baja de los dedos (sigue al péndulo)
	glow(g, hx - Math.sin(swing) * 40 * sc, hy + 26 * sc, 60 * sc, P.cempa, 0.22 * k, 0.2);
	void lerp;
};
