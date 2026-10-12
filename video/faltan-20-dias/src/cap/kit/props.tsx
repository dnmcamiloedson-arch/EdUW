import React from 'react';
import {noise2D} from '@remotion/noise';
import {C, E, clamp, lerp, mixRGB, rgba} from '../../lib/util';

// Pétalo rizado de cempasúchil en coordenadas unitarias (base en 0,0, punta en y=-1)
export const PETAL_D =
	'M 0 0 C -0.36 -0.12 -0.6 -0.58 -0.44 -0.9 Q -0.33 -1.05 -0.2 -0.95 Q -0.1 -1.08 0.02 -0.97 Q 0.14 -1.09 0.25 -0.95 Q 0.37 -1.04 0.46 -0.87 C 0.58 -0.56 0.35 -0.12 0 0 Z';

// ---------- Cempasúchil que se abre (macro) ----------
const RINGS = [
	{n: 26, r: 0.9, len: 0.36, w: 0.2, rot: 0, c: '#C2482A'},
	{n: 24, r: 0.76, len: 0.34, w: 0.2, rot: 7, c: '#E05A32'},
	{n: 21, r: 0.62, len: 0.32, w: 0.2, rot: 3, c: '#F26D3D'},
	{n: 18, r: 0.48, len: 0.3, w: 0.2, rot: 11, c: '#F7863C'},
	{n: 14, r: 0.34, len: 0.27, w: 0.21, rot: 5, c: '#F9A23E'},
	{n: 10, r: 0.2, len: 0.22, w: 0.22, rot: 9, c: '#F5C242'},
];
export const Bloom: React.FC<{cx: number; cy: number; R: number; open: number; lit?: number; id?: string; t?: number}> = ({cx, cy, R, open, lit = 1, id = 'bl', t = 0}) => {
	const l = clamp(lit, 0, 1.2);
	const col = (c: string, k = 1) => rgba(mixRGB(C.ink, c, Math.min(1, l * k)));
	return (
		<g transform={`translate(${cx} ${cy})`}>
			<defs>
				<filter id={id + 'sh'} x="-30%" y="-30%" width="160%" height="160%">
					<feDropShadow dx={0} dy={5} stdDeviation={4} floodColor="#120502" floodOpacity={0.65} />
				</filter>
				<linearGradient id={id + 'p'} x1="0" y1="1" x2="0" y2="0">
					<stop offset="0%" stopColor="#000" stopOpacity={0.45} />
					<stop offset="55%" stopColor="#000" stopOpacity={0} />
					<stop offset="100%" stopColor="#FFF0C0" stopOpacity={0.22} />
				</linearGradient>
			</defs>
			{/* sépalos verdes */}
			{Array.from({length: 6}).map((_, i) => {
				const o = E.out(clamp(open * 2.2));
				return <path key={'s' + i} d={PETAL_D} fill={col(C.verde, 1.2)} stroke={col('#0d2a20')} strokeWidth={0.03} transform={`rotate(${i * 60 + 30}) translate(0 ${-R * 0.08}) scale(${R * 0.24} ${R * lerp(0.4, 0.66, o)})`} opacity={1 - clamp((open - 0.7) * 3)} />;
			})}
			{RINGS.map((rg, ri) => {
				// los anillos de afuera abren primero y giran al desplegarse
				const p = E.out(clamp((open - ri * 0.08) / 0.62));
				const twist = (1 - p) * (ri % 2 ? 38 : -38);
				return (
					<g key={ri} filter={`url(#${id}sh)`} transform={`rotate(${twist})`}>
						{Array.from({length: rg.n}).map((_, k) => {
							const a = (k / rg.n) * 360 + rg.rot + noise2D('bl' + id, ri, k) * 7;
							const breath = 1 + 0.02 * Math.sin(t * 1.4 + k * 0.7);
							const rr = R * rg.r * lerp(0.15, 1, p);
							const sx = R * rg.w * lerp(0.5, 1, p) * (0.9 + 0.2 * ((k * 7) % 3) / 2);
							const sy = R * rg.len * lerp(0.55, 1, p) * breath;
							const shade = k % 3 === 0 ? 0.88 : k % 3 === 1 ? 1 : 0.94;
							return (
								<g key={k} transform={`rotate(${a}) translate(0 ${-(rr - sy * 0.85)}) scale(${sx} ${sy})`}>
									<path d={PETAL_D} fill={col(rg.c, shade)} stroke={col('#6a2210', 0.9)} strokeWidth={0.035} />
									<path d={PETAL_D} fill={`url(#${id}p)`} />
									<path d="M 0 -0.08 L 0 -0.7 M -0.16 -0.2 L -0.22 -0.72 M 0.16 -0.2 L 0.22 -0.72" stroke={col('#7a2a14', 0.8)} strokeWidth={0.025} opacity={0.6} />
								</g>
							);
						})}
					</g>
				);
			})}
			{/* corazón */}
			<circle r={R * 0.09 * lerp(0.6, 1, open)} fill={col(C.terracota, 0.9)} />
			{Array.from({length: 18}).map((_, i) => (
				<circle key={'c' + i} cx={Math.cos(i * 2.4) * R * 0.045 * Math.sqrt(i)} cy={Math.sin(i * 2.4) * R * 0.045 * Math.sqrt(i)} r={R * 0.011} fill={col(C.flama)} />
			))}
		</g>
	);
};

// ---------- Colibrí (perfil, mirando a la izquierda) ----------
export const Hummingbird: React.FC<{x: number; y: number; s?: number; t: number; tilt?: number; flip?: boolean; glow?: number}> = ({x, y, s = 1, t, tilt = 0, flip = false, glow = 0}) => {
	const phase = Math.sin(t * Math.PI * 2 * 11);
	const wingA = -35 + phase * 55;
	const bob = noise2D('hb', 1, t * 2.2) * 6;
	const wing = (a: number, o: number) => (
		<path d="M 0 0 C 20 -40 70 -96 150 -128 C 120 -78 72 -28 14 6 Z" transform={`rotate(${a})`} fill="url(#hbWing)" opacity={o} />
	);
	return (
		<g transform={`translate(${x} ${y + bob}) rotate(${tilt}) scale(${flip ? -s : s} ${s})`}>
			<defs>
				<linearGradient id="hbBody" x1="0" y1="0" x2="1" y2="0.4">
					<stop offset="0%" stopColor={C.flama} />
					<stop offset="35%" stopColor="#2f8a5e" />
					<stop offset="100%" stopColor={C.verde} />
				</linearGradient>
				<linearGradient id="hbThroat" x1="0" y1="0" x2="1" y2="1">
					<stop offset="0%" stopColor={C.cempa} />
					<stop offset={`${50 + 30 * Math.sin(t * 3)}%`} stopColor={C.terracota} />
					<stop offset="100%" stopColor="#5a1c10" />
				</linearGradient>
				<linearGradient id="hbWing" x1="0" y1="1" x2="1" y2="0">
					<stop offset="0%" stopColor={C.marfil} stopOpacity={0.85} />
					<stop offset="100%" stopColor={C.arena} stopOpacity={0.2} />
				</linearGradient>
			</defs>
			{glow ? <ellipse cx={20} cy={0} rx={160} ry={110} fill={C.flama} opacity={0.25 * glow} style={{filter: 'blur(30px)'}} /> : null}
			{/* ala trasera (abanico de movimiento) */}
			<g transform="translate(18 -14)">
				{wing(wingA - 40, 0.12)}
				{wing(wingA - 20, 0.18)}
				{wing(wingA, 0.4)}
			</g>
			{/* cola */}
			<path d="M 70 6 L 150 30 L 128 12 L 158 4 L 118 -6 Z" fill={C.verde} />
			{/* cuerpo */}
			<path d="M -46 -6 C -40 -34 10 -30 40 -18 C 72 -6 90 4 96 10 C 70 22 20 30 -14 22 C -36 16 -50 10 -46 -6 Z" fill="url(#hbBody)" />
			<path d="M -44 2 C -30 20 -6 26 14 24 C 0 14 -20 6 -44 2 Z" fill="url(#hbThroat)" />
			{/* cabeza */}
			<circle cx={-40} cy={-10} r={22} fill="url(#hbBody)" />
			<circle cx={-46} cy={-14} r={5} fill="#0b0502" />
			<circle cx={-47.5} cy={-15.5} r={1.6} fill="#fff" />
			{/* pico */}
			<path d="M -60 -8 L -150 -2 L -60 -2 Z" fill="#1a0d05" />
			{/* ala delantera */}
			<g transform="translate(4 -16)">
				{wing(wingA - 30, 0.15)}
				{wing(wingA - 12, 0.25)}
				{wing(wingA + 6, 0.55)}
			</g>
		</g>
	);
};

// ---------- Pirámide escalonada ----------
export const pyramidPath = (cx: number, base: number, w: number, h: number, tiers = 5) => {
	let d = '';
	const th = h / (tiers + 0.6);
	for (let i = 0; i < tiers; i++) {
		const ww = w * (1 - i * 0.16);
		const y0 = base - i * th;
		d += `M ${cx - ww / 2} ${y0} L ${cx - ww / 2 + th * 0.35} ${y0 - th} L ${cx + ww / 2 - th * 0.35} ${y0 - th} L ${cx + ww / 2} ${y0} Z `;
	}
	const top = base - tiers * th;
	const tw = w * 0.2;
	d += `M ${cx - tw / 2} ${top} L ${cx - tw / 2} ${top - th * 0.6} L ${cx + tw / 2} ${top - th * 0.6} L ${cx + tw / 2} ${top} Z`;
	return d;
};

// ---------- Maguey (silueta) ----------
export const Maguey: React.FC<{x: number; y: number; s?: number; color: string}> = ({x, y, s = 1, color}) => (
	<g transform={`translate(${x} ${y}) scale(${s})`}>
		{[-70, -48, -28, -10, 8, 26, 46, 68, -82, 82].map((a, i) => (
			<path key={i} d={`M -9 0 Q -6 -${120 + (i % 3) * 30} 0 -${190 + (i % 4) * 25} Q 6 -${120 + (i % 3) * 30} 9 0 Z`} fill={color} transform={`rotate(${a})`} />
		))}
	</g>
);
