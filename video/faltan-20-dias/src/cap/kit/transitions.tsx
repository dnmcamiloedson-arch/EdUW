import React from 'react';
import {AbsoluteFill} from 'remotion';
import {C, E, H, W, clamp, hash, ramp, rgba} from '../../lib/util';
import {useCanvasDraw} from '../../components/core';
import {drawPetal} from '../../components/Particles';

// Todas las transiciones se centran en el corte `at`: cubren la imagen justo en ese frame.

// Destello cálido de luz (fuga de luz de película)
export const LightLeak: React.FC<{f: number; at: number; dur?: number; color?: string}> = ({f, at, dur = 16, color = C.flama}) => {
	const u = (f - (at - dur / 2)) / dur;
	if (u < 0 || u > 1) return null;
	const k = Math.sin(Math.PI * u);
	const x = -300 + u * (W + 600);
	return (
		<AbsoluteFill style={{pointerEvents: 'none'}}>
			<div style={{position: 'absolute', left: x - 700, top: 200, width: 1400, height: 1500, borderRadius: '50%', mixBlendMode: 'screen', opacity: k, background: `radial-gradient(closest-side, ${rgba('#FFF2D0', 0.95)}, ${rgba(color, 0.7)} 40%, ${rgba(C.cempa, 0.25)} 70%, transparent)`}} />
			<AbsoluteFill style={{background: rgba('#FFE8C0', 0.55 * k ** 3), mixBlendMode: 'screen'}} />
		</AbsoluteFill>
	);
};

// Fundido a negro y de regreso
export const Dip: React.FC<{f: number; at: number; dur?: number}> = ({f, at, dur = 14}) => {
	const o = f < at ? ramp(f, [at - dur / 2, at], [0, 1], E.in) : ramp(f, [at, at + dur / 2], [1, 0], E.out);
	return o > 0 ? <AbsoluteFill style={{background: '#000', opacity: o}} /> : null;
};

// Cortina de pétalos que barre el cuadro en diagonal
export const PetalWipe: React.FC<{f: number; at: number; dur?: number; seed?: number}> = ({f, at, dur = 26, seed = 3}) => {
	const u = (f - (at - dur / 2)) / dur;
	const ref = useCanvasDraw(
		(ctx) => {
			if (u < 0 || u > 1) return;
			for (let i = 0; i < 520; i++) {
				const r = (q: number) => hash(i * 5 + q, 700 + seed);
				const lane = r(1);
				const speed = 0.8 + 0.5 * r(2);
				const p = u * speed * 1.9 - lane * 0.55 - 0.25;
				if (p < -0.2 || p > 1.3) continue;
				const x = -300 + p * (W + 600) + (r(3) - 0.5) * 300;
				const y = H * r(4) - p * 500 + 250;
				drawPetal(ctx, x, y, 34 + 40 * r(5), r(6) * 6.28 + u * 8 * (r(7) - 0.5), Math.cos(u * 9 + i), 0.85, 0.75 + 0.35 * r(8), r(9));
			}
		},
		[u],
	);
	if (u < 0 || u > 1) return null;
	return <canvas ref={ref} width={W} height={H} style={{position: 'absolute', inset: 0}} />;
};

// Iris: círculo de luz que se cierra / abre sobre un punto
export const Iris: React.FC<{f: number; at: number; x?: number; y?: number; dur?: number}> = ({f, at, x = W / 2, y = H / 2, dur = 16}) => {
	const closing = f < at;
	const u = closing ? clamp((f - (at - dur / 2)) / (dur / 2)) : clamp((f - at) / (dur / 2));
	if (f < at - dur / 2 || f > at + dur / 2) return null;
	const r = closing ? (1 - E.in(u)) * 1400 : E.out(u) * 1400;
	return <AbsoluteFill style={{background: `radial-gradient(circle at ${x}px ${y}px, transparent ${r}px, ${rgba(C.flama, 0.9)} ${r + 4}px, #000 ${r + 24}px)`}} />;
};
