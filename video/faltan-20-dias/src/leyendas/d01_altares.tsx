// Día 1 · «Falta uno» — versión historia en 3D. El patio de cantera de noche; las siete veladoras en círculo, cada una
// con su corona de cempasúchil y la seña de su leyenda (sin nombres ni facultades). Un dron da la vuelta sobre ellas
// mientras se encienden, baja a ras del suelo hacia el camino de pétalos con forma de «1» —que arde a su paso— y en el
// centro sube a la vista cenital: FALTA 1 DÍA. El outro estándar se agrega aparte.
import React, {useLayoutEffect, useMemo, useRef} from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import * as THREE from 'three';
import {E, clamp, hash, lerp} from '../lib/util';
import {Camera, Cempasuchil3D, Stage3D} from '../cap/kit/three';
import {Flame3D, Glow3D, stoneTex, withRepeat, type V3} from '../cap/kit/fx3d';
import {LeyendaLockup} from './kit/text';
import {UNO_PTS} from './d01/uno';

export const EP01_LEN = 345; // 11.5 s
const FPS = 30;
const LOCK = 296;
const IGN = [172, 232]; // el fuego corre por el camino mientras el dron se acerca a ras del suelo
const N = UNO_PTS.length / 2;
const FOV = (2 * Math.atan(960 / 1100) * 180) / Math.PI; // a 11 m de altura la vista cenital coincide con el rótulo

// plano del patio: el cuadro final (1080 × 1920 px) mide 10.8 × 19.2 m; X = derecha, Z = abajo en pantalla
const toW = (x: number, y: number): [number, number] => [(x - 540) / 100, (y - 960) / 100];

// ---------- las siete veladoras en círculo; cada una se enciende cuando el dron la tiene enfrente ----------
const RING = {cx: 540, cy: 925, rx: 420, ry: 640};
const ORBIT = {f0: 0, f1: 150, a0: -88, a1: 244};
type Sig = 'orb' | 'eyesG' | 'coin' | 'eyesR' | 'cross' | 'veil' | 'ribbon';
const SIGS: Sig[] = ['orb', 'eyesG', 'coin', 'eyesR', 'cross', 'veil', 'ribbon'];
const ALT = SIGS.map((sig, i) => {
	const a = -90 + 180 / 7 + (i * 360) / 7;
	const r = (a * Math.PI) / 180;
	const at = Math.max(12, ORBIT.f0 + ((a - ORBIT.a0) / (ORBIT.a1 - ORBIT.a0)) * (ORBIT.f1 - ORBIT.f0) - 30);
	const [X, Z] = toW(RING.cx + RING.rx * Math.cos(r), RING.cy + RING.ry * Math.sin(r));
	return {X, Z, at, sig, ang: r};
});

// ---------- cámara dron (en px del cuadro final; h = altura en px) con Catmull-Rom ----------
type Cam3 = {x: number; y: number; h: number; pitch: number; yaw: number};
const D2R = Math.PI / 180;
const KEYS: [number, Cam3][] = (() => {
	const keys: [number, Cam3][] = [];
	const at = (a: number, k = 1): [number, number] => [RING.cx + RING.rx * k * Math.cos(a * D2R), RING.cy + RING.ry * k * Math.sin(a * D2R)];
	const tang = (a: number) => Math.atan2(RING.ry * Math.cos(a * D2R), -RING.rx * Math.sin(a * D2R)) / D2R;
	for (let k = 0; k <= 7; k++) {
		const a = ORBIT.a0 + ((ORBIT.a1 - ORBIT.a0) * k) / 7;
		const [x, y] = at(a, 1.12);
		keys.push([ORBIT.f0 + ((ORBIT.f1 - ORBIT.f0) * k) / 7, {x, y, h: 520, pitch: 50, yaw: tang(a) + 22}]);
	}
	const [ex, ey] = at(ORBIT.a1 + 18, 0.92);
	const toC = Math.atan2(960 - ey, 540 - ex) / D2R;
	keys.push([186, {x: lerp(ex, 540, 0.42), y: lerp(ey, 960, 0.42), h: 150, pitch: 17, yaw: toC}]);
	keys.push([222, {x: lerp(ex, 540, 0.86), y: lerp(ey, 960, 0.86), h: 95, pitch: 11, yaw: toC}]);
	keys.push([258, {x: 540, y: 960, h: 520, pitch: 60, yaw: lerp(toC, -90, 0.6)}]);
	keys.push([290, {x: 540, y: 960, h: 1100, pitch: 90, yaw: -90}]);
	keys.push([345, {x: 540, y: 960, h: 1100, pitch: 90, yaw: -90}]);
	for (let i = 1; i < keys.length; i++) {
		let y = keys[i][1].yaw;
		const p = keys[i - 1][1].yaw;
		while (y - p > 180) y -= 360;
		while (y - p < -180) y += 360;
		keys[i][1].yaw = y;
	}
	return keys;
})();
const camAt = (f: number): Cam3 => {
	let i = 0;
	while (i < KEYS.length - 2 && f > KEYS[i + 1][0]) i++;
	const [f1, c1] = KEYS[i];
	const [f2, c2] = KEYS[i + 1];
	const c0 = KEYS[Math.max(0, i - 1)][1];
	const c3 = KEYS[Math.min(KEYS.length - 1, i + 2)][1];
	const u = clamp((f - f1) / (f2 - f1));
	const cr = (p0: number, p1: number, p2: number, p3: number) => 0.5 * (2 * p1 + (-p0 + p2) * u + (2 * p0 - 5 * p1 + 4 * p2 - p3) * u * u + (-p0 + 3 * p1 - 3 * p2 + p3) * u * u * u);
	const k = (key: keyof Cam3) => cr(c0[key], c1[key], c2[key], c3[key]);
	return {x: k('x'), y: k('y'), h: Math.max(60, k('h')), pitch: clamp(k('pitch'), 5, 90), yaw: k('yaw')};
};
// a la convención de three: (x, y_px, arriba) → (X, Y = arriba, Z)
const cam3 = (f: number) => {
	const c = camAt(f);
	const p = c.pitch * D2R;
	const y = c.yaw * D2R;
	const fw = [Math.cos(y) * Math.cos(p), Math.sin(y) * Math.cos(p), -Math.sin(p)];
	const r = [-Math.sin(y), Math.cos(y), 0];
	const u = [fw[1] * r[2] - fw[2] * r[1], fw[2] * r[0] - fw[0] * r[2], fw[0] * r[1] - fw[1] * r[0]];
	const [X, Z] = toW(c.x, c.y);
	const pos: V3 = [X, c.h / 100, Z];
	const look: V3 = [X + fw[0] * 5, c.h / 100 + fw[2] * 5, Z + fw[1] * 5];
	const up: V3 = [u[0], u[2], u[1]];
	return {pos, look, up};
};

const flick = (t: number, s: number) => 0.86 + 0.08 * Math.sin(t * 9.1 + s) + 0.06 * Math.sin(t * 23.7 + s * 3);

// ---------- piso de cantera ----------
const Floor: React.FC = () => {
	const st = stoneTex('patio1', {rows: 4, base: '#5a4a38', mortar: '#1a120b', seed: 41, pores: 45, vari: 0.2, slab: true});
	const mat = useMemo(() => new THREE.MeshStandardMaterial({map: withRepeat(st.map, 9, 9), bumpMap: withRepeat(st.bump, 9, 9), bumpScale: 1.4, roughness: 0.92}), [st]);
	return (
		<mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} material={mat} receiveShadow>
			<planeGeometry args={[60, 60]} />
		</mesh>
	);
};

// ---------- el camino de pétalos en forma de 1 (pétalos 3D instanciados); los que ya ardieron se cambian de malla ----------
const petalGeo = (() => {
	// pétalo: óvalo con punta, cóncavo
	const g = new THREE.CircleGeometry(0.05, 14);
	const p = g.attributes.position;
	for (let i = 0; i < p.count; i++) {
		const x = p.getX(i) * 1.45;
		const y = p.getY(i) * (0.62 - 0.18 * (p.getX(i) / 0.05));
		p.setXYZ(i, x, y, 0.16 * (x * x + y * y) * 6);
	}
	g.computeVertexNormals();
	return g;
})();
const order = (() => {
	const idx = Array.from({length: N}, (_, i) => i);
	idx.sort((a, b) => UNO_PTS[b * 2 + 1] - UNO_PTS[a * 2 + 1]);
	const rank = new Float32Array(N);
	idx.forEach((i, r) => (rank[i] = r / N));
	return rank;
})();
const COLD = ['#c4521a', '#d8681f', '#b04314', '#e07a24'];
const HOT = ['#ff7a18', '#ff9a1e', '#ffb428', '#ff5a12'];
const Petals: React.FC<{f: number; t: number}> = ({f, t}) => {
	const cold = useRef<THREE.InstancedMesh>(null);
	const hot = useRef<THREE.InstancedMesh>(null);
	const p = (f - IGN[0]) / (IGN[1] - IGN[0]);
	useLayoutEffect(() => {
		const o = new THREE.Object3D();
		const col = new THREE.Color();
		for (const [ref, lit] of [[cold, false], [hot, true]] as const) {
			const m = ref.current;
			if (!m) continue;
			for (let i = 0; i < N; i++) {
				const on = order[i] < p;
				const [X, Z] = toW(UNO_PTS[i * 2], UNO_PTS[i * 2 + 1]);
				o.position.set(X, 0.008 + hash(i, 3) * 0.02, Z);
				o.rotation.set(-Math.PI / 2 + (hash(i, 4) - 0.5) * 0.5, 0, hash(i, 5) * Math.PI * 2);
				// al arder, el pétalo se riza un poco y tiembla
				const curl = on ? 1 + 0.15 * Math.sin(t * 9 + i) : 1;
				o.scale.setScalar(on === lit ? (1.1 + hash(i, 6) * 0.45) * curl : 0);
				o.updateMatrix();
				m.setMatrixAt(i, o.matrix);
				col.set((lit ? HOT : COLD)[i % 4]);
				m.setColorAt(i, col);
			}
			m.instanceMatrix.needsUpdate = true;
			if (m.instanceColor) m.instanceColor.needsUpdate = true;
		}
	});
	return (
		<>
			<instancedMesh ref={cold} args={[petalGeo, undefined, N]} receiveShadow>
				<meshStandardMaterial side={THREE.DoubleSide} roughness={0.8} />
			</instancedMesh>
			<instancedMesh ref={hot} args={[petalGeo, undefined, N]}>
				<meshStandardMaterial side={THREE.DoubleSide} roughness={0.6} emissive="#ff4a0a" emissiveIntensity={0.45} />
			</instancedMesh>
		</>
	);
};

// frente de fuego que recorre el 1 de abajo hacia arriba, con brasas que suben
const FireFront: React.FC<{f: number; t: number; cam: V3}> = ({f, t, cam}) => {
	const p = (f - IGN[0]) / (IGN[1] - IGN[0]);
	const after = clamp((f - IGN[1]) / 30);
	if (p <= 0) return null;
	const z = lerp(2.8, -3.5, clamp(p));
	const k = p < 1 ? 1 : 1 - after * 0.6;
	return (
		<>
			<pointLight position={[0, 0.5, z]} intensity={7 * k * flick(t, 1)} distance={0} decay={2} color="#ff9a40" />
			<pointLight position={[0, 1.6, 0]} intensity={6 * clamp(p) * flick(t, 5)} distance={0} decay={2} color="#ffb050" />
			{p < 1.05 ? <Glow3D pos={[0, 0.25, z]} size={2.6} cam={cam} color="#ffa040" intensity={0.55} /> : null}
			{p < 1.1
				? Array.from({length: 24}, (_, e) => {
						const life = (t * 0.8 + hash(e, 9)) % 1;
						const x = (hash(e, 10) - 0.5) * 2.4;
						const zz = z + (hash(e, 11) - 0.5) * 1.2;
						return <Glow3D key={e} pos={[x, 0.1 + life * 2.4, zz]} size={0.09} cam={cam} color="#ffb04a" intensity={(1 - life) * 1.4} sharp={6} />;
					})
				: null}
		</>
	);
};

// ---------- veladora: vaso, cera, flama, luz real y corona de cempasúchil ----------
const Veladora: React.FC<{X: number; Z: number; k: number; t: number; i: number; cam: V3}> = ({X, Z, k, t, i, cam}) => (
	<group position={[X, 0, Z]} scale={1.6}>
		{Array.from({length: 8}, (_, j) => {
			const a = (j / 8) * Math.PI * 2 + i;
			return <Cempasuchil3D key={j} pos={[Math.cos(a) * 0.36, 0.02, Math.sin(a) * 0.36]} s={0.06} rot={[0.15 * Math.sin(a * 3), a, 0]} seed={j + i * 8} lit={0.55 + 0.45 * k} />;
		})}
		<mesh position={[0, 0.075, 0]}>
			<cylinderGeometry args={[0.07, 0.07, 0.15, 24]} />
			<meshStandardMaterial color="#efe3c8" roughness={0.5} emissive="#ffb060" emissiveIntensity={0.35 * k} />
		</mesh>
		<mesh position={[0, 0.11, 0]}>
			<cylinderGeometry args={[0.095, 0.085, 0.22, 24, 1, true]} />
			<meshStandardMaterial color="#f4ead6" roughness={0.15} transparent opacity={0.28} side={THREE.DoubleSide} depthWrite={false} />
		</mesh>
		{k > 0 ? (
			<>
				<Flame3D pos={[0, 0.15, 0]} size={0.16} t={t + i} cam={[(cam[0] - X) / 1.6, cam[1] / 1.6, (cam[2] - Z) / 1.6]} seed={i} grow={k} intensity={1.2} />
				<pointLight position={[0, 0.45, 0]} intensity={5 * k * flick(t, i)} distance={0} decay={2} color="#ffb060" />
			</>
		) : null}
	</group>
);

// ---------- la seña de cada leyenda (detalles chicos en 3D) ----------
const Ribbon: React.FC<{X: number; Z: number; ang: number; t: number; k: number}> = ({X, Z, ang, t, k}) => {
	const geo = useMemo(() => {
		const pts: THREE.Vector3[] = [];
		for (let j = 0; j <= 24; j++) {
			const u = j / 24;
			const d = 0.35 + u * 0.9;
			const s = Math.sin(u * 7 + t * 1.5) * 0.12;
			pts.push(new THREE.Vector3(X + Math.cos(ang) * d - Math.sin(ang) * s, 0.015 + 0.01 * Math.sin(u * 9), Z + Math.sin(ang) * d + Math.cos(ang) * s));
		}
		return new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 48, 0.018, 6, false);
	}, [X, Z, ang, t]);
	return (
		<mesh geometry={geo}>
			<meshStandardMaterial color="#b0301f" roughness={0.55} emissive="#4a0a04" emissiveIntensity={0.5 * k} />
		</mesh>
	);
};
const Signo: React.FC<{sig: Sig; X: number; Z: number; ang: number; k: number; t: number; cam: V3}> = ({sig, X, Z, ang, k, t, cam}) => {
	if (k <= 0) return null;
	// hacia afuera del círculo para no tapar el camino
	const ox = Math.cos(ang);
	const oz = Math.sin(ang);
	const P = (d: number, side: number, y: number): V3 => [X + ox * d - oz * side, y, Z + oz * d + ox * side];
	switch (sig) {
		case 'orb': {
			const p = P(0.45, 0.3, 1.0 + Math.sin(t * 2.2) * 0.1);
			return (
				<>
					<Glow3D pos={p} size={1.1} cam={cam} color="#ff7a2a" intensity={0.8 * k} />
					<Flame3D pos={[p[0], p[1] - 0.15, p[2]]} size={0.38} t={t * 1.3} cam={cam} seed={11} grow={k} />
					<pointLight position={p} intensity={4 * k * flick(t, 7)} distance={0} decay={2} color="#ff7a2a" />
				</>
			);
		}
		case 'eyesG':
		case 'eyesR': {
			const blink = (t * 0.6) % 1 > 0.94 ? 0.1 : 1;
			const col = sig === 'eyesG' ? '#a8f070' : '#ff3a20';
			const sep = sig === 'eyesG' ? 0.1 : 0.07;
			const y = sig === 'eyesG' ? 0.45 : 0.28;
			return (
				<>
					{[-1, 1].map((s) => (
						<Glow3D key={s} pos={P(0.75, s * sep, y)} size={0.16} cam={cam} color={col} intensity={1.6 * k * blink} sharp={9} />
					))}
				</>
			);
		}
		case 'coin':
			return (
				<mesh position={P(0.55, 0.25, 0.01)} rotation={[0.05, ang, 0]}>
					<cylinderGeometry args={[0.1, 0.1, 0.014, 32]} />
					<meshStandardMaterial color="#d9a637" metalness={1} roughness={0.28} emissive="#5a3a08" emissiveIntensity={0.4 * k} />
				</mesh>
			);
		case 'cross': {
			const p = P(0.6, -0.25, 0);
			return (
				<group position={p} rotation={[0, -ang + Math.PI / 2, 0]}>
					<mesh position={[0, 0.32, 0]}>
						<boxGeometry args={[0.05, 0.64, 0.05]} />
						<meshStandardMaterial color="#5a3d22" roughness={0.9} />
					</mesh>
					<mesh position={[0, 0.48, 0]}>
						<boxGeometry args={[0.3, 0.05, 0.05]} />
						<meshStandardMaterial color="#5a3d22" roughness={0.9} />
					</mesh>
				</group>
			);
		}
		case 'veil':
			return <Glow3D pos={P(0.7, 0.2 + Math.sin(t * 0.9) * 0.08, 0.75)} size={1.5} cam={cam} color="#dfe8ea" intensity={0.35 * k} sharp={3} />;
		case 'ribbon':
			return (
				<>
					<Ribbon X={X} Z={Z} ang={ang} t={t} k={k} />
					{Array.from({length: 6}, (_, j) => (
						<Glow3D key={j} pos={P(0.6 + Math.sin(t * 0.7 + j) * 0.3, Math.cos(t * 0.5 + j * 2) * 0.5, 0.4 + 0.25 * Math.sin(t * 1.3 + j))} size={0.08} cam={cam} color="#c8f080" intensity={(0.6 + 0.6 * Math.sin(t * 4 + j * 2)) * k} sharp={8} />
					))}
				</>
			);
	}
	return null;
};

const World: React.FC<{f: number}> = ({f}) => {
	const t = f / FPS;
	const {pos, look, up} = cam3(f);
	return (
		<>
			<Camera pos={pos} look={look} fov={FOV} up={up} />
			<fog attach="fog" args={['#070403', 9, 30]} />
			<hemisphereLight args={['#3a4a60', '#1a0e06', 0.7]} />
			<Floor />
			<Petals f={f} t={t} />
			<FireFront f={f} t={t} cam={pos} />
			{ALT.map((a, i) => {
				const k = E.out(clamp((f - a.at) / 10));
				const ks = E.inOut(clamp((f - a.at - 6) / 14));
				return (
					<React.Fragment key={i}>
						<Veladora X={a.X} Z={a.Z} k={k} t={t} i={i} cam={pos} />
						<Signo sig={a.sig} X={a.X} Z={a.Z} ang={a.ang} k={ks} t={t} cam={pos} />
					</React.Fragment>
				);
			})}
		</>
	);
};

export const Ep01: React.FC<{dias: number; fecha: string}> = ({dias, fecha}) => {
	const f = useCurrentFrame();
	const fadeIn = 1 - E.out(clamp(f / 14));
	return (
		<AbsoluteFill style={{background: '#070403'}}>
			<Stage3D fov={FOV} near={0.05} far={200}>
				<World f={f} />
			</Stage3D>
			{/* viñeta y entrada desde negro */}
			<AbsoluteFill style={{background: 'radial-gradient(ellipse 75% 60% at 50% 50%, rgba(0,0,0,0) 55%, rgba(0,0,0,0.75) 100%)'}} />
			<AbsoluteFill style={{background: '#000', opacity: fadeIn}} />
			{f >= LOCK ? <LeyendaLockup f={f} at={LOCK} dias={dias} fecha={fecha} /> : null}
		</AbsoluteFill>
	);
};
