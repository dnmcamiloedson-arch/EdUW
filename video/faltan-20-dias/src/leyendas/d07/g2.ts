// Día 7 · G2 (480–780): la sombra que se transforma en las tres vueltas (5 claves con la misma topología, escalonadas
// con las orejas primero), vórtice y lluvia de pétalos, la caña que resbala (3 rebotes), el sombrero que cae desde
// arriba de la cortina, rebota, rueda de canto y se asienta como moneda, y el huarache que asoma del montón.
import {E, FPS, clamp, hash, lerp} from '../../lib/util';
import type {Ctx} from '../kit/paint';
import {card, lightAt, ribbon, type Caster} from './light';
import {rigS} from './fermin';
import {STOP_X, STOP_Z} from './gait';
import {P, pxPerM, seg, type V2, type V3} from './world';

type Drawer = (box: [number, number, number, number], blur: number, shade: {color: string; a: number}, fn: (q: Ctx) => void) => void;
const add = (a: V3, b: V3, k = 1): V3 => [a[0] + b[0] * k, a[1] + b[1] * k, a[2] + b[2] * k];
const sub = (a: V3, b: V3): V3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const nrm = (a: V3): V3 => {
	const m = Math.hypot(a[0], a[1], a[2]) || 1;
	return [a[0] / m, a[1] / m, a[2] / m];
};
const dot = (a: V3, b: V3) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const cross = (a: V3, b: V3): V3 => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const pr = (p: V3): V2 => P(p[0], p[1], p[2]);
const sm = (u: number) => u * u * (3 - 2 * u);
const CAM: V3 = [0, 0.75, 0];

// ================================================================ claves de la sombra (30 puntos, misma semántica)
// 0 talón trasero · 1 corva · 2 anca · 3–6 cola (base, medio, punta, vuelta) · 7 grupa · 8 lomo · 9 cruz · 10 nuca ·
// 11 cráneo · 12–16 orejas (base, punta, muesca, punta, base) · 17 frente · 18 punta del hocico · 19 quijada ·
// 20 garganta · 21 pecho/brazo · 22 mano/antebrazo · 23–24 pata delantera (suelo) · 25 detrás del brazo ·
// 26 vientre · 27 ingle · 28 pierna trasera (frente) · 29 pie trasero (suelo). Metros; mira a +x; origen en el piso.
type Key = V2[];
const K_HUMAN: Key = [
	[-0.15, 0], [-0.14, 0.36], [-0.31, 0.7], [-0.3, 0.8], [-0.28, 0.92], [-0.27, 1.03], [-0.26, 1.12], [-0.24, 1.24],
	[-0.21, 1.37], [-0.08, 1.45], [-0.1, 1.53], [-0.1, 1.62], [-0.09, 1.69], [-0.14, 1.87], [0.0, 1.73], [0.13, 1.87],
	[0.09, 1.69], [0.1, 1.61], [0.085, 1.52], [0.07, 1.46], [0.21, 1.37], [0.25, 1.12], [0.31, 0.7], [0.21, 0],
	[0.08, 0], [0.05, 0.32], [0.035, 0.56], [-0.035, 0.56], [-0.05, 0.32], [-0.06, 0],
];
const K_HUNCH: Key = [
	[-0.17, 0], [-0.22, 0.34], [-0.34, 0.62], [-0.36, 0.7], [-0.4, 0.66], [-0.42, 0.6], [-0.36, 0.72], [-0.32, 0.95],
	[-0.17, 1.2], [0.04, 1.3], [0.17, 1.31], [0.21, 1.39], [0.22, 1.47], [0.19, 1.66], [0.28, 1.5], [0.37, 1.64],
	[0.34, 1.46], [0.43, 1.37], [0.52, 1.3], [0.39, 1.24], [0.29, 1.19], [0.3, 1.04], [0.35, 0.74], [0.3, 0.7],
	[0.25, 0.72], [0.22, 0.95], [0.27, 0.6], [0.04, 0.46], [-0.02, 0.45], [-0.05, 0],
];
const K_ARCH: Key = [
	[-0.3, 0], [-0.33, 0.28], [-0.42, 0.55], [-0.45, 0.72], [-0.66, 0.62], [-0.76, 0.42], [-0.6, 0.56], [-0.4, 0.86],
	[-0.15, 1.06], [0.12, 1.04], [0.25, 0.98], [0.3, 1.03], [0.31, 1.12], [0.29, 1.29], [0.37, 1.15], [0.45, 1.27],
	[0.43, 1.1], [0.53, 1.0], [0.63, 0.92], [0.49, 0.88], [0.37, 0.82], [0.33, 0.6], [0.37, 0.28], [0.43, 0],
	[0.31, 0], [0.25, 0.34], [0.02, 0.6], [-0.15, 0.55], [-0.2, 0.3], [-0.19, 0],
];
const K_HALF: Key = [
	[-0.31, 0], [-0.32, 0.26], [-0.41, 0.5], [-0.44, 0.64], [-0.66, 0.52], [-0.73, 0.3], [-0.58, 0.42], [-0.38, 0.72],
	[-0.08, 0.8], [0.2, 0.8], [0.32, 0.8], [0.37, 0.86], [0.37, 0.95], [0.35, 1.1], [0.43, 0.97], [0.5, 1.09],
	[0.49, 0.93], [0.58, 0.84], [0.69, 0.76], [0.55, 0.71], [0.42, 0.66], [0.34, 0.47], [0.34, 0.22], [0.39, 0],
	[0.28, 0], [0.25, 0.3], [0.04, 0.44], [-0.15, 0.42], [-0.19, 0.26], [-0.2, 0],
];
const K_COY: Key = [
	[-0.3, 0], [-0.3, 0.25], [-0.38, 0.47], [-0.41, 0.55], [-0.62, 0.42], [-0.69, 0.2], [-0.55, 0.32], [-0.36, 0.58],
	[-0.05, 0.6], [0.2, 0.63], [0.31, 0.66], [0.37, 0.72], [0.38, 0.8], [0.37, 0.93], [0.43, 0.82], [0.49, 0.92],
	[0.47, 0.78], [0.53, 0.74], [0.68, 0.64], [0.55, 0.6], [0.42, 0.55], [0.33, 0.4], [0.32, 0.2], [0.37, 0],
	[0.27, 0], [0.24, 0.3], [0.05, 0.36], [-0.15, 0.36], [-0.18, 0.25], [-0.2, 0],
];
const KEYS = [K_HUMAN, K_HUNCH, K_ARCH, K_HALF, K_COY];
const KEY_F = [500, 531, 566, 588, 606]; // llega a cada clave
// escalonado: la cabeza/orejas (10–20) se adelantan; patas y cola llegan tarde
const lead = (i: number) => (i >= 10 && i <= 20 ? 0.32 : i >= 3 && i <= 6 ? -0.18 : i >= 21 || i <= 1 ? -0.08 : 0);
const keyAt = (f: number): V2[] => {
	const out: V2[] = [];
	for (let i = 0; i < 30; i++) {
		// tiempo «efectivo» del punto, adelantado según su grupo
		let k = 0;
		let u = 0;
		const ld = lead(i);
		for (let j = 0; j < KEY_F.length - 1; j++) {
			const a = KEY_F[j];
			const b = KEY_F[j + 1];
			const span = b - a;
			const ff = f + ld * span;
			if (ff <= a && j === 0) {
				k = 0;
				u = 0;
				break;
			}
			if (ff < b || j === KEY_F.length - 2) {
				k = j;
				u = clamp((ff - a) / span);
				break;
			}
		}
		const e = sm(u);
		const A = KEYS[k][i];
		const B = KEYS[k + 1][i];
		out.push([lerp(A[0], B[0], e), lerp(A[1], B[1], e)]);
	}
	return out;
};
// Catmull-Rom cerrado; los puntos de apoyo (suelo) quedan en esquina
const SHARP = new Set([0, 23, 24, 29]);
const smoothClosed = (pts: V2[], n = 4): V2[] => {
	const out: V2[] = [];
	const N = pts.length;
	for (let i = 0; i < N; i++) {
		const p0 = pts[(i - 1 + N) % N];
		const p1 = pts[i];
		const p2 = pts[(i + 1) % N];
		const p3 = pts[(i + 2) % N];
		const sharp = SHARP.has(i) || SHARP.has((i + 1) % N);
		for (let k = 0; k < n; k++) {
			const t = k / n;
			if (sharp) {
				out.push([lerp(p1[0], p2[0], t), lerp(p1[1], p2[1], t)]);
				continue;
			}
			const t2 = t * t;
			const t3 = t2 * t;
			const q = (a: number, b: number, c: number, d: number) => 0.5 * (2 * b + (-a + c) * t + (2 * a - 5 * b + 4 * c - d) * t2 + (-a + 3 * b - 3 * c + d) * t3);
			out.push([q(p0[0], p1[0], p2[0], p3[0]), q(p0[1], p1[1], p2[1], p3[1])]);
		}
	}
	return out;
};
// la sombra de las vueltas: la parte baja se ensancha y angosta con el giro (|cos|) mientras aún es humana; respira;
// 606–621 se hunde en el montón; los ojos vuelven a prenderse en la clave del coyote (596).
export const morphShadow = (f: number, spin: number): {caster: Caster; eyes: V3[]; alpha: number} => {
	const raw = keyAt(f);
	const human = 1 - seg(f, 520, 575);
	const wob = 1 + 0.16 * human * Math.cos(2 * spin) * seg(f, 486, 500);
	const sink = E.in(seg(f, 606, 622));
	const breathe = 1 + 0.015 * Math.sin(2 * Math.PI * 0.4 * (f / FPS));
	// la bestia sube al muro: los puntos bajo y≈0.95 caerían al piso, así que la clave se escala y se eleva hasta que
	// sus patas quedan en la base del muro (dispositivo de sombra: la sombra no miente)
	const beast = sm(seg(f, 504, 592));
	const sc = lerp(1, 0.72, beast);
	const yOff = lerp(0, 0.93, beast) * (1 - sink);
	const shaped = raw.map(([x, y]): V2 => {
		const low = clamp(1 - y / 1.25);
		return [x * lerp(1, wob, low) * breathe * sc, y * breathe * sc * (1 - 0.82 * sink) + yOff];
	});
	const pts = smoothClosed(shaped, 4);
	const alpha = 1 - seg(f, 614, 626);
	const eyeOn = E.out(seg(f, 594, 602)) * (1 - seg(f, 608, 618));
	const eyes: V3[] = eyeOn > 0 ? card([[0.505 * sc * breathe, 0.735 * sc * breathe * (1 - 0.82 * sink) + yOff], [0.555 * sc * breathe, 0.725 * sc * breathe * (1 - 0.82 * sink) + yOff]], STOP_X, 0, STOP_Z, 1, 1) : [];
	return {caster: {pts: card(pts, STOP_X, 0, STOP_Z, 1, 1), alpha, soft: 1}, eyes, alpha: eyeOn};
};

// ================================================================ pétalos: vórtice (486–606) y lluvia (606–650)
const NP = 64;
type Petal = {a0: number; r0: number; h0: number; sz: number; col: number; spinR: number; ph: number; land: V2};
const PET: Petal[] = Array.from({length: NP}, (_, i) => {
	const a0 = hash(i, 11) * Math.PI * 2;
	const r0 = 0.32 + 0.55 * hash(i, 12);
	return {
		a0,
		r0,
		h0: hash(i, 13),
		sz: 0.016 + 0.012 * hash(i, 14),
		col: hash(i, 15),
		spinR: 4 + 8 * hash(i, 16),
		ph: hash(i, 17) * 6.28,
		land: [STOP_X + Math.cos(a0 + 1.2) * (0.5 + 0.7 * hash(i, 18)), STOP_Z + Math.sin(a0 + 1.2) * (0.25 + 0.45 * hash(i, 19))],
	};
});
const petalPos = (p: Petal, f: number, spin: number): {pos: V3; tum: number; a: number} | null => {
	if (f < 486) return null;
	const t = (f - 486) / FPS;
	const lift = sm(seg(f, 486 + p.h0 * 40, 540 + p.h0 * 40));
	const ang = p.a0 + spin * (0.55 + 0.35 * p.h0) * lift + t * 0.6;
	// entran con el remolino desde afuera (no aparecen de golpe)
	const r = lerp(p.r0 + 0.9, 0.34 + 0.28 * p.h0, lift) * (1 + 0.25 * seg(f, 560, 606));
	const y = lerp(0.3 + 0.5 * p.h0, 0.15 + 1.05 * p.h0 * (0.6 + 0.4 * seg(f, 540, 606)), lift) + 0.05 * Math.sin(t * 5 + p.ph) * lift;
	let pos: V3 = [STOP_X + Math.cos(ang) * r, y, STOP_Z + Math.sin(ang) * r * 0.9];
	if (f >= 606) {
		// suelta: sale tangente y cae revoloteando hasta su lugar en el piso
		const u = seg(f, 606, 640 + p.h0 * 22);
		const e = E.out(u);
		const land: V3 = [p.land[0], 0.004, p.land[1]];
		const fl = 0.04 * Math.sin((f - 606) * 0.35 + p.ph) * (1 - u);
		pos = [lerp(pos[0], land[0], e) + fl, lerp(pos[1], land[1], E.in(u) * 0.6 + e * 0.4), lerp(pos[2], land[2], e)];
	}
	return {pos, tum: (t * p.spinR + p.ph) % (Math.PI * 2), a: clamp(lift * 2.5)};
};
const PCOL = ['#F26D3D', '#F5C242', '#E8892F', '#F2A23A'];
export const drawPetals = (g: Ctx, f: number, spin: number, L: V3, I: number, side: 1 | -1) => {
	if (f < 486 || f >= 1020) return;
	g.save();
	for (let i = 0; i < NP; i++) {
		const p = PET[i];
		const st = petalPos(p, f, spin);
		if (!st) continue;
		const behind = st.pos[2] > STOP_Z;
		if ((side === 1) !== behind) continue;
		const s = pxPerM(st.pos[2]);
		const [px, py] = pr(st.pos);
		const lit = lightAt(L, I, st.pos, [0, 1, 0]);
		const flat = st.pos[1] < 0.01;
		const k = clamp(0.35 + 0.9 * lit);
		g.fillStyle = PCOL[Math.floor(p.col * 4)];
		if (st.a <= 0.01) continue;
		g.globalAlpha = (flat ? 0.85 : 0.95) * st.a;
		g.beginPath();
		// pétalo: lágrima alargada que da vueltas (nunca un disco)
		const rx = p.sz * s * 0.8;
		const ry = flat ? rx * 0.28 : rx * (0.18 + 0.32 * Math.abs(Math.cos(st.tum)));
		const ca = Math.cos(st.tum * 0.7 + p.ph);
		const sa = Math.sin(st.tum * 0.7 + p.ph);
		const E2 = (u: number, v: number): [number, number] => [px + u * ca - v * sa, py + u * sa + v * ca];
		const a0 = E2(-rx, 0);
		const a1 = E2(rx, 0);
		const c0 = E2(0, -ry * 1.3);
		const c1 = E2(0, ry * 1.3);
		g.moveTo(a0[0], a0[1]);
		g.quadraticCurveTo(c0[0], c0[1], a1[0], a1[1]);
		g.quadraticCurveTo(c1[0], c1[1], a0[0], a0[1]);
		g.fill();
		if (k < 1) {
			g.globalAlpha = (1 - k) * 0.8;
			g.fillStyle = '#1A1310';
			g.fill();
		}
	}
	g.restore();
};

// ================================================================ la caña: resbala a 510, cae y rebota 3 veces
// péndulo invertido sobre la punta (precalculado), azimut hacia la cámara-derecha
type CaneSt = {tip: V3; top: V3};
const CANE_LEN = 0.86;
const caneTab: CaneSt[] = [];
const buildCane = () => {
	const R = rigS(510);
	const tip: V3 = [R.caneTip[0], 0, R.caneTip[2]];
	const d0 = nrm(sub(R.hand, tip));
	const az = nrm([0.92, 0, -0.38]);
	// ángulo desde la vertical en el plano del azimut
	let phi = Math.acos(clamp(d0[1], -1, 1)) * 0.6 + 0.08;
	let w = 0.6;
	const dt = 1 / FPS / 4;
	const k = (3 * 9.8) / (2 * CANE_LEN);
	let bounces = 0;
	let slide = 0;
	for (let fi = 0; fi < 60; fi++) {
		for (let s = 0; s < 4; s++) {
			w += k * Math.sin(phi) * dt;
			phi += w * dt;
			if (phi >= Math.PI / 2 - 0.02) {
				phi = Math.PI / 2 - 0.02;
				if (bounces < 3 && w > 0.4) {
					w = -w * [0.34, 0.3, 0.25][bounces];
					bounces++;
				} else w = 0;
			}
			slide += Math.max(0, w) * 0.0006;
		}
		const t2: V3 = add(tip, az, -slide);
		caneTab.push({tip: t2, top: add(t2, [az[0] * Math.sin(phi), Math.cos(phi), az[2] * Math.sin(phi)], CANE_LEN)});
	}
};
const caneAt = (f: number): CaneSt | null => {
	if (f < 510 || f >= 1020) return null;
	if (!caneTab.length) buildCane();
	const st = caneTab[Math.min(caneTab.length - 1, f - 510)];
	return st;
};
export const caneShadow = (f: number, L: V3): Caster | null => {
	const c = caneAt(f);
	if (!c) return null;
	return {pts: [], more: [ribbon(L, [add(c.tip, [0, 0.012, 0]), add(c.top, [0, 0.014, 0])], [0.012, 0.016])]};
};
export const caneZ = (f: number) => {
	const c = caneAt(f);
	return c ? (c.tip[2] + c.top[2]) / 2 : 2;
};
export const drawCane = (g: Ctx, f: number, L: V3, I: number, blur: number, draw: Drawer) => {
	const c = caneAt(f);
	if (!c) return;
	const a = pr([c.tip[0], c.tip[1] + 0.012, c.tip[2]]);
	const b = pr([c.top[0], c.top[1] + 0.015, c.top[2]]);
	const s = pxPerM((c.tip[2] + c.top[2]) / 2);
	const lit = clamp(lightAt(L, I, add(c.tip, sub(c.top, c.tip), 0.5), [0, 1, 0]));
	const x0 = Math.min(a[0], b[0]) - 0.06 * s;
	const y0 = Math.min(a[1], b[1]) - 0.06 * s;
	draw([x0, y0, Math.abs(a[0] - b[0]) + 0.12 * s, Math.abs(a[1] - b[1]) + 0.12 * s], blur, {color: '#0E1A1A', a: clamp(0.55 - lit * 0.5)}, (q) => {
		const dx = b[0] - a[0];
		const dy = b[1] - a[1];
		const len = Math.hypot(dx, dy) || 1;
		const nx = -dy / len;
		const ny = dx / len;
		// sombra de contacto
		q.strokeStyle = 'rgba(10,6,3,0.45)';
		q.lineCap = 'round';
		q.lineWidth = 0.03 * s;
		q.beginPath();
		q.moveTo(a[0], a[1] + 0.008 * s);
		q.lineTo(b[0], b[1] + 0.008 * s);
		q.stroke();
		// mezquite nudoso: cuerpo con grosor variable y nudos
		const N = 14;
		const L1: V2[] = [];
		const L2: V2[] = [];
		for (let i = 0; i <= N; i++) {
			const u = i / N;
			const knot = Math.exp(-Math.pow((u - 0.33) / 0.03, 2)) * 0.5 + Math.exp(-Math.pow((u - 0.71) / 0.03, 2)) * 0.4;
			const wv = 0.006 * Math.sin(u * 19 + 1.3);
			const hw = (0.011 + 0.004 * u + 0.006 * knot) * s;
			const cx = a[0] + dx * u + nx * wv * s;
			const cy = a[1] + dy * u + ny * wv * s;
			L1.push([cx + nx * hw, cy + ny * hw]);
			L2.push([cx - nx * hw, cy - ny * hw]);
		}
		const body = () => {
			q.beginPath();
			L1.forEach((p, i) => (i ? q.lineTo(p[0], p[1]) : q.moveTo(p[0], p[1])));
			for (let i = L2.length - 1; i >= 0; i--) q.lineTo(L2[i][0], L2[i][1]);
			q.closePath();
		};
		body();
		q.fillStyle = `rgb(${46 + 40 * lit | 0},${28 + 24 * lit | 0},${14 + 10 * lit | 0})`;
		q.fill();
		// brillo del lado del foco (arriba) y veta
		q.save();
		body();
		q.clip();
		q.strokeStyle = `rgba(214,150,90,${0.25 + 0.5 * lit})`;
		q.lineWidth = Math.max(1, 0.005 * s);
		q.beginPath();
		L1.forEach((p, i) => (i ? q.lineTo(p[0] - nx * 0.004 * s, p[1] - ny * 0.004 * s) : q.moveTo(p[0], p[1])));
		q.stroke();
		q.strokeStyle = 'rgba(20,10,4,0.5)';
		q.lineWidth = 1;
		for (let j = 0; j < 3; j++) {
			q.beginPath();
			for (let i = 0; i <= N; i++) {
				const u = i / N;
				const o = (j - 1) * 0.004 * s + Math.sin(u * 23 + j) * 0.0015 * s;
				const px = a[0] + dx * u + nx * o;
				const py = a[1] + dy * u + ny * o;
				if (i) q.lineTo(px, py);
				else q.moveTo(px, py);
			}
			q.stroke();
		}
		q.restore();
	});
};

// ================================================================ el sombrero: cae (552), rebota, rueda de canto, se asienta
type HatSt = {c: V3; n: V3; psi: number};
const hatTab: HatSt[] = [];
const ROLL_DIR = nrm([0.48, 0, -0.88]);
const HAT_END: V3 = [0.27, 0, 1.44];
const tilted = (beta: number, alpha: number): V3 => [Math.sin(beta) * Math.cos(alpha), Math.cos(beta), Math.sin(beta) * Math.sin(alpha)];
const buildHat = () => {
	const R = rigS(552);
	const start: V3 = add(R.head, [0, 0.12, 0]);
	const landP: V3 = [0.02, 0, 1.95];
	const rollEnd: V3 = add(HAT_END, ROLL_DIR, -0.06);
	// el ala queda vertical, perpendicular a la dirección de rodada: normal horizontal ⟂ ROLL_DIR
	const alphaRoll = Math.atan2(-ROLL_DIR[0], ROLL_DIR[2]);
	for (let f = 552; f <= 640; f++) {
		let c: V3;
		let beta: number;
		let alpha = alphaRoll;
		let psi = 0;
		if (f < 570) {
			const u = (f - 552) / 18;
			c = [lerp(start[0], landP[0], u), start[1] + (0.24 - start[1]) * u * u, lerp(start[2], landP[2], u)];
			beta = lerp(0.25, Math.PI / 2 + 0.5, u); // da una voltereta y pega de canto
			psi = u * 2;
		} else if (f < 580) {
			const u = (f - 570) / 10;
			c = add(landP, ROLL_DIR, 0.05 * u);
			c[1] = 0.24 + 0.06 * Math.sin(Math.PI * u);
			beta = Math.PI / 2 + 0.5 * (1 - u) * Math.cos(u * 9);
			psi = 2 + u * 0.8;
		} else if (f < 598) {
			const u = (f - 580) / 18;
			const e = 1 - (1 - u) * (1 - u) * 0.6 - 0.4 * (1 - u);
			const p0 = add(landP, ROLL_DIR, 0.05);
			c = [lerp(p0[0], rollEnd[0], e), 0.24, lerp(p0[2], rollEnd[2], e)];
			beta = Math.PI / 2 - 0.16 * u; // se va inclinando como moneda
			alpha = alphaRoll + 0.25 * u;
			psi = 2.8 + (Math.hypot(rollEnd[0] - p0[0], rollEnd[2] - p0[2]) * e) / 0.24;
		} else {
			// se asienta: la inclinación cae a 0 con precesión que acelera (moneda de Euler) y un rebotito final
			const u = clamp((f - 598) / 22);
			const e = 1 - Math.pow(1 - u, 2.2);
			beta = (Math.PI / 2 - 0.16) * (1 - e);
			alpha = alphaRoll + 0.25 + 9 * u * u;
			c = add(rollEnd, ROLL_DIR, 0.06 * e);
			// el centro baja: altura del centro del ala = r·sen(β)
			c[1] = 0.24 * Math.sin(beta) + 0.012 + (f >= 620 && f < 626 ? 0.01 * Math.sin(Math.PI * seg(f, 620, 626)) : 0);
			psi = 4.6 + 0.5 * e;
		}
		if (f >= 580 && f < 598) c[1] = 0.24 * Math.sin(beta) + 0.01;
		hatTab.push({c, n: tilted(beta, alpha), psi});
	}
};
const hatAt = (f: number): HatSt | null => {
	if (f < 552 || f >= 1020) return null;
	if (!hatTab.length) buildHat();
	return hatTab[Math.min(hatTab.length - 1, f - 552)];
};
export const hatZ = (f: number) => hatAt(f)?.c[2] ?? 1.5;
const basis = (n: V3): [V3, V3] => {
	const a: V3 = Math.abs(n[1]) < 0.9 ? [0, 1, 0] : [1, 0, 0];
	const u = nrm(cross(a, n));
	return [u, cross(n, u)];
};
const circle = (c: V3, n: V3, r: number, N = 28, psi = 0): V3[] => {
	const [u, v] = basis(n);
	const out: V3[] = [];
	for (let i = 0; i < N; i++) {
		const a = (i / N) * Math.PI * 2 + psi;
		out.push(add(add(c, u, Math.cos(a) * r), v, Math.sin(a) * r));
	}
	return out;
};
const BRIM_R = 0.24;
export const hatShadow = (f: number): Caster | null => {
	const h = hatAt(f);
	if (!h) return null;
	const pts = circle(h.c, h.n, BRIM_R, 16);
	const crown = circle(add(h.c, h.n, 0.13), h.n, 0.085, 10);
	return {pts: [], hulls: [[...pts, ...crown]]};
};
const hull2 = (pts: V2[]): V2[] => {
	const p = [...pts].sort((a, b) => a[0] - b[0] || a[1] - b[1]);
	const cr = (o: V2, a: V2, b: V2) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
	const lo: V2[] = [];
	for (const q of p) {
		while (lo.length >= 2 && cr(lo[lo.length - 2], lo[lo.length - 1], q) <= 0) lo.pop();
		lo.push(q);
	}
	const up: V2[] = [];
	for (let i = p.length - 1; i >= 0; i--) {
		const q = p[i];
		while (up.length >= 2 && cr(up[up.length - 2], up[up.length - 1], q) <= 0) up.pop();
		up.push(q);
	}
	return lo.slice(0, -1).concat(up.slice(0, -1));
};
const poly = (q: Ctx, pts: V2[]) => {
	q.beginPath();
	pts.forEach((p, i) => (i ? q.lineTo(p[0], p[1]) : q.moveTo(p[0], p[1])));
	q.closePath();
};
const STRAW: [number, number, number] = [214, 180, 112];
const straw = (k: number, a = 1) => `rgba(${STRAW[0] * k | 0},${STRAW[1] * k | 0},${STRAW[2] * k | 0},${a})`;
export const drawHat = (g: Ctx, f: number, L: V3, I: number, blur: number, draw: Drawer) => {
	const h = hatAt(f);
	if (!h) return;
	const s = pxPerM(h.c[2]);
	const [px, py] = pr(h.c);
	const toL = nrm(sub(L, h.c));
	const toC = nrm(sub(CAM, h.c));
	const see = dot(h.n, toC); // >0 vemos la copa por arriba
	const amb = 0.32;
	const lamTop = clamp(dot(h.n, toL));
	const lamBot = clamp(-dot(h.n, toL));
	const lit = clamp(lightAt(L, I, h.c, [0, 1, 0]) * 1.2);
	draw([px - 0.36 * s, py - 0.4 * s, 0.72 * s, 0.62 * s], blur, {color: '#0E1A1A', a: 0}, (q) => {
		// sombra de contacto en el piso
		const gp = pr([h.c[0], 0, h.c[2]]);
		const flatK = 1 - clamp(h.c[1] / 0.25);
		q.fillStyle = `rgba(10,6,3,${0.35 + 0.25 * flatK})`;
		q.beginPath();
		q.ellipse(gp[0], gp[1], BRIM_R * s * (0.4 + 0.6 * flatK), 0.05 * s * (0.4 + 0.6 * flatK), 0, 0, Math.PI * 2);
		q.fill();
		const brim = circle(h.c, h.n, BRIM_R, 32, h.psi).map(pr);
		const base = circle(add(h.c, h.n, 0.005), h.n, 0.1, 20, h.psi);
		const top = circle(add(h.c, h.n, 0.125), h.n, 0.085, 20, h.psi);
		const dome = add(h.c, h.n, 0.15);
		const crownPts = hull2([...base.map(pr), ...top.map(pr), pr(dome)]);
		const kTop = amb + 0.85 * lamTop * lit;
		const kBot = (amb + 0.6 * lamBot * lit) * 0.7;
		const drawCrown = (kk: number) => {
			poly(q, crownPts);
			const cg = q.createLinearGradient(...pr(add(h.c, basis(h.n)[0], -0.1)), ...pr(add(h.c, basis(h.n)[0], 0.1)));
			cg.addColorStop(0, straw(kk * 1.08));
			cg.addColorStop(1, straw(kk * 0.7));
			q.fillStyle = cg;
			q.fill();
			// toquilla (cinta) terracota cerca del ala: solo las caras de la banda que miran a la cámara
			const b3 = circle(add(h.c, h.n, 0.03), h.n, 0.099, 20, h.psi);
			const b4 = circle(add(h.c, h.n, 0.055), h.n, 0.096, 20, h.psi);
			q.save();
			poly(q, crownPts);
			q.clip();
			q.fillStyle = `rgba(${120 * kk | 0},${40 * kk | 0},${24 * kk | 0},0.9)`;
			for (let i = 0; i < 20; i++) {
				const j = (i + 1) % 20;
				const mid: V3 = [(b3[i][0] + b3[j][0]) / 2, (b3[i][1] + b3[j][1]) / 2, (b3[i][2] + b3[j][2]) / 2];
				const out = nrm(sub(mid, add(h.c, h.n, 0.03)));
				if (dot(out, nrm(sub(CAM, mid))) <= 0) continue;
				poly(q, [pr(b3[i]), pr(b3[j]), pr(b4[j]), pr(b4[i])]);
				q.fill();
			}
			q.restore();
		};
		const drawBrim = (kk: number, under: boolean) => {
			poly(q, brim);
			q.fillStyle = straw(kk);
			q.fill();
			// tejido de palma: anillos concéntricos y puntadas radiales
			q.save();
			poly(q, brim);
			q.clip();
			q.lineWidth = Math.max(0.8, 0.0035 * s);
			for (let r = 0.11; r < BRIM_R; r += 0.022) {
				q.strokeStyle = straw(kk * (0.78 + 0.1 * Math.sin(r * 90)), 0.55);
				poly(q, circle(h.c, h.n, r, 32, h.psi).map(pr));
				q.stroke();
			}
			q.strokeStyle = straw(kk * 0.65, 0.35);
			for (let i = 0; i < 24; i++) {
				const a = (i / 24) * Math.PI * 2 + h.psi;
				const [u, v] = basis(h.n);
				const d: V3 = add([0, 0, 0], add(u, v, 0), 0);
				void d;
				const p0 = pr(add(add(h.c, u, Math.cos(a) * 0.12), v, Math.sin(a) * 0.12));
				const p1 = pr(add(add(h.c, u, Math.cos(a) * BRIM_R), v, Math.sin(a) * BRIM_R));
				q.beginPath();
				q.moveTo(p0[0], p0[1]);
				q.lineTo(p1[0], p1[1]);
				q.stroke();
			}
			if (under) {
				// boca de la copa (oscura) vista desde abajo
				poly(q, base.map(pr));
				q.fillStyle = 'rgba(28,16,8,0.92)';
				q.fill();
			}
			q.restore();
			// borde del ala con canto
			poly(q, brim);
			q.strokeStyle = straw(kk * 0.6, 0.8);
			q.lineWidth = Math.max(1, 0.006 * s);
			q.stroke();
		};
		if (see >= 0) {
			drawBrim(kTop, false);
			drawCrown(kTop);
		} else {
			drawCrown(kBot);
			drawBrim(kBot, true);
		}
	});
};

// ================================================================ el huarache que asoma del montón (624–640)
export const drawHuarache = (g: Ctx, f: number, L: V3, I: number, blur: number, draw: Drawer) => {
	if (f < 624 || f >= 1020) return;
	const u = E.out(seg(f, 624, 642));
	const c: V3 = [lerp(STOP_X - 0.2, STOP_X - 0.5, u), 0.006, lerp(STOP_Z - 0.12, STOP_Z - 0.3, u)];
	const ang = lerp(0.4, -0.35, u);
	const s = pxPerM(c[2]);
	const [px, py] = pr(c);
	const lit = clamp(lightAt(L, I, c, [0, 1, 0]));
	draw([px - 0.2 * s, py - 0.08 * s, 0.4 * s, 0.16 * s], blur, {color: '#0E1A1A', a: clamp(0.5 - lit * 0.5)}, (q) => {
		const W = (a: number, l: number, h = 0): V2 => pr([c[0] + Math.cos(ang) * a - Math.sin(ang) * l, c[1] + h, c[2] + Math.sin(ang) * a + Math.cos(ang) * l]);
		const sole: V2[] = [];
		for (let i = 0; i < 18; i++) {
			const t = (i / 18) * Math.PI * 2;
			const a = Math.cos(t) * 0.125;
			const w = (Math.cos(t) > 0 ? 0.048 : 0.038) * Math.sin(t);
			sole.push(W(a, w));
		}
		// suela (canto)
		q.fillStyle = 'rgba(20,10,4,0.9)';
		poly(q, sole.map((p) => [p[0], p[1] + 0.008 * s] as V2));
		q.fill();
		q.fillStyle = `rgb(${70 + 70 * lit | 0},${40 + 42 * lit | 0},${20 + 22 * lit | 0})`;
		poly(q, sole);
		q.fill();
		// tiras tejidas
		q.strokeStyle = `rgb(${54 + 60 * lit | 0},${30 + 34 * lit | 0},${14 + 16 * lit | 0})`;
		q.lineWidth = Math.max(1, 0.01 * s);
		for (let k = 0; k < 5; k++) {
			const a = 0.03 + k * 0.02;
			const p0 = W(a, -0.04, 0.01);
			const p1 = W(a + 0.01, 0.04, 0.012);
			q.beginPath();
			q.moveTo(p0[0], p0[1]);
			q.quadraticCurveTo((p0[0] + p1[0]) / 2, (p0[1] + p1[1]) / 2 - 0.02 * s, p1[0], p1[1]);
			q.stroke();
		}
		const t0 = W(-0.07, -0.035, 0.01);
		const t1 = W(-0.07, 0.035, 0.01);
		q.beginPath();
		q.moveTo(t0[0], t0[1]);
		q.quadraticCurveTo((t0[0] + t1[0]) / 2, (t0[1] + t1[1]) / 2 - 0.03 * s, t1[0], t1[1]);
		q.stroke();
	});
};
void hash;
