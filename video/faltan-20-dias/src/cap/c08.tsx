import React from 'react';
import {AbsoluteFill, Sequence, spring, useCurrentFrame} from 'remotion';
import {C, E, FPS, H, W, clamp, flicker, hash, lerp, mixRGB, ramp, rgba} from '../lib/util';
import {Flame, Light, PaperTexture, useCanvasDraw} from '../components/core';
import {Embers, Smoke} from '../components/Particles';
import {PanDeMuerto} from '../components/Objetos';
import {useGlyph} from '../countdown/reveals';
import {Kinetic, Lockup, NUM_Y, numSize} from './kit/type';
import {Dip, LightLeak} from './kit/transitions';

// Capítulo 8 · "Pan de muerto" — del horno de leña al azúcar que cae como nieve.
export const C08 = {S1: 108, S2: 108, S3: 78, REV: 126, HIT: 70};
export const C08_LEN = C08.S1 + C08.S2 + C08.S3 + C08.REV;

const Horno: React.FC = () => {
	const f = useCurrentFrame();
	const t = f / FPS;
	const fl = flicker(t, 81);
	const peel = E.inOut(clamp((f - 30) / 50));
	return (
		<AbsoluteFill style={{background: '#0a0503'}}>
			<Light x={540} y={1050} r={1200} color={C.cempa} o={0.5 * fl} />
			<svg width={W} height={H} style={{position: 'absolute', inset: 0}}>
				{/* muro de ladrillo */}
				{Array.from({length: 26}).map((_, r) =>
					Array.from({length: 8}).map((_, c) => (
						<rect key={`${r}-${c}`} x={-60 + c * 160 + (r % 2) * 80} y={300 + r * 56} width={150} height={48} rx={4} fill={rgba(mixRGB('#1a0c06', C.terracota, 0.35 + 0.25 * hash(r * 9 + c, 1)))} />
					)),
				)}
				{/* boca del horno */}
				<path d="M 160 1400 L 160 1000 Q 540 640 920 1000 L 920 1400 Z" fill="#100604" />
				<path d="M 160 1400 L 160 1000 Q 540 640 920 1000 L 920 1400" fill="none" stroke="#3a1a0c" strokeWidth={60} />
				<path d="M 230 1400 L 230 1020 Q 540 720 850 1020 L 850 1400 Z" fill={rgba(mixRGB('#3a1206', C.cempa, 0.55 * fl))} />
			</svg>
			{/* fuego dentro */}
			{[300, 420, 540, 660, 780].map((x, i) => (
				<Flame key={i} x={x} y={1390} size={220 + 60 * hash(i, 2)} t={t + i * 0.7} seed={80 + i} fl={fl} wick={false} />
			))}
			<Light x={540} y={1200} r={600} color={C.flama} o={0.55 * fl} />
			<Embers t={t} L={1} n={30} seed={82} src={[260, 1000, 560, 380]} />
			{/* pala con pan que entra */}
			<svg width={W} height={H} style={{position: 'absolute', inset: 0}}>
				<g transform={`translate(${lerp(1300, 560, peel)} ${1390})`}>
					<rect x={60} y={-10} width={700} height={22} rx={10} fill="#2a1408" />
					<ellipse cx={0} cy={0} rx={150} ry={22} fill="#3a1e0c" />
					<path d="M -110 -6 C -110 -90 -50 -128 0 -128 C 50 -128 110 -90 110 -6 Z" fill="#1a0a04" />
				</g>
			</svg>
			<PaperTexture o={0.22} />
			<Kinetic text={'Desde la madrugada,\nel horno ya está despierto.'} f={f} at={10} out={94} y={300} size={48} />
		</AbsoluteFill>
	);
};

const Masa: React.FC = () => {
	const f = useCurrentFrame();
	const t = f / FPS + 4;
	const rise = spring({frame: f - 4, fps: FPS, config: {stiffness: 40, damping: 9}});
	const bone = (k: number) => spring({frame: f - 34 - k * 10, fps: FPS, config: {stiffness: 140, damping: 14}});
	const ball = spring({frame: f - 76, fps: FPS, config: {stiffness: 160, damping: 12}});
	const cx = 540;
	const cy = 1220;
	// huesos que caen sobre la masa y se acomodan sobre el domo (vista lateral)
	const top = cy - 330 * rise;
	const bones = [
		`M ${cx - 16} ${top + 8} C ${cx - 140} ${top + 30} ${cx - 260} ${cy - 140} ${cx - 300} ${cy - 20}`,
		`M ${cx + 16} ${top + 8} C ${cx + 140} ${top + 30} ${cx + 260} ${cy - 140} ${cx + 300} ${cy - 20}`,
		`M ${cx} ${top + 10} C ${cx + 10} ${top + 120} ${cx + 6} ${cy - 120} ${cx - 4} ${cy + 10}`,
		`M ${cx - 20} ${top + 14} C ${cx - 70} ${top + 90} ${cx - 110} ${cy - 120} ${cx - 130} ${cy - 10}`,
	];
	const knobs = [
		[[cx - 130, top + 48], [cx - 230, cy - 120]],
		[[cx + 130, top + 48], [cx + 230, cy - 120]],
		[[cx + 6, top + 140], [cx + 2, cy - 70]],
		[[cx - 80, top + 120], [cx - 118, cy - 60]],
	];
	const strip = (k: number, p: number) => (
		<g key={k} transform={`translate(0 ${(1 - p) * -520})`} opacity={clamp(p * 2)}>
			<path d={bones[k]} stroke="#a8682f" strokeWidth={46} fill="none" strokeLinecap="round" transform="translate(0 6)" opacity={0.5} />
			<path d={bones[k]} stroke="#d89a5c" strokeWidth={40} fill="none" strokeLinecap="round" />
			{knobs[k].map(([x, y], i) => (
				<g key={i}>
					<circle cx={x} cy={y + 5} r={30} fill="#a8682f" opacity={0.5} />
					<circle cx={x} cy={y} r={28} fill="#d89a5c" />
					<circle cx={x - 8} cy={y - 9} r={10} fill="#f2c890" opacity={0.6} />
				</g>
			))}
		</g>
	);
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
					const x = cx + Math.cos(a) * sp * tt * (k % 2 ? 1 : -1) * 2;
					const y = cy - 120 - Math.sin(a) * sp * tt + 80 * tt * tt;
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
			<Light x={300} y={500} r={1300} color={C.flama} o={0.35} />
			{/* mesa enharinada */}
			<div style={{position: 'absolute', left: 0, top: 1240, width: W, height: 700, background: 'linear-gradient(180deg,#5a3a20,#2a1608)'}} />
			<div style={{position: 'absolute', left: 120, top: 1250, width: 840, height: 120, borderRadius: '50%', background: 'radial-gradient(closest-side, rgba(246,238,223,0.35), transparent)'}} />
			<svg width={W} height={H} style={{position: 'absolute', inset: 0, overflow: 'visible'}}>
				<defs>
					<radialGradient id="masa" cx="40%" cy="30%" r="70%">
						<stop offset="0%" stopColor="#F2D2A0" />
						<stop offset="100%" stopColor="#C8925A" />
					</radialGradient>
				</defs>
				<ellipse cx={cx} cy={cy + 20} rx={340} ry={40} fill="#000" opacity={0.35} />
				<path d={`M ${cx - 330} ${cy} C ${cx - 330} ${cy - 260 * rise} ${cx - 160} ${cy - 330 * rise} ${cx} ${cy - 330 * rise} C ${cx + 160} ${cy - 330 * rise} ${cx + 330} ${cy - 260 * rise} ${cx + 330} ${cy} Z`} fill="url(#masa)" />
				{strip(3, bone(3))}
				{strip(0, bone(0))}
				{strip(1, bone(1))}
				{strip(2, bone(2))}
				<circle cx={cx} cy={cy - 330 * rise - 30 + (1 - ball) * -400} r={58} fill="#d89a5c" opacity={clamp(ball * 2)} />
			</svg>
			<canvas ref={ref} width={W} height={H} style={{position: 'absolute', inset: 0}} />
			<PaperTexture o={0.22} />
			<Kinetic text={'Los huesos se ponen en cruz,\ncomo los cuatro rumbos.'} f={f} at={30} out={98} y={330} size={48} />
			{void t}
		</AbsoluteFill>
	);
};

const Azucar: React.FC = () => {
	const f = useCurrentFrame();
	const t = f / FPS + 7;
	const sheen = ramp(f, [4, 40], [-0.3, 1.3], E.inOut);
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
			<svg width={W} height={H} style={{position: 'absolute', inset: 0, overflow: 'visible'}}>
				<defs>
					<linearGradient id="sheen8" x1="0" y1="0" x2="1" y2="0">
						<stop offset={Math.max(0, sheen - 0.15)} stopColor="#fff" stopOpacity={0} />
						<stop offset={clamp(sheen)} stopColor="#FFF6DA" stopOpacity={0.45} />
						<stop offset={Math.min(1, sheen + 0.15)} stopColor="#fff" stopOpacity={0} />
					</linearGradient>
				</defs>
				<g transform="translate(540 1330) scale(1.55)">
					<PanDeMuerto lit={1} rim={0.6} id="c8pan" />
					<path d="M -290 10 C -290 -150 -160 -250 0 -250 C 160 -250 290 -150 290 10 C 200 52 -200 52 -290 10 Z" fill="url(#sheen8)" />
				</g>
			</svg>
			<canvas ref={ref} width={W} height={H} style={{position: 'absolute', inset: 0}} />
			<PaperTexture o={0.2} />
			<Kinetic text={'El aroma también\nlos guía de regreso.'} f={f} at={8} out={70} y={330} size={50} />
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
