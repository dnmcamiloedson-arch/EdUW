import React, {useLayoutEffect, useMemo} from 'react';
import * as THREE from 'three';
import {useThree} from '@react-three/fiber';
import {ThreeCanvas} from '@remotion/three';
import {H, W, hash} from '../../lib/util';

// ---------- Escenario 3D (diorama de papel con volumen real) ----------
// Lienzo transparente: el cielo y los textos siguen dibujándose en 2D detrás y delante.
export const Stage3D: React.FC<{children: React.ReactNode; fov?: number; style?: React.CSSProperties}> = ({children, fov = 40, style}) => (
	<ThreeCanvas
		width={W}
		height={H}
		style={{position: 'absolute', inset: 0, ...style}}
		gl={{alpha: true, antialias: true, preserveDrawingBuffer: true}}
		camera={{fov, near: 0.1, far: 4000, position: [0, 10, 60]}}
		shadows
		onCreated={({gl}) => {
			gl.setClearColor(0x000000, 0);
			gl.toneMapping = THREE.ACESFilmicToneMapping;
			gl.toneMappingExposure = 1.05;
			gl.outputColorSpace = THREE.SRGBColorSpace;
		}}
	>
		{children}
	</ThreeCanvas>
);

// Cámara controlada por frame
export const Camera: React.FC<{pos: [number, number, number]; look: [number, number, number]; fov?: number; roll?: number}> = ({pos, look, fov, roll = 0}) => {
	const {camera} = useThree();
	useLayoutEffect(() => {
		camera.position.set(...pos);
		camera.up.set(Math.sin(roll), Math.cos(roll), 0);
		camera.lookAt(...look);
		if (fov && (camera as THREE.PerspectiveCamera).isPerspectiveCamera) {
			(camera as THREE.PerspectiveCamera).fov = fov;
			camera.updateProjectionMatrix();
		}
	});
	return null;
};

// Ruido determinista para desplazar vértices
const n3 = (x: number, y: number, z: number, seed: number) => {
	const xi = Math.floor(x);
	const yi = Math.floor(y);
	const zi = Math.floor(z);
	const fx = x - xi;
	const fy = y - yi;
	const fz = z - zi;
	const s = (t: number) => t * t * (3 - 2 * t);
	const h = (a: number, b: number, c: number) => hash(a * 73856 + b * 19349 + c * 83492, seed) * 2 - 1;
	const l = (a: number, b: number, t: number) => a + (b - a) * s(t);
	return l(
		l(l(h(xi, yi, zi), h(xi + 1, yi, zi), fx), l(h(xi, yi + 1, zi), h(xi + 1, yi + 1, zi), fx), fy),
		l(l(h(xi, yi, zi + 1), h(xi + 1, yi, zi + 1), fx), l(h(xi, yi + 1, zi + 1), h(xi + 1, yi + 1, zi + 1), fx), fy),
		fz,
	);
};

const flat = (color: string, extra: Partial<THREE.MeshStandardMaterialParameters> = {}) => (
	<meshStandardMaterial color={color} flatShading roughness={0.92} metalness={0} {...extra} />
);

// ---------- Montaña de facetas (papel plegado) ----------
export const Mountain: React.FC<{
	pos: [number, number, number];
	r: number;
	h: number;
	color: string;
	seed?: number;
	seg?: number;
	rough?: number;
	snow?: string;
	snowLine?: number;
	crater?: number;
	scaleZ?: number;
}> = ({pos, r, h, color, seed = 1, seg = 11, rough = 0.18, snow, snowLine = 0.78, crater = 0, scaleZ = 1}) => {
	const geo = useMemo(() => {
		const g = new THREE.ConeGeometry(r, h, seg, 6, true);
		const p = g.attributes.position as THREE.BufferAttribute;
		const cols: number[] = [];
		const base = new THREE.Color(color);
		const sn = snow ? new THREE.Color(snow) : null;
		for (let i = 0; i < p.count; i++) {
			const x = p.getX(i);
			let y = p.getY(i);
			const z = p.getZ(i);
			const u = (y + h / 2) / h; // 0 base, 1 cima
			const k = rough * (1 - u * 0.6);
			const d = n3(x * 0.08 + seed, y * 0.08, z * 0.08, seed) * k;
			let sx = x * (1 + d);
			let sz = z * (1 + d);
			if (crater && u > 0.98) {
				// cráter: la punta se abre en anillo
				const ang = Math.atan2(z, x);
				sx = Math.cos(ang) * r * crater;
				sz = Math.sin(ang) * r * crater;
				y -= h * 0.04;
			}
			p.setXYZ(i, sx, y + n3(x * 0.1, seed, z * 0.1, seed + 3) * h * 0.04 * (u > 0.02 ? 1 : 0), sz * scaleZ);
			const c = base.clone();
			if (sn && u > snowLine + n3(x * 0.2, 1, z * 0.2, seed + 9) * 0.06) c.lerp(sn, 0.9);
			else c.multiplyScalar(0.85 + 0.25 * u);
			cols.push(c.r, c.g, c.b);
		}
		g.setAttribute('color', new THREE.Float32BufferAttribute(cols, 3));
		g.computeVertexNormals();
		return g;
	}, [r, h, color, seed, seg, rough, snow, snowLine, crater, scaleZ]);
	return (
		<mesh geometry={geo} position={[pos[0], pos[1] + h / 2, pos[2]]} castShadow receiveShadow>
			<meshStandardMaterial vertexColors flatShading roughness={0.95} side={THREE.DoubleSide} />
		</mesh>
	);
};

// ---------- Sierra: cordillera de muchas montañas ----------
export const Range: React.FC<{z: number; x0: number; x1: number; n: number; r: number; h: number; color: string; seed: number; y?: number; snow?: string}> = ({
	z,
	x0,
	x1,
	n,
	r,
	h,
	color,
	seed,
	y = 0,
	snow,
}) => (
	<group>
		{Array.from({length: n}).map((_, i) => {
			const u = n === 1 ? 0.5 : i / (n - 1);
			const hh = h * (0.55 + 0.6 * hash(i, seed));
			return (
				<Mountain
					key={i}
					pos={[x0 + (x1 - x0) * u + (hash(i, seed + 1) - 0.5) * r * 0.6, y, z + (hash(i, seed + 2) - 0.5) * r * 0.8]}
					r={r * (0.7 + 0.5 * hash(i, seed + 3))}
					h={hh}
					color={color}
					seed={seed * 10 + i}
					snow={snow}
				/>
			);
		})}
	</group>
);

// ---------- Suelo con relieve suave ----------
export const Ground: React.FC<{size?: number; color: string; y?: number; seed?: number; amp?: number; z?: number}> = ({size = 1200, color, y = 0, seed = 1, amp = 1.2, z = 0}) => {
	const geo = useMemo(() => {
		const g = new THREE.PlaneGeometry(size, size, 80, 80);
		g.rotateX(-Math.PI / 2);
		const p = g.attributes.position as THREE.BufferAttribute;
		for (let i = 0; i < p.count; i++) {
			const x = p.getX(i);
			const zz = p.getZ(i);
			p.setY(i, n3(x * 0.03, 0, zz * 0.03, seed) * amp + n3(x * 0.12, 3, zz * 0.12, seed + 1) * amp * 0.25);
		}
		g.computeVertexNormals();
		return g;
	}, [size, seed, amp]);
	return (
		<mesh geometry={geo} position={[0, y, z]} receiveShadow>
			{flat(color)}
		</mesh>
	);
};

// ---------- Pirámide escalonada mesoamericana (talud + escalinata + templo) ----------
export const Piramide: React.FC<{pos: [number, number, number]; base?: number; tiers?: number; tierH?: number; color: string; dark: string; accent: string; rotY?: number}> = ({
	pos,
	base = 30,
	tiers = 5,
	tierH = 3.4,
	color,
	dark,
	accent,
	rotY = 0.5,
}) => {
	const top = base * 0.38;
	const parts: React.ReactNode[] = [];
	for (let i = 0; i < tiers; i++) {
		const w0 = base - ((base - top) * i) / tiers;
		const w1 = base - ((base - top) * (i + 0.86)) / tiers;
		const y = i * tierH;
		// talud: tronco de pirámide de 4 lados
		parts.push(
			<mesh key={'t' + i} position={[0, y + tierH * 0.42, 0]} rotation={[0, Math.PI / 4, 0]} castShadow receiveShadow>
				<cylinderGeometry args={[(w1 / 2) * Math.SQRT2, (w0 / 2) * Math.SQRT2, tierH * 0.84, 4, 1]} />
				{flat(color)}
			</mesh>,
		);
		// tablero: banda recta
		parts.push(
			<mesh key={'b' + i} position={[0, y + tierH * 0.92, 0]} castShadow receiveShadow>
				<boxGeometry args={[w1 * 1.02, tierH * 0.16, w1 * 1.02]} />
				{flat(dark)}
			</mesh>,
		);
	}
	const hTot = tiers * tierH;
	// escalinata frontal con alfardas
	const stairs: React.ReactNode[] = [];
	const steps = tiers * 5;
	for (let s = 0; s < steps; s++) {
		const u = s / steps;
		const y = u * hTot;
		const halfW = base / 2 - ((base - top) / 2) * u;
		stairs.push(
			<mesh key={'s' + s} position={[0, y + hTot / steps / 2, halfW + 0.6]} castShadow receiveShadow>
				<boxGeometry args={[base * 0.22, hTot / steps, 1.6]} />
				{flat(s % 2 ? color : accent)}
			</mesh>,
		);
	}
	const tw = top * 0.62;
	return (
		<group position={pos} rotation={[0, rotY, 0]}>
			{parts}
			{stairs}
			{[-1, 1].map((sd) => (
				<mesh key={sd} position={[sd * base * 0.125, hTot / 2, base / 2 - (base - top) / 4 + 0.6]} rotation={[-Math.atan((base - top) / 2 / hTot), 0, 0]} castShadow>
					<boxGeometry args={[base * 0.03, Math.hypot(hTot, (base - top) / 2) * 1.02, 2]} />
					{flat(dark)}
				</mesh>
			))}
			{/* templo */}
			<mesh position={[0, hTot + tierH * 0.8, 0]} castShadow receiveShadow>
				<boxGeometry args={[tw, tierH * 1.6, tw * 0.8]} />
				{flat(color)}
			</mesh>
			<mesh position={[0, hTot + tierH * 1.75, 0]} castShadow>
				<boxGeometry args={[tw * 1.12, tierH * 0.35, tw * 0.92]} />
				{flat(dark)}
			</mesh>
			<mesh position={[0, hTot + tierH * 0.6, tw * 0.4 + 0.02]}>
				<planeGeometry args={[tw * 0.3, tierH * 1.1]} />
				<meshBasicMaterial color="#120604" />
			</mesh>
		</group>
	);
};

// ---------- Maguey (hojas en roseta) ----------
export const Maguey3D: React.FC<{pos: [number, number, number]; s?: number; color: string; seed?: number; shadow?: boolean}> = ({pos, s = 1, color, seed = 1, shadow = false}) => (
	<group position={pos} scale={s}>
		{Array.from({length: 16}).map((_, i) => {
			const a = (i / 16) * Math.PI * 2 + hash(i, seed) * 0.4;
			const tilt = 0.25 + 0.75 * hash(i, seed + 1);
			const len = 4 + 3 * hash(i, seed + 2);
			return (
				<group key={i} rotation={[0, a, 0]}>
					<mesh position={[Math.sin(tilt) * len * 0.5, Math.cos(tilt) * len * 0.5, 0]} rotation={[0, 0, -tilt]} scale={[1, 1, 0.35]} castShadow={shadow}>
						<coneGeometry args={[0.62, len, 4, 1]} />
						{flat(color)}
					</mesh>
				</group>
			);
		})}
	</group>
);

// ---------- Árbol de coníferas (oyamel) ----------
export const Oyamel: React.FC<{pos: [number, number, number]; h?: number; color: string; seed?: number}> = ({pos, h = 18, color, seed = 1}) => (
	<group position={pos}>
		<mesh position={[0, h * 0.12, 0]} castShadow>
			<cylinderGeometry args={[h * 0.025, h * 0.035, h * 0.25, 5]} />
			{flat('#2a160c')}
		</mesh>
		{Array.from({length: 5}).map((_, i) => {
			const u = i / 5;
			return (
				<mesh key={i} position={[0, h * (0.25 + u * 0.62), 0]} rotation={[0, hash(i, seed) * 3, 0]} castShadow receiveShadow>
					<coneGeometry args={[h * (0.26 - u * 0.04) * (1 - u * 0.55), h * 0.32, 7, 1]} />
					{flat(color)}
				</mesh>
			);
		})}
	</group>
);

// Proyecta un punto del mundo a píxeles de pantalla (para alinear brillos 2D con objetos 3D)
export const project = (pt: [number, number, number], pos: [number, number, number], look: [number, number, number], fov: number) => {
	const cam = new THREE.PerspectiveCamera(fov, W / H, 0.1, 4000);
	cam.position.set(...pos);
	cam.lookAt(...look);
	cam.updateMatrixWorld();
	const v = new THREE.Vector3(...pt).project(cam);
	return {x: ((v.x + 1) / 2) * W, y: ((1 - v.y) / 2) * H, visible: v.z < 1};
};

// ---------- Flor de cempasúchil en 3D (pétalos rizados instanciados) ----------
const petalGeo = (() => {
	const sh = new THREE.Shape();
	sh.moveTo(0, 0);
	sh.bezierCurveTo(-0.32, 0.18, -0.5, 0.6, -0.42, 0.9);
	// borde rizado
	const n = 7;
	for (let i = 0; i <= n; i++) {
		const u = i / n;
		const x = -0.42 + 0.84 * u;
		const y = 0.9 + 0.08 * Math.sin(Math.PI * u) + (i % 2 ? -0.07 : 0.05);
		sh.lineTo(x, y);
	}
	sh.bezierCurveTo(0.5, 0.6, 0.32, 0.18, 0, 0);
	const g = new THREE.ShapeGeometry(sh, 6);
	const p = g.attributes.position as THREE.BufferAttribute;
	for (let i = 0; i < p.count; i++) {
		const x = p.getX(i);
		const y = p.getY(i);
		// pétalo cóncavo y ondulado
		p.setZ(i, 0.35 * x * x + 0.06 * Math.sin(y * 14 + x * 6) * y);
	}
	g.computeVertexNormals();
	return g;
})();

export const Cempasuchil3D: React.FC<{pos?: [number, number, number]; s?: number; open?: number; rot?: [number, number, number]; seed?: number; lit?: number}> = ({
	pos = [0, 0, 0],
	s = 1,
	open = 1,
	rot = [0, 0, 0],
	seed = 1,
	lit = 1,
}) => {
	const RINGS = 11;
	const data = useMemo(() => {
		const out: {ring: number; a: number; size: number; jit: number}[] = [];
		for (let r = 0; r < RINGS; r++) {
			const n = Math.round(26 - r * 1.6);
			for (let i = 0; i < n; i++) out.push({ring: r, a: ((i + (r % 2) * 0.5) / n) * Math.PI * 2 + hash(r * 50 + i, seed) * 0.15, size: 1.25 - r * 0.075 + hash(r * 50 + i, seed + 1) * 0.12, jit: hash(r * 50 + i, seed + 2)});
		}
		return out;
	}, [seed]);
	const ref = React.useRef<THREE.InstancedMesh>(null);
	const deep = new THREE.Color('#c23e12');
	const mid = new THREE.Color('#F26D3D');
	const tip = new THREE.Color('#F9A43A');
	const gold = new THREE.Color('#F5C242');
	useLayoutEffect(() => {
		const m = ref.current;
		if (!m) return;
		const o = new THREE.Object3D();
		data.forEach((d, i) => {
			const u = d.ring / (RINGS - 1); // 0 exterior, 1 centro
			const rad = (1 - u) * 2.1 + 0.15;
			// inclinación: exterior abierto, interior erguido; al cerrar todo se yergue
			const pitchOpen = lerp3(0.12, 1.25, u ** 0.8);
			const pitch = pitchOpen + (1 - open) * (1.45 - pitchOpen);
			o.position.set(Math.cos(d.a) * rad * (0.35 + 0.65 * open), u * 0.9 * (0.6 + 0.4 * open), Math.sin(d.a) * rad * (0.35 + 0.65 * open));
			o.rotation.set(0, 0, 0);
			o.rotateY(-d.a + Math.PI / 2);
			o.rotateX(-Math.PI / 2 + pitch + (d.jit - 0.5) * 0.25);
			o.scale.setScalar(d.size * (0.55 + 0.45 * open));
			o.updateMatrix();
			m.setMatrixAt(i, o.matrix);
			const c = u < 0.5 ? tip.clone().lerp(mid, u * 2) : mid.clone().lerp(deep, (u - 0.5) * 2);
			if (d.jit > 0.85) c.lerp(gold, 0.35);
			c.multiplyScalar(lit * (0.85 + 0.25 * d.jit));
			m.setColorAt(i, c);
		});
		m.instanceMatrix.needsUpdate = true;
		if (m.instanceColor) m.instanceColor.needsUpdate = true;
	});
	return (
		<group position={pos} scale={s} rotation={rot}>
			<instancedMesh ref={ref} args={[petalGeo, undefined, data.length]} castShadow receiveShadow>
				<meshStandardMaterial side={THREE.DoubleSide} roughness={0.75} />
			</instancedMesh>
			{/* corazón */}
			<mesh position={[0, 0.55 + 0.25 * open, 0]} scale={0.4 + 0.6 * open}>
				<sphereGeometry args={[0.22, 12, 8]} />
				<meshStandardMaterial color="#8a2a0a" roughness={0.9} />
			</mesh>
		</group>
	);
};
const lerp3 = (a: number, b: number, t: number) => a + (b - a) * t;

// Tallo curvo con hojas pinnadas
export const Tallo: React.FC<{pts: [number, number, number][]; r?: number; color: string; leaves?: {u: number; side: number; s: number}[]}> = ({pts, r = 0.18, color, leaves = []}) => {
	const curve = useMemo(() => new THREE.CatmullRomCurve3(pts.map((p) => new THREE.Vector3(...p))), [pts]);
	const tube = useMemo(() => new THREE.TubeGeometry(curve, 40, r, 8, false), [curve, r]);
	const leafGeo = useMemo(() => {
		const sh = new THREE.Shape();
		sh.moveTo(0, 0);
		// hoja de cempasúchil: foliolos dentados
		for (let i = 0; i <= 10; i++) {
			const u = i / 10;
			sh.lineTo(u * 3, (0.55 * Math.sin(Math.PI * u) + (i % 2 ? 0.18 : 0)) * (1 - u * 0.3));
		}
		for (let i = 10; i >= 0; i--) {
			const u = i / 10;
			sh.lineTo(u * 3, -(0.55 * Math.sin(Math.PI * u) + (i % 2 ? 0.18 : 0)) * (1 - u * 0.3));
		}
		const g = new THREE.ShapeGeometry(sh);
		const p = g.attributes.position as THREE.BufferAttribute;
		for (let i = 0; i < p.count; i++) p.setZ(i, -0.12 * p.getX(i) ** 2 * 0.3 + 0.2 * p.getY(i) ** 2);
		g.computeVertexNormals();
		return g;
	}, []);
	return (
		<group>
			<mesh geometry={tube} castShadow>
				<meshStandardMaterial color={color} roughness={0.8} />
			</mesh>
			{leaves.map((l, i) => {
				const p = curve.getPoint(l.u);
				return (
					<mesh key={i} geometry={leafGeo} position={p} rotation={[0.3, l.side > 0 ? 0.3 : Math.PI - 0.3, l.side * -0.5]} scale={l.s} castShadow>
						<meshStandardMaterial color={color} side={THREE.DoubleSide} roughness={0.8} />
					</mesh>
				);
			})}
		</group>
	);
};

export {THREE};
