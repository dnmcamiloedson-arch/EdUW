// Día 7 · el perro callejero al pie del muro (x≈1.05, z 3.95). Rig 2D de perfil (mira a la izquierda): columna
// pecho→cadera, cuello, cabeza con hocico y oreja (paradas ↔ aplastadas), patas de dos huesos con IK, cola verlet,
// pelo de contorno (~140 trazos) y erizado del lomo. Poses: dormido (respira) → alza la cabeza (8.4 s) → medio se
// levanta con el pelo erizado (9.6 s) → retrocede agachado, cola entre las patas (14 s) → huye al galope (24.2 s, G2).
import {C, E, FPS, clamp, hash, lerp, mixRGB} from '../../lib/util';
import {glow, type Ctx} from '../kit/paint';
import {ik2, smoothPath} from '../kit/rig';
import {card, lightAt, type Caster} from './light';
import {chainFrame, strand} from './sim';
import {rimPass} from './fermin';
import {P, pxPerM, seg, type V2, type V3} from './world';

type Drawer = (box: [number, number, number, number], blur: number, shade: {color: string; a: number}, fn: (q: Ctx) => void) => void;

export const DOG_X = 1.05;
export const DOG_Z = 3.95;

type Leg = [V2, V2, V2]; // hombro/rodilla → codo/corvejón → pata
type Pose = {
	cx: number; cy: number; hx: number; hy: number; r: number;
	headX: number; headY: number; headA: number; ear: number;
	ff: Leg; fn: Leg; bf: Leg; bn: Leg; // delantera lejana/cercana, trasera lejana/cercana
	haunch: [number, number, number, number]; // anca: cx, cy, rx, ry
	lie: number;
	hackle: number;
	tailDir: V2;
	tailStiff: number;
};
const SLEEP: Pose = {
	cx: -0.12, cy: 0.105, hx: 0.15, hy: 0.105, r: 0.092,
	headX: -0.3, headY: 0.068, headA: -0.1, ear: 0.55,
	ff: [[-0.12, 0.08], [-0.1, 0.025], [-0.32, 0.014]],
	fn: [[-0.11, 0.08], [-0.08, 0.022], [-0.29, 0.012]],
	bf: [[0.08, 0.05], [0.19, 0.02], [0.05, 0.012]],
	bn: [[0.09, 0.05], [0.21, 0.022], [0.07, 0.012]],
	haunch: [0.155, 0.094, 0.092, 0.078],
	lie: 1, hackle: 0, tailDir: [-0.9, -0.4], tailStiff: 0.05,
};
const HEADUP: Pose = {...SLEEP, cy: 0.112, headX: -0.31, headY: 0.215, headA: 0.1, ear: 1};
const HALF: Pose = {
	...SLEEP,
	cx: -0.11, cy: 0.215, hx: 0.15, hy: 0.12, r: 0.09,
	headX: -0.28, headY: 0.3, headA: -0.08, ear: 1,
	ff: [[-0.11, 0.18], [-0.09, 0.1], [-0.15, 0.0]],
	fn: [[-0.1, 0.18], [-0.08, 0.1], [-0.12, 0.0]],
	haunch: [0.15, 0.105, 0.092, 0.08],
	lie: 0.6, hackle: 1, tailDir: [0.6, -0.8], tailStiff: 0.2,
};
const CROUCH: Pose = {
	cx: -0.11, cy: 0.19, hx: 0.15, hy: 0.21, r: 0.088,
	headX: -0.29, headY: 0.17, headA: -0.18, ear: 1,
	ff: [[-0.11, 0.16], [-0.07, 0.085], [-0.13, 0.0]],
	fn: [[-0.1, 0.16], [-0.06, 0.085], [-0.09, 0.0]],
	bf: [[0.1, 0.115], [0.21, 0.065], [0.18, 0.0]],
	bn: [[0.11, 0.115], [0.23, 0.065], [0.21, 0.0]],
	haunch: [0.155, 0.185, 0.085, 0.082],
	lie: 0, hackle: 0.7, tailDir: [-0.35, -0.95], tailStiff: 0.3,
};
const RUN: Pose = {
	cx: -0.13, cy: 0.3, hx: 0.17, hy: 0.31, r: 0.092,
	headX: -0.34, headY: 0.36, headA: 0.0, ear: 1,
	ff: [[-0.12, 0.26], [-0.11, 0.15], [-0.14, 0.0]],
	fn: [[-0.11, 0.26], [-0.1, 0.15], [-0.12, 0.0]],
	bf: [[0.12, 0.2], [0.24, 0.09], [0.22, 0.0]],
	bn: [[0.13, 0.2], [0.26, 0.09], [0.24, 0.0]],
	haunch: [0.17, 0.29, 0.1, 0.1],
	lie: 0, hackle: 0.3, tailDir: [0.95, -0.2], tailStiff: 0.15,
};
const mixPose = (a: Pose, b: Pose, u: number): Pose => {
	const m = (x: number, y: number) => x + (y - x) * u;
	const mv = (x: V2, y: V2): V2 => [m(x[0], y[0]), m(x[1], y[1])];
	const ml = (x: Leg, y: Leg): Leg => [mv(x[0], y[0]), mv(x[1], y[1]), mv(x[2], y[2])];
	return {
		cx: m(a.cx, b.cx), cy: m(a.cy, b.cy), hx: m(a.hx, b.hx), hy: m(a.hy, b.hy), r: m(a.r, b.r),
		headX: m(a.headX, b.headX), headY: m(a.headY, b.headY), headA: m(a.headA, b.headA), ear: m(a.ear, b.ear),
		ff: ml(a.ff, b.ff), fn: ml(a.fn, b.fn), bf: ml(a.bf, b.bf), bn: ml(a.bn, b.bn),
		haunch: [m(a.haunch[0], b.haunch[0]), m(a.haunch[1], b.haunch[1]), m(a.haunch[2], b.haunch[2]), m(a.haunch[3], b.haunch[3])],
		lie: m(a.lie, b.lie), hackle: m(a.hackle, b.hackle), tailDir: mv(a.tailDir, b.tailDir), tailStiff: m(a.tailStiff, b.tailStiff),
	};
};

export const dogState = (f: number) => {
	const t = f / FPS;
	let x = DOG_X;
	let z = DOG_Z;
	let face = 1; // 1 mira a la izquierda
	let pose: Pose = SLEEP;
	let walk = 0;
	// dormido: respira; a 8.4 s alza la cabeza (anticipación: un sobresalto de 3 f), 9.6 s medio se levanta
	if (t >= 8.4) pose = mixPose(SLEEP, HEADUP, E.out(seg(t, 8.4, 8.85)));
	if (t >= 9.6) pose = mixPose(HEADUP, HALF, E.inOut(seg(t, 9.6, 10.3)));
	if (t >= 14) {
		pose = mixPose(HALF, CROUCH, E.inOut(seg(t, 14, 14.5)));
		const u = seg(t, 14.2, 16.6);
		x = lerp(DOG_X, DOG_X + 0.27, E.inOut(u));
		walk = u > 0 && u < 1 ? (t - 14.2) / 0.8 : 0;
	}
	if (t >= 24.2) {
		face = -1;
		pose = mixPose(CROUCH, RUN, E.out(seg(t, 24.2, 24.35)));
		x = lerp(DOG_X + 0.27, 3.4, E.in(seg(t, 24.25, 25.0)));
		z = lerp(DOG_Z, 3.7, seg(t, 24.2, 25.0));
		walk = (t - 24.2) / 0.32;
	}
	return {x, z, face, pose, walk, gone: t > 25.1};
};

type Geo = {body: V2[]; haunch: [number, number, number, number]; neck: V2[]; head: V2[]; ear: V2[]; legs: {pts: V2[]; far: boolean; hind: boolean}[]; eye: V2; back: [number, number]};
// geometría local (m, mirando a la izquierda, y arriba)
const dogGeo = (f: number, st: ReturnType<typeof dogState>): Geo => {
	const t = f / FPS;
	const p = st.pose;
	const breath = 1 + (p.lie > 0.5 ? 0.04 : 0.012) * Math.sin((2 * Math.PI * t) / 2.3);
	const r = p.r * breath;
	const {cx, cy, hx, hy} = p;
	const mx = (cx + hx) / 2;
	const my = (cy + hy) / 2;
	const body: V2[] = [
		[cx - 0.07, cy - r * 0.85],
		[cx - 0.112, cy - r * 0.05],
		[cx - 0.085, cy + r * 0.72],
		[cx - 0.015, cy + r * 1.04],
		[mx, my + r * 0.93],
		[hx + 0.02, hy + r * 1.0],
		[hx + 0.095, hy + r * 0.5],
		[hx + 0.1, hy - r * 0.35],
		[hx - 0.04, hy - r * 0.8],
		[mx, my - r * (p.lie > 0.5 ? 0.98 : 0.72)],
		[cx + 0.01, cy - r * 1.0],
	];
	const ca = Math.cos(p.headA);
	const sa = Math.sin(p.headA);
	const H = (u: number, v: number): V2 => [p.headX + u * ca - v * sa, p.headY + u * sa + v * ca];
	const head: V2[] = [H(0.055, 0.0), H(0.03, 0.05), H(-0.02, 0.058), H(-0.06, 0.038), H(-0.115, 0.024), H(-0.138, 0.01), H(-0.136, -0.01), H(-0.11, -0.026), H(-0.055, -0.042), H(0.025, -0.046)];
	const eu = p.ear;
	const ear: V2[] = [H(-0.005, 0.045), H(lerp(0.01, 0.085, eu), lerp(0.115, 0.055, eu)), H(lerp(0.04, 0.05, eu), lerp(0.042, 0.03, eu))];
	const neck: V2[] = [[cx - 0.06, cy + r * 0.98], H(0.005, 0.056), H(0.05, -0.045), [cx - 0.105, cy - r * 0.35]];
	const legs: {pts: V2[]; far: boolean; hind: boolean}[] = [];
	const ph = st.walk * Math.PI * 2;
	const run = st.face < 0;
	const leg = (L: Leg, k: number, far: boolean, hind: boolean) => {
		let pts: V2[] = [L[0], L[1], L[2]];
		if (st.walk > 0) {
			const a = ph + k * (run ? 0.9 : Math.PI / 2);
			const stride = run ? 0.15 : 0.055;
			const dx = Math.sin(a) * stride * (run ? 1 : -1);
			const dy = Math.max(0, Math.cos(a)) * (run ? 0.08 : 0.028);
			pts = [L[0], [L[1][0] + dx * 0.5, L[1][1] + dy * 0.6], [L[2][0] + dx, L[2][1] + dy]];
		}
		legs.push({pts, far, hind});
	};
	leg(p.ff, 0, true, false);
	leg(p.bf, 2, true, true);
	leg(p.fn, 1, false, false);
	leg(p.bn, 3, false, true);
	return {body, haunch: p.haunch, neck, head, ear, legs, eye: H(-0.05, 0.016), back: [cx - 0.02, hx + 0.02]};
};

const toWorld = (st: ReturnType<typeof dogState>, p: V2): V2 => [st.x + p[0] * st.face, p[1]];
const tailSpec = {
	n: 8,
	seg: 0.04,
	strands: 1,
	anchors: (f: number): V3[] => {
		const st = dogState(f);
		const p = st.pose;
		const w = toWorld(st, [p.hx + 0.095, p.hy + p.r * 0.35]);
		return [[w[0], w[1], st.z]];
	},
	rest: (f: number): V3 => {
		const st = dogState(f);
		const d = st.pose.tailDir;
		const m = Math.hypot(d[0], d[1]) || 1;
		return [(d[0] / m) * st.face, d[1] / m, 0];
	},
	gravity: 0.0109 * 0.25,
	damping: 0.85,
	stiff: 0.22,
	floor: 0.012,
	wind: (f: number, _s: number, i: number): V3 => [Math.sin(f * 0.07 + i * 0.5) * 0.00012, 0, 0],
};

const FUR_TOP = '#5A3A1C';
const FUR = '#B5844C';
const FUR_BELLY = '#DDBE8E';

export const drawDog = (g: Ctx, f: number, L: V3, I: number, draw: Drawer) => {
	const st = dogState(f);
	if (st.gone) return;
	const s = pxPerM(st.z);
	const [px, py] = P(st.x, 0, st.z);
	const lit = clamp(lightAt(L, I, [st.x, 0.3, st.z - 0.1], [0, 0, -1]));
	const G = dogGeo(f, st);
	const tail = strand(chainFrame('d07:dogtail', tailSpec, f), tailSpec.n, 0);
	draw([px - 0.62 * s, py - 0.62 * s, 1.24 * s, 0.68 * s], 0, {color: '#0E1A1A', a: 0}, (q) => {
		// sombra de contacto
		const gr0 = q.createRadialGradient(px, py, 0, px, py, 0.4 * s);
		gr0.addColorStop(0, 'rgba(12,7,3,0.55)');
		gr0.addColorStop(1, 'rgba(12,7,3,0)');
		q.fillStyle = gr0;
		q.beginPath();
		q.ellipse(px, py, 0.4 * s, 0.05 * s, 0, 0, Math.PI * 2);
		q.fill();
		q.save();
		q.translate(px, py);
		q.scale(s * st.face, -s);
		q.translate(-0, 0);
		const lc = (c: string, k: number) => {
			const v = mixRGB('#1A1410', c, k);
			return `rgb(${v[0] | 0},${v[1] | 0},${v[2] | 0})`;
		};
		const kk = 0.45 + 0.6 * lit;
		// patas: muslo/antebrazo grueso → caña delgada → pata
		const leg = (pts: V2[], far: boolean, hind: boolean) => {
			const col = lc(far ? '#6E4A2A' : FUR, kk * (far ? 0.78 : 1));
			q.strokeStyle = col;
			q.fillStyle = col;
			q.lineCap = 'round';
			q.lineJoin = 'round';
			const w = hind ? [0.045, 0.03] : [0.044, 0.03];
			for (let i = 0; i < 2; i++) {
				q.lineWidth = w[i];
				q.beginPath();
				q.moveTo(pts[i][0], pts[i][1]);
				q.lineTo(pts[i + 1][0], pts[i + 1][1]);
				q.stroke();
			}
			const pw = pts[2];
			q.beginPath();
			q.ellipse(pw[0] - 0.012, pw[1] + 0.008, 0.026, 0.012, 0, 0, Math.PI * 2);
			q.fill();
		};
		G.legs.filter((l) => l.far).forEach((l) => leg(l.pts, true, l.hind));
		// cola (local: deshace la transformación de mundo)
		q.save();
		q.scale(st.face, 1);
		q.beginPath();
		const tl = tail.map((p) => [(p[0] - st.x) * 1, p[1]] as V2);
		const Lp: V2[] = [];
		const Rp: V2[] = [];
		for (let i = 0; i < tl.length; i++) {
			const a = tl[Math.max(0, i - 1)];
			const b = tl[Math.min(tl.length - 1, i + 1)];
			let dx = b[0] - a[0];
			let dy = b[1] - a[1];
			const m = Math.hypot(dx, dy) || 1;
			dx /= m;
			dy /= m;
			const w = 0.028 * Math.sin(Math.PI * (0.25 + 0.75 * (i / (tl.length - 1)))) + 0.006;
			Lp.push([tl[i][0] - dy * w, tl[i][1] + dx * w]);
			Rp.push([tl[i][0] + dy * w, tl[i][1] - dx * w]);
		}
		smoothPath(q, Lp.concat(Rp.reverse()), true, 0.4);
		q.fillStyle = lc('#8A6036', kk);
		q.fill();
		q.restore();
		// cuerpo: lomo oscuro → flanco tostado → panza crema
		const gb = q.createLinearGradient(0, G.body[4][1] + 0.02, 0, G.body[9][1]);
		gb.addColorStop(0, lc(FUR_TOP, kk));
		gb.addColorStop(0.35, lc(FUR, kk));
		gb.addColorStop(1, lc(FUR_BELLY, kk * 0.85));
		q.fillStyle = gb;
		q.beginPath();
		smoothPath(q, G.body, true, 0.5);
		q.fill();
		q.beginPath();
		G.neck.forEach((p, i) => (i ? q.lineTo(p[0], p[1]) : q.moveTo(p[0], p[1])));
		q.closePath();
		q.fill();
		// anca (muslo trasero) con su sombra interior
		const [ax, ay, arx, ary] = G.haunch;
		const ga = q.createRadialGradient(ax - arx * 0.3, ay + ary * 0.4, 0, ax, ay, Math.max(arx, ary) * 1.1);
		ga.addColorStop(0, lc(FUR, kk * 0.98));
		ga.addColorStop(0.7, lc(FUR, kk * 0.9));
		ga.addColorStop(1, lc('#7A5230', kk));
		q.fillStyle = ga;
		q.beginPath();
		q.ellipse(ax, ay, arx, ary, 0, 0, Math.PI * 2);
		q.fill();
		// cabeza
		const gh = q.createLinearGradient(0, G.head[2][1], 0, G.head[8][1]);
		gh.addColorStop(0, lc('#7A5432', kk));
		gh.addColorStop(1, lc('#C99A62', kk));
		q.fillStyle = gh;
		q.beginPath();
		smoothPath(q, G.head, true, 0.45);
		q.fill();
		q.fillStyle = lc('#4A2E16', kk);
		q.beginPath();
		q.moveTo(G.ear[0][0], G.ear[0][1]);
		q.quadraticCurveTo(G.ear[1][0] - 0.01, G.ear[1][1], G.ear[1][0], G.ear[1][1]);
		q.lineTo(G.ear[2][0], G.ear[2][1]);
		q.closePath();
		q.fill();
		// nariz y ojo
		const nose = G.head[5];
		q.fillStyle = '#140C08';
		q.beginPath();
		q.ellipse(nose[0] + 0.006, nose[1] + 0.004, 0.012, 0.009, 0, 0, Math.PI * 2);
		q.fill();
		const sleeping = st.pose.lie > 0.95 && st.pose.headY < 0.1;
		q.strokeStyle = '#140C08';
		q.lineWidth = 0.004;
		q.beginPath();
		if (sleeping) {
			q.moveTo(G.eye[0] - 0.01, G.eye[1]);
			q.quadraticCurveTo(G.eye[0], G.eye[1] - 0.004, G.eye[0] + 0.01, G.eye[1]);
			q.stroke();
		} else {
			q.fillStyle = '#100804';
			q.ellipse(G.eye[0], G.eye[1], 0.008, 0.007, 0, 0, Math.PI * 2);
			q.fill();
		}
		// patas cercanas
		G.legs.filter((l) => !l.far).forEach((l) => leg(l.pts, false, l.hind));
		// pelo de contorno: solo lomo, pecho y anca (la panza queda lisa); el lomo se eriza con el miedo
		q.lineCap = 'round';
		const N = 120;
		const bp = G.body;
		for (let i = 0; i < N; i++) {
			const u = (i / N) * bp.length;
			const k = Math.floor(u);
			if (k >= 8) continue; // de la panza a la cruz: liso
			const fr = u - k;
			const a = bp[k % bp.length];
			const b = bp[(k + 1) % bp.length];
			const x = lerp(a[0], b[0], fr) + (hash(i, 79) - 0.5) * 0.004;
			const y = lerp(a[1], b[1], fr);
			const tx = b[0] - a[0];
			const ty = b[1] - a[1];
			const m = Math.hypot(tx, ty) || 1;
			const nx = ty / m;
			const ny = -tx / m;
			const onBack = k >= 3 && k <= 5;
			const len = 0.008 + 0.008 * hash(i, 77) + (onBack ? 0.03 * st.pose.hackle * (0.55 + 0.45 * Math.sin(i * 0.9)) : 0);
			const lean = onBack ? 0.35 : 0.8;
			q.globalAlpha = 0.75;
			q.strokeStyle = lc(onBack ? FUR_TOP : '#8E6338', kk * (0.85 + 0.3 * hash(i, 78)));
			q.lineWidth = 0.004;
			q.beginPath();
			q.moveTo(x - nx * 0.008, y - ny * 0.008);
			q.lineTo(x + nx * len + lean * len, y + ny * len);
			q.stroke();
		}
		q.globalAlpha = 1;
		// silla oscura del lomo (pelaje bicolor de perro callejero)
		q.save();
		q.beginPath();
		smoothPath(q, G.body, true, 0.5);
		q.clip();
		const gs = q.createLinearGradient(0, (st.pose.cy + st.pose.hy) / 2 + st.pose.r, 0, (st.pose.cy + st.pose.hy) / 2);
		gs.addColorStop(0, `rgba(40,24,10,${0.45})`);
		gs.addColorStop(1, 'rgba(40,24,10,0)');
		q.fillStyle = gs;
		q.fillRect(-1, -1, 2, 2);
		q.restore();
		q.restore();
		const res = q.getTransform().a;
		rimPass(q, 2.2 * res * st.face, 1 * res, '#FFB45E', 0.6 * clamp(I), 1 * res);
	});
	// brillo de ojos cuando está despierto y mira hacia el foco
	if (st.pose.headY > 0.15 && !st.gone && st.face > 0) {
		const e = toWorld(st, G.eye);
		const [ex, ey] = P(e[0], e[1], st.z - 0.03);
		glow(g, ex, ey, 9, '#D8E07A', 0.55 * lit, 0.3);
	}
};
// su sombra en el muro (está casi pegado a la pared): cuerpo + cabeza + patas
export const dogCaster = (f: number): Caster | null => {
	const st = dogState(f);
	if (st.gone) return null;
	const G = dogGeo(f, st);
	const zc = st.z - 0.04;
	const W = (pts: V2[]) => card(pts, st.x, 0, zc, st.face);
	const more: V3[][] = [W(G.neck), W(G.head), W(G.ear)];
	for (const l of G.legs) {
		const a = l.pts;
		const poly: V2[] = [];
		for (const p of a) poly.push([p[0] - 0.018, p[1]]);
		for (let i = a.length - 1; i >= 0; i--) poly.push([a[i][0] + 0.018, a[i][1]]);
		more.push(W(poly));
	}
	return {pts: W(G.body), more, dens: 0.82};
};
void C;
