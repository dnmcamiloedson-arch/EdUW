// 28 de octubre · historia corta: cuenta regresiva vertiginosa de 20 a 0 (cada número entra con un movimiento distinto),
// el 0 estalla en pétalos y se vuelve «HOY»; luego «Siete altares. Siete leyendas. Hoy cobran vida.» · 28 · 10.
import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {E, H, W, clamp, hash, lerp} from '../lib/util';
import {Scene} from './kit/scene';
import {glow, type Ctx} from './kit/paint';
import {marigold} from './kit/fx';
import type {PostOpts} from './kit/post';

export const HOYALT_LEN = 216; // 7.2 s (+ outro)
const FPS = 30;

// horario de los números: 20…4 rapidísimo, 3-2-1 con peso, el 0 se sostiene y estalla
const TICKS: {n: number; at: number; dur: number}[] = (() => {
	const out: {n: number; at: number; dur: number}[] = [];
	let f = 4;
	for (let n = 20; n >= 4; n--) {
		const d = n > 12 ? 4 : 3;
		out.push({n, at: f, dur: d});
		f += d;
	}
	for (const n of [3, 2, 1]) {
		out.push({n, at: f, dur: 8});
		f += 8;
	}
	out.push({n: 0, at: f, dur: 12});
	return out;
})();
const ZERO_END = TICKS[TICKS.length - 1].at + 12; // ≈ 85
const HOY_AT = ZERO_END;
const COLS = ['#F26D3D', '#F5C242', '#E0BB8F', '#A83A25', '#1F5C48'];

const tickAt = (f: number) => {
	for (let i = TICKS.length - 1; i >= 0; i--) if (f >= TICKS[i].at) return {...TICKS[i], i};
	return null;
};

// fondo: destello radial que late con cada número, rayos que giran y pétalos que estallan con el HOY
const paint = (g: Ctx, f: number): PostOpts => {
	const t = f / FPS;
	g.fillStyle = '#120a05';
	g.fillRect(0, 0, W, H);
	const tk = tickAt(f);
	if (tk && f < HOY_AT) {
		const u = (f - tk.at) / tk.dur;
		const col = COLS[tk.i % COLS.length];
		glow(g, W / 2, H / 2, lerp(900, 500, u), col, 0.55 * (1 - u) + 0.15);
		// rayos de sol (como de papel picado) que giran más rápido conforme baja la cuenta
		g.save();
		g.translate(W / 2, H / 2);
		g.rotate(t * (1 + tk.i * 0.25));
		g.globalAlpha = 0.12 + 0.1 * (1 - u);
		g.fillStyle = col;
		for (let k = 0; k < 16; k++) {
			g.rotate((Math.PI * 2) / 16);
			g.beginPath();
			g.moveTo(0, 0);
			g.lineTo(-40, -1400);
			g.lineTo(40, -1400);
			g.fill();
		}
		g.restore();
	}
	// estallido de pétalos y flores con el HOY
	const d = f - HOY_AT;
	if (d >= -2) {
		glow(g, W / 2, H / 2, 1100, '#F5B04A', 0.5 * Math.exp(-Math.max(0, d) / 18) + 0.18);
		for (let i = 0; i < 70; i++) {
			const a = hash(i, 1) * Math.PI * 2;
			const sp = 500 + hash(i, 2) * 1300;
			const tt = Math.max(0, d) / FPS;
			const r = sp * (1 - Math.exp(-tt * 2.2));
			const x = W / 2 + Math.cos(a) * r;
			const y = H / 2 + Math.sin(a) * r + tt * tt * 160;
			marigold(g, x, y, 14 + hash(i, 3) * 26, a + tt * (hash(i, 4) - 0.5) * 6, i % 6, 0);
		}
	}
	return {bloom: 0.8, bloomThr: 0.55, halation: 0.35, vignette: 0.85, grain: 0.06, contrast: 1.08, saturation: 1.1, flash: d >= 0 && d < 4 ? 0.6 * (1 - d / 4) : 0, ca: d >= 0 && d < 10 ? 4 : 1.5};
};

// cada número entra con su propio movimiento
const Num: React.FC<{f: number}> = ({f}) => {
	const tk = tickAt(f);
	if (!tk || f >= HOY_AT) return null;
	const u = clamp((f - tk.at) / tk.dur);
	const e = E.out(u);
	const kind = tk.n === 0 ? 'zero' : (['slam', 'spin', 'flip', 'up', 'zoom', 'tilt'] as const)[(tk.i * 5) % 6];
	let tr = '';
	let op = 1;
	let blur = 0;
	switch (kind) {
		case 'slam':
			tr = `scale(${lerp(2.6, 1, e)})`;
			blur = (1 - e) * 10;
			break;
		case 'spin':
			tr = `rotate(${lerp(-120, 0, e)}deg) scale(${lerp(0.4, 1, e)})`;
			break;
		case 'flip':
			tr = `perspective(900px) rotateX(${lerp(90, 0, e)}deg)`;
			break;
		case 'up':
			tr = `translateY(${lerp(500, 0, e)}px)`;
			blur = (1 - e) * 14;
			break;
		case 'zoom':
			tr = `scale(${lerp(0.2, 1.08, e)})`;
			op = e;
			break;
		case 'tilt':
			tr = `translateX(${lerp(-420, 0, e)}px) skewX(${lerp(-25, 0, e)}deg)`;
			blur = (1 - e) * 12;
			break;
		case 'zero': {
			// el 0 tiembla, crece y se abre como pétalo
			const sh = Math.sin(f * 2.3) * 8 * u;
			tr = `translate(${sh}px, ${-sh}px) scale(${lerp(1, 1.35, E.in(u))})`;
			break;
		}
	}
	const col = COLS[(tk.i + 1) % 3];
	const size = tk.n >= 10 ? 560 : 680;
	return (
		<AbsoluteFill style={{alignItems: 'center', justifyContent: 'center'}}>
			<div
				style={{
					fontFamily: 'Rye',
					fontSize: size,
					lineHeight: 1,
					color: col,
					transform: tr,
					opacity: op,
					filter: `blur(${blur}px) drop-shadow(0 0 40px rgba(242,109,61,0.65))`,
					WebkitTextStroke: '6px #231305',
				}}
			>
				{tk.n}
			</div>
		</AbsoluteFill>
	);
};

const Copy: React.FC<{f: number; text: string; at: number; y: number; size: number; color: string; font?: string}> = ({f, text, at, y, size, color, font = 'Alike'}) => {
	const u = E.out(clamp((f - at) / 12));
	if (u <= 0) return null;
	return (
		<div style={{position: 'absolute', top: y, width: W, textAlign: 'center', fontFamily: font, fontSize: size, color, opacity: u, transform: `translateY(${(1 - u) * 40}px)`, textShadow: '0 4px 24px rgba(0,0,0,0.7)', letterSpacing: font === 'Rye' ? '0.04em' : '0.02em'}}>
			{text}
		</div>
	);
};

export const HoyAltares: React.FC<{dias: number; fecha: string}> = () => {
	const f = useCurrentFrame();
	const d = f - HOY_AT;
	const hoyU = d < 0 ? 0 : 1;
	const hoyScale = d < 0 ? 0 : d < 6 ? lerp(3.2, 0.92, E.out(d / 6)) : d < 12 ? lerp(0.92, 1, E.out((d - 6) / 6)) : 1 + 0.015 * Math.sin(d * 0.15);
	// el HOY sube a la parte alta para dejar espacio al copy
	const hoyY = lerp(0, -380, E.inOut(clamp((d - 30) / 18)));
	const hoyS = lerp(1, 0.62, E.inOut(clamp((d - 30) / 18)));
	return (
		<AbsoluteFill style={{background: '#120a05'}}>
			<Scene paint={paint} bg="#120a05">
				<Num f={f} />
				{hoyU ? (
					<AbsoluteFill style={{alignItems: 'center', justifyContent: 'center'}}>
						<div style={{fontFamily: 'Rye', fontSize: 380, color: '#F5C242', transform: `translateY(${hoyY}px) scale(${hoyScale * hoyS})`, WebkitTextStroke: '6px #231305', filter: 'drop-shadow(0 0 50px rgba(245,176,74,0.8))', letterSpacing: '0.04em'}}>HOY</div>
					</AbsoluteFill>
				) : null}
				<Copy f={f} text="Siete altares." at={HOY_AT + 40} y={880} size={74} color="#efe3c8" />
				<Copy f={f} text="Siete leyendas." at={HOY_AT + 56} y={980} size={74} color="#efe3c8" />
				<Copy f={f} text="Hoy cobran vida." at={HOY_AT + 74} y={1100} size={92} color="#F26D3D" font="Rye" />
				<Copy f={f} text="28 · 10" at={HOY_AT + 94} y={1250} size={54} color="#E0BB8F" />
			</Scene>
		</AbsoluteFill>
	);
};
