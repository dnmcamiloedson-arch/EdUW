// Día 1 · «Falta uno» — versión historia: el patio de noche visto desde arriba. Las siete veladoras se encienden
// una por una, cada una con la seña de su leyenda (sin nombres ni facultades). Luego el fuego corre por el camino
// de cempasúchil, que tiene forma de «1», y aparece FALTA 1 DÍA. El outro estándar se agrega aparte.
import React from 'react';
import {useCurrentFrame} from 'remotion';
import {noise2D} from '@remotion/noise';
import {E, H, W, clamp, lerp} from '../lib/util';
import {Scene} from './kit/scene';
import {LeyendaLockup} from './kit/text';
import {cached, drawTiled, fogBand, glow, makeCanvas, noiseTile, tinted, type Ctx} from './kit/paint';
import {flame2D, marigold, particles} from './kit/fx';
import type {PostOpts} from './kit/post';
import {UNO_PATH, UNO_PTS} from './d01/uno';

export const EP01_LEN = 195; // 6.5 s
const FPS = 30;
const LOCK = 112;
const IGN = [74, 112]; // el fuego corre por el camino
const N = UNO_PTS.length / 2;

const hash = (i: number, s = 0) => {
	const x = Math.sin(i * 127.1 + s * 311.7) * 43758.5453;
	return x - Math.floor(x);
};

// las siete veladoras: abajo las tres del Ala Sur (1–3), arriba las cuatro del Ala Norte (4–7)
type Alt = {x: number; y: number; at: number; sig: (g: Ctx, x: number, y: number, t: number, k: number) => void};
const ORB = (g: Ctx, x: number, y: number, t: number, k: number) => {
	// brujas de fuego: una esfera de lumbre que flota arriba
	const yy = y - 95 + Math.sin(t * 2.2) * 10;
	glow(g, x + 30, yy, 90, '#F26D3D', 0.75 * k);
	flame2D(g, x + 30, yy + 14, 16, t * 1.3, 11, 0, 0.9 * k);
	glow(g, x + 30, yy, 10, '#FFF3D6', 0.9 * k);
};
const EYES = (color: string, dx: number, dy: number, sep: number) => (g: Ctx, x: number, y: number, t: number, k: number) => {
	const blink = (t * 0.6) % 1 > 0.94 ? 0.1 : 1;
	for (const s of [-1, 1]) {
		glow(g, x + dx + (s * sep) / 2, y + dy, 30, color, 0.8 * k * blink);
		glow(g, x + dx + (s * sep) / 2, y + dy, 7, '#FFF3D6', 1 * k * blink);
	}
};
const COIN = (g: Ctx, x: number, y: number, t: number, k: number) => {
	// charro negro: una moneda de oro tirada que destella
	g.save();
	g.globalAlpha = k;
	g.fillStyle = '#C9962E';
	g.beginPath();
	g.ellipse(x + 70, y + 40, 24, 16, 0.3, 0, Math.PI * 2);
	g.fill();
	g.restore();
	const tw = 0.5 + 0.5 * Math.sin(t * 5);
	glow(g, x + 74, y + 36, 50 * tw + 12, '#F5C242', 0.8 * k);
};
const CROSS = (g: Ctx, x: number, y: number, t: number, k: number) => {
	// momias: una crucecita de panteón que la vela alumbra
	g.save();
	g.globalAlpha = 0.85 * k;
	g.fillStyle = '#6b4a2c';
	g.fillRect(x - 92, y - 96, 12, 80);
	g.fillRect(x - 113, y - 78, 54, 11);
	g.restore();
	glow(g, x - 86, y - 60, 80, '#F5B04A', 0.3 * k);
};
const VEIL = (g: Ctx, x: number, y: number, t: number, k: number) => {
	// la llorona: un velo blanco que respira junto a la vela
	const vx = x - 60 + Math.sin(t * 0.9) * 10;
	const vg = g.createRadialGradient(vx, y - 60, 5, vx, y - 60, 120);
	vg.addColorStop(0, `rgba(235,238,236,${0.45 * k})`);
	vg.addColorStop(1, 'rgba(235,238,236,0)');
	g.fillStyle = vg;
	g.beginPath();
	g.ellipse(vx, y - 60, 60, 115, -0.2, 0, Math.PI * 2);
	g.fill();
};
const RIBBON = (g: Ctx, x: number, y: number, t: number, k: number) => {
	// chaneques: el listón rojo y luciérnagas
	g.save();
	g.globalAlpha = k;
	g.strokeStyle = '#A83A25';
	g.lineWidth = 10;
	g.lineCap = 'round';
	g.beginPath();
	for (let i = 0; i <= 20; i++) {
		const u = i / 20;
		const px = x + 40 + u * 90;
		const py = y + 30 + Math.sin(u * 7 + t * 2) * 10 - u * 30;
		if (i === 0) g.moveTo(px, py);
		else g.lineTo(px, py);
	}
	g.stroke();
	g.restore();
	for (let i = 0; i < 5; i++) {
		const fx = x - 60 + noise2D('d1ff', i, t * 0.4) * 70;
		const fy = y - 80 + noise2D('d1fy', i, t * 0.4) * 50;
		glow(g, fx, fy, 16, '#B8E07A', (0.5 + 0.5 * Math.sin(t * 4 + i * 2)) * 0.8 * k);
	}
};
const ALT: Alt[] = [
	{x: 300, y: 1555, at: 12, sig: ORB},
	{x: 540, y: 1590, at: 21, sig: EYES('#9FD36B', 85, -75, 34)},
	{x: 780, y: 1555, at: 30, sig: COIN},
	{x: 190, y: 400, at: 39, sig: EYES('#E03A2A', -80, 55, 22)},
	{x: 410, y: 330, at: 48, sig: CROSS},
	{x: 670, y: 330, at: 57, sig: VEIL},
	{x: 890, y: 400, at: 66, sig: RIBBON},
];

const ground = (g: Ctx, t: number) => {
	g.fillStyle = '#120a05';
	g.fillRect(0, 0, W, H);
	const st = tinted(noiseTile({seed: 8, size: 256, period: 4, oct: 4, contrast: 1.3}), '#3a2a1c', 'd1st');
	drawTiled(g, st, {scale: 2.4, alpha: 0.55});
	// juntas de las losas del patio
	const j = cached('d1joints', () => {
		const c = makeCanvas(W, H);
		const q = c.getContext('2d')!;
		q.strokeStyle = 'rgba(0,0,0,0.45)';
		q.lineWidth = 3;
		for (let y = 0; y < H; y += 180) {
			q.beginPath();
			q.moveTo(0, y);
			q.lineTo(W, y);
			q.stroke();
			for (let x = (y / 180) % 2 ? 90 : 0; x < W; x += 180) {
				q.beginPath();
				q.moveTo(x, y);
				q.lineTo(x, y + 180);
				q.stroke();
			}
		}
		return c;
	});
	g.drawImage(j, 0, 0);
	fogBand(g, {y0: 0, y1: H, color: '#1F5C48', t, seed: 3, scale: 1.4, speed: 0.04, alpha: 0.12});
};

// el camino de pétalos con forma de 1; el fuego lo recorre de abajo hacia arriba
const order = cached('d1order', () => {
	const idx = Array.from({length: N}, (_, i) => i);
	idx.sort((a, b) => UNO_PTS[b * 2 + 1] - UNO_PTS[a * 2 + 1]);
	const rank = new Float32Array(N);
	idx.forEach((i, r) => (rank[i] = r / N));
	return rank;
});
const PETAL = ['#B8501F', '#C9772A', '#A8441A'];
const LIT = ['#F26D3D', '#F5A23A', '#F5C242'];
const path = (g: Ctx, f: number, t: number) => {
	const p = (f - IGN[0]) / (IGN[1] - IGN[0]);
	for (const lit of [false, true]) {
		const cols = lit ? LIT : PETAL;
		for (let ci = 0; ci < cols.length; ci++) {
			g.fillStyle = cols[ci];
			g.beginPath();
			for (let i = ci; i < N; i += cols.length) {
				const on = order[i] < p;
				if (on !== lit) continue;
				const x = UNO_PTS[i * 2] + noise2D('d1px', i, t * 0.5) * (on ? 1.5 : 0.5);
				const y = UNO_PTS[i * 2 + 1];
				const rot = hash(i, 6) * Math.PI;
				const s = 6 + hash(i, 8) * 3;
				g.moveTo(x + Math.cos(rot) * s, y + Math.sin(rot) * s);
				g.ellipse(x, y, s, s * 0.55, rot, 0, Math.PI * 2);
			}
			g.fill();
		}
	}
	// frente de fuego: brillo que sube por el trazo
	if (p > 0 && p < 1.05) {
		const fy = lerp(1240, 600, clamp(p));
		glow(g, 540, fy, 170, '#F5B04A', 0.55);
		particles(g, {kind: 'embers', n: 40, t, seed: 4, x: 400, y: fy - 200, w: 280, h: 260, alpha: 0.8});
	}
};
const pathGlow = (g: Ctx, k: number) => {
	if (k <= 0) return;
	const c = cached('d1glow', () => {
		const cv = makeCanvas(W, H);
		const q = cv.getContext('2d')!;
		q.filter = 'blur(20px)';
		q.fillStyle = '#F5C242';
		q.fill(new Path2D(UNO_PATH));
		return cv;
	});
	g.save();
	g.globalAlpha = 0.5 * k;
	g.globalCompositeOperation = 'screen';
	g.drawImage(c, 0, 0);
	g.restore();
};

const veladora = (g: Ctx, a: Alt, f: number, t: number, i: number) => {
	const k = E.out(clamp((f - a.at) / 8));
	// corona de cempasúchil alrededor del vaso
	for (let j = 0; j < 7; j++) {
		const ang = (j / 7) * Math.PI * 2 + i;
		marigold(g, a.x + Math.cos(ang) * 46, a.y + Math.sin(ang) * 30, 15, ang, j + i, 0);
	}
	g.fillStyle = 'rgba(239,227,200,0.85)';
	g.beginPath();
	g.ellipse(a.x, a.y, 20, 14, 0, 0, Math.PI * 2);
	g.fill();
	if (k <= 0) return;
	glow(g, a.x, a.y - 10, 210, '#F5B04A', 0.32 * k);
	flame2D(g, a.x, a.y - 8, 19, t + i, i, 0.15 * Math.sin(t * 1.7 + i), k);
	a.sig(g, a.x, a.y, t, E.inOut(clamp((f - a.at - 4) / 10)));
};

const paint = (g: Ctx, f: number): PostOpts => {
	const t = f / FPS;
	ground(g, t);
	pathGlow(g, E.inOut(clamp((f - IGN[0] - 10) / 40)));
	path(g, f, t);
	ALT.forEach((a, i) => veladora(g, a, f, t, i));
	// las siete llamas se inclinan hacia el camino justo antes de que arda (algo inhala)
	return {bloom: 0.75, bloomThr: 0.6, halation: 0.35, vignette: 0.9, grain: 0.07, hatch: 0.1, contrast: 1.08, saturation: 1.05, exposure: lerp(0.85, 1.05, clamp((f - 10) / 70)), fade: 1 - E.out(clamp(f / 10))};
};

export const Ep01: React.FC<{dias: number; fecha: string}> = ({dias, fecha}) => {
	const f = useCurrentFrame();
	return (
		<Scene paint={paint} bg="#120a05">
			{f >= LOCK ? <LeyendaLockup f={f} at={LOCK} dias={dias} fecha={fecha} /> : null}
		</Scene>
	);
};
