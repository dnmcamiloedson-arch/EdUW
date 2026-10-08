import React from 'react';
import {C, mixRGB, rgba} from '../lib/util';

// Veladora de vaso: vidrio color terracota/cempasúchil iluminado desde dentro,
// con un motivo de flor en serigrafía.
export const Veladora: React.FC<{x: number; y: number; w?: number; h?: number; L: number; id?: string; motif?: boolean}> = ({
	x,
	y,
	w = 170,
	h = 250,
	L,
	id = 'v',
	motif = true,
}) => {
	const l = Math.max(0, L);
	const top = mixRGB(C.ink, C.flama, 0.08 + 0.9 * Math.min(1, l));
	const mid = mixRGB(C.ink, C.cempa, 0.06 + 0.78 * Math.min(1, l));
	const bot = mixRGB(C.ink, C.terracota, 0.05 + 0.5 * Math.min(1, l));
	const wax = mixRGB(C.ink, C.marfil, 0.05 + 0.9 * Math.min(1, l));
	const ry = w * 0.12;
	return (
		<svg width={w + 40} height={h + 60} viewBox={`${-w / 2 - 20} ${-h - 30} ${w + 40} ${h + 60}`} style={{position: 'absolute', left: x - w / 2 - 20, top: y - h - 30, overflow: 'visible'}}>
			<defs>
				<linearGradient id={id + 'g'} x1="0" y1="0" x2="0" y2="1">
					<stop offset="0%" stopColor={rgba(top)} />
					<stop offset="38%" stopColor={rgba(mid)} />
					<stop offset="100%" stopColor={rgba(bot)} />
				</linearGradient>
				<linearGradient id={id + 'side'} x1="0" y1="0" x2="1" y2="0">
					<stop offset="0%" stopColor="#000" stopOpacity={0.55} />
					<stop offset="22%" stopColor="#000" stopOpacity={0} />
					<stop offset="70%" stopColor="#000" stopOpacity={0} />
					<stop offset="100%" stopColor="#000" stopOpacity={0.6} />
				</linearGradient>
				<radialGradient id={id + 'wax'} cx="50%" cy="50%" r="50%">
					<stop offset="0%" stopColor={rgba(mixRGB(C.ink, '#FFE9A8', Math.min(1, l)))} />
					<stop offset="60%" stopColor={rgba(wax)} />
					<stop offset="100%" stopColor={rgba(mixRGB(C.ink, C.arena, 0.6 * Math.min(1, l)))} />
				</radialGradient>
				<clipPath id={id + 'c'}>
					<path d={`M ${-w / 2} ${-h} L ${-w / 2} ${-ry} A ${w / 2} ${ry} 0 0 0 ${w / 2} ${-ry} L ${w / 2} ${-h} Z`} />
				</clipPath>
			</defs>
			{/* sombra de contacto */}
			<ellipse cx={4} cy={-ry * 0.2} rx={w * 0.62} ry={ry * 1.1} fill="#000" opacity={0.55} />
			{/* cara trasera del borde */}
			<ellipse cx={0} cy={-h} rx={w / 2} ry={ry} fill={rgba(mixRGB(C.ink, C.flama, 0.5 * l))} />
			{/* cera */}
			<ellipse cx={0} cy={-h + 26} rx={w / 2 - 6} ry={ry - 3} fill={`url(#${id}wax)`} />
			<g clipPath={`url(#${id}c)`}>
				<rect x={-w / 2} y={-h} width={w} height={h} fill={`url(#${id}g)`} />
				{motif ? (
					<g transform={`translate(0 ${-h * 0.42})`} opacity={0.55 * Math.min(1, 0.1 + l)}>
						{Array.from({length: 12}).map((_, i) => (
							<ellipse key={i} cx={0} cy={-22} rx={8} ry={20} transform={`rotate(${i * 30})`} fill={rgba(C.terracota, 0.9)} />
						))}
						<circle r={11} fill={rgba(mixRGB(C.ink, C.flama, 0.4 + 0.5 * l))} />
						<circle r={5} fill={rgba(C.terracota)} />
						{Array.from({length: 9}).map((_, i) => (
							<circle key={'d' + i} cx={-w / 2 + 14 + i * ((w - 28) / 8)} cy={h * 0.3} r={3.2} fill={rgba(C.terracota, 0.8)} />
						))}
						{Array.from({length: 9}).map((_, i) => (
							<circle key={'e' + i} cx={-w / 2 + 14 + i * ((w - 28) / 8)} cy={-h * 0.27} r={3.2} fill={rgba(C.terracota, 0.8)} />
						))}
					</g>
				) : null}
				<rect x={-w / 2} y={-h} width={w} height={h} fill={`url(#${id}side)`} />
				{/* brillo especular */}
				<rect x={-w * 0.33} y={-h + 18} width={w * 0.06} height={h * 0.8} rx={4} fill="#FFF6DD" opacity={0.03 + 0.32 * Math.min(1, l)} />
				<rect x={w * 0.36} y={-h + 18} width={w * 0.025} height={h * 0.75} rx={3} fill={C.flama} opacity={0.25 * l} />
			</g>
			{/* borde frontal del vaso */}
			<path d={`M ${-w / 2} ${-h} A ${w / 2} ${ry} 0 0 0 ${w / 2} ${-h}`} stroke={rgba(mixRGB(C.ink, '#FFF2C8', 0.2 + 0.8 * l))} strokeWidth={2.5} fill="none" opacity={0.85} />
		</svg>
	);
};
