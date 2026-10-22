// G2 · frames 474–868: vacío (parpadeo tartamudo + subliminal), a tu lado (barrido + columna + título),
// el trato (guante, moneda) y no recojas su oro (suelo, sombra del jinete, mano izquierda).
import {noise2D} from '@remotion/noise';
import {E, H, W, clamp, lerp, rgba} from '../../lib/util';
import type {PostOpts} from '../kit/post';
import {cached, glow, makeCanvas, type Ctx} from '../kit/paint';
import {resetCtx} from '../kit/scene';
import {breath, camG1, flameDirAt, road} from './beats1';
import {emberEyes, riderFront} from './charro';
import {paintCoin} from './coin';
import {lampK, paintFarol} from './farol';
import {lidState, paintLids} from './lids';
import {deg, pov, subsample} from './pov';
import {castShadows, riderFig, travellerFig} from './shadow';
import {EV, FAROL, P, ROTULO_ADD} from './timeline';
import {paintGround, paintSky} from './world';

const FPS = 30;
const post = (f: number, extra: PostOpts = {}): PostOpts => ({...FAROL, exposure: 1 + (lampK(f / FPS) - 0.92) * 0.5, ...extra});

// ---------- VACÍO 474–510 ----------
export const paintVacio = (g: Ctx, f: number): PostOpts => {
	const c = camG1(f);
	if (f >= EV.sub[0] && f < EV.sub[1]) {
		// subliminal: él a 1.5 m llena el cuadro, oscuro, ojos ardiendo
		road(g, f, c, {});
		g.fillStyle = 'rgba(4,2,1,0.55)';
		g.fillRect(0, 0, W, H);
		riderFront(g, 540, 2900, 3600, {t: f / FPS, eyes: 1, warm: 0.3});
		paintLids(g, f, f / FPS, lidState(f));
		return post(f, {vignette: 0.85});
	}
	road(g, f, c, {});
	return post(f);
};

// ---------- A TU LADO 510–654: barrido a la derecha + columna del costado ----------
export const COLUMN_H = 3600;
const columnScroll = (f: number) => {
	// tilt −10° → +38° (17.9–20.0 s) sobre la columna: 0 = abajo (estribo) … 1 = arriba (ala)
	return E.inOut(clamp((f - EV.tilt[0]) / (EV.tilt[1] - EV.tilt[0])));
};
const paintColumn = (g: Ctx, f: number, yOff: number) => {
	const t = f / FPS;
	const top = -COLUMN_H + H + yOff; // y de pantalla del borde superior de la columna
	paintSky(g, pov({pitch: deg(30)}), t);
	// costado del caballo (pared negra) con rim frío a la derecha y barrido cálido del farol
	const flank = g.createLinearGradient(0, 0, W, 0);
	flank.addColorStop(0, '#060403');
	flank.addColorStop(0.75, P.body);
	flank.addColorStop(1, '#1d2c2e');
	const breathK = 1 + 0.015 * Math.sin(t * Math.PI * 2 * 0.4);
	g.fillStyle = flank;
	g.fillRect(-20, top + 2200 * breathK, W + 40, COLUMN_H);
	glow(g, 300 + Math.sin(t * 1.3) * 120, top + 3000, 600, P.cempa, 0.18 * lampK(t), 0.3);
	// pierna del charro con 9 botones de plata (destellan en secuencia con el tilt)
	g.fillStyle = '#080504';
	g.fillRect(360, top + 1500, 220, 1500);
	for (let i = 0; i < 9; i++) {
		const by = top + 2900 - i * 150;
		const on = clamp(1 - Math.abs((columnScroll(f) * 9 - i) / 0.9));
		g.fillStyle = rgba(P.silver, 0.4 + 0.6 * on);
		g.beginPath();
		g.arc(560, by, 9, 0, Math.PI * 2);
		g.fill();
		if (on > 0.2) glow(g, 560, by, 60 * on, P.silver, 0.6 * on);
	}
	// silla, chaqueta, ala con el vacío
	g.fillStyle = '#0a0705';
	g.fillRect(180, top + 900, 700, 650);
	g.beginPath();
	g.ellipse(560, top + 560, 520, 90, -0.08, 0, Math.PI * 2);
	g.fill();
	g.fillStyle = '#000';
	g.beginPath();
	g.ellipse(560, top + 640, 230, 110, 0, 0, Math.PI * 2);
	g.fill();
	const eyes = clamp((f - EV.eyesOn) / 12);
	emberEyes(g, 560, top + 660, 90, 34, eyes, t);
};

export const paintColumna = (g: Ctx, f: number): PostOpts => {
	const t = f / FPS;
	if (f < EV.whipR[1]) {
		// barrido de 90° con desenfoque por submuestras: corte escondido entre dos puestas
		const u = E.inOut(clamp((f - EV.whipR[0]) / (EV.whipR[1] - EV.whipR[0])));
		// cada puesta se pinta UNA vez en su lienzo y se desplaza 8 veces (barato)
		const A = cached('d5whipA', () => makeCanvas(W, H));
		const Bc = cached('d5whipB', () => makeCanvas(W, H));
		const ga = A.getContext('2d')!;
		const gb = Bc.getContext('2d')!;
		resetCtx(ga);
		resetCtx(gb);
		road(ga, f, camG1(f), {});
		paintColumn(gb, f, 0);
		g.fillStyle = '#000';
		g.fillRect(0, 0, W, H);
		subsample(g, 8, (s2) => {
			const uu = clamp(u + (s2 - 0.5) * 0.14);
			const dx = uu * W * 1.6;
			g.drawImage(A, -dx, 0);
			g.drawImage(Bc, W * 1.6 - dx, 0);
		});
		return post(f, {ca: 3});
	}
	const yOff = columnScroll(f) * (COLUMN_H - H);
	paintColumn(g, f, yOff);
	const titleK = clamp((f - EV.title[0]) / 10) * (1 - clamp((f - EV.title[1]) / 16));
	if (titleK > 0) {
		const gr = g.createRadialGradient(540, 1190, 40, 540, 1190, 620);
		gr.addColorStop(0, rgba(P.brown, 0.55 * titleK));
		gr.addColorStop(1, rgba(P.brown, 0));
		g.fillStyle = gr;
		g.fillRect(0, 0, W, H);
	}
	void t;
	return {...post(f), ...(titleK > 0 ? ROTULO_ADD : {})};
};

// ---------- EL TRATO 654–780 ----------
export const paintTrato = (g: Ctx, f: number): PostOpts => {
	const t = f / FPS;
	const c = pov({pitch: deg(30), eyeH: 1.62});
	paintSky(g, c, t);
	// el charro (se suaviza con el rack focus)
	riderFront(g, 520, 2350, 2300, {t, eyes: 1, warm: 0.25});
	// guante que baja con la pila de monedas (stub: elipse + pila)
	const u = E.inOut(clamp((f - EV.deal) / 60));
	const gx = lerp(820, 760, u);
	const gy = lerp(620, 960, u);
	g.fillStyle = '#0a0706';
	g.beginPath();
	g.ellipse(gx, gy, 120, 70, -0.3, 0, Math.PI * 2);
	g.fill();
	for (let i = 0; i < 5; i++) paintCoin(g, {x: gx - 10, y: gy - 30 - i * 8, r: 34, squash: 0.35, rot: 0, face: 'sun', light: 0.6});
	// lanzamiento (stub): sube hacia la lente, cae, rueda
	if (f >= EV.toss) {
		const d = f - EV.toss;
		const y = d < 18 ? gy - 40 - d * 16 : lerp(gy - 330, 1900, clamp((d - 18) / 15));
		paintCoin(g, {x: lerp(gx, 600, clamp(d / 30)), y, r: d < 18 ? 34 + d * 4 : 100, squash: Math.abs(Math.cos(d * 0.5)), rot: 0, face: 'sun'});
	}
	return post(f, {vignette: 0.6});
};

// ---------- NO RECOJAS SU ORO 780–868 ----------
export const paintRecoge = (g: Ctx, f: number): PostOpts => {
	const t = f / FPS;
	const crouch = E.inOut(clamp((f - 780) / 60));
	const c = pov({pitch: deg(-55), eyeH: lerp(1.62, 0.7, crouch), zoom: lerp(1, 1.12, clamp((f - 780) / 88)), z: 0});
	const dir = flameDirAt(f);
	const k = lampK(t);
	const poolR = lerp(1.5, 0.9, clamp((f - EV.flameBack) / 30));
	paintGround(g, c, {x: 0.3, z: 0.45, k, r: poolR});
	// sombra lunar del jinete que avanza desde el borde inferior sobre la nuestra
	const adv = E.inOut(clamp((f - EV.flameBack) / 40));
	castShadows(g, c, [travellerFig(0, -0.2, {crouch}), riderFig(-0.3, lerp(-6.5, -3.4, adv), {lean: f > 840 ? 0.15 * Math.sin((f - 840) / 28 * Math.PI * 0.5) : 0})], {alpha: 0.65});
	// la moneda en el charco del farol
	const cx = 540;
	const cy = 1180;
	const shade = clamp((f - EV.shadowOnCoin) / 10);
	const lift = f >= EV.lift[0] ? E.out(clamp((f - EV.lift[0]) / 28)) * 20 : 0;
	paintCoin(g, {x: cx, y: cy - lift, r: 70, squash: 0.62, rot: 0.2, face: 'sun', light: 1 - shade * 0.85});
	// mano izquierda (stub) que entra desde abajo a la izquierda
	const reach = E.inOut(clamp((f - 800) / 37));
	const hx = lerp(200, cx - 40, reach) + noise2D('d5lh', t * 8, 0) * lerp(2, 4, reach);
	const hy = lerp(1950, cy + 40, reach) - lift;
	g.fillStyle = '#2a1a0e';
	g.beginPath();
	g.ellipse(hx, hy, 70, 46, -0.6, 0, Math.PI * 2);
	g.fill();
	g.fillStyle = rgba(P.sand, 0.4);
	g.fillRect(hx - 160, hy + 30, 120, 300);
	paintFarol(g, {hx: 900, hy: 1560, swing: deg(2), sc: 0.9, t, dir, k, hand: true});
	breath(g, f);
	return post(f, {hatch: 0.3});
};
void paintLids;
void lidState;
