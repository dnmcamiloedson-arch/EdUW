import React from 'react';
import {AbsoluteFill, Sequence, useCurrentFrame} from 'remotion';
import {noise2D} from '@remotion/noise';
import {C, E, FPS, H, W, clamp, flicker, hash, lerp, mixRGB, ramp, rgba} from '../lib/util';
import {Flame, Light, PaperTexture, useCanvasDraw} from '../components/core';
import {Bokeh, drawPetal} from '../components/Particles';
import {Marigold, CutFilter} from '../components/Calavera';
import {Pompon} from '../components/Objetos';
import {GoldNumber, Kinetic, Lockup, NUM_Y} from './kit/type';
import {Dip, LightLeak, PetalWipe} from './kit/transitions';
import {Camera, Cempasuchil3D, Cordel3D, Stage3D, THREE, project, useSvgTexture} from './kit/three';

// Capítulo 7 (REEL) · "La Catrina" — la muerte también se pone elegante.
export const C07 = {S1: 108, S2: 126, S3: 150, S4: 66, REV: 156, HIT: 58};
export const C07_LEN = C07.S1 + C07.S2 + C07.S3 + C07.S4 + C07.REV;

// ---------- Rostro de catrina (frontal, diseño original) ----------
const Rostro: React.FC<{lit: number; t: number}> = ({lit, t}) => {
	const col = (c: string, k = 1) => rgba(mixRGB(C.ink, c, Math.min(1, lit * k)));
	return (
		<g>
			{/* cuello y encaje */}
			<path d="M -70 250 L -60 360 L 60 360 L 70 250 Z" fill={col(C.marfil, 0.85)} />
			{Array.from({length: 13}).map((_, i) => (
				<circle key={i} cx={-240 + i * 40} cy={400 + Math.sin(i * 0.8) * 4} r={26} fill={col('#F4EEE6', 0.9)} stroke={col(C.arena, 0.7)} strokeWidth={3} />
			))}
			<path d="M -260 400 Q 0 470 260 400 L 300 560 L -300 560 Z" fill={col(C.terracota, 0.9)} />
			{Array.from({length: 9}).map((_, i) => (
				<circle key={'b' + i} cx={-130 + i * 32} cy={415 + Math.abs(i - 4) * -6 + 30} r={9} fill={col(C.flama)} />
			))}
			{/* cráneo */}
			<path d="M -170 -60 C -170 -230 -90 -290 0 -290 C 90 -290 170 -230 170 -60 C 170 40 130 90 110 140 C 100 200 70 260 0 266 C -70 260 -100 200 -110 140 C -130 90 -170 40 -170 -60 Z" fill={col(C.marfil)} />
			{/* órbitas con pétalos */}
			{[-1, 1].map((s) => (
				<g key={s} transform={`translate(${s * 72} -20)`}>
					{Array.from({length: 12}).map((_, i) => (
						<ellipse key={i} cx={0} cy={-62} rx={12} ry={22} transform={`rotate(${i * 30})`} fill={col(i % 2 ? C.cempa : C.terracota)} />
					))}
					<circle r={50} fill="#0d0605" />
					<circle r={6 + 1.5 * Math.sin(t * 2)} cx={-8} cy={-6} fill={C.flama} opacity={0.6} />
				</g>
			))}
			{/* nariz: corazón invertido */}
			<path d="M 0 96 C -40 60 -36 30 -12 30 C -4 30 0 38 0 44 C 0 38 4 30 12 30 C 36 30 40 60 0 96 Z" fill={col(C.terracota)} />
			{/* boca cosida */}
			<path d="M -90 170 Q 0 214 90 170" stroke={col('#3a1a10')} strokeWidth={6} fill="none" />
			{Array.from({length: 11}).map((_, i) => {
				const x = -80 + i * 16;
				const y = 170 + Math.sin((i / 10) * Math.PI) * 22;
				return <path key={i} d={`M ${x} ${y - 14} L ${x} ${y + 14}`} stroke={col('#3a1a10')} strokeWidth={4} />;
			})}
			{/* volutas en mejillas y frente */}
			{[-1, 1].map((s) => (
				<path key={'v' + s} d={`M ${s * 120} 70 c ${s * 30} -10 ${s * 36} 30 ${s * 10} 40 c ${s * -20} 6 ${s * -24} -20 ${s * -6} -24`} stroke={col(C.verde)} strokeWidth={8} fill="none" strokeLinecap="round" />
			))}
			<path d="M 0 -150 C -30 -190 -10 -220 0 -200 C 10 -220 30 -190 0 -150 Z" fill={col(C.verde)} />
			{Array.from({length: 7}).map((_, i) => (
				<circle key={'f' + i} cx={-90 + i * 30} cy={-120 - Math.sin((i / 6) * Math.PI) * 26} r={7} fill={col(i % 2 ? C.flama : C.cempa)} />
			))}
			{/* aretes */}
			{[-1, 1].map((s) => (
				<g key={'a' + s} transform={`translate(${s * 168} ${120 + Math.sin(t * 2 + s) * 4})`}>
					<circle r={10} fill={col(C.flama)} />
					<path d="M 0 10 L -14 50 L 14 50 Z" fill={col(C.cempa)} />
				</g>
			))}
		</g>
	);
};

// ---------- Sombrero de ala ancha con flores y plumas ----------
const Sombrero: React.FC<{lit: number; t: number}> = ({lit, t}) => {
	const col = (c: string, k = 1) => rgba(mixRGB(C.ink, c, Math.min(1, lit * k)));
	return (
		<g>
			{/* plumas */}
			{Array.from({length: 7}).map((_, i) => {
				const a = -60 + i * 20 + Math.sin(t * 1.5 + i) * 3;
				return (
					<g key={i} transform={`translate(${-20 + i * 8} -380) rotate(${a})`}>
						<path d="M 0 0 C -30 -120 -10 -260 40 -340 C 60 -250 50 -120 0 0 Z" fill={col(i % 2 ? C.arena : C.marfil, 0.95)} />
						<path d="M 0 0 C 0 -120 20 -240 40 -340" stroke={col('#8a7a68')} strokeWidth={3} fill="none" />
					</g>
				);
			})}
			{/* copa */}
			<path d="M -180 -260 C -180 -420 180 -420 180 -260 Z" fill={col('#1a0c10')} />
			{/* ala */}
			<ellipse cx={0} cy={-250} rx={430} ry={92} fill={col('#22101a')} />
			<ellipse cx={0} cy={-262} rx={410} ry={70} fill={col('#2e1622')} />
			<path d="M -180 -270 Q 0 -230 180 -270 L 180 -300 Q 0 -262 -180 -300 Z" fill={col(C.terracota)} />
			{/* flores */}
			<Marigold x={-200} y={-300} s={0.62} lit={lit} filter="" />
			<Marigold x={-60} y={-340} s={0.5} lit={lit} leaves={false} filter="" />
			<Pompon x={120} y={-310} r={44} lit={lit} seed={3} />
			<Pompon x={220} y={-290} r={34} lit={lit} seed={5} />
			<Pompon x={-310} y={-268} r={30} lit={lit} seed={7} />
			{/* listón que cae */}
			<path d={`M 300 -250 C 340 -150 ${320 + Math.sin(t * 2) * 20} -40 ${360 + Math.sin(t * 2) * 30} 80`} stroke={col(C.verde)} strokeWidth={24} fill="none" strokeLinecap="round" />
		</g>
	);
};

const Catrina: React.FC<{x: number; y: number; s: number; lit: number; t: number; tilt?: number}> = ({x, y, s, lit, t, tilt = 0}) => (
	<svg width={W} height={H} style={{position: 'absolute', inset: 0, overflow: 'visible'}}>
		<g transform={`translate(${x} ${y}) scale(${s}) rotate(${tilt})`}>
			<Rostro lit={lit} t={t} />
			<Sombrero lit={lit} t={t} />
		</g>
	</svg>
);

// La catrina ilustrada como textura (para el espejo y el cuadro)
const CatrinaTex = () =>
	useSvgTexture(
		<g transform="translate(450 760) scale(1.05)">
			<Rostro lit={1} t={0} />
			<Sombrero lit={1} t={0} />
		</g>,
		900,
		1200,
		'catrina',
	);

// velas 3D con llama 2D proyectada
type Vela = {p: [number, number, number]; h: number; r?: number};
const Velas3D: React.FC<{velas: Vela[]}> = ({velas}) => (
	<>
		{velas.map((v, i) => (
			<mesh key={i} position={[v.p[0], v.p[1] + v.h / 2, v.p[2]]} castShadow>
				<cylinderGeometry args={[v.r ?? 0.09, v.r ?? 0.09, v.h, 16]} />
				<meshStandardMaterial color={C.marfil} roughness={0.5} emissive="#5a3010" emissiveIntensity={0.3} />
			</mesh>
		))}
	</>
);
const LlamasVelas: React.FC<{velas: Vela[]; cam: [number, number, number]; look: [number, number, number]; fov: number; t: number; fl: number; k?: number}> = ({velas, cam, look, fov, t, fl, k = 1}) => (
	<>
		{velas.map((v, i) => {
			const tip: [number, number, number] = [v.p[0], v.p[1] + v.h + 0.02, v.p[2]];
			const pr = project(tip, cam, look, fov);
			const d = Math.hypot(tip[0] - cam[0], tip[1] - cam[1], tip[2] - cam[2]);
			return (
				<React.Fragment key={i}>
					<Light x={pr.x} y={pr.y - 20} r={(1600 / d) * k} color={C.cempa} o={0.35 * fl} />
					<Flame x={pr.x} y={pr.y} size={(520 / d) * k} t={t + i * 1.7} seed={71 + i} fl={fl} />
				</React.Fragment>
			);
		})}
	</>
);

// ---------- Escena 1: el tocador en 3D ----------
const MarcoOval: React.FC<{rx: number; ry: number; tube?: number}> = ({rx, ry, tube = 0.12}) => (
	<group>
		<mesh scale={[rx, ry, 1]} castShadow>
			<torusGeometry args={[1, tube / Math.min(rx, ry), 12, 64]} />
			<meshStandardMaterial color="#c8902a" metalness={0.85} roughness={0.3} />
		</mesh>
		{/* cuentas del marco */}
		{Array.from({length: 28}).map((_, i) => {
			const a = (i / 28) * Math.PI * 2;
			return (
				<mesh key={i} position={[Math.cos(a) * (rx + 0.13), Math.sin(a) * (ry + 0.13), 0.02]}>
					<sphereGeometry args={[0.055, 10, 8]} />
					<meshStandardMaterial color="#e0b050" metalness={0.8} roughness={0.25} />
				</mesh>
			);
		})}
	</group>
);

const Tocador: React.FC = () => {
	const f = useCurrentFrame();
	const t = f / FPS;
	const fl = flicker(t, 71);
	const appear = E.inOut(clamp((f - 20) / 60));
	const u = E.inOut(clamp(f / C07.S1));
	const cam: [number, number, number] = [lerp(-1.3, -0.5, u), 1.9, lerp(7.8, 6.6, u)];
	const look: [number, number, number] = [0, 2.0, 0];
	const tex = CatrinaTex();
	const velas: Vela[] = [{p: [-1.7, 0.9, 0.5], h: 0.7}, {p: [1.6, 0.9, 0.6], h: 0.5}];
	return (
		<AbsoluteFill style={{background: '#080305'}}>
			<Stage3D fov={45}>
				<Camera pos={cam} look={look} />
				<ambientLight intensity={0.18} />
				<pointLight position={[-1.7, 1.9, 0.7]} intensity={9 * fl} distance={10} color={C.cempa} castShadow />
				<pointLight position={[1.6, 1.7, 0.8]} intensity={6 * fl} distance={10} color={C.cempa} />
				<directionalLight position={[3, 5, 4]} intensity={0.3} color="#a898c8" />
				{/* pared */}
				<mesh position={[0, 2, -0.3]} receiveShadow>
					<planeGeometry args={[14, 8]} />
					<meshStandardMaterial color="#2a1418" roughness={1} />
				</mesh>
				{/* tocador */}
				<mesh position={[0, 0.45, 0.4]} castShadow receiveShadow>
					<boxGeometry args={[4.4, 0.9, 1.2]} />
					<meshStandardMaterial color="#3a1e10" roughness={0.6} />
				</mesh>
				<mesh position={[0, 0.92, 0.4]} castShadow>
					<boxGeometry args={[4.5, 0.05, 1.25]} />
					<meshStandardMaterial color="#5a3018" roughness={0.4} />
				</mesh>
				{/* espejo */}
				<group position={[0, 2.35, -0.1]}>
					<MarcoOval rx={1.05} ry={1.4} />
					<mesh scale={[1.05, 1.4, 1]}>
						<circleGeometry args={[1, 64]} />
						<meshStandardMaterial color="#1a1018" roughness={0.1} metalness={0.6} />
					</mesh>
					<mesh position={[0, -0.05, 0.01]} scale={[1, 1, 1]}>
						<planeGeometry args={[1.95, 2.6]} />
						<meshBasicMaterial map={tex} transparent opacity={0.85 * appear} color="#e0c8b8" />
					</mesh>
				</group>
				<Velas3D velas={velas} />
				{/* perfumeros de vidrio */}
				{[[-0.9, 0.5], [-0.6, 0.65], [0.9, 0.55]].map(([x, z], i) => (
					<group key={i} position={[x, 0.95, z]}>
						<mesh position={[0, 0.16, 0]}>
							<sphereGeometry args={[0.16, 16, 12]} />
							<meshStandardMaterial color={i === 1 ? '#a83a5a' : '#c8a060'} transparent opacity={0.6} roughness={0.05} metalness={0.2} />
						</mesh>
						<mesh position={[0, 0.36, 0]}>
							<cylinderGeometry args={[0.03, 0.04, 0.12, 8]} />
							<meshStandardMaterial color="#c8902a" metalness={0.8} roughness={0.3} />
						</mesh>
					</group>
				))}
				<Cempasuchil3D pos={[1.05, 1.15, 0.35]} s={0.12} rot={[0.5, 0, 0]} />
				<Cempasuchil3D pos={[1.25, 1.1, 0.5]} s={0.1} rot={[0.6, 0.5, 0]} />
			</Stage3D>
			<LlamasVelas velas={velas} cam={cam} look={look} fov={45} t={t} fl={fl} />
			<PaperTexture o={0.18} />
			<Kinetic text={'La muerte también\nse pone elegante.'} f={f} at={12} out={96} y={1500} size={54} scrim={0.45} />
		</AbsoluteFill>
	);
};

// ---------- Escena 2: el retrato en su marco dorado ----------
const Retrato: React.FC = () => {
	const f = useCurrentFrame();
	const t = f / FPS + 4;
	const fl = flicker(t, 73);
	const u = E.inOut(clamp(f / C07.S2));
	const cam: [number, number, number] = [lerp(-0.9, 0.6, u), lerp(0.6, 2.2, u), lerp(7.4, 6.6, u)];
	const look: [number, number, number] = [0, lerp(1.2, 2.4, u), 0];
	const tex = CatrinaTex();
	return (
		<AbsoluteFill style={{background: '#0a0406'}}>
			<Bokeh t={t} L={0.8} n={16} seed={74} blur={6} />
			<Stage3D fov={45}>
				<Camera pos={cam} look={look} />
				<ambientLight intensity={0.2} />
				<pointLight position={[-2, 1, 2]} intensity={14 * fl} distance={12} color={C.cempa} castShadow />
				<directionalLight position={[2, 6, 4]} intensity={0.5} color="#b8a8d8" />
				<mesh position={[0, 2, -0.15]} receiveShadow>
					<planeGeometry args={[12, 10]} />
					<meshStandardMaterial color="#26121a" roughness={1} />
				</mesh>
				<group position={[0, 2, 0]}>
					{/* marco dorado con moldura */}
					{[
						[0, 1.75, 2.9, 0.3],
						[0, -1.75, 2.9, 0.3],
						[-1.3, 0, 0.3, 3.8],
						[1.3, 0, 0.3, 3.8],
					].map(([x, y, w, h], i) => (
						<mesh key={i} position={[x, y, 0.05]} castShadow>
							<boxGeometry args={[w, h, 0.18]} />
							<meshStandardMaterial color="#c8902a" metalness={0.85} roughness={0.3} />
						</mesh>
					))}
					<mesh position={[0, 0, 0]}>
						<planeGeometry args={[2.4, 3.3]} />
						<meshStandardMaterial color="#1a0c10" roughness={0.9} />
					</mesh>
					<mesh position={[0, -0.05, 0.01]}>
						<planeGeometry args={[2.4, 3.2]} />
						<meshStandardMaterial map={tex} transparent roughness={0.7} />
					</mesh>
				</group>
				<Velas3D velas={[{p: [-1.9, -0.6, 0.6], h: 1.1, r: 0.11}]} />
			</Stage3D>
			<LlamasVelas velas={[{p: [-1.9, -0.6, 0.6], h: 1.1}]} cam={cam} look={look} fov={45} t={t} fl={fl} />
			<PaperTexture o={0.16} />
			<Kinetic text={'Posada la dibujó;\nel pueblo la hizo reina.'} f={f} at={14} out={110} y={1500} size={48} scrim={0.8} />
		</AbsoluteFill>
	);
};

// ---------- Escena 3: el vals (bailarina 3D que gira) ----------
const Falda: React.FC<{rTop: number; rBot: number; h: number; y: number; color: string; t: number; flare: number}> = ({rTop, rBot, h, y, color, t, flare}) => {
	const geo = React.useMemo(() => new THREE.CylinderGeometry(rTop, rBot, h, 48, 6, true), [rTop, rBot, h]);
	const base = React.useMemo(() => Float32Array.from(geo.attributes.position.array as Float32Array), [geo]);
	React.useLayoutEffect(() => {
		const p = geo.attributes.position as THREE.BufferAttribute;
		for (let i = 0; i < p.count; i++) {
			const x = base[i * 3];
			const yy = base[i * 3 + 1];
			const z = base[i * 3 + 2];
			const u = (h / 2 - yy) / h; // 0 cintura, 1 dobladillo
			const a = Math.atan2(z, x);
			const k = 1 + u * (flare + 0.08 * Math.sin(a * 10 + t * 6));
			p.setXYZ(i, x * k, yy + u * u * 0.06 * Math.sin(a * 6 - t * 5), z * k);
		}
		p.needsUpdate = true;
		geo.computeVertexNormals();
	});
	return (
		<mesh geometry={geo} position={[0, y, 0]} castShadow>
			<meshStandardMaterial color={color} side={THREE.DoubleSide} roughness={0.7} />
		</mesh>
	);
};

const Bailarina3D: React.FC<{t: number; spin: number}> = ({t, spin}) => {
	const flare = 0.25 + 0.2 * Math.abs(Math.sin(spin));
	const brazo = (pts: [number, number, number][]) => new THREE.CatmullRomCurve3(pts.map((q) => new THREE.Vector3(...q)));
	return (
		<group rotation={[0, spin, 0]}>
			<Falda rTop={0.24} rBot={1.25} h={1.7} y={0.95} color={C.terracota} t={t} flare={flare} />
			<Falda rTop={0.22} rBot={1.0} h={1.35} y={1.15} color={C.cempa} t={t + 0.4} flare={flare * 0.9} />
			<Falda rTop={0.2} rBot={0.78} h={1.0} y={1.35} color={C.flama} t={t + 0.8} flare={flare * 0.8} />
			{/* torso */}
			<mesh position={[0, 2.15, 0]} castShadow>
				<cylinderGeometry args={[0.24, 0.18, 0.75, 16]} />
				<meshStandardMaterial color="#1a0c10" roughness={0.6} />
			</mesh>
			{/* cuello de encaje */}
			<mesh position={[0, 2.55, 0]}>
				<torusGeometry args={[0.16, 0.05, 8, 20]} />
				<meshStandardMaterial color="#f4eee6" roughness={0.8} />
			</mesh>
			{/* cabeza (calavera) */}
			<mesh position={[0, 2.82, 0]} scale={[0.9, 1.05, 0.95]} castShadow>
				<sphereGeometry args={[0.22, 20, 16]} />
				<meshStandardMaterial color="#efe6d6" roughness={0.6} />
			</mesh>
			{[-1, 1].map((sd) => (
				<mesh key={sd} position={[sd * 0.075, 2.85, 0.17]}>
					<sphereGeometry args={[0.055, 12, 10]} />
					<meshStandardMaterial color="#120806" roughness={0.4} />
				</mesh>
			))}
			{/* sombrero con flores */}
			<mesh position={[0, 3.0, 0]} rotation={[0.15, 0, 0]} castShadow>
				<cylinderGeometry args={[0.62, 0.62, 0.03, 32]} />
				<meshStandardMaterial color="#22101a" roughness={0.6} />
			</mesh>
			<mesh position={[0, 3.12, -0.02]} rotation={[0.15, 0, 0]} castShadow>
				<cylinderGeometry args={[0.2, 0.24, 0.24, 20]} />
				<meshStandardMaterial color="#1a0c10" roughness={0.6} />
			</mesh>
			{[[-0.3, 0.12], [-0.12, 0.25], [0.2, 0.22]].map(([x, z], i) => (
				<Cempasuchil3D key={i} pos={[x, 3.06, z]} s={0.07} rot={[0.4, 0, 0]} seed={i + 3} />
			))}
			{/* brazos: uno en alto con el abanico */}
			<mesh castShadow>
				<tubeGeometry args={[brazo([[0.22, 2.4, 0], [0.5, 2.7, 0.1], [0.6, 3.2, 0.15], [0.55, 3.5, 0.1]]), 16, 0.045, 8, false]} />
				<meshStandardMaterial color="#e8dcc8" roughness={0.6} />
			</mesh>
			<mesh castShadow>
				<tubeGeometry args={[brazo([[-0.22, 2.4, 0], [-0.5, 2.1, 0.15], [-0.55, 1.7, 0.25], [-0.5, 1.45, 0.3]]), 16, 0.045, 8, false]} />
				<meshStandardMaterial color="#e8dcc8" roughness={0.6} />
			</mesh>
			<mesh position={[0.55, 3.65, 0.1]} rotation={[0, 0, Math.sin(t * 3) * 0.2]}>
				<circleGeometry args={[0.35, 16, 0, Math.PI]} />
				<meshStandardMaterial color={C.verde} side={THREE.DoubleSide} roughness={0.8} />
			</mesh>
		</group>
	);
};

const Vals: React.FC = () => {
	const f = useCurrentFrame();
	const t = f / FPS + 8;
	const fl = flicker(t, 75);
	const spin = t * 2.4;
	const orb = lerp(-0.3, 0.3, E.inOut(clamp(f / C07.S3)));
	const cam: [number, number, number] = [Math.sin(orb) * 7.5, 1.6, Math.cos(orb) * 7.5];
	const look: [number, number, number] = [0, 2.2, 0];
	const velas: Vela[] = [-3, -1.8, 1.8, 3].map((x, i) => ({p: [x, 0, -1.5 - (i % 2) * 0.8], h: 0.9, r: 0.1}));
	const ref = useCanvasDraw(
		(ctx) => {
			for (let i = 0; i < 60; i++) {
				const r = (q: number) => hash(i * 5 + q, 76);
				const a = r(1) * 6.28 + t * (0.8 + r(2));
				const rad = 260 + 380 * r(3);
				const x = 540 + Math.cos(a) * rad;
				const y = 1200 + Math.sin(a) * rad * 0.35 - 200 * r(4);
				drawPetal(ctx, x, y, 26 + 14 * r(5), a + t, Math.cos(t * 4 + i), 0.85, 0.85, r(6));
			}
		},
		[f],
	);
	return (
		<AbsoluteFill style={{background: 'radial-gradient(ellipse at 50% 60%, #2a1208, #070304 70%)'}}>
			<Stage3D fov={45}>
				<Camera pos={cam} look={look} />
				<ambientLight intensity={0.25} />
				<spotLight position={[0, 8, 3]} angle={0.5} penumbra={0.6} intensity={120} distance={20} color="#ffd8a8" castShadow />
				<pointLight position={[0, 1, -2]} intensity={10 * fl} distance={10} color={C.cempa} />
				<mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
					<circleGeometry args={[9, 48]} />
					<meshStandardMaterial color="#2a160e" roughness={0.5} metalness={0.1} />
				</mesh>
				<Bailarina3D t={t} spin={spin} />
				<Velas3D velas={velas} />
				<Cordel3D a={[-5, 5.6, -2]} b={[5, 5.6, -2]} n={8} sag={0.7} t={t} size={0.9} />
				<Cordel3D a={[-5, 5.0, 0.5]} b={[5, 5.0, 0.5]} n={8} sag={0.6} t={t + 1} size={0.8} seed={3} />
			</Stage3D>
			<LlamasVelas velas={velas} cam={cam} look={look} fov={45} t={t} fl={fl} />
			<canvas ref={ref} width={W} height={H} style={{position: 'absolute', inset: 0}} />
			<PaperTexture o={0.18} />
			<Kinetic text={'Y cuando suena el vals,\nnadie se queda sentado.'} f={f} at={16} out={130} y={330} size={48} scrim={0.8} />
		</AbsoluteFill>
	);
};

// ---------- Abanico 3D plisado ----------
const Abanico3D: React.FC<{open: number; R: number}> = ({open, R}) => {
	const n = 17;
	const span = (Math.PI * 170 * open) / 180;
	const w = span / (n - 1);
	const wedge = React.useMemo(() => {
		const g = new THREE.BufferGeometry();
		g.setAttribute('position', new THREE.Float32BufferAttribute([0, 0, 0, -1, 1, 0, 1, 1, 0], 3));
		g.computeVertexNormals();
		return g;
	}, []);
	return (
		<group>
			{Array.from({length: n}).map((_, i) => {
				const a = -span / 2 + w * i;
				const half = Math.tan(Math.max(0.001, w) / 2 + 0.002);
				return (
					<group key={i} rotation={[0, 0, a]}>
						{/* pliegue: cada gajo se inclina alternado */}
						<mesh geometry={wedge} scale={[half * R, R, 1]} rotation={[0, (i % 2 ? 1 : -1) * 0.18, 0]}>
							<meshStandardMaterial color={i % 2 ? C.verde : C.terracota} side={THREE.DoubleSide} roughness={0.75} />
						</mesh>
						<mesh position={[0, R * 0.5, 0.02]}>
							<boxGeometry args={[0.04, R, 0.03]} />
							<meshStandardMaterial color="#3a1a0c" roughness={0.6} />
						</mesh>
						<mesh position={[0, R * 0.8, 0.04]}>
							<sphereGeometry args={[R * 0.022, 8, 6]} />
							<meshStandardMaterial color={C.flama} emissive={C.flama} emissiveIntensity={0.4} />
						</mesh>
					</group>
				);
			})}
			<mesh position={[0, 0, 0.05]}>
				<cylinderGeometry args={[0.2, 0.2, 0.12, 16]} />
				<meshStandardMaterial color="#c8902a" metalness={0.8} roughness={0.3} />
			</mesh>
		</group>
	);
};
const EscenaAbanico: React.FC<{open: number; tilt: number; y?: number}> = ({open, tilt, y = -3}) => (
	<Stage3D fov={40}>
		<Camera pos={[0, 0, 18]} look={[0, 0, 0]} />
		<ambientLight intensity={0.35} />
		<directionalLight position={[-3, 4, 6]} intensity={1.8} color="#ffd8a8" />
		<directionalLight position={[3, -2, 4]} intensity={0.6} color={C.cempa} />
		<group position={[0, y, 0]} rotation={[tilt, 0, 0]}>
			<Abanico3D open={open} R={7} />
		</group>
	</Stage3D>
);

const AbreAbanico: React.FC = () => {
	const f = useCurrentFrame();
	const open = E.out(clamp((f - 8) / 30));
	return (
		<AbsoluteFill style={{background: '#0a0406'}}>
			<Light x={540} y={1100} r={900} color={C.cempa} o={0.45} />
			<EscenaAbanico open={open} tilt={lerp(-0.5, -0.15, open)} y={-3.4} />
			<PaperTexture o={0.18} />
		</AbsoluteFill>
	);
};

const Revelacion: React.FC<{dias: number; fecha: string}> = ({dias, fecha}) => {
	const f = useCurrentFrame();
	const t = f / FPS + 16;
	const HIT = C07.HIT;
	const open = E.inOut(clamp((f - 4) / (HIT - 8)));
	const num = E.out(clamp((f - HIT + 14) / 22));
	return (
		<AbsoluteFill style={{background: 'radial-gradient(ellipse at 50% 55%, #2a1208, #070304 70%)'}}>
			<Light x={540} y={NUM_Y} r={1000} color={C.cempa} o={0.3 + 0.2 * num} />
			<div style={{position: 'absolute', inset: 0, opacity: 0.85}}>
				<EscenaAbanico open={open} tilt={-0.12} y={-2.3} />
			</div>
			<div style={{position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 45% 30% at 50% 45%, rgba(10,4,2,0.75), transparent)', opacity: num}} />
			<GoldNumber txt={String(dias)} o={num} blur={(1 - num) * 12} scale={lerp(0.85, 1, num)} />
			<Lockup f={f} at={HIT + 4} dias={dias} fecha={fecha} top={380} bottom={1150} />
			<PaperTexture o={0.18} />
			<AbsoluteFill style={{background: '#000', opacity: ramp(f, [C07.REV - 8, C07.REV - 1], [0, 1], E.inOut)}} />
			{void noise2D}
		</AbsoluteFill>
	);
};

export const Cap07: React.FC<{dias: number; fecha: string}> = ({dias, fecha}) => {
	const f = useCurrentFrame();
	const a = C07.S1;
	const b = a + C07.S2;
	const c = b + C07.S3;
	const d = c + C07.S4;
	return (
		<AbsoluteFill style={{background: '#000'}}>
			<Sequence durationInFrames={a}>
				<Tocador />
			</Sequence>
			<Sequence from={a} durationInFrames={C07.S2}>
				<Retrato />
			</Sequence>
			<Sequence from={b} durationInFrames={C07.S3}>
				<Vals />
			</Sequence>
			<Sequence from={c} durationInFrames={C07.S4}>
				<AbreAbanico />
			</Sequence>
			<Sequence from={d} durationInFrames={C07.REV}>
				<Revelacion dias={dias} fecha={fecha} />
			</Sequence>
			<LightLeak f={f} at={a} dur={16} />
			<PetalWipe f={f} at={b} dur={24} seed={7} />
			<Dip f={f} at={c} dur={10} />
			<LightLeak f={f} at={d} dur={12} color={C.cempa} />
		</AbsoluteFill>
	);
};
