import React, {useEffect, useState} from 'react';
import {AbsoluteFill, Sequence, continueRender, delayRender, useCurrentFrame} from 'remotion';
import {C, E, FPS, H, W, clamp, css, flicker, hash, lerp, mixRGB, ramp, rgba} from '../lib/util';
import {Flame, Light, PaperTexture} from '../components/core';
import {PetalRain, PETAL_LAYERS, Sparks} from '../components/Particles';
import {fontsReady} from '../lib/fonts';
import {Orb, Sky} from './kit/land';
import {Kinetic, Lockup, NUM_Y, numSize} from './kit/type';
import {Dip, LightLeak} from './kit/transitions';
import {Camera, Stage3D, project} from './kit/three';

// Capítulo 12 · "El Callejón del Beso" — dos balcones tan cerca que cabe un beso.
export const C12 = {S1: 126, S2: 108, S3: 66, REV: 126, HIT: 66};
export const C12_LEN = C12.S1 + C12.S2 + C12.S3 + C12.REV;

// ---------- Fachada colonial (rectángulo plano; se pone en perspectiva con CSS 3D) ----------
const Fachada: React.FC<{w: number; h: number; color: string; trim: string; seed: number; lit: number; t: number}> = ({w, h, color, trim, seed, lit, t}) => {
	const rows = 6;
	const cols = 3;
	return (
		<svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
			<rect width={w} height={h} fill={rgba(mixRGB(C.ink, color, 0.55 * lit + 0.12))} />
			{Array.from({length: rows}).map((_, r) =>
				Array.from({length: cols}).map((_, c) => {
					const x = 120 + c * ((w - 240) / cols) + 40;
					const y = 160 + r * (h / rows);
					const ww = (w - 240) / cols - 80;
					const on = hash(r * 7 + c, seed) > 0.45;
					const fl = 0.85 + 0.15 * Math.sin(t * 3 + r + c);
					return (
						<g key={`${r}-${c}`}>
							<rect x={x - 14} y={y - 14} width={ww + 28} height={300} fill={rgba(mixRGB(C.ink, trim, 0.6 * lit + 0.1))} />
							<path d={`M ${x} ${y + 270} L ${x} ${y + 60} Q ${x + ww / 2} ${y - 20} ${x + ww} ${y + 60} L ${x + ww} ${y + 270} Z`} fill={on ? rgba(mixRGB('#3a1a08', C.flama, 0.55 * fl)) : '#0b0607'} />
							<path d={`M ${x + ww / 2} ${y + 20} L ${x + ww / 2} ${y + 270} M ${x} ${y + 150} L ${x + ww} ${y + 150}`} stroke="#120806" strokeWidth={8} />
							{/* balcón de herrería */}
							<rect x={x - 30} y={y + 270} width={ww + 60} height={14} fill="#0d0706" />
							{Array.from({length: 9}).map((_, k) => (
								<path key={k} d={`M ${x - 24 + k * ((ww + 48) / 8)} ${y + 284} l 0 70`} stroke="#0d0706" strokeWidth={5} />
							))}
							<rect x={x - 30} y={y + 350} width={ww + 60} height={10} fill="#0d0706" />
							{/* maceta con cempasúchil */}
							<circle cx={x + 16} cy={y + 258} r={20} fill={rgba(mixRGB(C.ink, C.cempa, 0.7 * lit + 0.2))} />
							<circle cx={x + ww - 16} cy={y + 258} r={16} fill={rgba(mixRGB(C.ink, C.flama, 0.6 * lit + 0.2))} />
						</g>
					);
				}),
			)}
		</svg>
	);
};

const Callejon: React.FC = () => {
	const f = useCurrentFrame();
	const t = f / FPS;
	const tilt = ramp(f, [0, C12.S1], [0, 1], E.inOut);
	const fl = flicker(t, 12);
	const WALL_W = 1100;
	const WALL_H = 2400;
	return (
		<AbsoluteFill style={{background: '#040308'}}>
			<Sky t={t} top="#05040c" mid="#0e0a16" horizon="#1a1220" hy={1900} stars={60} />
			<Orb x={540} y={lerp(380, 300, tilt)} r={34} color={C.marfil} core="#FFFBF0" halo={4} o={0.85} />
			<AbsoluteFill style={{perspective: '900px', perspectiveOrigin: `540px ${lerp(1500, 1700, tilt)}px`}}>
				<div
					style={{
						position: 'absolute',
						left: 540 - 70 - WALL_W,
						top: H - WALL_H + 300,
						width: WALL_W,
						height: WALL_H,
						transformOrigin: '100% 50%',
						transform: `rotateY(${lerp(76, 80, tilt)}deg)`,
					}}
				>
					<Fachada w={WALL_W} h={WALL_H} color={C.terracota} trim={C.arena} seed={121} lit={0.85 + 0.15 * fl} t={t} />
				</div>
				<div
					style={{
						position: 'absolute',
						left: 540 + 70,
						top: H - WALL_H + 300,
						width: WALL_W,
						height: WALL_H,
						transformOrigin: '0% 50%',
						transform: `rotateY(${-lerp(76, 80, tilt)}deg)`,
					}}
				>
					<Fachada w={WALL_W} h={WALL_H} color={C.verde} trim={C.marfil} seed={122} lit={0.85 + 0.15 * fl} t={t} />
				</div>
			</AbsoluteFill>
			{/* faroles */}
			<Light x={250} y={1250} r={360} color={C.flama} o={0.45 * fl} />
			<Light x={830} y={980} r={300} color={C.flama} o={0.4 * fl} />
			<PaperTexture o={0.2} />
			<Kinetic text={'En Guanajuato, dos balcones\ncasi se tocan…'} f={f} at={14} out={110} y={1460} size={48} />
		</AbsoluteFill>
	);
};

// ---------- Los dos balcones en 3D: fachadas frente a frente en un callejón de 1.2 m ----------
const GAP = 3.0; // de muro a muro
const BAL_Y = 7.6;
const VELA_L: [number, number, number] = [-0.28, BAL_Y + 1.0 + 0.36, 0.25];
const VELA_R: [number, number, number] = [0.28, BAL_Y + 1.0 + 0.36, -0.25];
const Fachada3D: React.FC<{side: 1 | -1; color: string; lit: number}> = ({side, color, lit}) => {
	const x = side * (GAP / 2 + 0.5);
	const face = -side; // hacia el callejón
	const win = css(mixRGB('#2a1206', C.flama, 0.35 + 0.45 * lit));
	return (
		<group>
			{/* muro */}
			<mesh position={[x, 8, 0]} receiveShadow castShadow>
				<boxGeometry args={[1, 18, 14]} />
				<meshStandardMaterial color={color} roughness={0.95} />
			</mesh>
			{/* ventanas en arco, encendidas, piso por piso */}
			{[2.6, 5.0, BAL_Y + 1.6, 12.5].map((wy, k) =>
				[-4.4, 0, 4.4].map((wz, j) => {
					const on = k === 2 && j === 1 ? 1 : hash(k * 5 + j, side + 3) > 0.45 ? 0.8 : 0.15;
					return (
						<group key={k + '-' + j} position={[x + face * 0.51, wy, wz + (side > 0 ? 0.3 : -0.3)]} rotation={[0, (face * Math.PI) / 2, 0]}>
							<mesh>
								<planeGeometry args={[1.3, 2.1]} />
								<meshBasicMaterial color={on > 0.5 ? win : '#120806'} />
							</mesh>
							<mesh position={[0, 1.05, 0]}>
								<circleGeometry args={[0.65, 16, 0, Math.PI]} />
								<meshBasicMaterial color={on > 0.5 ? win : '#120806'} />
							</mesh>
							{/* marco de cantera */}
							<mesh position={[0, -1.12, 0.06]}>
								<boxGeometry args={[1.6, 0.14, 0.18]} />
								<meshStandardMaterial color="#b89a78" roughness={0.9} />
							</mesh>
							<mesh position={[0, 0.2, 0.01]}>
								<boxGeometry args={[0.07, 2.6, 0.04]} />
								<meshStandardMaterial color="#120806" />
							</mesh>
						</group>
					);
				}),
			)}
			{/* balcón */}
			<group position={[side * (GAP / 2) - side * 0.6, BAL_Y, side > 0 ? 0.3 : -0.3]}>
				<mesh castShadow receiveShadow>
					<boxGeometry args={[1.2, 0.16, 2.6]} />
					<meshStandardMaterial color="#6a5446" roughness={0.9} />
				</mesh>
				{/* barandal de hierro */}
				<mesh position={[-side * 0.58, 1.0, 0]} castShadow>
					<boxGeometry args={[0.05, 0.06, 2.6]} />
					<meshStandardMaterial color="#0d0605" roughness={0.5} metalness={0.4} />
				</mesh>
				{Array.from({length: 13}).map((_, k) => (
					<mesh key={k} position={[-side * 0.58, 0.5, -1.25 + k * 0.21]} castShadow>
						<cylinderGeometry args={[0.018, 0.018, 1, 6]} />
						<meshStandardMaterial color="#0d0605" roughness={0.5} metalness={0.4} />
					</mesh>
				))}
				{/* macetas con cempasúchil */}
				{[-0.8, 0.8].map((pz, k) => (
					<group key={k} position={[0, 0.3, pz]}>
						<mesh castShadow>
							<cylinderGeometry args={[0.2, 0.14, 0.3, 10]} />
							<meshStandardMaterial color={C.terracota} roughness={0.9} />
						</mesh>
						<mesh position={[0, 0.26, 0]} castShadow>
							<sphereGeometry args={[0.17, 10, 8]} />
							<meshStandardMaterial color={C.cempa} roughness={0.8} flatShading />
						</mesh>
					</group>
				))}
			</group>
			{/* vela sobre el barandal */}
			<mesh position={side < 0 ? [VELA_L[0], VELA_L[1] - 0.18, VELA_L[2]] : [VELA_R[0], VELA_R[1] - 0.18, VELA_R[2]]} castShadow>
				<cylinderGeometry args={[0.07, 0.07, 0.36, 12]} />
				<meshStandardMaterial color={C.marfil} roughness={0.6} emissive="#3a2008" emissiveIntensity={0.4 * lit} />
			</mesh>
		</group>
	);
};

const Beso: React.FC = () => {
	const f = useCurrentFrame();
	const t = f / FPS + 5;
	const IGN = 56;
	const flL = flicker(t, 121);
	const flR = flicker(t + 3, 122);
	const g2 = f < IGN ? 0 : clamp((f - IGN) / 10) * (1 + 0.3 * Math.exp(-(f - IGN) / 6));
	const lit = 0.6 + 0.4 * clamp((f - IGN) / 20);
	const u = E.inOut(clamp(f / C12.S2));
	const cam: [number, number, number] = [lerp(0.25, -0.15, u), BAL_Y + lerp(1.9, 1.4, u), lerp(6.5, 5.2, u)];
	const look: [number, number, number] = [0, BAL_Y + 0.6, -0.5];
	const pL = project(VELA_L, cam, look, 58);
	const pR = project(VELA_R, cam, look, 58);
	const sc = 1.2; // tamaño de la llama según la distancia
	return (
		<AbsoluteFill style={{background: '#050308'}}>
			<Sky t={t} top="#04030a" mid="#0d0a16" horizon="#1d1420" hy={1700} stars={80} />
			<Orb x={560} y={260} r={36} color={C.marfil} core="#FFFBF0" halo={4} o={0.85} />
			<Stage3D fov={58}>
				<Camera pos={cam} look={look} />
				<fog attach="fog" args={['#0a0610', 10, 45]} />
				<hemisphereLight args={['#5a5a80', '#0a0608', 0.35]} />
				<directionalLight position={[0, 30, -4]} intensity={0.8} color="#b8b0d8" />
				<pointLight position={VELA_L} intensity={10 * flL} distance={10} color={C.cempa} castShadow />
				<pointLight position={VELA_R} intensity={10 * flR * Math.min(1, g2)} distance={10} color={C.cempa} />
				<Fachada3D side={-1} color="#8a3a26" lit={lit} />
				<Fachada3D side={1} color="#2a5a48" lit={lit} />
				<mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
					<planeGeometry args={[GAP + 2, 40]} />
					<meshStandardMaterial color="#2a2420" roughness={1} />
				</mesh>
			</Stage3D>
			<Light x={pL.x} y={pL.y} r={360} color={C.cempa} o={0.4 * flL} />
			<Flame x={pL.x} y={pL.y + 6} size={46 * sc} t={t} seed={121} fl={flL} />
			<Sparks t={(f - IGN + 4) / FPS} x={pR.x} y={pR.y} n={18} seed={12} />
			{g2 > 0 ? (
				<>
					<Light x={pR.x} y={pR.y} r={360} color={C.cempa} o={0.4 * flR * Math.min(1, g2)} />
					<Flame x={pR.x} y={pR.y + 6} size={46 * sc} t={t + 1.3} seed={122} grow={g2} fl={flR} />
				</>
			) : null}
			{f > IGN - 14 && f < IGN + 2 ? (
				<svg width={W} height={H} style={{position: 'absolute', inset: 0}}>
					{(() => {
						const k = clamp((f - (IGN - 14)) / 14);
						const x = lerp(pL.x, pR.x, k);
						const y = lerp(pL.y - 40, pR.y, k) - Math.sin(k * Math.PI) * 70;
						return <circle cx={x} cy={y} r={7} fill="#FFF4D6" style={{filter: 'drop-shadow(0 0 12px #F5C242)'}} />;
					})()}
				</svg>
			) : null}
			<PaperTexture o={0.18} />
			<Kinetic text={'…tan cerca,\nque cabe un beso.'} f={f} at={6} out={96} y={1500} size={54} scrim={0.45} />
		</AbsoluteFill>
	);
};

// Las dos velas juntas, de cerca, sobre el barandal
const Petalos: React.FC = () => {
	const f = useCurrentFrame();
	const t = f / FPS + 8;
	const fl = flicker(t, 123);
	const cam: [number, number, number] = [lerp(-0.6, 0.6, f / C12.S3), 0.55, 2.4];
	const look: [number, number, number] = [0, 0.35, 0];
	const tops: [number, number, number][] = [[-0.16, 0.62, 0], [0.16, 0.62, 0.05]];
	const pts = tops.map((p) => project(p, cam, look, 40));
	return (
		<AbsoluteFill style={{background: '#070308'}}>
			<Light x={540} y={900} r={900} color={C.cempa} o={0.5 * fl} />
			<Stage3D fov={40}>
				<Camera pos={cam} look={look} />
				<ambientLight intensity={0.15} />
				<pointLight position={[0, 0.9, 0.1]} intensity={3 * fl} distance={6} color={C.cempa} castShadow />
				<directionalLight position={[-2, 3, -3]} intensity={0.6} color="#8a7aa0" />
				{tops.map((p, i) => (
					<group key={i} position={[p[0], 0, p[2]]}>
						<mesh position={[0, 0.3, 0]} castShadow receiveShadow>
							<cylinderGeometry args={[0.07, 0.075, 0.6, 20]} />
							<meshStandardMaterial color={C.marfil} roughness={0.5} emissive="#6a3a10" emissiveIntensity={0.1} />
						</mesh>
						{/* cera derretida */}
						<mesh position={[0.05, 0.5, 0.04]} scale={[0.4, 1.5, 0.4]}>
							<sphereGeometry args={[0.05, 8, 6]} />
							<meshStandardMaterial color="#f6efe0" roughness={0.4} />
						</mesh>
					</group>
				))}
				<mesh position={[0, -0.05, 0]} receiveShadow>
					<boxGeometry args={[3, 0.1, 0.5]} />
					<meshStandardMaterial color="#1a0e08" roughness={0.6} metalness={0.3} />
				</mesh>
			</Stage3D>
			{pts.map((p, i) => (
				<Flame key={i} x={p.x} y={p.y} size={130} t={t + i * 2} seed={124 + i} fl={fl} />
			))}
			<Light x={(pts[0].x + pts[1].x) / 2} y={pts[0].y - 80} r={300} color={C.flama} o={0.6 * fl} />
			<PetalRain t={t - 6} layer={{...PETAL_LAYERS[1], n: 36, seed: 126}} light={{x: 540, y: 1400, sigma: 900, L: 1}} />
			<PetalRain t={t - 6} layer={{...PETAL_LAYERS[2], n: 6, seed: 127}} light={{x: 540, y: 1400, sigma: 900, L: 1}} />
			<PaperTexture o={0.16} />
		</AbsoluteFill>
	);
};

// Rejilla de ventanas alineada; se encienden las que caen dentro del número
const useWindowGrid = (txt: string, size: number, sx: number, sy: number) => {
	const [cells, setCells] = useState<{x: number; y: number; on: boolean}[] | null>(null);
	const [handle] = useState(() => delayRender('ventanas'));
	useEffect(() => {
		fontsReady
			.then(() => document.fonts.load(`400 ${size}px Rye`))
			.then(() => {
				const cw = W;
				const ch = Math.ceil(size * 1.3);
				const c = document.createElement('canvas');
				c.width = cw;
				c.height = ch;
				const g = c.getContext('2d')!;
				g.fillStyle = '#fff';
				g.font = `400 ${size}px Rye`;
				g.textAlign = 'center';
				g.textBaseline = 'middle';
				g.fillText(txt, cw / 2, ch / 2);
				const d = g.getImageData(0, 0, cw, ch).data;
				const out: {x: number; y: number; on: boolean}[] = [];
				for (let y = sy / 2; y < ch; y += sy)
					for (let x = sx / 2 + 30; x < cw - 30; x += sx) {
						// Rye tiene filetes internos: se muestrea una rejilla de 3×3 dentro de cada ventana
						let hits = 0;
						for (let oy = -1; oy <= 1; oy++)
							for (let ox = -1; ox <= 1; ox++) {
								const px = Math.round(x + ox * sx * 0.3);
								const py = Math.round(y + oy * sy * 0.3);
								if (py >= 0 && py < ch && d[(py * cw + px) * 4 + 3] > 128) hits++;
							}
						const on = hits >= 3;
						out.push({x, y: NUM_Y - ch / 2 + y, on});
					}
				setCells(out);
				continueRender(handle);
			});
	}, [txt, size, sx, sy, handle]);
	return cells;
};

const Ventanas: React.FC<{dias: number; fecha: string}> = ({dias, fecha}) => {
	const f = useCurrentFrame();
	const t = f / FPS;
	const txt = String(dias);
	const cells = useWindowGrid(txt, numSize(txt), 38, 42);
	const HIT = C12.HIT;
	const fl = flicker(t + 20, 128);
	return (
		<AbsoluteFill style={{background: rgba(mixRGB('#120806', C.terracota, 0.35))}}>
			<svg width={W} height={H} style={{position: 'absolute', inset: 0}}>
				{cells?.map((c, i) => {
					const order = c.on ? 8 + ((c.y - (NUM_Y - 360)) / 720) * 44 + hash(i, 2) * 12 : 999;
					const p = c.on ? E.out(clamp((f - order) / 8)) : 0;
					const flick = p > 0 && p < 1 ? (hash(i, Math.floor(f)) > 0.5 ? 1 : 0.4) : 1;
					const glow = p * flick * (0.85 + 0.15 * fl);
					return (
						<g key={i}>
							<rect x={c.x - 14} y={c.y - 17} width={28} height={34} rx={3} fill={glow > 0 ? rgba(mixRGB('#1a0b06', '#FFD27A', glow)) : '#0c0607'} />
							<path d={`M ${c.x} ${c.y - 17} L ${c.x} ${c.y + 17} M ${c.x - 14} ${c.y} L ${c.x + 14} ${c.y}`} stroke="#140806" strokeWidth={2} />
						</g>
					);
				})}
			</svg>
			<Light x={540} y={NUM_Y} r={760} color={C.cempa} o={0.35 * ramp(f, [HIT - 20, HIT + 10], [0, 1], E.out)} />
			{/* velo para leer los rótulos */}
			<div style={{position: 'absolute', left: 0, top: 360, width: W, height: 150, background: 'linear-gradient(180deg, transparent, rgba(6,2,1,0.75), transparent)', opacity: ramp(f, [HIT, HIT + 10], [0, 1])}} />
			<div style={{position: 'absolute', left: 0, top: 1120, width: W, height: 260, background: 'linear-gradient(180deg, transparent, rgba(6,2,1,0.8), transparent)', opacity: ramp(f, [HIT, HIT + 10], [0, 1])}} />
			<Lockup f={f} at={HIT + 4} dias={dias} fecha={fecha} />
			<PaperTexture o={0.2} />
			<AbsoluteFill style={{background: '#000', opacity: ramp(f, [C12.REV - 8, C12.REV - 1], [0, 1], E.inOut)}} />
		</AbsoluteFill>
	);
};

export const Cap12: React.FC<{dias: number; fecha: string}> = ({dias, fecha}) => {
	const f = useCurrentFrame();
	const a = C12.S1;
	const b = a + C12.S2;
	const c = b + C12.S3;
	return (
		<AbsoluteFill style={{background: '#000'}}>
			<Sequence durationInFrames={a}>
				<Callejon />
			</Sequence>
			<Sequence from={a} durationInFrames={C12.S2}>
				<Beso />
			</Sequence>
			<Sequence from={b} durationInFrames={C12.S3}>
				<Petalos />
			</Sequence>
			<Sequence from={c} durationInFrames={C12.REV}>
				<Ventanas dias={dias} fecha={fecha} />
			</Sequence>
			<Dip f={f} at={a} dur={14} />
			<LightLeak f={f} at={b} dur={14} />
			<Dip f={f} at={c} dur={14} />
		</AbsoluteFill>
	);
};
