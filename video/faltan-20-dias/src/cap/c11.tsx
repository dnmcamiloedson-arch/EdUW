import React from 'react';
import {AbsoluteFill, Sequence, useCurrentFrame} from 'remotion';
import {noise2D} from '@remotion/noise';
import {C, E, FPS, H, W, clamp, flicker, hash, lerp, ramp, rgba} from '../lib/util';
import {Flame, Light, PaperTexture, useCanvasDraw} from '../components/core';
import {drawPetal} from '../components/Particles';
import {Fog, Orb, Sky} from './kit/land';
import {Kinetic, Lockup, NUM_Y, numSize} from './kit/type';
import {Dip} from './kit/transitions';
import {Camera, Range, Stage3D, THREE, project} from './kit/three';

// Capítulo 11 · "La Llorona" — en el río, alguien sigue buscando… y cada noche enciende una luz.
export const C11 = {S1: 126, S2: 96, S3: 72, REV: 126, HIT: 60};
export const C11_LEN = C11.S1 + C11.S2 + C11.S3 + C11.REV;

// ---------- La Llorona en 3D: río con sauces, rebozo de tela real y barquitas de papel ----------
// Rebozo: textura de algodón marfil con rayas finas y flecos (rapacejo) con transparencia
let rebozoTex: THREE.CanvasTexture | null = null;
const getRebozoTex = () => {
	if (rebozoTex) return rebozoTex;
	const cv = document.createElement('canvas');
	cv.width = 1024;
	cv.height = 384;
	const g = cv.getContext('2d')!;
	const fr = 90; // flecos a cada lado
	g.fillStyle = '#f4eee6';
	g.fillRect(fr, 0, cv.width - fr * 2, cv.height);
	for (let y = 0; y < cv.height; y += 6) {
		g.fillStyle = `rgba(150,140,160,${y % 48 < 6 ? 0.35 : 0.06})`;
		g.fillRect(fr, y, cv.width - fr * 2, 2);
	}
	for (let x = fr; x < cv.width - fr; x += 4) {
		g.fillStyle = 'rgba(120,110,120,0.05)';
		g.fillRect(x, 0, 1, cv.height);
	}
	// flecos anudados
	g.strokeStyle = '#ece4da';
	g.lineWidth = 3;
	for (const side of [0, 1]) {
		for (let k = 0; k < 40; k++) {
			const y = 6 + k * 9.4;
			const x0 = side ? cv.width - fr : fr;
			g.beginPath();
			g.moveTo(x0, y);
			g.quadraticCurveTo(x0 + (side ? 1 : -1) * 40, y + 6, x0 + (side ? 1 : -1) * (70 + (k % 3) * 8), y + 10);
			g.stroke();
		}
	}
	rebozoTex = new THREE.CanvasTexture(cv);
	rebozoTex.colorSpace = THREE.SRGBColorSpace;
	return rebozoTex;
};

// Tela flotante: malla que ondula con el agua (o con el viento)
const Tela: React.FC<{pos: [number, number, number]; t: number; rot?: [number, number, number]; s?: number; wind?: number; o?: number}> = ({pos, t, rot = [0, 0, 0], s = 1, wind = 0, o = 0.95}) => {
	const geo = React.useMemo(() => new THREE.PlaneGeometry(3, 1.1, 48, 18), []);
	const base = React.useMemo(() => Float32Array.from(geo.attributes.position.array as Float32Array), [geo]);
	React.useLayoutEffect(() => {
		const p = geo.attributes.position as THREE.BufferAttribute;
		for (let i = 0; i < p.count; i++) {
			const x = base[i * 3];
			const y = base[i * 3 + 1];
			const z = Math.sin(x * 2.2 + t * 1.4) * 0.07 + Math.sin(y * 3 + x * 1.3 - t * 0.9) * 0.05 + wind * (Math.sin(x * 1.6 - t * 5) * 0.35 + Math.sin(y * 4 + t * 4) * 0.15 + x * x * 0.08);
			p.setZ(i, z);
		}
		p.needsUpdate = true;
		geo.computeVertexNormals();
	});
	return (
		<mesh geometry={geo} position={pos} rotation={rot} scale={s} castShadow receiveShadow>
			<meshStandardMaterial map={getRebozoTex()} transparent alphaTest={0.1} opacity={o} side={THREE.DoubleSide} roughness={0.95} />
		</mesh>
	);
};

// Sauce llorón: tronco y cortina de ramas colgantes que se mecen
const Sauce3D: React.FC<{pos: [number, number, number]; t: number; seed: number; s?: number}> = ({pos, t, seed, s = 1}) => {
	const ref = React.useRef<THREE.InstancedMesh>(null);
	const N = 260;
	const strand = React.useMemo(() => {
		const g = new THREE.PlaneGeometry(0.12, 1, 1, 6);
		g.translate(0, -0.5, 0);
		return g;
	}, []);
	React.useLayoutEffect(() => {
		const o = new THREE.Object3D();
		for (let i = 0; i < N; i++) {
			const a = hash(i, seed) * Math.PI * 2;
			const r = 1.2 + 2.6 * Math.sqrt(hash(i, seed + 1));
			const top = 6.2 + 1.2 * Math.cos((r / 3.8) * 1.4);
			const len = 3.2 + 2.6 * hash(i, seed + 2);
			o.position.set(Math.cos(a) * r, top, Math.sin(a) * r);
			o.rotation.set(noise2D('sz' + seed, i * 0.2, t * 0.4) * 0.12, a + hash(i, seed + 3), noise2D('sx' + seed, i * 0.2, t * 0.4) * 0.12);
			o.scale.set(1, len, 1);
			o.updateMatrix();
			ref.current?.setMatrixAt(i, o.matrix);
		}
		if (ref.current) ref.current.instanceMatrix.needsUpdate = true;
	});
	return (
		<group position={pos} scale={s}>
			<mesh position={[0, 3, 0]} rotation={[0, 0, 0.08]} castShadow>
				<cylinderGeometry args={[0.25, 0.45, 6, 8]} />
				<meshStandardMaterial color="#120c0a" roughness={1} />
			</mesh>
			{/* ramas principales que se arquean */}
			{Array.from({length: 7}).map((_, k) => {
				const a = (k / 7) * Math.PI * 2 + seed;
				return (
					<mesh key={k} position={[Math.cos(a) * 1.3, 6.4, Math.sin(a) * 1.3]} rotation={[Math.sin(a) * 0.9, 0, -Math.cos(a) * 0.9]} castShadow>
						<cylinderGeometry args={[0.05, 0.12, 3, 5]} />
						<meshStandardMaterial color="#120c0a" roughness={1} />
					</mesh>
				);
			})}
			<instancedMesh ref={ref} args={[strand, undefined, N]} castShadow>
				<meshStandardMaterial color="#141c14" side={THREE.DoubleSide} roughness={1} />
			</instancedMesh>
		</group>
	);
};

// Barquita de papel doblado
const barcoGeo = (() => {
	const v = [
		// costados
		-0.5, 0.15, 0, 0.5, 0.15, 0, 0.32, -0.02, 0.14,
		-0.5, 0.15, 0, 0.32, -0.02, 0.14, -0.32, -0.02, 0.14,
		0.5, 0.15, 0, -0.5, 0.15, 0, -0.32, -0.02, -0.14,
		0.5, 0.15, 0, -0.32, -0.02, -0.14, 0.32, -0.02, -0.14,
		// fondo
		-0.32, -0.02, 0.14, 0.32, -0.02, 0.14, 0.32, -0.02, -0.14,
		-0.32, -0.02, 0.14, 0.32, -0.02, -0.14, -0.32, -0.02, -0.14,
		// vela triangular
		-0.34, 0.15, 0, 0.34, 0.15, 0, 0, 0.5, 0,
	];
	const g = new THREE.BufferGeometry();
	g.setAttribute('position', new THREE.Float32BufferAttribute(v, 3));
	g.computeVertexNormals();
	return g;
})();
type Barca = {p: [number, number, number]; rot: number; s: number};
const Barcas3D: React.FC<{items: Barca[]; t: number}> = ({items, t}) => (
	<group>
		{items.map((b, i) => (
			<group key={i} position={[b.p[0], b.p[1] + Math.sin(t * 1.5 + i) * 0.02, b.p[2]]} rotation={[Math.sin(t + i) * 0.05, b.rot, Math.sin(t * 1.3 + i) * 0.06]} scale={b.s}>
				<mesh geometry={barcoGeo} castShadow>
					<meshStandardMaterial color="#e8dcc6" side={THREE.DoubleSide} roughness={0.9} emissive="#5a3010" emissiveIntensity={0.25} />
				</mesh>
				<mesh position={[0.18, 0.2, 0.05]}>
					<cylinderGeometry args={[0.035, 0.035, 0.1, 10]} />
					<meshStandardMaterial color={C.marfil} emissive="#7a4010" emissiveIntensity={0.5} />
				</mesh>
			</group>
		))}
	</group>
);

// Río nocturno: agua translúcida sobre el reflejo de todo lo que está arriba
const Rio3D: React.FC<{above: React.ReactNode; fog?: [number, number]}> = ({above, fog = [10, 70]}) => (
	<>
		<fog attach="fog" args={['#0a0a12', fog[0], fog[1]]} />
		<hemisphereLight args={['#7a7aa0', '#08060a', 0.45]} />
		<directionalLight position={[20, 25, -40]} intensity={1.6} color="#e0d8f0" castShadow shadow-mapSize={[1024, 1024]} />
		{above}
		<group scale={[1, -1, 1]}>{above}</group>
		<mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.005, -20]}>
			<planeGeometry args={[300, 160]} />
			<meshBasicMaterial color="#06060c" transparent opacity={0.66} />
		</mesh>
	</>
);
const LomasRio: React.FC = () => <Range z={-70} x0={-90} x1={90} n={10} r={14} h={9} color="#100e18" seed={111} />;

const Rio: React.FC = () => {
	const f = useCurrentFrame();
	const t = f / FPS;
	const drift = ramp(f, [0, C11.S1], [0, 1], E.inOut);
	const cam: [number, number, number] = [lerp(-1.4, -0.4, drift), 2.6, 7];
	const look: [number, number, number] = [0.5, 1.2, -6];
	const above = (
		<>
			<LomasRio />
			<Sauce3D pos={[-6.5, 0, -2]} t={t} seed={111} />
			<Sauce3D pos={[7, 0, -9]} t={t + 2} seed={112} s={0.9} />
			<Sauce3D pos={[-3, 0, -18]} t={t + 4} seed={113} s={0.8} />
		</>
	);
	return (
		<AbsoluteFill>
			<Sky t={t} top="#030308" mid="#0a0a14" horizon="#16141e" hy={1120} stars={120} />
			<Orb x={760} y={500} r={58} color="#E8E0F0" core="#FFFFFF" halo={4} o={0.8} />
			<Stage3D fov={50}>
				<Camera pos={cam} look={look} />
				<Rio3D above={above} />
				<Tela pos={[lerp(-1.0, 0.9, drift), 0.04, -2.6]} rot={[-Math.PI / 2, 0, 0.3]} t={t} s={1.3} />
			</Stage3D>
			<div style={{position: 'absolute', left: 735, top: 1130, width: 50, height: 600, background: `linear-gradient(180deg, ${rgba('#E8E0F0', 0.24)}, transparent)`, filter: 'blur(8px)'}} />
			<Fog y={1150} color="#B8B0C8" o={0.12} h={300} />
			<PaperTexture o={0.16} />
			<Kinetic text={'Dicen que en el río\nalguien sigue buscando…'} f={f} at={14} out={110} y={1560} size={48} color="#EDE6F2" glow="#B8B0C8" scrim={0.4} />
		</AbsoluteFill>
	);
};

const BARCAS: Barca[] = Array.from({length: 11}).map((_, i) => ({p: [(hash(i, 113) - 0.5) * 9, 0.02, -hash(i, 114) * 16 + 2], rot: hash(i, 115) * 3, s: 0.9 + 0.4 * hash(i, 116)}));
const Velas: React.FC = () => {
	const f = useCurrentFrame();
	const t = f / FPS + 6;
	const fl = flicker(t, 11);
	const cam: [number, number, number] = [lerp(-0.8, 0.8, f / C11.S2), 1.6, 7];
	const look: [number, number, number] = [0, 0.4, -4];
	const items = BARCAS.map((b, i) => ({...b, p: [b.p[0] + t * 0.12 * (0.5 + hash(i, 117)), b.p[1], b.p[2]] as [number, number, number]}));
	const flames = items.map((b) => {
		const tip: [number, number, number] = [b.p[0] + Math.cos(b.rot) * 0.18 * b.s, b.p[1] + 0.26 * b.s, b.p[2] - Math.sin(b.rot) * 0.18 * b.s];
		return {a: project(tip, cam, look, 50), r: project([tip[0], -tip[1], tip[2]], cam, look, 50), d: Math.hypot(tip[0] - cam[0], tip[1] - cam[1], tip[2] - cam[2])};
	});
	return (
		<AbsoluteFill>
			<Sky t={t} top="#030308" mid="#08080f" horizon="#140f16" hy={900} stars={80} />
			<Stage3D fov={50}>
				<Camera pos={cam} look={look} />
				<Rio3D above={<><LomasRio /><Barcas3D items={items} t={t} /></>} />
				{items.slice(0, 4).map((b, i) => (
					<pointLight key={i} position={[b.p[0], 0.4, b.p[2]]} intensity={1.6 * fl} distance={3} color={C.cempa} />
				))}
			</Stage3D>
			{flames.map(({a, r, d}, i) => (
				<React.Fragment key={i}>
					<Light x={a.x} y={a.y} r={900 / d} color={C.cempa} o={0.4} />
					<div style={{position: 'absolute', left: r.x - 60 / d, top: r.y - 40 / d, width: 120 / d, height: 900 / d, background: `linear-gradient(180deg, ${rgba(C.flama, 0.4)}, transparent)`, filter: 'blur(3px)'}} />
					<Flame x={a.x} y={a.y + 4} size={380 / d} t={t + i} seed={300 + i} fl={fl} />
				</React.Fragment>
			))}
			<Fog y={940} color="#B8B0C8" o={0.08} h={240} />
			<PaperTexture o={0.16} />
			<Kinetic text={'…y cada noche\nenciende una luz.'} f={f} at={8} out={84} y={340} size={52} color="#EDE6F2" glow={C.cempa} scrim={0.4} />
		</AbsoluteFill>
	);
};

// El rebozo sube con el viento y se deshace en pétalos de cempasúchil
const Viento: React.FC = () => {
	const f = useCurrentFrame();
	const t = f / FPS + 9;
	const u = E.inOut(clamp(f / C11.S3));
	const ref = useCanvasDraw(
		(ctx) => {
			for (let i = 0; i < 160; i++) {
				const r = (q: number) => hash(i * 5 + q, 114);
				const born = r(1) * 0.7;
				const p = clamp((u - born) / 0.5);
				if (p <= 0) continue;
				const x = 540 + (r(2) - 0.5) * 420 + p * (200 + 500 * r(3)) + Math.sin(t * 2 + i) * 20;
				const y = 1150 - (r(4) - 0.5) * 80 - p * (600 + 600 * r(5));
				drawPetal(ctx, x, y, 22 + 16 * r(6), r(7) * 6.28 + t * 2, Math.cos(t * 4 + i), 0.85, 0.8 + 0.3 * r(8), r(9));
			}
		},
		[f],
	);
	return (
		<AbsoluteFill style={{background: '#050308'}}>
			<Light x={540} y={1100} r={900} color={C.cempa} o={0.3} />
			<Stage3D fov={50}>
				<Camera pos={[0, 1.5, 7]} look={[0, 2.5, 0]} />
				<hemisphereLight args={['#8a80a8', '#08060a', 0.5]} />
				<directionalLight position={[-3, 6, 4]} intensity={1.4} color="#e8e0f0" />
				<directionalLight position={[3, 1, -4]} intensity={1.2} color={C.cempa} />
				<Sauce3D pos={[-5.5, -1, -3]} t={t} seed={115} />
				<Sauce3D pos={[5.5, -1, -4]} t={t + 3} seed={116} />
				<Tela pos={[u * 1.2, 1.2 + u * 3.5, -u * 1.5]} rot={[-0.4 - u * 0.6, u * 0.8, 0.2 + u * 0.5]} t={t * 1.4} s={1 + u * 0.4} wind={0.5 + u} o={0.95 * (1 - u * u)} />
			</Stage3D>
			<canvas ref={ref} width={W} height={H} style={{position: 'absolute', inset: 0}} />
			<PaperTexture o={0.16} />
		</AbsoluteFill>
	);
};

const Reflejo: React.FC<{dias: number; fecha: string}> = ({dias, fecha}) => {
	const f = useCurrentFrame();
	const t = f / FPS + 12;
	const txt = String(dias);
	const HIT = C11.HIT;
	const DROP = 10;
	const rr = Math.max(0, (f - DROP) * 26);
	// el número tiembla en el agua y se aquieta al llegar la onda
	const calm = E.out(clamp((f - HIT) / 40));
	const size = numSize(txt);
	return (
		<AbsoluteFill style={{background: 'radial-gradient(ellipse at 50% 45%, #10101a, #030206 70%)'}}>
			{/* reflejo de la luna partido en bandas */}
			{Array.from({length: 30}).map((_, i) => {
				const y = 160 + i * 58;
				const off = Math.sin(t * 1.4 + i * 0.9) * (14 + (1 - calm) * 20);
				return <div key={i} style={{position: 'absolute', left: 0, top: y, width: W, height: 2, background: rgba('#D8D0E8', 0.04), transform: `translateX(${off}px)`}} />;
			})}
			{/* el número en el agua, revelado por la onda */}
			<div style={{position: 'absolute', inset: 0, clipPath: `circle(${rr}px at 540px ${NUM_Y}px)`}}>
				{Array.from({length: 24}).map((_, i) => {
					const band = size / 24;
					const top = NUM_Y - size / 2 + i * band;
					const off = Math.sin(t * 3 + i * 0.8) * (1 - calm) * 22 + Math.sin(t * 1.2 + i) * 2;
					return (
						<div key={i} style={{position: 'absolute', left: off, top, width: W, height: band + 1, overflow: 'hidden'}}>
							<div
								style={{
									position: 'absolute',
									left: 0,
									top: -i * band,
									width: W,
									height: size,
									lineHeight: `${size}px`,
									textAlign: 'center',
									fontFamily: 'Rye',
									fontSize: size,
									backgroundImage: `linear-gradient(180deg, #FFF6E0 0%, ${C.flama} 35%, ${C.cempa} 70%, ${C.terracota} 100%)`,
									WebkitBackgroundClip: 'text',
									backgroundClip: 'text',
									color: 'transparent',
									opacity: 0.55 + 0.45 * calm,
								}}
							>
								{txt}
							</div>
						</div>
					);
				})}
				<div style={{position: 'absolute', left: 0, width: W, top: NUM_Y - size / 2, height: size, lineHeight: `${size}px`, textAlign: 'center', fontFamily: 'Rye', fontSize: size, color: C.cempa, filter: 'blur(26px)', opacity: 0.5 * calm}}>
					{txt}
				</div>
			</div>
			{/* anillos de la gota */}
			<svg width={W} height={H} style={{position: 'absolute', inset: 0}}>
				{[0, 9, 18].map((d, k) => {
					const r2 = Math.max(0, (f - DROP - d) * 24);
					const o = clamp(1 - r2 / 1200) * (f > DROP + d ? 1 : 0);
					return <ellipse key={k} cx={540} cy={NUM_Y} rx={r2} ry={r2 * 0.42} fill="none" stroke={rgba('#F4EAD8', 0.5 * o)} strokeWidth={2.5} />;
				})}
				{f < DROP + 4 ? <circle cx={540} cy={lerp(200, NUM_Y, clamp(f / DROP))} r={7} fill="#FFF4D6" /> : null}
			</svg>
			<Lockup f={f} at={HIT + 4} dias={dias} fecha={fecha} />
			<PaperTexture o={0.14} />
			<AbsoluteFill style={{background: '#000', opacity: ramp(f, [C11.REV - 8, C11.REV - 1], [0, 1], E.inOut)}} />
		</AbsoluteFill>
	);
};

export const Cap11: React.FC<{dias: number; fecha: string}> = ({dias, fecha}) => {
	const f = useCurrentFrame();
	const a = C11.S1;
	const b = a + C11.S2;
	const c = b + C11.S3;
	return (
		<AbsoluteFill style={{background: '#000'}}>
			<Sequence durationInFrames={a}>
				<Rio />
			</Sequence>
			<Sequence from={a} durationInFrames={C11.S2}>
				<Velas />
			</Sequence>
			<Sequence from={b} durationInFrames={C11.S3}>
				<Viento />
			</Sequence>
			<Sequence from={c} durationInFrames={C11.REV}>
				<Reflejo dias={dias} fecha={fecha} />
			</Sequence>
			<Dip f={f} at={a} dur={16} />
			<Dip f={f} at={b} dur={12} />
			<Dip f={f} at={c} dur={12} />
		</AbsoluteFill>
	);
};
