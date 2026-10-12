import React from 'react';
import {AbsoluteFill, Sequence, useCurrentFrame} from 'remotion';
import {noise2D} from '@remotion/noise';
import {C, E, FPS, H, W, clamp, curl, hash, lerp, mixRGB, ramp, rgba} from '../lib/util';
import {Light, PaperTexture, useCanvasDraw} from '../components/core';
import {Bokeh} from '../components/Particles';
import {useGlyph} from '../countdown/reveals';
import {Fog, Sky} from './kit/land';
import {GoldNumber, Kinetic, Lockup, NUM_Y, numSize} from './kit/type';
import {LightLeak, PetalWipe} from './kit/transitions';

// Capítulo 13 · "Las monarcas" — llegan en otoño; dicen que en cada una viaja alguien que vuelve.
export const C13 = {S1: 126, S2: 96, S3: 78, REV: 126, HIT: 66};
export const C13_LEN = C13.S1 + C13.S2 + C13.S3 + C13.REV;

// ---------- Mariposa monarca en canvas (vista dorsal) ----------
export const drawMonarch = (ctx: CanvasRenderingContext2D, x: number, y: number, s: number, rot: number, flap: number, lit = 1, detail = false) => {
	const k = Math.max(0.12, Math.abs(Math.cos(flap)));
	const orange = rgba(mixRGB(C.ink, '#F07A2E', lit));
	const orange2 = rgba(mixRGB(C.ink, '#F9A23E', lit));
	const black = rgba(mixRGB('#000', '#1a0d07', 1));
	ctx.save();
	ctx.translate(x, y);
	ctx.rotate(rot);
	ctx.scale(s, s);
	for (const side of [-1, 1]) {
		ctx.save();
		ctx.scale(side * k, 1);
		// ala anterior
		ctx.beginPath();
		ctx.moveTo(0, -2);
		ctx.bezierCurveTo(6, -18, 26, -30, 40, -26);
		ctx.bezierCurveTo(44, -12, 34, 2, 2, 2);
		ctx.closePath();
		const g = ctx.createLinearGradient(0, 0, 40, -26);
		g.addColorStop(0, orange);
		g.addColorStop(1, orange2);
		ctx.fillStyle = g;
		ctx.fill();
		ctx.lineWidth = 3.2;
		ctx.strokeStyle = black;
		ctx.stroke();
		// ala posterior
		ctx.beginPath();
		ctx.moveTo(1, 2);
		ctx.bezierCurveTo(24, 2, 34, 14, 26, 26);
		ctx.bezierCurveTo(16, 34, 4, 22, 1, 6);
		ctx.closePath();
		ctx.fillStyle = orange;
		ctx.fill();
		ctx.stroke();
		if (detail) {
			ctx.lineWidth = 1.1;
			ctx.beginPath();
			for (const [ax, ay] of [
				[30, -24],
				[34, -14],
				[28, -4],
				[22, 14],
				[24, 22],
			]) {
				ctx.moveTo(2, 0);
				ctx.quadraticCurveTo(ax * 0.5, ay * 0.6, ax, ay);
			}
			ctx.stroke();
			ctx.fillStyle = '#FFF4E0';
			for (let i = 0; i < 7; i++) {
				ctx.beginPath();
				ctx.arc(14 + i * 4, -22 - Math.sin(i) * 2, 0.9, 0, Math.PI * 2);
				ctx.fill();
			}
		}
		ctx.restore();
	}
	ctx.fillStyle = black;
	ctx.beginPath();
	ctx.ellipse(0, 4, 2.4, 12, 0, 0, Math.PI * 2);
	ctx.fill();
	ctx.beginPath();
	ctx.arc(0, -9, 2.6, 0, Math.PI * 2);
	ctx.fill();
	if (detail) {
		ctx.strokeStyle = black;
		ctx.lineWidth = 0.9;
		ctx.beginPath();
		ctx.moveTo(-1, -10);
		ctx.quadraticCurveTo(-6, -22, -9, -26);
		ctx.moveTo(1, -10);
		ctx.quadraticCurveTo(6, -22, 9, -26);
		ctx.stroke();
	}
	ctx.restore();
};

// Silueta de oyamel (abeto)
const firPath = (x: number, base: number, h: number) => {
	let d = `M ${x} ${base - h}`;
	const tiers = 7;
	for (let i = 1; i <= tiers; i++) {
		const y = base - h + (h * i) / tiers;
		const w = (h * 0.32 * i) / tiers;
		d += ` L ${x + w} ${y} L ${x + w * 0.55} ${y - h * 0.035}`;
	}
	d += ` L ${x + 8} ${base} L ${x - 8} ${base}`;
	for (let i = tiers; i >= 1; i--) {
		const y = base - h + (h * i) / tiers;
		const w = (h * 0.32 * i) / tiers;
		d += ` L ${x - w * 0.55} ${y - h * 0.035} L ${x - w} ${y}`;
	}
	return d + ' Z';
};

const Forest: React.FC<{t: number; layers: {y: number; h: number; c: string; n: number; seed: number; dx?: number}[]}> = ({layers}) => (
	<svg width={W} height={H} style={{position: 'absolute', inset: 0, overflow: 'visible'}}>
		{layers.map((L, li) => (
			<g key={li} transform={`translate(${L.dx ?? 0} 0)`}>
				{Array.from({length: L.n}).map((_, i) => {
					const x = -100 + (i + hash(i, L.seed) * 0.6) * ((W + 200) / L.n);
					const h = L.h * (0.75 + 0.5 * hash(i, L.seed + 1));
					return <path key={i} d={firPath(x, L.y + 40 * hash(i, L.seed + 2), h)} fill={L.c} />;
				})}
				<rect x={-200} y={L.y + 30} width={W + 400} height={H} fill={L.c} />
			</g>
		))}
	</svg>
);

const Swarm: React.FC<{f: number; n: number; seed: number; area: [number, number, number, number]; size: [number, number]; swirl?: number; up?: number; lit?: number}> = ({f, n, seed, area, size, swirl = 0, up = 0, lit = 1}) => {
	const t = f / FPS;
	const ref = useCanvasDraw(
		(ctx) => {
			for (let i = 0; i < n; i++) {
				const r = (q: number) => hash(i * 7 + q, seed);
				let x = area[0] + r(1) * area[2];
				let y = area[1] + r(2) * area[3];
				const [cx, cy] = curl(x, y, t * 0.3 + r(3), 0.003);
				x += cx * 140 * t + Math.sin(t * (0.8 + r(4)) + i) * 40;
				y += cy * 140 * t - up * t * (0.6 + 0.8 * r(5));
				if (swirl) {
					const a = r(6) * 6.28 + t * swirl * (0.7 + 0.6 * r(7));
					const rad = 120 + 360 * r(8);
					x = 540 + Math.cos(a) * rad;
					y = area[1] + area[3] * (1 - ((r(9) + t * 0.25 * (0.5 + r(10))) % 1)) + Math.sin(a) * 60;
				}
				const s = size[0] + (size[1] - size[0]) * r(11);
				drawMonarch(ctx, x, y, s / 40, Math.sin(t * 2 + i) * 0.5 + (r(12) - 0.5), t * (9 + 4 * r(13)) + i, lit * (0.7 + 0.4 * r(14)));
			}
		},
		[f],
	);
	return <canvas ref={ref} width={W} height={H} style={{position: 'absolute', inset: 0}} />;
};

const Bosque: React.FC = () => {
	const f = useCurrentFrame();
	const t = f / FPS;
	const push = ramp(f, [0, C13.S1], [0, 1], E.inOut);
	return (
		<AbsoluteFill>
			<Sky t={t} top="#1a0e10" mid="#5a2c18" horizon="#c46a32" hy={1150} />
			<Light x={700} y={900} r={1200} color={C.flama} o={0.45} />
			<AbsoluteFill style={{transform: `scale(${1 + push * 0.06})`, transformOrigin: '540px 1200px'}}>
				<Forest t={t} layers={[{y: 1080, h: 360, c: rgba(mixRGB('#3a1c14', C.terracota, 0.4)), n: 14, seed: 131, dx: -push * 20}]} />
				<Fog y={1100} color={C.flama} o={0.35} h={300} />
				<Forest t={t} layers={[{y: 1320, h: 560, c: '#2a120c', n: 9, seed: 132, dx: -push * 50}]} />
				<Fog y={1330} color={C.cempa} o={0.22} h={300} />
				<Swarm f={f} n={40} seed={133} area={[100, 500, 900, 900]} size={[16, 30]} up={30} />
				<Forest t={t} layers={[{y: 1700, h: 900, c: '#0e0605', n: 5, seed: 134, dx: -push * 110}]} />
			</AbsoluteFill>
			<PaperTexture o={0.2} />
			<Kinetic text={'Cada otoño llegan\nmillones de alas naranjas…'} f={f} at={14} out={110} y={330} size={50} />
		</AbsoluteFill>
	);
};

const Macro: React.FC = () => {
	const f = useCurrentFrame();
	const t = f / FPS + 4;
	const ref = useCanvasDraw(
		(ctx) => {
			const flap = Math.PI / 2 - (0.5 + 0.5 * Math.sin(t * 1.6)) * 1.35;
			drawMonarch(ctx, 540, 900, 9.5, -0.08, flap, 1, true);
		},
		[f],
	);
	return (
		<AbsoluteFill style={{background: '#070302'}}>
			<Light x={540} y={900} r={1100} color={C.cempa} o={0.4} />
			<Bokeh t={t} L={1} n={22} seed={135} blur={6} />
			{/* rama */}
			<svg width={W} height={H} style={{position: 'absolute', inset: 0}}>
				<path d="M -40 1180 C 300 1120 700 1150 1120 1060" stroke="#1a0d07" strokeWidth={34} fill="none" strokeLinecap="round" />
				{Array.from({length: 18}).map((_, i) => (
					<path key={i} d={`M ${40 + i * 60} ${1170 - i * 5} l ${-18 + (i % 2) * 36} ${60 + (i % 3) * 14}`} stroke="#123a2e" strokeWidth={6} strokeLinecap="round" />
				))}
			</svg>
			<canvas ref={ref} width={W} height={H} style={{position: 'absolute', inset: 0}} />
			<PaperTexture o={0.18} />
			<Kinetic text={'Dicen que en cada una\nviaja alguien que vuelve.'} f={f} at={10} out={84} y={1420} size={50} />
		</AbsoluteFill>
	);
};

const Remolino: React.FC = () => {
	const f = useCurrentFrame();
	const t = f / FPS;
	const tilt = ramp(f, [0, C13.S3], [0, 200], E.inOut);
	return (
		<AbsoluteFill style={{background: '#0a0503'}}>
			<div style={{position: 'absolute', left: 240, top: -200, width: 600, height: 2400, background: `linear-gradient(90deg, transparent, ${rgba(C.flama, 0.22)}, transparent)`, filter: 'blur(30px)', transform: 'rotate(8deg)'}} />
			<AbsoluteFill style={{transform: `translateY(${tilt}px)`}}>
				<Forest t={t} layers={[{y: 1650, h: 1100, c: '#140805', n: 4, seed: 136}]} />
			</AbsoluteFill>
			<Swarm f={f + 40} n={170} seed={137} area={[0, 0, W, 1900]} size={[14, 46]} swirl={1.2} />
			<PaperTexture o={0.18} />
		</AbsoluteFill>
	);
};

const Numero: React.FC<{dias: number; fecha: string}> = ({dias, fecha}) => {
	const f = useCurrentFrame();
	const t = f / FPS;
	const txt = String(dias);
	const g = useGlyph(txt, numSize(txt), 31, 5);
	const HIT = C13.HIT;
	const ref = useCanvasDraw(
		(ctx) => {
			if (!g) return;
			g.pts.forEach(([gx, gy], i) => {
				const tx = 540 + gx;
				const ty = NUM_Y + gy;
				const d = hash(i, 3) * 30;
				const a = E.inOut(clamp((f - d) / 38));
				const ang = hash(i, 4) * 6.28 + t * 1.5;
				const rad = 700 + 300 * hash(i, 5);
				const sx = 540 + Math.cos(ang) * rad;
				const sy = NUM_Y + Math.sin(ang) * rad * 1.2;
				const x = lerp(sx, tx, a) + (1 - a) * noise2D('mx', i, t) * 60;
				const y = lerp(sy, ty, a) + (1 - a) * noise2D('my', i, t) * 60;
				// al posarse, las alas se abren y cierran despacio
				const flap = a < 1 ? t * 12 + i : Math.PI / 2 - (0.5 + 0.5 * Math.sin(t * 2 + i * 0.4)) * 1.2;
				drawMonarch(ctx, x, y, 0.74 + 0.12 * hash(i, 6), (hash(i, 7) - 0.5) * 0.8 * (1 - a * 0.6), flap, 1);
			});
		},
		[g, f],
	);
	return (
		<AbsoluteFill style={{background: 'radial-gradient(ellipse at 50% 45%, #2a120a, #070302 70%)'}}>
			<Bokeh t={t + 3} L={0.8} n={14} seed={138} blur={6} />
			<GoldNumber txt={txt} o={ramp(f, [HIT - 6, HIT + 26], [0, 0.3], E.out)} blur={18} glow={0.5} />
			<canvas ref={ref} width={W} height={H} style={{position: 'absolute', inset: 0}} />
			<Lockup f={f} at={HIT + 4} dias={dias} fecha={fecha} />
			<PaperTexture o={0.14} />
			<AbsoluteFill style={{background: '#000', opacity: ramp(f, [C13.REV - 8, C13.REV - 1], [0, 1], E.inOut)}} />
		</AbsoluteFill>
	);
};

export const Cap13: React.FC<{dias: number; fecha: string}> = ({dias, fecha}) => {
	const f = useCurrentFrame();
	const a = C13.S1;
	const b = a + C13.S2;
	const c = b + C13.S3;
	return (
		<AbsoluteFill style={{background: '#000'}}>
			<Sequence durationInFrames={a}>
				<Bosque />
			</Sequence>
			<Sequence from={a} durationInFrames={C13.S2}>
				<Macro />
			</Sequence>
			<Sequence from={b} durationInFrames={C13.S3}>
				<Remolino />
			</Sequence>
			<Sequence from={c} durationInFrames={C13.REV}>
				<Numero dias={dias} fecha={fecha} />
			</Sequence>
			<LightLeak f={f} at={a} dur={16} />
			<PetalWipe f={f} at={b} dur={22} seed={13} />
			<LightLeak f={f} at={c} dur={14} color={C.cempa} />
		</AbsoluteFill>
	);
};
