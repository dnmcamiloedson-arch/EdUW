import React from 'react';
import {AbsoluteFill, Sequence, useCurrentFrame} from 'remotion';
import {noise2D} from '@remotion/noise';
import {C, E, FPS, H, W, clamp, hash, lerp, ramp, rgba} from '../lib/util';
import {Light, PaperTexture, useCanvasDraw} from '../components/core';
import {Smoke} from '../components/Particles';
import {Kinetic, Lockup, NUM_Y, numSize} from './kit/type';
import {Dip, LightLeak} from './kit/transitions';

// Capítulo 5 · "Alebrijes" — criaturas de colores nacidas de un sueño; dicen que cada quien tiene uno que lo guía.
export const C05 = {S1: 108, S2: 120, S3: 72, REV: 126, HIT: 64};
export const C05_LEN = C05.S1 + C05.S2 + C05.S3 + C05.REV;

const PAL = [C.cempa, C.flama, C.verde, C.terracota, C.marfil, '#2f8a5e', '#F79A3A'];
const OUT = '#120806';

// Patrones de alebrije reutilizables (SVG <pattern>)
export const Patrones: React.FC = () => (
	<svg width={0} height={0} style={{position: 'absolute'}}>
		<defs>
			<pattern id="alZig" width={60} height={40} patternUnits="userSpaceOnUse">
				<rect width={60} height={40} fill={C.flama} />
				<path d="M 0 30 L 15 10 L 30 30 L 45 10 L 60 30" stroke={C.terracota} strokeWidth={7} fill="none" />
				<circle cx={15} cy={36} r={3} fill={C.verde} />
				<circle cx={45} cy={36} r={3} fill={C.verde} />
			</pattern>
			<pattern id="alDots" width={44} height={44} patternUnits="userSpaceOnUse">
				<rect width={44} height={44} fill={C.verde} />
				<circle cx={11} cy={11} r={7} fill={C.flama} />
				<circle cx={33} cy={33} r={7} fill={C.cempa} />
				<circle cx={33} cy={11} r={3} fill={C.marfil} />
				<circle cx={11} cy={33} r={3} fill={C.marfil} />
			</pattern>
			<pattern id="alStripe" width={50} height={50} patternUnits="userSpaceOnUse" patternTransform="rotate(35)">
				<rect width={50} height={50} fill={C.cempa} />
				<rect width={14} height={50} fill={C.terracota} />
				<rect x={24} width={6} height={50} fill={C.marfil} />
			</pattern>
			<pattern id="alScale" width={40} height={34} patternUnits="userSpaceOnUse">
				<rect width={40} height={34} fill={C.terracota} />
				<path d="M 0 34 A 20 20 0 0 1 40 34" fill="none" stroke={C.flama} strokeWidth={5} />
				<circle cx={20} cy={22} r={4} fill={C.marfil} />
			</pattern>
		</defs>
	</svg>
);

// ---------- El alebrije (perfil, mira a la derecha) ----------
export const Alebrije: React.FC<{x: number; y: number; s?: number; t: number; flap?: number; assemble?: number; glow?: number}> = ({x, y, s = 1, t, flap = 1, assemble = 1, glow = 0}) => {
	const w = Math.sin(t * Math.PI * 2 * 1.4 * flap);
	const breath = 1 + 0.02 * Math.sin(t * 2.4);
	const blink = Math.sin(t * 1.3) > 0.97 ? 0.15 : 1;
	// cada pieza llega desde el humo
	const part = (k: number) => {
		const p = E.out(clamp((assemble - k * 0.08) / 0.5));
		return {transform: `translate(${(1 - p) * (hash(k, 1) - 0.5) * 900} ${(1 - p) * (hash(k, 2) - 0.5) * 700}) rotate(${(1 - p) * (hash(k, 3) - 0.5) * 90})`, opacity: p};
	};
	const feathers = (n: number, len: number, rot: number, cols: string[]) =>
		Array.from({length: n}).map((_, i) => (
			<g key={i} transform={`rotate(${rot + i * (95 / n)})`}>
					<path d={`M 0 0 C ${-len * 0.16} ${-len * 0.3} ${-len * 0.14} ${-len * 0.82} ${len * 0.02} ${-len} C ${len * 0.14} ${-len * 0.8} ${len * 0.15} ${-len * 0.3} 0 0 Z`} fill={cols[i % cols.length]} stroke={OUT} strokeWidth={4} />
					<path d={`M 0 ${-len * 0.08} L ${len * 0.015} ${-len * 0.92}`} stroke={OUT} strokeWidth={3} opacity={0.7} />
					<path d={`M ${-len * 0.06} ${-len * 0.62} q ${len * 0.07} ${-len * 0.1} ${len * 0.13} 0 M ${-len * 0.07} ${-len * 0.44} q ${len * 0.08} ${-len * 0.1} ${len * 0.15} 0`} stroke={i % 2 ? C.marfil : OUT} strokeWidth={3} fill="none" opacity={0.75} />
				</g>
		));
	return (
		<svg width={W} height={H} style={{position: 'absolute', inset: 0, overflow: 'visible'}}>
			<g transform={`translate(${x} ${y}) scale(${s})`}>
				{glow ? <ellipse rx={420} ry={260} fill={C.flama} opacity={0.18 * glow} style={{filter: 'blur(60px)'}} /> : null}
				{/* ala trasera */}
				<g {...part(0)}>
					<g transform={`translate(-30 -90) rotate(${-20 + w * 28})`}>{feathers(8, 300, -110, [C.verde, '#2f8a5e', C.flama])}</g>
				</g>
				{/* cola de lagartija en espiral */}
				<g {...part(1)}>
					<path d={`M -200 -10 C -320 0 -380 ${-80 + Math.sin(t * 2) * 20} -350 -160 C -330 -220 -260 -210 -270 -160 C -280 -120 -320 -130 -310 -160`} stroke="url(#alScale)" strokeWidth={46} fill="none" strokeLinecap="round" />
					<path d={`M -200 -10 C -320 0 -380 ${-80 + Math.sin(t * 2) * 20} -350 -160 C -330 -220 -260 -210 -270 -160 C -280 -120 -320 -130 -310 -160`} stroke={OUT} strokeWidth={54} fill="none" strokeLinecap="round" opacity={0.0} />
				</g>
				{/* patas */}
				<g {...part(2)} stroke={OUT} strokeWidth={5}>
					{[-140, -80, 90, 150].map((px, i) => (
						<g key={i} transform={`translate(${px} 60) rotate(${Math.sin(t * 3 + i) * 6})`}>
							<path d="M -22 0 L -18 110 L 22 110 L 22 0 Z" fill={i % 2 ? 'url(#alDots)' : 'url(#alZig)'} />
							<path d="M -24 110 l -10 20 M -6 112 l -4 22 M 12 112 l 4 22 M 24 110 l 12 18" stroke={C.marfil} strokeWidth={6} strokeLinecap="round" />
						</g>
					))}
				</g>
				{/* cuerpo de jaguar */}
				<g {...part(3)} transform={`${part(3).transform} scale(1 ${breath})`}>
					<path d="M -220 0 C -230 -110 -120 -150 0 -140 C 140 -130 230 -100 240 -10 C 250 60 160 90 0 86 C -150 90 -215 70 -220 0 Z" fill="url(#alStripe)" stroke={OUT} strokeWidth={7} />
					{Array.from({length: 7}).map((_, i) => (
						<circle key={i} cx={-150 + i * 50} cy={-30 + Math.sin(i) * 20} r={14} fill={PAL[i % 4]} stroke={OUT} strokeWidth={4} />
					))}
					<path d="M -200 40 C -100 70 100 70 220 30" stroke={C.verde} strokeWidth={14} fill="none" />
				</g>
				{/* cabeza con cuernos */}
				<g {...part(4)}>
					<g transform={`translate(230 -120) rotate(${Math.sin(t * 1.2) * 5})`}>
						<path d="M -40 40 C -60 -40 0 -110 80 -90 C 160 -70 210 -10 200 30 C 190 70 120 90 60 80 C 0 90 -30 80 -40 40 Z" fill="url(#alDots)" stroke={OUT} strokeWidth={7} />
						<path d="M 40 -84 C 20 -170 -60 -170 -50 -110 C -40 -80 0 -100 -10 -120" stroke={C.flama} strokeWidth={16} fill="none" strokeLinecap="round" />
						<path d="M 90 -88 C 120 -180 200 -170 180 -110" stroke={C.cempa} strokeWidth={14} fill="none" strokeLinecap="round" />
						{/* ojo */}
						<ellipse cx={100} cy={-20} rx={30} ry={30 * blink} fill={C.marfil} stroke={OUT} strokeWidth={5} />
						<ellipse cx={108} cy={-20} rx={12} ry={18 * blink} fill={OUT} />
						<circle cx={112} cy={-28} r={4} fill="#fff" opacity={blink} />
						{/* fauces y lengua */}
						<path d="M 120 50 C 160 60 190 50 205 34" stroke={OUT} strokeWidth={6} fill="none" />
						<path d={`M 190 46 C 230 60 ${250 + Math.sin(t * 6) * 10} 50 270 70`} stroke={C.terracota} strokeWidth={9} fill="none" strokeLinecap="round" />
						{Array.from({length: 5}).map((_, i) => (
							<path key={i} d={`M ${130 + i * 14} 48 l 5 12 l 5 -12`} fill={C.marfil} />
						))}
					</g>
				</g>
				{/* ala delantera */}
				<g {...part(5)}>
					<g transform={`translate(10 -110) rotate(${-10 + w * 34})`}>{feathers(9, 360, -112, [C.cempa, C.flama, C.terracota, C.marfil])}</g>
				</g>
			</g>
		</svg>
	);
};

const Humo: React.FC = () => {
	const f = useCurrentFrame();
	const t = f / FPS;
	const assemble = E.inOut(clamp((f - 30) / 70));
	return (
		<AbsoluteFill style={{background: '#070304'}}>
			<Patrones />
			<Light x={540} y={1100} r={1000} color={C.cempa} o={0.3} />
			<Smoke t={t + 3} x={400} y={1900} L={1.4} n={180} rate={26} rise={200} wind={30} seed={51} tint={C.arena} lightX={540} lightY={1100} />
			<Smoke t={t + 5} x={700} y={1950} L={1.1} n={150} rate={22} rise={180} wind={-24} seed={52} tint={C.marfil} lightX={540} lightY={1100} />
			<div style={{opacity: 0.25 + 0.75 * assemble}}>
				<Alebrije x={500} y={1050} s={1.25} t={t} assemble={assemble} glow={assemble} />
			</div>
			<PaperTexture o={0.18} />
			<Kinetic text={'De un sueño de fiebre\nnacieron criaturas de colores…'} f={f} at={10} out={94} y={330} size={48} scrim={0.6} />
		</AbsoluteFill>
	);
};

const Retrato: React.FC = () => {
	const f = useCurrentFrame();
	const t = f / FPS + 4;
	const orbit = ramp(f, [0, C05.S2], [-20, 20], E.inOut);
	return (
		<AbsoluteFill style={{background: 'radial-gradient(ellipse at 50% 55%, #2a1a0c, #070304 70%)'}}>
			<Patrones />
			<Light x={540} y={1000} r={900} color={C.flama} o={0.3} />
			{Array.from({length: 24}).map((_, i) => (
				<div key={i} style={{position: 'absolute', left: (hash(i, 1) * W + orbit * (0.5 + hash(i, 2))) % W, top: hash(i, 3) * H, width: 10 + 30 * hash(i, 4), height: 10 + 30 * hash(i, 4), borderRadius: '50%', background: PAL[i % PAL.length], opacity: 0.25, filter: 'blur(6px)'}} />
			))}
			<Alebrije x={460 + orbit} y={1100} s={1.2} t={t} glow={1} />
			<PaperTexture o={0.18} />
			<Kinetic text={'Dicen que cada quien\ntiene uno que lo guía.'} f={f} at={12} out={104} y={330} size={50} scrim={0.6} />
		</AbsoluteFill>
	);
};

const Vuelo: React.FC = () => {
	const f = useCurrentFrame();
	const t = f / FPS + 8;
	const u = E.inOut(clamp(f / C05.S3));
	const x = lerp(-300, 1400, u);
	const y = lerp(1400, 500, u) - Math.sin(u * Math.PI) * 120;
	const ref = useCanvasDraw(
		(ctx) => {
			ctx.globalCompositeOperation = 'lighter';
			for (let k = 0; k < 90; k++) {
				const uu = u - k * 0.006;
				if (uu < 0) continue;
				const xx = lerp(-300, 1400, uu) - 200 + (hash(k, 1) - 0.5) * 60;
				const yy = lerp(1400, 500, uu) - Math.sin(uu * Math.PI) * 120 + 60 + (hash(k, 2) - 0.5) * 60;
				const a = 1 - k / 90;
				ctx.fillStyle = rgba(PAL[k % PAL.length], a * 0.8);
				ctx.beginPath();
				ctx.arc(xx, yy, 3 + 6 * a, 0, Math.PI * 2);
				ctx.fill();
			}
		},
		[f],
	);
	return (
		<AbsoluteFill style={{background: 'linear-gradient(180deg,#05030a,#160a10 60%,#2a120a)'}}>
			<Patrones />
			{Array.from({length: 80}).map((_, i) => (
				<div key={i} style={{position: 'absolute', left: hash(i, 5) * W, top: hash(i, 6) * 1200, width: 3, height: 3, borderRadius: 2, background: '#FFF6E6', opacity: 0.4 + 0.4 * Math.sin(t * 2 + i)}} />
			))}
			<canvas ref={ref} width={W} height={H} style={{position: 'absolute', inset: 0}} />
			<Alebrije x={x} y={y} s={1.05} t={t} flap={1.8} glow={0.8} />
			<PaperTexture o={0.18} />
			{void noise2D}
		</AbsoluteFill>
	);
};

const Numero: React.FC<{dias: number; fecha: string}> = ({dias, fecha}) => {
	const f = useCurrentFrame();
	const t = f / FPS;
	const txt = String(dias);
	const size = numSize(txt);
	const HIT = C05.HIT;
	const pats = ['alZig', 'alDots', 'alStripe', 'alScale'];
	// pinceladas diagonales que pintan el número con los patrones del alebrije
	const strokes = Array.from({length: 7}).map((_, i) => ({at: 6 + i * 7, y: NUM_Y - 300 + i * 100}));
	return (
		<AbsoluteFill style={{background: 'radial-gradient(ellipse at 50% 45%, #2a160c, #070304 70%)'}}>
			<Patrones />
			<Light x={540} y={NUM_Y} r={900} color={C.flama} o={0.3} />
			<svg width={W} height={H} style={{position: 'absolute', inset: 0}}>
				<defs>
					<mask id="c5num" maskUnits="userSpaceOnUse">
						<text x={540} y={NUM_Y + size * 0.35} textAnchor="middle" fontFamily="Rye" fontSize={size} fill="#fff">
							{txt}
						</text>
					</mask>
					<clipPath id="c5brush">
						{strokes.map((s, i) => {
							const p = E.out(clamp((f - s.at) / 16));
							return <rect key={i} x={100} y={s.y - 60} width={880 * p} height={120} transform={`rotate(-12 540 ${s.y})`} />;
						})}
					</clipPath>
				</defs>
				<g mask="url(#c5num)" clipPath="url(#c5brush)">
					{strokes.map((s, i) => (
						<rect key={i} x={0} y={s.y - 70} width={W} height={140} fill={`url(#${pats[i % 4]})`} transform={`rotate(-12 540 ${s.y})`} />
					))}
				</g>
				<text x={540} y={NUM_Y + size * 0.35} textAnchor="middle" fontFamily="Rye" fontSize={size} fill="none" stroke={OUT} strokeWidth={7} opacity={ramp(f, [HIT - 10, HIT], [0, 1])}>
					{txt}
				</text>
				<text x={540} y={NUM_Y + size * 0.35} textAnchor="middle" fontFamily="Rye" fontSize={size} fill="none" stroke={C.flama} strokeWidth={2} opacity={ramp(f, [HIT - 10, HIT], [0, 0.8])}>
					{txt}
				</text>
			</svg>
			<Alebrije x={lerp(1500, 770, E.out(clamp((f - HIT) / 34)))} y={1560} s={0.5} t={t} glow={0.6} />
			<Lockup f={f} at={HIT + 4} dias={dias} fecha={fecha} />
			<PaperTexture o={0.18} />
			<AbsoluteFill style={{background: '#000', opacity: ramp(f, [C05.REV - 8, C05.REV - 1], [0, 1], E.inOut)}} />
		</AbsoluteFill>
	);
};

export const Cap05: React.FC<{dias: number; fecha: string}> = ({dias, fecha}) => {
	const f = useCurrentFrame();
	const a = C05.S1;
	const b = a + C05.S2;
	const c = b + C05.S3;
	return (
		<AbsoluteFill style={{background: '#000'}}>
			<Sequence durationInFrames={a}>
				<Humo />
			</Sequence>
			<Sequence from={a} durationInFrames={C05.S2}>
				<Retrato />
			</Sequence>
			<Sequence from={b} durationInFrames={C05.S3}>
				<Vuelo />
			</Sequence>
			<Sequence from={c} durationInFrames={C05.REV}>
				<Numero dias={dias} fecha={fecha} />
			</Sequence>
			<LightLeak f={f} at={a} dur={16} />
			<Dip f={f} at={b} dur={10} />
			<LightLeak f={f} at={c} dur={14} color={C.cempa} />
		</AbsoluteFill>
	);
};
