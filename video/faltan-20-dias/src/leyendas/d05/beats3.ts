// G3 · frames 868–1305: ¡te voltean! (eclipse del ala sobre la luna), la cabalgata, sin dueño (cámara del suelo),
// la moneda vuelve y CINCO (el oro se vuelve carbón; el 5 en relieve queda metal brillante; rótulo alrededor).
import {noise2D} from '@remotion/noise';
import {E, H, W, clamp, lerp, rgba} from '../../lib/util';
import type {PostOpts} from '../kit/post';
import {particles} from '../kit/fx';
import {glow, type Ctx} from '../kit/paint';
import {shake} from '../kit/stage';
import {emberEyes, riderFront} from './charro';
import {paintCoin} from './coin';
import {flameToward, lampK, paintFarol} from './farol';
import {lidState, paintLids} from './lids';
import {deg, pov, subsample} from './pov';
import {CIFRA, EV, FAROL, LEN, LUMBRE, LUNA, P, mixPost, susto} from './timeline';
import {paintFog, paintGround, paintHills, paintSky} from './world';

const FPS = 30;

// ---------- ¡TE VOLTEAN! 868–906 ----------
export const MOON_JUMP: [number, number, number] = [540, 640, 110];
export const paintJump = (g: Ctx, f: number): PostOpts => {
	const t = f / FPS;
	if (f < EV.land) {
		// latigazo de 180° (5 f): rayas horizontales con desenfoque por submuestras
		const u = (f - EV.grab) / 5;
		subsample(g, 8, (s) => {
			const x = (u + s * 0.2) * W * 2;
			const gr = g.createLinearGradient(0, 0, W, 0);
			gr.addColorStop(0, '#0d1416');
			gr.addColorStop(0.5, '#2a1a0c');
			gr.addColorStop(1, '#0d1416');
			g.fillStyle = gr;
			g.fillRect(0, 0, W, H);
			g.fillStyle = 'rgba(200,180,150,0.08)';
			for (let i = 0; i < 40; i++) g.fillRect(((i * 197 + x) % (W + 400)) - 200, (i * 53) % H, 400, 3);
		});
		return {...FAROL, ca: 4};
	}
	const d = f - EV.land;
	const sh = shake(t, EV.land / FPS, 40, 0.4, 22);
	const punch = d < 3 ? lerp(1, 1.18, E.out(d / 3)) : 1.18 - 0.04 * clamp((d - 3) / 20);
	g.save();
	g.translate(540 + sh.x, 960 + sh.y);
	g.scale(punch, punch);
	g.translate(-540, -960);
	const c = pov({pitch: deg(28), eyeH: 0.7});
	paintSky(g, c, t, {moon: MOON_JUMP});
	// el charro inclinado desde la silla; centro del ala = centro de la luna
	riderFront(g, 560, 2150, 1700, {t, eyes: 0, warm: 0.1});
	g.fillStyle = P.body;
	g.beginPath();
	g.ellipse(MOON_JUMP[0], MOON_JUMP[1] + 30, 330, 70, -0.05, 0, Math.PI * 2);
	g.fill();
	g.beginPath();
	g.ellipse(MOON_JUMP[0], MOON_JUMP[1] - 30, 120, 110, 0, Math.PI, 0);
	g.fill();
	emberEyes(g, MOON_JUMP[0], MOON_JUMP[1] + 110, 70, 40, clamp(d / 2), t, 500);
	// cabeza del caballo que se lanza desde abajo a la izquierda (stub)
	const hs = lerp(0.7, 1.15, clamp(d / 5));
	g.save();
	g.translate(260, 1500);
	g.scale(hs, hs);
	g.fillStyle = '#070504';
	g.beginPath();
	g.ellipse(0, 0, 240, 380, 0.5, 0, Math.PI * 2);
	g.fill();
	glow(g, 60, -120, 30, P.terra, 0.8);
	g.restore();
	// puño con la moneda atenazado por el guante (abajo a la derecha)
	g.fillStyle = '#0a0706';
	g.beginPath();
	g.ellipse(820, 1600, 170, 120, -0.4, 0, Math.PI * 2);
	g.fill();
	g.restore();
	paintLids(g, f, t, lidState(f));
	return susto({...FAROL, hatch: 0.3}, f, EV.land, 0.4);
};

// ---------- LA CABALGATA 906–1014 ----------
export const paintCabalgata = (g: Ctx, f: number): PostOpts => {
	const t = f / FPS;
	const stride = t * 1.6;
	const bob = Math.abs(Math.sin(stride * Math.PI)) * 26;
	const pitchJ = Math.sin(stride * Math.PI * 2) * deg(3);
	const c = pov({pitch: deg(4) + pitchJ, eyeH: 2.4, oy: bob - 13, z: t * 9});
	const moonX = 540 + Math.sin(stride * Math.PI) * 70;
	paintSky(g, c, t, {moon: [moonX, 470 + bob * 0.3, 90]});
	paintHills(g, c);
	paintGround(g, c, null);
	paintFog(g, c, t);
	// espalda del charro (45 % superior) con canesú bordado de plata
	const by = 380 + bob * 0.7;
	g.fillStyle = P.body;
	g.beginPath();
	g.moveTo(170, H);
	g.quadraticCurveTo(160, by + 300, 320, by + 120);
	g.lineTo(760, by + 120);
	g.quadraticCurveTo(920, by + 300, 910, H);
	g.closePath();
	g.fill();
	g.beginPath();
	g.ellipse(540, by + 40, 480, 70, Math.sin(stride * Math.PI * 2) * 0.03, 0, Math.PI * 2);
	g.fill();
	g.strokeStyle = rgba(P.silver, 0.4);
	g.lineWidth = 3;
	g.beginPath();
	g.moveTo(340, by + 220);
	g.quadraticCurveTo(540, by + 300, 740, by + 220);
	g.stroke();
	// puño con la moneda (abajo a la izquierda)
	g.fillStyle = '#24160b';
	g.beginPath();
	g.ellipse(260, 1640 + bob * 0.4, 110, 80, -0.3, 0, Math.PI * 2);
	g.fill();
	glow(g, 300, 1610 + bob * 0.4, 50, P.gold, 0.5);
	paintLids(g, f, t, lidState(f));
	return {...LUNA, hatch: 0.26};
};

// ---------- SIN DUEÑO 1014–1098 ----------
const groundCam = (f: number) => pov({pitch: deg(-6), eyeH: 0.12, zoom: lerp(1, 1.03, clamp((f - EV.fadeIn[0]) / 150)), z: 0});
const MOON_END: [number, number, number] = [540, 394, 100];
const groundScene = (g: Ctx, f: number) => {
	const t = f / FPS;
	const c = groundCam(f);
	paintSky(g, c, t, {moon: MOON_END});
	paintHills(g, c);
	paintFog(g, c, t);
	const k = lampK(t) * (0.8 + 0.2 * noise2D('d5sput', t * 12, 0));
	paintGround(g, c, {x: -0.25, z: 1.1, k: k * 0.9, r: 1.0});
	// farol caído de lado (stub: el farol del kit girado 90°)
	g.save();
	paintFarol(g, {hx: 470, hy: 1180, swing: deg(-88), sc: 0.75, t, dir: flameToward(0, -1, 60, 0.8), k, hand: false});
	g.restore();
	// sombrero de palma que termina de mecerse
	const rock = Math.exp(-(f - EV.fadeIn[0]) / 30) * Math.sin((f - EV.fadeIn[0]) * 0.35) * 0.25;
	g.save();
	g.translate(760, 1280);
	g.rotate(rock);
	g.fillStyle = '#5a4428';
	g.beginPath();
	g.ellipse(0, 0, 150, 34, 0, 0, Math.PI * 2);
	g.fill();
	g.fillStyle = '#4a3820';
	g.beginPath();
	g.ellipse(0, -30, 60, 40, 0, Math.PI, 0);
	g.fill();
	g.restore();
	// dos jinetes diminutos en la loma (stub)
	if (f < EV.fogSwallow + 20) {
		const u = clamp((f - EV.fadeIn[0]) / (EV.fogSwallow - EV.fadeIn[0]));
		const a = 1 - clamp((f - EV.fogSwallow) / 20);
		g.globalAlpha = a;
		riderFront(g, lerp(380, 700, u), 1040, 110, {t, eyes: 0});
		g.globalAlpha = 1;
	}
};
export const paintSinDueno = (g: Ctx, f: number): PostOpts => {
	if (f < EV.black[1]) {
		g.fillStyle = P.lid;
		g.fillRect(0, 0, W, H);
		return {...LUNA, bloom: 0, hatch: 0, grain: 0.1, vignette: 0.65, fade: 1};
	}
	groundScene(g, f);
	const fin = clamp((f - EV.fadeIn[0]) / (EV.fadeIn[1] - EV.fadeIn[0]));
	return {...LUNA, fade: 1 - E.inOut(fin)};
};

// ---------- LA MONEDA VUELVE 1098–1179 ----------
export const paintVuelve = (g: Ctx, f: number): PostOpts => {
	groundScene(g, f);
	const d = f - EV.coinDrop;
	const u = clamp(d / (EV.coinFace - EV.coinDrop));
	const x = lerp(700, 540, E.inOut(u)) + Math.sin(u * Math.PI * 2) * 80;
	const y = d < 12 ? lerp(200, 1150, (d / 12) ** 2) : lerp(1150, 1500, E.inOut(u));
	const r = lerp(30, 260, E.in(u));
	const spin = (1 - u) * 18 + 2;
	paintCoin(g, {x, y, r, squash: Math.abs(Math.cos(d / spin)) * (u > 0.97 ? 1 : 0.9) + (u > 0.97 ? 0.1 : 0), rot: 0, face: 'five', light: 0.8});
	return {...LUNA};
};

// ---------- CINCO 1179–1305 ----------
export const paintCinco = (g: Ctx, f: number): PostOpts => {
	const t = f / FPS;
	const d = f - EV.coinFace;
	const tilt = E.out(clamp(d / 27));
	// tierra oscura desenfocada
	g.fillStyle = P.brown;
	g.fillRect(0, 0, W, H);
	const gr = g.createRadialGradient(540, 925, 100, 540, 925, 900);
	gr.addColorStop(0, rgba(P.cempa, 0.18 * lampK(t)));
	gr.addColorStop(1, rgba('#0a0503', 0.9));
	g.fillStyle = gr;
	g.fillRect(0, 0, W, H);
	const r = lerp(260, 450, tilt);
	const charcoal = clamp((f - EV.charcoal) / 24);
	const crumble = clamp((f - EV.crumble[0]) / (EV.crumble[1] - EV.crumble[0]));
	g.save();
	g.globalAlpha = 1 - crumble * 0.999;
	paintCoin(g, {x: 540, y: lerp(1300, 925, tilt), r, squash: lerp(0.55, 1, tilt), rot: 0, face: 'five', charcoal, light: 1});
	g.restore();
	if (crumble > 0) {
		particles(g, {kind: 'ash', n: 60, t, seed: 5, x: 90, y: 475, w: 900, h: 900, alpha: 0.6 * (1 - crumble * 0.5)});
		// el 5 queda: metal brillante que atrapa el farol, donde yace (ranura del numeral)
		g.save();
		g.font = '790px Rye';
		g.textAlign = 'center';
		g.textBaseline = 'middle';
		const fg = g.createLinearGradient(0, 625, 0, 1225);
		fg.addColorStop(0, '#FFF1C9');
		fg.addColorStop(0.35, P.gold);
		fg.addColorStop(1, '#C47A1C');
		g.fillStyle = fg;
		g.globalAlpha = crumble;
		g.fillText('5', 540, 960);
		g.restore();
		glow(g, 540, 925, 380, P.cempa, 0.2 * crumble);
	}
	const dip = clamp((f - (LEN - 6)) / 6);
	const base = mixPost(LUMBRE, CIFRA, clamp((f - EV.lockup) / 20));
	return {...base, fade: dip};
};
