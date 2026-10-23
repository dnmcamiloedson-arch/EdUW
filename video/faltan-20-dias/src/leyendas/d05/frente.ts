// Parte media (frames 474–1014) con la misma estructura del primer tercio: el camino en primera persona
// y el Charro siempre DE FRENTE (riderFront2), que se acerca a cada parpadeo, te avienta su oro y se te lanza.
import {noise2D} from '@remotion/noise';
import {E, W, H, clamp, lerp} from '../../lib/util';
import type {PostOpts} from '../kit/post';
import {glow, type Ctx} from '../kit/paint';
import {shake} from '../kit/stage';
import {camG1, road, travellerZ} from './beats1';
import {paintCoin} from './coin';
import {lampK, paintRightHand} from './farol';
import {deg, proj, pxPerM, type Pov} from './pov';
import {EV, FAROL, mixPost, susto} from './timeline';

const FPS = 30;
const post = (f: number, extra: PostOpts = {}): PostOpts => ({...mixPost(FAROL, {}, 0), exposure: 1 + (lampK(f / FPS) - 0.92) * 0.5, ...extra});
const seg = (f: number, a: number, b: number) => E.inOut(clamp((f - a) / (b - a)));

// cámara: la del primer tercio, con la mirada que sube a su cara, baja al oro y regresa de golpe
const camF = (f: number): Pov => {
	const c = camG1(f);
	const t = f / FPS;
	let pitch = deg(2);
	let zoom = 1.08;
	if (f >= EV.tilt[0]) {
		pitch = deg(lerp(2, 9, seg(f, EV.tilt[0], EV.tilt[1])));
		zoom = lerp(1.08, 1.32, seg(f, EV.tilt[0], EV.tilt[1]));
	}
	if (f >= EV.deal) {
		pitch = deg(lerp(9, 5, seg(f, EV.deal, EV.toss)));
		zoom = lerp(1.32, 1.18, seg(f, EV.deal, EV.toss));
	}
	if (f >= EV.tiltDown[0]) {
		pitch = deg(lerp(5, -30, seg(f, EV.tiltDown[0], EV.tiltDown[1])));
		zoom = lerp(1.18, 1.0, seg(f, EV.tiltDown[0], EV.tiltDown[1]));
	}
	if (f >= EV.grab) {
		pitch = deg(lerp(-30, 13, E.out(clamp((f - EV.grab) / 5))));
		zoom = 0.92;
	}
	// miedo: temblor que crece mientras te ofrece el oro
	const fear = f >= EV.deal && f < EV.grab ? 1.5 + 2.5 * clamp((f - EV.deal) / 200) : 0;
	return {...c, pitch, zoom, ox: c.ox + noise2D('d5fx', t * 4, 0) * fear, oy: c.oy + noise2D('d5fy', 0, t * 4) * fear};
};

// ---------- la moneda en el mundo ----------
const COIN_LAND = {x: 0.12, z: 1.6}; // metros delante del viajero
const coinWorld = (f: number): {x: number; y: number; z: number; spin: number; flat: boolean} | null => {
	const zt = travellerZ(f);
	if (f < EV.toss || f >= EV.grab) return null;
	if (f < EV.coinHit) {
		const u = (f - EV.toss) / (EV.coinHit - EV.toss);
		const x = lerp(0.32, COIN_LAND.x, u);
		const z = zt + lerp(2.1, COIN_LAND.z, u);
		const y = lerp(1.55, 0.02, u) + 1.1 * Math.sin(u * Math.PI);
		return {x, y, z, spin: f * 0.55, flat: false};
	}
	// rebota, gira como trompo y se queda acostada
	const d = f - EV.coinHit;
	const u = clamp(d / (EV.coinFlat - EV.coinHit));
	const hop = d < 8 ? 0.12 * Math.sin((d / 8) * Math.PI) : 0;
	let y = 0.02 + hop;
	let x = COIN_LAND.x;
	let z = zt + COIN_LAND.z;
	if (f >= EV.lift[0]) {
		const l = E.inOut(clamp((f - EV.lift[0]) / (EV.lift[1] - EV.lift[0])));
		y += l * 0.5;
		x = lerp(x, -0.05, l);
		z = lerp(z, zt + 0.9, l);
	}
	return {x, y, z, spin: u < 1 ? f * 0.55 * (1 - u) : 0, flat: u >= 1};
};

const drawCoin = (g: Ctx, c: Pov, f: number) => {
	const w = coinWorld(f);
	if (!w) return;
	const [sx, sy, d] = proj(c, w.x, w.y, w.z);
	if (d <= 0.2) return;
	const r = 0.075 * pxPerM(c, d);
	const view = Math.min(1, Math.max(0.25, (c.eyeH - w.y) / Math.max(0.5, d)));
	const squash = w.flat ? view : Math.abs(Math.cos(w.spin)) * 0.9 + 0.06;
	glow(g, sx, sy, r * 3.2, '#F5C242', 0.28 * lampK(f / FPS));
	paintCoin(g, {x: sx, y: sy, r, squash, rot: 0, face: 'sun', light: 1});
};

// mano izquierda que baja por el oro (espejo de la mano del farol)
const drawReach = (g: Ctx, c: Pov, f: number) => {
	if (f < EV.touch - 22 || f >= EV.grab) return;
	const w = coinWorld(f);
	if (!w) return;
	const [sx, sy] = proj(c, w.x, w.y, w.z);
	const u = E.inOut(clamp((f - (EV.touch - 22)) / 22));
	const hx = lerp(150, sx - 40, u);
	const hy = lerp(H + 260, sy - 70, u);
	g.save();
	g.translate(W, 0);
	g.scale(-1, 1);
	paintRightHand(g, W - hx, hy, 0.95, lampK(f / FPS), 0);
	g.restore();
};

// ---------- VACÍO 474–510: parpadeo tartamudo; al abrir ya está ahí, de frente ----------
export const paintVacioF = (g: Ctx, f: number): PostOpts => {
	road(g, f, camF(f), {charro: 'near'});
	const sub = f >= EV.sub[0] && f < EV.sub[1];
	return post(f, {vignette: sub ? 0.85 : 0.7});
};

// ---------- A TU LADO 510–654: se te acerca; la mirada sube a sus ojos; título ----------
export const paintColumnaF = (g: Ctx, f: number): PostOpts => {
	road(g, f, camF(f), {charro: 'near'});
	return post(f, {vignette: 0.72, hatch: lerp(0.15, 0.3, seg(f, EV.tilt[0], EV.eyesOn))});
};

// ---------- EL TRATO 654–780: te avienta su oro ----------
export const paintTratoF = (g: Ctx, f: number): PostOpts => {
	const c = camF(f);
	road(g, f, c, {charro: 'near', extra: (cc) => drawCoin(g, cc, f)});
	return post(f, {vignette: 0.74, hatch: 0.25});
};

// ---------- NO RECOJAS SU ORO 780–868: miras al suelo, el oro brilla, tu mano baja ----------
export const paintRecogeF = (g: Ctx, f: number): PostOpts => {
	const c = camF(f);
	road(g, f, c, {charro: 'near', extra: (cc) => drawCoin(g, cc, f)});
	drawReach(g, c, f);
	return post(f, {vignette: lerp(0.74, 0.86, clamp((f - EV.holdBreath) / 40)), hatch: 0.28});
};

// ---------- ¡SE TE LANZA! 868–906 ----------
export const paintJumpF = (g: Ctx, f: number): PostOpts => {
	const t = f / FPS;
	const d = f - EV.grab;
	const sh = shake(t, EV.grab / FPS, 46, 0.5, 22);
	const c = camF(f);
	g.save();
	g.translate(sh.x, sh.y);
	road(g, f, {...c, roll: c.roll + deg(3) * Math.exp(-d / 8) * Math.sin(d)}, {charro: 'near'});
	g.restore();
	return susto({...FAROL, hatch: 0.3}, f, EV.grab, 0.4);
};

// ---------- LA CABALGATA 906–1014: te lleva; el camino corre, él sigue de frente ----------
export const paintCabalgataF = (g: Ctx, f: number): PostOpts => {
	const t = f / FPS;
	const u = (f - EV.gallop[0]) / FPS;
	const c0 = camG1(f);
	const z = travellerZ(f) + 3.6 * u * u * 0.5 + 0.8 * u;
	const gait = Math.sin(t * Math.PI * 2 * 2.4);
	const sh = shake(t, EV.gallop[0] / FPS, 14, 4, 12);
	const c: Pov = {...c0, z, pitch: deg(9 + 2 * gait), zoom: 0.98, ox: sh.x, oy: sh.y + gait * 22, roll: deg(2.2) * Math.sin(t * Math.PI * 2 * 1.2)};
	road(g, f, c, {charro: 'near', ch: {x: 0.05, z: z + 2.4}, lift: 0.07 * Math.abs(gait)});
	return post(f, {vignette: 0.8, hatch: 0.3, ca: 2.5});
};
