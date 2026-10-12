import React, {useMemo} from 'react';
import {AbsoluteFill, Sequence, useCurrentFrame} from 'remotion';
import {C, E, FPS, H, W, clamp, flicker, hash, lerp, ramp, rgba} from '../lib/util';
import {Flame, Light, PaperTexture, useCanvasDraw} from '../components/core';
import {drawPetal} from '../components/Particles';
import {Pompon} from '../components/Objetos';
import {useGlyph} from '../countdown/reveals';
import {Orb, Ridge, Sky} from './kit/land';
import {Kinetic, Lockup, NUM_Y, numSize} from './kit/type';
import {Dip} from './kit/transitions';
import {drawMonarch} from './c13';
import {Maguey} from './kit/props';

// Capítulo 2 · "El camino" — la víspera se abre la puerta y un camino de pétalos
// se dibuja solo hasta la casa. Visto desde el cielo, el camino escribe el número.
export const C02 = {S1: 114, S2: 108, S3: 72, REV: 132, HIT: 74};
export const C02_LEN = C02.S1 + C02.S2 + C02.S3 + C02.REV;

const HZ = 1010; // horizonte
const DOOR = {x: 540, top: 640, bot: 1560, w: 440};

// ---------- La puerta ----------
const Hoja: React.FC<{side: -1 | 1; open: number}> = ({side, open}) => {
	const w = DOOR.w / 2;
	const h = DOOR.bot - DOOR.top;
	return (
		<div
			style={{
				position: 'absolute',
				left: side < 0 ? DOOR.x - w : DOOR.x,
				top: DOOR.top,
				width: w,
				height: h,
				transformOrigin: side < 0 ? '0% 50%' : '100% 50%',
				transform: `rotateY(${side * -open * 100}deg)`,
				background: 'linear-gradient(90deg, #4a2a16, #6b3e20 45%, #4a2a16)',
				boxShadow: 'inset 0 0 0 10px #2e1a0c, inset 0 0 60px rgba(0,0,0,0.55)',
				backfaceVisibility: 'hidden',
			}}
		>
			{[0, 1, 2].map((k) => (
				<div key={k} style={{position: 'absolute', left: 30, right: 30, top: 40 + k * ((h - 80) / 3), height: (h - 80) / 3 - 30, border: '6px solid #2e1a0c', boxShadow: 'inset 0 0 30px rgba(0,0,0,0.5)', background: 'repeating-linear-gradient(90deg, rgba(0,0,0,0.08) 0 6px, transparent 6px 22px)'}} />
			))}
			<div style={{position: 'absolute', top: h * 0.5, [side < 0 ? 'right' : 'left']: 22, width: 18, height: 60, borderRadius: 9, background: '#1a0d06', boxShadow: '0 0 0 3px #8a6a3a'} as React.CSSProperties} />
		</div>
	);
};

const Exterior: React.FC<{t: number}> = ({t}) => (
	<AbsoluteFill>
		<Sky t={t} top="#05030c" mid="#0f0a1c" horizon="#2a1a26" hy={HZ} stars={140} />
		<Orb x={660} y={760} r={34} color="#EEE2C4" core="#FFFBEF" halo={4} o={0.85} />
		<Ridge seed={21} y={HZ} amp={90} color="#0e0912" rim={C.arena} rimO={0.15} />
		<div style={{position: 'absolute', left: 0, top: HZ, width: W, height: H - HZ, background: 'linear-gradient(180deg, #120c12, #1a100c 50%, #22140c)'}} />
		{Array.from({length: 26}).map((_, i) => (
			<div key={i} style={{position: 'absolute', left: (i < 13 ? 30 : 690) + hash(i, 31) * 360, top: HZ - 4 - hash(i, 32) * 26, width: 4, height: 4, borderRadius: 2, background: '#FFD89A', opacity: 0.45 + 0.4 * Math.sin(t * 3 + i * 2), boxShadow: `0 0 8px ${C.flama}`}} />
		))}
		<svg width={W} height={H} style={{position: 'absolute', inset: 0, overflow: 'visible'}}>
			<Maguey x={60} y={1500} s={1.5} color="#0a0608" />
			<Maguey x={1010} y={1380} s={1.1} color="#0c0709" />
			<Maguey x={170} y={1180} s={0.55} color="#0e090c" />
			<Maguey x={900} y={1110} s={0.4} color="#100a0e" />
			<Maguey x={-20} y={1960} s={2.6} color="#050304" />
		</svg>
	</AbsoluteFill>
);

const Puerta: React.FC = () => {
	const f = useCurrentFrame();
	const t = f / FPS;
	const open = E.inOut(clamp((f - 30) / 50));
	const push = E.in(clamp((f - 84) / 30));
	const fl = flicker(t, 21);
	return (
		<AbsoluteFill style={{background: '#000'}}>
			<AbsoluteFill style={{transform: `scale(${1 + push * 2.4})`, transformOrigin: `${DOOR.x}px ${(DOOR.top + DOOR.bot) / 2 + 120}px`}}>
				{/* lo que se ve por la puerta */}
				<div style={{position: 'absolute', left: DOOR.x - DOOR.w / 2, top: DOOR.top, width: DOOR.w, height: DOOR.bot - DOOR.top, overflow: 'hidden'}}>
					<div style={{position: 'absolute', left: -(DOOR.x - DOOR.w / 2), top: -DOOR.top, width: W, height: H}}>
						<Exterior t={t} />
						{/* luz de la casa sobre la tierra de afuera */}
						<div style={{position: 'absolute', left: DOOR.x - 300 * open, top: DOOR.bot - 300, width: 600 * open, height: 300, background: `radial-gradient(ellipse at 50% 100%, ${rgba(C.flama, 0.5 * open)}, transparent 70%)`}} />
					</div>
				</div>
				{/* muro de adobe, cálido por dentro */}
				<svg width={W} height={H} style={{position: 'absolute', inset: 0}}>
					<defs>
						<radialGradient id="c2muro" cx="50%" cy="70%" r="70%">
							<stop offset="0%" stopColor="#6a3a1c" />
							<stop offset="60%" stopColor="#3a1e0e" />
							<stop offset="100%" stopColor="#140904" />
						</radialGradient>
						<mask id="c2hueco">
							<rect width={W} height={H} fill="#fff" />
							<rect x={DOOR.x - DOOR.w / 2} y={DOOR.top} width={DOOR.w} height={DOOR.bot - DOOR.top} fill="#000" />
						</mask>
					</defs>
					<rect width={W} height={H} fill="url(#c2muro)" mask="url(#c2hueco)" />
					{/* marco de cantera */}
					<path d={`M ${DOOR.x - DOOR.w / 2 - 40} ${DOOR.bot} V ${DOOR.top - 10} H ${DOOR.x + DOOR.w / 2 + 40} V ${DOOR.bot}`} stroke="#8a6a4a" strokeWidth={40} fill="none" />
					<path d={`M ${DOOR.x - DOOR.w / 2 - 60} ${DOOR.top - 40} H ${DOOR.x + DOOR.w / 2 + 60}`} stroke="#9a7a58" strokeWidth={24} />
					{/* piso */}
					<rect x={0} y={DOOR.bot} width={W} height={H - DOOR.bot} fill="#1e0f07" />
					{Array.from({length: 40}).map((_, i) => (
						<circle key={i} cx={hash(i, 1) * W} cy={DOOR.bot + 20 + hash(i, 2) * 300} r={6} fill={i % 2 ? C.cempa : C.terracota} opacity={0.7} />
					))}
				</svg>
				{/* guirnalda sobre el marco */}
				<svg width={W} height={H} style={{position: 'absolute', inset: 0, overflow: 'visible'}}>
					{Array.from({length: 22}).map((_, i) => {
						const u = i / 21;
						const x = lerp(DOOR.x - DOOR.w / 2 - 60, DOOR.x + DOOR.w / 2 + 60, u);
						const y = DOOR.top - 40 + Math.sin(Math.PI * u) * 70;
						return <Pompon key={i} x={x} y={y} r={24 + 6 * hash(i, 4)} lit={0.85 + 0.15 * fl} seed={i} />;
					})}
				</svg>
				<div style={{position: 'absolute', inset: 0, perspective: 1400, perspectiveOrigin: `${DOOR.x}px ${(DOOR.top + DOOR.bot) / 2}px`}}>
					<Hoja side={-1} open={open} />
					<Hoja side={1} open={open} />
				</div>
				{/* rendija de luz antes de abrir */}
				<div style={{position: 'absolute', left: DOOR.x - 3, top: DOOR.top, width: 6, height: DOOR.bot - DOOR.top, background: rgba('#9fb0d8', 0.35 * (1 - open)), filter: 'blur(3px)'}} />
				{/* velas a los lados */}
				{[DOOR.x - DOOR.w / 2 - 130, DOOR.x + DOOR.w / 2 + 130].map((x, i) => (
					<React.Fragment key={i}>
						<Light x={x} y={DOOR.bot - 120} r={420} color={C.flama} o={0.55 * fl} />
						<svg width={W} height={H} style={{position: 'absolute', inset: 0}}>
							<rect x={x - 30} y={DOOR.bot - 110} width={60} height={110} rx={6} fill={C.marfil} />
							<rect x={x - 30} y={DOOR.bot - 60} width={60} height={14} fill={C.cempa} />
						</svg>
						<Flame x={x} y={DOOR.bot - 108} size={72} t={t + i} seed={22 + i} fl={fl} />
					</React.Fragment>
				))}
			</AbsoluteFill>
			<PaperTexture o={0.14} />
			<Kinetic text={'La víspera, se deja\nla puerta abierta.'} f={f} at={10} out={80} y={330} size={50} scrim={0.55} />
		</AbsoluteFill>
	);
};

// ---------- Camino de pétalos en perspectiva ----------
const pathAt = (u: number) => {
	const z = 1 + u * 11;
	const X = Math.sin(u * 7.5 + 0.4) * 420 * Math.min(1, u * 3);
	return {x: 540 + (X / z) * 1.6, y: HZ + 980 / z, s: 1 / z};
};

const Camino: React.FC<{f: number; t: number; reach: number; candles: number; monarchs: number}> = ({f, t, reach, candles, monarchs}) => {
	const ref = useCanvasDraw(
		(ctx) => {
			// pétalos: de cerca hacia el horizonte, conforme avanza `reach`
			const N = 1400;
			const items: [number, number, number, number, number][] = [];
			for (let i = 0; i < N; i++) {
				const u = hash(i, 1) ** 1.3;
				const land = u / Math.max(reach, 1e-4);
				if (land > 1) continue;
				const p = pathAt(u);
				const lat = (hash(i, 2) - 0.5) * 300 * p.s * 1.6;
				// cae desde arriba al llegar el frente del camino
				const age = clamp((reach - u) * 14);
				const fall = (1 - E.out(age)) * 120 * p.s;
				items.push([p.x + lat, p.y - fall, (12 + 10 * hash(i, 3)) * Math.max(p.s * 3.2, 0.25), hash(i, 4) * 6.28, u]);
			}
			items.sort((a, b) => b[4] - a[4]);
			for (const [x, y, s, r, u] of items) {
				const lit = 0.55 + 0.6 * Math.exp(-u * 3) + 0.25 * candles;
				drawPetal(ctx, x, y, s, r, 1, 0.5, lit, hash(Math.round(x * 7), 9));
			}
			// mariposas monarca que vienen por el camino
			for (let k = 0; k < 5; k++) {
				const m = clamp(monarchs * 1.2 - k * 0.12);
				if (m <= 0 || m >= 1) continue;
				const u = 0.95 - m * 0.95;
				const p = pathAt(u);
				const s = clamp(p.s * 4.4, 0.18, 0.75);
				drawMonarch(ctx, p.x + Math.sin(t * 2 + k * 2) * 60 * s + (k - 2) * 50 * s, p.y - 160 * s - Math.sin(t * 3 + k) * 20 * s, s, Math.sin(t * 1.5 + k) * 0.4, t * 10 + k, 0.95);
			}
		},
		[f, reach, candles, monarchs],
	);
	return <canvas ref={ref} width={W} height={H} style={{position: 'absolute', inset: 0}} />;
};

// faroles de vela a lo largo del camino; se encienden de lejos hacia cerca
const VELAS_U = [0.08, 0.17, 0.27, 0.38, 0.5, 0.63, 0.78];
const Faroles: React.FC<{t: number; light: number}> = ({t, light}) => (
	<>
		{VELAS_U.map((u, i) => {
			const side = i % 2 ? 1 : -1;
			const p = pathAt(u);
			const x = p.x + side * 230 * p.s * 1.6;
			const y = p.y;
			const s = p.s * 3.4;
			const g = clamp(light * (VELAS_U.length + 2) - (VELAS_U.length - 1 - i));
			const fl = flicker(t + i, 50 + i);
			return (
				<React.Fragment key={i}>
					{g > 0 ? <Light x={x} y={y - 40 * s} r={300 * s} color={C.flama} o={0.6 * g * fl} /> : null}
					{g > 0 ? (
						<svg width={W} height={H} style={{position: 'absolute', inset: 0}}>
							<rect x={x - 16 * s} y={y - 40 * s * E.out(g)} width={32 * s} height={40 * s * E.out(g)} rx={3 * s} fill={C.cempa} opacity={0.95} />
						</svg>
					) : null}
					{g > 0 ? <Flame x={x} y={y - 38 * s} size={34 * s} t={t + i * 1.3} seed={60 + i} grow={g} fl={fl} wick={false} /> : null}
				</React.Fragment>
			);
		})}
	</>
);

const Afuera: React.FC<{text: string; reach: (f: number) => number; light: (f: number) => number; monarchs: (f: number) => number; t0: number}> = ({text, reach, light, monarchs, t0}) => {
	const f = useCurrentFrame();
	const t = f / FPS + t0;
	const L = light(f);
	return (
		<AbsoluteFill>
			<Exterior t={t} />
			<Light x={540} y={H} r={700} sy={0.5} color={C.flama} o={0.45} />
			<Faroles t={t} light={L} />
			<Camino f={f} t={t} reach={reach(f)} candles={L} monarchs={monarchs(f)} />
			<PaperTexture o={0.14} />
			<Kinetic text={text} f={f} at={10} out={text.includes('vienen') ? 200 : 96} y={330} size={50} scrim={0.55} />
		</AbsoluteFill>
	);
};

// ---------- Desde arriba: el camino escribe el número ----------
const Trazo: React.FC<{dias: number; fecha: string}> = ({dias, fecha}) => {
	const f = useCurrentFrame();
	const t = f / FPS + 20;
	const txt = String(dias);
	const size = numSize(txt);
	const HIT = C02.HIT;
	const g = useGlyph(txt, size, 17, 2);
	// recorrido continuo por los puntos del glifo (vecino más cercano), como si alguien caminara
	const order = useMemo(() => {
		if (!g) return [] as number[];
		const pts = g.pts;
		const used = new Uint8Array(pts.length);
		let cur = pts.reduce((m, p, i) => (p[1] > pts[m][1] || (p[1] === pts[m][1] && p[0] < pts[m][0]) ? i : m), 0);
		const out: number[] = [];
		for (let k = 0; k < pts.length; k++) {
			out.push(cur);
			used[cur] = 1;
			let best = -1;
			let bd = 1e12;
			for (let j = 0; j < pts.length; j++) {
				if (used[j]) continue;
				const d = (pts[j][0] - pts[cur][0]) ** 2 + (pts[j][1] - pts[cur][1]) ** 2;
				if (d < bd) [bd, best] = [d, j];
			}
			if (best < 0) break;
			cur = best;
		}
		return out;
	}, [g]);
	const DRAW = [16, HIT - 6];
	const prog = clamp((f - DRAW[0]) / (DRAW[1] - DRAW[0]));
	const ref = useCanvasDraw(
		(ctx) => {
			// tierra
			ctx.fillStyle = '#1b110b';
			ctx.fillRect(0, 0, W, H);
			for (let i = 0; i < 260; i++) {
				ctx.fillStyle = rgba(i % 3 ? '#2a1c12' : '#120a06', 0.6);
				ctx.beginPath();
				ctx.ellipse(hash(i, 1) * W, hash(i, 2) * H, 14 + 30 * hash(i, 3), 8 + 14 * hash(i, 4), hash(i, 5) * 3, 0, Math.PI * 2);
				ctx.fill();
			}
			// el camino llega desde la puerta (abajo) hasta el inicio del número
			if (!g || !order.length) return;
			const start = g.pts[order[0]];
			const sx = 540 + start[0];
			const sy = NUM_Y + start[1];
			const lead = clamp(f / 18);
			for (let i = 0; i < 90; i++) {
				const u = i / 90;
				if (u > lead) break;
				const x = lerp(540, sx, u) + Math.sin(u * 9) * 40 * (1 - u) + (hash(i, 7) - 0.5) * 50;
				const y = lerp(H + 40, sy, u) + (hash(i, 8) - 0.5) * 20;
				drawPetal(ctx, x, y, 18, hash(i, 9) * 6.28, 1, 0.5, 0.9, hash(i, 10));
			}
			const n = Math.floor(prog * order.length);
			for (let k = 0; k < n; k++) {
				const [gx, gy] = g.pts[order[k]];
				const age = clamp((prog * order.length - k) / 10);
				const s = 17 + 7 * hash(k, 3);
				const drop = (1 - E.out(age)) * 30;
				drawPetal(ctx, 540 + gx + (hash(k, 1) - 0.5) * 8, NUM_Y + gy + (hash(k, 2) - 0.5) * 8 - drop, s, hash(k, 4) * 6.28, 1, 0.5, 0.95 + 0.2 * (1 - age), hash(k, 5));
			}
			// la cabeza del camino: una luz que va caminando
			if (prog > 0 && prog < 1) {
				const [hx, hy] = g.pts[order[Math.min(n, order.length - 1)]];
				const x = 540 + hx;
				const y = NUM_Y + hy;
				const gr = ctx.createRadialGradient(x, y, 0, x, y, 90);
				gr.addColorStop(0, rgba('#FFF4D6', 0.9));
				gr.addColorStop(0.2, rgba(C.flama, 0.6));
				gr.addColorStop(1, rgba(C.cempa, 0));
				ctx.globalCompositeOperation = 'lighter';
				ctx.fillStyle = gr;
				ctx.fillRect(x - 90, y - 90, 180, 180);
				ctx.globalCompositeOperation = 'source-over';
			}
		},
		[f, g, order, prog],
	);
	const glow = ramp(f, [HIT - 10, HIT + 12], [0, 1], E.inOut);
	// la luz de la puerta abajo
	return (
		<AbsoluteFill style={{background: '#1b110b'}}>
			<canvas ref={ref} width={W} height={H} style={{position: 'absolute', inset: 0}} />
			<div style={{position: 'absolute', left: 340, top: H - 120, width: 400, height: 240, background: `radial-gradient(ellipse at 50% 70%, ${rgba('#FFE2A0', 0.7)}, transparent 70%)`, mixBlendMode: 'screen'}} />
			<div style={{position: 'absolute', left: 0, width: W, top: NUM_Y - size / 2, height: size, lineHeight: `${size}px`, textAlign: 'center', fontFamily: 'Rye', fontSize: size, color: C.flama, filter: 'blur(30px)', opacity: 0.5 * glow, mixBlendMode: 'screen'}}>
				{txt}
			</div>
			<AbsoluteFill style={{opacity: glow, background: 'linear-gradient(180deg, transparent 17%, rgba(10,5,3,0.7) 21%, rgba(10,5,3,0.7) 27%, transparent 31%, transparent 57%, rgba(10,5,3,0.75) 60%, rgba(10,5,3,0.75) 70%, transparent 74%)'}} />
			<Lockup f={f} at={HIT + 2} dias={dias} fecha={fecha} />
			<PaperTexture o={0.14} />
			<AbsoluteFill style={{background: '#000', opacity: ramp(f, [C02.REV - 8, C02.REV - 1], [0, 1], E.inOut)}} />
			{void t}
		</AbsoluteFill>
	);
};

export const Cap02: React.FC<{dias: number; fecha: string}> = ({dias, fecha}) => {
	const f = useCurrentFrame();
	const a = C02.S1;
	const b = a + C02.S2;
	const c = b + C02.S3;
	return (
		<AbsoluteFill style={{background: '#000'}}>
			<Sequence durationInFrames={a}>
				<Puerta />
			</Sequence>
			<Sequence from={a} durationInFrames={C02.S2}>
				<Afuera text={'Un camino de pétalos\npara que nadie se pierda.'} reach={(ff) => E.inOut(clamp(ff / 96))} light={() => 0} monarchs={() => 0} t0={4} />
			</Sequence>
			<Sequence from={b} durationInFrames={C02.S3}>
				<Afuera text={'Ya vienen en camino.'} reach={() => 1} light={(ff) => clamp(ff / 50)} monarchs={(ff) => clamp(ff / 72)} t0={8} />
			</Sequence>
			<Sequence from={c} durationInFrames={C02.REV}>
				<Trazo dias={dias} fecha={fecha} />
			</Sequence>
			<Dip f={f} at={a} dur={10} />
			<Dip f={f} at={c} dur={12} />
		</AbsoluteFill>
	);
};
