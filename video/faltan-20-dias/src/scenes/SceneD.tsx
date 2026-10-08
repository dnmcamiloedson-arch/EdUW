import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {CameraMotionBlur} from '@remotion/motion-blur';
import {noise2D} from '@remotion/noise';
import {C, E, FPS, H, W, clamp, flicker, hash, mixRGB, rgba} from '../lib/util';
import {Flame, Light, PaperTexture, useCanvasDraw} from '../components/core';
import {Cirio, MarcoFoto, PanDeMuerto, VasoAgua} from '../components/Objetos';
import {drawPetal} from '../components/Particles';

// 12.5–15 s: mini-montaje al beat. La llama siempre cae en el mismo punto (match-cut de luz).
export const MP = {x: 540, y: 880};
export const BEATS = [0, 18, 36, 54];

const Wall: React.FC<{fl: number; k?: number}> = ({fl, k = 1}) => (
	<>
		<AbsoluteFill style={{background: 'linear-gradient(180deg,#080402,#120803 55%,#060201)'}} />
		<Light x={MP.x} y={MP.y} r={1150} color={C.cempa} o={0.42 * fl * k} />
		<Light x={MP.x} y={MP.y - 20} r={420} color={C.flama} o={0.3 * fl * k} />
	</>
);

const Table: React.FC<{y: number; fl: number}> = ({y, fl}) => (
	<>
		<div style={{position: 'absolute', left: 0, top: y, width: W, height: H - y, background: 'linear-gradient(180deg,#24120a,#0a0402 75%)'}} />
		{/* bordado del mantel */}
		<div style={{position: 'absolute', left: 0, top: y + 70, width: W, height: 16, background: rgba(mixRGB(C.ink, C.terracota, 0.75 * fl))}} />
		<div
			style={{
				position: 'absolute',
				left: 0,
				top: y + 92,
				width: W,
				height: 10,
				backgroundImage: `repeating-linear-gradient(90deg, ${rgba(mixRGB(C.ink, C.verde, fl))} 0 18px, transparent 18px 30px)`,
			}}
		/>
		<Light x={MP.x} y={y + 20} r={620} sy={0.2} color={C.flama} o={0.5 * fl} />
	</>
);

const ShotPan: React.FC<{t: number; fl: number}> = ({t, fl}) => (
	<AbsoluteFill>
		<Wall fl={fl} />
		<svg width={W} height={H} style={{position: 'absolute', inset: 0}}>
			<g transform={`translate(${MP.x} ${MP.y + 250})`}>
				<Cirio lit={fl} h={246} w={54} />
			</g>
		</svg>
		<Table y={1340} fl={fl} />
		<Flame x={MP.x} y={MP.y} size={96} t={t} seed={3} fl={fl} />
		<Light x={MP.x} y={MP.y - 50} r={160} color={C.flama} o={0.5 * fl} />
		<svg width={W} height={H} style={{position: 'absolute', inset: 0, overflow: 'visible'}}>
			<g transform="translate(436 1366) scale(1.42)">
				<PanDeMuerto lit={0.9 * fl} rim={fl} id="pd" />
			</g>
		</svg>
	</AbsoluteFill>
);

const ShotVaso: React.FC<{t: number; fl: number}> = ({t, fl}) => (
	<AbsoluteFill>
		<Wall fl={fl} />
		<Table y={1400} fl={fl} />
		{/* cirio sobre la mesa: la mecha queda centrada justo bajo la llama */}
		<svg width={W} height={H} style={{position: 'absolute', inset: 0}}>
			<g transform={`translate(${MP.x} 1402)`}>
				<Cirio lit={fl} h={1402 - MP.y - 4} w={58} />
			</g>
		</svg>
		<Flame x={MP.x} y={MP.y} size={96} t={t} seed={5} fl={fl} />
		<Light x={MP.x} y={MP.y - 50} r={160} color={C.flama} o={0.5 * fl} />
		<svg width={W} height={H} style={{position: 'absolute', inset: 0, overflow: 'visible'}}>
			<g transform="translate(330 1440) scale(1.15)">
				<VasoAgua lit={0.95 * fl} id="va2" flameX={-150} />
			</g>
		</svg>
	</AbsoluteFill>
);

const ShotMarco: React.FC<{t: number; fl: number}> = ({t, fl}) => (
	<AbsoluteFill>
		<Wall fl={fl} k={0.75} />
		<svg width={W} height={H} style={{position: 'absolute', inset: 0, overflow: 'visible'}}>
			<g transform="translate(540 1090)">
				<MarcoFoto lit={0.85 * fl} w={560} h={720} id="mf" />
			</g>
		</svg>
		{/* lo único dentro del marco: el reflejo de la llama */}
		<div style={{position: 'absolute', inset: 0, opacity: 0.75, filter: 'blur(1.4px)'}}>
			<Flame x={MP.x} y={MP.y} size={96} t={t} seed={6} fl={fl} />
		</div>
		<Light x={MP.x} y={MP.y - 50} r={190} color={C.flama} o={0.38 * fl} />
		{[
			[420, 1180, 26],
			[660, 1230, 18],
			[600, 1000, 12],
		].map(([x, y, r], i) => (
			<Light key={i} x={x} y={y} r={r} color={C.cempa} o={0.35 * fl} />
		))}
	</AbsoluteFill>
);

const CruzCanvas: React.FC<{fl: number}> = ({fl}) => {
	const ref = useCanvasDraw(
		(ctx) => {
			ctx.fillStyle = '#0c0603';
			ctx.fillRect(0, 0, W, H);
			// petate
			const cell = 54;
			for (let y = 0; y < H; y += cell)
				for (let x = 0; x < W; x += cell) {
					const k = ((x / cell + y / cell) | 0) % 2;
					ctx.fillStyle = k ? '#1c0f06' : '#150a04';
					ctx.fillRect(x + 2, y + (k ? 8 : 2), cell - 4, cell - (k ? 16 : 4));
				}
			const lightAt = (x: number, y: number) => fl * (0.25 + 1.0 * Math.exp(-((x - MP.x) ** 2 + (y - MP.y) ** 2) / (2 * 560 * 560)));
			const g = ctx.createRadialGradient(MP.x, MP.y, 0, MP.x, MP.y, 900);
			g.addColorStop(0, rgba(C.flama, 0.45 * fl));
			g.addColorStop(0.3, rgba(C.cempa, 0.2 * fl));
			g.addColorStop(1, rgba(C.cempa, 0));
			ctx.globalCompositeOperation = 'screen';
			ctx.fillStyle = g;
			ctx.fillRect(0, 0, W, H);
			ctx.globalCompositeOperation = 'source-over';
			for (let i = 0; i < 620; i++) {
				const r = (q: number) => hash(i * 7 + q, 404);
				let x: number;
				let y: number;
				if (r(1) < 0.58) {
					x = 470 + r(2) * 140;
					y = 990 + r(3) * 760;
				} else {
					x = 250 + r(2) * 580;
					y = 1140 + r(3) * 140;
				}
				x += (r(4) - 0.5) * 22;
				y += (r(5) - 0.5) * 22;
				drawPetal(ctx, x, y, 30 + 14 * r(6), r(7) * 6.28, r(8) > 0.25 ? 1 : -1, 0.9, lightAt(x, y), r(9));
			}
			// pétalos sueltos
			for (let i = 0; i < 40; i++) {
				const r = (q: number) => hash(i * 5 + q, 405);
				const x = r(1) * W;
				const y = 700 + r(2) * 1200;
				drawPetal(ctx, x, y, 28, r(3) * 6.28, 1, 0.9, lightAt(x, y) * 0.8, r(4));
			}
			// veladora vista desde arriba en la cabecera de la cruz
			ctx.save();
			ctx.translate(MP.x, MP.y);
			ctx.fillStyle = 'rgba(0,0,0,0.55)';
			ctx.beginPath();
			ctx.arc(10, 14, 76, 0, Math.PI * 2);
			ctx.fill();
			ctx.fillStyle = rgba(mixRGB(C.ink, C.cempa, 0.85 * fl));
			ctx.beginPath();
			ctx.arc(0, 0, 70, 0, Math.PI * 2);
			ctx.fill();
			const wg = ctx.createRadialGradient(0, 0, 0, 0, 0, 58);
			wg.addColorStop(0, '#FFF2C8');
			wg.addColorStop(0.5, rgba(mixRGB(C.ink, C.marfil, fl)));
			wg.addColorStop(1, rgba(mixRGB(C.ink, C.arena, 0.8 * fl)));
			ctx.fillStyle = wg;
			ctx.beginPath();
			ctx.arc(0, 0, 58, 0, Math.PI * 2);
			ctx.fill();
			ctx.strokeStyle = rgba('#FFF2C8', 0.7);
			ctx.lineWidth = 3;
			ctx.beginPath();
			ctx.arc(0, 0, 70, -2.5, -0.9);
			ctx.stroke();
			ctx.restore();
		},
		[fl],
	);
	return <canvas ref={ref} width={W} height={H} style={{position: 'absolute', inset: 0}} />;
};

const ShotCruz: React.FC<{fl: number}> = ({fl}) => (
	<AbsoluteFill>
		<CruzCanvas fl={fl} />
		<Light x={MP.x} y={MP.y} r={130} color={C.flama} o={0.9 * fl} />
		<Light x={MP.x} y={MP.y} r={34} color="#FFFBEA" o={0.95} />
		<Light x={MP.x} y={MP.y} r={420} color={C.cempa} o={0.35 * fl} />
	</AbsoluteFill>
);

const Montage: React.FC = () => {
	const f = useCurrentFrame();
	const i = f >= BEATS[3] ? 3 : f >= BEATS[2] ? 2 : f >= BEATS[1] ? 1 : 0;
	const lf = f - BEATS[i];
	const t = f / FPS + 12.5;
	const fl = flicker(t, 3 + i);
	// micro-zoom: entra 5 % cerrado en el beat y se asienta; sacudida amortiguada
	const settle = 1 - E.out(clamp(lf / 14));
	const s = 1 + 0.05 * settle + 0.012 * (lf / 18);
	const A = 11 * Math.exp(-lf / 3.2);
	const sx = A * noise2D('shx', i * 3.1, lf * 0.85);
	const sy = A * noise2D('shy', i * 3.1, lf * 0.85);
	const sr = 0.4 * Math.exp(-lf / 3.2) * noise2D('shr', i, lf);
	return (
		<AbsoluteFill
			style={{
				transformOrigin: `${MP.x}px ${MP.y}px`,
				transform: `translate(${sx}px, ${sy}px) rotate(${sr}deg) scale(${s})`,
			}}
		>
			{i === 0 ? <ShotPan t={t} fl={fl} /> : i === 1 ? <ShotVaso t={t} fl={fl} /> : i === 2 ? <ShotMarco t={t} fl={fl} /> : <ShotCruz fl={fl} />}
			<PaperTexture o={0.28} />
		</AbsoluteFill>
	);
};

export const SceneD: React.FC = () => {
	const f = useCurrentFrame();
	const i = f >= BEATS[3] ? 3 : f >= BEATS[2] ? 2 : f >= BEATS[1] ? 1 : 0;
	const lf = f - BEATS[i];
	const flash = Math.exp(-lf / 2.4);
	return (
		<AbsoluteFill style={{background: '#050201', overflow: 'hidden'}}>
			{/* motion blur solo durante la sacudida del beat; después la imagen está casi quieta */}
			{lf < 10 ? (
				<CameraMotionBlur samples={5} shutterAngle={200}>
					<Montage />
				</CameraMotionBlur>
			) : (
				<Montage />
			)}
			{/* destello en el corte: la luz "empuja" el corte */}
			<Light x={MP.x} y={MP.y} r={1000} color="#FFD58A" o={0.42 * flash} />
		</AbsoluteFill>
	);
};
