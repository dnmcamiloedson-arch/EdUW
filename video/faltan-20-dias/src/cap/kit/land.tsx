import React from 'react';
import {AbsoluteFill} from 'remotion';
import {noise2D} from '@remotion/noise';
import {C, H, W, hash, mixRGB, rgba} from '../../lib/util';
import {useCanvasDraw} from '../../components/core';

// ---------- Cielo con degradado y estrellas que titilan ----------
export const Sky: React.FC<{t: number; top?: string; mid?: string; horizon?: string; hy?: number; stars?: number; starO?: number}> = ({
	t,
	top = '#07040a',
	mid = '#160b10',
	horizon = '#3a160b',
	hy = 1100,
	stars = 0,
	starO = 1,
}) => {
	const ref = useCanvasDraw(
		(ctx) => {
			for (let i = 0; i < stars; i++) {
				const r = (q: number) => hash(i * 7 + q, 909);
				const x = r(1) * W;
				const y = r(2) * hy * 0.95;
				const tw = 0.55 + 0.45 * noise2D('st', i, t * (0.8 + r(3)));
				const s = 0.6 + 1.8 * r(4) ** 3;
				ctx.fillStyle = rgba(r(5) > 0.8 ? C.flama : '#FFF6E6', starO * tw * (0.35 + 0.65 * (1 - y / hy)));
				ctx.beginPath();
				ctx.arc(x, y, s, 0, Math.PI * 2);
				ctx.fill();
			}
		},
		[t, stars, starO],
	);
	return (
		<AbsoluteFill style={{background: `linear-gradient(180deg, ${top} 0%, ${mid} ${(hy / H) * 60}%, ${horizon} ${(hy / H) * 100}%, ${horizon} 100%)`}}>
			{stars ? <canvas ref={ref} width={W} height={H} style={{position: 'absolute', inset: 0}} /> : null}
		</AbsoluteFill>
	);
};

// ---------- Silueta de serranía (papel recortado) ----------
export const ridgePath = (seed: number, y: number, amp: number, freq: number, x0 = -200, x1 = W + 200, rough = 0.25) => {
	let d = `M ${x0} ${H + 50} L ${x0} ${y}`;
	for (let x = x0; x <= x1; x += 18) {
		const n = noise2D('rg' + seed, x * freq, 0.3) * 0.75 + noise2D('rg2' + seed, x * freq * 4, 1.1) * rough;
		d += ` L ${x} ${y - amp * n}`;
	}
	return d + ` L ${x1} ${H + 50} Z`;
};

export const Ridge: React.FC<{seed: number; y: number; amp: number; freq?: number; color: string; rim?: string; rimO?: number; dx?: number; shadow?: boolean; d?: string}> = ({
	seed,
	y,
	amp,
	freq = 0.0028,
	color,
	rim,
	rimO = 0.8,
	dx = 0,
	shadow = true,
	d,
}) => {
	const path = d ?? ridgePath(seed, y, amp, freq);
	return (
		<svg width={W} height={H} style={{position: 'absolute', inset: 0, overflow: 'visible', transform: `translateX(${dx}px)`}}>
			{shadow ? <path d={path} fill="#000" opacity={0.45} transform="translate(0 -6)" style={{filter: 'blur(5px)'}} /> : null}
			<path d={path} fill={color} />
			{rim ? <path d={path} fill="none" stroke={rim} strokeWidth={3} opacity={rimO} /> : null}
		</svg>
	);
};

// Niebla entre capas (perspectiva atmosférica)
export const Fog: React.FC<{y: number; h?: number; color?: string; o?: number}> = ({y, h = 380, color = C.cempa, o = 0.25}) => (
	<div style={{position: 'absolute', left: 0, top: y - h / 2, width: W, height: h, background: `linear-gradient(180deg, transparent, ${rgba(color, o)} 50%, transparent)`}} />
);

// Disco de sol / luna con halo
export const Orb: React.FC<{x: number; y: number; r: number; color?: string; core?: string; halo?: number; o?: number}> = ({x, y, r, color = C.flama, core = '#FFF4D6', halo = 5, o = 1}) => (
	<>
		<div style={{position: 'absolute', left: x - r * halo, top: y - r * halo, width: r * halo * 2, height: r * halo * 2, borderRadius: '50%', opacity: o * 0.55, mixBlendMode: 'screen', background: `radial-gradient(closest-side, ${rgba(color, 0.6)}, ${rgba(color, 0.15)} 45%, transparent)`}} />
		<div style={{position: 'absolute', left: x - r, top: y - r, width: r * 2, height: r * 2, borderRadius: '50%', opacity: o, background: `radial-gradient(circle at 40% 40%, ${core}, ${color} 70%, ${rgba(mixRGB(color, C.terracota, 0.5))} 100%)`, boxShadow: `0 0 ${r * 0.6}px ${rgba(color, 0.8)}`}} />
	</>
);

// Agua: reflejo vertical con ondas (barras horizontales desplazadas)
export const WaterReflect: React.FC<{y: number; t: number; children: React.ReactNode; o?: number; tint?: string}> = ({y, t, children, o = 0.55, tint = '#0a0508'}) => (
	<div style={{position: 'absolute', left: 0, top: y, width: W, height: H - y, overflow: 'hidden'}}>
		<div style={{position: 'absolute', left: 0, top: -y, width: W, height: H, transformOrigin: `50% ${y}px`, transform: 'scaleY(-1)', opacity: o, filter: 'blur(2px)'}}>{children}</div>
		{/* ondas */}
		{Array.from({length: 22}).map((_, i) => {
			const yy = 6 + i * i * 1.9;
			const off = Math.sin(t * 1.6 + i * 1.3) * (4 + i * 0.8);
			return <div key={i} style={{position: 'absolute', left: -40 + off, top: yy, width: W + 80, height: 1.5 + i * 0.12, background: rgba('#FFE6B0', 0.05 + 0.02 * Math.sin(t * 2 + i))}} />;
		})}
		<div style={{position: 'absolute', inset: 0, background: `linear-gradient(180deg, ${rgba(tint, 0.2)}, ${rgba(tint, 0.85)})`}} />
	</div>
);
