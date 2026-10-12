import React from 'react';
import {AbsoluteFill, Sequence, useCurrentFrame} from 'remotion';
import {noise2D} from '@remotion/noise';
import {C, E, FPS, H, W, clamp, css, flicker, hash, lerp, mixRGB, ramp, rgba} from '../lib/util';
import {Light, PaperTexture, useCanvasDraw} from '../components/core';
import {drawPetal} from '../components/Particles';
import {Kinetic, Lockup} from './kit/type';
import {Dip, LightLeak} from './kit/transitions';
import {Xolo3D} from './c14';
import {Camera, Mountain, Stage3D, THREE, getPapelTex} from './kit/three';

// Capítulo 10 (REEL) · "El Mictlán" — para volver, primero hay que bajar los nueve niveles.
export const C10 = {INTRO: 84, LEVEL: 40, REV: 156, HIT: 72};
export const C10_DESC = C10.LEVEL * 9;
export const C10_LEN = C10.INTRO + C10_DESC + C10.REV;

const LEVELS = [
	{num: 'I', nah: 'Itzcuintlan', es: 'el río que se cruza con un perro', col: '#1a1420'},
	{num: 'II', nah: 'Tepeme Monamictlan', es: 'los cerros que chocan', col: '#3a1a12'},
	{num: 'III', nah: 'Iztepetl', es: 'el cerro de obsidiana', col: '#0c0a0e'},
	{num: 'IV', nah: 'Itzehecayan', es: 'el viento de navajas', col: '#1e1a1e'},
	{num: 'V', nah: 'Pancuecuetlacayan', es: 'donde todo ondea como bandera', col: '#16241e'},
	{num: 'VI', nah: 'Temiminaloyan', es: 'donde vuelan las flechas', col: '#2c1a0e'},
	{num: 'VII', nah: 'Teocoyocualloa', es: 'el lugar de los jaguares', col: '#3a2010'},
	{num: 'VIII', nah: 'Izmictlan Apochcalolca', es: 'las nueve aguas', col: '#0c1018'},
	{num: 'IX', nah: 'Chicunamictlan', es: 'el descanso', col: '#3a2412'},
];

// ---------- Roca en 3D: tubo de cueva / tiro vertical con facetas ----------
const Tubo: React.FC<{r: number; len: number; seed: number; color: string; axis?: 'y' | 'z'; pos?: [number, number, number]}> = ({r, len, seed, color, axis = 'y', pos = [0, 0, 0]}) => {
	const geo = React.useMemo(() => {
		const g = new THREE.CylinderGeometry(r, r, len, 28, Math.round(len / 3), true);
		const p = g.attributes.position as THREE.BufferAttribute;
		for (let i = 0; i < p.count; i++) {
			const x = p.getX(i);
			const y = p.getY(i);
			const z = p.getZ(i);
			const a = Math.atan2(z, x);
			const k = 1 + 0.18 * noise2D('tb' + seed, Math.cos(a) * 2 + y * 0.05, Math.sin(a) * 2) + 0.08 * noise2D('tc' + seed, a * 3, y * 0.2);
			p.setXYZ(i, x * k, y, z * k);
		}
		g.computeVertexNormals();
		return g;
	}, [r, len, seed]);
	return (
		<mesh geometry={geo} position={pos} rotation={axis === 'z' ? [Math.PI / 2, 0, 0] : [0, 0, 0]}>
			<meshStandardMaterial color={color} roughness={1} flatShading side={THREE.BackSide} />
		</mesh>
	);
};

// ---------- Introducción: la boca de la cueva ----------
const Entrada: React.FC = () => {
	const f = useCurrentFrame();
	const t = f / FPS;
	const dive = E.in(clamp((f - 30) / 54));
	const camZ = lerp(14, -60, dive);
	const ref = useCanvasDraw(
		(ctx) => {
			for (let i = 0; i < 70; i++) {
				const r = (q: number) => hash(i * 5 + q, 101);
				const p = (t * 0.35 + r(1)) % 1;
				const ang = r(2) * 6.28 + t * 0.5;
				const rad = (1 - p) * 700;
				drawPetal(ctx, 540 + Math.cos(ang) * rad, 960 + Math.sin(ang) * rad * 1.3, (1 - p) * 34 + 6, ang + t, Math.cos(t * 3 + i), 0.85, 0.9 * (1 - p * 0.6), r(3));
			}
		},
		[f],
	);
	return (
		<AbsoluteFill style={{background: '#020101'}}>
			<Light x={540} y={960} r={500} color={C.cempa} o={0.35 + 0.4 * dive} />
			<Stage3D fov={60}>
				<Camera pos={[Math.sin(t) * 0.4, 0.3, camZ]} look={[0, 0, camZ - 20]} roll={t * 0.12} />
				<fog attach="fog" args={['#0a0402', 5, 70]} />
				<ambientLight intensity={0.12} />
				<pointLight position={[0, 0, camZ - 25]} intensity={900} distance={60} color={C.cempa} />
				<pointLight position={[0, 2, camZ + 2]} intensity={40} distance={20} color="#8a6a5a" />
				<Tubo r={7} len={200} seed={101} color="#5a3422" axis="z" pos={[0, 0, -80]} />
			</Stage3D>
			<canvas ref={ref} width={W} height={H} style={{position: 'absolute', inset: 0}} />
			<PaperTexture o={0.16} />
			<Kinetic text={'Para volver,\nprimero hay que bajar.'} f={f} at={6} out={46} y={1420} size={54} scrim={0.4} />
		</AbsoluteFill>
	);
};

// ---------- Los nueve niveles en un tiro vertical ----------
const LV = 34; // distancia entre niveles
const lvY = (i: number) => -i * LV;

// Saliente de roca de cima plana donde ocurre cada nivel
const Plataforma: React.FC<{y: number; seed: number; color: string}> = ({y, seed, color}) => {
	const geo = React.useMemo(() => {
		const g = new THREE.CylinderGeometry(11, 5, 7, 14, 3);
		const p = g.attributes.position as THREE.BufferAttribute;
		for (let i = 0; i < p.count; i++) {
			const x = p.getX(i);
			const yy = p.getY(i);
			const z = p.getZ(i);
			const k = 1 + 0.15 * noise2D('pl' + seed, x * 0.2, z * 0.2);
			p.setXYZ(i, x * k, yy + (yy < 3.4 ? noise2D('py' + seed, x * 0.3, z * 0.3) * 0.8 : 0), z * k);
		}
		g.computeVertexNormals();
		return g;
	}, [seed]);
	return (
		<mesh geometry={geo} position={[0, y - 3.5, 0]} receiveShadow castShadow>
			<meshStandardMaterial color={color} roughness={1} flatShading />
		</mesh>
	);
};

const Dioramas: React.FC<{t: number; li: number}> = ({t, li}) => {
	const show = (k: number) => Math.abs(k - li) <= 1;
	const items: React.ReactNode[] = [];
	// I · el río que se cruza con un perro
	if (show(0)) {
		items.push(
			<group key="0" position={[0, lvY(0), 0]}>
				<mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.05, 0]}>
					<circleGeometry args={[9, 32]} />
					<meshStandardMaterial color="#0e1428" roughness={0.15} metalness={0.4} />
				</mesh>
				<group rotation={[0, -t * 0.6, 0]}>
					<Xolo3D pos={[0, 0.05, 1.9]} rotY={0} t={t} />
				</group>
			</group>,
		);
	}
	// II · los cerros que chocan
	if (show(1)) {
		const clash = Math.sin(t * 3) * 0.5 + 0.5;
		items.push(
			<group key="1" position={[0, lvY(1), 0]}>
				<Mountain pos={[-8 + clash * 4, 0, 2]} r={4.5} h={9} color="#9a4a2a" seed={11} />
				<Mountain pos={[8 - clash * 4, 0, 2]} r={4.5} h={10} color="#8a4026" seed={12} />
				<pointLight position={[0, 5, 2]} intensity={clash > 0.9 ? 400 : 0} distance={20} color={C.flama} />
			</group>,
		);
	}
	// III · el cerro de obsidiana
	if (show(2)) {
		items.push(
			<group key="2" position={[0, lvY(2), 0]}>
				{Array.from({length: 34}).map((_, k) => (
					<mesh key={k} position={[(hash(k, 3) - 0.5) * 16, 1 + hash(k, 4) * 9, (hash(k, 5) - 0.5) * 12]} rotation={[t * (hash(k, 6) - 0.5), t * 0.4 + k, hash(k, 7) * 3]} scale={[0.5, 1.6 + hash(k, 8) * 1.4, 0.5]}>
						<octahedronGeometry args={[0.9, 0]} />
						<meshStandardMaterial color="#0a0a10" roughness={0.18} metalness={0.35} />
					</mesh>
				))}
			</group>,
		);
	}
	// IV · el viento de navajas
	if (show(3)) {
		items.push(
			<group key="3" position={[0, lvY(3), 0]}>
				{Array.from({length: 48}).map((_, k) => {
					const a = hash(k, 9) * Math.PI * 2 + t * (2 + hash(k, 10));
					const r = 3 + hash(k, 11) * 7;
					return (
						<mesh key={k} position={[Math.cos(a) * r, 1.5 + hash(k, 12) * 8, Math.sin(a) * r]} rotation={[0, -a, 0.3]}>
							<boxGeometry args={[1.6, 0.06, 0.25]} />
							<meshStandardMaterial color="#c8c8d8" roughness={0.2} metalness={0.9} />
						</mesh>
					);
				})}
			</group>,
		);
	}
	// V · donde todo ondea como bandera
	if (show(4)) {
		const cols = [C.cempa, C.verde, C.flama, C.terracota, C.marfil, '#8a3a7a'];
		items.push(
			<group key="4" position={[0, lvY(4), 0]}>
				{[0, 1, 2].map((row) =>
					Array.from({length: 7}).map((_, k) => {
						const x = -9 + k * 3;
						const y = 3 + row * 3.4 - Math.sin(((k + 0.5) / 7) * Math.PI) * 0.8;
						return (
							<mesh key={row + '-' + k} position={[x, y, -2 + row * 2]} rotation={[Math.sin(t * 4 + k + row) * 0.35, Math.sin(t * 2 + k) * 0.25, 0]}>
								<planeGeometry args={[2.2, 2.8]} />
								<meshStandardMaterial map={getPapelTex()} color={cols[(k + row) % cols.length]} transparent alphaTest={0.5} side={THREE.DoubleSide} roughness={0.9} emissive={cols[(k + row) % cols.length]} emissiveIntensity={0.15} />
							</mesh>
						);
					}),
				)}
			</group>,
		);
	}
	// VI · donde vuelan las flechas
	if (show(5)) {
		items.push(
			<group key="5" position={[0, lvY(5), 0]}>
				{Array.from({length: 18}).map((_, k) => {
					const dir = k % 2 ? 1 : -1;
					const x = (((hash(k, 13) * 40 + t * 22 * (0.7 + hash(k, 14) * 0.6)) % 40) - 20) * dir;
					return (
						<group key={k} position={[x, 1.5 + hash(k, 15) * 8, (hash(k, 16) - 0.5) * 10]} rotation={[0, 0, (dir * -Math.PI) / 2]}>
							<mesh>
								<cylinderGeometry args={[0.1, 0.1, 4, 6]} />
								<meshStandardMaterial color={C.arena} />
							</mesh>
							<mesh position={[0, 2.2, 0]}>
								<coneGeometry args={[0.3, 0.8, 6]} />
								<meshStandardMaterial color="#1a1418" metalness={0.6} roughness={0.3} />
							</mesh>
							<mesh position={[0, -1.7, 0]}>
								<boxGeometry args={[0.8, 0.8, 0.03]} />
								<meshStandardMaterial color={C.verde} side={THREE.DoubleSide} />
							</mesh>
						</group>
					);
				})}
			</group>,
		);
	}
	// VII · el lugar de los jaguares
	if (show(6)) {
		const blink = Math.sin(t * 2.2) > 0.96 ? 0.1 : 1;
		items.push(
			<group key="6" position={[0, lvY(6), 0]}>
				{Array.from({length: 9}).map((_, k) => (
					<Mountain key={k} pos={[(hash(k, 17) - 0.5) * 18, 0, -3 - hash(k, 18) * 6]} r={2 + hash(k, 19) * 2} h={3 + hash(k, 20) * 4} color="#2a1a10" seed={60 + k} />
				))}
				{[[-3, 4, -1], [4, 3, -4], [0, 6, -7]].map(([x, y, z], k) => (
					<group key={'e' + k} position={[x, y, z]} scale={[1, blink, 1]}>
						{[-0.35, 0.35].map((dx) => (
							<mesh key={dx} position={[dx, 0, 0]} scale={[1.4, 0.8, 1]}>
								<sphereGeometry args={[0.16, 12, 8]} />
								<meshBasicMaterial color={C.flama} />
							</mesh>
						))}
					</group>
				))}
			</group>,
		);
	}
	// VIII · las nueve aguas
	if (show(7)) {
		items.push(
			<group key="7" position={[0, lvY(7), 0]}>
				{Array.from({length: 9}).map((_, k) => (
					<mesh key={k} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.1 + k * 0.9, 0]}>
						<ringGeometry args={[2 + k * 0.6 + Math.sin(t * 2 + k) * 0.15, 2.3 + k * 0.6 + Math.sin(t * 2 + k) * 0.15, 48]} />
						<meshBasicMaterial color="#6a8ab0" transparent opacity={0.35} side={THREE.DoubleSide} />
					</mesh>
				))}
				{Array.from({length: 9}).map((_, k) => (
					<mesh key={'f' + k} position={[Math.cos(k * 0.7 + t * 0.3) * (3 + k * 0.5), 0.4 + k * 0.9, Math.sin(k * 0.7 + t * 0.3) * (3 + k * 0.5)]}>
						<sphereGeometry args={[0.22, 10, 8]} />
						<meshBasicMaterial color={C.cempa} />
					</mesh>
				))}
			</group>,
		);
	}
	// IX · el descanso: un portal de luz
	if (show(8)) {
		items.push(
			<group key="8" position={[0, lvY(8), -2]}>
				{[-1, 1].map((sd) => (
					<mesh key={sd} position={[sd * 3.2, 3.5, 0]} castShadow>
						<boxGeometry args={[1.2, 7, 1.2]} />
						<meshStandardMaterial color="#2a1a10" roughness={1} flatShading />
					</mesh>
				))}
				<mesh position={[0, 7, 0]} castShadow>
					<torusGeometry args={[3.2, 0.6, 8, 24, Math.PI]} />
					<meshStandardMaterial color="#2a1a10" roughness={1} flatShading />
				</mesh>
				<mesh position={[0, 4.5, -0.1]}>
					<planeGeometry args={[5.2, 9]} />
					<meshBasicMaterial color="#FFE2A0" />
				</mesh>
				<pointLight position={[0, 4, 3]} intensity={500} distance={40} color={C.flama} />
			</group>,
		);
	}
	return <>{items}</>;
};

const Descenso: React.FC = () => {
	const f = useCurrentFrame();
	const t = f / FPS;
	const u = f / C10.LEVEL;
	const li = Math.min(8, Math.floor(u));
	const frac = u - Math.floor(u);
	// escalera suave: baja rápido y se detiene un momento en cada nivel
	const step = li >= 8 ? 0 : E.inOut(clamp((frac - 0.55) / 0.45));
	const lvl = Math.min(8, li) + step;
	const cy = -lvl * LV;
	const cam: [number, number, number] = [Math.sin(t * 0.5) * 3, cy + 15, 27];
	const look: [number, number, number] = [0, cy + 3.5, 0];
	const col = LEVELS[li].col;
	return (
		<AbsoluteFill style={{background: '#000', overflow: 'hidden'}}>
			<Stage3D fov={55}>
				<Camera pos={cam} look={look} />
				<fog attach="fog" args={[css(mixRGB(col, '#000', 0.3)), 18, 60]} />
				<ambientLight intensity={0.35} />
				<hemisphereLight args={['#b08a70', '#0a0604', 0.8]} />
				<pointLight position={[4, cy + 16, 12]} intensity={1400} distance={70} color="#f0b080" castShadow />
				<directionalLight position={[-10, cy + 30, 20]} intensity={1.4} color="#c8b8d8" />
				<directionalLight position={[6, cy + 8, -12]} intensity={1.0} color={C.flama} />
				<Tubo r={30} len={LV * 11} seed={102} color="#3a2418" pos={[0, -LV * 4, 0]} />
				{LEVELS.map((L, k) => (Math.abs(k - li) <= 1 ? <Plataforma key={k} y={lvY(k)} seed={200 + k} color={css(mixRGB(L.col, '#3a2a20', 0.6))} /> : null))}
				<Dioramas t={t} li={li} />
			</Stage3D>
			{li === 8 ? <Light x={540} y={900} r={900} color={C.flama} o={0.45 * clamp(frac * 2)} /> : null}
			{/* rótulo del nivel */}
			{(() => {
				const lf = frac * C10.LEVEL;
				const o = ramp(lf, [2, 10], [0, 1], E.out) * (li < 8 ? ramp(lf, [26, 34], [1, 0], E.in) : 1);
				const L = LEVELS[li];
				return (
					<div style={{position: 'absolute', left: 0, width: W, top: 300, textAlign: 'center', opacity: o, transform: `translateY(${(1 - o) * 16}px)`}}>
						<div style={{position: 'absolute', left: 0, top: -40, width: W, height: 300, background: 'linear-gradient(180deg, transparent, rgba(4,2,1,0.7) 35%, rgba(4,2,1,0.7) 65%, transparent)'}} />
						<div style={{position: 'relative', fontFamily: 'Rye', fontSize: 70, color: C.flama, textShadow: '0 0 20px rgba(242,109,61,0.6), 0 2px 8px #000'}}>{L.num}</div>
						<div style={{position: 'relative', fontFamily: 'Alike', fontSize: 40, color: C.marfil, letterSpacing: '0.04em', textShadow: '0 2px 10px #000'}}>{L.nah}</div>
						<div style={{position: 'relative', fontFamily: 'Alike', fontSize: 32, color: C.arena, opacity: 0.85, textShadow: '0 2px 10px #000'}}>{L.es}</div>
					</div>
				);
			})()}
			<PaperTexture o={0.16} />
			{void H}
		</AbsoluteFill>
	);
};

// ---------- Revelación: el número labrado en piedra ----------
const Piedra: React.FC<{dias: number; fecha: string}> = ({dias, fecha}) => {
	const f = useCurrentFrame();
	const t = f / FPS + 3;
	const txt = String(dias);
	const HIT = C10.HIT;
	const light = E.inOut(clamp((f - 20) / (HIT - 20)));
	const fill = E.out(clamp((f - HIT + 18) / 22));
	const fl = flicker(t, 10);
	const R = 380;
	const cy = 860;
	const size = txt.length > 1 ? 400 : 470;
	return (
		<AbsoluteFill style={{background: '#050302'}}>
			<Light x={540} y={cy} r={1100} color={C.cempa} o={0.15 + 0.4 * light} />
			{/* haz de luz desde arriba */}
			<div style={{position: 'absolute', left: 340, top: -200, width: 400, height: 1500, background: `linear-gradient(180deg, ${rgba(C.flama, 0.35 * light)}, transparent)`, filter: 'blur(30px)'}} />
			<svg width={W} height={H} style={{position: 'absolute', inset: 0}}>
				<defs>
					<radialGradient id="stone" cx="45%" cy="40%" r="70%">
						<stop offset="0%" stopColor={rgba(mixRGB('#2a2420', '#8a7a68', light))} />
						<stop offset="100%" stopColor={rgba(mixRGB('#120e0c', '#3a3028', light))} />
					</radialGradient>
				</defs>
				<circle cx={540} cy={cy + 14} r={R + 6} fill="#000" opacity={0.6} style={{filter: 'blur(10px)'}} />
				<circle cx={540} cy={cy} r={R} fill="url(#stone)" />
				{[0.93, 0.8, 0.66].map((k, i) => (
					<circle key={i} cx={540} cy={cy} r={R * k} fill="none" stroke="#0a0706" strokeOpacity={0.7} strokeWidth={6 - i} />
				))}
				{/* rayos y cuentas labradas */}
				{Array.from({length: 40}).map((_, k) => {
					const a = (k / 40) * Math.PI * 2;
					return <rect key={k} x={540 + Math.cos(a) * R * 0.86 - 8} y={cy + Math.sin(a) * R * 0.86 - 8} width={16} height={16} fill="#0a0706" opacity={0.55} transform={`rotate(${(a * 180) / Math.PI} ${540 + Math.cos(a) * R * 0.86} ${cy + Math.sin(a) * R * 0.86})`} />;
				})}
				{Array.from({length: 8}).map((_, k) => {
					const a = (k / 8) * Math.PI * 2 + Math.PI / 8;
					const x = 540 + Math.cos(a) * R * 0.73;
					const y = cy + Math.sin(a) * R * 0.73;
					return <path key={'r' + k} d={`M ${x} ${y} l ${Math.cos(a) * 40} ${Math.sin(a) * 40}`} stroke="#0a0706" strokeWidth={10} strokeLinecap="round" opacity={0.6} />;
				})}
				{/* el número: surco tallado y, al llegar la luz, lleno de fuego */}
				<text x={542} y={cy + size * 0.36 + 3} textAnchor="middle" fontFamily="Rye" fontSize={size} fill="#000" opacity={0.65}>
					{txt}
				</text>
				<text x={540} y={cy + size * 0.36} textAnchor="middle" fontFamily="Rye" fontSize={size} fill={rgba(mixRGB('#16100c', '#4a3c30', light))}>
					{txt}
				</text>
				<defs>
					<linearGradient id="lava" x1="0" y1="1" x2="0" y2="0">
						<stop offset="0%" stopColor={C.terracota} />
						<stop offset="40%" stopColor={C.cempa} />
						<stop offset="80%" stopColor={C.flama} />
						<stop offset="100%" stopColor="#FFF4D6" />
					</linearGradient>
					<clipPath id="fillUp">
						<rect x={0} y={cy + size * 0.4 - fill * size * 1.1} width={W} height={H} />
					</clipPath>
				</defs>
				<g clipPath="url(#fillUp)">
					<text x={540} y={cy + size * 0.36} textAnchor="middle" fontFamily="Rye" fontSize={size} fill="url(#lava)" style={{filter: `drop-shadow(0 0 ${14 + 8 * fl}px ${C.cempa})`}}>
						{txt}
					</text>
				</g>
			</svg>
			<Lockup f={f} at={HIT + 6} dias={dias} fecha={fecha} top={370} bottom={1270} />
			<PaperTexture o={0.18} />
			<AbsoluteFill style={{background: '#000', opacity: ramp(f, [C10.REV - 8, C10.REV - 1], [0, 1], E.inOut)}} />
		</AbsoluteFill>
	);
};

export const Cap10: React.FC<{dias: number; fecha: string}> = ({dias, fecha}) => {
	const f = useCurrentFrame();
	const a = C10.INTRO;
	const b = a + C10_DESC;
	return (
		<AbsoluteFill style={{background: '#000'}}>
			<Sequence durationInFrames={a}>
				<Entrada />
			</Sequence>
			<Sequence from={a} durationInFrames={C10_DESC}>
				<Descenso />
			</Sequence>
			<Sequence from={b} durationInFrames={C10.REV}>
				<Piedra dias={dias} fecha={fecha} />
			</Sequence>
			<Dip f={f} at={a} dur={10} />
			<LightLeak f={f} at={b} dur={18} />
		</AbsoluteFill>
	);
};
