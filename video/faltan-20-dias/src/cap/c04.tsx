import React from 'react';
import {AbsoluteFill, Sequence, useCurrentFrame} from 'remotion';
import {C, E, FPS, H, W, clamp, flicker, hash, lerp, ramp, rgba} from '../lib/util';
import {Flame, Light, PaperTexture, useCanvasDraw} from '../components/core';
import {Embers, PETAL_LAYERS, PetalRain} from '../components/Particles';
import {useGlyph} from '../countdown/reveals';
import {Orb, Sky} from './kit/land';
import {Kinetic, Lockup, NUM_Y, numSize} from './kit/type';
import {Dip, LightLeak} from './kit/transitions';
import {Camera, Mountain, Range, Stage3D, THREE, makeProjector, project} from './kit/three';

// Capítulo 4 · "El panteón" — la noche de velación: canoas en el lago, tumbas florecidas
// y, vistas desde el cielo, miles de velas que dibujan el número.
export const C04 = {S1: 120, S2: 108, S3: 72, REV: 132, HIT: 70};
export const C04_LEN = C04.S1 + C04.S2 + C04.S3 + C04.REV;

// ---------- Utilería 3D del capítulo ----------
// red de mariposa: textura de malla con transparencia
let redTex: THREE.CanvasTexture | null = null;
const getRedTex = () => {
	if (redTex) return redTex;
	const cv = document.createElement('canvas');
	cv.width = 256;
	cv.height = 128;
	const g = cv.getContext('2d')!;
	g.strokeStyle = 'rgba(210,190,170,0.9)';
	g.lineWidth = 2;
	for (let x = 0; x <= 256; x += 14) {
		g.beginPath();
		g.moveTo(x, 0);
		g.lineTo(x, 128);
		g.stroke();
	}
	for (let y = 0; y <= 128; y += 14) {
		g.beginPath();
		g.moveTo(0, y);
		g.lineTo(256, y);
		g.stroke();
	}
	g.lineWidth = 5;
	g.strokeRect(2, 2, 252, 124);
	redTex = new THREE.CanvasTexture(cv);
	return redTex;
};

// Canoa purépecha con pescador, red de mariposa y veladora en la proa
const Canoa3D: React.FC<{pos: [number, number, number]; rotY?: number; t: number; seed: number; net?: boolean}> = ({pos, rotY = 0, t, seed, net = true}) => {
	const bob = Math.sin(t * 1.4 + seed) * 0.04;
	return (
		<group position={[pos[0], pos[1] + bob, pos[2]]} rotation={[Math.sin(t + seed) * 0.03, rotY, Math.sin(t * 1.1 + seed * 2) * 0.03]}>
			<mesh scale={[2.4, 0.35, 0.5]} rotation={[Math.PI, 0, 0]} castShadow>
				<sphereGeometry args={[1, 24, 10, 0, Math.PI * 2, 0, Math.PI / 2]} />
				<meshStandardMaterial color="#2a1a12" roughness={0.8} side={THREE.DoubleSide} />
			</mesh>
			{/* pescador de pie con su remo */}
			<mesh position={[-0.9, 0.6, 0]} castShadow>
				<capsuleGeometry args={[0.16, 0.7, 4, 8]} />
				<meshStandardMaterial color="#120c0c" roughness={0.8} />
			</mesh>
			<mesh position={[-0.9, 1.2, 0]} castShadow>
				<sphereGeometry args={[0.14, 10, 8]} />
				<meshStandardMaterial color="#120c0c" roughness={0.8} />
			</mesh>
			<mesh position={[-0.6, 0.4, 0.2]} rotation={[0.3, 0, -0.6]} castShadow>
				<cylinderGeometry args={[0.025, 0.025, 2.2, 6]} />
				<meshStandardMaterial color="#1a120c" roughness={0.8} />
			</mesh>
			{net ? (
				<group position={[0.5, 0.2, 0]} rotation={[0, 0, -0.12 + Math.sin(t * 0.9 + seed) * 0.05]}>
					<mesh position={[0, 0.9, 0]}>
						<cylinderGeometry args={[0.025, 0.025, 1.8, 6]} />
						<meshStandardMaterial color="#1a120c" />
					</mesh>
					{[-1, 1].map((sd) => (
						<mesh key={sd} position={[0, 1.5, 0]} rotation={[0, sd > 0 ? 0.25 : Math.PI - 0.25, 0]}>
							<circleGeometry args={[1.0, 24, -Math.PI / 2, Math.PI]} />
							<meshStandardMaterial map={getRedTex()} transparent alphaTest={0.3} side={THREE.DoubleSide} color="#d8c8b8" roughness={1} />
						</mesh>
					))}
				</group>
			) : null}
			{/* veladora en la proa */}
			<mesh position={[1.9, 0.12, 0]}>
				<cylinderGeometry args={[0.08, 0.08, 0.18, 10]} />
				<meshStandardMaterial color={C.cempa} emissive={C.cempa} emissiveIntensity={0.6} />
			</mesh>
		</group>
	);
};
const proaDe = (pos: [number, number, number], rotY: number): [number, number, number] => [pos[0] + Math.cos(rotY) * 1.9, pos[1] + 0.32, pos[2] - Math.sin(rotY) * 1.9];

// Lápida con cruz y arco de cempasúchil
const TUMBAS3D = Array.from({length: 14}).map((_, i) => ({x: (i % 4) * 3.4 - 5.1 + ((Math.floor(i / 4) % 2) * 1.7), z: -Math.floor(i / 4) * 3.6 + 1, seed: i, rot: (hash(i, 7) - 0.5) * 0.25}));
const lapidaGeo = (() => {
	const sh = new THREE.Shape();
	sh.moveTo(-0.55, 0);
	sh.lineTo(-0.55, 0.9);
	sh.absarc(0, 0.9, 0.55, Math.PI, 0, true);
	sh.lineTo(0.55, 0);
	sh.closePath();
	return new THREE.ExtrudeGeometry(sh, {depth: 0.18, bevelEnabled: true, bevelSize: 0.03, bevelThickness: 0.03, bevelSegments: 2});
})();
const Tumba3D: React.FC<{x: number; z: number; rot: number; seed: number}> = ({x, z, rot, seed}) => (
	<group position={[x, 0, z]} rotation={[0, rot, 0]}>
		{/* montículo con pétalos */}
		<mesh position={[0, 0.12, 0.8]} scale={[0.75, 0.22, 1.2]} castShadow receiveShadow>
			<sphereGeometry args={[1, 16, 10, 0, Math.PI * 2, 0, Math.PI / 2]} />
			<meshStandardMaterial color="#2a1608" roughness={1} />
		</mesh>
		{Array.from({length: 30}).map((_, i) => (
			<mesh key={i} position={[(hash(i, seed) - 0.5) * 1.2, 0.2 + hash(i, seed + 1) * 0.06, 0.8 + (hash(i, seed + 2) - 0.5) * 2]}>
				<sphereGeometry args={[0.06, 6, 4]} />
				<meshStandardMaterial color={i % 2 ? C.cempa : C.terracota} emissive={C.cempa} emissiveIntensity={0.15} />
			</mesh>
		))}
		<mesh geometry={lapidaGeo} position={[0, 0, -0.2]} castShadow receiveShadow>
			<meshStandardMaterial color="#4a3a32" roughness={0.95} />
		</mesh>
		<mesh position={[0, 0.95, 0.02]}>
			<boxGeometry args={[0.1, 0.6, 0.04]} />
			<meshStandardMaterial color="#2a1e18" />
		</mesh>
		<mesh position={[0, 1.1, 0.02]}>
			<boxGeometry args={[0.36, 0.1, 0.04]} />
			<meshStandardMaterial color="#2a1e18" />
		</mesh>
		{/* arco de flores */}
		{Array.from({length: 30}).map((_, i) => {
			const a = Math.PI * (i / 29);
			return (
				<mesh key={'a' + i} position={[-Math.cos(a) * 0.95, 0.3 + Math.sin(a) * 1.6, 0.05]}>
					<icosahedronGeometry args={[0.085, 0]} />
					<meshStandardMaterial color={i % 3 ? C.cempa : C.flama} roughness={0.8} emissive={C.cempa} emissiveIntensity={0.2} flatShading />
				</mesh>
			);
		})}
		{/* veladoras */}
		{[-0.55, -0.2, 0.2, 0.55].map((vx, i) => (
			<mesh key={'v' + i} position={[vx, 0.1, 0.3 + (i % 2) * 0.12]}>
				<cylinderGeometry args={[0.06, 0.06, 0.18, 8]} />
				<meshStandardMaterial color={i % 2 ? C.cempa : C.terracota} emissive={C.cempa} emissiveIntensity={0.7} />
			</mesh>
		))}
	</group>
);

// ---------- 1 · El lago y la isla ----------
const ISLA_LUCES = Array.from({length: 170}).map((_, i) => {
	const a = hash(i, 1) * Math.PI * 2;
	const r = Math.sqrt(hash(i, 2)) * 15;
	const h = 10 * Math.max(0, 1 - r / 16) * 0.95;
	return [Math.cos(a) * r, h + 0.3, -80 + Math.sin(a) * r * 0.6] as [number, number, number];
});
const CANOAS = [
	{p: [-3, 0, -14] as [number, number, number], rot: 0.15, net: true, v: 0.5},
	{p: [3.5, 0, -6] as [number, number, number], rot: -0.25, net: true, v: 0.35},
	{p: [4.5, 0, 1.5] as [number, number, number], rot: 0.35, net: false, v: 0.25},
];
const Lago: React.FC = () => {
	const f = useCurrentFrame();
	const t = f / FPS;
	const u = E.inOut(clamp(f / C04.S1));
	const cam: [number, number, number] = [lerp(-2, 1, u), 3.2, lerp(16, 12, u)];
	const look: [number, number, number] = [0, 3.6, -40];
	const canoas = CANOAS.map((c, i) => ({...c, p: [c.p[0] - t * c.v + 2, c.p[1], c.p[2]] as [number, number, number], i}));
	const above = (
		<>
			<Range z={-150} x0={-160} x1={160} n={12} r={30} h={22} color="#120a10" seed={41} />
			<Mountain pos={[0, 0, -80]} r={16} h={10} color="#140a0c" seed={44} rough={0.12} scaleZ={0.7} />
			{canoas.map((c) => (
				<Canoa3D key={c.i} pos={c.p} rotY={c.rot} t={t} seed={c.i + 1} net={c.net} />
			))}
		</>
	);
	const P = makeProjector(cam, look, 45);
	const ref = useCanvasDraw(
		(ctx) => {
			ctx.globalCompositeOperation = 'lighter';
			ISLA_LUCES.forEach(([x, y, z], i) => {
				for (const yy of [y, -y]) {
					const p = P(x, yy, z);
					if (!p.ok) continue;
					const a = (0.5 + 0.5 * Math.sin(t * (3 + hash(i, 3) * 4) + i)) * (yy < 0 ? 0.3 : 0.9);
					const r = 5 + 2 * hash(i, 4);
					const gr = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, r * 2);
					gr.addColorStop(0, rgba('#FFE7B0', a));
					gr.addColorStop(1, rgba(C.cempa, 0));
					ctx.fillStyle = gr;
					ctx.fillRect(p.x - r * 2, p.y - r * 2, r * 4, r * 4);
				}
			});
		},
		[f],
	);
	return (
		<AbsoluteFill>
			<Sky t={t} top="#05030a" mid="#120a16" horizon="#2a1410" hy={1100} stars={160} />
			<Orb x={700} y={560} r={38} color="#F3E3C0" core="#FFFBEF" halo={4} o={0.9} />
			<Stage3D fov={45}>
				<Camera pos={cam} look={look} />
				<fog attach="fog" args={['#140c12', 30, 220]} />
				<hemisphereLight args={['#6a5a80', '#0a0608', 0.4]} />
				<directionalLight position={[40, 50, -150]} intensity={1.6} color="#e0d8f0" />
				<pointLight position={[0, 10, -78]} intensity={900} distance={50} color={C.cempa} />
				{canoas.map((c) => {
					const q = proaDe(c.p, c.rot);
					return <pointLight key={c.i} position={[q[0], q[1] + 0.4, q[2]]} intensity={8} distance={6} color={C.flama} />;
				})}
				{above}
				<group scale={[1, -1, 1]}>{above}</group>
				<mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, -60]}>
					<planeGeometry args={[600, 200]} />
					<meshBasicMaterial color="#06050a" transparent opacity={0.68} />
				</mesh>
			</Stage3D>
			<canvas ref={ref} width={W} height={H} style={{position: 'absolute', inset: 0}} />
			{/* camino de luna y llamas de las canoas */}
			<svg width={W} height={H} style={{position: 'absolute', inset: 0}}>
				{Array.from({length: 40}).map((_, i) => {
					const y = P(0, 0, -100).y + 6 + i * i * 0.45;
					const w = 20 + i * 4.5 * (0.6 + 0.4 * Math.sin(t * 2.2 + i * 1.7));
					return <rect key={i} x={700 - w / 2 + Math.sin(t * 1.3 + i) * 10} y={y} width={w} height={2 + i * 0.08} rx={2} fill="#FFF3D6" opacity={0.42 - i * 0.009} />;
				})}
			</svg>
			{canoas.map((c) => {
				const q = proaDe(c.p, c.rot);
				const p = P(q[0], q[1], q[2]);
				const fl = flicker(t, 40 + c.i);
				return (
					<React.Fragment key={c.i}>
						<Light x={p.x} y={p.y} r={2200 / p.d} color={C.flama} o={0.5 * fl} />
						<Flame x={p.x} y={p.y} size={900 / p.d} t={t} seed={70 + c.i} fl={fl} wick={false} />
					</React.Fragment>
				);
			})}
			<PaperTexture o={0.14} />
			<Kinetic text={'En la isla, esta noche\nnadie duerme.'} f={f} at={14} out={104} y={330} size={50} scrim={0.55} />
		</AbsoluteFill>
	);
};

// ---------- 2 · El panteón ----------
const Panteon: React.FC = () => {
	const f = useCurrentFrame();
	const t = f / FPS + 4;
	const u = E.inOut(clamp(f / C04.S2));
	const cam: [number, number, number] = [lerp(-1.2, 1.0, u), 2.4, lerp(7.5, 5.2, u)];
	const look: [number, number, number] = [0, 1.0, -4];
	const P = makeProjector(cam, look, 48);
	const llamas: {x: number; y: number; d: number; k: number}[] = [];
	TUMBAS3D.forEach((tb) => {
		[-0.55, -0.2, 0.2, 0.55].forEach((vx, i) => {
			const cx = Math.cos(tb.rot);
			const sx = Math.sin(tb.rot);
			const lx = vx;
			const lz = 0.3 + (i % 2) * 0.12;
			const p = P(tb.x + lx * cx + lz * sx, 0.2, tb.z - lx * sx + lz * cx);
			if (p.ok && p.d < 16) llamas.push({x: p.x, y: p.y, d: p.d, k: tb.seed * 10 + i});
		});
	});
	const fl = flicker(t, 90);
	return (
		<AbsoluteFill style={{background: 'linear-gradient(180deg, #05030a 0%, #140a10 45%, #1d0e08 60%, #0d0604 100%)'}}>
			<Sky t={t} top="#05030a" mid="#100812" horizon="#24110c" hy={900} stars={90} />
			<Stage3D fov={48}>
				<Camera pos={cam} look={look} />
				<fog attach="fog" args={['#1a0c08', 6, 26]} />
				<hemisphereLight args={['#6a5a80', '#0a0608', 0.35]} />
				<directionalLight position={[10, 14, -10]} intensity={0.7} color="#c8c0e0" />
				{TUMBAS3D.slice(0, 8).map((tb) => (
					<pointLight key={tb.seed} position={[tb.x, 0.6, tb.z + 0.6]} intensity={3 * fl} distance={5} color={C.cempa} />
				))}
				<mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
					<planeGeometry args={[60, 60]} />
					<meshStandardMaterial color="#160c06" roughness={1} />
				</mesh>
				{TUMBAS3D.map((tb) => (
					<Tumba3D key={tb.seed} {...tb} />
				))}
				{/* quien vela, de rodillas, con rebozo */}
				<group position={[1.4, 0, 2.6]} rotation={[0, -0.6, 0]}>
					<mesh position={[0, 0.45, 0]} scale={[1, 1, 0.8]} castShadow>
						<coneGeometry args={[0.45, 1.1, 14]} />
						<meshStandardMaterial color="#0c0808" roughness={1} />
					</mesh>
					<mesh position={[0, 1.08, 0]} castShadow>
						<sphereGeometry args={[0.17, 12, 10]} />
						<meshStandardMaterial color="#0c0808" roughness={1} />
					</mesh>
				</group>
			</Stage3D>
			{llamas.map((l) => (
				<React.Fragment key={l.k}>
					<Light x={l.x} y={l.y} r={900 / l.d} color={C.flama} o={0.35 * fl} />
					<Flame x={l.x} y={l.y} size={300 / l.d} t={t + l.k * 0.3} seed={l.k} fl={fl} wick={false} />
				</React.Fragment>
			))}
			<Embers t={t} n={40} L={0.7} seed={44} src={[100, 1000, 880, 600]} />
			<PetalRain t={t} layer={PETAL_LAYERS[2] ?? PETAL_LAYERS[0]} light={{x: 540, y: 1300, sigma: 700, L: 0.9}} fade={0.7} />
			<PaperTexture o={0.14} />
			<Kinetic text={'Se vela con flores,\ncon luz y con canto.'} f={f} at={10} out={94} y={330} size={50} scrim={0.6} />
		</AbsoluteFill>
	);
};

// ---------- 3 · Una vela enciende a otra ----------
const Encender: React.FC = () => {
	const f = useCurrentFrame();
	const t = f / FPS + 8;
	const lean = ramp(f, [4, 30], [0, 1], E.inOut) * (1 - ramp(f, [44, 66], [0, 1], E.inOut));
	const rot = -0.42 * lean;
	const ign = E.out(clamp((f - 30) / 14));
	const fl = flicker(t, 81);
	const cam: [number, number, number] = [lerp(-0.4, 0.4, f / C04.S3), 2.6, 5.2];
	const look: [number, number, number] = [0, 2.3, 0];
	const hA = 3.2;
	const hB = 2.6;
	const baseA: [number, number, number] = [-0.9, 0, 0];
	const tipA: [number, number, number] = [baseA[0] - Math.sin(rot) * (hA + 0.08), Math.cos(rot) * (hA + 0.08), 0];
	const tipB: [number, number, number] = [0.85, hB + 0.08, 0];
	const pA = project(tipA, cam, look, 40);
	const pB = project(tipB, cam, look, 40);
	const vela = (h: number) => (
		<>
			<mesh position={[0, h / 2, 0]} castShadow receiveShadow>
				<cylinderGeometry args={[0.32, 0.34, h, 28]} />
				<meshStandardMaterial color={C.marfil} roughness={0.45} emissive="#6a3a10" emissiveIntensity={0.12} />
			</mesh>
			{/* cera escurrida */}
			{[0.2, -0.15, 0.05].map((a, i) => (
				<mesh key={i} position={[Math.cos(a * 9) * 0.3, h - 0.25 - i * 0.12, Math.sin(a * 9) * 0.3]} scale={[0.35, 1.4 + i * 0.5, 0.35]}>
					<sphereGeometry args={[0.12, 10, 8]} />
					<meshStandardMaterial color="#f6efe0" roughness={0.35} />
				</mesh>
			))}
			<mesh position={[0, h + 0.05, 0]}>
				<cylinderGeometry args={[0.012, 0.012, 0.14, 6]} />
				<meshStandardMaterial color="#1a0d05" />
			</mesh>
		</>
	);
	return (
		<AbsoluteFill style={{background: 'radial-gradient(ellipse at 50% 55%, #24130a, #060303 70%)'}}>
			{Array.from({length: 18}).map((_, i) => (
				<div key={i} style={{position: 'absolute', left: hash(i, 1) * W - 60, top: 500 + hash(i, 2) * 1100, width: 60 + 90 * hash(i, 3), height: 60 + 90 * hash(i, 3), borderRadius: '50%', background: rgba(i % 3 ? C.flama : C.cempa, 0.12 + 0.12 * hash(i, 4)), filter: 'blur(14px)'}} />
			))}
			<Stage3D fov={40}>
				<Camera pos={cam} look={look} />
				<ambientLight intensity={0.15} />
				<pointLight position={[tipA[0], tipA[1] + 0.3, 0.3]} intensity={10 * fl} distance={10} color={C.flama} castShadow />
				<pointLight position={[tipB[0], tipB[1] + 0.3, 0.3]} intensity={10 * fl * ign} distance={10} color={C.flama} />
				<group position={baseA} rotation={[0, 0, rot]}>
					{vela(hA)}
				</group>
				<group position={[0.85, 0, 0]}>{vela(hB)}</group>
				<mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
					<planeGeometry args={[20, 20]} />
					<meshStandardMaterial color="#1a0d06" roughness={0.9} />
				</mesh>
			</Stage3D>
			<Light x={pA.x} y={pA.y - 30} r={620} color={C.flama} o={0.5 * fl} />
			<Light x={pB.x} y={pB.y - 30} r={620 * ign} color={C.flama} o={0.5 * ign * fl} />
			<Flame x={pA.x} y={pA.y + 6} size={120} t={t} seed={81} fl={fl} wick={false} />
			<Flame x={pB.x} y={pB.y + 6} size={120} t={t + 0.7} seed={82} grow={ign} fl={fl} wick={false} />
			{f > 28 && f < 50 ? <div style={{position: 'absolute', left: pB.x - 90, top: pB.y - 140, width: 180, height: 180, borderRadius: '50%', background: `radial-gradient(closest-side, ${rgba('#FFF6DA', 0.9)}, transparent)`, opacity: Math.sin(Math.PI * clamp((f - 28) / 22))}} /> : null}
			<PaperTexture o={0.14} />
			<Kinetic text={'Cada luz es un nombre\nque se recuerda.'} f={f} at={34} out={200} y={330} size={50} scrim={0.6} />
		</AbsoluteFill>
	);
};

// ---------- 4 · La grúa sube: desde el cielo, las velas del panteón escriben el número ----------
// Al final la cámara mira en picada desde 26.4 u con fov 40: 1 u del suelo = 100 px, y z = -1 cae en NUM_Y.
const PXU = 100;
const tumbasCampo = Array.from({length: 13 * 9}).map((_, i) => {
	const r = Math.floor(i / 9);
	const c = i % 9;
	return {x: (c - 4) * 1.5 + (r % 2) * 0.4 + (hash(i, 1) - 0.5) * 0.2, z: (r - 6) * 2.1 + (hash(i, 2) - 0.5) * 0.2, rot: (hash(i, 3) - 0.5) * 0.09, tone: Math.floor(hash(i, 4) * 3)};
});
const CampoTumbas: React.FC = () => {
	const ref = React.useRef<THREE.InstancedMesh>(null);
	const refH = React.useRef<THREE.InstancedMesh>(null);
	const refF = React.useRef<THREE.InstancedMesh>(null);
	const NF = 20;
	React.useLayoutEffect(() => {
		const o = new THREE.Object3D();
		const cols = ['#2a1e18', '#33251c', '#241a16'].map((c) => new THREE.Color(c));
		tumbasCampo.forEach((tb, i) => {
			o.position.set(tb.x, 0.08, tb.z);
			o.rotation.set(0, tb.rot, 0);
			o.scale.set(1, 1, 1);
			o.updateMatrix();
			ref.current?.setMatrixAt(i, o.matrix);
			ref.current?.setColorAt(i, cols[tb.tone]);
			o.position.set(tb.x - Math.sin(tb.rot) * -0.75, 0.3, tb.z - 0.75);
			o.updateMatrix();
			refH.current?.setMatrixAt(i, o.matrix);
			for (let p = 0; p < NF; p++) {
				const u = p / NF;
				const per = u * 2 * (0.96 + 1.7);
				let lx: number;
				let lz: number;
				if (per < 0.96) [lx, lz] = [-0.48 + per, -0.89];
				else if (per < 2.66) [lx, lz] = [0.52, -0.85 + (per - 0.96)];
				else if (per < 3.62) [lx, lz] = [0.48 - (per - 2.66), 0.89];
				else [lx, lz] = [-0.52, 0.85 - (per - 3.62)];
				o.position.set(tb.x + lx, 0.12, tb.z + lz);
				o.updateMatrix();
				refF.current?.setMatrixAt(i * NF + p, o.matrix);
				refF.current?.setColorAt(i * NF + p, new THREE.Color(p % 4 ? C.cempa : C.terracota));
			}
		});
		for (const r of [ref, refH, refF]) {
			if (!r.current) continue;
			r.current.instanceMatrix.needsUpdate = true;
			if (r.current.instanceColor) r.current.instanceColor.needsUpdate = true;
		}
	});
	return (
		<>
			<instancedMesh ref={ref} args={[undefined, undefined, tumbasCampo.length]} castShadow receiveShadow>
				<boxGeometry args={[0.96, 0.16, 1.7]} />
				<meshStandardMaterial roughness={0.95} />
			</instancedMesh>
			<instancedMesh ref={refH} args={[undefined, undefined, tumbasCampo.length]} castShadow>
				<boxGeometry args={[0.7, 0.5, 0.14]} />
				<meshStandardMaterial color="#3d2f26" roughness={0.95} />
			</instancedMesh>
			<instancedMesh ref={refF} args={[undefined, undefined, tumbasCampo.length * NF]}>
				<sphereGeometry args={[0.07, 6, 4]} />
				<meshStandardMaterial roughness={0.8} emissive={C.cempa} emissiveIntensity={0.25} />
			</instancedMesh>
		</>
	);
};

const Cielo: React.FC<{dias: number; fecha: string}> = ({dias, fecha}) => {
	const f = useCurrentFrame();
	const t = f / FPS + 12;
	const txt = String(dias);
	const size = numSize(txt);
	const HIT = C04.HIT;
	const g = useGlyph(txt, size, 22, 3);
	// grúa: de una vista baja entre las tumbas a la picada total
	const u = E.inOut(clamp(f / 84));
	const top: [number, number, number] = [0, 26.4, 0.0001];
	const low: [number, number, number] = [3, 2.2, 12];
	const cam: [number, number, number] = [lerp(low[0], top[0], u), lerp(low[1], top[1], u ** 0.8), lerp(low[2], top[2], u)];
	const look: [number, number, number] = [0, 0, -1 * u];
	const up: [number, number, number] = [0, 1 - u, -u];
	const P = makeProjector(cam, look, 40, up);
	const ref = useCanvasDraw(
		(ctx) => {
			ctx.globalCompositeOperation = 'lighter';
			const dot = (x: number, y: number, r: number, a: number) => {
				const gr = ctx.createRadialGradient(x, y, 0, x, y, r * 5);
				gr.addColorStop(0, rgba('#FFF6DA', a));
				gr.addColorStop(0.2, rgba(C.flama, a * 0.8));
				gr.addColorStop(1, rgba(C.cempa, 0));
				ctx.fillStyle = gr;
				ctx.fillRect(x - r * 5, y - r * 5, r * 10, r * 10);
			};
			// velas sueltas por todo el panteón
			const dim = lerp(0.6, 0.25, clamp((f - 50) / 40));
			for (let i = 0; i < 300; i++) {
				const p = P((hash(i, 11) - 0.5) * 14, 0.2, (hash(i, 12) - 0.5) * 26);
				if (!p.ok) continue;
				dot(p.x, p.y, Math.min(7, 70 / p.d), dim * (0.6 + 0.4 * Math.sin(t * (3 + hash(i, 13) * 3) + i)));
			}
			if (g) {
				const topP = g.pts.reduce((m, q) => (q[1] < m[1] ? q : m), g.pts[0]);
				g.pts.forEach(([gx, gy], i) => {
					const dd = Math.hypot(gx - topP[0], gy - topP[1]);
					const lit = 18 + dd / 14 + hash(i, 5) * 6;
					const a = E.out(clamp((f - lit) / 8));
					if (a <= 0) return;
					const p = P(gx / PXU, 0.2, gy / PXU - 1);
					if (!p.ok) return;
					dot(p.x, p.y, Math.min(9, 110 / p.d), a * (0.85 + 0.15 * Math.sin(t * 5 + i * 1.7)));
				});
			}
		},
		[f, g],
	);
	const glow = ramp(f, [HIT - 16, HIT + 10], [0, 1], E.inOut);
	return (
		<AbsoluteFill style={{background: '#140b07'}}>
			<Stage3D fov={40}>
				<Camera pos={cam} look={look} up={up} />
				<fog attach="fog" args={['#140b07', 20, 60]} />
				<ambientLight intensity={0.3} />
				<hemisphereLight args={['#8a6a5a', '#0a0604', 0.5]} />
				<directionalLight position={[6, 20, 8]} intensity={0.6} color="#c8b8d8" castShadow shadow-mapSize={[1024, 1024]} />
				<pointLight position={[0, 3, -1]} intensity={120 * (0.3 + 0.7 * glow)} distance={18} color={C.cempa} />
				<mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
					<planeGeometry args={[60, 60]} />
					<meshStandardMaterial color="#1a0f08" roughness={1} />
				</mesh>
				<CampoTumbas />
			</Stage3D>
			<canvas ref={ref} width={W} height={H} style={{position: 'absolute', inset: 0}} />
			{/* halo del número */}
			<div style={{position: 'absolute', left: 0, width: W, top: NUM_Y - size / 2, height: size, lineHeight: `${size}px`, textAlign: 'center', fontFamily: 'Rye', fontSize: size, color: C.cempa, filter: 'blur(34px)', opacity: 0.45 * glow, mixBlendMode: 'screen'}}>
				{txt}
			</div>
			<AbsoluteFill style={{opacity: glow, background: 'linear-gradient(180deg, transparent 17%, rgba(6,3,2,0.75) 21%, rgba(6,3,2,0.75) 27%, transparent 31%, transparent 57%, rgba(6,3,2,0.8) 60%, rgba(6,3,2,0.8) 70%, transparent 74%)'}} />
			<Lockup f={f} at={HIT + 2} dias={dias} fecha={fecha} />
			<PaperTexture o={0.12} />
			<AbsoluteFill style={{background: '#000', opacity: ramp(f, [C04.REV - 8, C04.REV - 1], [0, 1], E.inOut)}} />
		</AbsoluteFill>
	);
};

export const Cap04: React.FC<{dias: number; fecha: string}> = ({dias, fecha}) => {
	const f = useCurrentFrame();
	const a = C04.S1;
	const b = a + C04.S2;
	const c = b + C04.S3;
	return (
		<AbsoluteFill style={{background: '#000'}}>
			<Sequence durationInFrames={a}>
				<Lago />
			</Sequence>
			<Sequence from={a} durationInFrames={C04.S2}>
				<Panteon />
			</Sequence>
			<Sequence from={b} durationInFrames={C04.S3}>
				<Encender />
			</Sequence>
			<Sequence from={c} durationInFrames={C04.REV}>
				<Cielo dias={dias} fecha={fecha} />
			</Sequence>
			<Dip f={f} at={a} dur={14} />
			<LightLeak f={f} at={b} dur={16} />
			<Dip f={f} at={c} dur={12} />
		</AbsoluteFill>
	);
};
