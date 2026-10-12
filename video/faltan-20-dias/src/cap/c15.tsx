import React from 'react';
import {AbsoluteFill, Sequence, useCurrentFrame} from 'remotion';
import {C, E, FPS, H, W, clamp, flicker, hash, lerp, mixRGB, ramp, rgba} from '../lib/util';
import {Light, PaperTexture, useCanvasDraw} from '../components/core';
import {Embers, Smoke} from '../components/Particles';
import {useGlyph} from '../countdown/reveals';
import {Fog, Orb, Ridge, Sky, WaterReflect} from './kit/land';
import {GoldNumber, Kinetic, Lockup, NUM_Y, numSize} from './kit/type';
import {Dip, LightLeak} from './kit/transitions';

// Capítulo 15 · "Los volcanes" — Popocatépetl vela el sueño de Iztaccíhuatl.
export const C15 = {S1: 126, S2: 96, S3: 84, REV: 126, HIT: 62};
export const C15_LEN = C15.S1 + C15.S2 + C15.S3 + C15.REV;

const IZTA =
	'M -120 1300 L -120 1150 C -60 1118 -10 1062 36 1044 C 70 1026 108 1028 130 1052 C 160 1082 200 1092 244 1082 ' +
	'C 300 1022 360 990 424 1000 C 474 1010 502 1050 532 1062 C 570 1042 602 1036 624 1052 C 654 1080 694 1112 724 1152 L 780 1300 Z';
const IZTA_SNOW = 'M 36 1044 C 70 1026 108 1028 130 1052 M 300 1022 C 360 990 424 1000 474 1010 M 570 1042 C 602 1036 624 1052 640 1066';
const POPO = 'M 540 1320 C 640 1220 730 1010 788 924 L 806 930 L 830 922 L 852 928 C 908 1012 1010 1220 1180 1320 Z';
const POPO_SNOW = 'M 742 990 C 760 960 776 938 788 924 L 806 930 L 830 922 L 852 928 C 864 944 878 966 896 996 C 870 980 850 990 830 974 C 806 992 782 978 742 990 Z';

const Volcanes: React.FC<{t: number; lit: number}> = ({t, lit}) => (
	<svg width={W} height={H} style={{position: 'absolute', inset: 0, overflow: 'visible'}}>
		<defs>
			<linearGradient id="v15" x1="0" y1="0" x2="0" y2="1">
				<stop offset="0%" stopColor="#5a3a40" />
				<stop offset="45%" stopColor="#2c1a22" />
				<stop offset="100%" stopColor="#120a10" />
			</linearGradient>
		</defs>
		<path d={IZTA} fill="url(#v15)" />
		<path d={IZTA} fill="none" stroke={rgba(C.marfil, 0.25)} strokeWidth={2} />
		<path d={IZTA_SNOW} fill="none" stroke={rgba(C.marfil, 0.8)} strokeWidth={11} strokeLinecap="round" />
		<path d={POPO} fill="url(#v15)" />
		<path d={POPO} fill="none" stroke={rgba(C.cempa, 0.3)} strokeWidth={2} />
		<path d={POPO_SNOW} fill={rgba(C.marfil, 0.72)} />
		<ellipse cx={820} cy={926} rx={34} ry={8} fill={C.cempa} opacity={0.5 + 0.4 * lit * (0.8 + 0.2 * Math.sin(t * 5))} style={{filter: 'blur(3px)'}} />
	</svg>
);

const Valle: React.FC = () => {
	const f = useCurrentFrame();
	const t = f / FPS;
	const pan = ramp(f, [0, C15.S1], [0, -110], E.inOut);
	const fl = flicker(t, 15);
	const world = (
		<>
			<Volcanes t={t} lit={fl} />
			<Light x={820} y={920} r={260} color={C.cempa} o={0.4 * fl} />
		</>
	);
	return (
		<AbsoluteFill>
			<Sky t={t} top="#05030c" mid="#170c18" horizon="#4a1e16" hy={1250} stars={240} />
			<Orb x={230} y={360} r={46} color={C.marfil} core="#FFFBF0" halo={4} o={0.85} />
			<AbsoluteFill style={{transform: `translateX(${pan}px) scale(1.38)`, transformOrigin: '520px 1180px'}}>
				{world}
				<Smoke t={t + 4} x={820} y={920} L={0.9} n={130} rate={20} rise={70} wind={28} seed={151} lightX={820} lightY={930} tint={C.arena} />
				<Fog y={1280} color={C.terracota} o={0.22} />
				<WaterReflect y={1320} t={t} o={0.45}>
					<Sky t={t} top="#03020a" mid="#0d0814" horizon="#2a1414" hy={1250} stars={0} />
					{world}
				</WaterReflect>
				<Ridge seed={151} y={1700} amp={60} color="#050304" rim={C.cempa} rimO={0.15} />
			</AbsoluteFill>
			<PaperTexture o={0.18} />
			<Kinetic text={'Él prometió\ncuidar su sueño…'} f={f} at={14} out={110} y={1430} size={52} />
		</AbsoluteFill>
	);
};

const Crater: React.FC = () => {
	const f = useCurrentFrame();
	const t = f / FPS + 6;
	const fl = flicker(t, 151);
	const tilt = ramp(f, [0, C15.S2], [0, 360], E.inOut);
	return (
		<AbsoluteFill style={{background: '#030208'}}>
			<Sky t={t} top="#03020a" mid="#0a0612" horizon="#1d0e10" hy={1500} stars={160} />
			<AbsoluteFill style={{transform: `translateY(${tilt}px)`}}>
				<svg width={W} height={H} style={{position: 'absolute', inset: 0, overflow: 'visible'}}>
					<defs>
						<radialGradient id="v15c" cx="540" cy="1480" r="900" gradientUnits="userSpaceOnUse">
							<stop offset="0%" stopColor="#6a2a1a" />
							<stop offset="30%" stopColor="#2a1418" />
							<stop offset="100%" stopColor="#0c070c" />
						</radialGradient>
					</defs>
					<g transform="translate(540 1500) scale(3.4) translate(-820 -924)">
						<path d={POPO} fill="url(#v15c)" />
						<path d={POPO_SNOW} fill={rgba(C.marfil, 0.35)} />
						<path d={POPO} fill="none" stroke={rgba(C.cempa, 0.4)} strokeWidth={0.8} />
					</g>
				</svg>
				<Light x={548} y={1478} r={520} color={C.cempa} o={0.55 * fl} />
				<Light x={548} y={1478} r={180} color={C.flama} o={0.6 * fl} />
				<Embers t={t} L={1} n={40} seed={152} src={[420, 1380, 260, 140]} />
			</AbsoluteFill>
			<Smoke t={t + 2} x={540} y={1470 + tilt} L={1.1} n={170} rate={26} rise={150} wind={20} seed={153} lightX={540} lightY={1500 + tilt} tint={C.arena} />
			<PaperTexture o={0.18} />
			<Kinetic text={'…y su fuego\nsigue despierto.'} f={f} at={8} out={84} y={330} size={52} />
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
			<svg width={W} height={H} style={{position: 'absolute', inset: 0, opacity: 0.5}}>
				<g transform="translate(-60 900)">
					<path d={IZTA} fill="#0a060c" transform="translate(0 260) scale(1 0.7)" />
					<path d={POPO} fill="#0c070d" transform="translate(0 260) scale(1 0.7)" />
				</g>
			</svg>
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
