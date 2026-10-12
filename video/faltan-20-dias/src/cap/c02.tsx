import React, {useMemo} from 'react';
import {AbsoluteFill, Sequence, useCurrentFrame} from 'remotion';
import {C, E, FPS, H, W, clamp, flicker, hash, lerp, ramp, rgba} from '../lib/util';
import {Flame, Light, PaperTexture, useCanvasDraw} from '../components/core';
import {useGlyph} from '../countdown/reveals';
import {Orb, Sky} from './kit/land';
import {Camera, Maguey3D, Range, Stage3D, THREE, makeProjector} from './kit/three';
import {Kinetic, Lockup, NUM_Y, numSize} from './kit/type';
import {Dip} from './kit/transitions';
import {Monarcas3D, type Mariposa} from './c13';

// Capítulo 2 · "El camino" — la víspera se abre la puerta y un camino de pétalos
// se dibuja solo hasta la casa. Visto desde el cielo, el camino escribe el número.
export const C02 = {S1: 114, S2: 108, S3: 72, REV: 132, HIT: 74};
export const C02_LEN = C02.S1 + C02.S2 + C02.S3 + C02.REV;

// ---------- Mundo 3D: la casa, la puerta, el campo nocturno y el camino de pétalos ----------
// La puerta está en z = 0 (muro en el plano XY); afuera es z < 0. La cámara empieza dentro de la casa (z > 0).
const PUERTA = {w: 2.2, h: 3.6};
const muroGeo = (() => {
	const sh = new THREE.Shape();
	sh.moveTo(-12, -0.5);
	sh.lineTo(12, -0.5);
	sh.lineTo(12, 9);
	sh.lineTo(-12, 9);
	sh.closePath();
	const hole = new THREE.Path();
	hole.moveTo(-PUERTA.w / 2, 0);
	hole.lineTo(PUERTA.w / 2, 0);
	hole.lineTo(PUERTA.w / 2, PUERTA.h);
	hole.lineTo(-PUERTA.w / 2, PUERTA.h);
	hole.closePath();
	sh.holes.push(hole);
	return new THREE.ExtrudeGeometry(sh, {depth: 0.5, bevelEnabled: false});
})();

// camino: curva en el suelo desde la puerta hacia los cerros
export const CAMINO = new THREE.CatmullRomCurve3([
	new THREE.Vector3(0, 0, -0.6),
	new THREE.Vector3(0.6, 0, -6),
	new THREE.Vector3(-1.6, 0, -14),
	new THREE.Vector3(1.4, 0, -24),
	new THREE.Vector3(-1.0, 0, -36),
	new THREE.Vector3(0.8, 0, -52),
]);
const N_PET = 1600;
const PETALOS = Array.from({length: N_PET}).map((_, i) => {
	const u = hash(i, 1) ** 1.2;
	const p = CAMINO.getPoint(u);
	const tng = CAMINO.getTangent(u);
	const side = (hash(i, 2) - 0.5) * 1.4;
	return {u, x: p.x + -tng.z * side, z: p.z + tng.x * side, rot: hash(i, 3) * 6.28, s: 0.09 + 0.06 * hash(i, 4), c: hash(i, 5)};
});
const petGeo = new THREE.CircleGeometry(1, 8).scale(1, 0.6, 1);
const PET_COLS = ['#F26D3D', '#F79A3A', '#F5C242', '#c84a1e'].map((c) => new THREE.Color(c));

// pétalos instanciados: aparecen hasta "reach" (0..1 del camino) y caen al llegar el frente
const Petalos3D: React.FC<{reach: number; items?: typeof PETALOS}> = ({reach, items = PETALOS}) => {
	const ref = React.useRef<THREE.InstancedMesh>(null);
	React.useLayoutEffect(() => {
		const m = ref.current;
		if (!m) return;
		const o = new THREE.Object3D();
		items.forEach((q, i) => {
			const age = clamp((reach - q.u) * 14);
			const vis = q.u <= reach;
			o.position.set(q.x, 0.02 + (1 - E.out(age)) * 1.2, q.z);
			o.rotation.set(-Math.PI / 2 + (1 - age) * 1.2, 0, q.rot + (1 - age) * 3);
			o.scale.setScalar(vis ? q.s : 0.0001);
			o.updateMatrix();
			m.setMatrixAt(i, o.matrix);
			m.setColorAt(i, PET_COLS[Math.floor(q.c * 4)]);
		});
		m.instanceMatrix.needsUpdate = true;
		if (m.instanceColor) m.instanceColor.needsUpdate = true;
	});
	return (
		<instancedMesh ref={ref} args={[petGeo, undefined, items.length]} receiveShadow>
			<meshStandardMaterial side={THREE.DoubleSide} roughness={0.8} emissive="#a03a10" emissiveIntensity={0.25} />
		</instancedMesh>
	);
};

const FAROLES_U = [0.06, 0.14, 0.24, 0.36, 0.5, 0.66, 0.82];
const farolPos = (k: number): [number, number, number] => {
	const u = FAROLES_U[k];
	const p = CAMINO.getPoint(u);
	const tng = CAMINO.getTangent(u);
	const side = k % 2 ? 1.2 : -1.2;
	return [p.x - tng.z * side, 0, p.z + tng.x * side];
};

export const Campo: React.FC<{reach: number; light: number}> = ({reach, light}) => (
	<>
		<mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, -40]} receiveShadow>
			<planeGeometry args={[200, 120]} />
			<meshStandardMaterial color="#100a07" roughness={1} />
		</mesh>
		<Range z={-110} x0={-120} x1={120} n={10} r={24} h={16} color="#0e0912" seed={21} />
		<Range z={-75} x0={-90} x1={90} n={8} r={14} h={7} color="#120c10" seed={22} />
		{[[-6, -8, 1.6], [7, -14, 1.4], [-9, -22, 1.2], [9, -30, 1.3], [-5, -40, 1.0]].map(([x, z, sc], i) => (
			<Maguey3D key={i} pos={[x, 0, z]} s={sc} color="#18261a" seed={i + 3} />
		))}
		<Petalos3D reach={reach} />
		{FAROLES_U.map((_, k) => {
			const g = clamp(light * (FAROLES_U.length + 2) - (FAROLES_U.length - 1 - k));
			const p = farolPos(k);
			return g > 0 ? (
				<group key={k}>
					<mesh position={[p[0], 0.18 * E.out(g), p[2]]}>
						<cylinderGeometry args={[0.12, 0.12, 0.36 * E.out(g), 10]} />
						<meshStandardMaterial color={C.cempa} emissive={C.cempa} emissiveIntensity={0.8} />
					</mesh>
					<pointLight position={[p[0], 0.6, p[2]]} intensity={5 * g} distance={5} color={C.flama} />
				</group>
			) : null;
		})}
	</>
);
export const LlamasFaroles: React.FC<{light: number; P: ReturnType<typeof makeProjector>; t: number}> = ({light, P, t}) => (
	<>
		{FAROLES_U.map((_, k) => {
			const g = clamp(light * (FAROLES_U.length + 2) - (FAROLES_U.length - 1 - k));
			if (g <= 0) return null;
			const q = farolPos(k);
			const p = P(q[0], 0.38, q[2]);
			if (!p.ok) return null;
			const fl = flicker(t + k, 50 + k);
			return (
				<React.Fragment key={k}>
					<Light x={p.x} y={p.y - 10} r={1600 / p.d} color={C.flama} o={0.55 * g * fl} />
					<Flame x={p.x} y={p.y} size={420 / p.d} t={t + k * 1.3} seed={60 + k} grow={g} fl={fl} wick={false} />
				</React.Fragment>
			);
		})}
	</>
);

const NocheCielo: React.FC<{t: number}> = ({t}) => (
	<>
		<Sky t={t} top="#05030c" mid="#0f0a1c" horizon="#2a1a26" hy={1050} stars={140} />
		<Orb x={660} y={640} r={34} color="#EEE2C4" core="#FFFBEF" halo={4} o={0.85} />
	</>
);

export const LucesNoche: React.FC<{warm?: number}> = ({warm = 1}) => (
	<>
		<hemisphereLight args={['#6a6a90', '#0a0608', 0.45]} />
		<directionalLight position={[20, 30, -60]} intensity={0.9} color="#d8d0e8" castShadow shadow-mapSize={[1024, 1024]} />
		{/* luz cálida que sale de la casa por la puerta */}
		<spotLight position={[0, 2, 2]} target-position={[0, 0, -8]} angle={0.6} penumbra={0.7} intensity={40 * warm} distance={30} color={C.flama} castShadow />
	</>
);

// ---------- 1 · La puerta se abre ----------
const Hoja3D: React.FC<{side: -1 | 1; open: number}> = ({side, open}) => (
	<group position={[(side * PUERTA.w) / 2, 0, 0.25]} rotation={[0, side * open * 1.7, 0]}>
		<mesh position={[(-side * PUERTA.w) / 4, PUERTA.h / 2, 0]} castShadow>
			<boxGeometry args={[PUERTA.w / 2, PUERTA.h, 0.12]} />
			<meshStandardMaterial color="#6b3e20" roughness={0.8} />
		</mesh>
		{[0, 1, 2].map((k) => (
			<mesh key={k} position={[(-side * PUERTA.w) / 4, 0.6 + k * 1.15, 0.07]}>
				<boxGeometry args={[PUERTA.w / 2 - 0.25, 0.9, 0.04]} />
				<meshStandardMaterial color="#4a2a16" roughness={0.85} />
			</mesh>
		))}
		<mesh position={[-side * (PUERTA.w / 2 - 0.15), PUERTA.h / 2, 0.1]}>
			<sphereGeometry args={[0.05, 8, 6]} />
			<meshStandardMaterial color="#8a6a3a" metalness={0.6} roughness={0.4} />
		</mesh>
	</group>
);

const Puerta: React.FC = () => {
	const f = useCurrentFrame();
	const t = f / FPS;
	const open = E.inOut(clamp((f - 30) / 50));
	const push = E.in(clamp((f - 80) / 34));
	const fl = flicker(t, 21);
	const cam: [number, number, number] = [lerp(0.4, 0, push), lerp(1.7, 1.6, push), lerp(7.5, -0.5, push)];
	const look: [number, number, number] = [0, 1.7, -10];
	const P = makeProjector(cam, look, 50);
	const velas: [number, number, number][] = [[-2.1, 0, 1.0], [2.1, 0, 1.0]];
	return (
		<AbsoluteFill style={{background: '#000'}}>
			<NocheCielo t={t} />
			<Stage3D fov={50}>
				<Camera pos={cam} look={look} />
				<fog attach="fog" args={['#0e0a14', 25, 110]} />
				<LucesNoche warm={open} />
				<Campo reach={0} light={0} />
				{/* interior de la casa: piso con pétalos y luz cálida de velas */}
				<mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.001, 6]} receiveShadow>
					<planeGeometry args={[24, 12]} />
					<meshStandardMaterial color="#2a1408" roughness={1} />
				</mesh>
				<mesh geometry={muroGeo} position={[0, 0, -0.25]} castShadow receiveShadow>
					<meshStandardMaterial color="#4a2c1a" roughness={0.95} />
				</mesh>
				{/* marco de cantera */}
				{[[-PUERTA.w / 2 - 0.15, PUERTA.h / 2, 0.36, PUERTA.h + 0.3], [PUERTA.w / 2 + 0.15, PUERTA.h / 2, 0.36, PUERTA.h + 0.3], [0, PUERTA.h + 0.15, PUERTA.w + 0.66, 0.36]].map(([x, y, w, h], i) => (
					<mesh key={i} position={[x, y, 0.3]} castShadow>
						<boxGeometry args={[w, h, 0.25]} />
						<meshStandardMaterial color="#8a6a4a" roughness={0.9} />
					</mesh>
				))}
				{/* guirnalda de cempasúchil sobre la puerta */}
				{Array.from({length: 26}).map((_, i) => {
					const u = i / 25;
					return (
						<mesh key={i} position={[lerp(-1.6, 1.6, u), PUERTA.h + 0.45 - Math.sin(Math.PI * u) * 0.35, 0.5]}>
							<icosahedronGeometry args={[0.13, 1]} />
							<meshStandardMaterial color={i % 3 ? C.cempa : C.flama} roughness={0.8} flatShading emissive={C.cempa} emissiveIntensity={0.25} />
						</mesh>
					);
				})}
				<Hoja3D side={-1} open={open} />
				<Hoja3D side={1} open={open} />
				{velas.map((v, i) => (
					<group key={i}>
						<mesh position={[v[0], 0.45, v[2]]} castShadow>
							<cylinderGeometry args={[0.13, 0.13, 0.9, 14]} />
							<meshStandardMaterial color={C.marfil} roughness={0.5} emissive="#5a3010" emissiveIntensity={0.3} />
						</mesh>
						<pointLight position={[v[0], 1.2, v[2] + 0.2]} intensity={3.5 * fl} distance={6} color={C.cempa} />
					</group>
				))}
			</Stage3D>
			{velas.map((v, i) => {
				const p = P(v[0], 0.92, v[2]);
				if (!p.ok || p.d < 1) return null;
				return (
					<React.Fragment key={i}>
						<Light x={p.x} y={p.y} r={2400 / p.d} color={C.flama} o={0.45 * fl} />
						<Flame x={p.x} y={p.y} size={700 / p.d} t={t + i} seed={22 + i} fl={fl} />
					</React.Fragment>
				);
			})}
			<PaperTexture o={0.14} />
			<Kinetic text={'La víspera, se deja\nla puerta abierta.'} f={f} at={10} out={80} y={330} size={50} scrim={0.55} />
		</AbsoluteFill>
	);
};

// ---------- 2 y 3 · El camino y los que vienen ----------
const Afuera: React.FC<{text: string; reach: (f: number) => number; light: (f: number) => number; monarchs: (f: number) => number; t0: number}> = ({text, reach, light, monarchs, t0}) => {
	const f = useCurrentFrame();
	const t = f / FPS + t0;
	const L = light(f);
	const m = monarchs(f);
	const cam: [number, number, number] = [Math.sin(t * 0.2) * 0.4, 2.3, 2.5 - f * 0.01];
	const look: [number, number, number] = [0, 0.8, -14];
	const P = makeProjector(cam, look, 50);
	const mariposas: Mariposa[] = m > 0
		? Array.from({length: 7}).map((_, k) => {
				const u = clamp(0.95 - (m * 1.2 - k * 0.12) * 0.95, 0, 0.95);
				const q = CAMINO.getPoint(u);
				return {p: [q.x + Math.sin(t * 2 + k * 2) * 0.8 + (k - 3) * 0.4, 1.0 + Math.sin(t * 3 + k) * 0.3 + k * 0.1, q.z], head: Math.PI, pitch: 0.3, flap: 0.65 + 0.62 * Math.sin(t * 12 + k * 1.7), s: 0.35};
			})
		: [];
	return (
		<AbsoluteFill>
			<NocheCielo t={t} />
			<Stage3D fov={50}>
				<Camera pos={cam} look={look} />
				<fog attach="fog" args={['#0e0a14', 25, 110]} />
				<LucesNoche />
				<Campo reach={reach(f)} light={L} />
				{mariposas.length ? <Monarcas3D items={mariposas} /> : null}
			</Stage3D>
			<LlamasFaroles light={L} P={P} t={t} />
			<PaperTexture o={0.14} />
			<Kinetic text={text} f={f} at={10} out={text.includes('vienen') ? 200 : 96} y={330} size={50} scrim={0.55} />
		</AbsoluteFill>
	);
};

// ---------- 4 · Desde arriba: el camino escribe el número ----------
// Igual que en el día 4: picada final desde 26.4 u con fov 40 (100 px por unidad, z = -1 cae en NUM_Y)
const Trazo: React.FC<{dias: number; fecha: string}> = ({dias, fecha}) => {
	const f = useCurrentFrame();
	const t = f / FPS + 20;
	const txt = String(dias);
	const size = numSize(txt);
	const HIT = C02.HIT;
	const g = useGlyph(txt, size, 17, 2);
	const order = useMemo(() => {
		if (!g) return [] as number[];
		const pts = g.pts;
		const used = new Uint8Array(pts.length);
		let cur = pts.reduce((m, p, i) => (p[1] > pts[m][1] || (p[1] === pts[m][1] && p[0] < pts[m][0]) ? i : m), 0);
		const out: number[] = [];
		for (let k = 0; k < pts.length; k++) {
			out.push(cur);
			used[cur] = 1;
			let best = -1;
			let bd = 1e12;
			for (let j = 0; j < pts.length; j++) {
				if (used[j]) continue;
				const d = (pts[j][0] - pts[cur][0]) ** 2 + (pts[j][1] - pts[cur][1]) ** 2;
				if (d < bd) [bd, best] = [d, j];
			}
			if (best < 0) break;
			cur = best;
		}
		return out;
	}, [g]);
	const prog = clamp((f - 16) / (HIT - 22));
	// pétalos del número (en el suelo) + tramo desde la puerta (abajo de cuadro)
	const items = useMemo(() => {
		if (!g || !order.length) return [] as typeof PETALOS;
		const start = g.pts[order[0]];
		const lead = Array.from({length: 80}).map((_, i) => {
			const u = i / 80;
			const x = lerp(0, start[0] / 100, u) + Math.sin(u * 9) * 0.4 * (1 - u) + (hash(i, 7) - 0.5) * 0.5;
			const z = lerp(10.5, start[1] / 100 - 1, u) + (hash(i, 8) - 0.5) * 0.2;
			return {u: u * 0.2, x, z, rot: hash(i, 9) * 6.28, s: 0.16, c: hash(i, 10)};
		});
		const body = order.map((idx, k) => {
			const [gx, gy] = g.pts[idx];
			return {u: 0.2 + 0.8 * (k / order.length), x: gx / 100 + (hash(k, 1) - 0.5) * 0.08, z: gy / 100 - 1 + (hash(k, 2) - 0.5) * 0.08, rot: hash(k, 4) * 6.28, s: 0.15 + 0.06 * hash(k, 3), c: hash(k, 5)};
		});
		return [...lead, ...body];
	}, [g, order]);
	const reach = clamp(f / 18) * 0.2 + 0.8 * prog;
	const u = E.inOut(clamp(f / 40));
	const cam: [number, number, number] = [0, lerp(14, 26.4, u), lerp(9, 0.0001, u)];
	const look: [number, number, number] = [0, 0, -1 * u];
	const up: [number, number, number] = [0, 1 - u, -u];
	const P = makeProjector(cam, look, 40, up);
	const n = Math.floor(prog * order.length);
	const head = g && order.length && prog > 0 && prog < 1 ? g.pts[order[Math.min(n, order.length - 1)]] : null;
	const hp = head ? P(head[0] / 100, 0.1, head[1] / 100 - 1) : null;
	const glow = ramp(f, [HIT - 10, HIT + 12], [0, 1], E.inOut);
	return (
		<AbsoluteFill style={{background: '#1b110b'}}>
			<Stage3D fov={40}>
				<Camera pos={cam} look={look} up={up} />
				<ambientLight intensity={0.35} />
				<hemisphereLight args={['#8a7a9a', '#0a0604', 0.5]} />
				<directionalLight position={[6, 20, 8]} intensity={0.8} color="#d8d0e8" castShadow shadow-mapSize={[1024, 1024]} />
				<mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
					<planeGeometry args={[80, 80]} />
					<meshStandardMaterial color="#1e140c" roughness={1} />
				</mesh>
				{Array.from({length: 60}).map((_, i) => (
					<mesh key={i} position={[(hash(i, 1) - 0.5) * 16, 0.05, (hash(i, 2) - 0.5) * 26]} scale={[0.3 + hash(i, 3) * 0.6, 0.08, 0.2 + hash(i, 4) * 0.4]}>
						<sphereGeometry args={[1, 6, 4]} />
						<meshStandardMaterial color="#2a1c12" roughness={1} flatShading />
					</mesh>
				))}
				<Petalos3D reach={reach} items={items} />
				<pointLight position={[0, 0.6, 10]} intensity={30} distance={12} color="#FFE2A0" />
			</Stage3D>
			{hp ? <div style={{position: 'absolute', left: hp.x - 90, top: hp.y - 90, width: 180, height: 180, borderRadius: '50%', background: `radial-gradient(closest-side, ${rgba('#FFF4D6', 0.9)}, ${rgba(C.flama, 0.4)} 30%, transparent)`, mixBlendMode: 'screen'}} /> : null}
			<div style={{position: 'absolute', left: 0, width: W, top: NUM_Y - size / 2, height: size, lineHeight: `${size}px`, textAlign: 'center', fontFamily: 'Rye', fontSize: size, color: C.flama, filter: 'blur(30px)', opacity: 0.5 * glow, mixBlendMode: 'screen'}}>
				{txt}
			</div>
			<AbsoluteFill style={{opacity: glow, background: 'linear-gradient(180deg, transparent 17%, rgba(10,5,3,0.7) 21%, rgba(10,5,3,0.7) 27%, transparent 31%, transparent 57%, rgba(10,5,3,0.75) 60%, rgba(10,5,3,0.75) 70%, transparent 74%)'}} />
			<Lockup f={f} at={HIT + 2} dias={dias} fecha={fecha} />
			<PaperTexture o={0.14} />
			<AbsoluteFill style={{background: '#000', opacity: ramp(f, [C02.REV - 8, C02.REV - 1], [0, 1], E.inOut)}} />
			{void t}
		</AbsoluteFill>
	);
};

export const Cap02: React.FC<{dias: number; fecha: string}> = ({dias, fecha}) => {
	const f = useCurrentFrame();
	const a = C02.S1;
	const b = a + C02.S2;
	const c = b + C02.S3;
	return (
		<AbsoluteFill style={{background: '#000'}}>
			<Sequence durationInFrames={a}>
				<Puerta />
			</Sequence>
			<Sequence from={a} durationInFrames={C02.S2}>
				<Afuera text={'Un camino de pétalos\npara que nadie se pierda.'} reach={(ff) => E.inOut(clamp(ff / 96))} light={() => 0} monarchs={() => 0} t0={4} />
			</Sequence>
			<Sequence from={b} durationInFrames={C02.S3}>
				<Afuera text={'Ya vienen en camino.'} reach={() => 1} light={(ff) => clamp(ff / 50)} monarchs={(ff) => clamp(ff / 72)} t0={8} />
			</Sequence>
			<Sequence from={c} durationInFrames={C02.REV}>
				<Trazo dias={dias} fecha={fecha} />
			</Sequence>
			<Dip f={f} at={a} dur={10} />
			<Dip f={f} at={c} dur={12} />
		</AbsoluteFill>
	);
};
