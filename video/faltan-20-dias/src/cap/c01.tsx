import React from 'react';
import {AbsoluteFill, Sequence, useCurrentFrame} from 'remotion';
import {C, E, FPS, H, W, clamp, flicker, hash, lerp, ramp, rgba} from '../lib/util';
import {Flame, Light, PaperTexture, useCanvasDraw} from '../components/core';
import {drawPetal} from '../components/Particles';
import {MarcoFoto} from '../components/Objetos';
import {useGlyph} from '../countdown/reveals';
import {Orb, Ridge, Sky} from './kit/land';
import {Hummingbird, Maguey} from './kit/props';
import {GoldNumber, Kinetic, Lockup, NUM_Y, numSize} from './kit/type';
import {Dip, LightLeak} from './kit/transitions';
import {drawMonarch} from './c13';
import {Xolo} from './c14';
import {Alebrije, Patrones} from './c05';
import {Altar, MARCO, PULL0, VELAS, flameTop} from './c03';

// Capítulo 1 (REEL) · "Ya vienen" — el final de temporada: todo lo que contamos viene por el camino,
// llega al altar ya puesto y se arremolina en el último número.
export const C01 = {S1: 96, S2: 210, S3: 96, REV: 186, HIT: 92};
export const C01_LEN = C01.S1 + C01.S2 + C01.S3 + C01.REV;

const HZ = 1000;

// conos volcánicos en el horizonte (Popocatépetl e Iztaccíhuatl, en papel recortado)
const volcanes = `M -100 ${HZ + 10} L 80 ${HZ - 120} C 140 ${HZ - 160} 200 ${HZ - 250} 250 ${HZ - 300} L 300 ${HZ - 300} C 350 ${HZ - 250} 420 ${HZ - 150} 520 ${HZ - 90} C 600 ${HZ - 130} 640 ${HZ - 160} 700 ${HZ - 170} C 760 ${HZ - 190} 820 ${HZ - 180} 880 ${HZ - 150} C 960 ${HZ - 110} 1060 ${HZ - 60} 1180 ${HZ - 30} L 1180 ${HZ + 10} Z`;

const Noche: React.FC<{t: number; moon?: boolean}> = ({t, moon = true}) => (
	<AbsoluteFill>
		<Sky t={t} top="#04030b" mid="#110a1a" horizon="#341a18" hy={HZ} stars={170} />
		{moon ? <Orb x={800} y={620} r={36} color="#EEE2C4" core="#FFFBEF" halo={4} o={0.85} /> : null}
		<svg width={W} height={H} style={{position: 'absolute', inset: 0}}>
			<path d={volcanes} fill="#140c14" />
			<path d={`M 250 ${HZ - 300} L 300 ${HZ - 300} L 290 ${HZ - 270} L 262 ${HZ - 274} Z M 680 ${HZ - 168} C 720 ${HZ - 186} 780 ${HZ - 188} 840 ${HZ - 168} L 800 ${HZ - 156} L 720 ${HZ - 158} Z`} fill="#c9bfae" opacity={0.35} />
		</svg>
		<Ridge seed={11} y={HZ + 10} amp={50} color="#0e0910" />
		<div style={{position: 'absolute', left: 0, top: HZ, width: W, height: H - HZ, background: 'linear-gradient(180deg, #120c12, #1c110c 50%, #24150c)'}} />
	</AbsoluteFill>
);

// ---------- 1 · Dieciséis noches ----------
const Inicio: React.FC = () => {
	const f = useCurrentFrame();
	const t = f / FPS;
	const ref = useCanvasDraw(
		(ctx) => {
			// las monarcas empiezan a levantarse desde la tierra
			for (let i = 0; i < 40; i++) {
				const st = 10 + hash(i, 1) * 60;
				const a = clamp((f - st) / 90);
				if (a <= 0) continue;
				const x = hash(i, 2) * W + Math.sin(t * 1.4 + i) * 40;
				const y = lerp(1900, 1100 - hash(i, 3) * 500, E.out(a));
				drawMonarch(ctx, x, y, 0.35 + 0.35 * hash(i, 4), Math.sin(t * 2 + i) * 0.5, t * (9 + 4 * hash(i, 5)) + i, 0.9);
			}
		},
		[f],
	);
	return (
		<AbsoluteFill>
			<Noche t={t} />
			<Light x={540} y={HZ} r={700} sy={0.4} color={C.cempa} o={0.3} />
			<canvas ref={ref} width={W} height={H} style={{position: 'absolute', inset: 0}} />
			<PaperTexture o={0.14} />
			<Kinetic text={'Dieciséis noches,\ndieciséis historias.'} f={f} at={10} out={84} y={330} size={54} scrim={0.55} />
		</AbsoluteFill>
	);
};

// ---------- 2 · Todo viene por el camino ----------
const pathAt = (u: number) => {
	const z = 1 + u * 11;
	return {x: 540 + (Math.sin(u * 6 + 0.5) * 300 * Math.min(1, u * 3) * 1.6) / z, y: HZ + 980 / z, s: 1 / z};
};

const Viaje: React.FC = () => {
	const f = useCurrentFrame();
	const t = f / FPS + 4;
	const speed = 0.11;
	const ref = useCanvasDraw(
		(ctx) => {
			// pétalos del camino que corren hacia la cámara (vamos avanzando)
			const items: [number, number, number, number, number][] = [];
			for (let i = 0; i < 1300; i++) {
				const u = (((hash(i, 1) - (f / FPS) * speed) % 1) + 1) % 1;
				const p = pathAt(u);
				items.push([p.x + (hash(i, 2) - 0.5) * 300 * p.s * 1.6, p.y, (12 + 10 * hash(i, 3)) * Math.max(p.s * 3.2, 0.25), hash(i, 4) * 6.28 + t * 0.3, u]);
			}
			items.sort((a, b) => b[4] - a[4]);
			for (const [x, y, s, r, u] of items) drawPetal(ctx, x, y, s, r, 1, 0.5, 0.6 + 0.6 * Math.exp(-u * 3), hash(Math.round(x * 7), 9));
			// monarcas que acompañan
			for (let i = 0; i < 26; i++) {
				const k = (((hash(i, 11) - (f / FPS) * 0.07) % 1) + 1) % 1;
				const p = pathAt(k);
				const s = clamp(p.s * 3.6, 0.12, 0.8);
				drawMonarch(ctx, p.x + (hash(i, 12) - 0.5) * 900 * p.s * 1.4, p.y - (180 + 260 * hash(i, 13)) * p.s * 1.6, s, Math.sin(t * 2 + i) * 0.4, t * 10 + i, 0.95);
			}
		},
		[f],
	);
	// faroles que pasan a los lados
	const faroles = Array.from({length: 10}).map((_, i) => {
		const u = (((hash(i, 21) - (f / FPS) * speed) % 1) + 1) % 1;
		const p = pathAt(u);
		const side = i % 2 ? 1 : -1;
		return {x: p.x + side * 240 * p.s * 1.6, y: p.y, s: p.s * 3.4, i, u};
	});
	// tres momentos: el que guía, los que vuelan, las luces que esperan
	const xoloIn = ramp(f, [0, 20], [0, 1]) * ramp(f, [62, 80], [1, 0]);
	const flyU = clamp((f - 70) / 80);
	const hb = clamp((f - 100) / 60);
	return (
		<AbsoluteFill>
			<Noche t={t} />
			<Patrones />
			<Light x={540} y={H} r={700} sy={0.5} color={C.flama} o={0.4} />
			<svg width={W} height={H} style={{position: 'absolute', inset: 0, overflow: 'visible'}}>
				<Maguey x={40} y={1560} s={1.6} color="#0a0608" />
				<Maguey x={1040} y={1420} s={1.2} color="#0c0709" />
			</svg>
			{faroles
				.sort((a, b) => b.u - a.u)
				.map((p) => {
					const fl = flicker(t + p.i, 70 + p.i);
					return (
						<React.Fragment key={p.i}>
							<Light x={p.x} y={p.y - 40 * p.s} r={280 * p.s} color={C.flama} o={0.55 * fl} />
							<svg width={W} height={H} style={{position: 'absolute', inset: 0}}>
								<rect x={p.x - 16 * p.s} y={p.y - 40 * p.s} width={32 * p.s} height={40 * p.s} rx={3 * p.s} fill={C.cempa} />
							</svg>
							<Flame x={p.x} y={p.y - 38 * p.s} size={34 * p.s} t={t + p.i} seed={70 + p.i} fl={fl} wick={false} />
						</React.Fragment>
					);
				})}
			<canvas ref={ref} width={W} height={H} style={{position: 'absolute', inset: 0}} />
			{/* el xolo camina a nuestro lado */}
			{xoloIn > 0 ? (
				<svg width={W} height={H} style={{position: 'absolute', inset: 0, overflow: 'visible', opacity: xoloIn}}>
					<Xolo x={330} y={1620} s={1.5} t={t} walk={1.3} rim={C.flama} />
				</svg>
			) : null}
			{/* el alebrije cruza el cielo */}
			{flyU > 0 && flyU < 1 ? <Alebrije x={lerp(-350, 1450, flyU)} y={lerp(860, 560, flyU) - Math.sin(flyU * Math.PI) * 80} s={0.55} t={t} flap={1.8} glow={0.7} /> : null}
			{/* colibrí */}
			{hb > 0 && hb < 1 ? (
				<svg width={W} height={H} style={{position: 'absolute', inset: 0, overflow: 'visible'}}>
					<Hummingbird x={lerp(1200, -150, hb)} y={1180 + Math.sin(hb * 9) * 40} s={0.9} t={t} flip glow={0.6} />
				</svg>
			) : null}
			<PaperTexture o={0.14} />
			<Kinetic text={'El que guía,'} f={f} at={8} out={62} y={330} size={58} scrim={0.55} />
			<Kinetic text={'los que vuelan,'} f={f} at={74} out={132} y={330} size={58} scrim={0.55} />
			<Kinetic text={'las luces que esperan…'} f={f} at={144} out={200} y={330} size={58} scrim={0.55} />
		</AbsoluteFill>
	);
};

// ---------- 3 · El altar ya está puesto ----------
const marcoNode = (
	<MarcoFoto lit={1} w={MARCO.w} h={MARCO.h} id="c1marco">
		<rect x={-MARCO.w / 2 + 64} y={-MARCO.h / 2 + 64} width={MARCO.w - 128} height={MARCO.h - 128} fill="url(#c1in)" />
		<defs>
			<radialGradient id="c1in">
				<stop offset="0%" stopColor="#FFE9B0" stopOpacity={0.5} />
				<stop offset="60%" stopColor={C.cempa} stopOpacity={0.35} />
				<stop offset="100%" stopColor="#2a1206" stopOpacity={0.9} />
			</radialGradient>
		</defs>
	</MarcoFoto>
);

const AltarListo: React.FC<{f: number; t: number; z: number; o?: number}> = ({f, t, z, o = 1}) => (
	<AbsoluteFill style={{opacity: o, transform: `scale(${z})`, transformOrigin: '540px 1000px'}}>
		<AbsoluteFill style={{background: 'linear-gradient(180deg, #0d0705 0%, #3a2014 55%, #0a0503 72%, #070302 100%)'}} />
		<div style={{position: 'absolute', left: 0, top: 1370, width: W, height: H - 1370, background: 'linear-gradient(180deg, #1c0f08, #070302)'}} />
		<Altar f={PULL0 + 80 + f} t={t} marco={marcoNode} />
	</AbsoluteFill>
);

const Llegada: React.FC = () => {
	const f = useCurrentFrame();
	const t = f / FPS + 12;
	const z = lerp(0.92, 1.08, E.inOut(clamp(f / C01.S3)));
	const ref = useCanvasDraw(
		(ctx) => {
			for (let i = 0; i < 30; i++) {
				const a = (i / 30) * Math.PI * 2 + t * (0.5 + 0.2 * hash(i, 1));
				const r = 380 + 160 * hash(i, 2) + Math.sin(t + i) * 30;
				drawMonarch(ctx, 540 + Math.cos(a) * r, 900 + Math.sin(a) * r * 1.2, 0.4 + 0.3 * hash(i, 3), a + Math.PI / 2, t * 10 + i, 1);
			}
		},
		[f],
	);
	return (
		<AbsoluteFill style={{background: '#070302'}}>
			<AltarListo f={f} t={t} z={z} />
			<canvas ref={ref} width={W} height={H} style={{position: 'absolute', inset: 0, opacity: ramp(f, [0, 20], [0, 1])}} />
			<AbsoluteFill style={{background: 'linear-gradient(180deg, rgba(7,3,2,0.85) 0%, rgba(7,3,2,0.8) 24%, rgba(7,3,2,0) 32%)'}} />
			<PaperTexture o={0.12} />
			<Kinetic text={'La mesa está puesta.'} f={f} at={8} out={42} y={330} size={54} scrim={0.4} />
			<Kinetic text={'Ya vienen.'} f={f} at={60} out={200} y={310} size={110} font="Rye" color={C.flama} stagger={2} scrim={0.4} />
		</AbsoluteFill>
	);
};

// ---------- 4 · Todo se arremolina en el último número ----------
const Remolino: React.FC<{dias: number; fecha: string}> = ({dias, fecha}) => {
	const f = useCurrentFrame();
	const t = f / FPS + 16;
	const txt = String(dias);
	const size = numSize(txt);
	const HIT = C01.HIT;
	const g = useGlyph(txt, size, 18, 3);
	const spin = clamp((f - 8) / (HIT - 12));
	const ref = useCanvasDraw(
		(ctx) => {
			if (!g) return;
			const n = g.pts.length;
			g.pts.forEach(([gx, gy], i) => {
				// cada partícula sale de una vela del altar o del cielo y entra girando
				const src = i % 3 === 0 ? VELAS[i % VELAS.length] : null;
				const sx = src ? src.x : hash(i, 1) * W;
				const sy = src ? flameTop(src) : hash(i, 2) * H;
				const d = (i / n) * 0.35 + hash(i, 3) * 0.15;
				const a = E.inOut(clamp((spin - d) / 0.5));
				const ang0 = Math.atan2(sy - NUM_Y, sx - 540);
				const r0 = Math.hypot(sx - 540, sy - NUM_Y);
				const ang = ang0 + a * (2.6 + hash(i, 4) * 1.2);
				const rr = r0 * (1 - a);
				const vx = 540 + Math.cos(ang) * rr;
				const vy = NUM_Y + Math.sin(ang) * rr;
				const x = lerp(vx, 540 + gx, a * a);
				const y = lerp(vy, NUM_Y + gy, a * a);
				if (i % 4 === 0) {
					drawMonarch(ctx, x, y, 0.32 * (1 - 0.5 * a) + 0.1, ang + Math.PI / 2, t * 12 + i, 1);
				} else {
					drawPetal(ctx, x, y, 16 + 6 * hash(i, 5), ang + t, 1, 0.5, 1.05, hash(i, 6));
				}
			});
			// a la llegada, una estela de chispas
			ctx.globalCompositeOperation = 'lighter';
			const burst = clamp((f - HIT) / 40);
			if (burst > 0 && burst < 1) {
				for (let i = 0; i < 160; i++) {
					const a = hash(i, 7) * Math.PI * 2;
					const v = 300 + 700 * hash(i, 8);
					const x = 540 + Math.cos(a) * v * E.out(burst);
					const y = NUM_Y + Math.sin(a) * v * E.out(burst) + 400 * burst * burst;
					const al = (1 - burst) * 0.9;
					const gr = ctx.createRadialGradient(x, y, 0, x, y, 10);
					gr.addColorStop(0, rgba('#FFF4D6', al));
					gr.addColorStop(1, rgba(C.cempa, 0));
					ctx.fillStyle = gr;
					ctx.fillRect(x - 10, y - 10, 20, 20);
				}
			}
		},
		[f, g, spin],
	);
	// pétalos que caen como lluvia de celebración después del golpe
	const rain = useCanvasDraw(
		(ctx) => {
			const k = clamp((f - HIT) / 20);
			if (k <= 0) return;
			for (let i = 0; i < 160; i++) {
				const st = HIT + hash(i, 1) * 40;
				const tt = (f - st) / FPS;
				if (tt < 0) continue;
				const x = hash(i, 2) * W + Math.sin(tt * 1.5 + i) * 50;
				const y = -40 + tt * (220 + 120 * hash(i, 3));
				drawPetal(ctx, x, y, 18 + 8 * hash(i, 4), tt * 2 + i, Math.cos(tt * 3 + i), 0.5, 0.9, hash(i, 5));
			}
		},
		[f],
	);
	const gold = ramp(f, [HIT - 4, HIT + 10], [0, 1], E.out);
	const flash = Math.sin(Math.PI * clamp((f - HIT + 2) / 9));
	return (
		<AbsoluteFill style={{background: '#070302'}}>
			<AltarListo f={C01.S3 + f} t={t} z={1.08} o={lerp(1, 0.28, E.inOut(clamp(f / 40)))} />
			<AbsoluteFill style={{background: 'radial-gradient(ellipse at 50% 45%, rgba(40,18,8,0.2), rgba(7,3,2,0.8) 75%)'}} />
			<Light x={540} y={NUM_Y} r={800} color={C.flama} o={0.2 + 0.3 * gold} />
			<canvas ref={ref} width={W} height={H} style={{position: 'absolute', inset: 0, opacity: 1 - 0.75 * gold}} />
			<GoldNumber txt={txt} o={gold} glow={0.5 + 0.3 * gold} scale={lerp(1.15, 1, gold)} />
			<canvas ref={rain} width={W} height={H} style={{position: 'absolute', inset: 0}} />
			<AbsoluteFill style={{background: '#FFE9B8', opacity: 0.32 * flash, mixBlendMode: 'screen'}} />
			<Lockup f={f} at={HIT + 4} dias={dias} fecha={fecha} />
			<Kinetic text={'Te esperamos.'} f={f} at={HIT + 34} y={1430} size={50} />
			<PaperTexture o={0.12} />
			<AbsoluteFill style={{background: '#000', opacity: ramp(f, [C01.REV - 8, C01.REV - 1], [0, 1], E.inOut)}} />
		</AbsoluteFill>
	);
};

export const Cap01: React.FC<{dias: number; fecha: string}> = ({dias, fecha}) => {
	const f = useCurrentFrame();
	const a = C01.S1;
	const b = a + C01.S2;
	const c = b + C01.S3;
	return (
		<AbsoluteFill style={{background: '#000'}}>
			<Sequence durationInFrames={a}>
				<Inicio />
			</Sequence>
			<Sequence from={a} durationInFrames={C01.S2}>
				<Viaje />
			</Sequence>
			<Sequence from={b} durationInFrames={C01.S3}>
				<Llegada />
			</Sequence>
			<Sequence from={c} durationInFrames={C01.REV}>
				<Remolino dias={dias} fecha={fecha} />
			</Sequence>
			<Dip f={f} at={a} dur={10} />
			<LightLeak f={f} at={b} dur={18} />
		</AbsoluteFill>
	);
};
