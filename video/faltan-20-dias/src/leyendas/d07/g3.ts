// Día 7 · G3 (26–41 s): la sombra erguida que crece (B07), la caída a cuatro patas (B08) y la sombra del sombrero +
// caña colgados que se asienta en un 7 (B11). Todo es geometría de sombra: el cuerpo nunca entra a cuadro.
import {E, clamp, hash, lerp} from '../../lib/util';
import {penumbra, type Caster} from './light';
import {BULB0, WALL_Z, seg, wallX, wallY, type V2, type V3} from './world';

// ---------------------------------------------------------------- utilidades de contorno (metros, y arriba)
// extremidad gruesa: polilínea con anchos → polígono cerrado con remates redondeados
const limb = (pts: V2[], w: number[]): V2[] => {
	const n = pts.length;
	const L: V2[] = [];
	const R: V2[] = [];
	const nrm: V2[] = [];
	for (let i = 0; i < n; i++) {
		const a = pts[Math.max(0, i - 1)];
		const b = pts[Math.min(n - 1, i + 1)];
		let dx = b[0] - a[0];
		let dy = b[1] - a[1];
		const d = Math.hypot(dx, dy) || 1;
		dx /= d;
		dy /= d;
		nrm.push([-dy, dx]);
		L.push([pts[i][0] - dy * w[i] * 0.5, pts[i][1] + dx * w[i] * 0.5]);
		R.push([pts[i][0] + dy * w[i] * 0.5, pts[i][1] - dx * w[i] * 0.5]);
	}
	const cap = (c: V2, nv: V2, r: number, sgn: number): V2[] => {
		const out: V2[] = [];
		const a0 = Math.atan2(nv[1], nv[0]);
		for (let k = 1; k < 4; k++) {
			const a = a0 + sgn * (Math.PI * k) / 4;
			out.push([c[0] + Math.cos(a) * r, c[1] + Math.sin(a) * r]);
		}
		return out;
	};
	const end = cap(pts[n - 1], nrm[n - 1], w[n - 1] * 0.5, -1);
	const start = cap(pts[0], [-nrm[0][0], -nrm[0][1]], w[0] * 0.5, -1);
	return [...L, ...end, ...R.reverse(), ...start];
};
const off = (pts: V2[], dx: number, dy: number): V2[] => pts.map(([x, y]) => [x + dx, y + dy] as V2);

// ---------------------------------------------------------------- B07 · el «entre formas» (bípedo encorvado con cabeza de coyote)
// cabeza en ¾ hacia la derecha (relativa a su centro): orejas altas, hocico, gola de pelo
const HEAD: V2[] = [
	[-0.1, -0.11], [-0.135, -0.07], [-0.122, -0.04], [-0.15, -0.01], [-0.125, 0.03], [-0.135, 0.07],
	[-0.15, 0.17], [-0.152, 0.29], // oreja izq (punta)
	[-0.095, 0.2], [-0.045, 0.1], [0.0, 0.095], [0.04, 0.105],
	[0.085, 0.21], [0.128, 0.3], // oreja der (punta)
	[0.13, 0.17], [0.125, 0.06], [0.16, 0.025], [0.215, 0.0], [0.27, -0.022], [0.302, -0.038], [0.306, -0.062],
	[0.285, -0.076], [0.22, -0.083], [0.17, -0.1], [0.12, -0.13], [0.07, -0.135], [0.09, -0.165], [0.03, -0.15],
	[0.0, -0.19], [-0.04, -0.15], [-0.08, -0.17],
];
export const BI_EYES: V2[] = [
	[-0.016, 0.012],
	[0.058, 0.008],
];
const TWO_PI = Math.PI * 2;
const W0 = 798; // entra la sombra
const W1 = 914; // queda bajo el foco
// silueta local por frame (rise 0 = encorvado, 1 = erguido); devuelve partes + centro de la cabeza
const bipedParts = (f: number, rise: number, crouch = 0): {parts: V2[][]; hc: V2} => {
	const ph = (TWO_PI * (f - W0)) / 30; // ciclo de 1.0 s
	const lift = (s: number) => Math.max(0, Math.sin(ph + s)) ** 1.4;
	const bob = 0.028 * Math.abs(Math.sin(ph)) * (1 - crouch);
	const sway = 0.022 * Math.sin(ph) * (1 - crouch);
	const pel: V2 = [sway, 0.92 + bob - 0.5 * crouch];
	const k = lerp(0.7, 1, rise) * lerp(1, 0.32, crouch);
	const lean = 0.18 * crouch;
	const up = (u: number, v: number): V2 => [pel[0] + u + lean * v, pel[1] + v * k];
	// torso con joroba y pelo erizado en los hombros
	const torso: V2[] = [up(-0.15, 0), up(0.15, 0), up(0.18, 0.18), up(0.24, 0.42), up(0.29, 0.5)];
	for (let i = 0; i <= 8; i++) {
		const u = 0.27 - (0.54 * i) / 8;
		const v = 0.55 + 0.11 * Math.sin((Math.PI * i) / 8);
		const sp = hash(i, 71) * 0.05 * (i % 2);
		torso.push(up(u, v + sp));
	}
	torso.push(up(-0.29, 0.49), up(-0.24, 0.4), up(-0.19, 0.18));
	const hc: V2 = up(0.03 + 0.02 * crouch, 0.785);
	const head = off(HEAD, hc[0], hc[1] - 0.06 * crouch);
	// piernas: digitígradas; la que avanza hacia nosotros se acorta y sube
	const leg = (side: number, s: number): V2[] => {
		const l = lift(s) * (1 - crouch);
		const hip: V2 = [pel[0] + side * 0.09, pel[1]];
		const knee: V2 = [side * (0.15 + 0.05 * l) + pel[0] * 0.5, 0.5 + 0.1 * l - 0.12 * crouch];
		const hock: V2 = [side * (0.12 + 0.02 * l), 0.2 + 0.15 * l - 0.05 * crouch];
		const foot: V2 = [side * (0.15 + 0.02 * l), 0.03 + 0.17 * l];
		const toe: V2 = [side * 0.19, 0.0 + 0.17 * l];
		return limb([hip, knee, hock, foot, toe], [0.15, 0.11, 0.07, 0.06, 0.03]);
	};
	// brazos largos colgando, se mecen contra la pierna
	const arm = (side: number, s: number): V2[][] => {
		const sw = Math.sin(ph + s) * (1 - crouch);
		const sh = up(side * 0.25, 0.47);
		const el: V2 = [sh[0] + side * 0.07, sh[1] - 0.36 * lerp(1, 0.6, crouch) + 0.03 * sw];
		const wr: V2 = [el[0] - side * (0.02 + 0.03 * sw), el[1] - 0.36 + 0.07 * Math.max(0, sw) + 0.25 * crouch];
		const hand: V2 = [wr[0] - side * 0.01, wr[1] - 0.08];
		const out: V2[][] = [limb([sh, el, wr, hand], [0.1, 0.075, 0.06, 0.07])];
		for (let c = -1; c <= 1; c++) {
			const tip: V2 = [hand[0] + c * 0.03 - side * 0.01, hand[1] - 0.09 + Math.abs(c) * 0.02];
			out.push(limb([[hand[0] + c * 0.022, hand[1] + 0.01], tip], [0.022, 0.006]));
		}
		return out;
	};
	// cola peluda hacia la izquierda, con vaivén retrasado
	const tail: V2[] = [];
	const tw: number[] = [];
	for (let i = 0; i < 9; i++) {
		const s = i / 8;
		const wag = Math.sin(ph - 1.2 - s * 1.6) * 0.06 * s;
		tail.push([pel[0] - 0.08 - 0.42 * s + wag * 0.4, pel[1] - 0.08 - 0.48 * s * s + wag + 0.2 * crouch * s]);
		tw.push(lerp(0.1, 0.035, s) * (1 + 0.25 * Math.sin(s * 9 + i)));
	}
	return {parts: [torso, head, leg(-1, 0), leg(1, Math.PI), ...arm(-1, Math.PI), ...arm(1, 0), limb(tail, tw)], hc};
};

// recorrido: M de la sombra 2 → 7 (z = Lz + 3.7/M), centro de los ojos en la pared de sx 130 → 560
const bipedPlace = (f: number) => {
	const u = seg(f, W0 - 4, W1);
	const e = Math.pow(u, 1.25);
	const M = 2 * Math.pow(3.5, e);
	const z = BULB0[2] + (WALL_Z - BULB0[2]) / M;
	const sxT = lerp(130, 560, E.inOut(Math.min(1, u * 1.08)));
	const Wx = wallX(sxT);
	const x = BULB0[0] + (Wx - BULB0[0]) / M - 0.021;
	return {x, z, M, u};
};
const toCard = (pts: V2[], x: number, z: number): V3[] => pts.map(([u, v]) => [x + u, v, z] as V3);

export type BipedOut = {caster: Caster; eyes: V3[]; eyeA: number};
export const bipedShadow = (f: number, L: V3): BipedOut | null => {
	if (f < W0 - 4 || f >= 932) return null;
	const fw = Math.min(f, W1 - 1);
	const pl = bipedPlace(fw);
	const rise = E.inOut(seg(f, 812, 904));
	// B08: cae a cuatro patas (anticipación 915–917, caída 917–927)
	const crouch = f >= 915 ? E.in(seg(f, 915.5, 922)) * 1.04 - 0.05 * Math.sin(seg(f, 915, 918) * Math.PI) : 0;
	const {parts, hc} = bipedParts(fw + Math.max(0, f - W1 + 1) * 0.3, rise, clamp(crouch, -0.04, 1));
	const pts = toCard(parts[0], pl.x, pl.z);
	const more = parts.slice(1).map((p) => toCard(p, pl.x, pl.z));
	// la penumbra se afila conforme se acerca (dispositivo del tratamiento): 12 → 3 px
	const target = lerp(12, 3, E.inOut(pl.u));
	const soft = target - penumbra(L, pl.z);
	const eyes = BI_EYES.map(([u, v]) => [pl.x + hc[0] + u, hc[1] + v - 0.06 * clamp(crouch), pl.z] as V3);
	const eyeA = E.out(seg(f, 882, 886)) * (1 - seg(f, 917, 920)) * (f >= 897 && f <= 898 ? 0.15 : 1);
	return {caster: {pts, more, soft, dens: 0.94, alpha: 1 - seg(f, 919, 924)}, eyes, eyeA};
};

// ---------------------------------------------------------------- B11 · sombrero + caña colgados del tejabán → 7
// diseño en la pared (px de pantalla, foco en reposo): ala vista de canto (barra superior con puntas alzadas y la copa
// encima) y la caña colgando del ala con su curva enganchada (el asta diagonal). Se retro-proyecta a la tarjeta z 1.2.
export const HAT_Z = 1.2;
const backProject = (pt: V2, zc: number, L0: V3 = BULB0): V3 => {
	const w: V3 = [wallX(pt[0]), wallY(pt[1]), WALL_Z];
	const s = (zc - L0[2]) / (WALL_Z - L0[2]);
	return [L0[0] + (w[0] - L0[0]) * s, L0[1] + (w[1] - L0[1]) * s, zc];
};
// ala + copa (la copa queda en buena parte detrás de la cortina en reposo: se asoma con el vaivén)
const BRIM: V2[] = [
	[360, 470], [392, 488], [430, 500], [520, 500], [620, 504], [700, 508], [745, 504], [762, 516],
	[748, 560], [700, 588], [600, 592], [500, 600], [442, 614], [412, 648], [400, 700], [383, 692], [364, 642], [350, 580], [346, 520],
];
const CROWN: V2[] = [
	[470, 502], [476, 440], [492, 395], [522, 365], [560, 356], [598, 366], [624, 396], [638, 440], [644, 504],
];
// caña: gancho alrededor del ala (derecha) y asta que baja en diagonal hasta 1040
const caneRest = (): {pts: V2[]; w: number[]} => {
	const pts: V2[] = [];
	const w: number[] = [];
	for (let i = 0; i <= 6; i++) {
		const a = Math.PI * (1.1 - (1.0 * i) / 6);
		pts.push([718 + Math.cos(a) * 36, 520 - Math.sin(a) * 44]);
		w.push(34);
	}
	for (let i = 1; i <= 12; i++) {
		const s = i / 12;
		pts.push([lerp(754, 560, s) + Math.sin(s * Math.PI) * 18, lerp(530, 1036, s)]);
		w.push(lerp(70, 92, s) * (i === 6 ? 1.14 : 1) * (i === 12 ? 1.6 : 1));
	}
	return {pts, w};
};
const CANE = caneRest();
// la caña se mece sobre el gancho con retraso respecto al foco
const caneAngle = (t: number) => {
	const u = t - 34.6;
	if (u <= 0) return 0;
	return 0.16 * Math.exp(-u / 0.9) * Math.sin(TWO_PI * (u - 0.22) / 1.5) * clamp(u / 0.1);
};
export const hatCaneCaster = (t: number, alpha: number, soft: number): Caster => {
	const a = caneAngle(t);
	const piv: V2 = [718, 500];
	const c = Math.cos(a);
	const s = Math.sin(a);
	const rot = (p: V2): V2 => [piv[0] + (p[0] - piv[0]) * c - (p[1] - piv[1]) * s, piv[1] + (p[0] - piv[0]) * s + (p[1] - piv[1]) * c];
	const cane = limb(CANE.pts.map(rot), CANE.w).map((p) => backProject(p, HAT_Z));
	return {pts: BRIM.map((p) => backProject(p, HAT_Z)), more: [CROWN.map((p) => backProject(p, HAT_Z)), cane], alpha, soft};
};
