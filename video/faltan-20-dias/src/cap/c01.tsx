import React from 'react';
import {AbsoluteFill, Sequence, useCurrentFrame} from 'remotion';
import {C, E, FPS, H, W, clamp, flicker, hash, lerp, ramp, rgba} from '../lib/util';
import {Flame, Light, PaperTexture, useCanvasDraw} from '../components/core';
import {drawPetal} from '../components/Particles';
import {MarcoFoto} from '../components/Objetos';
import {useGlyph} from '../countdown/reveals';
import {Orb, Ridge, Sky} from './kit/land';
import {Hummingbird, Maguey} from './kit/props';
import {GoldNumber, Kinetic, Lockup, NUM_Y, numSize} from './kit/type';
import {Dip, LightLeak} from './kit/transitions';
import {Monarcas3D, drawMonarch, type Mariposa} from './c13';
import {Xolo3D} from './c14';
import {Alebrije3D} from './c05';
import {CAMINO, Campo, LlamasFaroles, LucesNoche} from './c02';
import {Altar3D, PULL0, VELAS3D} from './c03';
import {Camera, Mountain, Range, Stage3D, makeProjector} from './kit/three';

// Capítulo 1 (REEL) · "Ya vienen" — el final de temporada: todo lo que contamos viene por el camino,
// llega al altar ya puesto y se arremolina en el último número.
export const C01 = {S1: 96, S2: 210, S3: 96, REV: 186, HIT: 92};
export const C01_LEN = C01.S1 + C01.S2 + C01.S3 + C01.REV;

const HZ = 1000;

// conos volcánicos en el horizonte (Popocatépetl e Iztaccíhuatl, en papel recortado)
const volcanes = `M -100 ${HZ + 10} L 80 ${HZ - 120} C 140 ${HZ - 160} 200 ${HZ - 250} 250 ${HZ - 300} L 300 ${HZ - 300} C 350 ${HZ - 250} 420 ${HZ - 150} 520 ${HZ - 90} C 600 ${HZ - 130} 640 ${HZ - 160} 700 ${HZ - 170} C 760 ${HZ - 190} 820 ${HZ - 180} 880 ${HZ - 150} C 960 ${HZ - 110} 1060 ${HZ - 60} 1180 ${HZ - 30} L 1180 ${HZ + 10} Z`;

const Noche: React.FC<{t: number; moon?: boolean}> = ({t, moon = true}) => (
	<AbsoluteFill>
		<Sky t={t} top="#04030b" mid="#110a1a" horizon="#341a18" hy={HZ} stars={170} />
		{moon ? <Orb x={800} y={620} r={36} color="#EEE2C4" core="#FFFBEF" halo={4} o={0.85} /> : null}
		<svg width={W} height={H} style={{position: 'absolute', inset: 0}}>
			<path d={volcanes} fill="#140c14" />
			<path d={`M 250 ${HZ - 300} L 300 ${HZ - 300} L 290 ${HZ - 270} L 262 ${HZ - 274} Z M 680 ${HZ - 168} C 720 ${HZ - 186} 780 ${HZ - 188} 840 ${HZ - 168} L 800 ${HZ - 156} L 720 ${HZ - 158} Z`} fill="#c9bfae" opacity={0.35} />
		</svg>
		<Ridge seed={11} y={HZ + 10} amp={50} color="#0e0910" />
		<div style={{position: 'absolute', left: 0, top: HZ, width: W, height: H - HZ, background: 'linear-gradient(180deg, #120c12, #1c110c 50%, #24150c)'}} />
	</AbsoluteFill>
);

// ---------- 1 · Dieciséis noches ----------
const Volcanes1: React.FC = () => (
	<group>
		<group position={[-60, 0, -420]} scale={[0.85, 0.95, 0.6]}>
			<Mountain pos={[-60, 0, 0]} r={34} h={62} color="#2a1e28" snow="#d8d2c6" snowLine={0.62} seed={151} />
			<Mountain pos={[-10, 0, 6]} r={46} h={88} color="#2a1e28" snow="#d8d2c6" snowLine={0.55} seed={152} />
			<Mountain pos={[40, 0, -4]} r={40} h={72} color="#2a1e28" snow="#d8d2c6" snowLine={0.6} seed={153} />
		</group>
		<Mountain pos={[80, 0, -330]} r={105} h={128} seg={18} rough={0.05} crater={0.12} color="#2e1e24" snow="#ddd6ca" snowLine={0.72} seed={155} />
		<Range z={-200} x0={-200} x1={200} n={10} r={30} h={18} color="#140c12" seed={11} />
	</group>
);
const Inicio: React.FC = () => {
	const f = useCurrentFrame();
	const t = f / FPS;
	const u = E.inOut(clamp(f / C01.S1));
	const cam: [number, number, number] = [0, lerp(1.2, 2.2, u), 8];
	const look: [number, number, number] = [0, lerp(8, 22, u), -100];
	const items: Mariposa[] = Array.from({length: 46}).map((_, i) => {
		const st = 10 + hash(i, 1) * 60;
		const a = clamp((f - st) / 90);
		return {p: [(hash(i, 2) - 0.5) * 14 + Math.sin(t * 1.4 + i) * 0.4, lerp(-0.5, 2 + hash(i, 3) * 6, E.out(a)), -hash(i, 4) * 14 + 2], head: Math.sin(t + i) * 2, pitch: 0.4, flap: 0.65 + 0.62 * Math.sin(t * 11 + i * 1.7), s: 0.35 + 0.2 * hash(i, 5)};
	});
	return (
		<AbsoluteFill>
			<Sky t={t} top="#04030b" mid="#110a1a" horizon="#341a18" hy={1100} stars={170} />
			<Orb x={800} y={560} r={36} color="#EEE2C4" core="#FFFBEF" halo={4} o={0.85} />
			<Light x={540} y={1100} r={700} sy={0.4} color={C.cempa} o={0.3} />
			<Stage3D fov={50}>
				<Camera pos={cam} look={look} />
				<fog attach="fog" args={['#1a0e14', 60, 600]} />
				<hemisphereLight args={['#7a6a90', '#0a0608', 0.45]} />
				<directionalLight position={[-200, 200, 100]} intensity={0.9} color="#d0c8e0" />
				<Volcanes1 />
				<mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, -100]} receiveShadow>
					<planeGeometry args={[800, 300]} />
					<meshStandardMaterial color="#120a08" roughness={1} />
				</mesh>
				<Monarcas3D items={items} />
			</Stage3D>
			<PaperTexture o={0.14} />
			<Kinetic text={'Dieciséis noches,\ndieciséis historias.'} f={f} at={10} out={84} y={330} size={54} scrim={0.55} />
		</AbsoluteFill>
	);
};

// ---------- 2 · Todo viene por el camino (recorremos el camino de pétalos del día 2) ----------
const Viaje: React.FC = () => {
	const f = useCurrentFrame();
	const t = f / FPS + 4;
	const u = lerp(0.02, 0.42, f / C01.S2);
	const p = CAMINO.getPoint(u);
	const ahead = CAMINO.getPoint(Math.min(1, u + 0.12));
	const cam: [number, number, number] = [p.x, 1.6, p.z + 2];
	const look: [number, number, number] = [ahead.x, 1.0, ahead.z];
	const P = makeProjector(cam, look, 50);
	// el xolo camina delante, a un lado del camino
	const xoloIn = ramp(f, [0, 20], [0, 1]) * ramp(f, [62, 80], [1, 0]);
	const dq = CAMINO.getPoint(Math.min(1, u + 0.12));
	const dt = CAMINO.getTangent(Math.min(1, u + 0.12));
	const flyU = clamp((f - 70) / 80);
	const mariposas: Mariposa[] = Array.from({length: 26}).map((_, i) => {
		const k = ((hash(i, 11) + (f / FPS) * 0.05) % 1) * 0.5;
		const q = CAMINO.getPoint(Math.min(1, u + 0.03 + k));
		return {p: [q.x + (hash(i, 12) - 0.5) * 6, 1 + hash(i, 13) * 3 + Math.sin(t * 2 + i) * 0.3, q.z], head: Math.PI + Math.sin(t + i), pitch: 0.4, flap: 0.65 + 0.62 * Math.sin(t * 11 + i * 1.7), s: 0.3};
	});
	const hb = clamp((f - 100) / 60);
	return (
		<AbsoluteFill>
			<Sky t={t} top="#05030c" mid="#0f0a1c" horizon="#2a1a26" hy={1050} stars={140} />
			<Orb x={800} y={600} r={36} color="#EEE2C4" core="#FFFBEF" halo={4} o={0.85} />
			<Stage3D fov={50}>
				<Camera pos={cam} look={look} />
				<fog attach="fog" args={['#0e0a14', 20, 110]} />
				<LucesNoche />
				<Campo reach={1} light={1} />
				{xoloIn > 0 ? <Xolo3D pos={[dq.x - dt.z * 0.9, 0, dq.z + dt.x * 0.9]} rotY={Math.atan2(-dt.z, dt.x) + Math.PI} t={t} walk={1.2} /> : null}
				{flyU > 0 && flyU < 1 ? (
					<group position={[lerp(-7, 7, flyU) + p.x, 1.4 + Math.sin(flyU * Math.PI) * 0.8, p.z - 9]} rotation={[0, 0.3, 0.15]} scale={0.6}>
						<Alebrije3D t={t} flap={1.8} />
					</group>
				) : null}
				<Monarcas3D items={mariposas} />
			</Stage3D>
			<LlamasFaroles light={1} P={P} t={t} />
			{hb > 0 && hb < 1 ? (
				<svg width={W} height={H} style={{position: 'absolute', inset: 0, overflow: 'visible'}}>
					<Hummingbird x={lerp(1200, -150, hb)} y={1050 + Math.sin(hb * 9) * 40} s={0.9} t={t} flip glow={0.6} />
				</svg>
			) : null}
			<PaperTexture o={0.14} />
			<Kinetic text={'El que guía,'} f={f} at={8} out={62} y={330} size={58} scrim={0.55} />
			<Kinetic text={'los que vuelan,'} f={f} at={74} out={132} y={330} size={58} scrim={0.55} />
			<Kinetic text={'las luces que esperan…'} f={f} at={144} out={200} y={330} size={58} scrim={0.55} />
		</AbsoluteFill>
	);
};

// El altar ya puesto (el mismo altar 3D del capítulo 3, completo y encendido)
const altarCam = (z: number) => ({cam: [0, 4.0, 13 / z] as [number, number, number], look: [0, 2.7, 0] as [number, number, number]});
const AltarListo: React.FC<{f: number; t: number; z: number; o?: number}> = ({f, t, z, o = 1}) => {
	const {cam, look} = altarCam(z);
	const P = makeProjector(cam, look, 45);
	const fl = flicker(t, 33);
	return (
		<AbsoluteFill style={{opacity: o}}>
			<AbsoluteFill style={{background: 'linear-gradient(180deg, #0d0705 0%, #3a2014 55%, #0a0503 72%, #070302 100%)'}} />
			<Stage3D fov={45}>
				<Camera pos={cam} look={look} />
				<fog attach="fog" args={['#0a0503', 12, 40]} />
				<ambientLight intensity={0.22} />
				<hemisphereLight args={['#8a6a5a', '#0a0604', 0.35]} />
				<directionalLight position={[-4, 8, 8]} intensity={0.9} color="#ffd8b0" castShadow shadow-mapSize={[1024, 1024]} />
				<Altar3D f={PULL0 + 80 + f} t={t} marcoGlow={0.35} />
			</Stage3D>
			{VELAS3D.map((v, i) => {
				const p = P(...v.p);
				return (
					<React.Fragment key={i}>
						<Light x={p.x} y={p.y} r={(1400 / p.d) * v.s} color={C.cempa} o={0.35 * fl} />
						<Flame x={p.x} y={p.y} size={(420 / p.d) * v.s} t={t + i * 1.7} seed={30 + i} fl={fl} />
					</React.Fragment>
				);
			})}
		</AbsoluteFill>
	);
};

const Llegada: React.FC = () => {
	const f = useCurrentFrame();
	const t = f / FPS + 12;
	const z = lerp(0.92, 1.08, E.inOut(clamp(f / C01.S3)));
	const ref = useCanvasDraw(
		(ctx) => {
			for (let i = 0; i < 30; i++) {
				const a = (i / 30) * Math.PI * 2 + t * (0.5 + 0.2 * hash(i, 1));
				const r = 380 + 160 * hash(i, 2) + Math.sin(t + i) * 30;
				drawMonarch(ctx, 540 + Math.cos(a) * r, 900 + Math.sin(a) * r * 1.2, 0.4 + 0.3 * hash(i, 3), a + Math.PI / 2, t * 10 + i, 1);
			}
		},
		[f],
	);
	return (
		<AbsoluteFill style={{background: '#070302'}}>
			<AltarListo f={f} t={t} z={z} />
			<canvas ref={ref} width={W} height={H} style={{position: 'absolute', inset: 0, opacity: ramp(f, [0, 20], [0, 1])}} />
			<AbsoluteFill style={{background: 'linear-gradient(180deg, rgba(7,3,2,0.85) 0%, rgba(7,3,2,0.8) 24%, rgba(7,3,2,0) 32%)'}} />
			<PaperTexture o={0.12} />
			<Kinetic text={'La mesa está puesta.'} f={f} at={8} out={42} y={330} size={54} scrim={0.4} />
			<Kinetic text={'Ya vienen.'} f={f} at={60} out={200} y={310} size={110} font="Rye" color={C.flama} stagger={2} scrim={0.4} />
		</AbsoluteFill>
	);
};

// ---------- 4 · Todo se arremolina en el último número ----------
const Remolino: React.FC<{dias: number; fecha: string}> = ({dias, fecha}) => {
	const f = useCurrentFrame();
	const t = f / FPS + 16;
	const txt = String(dias);
	const size = numSize(txt);
	const HIT = C01.HIT;
	const g = useGlyph(txt, size, 18, 3);
	const spin = clamp((f - 8) / (HIT - 12));
	const ac = altarCam(1.08);
	const PV = makeProjector(ac.cam, ac.look, 45);
	const ref = useCanvasDraw(
		(ctx) => {
			if (!g) return;
			const n = g.pts.length;
			g.pts.forEach(([gx, gy], i) => {
				// cada partícula sale de una vela del altar o del cielo y entra girando
				const v = i % 3 === 0 ? VELAS3D[i % VELAS3D.length] : null;
				const sp = v ? PV(...v.p) : null;
				const sx = sp ? sp.x : hash(i, 1) * W;
				const sy = sp ? sp.y : hash(i, 2) * H;
				const d = (i / n) * 0.35 + hash(i, 3) * 0.15;
				const a = E.inOut(clamp((spin - d) / 0.5));
				const ang0 = Math.atan2(sy - NUM_Y, sx - 540);
				const r0 = Math.hypot(sx - 540, sy - NUM_Y);
				const ang = ang0 + a * (2.6 + hash(i, 4) * 1.2);
				const rr = r0 * (1 - a);
				const vx = 540 + Math.cos(ang) * rr;
				const vy = NUM_Y + Math.sin(ang) * rr;
				const x = lerp(vx, 540 + gx, a * a);
				const y = lerp(vy, NUM_Y + gy, a * a);
				if (i % 4 === 0) {
					drawMonarch(ctx, x, y, 0.32 * (1 - 0.5 * a) + 0.1, ang + Math.PI / 2, t * 12 + i, 1);
				} else {
					drawPetal(ctx, x, y, 16 + 6 * hash(i, 5), ang + t, 1, 0.5, 1.05, hash(i, 6));
				}
			});
			// a la llegada, una estela de chispas
			ctx.globalCompositeOperation = 'lighter';
			const burst = clamp((f - HIT) / 40);
			if (burst > 0 && burst < 1) {
				for (let i = 0; i < 160; i++) {
					const a = hash(i, 7) * Math.PI * 2;
					const v = 300 + 700 * hash(i, 8);
					const x = 540 + Math.cos(a) * v * E.out(burst);
					const y = NUM_Y + Math.sin(a) * v * E.out(burst) + 400 * burst * burst;
					const al = (1 - burst) * 0.9;
					const gr = ctx.createRadialGradient(x, y, 0, x, y, 10);
					gr.addColorStop(0, rgba('#FFF4D6', al));
					gr.addColorStop(1, rgba(C.cempa, 0));
					ctx.fillStyle = gr;
					ctx.fillRect(x - 10, y - 10, 20, 20);
				}
			}
		},
		[f, g, spin],
	);
	// pétalos que caen como lluvia de celebración después del golpe
	const rain = useCanvasDraw(
		(ctx) => {
			const k = clamp((f - HIT) / 20);
			if (k <= 0) return;
			for (let i = 0; i < 160; i++) {
				const st = HIT + hash(i, 1) * 40;
				const tt = (f - st) / FPS;
				if (tt < 0) continue;
				const x = hash(i, 2) * W + Math.sin(tt * 1.5 + i) * 50;
				const y = -40 + tt * (220 + 120 * hash(i, 3));
				drawPetal(ctx, x, y, 18 + 8 * hash(i, 4), tt * 2 + i, Math.cos(tt * 3 + i), 0.5, 0.9, hash(i, 5));
			}
		},
		[f],
	);
	const gold = ramp(f, [HIT - 4, HIT + 10], [0, 1], E.out);
	const flash = Math.sin(Math.PI * clamp((f - HIT + 2) / 9));
	return (
		<AbsoluteFill style={{background: '#070302'}}>
			<AltarListo f={C01.S3 + f} t={t} z={1.08} o={lerp(1, 0.28, E.inOut(clamp(f / 40)))} />
			<AbsoluteFill style={{background: 'radial-gradient(ellipse at 50% 45%, rgba(40,18,8,0.2), rgba(7,3,2,0.8) 75%)'}} />
			<Light x={540} y={NUM_Y} r={800} color={C.flama} o={0.2 + 0.3 * gold} />
			<canvas ref={ref} width={W} height={H} style={{position: 'absolute', inset: 0, opacity: 1 - 0.75 * gold}} />
			<GoldNumber txt={txt} o={gold} glow={0.5 + 0.3 * gold} scale={lerp(1.15, 1, gold)} />
			<canvas ref={rain} width={W} height={H} style={{position: 'absolute', inset: 0}} />
			<AbsoluteFill style={{background: '#FFE9B8', opacity: 0.32 * flash, mixBlendMode: 'screen'}} />
			<Lockup f={f} at={HIT + 4} dias={dias} fecha={fecha} />
			<Kinetic text={'Te esperamos.'} f={f} at={HIT + 34} y={1430} size={50} />
			<PaperTexture o={0.12} />
			<AbsoluteFill style={{background: '#000', opacity: ramp(f, [C01.REV - 8, C01.REV - 1], [0, 1], E.inOut)}} />
		</AbsoluteFill>
	);
};

export const Cap01: React.FC<{dias: number; fecha: string}> = ({dias, fecha}) => {
	const f = useCurrentFrame();
	const a = C01.S1;
	const b = a + C01.S2;
	const c = b + C01.S3;
	return (
		<AbsoluteFill style={{background: '#000'}}>
			<Sequence durationInFrames={a}>
				<Inicio />
			</Sequence>
			<Sequence from={a} durationInFrames={C01.S2}>
				<Viaje />
			</Sequence>
			<Sequence from={b} durationInFrames={C01.S3}>
				<Llegada />
			</Sequence>
			<Sequence from={c} durationInFrames={C01.REV}>
				<Remolino dias={dias} fecha={fecha} />
			</Sequence>
			<Dip f={f} at={a} dur={10} />
			<LightLeak f={f} at={b} dur={18} />
		</AbsoluteFill>
	);
};
