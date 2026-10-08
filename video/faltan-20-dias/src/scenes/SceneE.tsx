import React from 'react';
import {AbsoluteFill, spring, useCurrentFrame} from 'remotion';
import {CameraMotionBlur} from '@remotion/motion-blur';
import {C, E, FPS, H, W, clamp, flicker, hash, lerp, mixRGB, ramp, rgba} from '../lib/util';
import {Flame, Light, PaperTexture, useCanvasDraw} from '../components/core';
import {Calavera, CutFilter} from '../components/Calavera';
import {Cirio, MarcoFoto, MiniVeladora, PanDeMuerto, Pompon, Ramo, Sahumerio, VasoAgua} from '../components/Objetos';
import {Embers, Smoke, drawPetal} from '../components/Particles';
import {PapelDefs, PapelSheen, PapelString, StringCfg} from '../components/PapelPicado';

// 15–20 s: pull-back que revela el altar de tres niveles; velas en cascada de abajo hacia arriba;
// respiro; "FALTAN 20 DÍAS".
export const TITLE_IN = 75; // frame local (17.5 s)

// Niveles (coordenadas finales de pantalla)
const T3 = {top: 1262, bot: 1382, x0: 280, x1: 800};
const T2 = {top: 1382, bot: 1512, x0: 175, x1: 905};
const T1 = {top: 1512, bot: 1645, x0: 75, x1: 1005};
const CROSS = {x: 540, y: 1790};

type Vela = {x: number; y: number; kind: 'v' | 'c'; h: number; glass?: string};
// orden de encendido: de abajo hacia arriba
export const VELAS: Vela[] = [
	{x: 540, y: 1722, kind: 'v', h: 70},
	{x: 150, y: T1.top, kind: 'v', h: 80, glass: C.terracota},
	{x: 930, y: T1.top, kind: 'v', h: 80, glass: C.terracota},
	{x: 300, y: T1.top, kind: 'v', h: 80},
	{x: 780, y: T1.top, kind: 'v', h: 80},
	{x: 440, y: T1.top, kind: 'v', h: 70, glass: C.verde},
	{x: 640, y: T1.top, kind: 'v', h: 70, glass: C.verde},
	{x: 215, y: T2.top, kind: 'v', h: 74},
	{x: 865, y: T2.top, kind: 'v', h: 74},
	{x: 545, y: T2.top, kind: 'v', h: 60, glass: C.terracota},
	{x: 345, y: T3.top, kind: 'c', h: 150},
	{x: 735, y: T3.top, kind: 'c', h: 150},
];
export const IGN0 = 4; // la primera vela ya viene encendida del plano de la cruz
export const IGN_STEP = 5; // frames entre velas (= notas de marimba)
const ignAt = (i: number) => (i === 0 ? -100 : IGN0 + i * IGN_STEP);
const flameTop = (v: Vela) => (v.kind === 'c' ? v.y - v.h - 4 : v.y - v.h + 10);

const ARCH = {cx: 540, cy: 1150, rx: 468, ry: 895};

const FloorPetals: React.FC<{lit: number}> = ({lit}) => {
	const ref = useCanvasDraw(
		(ctx) => {
			// cruz de pétalos en perspectiva + camino que llega a ella
			for (let i = 0; i < 380; i++) {
				const r = (q: number) => hash(i * 7 + q, 909);
				let x: number;
				let y: number;
				if (r(1) < 0.45) {
					x = CROSS.x - 45 + r(2) * 90;
					y = CROSS.y - 95 + r(3) * 230;
				} else if (r(1) < 0.75) {
					x = CROSS.x - 200 + r(2) * 400;
					y = CROSS.y - 40 + r(3) * 44;
				} else {
					const u = r(2);
					x = CROSS.x + Math.sin(u * 3) * 50 + (r(3) - 0.5) * 140 * (1 + u);
					y = CROSS.y + 140 + u * 200;
				}
				const d = Math.hypot(x - 540, (y - 1700) * 1.6);
				drawPetal(ctx, x, y, 17 + 8 * r(4), r(5) * 6.28, 1, 0.55, lit * (0.45 + 0.75 * Math.exp(-(d * d) / (2 * 300 * 300))), r(6));
			}
		},
		[lit],
	);
	return <canvas ref={ref} width={W} height={H} style={{position: 'absolute', inset: 0}} />;
};

// Faldón de papel picado miniatura en el borde de cada nivel
const Faldon: React.FC<{x0: number; x1: number; y: number; lit: number; t: number; seed: number}> = ({x0, x1, y, lit, t, seed}) => {
	const n = Math.round((x1 - x0) / 62);
	const w = (x1 - x0) / n;
	const cols = [C.cempa, C.verde, C.flama, C.terracota];
	return (
		<g>
			{Array.from({length: n}).map((_, i) => {
				const sw = 2.2 * Math.sin(t * 1.3 + i * 0.7 + seed);
				return (
					<g key={i} transform={`translate(${x0 + i * w} ${y}) skewX(${sw})`}>
						<path
							d={`M 2 0 H ${w - 2} V 52 L ${w - 2 - (w - 4) / 6} 62 L ${w - 2 - (2 * (w - 4)) / 6} 52 L ${w / 2} 62 L ${2 + (2 * (w - 4)) / 6} 52 L ${2 + (w - 4) / 6} 62 L 2 52 Z`}
							fill={rgba(mixRGB(C.ink, cols[(i + seed) % 4], lit))}
						/>
						<circle cx={w / 2} cy={24} r={8} fill="#000" opacity={0.75} />
						<circle cx={w / 2 - 16} cy={12} r={3} fill="#000" opacity={0.75} />
						<circle cx={w / 2 + 16} cy={12} r={3} fill="#000" opacity={0.75} />
						<path d={`M ${w / 2 - 14} 40 L ${w / 2} 33 L ${w / 2 + 14} 40 L ${w / 2} 47 Z`} fill="#000" opacity={0.75} />
					</g>
				);
			})}
		</g>
	);
};

const Tier: React.FC<{tier: typeof T1; cloth: string; lit: number; t: number; seed: number}> = ({tier, cloth, lit, t, seed}) => (
	<g>
		<rect x={tier.x0} y={tier.top} width={tier.x1 - tier.x0} height={tier.bot - tier.top} fill={rgba(mixRGB(C.ink, cloth, lit * 0.85))} />
		<rect x={tier.x0} y={tier.top} width={tier.x1 - tier.x0} height={10} fill={rgba(mixRGB(C.ink, C.marfil, lit * 0.8))} />
		<rect x={tier.x0} y={tier.top + 10} width={tier.x1 - tier.x0} height={tier.bot - tier.top - 10} fill="url(#tierShade)" />
		<Faldon x0={tier.x0} x1={tier.x1} y={tier.top + 6} lit={lit} t={t} seed={seed} />
	</g>
);

const BACK: StringCfg = {y: -30, sag: 50, count: 6, spacing: 205, x0: 28, scale: 0.62, seed: 12, types: [2, 0, 3, 1], colorOffset: 3};
const FRONT: StringCfg = {y: 6, sag: 64, count: 5, spacing: 252, x0: 36, scale: 0.74, seed: 7, types: [0, 1, 2, 3, 1]};

const Altar: React.FC<{f: number; t: number; lit: number; ign: number[]; fl: number}> = ({f, t, lit, ign, fl}) => {
	// "los elementos se ordenan": cada grupo llega a su sitio con spring críticamente amortiguado
	const settle = (k: number, dx: number, dy: number, rot: number) => {
		const p = spring({frame: f - k, fps: FPS, config: {stiffness: 60, damping: 16, mass: 1}});
		return `translate(${dx * (1 - p)} ${dy * (1 - p)}) rotate(${rot * (1 - p)})`;
	};
	const g = (i: number) => ign[i] ?? 0;
	return (
		<svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{position: 'absolute', inset: 0, overflow: 'visible'}}>
			<defs>
				<linearGradient id="tierShade" x1="0" y1="0" x2="0" y2="1">
					<stop offset="0%" stopColor="#000" stopOpacity={0.05} />
					<stop offset="100%" stopColor="#000" stopOpacity={0.55} />
				</linearGradient>
			</defs>
			{/* arco de cempasúchil */}
			<g transform={settle(6, 0, -60, 0)}>
				{Array.from({length: 70}).map((_, i) => {
					const u = i / 69;
					// parte vertical izquierda → arco → vertical derecha
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
					const r = 30 + 8 * hash(i, 61);
					return <Pompon key={i} x={x + (hash(i, 62) - 0.5) * 14} y={y} r={r} lit={lit * (0.7 + 0.35 * hash(i, 63))} seed={i} />;
				})}
			</g>
			{/* nivel 3 (arriba) */}
			<Tier tier={T3} cloth={C.verde} lit={lit} t={t} seed={1} />
			<g transform={settle(14, 0, -40, 0)}>
				<g transform={`translate(540 ${T3.top - 82})`}>
					<MarcoFoto lit={lit * 0.95} w={124} h={150} id="altarMarco" />
				</g>
			</g>
			{/* nivel 2 */}
			<Tier tier={T2} cloth={C.terracota} lit={lit} t={t} seed={2} />
			<g transform={settle(10, -50, -30, -4)}>
				<g transform={`translate(330 ${T2.top}) scale(0.34)`}>
					<PanDeMuerto lit={lit} rim={g(7)} id="altarPan" />
				</g>
			</g>
			<g transform={settle(12, 30, -30, 3)}>
				<g transform={`translate(${430} ${T2.top - 120}) scale(0.12)`}>
					<Calavera L={lit} eye={0} rim={0.4 * lit} t={t} />
				</g>
			</g>
			<g transform={settle(12, -30, -30, -3)}>
				<g transform={`translate(${660} ${T2.top - 120}) scale(-0.12 0.12)`}>
					<Calavera L={lit} eye={0} rim={0.4 * lit} t={t} />
				</g>
			</g>
			<g transform={settle(11, 40, -20, 2)}>
				<g transform={`translate(760 ${T2.top}) scale(0.3)`}>
					<VasoAgua lit={lit} id="altarVaso" flameX={-40} />
				</g>
			</g>
			{/* nivel 1 */}
			<Tier tier={T1} cloth={C.cempa} lit={lit * 0.85} t={t} seed={3} />
			{/* ramos a los costados */}
			<g transform={settle(8, -60, 0, -5)}>
				<g transform={`translate(110 ${T1.bot + 10}) scale(0.95)`}>
					<Ramo lit={lit} seed={4} />
				</g>
			</g>
			<g transform={settle(8, 60, 0, 5)}>
				<g transform={`translate(970 ${T1.bot + 10}) scale(0.95)`}>
					<Ramo lit={lit} seed={9} flip />
				</g>
			</g>
			{/* velas (cuerpos) */}
			{VELAS.map((v, i) =>
				v.kind === 'c' ? (
					<g key={i} transform={`translate(${v.x} ${v.y})`}>
						<Cirio lit={Math.max(lit, g(i) * 0.9)} h={v.h} />
					</g>
				) : (
					<g key={i} transform={`translate(${v.x} ${v.y})`}>
						<MiniVeladora lit={lit} glow={Math.min(1, g(i)) * fl} h={v.h} glass={v.glass} />
					</g>
				),
			)}
			{/* sahumerio */}
			<g transform={`translate(215 1752) scale(0.9)`}>
				<Sahumerio lit={lit} ember={0.6 + 0.4 * fl} />
			</g>
		</svg>
	);
};

const Title: React.FC<{lf: number; dias: number; fecha: string; mostrarFecha: boolean; fl: number}> = ({lf, dias, fecha, mostrarFecha, fl}) => {
	// "20": spring suave, apenas sub-amortiguado (ζ≈0.88)
	const p20 = spring({frame: lf, fps: FPS, config: {stiffness: 75, damping: 15.2, mass: 1}});
	const pF = spring({frame: lf - 5, fps: FPS, config: {stiffness: 90, damping: 19, mass: 1}});
	const pD = spring({frame: lf - 9, fps: FPS, config: {stiffness: 90, damping: 19, mass: 1}});
	const pS = spring({frame: lf - 16, fps: FPS, config: {stiffness: 80, damping: 18, mass: 1}});
	const glow = 0.75 + 0.25 * fl;
	const ember = `linear-gradient(180deg, #FFF0B8 0%, ${C.flama} 30%, ${C.cempa} 66%, ${C.terracota} 100%)`;
	const plural = dias === 1 ? 'DÍA' : 'DÍAS';
	const faltan = dias === 1 ? 'FALTA' : 'FALTAN';
	const center: React.CSSProperties = {position: 'absolute', left: 0, width: W, textAlign: 'center'};
	return (
		<AbsoluteFill>
			{/* velo sutil para legibilidad */}
			<div
				style={{
					position: 'absolute',
					left: 90,
					top: 300,
					width: 900,
					height: 760,
					borderRadius: '50%',
					background: 'radial-gradient(closest-side, rgba(8,3,1,0.62), rgba(8,3,1,0))',
					opacity: clamp(p20 * 1.2),
				}}
			/>
			<div
				style={{
					...center,
					top: 372,
					fontFamily: 'Rye',
					fontSize: 62,
					letterSpacing: `${lerp(0.5, 0.24, pF)}em`,
					paddingLeft: `${lerp(0.5, 0.24, pF)}em`,
					color: C.arena,
					opacity: clamp(pF),
					transform: `translateY(${(1 - pF) * -26}px)`,
					textShadow: `0 0 18px ${rgba(C.cempa, 0.45)}`,
				}}
			>
				{faltan}
			</div>
			{/* "20": capa de resplandor + capa de brasa */}
			<div
				style={{
					...center,
					top: 440,
					fontFamily: 'Rye',
					fontSize: 400,
					lineHeight: 1,
					transform: `translateY(${(1 - p20) * 46}px) scale(${lerp(0.86, 1, p20)})`,
					transformOrigin: '50% 60%',
				}}
			>
				<div style={{position: 'absolute', left: 0, width: W, color: C.cempa, filter: `blur(${26}px)`, opacity: clamp(p20) * 0.85 * glow}}>{dias}</div>
				<div style={{position: 'absolute', left: 0, width: W, color: C.flama, filter: `blur(${7}px)`, opacity: clamp(p20) * 0.5 * glow}}>{dias}</div>
				<div
					style={{
						position: 'relative',
						backgroundImage: ember,
						WebkitBackgroundClip: 'text',
						backgroundClip: 'text',
						color: 'transparent',
						opacity: clamp(p20 * 1.4),
						filter: `blur(${(1 - clamp(p20)) * 14}px) brightness(${0.92 + 0.16 * fl})`,
					}}
				>
					{dias}
				</div>
			</div>
			<div
				style={{
					...center,
					top: 832,
					fontFamily: 'Rye',
					fontSize: 96,
					letterSpacing: '0.12em',
					paddingLeft: '0.12em',
					color: C.marfil,
					opacity: clamp(pD),
					transform: `translateY(${(1 - pD) * 30}px)`,
					textShadow: `0 0 22px ${rgba(C.cempa, 0.5)}, 0 2px 0 rgba(0,0,0,0.6)`,
				}}
			>
				{plural}
			</div>
			{mostrarFecha ? (
				<div style={{...center, top: 960, opacity: clamp(pS) * 0.95, transform: `translateY(${(1 - pS) * 14}px)`}}>
					<div style={{display: 'inline-flex', alignItems: 'center', gap: 22}}>
						<div style={{width: lerp(0, 90, pS), height: 1.5, background: rgba(C.arena, 0.7)}} />
						<div style={{fontFamily: 'Alike', fontSize: 42, letterSpacing: '0.18em', color: C.arena, textShadow: '0 2px 10px rgba(0,0,0,0.8)'}}>{fecha}</div>
						<div style={{width: lerp(0, 90, pS), height: 1.5, background: rgba(C.arena, 0.7)}} />
					</div>
				</div>
			) : null}
		</AbsoluteFill>
	);
};

export const SceneE: React.FC<{dias: number; fecha: string; mostrarFecha: boolean}> = ({dias, fecha, mostrarFecha}) => {
	const f = useCurrentFrame();
	const t = f / FPS + 15;
	const fl = flicker(t, 7);
	const ign = VELAS.map((_, i) => (f < ignAt(i) ? 0 : spring({frame: f - ignAt(i), fps: FPS, config: {stiffness: 140, damping: 10, mass: 0.8}})));
	const litCount = ign.reduce((a, b) => a + Math.min(1, b), 0);
	// la luz frontal crece con cada vela; arranca como silueta a contraluz
	const lit = clamp(0.1 + (0.82 * litCount) / VELAS.length) * (0.94 + 0.06 * fl);
	const back = ramp(f, [0, 30], [0.65, 1], E.out);
	// pull-back
	const pb = ramp(f, [0, 68], [0, 1], E.soft);
	const s = lerp(2.55, 1, pb) * ramp(f, [68, 150], [1, 1.03], E.inOut);
	const ty = lerp(-690, 0, pb);
	const fade = ramp(f, [144, 150], [0, 1], E.inOut);
	const lf = f - TITLE_IN;
	const cam = (k: number): React.CSSProperties => ({
		transformOrigin: `540px ${CROSS.y}px`,
		transform: `translateY(${ty * k}px) scale(${1 + (s - 1) * k})`,
	});
	return (
		<AbsoluteFill style={{background: '#040201', overflow: 'hidden'}}>
			<CutFilter />
			<PapelDefs />
			<PapelSheen />
			{/* fondo: contraluz cálida detrás del altar (parallax lento) */}
			<AbsoluteFill style={cam(0.82)}>
				<AbsoluteFill style={{background: 'linear-gradient(180deg,#070302,#110703 60%,#070301)'}} />
				<Light x={540} y={1240} r={860} color={C.cempa} o={0.55 * back * (0.9 + 0.1 * fl)} />
				<Light x={540} y={1300} r={430} color={C.flama} o={0.36 * back} />
				<AbsoluteFill style={{filter: 'blur(3px)'}}>
					<PapelString cfg={BACK} frame={200} t={t} light={0.5 * lit + 0.15} lightPos={[540, 1300]} gust={0.6} />
				</AbsoluteFill>
			</AbsoluteFill>
			<AbsoluteFill style={cam(1)}>
				<div style={{position: 'absolute', left: 0, top: 1636, width: W, height: 400, background: 'linear-gradient(180deg,#1c0e06,#080301)'}} />
				<FloorPetals lit={lit} />
				<Altar f={f} t={t} lit={lit} ign={ign} fl={fl} />
				<PaperTexture o={0.26} />
				{/* llamas + luz de cada vela */}
				{VELAS.map((v, i) =>
					ign[i] > 0.001 ? (
						<React.Fragment key={i}>
							<Light x={v.x} y={flameTop(v) - 20} r={260} color={C.cempa} o={0.42 * Math.min(1, ign[i]) * fl} />
							<Flame x={v.x} y={flameTop(v)} size={v.kind === 'c' ? 46 : 38} t={t + i * 1.7} seed={20 + i} grow={ign[i]} fl={fl} />
							<Light x={v.x} y={flameTop(v) - 18} r={60} color={C.flama} o={0.7 * Math.min(1, ign[i])} />
						</React.Fragment>
					) : null,
				)}
				<Smoke t={t + 2.5} x={215} y={1690} L={0.35 + 0.45 * lit} n={90} rate={18} wind={20} rise={110} seed={13} lightX={540} lightY={1300} />
				<PapelString cfg={FRONT} frame={200} t={t} light={0.55 * lit + 0.2} lightPos={[540, 1300]} gust={0.7} />
			</AbsoluteFill>
			{/* brasas en primer plano (parallax rápido) */}
			<AbsoluteFill style={cam(1.25)}>
				<Embers t={t} L={0.4 + 0.6 * lit} n={34} src={[120, 1150, 840, 650]} />
			</AbsoluteFill>
			{lf > -1 ? (
				<CameraMotionBlur samples={6} shutterAngle={180}>
					<TitleWrap lf={lf} dias={dias} fecha={fecha} mostrarFecha={mostrarFecha} fl={fl} />
				</CameraMotionBlur>
			) : null}
			<AbsoluteFill style={{background: '#000', opacity: fade}} />
		</AbsoluteFill>
	);
};

const TitleWrap: React.FC<{lf: number; dias: number; fecha: string; mostrarFecha: boolean; fl: number}> = (p) => {
	// Dentro de CameraMotionBlur el frame congelado llega por useCurrentFrame
	const f = useCurrentFrame();
	return <Title {...p} lf={f - TITLE_IN} />;
};
