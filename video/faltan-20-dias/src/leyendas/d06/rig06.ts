// Geometría del cuerpo de la madre en coordenadas locales (origen en el piso bajo la cadera, 1 unidad = 1 px a
// escala 1, y hacia arriba negativa; 620 de alto de pie). Dos juegos de puntos clave con la misma topología:
// ESPALDA (de pie, de espaldas al espejo) y PERFIL (sentada, mirando a la cuna, a la derecha). Se interpolan con m.
import {clamp, lerp} from '../../lib/util';
import type {V2} from '../kit/rig';

export type BodyIn = {m: number; lean: number; head: number; walk: number | null};

type Kp = {
	skirt: V2[]; // 8: cintura izq → cadera → ruedo → ruedo der → cintura der
	torso: V2[]; // 6
	head: V2;
	headR: V2;
	neck: V2;
	hip: V2;
	shF: V2; // hombro del brazo que alcanza (espalda: izquierdo en pantalla; perfil: el cercano)
	shB: V2;
	top: V2[]; // 9 puntos del borde superior del rebozo (capucha), de izquierda a derecha en pantalla
	bot: V2[]; // 3 puntos del borde inferior
};

const BACK: Kp = {
	skirt: [
		[-52, -336],
		[-76, -272],
		[-90, -120],
		[-100, -3],
		[100, -3],
		[90, -120],
		[76, -272],
		[52, -336],
	],
	torso: [
		[-54, -330],
		[-80, -490],
		[-22, -528],
		[22, -528],
		[80, -490],
		[54, -330],
	],
	head: [0, -578],
	headR: [37, 44],
	neck: [0, -528],
	hip: [0, -300],
	shF: [-70, -492],
	shB: [70, -492],
	top: [
		[-108, -468],
		[-70, -497],
		[-44, -532],
		[-40, -592],
		[0, -624],
		[40, -592],
		[44, -532],
		[70, -497],
		[108, -468],
	],
	bot: [
		[-110, -296],
		[0, -276],
		[110, -296],
	],
};

const SIDE: Kp = {
	skirt: [
		[-40, -252],
		[-66, -172],
		[-40, -70],
		[24, -3],
		[196, -3],
		[188, -110],
		[176, -176],
		[34, -262],
	],
	torso: [
		[-40, -248],
		[-38, -420],
		[-12, -458],
		[16, -452],
		[40, -392],
		[32, -262],
	],
	head: [12, -506],
	headR: [36, 42],
	neck: [2, -458],
	hip: [0, -160],
	shF: [8, -428],
	shB: [-10, -430],
	top: [
		[-62, -396],
		[-56, -440],
		[-50, -488],
		[-42, -540],
		[-8, -566],
		[26, -560],
		[42, -538],
		[46, -514],
		[44, -496],
	],
	bot: [
		[-72, -232],
		[-14, -268],
		[42, -352],
	],
};

const L2 = (a: V2, b: V2, t: number): V2 => [lerp(a[0], b[0], t), lerp(a[1], b[1], t)];
const LA = (a: V2[], b: V2[], t: number) => a.map((p, i) => L2(p, b[i], t));

// curva por puntos (Catmull-Rom) muestreada en u ∈ [0,1]
export const curveAt = (pts: V2[], u: number): V2 => {
	const n = pts.length - 1;
	const x = clamp(u) * n;
	const i = Math.min(n - 1, Math.floor(x));
	const t = x - i;
	const p0 = pts[Math.max(0, i - 1)];
	const p1 = pts[i];
	const p2 = pts[i + 1];
	const p3 = pts[Math.min(n, i + 2)];
	const c = (a: number, b: number, cc: number, d: number) => 0.5 * (2 * b + (-a + cc) * t + (2 * a - 5 * b + 4 * cc - d) * t * t + (-a + 3 * b - 3 * cc + d) * t * t * t);
	return [c(p0[0], p1[0], p2[0], p3[0]), c(p0[1], p1[1], p2[1], p3[1])];
};

export type Body = Kp & {m: number};

// cuerpo resuelto: interpola, aplica inclinación (lean), cabeceo (head) y caminata
export const solveBody = (o: BodyIn): Body => {
	const m = clamp(o.m);
	const mm = m * m * (3 - 2 * m);
	const k: Kp = {
		skirt: LA(BACK.skirt, SIDE.skirt, mm),
		torso: LA(BACK.torso, SIDE.torso, mm),
		head: L2(BACK.head, SIDE.head, mm),
		headR: L2(BACK.headR, SIDE.headR, mm),
		neck: L2(BACK.neck, SIDE.neck, mm),
		hip: L2(BACK.hip, SIDE.hip, mm),
		shF: L2(BACK.shF, SIDE.shF, mm),
		shB: L2(BACK.shB, SIDE.shB, mm),
		top: LA(BACK.top, SIDE.top, mm),
		bot: LA(BACK.bot, SIDE.bot, mm),
	};
	// caminata: vaivén de cadera y ruedo
	if (o.walk !== null) {
		const ph = o.walk * Math.PI;
		const sway = Math.sin(ph) * 5 * (1 - mm);
		const hem = Math.sin(ph - 0.7) * 9 * (1 - mm);
		k.skirt = k.skirt.map(([x, y], i) => [x + sway * (y < -200 ? 1 : 0.5) + (i >= 2 && i <= 5 ? hem : 0), y]);
		k.torso = k.torso.map(([x, y]) => [x + sway, y]);
		k.head = [k.head[0] + sway, k.head[1]];
		k.neck = [k.neck[0] + sway, k.neck[1]];
		k.shF = [k.shF[0] + sway, k.shF[1]];
		k.shB = [k.shB[0] + sway, k.shB[1]];
		k.top = k.top.map(([x, y]) => [x + sway, y]);
		k.bot = k.bot.map(([x, y]) => [x + sway, y]);
	}
	// inclinación del torso alrededor de la cadera: perfil = rotación, espalda = acortamiento
	const hip = k.hip;
	const lean = o.lean;
	const c = Math.cos(lean * mm);
	const s = Math.sin(lean * mm);
	const squash = 1 - 0.3 * lean * (1 - mm);
	const up = (p: V2): V2 => {
		const dx = p[0] - hip[0];
		const dy = (p[1] - hip[1]) * squash;
		return [hip[0] + dx * c - dy * s, hip[1] + dx * s + dy * c];
	};
	const upper = (arr: V2[]) => arr.map(up);
	k.torso = k.torso.map((p, i) => (i === 0 || i === 5 ? p : up(p)));
	k.head = up(k.head);
	k.neck = up(k.neck);
	k.shF = up(k.shF);
	k.shB = up(k.shB);
	k.top = upper(k.top);
	k.bot = k.bot.map((p) => L2(p, up(p), 0.6));
	// cabeceo: perfil = rotación en el cuello; espalda = la cabeza baja
	const hd = o.head;
	if (hd) {
		const n = k.neck;
		const ch = Math.cos(hd * mm);
		const sh = Math.sin(hd * mm);
		const rot = (p: V2): V2 => {
			const dx = p[0] - n[0];
			const dy = p[1] - n[1];
			return [n[0] + dx * ch - dy * sh, n[1] + dx * sh + dy * ch + hd * 40 * (1 - mm)];
		};
		k.head = rot(k.head);
		// los puntos de la capucha que rodean la cabeza siguen el cabeceo (los de los hombros no)
		k.top = k.top.map((p, i) => (i <= 1 ? p : L2(p, rot(p), i === 2 ? 0.5 : 1)));
	}
	return {...k, m: mm};
};

export const COLS = 10;
export const ROWS = 14;

// posición de reposo del rebozo (columna c, fila r) para un cuerpo resuelto
export const restCloth = (b: Body, c: number, r: number): V2 => {
	const u = c / (COLS - 1);
	const v = r / (ROWS - 1);
	const t = curveAt(b.top, u);
	const bt = curveAt(b.bot, u);
	// la tela se abomba un poco hacia afuera a media caída
	const bulge = Math.sin(v * Math.PI) * (u - 0.5) * 16 * (1 - b.m * 0.6);
	const vv = Math.pow(v, 0.92);
	return [lerp(t[0], bt[0], vv) + bulge, lerp(t[1], bt[1], vv)];
};
