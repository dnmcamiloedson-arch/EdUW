// Día 7 · el coyote (G2): rig cuadrúpedo 2D en metros (vista de perfil, mira a +x), 4 patas ik2 con patas plantadas
// por distancia recorrida (paso de 4 tiempos 0.9 s), columna con bob, cabeza 3D simplificada que gira hacia la lente
// (proyección ortográfica de cráneo/hocico/orejas), cola procedural con retardo, ~180 trazos de pelo de contorno,
// sacudida de 0.6 s con polvo, eyeshine oro-verde. Línea de tiempo: sale del montón (654), se sacude (678–696),
// camina hacia el perro (696–728), alerta, mira a la lente (744–762), da la vuelta y se escabulle al callejón (762→806).
import {E, FPS, clamp, hash, lerp} from '../../lib/util';
import {glow, type Ctx} from '../kit/paint';
import {card, lightAt, type Caster} from './light';
import {rimPass} from './fermin';
import {STOP_X} from './gait';
import {P, pxPerM, seg, type V2, type V3} from './world';

type Drawer = (box: [number, number, number, number], blur: number, shade: {color: string; a: number}, fn: (q: Ctx) => void) => void;
const sm = (u: number) => u * u * (3 - 2 * u);
const F0 = 640;
const F1 = 812;

// ---------------------------------------------------------------- línea de tiempo (tabla precalculada)
export type CoyoteSt = {
	x: number;
	z: number;
	fs: number; // escala/dirección en x (+1 mira a la derecha, −1 a la izquierda; pasa por ±0.3 al voltear)
	crouch: number;
	slink: number;
	d: number; // distancia recorrida (m) → fase de las patas
	speed: number; // m/s suavizada
	look: number; // 0 perfil → 1 cabeza de frente a la lente
	headDown: number; // olfateo
	shake: number; // envolvente de la sacudida
	alert: number;
	fade: number; // 1 visible → 0 perdido en la niebla
	emerge: boolean;
	z0: number; // profundidad para ordenar capas
};
const keyX = (f: number): {x: number; z: number} => {
	// dentro del montón; 654 asoma la pata y el hocico por el lado derecho; sale reptando
	if (f < 654) return {x: STOP_X - 0.03, z: 2.45};
	if (f < 680) {
		const u = seg(f, 654, 680);
		return {x: lerp(STOP_X - 0.03, 0.0, u * u * (1.6 - 0.6 * u)), z: 2.45};
	}
	if (f < 696) return {x: 0.0, z: 2.45};
	if (f < 772) {
		// hacia el perro: a la derecha y hacia el fondo (el perro está en la base del muro)
		const u = seg(f, 696, 730);
		const e = u < 1 ? sm(u) : 1;
		return {x: lerp(0.0, 0.1, e), z: lerp(2.45, 2.95, e)};
	}
	const u = seg(f, 772, 808);
	const e = Math.pow(u, 1.55);
	return {x: lerp(0.1, -1.75, e), z: lerp(2.95, 4.6, e)};
};
const TAB: CoyoteSt[] = [];
const build = () => {
	let d = 0;
	let sp = 0;
	let prev = keyX(F0);
	for (let f = F0; f <= F1; f++) {
		const k = keyX(f);
		const step = Math.hypot(k.x - prev.x, k.z - prev.z);
		d += step;
		sp = lerp(sp, step * FPS, 0.35);
		prev = k;
		const turn = seg(f, 762, 773);
		const fsRaw = Math.cos(Math.PI * sm(turn));
		const fs = Math.sign(fsRaw || 1) * Math.max(0.3, Math.abs(fsRaw));
		const crouch = f < 654 ? 1 : f < 690 ? lerp(1, 0, sm(seg(f, 656, 690))) : 0;
		const slink = sm(seg(f, 760, 776)) * 0.8 + 0.2 * sm(seg(f, 726, 740)) * (1 - seg(f, 744, 760));
		const look = sm(seg(f, 742, 750)) * (1 - sm(seg(f, 770, 778)));
		const headDown = f >= 700 && f < 728 ? sm(seg(f, 700, 708)) * (1 - sm(seg(f, 724, 732))) : 0;
		const su = seg(f, 678, 696);
		const shake = f >= 678 && f < 696 ? Math.pow(Math.sin(Math.PI * su), 0.6) * (1 - 0.35 * su) : 0;
		const alert = sm(seg(f, 726, 734)) * (1 - sm(seg(f, 760, 770)));
		const fade = 1 - sm(seg(f, 794, 808));
		const emerge = f < 690;
		TAB.push({x: k.x, z: k.z, fs, crouch, slink, d, speed: sp, look, headDown, shake, alert, fade, emerge, z0: emerge ? 2.45 : k.z});
	}
};
export const coyoteState = (f: number): CoyoteSt | null => {
	if (f < 654 || f > 808) return null;
	if (!TAB.length) build();
	return TAB[Math.min(TAB.length - 1, Math.max(0, f - F0))];
};

// ---------------------------------------------------------------- pose (local, mira a +x)
type Leg = {pts: V2[]; far: boolean; front: boolean};
type Pose = {body: V2[]; legs: Leg[]; tail: V2[]; tailW: number[]; head: V2; headRot: number; yaw: number; ear: number};
const ik = (r: V2, t: V2, l1: number, l2: number, fwd: boolean): V2 => {
	const dx = t[0] - r[0];
	const dy = t[1] - r[1];
	const d = clamp(Math.hypot(dx, dy), 0.02, l1 + l2 - 1e-4);
	const a = Math.acos(clamp((l1 * l1 + d * d - l2 * l2) / (2 * l1 * d), -1, 1));
	const b = Math.atan2(dy, dx) + (fwd ? a : -a);
	return [r[0] + Math.cos(b) * l1, r[1] + Math.sin(b) * l1];
};
const DUTY = 0.64;
const XS = 0.92; // el cuerpo un poco más corto (proporción de coyote)
const HS = 1.3; // cabeza más grande que el modelo base
const pose = (c: CoyoteSt, f: number): Pose => {
	const low = 1 - 0.6 * c.crouch - 0.16 * c.slink;
	const stride = 0.3 + 0.38 * Math.min(2, c.speed);
	const ph = c.d / stride;
	const mv = sm(clamp(c.speed / 0.14));
	const bob = -0.008 * Math.cos(4 * Math.PI * ph) * mv;
	const shk = c.shake;
	const osc = Math.sin((2 * Math.PI * (f - 678)) / 6.4);
	const hipY = 0.49 * low + bob;
	const shY = 0.5 * low + bob + 0.012 * c.alert;
	const wave = (x: number) => 0.022 * shk * Math.sin((2 * Math.PI * (f - 678)) / 6.4 - x * 9);
	const legs: Leg[] = [];
	const spread = 0.07 * c.crouch;
	const defs: {front: boolean; far: boolean; off: number}[] = [
		{front: false, far: true, off: 0.5},
		{front: true, far: true, off: 0.75},
		{front: false, far: false, off: 0},
		{front: true, far: false, off: 0.25},
	];
	for (const L of defs) {
		const p = ph + L.off;
		const u = p - Math.floor(p);
		let rel: number;
		let lift = 0;
		if (u < DUTY) rel = stride * (DUTY / 2 - u);
		else {
			const v = (u - DUTY) / (1 - DUTY);
			rel = stride * (-DUTY / 2 + DUTY * sm(v));
			lift = Math.sin(Math.PI * v) * (0.05 + 0.03 * Math.min(1, c.speed));
		}
		rel *= mv;
		lift *= mv;
		const ox = L.far ? 0.025 : 0;
		if (L.front) {
			const j: V2 = [0.23 + ox, shY - 0.11];
			const paw: V2 = [0.27 + ox + rel + spread, lift];
			const wrist: V2 = [paw[0] - 0.005, paw[1] + 0.07];
			const elbow = ik(j, wrist, 0.17, 0.2, false);
			legs.push({pts: [[j[0] + 0.02, j[1] + 0.09], j, elbow, wrist, [paw[0] + 0.03, paw[1]]], far: L.far, front: true});
		} else {
			const j: V2 = [-0.27 + ox, hipY - 0.05];
			const paw: V2 = [-0.25 + ox + rel - spread, lift];
			const hock: V2 = [paw[0] - 0.055, paw[1] + 0.13 * (1 - 0.25 * c.crouch)];
			const knee = ik(j, hock, 0.21, 0.22, true);
			legs.push({pts: [[j[0] - 0.02, j[1] + 0.07], j, knee, hock, [paw[0] + 0.035, paw[1]]], far: L.far, front: false});
		}
	}
	// silueta del cuerpo: grupa → lomo → cruz → cuello → (cabeza aparte) → garganta → pecho → vientre → ingle → muslo
	const neckLift = 0.06 * c.alert - 0.12 * c.headDown - 0.1 * c.slink + 0.04 * c.look - 0.05 * c.crouch;
	const body: V2[] = [
		[-0.4, hipY + 0.035],
		[-0.25, hipY + 0.06 + wave(-0.25)],
		[-0.05, (hipY + shY) / 2 + 0.055 + wave(-0.05)],
		[0.17, shY + 0.085 + wave(0.17)],
		[0.3, shY + 0.1 + neckLift * 0.6],
		[0.38, shY + 0.13 + neckLift],
		[0.43, shY + 0.03 + neckLift],
		[0.36, shY - 0.1 + neckLift * 0.3],
		[0.29, shY - 0.2],
		[0.16, shY - 0.235],
		[0.0, 0.5 * low - 0.15 + wave(0)],
		[-0.17, hipY - 0.125],
		[-0.27, hipY - 0.16],
		[-0.4, hipY - 0.12],
		[-0.44, hipY - 0.03],
	];
	// cola: cuelga hacia atrás, se mece con el paso, latigazo en la sacudida, se mete entre las patas al escabullirse
	const tail: V2[] = [];
	const tailW: number[] = [];
	const base: V2 = [-0.41, hipY + 0.02];
	let ang = -2.35 - 0.3 * c.slink + 0.25 * c.alert;
	let px = base[0];
	let py = base[1];
	tail.push([px, py]);
	tailW.push(0.03);
	for (let i = 1; i <= 7; i++) {
		const sway = 0.1 * Math.sin(2 * Math.PI * ph - i * 0.5) * mv + 0.5 * shk * Math.sin((2 * Math.PI * (f - 678 - i * 0.8)) / 6.4) + 0.03 * Math.sin(f * 0.07 + i);
		ang += -0.05 + sway * 0.25 - 0.06 * c.slink;
		px += Math.cos(ang) * 0.055;
		py += Math.sin(ang) * 0.055;
		tail.push([px, Math.max(0.02, py)]);
		const u = i / 7;
		tailW.push(0.03 + 0.045 * Math.sin(Math.PI * Math.min(1, u * 0.95 + 0.1)));
	}
	const headRot = -0.12 - 0.42 * c.headDown + 0.12 * c.alert - 0.25 * c.slink + 0.05 * Math.sin(4 * Math.PI * ph) * c.headDown + 0.18 * shk * osc;
	return {
		body,
		legs,
		tail,
		tailW,
		head: [0.43, shY + 0.11 + neckLift],
		headRot,
		yaw: c.look * 1.35 + 0.55 * shk * osc,
		ear: -0.35 * c.slink + 0.25 * shk * Math.sin((2 * Math.PI * (f - 680)) / 6.4),
	};
};

// ---------------------------------------------------------------- cabeza 3D simplificada (ortográfica)
// coordenadas de cabeza: x adelante, y arriba, w lado cercano (cámara). yaw ψ gira el hocico hacia la lente.
const headProj = (ψ: number, rot: number) => (x: number, y: number, w: number): {p: V2; d: number} => {
	const cr = Math.cos(rot);
	const sr = Math.sin(rot);
	const xr = x * cr - y * sr;
	const yr = x * sr + y * cr;
	return {p: [(xr * Math.cos(ψ) - w * Math.sin(ψ)) * HS, yr * HS], d: -xr * Math.sin(ψ) - w * Math.cos(ψ)};
};
const ring = (pj: ReturnType<typeof headProj>, x: number, y: number, ry: number, rw: number, n = 12) => {
	const out: V2[] = [];
	let dd = 0;
	for (let i = 0; i < n; i++) {
		const t = (i / n) * Math.PI * 2;
		const r = pj(x, y + ry * Math.cos(t), rw * Math.sin(t));
		out.push(r.p);
		dd += r.d;
	}
	return {pts: out, d: dd / n};
};
const hull = (pts: V2[]): V2[] => {
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

// ---------------------------------------------------------------- pintura
const FUR_BACK = '#4E3A27';
const FUR_SIDE = '#8D6B47';
const FUR_BELLY = '#CDB38A';
const FUR_LEG = '#A9875F';
type Tx = (p: V2) => V2;
const path = (q: Ctx, pts: V2[], close = true) => {
	const n = pts.length;
	q.beginPath();
	if (!close) {
		q.moveTo(pts[0][0], pts[0][1]);
		for (let i = 0; i < n - 1; i++) {
			const p0 = pts[Math.max(0, i - 1)];
			const p1 = pts[i];
			const p2 = pts[i + 1];
			const p3 = pts[Math.min(n - 1, i + 2)];
			q.bezierCurveTo(p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6, p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6, p2[0], p2[1]);
		}
		return;
	}
	q.moveTo(pts[0][0], pts[0][1]);
	for (let i = 0; i < n; i++) {
		const p0 = pts[(i - 1 + n) % n];
		const p1 = pts[i];
		const p2 = pts[(i + 1) % n];
		const p3 = pts[(i + 2) % n];
		q.bezierCurveTo(p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6, p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6, p2[0], p2[1]);
	}
	q.closePath();
};
const poly = (q: Ctx, pts: V2[]) => {
	q.beginPath();
	pts.forEach((p, i) => (i ? q.lineTo(p[0], p[1]) : q.moveTo(p[0], p[1])));
	q.closePath();
};
// pierna como cinta con grosor variable
const limb = (pts: V2[], w: number[]): V2[] => {
	const A: V2[] = [];
	const B: V2[] = [];
	for (let i = 0; i < pts.length; i++) {
		const p0 = pts[Math.max(0, i - 1)];
		const p1 = pts[Math.min(pts.length - 1, i + 1)];
		const dx = p1[0] - p0[0];
		const dy = p1[1] - p0[1];
		const m = Math.hypot(dx, dy) || 1;
		A.push([pts[i][0] - (dy / m) * w[i], pts[i][1] + (dx / m) * w[i]]);
		B.push([pts[i][0] + (dy / m) * w[i], pts[i][1] - (dx / m) * w[i]]);
	}
	return [...A, ...B.reverse()];
};
const W_FRONT = [0.06, 0.045, 0.028, 0.02, 0.018];
const W_HIND = [0.085, 0.07, 0.035, 0.019, 0.018];

const tail2 = (P0: Pose): V2[] => limb(P0.tail, P0.tailW);

// silueta local completa (para la sombra)
const silhouette = (P0: Pose): {main: V2[]; parts: V2[][]} => {
	const parts: V2[][] = P0.legs.map((l) => limb(l.pts, l.front ? W_FRONT : W_HIND));
	parts.push(tail2(P0));
	const h = P0.head;
	const cr = Math.cos(P0.headRot);
	const sr = Math.sin(P0.headRot);
	const hp: V2[] = [[-0.06, 0.04], [-0.01, 0.16], [0.03, 0.06], [0.08, 0.05], [0.2, 0.0], [0.19, -0.03], [0.06, -0.06], [-0.06, -0.05]].map(([x, y]) => [h[0] + x * cr - y * sr, h[1] + x * sr + y * cr]);
	parts.push(hp);
	return {main: P0.body, parts};
};
export const coyoteCaster = (f: number): Caster | null => {
	const c = coyoteState(f);
	if (!c || c.fade < 0.05) return null;
	const P0 = pose(c, f);
	const sil = silhouette(P0);
	const fl = c.fs;
	const sc = (pts: V2[]): V2[] => pts.map(([x, y]) => [x * XS * Math.abs(fl), y]);
	return {pts: card(sc(sil.main), c.x, 0, c.z, Math.sign(fl)), more: sil.parts.map((p) => card(sc(p), c.x, 0, c.z, Math.sign(fl))), dens: 0.85 * c.fade};
};

// polvo de la sacudida (precalculado)
const DUST = Array.from({length: 26}, (_, i) => ({x: -0.35 + 0.75 * hash(i, 41), y: 0.25 + 0.3 * hash(i, 42), vx: (hash(i, 43) - 0.5) * 0.9, vy: 0.2 + 0.5 * hash(i, 44), t0: 678 + 14 * hash(i, 45), r: 0.004 + 0.006 * hash(i, 46)}));

export const coyoteEyes = (f: number): {p: V2; a: number; r: number}[] => {
	const c = coyoteState(f);
	if (!c) return [];
	return eyesOf(c, f, pose(c, f)).map((e) => ({p: e.p, a: e.a, r: e.r}));
};
export const drawCoyote = (g: Ctx, f: number, L: V3, I: number, blur: number, draw: Drawer) => {
	const c = coyoteState(f);
	if (!c || c.fade < 0.02) return;
	const P0 = pose(c, f);
	const s = pxPerM(c.z);
	const [ox, oy] = P(c.x, 0, c.z);
	const fs = c.fs;
	const tx: Tx = ([x, y]) => [ox + x * XS * fs * s, oy - y * s];
	const lit = clamp(lightAt(L, I, [c.x, 0.4, c.z - 0.2], [0, 0.3, -1]) * 1.15);
	const fogK = clamp((c.z - 3.4) / 1.2);
	const box: [number, number, number, number] = [ox - 0.85 * s, oy - 0.95 * s, 1.7 * s, 1.0 * s];
	draw(box, blur, {color: '#14282A', a: clamp(0.62 - lit * 0.62) + 0.55 * fogK}, (q) => {
		const res = q.getTransform().a;
		// sombra de contacto
		q.fillStyle = 'rgba(10,6,3,0.45)';
		q.beginPath();
		q.ellipse(ox, oy, 0.42 * s * Math.abs(fs), 0.04 * s, 0, 0, Math.PI * 2);
		q.fill();
		const T = (pts: V2[]) => pts.map(tx);
		const legFill = (l: Leg) => {
			const pts = T(limb(l.pts, l.front ? W_FRONT : W_HIND));
			path(q, pts);
			const k = l.far ? 0.55 : 1;
			const top = tx(l.pts[1]);
			const bot = tx(l.pts[4]);
			const gr = q.createLinearGradient(top[0], top[1], bot[0], bot[1]);
			gr.addColorStop(0, shade(FUR_SIDE, k));
			gr.addColorStop(0.55, shade(FUR_LEG, k));
			gr.addColorStop(1, shade('#6E5238', k));
			q.fillStyle = gr;
			q.fill();
			// pata (almohadilla) y línea frontal oscura de la pata delantera
			const pw = tx(l.pts[4]);
			q.fillStyle = shade('#3A2A1C', k);
			q.beginPath();
			q.ellipse(pw[0] - 0.012 * s * fs, pw[1] - 0.012 * s, 0.032 * s, 0.016 * s, 0, 0, Math.PI * 2);
			q.fill();
		};
		// 1 patas lejanas
		P0.legs.filter((l) => l.far).forEach(legFill);
		// 2 cola
		{
			const tp = T(tail2(P0));
			path(q, tp);
			const a = tx(P0.tail[0]);
			const b = tx(P0.tail[P0.tail.length - 1]);
			const gr = q.createLinearGradient(a[0], a[1], b[0], b[1]);
			gr.addColorStop(0, FUR_SIDE);
			gr.addColorStop(0.7, '#6A4F35');
			gr.addColorStop(0.86, '#2A1D12');
			gr.addColorStop(1, '#17100A');
			q.fillStyle = gr;
			q.fill();
			// mechones de la cola
			q.strokeStyle = 'rgba(150,120,86,0.35)';
			q.lineWidth = Math.max(1, 0.004 * s);
			for (let i = 1; i < P0.tail.length; i++) {
				const p = tx(P0.tail[i]);
				for (let k = 0; k < 4; k++) {
					const a2 = hash(i * 7 + k, 51) * 6.28;
					const l = P0.tailW[i] * s * (0.6 + 0.6 * hash(i * 7 + k, 52));
					q.beginPath();
					q.moveTo(p[0], p[1]);
					q.lineTo(p[0] + Math.cos(a2) * l, p[1] + Math.sin(a2) * l);
					q.stroke();
				}
			}
		}
		// 3 cuerpo
		const bp = T(P0.body);
		path(q, bp);
		{
			const yTop = oy - (P0.body[3][1] + 0.02) * s;
			const yBot = oy - (P0.body[10][1] - 0.03) * s;
			const gr = q.createLinearGradient(0, yTop, 0, yBot);
			gr.addColorStop(0, FUR_BACK);
			gr.addColorStop(0.35, FUR_SIDE);
			gr.addColorStop(0.78, '#B4946A');
			gr.addColorStop(1, FUR_BELLY);
			q.fillStyle = gr;
			q.fill();
		}
		q.save();
		path(q, bp);
		q.clip();
		// masas: anca y hombro (sombreado suave para que las patas nazcan de músculo, no de palitos)
		{
			const hb = P0.body[12][1];
			const an = tx([-0.27, hb + 0.1]);
			const g1 = q.createRadialGradient(an[0] - 0.03 * s, an[1] - 0.04 * s, 0.01 * s, an[0], an[1], 0.15 * s);
			g1.addColorStop(0, 'rgba(176,142,98,0.55)');
			g1.addColorStop(0.7, 'rgba(120,92,62,0.25)');
			g1.addColorStop(1, 'rgba(60,44,30,0)');
			q.fillStyle = g1;
			q.beginPath();
			q.ellipse(an[0], an[1], 0.12 * s * XS, 0.14 * s, 0, 0, Math.PI * 2);
			q.fill();
			const sh = tx([0.2, P0.body[8][1] + 0.1]);
			const g2 = q.createRadialGradient(sh[0], sh[1] - 0.03 * s, 0.01 * s, sh[0], sh[1], 0.12 * s);
			g2.addColorStop(0, 'rgba(176,142,98,0.45)');
			g2.addColorStop(1, 'rgba(60,44,30,0)');
			q.fillStyle = g2;
			q.beginPath();
			q.ellipse(sh[0], sh[1], 0.09 * s * XS, 0.12 * s, 0, 0, Math.PI * 2);
			q.fill();
		}
		// silla oscura del lomo (canoso) y hombro
		q.strokeStyle = 'rgba(38,27,17,0.55)';
		q.lineWidth = 0.07 * s;
		q.lineCap = 'round';
		path(q, T(P0.body.slice(1, 5).map(([x, y]) => [x, y - 0.03] as V2)), false);
		q.stroke();
		q.strokeStyle = 'rgba(190,160,118,0.25)';
		q.lineWidth = 0.02 * s;
		path(q, T([[0.12, P0.body[3][1] - 0.16], [0.22, P0.body[3][1] - 0.22], [0.3, P0.body[8][1] + 0.03]]), false);
		q.stroke();
		q.restore();
		// 4 patas cercanas
		P0.legs.filter((l) => !l.far).forEach(legFill);
		// 5 pelo de contorno (~180 trazos) — hacia atrás, más largo en el lomo, erizado en alerta/sacudida
		{
			const pts = P0.body;
			const n = pts.length;
			let idx = 0;
			for (let i = 0; i < n; i++) {
				const a = pts[i];
				const b = pts[(i + 1) % n];
				const segL = Math.hypot(b[0] - a[0], b[1] - a[1]);
				const cnt = Math.ceil(segL / 0.017);
				for (let k = 0; k < cnt; k++, idx++) {
					const u = k / cnt;
					const x = lerp(a[0], b[0], u);
					const y = lerp(a[1], b[1], u);
					const nx = (b[1] - a[1]) / (segL || 1);
					const ny = -(b[0] - a[0]) / (segL || 1);
					const topSide = ny > 0.2;
					const hk = 1 + 0.7 * c.shake + (topSide ? 0.5 * c.alert : 0);
					if (!topSide && hash(idx, 64) < 0.65) continue;
					const len = (0.008 + 0.012 * hash(idx, 61)) * (topSide ? 1.35 : 0.75) * hk;
					const jit = 0.5 * c.shake * Math.sin(idx * 1.3 + f * 2.1);
					let dx = nx * 0.45 - 0.85 + jit;
					let dy = ny * 0.45 + 0.08 * (hash(idx, 62) - 0.5);
					const m = Math.hypot(dx, dy) || 1;
					dx /= m;
					dy /= m;
					const p0 = tx([x - nx * 0.008 - dx * 0.006, y - ny * 0.008 - dy * 0.006]);
					const p1 = tx([x + dx * len, y + dy * len]);
					q.strokeStyle = topSide ? (hash(idx, 63) > 0.5 ? 'rgba(40,28,18,0.6)' : 'rgba(160,130,92,0.55)') : 'rgba(205,180,140,0.5)';
					q.lineWidth = Math.max(0.8, 0.0035 * s);
					q.beginPath();
					q.moveTo(p0[0], p0[1]);
					q.lineTo(p1[0], p1[1]);
					q.stroke();
				}
			}
		}
		// 6 cabeza
		drawHead(q, P0, tx, s, fs, c);
		// 7 luz: borde cálido del lado del foco (arriba-izquierda), frío del otro; degradado oscuro hacia las patas
		rimPass(q, 3.2 * res, 1.6 * res, '#FFB868', 0.6 * clamp(I) * (1 - fogK), 1.2 * res);
		rimPass(q, -2.6 * res, -0.5 * res, '#3A7A70', 0.45, 1.4 * res);
		q.save();
		q.globalCompositeOperation = 'source-atop';
		const gr = q.createLinearGradient(0, oy - 0.7 * s, 0, oy);
		gr.addColorStop(0, 'rgba(12,22,22,0)');
		gr.addColorStop(1, 'rgba(12,22,22,0.45)');
		q.fillStyle = gr;
		q.fillRect(box[0] - 40, box[1] - 40, box[2] + 80, box[3] + 80);
		if (fogK > 0) {
			q.fillStyle = `rgba(46,84,86,${0.6 * fogK})`;
			q.fillRect(box[0] - 40, box[1] - 40, box[2] + 80, box[3] + 80);
		}
		q.restore();
	});
	// polvo de la sacudida (aditivo, iluminado por el foco)
	if (f >= 678 && f < 712) {
		g.save();
		g.globalCompositeOperation = 'lighter';
		for (const p of DUST) {
			const t = (f - p.t0) / FPS;
			if (t < 0 || t > 0.8) continue;
			const x = p.x + p.vx * t;
			const y = p.y + p.vy * t - 0.6 * t * t;
			const [px, py] = [ox + x * fs * s, oy - y * s];
			g.fillStyle = `rgba(255,214,150,${0.3 * (1 - t / 0.8) * lit})`;
			g.beginPath();
			g.arc(px, py, Math.max(1, p.r * s), 0, Math.PI * 2);
			g.fill();
		}
		g.restore();
	}
	// eyeshine (sin desenfoque ni tinte: es lo único que brilla)
	for (const e of eyesOf(c, f, P0)) {
		if (e.a < 0.02) continue;
		glow(g, e.p[0], e.p[1], e.r * 9, '#C9D86A', 0.5 * e.a, 0.1);
		glow(g, e.p[0], e.p[1], e.r * 2.6, '#E2EE8C', 0.95 * e.a, 0.3);
		glow(g, e.p[0], e.p[1], e.r * 1.1, '#FFFBE0', e.a, 0.5);
		// raya anamórfica tenue
		g.save();
		g.globalCompositeOperation = 'lighter';
		const gr = g.createLinearGradient(e.p[0] - e.r * 14, 0, e.p[0] + e.r * 14, 0);
		gr.addColorStop(0, 'rgba(200,220,120,0)');
		gr.addColorStop(0.5, `rgba(220,236,150,${0.35 * e.a})`);
		gr.addColorStop(1, 'rgba(200,220,120,0)');
		g.fillStyle = gr;
		g.fillRect(e.p[0] - e.r * 14, e.p[1] - e.r * 0.25, e.r * 28, e.r * 0.5);
		g.restore();
	}
};
const shade = (hexc: string, k: number) => {
	const n = parseInt(hexc.slice(1), 16);
	return `rgb(${((n >> 16) & 255) * k | 0},${((n >> 8) & 255) * k | 0},${(n & 255) * k | 0})`;
};

// cabeza: perfil pintado con Bézier y vista de frente (mirada a la lente); giro rápido = compresión en x + fundido
const HP: V2[] = [
	[-0.07, 0.02], [-0.035, 0.058], [0.025, 0.056], [0.06, 0.04], [0.125, 0.017], [0.163, 0.006], [0.176, -0.012], [0.162, -0.03],
	[0.14, -0.036], [0.105, -0.047], [0.04, -0.055], [-0.03, -0.062], [-0.075, -0.035],
];
const HF: V2[] = [
	[0, 0.066], [0.045, 0.058], [0.068, 0.03], [0.088, -0.018], [0.06, -0.045], [0.032, -0.07], [0, -0.08], [-0.032, -0.07], [-0.06, -0.045], [-0.088, -0.018], [-0.068, 0.03], [-0.045, 0.058],
];
const headTx = (P0: Pose, tx: Tx, xs: number) => (p: V2): V2 => {
	const c = Math.cos(P0.headRot);
	const s2 = Math.sin(P0.headRot);
	const x = p[0] * xs;
	return tx([P0.head[0] + (x * c - p[1] * s2) * HS, P0.head[1] + (x * s2 + p[1] * c) * HS]);
};
const headMix = (P0: Pose, c: CoyoteSt) => {
	const w = clamp(c.look);
	const front = sm(clamp((w - 0.35) / 0.3));
	const wob = 1 + 0.25 * Math.sin(P0.yaw * 2) * (1 - w) * (c.shake > 0 ? 1 : 0);
	return {front, xsP: (1 - 0.5 * w) * wob, xsF: 0.6 + 0.4 * w};
};
const eyesOf = (c: CoyoteSt, f: number, P0: Pose) => {
	const s = pxPerM(c.z);
	const [ox, oy] = P(c.x, 0, c.z);
	const tx: Tx = ([x, y]) => [ox + x * XS * c.fs * s, oy - y * s];
	const hm = headMix(P0, c);
	const out: {p: V2; a: number; r: number}[] = [];
	const shine = c.look * (1 - seg(f, 760, 766)) + 0.2 * (1 - c.look) * clamp(c.alert);
	if (hm.front > 0.5) {
		const T = headTx(P0, tx, hm.xsF);
		for (const ex of [-0.032, 0.032]) out.push({p: T([ex, 0.016]), a: shine * c.fade, r: 0.011 * s});
	} else {
		const T = headTx(P0, tx, hm.xsP);
		out.push({p: T([0.04, 0.03]), a: shine * c.fade * 0.8, r: 0.01 * s});
	}
	return out;
};
const drawHead = (q: Ctx, P0: Pose, tx: Tx, s: number, fs: number, c: CoyoteSt) => {
	const hm = headMix(P0, c);
	const ear = P0.ear;
	if (hm.front < 0.999) {
		const T = headTx(P0, tx, hm.xsP);
		q.save();
		q.globalAlpha = 1 - hm.front;
		// oreja lejana
		const farE = (dx: number, dy: number): V2 => T([dx + 0.022, dy - 0.004]);
		path(q, [farE(-0.05, 0.045), farE(-0.04 - 0.03 * Math.sin(ear), 0.15), farE(0.0, 0.055)]);
		q.fillStyle = '#2E2216';
		q.fill();
		// cráneo + hocico
		const hp = HP.map(T);
		path(q, hp);
		const a = T([0, 0.06]);
		const b = T([0, -0.06]);
		const gr = q.createLinearGradient(a[0], a[1], b[0], b[1]);
		gr.addColorStop(0, '#5E4630');
		gr.addColorStop(0.42, '#94744E');
		gr.addColorStop(0.75, '#BFA27A');
		gr.addColorStop(1, '#DCC8A2');
		q.fillStyle = gr;
		q.fill();
		q.save();
		path(q, hp);
		q.clip();
		// gorguera clara de la mejilla y lomo oscuro del hocico
		const ck = T([-0.035, -0.032]);
		const g2 = q.createRadialGradient(ck[0], ck[1], 0, ck[0], ck[1], 0.06 * s * HS);
		g2.addColorStop(0, 'rgba(222,204,170,0.75)');
		g2.addColorStop(1, 'rgba(222,204,170,0)');
		q.fillStyle = g2;
		q.fillRect(ck[0] - 0.1 * s, ck[1] - 0.1 * s, 0.2 * s, 0.2 * s);
		q.strokeStyle = 'rgba(52,38,24,0.55)';
		q.lineWidth = 0.016 * s;
		path(q, [T([0.03, 0.058]), T([0.09, 0.034]), T([0.16, 0.012])], false);
		q.stroke();
		q.restore();
		// boca y nariz
		q.strokeStyle = 'rgba(28,18,10,0.7)';
		q.lineWidth = Math.max(1, 0.004 * s);
		path(q, [T([0.162, -0.03]), T([0.115, -0.039]), T([0.06, -0.046])], false);
		q.stroke();
		const np = T([0.168, -0.008]);
		q.fillStyle = '#140D07';
		q.beginPath();
		q.ellipse(np[0], np[1], 0.013 * s * HS, 0.011 * s * HS, 0, 0, Math.PI * 2);
		q.fill();
		// ojo: almendra oblicua con línea oscura hacia atrás
		const ep = T([0.04, 0.03]);
		q.strokeStyle = 'rgba(30,20,12,0.8)';
		q.lineWidth = Math.max(1, 0.004 * s);
		path(q, [T([0.05, 0.033]), T([0.03, 0.027]), T([0.005, 0.02])], false);
		q.stroke();
		// ceja oscura que baja hacia el hocico (mirada dura), iris ámbar, pupila
		q.strokeStyle = 'rgba(34,24,14,0.85)';
		q.lineWidth = Math.max(1, 0.006 * s);
		path(q, [T([0.018, 0.046]), T([0.045, 0.043]), T([0.062, 0.036])], false);
		q.stroke();
		q.fillStyle = '#B07A2A';
		q.beginPath();
		q.ellipse(ep[0], ep[1], 0.01 * s * HS * hm.xsP, 0.005 * s * HS, -0.35 * fs, 0, Math.PI * 2);
		q.fill();
		q.fillStyle = '#120C05';
		q.beginPath();
		q.ellipse(ep[0] + 0.0015 * s * fs, ep[1], 0.0042 * s * HS * hm.xsP, 0.0045 * s * HS, 0, 0, Math.PI * 2);
		q.fill();
		// oreja cercana con interior claro
		const e0 = T([-0.052, 0.045]);
		const e1 = T([-0.038 - 0.035 * Math.sin(ear), 0.155]);
		const e2 = T([0.002, 0.056]);
		path(q, [e0, e1, e2]);
		q.fillStyle = '#4A3624';
		q.fill();
		path(q, [T([-0.04, 0.055]), T([-0.034 - 0.03 * Math.sin(ear), 0.135]), T([-0.012, 0.06])]);
		q.fillStyle = 'rgba(200,164,122,0.7)';
		q.fill();
		q.restore();
	}
	if (hm.front > 0.001) {
		const T = headTx(P0, tx, hm.xsF);
		q.save();
		q.globalAlpha = hm.front;
		for (const sd of [-1, 1]) {
			path(q, [T([sd * 0.03, 0.05]), T([sd * (0.085 + 0.02 * Math.sin(ear)), 0.155]), T([sd * 0.075, 0.03])]);
			q.fillStyle = '#4A3624';
			q.fill();
			path(q, [T([sd * 0.04, 0.05]), T([sd * (0.079 + 0.018 * Math.sin(ear)), 0.135]), T([sd * 0.07, 0.04])]);
			q.fillStyle = 'rgba(205,170,128,0.8)';
			q.fill();
		}
		const hf = HF.map(T);
		path(q, hf);
		const a = T([0, 0.066]);
		const b = T([0, -0.08]);
		const gr = q.createLinearGradient(a[0], a[1], b[0], b[1]);
		gr.addColorStop(0, '#5E4630');
		gr.addColorStop(0.5, '#94744E');
		gr.addColorStop(1, '#B89A70');
		q.fillStyle = gr;
		q.fill();
		// hocico claro hacia la cámara, nariz, ojos
		path(q, [T([0, 0.012]), T([0.028, -0.02]), T([0.03, -0.055]), T([0, -0.074]), T([-0.03, -0.055]), T([-0.028, -0.02])]);
		q.fillStyle = '#D6C09A';
		q.fill();
		path(q, [T([-0.016, -0.036]), T([0.016, -0.036]), T([0, -0.05])]);
		q.fillStyle = '#140D07';
		q.fill();
		for (const ex of [-0.032, 0.032]) {
			const ep = T([ex, 0.016]);
			q.fillStyle = '#1E1A0A';
			q.beginPath();
			q.ellipse(ep[0], ep[1], 0.011 * s * HS * hm.xsF, 0.007 * s * HS, ex * 8 * fs, 0, Math.PI * 2);
			q.fill();
		}
		q.restore();
	}
};
