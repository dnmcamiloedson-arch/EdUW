import React from 'react';
import {AbsoluteFill, Sequence, useCurrentFrame} from 'remotion';
import {noise2D} from '@remotion/noise';
import {C, E, FPS, H, W, clamp, flicker, hash, lerp, ramp, rgba} from '../lib/util';
import {Light, PaperTexture, useCanvasDraw} from '../components/core';
import {useGlyph} from '../countdown/reveals';
import {Fog, Orb, Ridge, Sky} from './kit/land';
import {GoldNumber, Kinetic, Lockup, NUM_Y, numSize} from './kit/type';
import {Dip, LightLeak} from './kit/transitions';

// Capítulo 14 · "Xólotl" — el xoloitzcuintle guía a las almas para cruzar el río.
export const C14 = {S1: 126, S2: 96, S3: 72, REV: 126, HIT: 64};
export const C14_LEN = C14.S1 + C14.S2 + C14.S3 + C14.REV;

// ---------- Xoloitzcuintle (perfil, mira a la derecha) ----------
const Xolo: React.FC<{x: number; y: number; s?: number; t: number; walk?: number; color?: string; rim?: string; look?: number}> = ({x, y, s = 1, t, walk = 1, color = '#0d0809', rim = C.marfil, look = 0}) => {
	const ph = t * Math.PI * 2 * 1.5 * walk;
	const bob = Math.sin(ph * 2) * 3 * walk;
	const leg = (hx: number, hy: number, o: number, front: boolean) => {
		const a1 = (22 * Math.sin(ph + o) * walk * Math.PI) / 180;
		const bend = (front ? -1 : 1) * Math.max(0, Math.sin(ph + o + 1.6)) * 38 * walk;
		const a2 = a1 + (bend * Math.PI) / 180;
		const kx = hx + Math.sin(a1) * 44;
		const ky = hy + Math.cos(a1) * 44;
		const px = kx + Math.sin(a2) * 46;
		const py = ky + Math.cos(a2) * 46;
		return `M ${hx} ${hy} L ${kx} ${ky} L ${px} ${py} L ${px + 10} ${py}`;
	};
	const body = 'M -118 -52 C -96 -74 -20 -70 40 -66 C 70 -64 92 -52 100 -30 C 104 -10 92 4 70 6 C 30 10 -40 6 -80 4 C -108 2 -124 -20 -118 -52 Z';
	const neck = 'M 62 -56 C 80 -86 104 -110 124 -118 L 146 -96 C 124 -84 104 -60 96 -30 Z';
	const head = `M 116 -126 C 132 -142 160 -140 174 -128 L 214 -112 C 220 -108 218 -100 210 -98 L 168 -94 C 150 -90 128 -96 118 -108 Z`;
	const ear = 'M 128 -134 L 120 -196 L 156 -140 Z';
	const tail = `M -116 -48 C -150 -40 -160 ${-10 + Math.sin(ph) * 6} -176 ${8 + Math.sin(ph) * 8}`;
	return (
		<g transform={`translate(${x} ${y + bob}) scale(${s})`}>
			<g stroke={color} strokeWidth={11} strokeLinecap="round" strokeLinejoin="round" fill="none">
				<path d={leg(-96, -8, Math.PI, false)} opacity={0.75} />
				<path d={leg(66, -2, 0, true)} opacity={0.75} />
			</g>
			<path d={tail} stroke={color} strokeWidth={7} fill="none" strokeLinecap="round" />
			<path d={body} fill={color} />
			<path d={neck} fill={color} />
			<g transform={`rotate(${look * -18} 130 -110)`}>
				<path d={head} fill={color} />
				<path d={ear} fill={color} />
				<circle cx={160} cy={-118} r={4} fill={C.flama} opacity={0.9} />
			</g>
			<g stroke={color} strokeWidth={12} strokeLinecap="round" strokeLinejoin="round" fill="none">
				<path d={leg(-80, -8, 0, false)} />
				<path d={leg(80, -2, Math.PI, true)} />
			</g>
			{/* luz de luna en el borde superior */}
			<path d="M -112 -58 C -90 -76 -20 -72 40 -68 C 70 -66 88 -56 98 -40" stroke={rim} strokeWidth={2.5} fill="none" opacity={0.7} vectorEffect="non-scaling-stroke" />
			<path d="M 64 -60 C 82 -90 104 -112 122 -120" stroke={rim} strokeWidth={2.5} fill="none" opacity={0.65} vectorEffect="non-scaling-stroke" />
			<path d="M 120 -136 L 122 -190 M 132 -140 C 150 -144 168 -134 210 -112" stroke={rim} strokeWidth={2} fill="none" opacity={0.55} vectorEffect="non-scaling-stroke" />
		</g>
	);
};

// Almas: luces flotantes con reflejo en el agua
type Soul = {x: number; y: number; r: number; a: number};
const Souls: React.FC<{souls: Soul[]; water?: number; f: number}> = ({souls, water, f}) => {
	const ref = useCanvasDraw(
		(ctx) => {
			ctx.globalCompositeOperation = 'lighter';
			const dot = (x: number, y: number, r: number, a: number) => {
				const g = ctx.createRadialGradient(x, y, 0, x, y, r * 5);
				g.addColorStop(0, rgba('#FFF6DA', a));
				g.addColorStop(0.2, rgba(C.flama, a * 0.8));
				g.addColorStop(0.55, rgba(C.cempa, a * 0.25));
				g.addColorStop(1, rgba(C.cempa, 0));
				ctx.fillStyle = g;
				ctx.fillRect(x - r * 5, y - r * 5, r * 10, r * 10);
			};
			souls.forEach(({x, y, r, a}) => {
				dot(x, y, r, a);
				if (water !== undefined && y < water) {
					const ry = water + (water - y) * 0.9;
					ctx.save();
					ctx.translate(x, ry);
					ctx.scale(1, 1.8);
					dot(0, 0, r * 0.9, a * 0.35);
					ctx.restore();
				}
			});
		},
		[f, souls.length],
	);
	return <canvas ref={ref} width={W} height={H} style={{position: 'absolute', inset: 0, mixBlendMode: 'screen'}} />;
};

const soulPath = (i: number, t: number, leaderX: number, waterY: number) => {
	const lag = 60 + i * 34;
	const x = leaderX - lag + noise2D('sx', i, t * 0.6) * 20;
	const y = waterY - 30 - 50 * hash(i, 3) + noise2D('sy', i, t * 0.8) * 14;
	return {x, y, r: 4 + 3 * hash(i, 4), a: 0.75 + 0.25 * Math.sin(t * 3 + i)};
};

const River: React.FC<{t: number; waterY: number}> = ({t, waterY}) => (
	<>
		<div style={{position: 'absolute', left: 0, top: waterY, width: W, height: H - waterY, background: 'linear-gradient(180deg,#0a0a12,#040308)'}} />
		{Array.from({length: 26}).map((_, i) => {
			const yy = waterY + 6 + i * i * 1.6;
			const off = Math.sin(t * 1.3 + i * 1.1) * (6 + i);
			return <div key={i} style={{position: 'absolute', left: -60 + off, top: yy, width: W + 120, height: 1.5 + i * 0.1, background: rgba(C.marfil, 0.035 + 0.02 * Math.sin(t * 2 + i))}} />;
		})}
	</>
);

const Orilla: React.FC = () => {
	const f = useCurrentFrame();
	const t = f / FPS;
	const waterY = 1390;
	const dogX = lerp(-300, 700, f / C14.S1);
	const souls = Array.from({length: 7}).map((_, i) => soulPath(i, t, dogX, waterY)).filter((s) => s.x > -50);
	return (
		<AbsoluteFill>
			<Sky t={t} top="#03030a" mid="#0a0a16" horizon="#1a1420" hy={1250} stars={200} />
			<Orb x={870} y={640} r={52} color={C.marfil} core="#FFFBF0" halo={4} o={0.9} />
			<Ridge seed={141} y={1180} amp={90} color="#0e0b14" rim={C.marfil} rimO={0.18} shadow={false} />
			<Fog y={1240} color="#8a7a90" o={0.12} />
			<River t={t} waterY={waterY} />
			{/* reflejo de la luna */}
			<div style={{position: "absolute", left: 840, top: waterY, width: 60, height: 500, background: `linear-gradient(180deg, ${rgba(C.marfil, 0.25)}, transparent)`, filter: 'blur(6px)'}} />
			{/* orilla donde camina */}
			<svg width={W} height={H} style={{position: 'absolute', inset: 0}}>
				<path d={`M -50 ${waterY - 4} Q 540 ${waterY - 18} 1130 ${waterY - 4} L 1130 ${waterY + 6} L -50 ${waterY + 6} Z`} fill="#0b0809" />
				<Xolo x={dogX} y={waterY - 6} s={2.0} t={t} />
			</svg>
			<Souls souls={souls} water={waterY + 4} f={f} />
			<Fog y={waterY + 60} color="#c8b8c8" o={0.08} h={240} />
			<PaperTexture o={0.18} />
			<Kinetic text={'Para cruzar el río,\nun perro fiel guía el camino.'} f={f} at={14} out={110} y={340} size={48} />
		</AbsoluteFill>
	);
};

const Almas: React.FC = () => {
	const f = useCurrentFrame();
	const t = f / FPS + 5;
	const waterY = 1150;
	const lead = lerp(200, 1300, f / C14.S2);
	const souls = Array.from({length: 18}).map((_, i) => {
		const s = soulPath(i, t, lead, waterY);
		return {...s, y: s.y - 60 * hash(i, 8), r: s.r * 1.6};
	});
	return (
		<AbsoluteFill>
			<Sky t={t} top="#020208" mid="#08080f" horizon="#140e16" hy={waterY} stars={120} />
			<River t={t} waterY={waterY} />
			<Souls souls={souls} water={waterY} f={f} />
			<Light x={lead - 300} y={waterY} r={700} color={C.cempa} o={0.2} />
			<PaperTexture o={0.18} />
			<Kinetic text={'Xólotl nunca deja\na nadie atrás.'} f={f} at={10} out={82} y={380} size={52} />
		</AbsoluteFill>
	);
};

const Mirada: React.FC = () => {
	const f = useCurrentFrame();
	const t = f / FPS + 8;
	const look = E.inOut(clamp((f - 18) / 22));
	const fl = flicker(t, 14);
	return (
		<AbsoluteFill style={{background: '#040306'}}>
			<Light x={980} y={760} r={900} color={C.cempa} o={0.45 * fl} />
			<Light x={980} y={760} r={260} color={C.flama} o={0.35 * fl} />
			<svg width={W} height={H} style={{position: 'absolute', inset: 0, overflow: 'visible'}}>
				<Xolo x={30} y={1250} s={3.6} t={t} walk={0} color="#0c0809" rim={C.flama} look={look} />
			</svg>
			<Souls souls={Array.from({length: 6}).map((_, i) => ({x: 760 + hash(i, 1) * 280 + noise2D('m', i, t) * 20, y: 600 + hash(i, 2) * 400 + noise2D('n', i, t) * 20, r: 6, a: 0.8}))} f={f} />
			<PaperTexture o={0.18} />
		</AbsoluteFill>
	);
};

const RioNumero: React.FC<{dias: number; fecha: string}> = ({dias, fecha}) => {
	const f = useCurrentFrame();
	const t = f / FPS + 11;
	const txt = String(dias);
	const g = useGlyph(txt, numSize(txt), 30, 4);
	const HIT = C14.HIT;
	const ref = useCanvasDraw(
		(ctx) => {
			if (!g) return;
			ctx.globalCompositeOperation = 'lighter';
			g.pts.forEach(([gx, gy], i) => {
				const tx = 540 + gx;
				const ty = NUM_Y + gy;
				// las almas llegan río abajo, desde la izquierda, en fila serpenteante
				const d = (i / g.pts.length) * 30 + hash(i, 2) * 10;
				const a = E.inOut(clamp((f - d) / 36));
				const sx = -150 - hash(i, 3) * 400;
				const sy = 400 + hash(i, 4) * 1100;
				const x = lerp(sx, tx, a) + (1 - a) * Math.sin(t * 2 + i) * 40;
				const y = lerp(sy, ty, a);
				const al = 0.85 + 0.15 * Math.sin(t * 4 + i);
				const r = 5 + 2 * hash(i, 5);
				const gr = ctx.createRadialGradient(x, y, 0, x, y, r * 4.5);
				gr.addColorStop(0, rgba('#FFF6DA', al));
				gr.addColorStop(0.22, rgba(C.flama, al * 0.75));
				gr.addColorStop(1, rgba(C.cempa, 0));
				ctx.fillStyle = gr;
				ctx.fillRect(x - r * 4.5, y - r * 4.5, r * 9, r * 9);
				// onda en el agua al posarse
				const land = d + 36;
				const u = (f - land) / 26;
				if (u > 0 && u < 1) {
					ctx.strokeStyle = rgba(C.flama, 0.35 * (1 - u));
					ctx.lineWidth = 1.5;
					ctx.beginPath();
					ctx.ellipse(tx, ty, 6 + u * 40, (6 + u * 40) * 0.45, 0, 0, Math.PI * 2);
					ctx.stroke();
				}
			});
		},
		[g, f],
	);
	return (
		<AbsoluteFill style={{background: 'radial-gradient(ellipse at 50% 45%, #10101c, #040308 70%)'}}>
			{/* corriente del río vista desde arriba */}
			{Array.from({length: 40}).map((_, i) => {
				const y = 40 + i * 48;
				const off = ((t * 60 + i * 37) % 300) - 150;
				return <div key={i} style={{position: 'absolute', left: off - 200, top: y, width: 700 + (i % 5) * 120, height: 2, background: rgba(C.marfil, 0.04), transform: `rotate(${-4 + (i % 3)}deg)`}} />;
			})}
			<GoldNumber txt={txt} o={ramp(f, [HIT - 4, HIT + 26], [0, 0.4], E.out)} blur={10} glow={0.55} />
			<canvas ref={ref} width={W} height={H} style={{position: 'absolute', inset: 0, mixBlendMode: 'screen'}} />
			<Lockup f={f} at={HIT + 4} dias={dias} fecha={fecha} />
			<PaperTexture o={0.14} />
			<AbsoluteFill style={{background: '#000', opacity: ramp(f, [C14.REV - 8, C14.REV - 1], [0, 1], E.inOut)}} />
		</AbsoluteFill>
	);
};

export const Cap14: React.FC<{dias: number; fecha: string}> = ({dias, fecha}) => {
	const f = useCurrentFrame();
	const a = C14.S1;
	const b = a + C14.S2;
	const c = b + C14.S3;
	return (
		<AbsoluteFill style={{background: '#000'}}>
			<Sequence durationInFrames={a}>
				<Orilla />
			</Sequence>
			<Sequence from={a} durationInFrames={C14.S2}>
				<Almas />
			</Sequence>
			<Sequence from={b} durationInFrames={C14.S3}>
				<Mirada />
			</Sequence>
			<Sequence from={c} durationInFrames={C14.REV}>
				<RioNumero dias={dias} fecha={fecha} />
			</Sequence>
			<Dip f={f} at={a} dur={14} />
			<LightLeak f={f} at={b} dur={14} color={C.cempa} />
			<Dip f={f} at={c} dur={12} />
		</AbsoluteFill>
	);
};
