// Coreografía de la madre (por claves, con anticipación y asentamiento) y trayectorias de los orbes.
// 66–132 entra desde el primer plano derecho y camina dos pasos hasta la cuna; 138 la empuja; 164–188 un paso hacia
// la ventana; 192–228 saca las tijeras, las abre (207) y las para en la repisa (tock 228); 232–258 cruza a la silla,
// 250–266 se sienta de perfil; 268+ mano en el mecate (mece la cuna). Después: cabeceos, despertar, amanecer.
import {E, clamp, lerp, ramp} from '../../lib/util';
import type {AbuelaPose} from './abuela';
import type {V2} from '../kit/rig';
import {cradleAngle, CRADLE} from './cradle';
import {EV, FPS} from './timeline';
import {HUT, ridgeNear} from './exterior';

const seg = (f: number, a: number, b: number) => E.inOut(clamp((f - a) / (b - a)));
// avance de caminata: arranque corto, velocidad pareja, frenado suave
const walkU = (f: number, a: number, b: number) => {
	const u = clamp((f - a) / (b - a));
	return u < 0.15 ? (u * u) / 0.3 : u > 0.8 ? 1 - ((1 - u) * (1 - u)) / 0.4 : 0.075 + (u - 0.15) * ((1 - 0.1 - 0.075) / 0.65);
};
const bobOf = (phase: number) => -5 * Math.abs(Math.sin(phase * Math.PI));

// punto del borde de la cuna (extremo derecho / izquierdo) siguiendo su vaivén
export const cradleRim = (f: number, side: 1 | -1): V2 => {
	const a = (cradleAngle(f) * Math.PI) / 180;
	const L = CRADLE.cy - CRADLE.py;
	const lx = side * (CRADLE.w / 2 - 14);
	const ly = L - CRADLE.h * 0.35;
	return [CRADLE.px + lx * Math.cos(-a) - ly * Math.sin(-a), CRADLE.py + lx * Math.sin(-a) + ly * Math.cos(-a)];
};
// mano en el mecate delantero izquierdo de la cuna (sigue el vaivén)
export const ropeHand = (f: number): V2 => {
	const a = (cradleAngle(f) * Math.PI) / 180;
	const L = CRADLE.cy - CRADLE.py;
	const k = 0.1;
	const lx = -(CRADLE.w / 2 - 10) * (1 - k);
	const ly = L - CRADLE.h * 0.35 - (L - CRADLE.h * 0.35) * k;
	return [CRADLE.px + lx * Math.cos(-a) - ly * Math.sin(-a), CRADLE.py + lx * Math.sin(-a) + ly * Math.cos(-a)];
};

const mixV = (a: V2, b: V2, t: number): V2 => [lerp(a[0], b[0], t), lerp(a[1], b[1], t)];

// posiciones de llegada
const AT_CRADLE = {x: 1004, y: 1372, s: 1.0};
const AT_WINDOW = {x: 984, y: 1338, s: 0.95};
export const SEAT = {x: 330, y: 1310, s: 0.95};
const SILL_SPOT: V2 = [820, 1030];

// mano que sostiene las tijeras (mundo) 192–232; null si no las tiene
export const scissorsHand = (f: number): V2 | null => {
	if (f < EV.scissorsLift || f >= EV.tock) return null;
	const chest: V2 = [930, 1130];
	const up: V2 = [838, 880];
	const place: V2 = [SILL_SPOT[0] + 4, SILL_SPOT[1] - 34];
	if (f < EV.scissorsOpen) {
		const u = clamp((f - EV.scissorsLift) / (EV.scissorsOpen - 2 - EV.scissorsLift));
		const e = E.out(u);
		return [lerp(chest[0], up[0], e), lerp(chest[1], up[1], e) - 10 * Math.sin(u * Math.PI)];
	}
	// mantiene las tijeras arriba un instante y las baja a la repisa
	const u = clamp((f - (EV.scissorsOpen + 7)) / (EV.tock - EV.scissorsOpen - 7));
	const e = E.inOut(u);
	return [lerp(up[0], place[0], e), lerp(up[1], place[1], e) + 6 * Math.sin(u * Math.PI)];
};

export const abuelaPose = (f: number): AbuelaPose | null => {
	if (f < 66) return null;
	const t = f / FPS;
	// A · entra y camina dos pasos hasta la cuna
	if (f < 132) {
		const u = walkU(f, 66, 132);
		const ph = u * 2;
		return {
			x: lerp(1090, AT_CRADLE.x, E.out(u)),
			y: lerp(1800, AT_CRADLE.y, u),
			s: lerp(1.46, AT_CRADLE.s, u),
			walk: ph,
			bob: bobOf(ph),
			lean: 0.05,
		};
	}
	// B · empuja la cuna (anticipación hacia atrás, empuje, la mano viaja con el borde, regresa)
	if (f < 164) {
		const lean = 0.05 - 0.05 * seg(f, 128, 135) + 0.16 * seg(f, 135, 141) - 0.12 * seg(f, 146, 160);
		const reach = seg(f, 129, 137) * (1 - seg(f, 147, 158));
		const rim = cradleRim(Math.max(f, EV.push - 2), 1);
		const rest: V2 = [AT_CRADLE.x - 40, AT_CRADLE.y - 280];
		return {...AT_CRADLE, lean, arm: reach > 0.02 ? mixV(rest, [rim[0] + 6, rim[1] + 4], reach) : null};
	}
	// C · un paso hacia la ventana
	if (f < EV.scissorsLift) {
		const u = walkU(f, 164, 188);
		const ph = 2 + u;
		return {x: lerp(AT_CRADLE.x, AT_WINDOW.x, u), y: lerp(AT_CRADLE.y, AT_WINDOW.y, u), s: lerp(AT_CRADLE.s, AT_WINDOW.s, u), walk: u < 1 ? ph : null, bob: bobOf(ph), lean: 0.03};
	}
	// D · tijeras
	if (f < 232) {
		const hand = scissorsHand(f);
		const rel = seg(f, EV.tock, 232);
		const lean = 0.03 + 0.06 * seg(f, 214, 226) - 0.06 * rel;
		return {...AT_WINDOW, lean, arm: hand ?? mixV([SILL_SPOT[0] + 6, SILL_SPOT[1] - 40], [AT_WINDOW.x - 30, AT_WINDOW.y - 260], rel)};
	}
	// E · cruza a la silla y se sienta de perfil
	if (f < 268) {
		const u = walkU(f, 232, 258);
		const ph = 3 + u * 3;
		const sit = seg(f, 250, 266);
		return {
			x: lerp(AT_WINDOW.x, SEAT.x, u),
			y: lerp(AT_WINDOW.y, SEAT.y, u),
			s: lerp(AT_WINDOW.s, SEAT.s, u),
			walk: u < 1 ? ph : null,
			bob: bobOf(ph) * (1 - sit),
			seated: sit,
			lean: lerp(0.04, 0.1, sit),
		};
	}
	// F · sentada: mano en el mecate; cabeceos al dormitar; despierta
	const breath = Math.sin((2 * Math.PI * t) / 3.4) * 3;
	const [n1, n2, n3] = EV.nods;
	let head = 0;
	if (f >= n1) head = 0.17 * Math.max(0, 1 - (f - n1) / 12) * clamp((f - n1) / 3);
	if (f >= n2) head = 0.31 * Math.max(0, 1 - (f - n2) / 18) * clamp((f - n2) / 5);
	if (f >= n3) head = 0.44 * E.out(clamp((f - n3) / 10));
	const slide = ramp(f, EV.handSlide, [0, 1], E.in);
	const reach = seg(f, 266, 282);
	const hand = ropeHand(f);
	const lap: V2 = [SEAT.x + 120, SEAT.y - 175];
	const onRope = mixV(lap, hand, reach);
	if (f < EV.gasp)
		return {...SEAT, seated: 1, head, lean: 0.1 - 0.03 * clamp((f - n3) / 20), bob: f > n3 ? breath : 0, arm: slide < 1 ? mixV(onRope, lap, slide) : lap};
	// despierta y se lanza al espejo
	const up = seg(f, EV.gasp + 2, EV.fill[1]);
	return {x: lerp(SEAT.x, 540, up), y: lerp(SEAT.y, 2300, up), s: lerp(SEAT.s, 3.8, E.in(up)), seated: 1 - up, head: lerp(0.44, -0.1, clamp((f - EV.gasp) / 3)), lean: -0.1};
};

// madre dormida junto a la cuna al amanecer (mano en el borde)
export const abuelaDawn = (f: number): AbuelaPose => ({...SEAT, seated: 1, head: 0.35, bob: Math.sin((2 * Math.PI * f) / FPS / 3.4) * 3, arm: [520, 1090]});

// pose usada por la simulación del rebozo (incluye el amanecer)
export const poseAt = (f: number): AbuelaPose | null => (f >= EV.rehang ? abuelaDawn(f) : abuelaPose(f));

// trayectorias de los orbes del pueblo (Catmull-Rom simple por claves) con vaivén de 0.7 Hz
type K = [number, number, number]; // frame, x, y
const path = (keys: K[], f: number): V2 => {
	if (f <= keys[0][0]) return [keys[0][1], keys[0][2]];
	for (let i = 0; i < keys.length - 1; i++) {
		const [f0, x0, y0] = keys[i];
		const [f1, x1, y1] = keys[i + 1];
		if (f <= f1) {
			const u = E.inOut((f - f0) / (f1 - f0));
			return [lerp(x0, x1, u), lerp(y0, y1, u) + 6 * Math.sin(2 * Math.PI * 0.7 * (f / FPS))];
		}
	}
	const l = keys[keys.length - 1];
	return [l[1], l[2]];
};
export const ORB_PATHS: K[][] = [
	[
		[EV.ignite, HUT.x, HUT.y - HUT.h - 4],
		[435, 700, 610],
		[470, 600, 880],
		[EV.dip, 640, ridgeNear(640) + 60],
	],
	[
		[EV.orb2, 330, 770],
		[470, 470, 860],
		[EV.dip, 600, ridgeNear(600) + 60],
	],
	[
		[EV.orb3, 975, 780],
		[480, 820, 870],
		[EV.dip, 700, ridgeNear(700) + 60],
	],
];
export const orbPos = (i: number, f: number) => path(ORB_PATHS[i], f);
