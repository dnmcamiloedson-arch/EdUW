import React from 'react';
import {AbsoluteFill, Sequence, useCurrentFrame} from 'remotion';
import {C, E, FPS, H, W, clamp, css, hash, lerp, mixRGB, ramp, rgba} from '../lib/util';
import {Light, PaperTexture, useCanvasDraw} from '../components/core';
import {useGlyph} from '../countdown/reveals';
import {Kinetic, Lockup, NUM_Y, numSize} from './kit/type';
import {Dip, LightLeak} from './kit/transitions';
import {Camera, Stage3D, THREE, project} from './kit/three';

// Capítulo 9 · "Papel picado" — en San Salvador Huixcolotla el papel se corta a golpe de cincel.
export const C09 = {S1: 108, S2: 108, S3: 78, REV: 132, HIT: 74};
export const C09_LEN = C09.S1 + C09.S2 + C09.S3 + C09.REV;

// Golpes del mazo (frames locales) — la música marca los mismos tiempos
export const STRIKES_S2 = [14, 34, 54, 74, 94];
export const STRIKES_REV = [6, 16, 26, 36, 46, 56, 66];

// ---------- Papel picado en 3D ----------
const HOLES: {x: number; y: number; k: 'rombo' | 'flor' | 'gota' | 'circ'}[] = [
	{x: 240, y: 240, k: 'flor'},
	{x: 560, y: 240, k: 'flor'},
	{x: 400, y: 460, k: 'rombo'},
	{x: 240, y: 660, k: 'gota'},
	{x: 560, y: 660, k: 'gota'},
];
// (coordenadas en píxeles de la hoja de 740×920)
const holeD = (ctx: CanvasRenderingContext2D, k: string, s: number) => {
	ctx.beginPath();
	if (k === 'rombo') {
		ctx.moveTo(0, -s);
		ctx.lineTo(s * 0.7, 0);
		ctx.lineTo(0, s);
		ctx.lineTo(-s * 0.7, 0);
	} else if (k === 'gota') {
		ctx.moveTo(0, -s);
		ctx.bezierCurveTo(s * 0.8, -s * 0.2, s * 0.6, s * 0.8, 0, s * 0.8);
		ctx.bezierCurveTo(-s * 0.6, s * 0.8, -s * 0.8, -s * 0.2, 0, -s);
	} else if (k === 'flor') {
		for (let i = 0; i < 6; i++) {
			const a = (i / 6) * Math.PI * 2;
			ctx.moveTo(Math.cos(a) * s * 0.55 + s * 0.32, Math.sin(a) * s * 0.55);
			ctx.arc(Math.cos(a) * s * 0.55, Math.sin(a) * s * 0.55, s * 0.32, 0, Math.PI * 2);
		}
	} else ctx.arc(0, 0, s, 0, Math.PI * 2);
	ctx.closePath();
	ctx.fill();
};

// Textura de hoja: color sólido con calados (alfa) y, opcional, el trazo a lápiz
const useSheetTex = (w: number, h: number, draw: (ctx: CanvasRenderingContext2D) => void, deps: unknown[]) => {
	const [cv] = React.useState(() => {
		const c = document.createElement('canvas');
		c.width = w;
		c.height = h;
		return c;
	});
	const tex = React.useMemo(() => {
		const t = new THREE.CanvasTexture(cv);
		t.colorSpace = THREE.SRGBColorSpace;
		t.anisotropy = 4;
		return t;
	}, [cv]);
	React.useLayoutEffect(() => {
		const ctx = cv.getContext('2d')!;
		ctx.globalCompositeOperation = 'source-over';
		ctx.clearRect(0, 0, w, h);
		draw(ctx);
		tex.needsUpdate = true;
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, deps);
	return tex;
};

const baseSheet = (ctx: CanvasRenderingContext2D, w: number, h: number) => {
	ctx.fillStyle = '#ffffff';
	ctx.fillRect(0, 0, w, h);
};
// los calados se pintan en negro: la textura se usa como alphaMap (y como map para el trazo a lápiz)
const cutOut = (ctx: CanvasRenderingContext2D) => {
	ctx.globalCompositeOperation = 'source-over';
	ctx.fillStyle = '#000000';
};

// Hoja con leve ondulación (papel delgado)
const Hoja: React.FC<{tex: THREE.Texture; color: string; w: number; h: number; pos: [number, number, number]; rot?: [number, number, number]; t: number; curl?: number; emissive?: number}> = ({tex, color, w, h, pos, rot = [0, 0, 0], t, curl = 0.08, emissive = 0}) => {
	const geo = React.useMemo(() => new THREE.PlaneGeometry(w, h, 20, 24), [w, h]);
	const base = React.useMemo(() => Float32Array.from(geo.attributes.position.array as Float32Array), [geo]);
	React.useLayoutEffect(() => {
		const p = geo.attributes.position as THREE.BufferAttribute;
		for (let i = 0; i < p.count; i++) {
			const x = base[i * 3];
			const y = base[i * 3 + 1];
			p.setZ(i, curl * (Math.sin(x * 0.7 + t * 1.2) * 0.6 + Math.sin(y * 0.5 - t * 0.8) * 0.4 + (x * x) / (w * w)));
		}
		p.needsUpdate = true;
		geo.computeVertexNormals();
	});
	return (
		<mesh geometry={geo} position={pos} rotation={rot} castShadow receiveShadow>
			<meshStandardMaterial map={tex} alphaMap={tex} color={color} transparent alphaTest={0.5} side={THREE.DoubleSide} roughness={0.9} emissive={color} emissiveIntensity={emissive} />
		</mesh>
	);
};

// Cincel y mazo en 3D. El mazo gira sobre su mango y golpea en cada strike.
const Herramientas3D: React.FC<{pos: [number, number, number]; f: number; strikes: number[]; s?: number}> = ({pos, f, strikes, s = 1}) => {
	let lift = 1;
	for (const st of strikes) {
		const d = f - st;
		if (d >= -8 && d < 0) lift = Math.min(lift, E.in(clamp(-d / 8)));
		if (d >= 0 && d < 10) lift = Math.min(lift, E.out(clamp(d / 10)));
	}
	const ang = lerp(0, 0.75, lift);
	return (
		<group position={pos} scale={s}>
			{/* cincel: hoja de acero y cabeza */}
			<mesh position={[0, 1.1, 0]} castShadow>
				<cylinderGeometry args={[0.07, 0.07, 2, 12]} />
				<meshStandardMaterial color="#c8ccd2" metalness={0.9} roughness={0.25} />
			</mesh>
			<mesh position={[0, 0.08, 0]} castShadow>
				<coneGeometry args={[0.09, 0.2, 4]} />
				<meshStandardMaterial color="#9aa0a8" metalness={0.9} roughness={0.3} />
			</mesh>
			<mesh position={[0, 2.2, 0]} castShadow>
				<cylinderGeometry args={[0.13, 0.1, 0.25, 12]} />
				<meshStandardMaterial color="#6a6e74" metalness={0.8} roughness={0.4} />
			</mesh>
			{/* mazo: pivote en la mano, a la derecha */}
			<group position={[2.6, 2.75, 0]} rotation={[0, 0, ang]}>
				<mesh position={[-1.35, 0, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
					<cylinderGeometry args={[0.11, 0.13, 2.7, 10]} />
					<meshStandardMaterial color="#5a361c" roughness={0.8} />
				</mesh>
				<mesh position={[-2.6, 0, 0]} castShadow>
					<boxGeometry args={[0.8, 0.7, 0.7]} />
					<meshStandardMaterial color="#9a6a3a" roughness={0.75} />
				</mesh>
			</group>
		</group>
	);
};

// Mesa de madera
const Mesa3D: React.FC = () => (
	<>
		<mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
			<planeGeometry args={[40, 40]} />
			<meshStandardMaterial color="#3a1e0c" roughness={0.85} />
		</mesh>
		{Array.from({length: 16}).map((_, i) => (
			<mesh key={i} rotation={[-Math.PI / 2, 0, 0]} position={[-20 + i * 2.6, 0.003, 0]}>
				<planeGeometry args={[0.04, 40]} />
				<meshBasicMaterial color="#1a0d05" />
			</mesh>
		))}
	</>
);
const LucesMesa: React.FC = () => (
	<>
		<ambientLight intensity={0.25} />
		<directionalLight position={[-6, 12, 6]} intensity={2.2} color="#ffd8a8" castShadow shadow-mapSize={[1024, 1024]} />
		<directionalLight position={[6, 4, -6]} intensity={0.5} color="#8a7aa0" />
	</>
);

const SW = 7.4;
const SH = 9.2;
const PX = 100; // píxeles por unidad en la textura de la hoja
const COLS = [C.verde, C.flama, C.terracota, C.cempa];

// Pila de papel de china con el dibujo que se traza solo
const Trazo: React.FC = () => {
	const f = useCurrentFrame();
	const t = f / FPS;
	const draw = E.inOut(clamp((f - 10) / 70));
	const plain = useSheetTex(740, 920, (ctx) => baseSheet(ctx, 740, 920), []);
	const top = useSheetTex(
		740,
		920,
		(ctx) => {
			baseSheet(ctx, 740, 920);
			ctx.strokeStyle = '#8a7a70';
			ctx.lineWidth = 3;
			ctx.setLineDash([2400 * draw, 2400]);
			ctx.strokeRect(80, 80, 580, 760);
			HOLES.forEach((h) => {
				ctx.save();
				ctx.translate(h.x + 30, h.y);
				ctx.beginPath();
				ctx.setLineDash([600 * draw, 600]);
				ctx.arc(0, 0, 70, 0, Math.PI * 2 * draw);
				ctx.stroke();
				ctx.restore();
			});
		},
		[draw],
	);
	const u = E.inOut(clamp(f / C09.S1));
	return (
		<AbsoluteFill style={{background: '#120802'}}>
			<Stage3D fov={40}>
				<Camera pos={[lerp(-3, 1, u), lerp(19, 16, u), lerp(11, 9, u)]} look={[0.2, 0, 0.3]} />
				<LucesMesa />
				<Mesa3D />
				{COLS.map((c, i) => (
					<Hoja key={i} tex={i === 3 ? top : plain} color={c} w={SW} h={SH} pos={[i * 0.06, 0.02 + i * 0.02, -i * 0.08]} rot={[-Math.PI / 2, 0, -0.05 + i * 0.03]} t={t} curl={0.02} />
				))}
			</Stage3D>
			<Light x={300} y={300} r={1300} color={C.flama} o={0.25} />
			<PaperTexture o={0.2} />
			<Kinetic text={'En Huixcolotla, el papel\nse corta a golpe de cincel.'} f={f} at={12} out={94} y={300} size={48} scrim={0.45} />
		</AbsoluteFill>
	);
};

const Cincel: React.FC = () => {
	const f = useCurrentFrame();
	const t = f / FPS;
	let cut = -1;
	STRIKES_S2.forEach((st, i) => {
		if (f >= st) cut = i;
	});
	const next = Math.min(HOLES.length - 1, cut + 1);
	const prevH = HOLES[Math.max(0, cut)];
	const nh = HOLES[next];
	const lastSt = cut >= 0 ? STRIKES_S2[cut] : 0;
	const mv = cut < 0 ? 1 : E.inOut(clamp((f - lastSt - 4) / 10));
	const hx = cut < 0 ? nh.x + 30 : lerp(prevH.x + 30, nh.x + 30, mv);
	const hy = cut < 0 ? nh.y : lerp(prevH.y, nh.y, mv);
	// píxel de la hoja → mundo (hoja acostada sobre la mesa, centrada en el origen)
	const wx = hx / PX - SW / 2;
	const wz = hy / PX - SH / 2;
	const tex = useSheetTex(
		740,
		920,
		(ctx) => {
			baseSheet(ctx, 740, 920);
			cutOut(ctx);
			HOLES.forEach((h, i) => {
				if (cut < i) return;
				ctx.save();
				ctx.translate(h.x + 30, h.y);
				holeD(ctx, h.k, 70 * E.out(clamp((f - STRIKES_S2[i]) / 4)));
				ctx.restore();
			});
			ctx.globalCompositeOperation = 'source-over';
			ctx.strokeStyle = '#9a9a9a';
			ctx.lineWidth = 3;
			HOLES.forEach((h, i) => {
				if (cut >= i) return;
				ctx.beginPath();
				ctx.arc(h.x + 30, h.y, 70, 0, Math.PI * 2);
				ctx.stroke();
			});
		},
		[cut, f < (STRIKES_S2[cut] ?? -99) + 5 ? f : -1],
	);
	const shake = STRIKES_S2.reduce((a, st) => a + (f >= st && f < st + 6 ? (6 - (f - st)) * 0.012 : 0), 0);
	const cam: [number, number, number] = [wx + 3.5 + (hash(f, 1) - 0.5) * shake, 9.5 + (hash(f, 2) - 0.5) * shake, wz + 6];
	const look: [number, number, number] = [wx * 0.6, 0.5, wz * 0.6];
	const hit = project([wx, 0.05, wz], cam, look, 42);
	const ref = useCanvasDraw(
		(ctx) => {
			STRIKES_S2.forEach((st, i) => {
				const d = f - st;
				if (d < 0 || d > 24) return;
				for (let k = 0; k < 14; k++) {
					const a = hash(i * 20 + k, 9) * 6.28;
					const sp = 120 + 260 * hash(i * 20 + k, 10);
					const tt = d / FPS;
					const x = hit.x + Math.cos(a) * sp * tt;
					const y = hit.y - 120 * tt + Math.sin(a) * sp * tt * 0.5 + 500 * tt * tt;
					ctx.fillStyle = rgba([C.verde, C.flama, C.terracota][k % 3], 1 - d / 24);
					ctx.save();
					ctx.translate(x, y);
					ctx.rotate(tt * 12 + k);
					ctx.fillRect(-6, -4, 12, 8);
					ctx.restore();
				}
			});
		},
		[f],
	);
	return (
		<AbsoluteFill style={{background: '#120802'}}>
			<Stage3D fov={42}>
				<Camera pos={cam} look={look} />
				<LucesMesa />
				<Mesa3D />
				{COLS.slice(0, 3).map((c, i) => (
					<Hoja key={i} tex={tex} color={c} w={SW} h={SH} pos={[i * 0.05, 0.02 + i * 0.015, -i * 0.06]} rot={[-Math.PI / 2, 0, -0.02 + i * 0.02]} t={t} curl={0.015} />
				))}
				<Herramientas3D pos={[wx, 0.06, wz]} f={f} strikes={STRIKES_S2} s={1} />
			</Stage3D>
			<canvas ref={ref} width={W} height={H} style={{position: 'absolute', inset: 0}} />
			<PaperTexture o={0.2} />
		</AbsoluteFill>
	);
};

// Las hojas se separan en abanico: todas con el mismo calado, la luz pasa por los huecos
const Abanico: React.FC = () => {
	const f = useCurrentFrame();
	const t = f / FPS;
	const u = E.out(clamp(f / 46));
	const tex = useSheetTex(
		740,
		920,
		(ctx) => {
			baseSheet(ctx, 740, 920);
			cutOut(ctx);
			HOLES.forEach((h) => {
				ctx.save();
				ctx.translate(h.x + 30, h.y);
				holeD(ctx, h.k, 70);
				ctx.restore();
			});
		},
		[],
	);
	const colors = [C.verde, C.flama, C.terracota, C.cempa, C.verde, C.flama];
	const orb = lerp(-0.35, 0.25, E.inOut(clamp(f / C09.S3)));
	return (
		<AbsoluteFill style={{background: '#0a0402'}}>
			<Light x={540} y={800} r={1000} color={C.cempa} o={0.6} />
			<Stage3D fov={40}>
				<Camera pos={[Math.sin(orb) * 23, 1.5, Math.cos(orb) * 23]} look={[0, 0.5, 0]} />
				<ambientLight intensity={0.3} />
				<directionalLight position={[3, 6, 10]} intensity={1.5} color="#ffd8a8" />
				<pointLight position={[0, 2, -6]} intensity={300} distance={30} color={C.flama} />
				{colors.map((c, i) => {
					const a = (i - 2.5) * 0.19 * u;
					return (
						<group key={i} position={[0, -5.5, (i - 2.5) * 0.12]} rotation={[0, 0, a]}>
							<Hoja tex={tex} color={c} w={SW} h={SH} pos={[0, SH / 2 + 1, 0]} t={t + i} curl={0.1} emissive={0.12} />
						</group>
					);
				})}
			</Stage3D>
			<PaperTexture o={0.2} />
			<Kinetic text={'Cada golpe atraviesa\ndecenas de hojas.'} f={f} at={6} out={66} y={300} size={48} scrim={0.45} />
		</AbsoluteFill>
	);
};

// Revelación: la hoja colgada de frente, la luz detrás atraviesa el número calado
const Calado: React.FC<{dias: number; fecha: string}> = ({dias, fecha}) => {
	const f = useCurrentFrame();
	const t = f / FPS;
	const txt = String(dias);
	const g = useGlyph(txt, numSize(txt), 20, 0);
	const HIT = C09.HIT;
	const back = ramp(f, [HIT - 6, HIT + 12], [0, 1], E.out);
	const groups = STRIKES_REV.length;
	const pts = g?.pts ?? [];
	const minX = Math.min(...pts.map((p) => p[0]), 0);
	const maxX = Math.max(...pts.map((p) => p[0]), 1);
	const grp = (gx: number) => Math.min(groups - 1, Math.floor(((gx - minX) / (maxX - minX + 1)) * groups));
	let cut = -1;
	STRIKES_REV.forEach((st, i) => {
		if (f >= st) cut = i;
	});
	// hoja de 920×1320 px = 9.2×13.2 u; a 26.4 u con fov 40 ocupa el mismo lugar que el diseño 2D
	const tex = useSheetTex(
		920,
		1320,
		(ctx) => {
			baseSheet(ctx, 920, 1320);
			cutOut(ctx);
			pts.forEach(([gx, gy]) => {
				const gi = grp(gx);
				if (gi > cut) return;
				const p = E.out(clamp((f - STRIKES_REV[gi]) / 4));
				ctx.beginPath();
				ctx.arc(460 + gx, 560 + gy, 13 * p, 0, Math.PI * 2);
				ctx.fill();
			});
			// marco calado
			ctx.strokeStyle = '#000';
			ctx.setLineDash([22, 10]);
			ctx.lineWidth = 6;
			ctx.strokeRect(30, 30, 860, 1260);
		},
		[cut, pts.length, f < HIT ? f : HIT],
	);
	return (
		<AbsoluteFill style={{background: '#0a0503'}}>
			{/* luz detrás del papel */}
			<Light x={540} y={NUM_Y} r={1000} color={C.cempa} o={0.85 * back} />
			<Light x={540} y={NUM_Y} r={420} color="#FFF0C8" o={0.6 * back} />
			<Stage3D fov={40}>
				<Camera pos={[0, 0, 26.4]} look={[0, 0, 0]} />
				<ambientLight intensity={0.35} />
				<directionalLight position={[-4, 6, 10]} intensity={1.3} color="#ffd8a8" />
				<directionalLight position={[0, 0, -10]} intensity={1.2 * back} color={C.flama} />
				<Hoja tex={tex} color={css(mixRGB(C.ink, C.verde, 0.8 + 0.2 * back))} w={9.2} h={13.2} pos={[0, 0, 0]} rot={[0, Math.sin(t * 0.8) * 0.03, 0]} t={t} curl={0.12} emissive={0.05} />
			</Stage3D>
			<Lockup f={f} at={HIT + 4} dias={dias} fecha={fecha} />
			<PaperTexture o={0.2} />
			<AbsoluteFill style={{background: '#000', opacity: ramp(f, [C09.REV - 8, C09.REV - 1], [0, 1], E.inOut)}} />
		</AbsoluteFill>
	);
};

export const Cap09: React.FC<{dias: number; fecha: string}> = ({dias, fecha}) => {
	const f = useCurrentFrame();
	const a = C09.S1;
	const b = a + C09.S2;
	const c = b + C09.S3;
	return (
		<AbsoluteFill style={{background: '#000'}}>
			<Sequence durationInFrames={a}>
				<Trazo />
			</Sequence>
			<Sequence from={a} durationInFrames={C09.S2}>
				<Cincel />
			</Sequence>
			<Sequence from={b} durationInFrames={C09.S3}>
				<Abanico />
			</Sequence>
			<Sequence from={c} durationInFrames={C09.REV}>
				<Calado dias={dias} fecha={fecha} />
			</Sequence>
			<Dip f={f} at={a} dur={10} />
			<LightLeak f={f} at={b} dur={14} />
			<Dip f={f} at={c} dur={10} />
		</AbsoluteFill>
	);
};
