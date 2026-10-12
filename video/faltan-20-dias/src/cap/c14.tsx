import React from 'react';
import {AbsoluteFill, Sequence, useCurrentFrame} from 'remotion';
import {noise2D} from '@remotion/noise';
import {C, E, FPS, H, W, clamp, flicker, hash, lerp, ramp, rgba} from '../lib/util';
import {Light, PaperTexture, useCanvasDraw} from '../components/core';
import {useGlyph} from '../countdown/reveals';
import {Fog, Orb, Ridge, Sky} from './kit/land';
import {GoldNumber, Kinetic, Lockup, NUM_Y, numSize} from './kit/type';
import {Dip, LightLeak} from './kit/transitions';
import {Camera, Range, Stage3D, THREE, project} from './kit/three';

// Capítulo 14 · "Xólotl" — el xoloitzcuintle guía a las almas para cruzar el río.
export const C14 = {S1: 126, S2: 96, S3: 72, REV: 126, HIT: 64};
export const C14_LEN = C14.S1 + C14.S2 + C14.S3 + C14.REV;

// ---------- Xoloitzcuintle (perfil, mira a la derecha) ----------
export const Xolo: React.FC<{x: number; y: number; s?: number; t: number; walk?: number; color?: string; rim?: string; look?: number}> = ({x, y, s = 1, t, walk = 1, color = '#0d0809', rim = C.marfil, look = 0}) => {
	const ph = t * Math.PI * 2 * 1.5 * walk;
	const bob = Math.sin(ph * 2) * 3 * walk;
	const leg = (hx: number, hy: number, o: number, front: boolean) => {
		const a1 = (22 * Math.sin(ph + o) * walk * Math.PI) / 180;
		const bend = (front ? -1 : 1) * Math.max(0, Math.sin(ph + o + 1.6)) * 38 * walk;
		const a2 = a1 + (bend * Math.PI) / 180;
		const kx = hx + Math.sin(a1) * 44;
		const ky = hy + Math.cos(a1) * 44;
		const px = kx + Math.sin(a2) * 46;
		const py = ky + Math.cos(a2) * 46;
		return `M ${hx} ${hy} L ${kx} ${ky} L ${px} ${py} L ${px + 10} ${py}`;
	};
	const body = 'M -118 -52 C -96 -74 -20 -70 40 -66 C 70 -64 92 -52 100 -30 C 104 -10 92 4 70 6 C 30 10 -40 6 -80 4 C -108 2 -124 -20 -118 -52 Z';
	const neck = 'M 62 -56 C 80 -86 104 -110 124 -118 L 146 -96 C 124 -84 104 -60 96 -30 Z';
	const head = `M 116 -126 C 132 -142 160 -140 174 -128 L 214 -112 C 220 -108 218 -100 210 -98 L 168 -94 C 150 -90 128 -96 118 -108 Z`;
	const ear = 'M 128 -134 L 120 -196 L 156 -140 Z';
	const tail = `M -116 -48 C -150 -40 -160 ${-10 + Math.sin(ph) * 6} -176 ${8 + Math.sin(ph) * 8}`;
	return (
		<g transform={`translate(${x} ${y + bob}) scale(${s})`}>
			<g stroke={color} strokeWidth={11} strokeLinecap="round" strokeLinejoin="round" fill="none">
				<path d={leg(-96, -8, Math.PI, false)} opacity={0.75} />
				<path d={leg(66, -2, 0, true)} opacity={0.75} />
			</g>
			<path d={tail} stroke={color} strokeWidth={7} fill="none" strokeLinecap="round" />
			<path d={body} fill={color} />
			<path d={neck} fill={color} />
			<g transform={`rotate(${look * -18} 130 -110)`}>
				<path d={head} fill={color} />
				<path d={ear} fill={color} />
				<circle cx={160} cy={-118} r={4} fill={C.flama} opacity={0.9} />
			</g>
			<g stroke={color} strokeWidth={12} strokeLinecap="round" strokeLinejoin="round" fill="none">
				<path d={leg(-80, -8, 0, false)} />
				<path d={leg(80, -2, Math.PI, true)} />
			</g>
			{/* luz de luna en el borde superior */}
			<path d="M -112 -58 C -90 -76 -20 -72 40 -68 C 70 -66 88 -56 98 -40" stroke={rim} strokeWidth={2.5} fill="none" opacity={0.7} vectorEffect="non-scaling-stroke" />
			<path d="M 64 -60 C 82 -90 104 -112 122 -120" stroke={rim} strokeWidth={2.5} fill="none" opacity={0.65} vectorEffect="non-scaling-stroke" />
			<path d="M 120 -136 L 122 -190 M 132 -140 C 150 -144 168 -134 210 -112" stroke={rim} strokeWidth={2} fill="none" opacity={0.55} vectorEffect="non-scaling-stroke" />
		</g>
	);
};

// ---------- Xólotl en 3D: xoloitzcuintle de piel oscura con brillo de luna ----------
const PIEL = '#1d1618';
const skin = <meshStandardMaterial color={PIEL} roughness={0.42} metalness={0.15} />;
export const Xolo3D: React.FC<{pos: [number, number, number]; t: number; walk?: number; look?: number; rotY?: number}> = ({pos, t, walk = 1, look = 0, rotY = 0}) => {
	const ph = t * Math.PI * 2 * 1.4 * walk;
	const bob = Math.abs(Math.sin(ph)) * 0.03 * walk;
	const leg = (x: number, z: number, o: number) => {
		const a1 = Math.sin(ph + o) * 0.45 * walk;
		const a2 = Math.max(0, Math.sin(ph + o + 1.4)) * 0.7 * walk;
		return (
			<group position={[x, 0.86, z]} rotation={[0, 0, a1]}>
				<mesh position={[0, -0.22, 0]} castShadow>
					<cylinderGeometry args={[0.1, 0.06, 0.46, 8]} />
					{skin}
				</mesh>
				<group position={[0, -0.44, 0]} rotation={[0, 0, (x > 0 ? -1 : 1) * a2]}>
					<mesh position={[0, -0.2, 0]} castShadow>
						<cylinderGeometry args={[0.05, 0.04, 0.42, 8]} />
						{skin}
					</mesh>
					<mesh position={[0.04, -0.41, 0]} castShadow>
						<boxGeometry args={[0.12, 0.04, 0.08]} />
						{skin}
					</mesh>
				</group>
			</group>
		);
	};
	const tail = React.useMemo(() => new THREE.TubeGeometry(new THREE.CatmullRomCurve3([new THREE.Vector3(-0.78, 1.02, 0), new THREE.Vector3(-1.05, 0.92, 0), new THREE.Vector3(-1.22, 0.68, 0), new THREE.Vector3(-1.28, 0.5, 0)]), 16, 0.03, 6, false), []);
	return (
		<group position={[pos[0], pos[1] + bob, pos[2]]} rotation={[0, rotY, 0]}>
			{/* cuerpo y pecho */}
			<mesh position={[0, 0.98, 0]} rotation={[0, 0, Math.PI / 2 - 0.06]} scale={[0.95, 1, 0.8]} castShadow>
				<capsuleGeometry args={[0.3, 1.05, 6, 14]} />
				{skin}
			</mesh>
			<mesh position={[0.48, 1.0, 0]} scale={[1, 1.12, 0.82]} castShadow>
				<sphereGeometry args={[0.34, 16, 12]} />
				{skin}
			</mesh>
			{/* cuello */}
			<mesh position={[0.8, 1.33, 0]} rotation={[0, 0, -0.75]} castShadow>
				<cylinderGeometry args={[0.13, 0.19, 0.6, 10]} />
				{skin}
			</mesh>
			{/* cabeza: cráneo, hocico largo, nariz, mandíbula y orejas de murciélago */}
			<group position={[1.02, 1.6, 0]} rotation={[0, look * 1.1, -0.12]}>
				<mesh scale={[1.15, 0.92, 0.86]} castShadow>
					<sphereGeometry args={[0.19, 16, 12]} />
					{skin}
				</mesh>
				<mesh position={[0.24, -0.06, 0]} rotation={[0, 0, Math.PI / 2 + 0.1]} scale={[0.8, 1, 0.78]} castShadow>
					<capsuleGeometry args={[0.085, 0.28, 6, 12]} />
					{skin}
				</mesh>
				<mesh position={[0.21, -0.13, 0]} rotation={[0, 0, Math.PI / 2 + 0.22]} scale={[0.55, 1, 0.65]} castShadow>
					<capsuleGeometry args={[0.07, 0.22, 6, 10]} />
					{skin}
				</mesh>
				<mesh position={[0.44, -0.09, 0]}>
					<sphereGeometry args={[0.045, 10, 8]} />
					<meshStandardMaterial color="#050304" roughness={0.3} />
				</mesh>
				{[-1, 1].map((sd) => (
					<group key={sd}>
						<mesh position={[-0.06, 0.24, sd * 0.1]} rotation={[sd * -0.42, 0.25 * sd, 0.18]} scale={[1, 1, 0.32]} castShadow>
							<coneGeometry args={[0.13, 0.32, 10]} />
							{skin}
						</mesh>
						<mesh position={[0.12, 0.03, sd * 0.13]}>
							<sphereGeometry args={[0.022, 8, 6]} />
							<meshStandardMaterial color="#c88a2a" emissive="#6a3a08" roughness={0.2} />
						</mesh>
					</group>
				))}
			</group>
			{/* patas: delanteras y traseras desfasadas */}
			{leg(0.52, 0.16, 0)}
			{leg(0.52, -0.16, Math.PI)}
			{leg(-0.55, 0.16, Math.PI)}
			{leg(-0.55, -0.16, 0)}
			<mesh geometry={tail} rotation={[Math.sin(ph * 0.5) * 0.25, 0, 0]} castShadow>
				{skin}
			</mesh>
		</group>
	);
};

// Almas: esferas de luz 3D + halo 2D proyectado con su reflejo exacto en el agua
type Alma = [number, number, number];
const almaPos = (i: number, t: number, lead: number): Alma => [lead - 1.6 - i * 0.9 + noise2D('ax', i, t * 0.5) * 0.3, 0.9 + 0.7 * hash(i, 3) + noise2D('ay', i, t * 0.7) * 0.15, -1.4 - 1.6 * hash(i, 5)];
const AlmasGlow: React.FC<{almas: Alma[]; cam: [number, number, number]; look: [number, number, number]; fov: number; f: number}> = ({almas, cam, look, fov, f}) => {
	const pts = almas.map((p) => ({a: project(p, cam, look, fov), r: project([p[0], -p[1], p[2]], cam, look, fov), d: Math.hypot(p[0] - cam[0], p[1] - cam[1], p[2] - cam[2])}));
	const ref = useCanvasDraw(
		(ctx) => {
			ctx.globalCompositeOperation = 'lighter';
			const dot = (x: number, y: number, r: number, a: number, sy = 1) => {
				ctx.save();
				ctx.translate(x, y);
				ctx.scale(1, sy);
				const g = ctx.createRadialGradient(0, 0, 0, 0, 0, r * 5);
				g.addColorStop(0, rgba('#FFF6DA', a));
				g.addColorStop(0.2, rgba(C.flama, a * 0.8));
				g.addColorStop(0.55, rgba(C.cempa, a * 0.25));
				g.addColorStop(1, rgba(C.cempa, 0));
				ctx.fillStyle = g;
				ctx.fillRect(-r * 5, -r * 5, r * 10, r * 10);
				ctx.restore();
			};
			pts.forEach(({a, r, d}, i) => {
				const rad = 70 / d;
				const al = 0.8 + 0.2 * Math.sin(f / 9 + i);
				dot(a.x, a.y, rad, al);
				dot(r.x, r.y, rad * 0.9, al * 0.3, 1.8);
			});
		},
		[f, almas.length],
	);
	return <canvas ref={ref} width={W} height={H} style={{position: 'absolute', inset: 0, mixBlendMode: 'screen'}} />;
};

// Ribera nocturna: lomas lejanas, agua translúcida sobre el reflejo, orilla donde camina el perro
const Paisaje: React.FC<{children?: React.ReactNode; mirror?: React.ReactNode}> = ({children, mirror}) => (
	<>
		<fog attach="fog" args={['#0e0c16', 25, 140]} />
		<hemisphereLight args={['#7a7aa8', '#0a0608', 0.6]} />
		<directionalLight position={[30, 25, -60]} intensity={3.2} color="#d8d0e8" castShadow shadow-mapSize={[1024, 1024]} />
		<directionalLight position={[-20, 6, 20]} intensity={0.35} color={C.cempa} />
		<Range z={-90} x0={-120} x1={120} n={12} r={18} h={16} color="#141020" seed={141} />
		<Range z={-60} x0={-90} x1={90} n={9} r={12} h={7} color="#100c16" seed={142} />
		{/* orilla cercana */}
		<mesh position={[0, -0.05, 2.5]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
			<planeGeometry args={[400, 6]} />
			<meshStandardMaterial color="#141012" roughness={1} />
		</mesh>
		{children}
		<group scale={[1, -1, 1]}>
			<Range z={-90} x0={-120} x1={120} n={12} r={18} h={16} color="#141020" seed={141} />
			<Range z={-60} x0={-90} x1={90} n={9} r={12} h={7} color="#100c16" seed={142} />
			{mirror}
		</group>
		<mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, -50]}>
			<planeGeometry args={[400, 100]} />
			<meshBasicMaterial color="#05050b" transparent opacity={0.68} />
		</mesh>
	</>
);

const Orilla: React.FC = () => {
	const f = useCurrentFrame();
	const t = f / FPS;
	const dogX = lerp(-4, 3.2, f / C14.S1);
	const cam: [number, number, number] = [dogX - 0.8, 1.3, 7];
	const look: [number, number, number] = [dogX + 0.3, 2.2, -6];
	const almas = Array.from({length: 7}).map((_, i) => almaPos(i, t, dogX));
	return (
		<AbsoluteFill>
			<Sky t={t} top="#03030a" mid="#0a0a16" horizon="#1a1420" hy={1150} stars={200} />
			<Orb x={830} y={560} r={52} color={C.marfil} core="#FFFBF0" halo={4} o={0.9} />
			<Stage3D fov={50}>
				<Camera pos={cam} look={look} />
				<Paisaje mirror={<Xolo3D pos={[dogX, 0, 1.6]} t={t} />}>
					<Xolo3D pos={[dogX, 0, 1.6]} t={t} />
				</Paisaje>
			</Stage3D>
			<AlmasGlow almas={almas} cam={cam} look={look} fov={50} f={f} />
			<Fog y={1200} color="#c8b8c8" o={0.08} h={240} />
			<PaperTexture o={0.16} />
			<Kinetic text={'Para cruzar el río,\nun perro fiel guía el camino.'} f={f} at={14} out={110} y={340} size={48} scrim={0.4} />
		</AbsoluteFill>
	);
};

const Almas: React.FC = () => {
	const f = useCurrentFrame();
	const t = f / FPS + 5;
	const lead = lerp(2, 12, f / C14.S2);
	const cam: [number, number, number] = [lerp(-2, 4, f / C14.S2), 0.7, 6];
	const look: [number, number, number] = [cam[0] + 1.5, 1.3, -6];
	const almas = Array.from({length: 18}).map((_, i) => almaPos(i, t, lead));
	return (
		<AbsoluteFill>
			<Sky t={t} top="#020208" mid="#08080f" horizon="#140e16" hy={1100} stars={120} />
			<Stage3D fov={50}>
				<Camera pos={cam} look={look} />
				<Paisaje />
			</Stage3D>
			<AlmasGlow almas={almas} cam={cam} look={look} fov={50} f={f} />
			<PaperTexture o={0.16} />
			<Kinetic text={'Xólotl nunca deja\na nadie atrás.'} f={f} at={10} out={82} y={380} size={52} scrim={0.4} />
		</AbsoluteFill>
	);
};

const Mirada: React.FC = () => {
	const f = useCurrentFrame();
	const t = f / FPS + 8;
	const look = E.inOut(clamp((f - 18) / 22));
	const fl = flicker(t, 14);
	const cam: [number, number, number] = [lerp(2.6, 2.3, f / C14.S3), 1.75, lerp(2.4, 2.0, f / C14.S3)];
	const tgt: [number, number, number] = [0.95, 1.5, 0];
	const almas: Alma[] = Array.from({length: 6}).map((_, i) => [-1.5 + hash(i, 1) * 2 + noise2D('m', i, t) * 0.2, 1.2 + hash(i, 2) * 1.2, -2.5 - hash(i, 3) * 2]);
	return (
		<AbsoluteFill style={{background: '#040306'}}>
			<Light x={300} y={760} r={900} color={C.cempa} o={0.4 * fl} />
			<Stage3D fov={40}>
				<Camera pos={cam} look={tgt} />
				<hemisphereLight args={['#5a5a80', '#0a0608', 0.25]} />
				<directionalLight position={[-6, 4, -6]} intensity={2.2 * fl} color={C.cempa} />
				<directionalLight position={[4, 6, 4]} intensity={0.5} color="#b0a8d0" />
				<Xolo3D pos={[0, 0, 0]} t={t} walk={0} look={look} />
			</Stage3D>
			<AlmasGlow almas={almas} cam={cam} look={tgt} fov={40} f={f} />
			<PaperTexture o={0.16} />
		</AbsoluteFill>
	);
};

const RioNumero: React.FC<{dias: number; fecha: string}> = ({dias, fecha}) => {
	const f = useCurrentFrame();
	const t = f / FPS + 11;
	const txt = String(dias);
	const g = useGlyph(txt, numSize(txt), 30, 4);
	const HIT = C14.HIT;
	const ref = useCanvasDraw(
		(ctx) => {
			if (!g) return;
			ctx.globalCompositeOperation = 'lighter';
			g.pts.forEach(([gx, gy], i) => {
				const tx = 540 + gx;
				const ty = NUM_Y + gy;
				// las almas llegan río abajo, desde la izquierda, en fila serpenteante
				const d = (i / g.pts.length) * 30 + hash(i, 2) * 10;
				const a = E.inOut(clamp((f - d) / 36));
				const sx = -150 - hash(i, 3) * 400;
				const sy = 400 + hash(i, 4) * 1100;
				const x = lerp(sx, tx, a) + (1 - a) * Math.sin(t * 2 + i) * 40;
				const y = lerp(sy, ty, a);
				const al = 0.85 + 0.15 * Math.sin(t * 4 + i);
				const r = 5 + 2 * hash(i, 5);
				const gr = ctx.createRadialGradient(x, y, 0, x, y, r * 4.5);
				gr.addColorStop(0, rgba('#FFF6DA', al));
				gr.addColorStop(0.22, rgba(C.flama, al * 0.75));
				gr.addColorStop(1, rgba(C.cempa, 0));
				ctx.fillStyle = gr;
				ctx.fillRect(x - r * 4.5, y - r * 4.5, r * 9, r * 9);
				// onda en el agua al posarse
				const land = d + 36;
				const u = (f - land) / 26;
				if (u > 0 && u < 1) {
					ctx.strokeStyle = rgba(C.flama, 0.35 * (1 - u));
					ctx.lineWidth = 1.5;
					ctx.beginPath();
					ctx.ellipse(tx, ty, 6 + u * 40, (6 + u * 40) * 0.45, 0, 0, Math.PI * 2);
					ctx.stroke();
				}
			});
		},
		[g, f],
	);
	return (
		<AbsoluteFill style={{background: 'radial-gradient(ellipse at 50% 45%, #10101c, #040308 70%)'}}>
			{/* corriente del río vista desde arriba */}
			{Array.from({length: 40}).map((_, i) => {
				const y = 40 + i * 48;
				const off = ((t * 60 + i * 37) % 300) - 150;
				return <div key={i} style={{position: 'absolute', left: off - 200, top: y, width: 700 + (i % 5) * 120, height: 2, background: rgba(C.marfil, 0.04), transform: `rotate(${-4 + (i % 3)}deg)`}} />;
			})}
			<GoldNumber txt={txt} o={ramp(f, [HIT - 4, HIT + 26], [0, 0.4], E.out)} blur={10} glow={0.55} />
			<canvas ref={ref} width={W} height={H} style={{position: 'absolute', inset: 0, mixBlendMode: 'screen'}} />
			<Lockup f={f} at={HIT + 4} dias={dias} fecha={fecha} />
			<PaperTexture o={0.14} />
			<AbsoluteFill style={{background: '#000', opacity: ramp(f, [C14.REV - 8, C14.REV - 1], [0, 1], E.inOut)}} />
		</AbsoluteFill>
	);
};

export const Cap14: React.FC<{dias: number; fecha: string}> = ({dias, fecha}) => {
	const f = useCurrentFrame();
	const a = C14.S1;
	const b = a + C14.S2;
	const c = b + C14.S3;
	return (
		<AbsoluteFill style={{background: '#000'}}>
			<Sequence durationInFrames={a}>
				<Orilla />
			</Sequence>
			<Sequence from={a} durationInFrames={C14.S2}>
				<Almas />
			</Sequence>
			<Sequence from={b} durationInFrames={C14.S3}>
				<Mirada />
			</Sequence>
			<Sequence from={c} durationInFrames={C14.REV}>
				<RioNumero dias={dias} fecha={fecha} />
			</Sequence>
			<Dip f={f} at={a} dur={14} />
			<LightLeak f={f} at={b} dur={14} color={C.cempa} />
			<Dip f={f} at={c} dur={12} />
		</AbsoluteFill>
	);
};
