import React from 'react';
import {AbsoluteFill, Sequence, useCurrentFrame} from 'remotion';
import {noise2D} from '@remotion/noise';
import {C, E, FPS, H, W, clamp, hash, lerp, ramp, rgba} from '../lib/util';
import {Light, PaperTexture, useCanvasDraw} from '../components/core';
import {Smoke} from '../components/Particles';
import {Kinetic, Lockup, NUM_Y, numSize} from './kit/type';
import {Dip, LightLeak} from './kit/transitions';
import {Camera, Stage3D, THREE, project} from './kit/three';

// Capítulo 5 · "Alebrijes" — criaturas de colores nacidas de un sueño; dicen que cada quien tiene uno que lo guía.
export const C05 = {S1: 108, S2: 120, S3: 72, REV: 126, HIT: 64};
export const C05_LEN = C05.S1 + C05.S2 + C05.S3 + C05.REV;

const PAL = [C.cempa, C.flama, C.verde, C.terracota, C.marfil, '#2f8a5e', '#F79A3A'];
const OUT = '#120806';

// Patrones de alebrije reutilizables (SVG <pattern>)
export const Patrones: React.FC = () => (
	<svg width={0} height={0} style={{position: 'absolute'}}>
		<defs>
			<pattern id="alZig" width={60} height={40} patternUnits="userSpaceOnUse">
				<rect width={60} height={40} fill={C.flama} />
				<path d="M 0 30 L 15 10 L 30 30 L 45 10 L 60 30" stroke={C.terracota} strokeWidth={7} fill="none" />
				<circle cx={15} cy={36} r={3} fill={C.verde} />
				<circle cx={45} cy={36} r={3} fill={C.verde} />
			</pattern>
			<pattern id="alDots" width={44} height={44} patternUnits="userSpaceOnUse">
				<rect width={44} height={44} fill={C.verde} />
				<circle cx={11} cy={11} r={7} fill={C.flama} />
				<circle cx={33} cy={33} r={7} fill={C.cempa} />
				<circle cx={33} cy={11} r={3} fill={C.marfil} />
				<circle cx={11} cy={33} r={3} fill={C.marfil} />
			</pattern>
			<pattern id="alStripe" width={50} height={50} patternUnits="userSpaceOnUse" patternTransform="rotate(35)">
				<rect width={50} height={50} fill={C.cempa} />
				<rect width={14} height={50} fill={C.terracota} />
				<rect x={24} width={6} height={50} fill={C.marfil} />
			</pattern>
			<pattern id="alScale" width={40} height={34} patternUnits="userSpaceOnUse">
				<rect width={40} height={34} fill={C.terracota} />
				<path d="M 0 34 A 20 20 0 0 1 40 34" fill="none" stroke={C.flama} strokeWidth={5} />
				<circle cx={20} cy={22} r={4} fill={C.marfil} />
			</pattern>
		</defs>
	</svg>
);

// ---------- El alebrije (perfil, mira a la derecha) ----------
export const Alebrije: React.FC<{x: number; y: number; s?: number; t: number; flap?: number; assemble?: number; glow?: number}> = ({x, y, s = 1, t, flap = 1, assemble = 1, glow = 0}) => {
	const w = Math.sin(t * Math.PI * 2 * 1.4 * flap);
	const breath = 1 + 0.02 * Math.sin(t * 2.4);
	const blink = Math.sin(t * 1.3) > 0.97 ? 0.15 : 1;
	// cada pieza llega desde el humo
	const part = (k: number) => {
		const p = E.out(clamp((assemble - k * 0.08) / 0.5));
		return {transform: `translate(${(1 - p) * (hash(k, 1) - 0.5) * 900} ${(1 - p) * (hash(k, 2) - 0.5) * 700}) rotate(${(1 - p) * (hash(k, 3) - 0.5) * 90})`, opacity: p};
	};
	const feathers = (n: number, len: number, rot: number, cols: string[]) =>
		Array.from({length: n}).map((_, i) => (
			<g key={i} transform={`rotate(${rot + i * (95 / n)})`}>
					<path d={`M 0 0 C ${-len * 0.16} ${-len * 0.3} ${-len * 0.14} ${-len * 0.82} ${len * 0.02} ${-len} C ${len * 0.14} ${-len * 0.8} ${len * 0.15} ${-len * 0.3} 0 0 Z`} fill={cols[i % cols.length]} stroke={OUT} strokeWidth={4} />
					<path d={`M 0 ${-len * 0.08} L ${len * 0.015} ${-len * 0.92}`} stroke={OUT} strokeWidth={3} opacity={0.7} />
					<path d={`M ${-len * 0.06} ${-len * 0.62} q ${len * 0.07} ${-len * 0.1} ${len * 0.13} 0 M ${-len * 0.07} ${-len * 0.44} q ${len * 0.08} ${-len * 0.1} ${len * 0.15} 0`} stroke={i % 2 ? C.marfil : OUT} strokeWidth={3} fill="none" opacity={0.75} />
				</g>
		));
	return (
		<svg width={W} height={H} style={{position: 'absolute', inset: 0, overflow: 'visible'}}>
			<g transform={`translate(${x} ${y}) scale(${s})`}>
				{glow ? <ellipse rx={420} ry={260} fill={C.flama} opacity={0.18 * glow} style={{filter: 'blur(60px)'}} /> : null}
				{/* ala trasera */}
				<g {...part(0)}>
					<g transform={`translate(-30 -90) rotate(${-20 + w * 28})`}>{feathers(8, 300, -110, [C.verde, '#2f8a5e', C.flama])}</g>
				</g>
				{/* cola de lagartija en espiral */}
				<g {...part(1)}>
					<path d={`M -200 -10 C -320 0 -380 ${-80 + Math.sin(t * 2) * 20} -350 -160 C -330 -220 -260 -210 -270 -160 C -280 -120 -320 -130 -310 -160`} stroke="url(#alScale)" strokeWidth={46} fill="none" strokeLinecap="round" />
					<path d={`M -200 -10 C -320 0 -380 ${-80 + Math.sin(t * 2) * 20} -350 -160 C -330 -220 -260 -210 -270 -160 C -280 -120 -320 -130 -310 -160`} stroke={OUT} strokeWidth={54} fill="none" strokeLinecap="round" opacity={0.0} />
				</g>
				{/* patas */}
				<g {...part(2)} stroke={OUT} strokeWidth={5}>
					{[-140, -80, 90, 150].map((px, i) => (
						<g key={i} transform={`translate(${px} 60) rotate(${Math.sin(t * 3 + i) * 6})`}>
							<path d="M -22 0 L -18 110 L 22 110 L 22 0 Z" fill={i % 2 ? 'url(#alDots)' : 'url(#alZig)'} />
							<path d="M -24 110 l -10 20 M -6 112 l -4 22 M 12 112 l 4 22 M 24 110 l 12 18" stroke={C.marfil} strokeWidth={6} strokeLinecap="round" />
						</g>
					))}
				</g>
				{/* cuerpo de jaguar */}
				<g {...part(3)} transform={`${part(3).transform} scale(1 ${breath})`}>
					<path d="M -220 0 C -230 -110 -120 -150 0 -140 C 140 -130 230 -100 240 -10 C 250 60 160 90 0 86 C -150 90 -215 70 -220 0 Z" fill="url(#alStripe)" stroke={OUT} strokeWidth={7} />
					{Array.from({length: 7}).map((_, i) => (
						<circle key={i} cx={-150 + i * 50} cy={-30 + Math.sin(i) * 20} r={14} fill={PAL[i % 4]} stroke={OUT} strokeWidth={4} />
					))}
					<path d="M -200 40 C -100 70 100 70 220 30" stroke={C.verde} strokeWidth={14} fill="none" />
				</g>
				{/* cabeza con cuernos */}
				<g {...part(4)}>
					<g transform={`translate(230 -120) rotate(${Math.sin(t * 1.2) * 5})`}>
						<path d="M -40 40 C -60 -40 0 -110 80 -90 C 160 -70 210 -10 200 30 C 190 70 120 90 60 80 C 0 90 -30 80 -40 40 Z" fill="url(#alDots)" stroke={OUT} strokeWidth={7} />
						<path d="M 40 -84 C 20 -170 -60 -170 -50 -110 C -40 -80 0 -100 -10 -120" stroke={C.flama} strokeWidth={16} fill="none" strokeLinecap="round" />
						<path d="M 90 -88 C 120 -180 200 -170 180 -110" stroke={C.cempa} strokeWidth={14} fill="none" strokeLinecap="round" />
						{/* ojo */}
						<ellipse cx={100} cy={-20} rx={30} ry={30 * blink} fill={C.marfil} stroke={OUT} strokeWidth={5} />
						<ellipse cx={108} cy={-20} rx={12} ry={18 * blink} fill={OUT} />
						<circle cx={112} cy={-28} r={4} fill="#fff" opacity={blink} />
						{/* fauces y lengua */}
						<path d="M 120 50 C 160 60 190 50 205 34" stroke={OUT} strokeWidth={6} fill="none" />
						<path d={`M 190 46 C 230 60 ${250 + Math.sin(t * 6) * 10} 50 270 70`} stroke={C.terracota} strokeWidth={9} fill="none" strokeLinecap="round" />
						{Array.from({length: 5}).map((_, i) => (
							<path key={i} d={`M ${130 + i * 14} 48 l 5 12 l 5 -12`} fill={C.marfil} />
						))}
					</g>
				</g>
				{/* ala delantera */}
				<g {...part(5)}>
					<g transform={`translate(10 -110) rotate(${-10 + w * 34})`}>{feathers(9, 360, -112, [C.cempa, C.flama, C.terracota, C.marfil])}</g>
				</g>
			</g>
		</svg>
	);
};

// ---------- El alebrije en 3D: jaguar con alas de águila y cola de lagartija, todo pintado ----------
type PatKind = 'zig' | 'dots' | 'stripe' | 'scale';
const patCache: Partial<Record<PatKind, THREE.CanvasTexture>> = {};
const patTex = (k: PatKind) => {
	if (patCache[k]) return patCache[k]!;
	const cv = document.createElement('canvas');
	cv.width = 128;
	cv.height = 128;
	const g = cv.getContext('2d')!;
	if (k === 'zig') {
		g.fillStyle = C.flama;
		g.fillRect(0, 0, 128, 128);
		g.strokeStyle = C.terracota;
		g.lineWidth = 14;
		for (const y0 of [40, 104]) {
			g.beginPath();
			for (let x = 0; x <= 128; x += 32) g.lineTo(x, y0 + (x % 64 ? -26 : 0));
			g.stroke();
		}
		g.fillStyle = C.verde;
		for (const [x, y] of [[32, 70], [96, 70], [32, 6], [96, 6]]) {
			g.beginPath();
			g.arc(x, y, 6, 0, Math.PI * 2);
			g.fill();
		}
	} else if (k === 'dots') {
		g.fillStyle = C.verde;
		g.fillRect(0, 0, 128, 128);
		for (const [x, y, r, c] of [[32, 32, 16, C.flama], [96, 96, 16, C.cempa], [96, 32, 7, C.marfil], [32, 96, 7, C.marfil]] as const) {
			g.fillStyle = c;
			g.beginPath();
			g.arc(x, y, r, 0, Math.PI * 2);
			g.fill();
		}
	} else if (k === 'stripe') {
		g.fillStyle = C.cempa;
		g.fillRect(0, 0, 128, 128);
		g.save();
		g.translate(64, 64);
		g.rotate(0.6);
		for (let x = -200; x < 200; x += 64) {
			g.fillStyle = C.terracota;
			g.fillRect(x, -200, 22, 400);
			g.fillStyle = C.marfil;
			g.fillRect(x + 36, -200, 9, 400);
		}
		g.restore();
	} else {
		g.fillStyle = C.terracota;
		g.fillRect(0, 0, 128, 128);
		g.strokeStyle = C.flama;
		g.lineWidth = 9;
		for (let y = 0; y <= 128; y += 32)
			for (let x = (y / 32) % 2 ? 0 : 32; x <= 160; x += 64) {
				g.beginPath();
				g.arc(x, y + 32, 30, Math.PI, 0);
				g.stroke();
				g.fillStyle = C.marfil;
				g.beginPath();
				g.arc(x, y + 20, 6, 0, Math.PI * 2);
				g.fill();
			}
	}
	const t = new THREE.CanvasTexture(cv);
	t.colorSpace = THREE.SRGBColorSpace;
	t.wrapS = t.wrapT = THREE.RepeatWrapping;
	patCache[k] = t;
	return t;
};
const PatMat: React.FC<{k: PatKind; rep?: [number, number]}> = ({k, rep = [2, 2]}) => {
	const tex = React.useMemo(() => {
		const t = patTex(k).clone();
		t.needsUpdate = true;
		t.repeat.set(rep[0], rep[1]);
		return t;
	}, [k, rep[0], rep[1]]);
	return <meshStandardMaterial map={tex} roughness={0.55} emissiveMap={tex} emissive="#ffffff" emissiveIntensity={0.18} />;
};
const Solid: React.FC<{c: string}> = ({c}) => <meshStandardMaterial color={c} roughness={0.5} emissive={c} emissiveIntensity={0.12} />;

export const Alebrije3D: React.FC<{t: number; flap?: number; assemble?: number}> = ({t, flap = 1, assemble = 1}) => {
	const w = Math.sin(t * Math.PI * 2 * 1.4 * flap);
	const part = (k: number) => {
		const p = E.out(clamp((assemble - k * 0.08) / 0.5));
		return {position: [(1 - p) * (hash(k, 1) - 0.5) * 12, (1 - p) * (hash(k, 2) - 0.2) * 8, (1 - p) * (hash(k, 3) - 0.5) * 8] as [number, number, number], rotation: [(1 - p) * 3 * hash(k, 4), (1 - p) * 3 * hash(k, 5), 0] as [number, number, number], scale: 0.3 + 0.7 * p};
	};
	const tail = React.useMemo(() => {
		const pts = Array.from({length: 14}).map((_, i) => {
			const u = i / 13;
			const a = u * Math.PI * 2.6;
			const r = 0.7 * (1 - u * 0.75);
			return new THREE.Vector3(-1.1 - u * 1.3 - Math.sin(a) * r * 0.4, 0.9 + u * 1.2 + (Math.cos(a) - 1) * r * 0.6, Math.sin(a) * r * 0.3);
		});
		return new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 60, 0.16, 10, false);
	}, []);
	const horn = (sd: number, color: string) => {
		const pts = Array.from({length: 10}).map((_, i) => {
			const u = i / 9;
			const a = u * Math.PI * 1.6;
			return new THREE.Vector3(-Math.sin(a) * 0.25 * u - u * 0.15, u * 0.7 + Math.cos(a) * 0.05, sd * (0.18 + u * 0.15));
		});
		return (
			<mesh castShadow>
				<tubeGeometry args={[new THREE.CatmullRomCurve3(pts), 24, 0.05, 8, false]} />
				<Solid c={color} />
			</mesh>
		);
	};
	const feathers = (n: number, len: number, cols: string[], side: number) =>
		Array.from({length: n}).map((_, i) => {
			const a = (-0.2 + (i / (n - 1)) * 1.4) * side;
			return (
				<mesh key={i} rotation={[0, 0, a]} position={[0, 0, 0]}>
					<mesh position={[0, len / 2, 0]} scale={[0.22, len / 2, 0.02]} castShadow>
						<sphereGeometry args={[1, 12, 8]} />
						<Solid c={cols[i % cols.length]} />
					</mesh>
				</mesh>
			);
		});
	return (
		<group>
			{/* cuerpo de jaguar */}
			<group {...part(3)}>
				<mesh position={[0, 1.15, 0]} rotation={[0, 0, Math.PI / 2]} scale={[1, 1, 0.85]} castShadow>
					<capsuleGeometry args={[0.55, 1.5, 8, 20]} />
					<PatMat k="stripe" rep={[3, 2]} />
				</mesh>
				{Array.from({length: 6}).map((_, i) => (
					<mesh key={i} position={[-0.75 + i * 0.3, 1.68 - Math.abs(i - 2.5) * 0.03, 0]} castShadow>
						<sphereGeometry args={[0.1, 10, 8]} />
						<Solid c={PAL[i % 4]} />
					</mesh>
				))}
			</group>
			{/* patas */}
			<group {...part(2)}>
				{[[-0.75, 0.32], [-0.75, -0.32], [0.75, 0.32], [0.75, -0.32]].map(([x, z], i) => (
					<group key={i} position={[x, 0.7, z]} rotation={[0, 0, Math.sin(t * 3 + i) * 0.1]}>
						<mesh position={[0, -0.3, 0]} castShadow>
							<cylinderGeometry args={[0.16, 0.13, 0.75, 12]} />
							<PatMat k={i % 2 ? 'dots' : 'zig'} rep={[1, 1]} />
						</mesh>
						{[-0.08, 0, 0.08].map((dz, j) => (
							<mesh key={j} position={[0.12, -0.68, dz]} rotation={[0, 0, -1.3]}>
								<coneGeometry args={[0.03, 0.14, 6]} />
								<Solid c={C.marfil} />
							</mesh>
						))}
					</group>
				))}
			</group>
			{/* cola de lagartija en espiral */}
			<group {...part(1)}>
				<mesh geometry={tail} rotation={[0, 0, Math.sin(t * 2) * 0.05]} castShadow>
					<PatMat k="scale" rep={[8, 1]} />
				</mesh>
			</group>
			{/* cabeza con cuernos */}
			<group {...part(4)}>
				<group position={[1.35, 1.75, 0]} rotation={[0, 0, Math.sin(t * 1.2) * 0.08]}>
					<mesh scale={[1.15, 1, 0.9]} castShadow>
						<sphereGeometry args={[0.45, 20, 16]} />
						<PatMat k="dots" rep={[2, 1]} />
					</mesh>
					<mesh position={[0.45, -0.12, 0]} rotation={[0, 0, Math.PI / 2]} scale={[0.85, 1, 0.8]} castShadow>
						<capsuleGeometry args={[0.2, 0.35, 6, 12]} />
						<PatMat k="dots" rep={[1, 1]} />
					</mesh>
					{[-1, 1].map((sd) => (
						<group key={sd}>
							<mesh position={[0.25, 0.12, sd * 0.32]}>
								<sphereGeometry args={[0.12, 14, 10]} />
								<meshStandardMaterial color={C.marfil} roughness={0.3} />
							</mesh>
							<mesh position={[0.31, 0.12, sd * 0.4]}>
								<sphereGeometry args={[0.06, 10, 8]} />
								<meshStandardMaterial color="#120806" roughness={0.2} />
							</mesh>
							<group position={[-0.05, 0.35, 0]}>{horn(sd, sd > 0 ? C.flama : C.cempa)}</group>
						</group>
					))}
					<mesh position={[0.82, -0.18, 0]} rotation={[0, 0, -0.4 + Math.sin(t * 6) * 0.15]}>
						<cylinderGeometry args={[0.03, 0.02, 0.4, 6]} />
						<Solid c={C.terracota} />
					</mesh>
				</group>
			</group>
			{/* alas de águila (delantera y trasera) */}
			<group {...part(0)}>
				<group position={[-0.2, 1.75, -0.35]} rotation={[0.3 + w * 0.5, 0, 0]}>
					{feathers(8, 2.0, [C.verde, '#2f8a5e', C.flama], 1)}
				</group>
			</group>
			<group {...part(5)}>
				<group position={[0.1, 1.75, 0.35]} rotation={[-0.3 - w * 0.55, 0, 0]}>
					{feathers(9, 2.4, [C.cempa, C.flama, C.terracota, C.marfil], 1)}
				</group>
			</group>
		</group>
	);
};

const LucesAlebrije: React.FC = () => (
	<>
		<ambientLight intensity={0.35} />
		<directionalLight position={[-4, 7, 6]} intensity={2} color="#ffe0c0" castShadow shadow-mapSize={[1024, 1024]} />
		<directionalLight position={[5, 3, -5]} intensity={1.2} color={C.cempa} />
		<directionalLight position={[2, -2, 5]} intensity={0.4} color="#a080c0" />
	</>
);

const Humo: React.FC = () => {
	const f = useCurrentFrame();
	const t = f / FPS;
	const assemble = E.inOut(clamp((f - 30) / 70));
	return (
		<AbsoluteFill style={{background: '#070304'}}>
			<Light x={540} y={1100} r={1000} color={C.cempa} o={0.3} />
			<Smoke t={t + 3} x={400} y={1900} L={1.4} n={180} rate={26} rise={200} wind={30} seed={51} tint={C.arena} lightX={540} lightY={1100} />
			<Smoke t={t + 5} x={700} y={1950} L={1.1} n={150} rate={22} rise={180} wind={-24} seed={52} tint={C.marfil} lightX={540} lightY={1100} />
			<div style={{position: 'absolute', inset: 0, opacity: 0.25 + 0.75 * assemble}}>
				<Stage3D fov={40}>
					<Camera pos={[3, 2.6, 13.5]} look={[0.1, 2.3, 0]} />
					<LucesAlebrije />
					<Alebrije3D t={t} assemble={assemble} />
				</Stage3D>
			</div>
			<PaperTexture o={0.16} />
			<Kinetic text={'De un sueño de fiebre\nnacieron criaturas de colores…'} f={f} at={10} out={94} y={330} size={48} scrim={0.6} />
		</AbsoluteFill>
	);
};

const Retrato: React.FC = () => {
	const f = useCurrentFrame();
	const t = f / FPS + 4;
	const orb = lerp(0.35, -0.45, E.inOut(clamp(f / C05.S2)));
	return (
		<AbsoluteFill style={{background: 'radial-gradient(ellipse at 50% 55%, #2a1a0c, #070304 70%)'}}>
			<Light x={540} y={1000} r={900} color={C.flama} o={0.3} />
			{Array.from({length: 24}).map((_, i) => (
				<div key={i} style={{position: 'absolute', left: (hash(i, 1) * W + orb * 300 * (0.5 + hash(i, 2)) + W) % W, top: hash(i, 3) * H, width: 10 + 30 * hash(i, 4), height: 10 + 30 * hash(i, 4), borderRadius: '50%', background: PAL[i % PAL.length], opacity: 0.25, filter: 'blur(6px)'}} />
			))}
			<Stage3D fov={40}>
				<Camera pos={[Math.sin(orb) * 12.5, 2.6, Math.cos(orb) * 12.5]} look={[0.1, 2.3, 0]} />
				<LucesAlebrije />
				<Alebrije3D t={t} />
				<mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
					<circleGeometry args={[4, 40]} />
					<meshStandardMaterial color="#1a0e08" roughness={1} transparent opacity={0.6} />
				</mesh>
			</Stage3D>
			<PaperTexture o={0.16} />
			<Kinetic text={'Dicen que cada quien\ntiene uno que lo guía.'} f={f} at={12} out={104} y={330} size={50} scrim={0.6} />
		</AbsoluteFill>
	);
};

// vuelo: trayectoria en el mundo (de izquierda-abajo a derecha-arriba)
const vueloAt = (u: number): [number, number, number] => [lerp(-9, 9, u), lerp(-2, 4.5, u) + Math.sin(u * Math.PI) * 1.2, lerp(0, -3, u)];
const Vuelo: React.FC = () => {
	const f = useCurrentFrame();
	const t = f / FPS + 8;
	const u = E.inOut(clamp(f / C05.S3));
	const cam: [number, number, number] = [lerp(-3, 3, u), 0.5, 13];
	const look: [number, number, number] = [lerp(-2, 2, u), 1.2, 0];
	const pos = vueloAt(u);
	const ref = useCanvasDraw(
		(ctx) => {
			ctx.globalCompositeOperation = 'lighter';
			for (let k = 0; k < 90; k++) {
				const uu = u - k * 0.006;
				if (uu < 0) continue;
				const q = vueloAt(uu);
				const p = project([q[0] - 1.6, q[1] + 1.0, q[2]], cam, look, 45);
				const a = 1 - k / 90;
				ctx.fillStyle = rgba(PAL[k % PAL.length], a * 0.8);
				ctx.beginPath();
				ctx.arc(p.x + (hash(k, 1) - 0.5) * 40, p.y + (hash(k, 2) - 0.5) * 40, 3 + 6 * a, 0, Math.PI * 2);
				ctx.fill();
			}
		},
		[f],
	);
	return (
		<AbsoluteFill style={{background: 'linear-gradient(180deg,#05030a,#160a10 60%,#2a120a)'}}>
			{Array.from({length: 80}).map((_, i) => (
				<div key={i} style={{position: 'absolute', left: hash(i, 5) * W, top: hash(i, 6) * 1200, width: 3, height: 3, borderRadius: 2, background: '#FFF6E6', opacity: 0.4 + 0.4 * Math.sin(t * 2 + i)}} />
			))}
			<canvas ref={ref} width={W} height={H} style={{position: 'absolute', inset: 0}} />
			<Stage3D fov={45}>
				<Camera pos={cam} look={look} />
				<LucesAlebrije />
				<group position={pos} rotation={[0, -0.25, 0.25]} scale={1.05}>
					<Alebrije3D t={t} flap={1.8} />
				</group>
			</Stage3D>
			<PaperTexture o={0.16} />
			{void noise2D}
		</AbsoluteFill>
	);
};

const Numero: React.FC<{dias: number; fecha: string}> = ({dias, fecha}) => {
	const f = useCurrentFrame();
	const t = f / FPS;
	const txt = String(dias);
	const size = numSize(txt);
	const HIT = C05.HIT;
	const pats = ['alZig', 'alDots', 'alStripe', 'alScale'];
	// pinceladas diagonales que pintan el número con los patrones del alebrije
	const strokes = Array.from({length: 7}).map((_, i) => ({at: 6 + i * 7, y: NUM_Y - 300 + i * 100}));
	return (
		<AbsoluteFill style={{background: 'radial-gradient(ellipse at 50% 45%, #2a160c, #070304 70%)'}}>
			<Patrones />
			<Light x={540} y={NUM_Y} r={900} color={C.flama} o={0.3} />
			<svg width={W} height={H} style={{position: 'absolute', inset: 0}}>
				<defs>
					<mask id="c5num" maskUnits="userSpaceOnUse">
						<text x={540} y={NUM_Y + size * 0.35} textAnchor="middle" fontFamily="Rye" fontSize={size} fill="#fff">
							{txt}
						</text>
					</mask>
					<clipPath id="c5brush">
						{strokes.map((s, i) => {
							const p = E.out(clamp((f - s.at) / 16));
							return <rect key={i} x={100} y={s.y - 60} width={880 * p} height={120} transform={`rotate(-12 540 ${s.y})`} />;
						})}
					</clipPath>
				</defs>
				<g mask="url(#c5num)" clipPath="url(#c5brush)">
					{strokes.map((s, i) => (
						<rect key={i} x={0} y={s.y - 70} width={W} height={140} fill={`url(#${pats[i % 4]})`} transform={`rotate(-12 540 ${s.y})`} />
					))}
				</g>
				<text x={540} y={NUM_Y + size * 0.35} textAnchor="middle" fontFamily="Rye" fontSize={size} fill="none" stroke={OUT} strokeWidth={7} opacity={ramp(f, [HIT - 10, HIT], [0, 1])}>
					{txt}
				</text>
				<text x={540} y={NUM_Y + size * 0.35} textAnchor="middle" fontFamily="Rye" fontSize={size} fill="none" stroke={C.flama} strokeWidth={2} opacity={ramp(f, [HIT - 10, HIT], [0, 0.8])}>
					{txt}
				</text>
			</svg>
			<Stage3D fov={40}>
				<Camera pos={[0, 1.5, 14]} look={[0, 1.5, 0]} />
				<LucesAlebrije />
				<group position={[lerp(9, 1.6, E.out(clamp((f - HIT) / 34))), -3.6, 0]} rotation={[0, -0.5, 0]} scale={0.55}>
					<Alebrije3D t={t} />
				</group>
			</Stage3D>
			<Lockup f={f} at={HIT + 4} dias={dias} fecha={fecha} />
			<PaperTexture o={0.18} />
			<AbsoluteFill style={{background: '#000', opacity: ramp(f, [C05.REV - 8, C05.REV - 1], [0, 1], E.inOut)}} />
		</AbsoluteFill>
	);
};

export const Cap05: React.FC<{dias: number; fecha: string}> = ({dias, fecha}) => {
	const f = useCurrentFrame();
	const a = C05.S1;
	const b = a + C05.S2;
	const c = b + C05.S3;
	return (
		<AbsoluteFill style={{background: '#000'}}>
			<Sequence durationInFrames={a}>
				<Humo />
			</Sequence>
			<Sequence from={a} durationInFrames={C05.S2}>
				<Retrato />
			</Sequence>
			<Sequence from={b} durationInFrames={C05.S3}>
				<Vuelo />
			</Sequence>
			<Sequence from={c} durationInFrames={C05.REV}>
				<Numero dias={dias} fecha={fecha} />
			</Sequence>
			<LightLeak f={f} at={a} dur={16} />
			<Dip f={f} at={b} dur={10} />
			<LightLeak f={f} at={c} dur={14} color={C.cempa} />
		</AbsoluteFill>
	);
};
