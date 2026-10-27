// Día 0 · «Ya llegaron» — HOY · 28 · 10. Versión historia en 3D. La cámara es ella: entra por la puerta y sigue el
// camino de pétalos que su nieta le puso hasta el altar; a su paso los pétalos se levantan, las flamas despiertan y el
// vapor del café de olla se sopla dos veces. Luego la toma sube y deja ver el camino encendido: «Hoy, en cada altar,
// alguien vuelve a casa.» El outro con el logo de Westhill se agrega después.
import React, {useLayoutEffect, useMemo, useRef} from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import * as THREE from 'three';
import {E, clamp, hash, lerp} from '../lib/util';
import {Camera, Cempasuchil3D, Cordel3D, Pan3D, Stage3D} from '../cap/kit/three';
import {Glow3D, plasterTex, withRepeat, type V3} from '../cap/kit/fx3d';
import {LeyendaLockup, Line} from './kit/text';
import {Floor, Veladora, flick, petalGeo} from './d01_altares';

export const EP00_LEN = 450; // 15 s (+ outro)
const FPS = 30;
const LOCK = 378;
const FOV = 52;

// ---------- cámara: entra por la puerta, recorre el camino, llega al altar y sube ----------
type K = [number, V3, V3];
const KEYS: K[] = [
	[0, [0.05, 0.55, 6.6], [0, 0.35, 0]],
	[60, [0.25, 0.58, 4.4], [0, 0.45, -1]],
	[130, [0.1, 0.7, 1.9], [0, 0.75, -2.2]],
	[200, [0, 1.1, 0.45], [0, 1.0, -2.4]],
	[262, [0.1, 1.3, -0.45], [0, 1.12, -2.4]],
	[300, [0.15, 1.6, -0.2], [0, 1.0, -2.2]],
	[345, [0.4, 4.0, 2.6], [0, 0.5, -0.6]],
	[400, [0.1, 6.4, 3.4], [0, 0.2, 0.4]],
	[450, [0.05, 6.7, 3.5], [0, 0.2, 0.45]],
];
const cr = (p0: number, p1: number, p2: number, p3: number, u: number) => 0.5 * (2 * p1 + (-p0 + p2) * u + (2 * p0 - 5 * p1 + 4 * p2 - p3) * u * u + (-p0 + 3 * p1 - 3 * p2 + p3) * u * u * u);
const camAt = (f: number) => {
	let i = 0;
	while (i < KEYS.length - 2 && f > KEYS[i + 1][0]) i++;
	const k0 = KEYS[Math.max(0, i - 1)];
	const k1 = KEYS[i];
	const k2 = KEYS[i + 1];
	const k3 = KEYS[Math.min(KEYS.length - 1, i + 2)];
	const u = clamp((f - k1[0]) / (k2[0] - k1[0]));
	const v = (j: 1 | 2) => [0, 1, 2].map((a) => cr(k0[j][a], k1[j][a], k2[j][a], k3[j][a], u)) as V3;
	return {pos: v(1), look: v(2)};
};

// ---------- el camino de pétalos: de la puerta al altar ----------
const PATH_N = 1500;
const pathX = (z: number) => 0.32 * Math.sin(z * 0.75);
const PET = Array.from({length: PATH_N}, (_, i) => {
	const z = lerp(6.4, -1.7, hash(i, 1));
	const w = (hash(i, 2) - 0.5) * 0.62 * (z < -1.2 ? 1.6 : 1);
	return {x: pathX(z) + w, z, rot: hash(i, 3) * Math.PI * 2, tilt: (hash(i, 4) - 0.5) * 0.5, s: 1 + hash(i, 5) * 0.5, c: i % 4};
});
const PCOL = ['#d8621a', '#f08a22', '#c44d14', '#f5a02a'];
const PathPetals: React.FC<{f: number; t: number; who: V3}> = ({f, t, who}) => {
	const ref = useRef<THREE.InstancedMesh>(null);
	useLayoutEffect(() => {
		const m = ref.current;
		if (!m) return;
		const o = new THREE.Object3D();
		const col = new THREE.Color();
		PET.forEach((p, i) => {
			// a su paso los pétalos se levantan un poco y giran (alguien camina sobre ellos)
			const d = Math.hypot(p.x - who[0], p.z - who[2]);
			const lift = f < 230 ? Math.max(0, 1 - d / 0.9) : 0;
			const fl = lift * (0.06 + 0.05 * Math.sin(t * 7 + i));
			o.position.set(p.x, 0.01 + hash(i, 6) * 0.012 + fl, p.z);
			o.rotation.set(-Math.PI / 2 + p.tilt + lift * 0.8 * Math.sin(t * 5 + i), 0, p.rot + lift * t * 2);
			o.scale.setScalar(p.s);
			o.updateMatrix();
			m.setMatrixAt(i, o.matrix);
			col.set(PCOL[p.c]);
			m.setColorAt(i, col);
		});
		m.instanceMatrix.needsUpdate = true;
		if (m.instanceColor) m.instanceColor.needsUpdate = true;
	});
	return (
		<instancedMesh ref={ref} args={[petalGeo, undefined, PATH_N]}>
			<meshStandardMaterial side={THREE.DoubleSide} roughness={0.8} />
		</instancedMesh>
	);
};

// ---------- su foto: retrato sepia de una abuela riéndose tras la mano (sin rasgos finos) ----------
const portraitTex = (() => {
	let tex: THREE.CanvasTexture | null = null;
	return () => {
		if (tex) return tex;
		const c = document.createElement('canvas');
		c.width = 320;
		c.height = 420;
		const g = c.getContext('2d')!;
		const bg = g.createRadialGradient(160, 170, 20, 160, 210, 260);
		bg.addColorStop(0, '#d9c29a');
		bg.addColorStop(1, '#6e5436');
		g.fillStyle = bg;
		g.fillRect(0, 0, 320, 420);
		// rebozo sobre los hombros
		g.fillStyle = '#4a3420';
		g.beginPath();
		g.moveTo(30, 420);
		g.bezierCurveTo(40, 300, 90, 250, 160, 245);
		g.bezierCurveTo(230, 250, 280, 300, 290, 420);
		g.fill();
		g.strokeStyle = 'rgba(217,190,140,0.35)';
		g.lineWidth = 3;
		for (let k = 0; k < 7; k++) {
			g.beginPath();
			g.moveTo(60 + k * 30, 420);
			g.quadraticCurveTo(100 + k * 18, 330, 150 + k * 4, 262);
			g.stroke();
		}
		// cara y chongo
		g.fillStyle = '#a8865e';
		g.beginPath();
		g.ellipse(160, 175, 58, 72, 0, 0, Math.PI * 2);
		g.fill();
		g.fillStyle = '#3a2a1a';
		g.beginPath();
		g.ellipse(160, 120, 66, 40, 0, Math.PI, 0);
		g.fill();
		g.beginPath();
		g.arc(160, 92, 26, 0, Math.PI * 2);
		g.fill();
		// ojos cerrados de reír y una sonrisa apenas marcada
		g.strokeStyle = 'rgba(74,52,32,0.7)';
		g.lineWidth = 3;
		g.lineCap = 'round';
		for (const x of [137, 183]) {
			g.beginPath();
			g.arc(x, 172, 10, Math.PI * 1.2, Math.PI * 1.8);
			g.stroke();
		}
		g.beginPath();
		g.arc(160, 200, 16, Math.PI * 0.2, Math.PI * 0.8);
		g.stroke();
		// grano y desenfoque de foto vieja
		const tmp = document.createElement('canvas');
		tmp.width = 320;
		tmp.height = 420;
		const tg = tmp.getContext('2d')!;
		tg.filter = 'blur(3px) sepia(0.6) contrast(0.85)';
		tg.drawImage(c, 0, 0);
		g.clearRect(0, 0, 320, 420);
		g.drawImage(tmp, 0, 0);
		for (let k = 0; k < 2500; k++) {
			g.fillStyle = `rgba(${k % 2 ? 255 : 0},${k % 2 ? 240 : 0},${k % 2 ? 210 : 0},0.06)`;
			g.fillRect(hash(k, 7) * 320, hash(k, 8) * 420, 1.5, 1.5);
		}
		// viñeta y borde de foto vieja
		const v = g.createRadialGradient(160, 200, 120, 160, 210, 260);
		v.addColorStop(0, 'rgba(40,25,10,0)');
		v.addColorStop(1, 'rgba(40,25,10,0.7)');
		g.fillStyle = v;
		g.fillRect(0, 0, 320, 420);
		g.strokeStyle = '#efe3c8';
		g.lineWidth = 14;
		g.strokeRect(7, 7, 306, 406);
		tex = new THREE.CanvasTexture(c);
		tex.colorSpace = THREE.SRGBColorSpace;
		return tex;
	};
})();

// ---------- la sala y el altar ----------
const Room: React.FC = () => {
	const pl = plasterTex('sala0', {seed: 70, spanX: 8, spanY: 4, ppu: 96, base: '#b9875a', damp: 0.25, soot: 0.2, cracks: 6});
	const wall = useMemo(() => new THREE.MeshStandardMaterial({map: withRepeat(pl.map, 1, 1), bumpMap: withRepeat(pl.bump, 1, 1), bumpScale: 0.6, roughness: 0.95}), [pl]);
	const cloth = <meshStandardMaterial color="#efe6d6" roughness={0.85} />;
	return (
		<>
			<mesh position={[0, 2, -2.62]} material={wall} receiveShadow>
				<planeGeometry args={[8, 4]} />
			</mesh>
			{/* mesa con mantel y escalón */}
			<mesh position={[0, 0.42, -2.2]}>
				<boxGeometry args={[1.8, 0.84, 0.7]} />
				<meshStandardMaterial color="#3a2414" roughness={0.8} />
			</mesh>
			<mesh position={[0, 0.85, -2.2]}>
				<boxGeometry args={[1.9, 0.02, 0.8]} />
				{cloth}
			</mesh>
			<mesh position={[0, 0.62, -1.81]}>
				<boxGeometry args={[1.9, 0.46, 0.012]} />
				{cloth}
			</mesh>
			<mesh position={[0, 1.0, -2.4]}>
				<boxGeometry args={[1.2, 0.3, 0.36]} />
				{cloth}
			</mesh>
			{/* la foto */}
			<mesh position={[0, 1.39, -2.5]} rotation={[-0.12, 0, 0]}>
				<boxGeometry args={[0.4, 0.5, 0.03]} />
				<meshStandardMaterial color="#5a3a1e" roughness={0.6} />
			</mesh>
			<mesh position={[0, 1.39, -2.483]} rotation={[-0.12, 0, 0]}>
				<planeGeometry args={[0.32, 0.42]} />
				<meshStandardMaterial map={portraitTex()} roughness={0.7} />
			</mesh>
			{/* la puerta abierta al fondo: la noche de afuera */}
			<mesh position={[0, 1.1, 6.9]}>
				<planeGeometry args={[1.1, 2.2]} />
				<meshBasicMaterial color="#14283a" />
			</mesh>
		</>
	);
};

// vapor del café: bocanadas que suben; dos veces se van de lado (alguien sopla)
const Steam: React.FC<{f: number; t: number; cam: V3; at: V3}> = ({f, t, cam, at}) => {
	const blow = (f0: number) => {
		const d = f - f0;
		return d > 0 && d < 30 ? Math.sin((d / 30) * Math.PI) : 0;
	};
	const b = blow(222) + blow(246);
	return (
		<>
			{Array.from({length: 10}, (_, i) => {
				const life = (t * 0.35 + i / 10) % 1;
				const x = at[0] + Math.sin(t * 1.3 + i) * 0.02 + b * life * 0.35;
				return <Glow3D key={i} pos={[x, at[1] + 0.06 + life * 0.42 * (1 - b * 0.4), at[2] + b * life * 0.08]} size={0.09 + life * 0.18} cam={cam} color="#efe3d0" intensity={0.5 * (1 - life)} sharp={3} />;
			})}
		</>
	);
};

const World: React.FC<{f: number}> = ({f}) => {
	const t = f / FPS;
	const {pos, look} = camAt(f);
	// las velas del altar despiertan cuando ella llega
	const wake = (f0: number) => E.out(clamp((f - f0) / 14));
	const cup: V3 = [0.2, 0.86, -1.95];
	return (
		<>
			<Camera pos={pos} look={look} fov={FOV} />
			<fog attach="fog" args={['#0a0604', 5, 16]} />
			<hemisphereLight args={['#3a4a62', '#1a0e06', 0.25]} />
			{/* la luna fría que entra por la puerta */}
			<spotLight position={[0, 2.2, 7.2]} target-position={[0, 0, 3]} angle={0.5} penumbra={1} intensity={2.5} distance={0} decay={1.2} color="#8fb0d0" />
			<Floor />
			<Room />
			<PathPetals f={f} t={t} who={[pos[0], 0, pos[2] - 0.6]} />
			{/* veladoras del piso a lo largo del camino (encendidas desde el inicio) */}
			{[
				[-0.75, 4.6],
				[0.8, 3.0],
				[-0.7, 1.2],
				[0.75, -0.4],
			].map(([x, z], i) => (
				<Veladora key={i} X={x} Z={z} k={1} t={t} i={i + 3} cam={pos} sc={1.2} power={0.18} />
			))}
			{/* veladoras del altar */}
			{(
				[
					[-0.72, 0.86, -2.0, 140],
					[0.72, 0.86, -2.0, 150],
					[-0.4, 1.15, -2.32, 172],
					[0.4, 1.15, -2.32, 182],
				] as [number, number, number, number][]
			).map(([x, y, z, f0], i) => (
				<group key={i} position={[0, y, 0]}>
					<Veladora X={x} Z={z} k={0.25 + 0.75 * wake(f0)} t={t} i={i} cam={[pos[0], pos[1] - y, pos[2]]} sc={0.9} power={0.12} />
				</group>
			))}
			{/* pan de muerto, café de olla y flores en el altar */}
			<Pan3D pos={[-0.32, 0.86, -1.98]} s={0.04} rotY={0.4} />
			<Pan3D pos={[0.48, 0.86, -2.25]} s={0.034} rotY={1.2} />
			<mesh position={[cup[0], cup[1] + 0.045, cup[2]]}>
				<cylinderGeometry args={[0.05, 0.04, 0.09, 20]} />
				<meshStandardMaterial color="#8a4a26" roughness={0.75} />
			</mesh>
			<mesh position={[cup[0], cup[1] + 0.088, cup[2]]} rotation={[-Math.PI / 2, 0, 0]}>
				<circleGeometry args={[0.043, 20]} />
				<meshStandardMaterial color="#2a1408" roughness={0.3} />
			</mesh>
			<Steam f={f} t={t} cam={pos} at={cup} />
			{Array.from({length: 12}, (_, i) => {
				const x = -0.85 + (i % 6) * 0.34;
				const z = i < 6 ? -1.86 : -2.55;
				return <Cempasuchil3D key={i} pos={[x, i < 6 ? 0.86 : 1.15, z]} s={0.02} rot={[0.2, i, 0]} seed={i + 40} />;
			})}
			{Array.from({length: 10}, (_, i) => (
				<Cempasuchil3D key={`p${i}`} pos={[(i < 5 ? -1 : 1) * (1.0 + (i % 5) * 0.12), 0.02, -1.9 - (i % 3) * 0.2]} s={0.028} rot={[0, i * 1.7, 0]} seed={i + 60} />
			))}
			{/* papel picado */}
			<Cordel3D a={[-1.7, 2.55, -2.5]} b={[1.7, 2.55, -2.5]} n={9} sag={0.22} t={t} size={0.28} seed={1} />
			<Cordel3D a={[-1.7, 2.2, -2.45]} b={[1.7, 2.2, -2.45]} n={8} sag={0.18} t={t + 1} size={0.24} seed={4} />
			{/* luz del altar */}
			<pointLight position={[0, 1.6, -1.6]} intensity={1.2 * (0.4 + 0.6 * wake(150)) * flick(t, 2)} distance={0} decay={2} color="#ffb060" />
		</>
	);
};

const TEXTS = [
	{text: 'Abuela, tú decías:', at: 18, out: 122, y: 300, size: 58},
	{text: 'si la flama se mueve sola,\nes que ya llegaron.', at: 62, out: 122, y: 390, size: 58},
	{text: 'Pétalos desde la puerta,\npara que sepas llegar.', at: 132, out: 206, y: 300, size: 58},
	{text: 'Tu café de olla.\nSiempre le soplabas.', at: 214, out: 290, y: 300, size: 58},
	{text: 'Hoy, en cada altar,\nalguien vuelve a casa.', at: 300, out: 372, y: 300, size: 62},
];

export const Ep00: React.FC<{dias: number; fecha: string}> = ({dias, fecha}) => {
	const f = useCurrentFrame();
	const fadeIn = 1 - E.out(clamp(f / 18));
	return (
		<AbsoluteFill style={{background: '#0a0604'}}>
			<Stage3D fov={FOV} near={0.03} far={120}>
				<World f={f} />
			</Stage3D>
			<AbsoluteFill style={{background: 'radial-gradient(ellipse 75% 60% at 50% 50%, rgba(0,0,0,0) 55%, rgba(0,0,0,0.7) 100%)'}} />
			<AbsoluteFill style={{background: '#000', opacity: fadeIn}} />
			{TEXTS.map((p, i) => (
				<Line key={i} {...p} f={f} color="#efe3c8" mode="soft" scrim={0.35} />
			))}
			<AbsoluteFill style={{background: '#000', opacity: 0.5 * E.inOut(clamp((f - LOCK + 10) / 24))}} />
			{f >= LOCK ? <LeyendaLockup f={f} at={LOCK} dias={dias} fecha={fecha} /> : null}
		</AbsoluteFill>
	);
};
