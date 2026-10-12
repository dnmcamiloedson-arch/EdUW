import React from 'react';
import {AbsoluteFill, Sequence, spring, useCurrentFrame} from 'remotion';
import {C, E, FPS, H, W, clamp, css, flicker, hash, lerp, mixRGB, ramp, rgba} from '../lib/util';
import {Flame, Light, PaperTexture, useCanvasDraw} from '../components/core';
import {Embers, Smoke} from '../components/Particles';
import {useGlyph} from '../countdown/reveals';
import {Kinetic, Lockup, NUM_Y, numSize} from './kit/type';
import {Dip, LightLeak} from './kit/transitions';
import {Camera, Pan3D, Stage3D, THREE, project} from './kit/three';

// Capítulo 8 · "Pan de muerto" — del horno de leña al azúcar que cae como nieve.
export const C08 = {S1: 108, S2: 108, S3: 78, REV: 126, HIT: 70};
export const C08_LEN = C08.S1 + C08.S2 + C08.S3 + C08.REV;

// ---------- El horno de adobe en 3D: domo, boca en arco, fuego dentro y la pala que mete el pan ----------
let bocaTex: THREE.CanvasTexture | null = null;
const getBocaTex = () => {
	if (bocaTex) return bocaTex;
	const cv = document.createElement('canvas');
	cv.width = 256;
	cv.height = 256;
	const g = cv.getContext('2d')!;
	const gr = g.createRadialGradient(128, 200, 10, 128, 170, 170);
	gr.addColorStop(0, '#fff2c0');
	gr.addColorStop(0.25, '#f5a040');
	gr.addColorStop(0.6, '#a83a18');
	gr.addColorStop(1, '#2a0804');
	g.fillStyle = gr;
	g.fillRect(0, 0, 256, 256);
	bocaTex = new THREE.CanvasTexture(cv);
	bocaTex.colorSpace = THREE.SRGBColorSpace;
	return bocaTex;
};
// boca en arco: rectángulo con medio punto
const arcoShape = (w: number, h: number) => {
	const sh = new THREE.Shape();
	sh.moveTo(-w / 2, 0);
	sh.lineTo(-w / 2, h - w / 2);
	sh.absarc(0, h - w / 2, w / 2, Math.PI, 0, true);
	sh.lineTo(w / 2, 0);
	sh.closePath();
	return sh;
};
const Horno3D: React.FC<{fl: number}> = ({fl}) => {
	const boca = React.useMemo(() => {
		const g = new THREE.ShapeGeometry(arcoShape(2.2, 1.9), 16);
		// uv según la forma (0..1)
		const p = g.attributes.position as THREE.BufferAttribute;
		const uv = g.attributes.uv as THREE.BufferAttribute;
		for (let i = 0; i < p.count; i++) uv.setXY(i, p.getX(i) / 2.2 + 0.5, p.getY(i) / 1.9);
		return g;
	}, []);
	const marco = React.useMemo(() => {
		const outer = arcoShape(2.8, 2.25);
		outer.holes.push(new THREE.Path(arcoShape(2.2, 1.9).getPoints(24)));
		return new THREE.ExtrudeGeometry(outer, {depth: 0.35, bevelEnabled: true, bevelSize: 0.05, bevelThickness: 0.05, bevelSegments: 2, curveSegments: 16});
	}, []);
	return (
		<group>
			{/* base de ladrillo */}
			<mesh position={[0, -0.6, 0]} castShadow receiveShadow>
				<cylinderGeometry args={[3.5, 3.7, 1.2, 28]} />
				<meshStandardMaterial color="#6a3220" roughness={0.95} flatShading />
			</mesh>
			{/* domo de adobe */}
			<mesh castShadow receiveShadow scale={[1, 0.92, 1]}>
				<sphereGeometry args={[3, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
				<meshStandardMaterial color="#9a5a36" roughness={0.95} flatShading />
			</mesh>
			{/* boca encendida y su marco */}
			<mesh geometry={boca} position={[0, 0, 2.62]} rotation={[-0.12, 0, 0]}>
				<meshBasicMaterial map={getBocaTex()} color={css(mixRGB('#8a6a5a', '#ffffff', 0.55 + 0.45 * fl))} />
			</mesh>
			<mesh geometry={marco} position={[0, 0, 2.5]} rotation={[-0.12, 0, 0]} castShadow>
				<meshStandardMaterial color="#7a3e24" roughness={1} flatShading />
			</mesh>
			{/* chimenea */}
			<mesh position={[1.2, 2.6, -0.8]} castShadow>
				<cylinderGeometry args={[0.3, 0.4, 1.4, 10]} />
				<meshStandardMaterial color="#7a4028" roughness={1} flatShading />
			</mesh>
			<pointLight position={[0, 0.8, 3.6]} intensity={40 * fl} distance={12} color={C.flama} />
		</group>
	);
};

const Horno: React.FC = () => {
	const f = useCurrentFrame();
	const t = f / FPS;
	const fl = flicker(t, 81);
	const peel = E.inOut(clamp((f - 30) / 50));
	const u = E.inOut(clamp(f / C08.S1));
	const cam: [number, number, number] = [lerp(4, 1.5, u), 2.6, lerp(13.5, 11, u)];
	const look: [number, number, number] = [0, 1.1, 0];
	const mouth = project([0, 0.7, 2.7], cam, look, 45);
	const pz = lerp(8, 2.2, peel);
	return (
		<AbsoluteFill style={{background: '#0a0503'}}>
			<Light x={mouth.x} y={mouth.y} r={1100} color={C.cempa} o={0.35 * fl} />
			<Stage3D fov={45}>
				<Camera pos={cam} look={look} />
				<fog attach="fog" args={['#0a0503', 12, 40]} />
				<ambientLight intensity={0.2} />
				<directionalLight position={[-5, 8, 6]} intensity={0.9} color="#c8a8d0" castShadow shadow-mapSize={[1024, 1024]} />
				<Horno3D fl={fl} />
				{/* piso */}
				<mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.2, 0]} receiveShadow>
					<planeGeometry args={[60, 60]} />
					<meshStandardMaterial color="#1e0f08" roughness={1} />
				</mesh>
				{/* pala con el pan */}
				<group position={[0, 0.1, pz]}>
					<mesh rotation={[-Math.PI / 2, 0, 0]} castShadow>
						<circleGeometry args={[0.9, 20]} />
						<meshStandardMaterial color="#5a3018" roughness={0.9} side={THREE.DoubleSide} />
					</mesh>
					<mesh position={[0, 0.02, 4]} rotation={[Math.PI / 2, 0, 0]} castShadow>
						<cylinderGeometry args={[0.07, 0.07, 7, 8]} />
						<meshStandardMaterial color="#3a1e0c" roughness={0.9} />
					</mesh>
					<Pan3D pos={[0, 0.02, 0]} s={0.38} baked={0.35} sugar={0} />
				</group>
			</Stage3D>
			{/* fuego visible por la boca */}
			{[-0.55, 0, 0.55].map((x, i) => {
				const p = project([x, 0.05, 2.62], cam, look, 45);
				return <Flame key={i} x={p.x} y={p.y} size={95 + 30 * hash(i, 2)} t={t + i * 0.7} seed={80 + i} fl={fl} wick={false} />;
			})}
			<Light x={mouth.x} y={mouth.y} r={420} color={C.flama} o={0.5 * fl} />
			<Embers t={t} L={1} n={30} seed={82} src={[mouth.x - 220, mouth.y - 300, 440, 300]} />
			<PaperTexture o={0.18} />
			<Kinetic text={'Desde la madrugada,\nel horno ya está despierto.'} f={f} at={10} out={94} y={300} size={48} scrim={0.45} />
		</AbsoluteFill>
	);
};

const LucesCocina: React.FC = () => (
	<>
		<ambientLight intensity={0.3} />
		<directionalLight position={[-4, 7, 5]} intensity={2.2} color="#ffd8a8" castShadow shadow-mapSize={[1024, 1024]} />
		<directionalLight position={[4, 3, -5]} intensity={1.0} color={C.cempa} />
	</>
);
const MesaHarina: React.FC = () => (
	<>
		<mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
			<planeGeometry args={[40, 40]} />
			<meshStandardMaterial color="#5a3a20" roughness={0.9} />
		</mesh>
		<mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.005, 0]}>
			<circleGeometry args={[3, 32]} />
			<meshBasicMaterial color="#f6eedf" transparent opacity={0.25} />
		</mesh>
	</>
);

const Masa: React.FC = () => {
	const f = useCurrentFrame();
	const t = f / FPS + 4;
	const rise = 0.35 + 0.65 * spring({frame: f - 4, fps: FPS, config: {stiffness: 40, damping: 9}});
	const bone = (k: number) => spring({frame: f - 34 - k * 10, fps: FPS, config: {stiffness: 140, damping: 14}});
	const ball = spring({frame: f - 76, fps: FPS, config: {stiffness: 160, damping: 12}});
	const orb = lerp(-0.3, 0.3, E.inOut(clamp(f / C08.S2)));
	const cam: [number, number, number] = [Math.sin(orb) * 6.5, 3.6, Math.cos(orb) * 6.5];
	const look: [number, number, number] = [0, 0.7, 0];
	const c = project([0, 1.1, 0], cam, look, 42);
	const ref = useCanvasDraw(
		(ctx) => {
			// polvo de harina al caer cada pieza
			[34, 44, 54, 64, 76].forEach((st, i) => {
				const d = f - st - 6;
				if (d < 0 || d > 30) return;
				for (let k = 0; k < 26; k++) {
					const a = hash(i * 40 + k, 3) * Math.PI;
					const sp = 60 + 200 * hash(i * 40 + k, 4);
					const tt = d / FPS;
					const x = c.x + Math.cos(a) * sp * tt * (k % 2 ? 1 : -1) * 2;
					const y = c.y - Math.sin(a) * sp * tt + 80 * tt * tt;
					ctx.fillStyle = rgba('#F6EEDF', 0.5 * (1 - d / 30));
					ctx.beginPath();
					ctx.arc(x, y, 4 + 8 * (d / 30), 0, Math.PI * 2);
					ctx.fill();
				}
			});
		},
		[f],
	);
	return (
		<AbsoluteFill style={{background: 'linear-gradient(180deg,#1e0f07,#2e1a0c)'}}>
			<Light x={300} y={500} r={1300} color={C.flama} o={0.3} />
			<Stage3D fov={42}>
				<Camera pos={cam} look={look} />
				<fog attach="fog" args={['#1e0f07', 10, 30]} />
				<LucesCocina />
				<MesaHarina />
				<Pan3D rise={rise} bones={[0, 1, 2, 3].map(bone)} ball={ball} baked={0.05} sugar={0} />
			</Stage3D>
			<canvas ref={ref} width={W} height={H} style={{position: 'absolute', inset: 0}} />
			<PaperTexture o={0.2} />
			<Kinetic text={'Los huesos se ponen en cruz,\ncomo los cuatro rumbos.'} f={f} at={30} out={98} y={330} size={48} scrim={0.45} />
			{void t}
		</AbsoluteFill>
	);
};

const Azucar: React.FC = () => {
	const f = useCurrentFrame();
	const t = f / FPS + 7;
	const sugar = E.out(clamp(f / 60));
	const ref = useCanvasDraw(
		(ctx) => {
			for (let i = 0; i < 260; i++) {
				const r = (q: number) => hash(i * 3 + q, 83);
				const x = 160 + r(1) * 760;
				const y = ((r(2) * 1600 + t * (90 + 80 * r(3))) % 1700) - 100;
				const s = 1.5 + 2.5 * r(4);
				ctx.fillStyle = rgba('#FFFBF2', 0.8);
				ctx.fillRect(x, y, s, s);
				if (r(5) > 0.9) {
					ctx.fillStyle = rgba('#FFFFFF', 0.6 * (0.5 + 0.5 * Math.sin(t * 8 + i)));
					ctx.fillRect(x - 1, y - 4, 1, 9);
					ctx.fillRect(x - 4, y, 9, 1);
				}
			}
		},
		[f],
	);
	return (
		<AbsoluteFill style={{background: '#0d0603'}}>
			<Light x={540} y={1050} r={900} color={C.cempa} o={0.45} />
			<Smoke t={t} x={540} y={900} L={0.6} n={80} rate={16} rise={80} wind={6} seed={84} tint={C.marfil} />
			<Stage3D fov={40}>
				<Camera pos={[0, 3.1, 7.4]} look={[0, 0.75, 0]} />
				<LucesCocina />
				<mesh position={[0, -0.04, 0]} receiveShadow>
					<cylinderGeometry args={[2.3, 2.1, 0.08, 40]} />
					<meshStandardMaterial color="#e8dcc6" roughness={0.4} />
				</mesh>
				<Pan3D rotY={t * 0.35} baked={1} sugar={sugar} />
			</Stage3D>
			<canvas ref={ref} width={W} height={H} style={{position: 'absolute', inset: 0}} />
			<PaperTexture o={0.18} />
			<Kinetic text={'El aroma también\nlos guía de regreso.'} f={f} at={8} out={70} y={330} size={50} scrim={0.45} />
		</AbsoluteFill>
	);
};

const NumeroAzucar: React.FC<{dias: number; fecha: string}> = ({dias, fecha}) => {
	const f = useCurrentFrame();
	const t = f / FPS;
	const txt = String(dias);
	const g = useGlyph(txt, numSize(txt), 8, 0);
	const HIT = C08.HIT;
	const glint = ramp(f, [HIT - 4, HIT + 24], [-0.2, 1.2], E.inOut);
	const ref = useCanvasDraw(
		(ctx) => {
			if (!g) return;
			g.pts.forEach(([gx, gy], i) => {
				const tx = 540 + gx + (hash(i, 1) - 0.5) * 6;
				const ty = NUM_Y + gy + (hash(i, 2) - 0.5) * 6;
				// el azúcar cae desde arriba y se posa
				const d = hash(i, 3) * 50;
				const fall = 26;
				const u = clamp((f - d) / fall);
				if (u <= 0) return;
				const y = lerp(-40, ty, u * u);
				const x = tx + (1 - u) * (hash(i, 4) - 0.5) * 40;
				const s = 2 + 2.4 * hash(i, 5);
				// destello que recorre el número
				const gl = Math.exp(-(((tx - 200) / 680 - glint) ** 2) / 0.004);
				ctx.fillStyle = rgba(gl > 0.1 ? '#FFFFFF' : '#F6EEDF', 0.75 + 0.25 * gl);
				ctx.fillRect(x, y, s, s);
				if (gl > 0.5 && hash(i, 6) > 0.8) {
					ctx.fillStyle = rgba(C.flama, gl);
					ctx.fillRect(x - 1, y - 6, 1.5, 13);
					ctx.fillRect(x - 6, y, 13, 1.5);
				}
			});
		},
		[g, f],
	);
	return (
		<AbsoluteFill style={{background: 'radial-gradient(ellipse at 50% 45%, #3a1c0e, #0d0603 70%)'}}>
			{/* tela del mantel */}
			<div style={{position: 'absolute', inset: 0, backgroundImage: 'repeating-linear-gradient(45deg, rgba(0,0,0,0.12) 0 2px, transparent 2px 8px)'}} />
			<Light x={540} y={NUM_Y} r={800} color={C.cempa} o={0.3} />
			<canvas ref={ref} width={W} height={H} style={{position: 'absolute', inset: 0, filter: 'drop-shadow(0 0 6px rgba(255,240,210,0.35))'}} />
			<Lockup f={f} at={HIT + 4} dias={dias} fecha={fecha} />
			<PaperTexture o={0.2} />
			<AbsoluteFill style={{background: '#000', opacity: ramp(f, [C08.REV - 8, C08.REV - 1], [0, 1], E.inOut)}} />
			{void t}
		</AbsoluteFill>
	);
};

export const Cap08: React.FC<{dias: number; fecha: string}> = ({dias, fecha}) => {
	const f = useCurrentFrame();
	const a = C08.S1;
	const b = a + C08.S2;
	const c = b + C08.S3;
	return (
		<AbsoluteFill style={{background: '#000'}}>
			<Sequence durationInFrames={a}>
				<Horno />
			</Sequence>
			<Sequence from={a} durationInFrames={C08.S2}>
				<Masa />
			</Sequence>
			<Sequence from={b} durationInFrames={C08.S3}>
				<Azucar />
			</Sequence>
			<Sequence from={c} durationInFrames={C08.REV}>
				<NumeroAzucar dias={dias} fecha={fecha} />
			</Sequence>
			<LightLeak f={f} at={a} dur={16} />
			<Dip f={f} at={b} dur={10} />
			<Dip f={f} at={c} dur={12} />
		</AbsoluteFill>
	);
};
