import React from 'react';
import {AbsoluteFill, Sequence, useCurrentFrame} from 'remotion';
import {C, E, FPS, H, W, flicker, hash, ramp, rgba} from '../lib/util';
import {Flame, Light, PaperTexture, useCanvasDraw} from '../components/core';
import {Sahumerio} from '../components/Objetos';
import {Bokeh, Embers, Smoke, drawPetal} from '../components/Particles';
import {PapelDefs, PapelSheen, PapelString, StringCfg} from '../components/PapelPicado';
import {SceneA} from '../scenes/SceneA';
import {SceneB} from '../scenes/SceneB';
import {SceneC} from '../scenes/SceneC';
import {ShotCruz, ShotMarco, ShotPan, ShotVaso} from '../scenes/SceneD';
import {SceneE} from '../scenes/SceneE';

export type Cam = {s?: [number, number]; x?: [number, number]; y?: [number, number]; r?: [number, number]; flip?: boolean};
export type Shot = {tipo: string; dur: number; off?: number; cam?: Cam};

// Encuadre/ángulo de cámara por toma: el mismo mundo, visto de otra forma cada día.
const View: React.FC<{cam?: Cam; dur: number; children: React.ReactNode}> = ({cam = {}, dur, children}) => {
	const f = useCurrentFrame();
	const k = (v: [number, number] | undefined, d: number) => (v ? ramp(f, [0, dur], v, E.inOut) : d);
	const s = k(cam.s, 1);
	const r = k(cam.r, 0);
	// sobreescala mínima para que la rotación nunca descubra bordes
	const over = 1 + Math.abs(r) * 0.012;
	return (
		<AbsoluteFill
			style={{
				transformOrigin: `${W / 2}px ${H / 2}px`,
				transform: `translate(${k(cam.x, 0)}px, ${k(cam.y, 0)}px) rotate(${r}deg) scale(${s * over}) scaleX(${cam.flip ? -1 : 1})`,
			}}
		>
			{children}
		</AbsoluteFill>
	);
};

// ---------- Tomas nuevas ----------

// Macro de la llama: enfoque que "rackea" de borroso a nítido; brasas y bokeh.
const Llama: React.FC = () => {
	const f = useCurrentFrame();
	const t = f / FPS + 3;
	const fl = flicker(t, 41);
	const focus = ramp(f, [0, 34], [16, 0], E.out);
	return (
		<AbsoluteFill style={{background: '#040201'}}>
			<Light x={540} y={1200} r={1300} color={C.cempa} o={0.5 * fl} />
			<Bokeh t={t} L={fl} n={18} seed={44} area={[0, 100, W, 1400]} blur={4} />
			{/* cera de la vela, muy cerca */}
			<div
				style={{
					position: 'absolute',
					left: 160,
					top: 1640,
					width: 760,
					height: 420,
					borderRadius: '50% 50% 0 0 / 60px 60px 0 0',
					background: `linear-gradient(180deg, ${rgba('#FFE7B0', 0.95)} 0%, ${rgba(C.marfil, 1)} 12%, ${rgba(C.arena, 1)} 45%, #3a2412 100%)`,
					filter: `blur(${focus * 0.4}px)`,
				}}
			/>
			<div style={{position: 'absolute', left: 300, top: 1628, width: 480, height: 60, borderRadius: '50%', background: rgba('#FFF2C8', 0.85), filter: 'blur(6px)'}} />
			<AbsoluteFill style={{filter: `blur(${focus}px)`}}>
				<Flame x={540} y={1660} size={1050} t={t} seed={41} fl={fl} />
			</AbsoluteFill>
			<Light x={540} y={1250} r={520} color={C.flama} o={0.35 * fl} />
			<Embers t={t} L={0.8} n={30} seed={45} src={[200, 900, 680, 700]} />
			<PaperTexture o={0.15} />
		</AbsoluteFill>
	);
};

// Sahumerio con copal: el humo sube y la cámara lo sigue hacia arriba.
const Copal: React.FC = () => {
	const f = useCurrentFrame();
	const t = f / FPS + 6;
	const fl = flicker(t, 47);
	const tilt = ramp(f, [0, 110], [0, 380], E.inOut);
	const ref = useCanvasDraw(
		(ctx) => {
			for (let i = 0; i < 60; i++) {
				const r = (q: number) => hash(i * 7 + q, 808);
				const x = 80 + r(1) * 920;
				const y = 1740 + r(2) * 120;
				drawPetal(ctx, x, y, 24 + 10 * r(3), r(4) * 6.28, 1, 0.5, 0.55 + 0.4 * r(5), r(6));
			}
		},
		[],
	);
	return (
		<AbsoluteFill style={{background: '#040201'}}>
			<AbsoluteFill style={{transform: `translateY(${tilt}px)`}}>
				<Light x={-60} y={1100} r={1200} color={C.cempa} o={0.42 * fl} />
				<Light x={540} y={1640} r={520} color={C.terracota} o={0.5 * fl} />
				<div style={{position: 'absolute', left: 0, top: 1730, width: W, height: 500, background: 'linear-gradient(180deg,#1f0f06,#060201)'}} />
				<canvas ref={ref} width={W} height={H} style={{position: 'absolute', inset: 0}} />
				<svg width={W} height={H} style={{position: 'absolute', inset: 0, overflow: 'visible'}}>
					<g transform="translate(540 1800) scale(3.1)">
						<Sahumerio lit={0.85 * fl} ember={0.75 + 0.25 * fl} />
					</g>
				</svg>
				<Light x={540} y={1600} r={260} color={C.flama} o={0.55 * fl} />
			</AbsoluteFill>
			<Smoke t={t} x={520} y={1560 + tilt} L={1.25} n={170} rate={26} rise={175} wind={18} seed={48} lightX={0} lightY={1000} tint={C.marfil} />
			<Smoke t={t + 1.7} x={575} y={1570 + tilt} L={0.9} n={120} rate={20} rise={150} wind={-14} seed={49} lightX={0} lightY={1000} tint={C.arena} />
			<PaperTexture o={0.15} />
		</AbsoluteFill>
	);
};

// Papel picado visto desde abajo: tres guirnaldas a distintas profundidades.
const STRINGS: (StringCfg & {blur: number})[] = [
	{y: 180, sag: 90, count: 6, spacing: 220, x0: -10, scale: 0.75, seed: 31, types: [3, 1, 2, 0], colorOffset: 1, blur: 3},
	{y: 640, sag: 160, count: 5, spacing: 280, x0: -20, scale: 1.25, seed: 32, types: [2, 0, 1, 3], colorOffset: 4, blur: 0},
	{y: 1300, sag: 200, count: 4, spacing: 380, x0: -60, scale: 1.9, seed: 33, types: [1, 2, 0, 3], colorOffset: 2, blur: 7},
];
const Contrapicado: React.FC = () => {
	const f = useCurrentFrame();
	const t = f / FPS + 2;
	const fl = flicker(t, 51);
	return (
		<AbsoluteFill style={{background: '#050201', overflow: 'hidden'}}>
			<PapelDefs />
			<PapelSheen />
			<Light x={540} y={2050} r={1500} color={C.cempa} o={0.55 * fl} />
			<Light x={540} y={1900} r={700} color={C.flama} o={0.3 * fl} />
			<Bokeh t={t} L={0.7 * fl} n={12} seed={52} area={[0, 0, W, 900]} blur={5} />
			<AbsoluteFill style={{transformOrigin: '540px 960px', transform: `rotate(-11deg) scale(1.18) translateX(${ramp(f, [0, 100], [50, -50], E.inOut)}px)`}}>
				{STRINGS.map((c, i) => (
					<AbsoluteFill key={i} style={{filter: c.blur ? `blur(${c.blur}px)` : undefined}}>
						<PapelString cfg={c} frame={200 + f} t={t + i} light={0.5 + 0.25 * i} lightPos={[540, 2100]} gust={1.3} />
					</AbsoluteFill>
				))}
			</AbsoluteFill>
			<PaperTexture o={0.15} />
		</AbsoluteFill>
	);
};

// Toma suelta del montaje (sin sacudida): pan, vaso, marco, cruz.
const Montaje: React.FC<{tipo: string}> = ({tipo}) => {
	const f = useCurrentFrame();
	const t = f / FPS + 12.5;
	const fl = flicker(t, 3 + tipo.length);
	return (
		<AbsoluteFill style={{background: '#050201'}}>
			{tipo === 'pan' ? <ShotPan t={t} fl={fl} /> : tipo === 'vaso' ? <ShotVaso t={t} fl={fl} /> : tipo === 'marco' ? <ShotMarco t={t} fl={fl} /> : <ShotCruz fl={fl} />}
			<PaperTexture o={0.28} />
		</AbsoluteFill>
	);
};

const ShotBody: React.FC<{shot: Shot}> = ({shot}) => {
	const off = shot.off ?? 0;
	const len = off + shot.dur;
	const wrap = (node: React.ReactNode) => (
		<Sequence from={-off} durationInFrames={len}>
			{node}
		</Sequence>
	);
	switch (shot.tipo) {
		case 'ignicion':
			return wrap(<SceneA />);
		case 'petalos':
			return (
				<Sequence from={-(shot.off ?? 60)} durationInFrames={(shot.off ?? 60) + shot.dur}>
					<SceneA />
				</Sequence>
			);
		case 'papel':
			return (
				<Sequence from={-(shot.off ?? 150)} durationInFrames={(shot.off ?? 150) + shot.dur}>
					<SceneA />
				</Sequence>
			);
		case 'calavera':
			return wrap(<SceneB />);
		case 'camino':
			return wrap(<SceneC />);
		case 'altar':
			return wrap(<SceneE dias={0} fecha="" mostrarFecha={false} />);
		case 'llama':
			return wrap(<Llama />);
		case 'copal':
			return wrap(<Copal />);
		case 'contrapicado':
			return wrap(<Contrapicado />);
		default:
			return wrap(<Montaje tipo={shot.tipo} />);
	}
};

export const ShotView: React.FC<{shot: Shot}> = ({shot}) => (
	<AbsoluteFill style={{background: '#000', overflow: 'hidden'}}>
		<View cam={shot.cam} dur={shot.dur}>
			<ShotBody shot={shot} />
		</View>
	</AbsoluteFill>
);
