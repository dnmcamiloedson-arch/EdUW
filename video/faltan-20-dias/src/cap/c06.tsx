import React from 'react';
import {AbsoluteFill, Sequence, useCurrentFrame} from 'remotion';
import {C, E, FPS, H, W, clamp, flicker, hash, lerp, ramp, rgba} from '../lib/util';
import {Flame, Light} from '../components/core';
import {paperUrl} from '../lib/paperUrl';
import {GoldNumber, Lockup, NUM_Y, numSize} from './kit/type';
import {Dip} from './kit/transitions';

// Capítulo 6 · "Calaverita literaria" — un verso que se escribe solo.
export const C06 = {S1: 84, S2: 216, REV: 132, HIT: 62};
export const C06_LEN = C06.S1 + C06.S2 + C06.REV;

const TITLE = 'Calaverita';
export const VERSO = ['La Flaca subió a Santa Fe', 'con su sombrero de gala:', '«En Westhill me quedaré,', 'que esta fiesta no está mala».'];
export const LINE_AT = [6, 54, 102, 150]; // frames locales de S2 donde empieza cada línea
const LINE_DUR = 42;

const INK = '#2a140a';

const Pergamino: React.FC<{children: React.ReactNode; dark?: number}> = ({children, dark = 0}) => (
	<AbsoluteFill style={{background: '#1a0c06'}}>
		<div
			style={{
				position: 'absolute',
				left: 70,
				top: 230,
				width: W - 140,
				height: 1460,
				background: 'radial-gradient(ellipse at 50% 45%, #f4e2bd, #e2c48e 65%, #b88a52 100%)',
				boxShadow: '0 30px 80px rgba(0,0,0,0.7), inset 0 0 120px rgba(90,50,20,0.55)',
				borderRadius: 18,
			}}
		/>
		<div style={{position: 'absolute', left: 70, top: 230, width: W - 140, height: 1460, backgroundImage: `url(${paperUrl})`, backgroundSize: `${W}px ${H}px`, mixBlendMode: 'multiply', opacity: 0.35, borderRadius: 18}} />
		{children}
		<AbsoluteFill style={{background: '#000', opacity: dark, pointerEvents: 'none'}} />
	</AbsoluteFill>
);

// Pluma con plumín
const Pluma: React.FC<{x: number; y: number; t: number}> = ({x, y, t}) => (
	<svg width={W} height={H} style={{position: 'absolute', inset: 0, overflow: 'visible'}}>
		<g transform={`translate(${x} ${y}) rotate(${-38 + Math.sin(t * 9) * 3})`}>
			<path d="M 0 0 L -6 -30 L 6 -30 Z" fill="#3a2a1a" />
			<path d="M -5 -30 C -60 -150 -40 -340 30 -460 C 60 -330 50 -160 5 -30 Z" fill="#f2ead8" stroke="#c8b898" strokeWidth={2} />
			<path d="M 0 -30 C 5 -170 15 -320 30 -460" stroke="#a89878" strokeWidth={3} fill="none" />
			{Array.from({length: 14}).map((_, i) => (
				<path key={i} d={`M ${3 + i * 1.6} ${-60 - i * 28} l ${-30 + i} ${-14}`} stroke="#d8ccb2" strokeWidth={2} />
			))}
		</g>
	</svg>
);

// Línea manuscrita: se descubre de izquierda a derecha; devuelve dónde va la pluma
const lineGeom = (i: number) => ({y: 560 + i * 112, x0: 150, x1: 930});

const Escritura: React.FC<{f: number}> = ({f}) => {
	let pen: [number, number] | null = null;
	const lines = VERSO.map((txt, i) => {
		const u = clamp((f - LINE_AT[i]) / LINE_DUR);
		const g = lineGeom(i);
		if (u > 0 && u < 1) pen = [lerp(g.x0, g.x1, u), g.y + 14];
		return (
			<div
				key={i}
				style={{
					position: 'absolute',
					left: g.x0,
					top: g.y - 50,
					width: g.x1 - g.x0,
					fontFamily: 'Alike',
					fontStyle: 'italic',
					fontSize: 57,
					color: INK,
					whiteSpace: 'nowrap',
					clipPath: `inset(0 ${(1 - u) * 100}% 0 0)`,
					textShadow: '0 1px 0 rgba(255,246,230,0.5)',
				}}
			>
				{txt}
			</div>
		);
	});
	return (
		<>
			{lines}
			{pen ? <Pluma x={pen[0]} y={pen[1]} t={f / FPS} /> : null}
		</>
	);
};

// Garabatos en el margen que se dibujan solos
const Garabatos: React.FC<{f: number}> = ({f}) => {
	const d = E.inOut(clamp((f - 20) / 120));
	return (
		<svg width={W} height={H} style={{position: 'absolute', inset: 0}}>
			<g stroke={INK} strokeWidth={4} fill="none" strokeLinecap="round" strokeDasharray="1400" strokeDashoffset={1400 * (1 - d)} opacity={0.75}>
				{/* calaverita */}
				<path d="M 760 1130 C 760 1050 900 1050 900 1130 C 900 1170 880 1190 870 1210 L 790 1210 C 780 1190 760 1170 760 1130 Z" />
				<circle cx={800} cy={1135} r={16} />
				<circle cx={860} cy={1135} r={16} />
				<path d="M 830 1155 l -8 18 l 16 0 Z" />
				<path d="M 795 1195 L 865 1195 M 810 1185 L 810 1205 M 830 1185 L 830 1205 M 850 1185 L 850 1205" />
				{/* flor */}
				{Array.from({length: 8}).map((_, i) => {
					const a = (i / 8) * Math.PI * 2;
					return <ellipse key={i} cx={260 + Math.cos(a) * 34} cy={1180 + Math.sin(a) * 34} rx={22} ry={14} transform={`rotate(${(a * 180) / Math.PI} ${260 + Math.cos(a) * 34} ${1180 + Math.sin(a) * 34})`} />;
				})}
				<circle cx={260} cy={1180} r={14} />
				<path d="M 260 1214 C 250 1300 270 1360 255 1420 M 258 1300 C 220 1280 200 1300 190 1320" />
				{/* subrayado */}
				<path d="M 300 470 C 420 486 640 486 780 470" />
			</g>
		</svg>
	);
};

const Titulo: React.FC = () => {
	const f = useCurrentFrame();
	const t = f / FPS;
	const u = E.inOut(clamp((f - 10) / 50));
	const fl = flicker(t, 61);
	return (
		<Pergamino>
			<Light x={980} y={300} r={900} color={C.flama} o={0.25 * fl} />
			<div style={{position: 'absolute', left: 0, width: W, top: 360, textAlign: 'center', fontFamily: 'Rye', fontSize: 92, color: '#6a2a12', clipPath: `inset(0 ${(1 - u) * 100}% 0 0)`, letterSpacing: '0.04em'}}>
				{TITLE}
			</div>
			{u < 1 && u > 0 ? <Pluma x={lerp(260, 820, u)} y={430} t={t} /> : null}
			<svg width={W} height={H} style={{position: 'absolute', inset: 0}}>
				<rect x={930} y={1560} width={44} height={150} rx={4} fill={C.marfil} />
				<ellipse cx={170} cy={1640} rx={70} ry={26} fill="#1a0c06" />
				<path d="M 110 1640 L 120 1560 L 220 1560 L 230 1640 Z" fill="#2a1a10" />
			</svg>
			<Flame x={952} y={1562} size={66} t={t} seed={61} fl={fl} />
		</Pergamino>
	);
};

const Verso: React.FC = () => {
	const f = useCurrentFrame();
	const t = f / FPS + 3;
	const fl = flicker(t, 62);
	return (
		<Pergamino>
			<Light x={980} y={1500} r={900} color={C.flama} o={0.25 * fl} />
			<div style={{position: 'absolute', left: 0, width: W, top: 360, textAlign: 'center', fontFamily: 'Rye', fontSize: 92, color: '#6a2a12', letterSpacing: '0.04em'}}>
				{TITLE}
			</div>
			<Garabatos f={f} />
			<Escritura f={f} />
			<svg width={W} height={H} style={{position: 'absolute', inset: 0}}>
				<rect x={930} y={1560} width={44} height={150} rx={4} fill={C.marfil} />
				<ellipse cx={170} cy={1640} rx={70} ry={26} fill="#1a0c06" />
				<path d="M 110 1640 L 120 1560 L 220 1560 L 230 1640 Z" fill="#2a1a10" />
			</svg>
			<Flame x={952} y={1562} size={66} t={t} seed={61} fl={fl} />
		</Pergamino>
	);
};

const Tinta: React.FC<{dias: number; fecha: string}> = ({dias, fecha}) => {
	const f = useCurrentFrame();
	const t = f / FPS + 10;
	const txt = String(dias);
	const HIT = C06.HIT;
	const DROP = 14;
	const drop = clamp(f / DROP);
	const spread = E.out(clamp((f - DROP) / 30));
	const gold = E.inOut(clamp((f - HIT + 12) / 20));
	const size = numSize(txt);
	const blobs = Array.from({length: 9}).map((_, i) => ({a: (i / 9) * Math.PI * 2 + hash(i, 1), d: 60 + 140 * hash(i, 2), r: 20 + 40 * hash(i, 3)}));
	return (
		<Pergamino>
			{/* gota que cae y salpica */}
			{f < DROP ? (
				<svg width={W} height={H} style={{position: 'absolute', inset: 0}}>
					<path d={`M 540 ${lerp(150, NUM_Y - 30, drop * drop)} c -18 26 -18 44 0 44 c 18 0 18 -18 0 -44 Z`} fill={INK} />
				</svg>
			) : null}
			{f >= DROP ? (
				<svg width={W} height={H} style={{position: 'absolute', inset: 0}}>
					{blobs.map((b, i) => (
						<circle key={i} cx={540 + Math.cos(b.a) * b.d * spread} cy={NUM_Y + Math.sin(b.a) * b.d * spread * 0.8} r={b.r * spread * (1 - gold)} fill={INK} opacity={0.9} />
					))}
				</svg>
			) : null}
			{/* la tinta se vuelve número */}
			<div
				style={{
					position: 'absolute',
					left: 0,
					width: W,
					top: NUM_Y - size / 2,
					height: size,
					lineHeight: `${size}px`,
					textAlign: 'center',
					fontFamily: 'Rye',
					fontSize: size,
					color: INK,
					opacity: spread * (1 - gold),
					transform: `scale(${lerp(0.6, 1, spread)})`,
					filter: `blur(${(1 - spread) * 10}px)`,
				}}
			>
				{txt}
			</div>
			<GoldNumber txt={txt} o={gold} glow={0.35 * gold} />
			<Lockup f={f} at={HIT + 4} dias={dias} fecha={fecha} tone="dark" />
			<AbsoluteFill style={{background: '#000', opacity: ramp(f, [C06.REV - 8, C06.REV - 1], [0, 1], E.inOut)}} />
			{void t}
		</Pergamino>
	);
};

export const Cap06: React.FC<{dias: number; fecha: string}> = ({dias, fecha}) => {
	const f = useCurrentFrame();
	const a = C06.S1;
	const b = a + C06.S2;
	return (
		<AbsoluteFill style={{background: '#000'}}>
			<Sequence durationInFrames={a}>
				<Titulo />
			</Sequence>
			<Sequence from={a} durationInFrames={C06.S2}>
				<Verso />
			</Sequence>
			<Sequence from={b} durationInFrames={C06.REV}>
				<Tinta dias={dias} fecha={fecha} />
			</Sequence>
			<Dip f={f} at={b} dur={10} />
			{void W}
		</AbsoluteFill>
	);
};
