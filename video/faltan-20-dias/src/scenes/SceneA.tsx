import React from 'react';
import {AbsoluteFill, spring, useCurrentFrame} from 'remotion';
import {C, E, FPS, H, W, clamp, flicker, mixRGB, ramp, rgba} from '../lib/util';
import {Cam, Flame, Light, PaperTexture} from '../components/core';
import {Veladora} from '../components/Veladora';
import {Bokeh, PETAL_LAYERS, PetalRain, Sparks} from '../components/Particles';
import {PapelDefs, PapelSheen, PapelString, StringCfg} from '../components/PapelPicado';

// 0–7.5 s: ignición → pétalos → papel picado (un solo espacio continuo).
export const IGNITE = 8; // frame de la llama (el cerillo suena en f6)
const CX = W / 2;
const BASE_Y = 1540; // base de la veladora
const VH = 250;
export const FLAME_Y = BASE_Y - VH + 30;

const BACK: StringCfg = {y: 250, sag: 70, count: 6, spacing: 205, x0: 28, scale: 0.72, seed: 2, types: [1, 3, 2, 0], colorOffset: 2};
const FRONT: StringCfg = {y: 430, sag: 120, count: 5, spacing: 252, x0: 36, scale: 1.08, seed: 7, types: [0, 1, 2, 3, 1]};

export const SceneA: React.FC = () => {
	const f = useCurrentFrame();
	const t = f / FPS;

	// --- ignición: la llama "se asusta" (flare) y se asienta ---
	const g = f < IGNITE ? 0 : spring({frame: f - IGNITE, fps: FPS, config: {stiffness: 110, damping: 8.5, mass: 1}});
	const pop = f < IGNITE - 1 ? 0 : Math.exp(-(f - IGNITE + 1) / 3) * 0.9;
	const fl = flicker(t, 1);
	// cierre del bloque: la llama baja y la oscuridad se come el cuadro (corte a la calavera)
	const dip = ramp(f, [204, 224], [1, 0.08], E.in);
	const L = (Math.min(g, 1.15) * fl + pop * 0.35) * dip;

	// --- cámara: dolly-in lento, luego sube para recibir el papel picado ---
	const s = ramp(f, [0, 135], [1.0, 1.1], E.dolly) + ramp(f, [135, 225], [0, 0.02], E.inOut);
	const camY = ramp(f, [118, 200], [0, 300], E.inOut);
	const camX = ramp(f, [55, 150], [0, -26], E.inOut);

	// alcance de la luz: crece cuando la llama se estabiliza
	const sigma = ramp(f, [IGNITE, 110], [150, 760], E.out);
	// los pétalos se revelan poco a poco: la luz los alcanza y su opacidad sube con curva suave
	const petalIn = ramp(f, [34, 100], [0, 1], E.inOut);
	const nearIn = ramp(f, [52, 118], [0, 1], E.inOut);
	const flameScreenY = FLAME_Y; // coordenadas de mundo

	const ppFrame = f - 135;
	const ppLight = clamp(L * 1.05);

	return (
		<AbsoluteFill style={{background: '#050201', overflow: 'hidden'}}>
			<PapelDefs />
			<PapelSheen />
			<Cam s={s} y={camY} x={camX} oy={FLAME_Y}>
				{/* pared trasera iluminada */}
				<AbsoluteFill style={{background: `linear-gradient(180deg, #080402 0%, #120803 60%, #0a0502 100%)`}} />
				<Light x={CX} y={flameScreenY} r={sigma * 2.3} color={C.cempa} o={0.42 * L} />
				<Light x={CX} y={flameScreenY - 40} r={sigma * 1.1} color={C.flama} o={0.28 * L} />
				<Light x={CX} y={flameScreenY - 900} r={1100} color={C.cempa} o={ramp(f, [140, 200], [0, 0.18], E.inOut) * L} />
				{/* sombras proyectadas del papel picado en la pared (los calados dejan pasar la luz) */}
				{ppFrame > 0 ? <Light x={CX} y={FLAME_Y - 1040} r={900} sy={0.7} color={C.cempa} o={ramp(ppFrame, [0, 40], [0, 0.75], E.out) * L} /> : null}
				{ppFrame > 0 ? (
					<AbsoluteFill
						style={{
							transformOrigin: `${CX}px ${FLAME_Y}px`,
							transform: 'scale(1.42)',
							filter: 'blur(9px)',
							mixBlendMode: 'multiply',
							opacity: 0.5 * ppLight,
						}}
					>
						<PapelString cfg={FRONT} frame={ppFrame - 2} t={t - 0.06} light={1} shadow lightPos={[CX, FLAME_Y]} />
					</AbsoluteFill>
				) : null}
				{/* bokeh lejano (profundidad de campo) */}
				{f > 50 ? <Bokeh t={t} L={L * ramp(f, [50, 110], [0, 1], E.inOut)} n={20} camX={camX} camY={-camY} area={[0, 100, W, 1300]} blur={2} /> : null}
				{/* guirnalda trasera (desenfocada) */}
				{ppFrame > -10 ? (
					<AbsoluteFill style={{filter: 'blur(2.6px)'}}>
						<PapelString cfg={BACK} frame={ppFrame - 6} t={t} light={ppLight * 0.7} lightPos={[CX, FLAME_Y]} />
					</AbsoluteFill>
				) : null}
				{/* pétalos lejanos */}
				{f > 30 ? <PetalRain t={t - 1.3} layer={PETAL_LAYERS[0]} light={{x: CX, y: flameScreenY - camY * 0.45, sigma, L, ambient: 0.015}} camX={camX} camY={-camY} fade={petalIn} /> : null}
				{/* mesa + charco de luz */}
				<div
					style={{
						position: 'absolute',
						left: -200,
						top: BASE_Y - 60,
						width: W + 400,
						height: 700,
						background: `linear-gradient(180deg, ${rgba(mixRGB(C.ink, '#2a1608', 0.8))} 0%, #070301 70%)`,
						borderTop: `1px solid ${rgba(C.cempa, 0.08 * L)}`,
					}}
				/>
				<Light x={CX} y={BASE_Y - 10} r={sigma * 1.25} sy={0.22} color={C.flama} o={0.65 * L} />
				<Light x={CX} y={BASE_Y - 10} r={sigma * 0.55} sy={0.2} color="#FFE9B0" o={0.35 * L} />
				<PaperTexture o={0.35} />
				{/* pétalos medios */}
				{f > 30 ? <PetalRain t={t - 1.3} layer={PETAL_LAYERS[1]} light={{x: CX, y: flameScreenY, sigma, L, ambient: 0.015}} camX={camX} camY={-camY} fade={petalIn} /> : null}
				<Veladora x={CX} y={BASE_Y} h={VH} L={L} id="va" />
				<Flame x={CX} y={FLAME_Y} size={98} t={t} seed={1} grow={g} fl={fl * dip} />
				<Light x={CX} y={FLAME_Y - 50} r={130} color={C.flama} o={0.55 * L} />
				<Sparks t={t - 6 / FPS} x={CX + 2} y={FLAME_Y - 8} />
				{/* guirnalda frontal */}
				{ppFrame > -10 ? <PapelString cfg={FRONT} frame={ppFrame} t={t} light={ppLight} lightPos={[CX, FLAME_Y]} /> : null}
			</Cam>
			{/* pétalos cercanos, fuera de foco, con más parallax */}
			{f > 48 ? <PetalRain t={t - 1.8} layer={PETAL_LAYERS[2]} light={{x: CX, y: flameScreenY - camY, sigma: sigma * 1.3, L, ambient: 0.015}} camX={camX * 1.8} camY={-camY * 1.8} fade={nearIn} /> : null}
			{/* exposición: casi negro total hasta que prende la llama */}
			<AbsoluteFill style={{background: '#000', opacity: ramp(f, [0, IGNITE + 4], [0.86, 0], E.out)}} />
			{/* destello de ignición */}
			<Light x={CX} y={FLAME_Y - 30} r={520} color="#FFD58A" o={0.55 * pop} />
		</AbsoluteFill>
	);
};
