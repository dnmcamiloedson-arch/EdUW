import React, {useLayoutEffect, useRef} from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {C, H, W, fbm, mulberry32, rgba} from '../lib/util';
import {noise2D} from '@remotion/noise';
import {paperUrl} from '../lib/paperUrl';

// ---------- Canvas determinista ----------
export const useCanvasDraw = (draw: (ctx: CanvasRenderingContext2D, w: number, h: number) => void, deps: unknown[]) => {
	const ref = useRef<HTMLCanvasElement>(null);
	useLayoutEffect(() => {
		const c = ref.current;
		if (!c) return;
		const ctx = c.getContext('2d')!;
		ctx.setTransform(1, 0, 0, 1, 0, 0);
		ctx.globalCompositeOperation = 'source-over';
		ctx.globalAlpha = 1;
		ctx.clearRect(0, 0, c.width, c.height);
		draw(ctx, c.width, c.height);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, deps);
	return ref;
};

// Desenfoque de movimiento por acumulación de sub-frames (promedio premultiplicado).
const scratch: Record<string, HTMLCanvasElement> = {};
export const accumulate = (
	ctx: CanvasRenderingContext2D,
	samples: number,
	shutter: number, // fracción de frame (0.5 = 180°)
	drawAt: (c: CanvasRenderingContext2D, dt: number) => void,
) => {
	const {width, height} = ctx.canvas;
	const key = `${width}x${height}`;
	const tmp = (scratch[key] ??= Object.assign(document.createElement('canvas'), {width, height}));
	const t = tmp.getContext('2d')!;
	ctx.globalCompositeOperation = 'lighter';
	for (let i = 0; i < samples; i++) {
		t.setTransform(1, 0, 0, 1, 0, 0);
		t.globalCompositeOperation = 'source-over';
		t.globalAlpha = 1;
		t.clearRect(0, 0, width, height);
		drawAt(t, -shutter * (i / Math.max(1, samples - 1)));
		ctx.globalAlpha = 1 / samples;
		ctx.drawImage(tmp, 0, 0);
	}
	ctx.globalAlpha = 1;
	ctx.globalCompositeOperation = 'source-over';
};

// ---------- Luz ----------
// Caída suave (aprox. inverso-cuadrática con cola), mezcla aditiva.
export const Light: React.FC<{
	x: number;
	y: number;
	r: number;
	color?: string;
	o?: number;
	sy?: number;
	blend?: React.CSSProperties['mixBlendMode'];
	z?: number;
}> = ({x, y, r, color = C.cempa, o = 1, sy = 1, blend = 'screen', z}) => (
	<div
		style={{
			position: 'absolute',
			left: x - r,
			top: y - r,
			width: r * 2,
			height: r * 2,
			borderRadius: '50%',
			transform: `scaleY(${sy})`,
			opacity: Math.max(0, o),
			mixBlendMode: blend,
			zIndex: z,
			background: `radial-gradient(circle closest-side, ${rgba(color, 1)} 0%, ${rgba(color, 0.62)} 12%, ${rgba(
				color,
				0.3,
			)} 30%, ${rgba(color, 0.12)} 52%, ${rgba(color, 0.04)} 75%, ${rgba(color, 0)} 100%)`,
			pointerEvents: 'none',
		}}
	/>
);

// ---------- Llama ----------
const flamePath = (w: number, h: number, tx: number) =>
	`M 0 10 C ${-w * 1.2} 10 ${-w * 1.05} ${-h * 0.3} ${-w * 0.55 + tx * 0.45} ${-h * 0.62} ` +
	`C ${-w * 0.2 + tx * 0.75} ${-h * 0.85} ${tx * 0.95} ${-h * 0.95} ${tx} ${-h} ` +
	`C ${tx * 0.95 + w * 0.05} ${-h * 0.93} ${w * 0.25 + tx * 0.7} ${-h * 0.82} ${w * 0.55 + tx * 0.45} ${-h * 0.62} ` +
	`C ${w * 1.05} ${-h * 0.3} ${w * 1.2} 10 0 10 Z`;

export const Flame: React.FC<{
	x: number;
	y: number; // base de la llama
	size: number; // alto en px con grow=1
	t: number; // segundos
	seed?: number;
	grow?: number;
	fl?: number;
	wick?: boolean;
}> = ({x, y, size, t, seed = 0, grow = 1, fl = 1, wick = true}) => {
	if (grow <= 0.001) return null;
	const sway = fbm('sx' + seed, t * 1.25, 0.2) * 0.9 + noise2D('sxf' + seed, t * 6.5, 1.7) * 0.22;
	const tx = sway * 16;
	const hh = 100 * grow * (0.9 + 0.13 * fbm('sh' + seed, t * 2.1, 5.3)) * (0.85 + 0.15 * fl);
	const ww = 21 * (0.92 + 0.08 * Math.min(grow, 1)) * (1 + 0.07 * fbm('sw' + seed, t * 2.6, 9.1));
	const s = size / 100;
	const id = `fl${seed}`;
	return (
		<svg
			width={170 * s}
			height={200 * s}
			viewBox="-85 -170 170 200"
			style={{position: 'absolute', left: x - 85 * s, top: y - 170 * s, overflow: 'visible', pointerEvents: 'none'}}
		>
			<defs>
				<radialGradient id={id + 'b'} cx="50%" cy="78%" r="72%" fx="50%" fy="85%">
					<stop offset="0%" stopColor="#FFFBEA" />
					<stop offset="28%" stopColor="#FFE9A8" />
					<stop offset="55%" stopColor={C.flama} />
					<stop offset="82%" stopColor={C.cempa} stopOpacity={0.85} />
					<stop offset="100%" stopColor={C.terracota} stopOpacity={0} />
				</radialGradient>
				<filter id={id + 'f1'} x="-100%" y="-100%" width="300%" height="300%">
					<feGaussianBlur stdDeviation={2.2} />
				</filter>
				<filter id={id + 'f2'} x="-100%" y="-100%" width="300%" height="300%">
					<feGaussianBlur stdDeviation={9} />
				</filter>
			</defs>
			{/* halo cercano */}
			<path d={flamePath(ww * 2.1, hh * 1.15, tx * 1.1)} fill={C.cempa} opacity={0.55 * fl} filter={`url(#${id}f2)`} />
			<path d={flamePath(ww * 1.25, hh * 1.06, tx * 1.15)} fill={C.cempa} opacity={0.75} filter={`url(#${id}f1)`} />
			<path d={flamePath(ww, hh, tx)} fill={`url(#${id}b)`} />
			<path d={flamePath(ww * 0.48, hh * 0.52, tx * 0.35)} fill="#FFFDF2" opacity={0.92} filter={`url(#${id}f1)`} />
			{wick ? <ellipse cx={0} cy={5} rx={ww * 0.55} ry={6} fill="#5a7fb0" opacity={0.28 * Math.min(1, grow)} filter={`url(#${id}f1)`} /> : null}
			{wick ? (
				<>
					<path d={`M 0 14 Q ${tx * 0.05} 4 ${tx * 0.08} -8`} stroke="#1a0d05" strokeWidth={3} fill="none" strokeLinecap="round" />
					<circle cx={tx * 0.08} cy={-8} r={2.2} fill="#ff8a3a" />
				</>
			) : null}
		</svg>
	);
};

// ---------- Cámara 2.5D ----------
export const Cam: React.FC<{
	children: React.ReactNode;
	s?: number;
	x?: number;
	y?: number;
	r?: number;
	ox?: number;
	oy?: number;
	blur?: number;
	style?: React.CSSProperties;
}> = ({children, s = 1, x = 0, y = 0, r = 0, ox = W / 2, oy = H / 2, blur = 0, style}) => (
	<AbsoluteFill
		style={{
			transformOrigin: `${ox}px ${oy}px`,
			transform: `translate(${x}px, ${y}px) rotate(${r}deg) scale(${s})`,
			filter: blur > 0.05 ? `blur(${blur}px)` : undefined,
			...style,
		}}
	>
		{children}
	</AbsoluteFill>
);

// ---------- Acabado de película ----------
export const Grain: React.FC<{amount?: number}> = ({amount = 0.13}) => {
	const frame = useCurrentFrame();
	const ref = useCanvasDraw(
		(ctx, w, h) => {
			const img = ctx.createImageData(w, h);
			const rnd = mulberry32(9137 + Math.floor(frame) * 7919);
			const d = img.data;
			for (let i = 0; i < d.length; i += 4) {
				// suma de 3 uniformes ≈ gaussiana
				const g = 128 + (rnd() + rnd() + rnd() - 1.5) * 150;
				d[i] = g;
				d[i + 1] = g;
				d[i + 2] = g;
				d[i + 3] = 255;
			}
			ctx.putImageData(img, 0, 0);
		},
		[frame],
	);
	return (
		<canvas
			ref={ref}
			width={W / 2}
			height={H / 2}
			style={{position: 'absolute', inset: 0, width: W, height: H, mixBlendMode: 'overlay', opacity: amount}}
		/>
	);
};

export const Vignette: React.FC<{k?: number}> = ({k = 0.78}) => (
	<AbsoluteFill
		style={{
			background: `radial-gradient(ellipse 72% 58% at 50% 52%, rgba(0,0,0,0) 40%, rgba(5,2,0,${k * 0.55}) 75%, rgba(3,1,0,${k}) 100%)`,
			pointerEvents: 'none',
		}}
	/>
);

// Etalonaje: sombras hacia café, altas luces hacia ámbar.
export const Grade: React.FC = () => (
	<>
		<AbsoluteFill style={{background: rgba(C.cempa, 0.07), mixBlendMode: 'soft-light'}} />
		<AbsoluteFill style={{background: rgba('#2a1406', 0.12), mixBlendMode: 'lighten'}} />
		<AbsoluteFill style={{background: rgba('#ffd9a0', 0.05), mixBlendMode: 'multiply'}} />
	</>
);

export const PaperTexture: React.FC<{o?: number; blend?: React.CSSProperties['mixBlendMode']}> = ({o = 0.5, blend = 'overlay'}) => (
	<AbsoluteFill
		style={{
			backgroundImage: `url(${paperUrl})`,
			backgroundSize: `${W}px ${H}px`,
			mixBlendMode: blend,
			opacity: o,
			pointerEvents: 'none',
		}}
	/>
);
