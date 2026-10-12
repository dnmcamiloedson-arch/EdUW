import React from 'react';
import {AbsoluteFill, Sequence, useCurrentFrame} from 'remotion';
import {noise2D} from '@remotion/noise';
import {C, E, FPS, H, W, clamp, flicker, hash, lerp, mixRGB, ramp, rgba} from '../lib/util';
import {Light, PaperTexture, useCanvasDraw} from '../components/core';
import {drawPetal} from '../components/Particles';
import {PapelDefs, PapelSheen, PapelString} from '../components/PapelPicado';
import {Kinetic, Lockup} from './kit/type';
import {Dip, LightLeak} from './kit/transitions';
import {Xolo} from './c14';

// Capítulo 10 (REEL) · "El Mictlán" — para volver, primero hay que bajar los nueve niveles.
export const C10 = {INTRO: 84, LEVEL: 40, REV: 156, HIT: 72};
export const C10_DESC = C10.LEVEL * 9;
export const C10_LEN = C10.INTRO + C10_DESC + C10.REV;

const BAND = 1300;
const LEVELS = [
	{num: 'I', nah: 'Itzcuintlan', es: 'el río que se cruza con un perro', col: '#1a1420'},
	{num: 'II', nah: 'Tepeme Monamictlan', es: 'los cerros que chocan', col: '#3a1a12'},
	{num: 'III', nah: 'Iztepetl', es: 'el cerro de obsidiana', col: '#0c0a0e'},
	{num: 'IV', nah: 'Itzehecayan', es: 'el viento de navajas', col: '#1e1a1e'},
	{num: 'V', nah: 'Pancuecuetlacayan', es: 'donde todo ondea como bandera', col: '#16241e'},
	{num: 'VI', nah: 'Temiminaloyan', es: 'donde vuelan las flechas', col: '#2c1a0e'},
	{num: 'VII', nah: 'Teocoyocualloa', es: 'el lugar de los jaguares', col: '#3a2010'},
	{num: 'VIII', nah: 'Izmictlan Apochcalolca', es: 'las nueve aguas', col: '#0c1018'},
	{num: 'IX', nah: 'Chicunamictlan', es: 'el descanso', col: '#3a2412'},
];

// ---------- Introducción: la boca de la cueva ----------
const Entrada: React.FC = () => {
	const f = useCurrentFrame();
	const t = f / FPS;
	const dive = E.in(clamp((f - 40) / 44));
	const ref = useCanvasDraw(
		(ctx) => {
			for (let i = 0; i < 70; i++) {
				const r = (q: number) => hash(i * 5 + q, 101);
				const p = (t * 0.35 + r(1)) % 1;
				const ang = r(2) * 6.28 + t * 0.5;
				const rad = (1 - p) * 700;
				drawPetal(ctx, 540 + Math.cos(ang) * rad, 960 + Math.sin(ang) * rad * 1.3, (1 - p) * 34 + 6, ang + t, Math.cos(t * 3 + i), 0.85, 0.9 * (1 - p * 0.6), r(3));
			}
		},
		[f],
	);
	return (
		<AbsoluteFill style={{background: '#020101'}}>
			<AbsoluteFill style={{transform: `scale(${1 + dive * 3.5})`, transformOrigin: '540px 960px'}}>
				{Array.from({length: 12}).map((_, i) => {
					const k = ((i + t * 0.8) % 12) / 12;
					const r = 60 + k ** 2 * 1300;
					return <div key={i} style={{position: 'absolute', left: 540 - r, top: 960 - r * 1.25, width: r * 2, height: r * 2.5, borderRadius: '50%', border: `${3 + k * 10}px solid ${rgba(mixRGB('#1a0d07', C.terracota, 0.5 * k))}`, opacity: 0.35 + 0.5 * k}} />;
				})}
				<Light x={540} y={960} r={260} color={C.cempa} o={0.5} />
				<canvas ref={ref} width={W} height={H} style={{position: 'absolute', inset: 0}} />
			</AbsoluteFill>
			<PaperTexture o={0.18} />
			<Kinetic text={'Para volver,\nprimero hay que bajar.'} f={f} at={6} out={46} y={1420} size={54} />
		</AbsoluteFill>
	);
};

// ---------- Cada nivel ----------
const Nivel: React.FC<{i: number; t: number; cy: number}> = ({i, t, cy}) => {
	const L = LEVELS[i];
	const y0 = cy - BAND / 2;
	let art: React.ReactNode = null;
	if (i === 0) {
		art = (
			<svg width={W} height={BAND} style={{position: 'absolute', left: 0, top: y0, overflow: 'visible'}}>
				{Array.from({length: 18}).map((_, k) => (
					<path key={k} d={`M -20 ${700 + k * 26} ${Array.from({length: 12}).map((__, j) => `Q ${j * 100 + 50} ${700 + k * 26 + Math.sin(t * 2 + j + k) * 10} ${j * 100 + 100} ${700 + k * 26}`).join(' ')}`} stroke={rgba(C.marfil, 0.08)} strokeWidth={2} fill="none" />
				))}
				<Xolo x={lerp(-100, 1100, (t * 0.35) % 1)} y={690} s={1.5} t={t} rim={C.flama} />
			</svg>
		);
	} else if (i === 1) {
		const clash = Math.sin(t * 3) * 0.5 + 0.5;
		art = (
			<svg width={W} height={BAND} style={{position: 'absolute', left: 0, top: y0}}>
				<path d={`M ${-200 + clash * 160} 1000 L ${300 + clash * 160} 360 L ${620 + clash * 160} 1000 Z`} fill="#5a2a18" stroke={C.cempa} strokeWidth={3} />
				<path d={`M ${460 - clash * 160} 1000 L ${780 - clash * 160} 320 L ${1280 - clash * 160} 1000 Z`} fill="#4a2214" stroke={C.cempa} strokeWidth={3} />
				{clash > 0.92 ? <circle cx={540} cy={660} r={60 + (clash - 0.92) * 900} fill={C.flama} opacity={0.4} style={{filter: 'blur(20px)'}} /> : null}
			</svg>
		);
	} else if (i === 2) {
		art = (
			<svg width={W} height={BAND} style={{position: 'absolute', left: 0, top: y0}}>
				{Array.from({length: 26}).map((_, k) => {
					const x = hash(k, 3) * W;
					const y = 300 + hash(k, 4) * 700;
					const s = 40 + 90 * hash(k, 5);
					const r = hash(k, 6) * 360 + t * 20 * (hash(k, 7) - 0.5);
					return (
						<g key={k} transform={`translate(${x} ${y}) rotate(${r})`}>
							<path d={`M 0 ${-s} L ${s * 0.35} ${s * 0.4} L ${-s * 0.3} ${s * 0.5} Z`} fill="#050406" stroke="#8a8aa0" strokeOpacity={0.6} strokeWidth={2} />
							<path d={`M 0 ${-s} L ${s * 0.1} ${s * 0.2}`} stroke="#FFFFFF" strokeOpacity={0.35} strokeWidth={2} />
						</g>
					);
				})}
			</svg>
		);
	} else if (i === 3) {
		art = (
			<svg width={W} height={BAND} style={{position: 'absolute', left: 0, top: y0}}>
				{Array.from({length: 14}).map((_, k) => {
					const y = 280 + k * 55;
					return <path key={k} d={`M -100 ${y} C 300 ${y - 120 + Math.sin(t + k) * 40} 700 ${y + 120} 1180 ${y - 40}`} stroke={rgba(C.marfil, 0.25)} strokeWidth={3} fill="none" strokeDasharray="160 120" strokeDashoffset={-t * 900 - k * 70} />;
				})}
				{Array.from({length: 18}).map((_, k) => {
					const x = ((hash(k, 8) * W + t * 700 * (0.6 + hash(k, 9))) % (W + 200)) - 100;
					const y = 300 + hash(k, 10) * 700;
					return <path key={'s' + k} d={`M ${x} ${y} l 26 -6 l -10 14 Z`} fill="#c8c8d8" opacity={0.6} />;
				})}
			</svg>
		);
	} else if (i === 4) {
		art = (
			<div style={{position: 'absolute', left: 0, top: y0 - 40, width: W, height: BAND}}>
				{[{y: 260, s: 0.8}, {y: 560, s: 1.0}, {y: 860, s: 0.9}].map((c, k) => (
					<PapelString key={k} cfg={{y: c.y, sag: 70, count: 5, spacing: 250, x0: 40, scale: c.s, seed: 300 + k, types: [k % 4, (k + 1) % 4, (k + 2) % 4, (k + 3) % 4], colorOffset: k}} frame={200} t={t + k} light={0.85} lightPos={[540, 1300]} gust={1.8} />
				))}
			</div>
		);
	} else if (i === 5) {
		art = (
			<svg width={W} height={BAND} style={{position: 'absolute', left: 0, top: y0}}>
				{Array.from({length: 12}).map((_, k) => {
					const dir = k % 2 ? 1 : -1;
					const x = ((hash(k, 11) * 1600 + t * 1400 * (0.7 + hash(k, 12) * 0.6)) % 1800) - 300;
					const xx = dir > 0 ? x : W - x;
					const y = 280 + k * 62;
					return (
						<g key={k} transform={`translate(${xx} ${y}) scale(${dir} 1)`}>
							<path d="M -200 0 L 0 0" stroke={rgba(C.arena, 0.8)} strokeWidth={4} />
							<path d="M 0 0 L -24 -12 L -24 12 Z" fill={C.terracota} />
							<path d="M -200 0 l -20 -12 M -190 0 l -20 -12 M -200 0 l -20 12 M -190 0 l -20 12" stroke={C.verde} strokeWidth={4} />
							<path d="M -260 0 L -200 0" stroke={rgba(C.flama, 0.4)} strokeWidth={8} style={{filter: 'blur(4px)'}} />
						</g>
					);
				})}
			</svg>
		);
	} else if (i === 6) {
		const blink = Math.sin(t * 2.2) > 0.96 ? 0.1 : 1;
		art = (
			<svg width={W} height={BAND} style={{position: 'absolute', left: 0, top: y0}}>
				{Array.from({length: 60}).map((_, k) => {
					const x = hash(k, 13) * W;
					const y = 200 + hash(k, 14) * 900;
					const r = 18 + 22 * hash(k, 15);
					return (
						<g key={k} transform={`translate(${x} ${y})`} opacity={0.5}>
							{Array.from({length: 5}).map((__, j) => (
								<ellipse key={j} cx={Math.cos(j * 1.256) * r} cy={Math.sin(j * 1.256) * r * 0.8} rx={r * 0.38} ry={r * 0.3} fill="#120806" />
							))}
						</g>
					);
				})}
				{[
					[430, 640],
					[650, 640],
				].map(([x, y], k) => (
					<g key={'e' + k} transform={`translate(${x} ${y}) scale(1 ${blink})`}>
						<ellipse rx={56} ry={30} fill={C.flama} style={{filter: 'drop-shadow(0 0 30px #F5C242)'}} />
						<ellipse rx={10} ry={26} fill="#120806" />
					</g>
				))}
			</svg>
		);
	} else if (i === 7) {
		art = (
			<svg width={W} height={BAND} style={{position: 'absolute', left: 0, top: y0}}>
				{Array.from({length: 22}).map((_, k) => (
					<path key={k} d={`M -20 ${260 + k * 38} ${Array.from({length: 12}).map((__, j) => `Q ${j * 100 + 50} ${260 + k * 38 + Math.sin(t * 1.6 + j * 0.8 + k) * 16} ${j * 100 + 100} ${260 + k * 38}`).join(' ')}`} stroke={rgba('#9ab0d0', 0.18)} strokeWidth={2.5} fill="none" />
				))}
				{Array.from({length: 9}).map((_, k) => (
					<circle key={'f' + k} cx={(hash(k, 16) * W + t * 40) % W} cy={360 + hash(k, 17) * 600 + Math.sin(t * 2 + k) * 6} r={14} fill={C.cempa} opacity={0.8} />
				))}
			</svg>
		);
	} else {
		art = (
			<svg width={W} height={BAND} style={{position: 'absolute', left: 0, top: y0}}>
				<path d="M 340 1000 L 340 560 Q 540 360 740 560 L 740 1000 Z" fill="#FFE2A0" opacity={0.9} style={{filter: 'drop-shadow(0 0 60px #F5C242)'}} />
				<path d="M 300 1000 L 300 540 Q 540 300 780 540 L 780 1000" stroke="#1a0d07" strokeWidth={36} fill="none" />
			</svg>
		);
	}
	return (
		<>
			<div style={{position: 'absolute', left: 0, top: y0, width: W, height: BAND, background: `linear-gradient(180deg, ${L.col}, ${rgba(mixRGB(L.col, '#000', 0.4))})`}} />
			{art}
			{i === 8 ? <Light x={540} y={cy} r={900} color={C.flama} o={0.55} /> : null}
		</>
	);
};

const Descenso: React.FC = () => {
	const f = useCurrentFrame();
	const t = f / FPS;
	const u = f / C10.LEVEL;
	const li = Math.min(8, Math.floor(u));
	const frac = u - Math.floor(u);
	// escalera suave: baja rápido y se detiene un momento en cada nivel
	const step = li >= 8 ? 0 : E.inOut(clamp((frac - 0.55) / 0.45));
	const camY = (Math.min(8, li) + step) * BAND;
	const visible = [li - 1, li, li + 1].filter((k) => k >= 0 && k < 9);
	return (
		<AbsoluteFill style={{background: '#000', overflow: 'hidden'}}>
			<PapelDefs />
			<PapelSheen />
			<AbsoluteFill style={{transform: `translateY(${-camY + 960 - BAND / 2}px)`}}>
				{visible.map((k) => (
					<Nivel key={k} i={k} t={t} cy={k * BAND + BAND / 2} />
				))}
				{/* estratos de roca entre niveles (papel recortado) */}
				<svg width={W} height={BAND * 10} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}>
					{visible.map((k) => (
						<g key={k}>
							<path d={`M -20 ${(k + 1) * BAND - 40} ${Array.from({length: 30}).map((_, j) => `L ${j * 40} ${(k + 1) * BAND - 40 + noise2D('st', k, j * 0.4) * 50}`).join(' ')} L 1120 ${(k + 1) * BAND + 60} ${Array.from({length: 30}).map((_, j) => `L ${1120 - j * 40} ${(k + 1) * BAND + 60 + noise2D('sb', k, j * 0.4) * 40}`).join(' ')} Z`} fill="#0d0705" stroke={rgba(C.cempa, 0.35)} strokeWidth={3} />
						</g>
					))}
				</svg>
			</AbsoluteFill>
			{/* rótulo del nivel */}
			{(() => {
				const lf = frac * C10.LEVEL;
				const o = ramp(lf, [2, 10], [0, 1], E.out) * (li < 8 ? ramp(lf, [26, 34], [1, 0], E.in) : 1);
				const L = LEVELS[li];
				return (
					<div style={{position: 'absolute', left: 0, width: W, top: 300, textAlign: 'center', opacity: o, transform: `translateY(${(1 - o) * 16}px)`}}>
						<div style={{fontFamily: 'Rye', fontSize: 70, color: C.flama, textShadow: '0 0 20px rgba(242,109,61,0.6), 0 2px 8px #000'}}>{L.num}</div>
						<div style={{fontFamily: 'Alike', fontSize: 40, color: C.marfil, letterSpacing: '0.04em', textShadow: '0 2px 10px #000'}}>{L.nah}</div>
						<div style={{fontFamily: 'Alike', fontSize: 32, color: C.arena, opacity: 0.85, textShadow: '0 2px 10px #000'}}>{L.es}</div>
					</div>
				);
			})()}
			<PaperTexture o={0.18} />
		</AbsoluteFill>
	);
};

// ---------- Revelación: el número labrado en piedra ----------
const Piedra: React.FC<{dias: number; fecha: string}> = ({dias, fecha}) => {
	const f = useCurrentFrame();
	const t = f / FPS + 3;
	const txt = String(dias);
	const HIT = C10.HIT;
	const light = E.inOut(clamp((f - 20) / (HIT - 20)));
	const fill = E.out(clamp((f - HIT + 18) / 22));
	const fl = flicker(t, 10);
	const R = 380;
	const cy = 860;
	const size = txt.length > 1 ? 400 : 470;
	return (
		<AbsoluteFill style={{background: '#050302'}}>
			<Light x={540} y={cy} r={1100} color={C.cempa} o={0.15 + 0.4 * light} />
			{/* haz de luz desde arriba */}
			<div style={{position: 'absolute', left: 340, top: -200, width: 400, height: 1500, background: `linear-gradient(180deg, ${rgba(C.flama, 0.35 * light)}, transparent)`, filter: 'blur(30px)'}} />
			<svg width={W} height={H} style={{position: 'absolute', inset: 0}}>
				<defs>
					<radialGradient id="stone" cx="45%" cy="40%" r="70%">
						<stop offset="0%" stopColor={rgba(mixRGB('#2a2420', '#8a7a68', light))} />
						<stop offset="100%" stopColor={rgba(mixRGB('#120e0c', '#3a3028', light))} />
					</radialGradient>
				</defs>
				<circle cx={540} cy={cy + 14} r={R + 6} fill="#000" opacity={0.6} style={{filter: 'blur(10px)'}} />
				<circle cx={540} cy={cy} r={R} fill="url(#stone)" />
				{[0.93, 0.8, 0.66].map((k, i) => (
					<circle key={i} cx={540} cy={cy} r={R * k} fill="none" stroke="#0a0706" strokeOpacity={0.7} strokeWidth={6 - i} />
				))}
				{/* rayos y cuentas labradas */}
				{Array.from({length: 40}).map((_, k) => {
					const a = (k / 40) * Math.PI * 2;
					return <rect key={k} x={540 + Math.cos(a) * R * 0.86 - 8} y={cy + Math.sin(a) * R * 0.86 - 8} width={16} height={16} fill="#0a0706" opacity={0.55} transform={`rotate(${(a * 180) / Math.PI} ${540 + Math.cos(a) * R * 0.86} ${cy + Math.sin(a) * R * 0.86})`} />;
				})}
				{Array.from({length: 8}).map((_, k) => {
					const a = (k / 8) * Math.PI * 2 + Math.PI / 8;
					const x = 540 + Math.cos(a) * R * 0.73;
					const y = cy + Math.sin(a) * R * 0.73;
					return <path key={'r' + k} d={`M ${x} ${y} l ${Math.cos(a) * 40} ${Math.sin(a) * 40}`} stroke="#0a0706" strokeWidth={10} strokeLinecap="round" opacity={0.6} />;
				})}
				{/* el número: surco tallado y, al llegar la luz, lleno de fuego */}
				<text x={542} y={cy + size * 0.36 + 3} textAnchor="middle" fontFamily="Rye" fontSize={size} fill="#000" opacity={0.65}>
					{txt}
				</text>
				<text x={540} y={cy + size * 0.36} textAnchor="middle" fontFamily="Rye" fontSize={size} fill={rgba(mixRGB('#16100c', '#4a3c30', light))}>
					{txt}
				</text>
				<defs>
					<linearGradient id="lava" x1="0" y1="1" x2="0" y2="0">
						<stop offset="0%" stopColor={C.terracota} />
						<stop offset="40%" stopColor={C.cempa} />
						<stop offset="80%" stopColor={C.flama} />
						<stop offset="100%" stopColor="#FFF4D6" />
					</linearGradient>
					<clipPath id="fillUp">
						<rect x={0} y={cy + size * 0.4 - fill * size * 1.1} width={W} height={H} />
					</clipPath>
				</defs>
				<g clipPath="url(#fillUp)">
					<text x={540} y={cy + size * 0.36} textAnchor="middle" fontFamily="Rye" fontSize={size} fill="url(#lava)" style={{filter: `drop-shadow(0 0 ${14 + 8 * fl}px ${C.cempa})`}}>
						{txt}
					</text>
				</g>
			</svg>
			<Lockup f={f} at={HIT + 6} dias={dias} fecha={fecha} top={370} bottom={1270} />
			<PaperTexture o={0.18} />
			<AbsoluteFill style={{background: '#000', opacity: ramp(f, [C10.REV - 8, C10.REV - 1], [0, 1], E.inOut)}} />
		</AbsoluteFill>
	);
};

export const Cap10: React.FC<{dias: number; fecha: string}> = ({dias, fecha}) => {
	const f = useCurrentFrame();
	const a = C10.INTRO;
	const b = a + C10_DESC;
	return (
		<AbsoluteFill style={{background: '#000'}}>
			<Sequence durationInFrames={a}>
				<Entrada />
			</Sequence>
			<Sequence from={a} durationInFrames={C10_DESC}>
				<Descenso />
			</Sequence>
			<Sequence from={b} durationInFrames={C10.REV}>
				<Piedra dias={dias} fecha={fecha} />
			</Sequence>
			<Dip f={f} at={a} dur={10} />
			<LightLeak f={f} at={b} dur={18} />
		</AbsoluteFill>
	);
};
