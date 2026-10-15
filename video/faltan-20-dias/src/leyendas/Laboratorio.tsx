// Escena de prueba del motor 2D de leyendas: capas por profundidad, niebla, luna, figura con velo simulado.
import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {C, E, FPS, H, W, hash, rgba} from '../lib/util';
import {flashlight, fogBand, glow, noiseTile, tinted, drawTiled, useFrameCanvas, type Ctx} from './kit/paint';
import {addCam, camPath, handheld, onPlane, type Cam} from './kit/stage';
import {clothAt, gust, simCloth, smoothPath, type V2} from './kit/rig';
import {Post} from './kit/post';
import {paintShape, vgrad} from './kit/shade';

const LEN = 240;

const hills = (ctx: Ctx, seed: number, y0: number, amp: number, w: number, color: string) => {
	ctx.fillStyle = color;
	ctx.beginPath();
	ctx.moveTo(-w, 3000);
	for (let x = -w; x <= w; x += 40) {
		const n = Math.sin(x * 0.0021 + seed) * 0.5 + Math.sin(x * 0.0057 + seed * 2) * 0.3 + (hash(Math.round(x / 40), seed) - 0.5) * 0.12;
		ctx.lineTo(x, y0 - amp * (0.5 + n));
	}
	ctx.lineTo(w, 3000);
	ctx.closePath();
	ctx.fill();
};
const tree = (ctx: Ctx, x: number, base: number, h: number, seed: number, color: string) => {
	ctx.fillStyle = color;
	ctx.beginPath();
	ctx.moveTo(x - h * 0.03, base);
	ctx.lineTo(x - h * 0.015, base - h * 0.55);
	ctx.lineTo(x + h * 0.015, base - h * 0.55);
	ctx.lineTo(x + h * 0.03, base);
	ctx.fill();
	for (let k = 0; k < 9; k++) {
		const yy = base - h * (0.35 + 0.07 * k);
		const ww = h * (0.32 - k * 0.03) * (0.8 + hash(k, seed) * 0.4);
		ctx.beginPath();
		ctx.ellipse(x + (hash(k, seed + 1) - 0.5) * h * 0.08, yy, ww, h * 0.09, 0, 0, Math.PI * 2);
		ctx.fill();
	}
};

const COLS = 9;
const ROWS = 16;
const SP = 22;
const figAnchor = (f: number): V2 => [0, -560 + Math.sin(f / 26) * 6];

export const Laboratorio: React.FC = () => {
	const f = useCurrentFrame();
	const t = f / FPS;
	const cv = useFrameCanvas();
	const veil = simCloth({
		key: 'lab-veil',
		frames: LEN + 2,
		cols: COLS,
		rows: ROWS,
		spacing: SP,
		rest: (c, r) => [(c - (COLS - 1) / 2) * SP * 1.3, figAnchor(0)[1] + r * SP],
		pin: (ff, c, r) => {
			if (r !== 0) return null;
			const a = figAnchor(ff);
			const ang = ((c / (COLS - 1)) * 2 - 1) * 1.15;
			return [a[0] + Math.sin(ang) * 70, a[1] - Math.cos(ang) * 50 + 40];
		},
		gravity: 0.32,
		damping: 0.975,
		wind: (ff, c, r) => {
			const w = gust(5, 0.09, 0.025)(ff, c + r * 3);
			return [w[0] * (r / ROWS), w[1]];
		},
	});
	const cam0: Cam = camPath(
		[
			{t: 0, cam: {x: 60, y: -120, z: -600}},
			{t: 8, cam: {x: -40, y: -170, z: 700}},
		],
		t,
		E.inOut,
	);
	const cam = addCam(cam0, handheld(t, 0.8));
	const g = cv.getContext('2d')!;
	g.setTransform(1, 0, 0, 1, 0, 0);
	g.globalCompositeOperation = 'source-over';
	g.globalAlpha = 1;
	g.filter = 'none';
	// cielo
	const sky = g.createLinearGradient(0, 0, 0, H);
	sky.addColorStop(0, '#05080f');
	sky.addColorStop(0.45, '#0d1a24');
	sky.addColorStop(0.62, '#1b2a33');
	sky.addColorStop(1, '#070806');
	g.fillStyle = sky;
	g.fillRect(0, 0, W, H);
	onPlane(g, cam, 20000, () => {
		glow(g, 420, -2200, 900, '#9fb8c8', 0.35);
		g.fillStyle = '#e8eef0';
		g.beginPath();
		g.arc(420, -2200, 120, 0, Math.PI * 2);
		g.fill();
		const cloud = tinted(noiseTile({seed: 11, period: 3, oct: 6, contrast: 2.2, bias: -0.15}), '#3a4c58', 'cloud');
		drawTiled(g, cloud, {x: -6000, y: -4200, w: 12000, h: 2600, scale: 6, ox: t * 40, alpha: 0.55, sy: 0.5});
	});
	onPlane(g, cam, 9000, () => hills(g, 1, 150, 900, 9000, '#0f1a1e'));
	fogBand(g, {y0: 900, y1: 1350, color: '#6f8a92', t, seed: 3, alpha: 0.45, speed: 10});
	onPlane(g, cam, 5000, () => {
		hills(g, 4, 260, 500, 6000, '#0b1316');
		for (let i = 0; i < 30; i++) tree(g, -4200 + i * 300 + hash(i, 9) * 160, 200 + hash(i, 8) * 60, 700 + hash(i, 7) * 500, i, '#0a1013');
	});
	fogBand(g, {y0: 1050, y1: 1500, color: '#8aa3a8', t, seed: 5, alpha: 0.5, speed: 16});
	onPlane(g, cam, 2600, () => {
		g.fillStyle = '#080c0d';
		g.fillRect(-4000, 230, 8000, 3000);
		for (let i = 0; i < 16; i++) {
			const x = -3000 + i * 420 + hash(i, 3) * 200;
			if (Math.abs(x) < 500) continue;
			tree(g, x, 260, 1500 + hash(i, 4) * 700, i + 50, '#05090a');
		}
	});
	// figura con velo: cuerpo con sombra interior y luz de luna de contorno; velo simulado translúcido
	onPlane(g, cam, 1900, (sc) => {
		const P = clothAt(veil, COLS, ROWS, f);
		const pts: V2[] = [];
		for (let r = 0; r < ROWS; r++) pts.push([P[r * COLS * 2], P[r * COLS * 2 + 1]]);
		for (let r = ROWS - 1; r >= 0; r--) pts.push([P[(r * COLS + COLS - 1) * 2], P[(r * COLS + COLS - 1) * 2 + 1]]);
		glow(g, 0, -300, 620, '#cfe0e6', 0.1);
		const body = (q: Ctx) => {
			q.moveTo(-70, -470);
			q.bezierCurveTo(-120, -200, -150, 60, -230, 260);
			q.bezierCurveTo(-80, 290, 80, 290, 230, 260);
			q.bezierCurveTo(150, 60, 120, -200, 70, -470);
			q.bezierCurveTo(40, -540, -40, -540, -70, -470);
		};
		paintShape(g, body, [-240, -560, 480, 860], {fill: vgrad('#c9d6d8', '#5b6a70', '#9fb0b4'), light: -Math.PI * 0.75, rim: {color: '#f4fbff', width: 14, alpha: 0.9}, shadow: {color: '#1d2a30', width: 120, alpha: 0.8, blur: 60}, texture: {seed: 21, scale: 0.6, alpha: 0.35}}, sc);
		paintShape(g, (q) => smoothPath(q, pts, true), [-260, -620, 520, 520], {fill: vgrad('rgba(236,244,246,0.85)', 'rgba(200,214,218,0.2)'), light: -Math.PI * 0.75, rim: {color: '#ffffff', width: 6, alpha: 0.7}, shadow: {color: 'rgba(40,60,70,0.6)', width: 50, alpha: 0.6}}, sc);
	});
	fogBand(g, {y0: 1300, y1: 1900, color: '#a9bcbe', t, seed: 9, alpha: 0.55, speed: 26});
	// pasto cercano
	onPlane(g, cam, 700, () => {
		g.fillStyle = '#020303';
		for (let i = 0; i < 140; i++) {
			const x = -1400 + i * 20;
			const h = 80 + hash(i, 2) * 160;
			const sway = Math.sin(t * 1.3 + i * 0.4) * 8;
			g.beginPath();
			g.moveTo(x - 4, 700);
			g.quadraticCurveTo(x + sway * 0.5, 700 - h * 0.5, x + sway, 700 - h);
			g.lineTo(x + 4, 700);
			g.fill();
		}
	});
	flashlight(g, {x: 560 + Math.sin(t * 0.7) * 120, y: 1150, r: 520, t, dark: 0.9});
	return (
		<AbsoluteFill style={{background: '#000'}}>
			<Post src={cv} t={t} o={{bloom: 0.7, halation: 0.2, ca: 2, grain: 0.08, vignette: 0.9, shadows: [0, 0.015, 0.03], highlights: [0.02, 0.01, 0], contrast: 1.08, hatch: 0.7, hatchScale: 6}} />
			<div style={{position: 'absolute', top: 300, width: W, textAlign: 'center', fontFamily: 'Alike', fontSize: 52, color: C.marfil, textShadow: `0 0 18px ${rgba(C.cempa, 0.4)}`}}>Prueba del motor</div>
		</AbsoluteFill>
	);
};
export const LAB_LEN = LEN;
