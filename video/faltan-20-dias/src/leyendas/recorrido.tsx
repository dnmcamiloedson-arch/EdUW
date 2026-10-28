// 28 de octubre · anuncio: el recorrido de altares empieza a las 12:00 PM. Un reloj de manecillas gira de prisa y se
// detiene en las 12 con un rebote; suena la campanada, revientan pétalos y entra la información.
import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {E, H, W, clamp, hash, lerp} from '../lib/util';
import {Scene} from './kit/scene';
import {glow, type Ctx} from './kit/paint';
import {marigold, papelPicado} from './kit/fx';
import type {PostOpts} from './kit/post';

export const RECORRIDO_LEN = 240; // 8 s (+ outro)
const FPS = 30;
const NOON = 62; // las manecillas llegan a las 12
const TAU = Math.PI * 2;

// ángulo de las manecillas: giran rápido, frenan y rebotan al llegar a las 12
const hands = (f: number) => {
	if (f >= NOON) {
		const d = f - NOON;
		const b = Math.exp(-d / 6) * Math.sin(d * 0.9) * 0.12;
		return {min: b, hour: b * 0.4};
	}
	const u = f / NOON;
	const turns = 5 * (1 - (1 - u) ** 3); // gira 5 vueltas desacelerando
	return {min: (turns - 5) * TAU, hour: ((turns - 5) * TAU) / 12};
};

// posición y tamaño del reloj: entra al centro y luego sube para dejar lugar al texto
const clockPose = (f: number) => {
	const inU = E.out(clamp(f / 20));
	const up = E.inOut(clamp((f - NOON - 6) / 18));
	return {x: W / 2, y: lerp(900, 530, up), r: lerp(330, 200, up) * lerp(0.6, 1, inU)};
};

const clock = (g: Ctx, f: number) => {
	const {x, y, r} = clockPose(f);
	const {min, hour} = hands(f);
	const ring = f >= NOON ? Math.exp(-(f - NOON) / 10) : 0;
	glow(g, x, y, r * 2.6, '#F5B04A', 0.25 + 0.5 * ring);
	// corona de cempasúchil alrededor de la carátula
	for (let i = 0; i < 28; i++) {
		const a = (i / 28) * TAU + f * 0.004;
		marigold(g, x + Math.cos(a) * r * 1.13, y + Math.sin(a) * r * 1.13, r * 0.11, a, i % 6, 0);
	}
	// carátula
	const gr = g.createRadialGradient(x, y - r * 0.3, r * 0.1, x, y, r);
	gr.addColorStop(0, '#f4e6c8');
	gr.addColorStop(1, '#d9b98a');
	g.fillStyle = gr;
	g.beginPath();
	g.arc(x, y, r, 0, TAU);
	g.fill();
	g.strokeStyle = '#231305';
	g.lineWidth = r * 0.04;
	g.stroke();
	// marcas de las horas y el 12 en Rye
	for (let k = 0; k < 12; k++) {
		const a = (k / 12) * TAU - Math.PI / 2;
		const r0 = r * (k % 3 === 0 ? 0.74 : 0.8);
		g.lineWidth = r * (k % 3 === 0 ? 0.035 : 0.018);
		g.beginPath();
		g.moveTo(x + Math.cos(a) * r0, y + Math.sin(a) * r0);
		g.lineTo(x + Math.cos(a) * r * 0.9, y + Math.sin(a) * r * 0.9);
		g.stroke();
	}
	g.fillStyle = '#A83A25';
	g.font = `${Math.round(r * 0.3)}px Rye`;
	g.textAlign = 'center';
	g.textBaseline = 'middle';
	g.fillText('12', x, y - r * 0.55);
	// manecillas (horario corto y grueso, minutero largo)
	const hand = (ang: number, len: number, w: number, col: string) => {
		g.save();
		g.translate(x, y);
		g.rotate(ang);
		g.fillStyle = col;
		g.beginPath();
		g.moveTo(-w / 2, r * 0.08);
		g.lineTo(-w * 0.2, -len);
		g.lineTo(w * 0.2, -len);
		g.lineTo(w / 2, r * 0.08);
		g.closePath();
		g.fill();
		g.restore();
	};
	hand(hour, r * 0.48, r * 0.075, '#231305');
	hand(min, r * 0.72, r * 0.05, '#231305');
	g.fillStyle = '#F26D3D';
	g.beginPath();
	g.arc(x, y, r * 0.06, 0, TAU);
	g.fill();
};

const paint = (g: Ctx, f: number): PostOpts => {
	const t = f / FPS;
	g.fillStyle = '#140a05';
	g.fillRect(0, 0, W, H);
	glow(g, W / 2, H * 0.45, 1100, '#A83A25', 0.35);
	papelPicado(g, {x0: -40, x1: W + 40, y: 120, t, n: 9, seed: 3, sag: 60, size: 1.15, alpha: 0.9});
	// rayos detrás del reloj
	const {x, y} = clockPose(f);
	g.save();
	g.translate(x, y);
	g.rotate(t * 0.25);
	g.globalAlpha = 0.1;
	g.fillStyle = '#F5C242';
	for (let k = 0; k < 18; k++) {
		g.rotate(TAU / 18);
		g.beginPath();
		g.moveTo(0, 0);
		g.lineTo(-50, -1600);
		g.lineTo(50, -1600);
		g.fill();
	}
	g.restore();
	clock(g, f);
	// pétalos que revientan con la campanada
	const d = f - NOON;
	if (d >= 0) {
		for (let i = 0; i < 60; i++) {
			const a = hash(i, 1) * TAU;
			const tt = d / FPS;
			const rr = (400 + hash(i, 2) * 1100) * (1 - Math.exp(-tt * 2.4));
			marigold(g, x + Math.cos(a) * rr, y + Math.sin(a) * rr + tt * tt * 220, 12 + hash(i, 3) * 22, a + tt * 4, i % 6, 0);
		}
	}
	return {bloom: 0.7, bloomThr: 0.6, halation: 0.3, vignette: 0.85, grain: 0.06, contrast: 1.06, saturation: 1.08, flash: d >= 0 && d < 4 ? 0.45 * (1 - d / 4) : 0};
};

const Txt: React.FC<{f: number; text: string; at: number; y: number; size: number; color: string; font?: string; pop?: boolean}> = ({f, text, at, y, size, color, font = 'Alike', pop}) => {
	const d = f - at;
	if (d < 0) return null;
	const u = E.out(clamp(d / 12));
	const s = pop ? (d < 6 ? lerp(2.2, 0.94, E.out(d / 6)) : d < 12 ? lerp(0.94, 1, (d - 6) / 6) : 1) : 1;
	return (
		<div style={{position: 'absolute', top: y, width: W, textAlign: 'center', fontFamily: font, fontSize: size, color, opacity: pop ? clamp(d / 3) : u, transform: `translateY(${pop ? 0 : (1 - u) * 36}px) scale(${s})`, textShadow: '0 4px 26px rgba(0,0,0,0.75)', WebkitTextStroke: font === 'Rye' ? '3px #231305' : undefined}}>
			{text}
		</div>
	);
};

export const Recorrido: React.FC<{dias: number; fecha: string}> = () => {
	const f = useCurrentFrame();
	return (
		<AbsoluteFill style={{background: '#140a05'}}>
			<Scene paint={paint} bg="#140a05">
				<Txt f={f} text="12:00 PM" at={NOON + 14} y={830} size={170} color="#F5C242" font="Rye" pop />
				<Txt f={f} text="Recorrido de altares" at={NOON + 34} y={1030} size={78} color="#efe3c8" font="Rye" />
				<Txt f={f} text="HOY · 28 · 10" at={NOON + 52} y={1135} size={54} color="#E0BB8F" />
				<Txt f={f} text="Los siete altares te esperan." at={NOON + 76} y={1225} size={56} color="#efe3c8" />
				<Txt f={f} text="¡Ahí nos vemos!" at={NOON + 100} y={1330} size={96} color="#F26D3D" font="Rye" pop />
			</Scene>
		</AbsoluteFill>
	);
};
