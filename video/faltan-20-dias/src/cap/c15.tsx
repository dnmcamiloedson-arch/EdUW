import React, {useEffect, useMemo, useState} from 'react';
import {AbsoluteFill, Sequence, continueRender, delayRender, useCurrentFrame} from 'remotion';
import * as THREE from 'three';
import {noise2D} from '@remotion/noise';
import {C, E, FPS, H, W, clamp, css, flicker, hash, lerp, mixRGB, mulberry32, ramp, rgba} from '../lib/util';
import {PaperTexture} from '../components/core';
import {fontsReady} from '../lib/fonts';
import {GoldNumber, Kinetic, Lockup, NUM_Y, numSize} from './kit/type';
import {Dip} from './kit/transitions';
import {Camera, Mountain, Stage3D} from './kit/three';
import {Dust3D, Flame3D, Glow3D, LightShaft, Moon3D, Sea3D, SkyDome, Stars3D, V3, plasterTex, stoneTex, withRepeat} from './kit/fx3d';

// Capítulo 15 · "El barco en el muro" — leyenda de Veracruz.
// Encerrada en San Juan de Ulúa, una mujer sabia pidió un trozo de carbón, dibujó un barco en la pared…
// "—¿Qué le falta? —Que navegue." Subió a bordo y nunca la volvieron a ver.
// Todo ocurre en 3D: la celda, el muro, el mar y el barco; el dibujo al carbón es una textura viva sobre el muro.
export const C15 = {S1: 120, S2: 96, S3: 225, S4: 165, S5: 135, REV: 150, HIT: 74};
const T3 = C15.S2;
const T4 = T3 + C15.S3;
const T5 = T4 + C15.S4;
const CELDA = T5 + C15.S5;
export const C15_LEN = C15.S1 + CELDA + C15.REV;

// ---------- Calibración: con la cámara frontal, 1 decímetro del muro = 100 px de pantalla ----------
const FOV = 40;
const FPX = 960 / Math.tan(((FOV / 2) * Math.PI) / 180);
const LAYER_Z = 0.03; // capa del dibujo, apenas delante de la piedra
const CAM_Y = 9.6;
const CAM_Z = FPX / 100 + LAYER_Z;
const FRONT: V3 = [0, CAM_Y, CAM_Z];
const FRONT_LOOK: V3 = [0, CAM_Y, 0];
const wallX = (px: number) => px / 100 - 5.4;
const wallY = (py: number) => 19.2 - py / 100;

// El barco real está mar adentro y, visto desde la cámara frontal, ocupa exactamente el lugar del dibujo.
const SHIP_D = 977;
const K = SHIP_D / FPX; // decímetros por píxel del dibujo a esa distancia
const SEA_Y = CAM_Y - (1150 - 960) * K;
const SHIP_Z = CAM_Z - SHIP_D;
const SHIP_X = (555 - 540) * K;
const MOON_D = 30000;
const MOON: V3 = [((840 - 540) / FPX) * MOON_D, CAM_Y + ((960 - 640) / FPX) * MOON_D, CAM_Z - MOON_D];
const MOON_R = (34 * MOON_D) / FPX;

// Celda abovedada: muro del fondo en z = 0 (da al mar), paredes en x = ±20, bóveda desde y = 18
// (la vela queda fuera del encuadre frontal: z ≥ 9.5)
const CANDLE: V3 = [-1.6, 0, 9.9];
const FLAME_P: V3 = [CANDLE[0], 2.32, CANDLE[2]];
// cántaro en primer plano (a contraluz de la vela) y jarrito con agua junto al pan: fuera del encuadre frontal
const JUG: V3 = [-3.4, 0, 13.0];
const CUP: V3 = [1.75, 0, 11.3];
const BOWL: V3 = [0.06, 0, 12.3];
const STICK0: V3 = [0.56, 0.1, 8.0];
const WIN = {z0: 20, z1: 24, y0: 12, y1: 15.5};
const WIN_C: V3 = [-20, (WIN.y0 + WIN.y1) / 2, (WIN.z0 + WIN.z1) / 2];
const BARS = [0.25, 0.5, 0.75];
// la luna entra por la ventana y cae al piso, delante del cuenco
const BEAM_HIT: V3 = [1.6, 0, 12.6];

// ---------- Utilidades de trazo ----------
type P = [number, number];
type Stroke = {pts: P[]; w: number};
const bez = (a: P, b: P, c: P, d: P, n = 22): P[] => {
	const out: P[] = [];
	for (let i = 0; i <= n; i++) {
		const t = i / n;
		const m = 1 - t;
		out.push([m * m * m * a[0] + 3 * m * m * t * b[0] + 3 * m * t * t * c[0] + t * t * t * d[0], m * m * m * a[1] + 3 * m * m * t * b[1] + 3 * m * t * t * c[1] + t * t * t * d[1]]);
	}
	return out;
};
const seg = (a: P, b: P, n = 6): P[] => Array.from({length: n + 1}, (_, i) => [lerp(a[0], b[0], i / n), lerp(a[1], b[1], i / n)] as P);
const join = (...parts: P[][]): P[] => parts.reduce<P[]>((acc, p, i) => acc.concat(i ? p.slice(1) : p), []);
const arc = (cx: number, cy: number, r: number, a0 = 0, a1 = Math.PI * 2, n = 18): P[] =>
	Array.from({length: n + 1}, (_, i) => {
		const a = lerp(a0, a1, i / n);
		return [cx + Math.cos(a) * r, cy + Math.sin(a) * r] as P;
	});
const plen = (pts: P[]) => pts.reduce((s, p, i) => (i ? s + Math.hypot(p[0] - pts[i - 1][0], p[1] - pts[i - 1][1]) : 0), 0);

// ---------- El barco dibujado (coordenadas locales: origen en la línea de flotación, proa a la derecha) ----------
const SHIP_O: P = [555, 1150];
const shipLocal = (anim: number, t: number): Stroke[] => {
	const bil = 14 * anim * (0.6 + 0.4 * Math.sin(t * 3.1));
	const fl = anim * t;
	const S: Stroke[] = [];
	// casco
	S.push({w: 6, pts: join(seg([-305, -160], [-286, 8], 6), bez([-286, 8], [-150, 74], [150, 74], [255, 2]), bez([255, 2], [282, -18], [298, -52], [306, -92]))});
	S.push({w: 5.5, pts: join(bez([306, -92], [200, -70], [20, -66], [-180, -72]), seg([-180, -72], [-180, -160], 4), bez([-180, -160], [-220, -166], [-270, -166], [-305, -160]))});
	// mástiles y bauprés
	S.push({w: 5, pts: seg([-245, -165], [-245, -440], 10)});
	S.push({w: 5.5, pts: seg([-35, -70], [-35, -565], 14)});
	S.push({w: 5, pts: seg([135, -72], [135, -508], 12)});
	S.push({w: 4.5, pts: seg([292, -86], [408, -152], 6)});
	// vergas
	S.push({w: 4, pts: seg([-150, -472], [80, -472], 8)});
	S.push({w: 3.6, pts: seg([-105, -552], [35, -552], 6)});
	S.push({w: 4, pts: seg([45, -432], [225, -432], 8)});
	S.push({w: 3.6, pts: seg([78, -502], [192, -502], 6)});
	// velas (se inflan al navegar)
	S.push({w: 4, pts: join(bez([80, -472], [104 + bil, -390], [104 + bil, -300], [86, -212]), bez([86, -212], [30, -190 - bil * 0.3], [-100, -190 - bil * 0.3], [-150, -212]), bez([-150, -212], [-130 + bil * 0.4, -300], [-132 + bil * 0.4, -390], [-150, -472]))});
	S.push({w: 3.6, pts: join(bez([35, -552], [50 + bil * 0.6, -530], [50 + bil * 0.6, -505], [40, -480]), seg([40, -480], [-100, -480], 6), bez([-100, -480], [-96, -505], [-96, -530], [-105, -552]))});
	S.push({w: 4, pts: join(bez([225, -432], [248 + bil, -350], [248 + bil, -270], [234, -202]), bez([234, -202], [180, -184], [90, -184], [42, -202]), bez([42, -202], [58 + bil * 0.4, -280], [56, -360], [45, -432]))});
	S.push({w: 3.6, pts: join(bez([192, -502], [206 + bil * 0.6, -480], [206, -458], [196, -440]), seg([196, -440], [82, -440], 6), seg([82, -440], [78, -502], 3))});
	S.push({w: 3.8, pts: seg([-335, -196], [-168, -476], 10)});
	S.push({w: 3.6, pts: join(bez([-168, -476], [-180 + bil * 0.5, -380], [-210, -260], [-246, -190]), seg([-246, -190], [-335, -196], 4))});
	S.push({w: 3.6, pts: join(seg([135, -500], [406, -150], 12), bez([406, -150], [330, -110 + bil * 0.3], [240, -96], [172, -90]), seg([172, -90], [135, -500], 10))});
	// tablazón, franja pintada y portillas
	S.push({w: 2.6, pts: bez([292, -62], [150, -44], [-80, -44], [-292, -50])});
	S.push({w: 2.6, pts: bez([280, -30], [150, -14], [-80, -14], [-288, -18])});
	for (let i = 0; i < 26; i++) {
		const x = -262 + i * 21;
		S.push({w: 2, pts: seg([x, -57], [x + 10, -47], 2)});
	}
	for (const x of [-120, -40, 40, 120]) S.push({w: 2.6, pts: arc(x, -30, 7, 0, Math.PI * 2, 14)});
	// balaustrada del castillo de popa
	S.push({w: 2.6, pts: seg([-305, -178], [-185, -178], 6)});
	for (let i = 0; i < 7; i++) {
		const x = -295 + i * 17;
		S.push({w: 2.2, pts: seg([x, -162], [x, -178], 2)});
	}
	// flor de cempasúchil pintada en la vela mayor
	const ec: P = [-34 + bil * 0.3, -342];
	S.push({w: 2.6, pts: arc(ec[0], ec[1], 12, 0, Math.PI * 2, 16)});
	for (let k = 0; k < 8; k++) {
		const a = (k / 8) * Math.PI * 2;
		S.push({w: 2.4, pts: arc(ec[0] + Math.cos(a) * 24, ec[1] + Math.sin(a) * 24, 10, 0, Math.PI * 2, 12)});
	}
	// banderines
	for (const [mx, my, L] of [
		[-35, -565, 70],
		[135, -508, 56],
		[-245, -440, 46],
	] as const) {
		const top: P[] = [];
		const bot: P[] = [];
		for (let i = 0; i <= 10; i++) {
			const u = i / 10;
			const wv = Math.sin(u * 5 - fl * 6) * 6 * u;
			top.push([mx + u * L, my + wv + u * 4]);
			bot.unshift([mx + u * L * 0.98, my + 14 * (1 - u) + wv + u * 4]);
		}
		S.push({w: 2.6, pts: [...top, ...bot]});
	}
	// jarcias
	for (const [a, b] of [
		[
			[-35, -565],
			[292, -86],
		],
		[
			[-35, -565],
			[-300, -168],
		],
		[
			[135, -508],
			[406, -150],
		],
		[
			[-245, -440],
			[-35, -470],
		],
	] as [P, P][])
		S.push({w: 2, pts: seg(a, b, 10)});
	for (const [mx, top, deck] of [
		[-35, -565, -70],
		[135, -508, -72],
		[-245, -440, -165],
	] as const) {
		S.push({w: 1.8, pts: seg([mx, top + 30], [mx - 50, deck + 2], 8)});
		S.push({w: 1.8, pts: seg([mx, top + 30], [mx + 46, deck + 2], 8)});
	}
	// linterna de popa
	S.push({w: 2.4, pts: seg([-305, -178], [-318, -205], 3)});
	S.push({w: 2.6, pts: arc(-320, -214, 8, 0, Math.PI * 2, 12)});
	return S;
};

const shipXform = (anim: number, t: number) => ({bob: anim * Math.sin(t * 2.2) * 6, rot: anim * Math.sin(t * 1.7 + 0.6) * 0.018});
const toScreen = (pts: P[], bob: number, rot: number): P[] => {
	const c = Math.cos(rot);
	const s = Math.sin(rot);
	return pts.map(([x, y]) => [SHIP_O[0] + x * c - y * s, SHIP_O[1] + x * s + y * c + bob] as P);
};
const extraStrokes = (anim: number, t: number): Stroke[] => {
	const S: Stroke[] = [];
	for (let k = 0; k < 4; k++) {
		const pts: P[] = [];
		const y0 = 1158 + k * 24;
		const x0 = 150 + k * 18;
		const x1 = 960 - k * 26;
		for (let x = x0; x <= x1; x += 9) pts.push([x, y0 + Math.sin(((x - x0) / 72) * Math.PI * 2 + k * 1.3 - anim * t * 3.2) * (7 - k)]);
		S.push({w: 4 - k * 0.5, pts});
	}
	// luna creciente y gaviotas
	S.push({w: 3.4, pts: arc(840, 640, 34, -Math.PI * 0.55, Math.PI * 0.55, 18)});
	S.push({w: 3, pts: arc(826, 636, 30, -Math.PI * 0.42, Math.PI * 0.45, 16)});
	for (const [bx, by, s] of [
		[905, 742, 1],
		[948, 776, 0.8],
	] as const) {
		S.push({w: 2.6, pts: join(bez([bx - 18 * s, by - 6 * s], [bx - 10 * s, by - 12 * s], [bx - 4 * s, by - 8 * s], [bx, by]), bez([bx, by], [bx + 4 * s, by - 8 * s], [bx + 10 * s, by - 12 * s], [bx + 18 * s, by - 6 * s]))});
	}
	return S;
};
const allStrokes = (anim: number, t: number): Stroke[] => {
	const {bob, rot} = shipXform(anim, t);
	// casco y aparejo primero, luego el mar, la luna y las gaviotas; al final la linterna de popa, junto a ella
	const ship = shipLocal(anim, t).map((s) => ({w: s.w, pts: toScreen(s.pts, bob, rot)}));
	return [...ship.slice(0, -2), ...extraStrokes(anim, t), ...ship.slice(-2)];
};
const STATIC = allStrokes(0, 0);
const PEN_GAP = 26;
const TOTAL_LEN = STATIC.reduce((s, st) => s + plen(st.pts) + PEN_GAP, 0);
// avance del dibujo dentro de S3 (frames locales de la celda)
const DRAW0 = T3 + 6;
const DRAW1 = T3 + 150;
const drawProg = (lf: number) => (lf <= DRAW0 ? 0 : lf >= DRAW1 ? TOTAL_LEN + 1 : TOTAL_LEN * E.inOut(clamp((lf - DRAW0) / (DRAW1 - DRAW0))));

// recorre los trazos hasta "budget" y devuelve la punta del carbón
const tipAt = (strokes: Stroke[], budget: number): {tip: P; lifted: number} => {
	let b = budget;
	let prev: P = strokes[0].pts[0];
	for (const s of strokes) {
		if (b < PEN_GAP) return {tip: [lerp(prev[0], s.pts[0][0], b / PEN_GAP), lerp(prev[1], s.pts[0][1], b / PEN_GAP)], lifted: Math.sin(Math.PI * (b / PEN_GAP))};
		b -= PEN_GAP;
		for (let i = 1; i < s.pts.length; i++) {
			const a = s.pts[i - 1];
			const c = s.pts[i];
			const L = Math.hypot(c[0] - a[0], c[1] - a[1]);
			if (b <= L) return {tip: [lerp(a[0], c[0], b / Math.max(L, 1e-6)), lerp(a[1], c[1], b / Math.max(L, 1e-6))], lifted: 0};
			b -= L;
		}
		prev = s.pts[s.pts.length - 1];
	}
	return {tip: prev, lifted: 0};
};

// trazo de carbón: tres pasadas con leve temblor de mano
const charcoal = (g: CanvasRenderingContext2D, pts: P[], w: number) => {
	if (pts.length < 2) return;
	const passes: [number, number, number, number][] = [
		[0, 0, 1.7, 0.9],
		[1.2, 0.8, 1.05, 0.42],
		[-0.9, 1.1, 0.75, 0.34],
	];
	for (const [dx, dy, kw, a] of passes) {
		g.globalAlpha = a;
		g.lineWidth = w * kw;
		g.beginPath();
		for (let i = 0; i < pts.length; i++) {
			const [x, y] = pts[i];
			const jx = noise2D('cj', x * 0.021, y * 0.021) * 1.4 + dx;
			const jy = noise2D('ck', x * 0.021, y * 0.021) * 1.4 + dy;
			if (i) g.lineTo(x + jx, y + jy);
			else g.moveTo(x + jx, y + jy);
		}
		g.stroke();
	}
	g.globalAlpha = 1;
};
const drawStrokes = (g: CanvasRenderingContext2D, strokes: Stroke[], budget: number) => {
	let b = budget;
	for (const s of strokes) {
		if (b <= PEN_GAP) break;
		b -= PEN_GAP;
		const part: P[] = [s.pts[0]];
		for (let i = 1; i < s.pts.length; i++) {
			const a = s.pts[i - 1];
			const c = s.pts[i];
			const L = Math.hypot(c[0] - a[0], c[1] - a[1]);
			if (b >= L) {
				part.push(c);
				b -= L;
			} else {
				part.push([lerp(a[0], c[0], b / L), lerp(a[1], c[1], b / L)]);
				b = 0;
				break;
			}
		}
		charcoal(g, part, s.w);
		if (b <= 0) break;
	}
};

// ---------- Sombras proyectadas por la vela (pintadas sobre el muro) ----------
type Sombra = {S: P; T: P; k: number};
// el hombro solo se acerca un poco (casi todo en vertical) y el brazo de sombra se estira lo que falte:
// así el cuerpo se queda a la izquierda y nunca tapa el dibujo
const ik = (S: P, T: P, L1: number, L2: number): {S: P; E: P} => {
	let s: P = [S[0], S[1]];
	let dx = T[0] - s[0];
	let dy = T[1] - s[1];
	let d = Math.hypot(dx, dy);
	let l1 = L1;
	let l2 = L2;
	const reach = L1 + L2 - 4;
	if (d > reach) {
		const over = d - reach;
		s = [s[0] + clamp((dx / d) * over, -50, 60), s[1] + clamp((dy / d) * over, -150, 150)];
		dx = T[0] - s[0];
		dy = T[1] - s[1];
		d = Math.hypot(dx, dy);
		if (d > reach) {
			const k = (d + 4) / (L1 + L2);
			l1 *= k;
			l2 *= k;
		}
	}
	const a = Math.acos(clamp((l1 * l1 + d * d - l2 * l2) / (2 * l1 * d), -1, 1));
	const base = Math.atan2(dy, dx);
	const ang = base + a; // codo hacia abajo
	return {S: s, E: [s[0] + Math.cos(ang) * l1, s[1] + Math.sin(ang) * l1]};
};
const paintMujer = (g: CanvasRenderingContext2D, sh: Sombra) => {
	const k = sh.k;
	const W2: P = [sh.T[0] - 24 * k, sh.T[1] + 20 * k];
	const {S, E: El} = ik(sh.S, W2, 205 * k, 196 * k);
	const Hc: P = [S[0] - 22 * k, S[1] - 150 * k];
	g.fillStyle = '#000';
	g.strokeStyle = '#000';
	g.lineCap = 'round';
	g.lineJoin = 'round';
	// rebozo sobre la cabeza que cae por la espalda
	g.beginPath();
	g.ellipse(Hc[0], Hc[1], 76 * k, 90 * k, 0.18, 0, Math.PI * 2);
	g.fill();
	g.beginPath();
	g.moveTo(Hc[0] - 60 * k, Hc[1] - 40 * k);
	g.bezierCurveTo(Hc[0] - 130 * k, Hc[1] + 60 * k, S[0] - 230 * k, S[1] + 260 * k, S[0] - 270 * k, S[1] + 1100 * k);
	g.lineTo(S[0] + 140 * k, S[1] + 1100 * k);
	g.bezierCurveTo(S[0] + 90 * k, S[1] + 420 * k, S[0] + 60 * k, S[1] + 120 * k, S[0] + 10 * k, S[1] - 10 * k);
	g.lineTo(Hc[0] + 30 * k, Hc[1] + 70 * k);
	g.closePath();
	g.fill();
	// perfil: nariz y labios asoman del rebozo
	g.beginPath();
	g.moveTo(Hc[0] + 62 * k, Hc[1] - 20 * k);
	g.quadraticCurveTo(Hc[0] + 92 * k, Hc[1] + 6 * k, Hc[0] + 70 * k, Hc[1] + 18 * k);
	g.quadraticCurveTo(Hc[0] + 80 * k, Hc[1] + 36 * k, Hc[0] + 60 * k, Hc[1] + 52 * k);
	g.lineTo(Hc[0] + 30 * k, Hc[1] + 40 * k);
	g.fill();
	// brazo
	g.lineWidth = 60 * k;
	g.beginPath();
	g.moveTo(S[0], S[1]);
	g.lineTo(El[0], El[1]);
	g.stroke();
	g.lineWidth = 44 * k;
	g.beginPath();
	g.moveTo(El[0], El[1]);
	g.lineTo(W2[0], W2[1]);
	g.stroke();
	g.beginPath();
	g.ellipse(W2[0], W2[1], 30 * k, 24 * k, Math.atan2(sh.T[1] - W2[1], sh.T[0] - W2[0]), 0, Math.PI * 2);
	g.fill();
	g.lineWidth = 9 * k;
	g.beginPath();
	g.moveTo(W2[0], W2[1]);
	g.lineTo(sh.T[0], sh.T[1]);
	g.stroke();
};
const paintGuardia = (g: CanvasRenderingContext2D, x0: number) => {
	const G: P = [x0, 380];
	g.fillStyle = '#000';
	g.strokeStyle = '#000';
	g.lineCap = 'round';
	// alabarda a su derecha, apenas inclinada: el asta queda fuera del barco dibujado
	const top: P = [G[0] + 92, G[1] - 210];
	const bot: P = [G[0] + 150, G[1] + 1500];
	g.lineWidth = 14;
	g.beginPath();
	g.moveTo(top[0], top[1]);
	g.lineTo(bot[0], bot[1]);
	g.stroke();
	g.beginPath();
	g.moveTo(top[0] - 4, top[1] - 120);
	g.lineTo(top[0] + 9, top[1] - 30);
	g.lineTo(top[0] - 15, top[1] - 30);
	g.closePath();
	g.fill();
	g.beginPath();
	g.moveTo(top[0] - 2, top[1] - 26);
	g.bezierCurveTo(top[0] + 96, top[1] - 46, top[0] + 112, top[1] + 70, top[0] + 60, top[1] + 96);
	g.bezierCurveTo(top[0] + 46, top[1] + 60, top[0] + 26, top[1] + 46, top[0] + 2, top[1] + 46);
	g.closePath();
	g.fill();
	g.beginPath();
	g.moveTo(top[0] - 2, top[1] - 6);
	g.lineTo(top[0] - 54, top[1] + 10);
	g.lineTo(top[0] - 2, top[1] + 26);
	g.closePath();
	g.fill();
	// tricornio
	g.beginPath();
	g.moveTo(G[0] - 130, G[1] + 40);
	g.quadraticCurveTo(G[0] - 80, G[1] - 20, G[0] + 6, G[1] - 34);
	g.quadraticCurveTo(G[0] + 90, G[1] - 14, G[0] + 140, G[1] + 40);
	g.quadraticCurveTo(G[0], G[1] + 72, G[0] - 130, G[1] + 40);
	g.fill();
	// cabeza, coleta y casaca (angosta del lado del barco)
	g.beginPath();
	g.ellipse(G[0] + 6, G[1] + 110, 62, 78, 0, 0, Math.PI * 2);
	g.fill();
	g.beginPath();
	g.moveTo(G[0] - 50, G[1] + 98);
	g.quadraticCurveTo(G[0] - 84, G[1] + 118, G[0] - 58, G[1] + 132);
	g.fill();
	g.lineWidth = 16;
	g.beginPath();
	g.moveTo(G[0] + 58, G[1] + 120);
	g.quadraticCurveTo(G[0] + 86, G[1] + 160, G[0] + 82, G[1] + 220);
	g.stroke();
	g.beginPath();
	g.moveTo(G[0] - 40, G[1] + 172);
	g.lineTo(G[0] - 104, G[1] + 250);
	g.lineTo(G[0] - 126, G[1] + 1500);
	g.lineTo(G[0] + 270, G[1] + 1500);
	g.lineTo(G[0] + 176, G[1] + 250);
	g.lineTo(G[0] + 54, G[1] + 172);
	g.closePath();
	g.fill();
	// brazo que sostiene la alabarda
	g.lineWidth = 50;
	g.beginPath();
	g.moveTo(G[0] + 150, G[1] + 280);
	g.lineTo(G[0] + 118, G[1] + 470);
	g.stroke();
	g.beginPath();
	g.ellipse(G[0] + 116, G[1] + 470, 30, 24, 0.3, 0, Math.PI * 2);
	g.fill();
};

// ---------- Máscara de disolución: el muro arde desde el dibujo hacia afuera ----------
const MPD = 20; // px de máscara por decímetro sobre el muro de 40 × 38
const MW = 40 * MPD;
const MH = 38 * MPD;
const useDissolveField = () =>
	useMemo(() => {
		const m = new Float32Array(MW * MH);
		for (let py = 0; py < MH; py++)
			for (let px = 0; px < MW; px++) {
				const x = (px + 0.5) / MPD - 20;
				const y = 38 - (py + 0.5) / MPD;
				const d = Math.hypot(x - 0.3, (y - 10.2) * 1.12) / 24;
				const n = 0.5 + 0.5 * (0.65 * noise2D('dis', x * 0.17, y * 0.17) + 0.35 * noise2D('dis2', x * 0.55, y * 0.55));
				m[py * MW + px] = 0.76 * d + 0.24 * n;
			}
		return m;
	}, []);

// ---------- Hook: lienzo + textura que se repinta en cada render (antes de que three dibuje) ----------
const useCanvasTex = (w: number, h: number, srgb = true) => {
	const [cv] = useState(() => {
		const c = document.createElement('canvas');
		c.width = w;
		c.height = h;
		return c;
	});
	const tex = useMemo(() => {
		const t = new THREE.CanvasTexture(cv);
		if (srgb) t.colorSpace = THREE.SRGBColorSpace;
		t.generateMipmaps = false;
		t.minFilter = THREE.LinearFilter;
		t.anisotropy = 4;
		return t;
	}, [cv, srgb]);
	return {cv, tex};
};

// grano del carbón sobre piedra (estático)
const useGrain = (w: number, h: number) =>
	useMemo(() => {
		const c = document.createElement('canvas');
		c.width = w;
		c.height = h;
		const g = c.getContext('2d')!;
		const r = mulberry32(77);
		for (let i = 0; i < (w * h) / 26; i++) {
			g.fillStyle = `rgba(0,0,0,${0.25 + r() * 0.6})`;
			const s = 0.8 + r() * 1.8;
			g.fillRect(r() * w, r() * h, s, s);
		}
		return c;
	}, [w, h]);

const useRye = () => {
	const [ok, setOk] = useState(false);
	const [handle] = useState(() => delayRender('Rye en canvas'));
	useEffect(() => {
		fontsReady
			.then(() => document.fonts.load('400 560px Rye'))
			.then(() => {
				setOk(true);
				continueRender(handle);
			});
	}, [handle]);
	return ok;
};

// ---------- Geometrías de la celda ----------
const archShape = () => {
	const s = new THREE.Shape();
	s.moveTo(-20, 0);
	s.lineTo(20, 0);
	s.lineTo(20, 18);
	s.absarc(0, 18, 20, 0, Math.PI, false);
	s.lineTo(-20, 0);
	return s;
};
const leftWallShape = () => {
	const s = new THREE.Shape();
	s.moveTo(0, 0);
	s.lineTo(32, 0);
	s.lineTo(32, 18);
	s.lineTo(0, 18);
	s.lineTo(0, 0);
	const h = new THREE.Path();
	h.moveTo(WIN.z0, WIN.y0);
	h.lineTo(WIN.z1, WIN.y0);
	h.lineTo(WIN.z1, WIN.y1);
	h.lineTo(WIN.z0, WIN.y1);
	h.lineTo(WIN.z0, WIN.y0);
	s.holes.push(h);
	return s;
};
const jugGeo = new THREE.LatheGeometry(
	[
		[0.01, 0],
		[1.0, 0],
		[1.55, 0.5],
		[1.9, 1.5],
		[1.75, 2.5],
		[1.1, 3.15],
		[0.68, 3.5],
		[0.78, 3.95],
		[0.72, 4.05],
	].map(([x, y]) => new THREE.Vector2(x, y)),
	28,
);
const bowlGeo = new THREE.LatheGeometry(
	[
		[0.01, 0],
		[0.7, 0],
		[1.2, 0.35],
		[1.35, 0.7],
		[1.25, 0.72],
	].map(([x, y]) => new THREE.Vector2(x, y)),
	24,
);

const cupGeo = new THREE.LatheGeometry(
	[
		[0.01, 0],
		[0.42, 0],
		[0.5, 0.12],
		[0.6, 0.55],
		[0.56, 0.86],
		[0.5, 0.86],
		[0.52, 0.56],
	].map(([x, y]) => new THREE.Vector2(x, y)),
	22,
);

let petateTex: THREE.CanvasTexture | null = null;
const getPetate = () => {
	if (petateTex) return petateTex;
	const cv = document.createElement('canvas');
	cv.width = 512;
	cv.height = 512;
	const g = cv.getContext('2d')!;
	const r = mulberry32(5);
	g.fillStyle = '#8a6d3e';
	g.fillRect(0, 0, 512, 512);
	const sz = 16;
	for (let y = 0; y < 512; y += sz)
		for (let x = 0; x < 512; x += sz) {
			const vert = ((x / sz + y / sz) >> 1) % 2 === 0;
			const l = 0.78 + r() * 0.3;
			g.fillStyle = `rgb(${Math.round(176 * l)},${Math.round(142 * l)},${Math.round(84 * l)})`;
			if (vert) g.fillRect(x + 1, y, sz - 2, sz);
			else g.fillRect(x, y + 1, sz, sz - 2);
			g.fillStyle = 'rgba(0,0,0,0.18)';
			if (vert) g.fillRect(x + sz - 2, y, 1, sz);
			else g.fillRect(x, y + sz - 2, sz, 1);
		}
	g.strokeStyle = 'rgba(60,40,20,0.6)';
	g.lineWidth = 6;
	g.strokeRect(4, 4, 504, 504);
	petateTex = new THREE.CanvasTexture(cv);
	petateTex.colorSpace = THREE.SRGBColorSpace;
	return petateTex;
};

// mancha de luna en el piso: la ventana con sus barrotes, proyectada en la dirección del haz
let moonPatchTex: THREE.CanvasTexture | null = null;
const getMoonPatchTex = () => {
	if (moonPatchTex) return moonPatchTex;
	const cv = document.createElement('canvas');
	cv.width = 256;
	cv.height = 256;
	const g = cv.getContext('2d')!;
	const img = g.createImageData(256, 256);
	for (let y = 0; y < 256; y++)
		for (let x = 0; x < 256; x++) {
			const u = (x + 0.5) / 256;
			const v = (y + 0.5) / 256;
			const edge = Math.min(1, Math.min(u, 1 - u) / 0.07) * Math.min(1, Math.min(v, 1 - v) / 0.07);
			let bar = 1;
			for (const b of BARS) bar *= Math.min(1, Math.abs(u - b) / 0.03) ** 2;
			bar *= Math.min(1, Math.abs(v - 0.5) / 0.028) ** 2;
			const n = 0.9 + 0.1 * noise2D('lp', u * 9, v * 9);
			const val = Math.round(255 * Math.max(0, Math.min(1, edge * edge * (3 - 2 * edge) * (0.25 + 0.75 * bar) * n)));
			const i = (y * 256 + x) * 4;
			img.data[i] = img.data[i + 1] = img.data[i + 2] = val;
			img.data[i + 3] = 255;
		}
	g.putImageData(img, 0, 0);
	moonPatchTex = new THREE.CanvasTexture(cv);
	moonPatchTex.colorSpace = THREE.SRGBColorSpace;
	return moonPatchTex;
};
const useMoonPatchGeo = () =>
	useMemo(() => {
		const d = new THREE.Vector3(...BEAM_HIT).sub(new THREE.Vector3(...WIN_C));
		const pos: number[] = [];
		const uv: number[] = [];
		for (const [u, v] of [
			[0, 0],
			[1, 0],
			[1, 1],
			[0, 1],
		]) {
			const y = lerp(WIN.y0, WIN.y1, v);
			const z = lerp(WIN.z0, WIN.z1, u);
			const k = (y - 0.03) / -d.y;
			pos.push(-20 + d.x * k, 0.03, z + d.z * k);
			uv.push(u, v);
		}
		const g = new THREE.BufferGeometry();
		g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
		g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
		g.setIndex([0, 1, 2, 0, 2, 3]);
		return g;
	}, []);

// ---------- El barco en 3D (mismas proporciones que el dibujo) ----------
const Lp = (px: number, py: number): [number, number] => [px * K, -py * K];
const STATIONS: [number, number, number, number][] = [
	// x, borda (y), quilla (y), media manga — en píxeles del dibujo
	[-300, -72, 8, 70],
	[-270, -72, 22, 86],
	[-220, -72, 32, 98],
	[-150, -70, 46, 108],
	[-60, -68, 54, 112],
	[40, -67, 55, 110],
	[130, -69, 47, 100],
	[200, -73, 30, 80],
	[250, -80, 6, 56],
	[285, -88, -28, 28],
	[306, -92, -88, 3],
];
const station = (u: number) => {
	const f = u * (STATIONS.length - 1);
	const i = Math.min(STATIONS.length - 2, Math.floor(f));
	const k = f - i;
	const a = STATIONS[i];
	const b = STATIONS[i + 1];
	const s = (j: number) => a[j] + (b[j] - a[j]) * (k * k * (3 - 2 * k));
	return {x: a[0] + (b[0] - a[0]) * k, top: s(1), bot: s(2), beam: s(3)};
};
let hullTex: THREE.CanvasTexture | null = null;
const getHullTex = () => {
	if (hullTex) return hullTex;
	const cv = document.createElement('canvas');
	cv.width = 1024;
	cv.height = 512;
	const g = cv.getContext('2d')!;
	g.fillStyle = '#3a2414';
	g.fillRect(0, 0, 1024, 512);
	const r = mulberry32(9);
	for (let y = 0; y < 512; y += 18) {
		g.fillStyle = `rgba(${r() > 0.5 ? '255,220,180' : '0,0,0'},${0.04 + r() * 0.05})`;
		g.fillRect(0, y, 1024, 18);
		g.fillStyle = 'rgba(0,0,0,0.35)';
		g.fillRect(0, y, 1024, 1.5);
	}
	for (const [v0, v1] of [
		[0.05, 0.11],
		[0.89, 0.95],
	]) {
		g.fillStyle = '#9a3a22';
		g.fillRect(0, v0 * 512, 1024, (v1 - v0) * 512);
		g.fillStyle = '#d9a03a';
		g.fillRect(0, (v0 < 0.5 ? v1 : v0) * 512 - 3, 1024, 3);
	}
	g.fillStyle = 'rgba(10,8,6,0.55)';
	g.fillRect(0, 0.4 * 512, 1024, 0.2 * 512);
	hullTex = new THREE.CanvasTexture(cv);
	hullTex.colorSpace = THREE.SRGBColorSpace;
	return hullTex;
};
const useHullGeo = () =>
	useMemo(() => {
		const NU = 44;
		const NV = 22;
		const pos: number[] = [];
		const uv: number[] = [];
		const idx: number[] = [];
		for (let i = 0; i <= NU; i++) {
			const st = station(i / NU);
			for (let j = 0; j <= NV; j++) {
				const th = -Math.PI / 2 + (j / NV) * Math.PI;
				const yPx = st.bot + (st.top - st.bot) * Math.pow(1 - Math.cos(th), 0.6);
				const [X, Y] = Lp(st.x, yPx);
				pos.push(X, Y, Math.sin(th) * st.beam * K);
				uv.push(i / NU, j / NV);
			}
		}
		for (let i = 0; i < NU; i++)
			for (let j = 0; j < NV; j++) {
				const a = i * (NV + 1) + j;
				const b = a + NV + 1;
				idx.push(a, b, a + 1, b, b + 1, a + 1);
			}
		const g = new THREE.BufferGeometry();
		g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
		g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
		g.setIndex(idx);
		g.computeVertexNormals();
		// cubierta (tira entre las dos bordas)
		const dp: number[] = [];
		const di: number[] = [];
		for (let i = 0; i <= NU; i++) {
			const st = station(i / NU);
			const [X, Y] = Lp(st.x, st.top + 3);
			dp.push(X, Y, -st.beam * K * 0.97, X, Y, st.beam * K * 0.97);
			if (i < NU) di.push(i * 2, i * 2 + 1, i * 2 + 2, i * 2 + 1, i * 2 + 3, i * 2 + 2);
		}
		const d = new THREE.BufferGeometry();
		d.setAttribute('position', new THREE.Float32BufferAttribute(dp, 3));
		d.setIndex(di);
		d.computeVertexNormals();
		return {hull: g, deck: d};
	}, []);

let sailTex: THREE.CanvasTexture[] | null = null;
const getSailTex = () => {
	if (sailTex) return sailTex;
	sailTex = [false, true].map((emblem) => {
		const cv = document.createElement('canvas');
		cv.width = 512;
		cv.height = 512;
		const g = cv.getContext('2d')!;
		const gr = g.createLinearGradient(0, 0, 0, 512);
		gr.addColorStop(0, '#efe6d2');
		gr.addColorStop(1, '#d8cbb0');
		g.fillStyle = gr;
		g.fillRect(0, 0, 512, 512);
		for (let x = 0; x < 512; x += 46) {
			g.fillStyle = 'rgba(120,100,70,0.25)';
			g.fillRect(x, 0, 2, 512);
		}
		for (let x = 20; x < 512; x += 30) {
			g.fillStyle = 'rgba(90,70,50,0.4)';
			g.fillRect(x, 150, 3, 3);
			g.fillRect(x, 300, 3, 3);
		}
		g.strokeStyle = 'rgba(110,90,60,0.6)';
		g.lineWidth = 8;
		g.strokeRect(4, 4, 504, 504);
		if (emblem) {
			g.save();
			g.translate(256, 270);
			for (let k = 0; k < 8; k++) {
				const a = (k / 8) * Math.PI * 2;
				g.fillStyle = k % 2 ? '#F26D3D' : '#e8582a';
				g.beginPath();
				g.ellipse(Math.cos(a) * 62, Math.sin(a) * 62, 36, 24, a, 0, Math.PI * 2);
				g.fill();
			}
			g.fillStyle = '#F5C242';
			g.beginPath();
			g.arc(0, 0, 40, 0, Math.PI * 2);
			g.fill();
			g.fillStyle = '#A83A25';
			g.beginPath();
			g.arc(0, 0, 16, 0, Math.PI * 2);
			g.fill();
			g.restore();
		}
		const t = new THREE.CanvasTexture(cv);
		t.colorSpace = THREE.SRGBColorSpace;
		return t;
	});
	return sailTex;
};
// vela cuadra: plano curvado. Al alinearse con el dibujo mira al costado (como se dibujó);
// al virar se bracea hasta quedar en cruz, como navega de verdad un barco con viento de popa
const BRACE = 0.32;
const Vela: React.FC<{cx: number; top: number; bot: number; w: number; billow: number; emblem?: boolean; brace: number}> = ({cx, top, bot, w, billow, emblem, brace}) => {
	const [X, Y0] = Lp(cx, top);
	const [, Y1] = Lp(cx, bot);
	const hh = Y0 - Y1;
	const ww = w * K;
	const geo = useMemo(() => {
		const g = new THREE.PlaneGeometry(ww, hh, 12, 12);
		const p = g.attributes.position as THREE.BufferAttribute;
		for (let i = 0; i < p.count; i++) {
			const u = p.getX(i) / ww + 0.5;
			const v = p.getY(i) / hh + 0.5;
			p.setZ(i, -billow * (1 - (2 * u - 1) ** 2) * (0.35 + 0.65 * (1 - (2 * v - 1) ** 2)));
		}
		g.computeVertexNormals();
		return g;
	}, [ww, hh, billow]);
	return (
		<mesh geometry={geo} position={[X, (Y0 + Y1) / 2, 0]} rotation={[0, brace, 0]} castShadow>
			<meshStandardMaterial map={getSailTex()[emblem ? 1 : 0]} side={THREE.DoubleSide} roughness={0.92} emissive="#2a2418" emissiveIntensity={0.25} />
		</mesh>
	);
};
const Tri: React.FC<{a: P; b: P; c: P; billow: number}> = ({a, b, c, billow}) => {
	const geo = useMemo(() => {
		const N = 8;
		const pos: number[] = [];
		const uv: number[] = [];
		const idx: number[] = [];
		const A = Lp(...a);
		const B = Lp(...b);
		const Cc = Lp(...c);
		for (let i = 0; i <= N; i++)
			for (let j = 0; j <= N - i; j++) {
				const u = i / N;
				const v = j / N;
				const w = 1 - u - v;
				pos.push(A[0] * w + B[0] * u + Cc[0] * v, A[1] * w + B[1] * u + Cc[1] * v, -billow * 4 * u * v * w * 6);
				uv.push(u, v);
			}
		let k = 0;
		const row: number[] = [];
		for (let i = 0; i <= N; i++) {
			row.push(k);
			k += N - i + 1;
		}
		for (let i = 0; i < N; i++)
			for (let j = 0; j < N - i; j++) {
				const p0 = row[i] + j;
				const p1 = row[i + 1] + j;
				idx.push(p0, p1, p0 + 1);
				if (j < N - i - 1) idx.push(p1, p1 + 1, p0 + 1);
			}
		const g = new THREE.BufferGeometry();
		g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
		g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
		g.setIndex(idx);
		g.computeVertexNormals();
		return g;
	}, [a[0], a[1], b[0], b[1], c[0], c[1], billow]);
	return (
		<mesh geometry={geo} castShadow>
			<meshStandardMaterial map={getSailTex()[0]} side={THREE.DoubleSide} roughness={0.92} emissive="#2a2418" emissiveIntensity={0.25} />
		</mesh>
	);
};
const Palo: React.FC<{a: P; b: P; r: number; color?: string}> = ({a, b, r, color = '#2a1a10'}) => {
	const A = new THREE.Vector3(...Lp(...a), 0);
	const B = new THREE.Vector3(...Lp(...b), 0);
	const mid = A.clone().add(B).multiplyScalar(0.5);
	const dir = B.clone().sub(A);
	const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.clone().normalize());
	return (
		<mesh position={mid.toArray() as V3} quaternion={q} castShadow>
			<cylinderGeometry args={[r * 0.85, r, dir.length(), 10]} />
			<meshStandardMaterial color={color} roughness={0.8} />
		</mesh>
	);
};
const Verga: React.FC<{cx: number; y: number; w: number; brace: number}> = ({cx, y, w, brace}) => {
	const [X, Y] = Lp(cx, y);
	return (
		<mesh position={[X, Y, 0]} rotation={[0, brace, Math.PI / 2]} castShadow>
			<cylinderGeometry args={[0.7, 0.9, w * K * 1.08, 8]} />
			<meshStandardMaterial color="#2a1a10" roughness={0.8} />
		</mesh>
	);
};
const Banderin: React.FC<{at: P; t: number; color: string}> = ({at, t, color}) => {
	const [X, Y] = Lp(...at);
	const geo = useMemo(() => new THREE.PlaneGeometry(22, 5, 12, 2), []);
	const base = useMemo(() => Float32Array.from(geo.attributes.position.array as Float32Array), [geo]);
	const p = geo.attributes.position as THREE.BufferAttribute;
	for (let i = 0; i < p.count; i++) {
		const x = base[i * 3] + 11;
		const y = base[i * 3 + 1];
		p.setXYZ(i, x, y * (1 - (x / 22) * 0.85), Math.sin(x * 0.35 - t * 7) * 1.4 * (x / 22));
	}
	p.needsUpdate = true;
	return (
		<mesh geometry={geo} position={[X, Y - 2, 0]}>
			<meshStandardMaterial color={color} side={THREE.DoubleSide} roughness={0.8} emissive={color} emissiveIntensity={0.18} />
		</mesh>
	);
};
const RIG: [P, P][] = [
	[
		[-35, -565],
		[292, -86],
	],
	[
		[-35, -565],
		[-300, -168],
	],
	[
		[135, -508],
		[406, -150],
	],
	[
		[-245, -440],
		[-35, -470],
	],
	[
		[-35, -535],
		[-85, -68],
	],
	[
		[-35, -535],
		[11, -68],
	],
	[
		[135, -478],
		[85, -70],
	],
	[
		[135, -478],
		[181, -70],
	],
	[
		[-245, -410],
		[-295, -163],
	],
	[
		[-245, -410],
		[-199, -163],
	],
];
const useRigGeo = () =>
	useMemo(() => {
		const pos: number[] = [];
		for (const [a, b] of RIG) {
			const A = Lp(...a);
			const B = Lp(...b);
			for (const z of [-0.0, 0]) pos.push(A[0], A[1], z, B[0], B[1], z);
		}
		const g = new THREE.BufferGeometry();
		g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
		return g;
	}, []);

const Barco3D: React.FC<{t: number; anim: number; brace: number}> = ({t, anim, brace}) => {
	const {hull, deck} = useHullGeo();
	const rig = useRigGeo();
	const bil = 6 + 6 * anim;
	const [cx0, cy0] = Lp(-305, -160);
	const castleW = 125 * K;
	const castleH = (160 - 72) * K;
	const lantern = Lp(-320, -214);
	const fl = flicker(t, 151);
	const figura = Lp(-248, -160);
	return (
		<>
			<mesh geometry={hull} castShadow receiveShadow>
				<meshStandardMaterial map={getHullTex()} roughness={0.75} side={THREE.DoubleSide} />
			</mesh>
			<mesh geometry={deck} receiveShadow>
				<meshStandardMaterial color="#6a4a2c" roughness={0.85} side={THREE.DoubleSide} />
			</mesh>
			{/* castillo de popa con ventanas encendidas */}
			<mesh position={[cx0 + castleW / 2, cy0 - castleH / 2, 0]} castShadow receiveShadow>
				<boxGeometry args={[castleW, castleH, 66 * K * 2]} />
				<meshStandardMaterial color="#3a2414" roughness={0.75} />
			</mesh>
			{[0, 1, 2].map((i) => (
				<mesh key={i} position={[cx0 + castleW * (0.22 + i * 0.26), cy0 - castleH * 0.45, 66 * K + 0.05]}>
					<planeGeometry args={[castleW * 0.12, castleH * 0.28]} />
					<meshBasicMaterial color="#ffc070" toneMapped={false} />
				</mesh>
			))}
			<mesh position={[cx0 + castleW / 2, cy0 + 2.5, 0]}>
				<boxGeometry args={[castleW, 1.2, 66 * K * 2]} />
				<meshStandardMaterial color="#5a3a20" roughness={0.7} />
			</mesh>
			{/* mástiles, bauprés y vergas */}
			<Palo a={[-245, -165]} b={[-245, -440]} r={1.4} />
			<Palo a={[-35, -70]} b={[-35, -565]} r={1.8} />
			<Palo a={[135, -72]} b={[135, -508]} r={1.6} />
			<Palo a={[292, -86]} b={[408, -152]} r={1.2} />
			<Verga cx={-35} y={-472} w={230} brace={brace} />
			<Verga cx={-35} y={-552} w={140} brace={brace} />
			<Verga cx={135} y={-432} w={180} brace={brace} />
			<Verga cx={135} y={-502} w={114} brace={brace} />
			<mesh position={[Lp(-35, -480)[0], Lp(-35, -480)[1], 0]}>
				<cylinderGeometry args={[6, 6, 1, 14]} />
				<meshStandardMaterial color="#2a1a10" roughness={0.8} />
			</mesh>
			{/* velas */}
			<Vela cx={-35} top={-472} bot={-212} w={232} billow={bil} brace={brace} emblem />
			<Vela cx={-32} top={-552} bot={-480} w={138} billow={bil * 0.6} brace={brace} />
			<Vela cx={138} top={-432} bot={-202} w={184} billow={bil} brace={brace} />
			<Vela cx={137} top={-502} bot={-440} w={112} billow={bil * 0.6} brace={brace} />
			<Tri a={[-335, -196]} b={[-168, -476]} c={[-246, -190]} billow={bil * 0.4} />
			<Tri a={[135, -500]} b={[406, -150]} c={[172, -90]} billow={bil * 0.4} />
			<Banderin at={[-35, -565]} t={t} color={C.terracota} />
			<Banderin at={[135, -508]} t={t + 1} color={C.cempa} />
			<Banderin at={[-245, -440]} t={t + 2} color={C.verde} />
			<lineSegments geometry={rig}>
				<lineBasicMaterial color="#120c08" />
			</lineSegments>
			{/* linterna de popa y la figura que va a bordo */}
			<mesh position={[lantern[0], lantern[1], 0]}>
				<boxGeometry args={[2.2, 2.8, 2.2]} />
				<meshBasicMaterial color="#ffcf80" toneMapped={false} />
			</mesh>
			<pointLight position={[lantern[0], lantern[1], 4]} intensity={900 * fl} distance={160} decay={2} color="#ffb060" />
			<group position={[figura[0], figura[1], 6]}>
				<mesh position={[0, 6.5, 0]} castShadow>
					<coneGeometry args={[3.4, 13, 14]} />
					<meshStandardMaterial color="#141012" roughness={0.9} />
				</mesh>
				<mesh position={[0, 14.2, 0]} castShadow>
					<sphereGeometry args={[1.8, 12, 10]} />
					<meshStandardMaterial color="#141012" roughness={0.9} />
				</mesh>
				<mesh position={[0, 12.6, -0.4]} castShadow>
					<coneGeometry args={[2.9, 5, 12, 1, true]} />
					<meshStandardMaterial color="#2a1a18" roughness={0.9} side={THREE.DoubleSide} />
				</mesh>
			</group>
		</>
	);
};

// pétalos de cempasúchil que deja la estela
const petalGeo = new THREE.CircleGeometry(1, 7).scale(1, 0.6, 1);
const Estela: React.FC<{path: (s: number) => [number, number]; traveled: number; t: number}> = ({path, traveled, t}) => {
	const N = 260;
	const ref = React.useRef<THREE.InstancedMesh>(null);
	const o = new THREE.Object3D();
	const col = new THREE.Color();
	React.useLayoutEffect(() => {
		const m = ref.current;
		if (!m) return;
		for (let i = 0; i < N; i++) {
			const s = hash(i, 1) * traveled;
			const age = traveled - s;
			const [x, z] = path(s);
			const spread = 4 + age * 0.06;
			const vis = age > 8 && age < 1800 ? 1 : 0;
			o.position.set(x + (hash(i, 2) - 0.5) * spread * 2, SEA_Y + 0.35 + Math.sin(t * 2 + i) * 0.2, z + (hash(i, 3) - 0.5) * spread);
			o.rotation.set(-Math.PI / 2, 0, hash(i, 4) * 6.28 + t * 0.2);
			o.scale.setScalar(vis * (3.6 + hash(i, 5) * 2.4) * clamp(1 - age / 1800));
			o.updateMatrix();
			m.setMatrixAt(i, o.matrix);
			col.set(hash(i, 6) > 0.4 ? '#F26D3D' : '#F5A23A');
			m.setColorAt(i, col);
		}
		m.instanceMatrix.needsUpdate = true;
		if (m.instanceColor) m.instanceColor.needsUpdate = true;
	});
	return (
		<instancedMesh ref={ref} args={[petalGeo, undefined, N]}>
			<meshStandardMaterial side={THREE.DoubleSide} roughness={0.8} emissive="#e0601e" emissiveIntensity={1.5} />
		</instancedMesh>
	);
};

// ---------- La celda (muro dibujable, bóveda, ventana con barrotes, vela y utilería) ----------
type CeldaProps = {
	lf: number; // frame local de la celda (o de la revelación)
	t: number;
	cam: V3;
	look: V3;
	drawTex: THREE.Texture;
	drawGlow: number;
	drawFade?: number;
	maskTex: THREE.Texture;
	overTex: THREE.Texture;
	alba: boolean;
	showExt: boolean;
	stick: {pos: V3; quat: THREE.Quaternion} | null;
	ship: {pos: V3; yaw: number; pitch: number; anim: number; brace: number} | null;
	guardLight: number;
	estela: {traveled: number; path: (s: number) => [number, number]} | null;
	sparks: {pts: Float32Array; n: number} | null;
};
const SPARK_MAX = 90;
const Celda: React.FC<CeldaProps> = ({t, cam, look, drawTex, drawGlow, drawFade = 1, maskTex, overTex, alba, showExt, stick, ship, guardLight, estela, sparks}) => {
	const cal = plasterTex('cal15', {
		seed: 15,
		spanX: 12,
		spanY: 20,
		ppu: 128,
		base: '#cdb68f',
		damp: 0.38,
		soot: 0.22,
		cracks: 14,
		chips: [
			[-5.3, 15.4, 0.9],
			[5.1, 1.9, 0.55],
			[-4.7, 1.1, 0.7],
			[5.6, 17.6, 1.0],
			[-0.8, 18.6, 0.8],
		],
		tallies: [
			[3.2, 2.7, 3],
			[-5.3, 12.8, 2],
		],
	});
	const calOsc = plasterTex('cal15b', {seed: 25, spanX: 12, spanY: 20, ppu: 64, base: '#a8916e', damp: 0.45, soot: 0.4, cracks: 18, chips: [[-3, 5, 1.2], [2.5, 12, 1.6], [4.5, 3, 0.9], [-4.4, 16, 1.4]]});
	const floorSt = stoneTex('piso', {rows: 3, base: '#4e4234', mortar: '#1c160f', seed: 16, pores: 40, vari: 0.18, slab: true});
	const mats = useMemo(() => {
		const back = new THREE.MeshStandardMaterial({map: withRepeat(cal.map, 1 / 12, 1 / 20, 0.5, 0), bumpMap: withRepeat(cal.bump, 1 / 12, 1 / 20, 0.5, 0), bumpScale: 0.6, roughness: 0.95, alphaMap: maskTex, alphaTest: 0.5, side: THREE.DoubleSide});
		// el alphaMap usa las mismas UV (x, y) del contorno: se normaliza al muro completo de 40 × 38
		maskTex.repeat.set(1 / 40, 1 / 38);
		maskTex.offset.set(0.5, 0);
		overTex.repeat.set(1 / 40, 1 / 38);
		overTex.offset.set(0.5, 0);
		const side = new THREE.MeshStandardMaterial({map: withRepeat(calOsc.map, 1 / 12, 1 / 20, 0.3, 0.1), bumpMap: withRepeat(calOsc.bump, 1 / 12, 1 / 20, 0.3, 0.1), bumpScale: 0.8, roughness: 0.95, side: THREE.DoubleSide});
		const sideR = new THREE.MeshStandardMaterial({map: withRepeat(calOsc.map, 32 / 12, 18 / 20, 0.1, 0), bumpMap: withRepeat(calOsc.bump, 32 / 12, 18 / 20, 0.1, 0), bumpScale: 0.8, roughness: 0.95, side: THREE.DoubleSide});
		const vault = new THREE.MeshStandardMaterial({map: withRepeat(calOsc.map, 5.2, 1.6), bumpMap: withRepeat(calOsc.bump, 5.2, 1.6), bumpScale: 0.8, roughness: 0.95, side: THREE.DoubleSide, color: '#b8aa98'});
		const floor = new THREE.MeshStandardMaterial({map: withRepeat(floorSt.map, 4, 3.2), bumpMap: withRepeat(floorSt.bump, 4, 3.2), bumpScale: 1.2, roughness: 0.9});
		return {back, side, sideR, vault, floor};
	}, [cal, calOsc, floorSt, maskTex, overTex]);
	const arch = useMemo(() => new THREE.ShapeGeometry(archShape(), 48), []);
	const leftG = useMemo(() => new THREE.ShapeGeometry(leftWallShape(), 4), []);
	const vaultG = useMemo(() => new THREE.CylinderGeometry(20, 20, 32, 40, 1, true, Math.PI / 2, Math.PI), []);
	const sparkGeo = useMemo(() => {
		const g = new THREE.BufferGeometry();
		g.setAttribute('position', new THREE.Float32BufferAttribute(new Float32Array(SPARK_MAX * 3), 3));
		return g;
	}, []);
	if (sparks) {
		(sparkGeo.attributes.position.array as Float32Array).set(sparks.pts.subarray(0, SPARK_MAX * 3));
		sparkGeo.attributes.position.needsUpdate = true;
		sparkGeo.setDrawRange(0, sparks.n);
	}
	const moonDir: V3 = [MOON[0], MOON[1] - SEA_Y, MOON[2]];
	const candleOn = !alba;
	const flk = flicker(t, 1500);
	const beamCol = alba ? '#ffe8c8' : '#9fb6e6';
	const moonPatch = useMoonPatchGeo();
	const beamSrc: V3 = useMemo(() => {
		const d = new THREE.Vector3(...BEAM_HIT).sub(new THREE.Vector3(...WIN_C)).normalize();
		return new THREE.Vector3(...WIN_C).addScaledVector(d, -6).toArray() as V3;
	}, []);
	const beamTarget = useMemo(() => {
		const o = new THREE.Object3D();
		o.position.set(...BEAM_HIT);
		o.updateMatrixWorld();
		return o;
	}, []);
	const dawnTarget = useMemo(() => {
		const o = new THREE.Object3D();
		o.position.set(-0.5, 9.0, 0);
		o.updateMatrixWorld();
		return o;
	}, []);
	const candleTarget = useMemo(() => {
		const o = new THREE.Object3D();
		o.position.set(0.5, 8.5, 0);
		o.updateMatrixWorld();
		return o;
	}, []);
	return (
		<>
			<Camera pos={cam} look={look} fov={FOV} />
			<hemisphereLight args={[alba ? '#8090b0' : '#3a4260', '#160c06', alba ? 0.55 : 0.3]} />
			{/* luz de la vela: foco con sombras hacia el muro + relleno omnidireccional */}
			{candleOn ? (
				<>
					<spotLight position={[FLAME_P[0], FLAME_P[1] + 0.3, FLAME_P[2] + 0.2]} target={candleTarget} angle={1.25} penumbra={1} intensity={290 * flk} distance={0} decay={2} color="#ffb46a" castShadow shadow-mapSize={[1024, 1024]} shadow-bias={-0.0004} shadow-camera-near={0.5} shadow-camera-far={80} />
					<pointLight position={[FLAME_P[0], FLAME_P[1] + 0.3, FLAME_P[2]]} intensity={55 * flk} distance={0} decay={2} color="#ff9e50" />
				</>
			) : null}
			{/* luna: foco tenue (sin sombras) que baña el piso y el cuenco; la mancha con barrotes va pintada en el piso */}
			{!alba ? <spotLight position={beamSrc} target={beamTarget} angle={0.2} penumbra={0.9} intensity={0.9} distance={0} decay={0} color={beamCol} /> : null}
			{/* amanecer: luz tibia que entra por la ventana y baña el muro */}
			{alba ? <spotLight position={[WIN_C[0] - 4, WIN_C[1] + 3, WIN_C[2] + 2]} target={dawnTarget} angle={0.75} penumbra={1} intensity={2.2} distance={0} decay={0} color="#ffd3a4" /> : null}
			{guardLight > 0 ? <pointLight position={[17, 12, 25]} intensity={120 * guardLight * flicker(t, 900)} distance={0} decay={2} color="#ffbe6a" /> : null}
			{/* muro del fondo: se puede disolver */}
			<mesh geometry={arch} material={mats.back} receiveShadow />
			<mesh geometry={arch} position={[0, 0, 0.012]} renderOrder={2}>
				<meshBasicMaterial map={overTex} transparent depthWrite={false} toneMapped={false} />
			</mesh>
			<mesh position={[0, 9.6, LAYER_Z]} renderOrder={3}>
				<planeGeometry args={[10.8, 19.2]} />
				<meshStandardMaterial map={drawTex} emissiveMap={drawTex} emissive="#ffffff" emissiveIntensity={drawGlow} transparent opacity={drawFade} depthWrite={false} roughness={1} />
			</mesh>
			{/* paredes, bóveda y piso */}
			<mesh geometry={leftG} position={[-20, 0, 0]} rotation={[0, -Math.PI / 2, 0]} material={mats.side} receiveShadow castShadow />
			<mesh position={[20, 9, 16]} rotation={[0, -Math.PI / 2, 0]} material={mats.sideR} receiveShadow>
				<planeGeometry args={[32, 18]} />
			</mesh>
			<mesh geometry={vaultG} position={[0, 18, 16]} rotation={[Math.PI / 2, 0, 0]} material={mats.vault} receiveShadow castShadow />
			<mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 16]} material={mats.floor} receiveShadow>
				<planeGeometry args={[40, 32]} />
			</mesh>
			{/* ventana: derrame del muro, barrotes y cielo afuera */}
			{[
				{p: [-26, WIN.y0, WIN_C[2]] as V3, r: [-Math.PI / 2, 0, 0] as V3, s: [12, WIN.z1 - WIN.z0] as [number, number]},
				{p: [-26, WIN.y1, WIN_C[2]] as V3, r: [Math.PI / 2, 0, 0] as V3, s: [12, WIN.z1 - WIN.z0] as [number, number]},
				{p: [-26, WIN_C[1], WIN.z0] as V3, r: [0, 0, 0] as V3, s: [12, WIN.y1 - WIN.y0] as [number, number]},
				{p: [-26, WIN_C[1], WIN.z1] as V3, r: [0, Math.PI, 0] as V3, s: [12, WIN.y1 - WIN.y0] as [number, number]},
			].map((w, i) => (
				<mesh key={i} position={w.p} rotation={w.r} material={mats.side} receiveShadow>
					<planeGeometry args={w.s} />
				</mesh>
			))}
			{BARS.map((u, i) => (
				<mesh key={i} position={[-20.6, WIN_C[1], lerp(WIN.z0, WIN.z1, u)]} castShadow>
					<cylinderGeometry args={[0.2, 0.2, WIN.y1 - WIN.y0, 8]} />
					<meshStandardMaterial color="#1a1614" metalness={0.6} roughness={0.5} />
				</mesh>
			))}
			<mesh position={[-20.6, WIN_C[1], WIN_C[2]]} rotation={[Math.PI / 2, 0, 0]} castShadow>
				<cylinderGeometry args={[0.18, 0.18, WIN.z1 - WIN.z0, 8]} />
				<meshStandardMaterial color="#1a1614" metalness={0.6} roughness={0.5} />
			</mesh>
			<mesh position={[-32.5, WIN_C[1], WIN_C[2]]} rotation={[0, Math.PI / 2, 0]}>
				<planeGeometry args={[WIN.z1 - WIN.z0 + 2, WIN.y1 - WIN.y0 + 2]} />
				<meshBasicMaterial color={alba ? '#c8d4e8' : '#33415f'} toneMapped={false} />
			</mesh>
			<LightShaft from={WIN_C} to={BEAM_HIT} width={WIN.z1 - WIN.z0} cam={cam} color={beamCol} intensity={alba ? 0.08 : 0.045} bars={3} />
			<Dust3D from={WIN_C} to={BEAM_HIT} radius={1.6} t={t} n={150} color={alba ? '#fff2dc' : '#d8e2ff'} opacity={alba ? 0.9 : 0.55} />
			<mesh geometry={moonPatch} renderOrder={1}>
				<meshBasicMaterial map={getMoonPatchTex()} color={alba ? '#c8a888' : '#6f8cc8'} transparent depthWrite={false} blending={THREE.AdditiveBlending} toneMapped={false} />
			</mesh>
			{/* vela sobre su plato de barro */}
			<group position={CANDLE}>
				<mesh position={[0, 0.12, 0]} castShadow receiveShadow>
					<cylinderGeometry args={[1.35, 1.1, 0.24, 24]} />
					<meshStandardMaterial color="#8a4a2a" roughness={0.85} />
				</mesh>
				<mesh position={[0, alba ? 0.55 : 1.18, 0]} castShadow>
					<cylinderGeometry args={[0.5, 0.55, alba ? 0.62 : 1.9, 20]} />
					<meshStandardMaterial color="#efe4cc" roughness={0.55} emissive="#c8682a" emissiveIntensity={candleOn ? 0.32 * flk : 0} />
				</mesh>
				{[0.3, -0.25, 1.9].map((a, i) => (
					<mesh key={i} position={[Math.cos(a) * 0.5, (alba ? 0.7 : 1.9) - i * 0.18, Math.sin(a) * 0.5]} scale={[0.32, 1.3 + i * 0.4, 0.32]}>
						<sphereGeometry args={[0.15, 8, 6]} />
						<meshStandardMaterial color="#f6efe0" roughness={0.4} emissive="#c8682a" emissiveIntensity={candleOn ? 0.3 * flk : 0} />
					</mesh>
				))}
				<mesh position={[0, alba ? 0.92 : 2.2, 0]}>
					<cylinderGeometry args={[0.03, 0.03, 0.22, 6]} />
					<meshStandardMaterial color="#120a06" />
				</mesh>
			</group>
			{candleOn ? <Flame3D pos={FLAME_P} size={0.62} t={t} cam={cam} seed={15} intensity={1.05} /> : null}
			{/* cántaro, cuenco y petate */}
			<mesh geometry={jugGeo} position={JUG} castShadow receiveShadow>
				<meshStandardMaterial color="#76402a" roughness={0.88} />
			</mesh>
			<group position={CUP}>
				<mesh geometry={cupGeo} castShadow receiveShadow>
					<meshStandardMaterial color="#8a4a2c" roughness={0.8} side={THREE.DoubleSide} />
				</mesh>
				<mesh position={[0.62, 0.5, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
					<torusGeometry args={[0.24, 0.07, 8, 16, Math.PI]} />
					<meshStandardMaterial color="#8a4a2c" roughness={0.8} />
				</mesh>
				<mesh position={[0, 0.78, 0]} rotation={[-Math.PI / 2, 0, 0]}>
					<circleGeometry args={[0.5, 24]} />
					<meshStandardMaterial color="#141c2a" roughness={0.08} metalness={0.2} emissive="#2a3a5a" emissiveIntensity={alba ? 0.1 : 0.35} />
				</mesh>
			</group>
			<mesh position={[JUG[0], 3.93, JUG[2]]} rotation={[-Math.PI / 2, 0, 0]}>
				<circleGeometry args={[0.66, 20]} />
				<meshStandardMaterial color="#0e0a08" roughness={0.2} />
			</mesh>
			<group position={BOWL}>
				<mesh geometry={bowlGeo} castShadow receiveShadow>
					<meshStandardMaterial color="#7a4024" roughness={0.85} side={THREE.DoubleSide} />
				</mesh>
				{/* el pan, intacto */}
				<group position={[0, 0.62, 0]} rotation={[0, 0.5, 0]}>
					<mesh scale={[0.95, 0.42, 0.5]} castShadow>
						<sphereGeometry args={[1, 20, 14]} />
						<meshStandardMaterial color="#c4843f" roughness={0.75} />
					</mesh>
					<mesh position={[0, 0.39, 0]} rotation={[0, 0, 0]} scale={[0.62, 0.05, 0.09]}>
						<sphereGeometry args={[1, 12, 8]} />
						<meshStandardMaterial color="#5e3414" roughness={0.9} />
					</mesh>
				</group>
				<mesh position={[0.55, 0.55, 0.35]} rotation={[0.3, -0.6, 0.2]} scale={[0.4, 0.3, 0.32]} castShadow>
					<sphereGeometry args={[1, 14, 10]} />
					<meshStandardMaterial color="#b97a3a" roughness={0.75} />
				</mesh>
			</group>
			<mesh position={[7, 0.04, 10]} rotation={[-Math.PI / 2, 0, 0.22]} receiveShadow>
				<planeGeometry args={[10, 16]} />
				<meshStandardMaterial map={getPetate()} roughness={0.95} />
			</mesh>
			{/* el carbón */}
			{stick ? (
				<mesh position={stick.pos} quaternion={stick.quat} castShadow>
					<cylinderGeometry args={[0.08, 0.11, 0.95, 6]} />
					<meshStandardMaterial color="#141110" roughness={1} flatShading />
				</mesh>
			) : null}
			{/* chispas del muro que arde */}
			{sparks ? (
				<points geometry={sparkGeo}>
					<pointsMaterial size={4} sizeAttenuation={false} color="#ffb050" transparent opacity={0.95} depthWrite={false} blending={THREE.AdditiveBlending} toneMapped={false} />
				</points>
			) : null}
			{/* afuera: el mar, la luna y el barco */}
			{showExt ? (
				<>
					<fog attach="fog" args={['#1b2440', 2500, 34000]} />
					<SkyDome radius={60000} center={[0, SEA_Y, 0]} zenith="#05060f" horizon="#1b2440" glowDir={[MOON[0], MOON[1] - SEA_Y, MOON[2]]} />
					<directionalLight position={[MOON[0] * 0.01, MOON[1] * 0.01, MOON[2] * 0.01]} intensity={1.1} color="#c8d4f0" />
					<directionalLight position={[300, 700, 3000]} intensity={0.75} color="#ffd6a8" />
					<Sea3D y={SEA_Y} t={t} size={120000} center={[0, -40000]} scale={10} calm={0.42} moonDir={moonDir} deep="#050d16" sky="#22304c" moonCol="#f6eedc" fog="#1b2440" fogFar={36000} warmPos={ship ? [ship.pos[0], ship.pos[1] + 20, ship.pos[2]] : [0, 0, 0]} warm={ship ? 0.6 : 0} />
					<Stars3D radius={45000} center={[0, SEA_Y, 0]} t={t} n={1200} minElev={0.03} size={2.1} />
					<Moon3D pos={MOON} radius={MOON_R} cam={cam} />
					{ship ? (
						<group position={ship.pos} rotation={[0, ship.yaw, 0]}>
							<group rotation={[0, 0, ship.pitch]}>
								<Barco3D t={t} anim={ship.anim} brace={ship.brace} />
							</group>
						</group>
					) : null}
					{ship ? <Flame3D pos={lanternFlame(ship)} size={3.2} t={t} cam={cam} seed={77} intensity={1.1} /> : null}
					{estela ? <Estela path={estela.path} traveled={estela.traveled} t={t} /> : null}
				</>
			) : null}
		</>
	);
};
const lanternFlame = (ship: {pos: V3; yaw: number; pitch: number}): V3 => {
	const [lx, ly] = Lp(-320, -214);
	const v = new THREE.Vector3(lx, ly + 1.6, 0).applyAxisAngle(new THREE.Vector3(0, 0, 1), ship.pitch).applyAxisAngle(new THREE.Vector3(0, 1, 0), ship.yaw);
	return [ship.pos[0] + v.x, ship.pos[1] + v.y, ship.pos[2] + v.z];
};

// ---------- Cámara de la celda (un solo plano secuencia de S2 a S5) ----------
const lerp3 = (a: V3, b: V3, k: number): V3 => [lerp(a[0], b[0], k), lerp(a[1], b[1], k), lerp(a[2], b[2], k)];
// S2 mira hacia el piso (cántaro, pan, vela y el carbón); S3 sube al muro y se abre hasta casi el encuadre frontal
const K0: V3 = [0.4, 8.0, 22.0];
const K0B: V3 = [0.3, 7.5, 21.0];
const K0L: V3 = [-0.9, 1.4, 8.0];
const K1: V3 = [1.6, 9.4, 22.5];
const K1L: V3 = [-0.3, 9.8, 0];
const K2: V3 = [0.8, 9.6, 25.6];
const K2L: V3 = [0.15, 9.65, 0];

const camCelda = (lf: number): [V3, V3] => {
	if (lf < 34) return [lerp3(K0, K0B, lf / 34), K0L];
	if (lf < T3) {
		const u = E.inOut(clamp((lf - 34) / (T3 - 34)));
		return [lerp3(K0B, K1, u), lerp3(K0L, K1L, u)];
	}
	if (lf < T4) {
		const u = E.inOut(clamp((lf - T3) / C15.S3));
		return [lerp3(K1, K2, u), lerp3(K1L, K2L, u)];
	}
	const u = E.inOut(clamp((lf - T4) / 40));
	return [lerp3(K2, FRONT, u), lerp3(K2L, FRONT_LOOK, u)];
};

// trayectoria del barco al zarpar (S5)
const shipPath = (s: number): [number, number] => {
	// s = distancia recorrida (dm): primero vira, luego se aleja hacia la luna
	const turn = clamp(s / 700);
	const ang = (Math.PI / 2 - 0.1) * (turn * turn * (3 - 2 * turn));
	const x = SHIP_X + Math.sin(ang * 0.5) * s * 0.18 + s * 0.12;
	const z = SHIP_Z - s * Math.sin(ang * 0.9 + 0.1);
	return [x, z];
};
const shipYawAt = (s: number) => {
	const turn = clamp(s / 700);
	return (Math.PI / 2 - 0.1) * (turn * turn * (3 - 2 * turn));
};
const shipBraceAt = (s: number) => {
	const turn = clamp(s / 520);
	return lerp(BRACE, -1.4, turn * turn * (3 - 2 * turn));
};

// ---------- Escena S2–S5 ----------
const CW = 1080;
const CH = 1920;
const CSC = CW / W;
const Celda2a5: React.FC = () => {
	const lf = useCurrentFrame();
	const t = lf / FPS + 3;
	const field = useDissolveField();
	const grain = useGrain(CW, CH);
	const draw = useCanvasTex(CW, CH);
	const mask = useCanvasTex(MW, MH, false);
	const over = useCanvasTex(MW, MH);
	const low = useMemo(() => {
		const c = document.createElement('canvas');
		c.width = Math.round(CW / 3);
		c.height = Math.round(CH / 3);
		return c;
	}, []);

	// --- tiempos ---
	const prog = drawProg(lf);
	const anim = E.inOut(clamp((lf - (T4 + 70)) / 50));
	const glow = E.inOut(clamp((lf - (T4 + 95)) / 28));
	const thr = lf < T4 + 112 ? -1 : 0.72 * E.inOut(clamp((lf - (T4 + 112)) / 50));
	const showExt = lf >= T4 + 104;
	const s5 = clamp((lf - T5) / C15.S5);
	const traveled = lf < T5 ? 0 : 2600 * E.in(clamp((lf - T5) / C15.S5)) + 40 * s5;

	// --- trazos del dibujo (animados al final) ---
	const strokes = anim > 0 ? allStrokes(anim, t) : STATIC;
	const {tip, lifted} = tipAt(STATIC, Math.min(prog, TOTAL_LEN));
	const {bob, rot} = shipXform(anim, t);

	// --- carbón 3D ---
	let stick: CeldaProps['stick'] = null;
	const hand = new THREE.Vector3(-0.45, -0.35, 0.82).normalize();
	const q0 = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), hand);
	const firstTip: V3 = [wallX(STATIC[0].pts[0][0]), wallY(STATIC[0].pts[0][1]), 0.06];
	const floorP: V3 = STICK0;
	if (lf < DRAW0) {
		const u = E.inOut(clamp((lf - 40) / 52));
		const c1: V3 = [0.4, 3.6, 7.0];
		const c2: V3 = [-2.4, 8.4, 2.4];
		const m = 1 - u;
		const p: V3 = [0, 1, 2].map((i) => m * m * m * floorP[i] + 3 * m * m * u * c1[i] + 3 * m * u * u * c2[i] + u * u * u * firstTip[i]) as V3;
		const flat = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, 0.4, Math.PI / 2));
		stick = {pos: [p[0] + hand.x * 0.47 * u, p[1] + hand.y * 0.47 * u, p[2] + hand.z * 0.47 * u], quat: flat.slerp(q0, clamp(u * 1.4))};
	} else if (lf < T4 + 40) {
		const wx = wallX(tip[0]);
		const wy = wallY(tip[1]);
		const z = 0.06 + lifted * 0.35;
		stick = {pos: [wx + hand.x * 0.47, wy + hand.y * 0.47, z + hand.z * 0.47], quat: q0};
	} else {
		// lo suelta: cae al piso junto al muro
		const last = tipAt(STATIC, TOTAL_LEN).tip;
		const u = clamp((lf - (T4 + 40)) / 14);
		const p0: V3 = [wallX(last[0]), wallY(last[1]), 0.5];
		const p1: V3 = [wallX(last[0]) - 0.5, 0.1, 2.7];
		const y = lerp(p0[1], p1[1], u * u);
		const restQ = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, 1.1, Math.PI / 2));
		stick = {pos: [lerp(p0[0], p1[0], u), y, lerp(p0[2], p1[2], u)], quat: q0.clone().slerp(restQ, u)};
	}

	// --- sombras ---
	const fl = flicker(t, 1500);
	const jit: P = [noise2D('sj', t * 3, 0) * 4 * fl, noise2D('sj', 0, t * 3) * 3];
	let woman: Sombra | null = null;
	let womanA = 0.62;
	if (lf < DRAW0) {
		// punto del muro que queda detrás del carbón, visto desde la cámara: así la sombra de la mano lo sostiene en pantalla
		const [cc] = camCelda(lf);
		const sp = stick!.pos;
		const kz = cc[2] / Math.max(1e-3, cc[2] - sp[2]);
		const stickWall: P = [(cc[0] + (sp[0] - cc[0]) * kz + 5.4) * 100, (19.2 - (cc[1] + (sp[1] - cc[1]) * kz)) * 100];
		const reach = clamp((lf - 8) / 26);
		const handP: P = lf < 40 ? [lerp(160, 420, reach), lerp(1500, 1860, reach)] : [lerp(420, stickWall[0], clamp((lf - 40) / 10)), Math.min(1880, lerp(1860, stickWall[1], clamp((lf - 40) / 10)))];
		const sh: P = [lerp(150, 120, clamp((lf - 40) / 50)), lerp(1180, 870, E.inOut(clamp((lf - 40) / 50)))];
		woman = {S: [sh[0] + jit[0], sh[1] + jit[1]], T: handP, k: 1};
		womanA = 0.62 * clamp(lf / 10);
	} else if (lf < T4 + 75) {
		const sway = Math.sin(t * 0.9) * 6;
		const leave = clamp((lf - (T4 + 30)) / 45);
		// al terminar baja el brazo y espera junto a su barco
		const rest = E.inOut(clamp((lf - (DRAW1 + 4)) / 22));
		const T: P = [lerp(tip[0], 205, rest), lerp(tip[1], 1090, rest)];
		woman = {S: [110 + sway + jit[0] + leave * 140, 860 + jit[1] + leave * 60], T: [T[0] + leave * 120, T[1] + leave * 40], k: 1 - leave * 0.15};
		womanA = 0.62 * (1 - leave);
	}
	const guardX = lf < T4 ? lerp(1500, 985, E.out(clamp((lf - (T3 + 128)) / 34))) : lerp(985, 1560, E.in(clamp((lf - (T4 + 4)) / 30)));
	const guardOn = lf > T3 + 128 && lf < T4 + 36;
	const guardLight = guardOn ? clamp((lf - (T3 + 128)) / 30) * (1 - clamp((lf - (T4 + 4)) / 30)) : 0;
	const fig = E.out(clamp((lf - (T4 + 52)) / 26));

	// máscara + borde encendido
	{
		const key = thr;
		const mg = mask.cv.getContext('2d')!;
		const og = over.cv.getContext('2d')!;
		if ((mask.cv as HTMLCanvasElement & {_k?: number})._k !== key) {
			(mask.cv as HTMLCanvasElement & {_k?: number})._k = key;
			const mi = mg.createImageData(MW, MH);
			const oi = og.createImageData(MW, MH);
			for (let i = 0; i < MW * MH; i++) {
				const d = field[i] - thr;
				// valor continuo: con el filtrado bilineal el corte (alphaTest 0.5) queda suave, sin escalones
				const v = Math.round(255 * clamp(0.5 + d / 0.004));
				mi.data[i * 4] = mi.data[i * 4 + 1] = mi.data[i * 4 + 2] = v;
				mi.data[i * 4 + 3] = 255;
				if (thr > 0 && d > -0.002 && d < 0.07) {
					// brasa junto al borde y cal chamuscada un poco más afuera
					const em = clamp(1 - d / 0.022);
					const ch = clamp(1 - (d - 0.012) / 0.058) ** 1.4;
					const r = lerp(26, 255, em);
					const gg = lerp(13, lerp(120, 236, em), em);
					const b = lerp(6, lerp(30, 150, em * em), em);
					oi.data[i * 4] = Math.round(r);
					oi.data[i * 4 + 1] = Math.round(gg);
					oi.data[i * 4 + 2] = Math.round(b);
					oi.data[i * 4 + 3] = Math.round(255 * Math.max(em, 0.86 * ch));
				}
			}
			mg.putImageData(mi, 0, 0);
			og.putImageData(oi, 0, 0);
			mask.tex.needsUpdate = true;
			over.tex.needsUpdate = true;
		}
	}
	// --- pintar el muro (antes de que three dibuje este frame) ---
	{
		const g = draw.cv.getContext('2d')!;
		g.setTransform(1, 0, 0, 1, 0, 0);
		g.globalCompositeOperation = 'source-over';
		g.clearRect(0, 0, CW, CH);
		g.setTransform(CSC, 0, 0, CSC, 0, 0);
		g.lineCap = 'round';
		g.lineJoin = 'round';
		const ink = glow > 0 ? rgba(mixRGB('#0b0806', '#ff8a2e', glow)) : '#0b0806';
		if (glow > 0) {
			g.save();
			g.filter = 'blur(5px)';
			g.strokeStyle = rgba('#ff9a3a', 0.55 * glow);
			for (const s of strokes) {
				g.lineWidth = s.w * 3.2;
				g.beginPath();
				s.pts.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y)));
				g.stroke();
			}
			g.restore();
		}
		g.strokeStyle = ink;
		drawStrokes(g, strokes, anim > 0 ? Infinity : prog);
		// grano del carbón
		g.setTransform(1, 0, 0, 1, 0, 0);
		g.globalCompositeOperation = 'destination-out';
		g.globalAlpha = glow > 0 ? 0.3 * (1 - glow) : 0.38;
		g.drawImage(grain, 0, 0);
		g.globalAlpha = 1;
		g.globalCompositeOperation = 'source-over';
		g.setTransform(CSC, 0, 0, CSC, 0, 0);
		// ella, diminuta, a bordo del barco dibujado
		if (fig > 0) {
			const pts = toScreen(
				[
					[-256, -196],
					[-248, -196],
					[-242, -178],
					[-238, -161],
					[-268, -161],
					[-262, -178],
				],
				bob,
				rot,
			);
			const head = toScreen([[-252, -203]], bob, rot)[0];
			g.fillStyle = ink;
			g.globalAlpha = fig;
			g.beginPath();
			pts.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y)));
			g.closePath();
			g.fill();
			g.beginPath();
			g.arc(head[0], head[1], 6, 0, Math.PI * 2);
			g.fill();
			g.globalAlpha = 1;
			// polvo de carbón que viaja de su sombra al barco
			const dust = clamp((lf - (T4 + 34)) / 40);
			if (dust > 0 && dust < 1) {
				for (let i = 0; i < 46; i++) {
					const k = clamp(dust * 1.4 - hash(i, 3) * 0.4);
					if (k <= 0 || k >= 1) continue;
					const a: P = [260 + hash(i, 1) * 120, 760 + hash(i, 2) * 260];
					const x = lerp(a[0], head[0], k) + Math.sin(k * 6 + i) * 20 * (1 - k);
					const y = lerp(a[1], head[1] + 12, k) - Math.sin(k * Math.PI) * 90;
					g.fillStyle = rgba('#16100b', 0.8 * Math.sin(Math.PI * k));
					g.beginPath();
					g.arc(x, y, 2 + 3 * (1 - k), 0, Math.PI * 2);
					g.fill();
				}
			}
		}
		// sombras de la vela: ella y el guardia (a baja resolución = bordes suaves)
		if ((woman && womanA > 0.01) || guardOn) {
			const lg = low.getContext('2d')!;
			lg.setTransform(1, 0, 0, 1, 0, 0);
			lg.clearRect(0, 0, low.width, low.height);
			const ls = low.width / W;
			lg.setTransform(ls, 0, 0, ls, 0, 0);
			if (woman && womanA > 0.01) {
				lg.globalAlpha = womanA / 0.62;
				paintMujer(lg, woman);
			}
			if (guardOn) {
				lg.globalAlpha = 1;
				paintGuardia(lg, guardX + jit[0] * 1.5);
			}
			lg.globalAlpha = 1;
			g.setTransform(1, 0, 0, 1, 0, 0);
			g.globalAlpha = 0.62;
			g.imageSmoothingEnabled = true;
			g.drawImage(low, 0, 0, CW, CH);
			g.globalAlpha = 1;
		}
		draw.tex.needsUpdate = true;
	}
	// chispas del borde
	let sparks: CeldaProps['sparks'] = null;
	if (thr > 0 && lf < T5 + 30) {
		const pts = new Float32Array(SPARK_MAX * 3);
		let n = 0;
		for (let i = 0; i < SPARK_MAX; i++) {
			const tb = T4 + 112 + hash(i, 1) * 50;
			const age = (lf - tb) / FPS;
			if (age < 0 || age > 1.1) continue;
			const thrB = 0.72 * E.inOut(clamp((tb - (T4 + 112)) / 50));
			let found = -1;
			for (let k = 0; k < 160; k++) {
				const idx = Math.floor(hash(i * 977 + k, 7) * MW * MH);
				if (Math.abs(field[idx] - thrB) < 0.008) {
					found = idx;
					break;
				}
			}
			if (found < 0) continue;
			const x = (found % MW) / MPD - 20;
			const y = 38 - Math.floor(found / MW) / MPD;
			pts[n * 3] = x + (hash(i, 2) - 0.5) * 3 * age;
			pts[n * 3 + 1] = y + (1.5 + hash(i, 3) * 3) * age - 3 * age * age;
			pts[n * 3 + 2] = 0.2 + (1 + hash(i, 4) * 3) * age;
			n++;
		}
		sparks = {pts, n};
	}

	// --- barco real ---
	let ship: CeldaProps['ship'] = null;
	if (showExt) {
		const [x, z] = shipPath(traveled);
		ship = {pos: [x, SEA_Y - bob * K, z], yaw: shipYawAt(traveled), pitch: -rot, anim, brace: shipBraceAt(traveled)};
	}

	// --- cámara ---
	let cam: V3;
	let look: V3;
	if (lf < T5) {
		[cam, look] = camCelda(lf);
	} else {
		const u = (lf - T5) / C15.S5;
		const a = E.in(clamp(u / 0.45));
		const b = E.out(clamp((u - 0.45) / 0.55));
		const mid: V3 = [0, 4, -70];
		cam = u < 0.45 ? lerp3(FRONT, mid, a) : lerp3(mid, [-14, -36, -620], b);
		const target: V3 = ship ? [ship.pos[0], ship.pos[1] + 70, ship.pos[2]] : FRONT_LOOK;
		look = lerp3(FRONT_LOOK, target, E.inOut(clamp(u * 1.7)));
	}

	return (
		<AbsoluteFill style={{background: 'linear-gradient(180deg, #05060f 0%, #0c1022 40%, #1b2440 50.5%, #0a0c14 100%)'}}>
			<Stage3D fov={FOV} near={1} far={90000}>
				<Celda
					lf={lf}
					t={t}
					cam={cam}
					look={look}
					drawTex={draw.tex}
					drawGlow={glow * 2.2}
					drawFade={1 - E.inOut(clamp((lf - (T5 - 4)) / 22))}
					maskTex={mask.tex}
					overTex={over.tex}
					alba={false}
					showExt={showExt}
					stick={stick}
					ship={ship}
					guardLight={guardLight}
					estela={lf >= T5 ? {traveled, path: shipPath} : null}
					sparks={sparks}
				/>
			</Stage3D>
			<PaperTexture o={0.1} />
			<Kinetic text={'No pidió pan ni agua:\nsolo un trozo de carbón.'} f={lf} at={8} out={84} y={330} size={50} scrim={0.5} />
			<Kinetic text={'Y en el muro dibujó un barco.'} f={lf} at={T3 + 16} out={T3 + 118} y={330} size={50} scrim={0.5} />
			<Kinetic text={'—¿Y qué le falta? —se burló el guardia.'} f={lf} at={T3 + 140} out={T3 + 182} y={1440} size={46} scrim={0.55} />
			<Kinetic text={'—Que navegue.'} f={lf} at={T3 + 190} out={T4 + 28} y={1430} size={66} font="Rye" color={C.flama} stagger={1.6} scrim={0.55} />
			<Kinetic text={'Y subió a bordo…'} f={lf} at={T4 + 46} out={T4 + 122} y={330} size={54} scrim={0.5} />
			<Kinetic text={'…y nunca la volvieron a ver.'} f={lf} at={T5 + 38} out={T5 + 126} y={330} size={54} scrim={0.45} />
			{void H}
		</AbsoluteFill>
	);
};

// ---------- S1 · San Juan de Ulúa desde el mar ----------
const unproject = (pos: V3, look: V3, sx: number, sy: number, dist: number): V3 => {
	const cam = new THREE.PerspectiveCamera(FOV, W / H, 0.1, 10);
	cam.position.set(...pos);
	cam.lookAt(...look);
	cam.updateMatrixWorld();
	cam.updateProjectionMatrix();
	const v = new THREE.Vector3((sx / W) * 2 - 1, 1 - (sy / H) * 2, 0.5).unproject(cam).sub(cam.position).normalize();
	return [pos[0] + v.x * dist, pos[1] + v.y * dist, pos[2] + v.z * dist];
};
const P1A: V3 = [32, 2.2, -200];
const P1B: V3 = [24, 3.0, -122];
const L1A: V3 = [20, 8.5, 0];
const L1B: V3 = [22, 7.6, 0];
// la luna queda bajo el texto, a la izquierda; el faro, a la derecha de la ventana encendida
const MOON1 = unproject(P1A, L1A, 300, 640, 6000);
const FARO: V3 = [6, 0, 38];
const CELL_WIN: V3 = [18, 2.4, -0.05];

const bastionGeo = (() => {
	const s = new THREE.Shape();
	s.moveTo(-16, 0);
	s.lineTo(16, 0);
	s.lineTo(20, 12);
	s.lineTo(0, 30);
	s.lineTo(-20, 12);
	s.lineTo(-16, 0);
	const g = new THREE.ExtrudeGeometry(s, {depth: 15, bevelEnabled: false});
	g.rotateX(-Math.PI / 2);
	// talud: la base es más ancha que la cima
	const p = g.attributes.position as THREE.BufferAttribute;
	for (let i = 0; i < p.count; i++) {
		const y = p.getY(i);
		const k = 1 - (y / 15) * 0.05;
		p.setX(i, p.getX(i) * k);
		p.setZ(i, p.getZ(i) * k);
	}
	g.computeVertexNormals();
	return g;
})();

const Garita: React.FC<{pos: V3}> = ({pos}) => (
	<group position={pos}>
		<mesh position={[0, -1, 0]} rotation={[Math.PI, 0, 0]} castShadow>
			<coneGeometry args={[1.5, 2.2, 16]} />
			<meshStandardMaterial color="#6e6452" roughness={0.95} />
		</mesh>
		<mesh position={[0, 1.4, 0]} castShadow>
			<cylinderGeometry args={[1.45, 1.5, 2.8, 18]} />
			<meshStandardMaterial color="#7a6e5a" roughness={0.95} />
		</mesh>
		<mesh position={[0, 2.8, 0]} castShadow>
			<sphereGeometry args={[1.6, 18, 10, 0, Math.PI * 2, 0, Math.PI / 2]} />
			<meshStandardMaterial color="#6e6452" roughness={0.95} />
		</mesh>
		<mesh position={[0, 4.6, 0]}>
			<sphereGeometry args={[0.28, 8, 6]} />
			<meshStandardMaterial color="#5a5244" roughness={0.9} />
		</mesh>
		{[0, 2.1, 4.2].map((a, i) => (
			<mesh key={i} position={[Math.sin(a) * 1.46, 1.6, Math.cos(a) * 1.46]} rotation={[0, a, 0]}>
				<planeGeometry args={[0.22, 1.1]} />
				<meshBasicMaterial color="#0a0806" />
			</mesh>
		))}
	</group>
);

let foamTex: THREE.CanvasTexture | null = null;
const getFoam = () => {
	if (foamTex) return foamTex;
	const cv = document.createElement('canvas');
	cv.width = 1024;
	cv.height = 64;
	const g = cv.getContext('2d')!;
	const r = mulberry32(12);
	for (let i = 0; i < 900; i++) {
		const x = r() * 1024;
		const y = 32 + (r() - 0.5) * 40 * r();
		g.fillStyle = `rgba(230,236,245,${0.15 + r() * 0.5})`;
		g.beginPath();
		g.ellipse(x, y, 2 + r() * 10, 1 + r() * 3, 0, 0, Math.PI * 2);
		g.fill();
	}
	foamTex = new THREE.CanvasTexture(cv);
	foamTex.wrapS = THREE.RepeatWrapping;
	return foamTex;
};

const Fortaleza: React.FC<{t: number; cam: V3}> = ({t, cam}) => {
	const st = stoneTex('ulua', {rows: 18, base: '#857a66', mortar: '#3a3228', seed: 151, pores: 80, damp: 0.6});
	const m = useMemo(() => {
		const mk = (rx: number, ry: number) => new THREE.MeshStandardMaterial({map: withRepeat(st.map, rx, ry), bumpMap: withRepeat(st.bump, rx, ry), bumpScale: 1.5, roughness: 0.95});
		return {front: mk(15, 0.9), bastion: mk(1 / 16, 1 / 16), top: mk(15, 0.8), tower: mk(1, 1.4)};
	}, [st]);
	const foam = useMemo(() => {
		const f = getFoam().clone();
		f.needsUpdate = true;
		f.repeat.set(8, 1);
		return f;
	}, []);
	foam.offset.x = t * 0.02;
	const fl = flicker(t, 151);
	const merlons: V3[] = [];
	for (let x = -116; x <= 116; x += 3.8) merlons.push([x, 14.1, 0.7]);
	return (
		<>
			{/* roca del islote */}
			<Mountain pos={[0, -5.5, 40]} r={190} h={7} color="#2a2622" seed={15} rough={0.35} scaleZ={0.55} />
			{[
				[-70, -40, 6],
				[60, -30, 5],
				[110, -22, 8],
				[-130, -18, 7],
				[10, -52, 3],
			].map(([x, z, r], i) => (
				<Mountain key={i} pos={[x, -1.4, z]} r={r} h={2.6} color="#24201c" seed={160 + i} rough={0.4} />
			))}
			{/* muralla */}
			<mesh position={[0, 6.5, 0]} rotation={[0, Math.PI, 0]} material={m.front} castShadow receiveShadow>
				<planeGeometry args={[240, 15]} />
			</mesh>
			<mesh position={[0, 6.5, 7]}>
				<boxGeometry args={[240, 15, 13.9]} />
				<meshStandardMaterial color="#3a342c" roughness={1} />
			</mesh>
			<mesh position={[0, 14.05, 0.75]} material={m.top} castShadow>
				<boxGeometry args={[240, 0.9, 1.5]} />
			</mesh>
			{merlons.map((p, i) => (
				<mesh key={i} position={p} castShadow>
					<boxGeometry args={[2.2, 1.4, 1.5]} />
					<meshStandardMaterial color="#7a6f5c" roughness={0.95} />
				</mesh>
			))}
			{/* baluartes con sus garitas */}
			{[-70, 62].map((x, i) => (
				<group key={i} position={[x, -1, 0]}>
					<mesh geometry={bastionGeo} material={m.bastion} castShadow receiveShadow />
					<Garita pos={[0, 16.5, -28.5]} />
					<Garita pos={[i ? -18.5 : 18.5, 16.5, -11]} />
				</group>
			))}
			<Garita pos={[-28, 15.5, -0.8]} />
			{/* el faro de Ulúa: torre esbelta con galería, linterna encendida y haz que barre el mar */}
			<group position={FARO}>
				<mesh position={[0, 13, 0]} material={m.tower} castShadow>
					<cylinderGeometry args={[2.6, 3.4, 26, 20]} />
				</mesh>
				<mesh position={[0, 26.4, 0]} castShadow>
					<cylinderGeometry args={[3.8, 3.8, 0.6, 20]} />
					<meshStandardMaterial color="#5a5248" roughness={0.9} />
				</mesh>
				<mesh position={[0, 28.2, 0]}>
					<cylinderGeometry args={[2.1, 2.1, 3.2, 16]} />
					<meshBasicMaterial color="#ffe0a0" toneMapped={false} />
				</mesh>
				<mesh position={[0, 30.4, 0]} castShadow>
					<coneGeometry args={[2.6, 2.2, 16]} />
					<meshStandardMaterial color="#3a342c" roughness={0.8} />
				</mesh>
				<group position={[0, 28.2, 0]} rotation={[0, t * 0.9 + 2.2, 0]}>
					<mesh position={[0, 0, -260]} rotation={[Math.PI / 2, 0, 0]}>
						<coneGeometry args={[46, 520, 24, 1, true]} />
						<meshBasicMaterial color="#ffe6b0" transparent opacity={0.07} depthWrite={false} side={THREE.DoubleSide} blending={THREE.AdditiveBlending} toneMapped={false} />
					</mesh>
				</group>
			</group>
			<Glow3D pos={[FARO[0], 28.2, FARO[2]]} size={34} cam={cam} color="#ffd690" intensity={0.55 * fl} />
			{/* cordón de cantera y pilastras de la muralla */}
			<mesh position={[0, 10.2, -0.35]} castShadow>
				<boxGeometry args={[240, 0.5, 0.7]} />
				<meshStandardMaterial color="#8f846e" roughness={0.9} />
			</mesh>
			{[-50, -10, 30].map((x, i) => (
				<mesh key={i} position={[x, 6.5, -0.5]} castShadow receiveShadow>
					<boxGeometry args={[2.4, 15, 1]} />
					<meshStandardMaterial color="#7a6f5c" roughness={0.95} />
				</mesh>
			))}
			{/* ventanas oscuras y la de la celda, encendida */}
			{[-96, -70, -18, 46, 72, 98].map((x, i) => (
				<mesh key={i} position={[x, 8.5, -0.06]} rotation={[0, Math.PI, 0]}>
					<planeGeometry args={[1, 1.6]} />
					<meshBasicMaterial color="#0a0806" />
				</mesh>
			))}
			<mesh position={CELL_WIN} rotation={[0, Math.PI, 0]}>
				<planeGeometry args={[1.5, 1.2]} />
				<meshBasicMaterial color={css(mixRGB('#a85a20', '#ffd27a', 0.6 * fl))} toneMapped={false} />
			</mesh>
			{[-0.45, 0, 0.45].map((dx, i) => (
				<mesh key={i} position={[CELL_WIN[0] + dx, CELL_WIN[1], CELL_WIN[2] - 0.06]}>
					<boxGeometry args={[0.09, 1.25, 0.09]} />
					<meshStandardMaterial color="#120c08" />
				</mesh>
			))}
			<pointLight position={[CELL_WIN[0], CELL_WIN[1], CELL_WIN[2] - 2.5]} intensity={60 * fl} distance={0} decay={2} color="#ffa24a" />
			<Glow3D pos={[CELL_WIN[0], CELL_WIN[1], CELL_WIN[2] - 0.3]} size={9} cam={cam} color="#ffb05a" intensity={0.55 * fl} />
			{/* espuma al pie de la muralla */}
			<mesh position={[0, 0.12, -1.2]} rotation={[-Math.PI / 2, 0, 0]}>
				<planeGeometry args={[240, 3]} />
				<meshBasicMaterial map={foam} transparent opacity={0.55} depthWrite={false} />
			</mesh>
		</>
	);
};

const CityLights: React.FC = () => {
	const geo = useMemo(() => {
		const r = mulberry32(3);
		const pos: number[] = [];
		for (let i = 0; i < 260; i++) {
			const x = (r() - 0.5) * 3600;
			if (Math.abs(x) < 260) continue;
			pos.push(x, 1 + r() * 8, 2600 + r() * 900);
		}
		const g = new THREE.BufferGeometry();
		g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
		return g;
	}, []);
	return (
		<points geometry={geo}>
			<pointsMaterial size={2.2} sizeAttenuation={false} color="#ffc27a" transparent opacity={0.8} depthWrite={false} toneMapped={false} />
		</points>
	);
};

const Puerto: React.FC = () => {
	const f = useCurrentFrame();
	const t = f / FPS;
	const u = E.inOut(clamp(f / C15.S1));
	const cam = lerp3(P1A, P1B, u);
	const look = lerp3(L1A, L1B, u);
	const fl = flicker(t, 151);
	return (
		<AbsoluteFill style={{background: 'linear-gradient(180deg, #04050c 0%, #0b0f22 38%, #1a2238 52%, #0a0c14 100%)'}}>
			{/* nubes tenues junto a la luna (muy lejos: siempre detrás de todo) */}
			<svg width={W} height={H} style={{position: 'absolute', inset: 0}}>
				<defs>
					<filter id="c15nube" x="-30%" y="-80%" width="160%" height="260%">
						<feGaussianBlur stdDeviation={14} />
					</filter>
				</defs>
				{[
					[180, 600, 360, 26, 0.32],
					[540, 650, 420, 20, 0.22],
					[300, 430, 300, 16, 0.18],
				].map(([x, y, w, h, o], i) => (
					<ellipse key={i} cx={x + Math.sin(t * 0.1 + i) * 8} cy={y} rx={w} ry={h} fill="#8c96b8" opacity={o} filter="url(#c15nube)" />
				))}
			</svg>
			<Stage3D fov={FOV} near={0.5} far={20000}>
				<Camera pos={cam} look={look} fov={FOV} />
				<fog attach="fog" args={['#161c30', 260, 3200]} />
				<hemisphereLight args={['#56628e', '#0d0a08', 0.95]} />
				<directionalLight position={[60, 40, -300]} intensity={0.45} color="#9aa8d0" />
				<SkyDome radius={15000} center={[0, 0, 0]} zenith="#04050c" horizon="#1a2238" glowDir={[MOON1[0], MOON1[1], MOON1[2]]} />
				<directionalLight position={[MOON1[0] * 0.05, MOON1[1] * 0.05, MOON1[2] * 0.05]} intensity={1.7} color="#c8d2ee" />
				<Sea3D y={0} t={t} size={30000} center={[0, 6000]} scale={1} calm={0.32} moonDir={[MOON1[0], MOON1[1], MOON1[2]]} deep="#03070d" sky="#151d33" moonCol="#f6eedc" fog="#1a2238" fogFar={7000} warmPos={CELL_WIN} warmCol="#ffa04a" warm={1.4 * fl} />
				<Stars3D radius={9000} t={t} n={1100} minElev={0.05} size={2} />
				<Moon3D pos={MOON1} radius={95} cam={cam} />
				<CityLights />
				<Fortaleza t={t} cam={cam} />
			</Stage3D>
			<PaperTexture o={0.1} />
			<Kinetic text={'Cuentan que en San Juan de Ulúa\nencerraron a una mujer sabia.'} f={f} at={14} out={106} y={320} size={50} scrim={0.45} />
		</AbsoluteFill>
	);
};

// ---------- Revelación: al amanecer, en el muro solo quedaba un dibujo ----------
const CW2 = 1080;
const CH2 = 1920;
const Amanecer: React.FC<{dias: number; fecha: string}> = ({dias, fecha}) => {
	const f = useCurrentFrame();
	const t = f / FPS + 30;
	const fontOk = useRye();
	const txt = String(dias);
	const size = numSize(txt);
	const HIT = C15.HIT;
	const draw = useCanvasTex(CW2, CH2);
	const mask = useCanvasTex(4, 4, false);
	const over = useCanvasTex(4, 4);
	const grain = useGrain(CW2, CH2);
	const hatch = useMemo(() => {
		const c = document.createElement('canvas');
		c.width = CW2;
		c.height = CH2;
		return c;
	}, []);
	// máscara del muro: todo en pie
	useMemo(() => {
		const mg = mask.cv.getContext('2d')!;
		mg.fillStyle = '#fff';
		mg.fillRect(0, 0, 4, 4);
		mask.tex.needsUpdate = true;
		over.cv.getContext('2d')!.clearRect(0, 0, 4, 4);
		over.tex.needsUpdate = true;
	}, [mask, over]);
	const ignite = clamp((f - (HIT - 26)) / 30);
	const gold = E.inOut(clamp((f - (HIT + 2)) / 18));
	if (fontOk) {
		const g = draw.cv.getContext('2d')!;
		g.setTransform(1, 0, 0, 1, 0, 0);
		g.globalCompositeOperation = 'source-over';
		g.clearRect(0, 0, CW2, CH2);
		g.font = `400 ${size}px Rye`;
		g.textAlign = 'center';
		g.textBaseline = 'alphabetic';
		const mt = g.measureText(txt);
		const by = NUM_Y + (mt.fontBoundingBoxAscent - mt.fontBoundingBoxDescent) / 2;
		// achurado dentro del número
		const hg = hatch.getContext('2d')!;
		hg.setTransform(1, 0, 0, 1, 0, 0);
		hg.globalCompositeOperation = 'source-over';
		hg.clearRect(0, 0, CW2, CH2);
		hg.strokeStyle = '#16100b';
		hg.lineCap = 'round';
		for (let i = -60; i < 120; i++) {
			const x = i * 11;
			hg.globalAlpha = 0.75;
			hg.lineWidth = 2.6 + (i % 3) * 0.6;
			hg.beginPath();
			hg.moveTo(x, NUM_Y - 360);
			hg.lineTo(x + 420, NUM_Y + 360);
			hg.stroke();
		}
		for (let i = -40; i < 90; i++) {
			const x = i * 19;
			hg.globalAlpha = 0.45;
			hg.lineWidth = 2;
			hg.beginPath();
			hg.moveTo(x + 420, NUM_Y - 360);
			hg.lineTo(x, NUM_Y + 360);
			hg.stroke();
		}
		hg.globalAlpha = 1;
		hg.globalCompositeOperation = 'destination-in';
		hg.font = g.font;
		hg.textAlign = 'center';
		hg.textBaseline = 'alphabetic';
		hg.fillStyle = '#000';
		hg.fillText(txt, 540, by);
		g.drawImage(hatch, 0, 0);
		// contorno a mano
		g.strokeStyle = '#16100b';
		g.lineJoin = 'round';
		for (const [dx, dy, w, a] of [
			[0, 0, 6, 0.9],
			[1.6, 1.1, 3, 0.45],
			[-1.2, 1.4, 2.4, 0.35],
		] as const) {
			g.globalAlpha = a;
			g.lineWidth = w;
			g.strokeText(txt, 540 + dx, by + dy);
		}
		g.globalAlpha = 1;
		// un barquito y la luna, como firma
		const mini = shipLocal(0, 0).map((s) => ({w: s.w * 0.45, pts: s.pts.map(([x, y]) => [906 + x * 0.21, 1090 + y * 0.21] as P)}));
		g.strokeStyle = '#16100b';
		g.lineCap = 'round';
		for (const s of mini) charcoal(g, s.pts, s.w);
		for (let k = 0; k < 2; k++) {
			const pts: P[] = [];
			for (let x = 818; x <= 1008; x += 6) pts.push([x, 1100 + k * 10 + Math.sin(x / 16 + k) * 3]);
			charcoal(g, pts, 2.2);
		}
		charcoal(g, arc(880, 520, 26, -Math.PI * 0.55, Math.PI * 0.55, 16), 3);
		charcoal(g, arc(869, 517, 23, -Math.PI * 0.42, Math.PI * 0.45, 14), 2.6);
		// grano
		g.globalCompositeOperation = 'destination-out';
		g.globalAlpha = 0.55 * (1 - ignite);
		g.drawImage(grain, 0, 0);
		g.globalAlpha = 1;
		g.globalCompositeOperation = 'source-over';
		// el carbón se enciende: un frente de brasa recorre el número de abajo hacia arriba
		if (ignite > 0) {
			const front = lerp(NUM_Y + size * 0.6, NUM_Y - size * 0.62, E.inOut(ignite));
			const wave = (x: number) => front + Math.sin(x / 38 + t * 2) * 18 + Math.sin(x / 13) * 6;
			const clipBelow = (y0: (x: number) => number) => {
				g.beginPath();
				g.moveTo(0, CH2);
				for (let x = 0; x <= CW2; x += 12) g.lineTo(x, y0(x));
				g.lineTo(CW2, CH2);
				g.closePath();
			};
			g.save();
			clipBelow(wave);
			g.clip();
			g.globalCompositeOperation = 'source-atop';
			g.fillStyle = '#ff9a3a';
			g.fillRect(0, 0, CW2, CH2);
			g.restore();
			g.save();
			clipBelow((x) => wave(x) - 26);
			g.clip();
			g.globalCompositeOperation = 'source-atop';
			g.fillStyle = 'rgba(255,240,190,0.9)';
			g.beginPath();
			for (let x = 0; x <= CW2; x += 12) g.lineTo(x, wave(x) - 26);
			for (let x = CW2; x >= 0; x -= 12) g.lineTo(x, wave(x) + 8);
			g.closePath();
			g.fill();
			g.restore();
		}
		draw.tex.needsUpdate = true;
	}
	// cámara: respira un poco y cae justo en la calibración antes del número dorado
	const settle = E.out(clamp(f / (HIT - 12)));
	const cam: V3 = [lerp(0.8, 0, settle), CAM_Y + lerp(0.6, 0, settle), CAM_Z + lerp(5, 0, settle)];
	const look: V3 = [lerp(0.4, 0, settle), CAM_Y, 0];
	const textOut = 58;
	return (
		<AbsoluteFill style={{background: '#0b0806'}}>
			<Stage3D fov={FOV} near={1} far={2000}>
				<Celda lf={f} t={t} cam={cam} look={look} drawTex={draw.tex} drawGlow={0.35 + 2.4 * ignite * (1 - gold * 0.5)} maskTex={mask.tex} overTex={over.tex} alba showExt={false} stick={{pos: [-2.2, 0.1, 1.3], quat: new THREE.Quaternion().setFromEuler(new THREE.Euler(0, 1.1, Math.PI / 2))}} ship={null} guardLight={0} estela={null} sparks={null} />
			</Stage3D>
			<GoldNumber txt={txt} o={gold} glow={0.35 + 0.35 * gold} />
			<Lockup f={f} at={HIT + 4} dias={dias} fecha={fecha} />
			<Kinetic text={'Al amanecer, en el muro\nsolo quedaba un dibujo.'} f={f} at={6} out={textOut} y={300} size={50} scrim={0.5} />
			<PaperTexture o={0.1} />
			<AbsoluteFill style={{background: '#000', opacity: ramp(f, [C15.REV - 8, C15.REV - 1], [0, 1], E.inOut)}} />
		</AbsoluteFill>
	);
};

export const Cap15: React.FC<{dias: number; fecha: string}> = ({dias, fecha}) => {
	const f = useCurrentFrame();
	const a = C15.S1;
	const b = a + CELDA;
	return (
		<AbsoluteFill style={{background: '#000'}}>
			<Sequence durationInFrames={a}>
				<Puerto />
			</Sequence>
			<Sequence from={a} durationInFrames={CELDA}>
				<Celda2a5 />
			</Sequence>
			<Sequence from={b} durationInFrames={C15.REV}>
				<Amanecer dias={dias} fecha={fecha} />
			</Sequence>
			<Dip f={f} at={a} dur={16} />
			<Dip f={f} at={b} dur={16} />
		</AbsoluteFill>
	);
};
