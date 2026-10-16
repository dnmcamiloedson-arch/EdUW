// Día 7 · don Fermín (forma humana del nahual): solo del pecho para abajo (la cortina le corta la cabeza).
// ESQUELETO (etapa 1): camino, giro, alto, congelado, vueltas y colapso con siluetas simples; G1/G2 lo reemplazan
// por marcha ik2 con cojera 58/42, bastón plantado, mano arrugada, sarape simCloth + fleco y anillo de tiras.
import {C, E, FPS, clamp, lerp, rgba} from '../../lib/util';
import type {Ctx} from '../kit/paint';
import {card, lightAt, type Caster} from './light';
import {humanOutline, type Head} from './shapes';
import {P, pxPerM, seg, type V2, type V3} from './world';

type PK = {t: number; x: number; z: number};
// camino del tratamiento: sale de debajo del foco (0.3 s), diagonal a media calle (sx≈665 a 2.6 s), gira, camina
// a la izquierda muy despacio (anciano con bastón) y se detiene en sx≈352 a 10.6 s. G1 ajusta zancada a la velocidad.
const PATH: PK[] = [
	{t: 0, x: -0.62, z: 0.88},
	{t: 0.3, x: -0.61, z: 0.9},
	{t: 1.4, x: -0.25, z: 1.6},
	{t: 2.6, x: 0.18, z: 2.2},
	{t: 3.4, x: 0.16, z: 2.24},
	{t: 10.6, x: -0.3, z: 2.4},
];
export const STOP_X = -0.3;
export const STOP_Z = 2.4;
const pathAt = (t: number): [number, number] => {
	if (t <= PATH[0].t) return [PATH[0].x, PATH[0].z];
	for (let i = 0; i < PATH.length - 1; i++) {
		const a = PATH[i];
		const b = PATH[i + 1];
		if (t <= b.t) {
			const u = clamp((t - a.t) / (b.t - a.t));
			const e = i === 1 ? u * u : i === 3 ? E.out(u) : i === PATH.length - 2 ? 1 - (1 - u) * (1 - u) : u;
			return [lerp(a.x, b.x, e), lerp(a.z, b.z, e)];
		}
	}
	const l = PATH[PATH.length - 1];
	return [l.x, l.z];
};

export type FerminPose = {x: number; z: number; face: number; step: number; spin: number; gone: boolean; flare: number};
export const ferminPose = (f: number): FerminPose => {
	const t = f / FPS;
	const [x, z] = pathAt(Math.min(t, 10.6));
	// cara: a la derecha (se aleja en diagonal), gira a la izquierda 2.6–3.6 s
	let face = t < 2.6 ? 1 : t < 3.4 ? Math.cos(Math.PI * E.inOut(seg(t, 2.6, 3.4))) : -1;
	// fase de marcha: avanza con la distancia recorrida (se detiene a 10.6 s)
	let dist = 0;
	const N = Math.min(f, 318);
	for (let k = 6; k <= N; k += 6) {
		const a = pathAt((k - 6) / FPS);
		const b = pathAt(k / FPS);
		dist += Math.hypot(b[0] - a[0], b[1] - a[1]);
	}
	const step = (dist / 0.42) * Math.PI * 2;
	// tres vueltas 16.2–20.2 s (aceleran), luego el sarape cae vacío
	let spin = 0;
	let flare = 0;
	if (t >= 16.2) {
		const turns = t < 17.7 ? seg(t, 16.2, 17.7) : t < 19.0 ? 1 + seg(t, 17.7, 19.0) : 2 + seg(t, 19.0, 20.2);
		spin = Math.min(3, turns) * Math.PI * 2;
		const w = t < 17.7 ? 1 / 1.5 : t < 19 ? 1 / 1.3 : 1 / 1.2;
		flare = clamp(seg(t, 16.2, 16.8) * w * 1.3);
		face = Math.cos(spin) * -1;
	}
	return {x, z, face, step, spin, gone: f >= 606, flare};
};

const SARAPE_BANDS = [C.terracota, C.flama, C.verde, C.marfil, C.terracota, C.flama];

export const drawFermin = (g: Ctx, f: number, L: V3, I: number, blur: number, draw: (box: [number, number, number, number], blur: number, shade: {color: string; a: number}, fn: (q: Ctx) => void) => void) => {
	const p = ferminPose(f);
	if (p.gone) return;
	const s = pxPerM(p.z);
	const [fx, fy] = P(p.x, 0, p.z);
	const lit = lightAt(L, I, [p.x, 1.0, p.z], [0, 0, -1]);
	const box: [number, number, number, number] = [fx - 0.6 * s, fy - 1.45 * s, 1.2 * s, 1.5 * s];
	draw(box, blur, {color: '#0E1A1A', a: clamp(0.82 - lit * 0.75)}, (q) => {
		q.save();
		q.translate(fx, fy);
		q.scale(s, -s); // metros, y hacia arriba
		const face = p.face;
		const w = Math.max(0.25, Math.abs(face));
		const dir = face >= 0 ? 1 : -1;
		// piernas (calzón de manta)
		const a = Math.sin(p.step) * 0.11 * w;
		for (const [sgn, k] of [
			[1, 0.85],
			[-1, 1],
		] as const) {
			const sw = a * sgn * dir;
			q.fillStyle = k < 1 ? '#B9AE98' : '#DCD2BE';
			q.beginPath();
			q.moveTo(-0.08 * w + sw * 0.3, 0.86);
			q.lineTo(0.08 * w + sw * 0.3, 0.86);
			q.lineTo(0.06 * w + sw, 0.06);
			q.lineTo(-0.05 * w + sw, 0.06);
			q.closePath();
			q.fill();
			// huarache
			q.fillStyle = '#4A2C17';
			q.beginPath();
			q.ellipse(sw + 0.04 * dir * w, 0.03, 0.11 * w, 0.035, 0, 0, Math.PI * 2);
			q.fill();
		}
		// sarape (en las vueltas se abre como falda)
		const r0 = 0.22 + p.flare * 0.32;
		const yb = 0.86 - p.flare * 0.1;
		const bh = (1.4 - yb) / SARAPE_BANDS.length;
		for (let i = 0; i < SARAPE_BANDS.length; i++) {
			const y0 = 1.4 - i * bh;
			const y1 = y0 - bh;
			const ww0 = lerp(0.2, r0, (1.4 - y0) / (1.4 - yb)) * (0.75 + 0.25 * w);
			const ww1 = lerp(0.2, r0, (1.4 - y1) / (1.4 - yb)) * (0.75 + 0.25 * w);
			q.fillStyle = SARAPE_BANDS[(i + Math.floor(p.spin / 1.2)) % SARAPE_BANDS.length];
			q.beginPath();
			q.moveTo(-ww0, y0);
			q.lineTo(ww0, y0);
			q.lineTo(ww1, y1);
			q.lineTo(-ww1, y1);
			q.closePath();
			q.fill();
		}
		// fleco
		q.strokeStyle = rgba(C.marfil, 0.8);
		q.lineWidth = 0.008;
		for (let i = 0; i < 14; i++) {
			const u = -1 + (2 * i) / 13;
			const x0 = u * r0 * (0.75 + 0.25 * w);
			q.beginPath();
			q.moveTo(x0, yb);
			q.lineTo(x0 + Math.sin(f * 0.1 + i) * 0.01, yb - 0.07);
			q.stroke();
		}
		// mano y bastón de mezquite (hasta que se le cae a 17.0 s)
		if (f < 510) {
			const hx = 0.24 * dir * w;
			q.strokeStyle = '#5B3A1E';
			q.lineWidth = 0.028;
			q.lineCap = 'round';
			q.beginPath();
			q.moveTo(hx, 0.92);
			q.lineTo(hx + 0.07 * dir, 0.0);
			q.stroke();
			q.fillStyle = '#7A4A2C';
			q.beginPath();
			q.ellipse(hx, 0.9, 0.045, 0.055, 0, 0, Math.PI * 2);
			q.fill();
		}
		q.restore();
	});
};

// su sombra: contorno 96 pts en una tarjeta en su posición (retardo de 3 f desde 7.2 s lo agrega G1)
export const ferminCaster = (f: number, head: Head = 'hat'): Caster | null => {
	const p = ferminPose(f);
	if (p.gone) return null;
	const pts: V2[] = humanOutline(p.step, head);
	const w = p.spin > 0 ? Math.max(0.3, Math.abs(Math.cos(p.spin))) : Math.max(0.2, Math.abs(p.face));
	return {pts: card(pts.map(([u, v]) => [u * w, v] as V2), p.x, 0, p.z, p.face >= 0 ? 1 : -1)};
};
// la caña (sombra delgada)
export const caneCaster = (f: number): Caster | null => {
	if (f >= 510) return null;
	const p = ferminPose(f);
	const dir = p.face >= 0 ? 1 : -1;
	const hx = 0.24 * dir * Math.max(0.25, Math.abs(p.face));
	const pts: V2[] = [
		[hx - 0.012, 0.92],
		[hx + 0.012, 0.92],
		[hx + 0.07 * dir + 0.012, 0.0],
		[hx + 0.07 * dir - 0.012, 0.0],
	];
	return {pts: card(pts, p.x, 0, p.z)};
};
