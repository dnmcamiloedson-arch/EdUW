import React from 'react';
import {AbsoluteFill, Sequence, useCurrentFrame} from 'remotion';
import {C, E, FPS, H, W, clamp, flicker, hash, lerp, ramp, rgba} from '../lib/util';
import {Flame, Light, PaperTexture, useCanvasDraw} from '../components/core';
import {Embers, PETAL_LAYERS, PetalRain} from '../components/Particles';
import {useGlyph} from '../countdown/reveals';
import {Fog, Orb, Ridge, Sky, WaterReflect} from './kit/land';
import {Kinetic, Lockup, NUM_Y, numSize} from './kit/type';
import {Dip, LightLeak} from './kit/transitions';

// Capítulo 4 · "El panteón" — la noche de velación: canoas en el lago, tumbas florecidas
// y, vistas desde el cielo, miles de velas que dibujan el número.
export const C04 = {S1: 120, S2: 108, S3: 72, REV: 132, HIT: 70};
export const C04_LEN = C04.S1 + C04.S2 + C04.S3 + C04.REV;

const HORIZON = 1150;

// ---------- Canoa con red de mariposa y vela ----------
const Canoa: React.FC<{x: number; y: number; s: number; t: number; seed: number; net?: boolean}> = ({x, y, s, t, seed, net = true}) => {
	const bob = Math.sin(t * 1.4 + seed) * 3;
	const tilt = Math.sin(t * 1.1 + seed * 2) * 1.5;
	const fl = flicker(t, 40 + seed);
	const body = (
		<g>
			<path d="M -150 0 C -120 18 120 18 160 -4 L 150 -14 C 90 -6 -100 -6 -160 -12 Z" fill="#0b0607" />
			<path d="M -150 -12 C -100 -6 90 -6 150 -14" stroke={C.flama} strokeWidth={3} opacity={0.85 * fl} fill="none" vectorEffect="non-scaling-stroke" />
			{/* remero */}
			<path d="M -70 -10 L -72 -70 C -74 -88 -56 -92 -54 -74 L -50 -10 Z" fill="#0b0607" />
			<circle cx={-62} cy={-98} r={13} fill="#0b0607" />
			<path d="M -60 -60 L 10 40" stroke="#0b0607" strokeWidth={5} />
			{net ? (
				<g transform={`translate(40 -12) rotate(${-8 + Math.sin(t * 0.9 + seed) * 3})`}>
					<path d="M 0 0 L 0 -150" stroke="#0b0607" strokeWidth={4} />
					{[-1, 1].map((sd) => (
						<g key={sd}>
							<path d={`M 0 -150 C ${sd * 30} -200 ${sd * 140} -190 ${sd * 140} -90 C ${sd * 140} -30 ${sd * 40} -10 0 -10`} fill={rgba('#1a1210', 0.55)} stroke="#0b0607" strokeWidth={3} />
							{Array.from({length: 6}).map((_, i) => (
								<path key={i} d={`M 0 ${-140 + i * 22} Q ${sd * 80} ${-150 + i * 14} ${sd * 136} ${-110 + i * 12}`} stroke={rgba(C.arena, 0.35)} strokeWidth={1} fill="none" vectorEffect="non-scaling-stroke" />
							))}
						</g>
					))}
				</g>
			) : null}
			{/* veladora en la proa */}
			<rect x={100} y={-30} width={18} height={20} rx={2} fill={C.cempa} opacity={0.9} />
		</g>
	);
	return (
		<>
			{/* contraluz: el agua brilla detrás de la canoa */}
			<Light x={x - 10 * s} y={y - 60 * s} r={330 * s} sy={0.55} color={C.arena} o={0.32} />
			<svg width={W} height={H} style={{position: 'absolute', inset: 0, overflow: 'visible'}}>
				{/* reflejo */}
				<g transform={`translate(${x} ${y + 6}) scale(${s} ${-s * 0.8}) rotate(${tilt})`} opacity={0.14} style={{filter: 'blur(4px)'}}>
					{body}
				</g>
				<g transform={`translate(${x} ${y + bob}) scale(${s}) rotate(${tilt})`}>{body}</g>
			</svg>
			<Light x={x + 109 * s} y={y + bob - 34 * s} r={260 * s} color={C.flama} o={0.55 * fl} />
			<Light x={x + 109 * s} y={y + 40 * s} r={150 * s} sy={0.3} color={C.cempa} o={0.5 * fl} />
			<Flame x={x + 109 * s} y={y + bob - 30 * s} size={50 * s} t={t} seed={70 + seed} fl={fl} />
		</>
	);
};

// Isla con su panteón encendido
const Isla: React.FC<{t: number}> = ({t}) => {
	const d = `M 120 ${HORIZON + 4} C 260 ${HORIZON - 60} 360 ${HORIZON - 230} 520 ${HORIZON - 270} C 640 ${HORIZON - 250} 760 ${HORIZON - 120} 960 ${HORIZON + 4} Z`;
	const ref = useCanvasDraw(
		(ctx) => {
			ctx.globalCompositeOperation = 'lighter';
			for (let i = 0; i < 160; i++) {
				const u = hash(i, 1);
				const x = lerp(220, 880, u);
				const top = HORIZON - 260 * Math.sin(Math.PI * clamp((x - 120) / 840)) ** 1.4;
				const y = lerp(top + 20, HORIZON - 6, hash(i, 2) ** 0.7);
				const a = 0.5 + 0.5 * Math.sin(t * (3 + hash(i, 3) * 4) + i);
				const g = ctx.createRadialGradient(x, y, 0, x, y, 9);
				g.addColorStop(0, rgba('#FFE7B0', 0.9 * a));
				g.addColorStop(1, rgba(C.cempa, 0));
				ctx.fillStyle = g;
				ctx.fillRect(x - 9, y - 9, 18, 18);
			}
		},
		[t],
	);
	return (
		<>
			<Light x={540} y={HORIZON - 120} r={520} sy={0.5} color={C.cempa} o={0.45} />
			<svg width={W} height={H} style={{position: 'absolute', inset: 0}}>
				<path d={d} fill="#0a0507" />
				<path d={d} fill="none" stroke={C.flama} strokeWidth={2} opacity={0.35} />
			</svg>
			<canvas ref={ref} width={W} height={H} style={{position: 'absolute', inset: 0}} />
		</>
	);
};

const Lago: React.FC = () => {
	const f = useCurrentFrame();
	const t = f / FPS;
	const above = (
		<>
			<Sky t={t} top="#05030a" mid="#120a16" horizon="#2a1410" hy={HORIZON} stars={160} />
			<Orb x={700} y={640} r={38} color="#F3E3C0" core="#FFFBEF" halo={4} o={0.9} />
			<Ridge seed={41} y={HORIZON} amp={120} color="#120a10" rim={C.arena} rimO={0.15} />
			<Isla t={t} />
		</>
	);
	return (
		<AbsoluteFill>
			{above}
			<WaterReflect y={HORIZON} t={t} o={0.5}>
				{above}
			</WaterReflect>
			<Fog y={HORIZON} h={160} color={C.arena} o={0.12} />
			<Light x={700} y={HORIZON + 380} r={700} sy={0.45} color="#9a8aa8" o={0.22} />
			<svg width={W} height={H} style={{position: 'absolute', inset: 0}}>
				{Array.from({length: 46}).map((_, i) => {
					const y = HORIZON + 8 + i * i * 0.36;
					const w = 20 + i * 4.2 * (0.6 + 0.4 * Math.sin(t * 2.2 + i * 1.7));
					return <rect key={i} x={700 - w / 2 + Math.sin(t * 1.3 + i) * 10} y={y} width={w} height={2 + i * 0.08} rx={2} fill="#FFF3D6" opacity={0.5 - i * 0.008} />;
				})}
			</svg>
			<Canoa x={lerp(1250, 160, t / 9)} y={HORIZON + 70} s={0.42} t={t} seed={1} />
			<Canoa x={lerp(-260, 640, E.out(clamp(t / 4.2)))} y={HORIZON + 250} s={1.0} t={t} seed={2} />
			<Canoa x={lerp(1450, 820, E.out(clamp((t - 0.6) / 3.6)))} y={HORIZON + 560} s={1.5} t={t} seed={3} net={false} />
			<PaperTexture o={0.14} />
			<Kinetic text={'En la isla, esta noche\nnadie duerme.'} f={f} at={14} out={104} y={330} size={50} scrim={0.55} />
		</AbsoluteFill>
	);
};

// ---------- Panteón: tumbas con arcos de cempasúchil ----------
type Tumba = {x: number; y: number; s: number; seed: number};
const TUMBAS: Tumba[] = [
	{x: 230, y: 1080, s: 0.55, seed: 1},
	{x: 560, y: 1060, s: 0.5, seed: 2},
	{x: 880, y: 1090, s: 0.55, seed: 3},
	{x: 110, y: 1330, s: 0.8, seed: 4},
	{x: 760, y: 1320, s: 0.82, seed: 5},
	{x: 420, y: 1620, s: 1.15, seed: 6},
];

const Arco: React.FC<{s: number; seed: number}> = ({s, seed}) => {
	const n = 22;
	return (
		<g>
			{Array.from({length: n}).map((_, i) => {
				const a = Math.PI * (i / (n - 1));
				const x = -Math.cos(a) * 150;
				const y = -60 - Math.sin(a) * 210;
				const r = 15 + 4 * hash(i, seed);
				return (
					<g key={i}>
						<circle cx={x} cy={y} r={r} fill={i % 3 ? C.cempa : C.flama} />
						<circle cx={x} cy={y} r={r * 0.55} fill="#c2481f" opacity={0.6} />
						<circle cx={x - r * 0.3} cy={y - r * 0.3} r={r * 0.3} fill="#FFD9A0" opacity={0.35} />
					</g>
				);
			})}
			{void s}
		</g>
	);
};

const Tumbas: React.FC<{t: number}> = ({t}) => (
	<>
		{TUMBAS.map((tb) => {
			const fl = flicker(t, 90 + tb.seed);
			return (
				<React.Fragment key={tb.seed}>
					<Light x={tb.x} y={tb.y - 40 * tb.s} r={420 * tb.s} color={C.flama} o={0.5 * fl} />
					<svg width={W} height={H} style={{position: 'absolute', inset: 0, overflow: 'visible'}}>
						<g transform={`translate(${tb.x} ${tb.y}) scale(${tb.s})`}>
							{/* lápida */}
							<path d="M -80 0 L -80 -150 C -80 -210 80 -210 80 -150 L 80 0 Z" fill="#2a1d18" stroke="#120a08" strokeWidth={4} />
							<path d="M -80 -150 C -80 -210 80 -210 80 -150" stroke={C.flama} strokeWidth={3} fill="none" opacity={0.35 * fl} />
							<path d="M 0 -170 L 0 -90 M -26 -146 L 26 -146" stroke="#5a4438" strokeWidth={8} strokeLinecap="round" />
							{/* montículo de tierra cubierto de pétalos */}
							<path d="M -170 10 C -150 -30 150 -30 170 10 C 120 40 -120 40 -170 10 Z" fill="#1a0f0a" />
							{Array.from({length: 26}).map((_, i) => (
								<circle key={i} cx={-150 + hash(i, tb.seed) * 300} cy={-10 + hash(i, tb.seed + 9) * 26} r={5} fill={i % 2 ? C.cempa : C.terracota} opacity={0.85} />
							))}
							<Arco s={tb.s} seed={tb.seed} />
							{/* veladoras */}
							{[-120, -60, 60, 120].map((vx, i) => (
								<rect key={i} x={vx - 12} y={-22 + (i % 2) * 12} width={24} height={32} rx={3} fill={i % 2 ? C.cempa : C.terracota} opacity={0.9} />
							))}
						</g>
					</svg>
					{[-120, -60, 60, 120].map((vx, i) => (
						<Flame key={i} x={tb.x + vx * tb.s} y={tb.y + (-22 + (i % 2) * 12) * tb.s} size={34 * tb.s} t={t} seed={tb.seed * 10 + i} fl={fl} wick={tb.s > 0.9} />
					))}
				</React.Fragment>
			);
		})}
	</>
);

// silueta de quien vela, sentada con rebozo
const Veladora: React.FC<{x: number; y: number; s: number; t: number}> = ({x, y, s, t}) => (
	<svg width={W} height={H} style={{position: 'absolute', inset: 0, overflow: 'visible'}}>
		<g transform={`translate(${x} ${y}) scale(${s})`}>
			<path d={`M -70 0 C -80 -90 -60 -170 -10 -200 C -30 -230 -10 -268 18 -262 C 46 -256 50 -220 34 -200 C 80 -170 92 -80 80 0 Z`} fill="#070304" transform={`rotate(${Math.sin(t * 0.8) * 1.2})`} />
			<path d="M -10 -200 C 30 -214 60 -190 76 -140" stroke={C.flama} strokeWidth={2.5} fill="none" opacity={0.5} vectorEffect="non-scaling-stroke" />
		</g>
	</svg>
);

const Panteon: React.FC = () => {
	const f = useCurrentFrame();
	const t = f / FPS + 4;
	const z = ramp(f, [0, C04.S2], [1, 1.1], E.inOut);
	const px = ramp(f, [0, C04.S2], [30, -30], E.inOut);
	return (
		<AbsoluteFill style={{background: 'linear-gradient(180deg, #05030a 0%, #140a10 45%, #1d0e08 60%, #0d0604 100%)'}}>
			<AbsoluteFill style={{transform: `translateX(${px}px) scale(${z})`, transformOrigin: '50% 60%'}}>
				<Sky t={t} top="#05030a" mid="#100812" horizon="#24110c" hy={980} stars={90} />
				<Ridge seed={44} y={990} amp={70} color="#0d0709" />
				<Fog y={1000} h={260} color={C.cempa} o={0.16} />
				<Tumbas t={t} />
				<Veladora x={640} y={1700} s={1.15} t={t} />
				<Embers t={t} n={46} L={0.8} seed={44} src={[100, 1200, 880, 600]} />
			</AbsoluteFill>
			<PetalRain t={t} layer={PETAL_LAYERS[2] ?? PETAL_LAYERS[0]} light={{x: 540, y: 1300, sigma: 700, L: 0.9}} fade={0.7} />
			<PaperTexture o={0.14} />
			<Kinetic text={'Se vela con flores,\ncon luz y con canto.'} f={f} at={10} out={94} y={330} size={50} scrim={0.6} />
		</AbsoluteFill>
	);
};

// ---------- Una vela enciende a otra ----------
const Vela: React.FC<{x: number; y: number; h: number; rot?: number}> = ({x, y, h, rot = 0}) => (
	<svg width={W} height={H} style={{position: 'absolute', inset: 0, overflow: 'visible'}}>
		<defs>
			<linearGradient id="c4cera" x1="0" x2="1">
				<stop offset="0" stopColor="#b9a585" />
				<stop offset="0.35" stopColor={C.marfil} />
				<stop offset="1" stopColor="#8a7258" />
			</linearGradient>
		</defs>
		<g transform={`translate(${x} ${y}) rotate(${rot})`}>
			<rect x={-46} y={-h} width={92} height={h} rx={6} fill="url(#c4cera)" />
			<path d={`M -46 ${-h + 8} C -40 ${-h + 40} -30 ${-h + 60} -34 ${-h + 90} C -28 ${-h + 70} -24 ${-h + 30} -10 ${-h + 6} Z`} fill="#f6efe0" opacity={0.8} />
			<path d={`M 30 ${-h + 4} C 36 ${-h + 30} 44 ${-h + 40} 40 ${-h + 58} C 46 ${-h + 40} 46 ${-h + 20} 46 ${-h + 6} Z`} fill="#f6efe0" opacity={0.6} />
			<ellipse cx={0} cy={-h} rx={46} ry={10} fill="#efe4cc" />
			<path d={`M 0 ${-h} L 2 ${-h - 22}`} stroke="#1a0d05" strokeWidth={4} strokeLinecap="round" />
		</g>
	</svg>
);

const Encender: React.FC = () => {
	const f = useCurrentFrame();
	const t = f / FPS + 8;
	const lean = ramp(f, [4, 30], [0, 1], E.inOut) * (1 - ramp(f, [44, 66], [0, 1], E.inOut));
	const rot = 24 * lean;
	const hA = 760;
	const xA = 330;
	const yA = 1780;
	// punta del pabilo de la vela A (rotada sobre su base)
	const rad = (rot * Math.PI) / 180;
	const tipAx = xA + Math.sin(rad) * (hA + 22);
	const tipAy = yA - Math.cos(rad) * (hA + 22);
	const ign = E.out(clamp((f - 30) / 14));
	const fl = flicker(t, 81);
	return (
		<AbsoluteFill style={{background: 'radial-gradient(ellipse at 50% 55%, #24130a, #060303 70%)'}}>
			{Array.from({length: 18}).map((_, i) => (
				<div key={i} style={{position: 'absolute', left: hash(i, 1) * W - 60, top: 500 + hash(i, 2) * 1100, width: 60 + 90 * hash(i, 3), height: 60 + 90 * hash(i, 3), borderRadius: '50%', background: rgba(i % 3 ? C.flama : C.cempa, 0.12 + 0.12 * hash(i, 4)), filter: 'blur(14px)'}} />
			))}
			<Light x={tipAx} y={tipAy - 30} r={620} color={C.flama} o={0.55 * fl} />
			<Light x={770} y={yA - 640 - 50} r={620 * ign} color={C.flama} o={0.55 * ign * fl} />
			<Vela x={770} y={yA} h={620} />
			<Vela x={xA} y={yA} h={hA} rot={rot} />
			<Flame x={tipAx} y={tipAy + 8} size={130} t={t} seed={81} fl={fl} wick={false} />
			<Flame x={772} y={yA - 620 - 8} size={130} t={t + 0.7} seed={82} grow={ign} fl={fl} wick={false} />
			{f > 28 && f < 50 ? (
				<div style={{position: 'absolute', left: 772 - 90, top: yA - 640 - 140, width: 180, height: 180, borderRadius: '50%', background: `radial-gradient(closest-side, ${rgba('#FFF6DA', 0.9)}, transparent)`, opacity: Math.sin(Math.PI * clamp((f - 28) / 22))}} />
			) : null}
			<PaperTexture o={0.14} />
			<Kinetic text={'Cada luz es un nombre\nque se recuerda.'} f={f} at={34} out={200} y={330} size={50} scrim={0.6} />
		</AbsoluteFill>
	);
};

// ---------- Desde el cielo: las velas del panteón forman el número ----------
const Cielo: React.FC<{dias: number; fecha: string}> = ({dias, fecha}) => {
	const f = useCurrentFrame();
	const t = f / FPS + 12;
	const txt = String(dias);
	const size = numSize(txt);
	const HIT = C04.HIT;
	const g = useGlyph(txt, size, 22, 3);
	const zoom = lerp(3.2, 1, E.inOut(clamp(f / 80)));
	const spin = lerp(14, 0, E.inOut(clamp(f / 80)));
	const ref = useCanvasDraw(
		(ctx) => {
			ctx.save();
			ctx.translate(540, NUM_Y);
			ctx.rotate((spin * Math.PI) / 180);
			ctx.scale(zoom, zoom);
			ctx.translate(-540, -NUM_Y);
			// tierra
			ctx.fillStyle = '#140b07';
			ctx.fillRect(-400, -400, W + 800, H + 800);
			// tumbas vistas desde arriba, en hileras
			for (let r = -2; r < 13; r++) {
				for (let c = -2; c < 9; c++) {
					const k = r * 31 + c;
					const x = c * 150 + (r % 2) * 40 + (hash(k, 1) - 0.5) * 20;
					const y = r * 210 + (hash(k, 2) - 0.5) * 20;
					ctx.save();
					ctx.translate(x + 48, y + 85);
					ctx.rotate((hash(k, 3) - 0.5) * 0.09);
					ctx.translate(-x - 48, -y - 85);
					const tone = Math.floor(hash(k, 4) * 3);
					ctx.fillStyle = ['#2a1e18', '#33251c', '#241a16'][tone];
					ctx.fillRect(x, y, 96, 170);
					ctx.fillStyle = '#3d2f26';
					ctx.fillRect(x + 18, y + 6, 60, 22);
					ctx.fillStyle = '#4a3a2e';
					ctx.fillRect(x + 44, y + 40, 8, 50);
					ctx.fillRect(x + 32, y + 54, 32, 8);
					// marco de cempasúchil
					ctx.fillStyle = rgba(C.cempa, 0.75);
					for (let p = 0; p < 22; p++) {
						const u = p / 22;
						const per = u * 532;
						let px: number;
						let py: number;
						if (per < 96) [px, py] = [x + per, y - 8];
						else if (per < 266) [px, py] = [x + 104, y + per - 96];
						else if (per < 362) [px, py] = [x + 96 - (per - 266), y + 178];
						else [px, py] = [x - 8, y + 170 - (per - 362)];
						ctx.fillStyle = rgba(p % 4 ? C.cempa : C.terracota, 0.8);
						ctx.beginPath();
						ctx.arc(px, py, 5 + 2 * hash(k * 40 + p, 6), 0, Math.PI * 2);
						ctx.fill();
					}
					ctx.restore();
				}
			}
			// pétalos regados en los pasillos
			for (let i = 0; i < 700; i++) {
				ctx.fillStyle = rgba(i % 3 ? C.cempa : C.flama, 0.35 + 0.3 * hash(i, 22));
				ctx.beginPath();
				ctx.ellipse(-300 + hash(i, 20) * (W + 600), -300 + hash(i, 21) * (H + 600), 4, 2.4, hash(i, 23) * 3, 0, Math.PI * 2);
				ctx.fill();
			}
			ctx.globalCompositeOperation = 'lighter';
			const dot = (x: number, y: number, r: number, a: number) => {
				const gr = ctx.createRadialGradient(x, y, 0, x, y, r * 5);
				gr.addColorStop(0, rgba('#FFF6DA', a));
				gr.addColorStop(0.2, rgba(C.flama, a * 0.8));
				gr.addColorStop(1, rgba(C.cempa, 0));
				ctx.fillStyle = gr;
				ctx.fillRect(x - r * 5, y - r * 5, r * 10, r * 10);
			};
			// velas sueltas en todo el panteón (tenues)
			const dim = lerp(0.55, 0.22, clamp((f - 50) / 40));
			for (let i = 0; i < 340; i++) {
				const x = -200 + hash(i, 11) * (W + 400);
				const y = -200 + hash(i, 12) * (H + 400);
				dot(x, y, 3, dim * (0.6 + 0.4 * Math.sin(t * (3 + hash(i, 13) * 3) + i)));
			}
			// las velas del número se encienden en ola, una le pasa la luz a la otra
			if (g) {
				const top = g.pts.reduce((m, p) => (p[1] < m[1] ? p : m), g.pts[0]);
				g.pts.forEach(([gx, gy], i) => {
					const dd = Math.hypot(gx - top[0], gy - top[1]);
					const lit = 18 + dd / 14 + hash(i, 5) * 6;
					const a = E.out(clamp((f - lit) / 8));
					if (a <= 0) return;
					const al = a * (0.85 + 0.15 * Math.sin(t * 5 + i * 1.7));
					dot(540 + gx, NUM_Y + gy, 4.2, al);
				});
			}
			ctx.restore();
		},
		[f, g, zoom, spin],
	);
	const glow = ramp(f, [HIT - 16, HIT + 10], [0, 1], E.inOut);
	return (
		<AbsoluteFill style={{background: '#140b07'}}>
			<canvas ref={ref} width={W} height={H} style={{position: 'absolute', inset: 0}} />
			{/* halo del número */}
			<div style={{position: 'absolute', left: 0, width: W, top: NUM_Y - size / 2, height: size, lineHeight: `${size}px`, textAlign: 'center', fontFamily: 'Rye', fontSize: size, color: C.cempa, filter: 'blur(34px)', opacity: 0.45 * glow, mixBlendMode: 'screen'}}>
				{txt}
			</div>
			{/* bandas oscuras tras los rótulos */}
			<AbsoluteFill style={{opacity: glow, background: 'linear-gradient(180deg, transparent 17%, rgba(6,3,2,0.75) 21%, rgba(6,3,2,0.75) 27%, transparent 31%, transparent 57%, rgba(6,3,2,0.8) 60%, rgba(6,3,2,0.8) 70%, transparent 74%)'}} />
			<Lockup f={f} at={HIT + 2} dias={dias} fecha={fecha} />
			<PaperTexture o={0.12} />
			<AbsoluteFill style={{background: '#000', opacity: ramp(f, [C04.REV - 8, C04.REV - 1], [0, 1], E.inOut)}} />
		</AbsoluteFill>
	);
};

export const Cap04: React.FC<{dias: number; fecha: string}> = ({dias, fecha}) => {
	const f = useCurrentFrame();
	const a = C04.S1;
	const b = a + C04.S2;
	const c = b + C04.S3;
	return (
		<AbsoluteFill style={{background: '#000'}}>
			<Sequence durationInFrames={a}>
				<Lago />
			</Sequence>
			<Sequence from={a} durationInFrames={C04.S2}>
				<Panteon />
			</Sequence>
			<Sequence from={b} durationInFrames={C04.S3}>
				<Encender />
			</Sequence>
			<Sequence from={c} durationInFrames={C04.REV}>
				<Cielo dias={dias} fecha={fecha} />
			</Sequence>
			<Dip f={f} at={a} dur={14} />
			<LightLeak f={f} at={b} dur={16} />
			<Dip f={f} at={c} dur={12} />
		</AbsoluteFill>
	);
};
