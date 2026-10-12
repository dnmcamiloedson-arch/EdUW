import React from 'react';
import {AbsoluteFill, Sequence, useCurrentFrame} from 'remotion';
import {C, E, FPS, H, W, clamp, css, flicker, hash, lerp, mixRGB, ramp, rgba} from '../lib/util';
import {Light, PaperTexture, useCanvasDraw} from '../components/core';
import {Embers, Smoke} from '../components/Particles';
import {useGlyph} from '../countdown/reveals';
import {Fog, Orb, Ridge, Sky, WaterReflect} from './kit/land';
import {GoldNumber, Kinetic, Lockup, NUM_Y, numSize} from './kit/type';
import {Dip, LightLeak} from './kit/transitions';
import {Camera, Mountain, Range, Stage3D, THREE, project} from './kit/three';

// Capítulo 15 · "Los volcanes" — Popocatépetl vela el sueño de Iztaccíhuatl.
export const C15 = {S1: 126, S2: 96, S3: 84, REV: 126, HIT: 62};
export const C15_LEN = C15.S1 + C15.S2 + C15.S3 + C15.REV;

// Los volcanes en 3D: Popocatépetl (cono con cráter encendido) e Iztaccíhuatl (la mujer dormida),
// reflejados en el lago. El reflejo es la misma geometría invertida bajo un agua translúcida.
// Paredes internas del cráter: roca oscura arriba, brasa al fondo
const Embudo: React.FC<{fl: number}> = ({fl}) => {
	const geo = React.useMemo(() => {
		const g = new THREE.ConeGeometry(12.4, 16, 20, 6, true);
		const p = g.attributes.position as THREE.BufferAttribute;
		const cols: number[] = [];
		const rock = new THREE.Color('#1a0e0e');
		const lava = new THREE.Color('#e0501a');
		for (let i = 0; i < p.count; i++) {
			const u = (8 - p.getY(i)) / 16; // tras girarlo: 0 fondo (punta), 1 borde
			const c = lava.clone().lerp(rock, Math.min(1, u * 1.6));
			cols.push(c.r, c.g, c.b);
		}
		g.setAttribute('color', new THREE.Float32BufferAttribute(cols, 3));
		return g;
	}, []);
	return (
		<mesh geometry={geo} position={[90, 115, -300]} rotation={[Math.PI, 0, 0]}>
			<meshBasicMaterial vertexColors side={THREE.DoubleSide} fog={false} color={css(mixRGB('#9a8a8a', '#ffffff', 0.5 + 0.5 * fl))} />
		</mesh>
	);
};

const Volcanes3D: React.FC<{fl: number}> = ({fl}) => (
	<group>
		{/* Iztaccíhuatl: cabeza, pecho, rodillas y pies, con nieve */}
		<group position={[-40, 0, -420]} scale={[0.85, 0.95, 0.6]}>
			<Mountain pos={[-60, 0, 0]} r={34} h={62} color="#3a2a34" snow="#e8e2d6" snowLine={0.62} seed={151} />
			<Mountain pos={[-10, 0, 6]} r={46} h={88} color="#3a2a34" snow="#e8e2d6" snowLine={0.55} seed={152} />
			<Mountain pos={[40, 0, -4]} r={40} h={72} color="#3a2a34" snow="#e8e2d6" snowLine={0.6} seed={153} />
			<Mountain pos={[86, 0, 4]} r={34} h={50} color="#3a2a34" snow="#e8e2d6" snowLine={0.7} seed={154} />
		</group>
		{/* Popocatépetl */}
		<Mountain pos={[90, 0, -300]} r={105} h={128} seg={18} rough={0.05} crater={0.12} color="#3e2a30" snow="#ece6da" snowLine={0.72} seed={155} />
		{/* fondo del cráter: embudo de lava */}
		<Embudo fl={fl} />
		<mesh position={[90, 108, -300]} rotation={[-Math.PI / 2, 0, 0]}>
			<circleGeometry args={[3, 12]} />
			<meshBasicMaterial color={css(mixRGB(C.flama, '#FFF0C0', 0.5 * fl))} fog={false} />
		</mesh>
		<pointLight position={[90, 135, -300]} intensity={180 * fl} distance={120} color={C.terracota} />
		{/* sierra lejana */}
		<Range z={-460} x0={-500} x1={500} n={12} r={60} h={70} color="#24182a" seed={156} />
		{/* orillas cercanas */}
		<Range z={-150} x0={-260} x1={-120} n={4} r={30} h={16} color="#120c10" seed={157} />
		<Range z={-120} x0={160} x1={300} n={4} r={30} h={14} color="#120c10" seed={158} />
	</group>
);

const Valle: React.FC = () => {
	const f = useCurrentFrame();
	const t = f / FPS;
	const u = E.inOut(clamp(f / C15.S1));
	const fl = flicker(t, 15);
	const cam: [number, number, number] = [lerp(-30, 10, u), lerp(12, 16, u), lerp(300, 230, u)];
	const look: [number, number, number] = [lerp(-10, 10, u), 62, -320];
	const crater = project([90, 124, -300], cam, look, 40);
	return (
		<AbsoluteFill>
			<Sky t={t} top="#05030c" mid="#170c18" horizon="#4a1e16" hy={1150} stars={240} />
			<Orb x={230} y={420} r={46} color={C.marfil} core="#FFFBF0" halo={4} o={0.85} />
			<Stage3D fov={40}>
				<Camera pos={cam} look={look} />
				<fog attach="fog" args={['#2a1418', 300, 1100]} />
				<hemisphereLight args={['#8a7aa0', '#140808', 0.32]} />
				<directionalLight position={[-300, 220, 200]} intensity={0.75} color="#cfc6e0" castShadow shadow-mapSize={[1024, 1024]} />
				<Volcanes3D fl={fl} />
				{/* reflejo */}
				<group scale={[1, -1, 1]}>
					<Volcanes3D fl={fl} />
				</group>
				<mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.2, -150]}>
					<planeGeometry args={[1600, 900]} />
					<meshStandardMaterial color="#120a16" transparent opacity={0.72} roughness={0.25} metalness={0.2} />
				</mesh>
			</Stage3D>
			{/* ondas y brillo de la luna en el agua */}
			<svg width={W} height={H} style={{position: 'absolute', inset: 0}}>
				{Array.from({length: 30}).map((_, i) => {
					const y = 1240 + i * i * 0.75;
					const w = 30 + i * 9 * (0.6 + 0.4 * Math.sin(t * 2 + i * 1.7));
					return <rect key={i} x={230 - w / 2 + Math.sin(t * 1.3 + i) * 12} y={y} width={w} height={2 + i * 0.1} rx={2} fill="#FFF3D6" opacity={0.32 - i * 0.008} />;
				})}
			</svg>
			<Light x={crater.x} y={crater.y} r={300} color={C.cempa} o={0.45 * fl} />
			<Smoke t={t + 4} x={crater.x} y={crater.y} L={0.9} n={130} rate={20} rise={90} wind={28} seed={151} lightX={crater.x} lightY={crater.y + 10} tint={C.arena} />
			<PaperTexture o={0.16} />
			<Kinetic text={'Él prometió\ncuidar su sueño…'} f={f} at={14} out={110} y={1430} size={52} scrim={0.4} />
		</AbsoluteFill>
	);
};

// Sobre el cráter del Popocatépetl: la cámara sube por la ladera y se asoma al fuego
const Crater: React.FC = () => {
	const f = useCurrentFrame();
	const t = f / FPS + 6;
	const fl = flicker(t, 151);
	const u = E.inOut(clamp(f / C15.S2));
	const cam: [number, number, number] = [lerp(-60, 30, u), lerp(120, 215, u), lerp(-110, -215, u)];
	const look: [number, number, number] = [90, 115, -300];
	const c = project([90, 118, -300], cam, look, 42);
	return (
		<AbsoluteFill style={{background: '#030208'}}>
			<Sky t={t} top="#03020a" mid="#0a0612" horizon="#1d0e10" hy={1500} stars={160} />
			<Stage3D fov={42}>
				<Camera pos={cam} look={look} />
				<fog attach="fog" args={['#120a10', 150, 900]} />
				<hemisphereLight args={['#6a5a80', '#100606', 0.3]} />
				<directionalLight position={[-300, 220, 200]} intensity={0.6} color="#cfc6e0" />
				<Volcanes3D fl={fl} />
			</Stage3D>
			<Light x={c.x} y={c.y} r={520} color={C.cempa} o={0.5 * fl} />
			<Light x={c.x} y={c.y} r={160} color={C.flama} o={0.55 * fl} />
			<Embers t={t} L={1} n={40} seed={152} src={[c.x - 120, c.y - 60, 240, 120]} />
			<Smoke t={t + 2} x={c.x} y={c.y} L={1.1} n={170} rate={26} rise={150} wind={20} seed={153} lightX={c.x} lightY={c.y + 20} tint={C.arena} />
			<PaperTexture o={0.16} />
			<Kinetic text={'…y su fuego\nsigue despierto.'} f={f} at={8} out={84} y={330} size={52} scrim={0.4} />
		</AbsoluteFill>
	);
};

// Campo de estrellas compartido: la estrella i nace en un punto fijo del cielo
const starHome = (i: number) => [hash(i * 3, 15) * W, 80 + hash(i * 3 + 1, 15) * 1500] as const;

const Cielo: React.FC = () => {
	const f = useCurrentFrame();
	const t = f / FPS + 9;
	const ref = useCanvasDraw(
		(ctx) => {
			for (let i = 0; i < 220; i++) {
				const [x, y] = starHome(i);
				const tw = 0.5 + 0.5 * Math.sin(t * (1.5 + hash(i, 4) * 2) + i);
				const br = clamp(f / 30) * (0.35 + 0.65 * tw);
				const r = 1 + 2.2 * hash(i, 5) ** 3;
				const g = ctx.createRadialGradient(x, y, 0, x, y, r * 5);
				g.addColorStop(0, rgba('#FFF8E8', br));
				g.addColorStop(0.3, rgba(C.flama, br * 0.4));
				g.addColorStop(1, rgba(C.flama, 0));
				ctx.fillStyle = g;
				ctx.fillRect(x - r * 5, y - r * 5, r * 10, r * 10);
			}
			const pts: [number, number][] = [
				[540, 560],
				[505, 650],
				[560, 720],
				[525, 800],
				[600, 860],
				[540, 960],
				[540, 1080],
			];
			pts.forEach(([x, y]) => {
				const gr = ctx.createRadialGradient(x, y, 0, x, y, 18);
				gr.addColorStop(0, rgba('#FFF8E8', clamp((f - 14) / 20)));
				gr.addColorStop(1, rgba(C.flama, 0));
				ctx.fillStyle = gr;
				ctx.fillRect(x - 18, y - 18, 36, 36);
			});
			// una constelación pequeña se dibuja (una antorcha): anticipa lo que viene
			ctx.strokeStyle = rgba(C.flama, 0.55);
			ctx.lineWidth = 1.6;
			const prog = clamp((f - 20) / 50) * (pts.length - 1);
			for (let k = 0; k < pts.length - 1; k++) {
				const u = clamp(prog - k);
				if (u <= 0) continue;
				ctx.beginPath();
				ctx.moveTo(pts[k][0], pts[k][1]);
				ctx.lineTo(lerp(pts[k][0], pts[k + 1][0], u), lerp(pts[k][1], pts[k + 1][1], u));
				ctx.stroke();
			}
		},
		[f],
	);
	return (
		<AbsoluteFill style={{background: 'linear-gradient(180deg,#020108,#08050e 70%,#140a0a)'}}>
			<canvas ref={ref} width={W} height={H} style={{position: 'absolute', inset: 0}} />
			<Smoke t={f / FPS + 7} x={540} y={2050} L={0.5 * (1 - f / C15.S3)} n={120} rate={20} rise={160} wind={14} seed={154} tint={C.arena} />
			<Kinetic text={'Desde entonces,\nel cielo cuenta los días.'} f={f} at={10} out={74} y={1430} size={50} />
		</AbsoluteFill>
	);
};

const Constelacion: React.FC<{dias: number; fecha: string}> = ({dias, fecha}) => {
	const f = useCurrentFrame();
	const t = f / FPS + 12;
	const txt = String(dias);
	const g = useGlyph(txt, numSize(txt), 40, 6);
	const HIT = C15.HIT;
	const ref = useCanvasDraw(
		(ctx) => {
			// estrellas de fondo
			for (let i = 0; i < 160; i++) {
				const [x, y] = starHome(i + 400);
				const tw = 0.5 + 0.5 * Math.sin(t * (1.3 + hash(i, 6)) + i);
				ctx.fillStyle = rgba('#FFF6E6', 0.25 + 0.35 * tw);
				ctx.beginPath();
				ctx.arc(x, y, 1 + hash(i, 7) * 1.4, 0, Math.PI * 2);
				ctx.fill();
			}
			if (!g) return;
			const n = g.pts.length;
			const tgt = g.pts.map(([gx, gy]) => [540 + gx, NUM_Y + gy] as const);
			const pos = tgt.map(([tx, ty], i) => {
				const [sx, sy] = starHome(i);
				const d = 4 + hash(i, 9) * 22;
				const a = E.inOut(clamp((f - d) / 34));
				return [lerp(sx, tx, a), lerp(sy, ty, a), a] as const;
			});
			// líneas de la constelación: cada estrella con sus vecinas más cercanas
			ctx.lineWidth = 2.2;
			for (let i = 0; i < n; i++) {
				const ds = tgt.map(([x, y], j) => [j, Math.hypot(x - tgt[i][0], y - tgt[i][1])] as const).filter(([j]) => j > i).sort((a, b) => a[1] - b[1]);
				for (const [j, dist] of ds.slice(0, 2)) {
					if (dist > 40 * 1.3) continue;
					const st = 38 + ((tgt[i][1] - (NUM_Y - 300)) / 600) * 18 + hash(i, 11) * 6;
					const u = E.out(clamp((f - st) / 10));
					if (u <= 0) continue;
					ctx.strokeStyle = rgba(C.flama, 0.6 * u);
					ctx.beginPath();
					ctx.moveTo(pos[i][0], pos[i][1]);
					ctx.lineTo(lerp(pos[i][0], pos[j][0], u), lerp(pos[i][1], pos[j][1], u));
					ctx.stroke();
				}
			}
			ctx.globalCompositeOperation = 'lighter';
			pos.forEach(([x, y, a], i) => {
				const tw = 0.75 + 0.25 * Math.sin(t * 3 + i);
				const r = (3 + 3 * a) * tw;
				const gr = ctx.createRadialGradient(x, y, 0, x, y, r * 4);
				gr.addColorStop(0, 'rgba(255,250,235,1)');
				gr.addColorStop(0.3, rgba(C.flama, 0.7));
				gr.addColorStop(1, rgba(C.cempa, 0));
				ctx.fillStyle = gr;
				ctx.fillRect(x - r * 4, y - r * 4, r * 8, r * 8);
			});
		},
		[g, f],
	);
	return (
		<AbsoluteFill style={{background: 'linear-gradient(180deg,#020108,#07040c 70%,#120808)'}}>
			<GoldNumber txt={txt} o={ramp(f, [HIT - 6, HIT + 26], [0, 0.32], E.out)} blur={14} glow={0.5} />
			<canvas ref={ref} width={W} height={H} style={{position: 'absolute', inset: 0}} />
			<Ridge seed={159} y={1830} amp={150} color="#0a060c" shadow={false} />
			<Lockup f={f} at={HIT + 4} dias={dias} fecha={fecha} />
			<PaperTexture o={0.14} />
			<AbsoluteFill style={{background: '#000', opacity: ramp(f, [C15.REV - 8, C15.REV - 1], [0, 1], E.inOut)}} />
		</AbsoluteFill>
	);
};

export const Cap15: React.FC<{dias: number; fecha: string}> = ({dias, fecha}) => {
	const f = useCurrentFrame();
	const a = C15.S1;
	const b = a + C15.S2;
	const c = b + C15.S3;
	return (
		<AbsoluteFill style={{background: '#000'}}>
			<Sequence durationInFrames={a}>
				<Valle />
			</Sequence>
			<Sequence from={a} durationInFrames={C15.S2}>
				<Crater />
			</Sequence>
			<Sequence from={b} durationInFrames={C15.S3}>
				<Cielo />
			</Sequence>
			<Sequence from={c} durationInFrames={C15.REV}>
				<Constelacion dias={dias} fecha={fecha} />
			</Sequence>
			<LightLeak f={f} at={a} dur={16} color={C.cempa} />
			<Dip f={f} at={b} dur={16} />
		</AbsoluteFill>
	);
};
