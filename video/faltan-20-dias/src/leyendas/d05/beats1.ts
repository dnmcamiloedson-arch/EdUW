// G1 · frames 0–474: gancho del farol, el camino, la sombra, el silencio, parpadeo 1 (el arco) y NO PARPADEES.
// road() pinta el camino POV completo (cielo → cerros → arco → niebla → suelo → sombras → utilería → farol → vaho → párpados).
import {noise2D} from '@remotion/noise';
import {E, H, W, clamp, lerp, ramp} from '../../lib/util';
import type {PostOpts} from '../kit/post';
import {springFollow, sampleF} from '../kit/rig';
import type {Ctx} from '../kit/paint';
import {riderFront2, vaho} from './rider';
import {glow} from '../kit/paint';
import {flameToward, lampK, paintFarol} from './farol';
import {lidState, paintLids} from './lids';
import {breathe, deg, horizonY, pov, proj, pxPerM, stepPhase, walkOffset, withRoll, type Pov} from './pov';
import {castShadows, riderFig, travellerFig} from './shadow';
import {EV, FAROL, LEN, mixPost} from './timeline';
import {ARCH_Z, paintArch, paintFog, paintGround, paintHills, paintProps, paintSky, type Lamp} from './world';

const FPS = 30;
const STRIDE = 0.73; // m por paso (1.3 m/s a 0.56 s)

// ---------- caminata y cámara (frames 0–510) ----------
export const walkPhase = (f: number) => stepPhase(Math.min(f, EV.freeze) / FPS, EV.walk[0] / FPS, 5.0, 6.0);
export const travellerZ = (f: number) => walkPhase(f) * STRIDE;

// posición del charro en el mundo según el tramo (para la brújula y las sombras)
export const charroAt = (f: number): {x: number; z: number; where: 'behind' | 'front' | 'right' | 'none'} => {
	const zt = travellerZ(f);
	if (f < 150) return {x: -1.0, z: zt - 12 + (f / 150) * 2, where: 'behind'};
	if (f < 288) {
		const u = clamp((f - 150) / (EV.shadowEats - 150));
		return {x: lerp(-1.0, -0.12, E.inOut(u)), z: zt - lerp(9.5, 2.7, E.inOut(u)), where: 'behind'};
	}
	if (f < EV.blink2[0] + 3) return {x: 0, z: ARCH_Z + 0.3, where: 'front'};
	if (f < EV.blink3[0] + 2) return {x: -0.3, z: zt + 14, where: 'front'};
	if (f < EV.blink4[0] + 2) return {x: 0.1, z: zt + 5, where: 'front'};
	if (f < EV.flameRight) return {x: 0, z: zt + 60, where: 'none'};
	return {x: 1.0, z: zt + 0.2, where: 'right'};
};

// objetivo de la llama (ángulo en pantalla, 0 = arriba) por tramo — suavizado con resorte
const flameTarget = (f: number) => {
	if (f < EV.hoof1) return 0;
	if (f < 288) return -0.55; // hacia la lente (abajo-izquierda: él está detrás)
	if (f < EV.blink2[0] + 3) return -0.32; // hacia el arco
	if (f < EV.blink3[0] + 2) return -0.6;
	if (f < EV.blink4[0] + 9) return -1.3; // casi horizontal hacia él
	if (f < EV.flameRight) return -0.1;
	if (f < EV.flameBack) return 1.35; // a la derecha
	return -0.6; // atrás otra vez
};
const flameAng = () => springFollow('d5flame', LEN, flameTarget, 0.22);
const flameBehind = (f: number) => (f >= EV.hoof1 && f < 288) || f >= EV.flameBack ? 1 : 0;

export const flameDirAt = (f: number) => {
	const ch = charroAt(f);
	const dist = ch.where === 'none' ? 60 : Math.abs(ch.z - travellerZ(f)) + Math.abs(ch.x);
	const d = flameToward(0, 0, dist, 1);
	// encendido: arde bajita y azulada, a los 6 f florece con resorte (ζ 0.5, 10 f)
	const flare = f < EV.flareUp ? 0.45 : 0.45 + 0.55 * springIn(f - EV.flareUp, 10, 0.5);
	const jump = f >= EV.scrape && f < EV.scrape + 20 ? 0.45 * Math.exp(-(f - EV.scrape) / 5) : 0; // la llama brinca con el casco
	return {...d, ang: sampleF(flameAng(), f), stretch: d.stretch + 0.3 * flameBehind(f) + jump, blue: Math.max(d.blue, f < EV.flareUp ? 0.8 : 0), size: d.size * flare * (1 + jump * 0.5)};
};
// respuesta al escalón de un resorte subamortiguado (0 → 1)
export const springIn = (d: number, frames: number, zeta: number) => {
	if (d <= 0) return 0;
	const w = (Math.PI * 2) / frames;
	const wd = w * Math.sqrt(1 - zeta * zeta);
	return 1 - Math.exp(-zeta * w * d) * (Math.cos(wd * d) + ((zeta * w) / wd) * Math.sin(wd * d));
};

export const camG1 = (f: number): Pov => {
	const t = f / FPS;
	const z = travellerZ(f);
	const ph = walkPhase(f);
	const walking = f >= EV.walk[0] && f < EV.freeze;
	const amp = lerp(12, 16, clamp((t - 5) / 1));
	const w = walking ? walkOffset(ph, amp) : {ox: 0, oy: 0, roll: 0, heel: 0};
	// mirada: −6° (gancho) → −5° (camino) → −18° (sombra, al suelo) → +2° (tras el parpadeo 1)
	let pitch = deg(-6);
	if (f >= EV.walk[0]) pitch = deg(lerp(-6, -5, clamp((f - 72) / 30)));
	if (f >= EV.lookDown[0]) pitch = deg(lerp(-5, -18, E.inOut(clamp((f - EV.lookDown[0]) / (EV.lookDown[1] - EV.lookDown[0])))));
	if (f >= EV.blink1[0] + 3) pitch = deg(2);
	let zoom = 1;
	if (f >= EV.blink1[0] + 3) zoom = lerp(1, 1.03, clamp((f - 291) / 78));
	if (f >= EV.blink2[0]) zoom = lerp(1.03, 1.08, clamp((f - 369) / 105));
	const still = !walking;
	const tr = noise2D('d5tr', t * 3, 0) * (still && f >= EV.freeze ? 2 : 0.6);
	let yaw = 0;
	if (f >= EV.pans[0] && f < EV.pans[1]) {
		const u = (f - EV.pans[0]) / 8;
		yaw = u < 1 ? deg(4) * Math.sin(E.inOut(u) * Math.PI) : -deg(4) * Math.sin(E.inOut(u - 1) * Math.PI);
	}
	return pov({z, pitch, zoom, yaw, roll: w.roll, ox: w.ox + tr, oy: w.oy + breathe(t, f >= EV.freeze ? 4 : 3) + tr});
};

// ---------- el camino completo ----------
export type RoadOpts = {
	charro?: 'none' | 'far' | 'mid' | 'near' | 'sub';
	riderShadow?: boolean;
	quiote?: {sway: number; rattle: number};
};

export const road = (g: Ctx, f: number, c: Pov, o: RoadOpts = {}) => {
	const t = f / FPS;
	const k = lampK(t);
	const dir = flameDirAt(f);
	const lamp: Lamp = {x: c.x + 0.32, z: c.z + 0.5, k: k * clamp(dir.size, 0.3, 1.1), r: 3.3 * clamp(dir.size, 0.4, 1)};
	const ch = charroAt(f);
	withRoll(g, c, () => {
		paintSky(g, c, t);
		paintHills(g, c);
		paintArch(g, c, t, o.charro === 'far' ? () => drawRider(g, c, f, ch.x, ch.z, 0.2) : undefined);
		paintFog(g, c, t);
		paintGround(g, c, lamp);
		// sombras lunares (hacia adelante)
		const figs = [travellerFig(c.x, c.z, {phase: walkPhase(f)})];
		if (o.riderShadow && ch.where === 'behind') {
			const gait = (f / FPS) * (f < 150 ? 1.6 : 2.6);
			figs.push(riderFig(ch.x, ch.z, {gait, nod: Math.abs(Math.sin(gait * Math.PI)), ear: f >= EV.ear && f < EV.ear + 12 ? Math.sin(((f - EV.ear) / 12) * Math.PI) : 0}));
		}
		castShadows(g, c, figs, {alpha: 0.55, blur: 9, nearFade: 0.6});
		const layers: {z: number; fn: () => void}[] = [];
		if (o.charro === 'mid' || o.charro === 'near' || o.charro === 'sub') layers.push({z: ch.z, fn: () => drawRider(g, c, f, ch.x, ch.z, o.charro === 'near' ? 0.6 : 0.3)});
		paintProps(g, c, t, {lamp, quiote: o.quiote, layers});
	});
	// farol en la mano derecha (pantalla): péndulo con patada en el talonazo
	const ph = walkPhase(f);
	const swing = deg(5) * Math.sin((t / 0.9) * Math.PI * 2) * (f < EV.walk[0] ? 0.3 : f < EV.freeze ? 1 : Math.exp(-(f - EV.freeze) / 40)) + deg(2) * walkOffset(ph, 1).heel;
	const hy = c.pitch < deg(-10) ? 1500 : 1430;
	paintFarol(g, {hx: 790 + c.ox * 0.3, hy: hy + c.oy * 0.5, swing, sc: 1.05, t, dir, k});
	// vaho cada 1.8 s (1.1 s con miedo)
	breath(g, f);
	paintLids(g, f, t, lidState(f));
};

const drawRider = (g: Ctx, c: Pov, f: number, x: number, z: number, warm: number) => {
	const [sx, sy, d] = proj(c, x, 0, z);
	if (d <= 0.2) return;
	const u = 3.0 * pxPerM(c, d);
	const t = f / FPS;
	const near = f >= EV.blink3[0] + 2;
	const mid = !near && f >= EV.blink2[0] + 2;
	// ladeo de cabeza: 6° en ~20 f con resorte (ζ 0.6), con curiosidad
	const tilt = near ? deg(6) * springIn(f - EV.blink3[0] - 6, 20, 0.6) : 0;
	// escarbado (plano MEDIO): sube 10 f, golpea 3 f en el frame 390
	const scrape = mid ? (f < EV.scrape - 10 ? 0 : f < EV.scrape ? E.inOut((f - EV.scrape + 10) / 10) : f < EV.scrape + 3 ? 1 - (f - EV.scrape) / 3 : 0) : 0;
	const ear = f % 97 > 84 ? Math.sin(((f % 97) - 84) / 13 * Math.PI) : 0;
	riderFront2(g, sx, sy, u, {f, t, eyes: near ? lerp(0.75, 1, clamp((f - EV.blink3[1]) / 12)) : mid ? 0.7 : 0.55, tilt, warm, scrape, headTurn: noise2D('d5ht', t * 0.3, 0) * 0.4, headDown: mid ? 1 : 0, ear});
	// polvo del escarbado
	const dd = f - EV.scrape;
	if (mid && dd >= 0 && dd < 26) {
		const hx = sx - 0.058 * u;
		for (let i = 0; i < 7; i++) {
			const a = (i / 7) * Math.PI - Math.PI;
			const r = (0.02 + 0.07 * E.out(dd / 26)) * u;
			glow(g, hx + Math.cos(a) * r * 1.6, sy - 0.01 * u + Math.sin(a) * r * 0.6, (0.03 + 0.05 * (dd / 26)) * u, '#8d7a62', 0.35 * (1 - dd / 26), 0.4);
		}
	}
};

export const breath = (g: Ctx, f: number) => {
	const t = f / FPS;
	if (f >= EV.holdBreath && f < 868) return;
	const per = f >= 150 && f < 288 ? 1.1 : 1.8;
	const n = Math.floor(t / per);
	const u = (t - n * per) / per;
	vaho(g, 540 + noise2D('d5br', n, 0) * 60, H + 60, 420, u, f >= EV.freeze && f < 288 ? 0.09 : 0.12, 0.5, n);
};

// ---------- paint por beat (G1) ----------
const post = (f: number, extra: PostOpts = {}): PostOpts => ({...mixPost(FAROL, {}, 0), exposure: 1 + (lampK(f / FPS) - 0.92) * 0.5, ...extra});

export const paintHook = (g: Ctx, f: number): PostOpts => {
	road(g, f, camG1(f));
	return post(f);
};
export const paintCamino = (g: Ctx, f: number): PostOpts => {
	const d = f - EV.quiote;
	const quiote = {sway: d > 0 ? deg(5) * Math.sin(d * 0.25) * Math.exp(-d / 30) : 0, rattle: d > 0 && d < 30 ? 1 - d / 30 : 0};
	road(g, f, camG1(f), {quiote});
	return post(f);
};
export const paintSombra = (g: Ctx, f: number): PostOpts => {
	road(g, f, camG1(f), {riderShadow: true});
	return post(f, {hatch: 0.28});
};
export const paintSilencio = (g: Ctx, f: number): PostOpts => {
	road(g, f, camG1(f), {riderShadow: true});
	return post(f, {hatch: 0.3});
};
export const paintArco = (g: Ctx, f: number): PostOpts => {
	const c = camG1(f);
	road(g, f, c, {charro: f >= EV.blink1[0] + 4 ? 'far' : 'none', riderShadow: f < EV.blink1[0] + 4});
	return post(f);
};
export const paintNoParp = (g: Ctx, f: number): PostOpts => {
	const c = camG1(f);
	road(g, f, c, {charro: f < EV.blink2[0] + 3 ? 'far' : f < EV.blink3[0] + 2 ? 'mid' : 'near'});
	return post(f, {vignette: lerp(0.55, 0.7, clamp((f - 369) / 105))});
};
void W;
void ramp;
void horizonY;
