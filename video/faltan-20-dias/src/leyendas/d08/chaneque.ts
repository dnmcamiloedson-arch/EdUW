// Día 8 · RIG-05 silueta de chaneque (empezado en G1 para el reflejo de B4; G2/G3 pueden ampliarlo).
// Proporciones de viejo pequeño (a la rodilla): cabeza = 1/3 del cuerpo, orejas anchas, panza, brazos largos con
// manos de cuatro dedos nudosos, pies de dedos largos y sombrero de palma con fleco deshilachado.
// Coordenadas locales: pies en (0, 0), altura total ≈ 300 u (sombrero incluido). Nunca proporciones de niño.
import {hash, rgba} from '../../lib/util';
import type {Ctx} from '../kit/paint';
import {smoothPath} from '../kit/rig';
import type {V2} from './core';

export type ChanequePose = {
	headTilt?: number; // rad
	armL?: number; // giro del brazo (rad, 0 = colgando)
	armR?: number;
	lean?: number;
	fringe?: (i: number) => number; // desplazamiento angular por hebra del fleco
	crouch?: number; // 0 de pie … 1 agachado
};
export type SilStyle = {fill: string; rim?: string; rimA?: number; rimSide?: number};

const HEAD_Y = -190;
// dibuja la silueta; devuelve el centro de los ojos (local) para que el que llama ponga los ojos emisivos
export const chanequeSil = (g: Ctx, pose: ChanequePose, st: SilStyle): V2 => {
	const lean = pose.lean ?? 0;
	const cr = pose.crouch ?? 0;
	const hy = HEAD_Y * (1 - cr * 0.25);
	const neck: V2 = [lean * 40, hy + 52];
	g.save();
	g.fillStyle = st.fill;
	g.strokeStyle = st.fill;
	g.lineCap = 'round';
	g.lineJoin = 'round';
	// piernas cortas y arqueadas con pies largos
	const hip = -66 * (1 - cr * 0.3);
	const leg = (sd: number) => {
		g.lineWidth = 17;
		g.beginPath();
		g.moveTo(sd * 18 + lean * 16, hip);
		g.quadraticCurveTo(sd * 36, hip * 0.45, sd * 24, -6);
		g.stroke();
		g.beginPath();
		g.moveTo(sd * 24 - 9, 0);
		g.bezierCurveTo(sd * 24, -12, sd * 52, -10, sd * 64, -2);
		g.lineTo(sd * 66, 3);
		g.lineTo(sd * 18, 3);
		g.closePath();
		g.fill();
		// dedos largos
		g.lineWidth = 3;
		for (let k = 0; k < 3; k++) {
			g.beginPath();
			g.moveTo(sd * (56 + k * 3), 0);
			g.lineTo(sd * (70 + k * 4), 2 + k * 1.5);
			g.stroke();
		}
	};
	leg(-1);
	leg(1);
	// torso corto con panza redonda
	g.beginPath();
	g.moveTo(neck[0] - 22, neck[1] + 2);
	g.bezierCurveTo(neck[0] - 46, neck[1] + 20, -62 + lean * 10, hip - 30, -34, hip + 6);
	g.quadraticCurveTo(0, hip + 22, 34, hip + 6);
	g.bezierCurveTo(62 + lean * 10, hip - 30, neck[0] + 46, neck[1] + 20, neck[0] + 22, neck[1] + 2);
	g.closePath();
	g.fill();
	// brazos largos y flacos que cuelgan hasta la rodilla, manos de cuatro dedos nudosos
	const arm = (sd: number, a: number) => {
		const sh: V2 = [neck[0] + sd * 34, neck[1] + 12];
		const el: V2 = [sh[0] + sd * 14 + Math.sin(a) * 50, sh[1] + Math.cos(a) * 52];
		const wr: V2 = [el[0] + sd * 2 + Math.sin(a * 1.3) * 52, el[1] + Math.cos(a * 1.3) * 50];
		g.lineWidth = 10;
		g.beginPath();
		g.moveTo(sh[0], sh[1]);
		g.quadraticCurveTo(el[0] + sd * 6, el[1] - 10, el[0], el[1]);
		g.lineTo(wr[0], wr[1]);
		g.stroke();
		g.beginPath();
		g.arc(el[0], el[1], 6.5, 0, Math.PI * 2);
		g.fill();
		g.lineWidth = 4;
		for (let k = 0; k < 4; k++) {
			const fa = a * 1.3 + (k - 1.5) * 0.3 * sd;
			g.beginPath();
			g.moveTo(wr[0], wr[1]);
			const mx = wr[0] + Math.sin(fa) * 14 + sd * 2;
			const my = wr[1] + Math.cos(fa) * 14;
			g.quadraticCurveTo(mx + sd * 4, my, mx - sd * 3 + Math.sin(fa) * 9, my + 12);
			g.stroke();
			g.beginPath();
			g.arc(mx, my, 2.6, 0, Math.PI * 2);
			g.fill();
		}
	};
	arm(-1, pose.armL ?? 0.12);
	arm(1, pose.armR ?? -0.08);
	// cabeza grande con orejas anchas, cejas pesadas y sombrero de palma
	g.save();
	g.translate(neck[0], hy);
	g.rotate(pose.headTilt ?? 0);
	g.beginPath();
	g.ellipse(0, 6, 46, 50, 0, 0, Math.PI * 2);
	g.fill();
	for (const sd of [-1, 1]) {
		g.beginPath();
		g.moveTo(sd * 38, -6);
		g.bezierCurveTo(sd * 74, -26, sd * 84, 8, sd * 66, 26);
		g.quadraticCurveTo(sd * 50, 30, sd * 40, 18);
		g.closePath();
		g.fill();
	}
	// nariz ancha y barbilla (de perfil leve)
	g.beginPath();
	g.ellipse(4, 30, 12, 10, 0, 0, Math.PI * 2);
	g.fill();
	// sombrero: copa baja + ala ancha con fleco deshilachado
	g.beginPath();
	g.ellipse(0, -36, 34, 26, 0, Math.PI, Math.PI * 2);
	g.fill();
	g.beginPath();
	g.ellipse(0, -30, 98, 18, 0, 0, Math.PI * 2);
	g.fill();
	g.lineWidth = 2.4;
	const n = 40;
	for (let i = 0; i < n; i++) {
		const u = i / (n - 1);
		const a = Math.PI * (0.02 + 0.96 * u);
		const bx = Math.cos(a) * 96;
		const by = -30 + Math.sin(a) * 16;
		const L = 10 + hash(i, 7) * 16;
		const sw = pose.fringe ? pose.fringe(i) : 0;
		g.beginPath();
		g.moveTo(bx, by);
		g.lineTo(bx + Math.cos(a) * 6 + sw * L, by + L);
		g.stroke();
	}
	for (let i = 0; i < 16; i++) {
		const a = Math.PI + (i / 15) * Math.PI;
		const bx = Math.cos(a) * 96;
		const by = -30 + Math.sin(a) * 16;
		g.beginPath();
		g.moveTo(bx, by);
		g.lineTo(bx + Math.cos(a) * (8 + hash(i, 9) * 8), by - 2 - hash(i, 10) * 6);
		g.stroke();
	}
	// filo de luz (luna o cielo reflejado) en el contorno del lado de la luz
	if (st.rim) {
		const sd = st.rimSide ?? -1;
		g.strokeStyle = rgba(st.rim, st.rimA ?? 0.5);
		g.lineWidth = 2.2;
		g.beginPath();
		g.ellipse(0, -30, 97, 17, 0, Math.PI * (sd < 0 ? 0.9 : -0.1), Math.PI * (sd < 0 ? 1.3 : 0.3));
		g.stroke();
		g.beginPath();
		g.ellipse(0, 6, 45, 49, 0, Math.PI * (sd < 0 ? 0.75 : -0.25), Math.PI * (sd < 0 ? 1.15 : 0.15));
		g.stroke();
		g.beginPath();
		const ex = sd * 66;
		smoothPath(g, [
			[sd * 40, -4],
			[sd * 70, -18],
			[ex + sd * 12, 6],
		]);
		g.stroke();
	}
	g.restore();
	g.restore();
	// centro de los ojos (bajo el ala, sobre la nariz), en coordenadas locales con la inclinación aplicada
	const ty = pose.headTilt ?? 0;
	const ox = 0;
	const oy = 8;
	return [neck[0] + ox * Math.cos(ty) - oy * Math.sin(ty), hy + ox * Math.sin(ty) + oy * Math.cos(ty)];
};
