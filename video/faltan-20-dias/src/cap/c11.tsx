import React from 'react';
import {AbsoluteFill, Sequence, useCurrentFrame} from 'remotion';
import {noise2D} from '@remotion/noise';
import {C, E, FPS, H, W, clamp, flicker, hash, lerp, ramp, rgba} from '../lib/util';
import {Flame, Light, PaperTexture, useCanvasDraw} from '../components/core';
import {drawPetal} from '../components/Particles';
import {Fog, Orb, Sky} from './kit/land';
import {Kinetic, Lockup, NUM_Y, numSize} from './kit/type';
import {Dip} from './kit/transitions';

// Capítulo 11 · "La Llorona" — en el río, alguien sigue buscando… y cada noche enciende una luz.
export const C11 = {S1: 126, S2: 96, S3: 72, REV: 126, HIT: 60};
export const C11_LEN = C11.S1 + C11.S2 + C11.S3 + C11.REV;

// Ramas de sauce llorón que cuelgan y se mecen
const Sauce: React.FC<{t: number; x0: number; x1: number; n?: number; seed: number; color?: string; len?: number}> = ({t, x0, x1, n = 22, seed, color = '#07060a', len = 900}) => (
	<svg width={W} height={H} style={{position: 'absolute', inset: 0, overflow: 'visible'}}>
		{Array.from({length: n}).map((_, i) => {
			const x = x0 + (i / n) * (x1 - x0) + hash(i, seed) * 30;
			const L = len * (0.6 + 0.5 * hash(i, seed + 1));
			const sw = noise2D('sau' + seed, i * 0.3, t * 0.4) * 40;
			const d = `M ${x} -20 C ${x + sw * 0.2} ${L * 0.3} ${x + sw * 0.7} ${L * 0.65} ${x + sw} ${L}`;
			return (
				<g key={i}>
					<path d={d} stroke={color} strokeWidth={3} fill="none" />
					{Array.from({length: 14}).map((_, k) => {
						const u = (k + 1) / 15;
						const px = x + sw * u ** 1.5;
						const py = L * u;
						return <path key={k} d={`M ${px} ${py} q ${k % 2 ? 10 : -10} 12 ${k % 2 ? 4 : -4} 30`} stroke={color} strokeWidth={5} fill="none" strokeLinecap="round" />;
					})}
				</g>
			);
		})}
	</svg>
);

// Rebozo blanco a la deriva: tela con pliegues, rayas y flecos (rapacejo)
const Rebozo: React.FC<{x: number; y: number; t: number; s?: number; o?: number}> = ({x, y, t, s = 1, o = 0.85}) => {
	const N = 24;
	const edge = (base: number, amp: number, ph: number) =>
		Array.from({length: N + 1}).map((_, i) => {
			const u = i / N;
			return [-300 + u * 600, base + Math.sin(u * 9 + t * 1.5 + ph) * amp + Math.sin(u * 3.3 - t * 0.7) * amp * 0.8] as const;
		});
	const top = edge(-55, 16, 0);
	const bot = edge(55, 22, 1.1);
	const d = `M ${top.map(([a, b]) => `${a} ${b}`).join(' L ')} L ${bot.slice().reverse().map(([a, b]) => `${a} ${b}`).join(' L ')} Z`;
	return (
		<svg width={W} height={H} style={{position: 'absolute', inset: 0, overflow: 'visible'}}>
			<defs>
				<linearGradient id="rbz" x1="0" y1="0" x2="1" y2="0">
					<stop offset="0%" stopColor="#FFF8F0" stopOpacity={0.15} />
					<stop offset="20%" stopColor="#FFF8F0" stopOpacity={0.92} />
					<stop offset="80%" stopColor="#EEE4DA" stopOpacity={0.88} />
					<stop offset="100%" stopColor="#EEE4DA" stopOpacity={0.15} />
				</linearGradient>
			</defs>
			<g transform={`translate(${x} ${y}) scale(${s} ${s * 0.8})`} opacity={o}>
				<path d={d} fill="url(#rbz)" />
				{/* pliegues */}
				{Array.from({length: 9}).map((_, k) => {
					const i = 2 + k * 2.4;
					const a = top[Math.round(i)];
					const b = bot[Math.round(i)];
					return <path key={k} d={`M ${a[0]} ${a[1]} Q ${a[0] + 14} ${(a[1] + b[1]) / 2} ${b[0]} ${b[1]}`} stroke="#B8AEB8" strokeOpacity={0.35} strokeWidth={6} fill="none" />;
				})}
				{/* rayas del rebozo */}
				{[-30, -10, 10, 30].map((off, k) => (
					<path key={'r' + k} d={`M ${top.map(([a], i) => `${a} ${(top[i][1] + bot[i][1]) / 2 + off * (1 + 0.2 * Math.sin(i))}`).join(' L ')}`} stroke="#9a8ea0" strokeOpacity={0.22} strokeWidth={3} fill="none" />
				))}
				{/* flecos */}
				{[top[0], top[N]].map(([ex], side) =>
					Array.from({length: 10}).map((_, k) => {
						const yy = -50 + k * 11;
						const dir = side ? 1 : -1;
						return <path key={`${side}-${k}`} d={`M ${ex} ${yy} q ${dir * 22} ${Math.sin(t * 2 + k) * 6} ${dir * 44} ${6 + Math.sin(t * 2 + k) * 8}`} stroke="#EEE4DA" strokeOpacity={0.55} strokeWidth={2.5} fill="none" />;
					}),
				)}
			</g>
			{/* reflejo tenue */}
			<g transform={`translate(${x} ${y + 70 * s}) scale(${s} ${-s * 0.5})`} opacity={o * 0.18}>
				<path d={d} fill="#EEE4DA" style={{filter: 'blur(4px)'}} />
			</g>
		</svg>
	);
};

// Velitas en barquitos de papel
const Barcos: React.FC<{t: number; n: number; seed: number; y0: number; spread: number; s?: number; drift?: number}> = ({t, n, seed, y0, spread, s = 1, drift = 20}) => (
	<>
		{Array.from({length: n}).map((_, i) => {
			const x = (hash(i, seed) * (W + 300) - 150 + t * drift * (0.6 + hash(i, seed + 1))) % (W + 300) - 50;
			const y = y0 + hash(i, seed + 2) * spread;
			const k = s * (0.6 + 0.6 * ((y - y0) / spread));
			const bob = Math.sin(t * 1.5 + i) * 3 * k;
			return (
				<React.Fragment key={i}>
					<svg width={W} height={H} style={{position: 'absolute', inset: 0, overflow: 'visible'}}>
						<g transform={`translate(${x} ${y + bob}) scale(${k})`}>
							<path d="M -40 0 L 40 0 L 26 16 L -26 16 Z" fill="#E8D8C0" opacity={0.85} />
							<path d="M -40 0 L 0 -26 L 40 0 Z" fill="#D9CDB6" opacity={0.7} />
						</g>
					</svg>
					<Flame x={x} y={y + bob - 22 * k} size={34 * k} t={t + i} seed={300 + i} />
					<Light x={x} y={y + bob - 30 * k} r={160 * k} color={C.cempa} o={0.45} />
					<div style={{position: 'absolute', left: x - 6 * k, top: y + bob + 18 * k, width: 12 * k, height: 90 * k, background: `linear-gradient(180deg, ${rgba(C.flama, 0.45)}, transparent)`, filter: 'blur(3px)'}} />
				</React.Fragment>
			);
		})}
	</>
);

const Water: React.FC<{y: number; t: number}> = ({y, t}) => (
	<>
		<div style={{position: 'absolute', left: 0, top: y, width: W, height: H - y, background: 'linear-gradient(180deg,#0b0b14,#040308)'}} />
		{Array.from({length: 26}).map((_, i) => {
			const yy = y + 6 + i * i * 1.7;
			const off = Math.sin(t * 1.1 + i * 1.2) * (5 + i);
			return <div key={i} style={{position: 'absolute', left: -60 + off, top: yy, width: W + 120, height: 1.5 + i * 0.1, background: rgba('#D8D0E8', 0.03 + 0.015 * Math.sin(t * 2 + i))}} />;
		})}
	</>
);

const Rio: React.FC = () => {
	const f = useCurrentFrame();
	const t = f / FPS;
	const drift = ramp(f, [0, C11.S1], [0, 1], E.inOut);
	return (
		<AbsoluteFill>
			<Sky t={t} top="#030308" mid="#0a0a14" horizon="#16141e" hy={1150} stars={120} />
			<Orb x={760} y={520} r={58} color="#E8E0F0" core="#FFFFFF" halo={4} o={0.8} />
			<Water y={1150} t={t} />
			<div style={{position: 'absolute', left: 730, top: 1150, width: 60, height: 600, background: `linear-gradient(180deg, ${rgba('#E8E0F0', 0.28)}, transparent)`, filter: 'blur(8px)'}} />
			<Rebozo x={lerp(300, 620, drift)} y={1380} t={t} s={1.1} />
			<Fog y={1180} color="#B8B0C8" o={0.14} h={300} />
			<Sauce t={t} x0={-80} x1={360} seed={111} />
			<Sauce t={t + 2} x0={800} x1={1160} n={12} seed={112} len={700} />
			<PaperTexture o={0.18} />
			<Kinetic text={'Dicen que en el río\nalguien sigue buscando…'} f={f} at={14} out={110} y={1580} size={48} color="#EDE6F2" glow="#B8B0C8" />
		</AbsoluteFill>
	);
};

const Velas: React.FC = () => {
	const f = useCurrentFrame();
	const t = f / FPS + 6;
	const fl = flicker(t, 11);
	return (
		<AbsoluteFill>
			<Sky t={t} top="#030308" mid="#08080f" horizon="#140f16" hy={900} stars={80} />
			<Water y={900} t={t} />
			<Light x={540} y={1300} r={900} color={C.cempa} o={0.25 * fl} />
			<Barcos t={t} n={9} seed={113} y0={980} spread={760} s={1.6} />
			<Fog y={940} color="#B8B0C8" o={0.1} h={240} />
			<PaperTexture o={0.18} />
			<Kinetic text={'…y cada noche\nenciende una luz.'} f={f} at={8} out={84} y={340} size={52} color="#EDE6F2" glow={C.cempa} />
		</AbsoluteFill>
	);
};

// El rebozo sube con el viento y se deshace en pétalos de cempasúchil
const Viento: React.FC = () => {
	const f = useCurrentFrame();
	const t = f / FPS + 9;
	const u = E.inOut(clamp(f / C11.S3));
	const ref = useCanvasDraw(
		(ctx) => {
			for (let i = 0; i < 160; i++) {
				const r = (q: number) => hash(i * 5 + q, 114);
				const born = r(1) * 0.7;
				const p = clamp((u - born) / 0.5);
				if (p <= 0) continue;
				const x = 540 + (r(2) - 0.5) * 420 + p * (200 + 500 * r(3)) + Math.sin(t * 2 + i) * 20;
				const y = 1250 - (r(4) - 0.5) * 80 - p * (600 + 600 * r(5));
				drawPetal(ctx, x, y, 22 + 16 * r(6), r(7) * 6.28 + t * 2, Math.cos(t * 4 + i), 0.85, 0.8 + 0.3 * r(8), r(9));
			}
		},
		[f],
	);
	return (
		<AbsoluteFill style={{background: '#050308'}}>
			<Light x={540} y={1100} r={900} color={C.cempa} o={0.3} />
			<Sauce t={t} x0={-120} x1={1200} n={26} seed={115} len={1100} color="#08070c" />
			<Rebozo x={540 + u * 200} y={1250 - u * 500} t={t * 2} s={1.6 + u} o={0.85 * (1 - u)} />
			<canvas ref={ref} width={W} height={H} style={{position: 'absolute', inset: 0}} />
			<PaperTexture o={0.18} />
		</AbsoluteFill>
	);
};

const Reflejo: React.FC<{dias: number; fecha: string}> = ({dias, fecha}) => {
	const f = useCurrentFrame();
	const t = f / FPS + 12;
	const txt = String(dias);
	const HIT = C11.HIT;
	const DROP = 10;
	const rr = Math.max(0, (f - DROP) * 26);
	// el número tiembla en el agua y se aquieta al llegar la onda
	const calm = E.out(clamp((f - HIT) / 40));
	const size = numSize(txt);
	return (
		<AbsoluteFill style={{background: 'radial-gradient(ellipse at 50% 45%, #10101a, #030206 70%)'}}>
			{/* reflejo de la luna partido en bandas */}
			{Array.from({length: 30}).map((_, i) => {
				const y = 160 + i * 58;
				const off = Math.sin(t * 1.4 + i * 0.9) * (14 + (1 - calm) * 20);
				return <div key={i} style={{position: 'absolute', left: 0, top: y, width: W, height: 2, background: rgba('#D8D0E8', 0.04), transform: `translateX(${off}px)`}} />;
			})}
			{/* el número en el agua, revelado por la onda */}
			<div style={{position: 'absolute', inset: 0, clipPath: `circle(${rr}px at 540px ${NUM_Y}px)`}}>
				{Array.from({length: 24}).map((_, i) => {
					const band = size / 24;
					const top = NUM_Y - size / 2 + i * band;
					const off = Math.sin(t * 3 + i * 0.8) * (1 - calm) * 22 + Math.sin(t * 1.2 + i) * 2;
					return (
						<div key={i} style={{position: 'absolute', left: off, top, width: W, height: band + 1, overflow: 'hidden'}}>
							<div
								style={{
									position: 'absolute',
									left: 0,
									top: -i * band,
									width: W,
									height: size,
									lineHeight: `${size}px`,
									textAlign: 'center',
									fontFamily: 'Rye',
									fontSize: size,
									backgroundImage: `linear-gradient(180deg, #FFF6E0 0%, ${C.flama} 35%, ${C.cempa} 70%, ${C.terracota} 100%)`,
									WebkitBackgroundClip: 'text',
									backgroundClip: 'text',
									color: 'transparent',
									opacity: 0.55 + 0.45 * calm,
								}}
							>
								{txt}
							</div>
						</div>
					);
				})}
				<div style={{position: 'absolute', left: 0, width: W, top: NUM_Y - size / 2, height: size, lineHeight: `${size}px`, textAlign: 'center', fontFamily: 'Rye', fontSize: size, color: C.cempa, filter: 'blur(26px)', opacity: 0.5 * calm}}>
					{txt}
				</div>
			</div>
			{/* anillos de la gota */}
			<svg width={W} height={H} style={{position: 'absolute', inset: 0}}>
				{[0, 9, 18].map((d, k) => {
					const r2 = Math.max(0, (f - DROP - d) * 24);
					const o = clamp(1 - r2 / 1200) * (f > DROP + d ? 1 : 0);
					return <ellipse key={k} cx={540} cy={NUM_Y} rx={r2} ry={r2 * 0.42} fill="none" stroke={rgba('#F4EAD8', 0.5 * o)} strokeWidth={2.5} />;
				})}
				{f < DROP + 4 ? <circle cx={540} cy={lerp(200, NUM_Y, clamp(f / DROP))} r={7} fill="#FFF4D6" /> : null}
			</svg>
			<Lockup f={f} at={HIT + 4} dias={dias} fecha={fecha} />
			<PaperTexture o={0.14} />
			<AbsoluteFill style={{background: '#000', opacity: ramp(f, [C11.REV - 8, C11.REV - 1], [0, 1], E.inOut)}} />
		</AbsoluteFill>
	);
};

export const Cap11: React.FC<{dias: number; fecha: string}> = ({dias, fecha}) => {
	const f = useCurrentFrame();
	const a = C11.S1;
	const b = a + C11.S2;
	const c = b + C11.S3;
	return (
		<AbsoluteFill style={{background: '#000'}}>
			<Sequence durationInFrames={a}>
				<Rio />
			</Sequence>
			<Sequence from={a} durationInFrames={C11.S2}>
				<Velas />
			</Sequence>
			<Sequence from={b} durationInFrames={C11.S3}>
				<Viento />
			</Sequence>
			<Sequence from={c} durationInFrames={C11.REV}>
				<Reflejo dias={dias} fecha={fecha} />
			</Sequence>
			<Dip f={f} at={a} dur={16} />
			<Dip f={f} at={b} dur={12} />
			<Dip f={f} at={c} dur={12} />
		</AbsoluteFill>
	);
};
