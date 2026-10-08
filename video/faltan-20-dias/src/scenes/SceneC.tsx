import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {C, E, FPS, W, clamp, flicker, hash, mixRGB, ramp, rgba} from '../lib/util';
import {Light, useCanvasDraw} from '../components/core';
import {Smoke, drawPetal} from '../components/Particles';

// 10–12.5 s: plano cenital que desciende a un camino de pétalos; el humo de copal sube
// y los pétalos se alinean, en ola, hacia la luz del fondo.
const PW = 1400;
const PH = 3000;
const pathX = (y: number) => PW / 2 + 150 * Math.sin(y / 520 + 0.6) + 60 * Math.sin(y / 230);
const pathAngle = (y: number) => {
	const dx = pathX(y - 4) - pathX(y + 4);
	return Math.atan2(dx, -8); // hacia el fondo (y decreciente)
};

const N = 950;

const Ground: React.FC<{t: number; fl: number}> = ({t, fl}) => {
	const ref = useCanvasDraw(
		(ctx) => {
			// petate (tejido de palma) muy oscuro
			ctx.fillStyle = '#0d0603';
			ctx.fillRect(0, 0, PW, PH);
			const cell = 46;
			for (let y = 0; y < PH; y += cell) {
				for (let x = 0; x < PW; x += cell) {
					const k = ((x / cell + y / cell) | 0) % 2;
					ctx.fillStyle = k ? '#1a0d05' : '#140a04';
					ctx.save();
					ctx.translate(x + cell / 2, y + cell / 2);
					ctx.fillRect(-cell / 2 + 2, -cell / 2 + (k ? 6 : 2), cell - 4, cell - (k ? 12 : 4));
					ctx.restore();
				}
			}
			// luz del fondo sobre el piso
			const fx = pathX(120);
			const g = ctx.createRadialGradient(fx, 80, 0, fx, 80, 1500);
			g.addColorStop(0, rgba(C.flama, 0.55 * fl));
			g.addColorStop(0.25, rgba(C.cempa, 0.28 * fl));
			g.addColorStop(1, rgba(C.cempa, 0));
			ctx.globalCompositeOperation = 'screen';
			ctx.fillStyle = g;
			ctx.fillRect(0, 0, PW, PH);
			ctx.globalCompositeOperation = 'source-over';
			// pétalos
			for (let i = 0; i < N; i++) {
				const r = (q: number) => hash(i * 11 + q, 77);
				const u = r(1); // 0 = cerca, 1 = fondo
				const y = PH - 120 - u * (PH - 260);
				const off = (r(2) - 0.5) * 2 * (90 + 40 * r(9)) * (1 - 0.25 * u);
				const ang = pathAngle(y);
				const ax = pathX(y) + Math.cos(ang) * off;
				const ay = y + Math.sin(ang) * off * 0.2;
				const sx = ax + (r(3) - 0.5) * 520;
				const sy = ay + (r(4) - 0.5) * 300;
				// ola de alineación: viaja de cerca hacia el fondo
				const t0 = 0.15 + u * 1.25 + r(5) * 0.25;
				const p = E.out(clamp((t - t0) / 0.9));
				const x = sx + (ax - sx) * p;
				const yy = sy + (ay - sy) * p;
				const scatterRot = r(6) * 6.283;
				let d = ang - scatterRot;
				d = Math.atan2(Math.sin(d), Math.cos(d));
				const rot = scatterRot + d * p + (r(7) - 0.5) * 0.35;
				const lit = (0.42 + 0.7 * u ** 1.4) * fl * (0.85 + 0.3 * p);
				drawPetal(ctx, x, yy, 30 + 16 * r(8), rot, r(10) > 0.2 ? 1 : -1, 0.85, lit, r(11));
			}
		},
		[t, fl],
	);
	return <canvas ref={ref} width={PW} height={PH} style={{position: 'absolute', left: 0, top: 0}} />;
};

export const SceneC: React.FC = () => {
	const f = useCurrentFrame();
	const t = f / FPS;
	const T = t + 10;
	const fl = flicker(T, 2);
	const L = ramp(f, [0, 12], [0.25, 1], E.out);
	const ax = ramp(f, [0, 75], [0, 62], E.inOut);
	const rz = ramp(f, [0, 75], [-9, 3], E.inOut);
	const s = ramp(f, [0, 75], [1.18, 1.0], E.inOut);
	const glowY = ramp(f, [0, 75], [-40, 560], E.inOut);
	return (
		<AbsoluteFill style={{background: '#050201', overflow: 'hidden', perspective: '1150px', perspectiveOrigin: '540px 520px'}}>
			<div
				style={{
					position: 'absolute',
					left: W / 2 - PW / 2,
					top: 1400 - 2200,
					width: PW,
					height: PH,
					transformOrigin: `${PW / 2}px 2200px`,
					transform: `rotateX(${ax}deg) rotateZ(${rz}deg) scale(${s})`,
					opacity: L,
					WebkitMaskImage: 'radial-gradient(ellipse 46% 52% at 50% 60%, black 55%, transparent 100%)',
					maskImage: 'radial-gradient(ellipse 46% 52% at 50% 60%, black 55%, transparent 100%)',
				}}
			>
				<Ground t={t} fl={fl} />
			</div>
			{/* profundidad de campo: primer plano y fondo suaves */}
			<AbsoluteFill
				style={{
					backdropFilter: `blur(${ramp(f, [0, 75], [1, 7], E.inOut)}px)`,
					WebkitMaskImage: 'linear-gradient(180deg, transparent 0%, transparent 62%, black 92%)',
					maskImage: 'linear-gradient(180deg, transparent 0%, transparent 62%, black 92%)',
				}}
			/>
			<Light x={540 + rz * 6} y={glowY} r={760} color={C.cempa} o={0.5 * fl * L} />
			<Light x={540 + rz * 6} y={glowY} r={260} color={C.flama} o={0.55 * fl * L} />
			<Smoke t={T + 4} x={190} y={1960} L={L * 1.3} wind={55} rise={150} lightX={540} lightY={glowY} tint={C.marfil} />
			<Smoke t={T + 5} x={950} y={1990} L={L * 0.9} wind={-35} rise={130} seed={9} n={110} lightX={540} lightY={glowY} tint={C.arena} />
		</AbsoluteFill>
	);
};
