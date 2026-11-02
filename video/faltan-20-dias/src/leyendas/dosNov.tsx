// 2 de noviembre · historia corta: una fila de veladoras se enciende una a una sobre un camino de cempasúchil, las
// chispas suben como almas que vuelven y entra el mensaje «Hoy vuelven a casa.» · Día de Muertos.
import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {E, H, W, clamp, hash} from '../lib/util';
import {Scene} from './kit/scene';
import {glow, type Ctx} from './kit/paint';
import {candle2D, marigold, papelPicado, particles} from './kit/fx';
import type {PostOpts} from './kit/post';

export const DOSNOV_LEN = 240; // 8 s (+ outro)
const FPS = 30;

// veladoras en arco (las del centro al frente): x, base y, alto, cuadro en que se encienden
export const VELAS = [0, 1, 2, 3, 4, 5, 6].map((i) => {
	const u = (i - 3) / 3;
	const front = 1 - Math.abs(u);
	return {x: W / 2 + u * 400, y: 1520 + front * 90, h: 120 + front * 70, w: 46 + front * 22, at: 16 + [3, 2, 4, 0, 5, 1, 6][i] * 9, seed: i + 3};
});
export const LIT_END = 16 + 6 * 9;

const paint = (g: Ctx, f: number): PostOpts => {
	const t = f / FPS;
	g.fillStyle = '#100805';
	g.fillRect(0, 0, W, H);
	const lit = VELAS.filter((v) => f >= v.at).length / VELAS.length;
	glow(g, W / 2, 1450, 1200, '#A83A25', 0.15 + 0.35 * lit);
	glow(g, W / 2, 900, 900, '#F5B04A', 0.08 + 0.12 * lit);
	papelPicado(g, {x0: -40, x1: W + 40, y: 110, t, n: 9, seed: 11, sag: 55, size: 1.1, alpha: 0.85});
	// camino de pétalos que se abre hacia el frente
	for (let i = 0; i < 160; i++) {
		const d = hash(i, 7);
		const y = 1380 + d * 520;
		const spread = 120 + d * 520;
		const x = W / 2 + (hash(i, 8) - 0.5) * 2 * spread;
		marigold(g, x, y, 10 + d * 22, hash(i, 9) * 6, i % 6, 0);
	}
	// veladoras (de atrás hacia adelante)
	[...VELAS].sort((a, b) => a.y - b.y).forEach((v) => {
		const on = f >= v.at;
		if (on) glow(g, v.x, v.y - v.h, 260, '#F5B04A', 0.35 * clamp((f - v.at) / 6));
		candle2D(g, {x: v.x, y: v.y, w: v.w, h: v.h, t, seed: v.seed, lit: on, flameA: clamp((f - v.at) / 4)});
	});
	// chispas que suben como almas que regresan
	if (f > LIT_END - 20) particles(g, {kind: 'embers', n: 70, t, seed: 5, y: 300, h: 1300, size: 1.3, alpha: clamp((f - LIT_END + 20) / 30) * 0.9, speed: 0.6});
	return {bloom: 0.75, bloomThr: 0.55, halation: 0.35, vignette: 0.9, grain: 0.06, contrast: 1.06, saturation: 1.08};
};

const Txt: React.FC<{f: number; at: number; y: number; size: number; color: string; font?: string; children: React.ReactNode}> = ({f, at, y, size, color, font = 'Alike', children}) => {
	const u = E.out(clamp((f - at) / 16));
	if (u <= 0) return null;
	return (
		<div style={{position: 'absolute', top: y, width: W, textAlign: 'center', fontFamily: font, fontSize: size, color, opacity: u, transform: `translateY(${(1 - u) * 34}px)`, textShadow: '0 4px 26px rgba(0,0,0,0.85)', letterSpacing: font === 'Rye' ? '0.03em' : '0.01em', filter: `blur(${(1 - u) * 6}px)`}}>
			{children}
		</div>
	);
};

export const DosNov: React.FC<{dias: number; fecha: string}> = () => {
	const f = useCurrentFrame();
	return (
		<AbsoluteFill style={{background: '#100805'}}>
			<Scene paint={paint} bg="#100805">
				<Txt f={f} at={60} y={540} size={58} color="#E0BB8F">2 de noviembre</Txt>
				<Txt f={f} at={78} y={630} size={116} color="#F5C242" font="Rye">Hoy vuelven</Txt>
				<Txt f={f} at={92} y={770} size={116} color="#F5C242" font="Rye">a casa.</Txt>
				<Txt f={f} at={128} y={960} size={56} color="#efe3c8">Nadie se va del todo</Txt>
				<Txt f={f} at={142} y={1035} size={56} color="#efe3c8">mientras se le recuerde.</Txt>
				<Txt f={f} at={176} y={1160} size={76} color="#F26D3D" font="Rye">Día de Muertos</Txt>
			</Scene>
		</AbsoluteFill>
	);
};
