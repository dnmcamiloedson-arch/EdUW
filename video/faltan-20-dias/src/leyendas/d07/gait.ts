// Día 7 · el rig de don Fermín en metros de mundo: camino, cadencia con cojera (58/42), pies que se plantan sin
// deslizar (pie fijo durante el apoyo, arco en el vuelo), pelvis que sube y baja, inclinación de 6°, bastón de
// mezquite en la mano DERECHA que se planta con el pie izquierdo (el malo), y el resorte del sarape (inercia).
// Todo se precalcula por frame (determinista) y se interpola: el render solo consulta tablas.
import {noise2D} from '@remotion/noise';
import {FPS, clamp, lerp} from '../../lib/util';
import {cached} from '../kit/paint';
import {LEN, type V2, type V3} from './world';

export const CYCLE = 1.15; // s por ciclo de marcha = 52 bpm (golpe del bastón)
export const HIP_H = 0.865;
export const THIGH = 0.405;
export const SHIN = 0.4;
export const ANKLE_H = 0.075;
export const HIP_W = 0.085;
export const CANE_LEN = 0.86;
export const STOP_T = 10.6;
export const STOP_X = -0.33;
export const STOP_Z = 2.4;
const NF = LEN + 60;
const SUB = 4;

// ---------------------------------------------------------------- camino (Catmull-Rom → longitud de arco)
const CTRL: V2[] = [
	[-0.62, 0.86],
	[-0.6, 0.9],
	[-0.31, 1.4],
	[0.04, 1.92],
	[0.24, 2.2],
	[0.22, 2.33],
	[0.02, 2.39],
	[STOP_X, STOP_Z],
	[STOP_X - 0.2, STOP_Z],
];
const PATH = cached('d07:path', () => {
	const pts: V2[] = [];
	for (let i = 1; i < CTRL.length - 2; i++) {
		const [p0, p1, p2, p3] = [CTRL[i - 1], CTRL[i], CTRL[i + 1], CTRL[i + 2]];
		for (let k = 0; k < 60; k++) {
			const u = k / 60;
			const c = (a: number, b: number, c2: number, d: number) => 0.5 * (2 * b + (-a + c2) * u + (2 * a - 5 * b + 4 * c2 - d) * u * u + (-a + 3 * b - 3 * c2 + d) * u * u * u);
			pts.push([c(p0[0], p1[0], p2[0], p3[0]), c(p0[1], p1[1], p2[1], p3[1])]);
		}
	}
	pts.push(CTRL[CTRL.length - 2]);
	const acc = [0];
	for (let i = 1; i < pts.length; i++) acc.push(acc[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
	return {pts, acc, len: acc[acc.length - 1]};
});
const pathAt = (s: number): V2 => {
	const {pts, acc, len} = PATH;
	const d = clamp(s, 0, len);
	let lo = 0;
	let hi = acc.length - 1;
	while (hi - lo > 1) {
		const m = (lo + hi) >> 1;
		if (acc[m] <= d) lo = m;
		else hi = m;
	}
	const u = (d - acc[lo]) / Math.max(1e-6, acc[hi] - acc[lo]);
	return [lerp(pts[lo][0], pts[hi][0], u), lerp(pts[lo][1], pts[hi][1], u)];
};

// ---------------------------------------------------------------- velocidad, cadencia, fase
// rápido al dejar el foco (gancho), frena al llegar a media calle, gira dando la espalda, pasito de anciano hacia la
// izquierda, dos pasos que frenan y alto a 10.6 s.
const vRaw = (t: number) => {
	if (t < 0.3) return 0;
	if (t < 0.85) return 0.72 * (0.5 - 0.5 * Math.cos((Math.PI * (t - 0.3)) / 0.55));
	if (t < 2.2) return 0.72;
	if (t < 3.6) return lerp(0.72, 0.13, 0.5 - 0.5 * Math.cos((Math.PI * (t - 2.2)) / 1.4));
	if (t < 8.9) return 0.13;
	if (t < STOP_T) return 0.13 * Math.pow(1 - (t - 8.9) / (STOP_T - 8.9), 1.6);
	return 0;
};
type Tab = {S: Float32Array; Ph: Float32Array; yaw: Float32Array; hemX: Float32Array; hemZ: Float32Array; pEnd: number; tEnd: number};
const TAB = cached('d07:gaitTab', (): Tab => {
	const N = NF * SUB;
	const dt = 1 / (FPS * SUB);
	// longitud de arco: escala para llegar exacto al alto
	const S = new Float32Array(N);
	let acc = 0;
	for (let i = 0; i < N; i++) {
		S[i] = acc;
		acc += vRaw(i * dt) * dt;
	}
	const k = PATH.len / S[Math.round(STOP_T * FPS * SUB)];
	for (let i = 0; i < N; i++) S[i] = Math.min(PATH.len, S[i] * k);
	// fase de marcha: cadencia fija mientras camina, cae con la velocidad; termina en doble apoyo (x.5)
	const Ph = new Float32Array(N);
	let ph = 0;
	for (let i = 0; i < N; i++) {
		Ph[i] = ph;
		const v = vRaw(i * dt);
		ph += (clamp(v / 0.05) / CYCLE) * dt;
	}
	const iEnd = Math.round(STOP_T * FPS * SUB);
	const raw = Ph[iEnd];
	const tgt = Math.round(raw) + 0; // + 0.5 de inicio → x.5
	for (let i = 0; i < N; i++) Ph[i] = 0.5 + (Math.min(Ph[i], raw) * tgt) / raw;
	// orientación: de perfil a la derecha (gancho) → tangente del camino (suavizada) → perfil a la izquierda
	const yaw = new Float32Array(N);
	let y = Math.PI / 2;
	let vy = 0;
	let prevTan = Math.PI / 2;
	for (let i = 0; i < N; i++) {
		const t = i * dt;
		const a = pathAt(S[i]);
		const b = pathAt(S[i] + 0.04);
		let tan = Math.atan2(b[0] - a[0], b[1] - a[1]);
		if (S[i] + 0.04 >= PATH.len) tan = -Math.PI / 2;
		while (tan - prevTan > Math.PI) tan -= 2 * Math.PI;
		while (tan - prevTan < -Math.PI) tan += 2 * Math.PI;
		prevTan = tan;
		let target = t < 0.3 ? Math.PI / 2 : tan;
		if (t > 9.4) target = lerp(tan, -Math.PI / 2, clamp((t - 9.4) / 0.8));
		const w = 2 * Math.PI * 1.1;
		vy += (w * w * (target - y) - 2 * w * vy) * dt;
		y += vy * dt;
		yaw[i] = y;
	}
	// resorte del sarape (arrastre por velocidad + rebote al frenar)
	const hemX = new Float32Array(N);
	const hemZ = new Float32Array(N);
	let ox = 0;
	let oz = 0;
	let vx = 0;
	let vz = 0;
	for (let i = 0; i < N; i++) {
		const a = pathAt(S[Math.max(0, i - 1)]);
		const b = pathAt(S[i]);
		const velx = (b[0] - a[0]) / dt;
		const velz = (b[1] - a[1]) / dt;
		const w = (2 * Math.PI) / 1.05;
		const z = 0.32;
		const tx = -velx * 0.13;
		const tz = -velz * 0.13;
		vx += (w * w * (tx - ox) - 2 * z * w * vx) * dt;
		vz += (w * w * (tz - oz) - 2 * z * w * vz) * dt;
		ox += vx * dt;
		oz += vz * dt;
		hemX[i] = ox;
		hemZ[i] = oz;
	}
	return {S, Ph, yaw, hemX, hemZ, pEnd: Ph[iEnd], tEnd: STOP_T};
});
const at = (arr: Float32Array, t: number) => {
	const x = clamp(t * FPS * SUB, 0, arr.length - 1.001);
	const i = Math.floor(x);
	return arr[i] + (arr[i + 1] - arr[i]) * (x - i);
};
// tiempo en que la fase alcanza p (Infinity si nunca)
const tOfP = (p: number) => {
	const {Ph, pEnd, tEnd} = TAB;
	if (p > pEnd + 1e-6) return Infinity;
	if (p <= Ph[0]) return 0;
	let lo = 0;
	let hi = Math.round(tEnd * FPS * SUB);
	while (hi - lo > 1) {
		const m = (lo + hi) >> 1;
		if (Ph[m] < p) lo = m;
		else hi = m;
	}
	const u = (p - Ph[lo]) / Math.max(1e-9, Ph[hi] - Ph[lo]);
	return (lo + clamp(u)) / (FPS * SUB);
};
export const bodyXZ = (t: number): V2 => pathAt(at(TAB.S, Math.min(t, NF / FPS - 0.01)));
export const yawAt = (t: number) => at(TAB.yaw, Math.min(t, NF / FPS - 0.01));
export const phaseAt = (t: number) => at(TAB.Ph, Math.min(t, NF / FPS - 0.01));
export const speedAt = (t: number) => {
	const a = bodyXZ(t - 0.05);
	const b = bodyXZ(t + 0.05);
	return Math.hypot(b[0] - a[0], b[1] - a[1]) / 0.1;
};
export const fwdOf = (yaw: number): V3 => [Math.sin(yaw), 0, Math.cos(yaw)];
export const leftOf = (yaw: number): V3 => [Math.cos(yaw), 0, -Math.sin(yaw)];

// ---------------------------------------------------------------- pies
// izquierdo (cojo): golpe en k, despegue en k+0.62 · derecho: golpe en k+0.42, despegue en k+1.12
type FootDef = {off: number; stance: number; side: 1 | -1; lift: number};
const LFOOT: FootDef = {off: 0, stance: 0.62, side: 1, lift: 0.045};
const RFOOT: FootDef = {off: 0.42, stance: 0.7, side: -1, lift: 0.07};
const planted = (fd: FootDef, ps: number): V3 => {
	const p0 = TAB.Ph[0];
	let tm: number;
	if (ps <= p0) tm = 0;
	else {
		const tt = tOfP(ps + fd.stance * 0.5);
		tm = isFinite(tt) ? tt : TAB.tEnd;
	}
	const [x, z] = bodyXZ(tm);
	const l = leftOf(yawAt(tm));
	const f = fwdOf(yawAt(tm));
	return [x + l[0] * HIP_W * 1.05 * fd.side + f[0] * 0.02, 0, z + l[2] * HIP_W * 1.05 * fd.side + f[2] * 0.02];
};
export type Foot = {pos: V3; pitch: number; swing: number; lift: number};
const footAt = (fd: FootDef, p: number): Foot => {
	const q = p - fd.off;
	const k = Math.floor(q);
	const loc = q - k;
	const ps = k + fd.off;
	if (loc < fd.stance) {
		const pos = planted(fd, ps);
		// rodar talón-punta: punta arriba al golpe, talón arriba antes del despegue
		const pitch = loc < 0.08 ? 0.26 * (1 - loc / 0.08) : loc > fd.stance - 0.14 ? -0.42 * ((loc - (fd.stance - 0.14)) / 0.14) : 0;
		return {pos, pitch, swing: 0, lift: 0};
	}
	const a = planted(fd, ps);
	const b = planted(fd, ps + 1);
	const u = (loc - fd.stance) / (1 - fd.stance);
	const e = u * u * (3 - 2 * u);
	const span = Math.hypot(b[0] - a[0], b[2] - a[2]);
	const lift = fd.lift * Math.min(1, 0.35 + span * 3) * Math.pow(Math.sin(Math.PI * u), 0.8);
	return {pos: [lerp(a[0], b[0], e), lift, lerp(a[2], b[2], e)], pitch: lerp(-0.42, 0.26, u), swing: Math.sin(Math.PI * u), lift};
};

// ---------------------------------------------------------------- pose completa
export type Rig = {
	t: number;
	x: number;
	z: number;
	yaw: number;
	fwd: V3;
	left: V3;
	pelvis: V3;
	hipL: V3;
	hipR: V3;
	kneeL: V3;
	kneeR: V3;
	ankleL: V3;
	ankleR: V3;
	footL: Foot;
	footR: Foot;
	chest: V3; // centro del torso a la altura del pecho
	shoulder: V3; // centro de hombros
	head: V3; // centro de la cabeza
	caneTip: V3;
	hand: V3; // puño derecho (arriba del bastón)
	elbow: V3;
	hem: V2; // desplazamiento del sarape (x, z) por inercia
	moving: number; // 0..1
	phase: number;
};
const add = (a: V3, b: V3, k = 1): V3 => [a[0] + b[0] * k, a[1] + b[1] * k, a[2] + b[2] * k];
const legIK = (hip: V3, ankle: V3, fwd: V3, left: V3) => {
	const d: V3 = [ankle[0] - hip[0], ankle[1] - hip[1], ankle[2] - hip[2]];
	const a = d[0] * fwd[0] + d[2] * fwd[2];
	const lat = d[0] * left[0] + d[2] * left[2];
	const L = Math.hypot(a, d[1]);
	const r = Math.min(L, THIGH + SHIN - 1e-3);
	const base = Math.atan2(d[1], a);
	const ang = Math.acos(clamp((THIGH * THIGH + r * r - SHIN * SHIN) / (2 * THIGH * r), -1, 1));
	const ka = base + ang; // rodilla hacia adelante
	const kf = Math.cos(ka) * THIGH;
	const ku = Math.sin(ka) * THIGH;
	const kl = lat * (THIGH / Math.max(1e-3, L));
	return add(add(add(hip, fwd, kf), [0, 1, 0], ku), left, kl);
};
export const rigAt = (f: number, frozenFrom = 336): Rig => {
	const t = Math.min(f, frozenFrom) / FPS;
	const [x, z] = bodyXZ(t);
	const yaw = yawAt(t);
	const fwd = fwdOf(yaw);
	const left = leftOf(yaw);
	const p = phaseAt(t);
	const mv = clamp(speedAt(t) / 0.06);
	// pelvis: baja en doble apoyo, se hunde en el apoyo del pie malo; se mece hacia el pie de apoyo
	const loc = p - Math.floor(p);
	let bob = -0.0075 * (0.5 + 0.5 * Math.cos(4 * Math.PI * (p - 0.06)));
	if (loc > 0.12 && loc < 0.42) bob -= 0.009 * Math.sin((Math.PI * (loc - 0.12)) / 0.3);
	bob *= mv;
	// alto: la pelvis se asienta 4 px (≈6 mm) y se recupera en 10 frames
	const ts = t - STOP_T;
	if (ts > 0) bob -= 0.0075 * Math.sin(Math.PI * clamp(ts / 0.34));
	const sway = 0.012 * Math.cos(2 * Math.PI * (p - 0.27)) * mv;
	const pelvis: V3 = add([x, HIP_H + bob, z], left, sway);
	const hipL = add(pelvis, left, HIP_W);
	const hipR = add(pelvis, left, -HIP_W);
	const footL = footAt(LFOOT, p);
	const footR = footAt(RFOOT, p);
	const ankleL = add(footL.pos, [0, ANKLE_H + Math.max(0, -footL.pitch) * 0.06, 0]);
	const ankleR = add(footR.pos, [0, ANKLE_H + Math.max(0, -footR.pitch) * 0.06, 0]);
	const kneeL = legIK(hipL, ankleL, fwd, left);
	const kneeR = legIK(hipR, ankleR, fwd, left);
	// torso inclinado 6°
	const lean = 0.105;
	const chest = add(add(pelvis, [0, 0.3, 0]), fwd, 0.3 * lean);
	const shoulder = add(add(pelvis, [0, 0.54, 0]), fwd, 0.54 * lean);
	const head = add(add(pelvis, [0, 0.8, 0]), fwd, 0.8 * lean + 0.03);
	// bastón: viaja con el pie izquierdo, afuera del pie derecho (lado derecho), un poco adelante
	const lf = footL.pos;
	const caneTip: V3 = add(add([lf[0], footL.lift * 0.7, lf[2]], fwd, 0.11), left, -2 * HIP_W - 0.12);
	// re-agarre (f 324–336): la mano sube 2 cm y vuelve a apretar
	const rg = f >= 322 && f < 340 ? Math.sin(Math.PI * clamp((f - 322) / 16)) : 0;
	const nominal: V3 = add(add(add(pelvis, [0, 0.03 + 0.02 * rg, 0]), fwd, 0.17), left, -0.25);
	const dv: V3 = [nominal[0] - caneTip[0], nominal[1] - caneTip[1], nominal[2] - caneTip[2]];
	const m = Math.hypot(dv[0], dv[1], dv[2]);
	const hand = add(caneTip, dv, (CANE_LEN - 0.02 * rg) / m);
	const shR = add(shoulder, left, -0.2);
	const elbow = add(add(add(shR, hand, 0), [0, 0, 0]), [0, 0, 0]);
	{
		// codo: a media distancia, empujado hacia atrás y afuera
		const mid: V3 = [(shR[0] + hand[0]) / 2, (shR[1] + hand[1]) / 2, (shR[2] + hand[2]) / 2];
		const e = add(add(mid, fwd, -0.09), left, -0.05);
		elbow[0] = e[0];
		elbow[1] = e[1];
		elbow[2] = e[2];
	}
	return {
		t,
		x,
		z,
		yaw,
		fwd,
		left,
		pelvis,
		hipL,
		hipR,
		kneeL,
		kneeR,
		ankleL,
		ankleR,
		footL,
		footR,
		chest,
		shoulder,
		head,
		caneTip,
		hand,
		elbow,
		hem: [at(TAB.hemX, t), at(TAB.hemZ, t)],
		moving: mv,
		phase: p,
	};
};
// viento en el fleco/sarape (m/frame²)
export const windAt = (f: number, i: number): V2 => [
	(0.25 + 0.75 * noise2D('d07w', f * 0.025, i * 0.13)) * 0.00042,
	noise2D('d07wy', f * 0.03, i * 0.2) * 0.00015,
];
