import React from 'react';
import {AbsoluteFill, Sequence, useCurrentFrame} from 'remotion';
import {noise2D} from '@remotion/noise';
import {C, E, FPS, H, W, clamp, css, hash, lerp, mixRGB, ramp, rgba} from '../lib/util';
import {Light, PaperTexture, useCanvasDraw} from '../components/core';
import {Bokeh} from '../components/Particles';
import {useGlyph} from '../countdown/reveals';
import {Sky} from './kit/land';
import {Camera, Ground, Oyamel, Stage3D, THREE} from './kit/three';
import {GoldNumber, Kinetic, Lockup, NUM_Y, numSize} from './kit/type';
import {LightLeak, PetalWipe} from './kit/transitions';

// Capítulo 13 · "Las monarcas" — llegan en otoño; dicen que en cada una viaja alguien que vuelve.
export const C13 = {S1: 126, S2: 96, S3: 78, REV: 126, HIT: 66};
export const C13_LEN = C13.S1 + C13.S2 + C13.S3 + C13.REV;

// ---------- Mariposa monarca en canvas (vista dorsal) ----------
export const drawMonarch = (ctx: CanvasRenderingContext2D, x: number, y: number, s: number, rot: number, flap: number, lit = 1, detail = false) => {
	const k = Math.max(0.12, Math.abs(Math.cos(flap)));
	const orange = rgba(mixRGB(C.ink, '#F07A2E', lit));
	const orange2 = rgba(mixRGB(C.ink, '#F9A23E', lit));
	const black = rgba(mixRGB('#000', '#1a0d07', 1));
	ctx.save();
	ctx.translate(x, y);
	ctx.rotate(rot);
	ctx.scale(s, s);
	for (const side of [-1, 1]) {
		ctx.save();
		ctx.scale(side * k, 1);
		// ala anterior
		ctx.beginPath();
		ctx.moveTo(0, -2);
		ctx.bezierCurveTo(6, -18, 26, -30, 40, -26);
		ctx.bezierCurveTo(44, -12, 34, 2, 2, 2);
		ctx.closePath();
		const g = ctx.createLinearGradient(0, 0, 40, -26);
		g.addColorStop(0, orange);
		g.addColorStop(1, orange2);
		ctx.fillStyle = g;
		ctx.fill();
		ctx.lineWidth = 3.2;
		ctx.strokeStyle = black;
		ctx.stroke();
		// ala posterior
		ctx.beginPath();
		ctx.moveTo(1, 2);
		ctx.bezierCurveTo(24, 2, 34, 14, 26, 26);
		ctx.bezierCurveTo(16, 34, 4, 22, 1, 6);
		ctx.closePath();
		ctx.fillStyle = orange;
		ctx.fill();
		ctx.stroke();
		if (detail) {
			ctx.lineWidth = 1.1;
			ctx.beginPath();
			for (const [ax, ay] of [
				[30, -24],
				[34, -14],
				[28, -4],
				[22, 14],
				[24, 22],
			]) {
				ctx.moveTo(2, 0);
				ctx.quadraticCurveTo(ax * 0.5, ay * 0.6, ax, ay);
			}
			ctx.stroke();
			ctx.fillStyle = '#FFF4E0';
			for (let i = 0; i < 7; i++) {
				ctx.beginPath();
				ctx.arc(14 + i * 4, -22 - Math.sin(i) * 2, 0.9, 0, Math.PI * 2);
				ctx.fill();
			}
		}
		ctx.restore();
	}
	ctx.fillStyle = black;
	ctx.beginPath();
	ctx.ellipse(0, 4, 2.4, 12, 0, 0, Math.PI * 2);
	ctx.fill();
	ctx.beginPath();
	ctx.arc(0, -9, 2.6, 0, Math.PI * 2);
	ctx.fill();
	if (detail) {
		ctx.strokeStyle = black;
		ctx.lineWidth = 0.9;
		ctx.beginPath();
		ctx.moveTo(-1, -10);
		ctx.quadraticCurveTo(-6, -22, -9, -26);
		ctx.moveTo(1, -10);
		ctx.quadraticCurveTo(6, -22, 9, -26);
		ctx.stroke();
	}
	ctx.restore();
};

// ---------- Monarcas en 3D: dos alas con la textura de la mariposa, bisagra en el cuerpo ----------
let monarchTex: THREE.CanvasTexture | null = null;
const getMonarchTex = () => {
	if (monarchTex) return monarchTex;
	const cv = document.createElement('canvas');
	cv.width = 512;
	cv.height = 512;
	const ctx = cv.getContext('2d')!;
	drawMonarch(ctx, 256, 270, 5.4, 0, 0, 1, true);
	monarchTex = new THREE.CanvasTexture(cv);
	monarchTex.colorSpace = THREE.SRGBColorSpace;
	monarchTex.anisotropy = 4;
	return monarchTex;
};
const wingGeo = (side: 1 | -1) => {
	const g = new THREE.PlaneGeometry(1, 2);
	g.translate(side * 0.5, 0, 0);
	const uv = g.attributes.uv as THREE.BufferAttribute;
	for (let i = 0; i < uv.count; i++) uv.setX(i, side > 0 ? 0.5 + 0.5 * uv.getX(i) : 0.5 * uv.getX(i));
	return g;
};
const WING_R = wingGeo(1);
const WING_L = wingGeo(-1);

export type Mariposa = {p: [number, number, number]; head: number; pitch?: number; roll?: number; flap: number; s: number};
export const Monarcas3D: React.FC<{items: Mariposa[]; lit?: number}> = ({items, lit = 1}) => {
	const refR = React.useRef<THREE.InstancedMesh>(null);
	const refL = React.useRef<THREE.InstancedMesh>(null);
	const tex = React.useMemo(() => getMonarchTex(), []);
	React.useLayoutEffect(() => {
		const base = new THREE.Object3D();
		const hinge = new THREE.Object3D();
		base.add(hinge);
		items.forEach((m, i) => {
			base.position.set(...m.p);
			base.rotation.set(0, 0, 0);
			base.rotateY(m.head);
			base.rotateX(-Math.PI / 2 + (m.pitch ?? 0));
			base.rotateY(m.roll ?? 0);
			base.scale.setScalar(m.s);
			for (const [ref, sd] of [[refR, 1], [refL, -1]] as const) {
				hinge.rotation.set(0, -sd * m.flap, 0);
				hinge.updateMatrixWorld(true);
				base.updateMatrixWorld(true);
				ref.current?.setMatrixAt(i, hinge.matrixWorld);
			}
		});
		for (const ref of [refR, refL]) if (ref.current) ref.current.instanceMatrix.needsUpdate = true;
	});
	// emisivo: las alas se leen naranjas aun a contraluz (nunca como siluetas oscuras)
	const mat = <meshStandardMaterial map={tex} emissiveMap={tex} emissive="#ffffff" emissiveIntensity={0.55 * lit} transparent alphaTest={0.4} side={THREE.DoubleSide} roughness={0.7} color={css(mixRGB('#000000', '#ffffff', lit))} />;
	return (
		<group>
			<instancedMesh ref={refR} args={[WING_R, undefined, items.length]} castShadow>
				{mat}
			</instancedMesh>
			<instancedMesh ref={refL} args={[WING_L, undefined, items.length]} castShadow>
				{mat}
			</instancedMesh>
		</group>
	);
};

// aleteo: abierto (0) a casi cerrado (~1.3 rad)
const aleteo = (t: number, i: number, vel = 10) => 0.65 + 0.62 * Math.sin(t * vel + i * 1.7);

// bosque de oyameles al atardecer
const ARBOLES = Array.from({length: 70}).map((_, i) => {
	let x = (hash(i, 131) - 0.5) * 120;
	if (Math.abs(x) < 4) x += x < 0 ? -5 : 5;
	return {x, z: -hash(i, 132) * 160 + 20, h: 16 + 14 * hash(i, 133), seed: i};
});
const Bosque3D: React.FC = () => (
	<>
		{ARBOLES.map((a) => (
			<Oyamel key={a.seed} pos={[a.x, 0, a.z]} h={a.h} color={a.seed % 3 ? '#1e2a1c' : '#24301e'} seed={a.seed} />
		))}
		<Ground color="#0e0906" seed={13} amp={0.8} />
	</>
);
// racimos de monarcas posadas en los árboles (alas casi cerradas)
const RACIMOS: Mariposa[] = ARBOLES.slice(0, 22).flatMap((a, k) =>
	Array.from({length: 14}).map((_, j) => {
		const ang = hash(k * 30 + j, 7) * Math.PI * 2;
		const y = a.h * (0.35 + 0.4 * hash(k * 30 + j, 8));
		const r = a.h * 0.22 * (1 - (y / a.h - 0.25) * 0.9);
		return {p: [a.x + Math.cos(ang) * r, y, a.z + Math.sin(ang) * r], head: ang, pitch: 1.1, flap: 1.25, s: 0.32};
	}),
);

const Bosque: React.FC = () => {
	const f = useCurrentFrame();
	const t = f / FPS;
	const u = E.inOut(clamp(f / C13.S1));
	const cam: [number, number, number] = [0, 3 + u * 2, 30 - u * 22];
	const look: [number, number, number] = [0, 9 + u * 3, -40];
	const vuelan: Mariposa[] = Array.from({length: 60}).map((_, i) => {
		const x = (hash(i, 1) - 0.5) * 24 + noise2D('bx', i, t * 0.3) * 4;
		const z = 10 - hash(i, 2) * 50;
		const y = 3 + hash(i, 3) * 12 + t * (0.6 + 0.8 * hash(i, 4)) + noise2D('by', i, t * 0.4) * 1.5;
		return {p: [x, y, z], head: noise2D('bh', i, t * 0.2) * 3, pitch: 0.5, flap: aleteo(t, i), s: 0.7};
	});
	return (
		<AbsoluteFill>
			<Sky t={t} top="#1a0e10" mid="#5a2c18" horizon="#c46a32" hy={1150} />
			<Light x={620} y={1000} r={1200} color={C.flama} o={0.5} />
			<Stage3D fov={50}>
				<Camera pos={cam} look={look} />
				<fog attach="fog" args={['#8a4422', 15, 150]} />
				<hemisphereLight args={['#e09060', '#140a06', 0.55]} />
				<directionalLight position={[10, 90, -120]} intensity={2.0} color={C.flama} castShadow shadow-mapSize={[1024, 1024]} />
				<directionalLight position={[-20, 10, 40]} intensity={0.4} color="#9a7a8a" />
				<Bosque3D />
				<Monarcas3D items={RACIMOS} lit={0.85} />
				<Monarcas3D items={vuelan} />
			</Stage3D>
			<PaperTexture o={0.18} />
			<Kinetic text={'Cada otoño llegan\nmillones de alas naranjas…'} f={f} at={14} out={110} y={330} size={50} scrim={0.4} />
		</AbsoluteFill>
	);
};

const Macro: React.FC = () => {
	const f = useCurrentFrame();
	const t = f / FPS + 4;
	const orb = lerp(-0.5, 0.35, E.inOut(clamp(f / C13.S2)));
	const cam: [number, number, number] = [Math.sin(orb) * 4.2, 2.1, Math.cos(orb) * 4.2];
	const flap = 0.15 + 0.55 * (0.5 + 0.5 * Math.sin(t * 1.6));
	const rama = React.useMemo(() => new THREE.TubeGeometry(new THREE.CatmullRomCurve3([new THREE.Vector3(-6, -0.3, 0.4), new THREE.Vector3(-2, 0, 0), new THREE.Vector3(2, -0.1, -0.3), new THREE.Vector3(6, 0.4, -0.6)]), 40, 0.16, 8, false), []);
	return (
		<AbsoluteFill style={{background: '#070302'}}>
			<Light x={540} y={900} r={1100} color={C.cempa} o={0.4} />
			<Bokeh t={t} L={1} n={22} seed={135} blur={6} />
			<Stage3D fov={40}>
				<Camera pos={cam} look={[0, 0.5, 0]} />
				<ambientLight intensity={0.2} />
				<directionalLight position={[-4, 6, 3]} intensity={2.2} color={C.flama} castShadow shadow-mapSize={[1024, 1024]} />
				<directionalLight position={[3, 2, -5]} intensity={1.4} color={C.cempa} />
				<mesh geometry={rama} castShadow receiveShadow>
					<meshStandardMaterial color="#2a1a10" roughness={0.9} />
				</mesh>
				{Array.from({length: 60}).map((_, i) => {
					const x = -5.5 + i * 0.19;
					return (
						<mesh key={i} position={[x, -0.15 + (i % 2) * 0.05, 0.1 - x * 0.06 + ((i % 3) - 1) * 0.12]} rotation={[((i % 2) - 0.5) * 1.6, 0, 0.3]}>
							<boxGeometry args={[0.03, 0.55, 0.03]} />
							<meshStandardMaterial color="#1f4a34" roughness={0.8} />
						</mesh>
					);
				})}
				<Monarcas3D items={[{p: [0, 0.22, 0], head: 0.4, pitch: 0.25, flap, s: 0.8}]} />
			</Stage3D>
			<PaperTexture o={0.16} />
			<Kinetic text={'Dicen que en cada una\nviaja alguien que vuelve.'} f={f} at={10} out={84} y={1420} size={50} scrim={0.4} />
		</AbsoluteFill>
	);
};

const Remolino: React.FC = () => {
	const f = useCurrentFrame();
	const t = f / FPS + 1;
	const u = E.inOut(clamp(f / C13.S3));
	// cámara al pie del oyamel, mirando hacia arriba mientras gira
	const ang = u * 1.2;
	const cam: [number, number, number] = [Math.sin(ang) * 15, 2.5, Math.cos(ang) * 15];
	const items: Mariposa[] = Array.from({length: 200}).map((_, i) => {
		const a = hash(i, 6) * Math.PI * 2 + t * (0.8 + 0.5 * hash(i, 7));
		const r = 2 + 5 * hash(i, 8);
		const y = ((hash(i, 9) * 30 + t * (2 + 2 * hash(i, 10))) % 30) + 1;
		return {p: [Math.cos(a) * r, y, Math.sin(a) * r], head: -a, pitch: -0.4, flap: aleteo(t, i, 12), s: 0.35 + 0.25 * hash(i, 11)};
	});
	return (
		<AbsoluteFill style={{background: '#0a0503'}}>
			<div style={{position: 'absolute', left: 240, top: -200, width: 600, height: 2400, background: `linear-gradient(90deg, transparent, ${rgba(C.flama, 0.22)}, transparent)`, filter: 'blur(30px)', transform: 'rotate(8deg)'}} />
			<Stage3D fov={70}>
				<Camera pos={cam} look={[0, 12, 0]} />
				<fog attach="fog" args={['#3a1a0c', 10, 60]} />
				<hemisphereLight args={['#e0905a', '#100804', 0.6]} />
				<directionalLight position={[10, 40, -10]} intensity={2} color={C.flama} />
				<Oyamel pos={[0, 0, 0]} h={34} color="#1e2a1c" seed={4} />
				<Oyamel pos={[-9, 0, -6]} h={30} color="#1a241a" seed={5} />
				<Oyamel pos={[8, 0, -9]} h={32} color="#1a241a" seed={6} />
				<Monarcas3D items={items} />
			</Stage3D>
			<PaperTexture o={0.16} />
		</AbsoluteFill>
	);
};

const Numero: React.FC<{dias: number; fecha: string}> = ({dias, fecha}) => {
	const f = useCurrentFrame();
	const t = f / FPS;
	const txt = String(dias);
	const g = useGlyph(txt, numSize(txt), 31, 5);
	const HIT = C13.HIT;
	const ref = useCanvasDraw(
		(ctx) => {
			if (!g) return;
			g.pts.forEach(([gx, gy], i) => {
				const tx = 540 + gx;
				const ty = NUM_Y + gy;
				const d = hash(i, 3) * 30;
				const a = E.inOut(clamp((f - d) / 38));
				const ang = hash(i, 4) * 6.28 + t * 1.5;
				const rad = 700 + 300 * hash(i, 5);
				const sx = 540 + Math.cos(ang) * rad;
				const sy = NUM_Y + Math.sin(ang) * rad * 1.2;
				const x = lerp(sx, tx, a) + (1 - a) * noise2D('mx', i, t) * 60;
				const y = lerp(sy, ty, a) + (1 - a) * noise2D('my', i, t) * 60;
				// al posarse, las alas se abren y cierran despacio
				const flap = a < 1 ? t * 12 + i : Math.PI / 2 - (0.5 + 0.5 * Math.sin(t * 2 + i * 0.4)) * 1.2;
				drawMonarch(ctx, x, y, 0.74 + 0.12 * hash(i, 6), (hash(i, 7) - 0.5) * 0.8 * (1 - a * 0.6), flap, 1);
			});
		},
		[g, f],
	);
	return (
		<AbsoluteFill style={{background: 'radial-gradient(ellipse at 50% 45%, #2a120a, #070302 70%)'}}>
			<Bokeh t={t + 3} L={0.8} n={14} seed={138} blur={6} />
			<GoldNumber txt={txt} o={ramp(f, [HIT - 6, HIT + 26], [0, 0.3], E.out)} blur={18} glow={0.5} />
			<canvas ref={ref} width={W} height={H} style={{position: 'absolute', inset: 0}} />
			<Lockup f={f} at={HIT + 4} dias={dias} fecha={fecha} />
			<PaperTexture o={0.14} />
			<AbsoluteFill style={{background: '#000', opacity: ramp(f, [C13.REV - 8, C13.REV - 1], [0, 1], E.inOut)}} />
		</AbsoluteFill>
	);
};

export const Cap13: React.FC<{dias: number; fecha: string}> = ({dias, fecha}) => {
	const f = useCurrentFrame();
	const a = C13.S1;
	const b = a + C13.S2;
	const c = b + C13.S3;
	return (
		<AbsoluteFill style={{background: '#000'}}>
			<Sequence durationInFrames={a}>
				<Bosque />
			</Sequence>
			<Sequence from={a} durationInFrames={C13.S2}>
				<Macro />
			</Sequence>
			<Sequence from={b} durationInFrames={C13.S3}>
				<Remolino />
			</Sequence>
			<Sequence from={c} durationInFrames={C13.REV}>
				<Numero dias={dias} fecha={fecha} />
			</Sequence>
			<LightLeak f={f} at={a} dur={16} />
			<PetalWipe f={f} at={b} dur={22} seed={13} />
			<LightLeak f={f} at={c} dur={14} color={C.cempa} />
		</AbsoluteFill>
	);
};
