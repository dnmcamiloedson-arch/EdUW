// 27 de octubre · llegan las almas de nuestras mascotas. Intro en negro con maullidos y ladridos y textos; luego, en 3D,
// huellitas de pétalos de cempasúchil (de perro y de gato) aparecen una a una sobre el piso y llevan hasta su altar:
// su foto, su plato, su agua, su collar con cascabel y su pelota. El agua tiembla, el cascabel suena: ya llegaron.
import React, {useLayoutEffect, useRef} from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import * as THREE from 'three';
import {E, clamp, hash, lerp} from '../lib/util';
import {Camera, Cempasuchil3D, Stage3D} from '../cap/kit/three';
import {Glow3D, type V3} from '../cap/kit/fx3d';
import {Line} from './kit/text';
import {Floor, Veladora, flick, petalGeo} from './d01_altares';

export const MASCOTAS_LEN = 480; // 16 s (+ outro)
const FPS = 30;
const SCENE = 180; // termina la intro en negro
const FOV = 50;

// ---------- cámara ----------
type K = [number, V3, V3];
const KEYS: K[] = [
	[180, [0.0, 0.45, 5.7], [0, 0.05, 2.6]],
	[262, [0.15, 0.55, 3.3], [0, 0.12, 0.6]],
	[335, [0.05, 0.72, 0.7], [0, 0.32, -2.0]],
	[385, [0.05, 0.85, -0.55], [0, 0.38, -2.1]],
	[436, [0.2, 4.2, 2.6], [0, 0.15, 0.1]],
	[480, [0.1, 5.1, 3.0], [0, 0.1, 0.4]],
];
const cr = (p0: number, p1: number, p2: number, p3: number, u: number) => 0.5 * (2 * p1 + (-p0 + p2) * u + (2 * p0 - 5 * p1 + 4 * p2 - p3) * u * u + (-p0 + 3 * p1 - 3 * p2 + p3) * u * u * u);
const camAt = (f: number) => {
	let i = 0;
	while (i < KEYS.length - 2 && f > KEYS[i + 1][0]) i++;
	const k0 = KEYS[Math.max(0, i - 1)];
	const k1 = KEYS[i];
	const k2 = KEYS[i + 1];
	const k3 = KEYS[Math.min(KEYS.length - 1, i + 2)];
	const u = E.inOut(clamp((f - k1[0]) / (k2[0] - k1[0])));
	const v = (j: 1 | 2) => [0, 1, 2].map((a) => cr(k0[j][a], k1[j][a], k2[j][a], k3[j][a], u)) as V3;
	return {pos: v(1), look: v(2)};
};

// ---------- huellitas de pétalos: cojinete + cuatro dedos; dos caminos (perro y gato) que llegan al altar ----------
type Print = {x: number; z: number; rot: number; s: number; at: number};
const trail = (x0: number, amp: number, phase: number, s: number, step: number, at0: number, gap: number, n: number): Print[] =>
	Array.from({length: n}, (_, j) => {
		const z = 4.5 - j * step;
		const side = j % 2 ? 1 : -1;
		const x = x0 + amp * Math.sin(z * 0.7 + phase) + side * 0.07 * s;
		const dx = amp * 0.7 * Math.cos(z * 0.7 + phase);
		return {x, z, rot: Math.atan2(dx, 1), s, at: at0 + j * gap};
	});
const PRINTS: Print[] = [...trail(-0.3, 0.22, 0, 2.0, 0.55, 192, 10, 11), ...trail(0.32, 0.18, 1.7, 1.35, 0.42, 200, 8, 14)];
const PAW = (() => {
	// posiciones locales (m) de los pétalos de una huella de perro de ~11 cm
	const pts: [number, number][] = [];
	for (let k = 0; k < 9; k++) {
		const a = (k / 9) * Math.PI * 2;
		pts.push([Math.cos(a) * 0.03 * (k % 2 ? 1 : 0.55), 0.03 + Math.sin(a) * 0.024 * (k % 2 ? 1 : 0.55)]);
	}
	const toes: [number, number][] = [
		[-0.062, -0.035],
		[-0.023, -0.075],
		[0.023, -0.075],
		[0.062, -0.035],
	];
	for (const [tx, tz] of toes) for (let k = 0; k < 3; k++) pts.push([tx + Math.cos(k * 2.1) * 0.006, tz + Math.sin(k * 2.1) * 0.006]);
	return pts;
})();
const NP = PRINTS.length * PAW.length;
const PCOL = ['#e0661a', '#f28a22', '#d4521a', '#f5a42a'];
// cada huella: cojinete (óvalo ancho) + cuatro deditos, de flor de cempasúchil aplastada, con pétalos sueltos alrededor
const PADS: [number, number, number, number][] = [
	[0, 0.035, 0.05, 0.04],
	[-0.058, -0.03, 0.018, 0.022],
	[-0.021, -0.068, 0.018, 0.023],
	[0.021, -0.068, 0.018, 0.023],
	[0.058, -0.03, 0.018, 0.022],
];
const padGeo = new THREE.CircleGeometry(1, 28);
const NPAD = PRINTS.length * PADS.length;
const Prints: React.FC<{f: number}> = ({f}) => {
	const pads = useRef<THREE.InstancedMesh>(null);
	const loose = useRef<THREE.InstancedMesh>(null);
	useLayoutEffect(() => {
		const o = new THREE.Object3D();
		const col = new THREE.Color();
		const pm = pads.current;
		const lm = loose.current;
		if (!pm || !lm) return;
		let a = 0;
		let b = 0;
		PRINTS.forEach((p, j) => {
			const k = clamp((f - p.at) / 8);
			const pop = k <= 0 ? 0 : E.out(k) * (1 + 0.2 * Math.sin(k * Math.PI));
			const c = Math.cos(p.rot);
			const sn = Math.sin(p.rot);
			const place = (lx: number, lz: number) => [p.x + (lx * c - lz * sn) * p.s, p.z + (lx * sn + lz * c) * p.s];
			PADS.forEach(([lx, lz, rx, rz], q) => {
				const [x, z] = place(lx, lz);
				o.position.set(x, 0.006 + q * 0.0005, z);
				o.rotation.set(-Math.PI / 2, 0, -p.rot);
				o.scale.set(rx * p.s * pop, rz * p.s * pop, 1);
				o.updateMatrix();
				pm.setMatrixAt(a, o.matrix);
				col.set(q === 0 ? '#e8701c' : '#f28a24');
				pm.setColorAt(a, col);
				a++;
			});
			PAW.forEach(([lx, lz], q) => {
				const [x, z] = place(lx * 1.25, lz * 1.25);
				o.position.set(x, 0.012 + hash(b, 2) * 0.006, z);
				o.rotation.set(-Math.PI / 2 + (hash(b, 3) - 0.5) * 0.4, 0, hash(b, 4) * Math.PI * 2);
				o.scale.setScalar(pop * p.s * (0.12 + hash(b, 5) * 0.06));
				o.updateMatrix();
				lm.setMatrixAt(b, o.matrix);
				col.set(PCOL[(j + q) % 4]);
				lm.setColorAt(b, col);
				b++;
			});
		});
		for (const m of [pm, lm]) {
			m.instanceMatrix.needsUpdate = true;
			if (m.instanceColor) m.instanceColor.needsUpdate = true;
		}
	});
	return (
		<>
			<instancedMesh ref={pads} args={[padGeo, undefined, NPAD]}>
				<meshStandardMaterial roughness={0.7} emissive="#b0400a" emissiveIntensity={0.45} />
			</instancedMesh>
			<instancedMesh ref={loose} args={[petalGeo, undefined, NP]}>
				<meshStandardMaterial side={THREE.DoubleSide} roughness={0.75} emissive="#a03a08" emissiveIntensity={0.25} />
			</instancedMesh>
		</>
	);
};

// ---------- su foto: un perrito y un gatito sentados, en sepia ----------
const petPhoto = (() => {
	let tex: THREE.CanvasTexture | null = null;
	return () => {
		if (tex) return tex;
		const c = document.createElement('canvas');
		c.width = 360;
		c.height = 300;
		const g = c.getContext('2d')!;
		const bg = g.createRadialGradient(180, 140, 20, 180, 160, 230);
		bg.addColorStop(0, '#dcc49c');
		bg.addColorStop(1, '#6c5236');
		g.fillStyle = bg;
		g.fillRect(0, 0, 360, 300);
		g.fillStyle = '#3e2a18';
		// perrito sentado (izquierda)
		g.beginPath();
		g.ellipse(120, 215, 52, 62, 0, 0, Math.PI * 2);
		g.fill();
		g.beginPath();
		g.ellipse(120, 128, 38, 34, 0, 0, Math.PI * 2);
		g.fill();
		g.beginPath();
		g.ellipse(88, 125, 12, 28, 0.35, 0, Math.PI * 2);
		g.ellipse(152, 125, 12, 28, -0.35, 0, Math.PI * 2);
		g.fill();
		g.beginPath();
		g.ellipse(120, 145, 16, 12, 0, 0, Math.PI * 2);
		g.fill();
		// gatito sentado (derecha)
		g.beginPath();
		g.ellipse(250, 225, 40, 52, 0, 0, Math.PI * 2);
		g.fill();
		g.beginPath();
		g.ellipse(250, 158, 28, 26, 0, 0, Math.PI * 2);
		g.fill();
		g.beginPath();
		g.moveTo(228, 145);
		g.lineTo(232, 118);
		g.lineTo(246, 138);
		g.moveTo(272, 145);
		g.lineTo(268, 118);
		g.lineTo(254, 138);
		g.fill();
		g.strokeStyle = '#3e2a18';
		g.lineWidth = 9;
		g.lineCap = 'round';
		g.beginPath();
		g.moveTo(286, 260);
		g.quadraticCurveTo(330, 250, 318, 205);
		g.stroke();
		const tmp = document.createElement('canvas');
		tmp.width = 360;
		tmp.height = 300;
		const tg = tmp.getContext('2d')!;
		tg.filter = 'blur(2.5px) contrast(0.85)';
		tg.drawImage(c, 0, 0);
		g.clearRect(0, 0, 360, 300);
		g.drawImage(tmp, 0, 0);
		const v = g.createRadialGradient(180, 150, 100, 180, 150, 220);
		v.addColorStop(0, 'rgba(40,25,10,0)');
		v.addColorStop(1, 'rgba(40,25,10,0.65)');
		g.fillStyle = v;
		g.fillRect(0, 0, 360, 300);
		g.strokeStyle = '#efe3c8';
		g.lineWidth = 12;
		g.strokeRect(6, 6, 348, 288);
		tex = new THREE.CanvasTexture(c);
		tex.colorSpace = THREE.SRGBColorSpace;
		return tex;
	};
})();

// ---------- su altar ----------
const ALT_Z = -2.1;
const Altar: React.FC<{f: number; t: number; cam: V3}> = ({f, t, cam}) => {
	// llegan: el agua tiembla (beben) y el collar se mueve con su cascabel
	const drink = f > 350 && f < 392 ? Math.sin(((f - 350) / 42) * Math.PI) : 0;
	const bell = f > 338 && f < 368 ? Math.sin((f - 338) * 0.9) * Math.exp(-(f - 338) / 12) : 0;
	return (
		<>
			<mesh position={[0, 0.18, ALT_Z - 0.15]}>
				<boxGeometry args={[1.2, 0.36, 0.55]} />
				<meshStandardMaterial color="#3a2414" roughness={0.8} />
			</mesh>
			<mesh position={[0, 0.365, ALT_Z - 0.15]}>
				<boxGeometry args={[1.28, 0.015, 0.62]} />
				<meshStandardMaterial color="#efe6d6" roughness={0.85} />
			</mesh>
			{/* la foto */}
			<mesh position={[0, 0.56, ALT_Z - 0.35]} rotation={[-0.15, 0, 0]}>
				<boxGeometry args={[0.44, 0.37, 0.025]} />
				<meshStandardMaterial color="#5a3a1e" roughness={0.6} />
			</mesh>
			<mesh position={[0, 0.56, ALT_Z - 0.335]} rotation={[-0.15, 0, 0]}>
				<planeGeometry args={[0.38, 0.31]} />
				<meshStandardMaterial map={petPhoto()} roughness={0.7} />
			</mesh>
			{/* plato de croquetas y plato de agua en el piso, frente al altar */}
			<group position={[-0.28, 0, ALT_Z + 0.32]}>
				<mesh position={[0, 0.03, 0]}>
					<cylinderGeometry args={[0.11, 0.085, 0.06, 28, 1, true]} />
					<meshStandardMaterial color="#b8442a" roughness={0.5} side={THREE.DoubleSide} />
				</mesh>
				{Array.from({length: 22}, (_, i) => (
					<mesh key={i} position={[(hash(i, 1) - 0.5) * 0.13, 0.04 + hash(i, 2) * 0.02, (hash(i, 3) - 0.5) * 0.13]}>
						<sphereGeometry args={[0.013, 6, 5]} />
						<meshStandardMaterial color="#7a4a24" roughness={0.9} />
					</mesh>
				))}
			</group>
			<group position={[0.28, 0, ALT_Z + 0.32]}>
				<mesh position={[0, 0.03, 0]}>
					<cylinderGeometry args={[0.11, 0.085, 0.06, 28, 1, true]} />
					<meshStandardMaterial color="#2f6a8a" roughness={0.45} side={THREE.DoubleSide} />
				</mesh>
				<mesh position={[0, 0.045, 0]} rotation={[-Math.PI / 2, 0, 0]}>
					<circleGeometry args={[0.1, 28]} />
					<meshStandardMaterial color="#1a3442" roughness={0.05} metalness={0.3} />
				</mesh>
				{/* ondas cuando beben */}
				{[0, 1, 2].map((r) => {
					const ph = ((t * 1.6 + r / 3) % 1);
					return drink > 0 ? (
						<mesh key={r} position={[0, 0.047, 0]} rotation={[-Math.PI / 2, 0, 0]}>
							<ringGeometry args={[ph * 0.09, ph * 0.09 + 0.004, 32]} />
							<meshBasicMaterial color="#cfe4ea" transparent opacity={0.5 * drink * (1 - ph)} />
						</mesh>
					) : null;
				})}
			</group>
			{/* collar con cascabel y su pelota */}
			<group position={[0.42, 0.38, ALT_Z - 0.05]} rotation={[Math.PI / 2 - 0.15 + bell * 0.25, 0, bell * 0.3]}>
				<mesh>
					<torusGeometry args={[0.07, 0.012, 10, 28]} />
					<meshStandardMaterial color="#a8281c" roughness={0.6} />
				</mesh>
				<mesh position={[0, -0.085, 0]}>
					<sphereGeometry args={[0.016, 14, 10]} />
					<meshStandardMaterial color="#e2b24a" metalness={1} roughness={0.25} />
				</mesh>
			</group>
			<mesh position={[-0.45, 0.42, ALT_Z - 0.02]}>
				<sphereGeometry args={[0.05, 20, 14]} />
				<meshStandardMaterial color="#d8a02a" roughness={0.6} />
			</mesh>
			{/* veladoras y flores */}
			{(
				[
					[-0.3, ALT_Z - 0.32, 0],
					[0.3, ALT_Z - 0.32, 1],
					[0.0, ALT_Z + 0.02, 2],
				] as [number, number, number][]
			).map(([x, z, i]) => (
				<group key={i} position={[0, 0.37, 0]}>
					<Veladora X={x} Z={z} k={E.out(clamp((f - (300 + i * 10)) / 14)) * 0.75 + 0.25} t={t} i={i} cam={[cam[0], cam[1] - 0.37, cam[2]]} sc={0.8} power={0.12} />
				</group>
			))}
			{Array.from({length: 9}, (_, i) => (
				<Cempasuchil3D key={i} pos={[-0.55 + i * 0.137, 0.375, ALT_Z + 0.1]} s={0.018} rot={[0.2, i, 0]} seed={i + 80} />
			))}
			{Array.from({length: 8}, (_, i) => (
				<Cempasuchil3D key={`f${i}`} pos={[(i < 4 ? -1 : 1) * (0.72 + (i % 4) * 0.1), 0.02, ALT_Z + 0.1 - (i % 2) * 0.2]} s={0.026} rot={[0, i * 1.9, 0]} seed={i + 90} />
			))}
			<pointLight position={[0, 1.1, ALT_Z + 0.6]} intensity={1.0 * (0.35 + 0.65 * clamp((f - 300) / 30)) * flick(t, 3)} distance={0} decay={2} color="#ffb060" />
		</>
	);
};

const World: React.FC<{f: number}> = ({f}) => {
	const t = f / FPS;
	const {pos, look} = camAt(Math.max(f, SCENE));
	return (
		<>
			<Camera pos={pos} look={look} fov={FOV} />
			<fog attach="fog" args={['#0a0604', 4, 14]} />
			<hemisphereLight args={['#3a4a62', '#1a0e06', 0.38]} />
			<spotLight position={[0, 2.2, 7]} target-position={[0, 0, 3]} angle={0.55} penumbra={1} intensity={2.4} distance={0} decay={1.2} color="#8fb0d0" />
			<Floor />
			<Prints f={f} />
			<Altar f={f} t={t} cam={pos} />
			{/* veladoras a los lados del camino */}
			{[
				[-0.9, 3.8],
				[0.9, 2.2],
				[-0.85, 0.6],
			].map(([x, z], i) => (
				<Veladora key={i} X={x} Z={z} k={1} t={t} i={i + 4} cam={pos} sc={1.1} power={0.16} />
			))}
			{/* chispitas que suben de las huellas recién aparecidas */}
			{PRINTS.map((p, j) => {
				const d = f - p.at;
				return d > 0 && d < 24 ? <Glow3D key={j} pos={[p.x, 0.04 + d * 0.006, p.z]} size={0.18 * p.s} cam={pos} color="#ffc070" intensity={0.5 * (1 - d / 24)} sharp={6} /> : null;
			})}
		</>
	);
};

// textos: la intro en negro (con maullidos y ladridos) y el recorrido
const TEXTS = [
	{text: '¿Lo escuchaste?', at: 14, out: 62, y: 860, size: 66},
	{text: 'Hoy vuelven los que\nnos esperaban en la puerta.', at: 72, out: 120, y: 820, size: 60},
	{text: 'Los que nos quisieron\nsin pedir nada a cambio.', at: 126, out: 176, y: 820, size: 60},
	{text: 'Su plato, su agua,\nsu juguete de siempre…', at: 214, out: 276, y: 300, size: 58},
	{text: '…y un camino de flores\npara que sepan volver.', at: 284, out: 346, y: 300, size: 58},
];

export const Mascotas: React.FC<{dias: number; fecha: string}> = () => {
	const f = useCurrentFrame();
	const sceneIn = E.out(clamp((f - SCENE) / 24));
	const endDark = 0.5 * E.inOut(clamp((f - 404) / 24));
	return (
		<AbsoluteFill style={{background: '#000'}}>
			{f >= SCENE - 2 ? (
				<AbsoluteFill style={{opacity: sceneIn}}>
					<Stage3D fov={FOV} near={0.03} far={120}>
						<World f={f} />
					</Stage3D>
					<AbsoluteFill style={{background: 'radial-gradient(ellipse 75% 60% at 50% 50%, rgba(0,0,0,0) 55%, rgba(0,0,0,0.7) 100%)'}} />
					<AbsoluteFill style={{background: '#000', opacity: endDark}} />
				</AbsoluteFill>
			) : null}
			{TEXTS.map((p, i) => (
				<Line key={i} {...p} f={f} color="#efe3c8" mode="soft" scrim={i < 3 ? 0 : 0.35} />
			))}
			<Line text={'Hoy llegan\nnuestras mascotas.'} f={f} at={412} y={680} size={88} font="Rye" color="#F5C242" mode="soft" lineHeight={1.15} scrim={0} glow="#F26D3D" />
			<Line text={'27 · 10'} f={f} at={432} y={930} size={52} color="#E0BB8F" mode="soft" scrim={0} tracking={0.2} />
		</AbsoluteFill>
	);
};
