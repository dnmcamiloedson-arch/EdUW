import React from 'react';
import {AbsoluteFill, spring, useCurrentFrame} from 'remotion';
import {C, E, FPS, H, W, clamp, css, flicker, hash, lerp, mixRGB, ramp, rgba} from '../lib/util';
import {Flame, Light, PaperTexture} from '../components/core';
import {Pompon} from '../components/Objetos';
import {Bokeh, Smoke} from '../components/Particles';
import {Kinetic, Lockup, NumberRise} from './kit/type';
import {Camera, Cempasuchil3D, Cordel3D, Pan3D, Stage3D, THREE, makeProjector} from './kit/three';

// Capítulo 3 (REEL) · "Poner la mesa" — el altar se arma pieza por pieza y cada una dice su porqué.
// Al final, la cámara entra en el retrato: ahí está el número.
export const SEG = 54;
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

// ---------- El altar en 3D ----------
// Niveles (ancho, alto, fondo) y su posición; arriba de cada uno se colocan las ofrendas visuales.
const TIERS = [
	{w: 6.2, h: 0.9, d: 2.2, y: 0.45, z: 0, cloth: C.cempa},
	{w: 4.7, h: 0.9, d: 1.6, y: 1.35, z: -0.45, cloth: C.terracota},
	{w: 3.3, h: 0.9, d: 1.1, y: 2.25, z: -0.75, cloth: C.verde},
];
const topY = (k: number) => TIERS[k].y + TIERS[k].h / 2;
// dónde mira la cámara para cada elemento (punto, distancia)
const FOCO3D: {p: [number, number, number]; d: number}[] = [
	{p: [0, 4.2, 0], d: 7.5},
	{p: [1.6, 2.2, -0.3], d: 3.2},
	{p: [0.55, 2.0, -0.3], d: 2.8},
	{p: [0, 2.9, -0.4], d: 5.2},
	{p: [-2.5, 0.7, 1.5], d: 5.0},
	{p: [0, 2.8, 0], d: 13},
	{p: [-1.35, 2.1, -0.3], d: 3.0},
	{p: [0.15, 2.05, -0.2], d: 2.8},
];
const VISTA_TOTAL = {p: [0, 2.7, 0] as [number, number, number], d: 12.5};
export const MARCO3D: [number, number, number] = [0, topY(2) + 0.62, -0.85];

// llegada de cada elemento: cae desde arriba con resorte
const useArrive = (f: number) => (i: number, delay = 8) => {
	const at = ELEM0 + i * SEG + delay;
	return spring({frame: f - at, fps: FPS, config: {stiffness: 110, damping: 13, mass: 0.9}});
};

let faldonTex: THREE.CanvasTexture | null = null;
const getFaldon = () => {
	if (faldonTex) return faldonTex;
	const cv = document.createElement('canvas');
	cv.width = 512;
	cv.height = 64;
	const g = cv.getContext('2d')!;
	const cols = [C.cempa, C.verde, C.flama, C.terracota, C.marfil];
	for (let k = 0; k < 8; k++) {
		g.fillStyle = cols[k % cols.length];
		const x = k * 64;
		g.beginPath();
		g.moveTo(x + 2, 0);
		g.lineTo(x + 62, 0);
		g.lineTo(x + 62, 48);
		g.lineTo(x + 47, 62);
		g.lineTo(x + 32, 48);
		g.lineTo(x + 17, 62);
		g.lineTo(x + 2, 48);
		g.closePath();
		g.fill();
		g.globalCompositeOperation = 'destination-out';
		g.beginPath();
		g.arc(x + 32, 22, 9, 0, Math.PI * 2);
		g.fill();
		g.globalCompositeOperation = 'source-over';
	}
	faldonTex = new THREE.CanvasTexture(cv);
	faldonTex.colorSpace = THREE.SRGBColorSpace;
	faldonTex.wrapS = THREE.RepeatWrapping;
	return faldonTex;
};

const Nivel3D: React.FC<{k: number; drop: number}> = ({k, drop}) => {
	const T = TIERS[k];
	const tex = React.useMemo(() => {
		const t = getFaldon().clone();
		t.needsUpdate = true;
		t.repeat.set(T.w / 0.9, 1);
		return t;
	}, [T.w]);
	return (
		<group position={[0, T.y, T.z]} scale={[1, Math.max(0.001, drop), 1]}>
			<mesh castShadow receiveShadow>
				<boxGeometry args={[T.w, T.h, T.d]} />
				<meshStandardMaterial color={T.cloth} roughness={0.85} />
			</mesh>
			<mesh position={[0, T.h / 2 + 0.005, 0]}>
				<boxGeometry args={[T.w + 0.02, 0.02, T.d + 0.02]} />
				<meshStandardMaterial color={C.marfil} roughness={0.8} />
			</mesh>
			{/* faldón de papel picado colgando del borde frontal */}
			<mesh position={[0, T.h / 2 - 0.18, T.d / 2 + 0.012]}>
				<planeGeometry args={[T.w, 0.34]} />
				<meshStandardMaterial map={tex} transparent alphaTest={0.4} side={THREE.DoubleSide} roughness={0.9} emissive="#ffffff" emissiveMap={tex} emissiveIntensity={0.12} />
			</mesh>
		</group>
	);
};

// cirio y veladora
const Cirio3D: React.FC<{pos: [number, number, number]; h: number; r?: number}> = ({pos, h, r = 0.09}) => (
	<group position={pos}>
		<mesh position={[0, h / 2, 0]} castShadow>
			<cylinderGeometry args={[r, r, h, 16]} />
			<meshStandardMaterial color={C.marfil} roughness={0.5} emissive="#5a3010" emissiveIntensity={0.25} />
		</mesh>
		<mesh position={[0, h * 0.45, 0]}>
			<cylinderGeometry args={[r + 0.005, r + 0.005, 0.07, 16]} />
			<meshStandardMaterial color={C.cempa} roughness={0.6} />
		</mesh>
	</group>
);
const Veladora3D: React.FC<{pos: [number, number, number]; color: string; glow: number}> = ({pos, color, glow}) => (
	<mesh position={[pos[0], pos[1] + 0.13, pos[2]]} castShadow>
		<cylinderGeometry args={[0.1, 0.1, 0.26, 14]} />
		<meshStandardMaterial color={color} transparent opacity={0.85} roughness={0.1} emissive={color} emissiveIntensity={0.25 + 0.9 * glow} />
	</mesh>
);
type Llama3 = {p: [number, number, number]; s: number};
export const VELAS3D: Llama3[] = [
	{p: [-1.1, topY(2) + 1.05, -0.95], s: 1.3},
	{p: [1.1, topY(2) + 1.05, -0.95], s: 1.3},
	...[-2.6, -1.6, -0.6, 0.6, 1.6, 2.6].map((x) => ({p: [x, topY(0) + 0.3, 0.75] as [number, number, number], s: 0.9})),
];

// calaverita de azúcar: cráneo con cuencas de flores, nariz de corazón y dientes
const Calaverita3D: React.FC<{pos: [number, number, number]; rotY?: number; s?: number}> = ({pos, rotY = 0, s = 1}) => (
	<group position={pos} rotation={[0, rotY, 0]} scale={s}>
		<mesh position={[0, 0.22, 0]} scale={[1, 1.05, 0.95]} castShadow>
			<sphereGeometry args={[0.22, 20, 16]} />
			<meshStandardMaterial color="#f7f0e4" roughness={0.6} />
		</mesh>
		<mesh position={[0, 0.07, 0.03]} castShadow>
			<boxGeometry args={[0.26, 0.12, 0.3]} />
			<meshStandardMaterial color="#f7f0e4" roughness={0.6} />
		</mesh>
		{[-1, 1].map((sd) => (
			<group key={sd} position={[sd * 0.085, 0.24, 0.18]}>
				<mesh>
					<sphereGeometry args={[0.06, 12, 10]} />
					<meshStandardMaterial color="#1a1018" roughness={0.3} />
				</mesh>
				{Array.from({length: 8}).map((_, i) => {
					const a = (i / 8) * Math.PI * 2;
					return (
						<mesh key={i} position={[Math.cos(a) * 0.075, Math.sin(a) * 0.075, -0.01]}>
							<sphereGeometry args={[0.02, 6, 4]} />
							<meshStandardMaterial color={i % 2 ? C.cempa : C.terracota} emissive={C.cempa} emissiveIntensity={0.2} />
						</mesh>
					);
				})}
			</group>
		))}
		<mesh position={[0, 0.16, 0.21]} rotation={[0, 0, Math.PI / 4]}>
			<boxGeometry args={[0.04, 0.04, 0.02]} />
			<meshStandardMaterial color={C.terracota} />
		</mesh>
		{Array.from({length: 5}).map((_, i) => (
			<mesh key={i} position={[-0.08 + i * 0.04, 0.06, 0.19]}>
				<boxGeometry args={[0.025, 0.05, 0.02]} />
				<meshStandardMaterial color="#e8dcc8" />
			</mesh>
		))}
		<mesh position={[0, 0.38, 0.12]} rotation={[0.6, 0, 0]}>
			<torusGeometry args={[0.07, 0.015, 6, 16]} />
			<meshStandardMaterial color={C.verde} />
		</mesh>
	</group>
);

const Marco3D: React.FC<{glow: number}> = ({glow}) => (
	<group position={MARCO3D}>
		{[
			[0, 0.6, 1.1, 0.16],
			[0, -0.6, 1.1, 0.16],
			[-0.47, 0, 0.16, 1.36],
			[0.47, 0, 0.16, 1.36],
		].map(([x, y, w, h], i) => (
			<mesh key={i} position={[x, y, 0]} castShadow>
				<boxGeometry args={[w, h, 0.1]} />
				<meshStandardMaterial color="#e6d6b8" roughness={0.6} />
			</mesh>
		))}
		{Array.from({length: 16}).map((_, i) => {
			const a = (i / 16) * Math.PI * 2;
			return (
				<mesh key={'c' + i} position={[Math.cos(a) * 0.5, Math.sin(a) * 0.64, 0.06]}>
					<sphereGeometry args={[0.035, 8, 6]} />
					<meshStandardMaterial color={i % 2 ? C.terracota : C.verde} />
				</mesh>
			);
		})}
		<mesh position={[0, 0, -0.02]}>
			<planeGeometry args={[0.8, 1.06]} />
			<meshBasicMaterial color={css(mixRGB('#2a1206', '#FFE9B0', 0.25 + 0.75 * glow))} />
		</mesh>
	</group>
);

// El altar completo; cada pieza aparece según f (frame del capítulo)
export const Altar3D: React.FC<{f: number; t: number; marcoGlow?: number}> = ({f, t, marcoGlow = 0}) => {
	const arrive = useArrive(f);
	const drop = (i: number, delay = 8) => (1 - arrive(i, delay)) * 3;
	const show = (i: number) => f >= ELEM0 + i * SEG + 6;
	const mantel = (k: number) => E.out(clamp((f - 14 - k * 9) / 22));
	const ignite = (i: number) => clamp((f - (ELEM0 + 3 * SEG + 14 + i * 3)) / 6);
	const arch = clamp((f - (ELEM0 + 5 * SEG + 6)) / 30);
	const fl = flicker(t, 33);
	const mq = spring({frame: f - PULL0 - 6, fps: FPS, config: {stiffness: 100, damping: 14}});
	return (
		<group>
			{/* luz general de las velas encendidas */}
			{show(3) ? <pointLight position={[0, 3.2, 1.2]} intensity={14 * fl * ignite(0)} distance={12} color={C.cempa} castShadow /> : null}
			{show(3) ? <pointLight position={[0, 1.4, 1.8]} intensity={8 * fl * ignite(4)} distance={8} color={C.flama} /> : null}
			{[0, 1, 2].map((k) => (
				<Nivel3D key={k} k={k} drop={mantel(2 - k)} />
			))}
			{/* 1 · papel picado */}
			{show(0) ? (
				<group position={[0, drop(0, 6) * 0.5, 0]}>
					<Cordel3D a={[-3.6, 5.2, -0.6]} b={[3.6, 5.2, -0.6]} n={8} sag={0.5} t={t} size={0.75} />
					<Cordel3D a={[-3.6, 4.7, 0.5]} b={[3.6, 4.7, 0.5]} n={8} sag={0.45} t={t + 1} size={0.7} seed={3} />
				</group>
			) : null}
			{/* 2 · agua */}
			{show(1) ? (
				<group position={[1.6, topY(1) + drop(1), -0.3]}>
					<mesh position={[0, 0.3, 0]}>
						<cylinderGeometry args={[0.2, 0.16, 0.6, 24, 1, true]} />
						<meshStandardMaterial color="#d8e8f0" transparent opacity={0.35} roughness={0.05} side={THREE.DoubleSide} />
					</mesh>
					<mesh position={[0, 0.22, 0]}>
						<cylinderGeometry args={[0.185, 0.155, 0.42, 24]} />
						<meshStandardMaterial color="#8ab0c8" transparent opacity={0.45} roughness={0.05} />
					</mesh>
				</group>
			) : null}
			{/* 3 · sal */}
			{show(2) ? (
				<group position={[0.55, topY(1) + drop(2), -0.3]}>
					<mesh position={[0, 0.12, 0]} rotation={[Math.PI, 0, 0]} castShadow>
						<sphereGeometry args={[0.28, 20, 10, 0, Math.PI * 2, 0, Math.PI / 2]} />
						<meshStandardMaterial color={C.terracota} roughness={0.9} side={THREE.DoubleSide} />
					</mesh>
					<mesh position={[0, 0.13, 0]} scale={[1, 0.45, 1]}>
						<sphereGeometry args={[0.25, 16, 10, 0, Math.PI * 2, 0, Math.PI / 2]} />
						<meshStandardMaterial color="#f8f4ee" roughness={0.95} />
					</mesh>
				</group>
			) : null}
			{/* 4 · velas */}
			{show(3) ? (
				<group position={[0, drop(3, 6), 0]}>
					<Cirio3D pos={[-1.1, topY(2), -0.95]} h={1.0} />
					<Cirio3D pos={[1.1, topY(2), -0.95]} h={1.0} />
					{[-2.6, -1.6, -0.6, 0.6, 1.6, 2.6].map((x, i) => (
						<Veladora3D key={i} pos={[x, topY(0), 0.75]} color={[C.terracota, C.cempa, C.verde, C.verde, C.cempa, C.terracota][i]} glow={ignite(i + 2) * fl} />
					))}
				</group>
			) : null}
			{/* 5 · copal */}
			{show(4) ? (
				<group position={[-2.7, drop(4), 1.7]}>
					<mesh position={[0, 0.15, 0]} castShadow>
						<cylinderGeometry args={[0.3, 0.22, 0.3, 16]} />
						<meshStandardMaterial color={C.terracota} roughness={0.9} />
					</mesh>
					<mesh position={[0, 0.31, 0]}>
						<cylinderGeometry args={[0.24, 0.24, 0.02, 16]} />
						<meshStandardMaterial color={C.cempa} emissive={C.flama} emissiveIntensity={0.6 + 0.4 * fl} />
					</mesh>
				</group>
			) : null}
			{/* 6 · cempasúchil: ramos y arco */}
			{show(5) ? (
				<>
					{[-3.5, 3.5].map((x, k) => (
						<group key={k} position={[x, drop(5, 4 + k * 4), 0.9]}>
							<mesh position={[0, 0.35, 0]} castShadow>
								<cylinderGeometry args={[0.3, 0.22, 0.7, 14]} />
								<meshStandardMaterial color={C.terracota} roughness={0.9} />
							</mesh>
							{Array.from({length: 7}).map((_, i) => (
								<Cempasuchil3D key={i} pos={[(hash(i, k + 5) - 0.5) * 0.7, 1.0 + hash(i, k + 6) * 0.6, (hash(i, k + 7) - 0.5) * 0.5]} s={0.16} rot={[0.4, hash(i, k) * 3, 0]} seed={i + k * 10} />
							))}
						</group>
					))}
					{Array.from({length: 40}).map((_, i) => {
						const u = i / 39;
						const order = Math.min(i, 39 - i) / 20;
						const q = E.out(clamp((arch - order * 0.6) / 0.25));
						if (q <= 0) return null;
						const a = Math.PI * u;
						return (
							<mesh key={i} position={[-Math.cos(a) * 3.3, 0.9 + Math.sin(a) * 4.6, -1.3]} scale={q}>
								<icosahedronGeometry args={[0.2, 1]} />
								<meshStandardMaterial color={i % 3 ? C.cempa : C.flama} roughness={0.8} flatShading emissive={C.cempa} emissiveIntensity={0.15} />
							</mesh>
						);
					})}
				</>
			) : null}
			{/* 7 · pan de muerto */}
			{show(6) ? <Pan3D pos={[-1.35, topY(1) + drop(6), -0.3]} s={0.3} /> : null}
			{/* 8 · calaveritas */}
			{show(7) ? (
				<>
					<Calaverita3D pos={[-0.1, topY(1) + drop(7, 8), -0.25]} rotY={0.25} s={0.85} />
					<Calaverita3D pos={[0.45 + 0.0, topY(1) + drop(7, 13), 0.15]} rotY={-0.3} s={0.7} />
				</>
			) : null}
			{/* retrato al centro (llega en la grúa final) */}
			{f >= PULL0 ? (
				<group position={[0, (1 - mq) * 2, 0]}>
					<Marco3D glow={marcoGlow} />
				</group>
			) : null}
			<mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
				<planeGeometry args={[40, 40]} />
				<meshStandardMaterial color="#1c0f08" roughness={1} />
			</mesh>
			<mesh position={[0, 4, -1.8]} receiveShadow>
				<planeGeometry args={[40, 12]} />
				<meshStandardMaterial color="#2a160c" roughness={1} />
			</mesh>
		</group>
	);
};

// Cámara: viaja de un elemento al siguiente
const camFoco = (f: number) => {
	const pts = [VISTA_TOTAL, ...FOCO3D, VISTA_TOTAL];
	let i: number;
	let u: number;
	if (f < ELEM0) [i, u] = [0, 0];
	else if (f < PULL0) {
		const k = Math.floor((f - ELEM0) / SEG);
		i = k;
		u = E.inOut(clamp((f - ELEM0 - k * SEG) / 14));
	} else {
		i = FOCO3D.length;
		u = E.inOut(clamp((f - PULL0) / 30));
	}
	const a = pts[i];
	const b = pts[i + 1];
	const p: [number, number, number] = [lerp(a.p[0], b.p[0], u), lerp(a.p[1], b.p[1], u), lerp(a.p[2], b.p[2], u)];
	// a mitad del viaje la cámara se abre un poco (grúa)
	const d = lerp(a.d, b.d, u) * (1 + 0.15 * Math.sin(Math.PI * u));
	return {p, d};
};

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
				<Kinetic text={e.name} f={f} at={at + 4} out={at + SEG - 6} y={300} size={e.name.length > 10 ? 78 : 92} font="Rye" color={C.flama} stagger={0.7} spacing="0.06em" scrim={0.65} />
				<Kinetic text={e.txt} f={f} at={at + 9} out={at + SEG - 6} y={420} size={44} stagger={0.35} />
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
	const push = E.inOut(clamp((rf - 6) / 44));
	const base = camFoco(Math.min(f, REV0));
	const sway = Math.sin(t * 0.4) * 0.35;
	const camBase: [number, number, number] = [base.p[0] + sway, base.p[1] + base.d * 0.12, base.p[2] + base.d];
	const lookBase = base.p;
	const camIn: [number, number, number] = [MARCO3D[0], MARCO3D[1], MARCO3D[2] + 0.35];
	const cam: [number, number, number] = rf > 0 ? [lerp(camBase[0], camIn[0], push), lerp(camBase[1], camIn[1], push), lerp(camBase[2], camIn[2], E.in(push))] : camBase;
	const look: [number, number, number] = rf > 0 ? [lerp(lookBase[0], MARCO3D[0], push), lerp(lookBase[1], MARCO3D[1], push), lerp(lookBase[2], MARCO3D[2], push)] : lookBase;
	const marcoGlow = rf > 0 ? push : 0.2 * clamp((f - PULL0 - 20) / 30);
	const P = makeProjector(cam, look, 45);
	const fl = flicker(t, 33);
	const ignite = (i: number) => clamp((f - (ELEM0 + 3 * SEG + 14 + i * 3)) / 6);
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
			{insideO < 1 ? (
				<>
					<Stage3D fov={45}>
						<Camera pos={cam} look={look} />
						<fog attach="fog" args={['#0a0503', 10, 40]} />
						<ambientLight intensity={0.22} />
						<hemisphereLight args={['#8a6a5a', '#0a0604', 0.35]} />
						<directionalLight position={[-4, 8, 8]} intensity={0.9} color="#ffd8b0" castShadow shadow-mapSize={[1024, 1024]} />
						<Altar3D f={Math.min(f, REV0 + 60)} t={t} marcoGlow={marcoGlow} />
					</Stage3D>
					{f >= ELEM0 + 3 * SEG + 6
						? VELAS3D.map((v, i) => {
								const g = i < 2 ? ignite(0) : ignite(i);
								if (g <= 0) return null;
								const p = P(...v.p);
								if (!p.ok) return null;
								return (
									<React.Fragment key={i}>
										<Light x={p.x} y={p.y} r={(1400 / p.d) * v.s} color={C.cempa} o={0.35 * fl} />
										<Flame x={p.x} y={p.y} size={(420 / p.d) * v.s} t={t + i * 1.7} seed={30 + i} grow={g} fl={fl} />
									</React.Fragment>
								);
							})
						: null}
					{f > ELEM0 + 4 * SEG + 16
						? (() => {
								const p = P(-2.7, 0.35, 1.7);
								return <Smoke t={(f - (ELEM0 + 4 * SEG + 16)) / FPS} x={p.x} y={p.y} L={1} n={110} rate={20} rise={260} wind={20} seed={33} tint={C.marfil} lightX={540} lightY={1000} />;
							})()
						: null}
				</>
			) : null}
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
