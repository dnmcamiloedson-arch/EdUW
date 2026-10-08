import React from 'react';
import {noise2D} from '@remotion/noise';
import {C, H, W, clamp, curl, fbm, hash, mixRGB, rgba} from '../lib/util';
import {useCanvasDraw, accumulate} from './core';

// ---------- Pétalo de cempasúchil (abanico con borde rizado) ----------
let PETAL: Path2D | null = null;
const petalPath = () => {
	if (PETAL) return PETAL;
	PETAL = new Path2D(
		'M 0 0 C -0.36 -0.12 -0.6 -0.58 -0.44 -0.9 Q -0.33 -1.05 -0.2 -0.95 Q -0.1 -1.08 0.02 -0.97 Q 0.14 -1.09 0.25 -0.95 Q 0.37 -1.04 0.46 -0.87 C 0.58 -0.56 0.35 -0.12 0 0 Z',
	);
	return PETAL;
};

export type PetalLight = {x: number; y: number; sigma: number; L: number; ambient?: number};

export const drawPetal = (
	ctx: CanvasRenderingContext2D,
	x: number,
	y: number,
	size: number,
	rot: number,
	fx: number,
	fy: number,
	lit: number,
	hueT: number,
) => {
	const front = fx >= 0;
	const facing = 0.45 + 0.55 * Math.abs(fx);
	const baseCol = front ? (hueT < 0.6 ? C.cempa : C.flama) : C.arena;
	const col = mixRGB(C.ink, baseCol, clamp(lit * facing));
	const edge = mixRGB(C.ink, C.terracota, clamp(lit * 0.9));
	ctx.save();
	ctx.translate(x, y);
	ctx.rotate(rot);
	ctx.scale(size * (Math.abs(fx) < 0.1 ? Math.sign(fx || 1) * 0.1 : fx), size * fy);
	ctx.fillStyle = rgba(col);
	ctx.fill(petalPath());
	ctx.lineWidth = 0.06;
	ctx.strokeStyle = rgba(edge, 0.9);
	ctx.stroke(petalPath());
	ctx.beginPath();
	ctx.moveTo(0, -0.05);
	ctx.lineTo(0.02, -0.75);
	ctx.strokeStyle = rgba(edge, 0.55);
	ctx.lineWidth = 0.05;
	ctx.stroke();
	ctx.restore();
};

type Layer = {n: number; size: [number, number]; v: [number, number]; blur: number; par: number; seed: number; opacity?: number};

export const PETAL_LAYERS: Layer[] = [
	{n: 26, size: [16, 24], v: [50, 72], blur: 2.2, par: 0.45, seed: 11, opacity: 0.85},
	{n: 32, size: [32, 46], v: [82, 118], blur: 0, par: 1, seed: 23},
	{n: 10, size: [90, 130], v: [140, 190], blur: 12, par: 1.8, seed: 37},
];

// Lluvia de pétalos en cámara lenta, sin estado: posición = f(t).
export const PetalRain: React.FC<{
	t: number; // segundos desde el inicio del campo
	layer: Layer;
	light: PetalLight;
	camX?: number;
	camY?: number;
	fade?: number;
	span?: number; // segundos de cobertura
}> = ({t, layer, light, camX = 0, camY = 0, fade = 1, span = 9}) => {
	const ref = useCanvasDraw(
		(ctx) => {
			const draw = (c: CanvasRenderingContext2D, dt: number) => {
				const tt = t + dt;
				for (let i = 0; i < layer.n; i++) {
					const r = (k: number) => hash(i * 17 + k, layer.seed);
					const v = layer.v[0] + (layer.v[1] - layer.v[0]) * r(1);
					const size = layer.size[0] + (layer.size[1] - layer.size[0]) * r(2);
					const y0 = H + 100 - r(3) * (H + 250 + v * span);
					const x0 = -80 + r(4) * (W + 160);
					const ws = 0.75 + 0.7 * r(5);
					const A = 25 + 50 * r(6);
					const ph = r(7) * 6.28;
					// caída con resistencia del aire: frena cuando el pétalo queda plano
					const flip = ph + (0.7 + 1.4 * r(8)) * tt;
					const fx = Math.cos(flip);
					const y = y0 + v * tt + 14 * Math.sin(2 * flip) - camY * layer.par;
					if (y < -120 || y > H + 120) continue;
					const x = x0 + A * Math.sin(ws * tt + ph) + 60 * fbm('pd' + layer.seed, i * 0.37, tt * 0.25, 2) - camX * layer.par;
					const rot = r(11) * 6.28 + (0.3 + 0.6 * r(12)) * tt * (r(13) > 0.5 ? 1 : -1) + 0.45 * Math.sin(ws * tt + ph + 1);
					const fy = 0.72 + 0.28 * Math.cos(0.6 * flip + r(14) * 6);
					const d2 = (x - light.x) ** 2 + (y - light.y) ** 2;
					const lit = light.L * (Math.exp(-d2 / (2 * light.sigma ** 2)) + (light.ambient ?? 0.04));
					drawPetal(c, x, y, size, rot, fx, fy, lit, r(15));
				}
			};
			accumulate(ctx, 3, 0.5 / 30, draw);
		},
		[t, camX, camY, light.x, light.y, light.sigma, light.L],
	);
	return (
		<canvas
			ref={ref}
			width={W}
			height={H}
			style={{position: 'absolute', inset: 0, filter: layer.blur ? `blur(${layer.blur}px)` : undefined, opacity: (layer.opacity ?? 1) * fade}}
		/>
	);
};

// ---------- Chispas de ignición (balística con arrastre) ----------
export const Sparks: React.FC<{t: number; x: number; y: number; n?: number; seed?: number}> = ({t, x, y, n = 28, seed = 5}) => {
	const ref = useCanvasDraw(
		(ctx) => {
			if (t < 0 || t > 1) return;
			ctx.globalCompositeOperation = 'lighter';
			ctx.lineCap = 'round';
			const k = 4.5;
			const g = 1300;
			const pos = (vx: number, vy: number, tt: number) => {
				const e = 1 - Math.exp(-k * tt);
				return [x + (vx / k) * e, y + (vy / k) * e + (g / k) * (tt - e / k)];
			};
			for (let i = 0; i < n; i++) {
				const r = (q: number) => hash(i * 13 + q, seed);
				const life = 0.22 + 0.5 * r(1);
				const t0 = r(2) * 0.08;
				const tt = t - t0;
				if (tt <= 0 || tt > life) continue;
				const ang = -Math.PI / 2 + (r(3) - 0.5) * 2.4;
				const sp = 260 + 700 * r(4) ** 1.5;
				const vx = Math.cos(ang) * sp;
				const vy = Math.sin(ang) * sp;
				const [ax, ay] = pos(vx, vy, tt);
				const [bx, by] = pos(vx, vy, Math.max(0, tt - 1 / 50));
				const heat = 1 - tt / life;
				const col = mixRGB(C.terracota, '#FFF6DA', heat);
				ctx.strokeStyle = rgba(col, heat ** 1.2);
				ctx.lineWidth = 1.2 + 2.2 * heat;
				ctx.beginPath();
				ctx.moveTo(bx, by);
				ctx.lineTo(ax, ay);
				ctx.stroke();
			}
		},
		[t],
	);
	return <canvas ref={ref} width={W} height={H} style={{position: 'absolute', inset: 0, mixBlendMode: 'screen'}} />;
};

// ---------- Bokeh de fondo ----------
export const Bokeh: React.FC<{t: number; n?: number; L: number; seed?: number; camX?: number; camY?: number; area?: [number, number, number, number]; blur?: number}> = ({
	t,
	n = 22,
	L,
	seed = 3,
	camX = 0,
	camY = 0,
	area = [0, 0, W, H],
	blur = 1.5,
}) => {
	const ref = useCanvasDraw(
		(ctx) => {
			ctx.globalCompositeOperation = 'lighter';
			for (let i = 0; i < n; i++) {
				const r = (q: number) => hash(i * 7 + q, seed);
				const rad = 26 + 80 * r(1) ** 1.6;
				const x = area[0] + r(2) * area[2] - camX * 0.3 + 30 * Math.sin(t * 0.2 + i);
				const y = area[1] + r(3) * area[3] - camY * 0.3 - t * (6 + 10 * r(4));
				const tw = 0.75 + 0.25 * noise2D('bk' + seed, i, t * 0.7);
				const col = r(5) < 0.65 ? C.cempa : C.flama;
				const a = L * (0.05 + 0.12 * r(6)) * tw;
				const gr = ctx.createRadialGradient(x, y, 0, x, y, rad);
				gr.addColorStop(0, rgba(col, a * 0.65));
				gr.addColorStop(0.82, rgba(col, a));
				gr.addColorStop(0.93, rgba(col, a * 1.25));
				gr.addColorStop(1, rgba(col, 0));
				ctx.fillStyle = gr;
				ctx.beginPath();
				ctx.arc(x, y, rad, 0, Math.PI * 2);
				ctx.fill();
			}
		},
		[t, L, camX, camY],
	);
	return <canvas ref={ref} width={W} height={H} style={{position: 'absolute', inset: 0, filter: `blur(${blur}px)`, mixBlendMode: 'screen'}} />;
};

// ---------- Brasas ascendentes (flotación + arrastre + turbulencia) ----------
export const Embers: React.FC<{t: number; n?: number; L: number; seed?: number; src?: [number, number, number, number]}> = ({t, n = 40, L, seed = 8, src = [140, 1300, 800, 500]}) => {
	const ref = useCanvasDraw(
		(ctx) => {
			ctx.globalCompositeOperation = 'lighter';
			for (let i = 0; i < n; i++) {
				const r = (q: number) => hash(i * 19 + q, seed);
				const life = 2.5 + 3 * r(1);
				const birth = -life + r(2) * (life + 6);
				const age = t - birth;
				if (age < 0 || age > life) continue;
				let x = src[0] + r(3) * src[2];
				let y = src[1] + r(4) * src[3];
				let vy = -(30 + 50 * r(5));
				// integración fija a 1/30 s
				const steps = Math.floor(age * 30);
				for (let s = 0; s < steps; s++) {
					const tt = birth + s / 30;
					const [cx, cy] = curl(x, y, tt * 0.25 + seed, 0.004);
					vy = vy * 0.985 - 1.2; // flotación con arrastre
					x += (cx * 70) / 30;
					y += (vy + cy * 50) / 30;
				}
				const u = age / life;
				const a = L * Math.sin(Math.PI * u) ** 0.8 * (0.6 + 0.4 * noise2D('emb', i, t * 6));
				const col = mixRGB(C.terracota, C.flama, 1 - u * 0.7);
				const rad = 1.3 + 2.4 * r(6);
				const gr = ctx.createRadialGradient(x, y, 0, x, y, rad * 4);
				gr.addColorStop(0, rgba('#FFF2C8', a));
				gr.addColorStop(0.25, rgba(col, a * 0.8));
				gr.addColorStop(1, rgba(col, 0));
				ctx.fillStyle = gr;
				ctx.fillRect(x - rad * 4, y - rad * 4, rad * 8, rad * 8);
			}
		},
		[t, L],
	);
	return <canvas ref={ref} width={W} height={H} style={{position: 'absolute', inset: 0, mixBlendMode: 'screen'}} />;
};

// ---------- Humo de copal (partículas advectadas por curl noise) ----------
let PUFF: HTMLCanvasElement | null = null;
const puff = () => {
	if (PUFF) return PUFF;
	const c = document.createElement('canvas');
	c.width = c.height = 128;
	const g = c.getContext('2d')!;
	const gr = g.createRadialGradient(64, 64, 0, 64, 64, 64);
	gr.addColorStop(0, 'rgba(255,255,255,0.55)');
	gr.addColorStop(0.45, 'rgba(255,255,255,0.22)');
	gr.addColorStop(1, 'rgba(255,255,255,0)');
	g.fillStyle = gr;
	g.fillRect(0, 0, 128, 128);
	PUFF = c;
	return c;
};

export const Smoke: React.FC<{
	t: number;
	x: number;
	y: number;
	L: number;
	n?: number;
	rate?: number;
	seed?: number;
	tint?: string;
	lightX?: number;
	lightY?: number;
	rise?: number;
	wind?: number;
}> = ({t, x, y, L, n = 150, rate = 22, seed = 4, tint = C.arena, lightX = x, lightY = y - 300, rise = 120, wind = 0}) => {
	const ref = useCanvasDraw(
		(ctx) => {
			const sprite = puff();
			ctx.globalCompositeOperation = 'screen';
			for (let i = 0; i < n; i++) {
				const birth = t - (n - i) / rate + hash(i, seed) * 0.02;
				const age = t - birth;
				const life = n / rate;
				if (age < 0) continue;
				let px = x + (hash(i * 3, seed) - 0.5) * 14;
				let py = y;
				const steps = Math.floor(age * 30);
				for (let s = 0; s < steps; s++) {
					const tt = birth + s / 30;
					const k = Math.min(1, (s / 30) * 0.6);
					const [cx, cy] = curl(px, py, tt * 0.18 + seed, 0.0042);
					px += (cx * 95 * k + wind * k) / 30;
					py += (-rise * (1 - 0.45 * k) + cy * 60 * k) / 30;
				}
				const u = age / life;
				const size = 26 + 170 * u ** 0.8;
				const d = Math.hypot(px - lightX, py - lightY);
				const lit = L * (0.25 + 0.9 * Math.exp(-(d * d) / (2 * 520 * 520)));
				const born = Math.min(1, age / 0.9);
				const a = born * born * (1 - u) ** 1.4 * 0.3 * lit;
				if (a <= 0.003) continue;
				ctx.globalAlpha = a;
				ctx.drawImage(sprite, px - size / 2, py - size / 2, size, size);
			}
			ctx.globalAlpha = 1;
			// teñido cálido
			ctx.globalCompositeOperation = 'source-atop';
			ctx.fillStyle = rgba(tint, 0.85);
			ctx.fillRect(0, 0, W, H);
		},
		[t, L],
	);
	return <canvas ref={ref} width={W} height={H} style={{position: 'absolute', inset: 0, mixBlendMode: 'screen', filter: 'blur(3px)'}} />;
};
