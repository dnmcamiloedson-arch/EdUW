import React from 'react';
import {AbsoluteFill, Sequence, useCurrentFrame} from 'remotion';
import {noise2D} from '@remotion/noise';
import {C, E, FPS, H, W, clamp, flicker, hash, lerp, mixRGB, ramp, rgba} from '../lib/util';
import {Flame, Light, PaperTexture, useCanvasDraw} from '../components/core';
import {Bokeh, drawPetal} from '../components/Particles';
import {Marigold, CutFilter} from '../components/Calavera';
import {Pompon} from '../components/Objetos';
import {PapelDefs, PapelSheen, PapelString} from '../components/PapelPicado';
import {GoldNumber, Kinetic, Lockup, NUM_Y} from './kit/type';
import {Dip, LightLeak, PetalWipe} from './kit/transitions';

// Capítulo 7 (REEL) · "La Catrina" — la muerte también se pone elegante.
export const C07 = {S1: 108, S2: 126, S3: 150, S4: 66, REV: 156, HIT: 58};
export const C07_LEN = C07.S1 + C07.S2 + C07.S3 + C07.S4 + C07.REV;

// ---------- Rostro de catrina (frontal, diseño original) ----------
const Rostro: React.FC<{lit: number; t: number}> = ({lit, t}) => {
	const col = (c: string, k = 1) => rgba(mixRGB(C.ink, c, Math.min(1, lit * k)));
	return (
		<g>
			{/* cuello y encaje */}
			<path d="M -70 250 L -60 360 L 60 360 L 70 250 Z" fill={col(C.marfil, 0.85)} />
			{Array.from({length: 13}).map((_, i) => (
				<circle key={i} cx={-240 + i * 40} cy={400 + Math.sin(i * 0.8) * 4} r={26} fill={col('#F4EEE6', 0.9)} stroke={col(C.arena, 0.7)} strokeWidth={3} />
			))}
			<path d="M -260 400 Q 0 470 260 400 L 300 560 L -300 560 Z" fill={col(C.terracota, 0.9)} />
			{Array.from({length: 9}).map((_, i) => (
				<circle key={'b' + i} cx={-130 + i * 32} cy={415 + Math.abs(i - 4) * -6 + 30} r={9} fill={col(C.flama)} />
			))}
			{/* cráneo */}
			<path d="M -170 -60 C -170 -230 -90 -290 0 -290 C 90 -290 170 -230 170 -60 C 170 40 130 90 110 140 C 100 200 70 260 0 266 C -70 260 -100 200 -110 140 C -130 90 -170 40 -170 -60 Z" fill={col(C.marfil)} />
			{/* órbitas con pétalos */}
			{[-1, 1].map((s) => (
				<g key={s} transform={`translate(${s * 72} -20)`}>
					{Array.from({length: 12}).map((_, i) => (
						<ellipse key={i} cx={0} cy={-62} rx={12} ry={22} transform={`rotate(${i * 30})`} fill={col(i % 2 ? C.cempa : C.terracota)} />
					))}
					<circle r={50} fill="#0d0605" />
					<circle r={6 + 1.5 * Math.sin(t * 2)} cx={-8} cy={-6} fill={C.flama} opacity={0.6} />
				</g>
			))}
			{/* nariz: corazón invertido */}
			<path d="M 0 96 C -40 60 -36 30 -12 30 C -4 30 0 38 0 44 C 0 38 4 30 12 30 C 36 30 40 60 0 96 Z" fill={col(C.terracota)} />
			{/* boca cosida */}
			<path d="M -90 170 Q 0 214 90 170" stroke={col('#3a1a10')} strokeWidth={6} fill="none" />
			{Array.from({length: 11}).map((_, i) => {
				const x = -80 + i * 16;
				const y = 170 + Math.sin((i / 10) * Math.PI) * 22;
				return <path key={i} d={`M ${x} ${y - 14} L ${x} ${y + 14}`} stroke={col('#3a1a10')} strokeWidth={4} />;
			})}
			{/* volutas en mejillas y frente */}
			{[-1, 1].map((s) => (
				<path key={'v' + s} d={`M ${s * 120} 70 c ${s * 30} -10 ${s * 36} 30 ${s * 10} 40 c ${s * -20} 6 ${s * -24} -20 ${s * -6} -24`} stroke={col(C.verde)} strokeWidth={8} fill="none" strokeLinecap="round" />
			))}
			<path d="M 0 -150 C -30 -190 -10 -220 0 -200 C 10 -220 30 -190 0 -150 Z" fill={col(C.verde)} />
			{Array.from({length: 7}).map((_, i) => (
				<circle key={'f' + i} cx={-90 + i * 30} cy={-120 - Math.sin((i / 6) * Math.PI) * 26} r={7} fill={col(i % 2 ? C.flama : C.cempa)} />
			))}
			{/* aretes */}
			{[-1, 1].map((s) => (
				<g key={'a' + s} transform={`translate(${s * 168} ${120 + Math.sin(t * 2 + s) * 4})`}>
					<circle r={10} fill={col(C.flama)} />
					<path d="M 0 10 L -14 50 L 14 50 Z" fill={col(C.cempa)} />
				</g>
			))}
		</g>
	);
};

// ---------- Sombrero de ala ancha con flores y plumas ----------
const Sombrero: React.FC<{lit: number; t: number}> = ({lit, t}) => {
	const col = (c: string, k = 1) => rgba(mixRGB(C.ink, c, Math.min(1, lit * k)));
	return (
		<g>
			{/* plumas */}
			{Array.from({length: 7}).map((_, i) => {
				const a = -60 + i * 20 + Math.sin(t * 1.5 + i) * 3;
				return (
					<g key={i} transform={`translate(${-20 + i * 8} -380) rotate(${a})`}>
						<path d="M 0 0 C -30 -120 -10 -260 40 -340 C 60 -250 50 -120 0 0 Z" fill={col(i % 2 ? C.arena : C.marfil, 0.95)} />
						<path d="M 0 0 C 0 -120 20 -240 40 -340" stroke={col('#8a7a68')} strokeWidth={3} fill="none" />
					</g>
				);
			})}
			{/* copa */}
			<path d="M -180 -260 C -180 -420 180 -420 180 -260 Z" fill={col('#1a0c10')} />
			{/* ala */}
			<ellipse cx={0} cy={-250} rx={430} ry={92} fill={col('#22101a')} />
			<ellipse cx={0} cy={-262} rx={410} ry={70} fill={col('#2e1622')} />
			<path d="M -180 -270 Q 0 -230 180 -270 L 180 -300 Q 0 -262 -180 -300 Z" fill={col(C.terracota)} />
			{/* flores */}
			<Marigold x={-200} y={-300} s={0.62} lit={lit} filter="" />
			<Marigold x={-60} y={-340} s={0.5} lit={lit} leaves={false} filter="" />
			<Pompon x={120} y={-310} r={44} lit={lit} seed={3} />
			<Pompon x={220} y={-290} r={34} lit={lit} seed={5} />
			<Pompon x={-310} y={-268} r={30} lit={lit} seed={7} />
			{/* listón que cae */}
			<path d={`M 300 -250 C 340 -150 ${320 + Math.sin(t * 2) * 20} -40 ${360 + Math.sin(t * 2) * 30} 80`} stroke={col(C.verde)} strokeWidth={24} fill="none" strokeLinecap="round" />
		</g>
	);
};

const Catrina: React.FC<{x: number; y: number; s: number; lit: number; t: number; tilt?: number}> = ({x, y, s, lit, t, tilt = 0}) => (
	<svg width={W} height={H} style={{position: 'absolute', inset: 0, overflow: 'visible'}}>
		<g transform={`translate(${x} ${y}) scale(${s}) rotate(${tilt})`}>
			<Rostro lit={lit} t={t} />
			<Sombrero lit={lit} t={t} />
		</g>
	</svg>
);

// ---------- Escena 1: el tocador ----------
const Tocador: React.FC = () => {
	const f = useCurrentFrame();
	const t = f / FPS;
	const fl = flicker(t, 71);
	const appear = E.inOut(clamp((f - 20) / 60));
	return (
		<AbsoluteFill style={{background: '#080305'}}>
			<CutFilter />
			<Light x={160} y={1300} r={1100} color={C.cempa} o={0.4 * fl} />
			{/* espejo ovalado con marco dorado */}
			<div style={{position: 'absolute', left: 190, top: 330, width: 700, height: 980, borderRadius: '50%', background: 'radial-gradient(ellipse at 45% 40%, #2a1a22, #0a0508)', border: `26px solid ${rgba(mixRGB(C.ink, C.flama, 0.7))}`, boxShadow: `0 0 0 8px ${rgba(C.terracota, 0.8)}, 0 20px 60px rgba(0,0,0,0.7)`, overflow: 'hidden'}}>
				<div style={{position: 'absolute', inset: 0, opacity: appear, transform: `translateY(${(1 - appear) * 60}px)`}}>
					<svg width={700} height={980} style={{position: 'absolute', inset: 0, overflow: 'visible'}}>
						<g transform="translate(350 620) scale(0.95)">
							<Rostro lit={0.55 * appear} t={t} />
							<Sombrero lit={0.55 * appear} t={t} />
						</g>
					</svg>
				</div>
				<div style={{position: 'absolute', inset: 0, background: 'linear-gradient(120deg, transparent 40%, rgba(255,240,220,0.12) 50%, transparent 60%)'}} />
			</div>
			{/* velas del tocador */}
			<svg width={W} height={H} style={{position: 'absolute', inset: 0}}>
				<rect x={0} y={1420} width={W} height={500} fill="#1a0c08" />
				<rect x={110} y={1260} width={44} height={170} rx={4} fill={C.marfil} />
				<rect x={930} y={1300} width={40} height={130} rx={4} fill={C.marfil} />
			</svg>
			<Flame x={132} y={1262} size={70} t={t} seed={71} fl={fl} />
			<Flame x={950} y={1302} size={60} t={t + 2} seed={72} fl={fl} />
			<PaperTexture o={0.2} />
			<Kinetic text={'La muerte también\nse pone elegante.'} f={f} at={12} out={96} y={1500} size={54} />
		</AbsoluteFill>
	);
};

// ---------- Escena 2: retrato ----------
const Retrato: React.FC = () => {
	const f = useCurrentFrame();
	const t = f / FPS + 4;
	const fl = flicker(t, 73);
	const tiltUp = ramp(f, [0, C07.S2], [-220, 60], E.inOut);
	return (
		<AbsoluteFill style={{background: '#0a0406'}}>
			<CutFilter />
			<Light x={220} y={800} r={1200} color={C.cempa} o={0.45 * fl} />
			<Bokeh t={t} L={0.8} n={16} seed={74} blur={6} />
			<Catrina x={560} y={1150 + tiltUp} s={1.45} lit={0.8 + 0.2 * fl} t={t} tilt={Math.sin(t * 0.8) * 2} />
			<PaperTexture o={0.18} />
			<Kinetic text={'Posada la dibujó;\nel pueblo la hizo reina.'} f={f} at={14} out={110} y={1500} size={48} scrim={1} />
		</AbsoluteFill>
	);
};

// ---------- Escena 3: el vals ----------
const Bailarina: React.FC<{x: number; y: number; t: number; spin: number; s?: number}> = ({x, y, t, spin, s = 1}) => {
	const sx = Math.cos(spin);
	const flare = 1 + 0.25 * Math.abs(Math.sin(spin));
	const hem = Array.from({length: 13})
		.map((_, i) => {
			const u = i / 12;
			const xx = (-300 + u * 600) * flare;
			const yy = 560 + Math.sin(u * 10 + t * 6) * 26;
			return `${xx} ${yy}`;
		})
		.join(' L ');
	return (
		<svg width={W} height={H} style={{position: 'absolute', inset: 0, overflow: 'visible'}}>
			<g transform={`translate(${x} ${y}) scale(${s * (0.35 + 0.65 * Math.abs(sx))} ${s})`}>
				{/* vestido en capas */}
				<path d={`M -60 80 L ${hem} L 60 80 Z`} fill={C.terracota} />
				<path d={`M -50 80 L ${hem.split(' L ').map((p) => p.split(' ').map((v, j) => (j === 0 ? +v * 0.8 : +v - 90)).join(' ')).join(' L ')} L 50 80 Z`} fill={C.cempa} />
				<path d={`M -40 80 L ${hem.split(' L ').map((p) => p.split(' ').map((v, j) => (j === 0 ? +v * 0.6 : +v - 180)).join(' ')).join(' L ')} L 40 80 Z`} fill={C.flama} opacity={0.9} />
				{/* torso */}
				<path d="M -60 90 C -70 20 -50 -40 -30 -60 L 30 -60 C 50 -40 70 20 60 90 Z" fill="#1a0c10" />
				{/* brazos: uno arriba con abanico */}
				<path d={`M 34 -40 C 90 -80 120 -160 ${130 + Math.sin(t * 3) * 10} -230`} stroke="#E8DCC8" strokeWidth={14} fill="none" strokeLinecap="round" />
				<path d="M -34 -40 C -90 0 -110 60 -100 120" stroke="#E8DCC8" strokeWidth={14} fill="none" strokeLinecap="round" />
				<path d={`M ${130 + Math.sin(t * 3) * 10} -230 l -40 -60 a 70 70 0 0 1 80 0 Z`} fill={C.verde} />
				{/* cabeza y sombrero */}
				<circle cx={0} cy={-110} r={42} fill="#E8DCC8" />
				<circle cx={-14} cy={-116} r={9} fill="#120806" />
				<circle cx={14} cy={-116} r={9} fill="#120806" />
				<ellipse cx={0} cy={-150} rx={150} ry={30} fill="#22101a" />
				<path d="M -60 -160 C -60 -220 60 -220 60 -160 Z" fill="#1a0c10" />
				<circle cx={-70} cy={-170} r={22} fill={C.cempa} />
				<circle cx={-40} cy={-186} r={16} fill={C.flama} />
				<path d="M 20 -200 C 40 -280 80 -320 120 -340" stroke={C.marfil} strokeWidth={10} fill="none" strokeLinecap="round" />
			</g>
		</svg>
	);
};

const Vals: React.FC = () => {
	const f = useCurrentFrame();
	const t = f / FPS + 8;
	const fl = flicker(t, 75);
	const spin = t * 2.4;
	const ref = useCanvasDraw(
		(ctx) => {
			for (let i = 0; i < 60; i++) {
				const r = (q: number) => hash(i * 5 + q, 76);
				const a = r(1) * 6.28 + t * (0.8 + r(2));
				const rad = 260 + 380 * r(3);
				const x = 540 + Math.cos(a) * rad;
				const y = 1200 + Math.sin(a) * rad * 0.35 - 200 * r(4);
				drawPetal(ctx, x, y, 26 + 14 * r(5), a + t, Math.cos(t * 4 + i), 0.85, 0.85, r(6));
			}
		},
		[f],
	);
	return (
		<AbsoluteFill style={{background: 'radial-gradient(ellipse at 50% 60%, #2a1208, #070304 70%)'}}>
			<PapelDefs />
			<PapelSheen />
			<PapelString cfg={{y: 20, sag: 60, count: 5, spacing: 252, x0: 36, scale: 0.75, seed: 77, types: [1, 0, 2, 3, 1], colorOffset: 2}} frame={200} t={t} light={0.8} lightPos={[540, 1400]} gust={0.9} />
			{[150, 300, 780, 930].map((x, i) => (
				<React.Fragment key={i}>
					<svg width={W} height={H} style={{position: 'absolute', inset: 0}}>
						<rect x={x - 18} y={1500} width={36} height={160} rx={4} fill={C.marfil} />
					</svg>
					<Flame x={x} y={1502} size={56} t={t + i} seed={78 + i} fl={fl} />
					<Light x={x} y={1460} r={300} color={C.cempa} o={0.35 * fl} />
				</React.Fragment>
			))}
			{/* sombra en el piso */}
			<div style={{position: 'absolute', left: 240, top: 1640, width: 600, height: 80, borderRadius: '50%', background: 'radial-gradient(closest-side, rgba(0,0,0,0.6), transparent)'}} />
			<Bailarina x={540} y={1080} t={t} spin={spin} s={1.15} />
			<canvas ref={ref} width={W} height={H} style={{position: 'absolute', inset: 0}} />
			<PaperTexture o={0.2} />
			<Kinetic text={'Y cuando suena el vals,\nnadie se queda sentado.'} f={f} at={16} out={130} y={330} size={48} scrim={0.8} />
		</AbsoluteFill>
	);
};

// ---------- Abanico ----------
const Abanico: React.FC<{open: number; cx: number; cy: number; R: number; t: number}> = ({open, cx, cy, R, t}) => {
	const n = 17;
	const span = 170 * open;
	return (
		<svg width={W} height={H} style={{position: 'absolute', inset: 0, overflow: 'visible'}}>
			<g transform={`translate(${cx} ${cy})`}>
				{Array.from({length: n}).map((_, i) => {
					const a = -90 - span / 2 + (span * i) / (n - 1);
					const w = (span / (n - 1)) * 0.98 + 0.5;
					const col = i % 2 ? C.verde : C.terracota;
					return (
						<g key={i} transform={`rotate(${a + 90})`}>
							<path d={`M 0 0 L ${-Math.sin((w * Math.PI) / 360) * R} ${-Math.cos((w * Math.PI) / 360) * R} L ${Math.sin((w * Math.PI) / 360) * R} ${-Math.cos((w * Math.PI) / 360) * R} Z`} fill={col} stroke="#120806" strokeWidth={2} />
							<circle cx={0} cy={-R * 0.8} r={R * 0.025} fill="#120806" opacity={0.6} />
							<circle cx={0} cy={-R * 0.62} r={R * 0.018} fill={C.flama} />
							<path d={`M 0 -10 L 0 ${-R}`} stroke="#3a1a0c" strokeWidth={4} />
						</g>
					);
				})}
				<path d={`M ${-R} 0 A ${R} ${R} 0 0 1 ${R} 0`} transform={`rotate(0)`} fill="none" stroke={C.flama} strokeWidth={6} opacity={open > 0.98 ? 0.8 : 0} />
				<circle r={26} fill={C.flama} />
				{void t}
			</g>
		</svg>
	);
};

const AbreAbanico: React.FC = () => {
	const f = useCurrentFrame();
	const t = f / FPS + 13;
	const open = E.out(clamp((f - 8) / 30));
	return (
		<AbsoluteFill style={{background: '#0a0406'}}>
			<Light x={540} y={1100} r={900} color={C.cempa} o={0.45} />
			<Abanico open={open} cx={540} cy={1400} R={760} t={t} />
			<PaperTexture o={0.2} />
		</AbsoluteFill>
	);
};

const Revelacion: React.FC<{dias: number; fecha: string}> = ({dias, fecha}) => {
	const f = useCurrentFrame();
	const t = f / FPS + 16;
	const HIT = C07.HIT;
	const open = E.inOut(clamp((f - 4) / (HIT - 8)));
	const num = E.out(clamp((f - HIT + 14) / 22));
	return (
		<AbsoluteFill style={{background: 'radial-gradient(ellipse at 50% 55%, #2a1208, #070304 70%)'}}>
			<Light x={540} y={NUM_Y} r={1000} color={C.cempa} o={0.3 + 0.2 * num} />
			<div style={{position: 'absolute', inset: 0, opacity: 0.85}}>
				<Abanico open={open} cx={540} cy={1260} R={720} t={t} />
			</div>
			<div style={{position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 45% 30% at 50% 45%, rgba(10,4,2,0.75), transparent)', opacity: num}} />
			<GoldNumber txt={String(dias)} o={num} blur={(1 - num) * 12} scale={lerp(0.85, 1, num)} />
			<Lockup f={f} at={HIT + 4} dias={dias} fecha={fecha} top={380} bottom={1150} />
			<PaperTexture o={0.18} />
			<AbsoluteFill style={{background: '#000', opacity: ramp(f, [C07.REV - 8, C07.REV - 1], [0, 1], E.inOut)}} />
			{void noise2D}
		</AbsoluteFill>
	);
};

export const Cap07: React.FC<{dias: number; fecha: string}> = ({dias, fecha}) => {
	const f = useCurrentFrame();
	const a = C07.S1;
	const b = a + C07.S2;
	const c = b + C07.S3;
	const d = c + C07.S4;
	return (
		<AbsoluteFill style={{background: '#000'}}>
			<Sequence durationInFrames={a}>
				<Tocador />
			</Sequence>
			<Sequence from={a} durationInFrames={C07.S2}>
				<Retrato />
			</Sequence>
			<Sequence from={b} durationInFrames={C07.S3}>
				<Vals />
			</Sequence>
			<Sequence from={c} durationInFrames={C07.S4}>
				<AbreAbanico />
			</Sequence>
			<Sequence from={d} durationInFrames={C07.REV}>
				<Revelacion dias={dias} fecha={fecha} />
			</Sequence>
			<LightLeak f={f} at={a} dur={16} />
			<PetalWipe f={f} at={b} dur={24} seed={7} />
			<Dip f={f} at={c} dur={10} />
			<LightLeak f={f} at={d} dur={12} color={C.cempa} />
		</AbsoluteFill>
	);
};
