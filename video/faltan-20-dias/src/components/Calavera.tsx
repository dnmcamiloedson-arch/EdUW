import React from 'react';
import {C, mixRGB, rgba} from '../lib/util';

// Calavera de azúcar original, de perfil mirando a la izquierda (viewBox 1000×1000).
export const SKULL =
	'M 470 130 C 600 95 790 140 860 300 C 915 420 900 560 830 640 C 800 672 770 690 742 700 L 735 712 ' +
	'C 728 760 712 820 690 870 C 676 905 650 925 610 930 L 420 935 C 380 937 355 925 345 900 C 338 880 340 855 350 835 ' +
	'L 352 800 C 340 798 330 790 330 778 L 330 745 C 320 735 305 720 300 700 C 292 680 280 668 262 660 ' +
	'C 255 655 255 645 262 640 C 268 610 262 575 268 545 C 272 520 285 505 290 495 C 280 480 268 465 270 445 ' +
	'C 272 420 290 400 300 385 C 320 260 380 160 470 130 Z';

const petalRing = (cx: number, cy: number, r: number, n: number, len: number, wid: number, fill: string, rot = 0) =>
	Array.from({length: n}).map((_, i) => (
		<ellipse key={`${cx}-${r}-${i}`} cx={cx} cy={cy - r} rx={wid} ry={len} transform={`rotate(${rot + (i * 360) / n} ${cx} ${cy})`} fill={fill} />
	));

export const Marigold: React.FC<{x: number; y: number; s: number; lit: number; leaves?: boolean; filter?: string}> = ({
	x,
	y,
	s,
	lit,
	leaves = true,
	filter = 'url(#cut)',
}) => {
	const c1 = rgba(mixRGB(C.ink, C.cempa, lit));
	const c2 = rgba(mixRGB(C.ink, C.flama, lit));
	const c3 = rgba(mixRGB(C.ink, C.terracota, lit));
	return (
		<g transform={`translate(${x} ${y}) scale(${s})`} filter={filter}>
			{leaves ? (
				<>
					<path d="M -40 70 C -120 90 -170 60 -190 10 C -130 0 -80 20 -40 70 Z" fill={rgba(mixRGB(C.ink, C.verde, lit))} />
					<path d="M 50 75 C 120 110 170 90 200 50 C 140 30 90 40 50 75 Z" fill={rgba(mixRGB(C.ink, C.verde, lit * 0.9))} />
				</>
			) : null}
			{petalRing(0, 0, 70, 18, 34, 17, c3, 10)}
			{petalRing(0, 0, 58, 16, 30, 16, c1)}
			{petalRing(0, 0, 40, 13, 24, 13, c2, 12)}
			{petalRing(0, 0, 22, 10, 16, 10, c1, 5)}
			<circle r={14} fill={c3} />
			{Array.from({length: 7}).map((_, i) => (
				<circle key={i} cx={Math.cos(i * 0.9) * 6} cy={Math.sin(i * 0.9) * 6} r={2.4} fill={c2} />
			))}
		</g>
	);
};

export const CutFilter: React.FC = () => (
	<svg width={0} height={0} style={{position: 'absolute'}}>
		<defs>
			<filter id="cut" x="-20%" y="-20%" width="140%" height="140%">
				<feDropShadow dx={3} dy={5} stdDeviation={2} floodColor="#0b0502" floodOpacity={0.55} />
			</filter>
		</defs>
	</svg>
);

export const Calavera: React.FC<{L: number; eye: number; rim: number; t: number}> = ({L, eye, rim, t}) => {
	const lit = Math.min(1, L);
	const ivory = rgba(mixRGB(C.ink, C.marfil, lit));
	const ivoryDark = rgba(mixRGB(C.ink, C.arena, lit * 0.75));
	const verde = rgba(mixRGB(C.ink, C.verde, lit));
	const cempa = rgba(mixRGB(C.ink, C.cempa, lit));
	const flama = rgba(mixRGB(C.ink, C.flama, lit));
	const terra = rgba(mixRGB(C.ink, C.terracota, lit));
	const breathe = 0.85 + 0.15 * Math.sin(t * 2.1);
	return (
		<svg viewBox="0 0 1000 1000" width="100%" height="100%" style={{overflow: 'visible'}}>
			<defs>
				<clipPath id="skc">
					<path d={SKULL} />
				</clipPath>
				<filter id="soft6" x="-50%" y="-50%" width="200%" height="200%">
					<feGaussianBlur stdDeviation={6} />
				</filter>
				<filter id="soft18" x="-80%" y="-80%" width="260%" height="260%">
					<feGaussianBlur stdDeviation={18} />
				</filter>
				<linearGradient id="skShade" x1="0.1" y1="0.95" x2="0.85" y2="0.1">
					<stop offset="0%" stopColor="#000" stopOpacity={0} />
					<stop offset="45%" stopColor="#000" stopOpacity={0.38} />
					<stop offset="100%" stopColor="#000" stopOpacity={0.88} />
				</linearGradient>
				<mask id="rimMask" maskUnits="userSpaceOnUse" x={0} y={0} width={1000} height={1000}>
					<path d={SKULL} fill="#fff" />
					<path d={SKULL} fill="#000" transform="translate(22 -16)" filter="url(#soft6)" />
				</mask>
				<radialGradient id="eyeGlow" cx="50%" cy="55%" r="50%">
					<stop offset="0%" stopColor="#FFF4D0" />
					<stop offset="25%" stopColor={C.flama} />
					<stop offset="65%" stopColor={C.cempa} stopOpacity={0.7} />
					<stop offset="100%" stopColor={C.terracota} stopOpacity={0} />
				</radialGradient>
			</defs>
			{/* sombra de recorte (papel sobre papel) */}
			<path d={SKULL} fill="#000" opacity={0.5} transform="translate(10 14)" filter="url(#soft6)" />
			<path d={SKULL} fill={ivory} />
			<g clipPath="url(#skc)">
				<path d="M 300 380 C 420 300 640 300 880 380 L 900 420 C 640 350 420 360 290 440 Z" fill={ivoryDark} opacity={0.5} />
				{/* mandíbula y pómulo */}
				<path d="M 560 792 C 620 770 680 740 735 712" stroke={ivoryDark} strokeWidth={10} fill="none" strokeLinecap="round" />
				<path d="M 405 565 C 470 590 560 600 650 585" stroke={ivoryDark} strokeWidth={9} fill="none" strokeLinecap="round" />
				{/* dientes */}
				<g filter="url(#cut)">
					{Array.from({length: 7}).map((_, i) => (
						<rect key={i} x={338 + i * 30} y={742} width={25} height={46} rx={10} fill={ivory} stroke={ivoryDark} strokeWidth={4} />
					))}
					{Array.from({length: 6}).map((_, i) => (
						<rect key={'b' + i} x={352 + i * 30} y={796} width={25} height={40} rx={10} fill={ivory} stroke={ivoryDark} strokeWidth={4} />
					))}
				</g>
				<path d="M 330 792 L 570 792" stroke={terra} strokeWidth={6} strokeDasharray="10 8" />
				{/* adornos del cráneo */}
				<path d="M 330 360 C 430 230 640 200 820 300" stroke={verde} strokeWidth={14} fill="none" strokeLinecap="round" filter="url(#cut)" />
				{Array.from({length: 16}).map((_, i) => {
					const u = i / 15;
					const x = (1 - u) ** 2 * 330 + 2 * (1 - u) * u * 560 + u * u * 820;
					const y = (1 - u) ** 2 * 330 + 2 * (1 - u) * u * 180 + u * u * 270;
					return <circle key={i} cx={x} cy={y - 34} r={9} fill={i % 2 ? cempa : flama} filter="url(#cut)" />;
				})}
				{/* volutas verdes en la nuca */}
				{[
					[790, 470, 1],
					[760, 590, -1],
				].map(([x, y, d], i) => (
					<path
						key={i}
						d={`M ${x} ${y} c ${-40 * d} -10 ${-50 * d} 40 ${-15 * d} 50 c ${30 * d} 8 ${50 * d} -30 ${30 * d} -60 c ${-25 * d} -40 ${-90 * d} -30 ${-100 * d} 20 c -10 60 40 100 ${90 * d} 90`}
						stroke={verde}
						strokeWidth={13}
						fill="none"
						strokeLinecap="round"
						filter="url(#cut)"
					/>
				))}
				{Array.from({length: 7}).map((_, i) => (
					<circle key={'v' + i} cx={870 - i * 8} cy={380 + i * 45} r={7} fill={terra} filter="url(#cut)" />
				))}
				{/* mejilla: gota con puntos */}
				<path d="M 520 615 C 560 650 565 700 520 715 C 475 700 480 650 520 615 Z" fill={terra} filter="url(#cut)" />
				<circle cx={520} cy={680} r={13} fill={flama} />
				{Array.from({length: 8}).map((_, i) => (
					<circle key={'m' + i} cx={520 + Math.cos(i * 0.785) * 75} cy={672 + Math.sin(i * 0.785) * 60} r={7} fill={i % 2 ? verde : cempa} filter="url(#cut)" />
				))}
				{/* nariz: corazón invertido */}
				<path d="M 300 640 C 262 610 262 568 288 562 C 300 560 306 570 306 580 C 312 566 330 566 334 582 C 340 604 318 628 300 640 Z" fill={terra} filter="url(#cut)" />
				{/* festón de la mandíbula */}
				{Array.from({length: 9}).map((_, i) => (
					<circle key={'j' + i} cx={400 + i * 30} cy={905} r={10} fill={verde} filter="url(#cut)" />
				))}
				{/* órbita: festón de pétalos + perlas */}
				<g filter="url(#cut)">{petalRing(380, 475, 98, 16, 22, 13, cempa)}</g>
				{Array.from({length: 20}).map((_, i) => (
					<circle key={'o' + i} cx={380 + Math.cos((i / 20) * 6.283) * 82} cy={475 + Math.sin((i / 20) * 6.283) * 84} r={6} fill={flama} />
				))}
				<ellipse cx={380} cy={478} rx={70} ry={74} fill="#120803" />
				<ellipse cx={392} cy={492} rx={52} ry={55} fill="#050201" />
				{/* sombreado + oscuridad global */}
				<rect width={1000} height={1000} fill="url(#skShade)" />
				<rect width={1000} height={1000} fill="#050201" opacity={Math.max(0, 1 - L) * 0.85} />
			</g>
			{/* flor de cempasúchil sobre la sien */}
			<Marigold x={640} y={265} s={1.35} lit={lit * 0.95} />
			{/* luz de borde desde la llama */}
			<g mask="url(#rimMask)" style={{mixBlendMode: 'screen'}}>
				<rect width={1000} height={1000} fill={C.flama} opacity={0.9 * rim} />
			</g>
			<path d={SKULL} fill="none" stroke={C.flama} strokeWidth={10} opacity={0.35 * rim} filter="url(#soft18)" mask="url(#rimMask)" />
			{/* brillo de ojos: cálido, no amenazante */}
			{eye > 0.001 ? (
				<g style={{mixBlendMode: 'screen'}}>
					<ellipse cx={392} cy={492} rx={150} ry={150} fill="url(#eyeGlow)" opacity={0.45 * eye * breathe} filter="url(#soft18)" />
					<ellipse cx={392} cy={492} rx={46} ry={48} fill="url(#eyeGlow)" opacity={eye} />
					<circle cx={378} cy={480} r={6} fill="#FFFBEA" opacity={eye} />
				</g>
			) : null}
		</svg>
	);
};
