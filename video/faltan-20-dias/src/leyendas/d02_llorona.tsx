// Día 2 · La Llorona — versión historia: el río de noche visto desde arriba; la corriente trae los pétalos
// del camino de cempasúchil y los posa en un «2»; las dos lucecitas de sus hijos llegan a las puntas.
// Después del rótulo, el borde de un velo blanco cruza el agua. El outro estándar se agrega aparte.
import React from 'react';
import {useCurrentFrame} from 'remotion';
import {noise2D} from '@remotion/noise';
import {E, H, W, clamp, lerp} from '../lib/util';
import {Scene} from './kit/scene';
import {LeyendaLockup} from './kit/text';
import {cached, drawTiled, glow, makeCanvas, noiseTile, tinted, type Ctx} from './kit/paint';
import {flame2D, marigold} from './kit/fx';
import type {PostOpts} from './kit/post';
import {DOS_PATH, DOS_PTS} from './d02/dos';

export const EP02_LEN = 195; // 6.5 s
const FPS = 30;
const LOCK = 100;
const N = DOS_PTS.length / 2;

const hash = (i: number, s = 0) => {
	const x = Math.sin(i * 127.1 + s * 311.7) * 43758.5453;
	return x - Math.floor(x);
};

// puntas del «2»: el remate del gancho (arriba a la izquierda) y el final de la base (abajo a la derecha)
const tips = cached('d2tips', () => {
	let hook = [W, 0];
	let base = [0, 0];
	for (let i = 0; i < N; i++) {
		const x = DOS_PTS[i * 2];
		const y = DOS_PTS[i * 2 + 1];
		if (y < 860 && x < hook[0]) hook = [x, y];
		if (y > 1150 && x > base[0]) base = [x, y];
	}
	return {hook, base};
});

const water = (g: Ctx, t: number) => {
	const gr = g.createLinearGradient(0, 0, W * 0.3, H);
	gr.addColorStop(0, '#071a1f');
	gr.addColorStop(0.55, '#0c2a30');
	gr.addColorStop(1, '#061417');
	g.fillStyle = gr;
	g.fillRect(0, 0, W, H);
	// corriente: dos capas de ruido que bajan en diagonal a distinta velocidad
	const a = tinted(noiseTile({seed: 21, size: 256, period: 4, oct: 4, contrast: 1.4}), '#2f6b70', 'd2w1');
	const b = tinted(noiseTile({seed: 34, size: 256, period: 6, oct: 3, contrast: 1.8, ridged: true}), '#9fc3c4', 'd2w2');
	drawTiled(g, a, {scale: 3.2, ox: t * 40, oy: t * 110, alpha: 0.35});
	drawTiled(g, b, {scale: 1.6, ox: t * 70, oy: t * 190, alpha: 0.1, op: 'screen'});
	// reflejo de la luna que tiembla arriba a la derecha
	for (let k = 0; k < 9; k++) {
		const y = 300 + k * 26 + noise2D('d2m', k, t * 0.7) * 8;
		const w = (90 - k * 6) * (0.8 + 0.3 * noise2D('d2mw', k, t * 1.3));
		g.fillStyle = `rgba(217,205,182,${0.08 - k * 0.007})`;
		g.beginPath();
		g.ellipse(840 + noise2D('d2mx', k, t) * 14, y, Math.max(4, w), 5, 0, 0, Math.PI * 2);
		g.fill();
	}
};

// piedra con musgo en la panza del 2
const stone = (g: Ctx) => {
	const c = cached('d2stone', () => {
		const cv = makeCanvas(260, 200);
		const q = cv.getContext('2d')!;
		const r = q.createRadialGradient(110, 80, 10, 130, 100, 130);
		r.addColorStop(0, '#5a5d4a');
		r.addColorStop(0.6, '#2c3328');
		r.addColorStop(1, '#141a15');
		q.fillStyle = r;
		q.beginPath();
		q.ellipse(130, 100, 118, 82, -0.15, 0, Math.PI * 2);
		q.fill();
		const m = q.createRadialGradient(90, 70, 5, 90, 70, 80);
		m.addColorStop(0, 'rgba(31,92,72,0.75)');
		m.addColorStop(1, 'rgba(31,92,72,0)');
		q.fillStyle = m;
		q.fillRect(0, 0, 260, 200);
		q.strokeStyle = 'rgba(159,195,196,0.35)';
		q.lineWidth = 3;
		q.beginPath();
		q.ellipse(130, 100, 116, 80, -0.15, Math.PI * 1.05, Math.PI * 1.7);
		q.stroke();
		return cv;
	});
	g.drawImage(c, 548 - 130, 820 - 100);
};

const PETAL = ['#F26D3D', '#F5A23A', '#F5C242', '#E85A2C'];
const petals = (g: Ctx, f: number, t: number) => {
	for (let ci = 0; ci < PETAL.length; ci++) {
		g.fillStyle = PETAL[ci];
		g.beginPath();
		for (let i = ci; i < N; i += PETAL.length) {
			const tx = DOS_PTS[i * 2];
			const ty = DOS_PTS[i * 2 + 1];
			const arrive = 10 + 78 * (i / N) + hash(i, 1) * 10;
			const dur = 40 + hash(i, 2) * 14;
			const u = clamp((f - (arrive - dur)) / dur);
			if (u <= 0) continue;
			const e = E.out(u);
			// salen de arriba a la izquierda (los escalones) y la corriente los curva hacia su lugar
			const sx = -80 + hash(i, 3) * 380;
			const sy = -120 + hash(i, 4) * 300;
			const cx = lerp(sx, tx, 0.5) + 220 * (hash(i, 5) - 0.3);
			const cy = lerp(sy, ty, 0.5) - 60;
			const x = (1 - e) * (1 - e) * sx + 2 * (1 - e) * e * cx + e * e * tx + noise2D('d2px', i, t * 0.6) * 2.5 * e;
			const y = (1 - e) * (1 - e) * sy + 2 * (1 - e) * e * cy + e * e * ty + noise2D('d2py', i, t * 0.6) * 2.5 * e;
			const rot = hash(i, 6) * Math.PI + (1 - e) * 4 + t * 0.2 * (hash(i, 7) - 0.5);
			const s = 6.5 + hash(i, 8) * 3;
			g.moveTo(x + Math.cos(rot) * s, y + Math.sin(rot) * s);
			g.ellipse(x, y, s, s * 0.55, rot, 0, Math.PI * 2);
		}
		g.fill();
	}
};

const glyphGlow = (g: Ctx, k: number) => {
	if (k <= 0) return;
	const c = cached('d2glow', () => {
		const cv = makeCanvas(W, H);
		const q = cv.getContext('2d')!;
		q.filter = 'blur(18px)';
		q.fillStyle = '#F5C242';
		q.fill(new Path2D(DOS_PATH));
		return cv;
	});
	g.save();
	g.globalAlpha = 0.45 * k;
	g.globalCompositeOperation = 'screen';
	g.drawImage(c, 0, 0);
	g.restore();
};

// velita flotando sobre una flor de cempasúchil
const velita = (g: Ctx, x: number, y: number, t: number, seed: number, a: number) => {
	if (a <= 0) return;
	g.save();
	g.globalAlpha = a;
	glow(g, x, y - 10, 120, '#F5B04A', 0.35);
	marigold(g, x, y, 30, t * 0.2 + seed, seed, 0);
	g.fillStyle = '#efe3c8';
	g.fillRect(x - 7, y - 30, 14, 22);
	flame2D(g, x, y - 32, 1.0, t, seed, 0.1 * Math.sin(t * 2 + seed), 1);
	g.restore();
};

const paint = (g: Ctx, f: number): PostOpts => {
	const t = f / FPS;
	water(g, t);
	stone(g);
	glyphGlow(g, E.inOut(clamp((f - 60) / 40)));
	petals(g, f, t);
	// las dos lucecitas llegan con la corriente a las puntas del 2
	const {hook, base} = tips;
	const u1 = E.out(clamp((f - 40) / 50));
	const u2 = E.out(clamp((f - 52) / 50));
	velita(g, lerp(hook[0] - 260, hook[0] - 6, u1), lerp(hook[1] - 380, hook[1] - 8, u1), t, 2, clamp((f - 40) / 8));
	velita(g, lerp(base[0] + 300, base[0] + 4, u2), lerp(base[1] - 420, base[1] - 6, u2), t, 4, clamp((f - 52) / 8));
	// una lágrima cae y su anillo trae el rótulo
	const d = f - (LOCK - 6);
	if (d >= 0 && d < 40) {
		g.strokeStyle = `rgba(217,205,182,${0.5 * (1 - d / 40)})`;
		g.lineWidth = 3;
		g.beginPath();
		g.ellipse(560, 900, 10 + d * 16, (10 + d * 16) * 0.55, 0, 0, Math.PI * 2);
		g.stroke();
	}
	// el borde de un velo blanco cruza el agua arriba a la derecha y se retira (ella sigue buscando)
	const v = f - 150;
	if (v >= 0 && v < 24) {
		const k = Math.sin((v / 24) * Math.PI);
		const vx = W + 40 - 190 * k;
		const vg = g.createRadialGradient(vx, 290, 10, vx, 290, 240);
		vg.addColorStop(0, `rgba(235,232,224,${0.32 * k})`);
		vg.addColorStop(1, 'rgba(235,232,224,0)');
		g.fillStyle = vg;
		g.beginPath();
		g.ellipse(vx, 290, 230, 90, -0.4, 0, Math.PI * 2);
		g.fill();
	}
	return {bloom: 0.7, bloomThr: 0.62, halation: 0.3, vignette: 0.9, grain: 0.07, hatch: 0.1, hatchInk: [0.02, 0.05, 0.06], saturation: 1.05, contrast: 1.08, shadows: [0, 0.015, 0.025], fade: 1 - E.out(clamp(f / 12))};
};

export const Ep02: React.FC<{dias: number; fecha: string}> = ({dias, fecha}) => {
	const f = useCurrentFrame();
	return (
		<Scene paint={paint} bg="#071a1f">
			{f >= LOCK ? <LeyendaLockup f={f} at={LOCK} dias={dias} fecha={fecha} /> : null}
		</Scene>
	);
};
