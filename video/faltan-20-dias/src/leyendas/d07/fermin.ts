// Día 7 · don Fermín (forma humana del nahual): solo del pecho para abajo (la cortina le corta la cabeza).
// Pintado en 3D proyectado: piernas ik2 con pies plantados (gait.ts), calzón de manta enrollado, huaraches, sarape de
// 28 tiras con franjas y rombo de Saltillo (sombreado Lambert por tira, pliegues, fleco verlet), bastón de mezquite
// en la mano derecha con el puño arrugado. Su sombra se arma con los mismos huesos (cintas de cara al foco + envolvente
// del sarape + tarjeta de la cabeza con sombrero) y se proyecta desde el foco (light.ts).
import {C, E, FPS, clamp, hash, lerp, mixRGB} from '../../lib/util';
import type {Ctx} from '../kit/paint';
import {smoothPath} from '../kit/rig';
import {lightAt, mapCaster, ribbon, type Caster} from './light';
import {CANE_LEN, HIP_W, STOP_X, STOP_Z, STOP_T, fwdOf, leftOf, rigAt, windAt, type Rig} from './gait';
import {chainFrame, strand} from './sim';
import {HEAD_EYES, HEAD_HAT_FRONT, HEAD_HAT_PROFILE, mirrorU, morph, type Head} from './shapes';
import {BULB0, P, pxPerM, seg, type V2, type V3} from './world';

export {STOP_X, STOP_Z};

// ---------------------------------------------------------------- estado general (compatibilidad con G2/G3)
export type FerminPose = {x: number; z: number; face: number; step: number; spin: number; gone: boolean; flare: number};
// vueltas (G2): anticipación 476–486 (contragiro), luego 3 vueltas que aceleran con fin en 531 / 570 / 606.
// Hermite monótono en vueltas; el vuelo del sarape sigue ω² con 3 f de inercia.
const SPIN_K: [number, number, number][] = [
	[476, 0, 0],
	[481, -0.035, 0],
	[486, 0, 0.009],
	[531, 1, 0.0235],
	[570, 2, 0.0268],
	[606, 3, 0.0305],
];
export const turnsAt = (f: number) => {
	if (f <= SPIN_K[0][0]) return 0;
	const last = SPIN_K[SPIN_K.length - 1];
	if (f >= last[0]) return last[1] + (f - last[0]) * last[2];
	let i = 0;
	while (f > SPIN_K[i + 1][0]) i++;
	const [f0, p0, v0] = SPIN_K[i];
	const [f1, p1, v1] = SPIN_K[i + 1];
	const h = f1 - f0;
	const u = (f - f0) / h;
	const u2 = u * u;
	const u3 = u2 * u;
	return (2 * u3 - 3 * u2 + 1) * p0 + (u3 - 2 * u2 + u) * h * v0 + (-2 * u3 + 3 * u2) * p1 + (u3 - u2) * h * v1;
};
const omegaAt = (f: number) => turnsAt(f + 0.5) - turnsAt(f - 0.5); // vueltas por frame
export const spinAt = (f: number) => {
	if (f < 476) return {spin: 0, flare: 0};
	const spin = turnsAt(Math.min(f, 606)) * Math.PI * 2;
	const w = Math.max(0, omegaAt(Math.min(f, 606) - 3));
	return {spin, flare: clamp(Math.pow(w / 0.03, 2) * 1.05)};
};
const rotY = (p: V3, c: V3, a: number): V3 => {
	const dx = p[0] - c[0];
	const dz = p[2] - c[2];
	const ca = Math.cos(a);
	const sa = Math.sin(a);
	return [c[0] + dx * ca + dz * sa, p[1], c[2] - dx * sa + dz * ca];
};
// pies que se acomodan a cuartos de vuelta (pivote talón-punta): ángulo escalonado + levantamiento
const stepAng = (a: number, ph: number) => {
	const q = Math.PI / 2;
	const k = (a + ph) / q;
	const fl = Math.floor(k);
	const w = clamp((k - fl - 0.4) / 0.6);
	const sm = w * w * (3 - 2 * w);
	return {ang: (fl + sm) * q - ph, lift: Math.sin(Math.PI * w) * 0.028};
};
// rig girado: todo el cuerpo rota sobre el eje de la pelvis; las piernas se doblan un poco en la anticipación
export const rigS = (f: number): Rig => {
	const R = rigAt(f);
	if (f < 476) return R;
	const {spin} = spinAt(f);
	const c: V3 = [R.x, 0, R.z];
	const dip = 0.028 * Math.sin(Math.PI * seg(f, 474, 490)) + 0.012 * seg(f, 486, 500);
	const body = (p: V3, k = 1): V3 => {
		const q = rotY(p, c, spin);
		return [q[0], q[1] - dip * k, q[2]];
	};
	const sL = stepAng(spin, 0);
	const sR = stepAng(spin, Math.PI / 4);
	const foot = (ft: typeof R.footL, st: {ang: number; lift: number}) => {
		const q = rotY(ft.pos, c, st.ang);
		return {...ft, pos: [q[0], q[1] + st.lift, q[2]] as V3, lift: ft.lift + st.lift};
	};
	const ankle = (a: V3, st: {ang: number; lift: number}): V3 => {
		const q = rotY(a, c, st.ang);
		return [q[0], q[1] + st.lift, q[2]];
	};
	const yaw = R.yaw + spin;
	return {
		...R,
		yaw,
		fwd: fwdOf(yaw),
		left: leftOf(yaw),
		pelvis: body(R.pelvis),
		hipL: body(R.hipL),
		hipR: body(R.hipR),
		kneeL: body(R.kneeL, 0.6),
		kneeR: body(R.kneeR, 0.6),
		ankleL: ankle(R.ankleL, sL),
		ankleR: ankle(R.ankleR, sR),
		footL: foot(R.footL, sL),
		footR: foot(R.footR, sR),
		chest: body(R.chest),
		shoulder: body(R.shoulder),
		head: body(R.head),
		caneTip: body(R.caneTip, 0),
		hand: body(R.hand),
		elbow: body(R.elbow),
	};
};
export const ferminPose = (f: number): FerminPose => {
	const R = rigAt(f);
	const {spin, flare} = spinAt(f);
	const yaw = R.yaw + spin;
	return {x: R.x, z: R.z, face: Math.sin(yaw) >= 0 ? 1 : -1, step: R.phase * Math.PI * 2, spin, gone: f >= 606, flare};
};

// ---------------------------------------------------------------- utilidades
type Drawer = (box: [number, number, number, number], blur: number, shade: {color: string; a: number}, fn: (q: Ctx) => void) => void;
const add = (a: V3, b: V3, k = 1): V3 => [a[0] + b[0] * k, a[1] + b[1] * k, a[2] + b[2] * k];
const sub = (a: V3, b: V3): V3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const nrm = (a: V3): V3 => {
	const m = Math.hypot(a[0], a[1], a[2]) || 1;
	return [a[0] / m, a[1] / m, a[2] / m];
};
const dot = (a: V3, b: V3) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const pr = (p: V3): V2 => P(p[0], p[1], p[2]);
type RGB = [number, number, number];
const hex = (c: string): RGB => mixRGB(c, c, 0);
const rgb = (c: RGB, k = 1) => `rgb(${clamp(c[0] * k, 0, 255) | 0},${clamp(c[1] * k, 0, 255) | 0},${clamp(c[2] * k, 0, 255) | 0})`;
const mix = (a: RGB, b: RGB, t: number): RGB => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
const CAM: V3 = [0, 0.75, 0];
const depth = (p: V3) => Math.hypot(p[0], p[2]);

// ---------------------------------------------------------------- sarape: anillo de tiras
const NS = 28; // tiras
const NR = 30; // filas (franjas)
const SH_RL = 0.2;
const SH_RF = 0.125;
const HEM_RL = 0.29;
const HEM_RF = 0.235;
// franjas de arriba (0) al dobladillo (1): campo terracota con grupos finos; cenefa ancha al pie
const T_DARK = hex('#7A2716');
const T_MID = hex(C.terracota);
const BANDS: [number, number, RGB][] = [
	[0.13, 0.15, hex(C.marfil)],
	[0.15, 0.18, hex(C.flama)],
	[0.18, 0.22, hex(C.verde)],
	[0.22, 0.25, hex(C.flama)],
	[0.25, 0.27, hex(C.marfil)],
	[0.4, 0.43, hex(C.cempa)],
	[0.43, 0.46, hex(C.ink)],
	[0.46, 0.49, hex(C.cempa)],
	[0.62, 0.64, hex(C.marfil)],
	[0.64, 0.68, hex(C.flama)],
	[0.68, 0.72, hex(C.verde)],
	[0.72, 0.75, hex(C.flama)],
	[0.75, 0.77, hex(C.marfil)],
	[0.84, 0.87, hex(C.ink)],
	[0.87, 0.92, hex(C.flama)],
	[0.92, 0.95, hex(C.verde)],
	[0.95, 1.0, hex(C.marfil)],
];
const RHOMB: RGB[] = [hex(C.flama), hex(C.cempa), hex(C.marfil), hex(C.verde), hex(C.ink), hex(C.flama)];
const sarapeColor = (th: number, v: number, i: number, r: number): RGB => {
	let c: RGB = v < 0.5 ? T_DARK : mix(T_DARK, T_MID, 0.35);
	for (const [a, b, col] of BANDS) if (v >= a && v < b) c = col;
	// rombo escalonado al frente y atrás (centro v 0.56)
	for (const c0 of [0, Math.PI]) {
		let d = Math.abs(((th - c0 + Math.PI * 3) % (Math.PI * 2)) - Math.PI);
		d = d / 0.62 + Math.abs(v - 0.56) / 0.2;
		if (d < 1 && v > 0.36 && v < 0.78) c = RHOMB[Math.floor(d * 6) % RHOMB.length];
	}
	const j = 0.93 + 0.14 * hash(i * 131 + r, 7);
	return [c[0] * j, c[1] * j, c[2] * j];
};

type Ring = {top: V3[]; hem: V3[]; theta: number[]; center: V3; axisF: V3; axisL: V3; bulge?: (v: number, i: number) => number};
const sarapeRing = (R: Rig, spin: number, flare: number): Ring => {
	const yaw = R.yaw; // rigS ya trae el giro en yaw
	const fwd = fwdOf(yaw);
	const left = leftOf(yaw);
	const topC = add(R.shoulder, [0, -0.015, 0]);
	const hemC = add(add(R.pelvis, [0, -0.06 + flare * 0.06, 0]), [R.hem[0], 0, R.hem[1]]);
	const top: V3[] = [];
	const hem: V3[] = [];
	const theta: number[] = [];
	// la rodilla que avanza empuja el frente del sarape
	const kneeF = (k: V3, h: V3) => Math.max(0, dot(sub(k, h), R.fwd) - 0.06);
	const kL = kneeF(R.kneeL, R.hipL);
	const kR = kneeF(R.kneeR, R.hipR);
	for (let i = 0; i <= NS; i++) {
		const th = (i / NS) * Math.PI * 2;
		theta.push(th);
		const c = Math.cos(th);
		const s = Math.sin(th);
		top.push(add(add(topC, fwd, c * SH_RF), left, s * SH_RL));
		const fr = 1 + flare * 1.6;
		let rf = HEM_RF * fr;
		let rl = HEM_RL * fr;
		let lift = flare * 0.1 * (0.5 + 0.5 * Math.cos(th * 3 + spin));
		// el brazo derecho levanta el costado (la mano asoma por debajo)
		const arm = Math.exp(-Math.pow(((th + Math.PI / 2 - 0.35 + Math.PI * 3) % (Math.PI * 2)) - Math.PI, 2) / 0.2) * (1 - flare);
		lift += 0.11 * arm;
		rl += 0.03 * arm;
		// rodillas
		const front = Math.max(0, c);
		rf += front * (s > 0 ? kL : kR) * 0.45;
		lift += front * (s > 0 ? kL : kR) * 0.25;
		hem.push(add(add(add(hemC, fwd, c * rf), left, s * rl), [0, lift, 0]));
	}
	return {top, hem, theta, center: hemC, axisF: fwd, axisL: left};
};
const fringeKey = 'd07:fringe';
const FR_N = 5;
const FR_SEG = 0.018;
// colapso (606→): nadie adentro. El cuello cae en caída libre hasta el montón, el dobladillo aterriza antes y se abre;
// el giro sigue y se frena. 624–650 el montón respira; 648–678 algo empuja por el lado derecho (sale el coyote).
const COLL = 606;
let ring0: Ring | null = null;
const baseRing = () => {
	if (!ring0) {
		const R = rigS(COLL - 1);
		const {spin, flare} = spinAt(COLL - 1);
		ring0 = sarapeRing(R, spin, flare);
	}
	return ring0;
};
const smooth01 = (u: number) => u * u * (3 - 2 * u);
export const pileState = (f: number) => {
	const breath = f >= 624 && f < 650 ? Math.sin(Math.PI * seg(f, 624, 650)) : 0;
	const heave = Math.sin(Math.PI * seg(f, 648, 680));
	const empty = smooth01(seg(f, 664, 692)); // el coyote ya salió: el montón se aplana
	return {breath, heave, empty};
};
const collapseRing = (f: number): Ring => {
	const b = baseRing();
	const tau = (f - (COLL - 1)) / FPS;
	const c = b.center;
	const rot = 5.8 * 0.25 * (1 - Math.exp(-tau * 4));
	const {breath, heave, empty} = pileState(f);
	const topY = 0.15 + 0.0096 * breath + 0.15 * heave - 0.07 * empty;
	const land = (y0: number) => Math.sqrt((2 * Math.max(0, y0 - 0.01)) / 9.8);
	const mv = (p: V3, rr: number, y: number, lean: number): V3 => {
		const q = rotY(p, c, rot);
		const dx = q[0] - c[0];
		const dz = q[2] - c[2];
		return [c[0] + dx * rr + lean, y, c[2] + dz * rr];
	};
	const top: V3[] = [];
	const hem: V3[] = [];
	for (let i = 0; i < b.top.length; i++) {
		const t0 = b.top[i];
		const yt = Math.max(topY + 0.03 * Math.sin(b.theta[i] * 3 + 1), t0[1] - 4.9 * tau * tau);
		const tl = land(t0[1] - topY);
		const shrink = lerp(1, 0.55, smooth01(clamp(tau / Math.max(0.05, tl))));
		top.push(mv(t0, shrink, yt, 0.03 * smooth01(clamp(tau / 0.5))));
		const h0 = b.hem[i];
		const q0 = rotY(h0, c, rot);
		const side = Math.max(0, (q0[0] - c[0]) / Math.max(0.05, Math.hypot(q0[0] - c[0], q0[2] - c[2])));
		const hl = land(h0[1]);
		const yh = Math.max(0.012 + 0.012 * hash(i, 3) + 0.09 * heave * side * side, h0[1] - 4.9 * tau * tau);
		const spread = tau < hl ? lerp(1, 0.8, clamp(tau / 0.35)) : lerp(0.8, 0.7, smooth01(clamp((tau - hl) / 0.3)));
		hem.push(mv(h0, spread, yh, 0));
	}
	const landed = smooth01(clamp((tau - 0.3) / 0.35));
	return {
		...b,
		top,
		hem,
		bulge: (v, i) => landed * (0.075 + 0.05 * Math.sin(i * 1.7 + 0.6) + 0.025 * Math.sin(i * 4.1)) * Math.sin(Math.PI * Math.min(1, v * 1.25)) * (1 - 0.4 * empty),
	};
};
const ringAt = (f: number): Ring => {
	if (f >= COLL) return collapseRing(f);
	const {spin, flare} = spinAt(f);
	return sarapeRing(rigS(f), spin, flare);
};
const fringeAnchors = (f: number): V3[] => {
	const ring = ringAt(f);
	const out: V3[] = [];
	for (let i = 0; i < NS; i++) out.push(ring.hem[i]);
	return out;
};
const fringe = (f: number) =>
	chainFrame(
		fringeKey,
		{
			n: FR_N,
			seg: FR_SEG,
			strands: NS,
			anchors: fringeAnchors,
			gravity: 0.0109 * 0.5,
			damping: 0.9,
			floor: 0.004,
			wind: (ff, s, i) => {
				const w = windAt(ff, s * 3 + i);
				return [w[0], w[1], w[0] * 0.4];
			},
		},
		f,
	);

// ---------------------------------------------------------------- piezas pintadas
const MANTA = hex('#E4D9C2');
const MANTA_SH = hex('#7F8076');
const SKIN = hex('#7A4526');
const SKIN_LIT = hex('#A86A3C');
const LEATHER = hex('#4A2A14');
const LEATHER_LIT = hex('#8A5530');

type Item = {z: number; draw: (q: Ctx) => void};

const footPts = (R: Rig, side: 1 | -1) => {
	const ft = side === 1 ? R.footL : R.footR;
	const ank = side === 1 ? R.ankleL : R.ankleR;
	const yaw = R.yaw;
	const fwd = fwdOf(yaw);
	const left = leftOf(yaw);
	const base: V3 = [ank[0], ft.pos[1], ank[2]];
	const th = ft.pitch;
	const piv = th >= 0 ? -0.055 : 0.125;
	const W = (a: number, l: number, h: number): V3 => {
		const aa = piv + (a - piv) * Math.cos(th) - h * Math.sin(th);
		const hh = (a - piv) * Math.sin(th) + h * Math.cos(th);
		return add(add(add(base, fwd, aa), left, l * side), [0, Math.max(hh, -0.002), 0]);
	};
	return {W, fwd, left};
};

const legItem = (R: Rig, side: 1 | -1, lit: number, tone: number): Item => {
	const hip = side === 1 ? R.hipL : R.hipR;
	const knee = side === 1 ? R.kneeL : R.kneeR;
	const ank = side === 1 ? R.ankleL : R.ankleR;
	const zc = (hip[2] + knee[2] + ank[2]) / 3;
	return {
		z: depth([(hip[0] + knee[0] + ank[0]) / 3, 0, zc]),
		draw: (q) => {
			const {W} = footPts(R, side);
			const s = pxPerM(zc);
			const h = pr(hip);
			const k = pr(knee);
			const a = pr(ank);
			// pierna: cadera → rodilla → arriba del dobladillo → tobillo
			const shinDir = [a[0] - k[0], a[1] - k[1]];
			const sl = Math.hypot(shinDir[0], shinDir[1]) || 1;
			const cuffTop: V2 = [a[0] - (shinDir[0] / sl) * 0.13 * s, a[1] - (shinDir[1] / sl) * 0.13 * s];
			const cuffBot: V2 = [a[0] - (shinDir[0] / sl) * 0.055 * s, a[1] - (shinDir[1] / sl) * 0.055 * s];
			const spine: V2[] = [[h[0], h[1] - 0.06 * s], h, [(h[0] + k[0]) / 2, (h[1] + k[1]) / 2], k, [(k[0] + cuffTop[0]) / 2, (k[1] + cuffTop[1]) / 2], cuffTop];
			const hw = [0.088, 0.084, 0.07, 0.058, 0.054, 0.052].map((w) => w * s);
			const L: V2[] = [];
			const Rr: V2[] = [];
			for (let i = 0; i < spine.length; i++) {
				const p0 = spine[Math.max(0, i - 1)];
				const p1 = spine[Math.min(spine.length - 1, i + 1)];
				let dx = p1[0] - p0[0];
				let dy = p1[1] - p0[1];
				const m = Math.hypot(dx, dy) || 1;
				dx /= m;
				dy /= m;
				// la tela cuelga hacia atrás (corva) y se ajusta adelante
				const back = i === 3 ? 0.012 * s : 0;
				L.push([spine[i][0] - dy * hw[i], spine[i][1] + dx * hw[i]]);
				Rr.push([spine[i][0] + dy * (hw[i] + back), spine[i][1] - dx * (hw[i] + back)]);
			}
			const out = L.concat(Rr.reverse());
			// gradiente de luz cruzando la pierna (foco arriba a la izquierda)
			const gx0 = Math.min(...out.map((p) => p[0]));
			const gx1 = Math.max(...out.map((p) => p[0]));
			const gr = q.createLinearGradient(gx0, 0, gx1, 0);
			const base = mix(MANTA_SH, MANTA, 0.25 + 0.75 * lit);
			gr.addColorStop(0, rgb(mix(base, hex('#FFF1D6'), 0.25 * lit), tone));
			gr.addColorStop(0.45, rgb(base, tone));
			gr.addColorStop(1, rgb(mix(base, MANTA_SH, 0.6), tone));
			q.fillStyle = gr;
			q.beginPath();
			smoothPath(q, out, true, 0.45);
			q.fill();
			// pliegues de manta: dos arrugas diagonales que nacen de la corva, brillo largo en el muslo
			q.save();
			q.clip();
			q.lineCap = 'round';
			const ux = (k[0] - h[0]) / (Math.hypot(k[0] - h[0], k[1] - h[1]) || 1);
			const uy = (k[1] - h[1]) / (Math.hypot(k[0] - h[0], k[1] - h[1]) || 1);
			q.strokeStyle = `rgba(80,74,62,${0.22 * tone})`;
			q.lineWidth = 0.012 * s;
			for (const [a0, a1, off] of [
				[-0.16, 0.05, 0.03],
				[-0.08, 0.1, -0.02],
			]) {
				q.beginPath();
				q.moveTo(k[0] + ux * a0 * s + uy * off * s, k[1] + uy * a0 * s - ux * off * s);
				q.quadraticCurveTo(k[0] + uy * 0.05 * s, k[1] - ux * 0.05 * s, k[0] + ux * a1 * s - uy * (off + 0.04) * s, k[1] + uy * a1 * s + ux * (off + 0.04) * s);
				q.stroke();
			}
			q.strokeStyle = `rgba(255,246,228,${0.2 * lit * tone})`;
			q.lineWidth = 0.02 * s;
			q.beginPath();
			q.moveTo(h[0] - uy * 0.03 * s, h[1] + ux * 0.03 * s);
			q.lineTo(lerp(h[0], k[0], 0.85) - uy * 0.035 * s, lerp(h[1], k[1], 0.85) + ux * 0.035 * s);
			q.stroke();
			q.restore();
			// dobladillo enrollado
			const cw = 0.066 * s;
			const nx = -(shinDir[1] / sl);
			const ny = shinDir[0] / sl;
			q.fillStyle = rgb(mix(base, hex('#FFF4DC'), 0.15), tone * 0.97);
			q.beginPath();
			q.moveTo(cuffTop[0] + nx * cw, cuffTop[1] + ny * cw);
			q.lineTo(cuffBot[0] + nx * cw * 0.95, cuffBot[1] + ny * cw * 0.95);
			q.quadraticCurveTo(cuffBot[0], cuffBot[1] + 0.012 * s, cuffBot[0] - nx * cw * 0.95, cuffBot[1] - ny * cw * 0.95);
			q.lineTo(cuffTop[0] - nx * cw, cuffTop[1] - ny * cw);
			q.closePath();
			q.fill();
			q.strokeStyle = `rgba(60,55,45,${0.45 * tone})`;
			q.lineWidth = 0.006 * s;
			for (const u of [0.35, 0.7]) {
				const px = lerp(cuffTop[0], cuffBot[0], u);
				const py = lerp(cuffTop[1], cuffBot[1], u);
				q.beginPath();
				q.moveTo(px + nx * cw, py + ny * cw);
				q.quadraticCurveTo(px, py + 0.01 * s, px - nx * cw, py - ny * cw);
				q.stroke();
			}
			// tobillo (piel)
			const sw = 0.034 * s;
			q.fillStyle = rgb(mix(SKIN, SKIN_LIT, lit * 0.7), tone);
			q.beginPath();
			q.moveTo(cuffBot[0] + nx * sw, cuffBot[1] + ny * sw);
			q.lineTo(a[0] + nx * sw * 1.05, a[1] + ny * sw);
			q.lineTo(a[0] - nx * sw * 1.05, a[1] - ny * sw);
			q.lineTo(cuffBot[0] - nx * sw, cuffBot[1] - ny * sw);
			q.closePath();
			q.fill();
			// pie + huarache: suela (envolvente), pie (piel), correas tejidas
			const hull = (pts: V2[]) => {
				const P2 = [...pts].sort((p, o) => p[0] - o[0] || p[1] - o[1]);
				const cr = (o: V2, p: V2, r: V2) => (p[0] - o[0]) * (r[1] - o[1]) - (p[1] - o[1]) * (r[0] - o[0]);
				const lo: V2[] = [];
				for (const p of P2) {
					while (lo.length >= 2 && cr(lo[lo.length - 2], lo[lo.length - 1], p) <= 0) lo.pop();
					lo.push(p);
				}
				const up: V2[] = [];
				for (let i = P2.length - 1; i >= 0; i--) {
					const p = P2[i];
					while (up.length >= 2 && cr(up[up.length - 2], up[up.length - 1], p) <= 0) up.pop();
					up.push(p);
				}
				return lo.slice(0, -1).concat(up.slice(0, -1));
			};
			const ring = (h0: number, wl: number, a0: number, a1: number, n = 10) => {
				const o: V2[] = [];
				for (let i = 0; i < n; i++) {
					const th = (i / n) * Math.PI * 2;
					const aa = lerp(a0, a1, 0.5 + 0.5 * Math.cos(th));
					const taper = aa < 0.02 ? 0.78 : 1;
					o.push(pr(W(aa, Math.sin(th) * wl * taper, h0)));
				}
				return o;
			};
			const sole = hull([...ring(0, 0.046, -0.07, 0.2), ...ring(0.02, 0.046, -0.07, 0.2)]);
			q.fillStyle = rgb(mix(LEATHER, LEATHER_LIT, lit * 0.5), tone * 0.8);
			q.beginPath();
			smoothPath(q, sole, true, 0.3);
			q.fill();
			const footTop = hull([...ring(0.02, 0.04, -0.055, 0.19), pr(W(0.0, 0, 0.085)), pr(W(0.05, 0, 0.06)), pr(W(-0.03, 0, 0.08))]);
			q.fillStyle = rgb(mix(SKIN, SKIN_LIT, lit * 0.75), tone);
			q.beginPath();
			smoothPath(q, footTop, true, 0.3);
			q.fill();
			// correas (cuero tejido en V sobre el empeine) + talonera
			q.lineCap = 'round';
			for (const [aa, k2] of [
				[0.03, 1],
				[0.07, 0.9],
				[0.11, 0.8],
			] as const) {
				const pA = pr(W(aa, 0.042, 0.025));
				const pB = pr(W(aa + 0.015, 0, 0.055 - aa * 0.18));
				const pC = pr(W(aa, -0.042, 0.025));
				q.strokeStyle = rgb(mix(LEATHER, LEATHER_LIT, lit * 0.8 * k2), tone);
				q.lineWidth = 0.013 * s;
				q.beginPath();
				q.moveTo(pA[0], pA[1]);
				q.quadraticCurveTo(pB[0], pB[1] - 0.005 * s, pC[0], pC[1]);
				q.stroke();
			}
			const hA = pr(W(-0.045, 0.035, 0.05));
			const hB = pr(W(-0.07, 0, 0.055));
			const hC = pr(W(-0.045, -0.035, 0.05));
			q.strokeStyle = rgb(LEATHER, tone * 0.9);
			q.lineWidth = 0.011 * s;
			q.beginPath();
			q.moveTo(hA[0], hA[1]);
			q.quadraticCurveTo(hB[0], hB[1], hC[0], hC[1]);
			q.stroke();
			// dedos asomando
			const tp = pr(W(0.19, 0, 0.018));
			q.fillStyle = rgb(mix(SKIN, SKIN_LIT, lit), tone * 1.02);
			q.beginPath();
			q.ellipse(tp[0], tp[1], 0.02 * s, 0.012 * s, 0, 0, Math.PI * 2);
			q.fill();
		},
	};
};

const sarapeItems = (R: Rig, f: number, L: V3, lit: number): Item[] => {
	const spin = 0; // los colores van pegados a la tela (el giro ya está en la geometría)
	const ring = ringAt(f);
	const bg = ring.bulge;
	void R;
	const FR = fringe(f);
	const items: Item[] = [];
	const toL = (p: V3) => nrm(sub(L, p));
	for (let i = 0; i < NS; i++) {
		const thm = (ring.theta[i] + ring.theta[i + 1]) / 2;
		const c0 = ring.top[i];
		const c1 = ring.top[i + 1];
		const h0 = ring.hem[i];
		const h1 = ring.hem[i + 1];
		const mid: V3 = [(c0[0] + c1[0] + h0[0] + h1[0]) / 4, (c0[1] + c1[1] + h0[1] + h1[1]) / 4, (c0[2] + c1[2] + h0[2] + h1[2]) / 4];
		const out = nrm(add(add([0, 0.0, 0], ring.axisF, Math.cos(thm) / HEM_RF), ring.axisL, Math.sin(thm) / HEM_RL));
		const n: V3 = nrm([out[0], 0.22, out[2]]);
		const facing = dot(n, nrm(sub(CAM, mid)));
		items.push({
			z: depth(mid) + (facing < 0 ? 0.02 : 0),
			draw: (q) => {
				const lam = Math.max(0, dot(n, toL(mid)));
				const k = (0.38 + 0.9 * lam * lit) * (facing < 0 ? 0.45 : 1);
				const fold = 1 + 0.16 * Math.sin(thm * 7 + 1.3 + spin * 0.0);
				for (let r = 0; r < NR; r++) {
					const v0 = r / NR;
					const v1 = (r + 1) / NR;
					const e0 = Math.pow(v0, 0.85);
					const e1 = Math.pow(v1, 0.85);
					const y0a = bg ? bg(v0, i) : 0;
					const y1a = bg ? bg(v1, i) : 0;
					const y0b = bg ? bg(v0, i + 1) : 0;
					const y1b = bg ? bg(v1, i + 1) : 0;
					const a0 = pr([lerp(c0[0], h0[0], e0), lerp(c0[1], h0[1], v0) + y0a, lerp(c0[2], h0[2], e0)]);
					const a1 = pr([lerp(c1[0], h1[0], e0), lerp(c1[1], h1[1], v0) + y0b, lerp(c1[2], h1[2], e0)]);
					const b1 = pr([lerp(c1[0], h1[0], e1), lerp(c1[1], h1[1], v1) + y1b, lerp(c1[2], h1[2], e1)]);
					const b0 = pr([lerp(c0[0], h0[0], e1), lerp(c0[1], h0[1], v1) + y1a, lerp(c0[2], h0[2], e1)]);
					const col = sarapeColor(thm + spin, (v0 + v1) / 2, i, r);
					const kk = k * lerp(1, fold, (v0 + v1) / 2) * (0.92 + 0.08 * (1 - v0));
					q.fillStyle = rgb(col, kk);
					q.beginPath();
					q.moveTo(a0[0], a0[1]);
					q.lineTo(a1[0], a1[1]);
					q.lineTo(b1[0], b1[1]);
					q.lineTo(b0[0], b0[1]);
					q.closePath();
					q.fill();
					// costura entre celdas (evita rendijas) con el mismo color
					q.strokeStyle = q.fillStyle;
					q.lineWidth = 0.9;
					q.stroke();
				}
				// fleco de la tira (hebras verlet)
				const st = strand(FR, FR_N, i);
				const s = pxPerM(st[0][2]);
				q.strokeStyle = rgb(hex('#D9CDB6'), k * 0.95);
				q.lineWidth = Math.max(1, 0.0075 * s);
				q.lineCap = 'round';
				for (let j = 0; j < 3; j++) {
					const o = (j - 1) * 0.011;
					q.beginPath();
					for (let m = 0; m < st.length; m++) {
						const sp = add(st[m], ring.axisL, o * Math.cos(thm));
						const pp = pr([sp[0], Math.max(0.004, sp[1]), sp[2]]);
						if (m === 0) q.moveTo(pp[0], pp[1]);
						else q.lineTo(pp[0] + j * 0.3, pp[1]);
					}
					q.stroke();
				}
			},
		});
	}
	return items;
};

// puño derecho sobre el bastón (dorso de la mano hacia la cámara cuando mira a la izquierda)
const handItem = (R: Rig, lit: number, f: number): Item => ({
	z: depth(R.hand) - 0.01,
	draw: (q) => {
		const s = pxPerM(R.hand[2]);
		const tip = pr(R.caneTip);
		const top = pr(add(R.hand, nrm(sub(R.hand, R.caneTip)), 0.05));
		const hp = pr(R.hand);
		const ang = Math.atan2(top[1] - tip[1], top[0] - tip[0]) + Math.PI / 2;
		const face = Math.sin(R.yaw) < 0 ? 1 : -1; // 1: mira a la izquierda (dorso visible)
		const skin = mix(SKIN, SKIN_LIT, 0.35 + 0.6 * lit);
		const el = pr(R.elbow);
		// antebrazo con manga de manta que sale de debajo del sarape
		q.save();
		q.lineCap = 'round';
		q.strokeStyle = rgb(mix(MANTA_SH, MANTA, 0.3 + 0.6 * lit), 0.95);
		q.lineWidth = 0.075 * s;
		q.beginPath();
		q.moveTo(lerp(el[0], hp[0], 0.45), lerp(el[1], hp[1], 0.45));
		q.lineTo(lerp(el[0], hp[0], 0.82), lerp(el[1], hp[1], 0.82));
		q.stroke();
		q.strokeStyle = rgb(mix(MANTA_SH, MANTA, 0.2), 0.7);
		q.lineWidth = 0.008 * s;
		q.beginPath();
		const cx = lerp(el[0], hp[0], 0.8);
		const cy = lerp(el[1], hp[1], 0.8);
		q.moveTo(cx - 0.035 * s, cy - 0.01 * s);
		q.lineTo(cx + 0.035 * s, cy + 0.01 * s);
		q.stroke();
		q.restore();
		q.save();
		q.translate(hp[0], hp[1]);
		q.rotate(ang);
		q.scale(face * s, s);
		// muñeca
		q.fillStyle = rgb(skin, 0.92);
		q.beginPath();
		q.moveTo(-0.028, -0.07);
		q.quadraticCurveTo(-0.034, -0.03, -0.04, 0.0);
		q.lineTo(0.03, 0.0);
		q.quadraticCurveTo(0.03, -0.04, 0.026, -0.07);
		q.closePath();
		q.fill();
		// puño: dorso con nudillos (hacia adelante = −x en local)
		const g = q.createLinearGradient(-0.05, -0.02, 0.04, 0.05);
		g.addColorStop(0, rgb(mix(skin, hex('#E0A070'), 0.35 * lit)));
		g.addColorStop(1, rgb(mix(skin, hex('#2A1408'), 0.45)));
		q.fillStyle = g;
		q.beginPath();
		q.moveTo(-0.045, -0.005);
		q.bezierCurveTo(-0.062, 0.01, -0.066, 0.04, -0.058, 0.058);
		q.bezierCurveTo(-0.05, 0.075, -0.02, 0.082, 0.005, 0.078);
		q.bezierCurveTo(0.03, 0.074, 0.044, 0.05, 0.042, 0.025);
		q.bezierCurveTo(0.04, 0.005, 0.03, -0.006, 0.02, -0.006);
		q.closePath();
		q.fill();
		// dedos enroscados (pliegues) y nudillos
		q.strokeStyle = 'rgba(40,18,8,0.55)';
		q.lineWidth = 0.0045;
		q.lineCap = 'round';
		for (let j = 0; j < 4; j++) {
			const y = 0.02 + j * 0.016;
			q.beginPath();
			q.moveTo(-0.056 + j * 0.001, y);
			q.quadraticCurveTo(-0.035, y + 0.006, -0.018, y + 0.002);
			q.stroke();
		}
		q.fillStyle = `rgba(255,200,150,${0.28 * lit})`;
		for (let j = 0; j < 4; j++) {
			q.beginPath();
			q.ellipse(-0.05, 0.014 + j * 0.016, 0.007, 0.005, 0, 0, Math.PI * 2);
			q.fill();
		}
		// arrugas y una vena
		q.strokeStyle = 'rgba(40,18,8,0.35)';
		q.lineWidth = 0.0025;
		for (let j = 0; j < 5; j++) {
			const x0 = -0.03 + j * 0.012;
			q.beginPath();
			q.moveTo(x0, 0.0 + hash(j, 3) * 0.01);
			q.quadraticCurveTo(x0 + 0.004, 0.02, x0 - 0.002, 0.035 + hash(j, 4) * 0.01);
			q.stroke();
		}
		q.strokeStyle = `rgba(120,70,50,${0.4})`;
		q.lineWidth = 0.004;
		q.beginPath();
		q.moveTo(0.012, -0.06);
		q.bezierCurveTo(0.018, -0.03, 0.006, -0.01, 0.016, 0.02);
		q.stroke();
		// pulgar por delante del bastón
		q.fillStyle = rgb(mix(skin, hex('#C8875A'), 0.3 * lit));
		q.beginPath();
		q.moveTo(-0.05, 0.0);
		q.bezierCurveTo(-0.07, 0.005, -0.075, 0.025, -0.066, 0.035);
		q.bezierCurveTo(-0.058, 0.04, -0.048, 0.03, -0.044, 0.018);
		q.closePath();
		q.fill();
		q.fillStyle = 'rgba(230,200,170,0.45)';
		q.beginPath();
		q.ellipse(-0.067, 0.03, 0.005, 0.004, 0.4, 0, Math.PI * 2);
		q.fill();
		q.restore();
		void f;
	},
});

// bastón de mezquite: nudoso, oscuro, con un brillo del lado del foco
const caneItem = (R: Rig, lit: number): Item => ({
	z: depth([(R.caneTip[0] + R.hand[0]) / 2, 0, (R.caneTip[2] + R.hand[2]) / 2]) + 0.005,
	draw: (q) => {
		const dir = nrm(sub(R.hand, R.caneTip));
		const N = 14;
		const pts: V2[] = [];
		const ws: number[] = [];
		for (let i = 0; i <= N; i++) {
			const u = i / N;
			const p = add(R.caneTip, dir, u * (CANE_LEN + 0.06));
			const wob = (hash(i, 51) - 0.5) * 0.008;
			pts.push(pr(add(p, R.fwd, wob)));
			ws.push((0.012 + 0.003 * hash(i, 52) + (i === 9 || i === 4 ? 0.004 : 0)) * pxPerM(p[2]));
		}
		const Lp: V2[] = [];
		const Rp: V2[] = [];
		for (let i = 0; i <= N; i++) {
			const a = pts[Math.max(0, i - 1)];
			const b = pts[Math.min(N, i + 1)];
			let dx = b[0] - a[0];
			let dy = b[1] - a[1];
			const m = Math.hypot(dx, dy) || 1;
			dx /= m;
			dy /= m;
			Lp.push([pts[i][0] - dy * ws[i], pts[i][1] + dx * ws[i]]);
			Rp.push([pts[i][0] + dy * ws[i], pts[i][1] - dx * ws[i]]);
		}
		q.fillStyle = rgb(hex('#3A2010'), 0.6 + 0.5 * lit);
		q.beginPath();
		smoothPath(q, Lp.concat(Rp.reverse()), true, 0.4);
		q.fill();
		q.strokeStyle = `rgba(190,120,70,${0.45 * lit})`;
		q.lineWidth = Math.max(1, ws[6] * 0.35);
		q.beginPath();
		const side = pts[0][0] < pts[N][0] ? -1 : 1;
		for (let i = 0; i <= N; i++) {
			const x = pts[i][0] + side * ws[i] * 0.45 * 0 - ws[i] * 0.45;
			if (i === 0) q.moveTo(x, pts[i][1]);
			else q.lineTo(x, pts[i][1]);
		}
		q.stroke();
		// nudos
		q.fillStyle = 'rgba(25,12,5,0.7)';
		for (const i of [4, 9, 12]) {
			q.beginPath();
			q.ellipse(pts[i][0], pts[i][1], ws[i] * 0.5, ws[i] * 0.3, 0, 0, Math.PI * 2);
			q.fill();
		}
		// regatón (punta gastada)
		q.fillStyle = 'rgba(20,10,4,0.9)';
		q.beginPath();
		q.ellipse(pts[0][0], pts[0][1], ws[0] * 1.1, ws[0] * 0.5, 0, 0, Math.PI * 2);
		q.fill();
	},
});

// pasada de contorno sobre la capa del actor: luz cálida del lado del foco, fría del lado lejano
const rimTmp: {c?: HTMLCanvasElement} = {};
export const rimPass = (q: Ctx, dx: number, dy: number, color: string, a: number, blur = 1.5) => {
	const c = q.canvas;
	if (!rimTmp.c) rimTmp.c = document.createElement('canvas');
	const t = rimTmp.c;
	if (t.width !== c.width || t.height !== c.height) {
		t.width = c.width;
		t.height = c.height;
	}
	const g = t.getContext('2d')!;
	g.setTransform(1, 0, 0, 1, 0, 0);
	g.globalCompositeOperation = 'source-over';
	g.globalAlpha = 1;
	g.filter = 'none';
	g.clearRect(0, 0, t.width, t.height);
	g.drawImage(c, 0, 0);
	g.globalCompositeOperation = 'destination-out';
	g.drawImage(c, dx, dy);
	g.globalCompositeOperation = 'source-in';
	g.fillStyle = color;
	g.fillRect(0, 0, t.width, t.height);
	q.save();
	q.setTransform(1, 0, 0, 1, 0, 0);
	q.globalCompositeOperation = 'source-atop';
	q.globalAlpha = a;
	q.filter = blur > 0.3 ? `blur(${blur}px)` : 'none';
	q.drawImage(t, 0, 0);
	q.restore();
};

// ---------------------------------------------------------------- don Fermín completo
export const drawFermin = (g: Ctx, f: number, L: V3, I: number, blur: number, draw: Drawer) => {
	if (f >= 1020) return;
	if (f >= COLL) return drawPileCloth(g, f, L, I, blur, draw);
	const R = rigS(f);
	const s = pxPerM(R.z);
	const [fx, fy] = P(R.x, 0, R.z);
	const litTop = lightAt(L, I, [R.x, 1.0, R.z - 0.2], [0, 0, -1]);
	const litLow = lightAt(L, I, [R.x, 0.1, R.z - 0.2], [0, 0, -1]);
	const spread = 0.55 + spinAt(f).flare * 0.6;
	const top = P(R.x, 1.45, R.z)[1];
	const box: [number, number, number, number] = [fx - spread * s, top, spread * 2 * s, fy - top + 0.08 * s];
	draw(box, blur, {color: '#0E1A1A', a: 0}, (q) => {
		// sombra de contacto (oclusión bajo los pies)
		for (const ft of [R.footL, R.footR]) {
			const p = pr([ft.pos[0], 0, ft.pos[2]]);
			const k = 1 - clamp(ft.lift / 0.08);
			const gr = q.createRadialGradient(p[0], p[1], 0, p[0], p[1], 0.13 * s);
			gr.addColorStop(0, `rgba(10,6,3,${0.55 * k})`);
			gr.addColorStop(1, 'rgba(10,6,3,0)');
			q.fillStyle = gr;
			q.beginPath();
			q.ellipse(p[0], p[1], 0.14 * s, 0.035 * s, 0, 0, Math.PI * 2);
			q.fill();
		}
		const lit = clamp(litTop);
		const items: Item[] = [];
		// la pierna lejana más oscura (le tapa la luz la cercana)
		const nearL = R.hipL[2] < R.hipR[2];
		items.push(legItem(R, 1, clamp(litLow + 0.15), nearL ? 1 : 0.72));
		items.push(legItem(R, -1, clamp(litLow + 0.15), nearL ? 0.72 : 1));
		items.push(...sarapeItems(R, f, L, lit));
		if (f < 510) {
			items.push(caneItem(R, lit));
			items.push(handItem(R, lit, f));
		}
		items.sort((a, b) => b.z - a.z).forEach((it) => it.draw(q));
		// luz: contorno cálido del lado del foco (izquierda), frío del otro; cae hacia los pies
		const res = q.getTransform().a;
		rimPass(q, 3.2 * res, 1.2 * res, '#FFB868', 0.55 * clamp(I), 1.2 * res);
		rimPass(q, -3 * res, 0, '#2C6660', 0.4, 1.5 * res);
		q.save();
		q.globalCompositeOperation = 'source-atop';
		const gy0 = top;
		const gy1 = fy;
		const gr = q.createLinearGradient(0, gy0, 0, gy1);
		gr.addColorStop(0, `rgba(12,24,24,${clamp(0.75 - litTop * 0.8)})`);
		gr.addColorStop(1, `rgba(12,24,24,${clamp(0.8 - litLow * 0.75)})`);
		q.fillStyle = gr;
		q.fillRect(box[0] - 50, box[1] - 50, box[2] + 100, box[3] + 100);
		q.restore();
	});
};

// el sarape vacío: cae (606–621) y queda como montón (respira, empuja, se aplana)
const drawPileCloth = (g: Ctx, f: number, L: V3, I: number, blur: number, draw: Drawer) => {
	const R = rigAt(COLL - 1);
	const s = pxPerM(R.z);
	const [fx, fy] = P(R.x, 0, R.z);
	const top = P(R.x, 1.5, R.z)[1];
	const lit = clamp(lightAt(L, I, [R.x, 0.2, R.z - 0.3], [0, 0.6, -0.8]) + 0.1);
	const box: [number, number, number, number] = [fx - 1.0 * s, top, 2.0 * s, fy - top + 0.35 * s];
	draw(box, blur, {color: '#0E1A1A', a: 0}, (q) => {
		const tau = (f - COLL) / FPS;
		const k = clamp((tau - 0.25) / 0.3);
		if (k > 0) {
			const gr = q.createRadialGradient(fx, fy, 0, fx, fy, 0.75 * s);
			gr.addColorStop(0, `rgba(10,6,3,${0.6 * k})`);
			gr.addColorStop(1, 'rgba(10,6,3,0)');
			q.fillStyle = gr;
			q.beginPath();
			q.ellipse(fx, fy - 0.01 * s, 0.75 * s, 0.16 * s, 0, 0, Math.PI * 2);
			q.fill();
		}
		const items = sarapeItems(R, f, L, lit);
		items.sort((a, b) => b.z - a.z).forEach((it) => it.draw(q));
		const res = q.getTransform().a;
		rimPass(q, 3 * res, 1.4 * res, '#FFB868', 0.45 * clamp(I), 1.2 * res);
		rimPass(q, -2.5 * res, 0, '#2C6660', 0.35, 1.5 * res);
	});
};
// sombra del sarape (cae y queda como montón bajo)
export const sarapeCaster = (f: number): Caster | null => {
	if (f < COLL || f >= 1020) return null;
	const ring = collapseRing(f);
	const hp: V3[] = [];
	for (let i = 0; i < NS; i += 2) {
		hp.push(ring.top[i]);
		hp.push([ring.hem[i][0], ring.hem[i][1] + 0.03, ring.hem[i][2]]);
	}
	// entra cuando la tela ya va abajo (antes la sombra «no miente»: solo se ve la bestia, sin salto a 606)
	return {pts: [], hulls: [hp], alpha: smooth01(seg(f, 611, 624))};
};

// ---------------------------------------------------------------- su sombra (caster 3D)
export type ShadowOpts = {
	lag?: number; // frames de retraso de la sombra respecto a él
	head?: (auto: V2[]) => V2[]; // contorno de la cabeza (local, mirando a −u) — para el giro/orejas/coyote
	headFace?: number; // forzar el lado (−1 izquierda, 1 derecha); por defecto el de su cara
	tilt?: number; // inclinación de la cabeza (rad)
	drop?: number; // la cabeza baja (m)
	breathe?: number; // escala (respiración de la sombra)
	tail?: number; // 0..1 largo de la cola (bajo el dobladillo)
	brim?: number; // 0..1 grosor del ala vista desde el foco (0 cuando ya son orejas)
};
const tailSpec = {
	n: 9,
	seg: 0.055,
	strands: 1,
	anchors: (f: number): V3[] => {
		const R = rigAt(f);
		return [add(add(R.pelvis, R.fwd, -0.22), [0, -0.16, 0])];
	},
	rest: (f: number): V3 => {
		const R = rigAt(f);
		return nrm(add([-R.fwd[0], -0.9, -R.fwd[2]], [0, 0, 0]));
	},
	gravity: 0.0109 * 0.35,
	damping: 0.86,
	stiff: 0.2,
	wind: (f: number, _s: number, i: number): V3 => {
		const w = Math.sin(f * 0.11 + i * 0.6) * 0.00035 + windAt(f, 90 + i)[0] * 0.5;
		return [w, 0, w * 0.6];
	},
};
export const ferminShadow = (f: number, L: V3, o: ShadowOpts = {}): {caster: Caster; eyes: V3[]; headAt: (p: V2) => V3} | null => {
	const ff = Math.max(0, f - (o.lag ?? 0));
	if (ff >= 606) return null;
	const R = rigS(ff);
	const {spin, flare} = spinAt(ff);
	const more: V3[][] = [];
	const hulls: V3[][] = [];
	// piernas y pies
	for (const side of [1, -1] as const) {
		const hip = side === 1 ? R.hipL : R.hipR;
		const knee = side === 1 ? R.kneeL : R.kneeR;
		const ank = side === 1 ? R.ankleL : R.ankleR;
		more.push(ribbon(L, [add(hip, [0, 0.05, 0]), knee, ank], [0.085, 0.062, 0.05]));
		const {W} = footPts(R, side);
		more.push(ribbon(L, [W(-0.06, 0, 0.03), W(0.06, 0, 0.03), W(0.19, 0, 0.015)], [0.04, 0.035, 0.028]));
	}
	// sarape: envolvente del anillo superior + dobladillo
	const ring = sarapeRing(R, spin, flare);
	const hp: V3[] = [];
	for (let i = 0; i < NS; i += 2) {
		hp.push(ring.top[i]);
		hp.push(add(ring.hem[i], [0, -0.035, 0]));
	}
	hulls.push(hp);
	// cuello
	more.push(ribbon(L, [R.shoulder, add(R.head, [0, -0.12, 0])], [0.06, 0.055]));
	// cabeza con sombrero: tarjeta perpendicular al rayo del foco
	const dL = nrm([R.head[0] - L[0], 0, R.head[2] - L[2]]);
	const U: V3 = [dL[2], 0, -dL[0]];
	const fu = dot(fwdOf(R.yaw), U);
	const face = o.headFace ?? (fu >= 0 ? 1 : -1);
	const auto = morph(HEAD_HAT_FRONT, HEAD_HAT_PROFILE, clamp(Math.abs(fu) * 1.15));
	let head = o.head ? o.head(auto) : auto;
	if (face > 0) head = mirrorU(head);
	const tilt = o.tilt ?? 0;
	const drop = o.drop ?? 0;
	const headAt = (p: V2): V3 => {
		const ct = Math.cos(tilt);
		const st = Math.sin(tilt);
		const u = p[0] * ct - p[1] * st;
		const v = p[0] * st + p[1] * ct;
		return add(add(R.head, U, u), [0, v - drop, 0]);
	};
	const headPts = head.map(headAt);
	more.push(headPts);
	// el ala vista desde arriba (el foco está más alto): elipse con semieje vertical r·tan(elevación), topada
	const bk = o.brim ?? 1;
	if (bk > 0.01) {
		const hb = R.head[1] + 0.079;
		const el = Math.atan2(L[1] - hb, Math.hypot(R.head[0] - L[0], R.head[2] - L[2]));
		const bv = 0.32 * Math.min(Math.tan(Math.max(0, el)), 0.21) * bk;
		const br: V3[] = [];
		for (let i = 0; i < 18; i++) {
			const a = (i / 18) * Math.PI * 2;
			br.push(headAt([0.32 * Math.cos(a) * (0.6 + 0.4 * bk), 0.079 + bv * Math.sin(a)]));
		}
		more.push(br);
	}
	// bastón y puño
	if (ff < 510) {
		const dir = nrm(sub(R.hand, R.caneTip));
		more.push(ribbon(L, [R.caneTip, add(R.hand, dir, 0.05)], [0.013, 0.016]));
		more.push(ribbon(L, [add(R.hand, dir, -0.04), add(R.hand, dir, 0.04)], [0.04, 0.045]));
	}
	// cola (desde 7.2 s): crece bajo el dobladillo, solo en la sombra
	const tl = o.tail ?? 0;
	if (tl > 0.01) {
		const ch = strand(chainFrame('d07:tail', tailSpec, ff), tailSpec.n, 0);
		const n = Math.max(2, Math.round(2 + tl * (ch.length - 2)));
		const pts = ch.slice(0, n);
		const hw = pts.map((_, i) => {
			const u = i / (ch.length - 1);
			return 0.02 + 0.05 * Math.sin(Math.PI * Math.min(1, u * 1.1)) * (1 - u * 0.5);
		});
		more.push(ribbon(L, pts, hw));
	}
	let caster: Caster = {pts: [], more, hulls};
	const eyes = HEAD_EYES.map((e) => headAt(face > 0 ? [-e[0], e[1]] : e));
	const br = o.breathe ?? 1;
	if (br !== 1) {
		const base: V3 = [R.x, 0, R.z];
		const fn = (p: V3): V3 => [base[0] + (p[0] - base[0]) * br, p[1] * br, base[2] + (p[2] - base[2]) * br];
		caster = mapCaster(caster, fn);
		return {caster, eyes: eyes.map(fn), headAt: (p) => fn(headAt(p))};
	}
	return {caster, eyes, headAt};
};

// compatibilidad (G2 la usa durante las vueltas): la caña como caster suelto
export const caneCaster = (f: number): Caster | null => {
	if (f >= 510) return null;
	const R = rigS(f);
	return {pts: [], more: [[R.caneTip, R.hand, add(R.hand, R.fwd, 0.02), add(R.caneTip, R.fwd, 0.02)]]};
};
export const ferminCaster = (f: number, head: Head = 'hat', L: V3 = BULB0): Caster | null => ferminShadow(f, L)?.caster ?? (void head, null);
void E;
void STOP_T;
void HIP_W;
