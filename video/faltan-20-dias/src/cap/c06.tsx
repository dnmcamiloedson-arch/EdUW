import React from 'react';
import {AbsoluteFill, Sequence, useCurrentFrame} from 'remotion';
import {C, E, FPS, H, W, clamp, flicker, hash, lerp, ramp, rgba} from '../lib/util';
import {Flame, Light, PaperTexture} from '../components/core';
import {paperUrl} from '../lib/paperUrl';
import {GoldNumber, Lockup, NUM_Y, numSize} from './kit/type';
import {Dip} from './kit/transitions';
import {Camera, Stage3D, THREE, project} from './kit/three';

// Capítulo 6 · "Calaverita literaria" — un verso que se escribe solo.
export const C06 = {S1: 84, S2: 216, REV: 132, HIT: 62};
export const C06_LEN = C06.S1 + C06.S2 + C06.REV;

const TITLE = 'Calaverita';
export const VERSO = ['La Flaca subió a Santa Fe', 'con su sombrero de gala:', '«En Westhill me quedaré,', 'que esta fiesta no está mala».'];
export const LINE_AT = [6, 54, 102, 150]; // frames locales de S2 donde empieza cada línea
const LINE_DUR = 42;

const INK = '#2a140a';

const Pergamino: React.FC<{children: React.ReactNode; dark?: number}> = ({children, dark = 0}) => (
	<AbsoluteFill style={{background: '#1a0c06'}}>
		<div
			style={{
				position: 'absolute',
				left: 70,
				top: 230,
				width: W - 140,
				height: 1460,
				background: 'radial-gradient(ellipse at 50% 45%, #f4e2bd, #e2c48e 65%, #b88a52 100%)',
				boxShadow: '0 30px 80px rgba(0,0,0,0.7), inset 0 0 120px rgba(90,50,20,0.55)',
				borderRadius: 18,
			}}
		/>
		<div style={{position: 'absolute', left: 70, top: 230, width: W - 140, height: 1460, backgroundImage: `url(${paperUrl})`, backgroundSize: `${W}px ${H}px`, mixBlendMode: 'multiply', opacity: 0.35, borderRadius: 18}} />
		{children}
		<AbsoluteFill style={{background: '#000', opacity: dark, pointerEvents: 'none'}} />
	</AbsoluteFill>
);

// ---------- El escritorio en 3D: pergamino que se escribe solo, pluma, tintero y vela ----------
const PW = 1000;
const PH = 1400;
// geometría de las líneas en la textura del pergamino
const lineGeom3 = (i: number) => ({y: 470 + i * 120, x0: 110, x1: 900});

const usePergaminoTex = (title: number, lines: number[], doodle: number) => {
	const [cv] = React.useState(() => {
		const c = document.createElement('canvas');
		c.width = PW;
		c.height = PH;
		return c;
	});
	const tex = React.useMemo(() => {
		const t = new THREE.CanvasTexture(cv);
		t.colorSpace = THREE.SRGBColorSpace;
		t.anisotropy = 8;
		return t;
	}, [cv]);
	React.useLayoutEffect(() => {
		const g = cv.getContext('2d')!;
		const gr = g.createRadialGradient(PW * 0.5, PH * 0.45, 100, PW * 0.5, PH * 0.45, PW * 0.9);
		gr.addColorStop(0, '#f4e2bd');
		gr.addColorStop(0.65, '#e2c48e');
		gr.addColorStop(1, '#b88a52');
		g.fillStyle = gr;
		g.fillRect(0, 0, PW, PH);
		for (let i = 0; i < 500; i++) {
			g.fillStyle = `rgba(120,70,30,${0.03 + 0.04 * hash(i, 61)})`;
			g.beginPath();
			g.arc(hash(i, 62) * PW, hash(i, 63) * PH, 1 + 6 * hash(i, 64), 0, Math.PI * 2);
			g.fill();
		}
		// título
		g.save();
		g.beginPath();
		g.rect(0, 0, PW * title, PH);
		g.clip();
		g.fillStyle = '#6a2a12';
		g.font = '400 104px Rye';
		g.textAlign = 'center';
		g.fillText(TITLE, PW / 2, 300);
		g.restore();
		if (title >= 1) {
			g.strokeStyle = 'rgba(42,20,10,0.75)';
			g.lineWidth = 4;
			g.beginPath();
			g.moveTo(260, 340);
			g.bezierCurveTo(400, 356, 600, 356, 740, 340);
			g.stroke();
		}
		// verso
		g.font = 'italic 400 58px Alike';
		g.fillStyle = INK;
		g.textAlign = 'left';
		VERSO.forEach((txt, i) => {
			const u = lines[i];
			if (u <= 0) return;
			const L = lineGeom3(i);
			g.save();
			g.beginPath();
			g.rect(L.x0 - 10, L.y - 70, (L.x1 - L.x0 + 20) * u, 100);
			g.clip();
			g.fillText(txt, L.x0, L.y);
			g.restore();
		});
		// garabatos que se dibujan solos
		g.strokeStyle = 'rgba(42,20,10,0.75)';
		g.lineWidth = 5;
		g.lineCap = 'round';
		g.setLineDash([1400 * doodle, 1400]);
		g.beginPath();
		g.moveTo(720, 1050);
		g.bezierCurveTo(720, 970, 860, 970, 860, 1050);
		g.bezierCurveTo(860, 1090, 840, 1110, 830, 1130);
		g.lineTo(750, 1130);
		g.bezierCurveTo(740, 1110, 720, 1090, 720, 1050);
		g.stroke();
		g.beginPath();
		g.arc(760, 1055, 16, 0, Math.PI * 2);
		g.stroke();
		g.beginPath();
		g.arc(820, 1055, 16, 0, Math.PI * 2);
		g.stroke();
		for (let i = 0; i < 8; i++) {
			const a = (i / 8) * Math.PI * 2;
			g.beginPath();
			g.ellipse(230 + Math.cos(a) * 34, 1100 + Math.sin(a) * 34, 22, 14, a, 0, Math.PI * 2);
			g.stroke();
		}
		g.beginPath();
		g.moveTo(230, 1134);
		g.bezierCurveTo(220, 1220, 240, 1280, 225, 1340);
		g.stroke();
		g.setLineDash([]);
		tex.needsUpdate = true;
	});
	return tex;
};

// Pluma 3D: barba de la pluma (forma plana curva) y cañón
const Pluma3D: React.FC<{tip: [number, number, number]; t: number}> = ({tip, t}) => {
	const geo = React.useMemo(() => {
		const sh = new THREE.Shape();
		sh.moveTo(0, 0);
		sh.bezierCurveTo(-0.5, 1.4, -0.35, 3.2, 0.3, 4.4);
		sh.bezierCurveTo(0.55, 3.2, 0.5, 1.5, 0.05, 0);
		const g = new THREE.ShapeGeometry(sh, 16);
		const p = g.attributes.position as THREE.BufferAttribute;
		for (let i = 0; i < p.count; i++) p.setZ(i, 0.12 * Math.sin(p.getY(i) * 0.8) + 0.1 * p.getX(i) ** 2);
		g.computeVertexNormals();
		return g;
	}, []);
	return (
		<group position={tip} rotation={[-0.5, 0.6 + Math.sin(t * 9) * 0.04, -0.35]} scale={0.62}>
			<mesh position={[0, 0.25, 0]} rotation={[0, 0, 0]} castShadow>
				<coneGeometry args={[0.035, 0.5, 8]} />
				<meshStandardMaterial color="#2a1a0a" roughness={0.4} metalness={0.5} />
			</mesh>
			<mesh geometry={geo} position={[0, 0.5, 0]} castShadow>
				<meshStandardMaterial color="#f2ead8" side={THREE.DoubleSide} roughness={0.8} />
			</mesh>
			<mesh position={[0.08, 2.6, 0.02]} rotation={[0, 0, -0.08]}>
				<cylinderGeometry args={[0.025, 0.035, 4.2, 6]} />
				<meshStandardMaterial color="#c8b898" roughness={0.6} />
			</mesh>
		</group>
	);
};

const Escritorio: React.FC<{title: number; lines: number[]; doodle: number; pen: [number, number] | null; t: number; cam: [number, number, number]; look: [number, number, number]}> = ({title, lines, doodle, pen, t, cam, look}) => {
	const tex = usePergaminoTex(title, lines, doodle);
	const fl = flicker(t, 61);
	// pergamino de 6×8.4 u acostado sobre la mesa (centro en el origen)
	const SW = 6;
	const SH = 8.4;
	const geo = React.useMemo(() => {
		const g = new THREE.PlaneGeometry(SW, SH, 24, 32);
		const p = g.attributes.position as THREE.BufferAttribute;
		for (let i = 0; i < p.count; i++) {
			const x = p.getX(i);
			const y = p.getY(i);
			// bordes enrollados arriba y abajo
			const e = Math.max(0, Math.abs(y) - SH / 2 + 0.6);
			p.setZ(i, e * e * 0.45 + 0.02 * Math.sin(x * 2 + y));
		}
		g.computeVertexNormals();
		return g;
	}, []);
	const penWorld: [number, number, number] | null = pen ? [(pen[0] / PW - 0.5) * SW, 0.06, (pen[1] / PH - 0.5) * SH] : null;
	const vela: [number, number, number] = [3.9, 0, -2.6];
	const flameP = project([vela[0], 1.55, vela[2]], cam, look, 40);
	return (
		<>
			<Stage3D fov={40}>
				<Camera pos={cam} look={look} />
				<ambientLight intensity={0.22} />
				<pointLight position={[vela[0], 1.8, vela[2]]} intensity={30 * fl} distance={18} color={C.flama} castShadow shadow-mapSize={[1024, 1024]} shadow-bias={-0.002} />
				<directionalLight position={[-6, 8, 5]} intensity={0.6} color="#c8b0d8" />
				<mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
					<planeGeometry args={[40, 40]} />
					<meshStandardMaterial color="#2a1408" roughness={0.7} />
				</mesh>
				<mesh geometry={geo} rotation={[-Math.PI / 2, 0, 0.04]} position={[0, 0.03, 0]} receiveShadow>
					<meshStandardMaterial map={tex} roughness={0.95} side={THREE.DoubleSide} />
				</mesh>
				{/* tintero */}
				<group position={[-3.8, 0, -2.4]}>
					<mesh position={[0, 0.35, 0]} castShadow>
						<cylinderGeometry args={[0.55, 0.65, 0.7, 20]} />
						<meshStandardMaterial color="#1a1a2a" roughness={0.05} metalness={0.3} transparent opacity={0.85} />
					</mesh>
					<mesh position={[0, 0.78, 0]}>
						<cylinderGeometry args={[0.25, 0.3, 0.18, 16]} />
						<meshStandardMaterial color="#c8902a" metalness={0.8} roughness={0.3} />
					</mesh>
				</group>
				{/* vela */}
				<mesh position={[vela[0], 0.75, vela[2]]} castShadow>
					<cylinderGeometry args={[0.22, 0.22, 1.5, 16]} />
					<meshStandardMaterial color={C.marfil} roughness={0.5} emissive="#5a3010" emissiveIntensity={0.3} />
				</mesh>
				{penWorld ? <Pluma3D tip={penWorld} t={t} /> : null}
			</Stage3D>
			<Light x={flameP.x} y={flameP.y} r={700} color={C.flama} o={0.3 * fl} />
			<Flame x={flameP.x} y={flameP.y} size={90} t={t} seed={61} fl={fl} />
		</>
	);
};

const Titulo: React.FC = () => {
	const f = useCurrentFrame();
	const t = f / FPS;
	const u = E.inOut(clamp((f - 10) / 50));
	const L = {x0: 230, x1: 770};
	const pen: [number, number] | null = u > 0 && u < 1 ? [lerp(L.x0, L.x1, u), 300] : null;
	const k = E.inOut(clamp(f / C06.S1));
	const cam: [number, number, number] = [lerp(-1.0, -0.4, k), lerp(16.5, 15.5, k), lerp(3.6, 4.0, k)];
	return (
		<AbsoluteFill style={{background: '#120804'}}>
			<Escritorio title={u} lines={[0, 0, 0, 0]} doodle={0} pen={pen} t={t} cam={cam} look={[0, 0, -0.4]} />
			<PaperTexture o={0.18} />
		</AbsoluteFill>
	);
};

const Verso: React.FC = () => {
	const f = useCurrentFrame();
	const t = f / FPS + 3;
	let pen: [number, number] | null = null;
	const lines = VERSO.map((_, i) => {
		const u = clamp((f - LINE_AT[i]) / LINE_DUR);
		const L = lineGeom3(i);
		if (u > 0 && u < 1) pen = [lerp(L.x0, L.x1, u), L.y + 10];
		return u;
	});
	const k = E.inOut(clamp(f / C06.S2));
	const cam: [number, number, number] = [lerp(-0.4, 0.3, k), lerp(15.5, 14.6, k), lerp(4.0, 4.4, k)];
	return (
		<AbsoluteFill style={{background: '#120804'}}>
			<Escritorio title={1} lines={lines} doodle={E.inOut(clamp((f - 20) / 120))} pen={pen} t={t} cam={cam} look={[0, 0, -0.2]} />
			<PaperTexture o={0.18} />
		</AbsoluteFill>
	);
};

const Tinta: React.FC<{dias: number; fecha: string}> = ({dias, fecha}) => {
	const f = useCurrentFrame();
	const t = f / FPS + 10;
	const txt = String(dias);
	const HIT = C06.HIT;
	const DROP = 14;
	const drop = clamp(f / DROP);
	const spread = E.out(clamp((f - DROP) / 30));
	const gold = E.inOut(clamp((f - HIT + 12) / 20));
	const size = numSize(txt);
	const blobs = Array.from({length: 9}).map((_, i) => ({a: (i / 9) * Math.PI * 2 + hash(i, 1), d: 60 + 140 * hash(i, 2), r: 20 + 40 * hash(i, 3)}));
	return (
		<Pergamino>
			{/* gota que cae y salpica */}
			{f < DROP ? (
				<svg width={W} height={H} style={{position: 'absolute', inset: 0}}>
					<path d={`M 540 ${lerp(150, NUM_Y - 30, drop * drop)} c -18 26 -18 44 0 44 c 18 0 18 -18 0 -44 Z`} fill={INK} />
				</svg>
			) : null}
			{f >= DROP ? (
				<svg width={W} height={H} style={{position: 'absolute', inset: 0}}>
					{blobs.map((b, i) => (
						<circle key={i} cx={540 + Math.cos(b.a) * b.d * spread} cy={NUM_Y + Math.sin(b.a) * b.d * spread * 0.8} r={b.r * spread * (1 - gold)} fill={INK} opacity={0.9} />
					))}
				</svg>
			) : null}
			{/* la tinta se vuelve número */}
			<div
				style={{
					position: 'absolute',
					left: 0,
					width: W,
					top: NUM_Y - size / 2,
					height: size,
					lineHeight: `${size}px`,
					textAlign: 'center',
					fontFamily: 'Rye',
					fontSize: size,
					color: INK,
					opacity: spread * (1 - gold),
					transform: `scale(${lerp(0.6, 1, spread)})`,
					filter: `blur(${(1 - spread) * 10}px)`,
				}}
			>
				{txt}
			</div>
			<GoldNumber txt={txt} o={gold} glow={0.35 * gold} />
			<Lockup f={f} at={HIT + 4} dias={dias} fecha={fecha} tone="dark" />
			<AbsoluteFill style={{background: '#000', opacity: ramp(f, [C06.REV - 8, C06.REV - 1], [0, 1], E.inOut)}} />
			{void t}
		</Pergamino>
	);
};

export const Cap06: React.FC<{dias: number; fecha: string}> = ({dias, fecha}) => {
	const f = useCurrentFrame();
	const a = C06.S1;
	const b = a + C06.S2;
	return (
		<AbsoluteFill style={{background: '#000'}}>
			<Sequence durationInFrames={a}>
				<Titulo />
			</Sequence>
			<Sequence from={a} durationInFrames={C06.S2}>
				<Verso />
			</Sequence>
			<Sequence from={b} durationInFrames={C06.REV}>
				<Tinta dias={dias} fecha={fecha} />
			</Sequence>
			<Dip f={f} at={b} dur={10} />
			{void W}
		</AbsoluteFill>
	);
};
