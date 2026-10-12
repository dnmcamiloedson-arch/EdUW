import React from 'react';
import {AbsoluteFill, spring, useCurrentFrame} from 'remotion';
import {C, E, FPS, H, W, clamp, flicker, hash, lerp, mixRGB, ramp, rgba} from '../lib/util';
import {Flame, Light, PaperTexture, useCanvasDraw} from '../components/core';
import {Calavera} from '../components/Calavera';
import {Cirio, MarcoFoto, MiniVeladora, PanDeMuerto, Pompon, Ramo, Sahumerio, VasoAgua} from '../components/Objetos';
import {Bokeh, Smoke} from '../components/Particles';
import {Kinetic, Lockup, NumberRise} from './kit/type';

// Capítulo 3 (REEL) · "Poner la mesa" — el altar se arma pieza por pieza y cada una dice su porqué.
// Al final, la cámara entra en el retrato: ahí está el número.
export const SEG = 42;
export const ELEMS = [
	{name: 'PAPEL PICADO', txt: 'El aire, y lo frágil de la vida.', x: 540, y: 660, z: 1.45},
	{name: 'AGUA', txt: 'Calma la sed del largo viaje.', x: 800, y: 950, z: 2.1},
	{name: 'SAL', txt: 'Para que el alma llegue limpia.', x: 470, y: 1000, z: 2.5},
	{name: 'VELAS', txt: 'Su luz guía el camino de regreso.', x: 540, y: 860, z: 1.55},
	{name: 'COPAL', txt: 'Su aroma limpia y llama.', x: 230, y: 1400, z: 1.9},
	{name: 'CEMPASÚCHIL', txt: 'Su color marca el sendero.', x: 540, y: 980, z: 1.04},
	{name: 'PAN DE MUERTO', txt: 'El ciclo de la vida, compartido.', x: 300, y: 990, z: 2.2},
	{name: 'CALAVERITAS', txt: 'La muerte también es dulce.', x: 640, y: 990, z: 2.3},
];
export const C03 = {INTRO: 72, N: ELEMS.length, PULL: 66, REV: 150, HIT: 66};
export const ELEM0 = C03.INTRO;
export const PULL0 = ELEM0 + SEG * C03.N;
export const REV0 = PULL0 + C03.PULL;
export const C03_LEN = REV0 + C03.REV;

const T3 = {top: 900, bot: 1040, x0: 300, x1: 780};
const T2 = {top: 1040, bot: 1200, x0: 190, x1: 890};
const T1 = {top: 1200, bot: 1370, x0: 80, x1: 1000};
const ARCH = {cx: 540, cy: 860, rx: 470, ry: 600};
const FOCUS = {x: 540, y: 1100}; // a dónde lleva la cámara el punto de interés
export const MARCO = {x: 540, y: 790, s: 0.62, w: 300, h: 380};

const ink = (c: string, l: number) => rgba(mixRGB(C.ink, c, Math.max(0, Math.min(1, l))));

// llegada de cada elemento: cae desde arriba con resorte
const useArrive = (f: number) => (i: number, delay = 8) => {
	const at = ELEM0 + i * SEG + delay;
	return spring({frame: f - at, fps: FPS, config: {stiffness: 110, damping: 13, mass: 0.9}});
};

const Mantel: React.FC<{tier: typeof T1; cloth: string; drop: number; lit: number; seed: number}> = ({tier, cloth, drop, lit, seed}) => {
	const w = tier.x1 - tier.x0;
	const h = (tier.bot - tier.top) * drop;
	const n = Math.round(w / 58);
	const fw = w / n;
	const cols = [C.cempa, C.verde, C.flama, C.terracota, C.marfil];
	return (
		<g>
			<rect x={tier.x0} y={tier.top} width={w} height={h} fill={ink(cloth, lit * 0.85)} />
			<rect x={tier.x0} y={tier.top} width={w} height={10} fill={ink(C.marfil, lit * 0.85)} />
			<rect x={tier.x0} y={tier.top + 10} width={w} height={Math.max(0, h - 10)} fill="url(#c3shade)" />
			{drop > 0.6
				? Array.from({length: n}).map((_, i) => (
						<g key={i} transform={`translate(${tier.x0 + i * fw} ${tier.top + 8})`} opacity={clamp((drop - 0.6) / 0.4)}>
							<path d={`M 2 0 H ${fw - 2} V 46 L ${fw * 0.75} 56 L ${fw / 2} 46 L ${fw * 0.25} 56 L 2 46 Z`} fill={ink(cols[(i + seed) % 5], lit)} />
							<circle cx={fw / 2} cy={22} r={7} fill="#000" opacity={0.7} />
							<path d={`M ${fw / 2 - 12} 38 L ${fw / 2} 32 L ${fw / 2 + 12} 38 L ${fw / 2} 44 Z`} fill="#000" opacity={0.7} />
						</g>
					))
				: null}
		</g>
	);
};

// Cordel de papel picado (elemento 1)
const Cordel: React.FC<{p: number; t: number; lit: number}> = ({p, t, lit}) => {
	const n = 7;
	const cols = [C.cempa, C.verde, C.flama, C.terracota, C.marfil, C.verde, C.cempa];
	const y0 = 560;
	const sag = (u: number) => y0 + Math.sin(Math.PI * u) * 70;
	return (
		<g>
			<path d={`M 40 ${y0} Q 540 ${y0 + 140} 1040 ${y0}`} stroke={ink(C.arena, lit)} strokeWidth={3} fill="none" strokeDasharray="1200" strokeDashoffset={1200 * (1 - clamp(p * 1.6))} />
			{Array.from({length: n}).map((_, i) => {
				const u = (i + 0.5) / n;
				const x = 40 + u * 1000;
				const q = clamp(p * 1.6 - 0.1 - i * 0.07);
				const sw = Math.sin(t * 1.6 + i * 0.9) * 4;
				const fw = 118;
				const fh = 150;
				return (
					<g key={i} transform={`translate(${x} ${sag(u)}) rotate(${sw}) scale(1 ${q})`} opacity={clamp(q * 2)}>
						<path
							fillRule="evenodd"
							d={`M ${-fw / 2} 0 H ${fw / 2} V ${fh - 16} L ${fw / 3} ${fh} L ${fw / 6} ${fh - 16} L 0 ${fh} L ${-fw / 6} ${fh - 16} L ${-fw / 3} ${fh} L ${-fw / 2} ${fh - 16} Z
							M -22 40 a 22 22 0 1 0 44 0 a 22 22 0 1 0 -44 0 Z
							M -40 92 L -20 80 L 0 92 L 20 80 L 40 92 L 20 104 L 0 92 L -20 104 Z
							M -44 18 a 6 6 0 1 0 12 0 a 6 6 0 1 0 -12 0 Z M 32 18 a 6 6 0 1 0 12 0 a 6 6 0 1 0 -12 0 Z
							M -6 116 h 12 v 12 h -12 Z`}
							fill={ink(cols[i], lit)}
						/>
					</g>
				);
			})}
		</g>
	);
};

const Sal: React.FC<{lit: number}> = ({lit}) => (
	<g>
		<ellipse cx={3} cy={3} rx={70} ry={12} fill="#000" opacity={0.5} />
		<path d="M -64 -46 C -60 -6 -30 0 0 0 C 30 0 60 -6 64 -46 Z" fill={ink(C.terracota, lit)} />
		<path d="M -58 -32 L 58 -32" stroke={ink(C.arena, lit * 0.8)} strokeWidth={4} strokeDasharray="5 6" />
		<path d="M -60 -46 C -40 -84 40 -84 60 -46 Z" fill={ink('#F4EEE2', lit)} />
		{Array.from({length: 18}).map((_, i) => (
			<circle key={i} cx={-44 + hash(i, 3) * 88} cy={-50 - hash(i, 4) * 24 * (1 - Math.abs(hash(i, 3) - 0.5) * 1.6)} r={2.4} fill="#fff" opacity={0.6 * lit} />
		))}
	</g>
);

const Arco: React.FC<{p: number; lit: number}> = ({p, lit}) => (
	<g>
		{Array.from({length: 64}).map((_, i) => {
			const u = i / 63;
			const legs = 0.16;
			let x: number;
			let y: number;
			if (u < legs) {
				x = ARCH.cx - ARCH.rx;
				y = T1.top - (u / legs) * (T1.top - ARCH.cy);
			} else if (u > 1 - legs) {
				x = ARCH.cx + ARCH.rx;
				y = ARCH.cy + ((u - (1 - legs)) / legs) * (T1.top - ARCH.cy);
			} else {
				const a = Math.PI + ((u - legs) / (1 - 2 * legs)) * Math.PI;
				x = ARCH.cx + Math.cos(a) * ARCH.rx;
				y = ARCH.cy + Math.sin(a) * ARCH.ry;
			}
			// crece desde ambas patas hacia la clave del arco
			const order = Math.min(i, 63 - i) / 32;
			const q = E.out(clamp((p - order * 0.6) / 0.25));
			if (q <= 0) return null;
			return <Pompon key={i} x={x} y={y} r={(28 + 8 * hash(i, 61)) * q} lit={lit * (0.75 + 0.3 * hash(i, 63))} seed={i} />;
		})}
	</g>
);

type Vela = {x: number; y: number; kind: 'v' | 'c'; h: number; glass?: string};
export const VELAS: Vela[] = [
	{x: 360, y: T3.top, kind: 'c', h: 170},
	{x: 720, y: T3.top, kind: 'c', h: 170},
	{x: 160, y: T1.top, kind: 'v', h: 84, glass: C.terracota},
	{x: 920, y: T1.top, kind: 'v', h: 84, glass: C.terracota},
	{x: 330, y: T1.top, kind: 'v', h: 76},
	{x: 750, y: T1.top, kind: 'v', h: 76},
	{x: 470, y: T1.top, kind: 'v', h: 70, glass: C.verde},
	{x: 610, y: T1.top, kind: 'v', h: 70, glass: C.verde},
];
export const flameTop = (v: Vela) => (v.kind === 'c' ? v.y - v.h - 4 : v.y - v.h + 10);

// El altar completo; cada pieza aparece según `f` (frame global del capítulo)
export const Altar: React.FC<{f: number; t: number; marco?: React.ReactNode}> = ({f, t, marco}) => {
	const arrive = useArrive(f);
	const drop = (i: number) => {
		const p = arrive(i);
		return {p, tr: `translate(0 ${(1 - p) * -160})`, o: clamp(p * 2.5)};
	};
	const mantel = (k: number) => E.out(clamp((f - 14 - k * 9) / 22));
	// la luz sube conforme llegan las velas
	const ignite = (i: number) => clamp((f - (ELEM0 + 3 * SEG + 14 + i * 3)) / 6);
	const allLit = clamp((f - PULL0 - 20) / 30);
	const lit = 0.5 + 0.4 * clamp((f - (ELEM0 + 3 * SEG + 14)) / 30) + 0.1 * allLit;
	const fl = flicker(t, 33);
	const show = (i: number) => f >= ELEM0 + i * SEG + 6;
	return (
		<>
			{/* luz cálida general de las velas */}
			<Light x={540} y={1000} r={900} color={C.flama} o={(0.15 + 0.35 * (lit - 0.5) * 2) * fl} />
			<svg width={W} height={H} style={{position: 'absolute', inset: 0, overflow: 'visible'}}>
				<defs>
					<linearGradient id="c3shade" x1="0" y1="0" x2="0" y2="1">
						<stop offset="0%" stopColor="#000" stopOpacity={0.05} />
						<stop offset="100%" stopColor="#000" stopOpacity={0.55} />
					</linearGradient>
				</defs>
				{show(5) ? <Arco p={clamp((f - (ELEM0 + 5 * SEG + 6)) / 30)} lit={lit} /> : null}
				{show(0) ? <Cordel p={clamp((f - (ELEM0 + 6)) / 30)} t={t} lit={lit} /> : null}
				<Mantel tier={T3} cloth={C.verde} drop={mantel(0)} lit={lit} seed={1} />
				{marco ? (
					<g transform={`translate(${MARCO.x} ${MARCO.y}) scale(${MARCO.s})`}>
						{marco}
					</g>
				) : null}
				<Mantel tier={T2} cloth={C.terracota} drop={mantel(1)} lit={lit} seed={2} />
				{show(6) ? (
					<g transform={drop(6).tr} opacity={drop(6).o}>
						<g transform={`translate(300 ${T2.top}) scale(0.42)`}>
							<PanDeMuerto lit={lit} rim={lit} id="c3pan" />
						</g>
					</g>
				) : null}
				{show(2) ? (
					<g transform={drop(2).tr} opacity={drop(2).o}>
						<g transform={`translate(470 ${T2.top})`}>
							<Sal lit={lit} />
						</g>
					</g>
				) : null}
				{show(7)
					? [0, 1].map((k) => {
							const d = drop(7);
							const q = arrive(7, 8 + k * 5);
							return (
								<g key={k} transform={`translate(0 ${(1 - q) * -160})`} opacity={d.o}>
									<g transform={`translate(${600 + k * 90 - 50} ${T2.top - 98})`}>
										<Calavera L={lit} eye={0} rim={0.4 * lit} t={t} size={100} />
									</g>
								</g>
							);
						})
					: null}
				{show(1) ? (
					<g transform={drop(1).tr} opacity={drop(1).o}>
						<g transform={`translate(800 ${T2.top}) scale(0.36)`}>
							<VasoAgua lit={lit} id="c3vaso" flameX={-40} />
						</g>
					</g>
				) : null}
				<Mantel tier={T1} cloth={C.cempa} drop={mantel(2)} lit={lit * 0.9} seed={3} />
				{show(5)
					? [0, 1].map((k) => {
							const q = arrive(5, 4 + k * 4);
							return (
								<g key={k} transform={`translate(${(1 - q) * (k ? 200 : -200)} 0)`} opacity={clamp(q * 2)}>
									<g transform={`translate(${k ? 985 : 95} ${T1.bot + 10}) scale(0.95)`}>
										<Ramo lit={lit} seed={k ? 9 : 4} flip={k === 1} />
									</g>
								</g>
							);
						})
					: null}
				{show(3)
					? VELAS.map((v, i) => {
							const q = arrive(3, 6 + i * 2);
							return (
								<g key={i} transform={`translate(${v.x} ${v.y + (1 - q) * -140})`} opacity={clamp(q * 2.5)}>
									{v.kind === 'c' ? <Cirio lit={lit} h={v.h} w={52} /> : <MiniVeladora lit={lit} glow={ignite(i) * fl} h={v.h} glass={v.glass} />}
								</g>
							);
						})
					: null}
				{show(4) ? (
					<g transform={drop(4).tr} opacity={drop(4).o}>
						<g transform="translate(230 1500) scale(1.1)">
							<Sahumerio lit={lit} ember={0.6 + 0.4 * fl} />
						</g>
					</g>
				) : null}
			</svg>
			{show(3)
				? VELAS.map((v, i) => {
						const g = ignite(i);
						return g > 0 ? <Flame key={i} x={v.x} y={flameTop(v)} size={v.kind === 'c' ? 60 : 40} t={t + i * 1.7} seed={30 + i} grow={g} fl={fl} /> : null;
					})
				: null}
			{show(4) && f > ELEM0 + 4 * SEG + 16 ? <Smoke t={(f - (ELEM0 + 4 * SEG + 16)) / FPS} x={230} y={1430} L={1} n={110} rate={20} rise={260} wind={20} seed={33} tint={C.marfil} lightX={540} lightY={1000} /> : null}
		</>
	);
};

export const Fondo: React.FC<{lit: number}> = ({lit}) => (
	<>
		<AbsoluteFill style={{background: `linear-gradient(180deg, #0d0705 0%, ${ink('#3a2014', 0.4 + 0.6 * lit)} 55%, #0a0503 72%, #070302 100%)`}} />
		<div style={{position: 'absolute', left: 0, top: 1370, width: W, height: H - 1370, background: 'linear-gradient(180deg, #1c0f08, #070302)'}} />
	</>
);

// Cámara: viaja de un elemento al siguiente
const camAt = (f: number) => {
	const pts = [{x: FOCUS.x, y: FOCUS.y, z: 1}, ...ELEMS.map((e) => ({x: e.x, y: e.y, z: e.z})), {x: FOCUS.x, y: FOCUS.y, z: 1}];
	let i: number;
	let u: number;
	if (f < ELEM0) [i, u] = [0, 0];
	else if (f < PULL0) {
		const k = Math.floor((f - ELEM0) / SEG);
		i = k;
		u = E.inOut(clamp((f - ELEM0 - k * SEG) / 14));
	} else {
		i = ELEMS.length;
		u = E.inOut(clamp((f - PULL0) / 30));
	}
	const a = pts[i];
	const b = pts[i + 1];
	// curva de zoom: se abre a la mitad del viaje para dar sensación de grúa
	const zMid = Math.min(a.z, b.z) * (1 - 0.12 * Math.sin(Math.PI * u));
	const z = lerp(a.z, b.z, u) * (zMid / Math.min(a.z, b.z));
	return {x: lerp(a.x, b.x, u), y: lerp(a.y, b.y, u), z};
};

const World: React.FC<{f: number; t: number; cam: {x: number; y: number; z: number}; marco?: React.ReactNode}> = ({f, t, cam, marco}) => {
	const lit = clamp((f - (ELEM0 + 3 * SEG + 14)) / 30);
	return (
		<AbsoluteFill style={{transformOrigin: '0 0', transform: `translate(${FOCUS.x - cam.x * cam.z}px, ${FOCUS.y - cam.y * cam.z}px) scale(${cam.z})`}}>
			<div style={{position: 'absolute', left: -1200, top: -1200, width: W + 2400, height: H + 2400}}>
				<div style={{position: 'absolute', left: 1200, top: 1200, width: W, height: H}}>
					<Fondo lit={lit} />
					<Altar f={f} t={t} marco={marco} />
				</div>
			</div>
		</AbsoluteFill>
	);
};

// Marcadores de progreso: 8 flores que se van llenando
const Progreso: React.FC<{f: number}> = ({f}) => {
	const o = ramp(f, [ELEM0 - 6, ELEM0 + 6], [0, 1]) * ramp(f, [PULL0 + 10, PULL0 + 24], [1, 0]);
	if (o <= 0) return null;
	return (
		<svg width={W} height={H} style={{position: 'absolute', inset: 0, opacity: o}}>
			{ELEMS.map((_, i) => {
				const p = E.out(clamp((f - ELEM0 - i * SEG - 6) / 10));
				const x = 540 + (i - 3.5) * 46;
				return (
					<g key={i} transform={`translate(${x} 525)`}>
						<circle r={11} fill="none" stroke={rgba(C.arena, 0.6)} strokeWidth={2} />
						<circle r={11 * p} fill={i % 2 ? C.flama : C.cempa} />
					</g>
				);
			})}
		</svg>
	);
};

const Rotulos: React.FC<{f: number}> = ({f}) => {
	const out: React.ReactNode[] = [];
	ELEMS.forEach((e, i) => {
		const at = ELEM0 + i * SEG;
		if (f < at - 4 || f > at + SEG + 4) return;
		out.push(
			<React.Fragment key={i}>
				<Kinetic text={e.name} f={f} at={at + 8} out={at + SEG - 8} y={300} size={e.name.length > 10 ? 78 : 92} font="Rye" color={C.flama} stagger={1.4} spacing="0.06em" scrim={0.65} />
				<Kinetic text={e.txt} f={f} at={at + 14} out={at + SEG - 8} y={420} size={44} />
			</React.Fragment>,
		);
	});
	return <>{out}</>;
};

export const Cap03: React.FC<{dias: number; fecha: string}> = ({dias, fecha}) => {
	const f = useCurrentFrame();
	const t = f / FPS;
	// fase final: entrar al retrato
	const rf = f - REV0;
	const push = E.in(clamp((rf - 6) / 44));
	const base = camAt(Math.min(f, REV0));
	const inner = {x: MARCO.x, y: MARCO.y, z: 11};
	const cam = rf > 0 ? {x: lerp(base.x, inner.x, E.inOut(clamp((rf - 6) / 44))), y: lerp(base.y, inner.y, E.inOut(clamp((rf - 6) / 44))), z: lerp(1, inner.z, push)} : base;
	// el marco aparece al inicio de la grúa final
	const mq = spring({frame: f - PULL0 - 6, fps: FPS, config: {stiffness: 100, damping: 14}});
	const marcoLit = 0.6 + 0.4 * clamp((f - PULL0 - 20) / 30);
	const marco =
		f >= PULL0 ? (
			<g transform={`translate(0 ${(1 - mq) * -200})`} opacity={clamp(mq * 2)}>
				<MarcoFoto lit={marcoLit} w={MARCO.w} h={MARCO.h} id="c3marco">
					<rect x={-MARCO.w / 2 + 64} y={-MARCO.h / 2 + 64} width={MARCO.w - 128} height={MARCO.h - 128} fill="url(#c3in)" />
					<defs>
						<radialGradient id="c3in">
							<stop offset="0%" stopColor="#FFE9B0" stopOpacity={0.15 + 0.85 * push} />
							<stop offset="60%" stopColor={C.cempa} stopOpacity={0.1 + 0.6 * push} />
							<stop offset="100%" stopColor="#2a1206" stopOpacity={0.9} />
						</radialGradient>
					</defs>
				</MarcoFoto>
			</g>
		) : null;
	const insideO = ramp(rf, [40, 52], [0, 1], E.inOut);
	const HIT = C03.HIT;
	// guirnalda de cempasúchil alrededor del número: el número es ahora "el retrato"
	const wreath = Array.from({length: 40}).map((_, i) => {
		const a = (i / 40) * Math.PI * 2 - Math.PI / 2;
		const q = E.out(clamp((rf - HIT + 4 - Math.abs(i - 20) * 0.5) / 12));
		return {x: 540 + Math.cos(a) * 370, y: 860 + Math.sin(a) * 470, q, i};
	});
	return (
		<AbsoluteFill style={{background: '#070302'}}>
			{insideO < 1 ? <World f={Math.min(f, REV0 + 60)} t={t} cam={cam} marco={marco} /> : null}
			{/* banda superior para que los rótulos respiren sobre el papel picado */}
			<AbsoluteFill style={{opacity: ramp(f, [4, 16], [0, 1]) * ramp(rf, [20, 36], [1, 0]), background: 'linear-gradient(180deg, rgba(7,3,2,0.9) 0%, rgba(7,3,2,0.86) 26%, rgba(7,3,2,0) 33%)'}} />
			<Progreso f={f} />
			<Rotulos f={f} />
			{/* intro */}
			<Kinetic text={'Poner la mesa'} f={f} at={10} out={60} y={330} size={96} font="Rye" color={C.flama} stagger={1.6} scrim={0.6} />
			<Kinetic text={'Cada cosa en el altar\ntiene su porqué.'} f={f} at={22} out={60} y={470} size={46} />
			{/* grúa final */}
			<Kinetic text={'Y al centro,\na quien recordamos.'} f={f} at={PULL0 + 14} out={PULL0 + C03.PULL - 4} y={330} size={52} scrim={0.6} />
			{/* dentro del retrato */}
			{rf > 30 ? (
				<AbsoluteFill style={{opacity: insideO, background: `radial-gradient(ellipse at 50% 45%, #4a2410, #160904 60%, #070302)`}}>
					<Bokeh t={t} n={26} L={0.8} seed={31} />
					<Light x={540} y={860} r={760} color={C.flama} o={0.35} />
					<svg width={W} height={H} style={{position: 'absolute', inset: 0, overflow: 'visible'}}>
						{wreath.map((p) => (p.q > 0 ? <Pompon key={p.i} x={p.x} y={p.y} r={30 * p.q + 6 * hash(p.i, 2) * p.q} lit={0.95} seed={p.i} /> : null))}
					</svg>
					<NumberRise f={rf} at={HIT - 8} dias={dias} />
					<Lockup f={rf} at={HIT} dias={dias} fecha={fecha} top={290} bottom={1370} />
				</AbsoluteFill>
			) : null}
			{/* destello al cruzar el cristal */}
			<AbsoluteFill style={{background: '#FFE9B8', opacity: 0.85 * Math.sin(Math.PI * clamp((rf - 38) / 18)), mixBlendMode: 'screen'}} />
			<PaperTexture o={0.12} />
			<AbsoluteFill style={{background: '#000', opacity: ramp(rf, [C03.REV - 8, C03.REV - 1], [0, 1], E.inOut)}} />
			{void H}
		</AbsoluteFill>
	);
};
