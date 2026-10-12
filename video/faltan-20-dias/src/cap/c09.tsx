import React from 'react';
import {AbsoluteFill, Sequence, useCurrentFrame} from 'remotion';
import {C, E, FPS, H, W, clamp, hash, lerp, mixRGB, ramp, rgba} from '../lib/util';
import {Light, PaperTexture, useCanvasDraw} from '../components/core';
import {useGlyph} from '../countdown/reveals';
import {Kinetic, Lockup, NUM_Y, numSize} from './kit/type';
import {Dip, LightLeak} from './kit/transitions';

// Capítulo 9 · "Papel picado" — en San Salvador Huixcolotla el papel se corta a golpe de cincel.
export const C09 = {S1: 108, S2: 108, S3: 78, REV: 132, HIT: 74};
export const C09_LEN = C09.S1 + C09.S2 + C09.S3 + C09.REV;

// Golpes del mazo (frames locales) — la música marca los mismos tiempos
export const STRIKES_S2 = [14, 34, 54, 74, 94];
export const STRIKES_REV = [6, 16, 26, 36, 46, 56, 66];

// Cincel + mazo de madera
const Herramientas: React.FC<{x: number; y: number; f: number; strikes: number[]; s?: number}> = ({x, y, f, strikes, s = 1}) => {
	// el mazo sube y baja; golpea en cada strike
	let lift = 1;
	for (const st of strikes) {
		const d = f - st;
		if (d >= -8 && d < 0) lift = Math.min(lift, E.in(clamp(-d / 8)));
		if (d >= 0 && d < 10) lift = Math.min(lift, E.out(clamp(d / 10)));
	}
	const ang = lerp(0, -38, lift);
	return (
		<svg width={W} height={H} style={{position: 'absolute', inset: 0, overflow: 'visible'}}>
			<g transform={`translate(${x} ${y}) scale(${s})`}>
				{/* cincel */}
				<rect x={-7} y={-230} width={14} height={210} rx={4} fill="url(#steel)" />
				<path d="M -7 -20 L 7 -20 L 3 0 L -3 0 Z" fill="#9aa0a8" />
				<rect x={-12} y={-250} width={24} height={26} rx={4} fill="#6a6e74" />
				{/* mazo */}
				<g transform={`translate(0 -268) rotate(${ang} 300 0)`}>
					<rect x={40} y={-16} width={300} height={24} rx={10} fill="#5a361c" />
					<rect x={-95} y={-70} width={190} height={112} rx={22} fill="#8a5a32" />
					<rect x={-95} y={-70} width={190} height={22} rx={11} fill="#b07a44" />
					<path d="M -95 -20 L 95 -20 M -95 10 L 95 10" stroke="#6a4224" strokeWidth={4} opacity={0.6} />
				</g>
				<defs>
					<linearGradient id="steel" x1="0" y1="0" x2="1" y2="0">
						<stop offset="0%" stopColor="#5a5e64" />
						<stop offset="45%" stopColor="#d8dce2" />
						<stop offset="100%" stopColor="#4a4e54" />
					</linearGradient>
				</defs>
			</g>
		</svg>
	);
};

const HOLES: {x: number; y: number; k: 'rombo' | 'flor' | 'gota' | 'circ'}[] = [
	{x: 380, y: 760, k: 'flor'},
	{x: 700, y: 760, k: 'flor'},
	{x: 540, y: 980, k: 'rombo'},
	{x: 380, y: 1180, k: 'gota'},
	{x: 700, y: 1180, k: 'gota'},
];
const holeD = (k: string, s: number) =>
	k === 'rombo'
		? `M 0 ${-s} L ${s * 0.7} 0 L 0 ${s} L ${-s * 0.7} 0 Z`
		: k === 'gota'
			? `M 0 ${-s} C ${s * 0.8} ${-s * 0.2} ${s * 0.6} ${s * 0.8} 0 ${s * 0.8} C ${-s * 0.6} ${s * 0.8} ${-s * 0.8} ${-s * 0.2} 0 ${-s} Z`
			: k === 'flor'
				? Array.from({length: 6})
						.map((_, i) => {
							const a = (i / 6) * Math.PI * 2;
							const cx = Math.cos(a) * s * 0.55;
							const cy = Math.sin(a) * s * 0.55;
							return `M ${cx + s * 0.32} ${cy} A ${s * 0.32} ${s * 0.32} 0 1 0 ${cx - s * 0.32} ${cy} A ${s * 0.32} ${s * 0.32} 0 1 0 ${cx + s * 0.32} ${cy} Z`;
						})
						.join(' ')
				: `M ${s} 0 A ${s} ${s} 0 1 0 ${-s} 0 A ${s} ${s} 0 1 0 ${s} 0 Z`;

const Mesa: React.FC<{children?: React.ReactNode}> = ({children}) => (
	<AbsoluteFill style={{background: 'linear-gradient(180deg,#2a1608,#1a0d05)'}}>
		{Array.from({length: 14}).map((_, i) => (
			<div key={i} style={{position: 'absolute', left: 0, top: i * 140, width: W, height: 2, background: 'rgba(0,0,0,0.25)'}} />
		))}
		<Light x={300} y={300} r={1300} color={C.flama} o={0.35} />
		{children}
	</AbsoluteFill>
);

// Pila de papel de china con el dibujo que se traza solo
const Trazo: React.FC = () => {
	const f = useCurrentFrame();
	const draw = E.inOut(clamp((f - 10) / 70));
	const colors = [C.verde, C.flama, C.terracota, C.cempa];
	return (
		<Mesa>
			<svg width={W} height={H} style={{position: 'absolute', inset: 0}}>
				{colors.map((c, i) => (
					<rect key={i} x={170 + i * 8} y={520 - i * 10} width={740} height={920} fill={rgba(mixRGB(C.ink, c, 0.9))} transform={`rotate(${-3 + i * 1.6} 540 980)`} style={{filter: 'drop-shadow(0 6px 8px rgba(0,0,0,0.4))'}} />
				))}
				{/* plantilla dibujada a lápiz */}
				<g stroke="#2a1608" strokeWidth={3} fill="none" strokeDasharray="2400" strokeDashoffset={2400 * (1 - draw)} opacity={0.8}>
					<rect x={250} y={600} width={600} height={760} />
					{HOLES.map((h, i) => (
						<path key={i} d={holeD(h.k, 70)} transform={`translate(${h.x + 30} ${h.y})`} />
					))}
					<path d="M 250 1300 L 850 1300" strokeDasharray="12 10" />
				</g>
			</svg>
			<PaperTexture o={0.25} />
			<Kinetic text={'En Huixcolotla, el papel\nse corta a golpe de cincel.'} f={f} at={12} out={94} y={300} size={48} />
		</Mesa>
	);
};

const Cincel: React.FC = () => {
	const f = useCurrentFrame();
	let cut = -1;
	STRIKES_S2.forEach((st, i) => {
		if (f >= st) cut = i;
	});
	const next = Math.min(HOLES.length - 1, cut + 1);
	const prevH = HOLES[Math.max(0, cut)];
	const nh = HOLES[next];
	// el cincel viaja al siguiente hueco entre golpes
	const lastSt = cut >= 0 ? STRIKES_S2[cut] : 0;
	const mv = cut < 0 ? 1 : E.inOut(clamp((f - lastSt - 4) / 10));
	const cx = cut < 0 ? nh.x + 30 : lerp(prevH.x + 30, nh.x + 30, mv);
	const cy = cut < 0 ? nh.y : lerp(prevH.y, nh.y, mv);
	const shake = STRIKES_S2.reduce((a, st) => a + (f >= st && f < st + 6 ? (6 - (f - st)) * 1.4 : 0), 0);
	const ref = useCanvasDraw(
		(ctx) => {
			STRIKES_S2.forEach((st, i) => {
				const d = f - st;
				if (d < 0 || d > 24) return;
				for (let k = 0; k < 14; k++) {
					const a = hash(i * 20 + k, 9) * 6.28;
					const sp = 120 + 260 * hash(i * 20 + k, 10);
					const tt = d / FPS;
					const x = HOLES[i].x + 30 + Math.cos(a) * sp * tt;
					const y = HOLES[i].y + Math.sin(a) * sp * tt + 500 * tt * tt;
					ctx.fillStyle = rgba([C.verde, C.flama, C.terracota][k % 3], 1 - d / 24);
					ctx.save();
					ctx.translate(x, y);
					ctx.rotate(tt * 12 + k);
					ctx.fillRect(-6, -4, 12, 8);
					ctx.restore();
				}
			});
		},
		[f],
	);
	return (
		<Mesa>
			<AbsoluteFill style={{transform: `translate(${(hash(f, 1) - 0.5) * shake}px, ${(hash(f, 2) - 0.5) * shake}px)`}}>
				<svg width={W} height={H} style={{position: 'absolute', inset: 0}}>
					<defs>
						<mask id="c9holes" maskUnits="userSpaceOnUse">
							<rect width={W} height={H} fill="#fff" />
							{HOLES.map((h, i) => (cut >= i ? <path key={i} d={holeD(h.k, 70 * E.out(clamp((f - STRIKES_S2[i]) / 4)))} transform={`translate(${h.x + 30} ${h.y})`} fill="#000" /> : null))}
						</mask>
					</defs>
					<rect x={170} y={520} width={740} height={920} fill={rgba(mixRGB(C.ink, C.verde, 0.95))} mask="url(#c9holes)" style={{filter: 'drop-shadow(0 8px 10px rgba(0,0,0,0.45))'}} />
					<g stroke="#0c2a20" strokeWidth={3} fill="none" opacity={0.5}>
						{HOLES.map((h, i) => (cut < i ? <path key={i} d={holeD(h.k, 70)} transform={`translate(${h.x + 30} ${h.y})`} /> : null))}
					</g>
				</svg>
				<canvas ref={ref} width={W} height={H} style={{position: 'absolute', inset: 0}} />
				<Herramientas x={cx} y={cy} f={f} strikes={STRIKES_S2} s={1.15} />
			</AbsoluteFill>
			<PaperTexture o={0.25} />
		</Mesa>
	);
};

// Las hojas se separan en abanico: todas con el mismo calado
const Abanico: React.FC = () => {
	const f = useCurrentFrame();
	const u = E.out(clamp(f / 46));
	const colors = [C.verde, C.flama, C.terracota, C.cempa, C.verde, C.flama];
	return (
		<Mesa>
			<svg width={W} height={H} style={{position: 'absolute', inset: 0}}>
				<defs>
					<mask id="c9fan" maskUnits="userSpaceOnUse" x={-2000} y={-2000} width={5000} height={5000}>
						<rect x={-2000} y={-2000} width={5000} height={5000} fill="#fff" />
						{HOLES.map((h, i) => (
							<path key={i} d={holeD(h.k, 70)} transform={`translate(${h.x + 30 - 540} ${h.y - 980})`} fill="#000" />
						))}
					</mask>
				</defs>
				{colors.map((c, i) => {
					const a = (i - 2.5) * 11 * u;
					const dy = -Math.abs(i - 2.5) * 30 * u;
					return (
						<g key={i} transform={`translate(540 ${1400 + dy}) rotate(${a}) translate(0 -420)`}>
							<rect x={-370} y={-460} width={740} height={920} fill={rgba(mixRGB(C.ink, c, 0.95))} mask="url(#c9fan)" style={{filter: 'drop-shadow(0 8px 10px rgba(0,0,0,0.5))'}} />
						</g>
					);
				})}
			</svg>
			<PaperTexture o={0.25} />
			<Kinetic text={'Cada golpe atraviesa\ndecenas de hojas.'} f={f} at={6} out={66} y={300} size={48} />
		</Mesa>
	);
};

const Calado: React.FC<{dias: number; fecha: string}> = ({dias, fecha}) => {
	const f = useCurrentFrame();
	const t = f / FPS;
	const txt = String(dias);
	const g = useGlyph(txt, numSize(txt), 20, 0);
	const HIT = C09.HIT;
	const back = ramp(f, [HIT - 6, HIT + 12], [0, 1], E.out);
	const groups = STRIKES_REV.length;
	const pts = g?.pts ?? [];
	const minX = Math.min(...pts.map((p) => p[0]), 0);
	const maxX = Math.max(...pts.map((p) => p[0]), 1);
	const grp = (gx: number) => Math.min(groups - 1, Math.floor(((gx - minX) / (maxX - minX + 1)) * groups));
	let cut = -1;
	STRIKES_REV.forEach((st, i) => {
		if (f >= st) cut = i;
	});
	const toolX = 540 + minX + ((Math.max(0, cut) + 0.5) / groups) * (maxX - minX);
	const shake = STRIKES_REV.reduce((a, st) => a + (f >= st && f < st + 5 ? (5 - (f - st)) * 1.6 : 0), 0);
	return (
		<AbsoluteFill style={{background: '#0a0503'}}>
			{/* luz detrás del papel */}
			<Light x={540} y={NUM_Y} r={1000} color={C.cempa} o={0.85 * back} />
			<Light x={540} y={NUM_Y} r={420} color="#FFF0C8" o={0.6 * back} />
			<AbsoluteFill style={{transform: `translate(${(hash(f, 3) - 0.5) * shake}px, ${(hash(f, 4) - 0.5) * shake}px)`}}>
				<svg width={W} height={H} style={{position: 'absolute', inset: 0}}>
					<defs>
						<mask id="c9num" maskUnits="userSpaceOnUse">
							<rect width={W} height={H} fill="#fff" />
							{pts.map(([gx, gy], i) => {
								const gi = grp(gx);
								if (gi > cut) return null;
								const p = E.out(clamp((f - STRIKES_REV[gi]) / 4));
								return <circle key={i} cx={540 + gx} cy={NUM_Y + gy} r={13 * p} fill="#000" />;
							})}
							{/* puentes del papel: el marco calado */}
							<rect x={110} y={330} width={860} height={1260} fill="none" stroke="#000" strokeWidth={6} strokeDasharray="22 10" />
						</mask>
						<linearGradient id="c9sheen" x1="0" y1="0" x2="0" y2="1">
							<stop offset="0%" stopColor="#000" stopOpacity={0.3} />
							<stop offset="100%" stopColor="#FFE6A8" stopOpacity={0.15} />
						</linearGradient>
					</defs>
					<g mask="url(#c9num)">
						<rect x={80} y={300} width={920} height={1320} fill={rgba(mixRGB(C.ink, C.verde, 0.75 + 0.2 * back))} />
						<rect x={80} y={300} width={920} height={1320} fill="url(#c9sheen)" />
					</g>
				</svg>
				{f < HIT ? <Herramientas x={toolX} y={NUM_Y + 40} f={f} strikes={STRIKES_REV} s={1.1} /> : null}
			</AbsoluteFill>
			<Lockup f={f} at={HIT + 4} dias={dias} fecha={fecha} />
			<PaperTexture o={0.22} />
			<AbsoluteFill style={{background: '#000', opacity: ramp(f, [C09.REV - 8, C09.REV - 1], [0, 1], E.inOut)}} />
			{void t}
		</AbsoluteFill>
	);
};

export const Cap09: React.FC<{dias: number; fecha: string}> = ({dias, fecha}) => {
	const f = useCurrentFrame();
	const a = C09.S1;
	const b = a + C09.S2;
	const c = b + C09.S3;
	return (
		<AbsoluteFill style={{background: '#000'}}>
			<Sequence durationInFrames={a}>
				<Trazo />
			</Sequence>
			<Sequence from={a} durationInFrames={C09.S2}>
				<Cincel />
			</Sequence>
			<Sequence from={b} durationInFrames={C09.S3}>
				<Abanico />
			</Sequence>
			<Sequence from={c} durationInFrames={C09.REV}>
				<Calado dias={dias} fecha={fecha} />
			</Sequence>
			<Dip f={f} at={a} dur={10} />
			<LightLeak f={f} at={b} dur={14} />
			<Dip f={f} at={c} dur={10} />
		</AbsoluteFill>
	);
};
