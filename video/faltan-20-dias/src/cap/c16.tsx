import React from 'react';
import {AbsoluteFill, Sequence, useCurrentFrame} from 'remotion';
import {C, E, FPS, H, W, clamp, css, flicker, hash, lerp, mixRGB, ramp, rgba} from '../lib/util';
import {Light, PaperTexture, useCanvasDraw} from '../components/core';
import {Bokeh} from '../components/Particles';
import {Fog, Orb, Ridge, Sky, ridgePath} from './kit/land';
import {Bloom, Hummingbird, Maguey, pyramidPath} from './kit/props';
import {GoldNumber, Kinetic, Lockup} from './kit/type';
import {LightLeak} from './kit/transitions';
import {Camera, Cempasuchil3D, Ground, Maguey3D, Piramide, Range, Stage3D, Tallo, project} from './kit/three';

// Capítulo 16 · "El sol hecho flor" — la leyenda de Xóchitl y Huitzilin.
// Ella se volvió flor de cempasúchil; él, colibrí, volvió a encontrarla.
export const C16 = {S1: 120, S2: 108, S3: 72, REV: 120, HIT: 50};
export const C16_LEN = C16.S1 + C16.S2 + C16.S3 + C16.REV;

// Escena en 3D real: valle con la pirámide asentada en el llano, sierras detrás y magueyes al frente
const Amanecer: React.FC = () => {
	const f = useCurrentFrame();
	const t = f / FPS;
	const rise = ramp(f, [0, C16.S1], [0, 1], E.inOut);
	const sunY = lerp(40, 125, rise);
	const cam: [number, number, number] = [lerp(-8, 6, rise), lerp(13, 17, rise), lerp(100, 80, rise)];
	const horizon = mixRGB('#3a160b', C.cempa, 0.25 + 0.35 * rise);
	const look: [number, number, number] = [0, 28, -80];
	const sun = project([30, sunY, -470], cam, look, 50);
	return (
		<AbsoluteFill>
			<Sky t={t} top="#05030a" mid="#1d0c12" horizon={rgba(horizon)} hy={1180} stars={140} starO={1 - rise * 0.8} />
			<Light x={sun.x} y={sun.y} r={1100} color={C.cempa} o={0.35 + 0.3 * rise} />
			<Orb x={sun.x} y={sun.y} r={52} color={C.flama} halo={6} o={0.5 + 0.5 * rise} />
			<Stage3D fov={50}>
				<Camera pos={cam} look={look} />
				<fog attach="fog" args={[css(mixRGB('#4a1c10', C.cempa, 0.2 + 0.3 * rise)), 70, 560]} />
				<hemisphereLight args={[css(mixRGB('#e08a5a', C.flama, rise * 0.4)), '#0e0604', 0.3 + 0.25 * rise]} />
				<directionalLight position={[40, 180 + sunY, -400]} intensity={0.9 + 1.1 * rise} color={C.cempa} castShadow shadow-mapSize={[1024, 1024]} />
				<directionalLight position={[-60, 40, 120]} intensity={0.45 + 0.3 * rise} color="#b08a9a" />
				{/* sol */}
				<Range z={-330} x0={-420} x1={420} n={13} r={70} h={95} color="#5a2a1c" seed={161} />
				<Range z={-200} x0={-300} x1={300} n={10} r={48} h={52} color="#3e2016" seed={162} />
				<Range z={-110} x0={-200} x1={-60} n={4} r={26} h={22} color="#2e2a18" seed={163} />
				<Range z={-120} x0={70} x1={220} n={4} r={26} h={20} color="#2e2a18" seed={164} />
				<Ground color="#1e100a" seed={16} amp={1.4} />
				<Piramide pos={[-12, 0, -78]} base={36} tiers={5} tierH={3.8} color="#8a5236" dark="#4a2616" accent="#9a5e3e" rotY={0.38} />
				<Maguey3D pos={[-11, 0, 50]} s={1.5} color="#24402e" seed={3} />
				<Maguey3D pos={[13, 0, 36]} s={1.2} color="#22382a" seed={5} />
				<Maguey3D pos={[-26, 0, -10]} s={1.4} color="#2a3a28" seed={9} />
				<Maguey3D pos={[30, 0, -40]} s={1.6} color="#2a3a28" seed={11} />
			</Stage3D>
			<Fog y={1180} color={C.cempa} o={0.18 + 0.12 * rise} />
			<PaperTexture o={0.2} />
			<Kinetic text={'Dicen que Xóchitl\nse volvió flor…'} f={f} at={14} out={100} y={1430} size={52} scrim={0.4} />
			{void H}
		</AbsoluteFill>
	);
};

// La flor en 3D: se abre mientras la cámara la rodea
const Flor: React.FC = () => {
	const f = useCurrentFrame();
	const t = f / FPS;
	const open = E.inOut(clamp((f - 4) / 86));
	const fl = flicker(t + 9, 16);
	const orbit = lerp(-0.22, 0.18, E.inOut(clamp(f / C16.S2)));
	const dist = lerp(13.5, 12, E.out(clamp(f / C16.S2)));
	return (
		<AbsoluteFill style={{background: '#050201'}}>
			<Light x={260} y={300} r={1300} color={C.cempa} o={0.35} />
			<Bokeh t={t + 4} L={0.9} n={20} seed={161} blur={5} />
			{/* haz de sol diagonal */}
			<div style={{position: 'absolute', left: -300, top: -200, width: 700, height: 2600, transform: 'rotate(-28deg)', background: `linear-gradient(90deg, transparent, ${rgba(C.flama, 0.16 * open)}, transparent)`, mixBlendMode: 'screen', filter: 'blur(20px)'}} />
			<Stage3D fov={35}>
				<Camera pos={[Math.sin(orbit) * dist, 2.2, Math.cos(orbit) * dist]} look={[0, -0.6, 0]} />
				<ambientLight intensity={0.18} />
				<directionalLight position={[-8, 10, 6]} intensity={2.4 * (0.85 + 0.15 * fl)} color={C.flama} castShadow shadow-mapSize={[1024, 1024]} />
				<directionalLight position={[6, 4, -8]} intensity={1.6} color={C.cempa} />
				<directionalLight position={[4, -2, 8]} intensity={0.35} color="#8a6a8a" />
				<group position={[0, 0.2, 0]} rotation={[0.75, 0, 0.05]}>
					<Cempasuchil3D s={0.86} open={open} seed={16} lit={0.95 + 0.1 * fl} />
				</group>
				<Tallo
					pts={[[0, 0, -0.5], [0.15, -3, -0.6], [-0.1, -6, -0.4], [0.1, -10, -0.5]]}
					r={0.2}
					color="#2f5a3c"
					leaves={[{u: 0.42, side: -1, s: 0.9}, {u: 0.66, side: 1, s: 1.1}]}
				/>
			</Stage3D>
			<PaperTexture o={0.16} />
			<Kinetic text={'para que Huitzilin\npudiera encontrarla.'} f={f} at={10} out={92} y={1430} size={52} scrim={0.4} />
		</AbsoluteFill>
	);
};

// Rastro de luz del colibrí (partículas doradas)
const Trail: React.FC<{pts: [number, number, number][]; f: number}> = ({pts, f}) => {
	const ref = useCanvasDraw(
		(ctx) => {
			ctx.globalCompositeOperation = 'lighter';
			pts.forEach(([x, y, age], i) => {
				if (age < 0 || age > 1) return;
				const a = (1 - age) ** 1.5;
				for (let k = 0; k < 3; k++) {
					const jx = (hash(i * 3 + k, 5) - 0.5) * 30 * age;
					const jy = (hash(i * 3 + k, 6) - 0.5) * 30 * age + age * 40;
					const r = 2 + 4 * (1 - age);
					const g = ctx.createRadialGradient(x + jx, y + jy, 0, x + jx, y + jy, r * 4);
					g.addColorStop(0, rgba('#FFF6D6', a));
					g.addColorStop(0.3, rgba(C.flama, a * 0.7));
					g.addColorStop(1, rgba(C.cempa, 0));
					ctx.fillStyle = g;
					ctx.fillRect(x + jx - r * 4, y + jy - r * 4, r * 8, r * 8);
				}
			});
		},
		[f],
	);
	return <canvas ref={ref} width={W} height={H} style={{position: 'absolute', inset: 0, mixBlendMode: 'screen'}} />;
};

const Llegada: React.FC = () => {
	const f = useCurrentFrame();
	const t = f / FPS;
	// el colibrí entra por la derecha y se detiene frente a la flor
	const p = E.out(clamp(f / 40));
	const bx = lerp(1250, 600, p);
	const by = lerp(560, 720, p) + Math.sin(t * 3) * 6;
	const path: [number, number, number][] = [];
	for (let k = 0; k < 40; k++) {
		const ff = f - k * 0.8;
		if (ff < 0) continue;
		const pp = E.out(clamp(ff / 40));
		path.push([lerp(1250, 600, pp) + 70, lerp(560, 720, pp) + Math.sin((ff / FPS) * 3) * 6, k / 40]);
	}
	return (
		<AbsoluteFill style={{background: '#060201'}}>
			<Light x={420} y={1000} r={1000} color={C.cempa} o={0.4} />
			<Bokeh t={t + 7} L={0.8} n={16} seed={162} blur={6} />
			<Stage3D fov={35}>
				<Camera pos={[0.6, 2.4, 13]} look={[0, 0, 0]} />
				<ambientLight intensity={0.18} />
				<directionalLight position={[8, 8, 6]} intensity={2.2} color={C.flama} castShadow shadow-mapSize={[1024, 1024]} />
				<directionalLight position={[-6, 4, -8]} intensity={1.4} color={C.cempa} />
				<group position={[-0.7, -0.95, 0]} rotation={[0.7, 0.35, 0.1]}>
					<Cempasuchil3D s={0.66} open={1} seed={17} />
				</group>
				<Tallo pts={[[-0.7, -1.45, -0.4], [-0.55, -4, -0.5], [-0.8, -8, -0.4]]} r={0.16} color="#2f5a3c" leaves={[{u: 0.5, side: 1, s: 0.8}]} />
			</Stage3D>
			<Trail pts={path} f={f} />
			<svg width={W} height={H} style={{position: 'absolute', inset: 0, overflow: 'visible'}}>
				<Hummingbird x={bx} y={by} s={1.6} t={t} tilt={lerp(-12, 6, p)} glow={0.6} />
			</svg>
			<PaperTexture o={0.18} />
		</AbsoluteFill>
	);
};

const Revelacion: React.FC<{dias: number; fecha: string}> = ({dias, fecha}) => {
	const f = useCurrentFrame();
	const t = f / FPS;
	const H16 = C16.HIT;
	// vuelo en S que "escribe" el número de izquierda a derecha
	const u = E.inOut(clamp(f / H16));
	const bx = lerp(-160, 1240, u);
	const by = 1060 - Math.sin(u * Math.PI * 2) * 220 - u * 300;
	const reveal = bx + 40;
	const path: [number, number, number][] = [];
	for (let k = 0; k < 46; k++) {
		const ff = f - k * 0.7;
		if (ff < 0 || ff > H16 + 6) continue;
		const uu = E.inOut(clamp(ff / H16));
		path.push([lerp(-160, 1240, uu), 1060 - Math.sin(uu * Math.PI * 2) * 220 - uu * 300, k / 46]);
	}
	const txt = String(dias);
	const settle = E.out(clamp((f - H16) / 30));
	return (
		<AbsoluteFill style={{background: '#050201'}}>
			<Light x={540} y={860} r={1000} color={C.cempa} o={0.32 + 0.12 * settle} />
			<Bokeh t={t + 11} L={0.6} n={16} seed={163} blur={5} />
			<svg width={W} height={H} style={{position: 'absolute', inset: 0, overflow: 'visible', filter: 'blur(8px)', opacity: 0.55}}>
				<Bloom cx={540} cy={1780} R={360} open={1} lit={0.75} id="c16d" t={t} />
			</svg>
			{/* el número se descubre detrás del vuelo */}
			<div style={{position: 'absolute', inset: 0, clipPath: `inset(0 ${Math.max(0, W - reveal)}px 0 0)`}}>
				<GoldNumber txt={txt} glow={0.6 + 0.3 * settle} />
			</div>
			<Trail pts={path} f={f} />
			{f < H16 + 8 ? (
				<svg width={W} height={H} style={{position: 'absolute', inset: 0, overflow: 'visible'}}>
					<Hummingbird x={bx} y={by} s={1.25} t={t} tilt={-14 + Math.cos(u * Math.PI * 2) * 18} flip glow={0.7} />
				</svg>
			) : null}
			<Lockup f={f} at={H16 + 4} dias={dias} fecha={fecha} />
			<PaperTexture o={0.16} />
			<AbsoluteFill style={{background: '#000', opacity: ramp(f, [C16.REV - 8, C16.REV - 1], [0, 1], E.inOut)}} />
		</AbsoluteFill>
	);
};

export const Cap16: React.FC<{dias: number; fecha: string}> = ({dias, fecha}) => {
	const f = useCurrentFrame();
	const a = C16.S1;
	const b = a + C16.S2;
	const c = b + C16.S3;
	return (
		<AbsoluteFill style={{background: '#000'}}>
			<Sequence durationInFrames={a}>
				<Amanecer />
			</Sequence>
			<Sequence from={a} durationInFrames={C16.S2}>
				<Flor />
			</Sequence>
			<Sequence from={b} durationInFrames={C16.S3}>
				<Llegada />
			</Sequence>
			<Sequence from={c} durationInFrames={C16.REV}>
				<Revelacion dias={dias} fecha={fecha} />
			</Sequence>
			<LightLeak f={f} at={a} dur={18} />
			<LightLeak f={f} at={c} dur={14} color={C.cempa} />
		</AbsoluteFill>
	);
};
