import React, {useEffect, useState} from 'react';
import {AbsoluteFill, continueRender, delayRender, spring, useCurrentFrame} from 'remotion';
import {noise2D} from '@remotion/noise';
import {C, E, FPS, H, W, clamp, curl, flicker, hash, lerp, mixRGB, ramp, rgba} from '../lib/util';
import {fontsReady} from '../lib/fonts';
import {Light, PaperTexture, useCanvasDraw} from '../components/core';
import {Bokeh, Embers, drawPetal} from '../components/Particles';
import {SceneE} from '../scenes/SceneE';

// Momento en que el número queda completo, por estilo (frames locales de la revelación).
// make_countdown_audio.py usa estos mismos valores para el golpe grave.
export const HIT: Record<string, number> = {petalos: 74, velas: 86, papel: 62, brasas: 80, altar: 75};

const NUM_Y = 860; // centro vertical del número
const numSize = (txt: string) => (txt.length > 1 ? 560 : 660);

// ---------- Muestreo del glifo (Rye) ----------
type Glyph = {pts: [number, number][]};
const cache = new Map<string, Glyph>();
const sampleGlyph = (txt: string, size: number, step: number, erode: number): Glyph => {
	const key = `${txt}|${size}|${step}|${erode}`;
	const hit = cache.get(key);
	if (hit) return hit;
	const w = Math.ceil(size * 0.8 * txt.length + size * 0.4);
	const h = Math.ceil(size * 1.3);
	const c = document.createElement('canvas');
	c.width = w;
	c.height = h;
	const g = c.getContext('2d')!;
	g.fillStyle = '#fff';
	g.font = `400 ${size}px Rye`;
	g.textAlign = 'center';
	g.textBaseline = 'middle';
	g.fillText(txt, w / 2, h / 2);
	const d = g.getImageData(0, 0, w, h).data;
	const inside = (x: number, y: number) => x >= 0 && y >= 0 && x < w && y < h && d[(y * w + x) * 4 + 3] > 128;
	const pts: [number, number][] = [];
	for (let y = 0; y < h; y += step) {
		const row = Math.round(y / step);
		for (let x = row % 2 ? step / 2 : 0; x < w; x += step) {
			const xi = Math.round(x);
			if (!inside(xi, y)) continue;
			if (erode > 0 && !(inside(xi + erode, y) && inside(xi - erode, y) && inside(xi, y + erode) && inside(xi, y - erode))) continue;
			pts.push([xi - w / 2, y - h / 2]);
		}
	}
	const out = {pts};
	cache.set(key, out);
	return out;
};

const useGlyph = (txt: string, size: number, step: number, erode = 0) => {
	const [g, setG] = useState<Glyph | null>(null);
	const [handle] = useState(() => delayRender('glifo ' + txt));
	useEffect(() => {
		fontsReady
			.then(() => document.fonts.load(`400 ${size}px Rye`))
			.then(() => {
				setG(sampleGlyph(txt, size, step, erode));
				continueRender(handle);
			});
	}, [txt, size, step, erode, handle]);
	return g;
};

// ---------- Rótulos "FALTAN" / "DÍAS" / fecha ----------
export const Labels: React.FC<{lf: number; hit: number; dias: number; fecha: string; top?: number; bottom?: number}> = ({lf, hit, dias, fecha, top = 400, bottom = 1150}) => {
	const pF = spring({frame: lf - hit + 4, fps: FPS, config: {stiffness: 90, damping: 19}});
	const pD = spring({frame: lf - hit - 2, fps: FPS, config: {stiffness: 90, damping: 19}});
	const pS = spring({frame: lf - hit - 10, fps: FPS, config: {stiffness: 80, damping: 18}});
	const center: React.CSSProperties = {position: 'absolute', left: 0, width: W, textAlign: 'center'};
	return (
		<>
			<div
				style={{
					...center,
					top,
					fontFamily: 'Rye',
					fontSize: 66,
					letterSpacing: `${lerp(0.5, 0.26, pF)}em`,
					paddingLeft: `${lerp(0.5, 0.26, pF)}em`,
					color: C.arena,
					opacity: clamp(pF),
					transform: `translateY(${(1 - pF) * -24}px)`,
					textShadow: `0 0 18px ${rgba(C.cempa, 0.5)}, 0 2px 8px rgba(0,0,0,0.8)`,
				}}
			>
				{dias === 1 ? 'FALTA' : 'FALTAN'}
			</div>
			<div
				style={{
					...center,
					top: bottom,
					fontFamily: 'Rye',
					fontSize: 100,
					letterSpacing: '0.12em',
					paddingLeft: '0.12em',
					color: C.marfil,
					opacity: clamp(pD),
					transform: `translateY(${(1 - pD) * 28}px)`,
					textShadow: `0 0 22px ${rgba(C.cempa, 0.55)}, 0 2px 8px rgba(0,0,0,0.8)`,
				}}
			>
				{dias === 1 ? 'DÍA' : 'DÍAS'}
			</div>
			<div style={{...center, top: bottom + 132, opacity: clamp(pS) * 0.95, transform: `translateY(${(1 - pS) * 14}px)`}}>
				<div style={{display: 'inline-flex', alignItems: 'center', gap: 22}}>
					<div style={{width: lerp(0, 90, pS), height: 1.5, background: rgba(C.arena, 0.7)}} />
					<div style={{fontFamily: 'Alike', fontSize: 42, letterSpacing: '0.18em', color: C.arena, textShadow: '0 2px 10px rgba(0,0,0,0.9)'}}>{fecha}</div>
					<div style={{width: lerp(0, 90, pS), height: 1.5, background: rgba(C.arena, 0.7)}} />
				</div>
			</div>
		</>
	);
};

// Número sólido con degradado de brasa (refuerza la lectura sobre los medios "sueltos").
const EmberNumber: React.FC<{txt: string; o: number; blur?: number}> = ({txt, o, blur = 0}) => (
	<div
		style={{
			position: 'absolute',
			left: 0,
			width: W,
			top: NUM_Y - numSize(txt) * 0.5,
			height: numSize(txt),
			lineHeight: `${numSize(txt)}px`,
			textAlign: 'center',
			fontFamily: 'Rye',
			fontSize: numSize(txt),
			backgroundImage: `linear-gradient(180deg, #FFF0B8 0%, ${C.flama} 30%, ${C.cempa} 66%, ${C.terracota} 100%)`,
			WebkitBackgroundClip: 'text',
			backgroundClip: 'text',
			color: 'transparent',
			opacity: o,
			filter: blur ? `blur(${blur}px)` : undefined,
		}}
	>
		{txt}
	</div>
);

const Backdrop: React.FC<{fl: number; t: number; k?: number}> = ({fl, t, k = 1}) => (
	<>
		<AbsoluteFill style={{background: 'linear-gradient(180deg,#060302,#120803 55%,#050201)'}} />
		<Light x={540} y={NUM_Y} r={1000} color={C.cempa} o={0.32 * fl * k} />
		<Bokeh t={t} L={0.6 * fl * k} n={16} seed={71} area={[0, 100, W, 1600]} blur={4} />
	</>
);

// ---------- 1. Pétalos que forman el número ----------
const PetalosReveal: React.FC<{dias: number; fecha: string; variante?: string}> = ({dias, fecha, variante = 'cae'}) => {
	const lf = useCurrentFrame();
	const t = lf / FPS;
	const fl = flicker(t + 30, 61);
	const txt = String(dias);
	const g = useGlyph(txt, numSize(txt), 16);
	const hit = HIT.petalos;
	const ref = useCanvasDraw(
		(ctx) => {
			if (!g) return;
			const n = g.pts.length;
			for (let i = 0; i < n; i++) {
				const r = (q: number) => hash(i * 13 + q, 97 + dias);
				const [gx, gy] = g.pts[i];
				const tx = 540 + gx + (r(1) - 0.5) * 6;
				const ty = NUM_Y + gy + (r(2) - 0.5) * 6;
				// llegada escalonada de arriba hacia abajo + azar
				const delay = 4 + ((gy + 300) / 600) * 34 + r(3) * 18;
				const a = E.out(clamp((lf - delay) / 32));
				let sx: number;
				let sy: number;
				let rot: number;
				let fx: number;
				if (variante === 'remolino') {
					const ang = r(4) * 6.283 + t * (1.6 + r(5));
					const rad = 640 + 380 * r(6) - t * 60;
					sx = 540 + Math.cos(ang) * rad;
					sy = NUM_Y + Math.sin(ang) * rad * 1.25;
					rot = ang + 1.57;
					fx = Math.cos(ang * 2);
				} else {
					const v = 160 + 120 * r(4);
					sx = tx + (r(5) - 0.5) * 500 + 60 * Math.sin(t * 2 + i);
					sy = -60 - r(6) * 700 + v * t * 3.0;
					rot = r(7) * 6.28 + t * (1 + r(8));
					fx = Math.cos(r(9) * 6 + t * 3);
				}
				const x = lerp(sx, tx, a);
				const y = lerp(sy, ty, a);
				const finalRot = r(10) * 6.28;
				const rr = lerp(rot, finalRot, a);
				const ffx = lerp(fx, 1, a);
				const glow = lf > hit ? 0.08 * Math.sin((lf - hit) * 0.18 - gy * 0.01) : 0;
				const lit = (0.8 + 0.25 * fl + glow) * (0.85 + 0.25 * r(11)) * (0.55 + 0.45 * clamp(a * 1.5));
				drawPetal(ctx, x, y, 21 + 6 * r(12), rr, ffx, 0.85, lit, r(13));
			}
		},
		[g, lf],
	);
	return (
		<AbsoluteFill style={{background: '#040201'}}>
			<Backdrop fl={fl} t={t} />
			<EmberNumber txt={txt} o={ramp(lf, [hit - 10, hit + 20], [0, 0.35], E.out)} blur={26} />
			<canvas ref={ref} width={W} height={H} style={{position: 'absolute', inset: 0}} />
			<PaperTexture o={0.2} />
			<Labels lf={lf} hit={hit} dias={dias} fecha={fecha} />
		</AbsoluteFill>
	);
};

// ---------- 2. Velas que escriben el número ----------
const VelasReveal: React.FC<{dias: number; fecha: string; variante?: string}> = ({dias, fecha, variante = 'cenital'}) => {
	const lf = useCurrentFrame();
	const t = lf / FPS;
	const txt = String(dias);
	const g = useGlyph(txt, numSize(txt), 36, 8);
	const hit = HIT.velas;
	const theta = ((variante === 'cenital' ? 42 : 14) * Math.PI) / 180;
	const ref = useCanvasDraw(
		(ctx) => {
			if (!g) return;
			const D = 1500;
			// orden de encendido: dígito por dígito, de arriba hacia abajo
			const order = g.pts
				.map((p, i) => ({p, i, k: (p[0] > 0 && txt.length > 1 ? 1 : 0) * 10000 + p[1] + p[0] * 0.05}))
				.sort((a, b) => a.k - b.k);
			const N = order.length;
			const proj = (gx: number, gy: number) => {
				const z = D + gy * Math.sin(theta);
				const s = D / z;
				return [540 + gx * s, NUM_Y + 40 + gy * Math.cos(theta) * s, s] as const;
			};
			const items = order.map((o, k) => {
				const [x, y, s] = proj(o.p[0], o.p[1]);
				const ign = 10 + (k / Math.max(1, N - 1)) * 70;
				const gIn = clamp((lf - ign) / 7);
				return {x, y, s, gIn, i: o.i, k};
			});
			const litCount = items.reduce((a, b) => a + b.gIn, 0) / N;
			// piso iluminado
			const gr = ctx.createRadialGradient(540, NUM_Y + 60, 0, 540, NUM_Y + 60, 900);
			gr.addColorStop(0, rgba(C.cempa, 0.32 * litCount));
			gr.addColorStop(1, rgba(C.cempa, 0));
			ctx.fillStyle = gr;
			ctx.fillRect(0, 0, W, H);
			items.sort((a, b) => a.y - b.y);
			for (const it of items) {
				const r = (q: number) => hash(it.i * 11 + q, 300 + dias);
				const fl = flicker(t + r(1) * 9, it.i);
				const w = 25 * it.s;
				const h = 30 * it.s;
				const glass = [C.cempa, C.terracota, C.verde, C.flama][Math.floor(r(2) * 4)];
				const lit = 0.15 + 0.85 * it.gIn * fl;
				// vaso
				ctx.fillStyle = 'rgba(0,0,0,0.45)';
				ctx.beginPath();
				ctx.ellipse(it.x + 3, it.y + 2, w * 0.75, w * 0.22, 0, 0, Math.PI * 2);
				ctx.fill();
				const gg = ctx.createLinearGradient(0, it.y - h, 0, it.y);
				gg.addColorStop(0, rgba(mixRGB(C.ink, C.flama, lit)));
				gg.addColorStop(1, rgba(mixRGB(C.ink, glass, 0.25 + 0.6 * lit)));
				ctx.fillStyle = gg;
				ctx.fillRect(it.x - w / 2, it.y - h, w, h);
				ctx.fillStyle = rgba('#FFF2C8', 0.5 * lit);
				ctx.beginPath();
				ctx.ellipse(it.x, it.y - h, w / 2, w * 0.18, 0, 0, Math.PI * 2);
				ctx.fill();
				if (it.gIn <= 0) continue;
				// llama
				const fh = 30 * it.s * (0.6 + 0.4 * it.gIn + (it.gIn < 1 ? 0.35 * Math.sin(it.gIn * Math.PI) : 0)) * (0.85 + 0.15 * fl);
				const sway = noise2D('vs', it.i, t * 2) * 3 * it.s;
				ctx.save();
				ctx.globalCompositeOperation = 'lighter';
				const halo = ctx.createRadialGradient(it.x, it.y - h - fh * 0.4, 0, it.x, it.y - h - fh * 0.4, 70 * it.s);
				halo.addColorStop(0, rgba(C.flama, 0.5 * it.gIn * fl));
				halo.addColorStop(0.35, rgba(C.cempa, 0.18 * it.gIn * fl));
				halo.addColorStop(1, rgba(C.cempa, 0));
				ctx.fillStyle = halo;
				ctx.fillRect(it.x - 70 * it.s, it.y - h - fh * 0.4 - 70 * it.s, 140 * it.s, 140 * it.s);
				ctx.translate(it.x, it.y - h + 2);
				const fg = ctx.createLinearGradient(0, 0, 0, -fh);
				fg.addColorStop(0, 'rgba(255,250,232,1)');
				fg.addColorStop(0.35, rgba(C.flama, 0.95));
				fg.addColorStop(1, rgba(C.cempa, 0));
				ctx.fillStyle = fg;
				ctx.beginPath();
				ctx.moveTo(0, 0);
				ctx.bezierCurveTo(-fh * 0.32, -fh * 0.05, -fh * 0.22, -fh * 0.55, sway, -fh);
				ctx.bezierCurveTo(fh * 0.22, -fh * 0.55, fh * 0.32, -fh * 0.05, 0, 0);
				ctx.fill();
				ctx.restore();
			}
		},
		[g, lf],
	);
	const fl = flicker(t + 40, 62);
	return (
		<AbsoluteFill style={{background: '#040201'}}>
			<AbsoluteFill style={{background: 'linear-gradient(180deg,#050201,#0d0603 60%,#160b05)'}} />
			<Bokeh t={t} L={0.4 * fl} n={14} seed={73} area={[0, 0, W, 900]} blur={5} />
			<EmberNumber txt={txt} o={ramp(lf, [hit - 6, hit + 24], [0, 0.3], E.out)} blur={30} />
			<EmberNumber txt={txt} o={ramp(lf, [hit, hit + 30], [0, 0.32], E.out)} blur={7} />
			<canvas ref={ref} width={W} height={H} style={{position: 'absolute', inset: 0}} />
			<PaperTexture o={0.18} />
			<Labels lf={lf} hit={hit} dias={dias} fecha={fecha} top={330} bottom={1200} />
		</AbsoluteFill>
	);
};

// ---------- 3. Papel picado con el número calado ----------
const PAPEL_COL: Record<string, string> = {verde: C.verde, naranja: C.cempa, terracota: C.terracota};
const PapelReveal: React.FC<{dias: number; fecha: string; variante?: string}> = ({dias, fecha, variante = 'verde'}) => {
	const lf = useCurrentFrame();
	const t = lf / FPS;
	const fl = flicker(t + 50, 63);
	const hit = HIT.papel;
	const txt = String(dias);
	const drop = spring({frame: lf - 2, fps: FPS, config: {stiffness: 70, damping: 15}});
	const back = ramp(lf, [hit - 8, hit + 10], [0, 1], E.out) * (0.9 + 0.1 * fl);
	const BW = 820;
	const BH = 1080;
	const bx = (W - BW) / 2;
	const by = 300;
	const rx = 6 * noise2D('bx', 1, t * 0.7);
	const sk = 2.2 * noise2D('bk', 2, t * 0.6);
	const col = PAPEL_COL[variante] ?? C.verde;
	const paper = rgba(mixRGB(C.ink, col, 0.55 + 0.35 * back));
	const fringe = Array.from({length: 14})
		.map((_, k) => {
			const st = BW / 14;
			return `L ${BW - k * st - st / 2} ${BH} L ${BW - (k + 1) * st} ${BH - 40}`;
		})
		.join(' ');
	const outline = `M 0 0 H ${BW} V ${BH - 40} ${fringe} Z`;
	const plural = dias === 1 ? 'DÍA' : 'DÍAS';
	return (
		<AbsoluteFill style={{background: '#040201'}}>
			<AbsoluteFill style={{background: 'linear-gradient(180deg,#070302,#120803 60%,#060201)'}} />
			{/* luz que se enciende detrás del papel */}
			<Light x={540} y={850} r={980} color={C.cempa} o={0.75 * back} />
			<Light x={540} y={850} r={560} color={C.flama} o={0.65 * back} />
			<Light x={540} y={850} r={260} color="#FFF4D6" o={0.5 * back} />
			{/* cordel */}
			<svg width={W} height={H} style={{position: 'absolute', inset: 0}}>
				<path d={`M -20 ${by - 10} Q 540 ${by + 30} 1100 ${by - 10}`} stroke={rgba(C.marfil, 0.5)} strokeWidth={2.5} fill="none" />
			</svg>
			<div
				style={{
					position: 'absolute',
					left: bx,
					top: by,
					width: BW,
					height: BH,
					transformOrigin: '50% 0%',
					transform: `translateY(${(1 - drop) * -1200}px) perspective(1400px) rotateX(${rx}deg) skewX(${sk}deg)`,
				}}
			>
				<svg width={BW} height={BH} viewBox={`0 0 ${BW} ${BH}`} style={{overflow: 'visible'}}>
					<defs>
						<mask id="bannerMask" maskUnits="userSpaceOnUse" x={0} y={0} width={BW} height={BH}>
							<path d={outline} fill="#fff" />
							{/* calados: el texto */}
							<text x={BW / 2} y={190} textAnchor="middle" fontFamily="Rye" fontSize={74} letterSpacing={14} fill="#000">
								{dias === 1 ? 'FALTA' : 'FALTAN'}
							</text>
							<text x={BW / 2} y={600 + numSize(txt) * 0.34} textAnchor="middle" fontFamily="Rye" fontSize={numSize(txt) * 0.95} fill="#000">
								{txt}
							</text>
							<text x={BW / 2} y={930} textAnchor="middle" fontFamily="Rye" fontSize={110} letterSpacing={10} fill="#000">
								{plural}
							</text>
							{/* adornos */}
							<rect x={26} y={60} width={BW - 52} height={BH - 140} rx={6} fill="none" stroke="#000" strokeWidth={5} strokeDasharray="20 8" />
							{Array.from({length: 19}).map((_, k) => (
								<circle key={'t' + k} cx={42 + k * ((BW - 84) / 18)} cy={34} r={6} fill="#000" />
							))}
							{Array.from({length: 13}).map((_, k) => (
								<path key={'d' + k} d={`M ${60 + k * 58} ${BH - 108} l 12 -16 l 12 16 l -12 16 Z`} fill="#000" />
							))}
							{[
								[90, 120],
								[BW - 90, 120],
								[90, 990],
								[BW - 90, 990],
							].map(([x, y], k) => (
								<g key={'f' + k} transform={`translate(${x} ${y})`}>
									{Array.from({length: 8}).map((_, j) => (
										<ellipse key={j} cx={0} cy={-18} rx={7} ry={15} transform={`rotate(${j * 45})`} fill="#000" />
									))}
								</g>
							))}
						</mask>
						<radialGradient id="bannerGlow" cx="50%" cy="52%" r="60%">
							<stop offset="0%" stopColor={C.flama} stopOpacity={0.3} />
							<stop offset="55%" stopColor={C.cempa} stopOpacity={0.1} />
							<stop offset="100%" stopColor={C.cempa} stopOpacity={0} />
						</radialGradient>
						<linearGradient id="bannerSheen" x1="0" y1="0" x2="0" y2="1">
							<stop offset="0%" stopColor="#000" stopOpacity={0.35} />
							<stop offset="60%" stopColor="#fff" stopOpacity={0} />
							<stop offset="100%" stopColor="#FFE6A8" stopOpacity={0.2} />
						</linearGradient>
					</defs>
					<g mask="url(#bannerMask)">
						<rect width={BW} height={BH} fill={paper} />
						<rect width={BW} height={22} fill="#000" opacity={0.3} />
						<rect width={BW} height={BH} fill="url(#bannerSheen)" />
						{/* papel de china translúcido: la luz de atrás lo atraviesa */}
						<rect width={BW} height={BH} fill="url(#bannerGlow)" opacity={back} />
					</g>
				</svg>
			</div>
			<PaperTexture o={0.2} />
			<div
				style={{
					position: 'absolute',
					left: 0,
					width: W,
					top: by + BH + 100,
					textAlign: 'center',
					opacity: ramp(lf, [hit + 10, hit + 30], [0, 0.95], E.out),
				}}
			>
				<span style={{fontFamily: 'Alike', fontSize: 42, letterSpacing: '0.18em', color: C.arena, textShadow: '0 2px 10px rgba(0,0,0,0.9)'}}>{fecha}</span>
			</div>
		</AbsoluteFill>
	);
};

// ---------- 4. Brasas que se juntan en el número ----------
let SPR: HTMLCanvasElement | null = null;
const sprite = () => {
	if (SPR) return SPR;
	const c = document.createElement('canvas');
	c.width = c.height = 32;
	const g = c.getContext('2d')!;
	const gr = g.createRadialGradient(16, 16, 0, 16, 16, 16);
	gr.addColorStop(0, 'rgba(255,246,214,1)');
	gr.addColorStop(0.25, 'rgba(245,194,66,0.9)');
	gr.addColorStop(0.6, 'rgba(242,109,61,0.35)');
	gr.addColorStop(1, 'rgba(168,58,37,0)');
	g.fillStyle = gr;
	g.fillRect(0, 0, 32, 32);
	return (SPR = c);
};
const BrasasReveal: React.FC<{dias: number; fecha: string}> = ({dias, fecha}) => {
	const lf = useCurrentFrame();
	const t = lf / FPS;
	const fl = flicker(t + 70, 64);
	const txt = String(dias);
	const g = useGlyph(txt, numSize(txt), 10);
	const hit = HIT.brasas;
	const draw = (ctx: CanvasRenderingContext2D, big: boolean) => {
		if (!g) return;
		const sp = sprite();
		ctx.globalCompositeOperation = 'lighter';
		const n = g.pts.length;
		for (let i = 0; i < n; i++) {
			const r = (q: number) => hash(i * 17 + q, 500 + dias);
			const [gx, gy] = g.pts[i];
			const tx = 540 + gx;
			const ty = NUM_Y + gy;
			// nube de brasas que gira con curl noise antes de juntarse
			const a0 = r(1) * 6.283;
			const rad = 300 + 520 * r(2);
			let x = 540 + Math.cos(a0) * rad;
			let y = NUM_Y + 200 + Math.sin(a0) * rad * 1.1;
			const [cx, cy] = curl(x, y, t * 0.35 + r(3), 0.0025);
			x += cx * 380 * t + Math.cos(a0 + t * 1.2) * 80;
			y += cy * 380 * t - 90 * t;
			const delay = 12 + r(4) * 40 + ((gx + 400) / 800) * 10;
			const a = E.out(clamp((lf - delay) / 30));
			const px = lerp(x, tx, a);
			const py = lerp(y, ty, a);
			const pulse = 0.6 + 0.4 * noise2D('bp', i * 0.13, t * 2.4);
			const al = (0.35 + 0.65 * a) * pulse * (0.85 + 0.15 * fl);
			const s = (big ? 40 : 15) * (0.7 + 0.6 * r(5));
			ctx.globalAlpha = big ? al * 0.25 : al;
			ctx.drawImage(sp, px - s / 2, py - s / 2, s, s);
		}
		ctx.globalAlpha = 1;
	};
	const ref = useCanvasDraw((ctx) => draw(ctx, false), [g, lf]);
	const refGlow = useCanvasDraw((ctx) => draw(ctx, true), [g, lf]);
	return (
		<AbsoluteFill style={{background: '#030100'}}>
			<Backdrop fl={fl} t={t} k={0.7} />
			<EmberNumber txt={txt} o={ramp(lf, [hit - 6, hit + 30], [0, 0.85], E.out) * (0.92 + 0.08 * fl)} />
			<canvas ref={refGlow} width={W} height={H} style={{position: 'absolute', inset: 0, filter: 'blur(10px)', mixBlendMode: 'screen'}} />
			<canvas ref={ref} width={W} height={H} style={{position: 'absolute', inset: 0, mixBlendMode: 'screen'}} />
			<Embers t={t + 3} L={0.8} n={30} seed={66} src={[200, 700, 680, 500]} />
			<PaperTexture o={0.15} />
			<Labels lf={lf} hit={hit} dias={dias} fecha={fecha} />
		</AbsoluteFill>
	);
};

export const Reveal: React.FC<{estilo: string; variante?: string; dias: number; fecha: string; dur: number}> = ({estilo, variante, dias, fecha, dur}) => {
	const lf = useCurrentFrame();
	const fade = ramp(lf, [dur - 8, dur - 1], [0, 1], E.inOut);
	let body: React.ReactNode;
	if (estilo === 'petalos') body = <PetalosReveal dias={dias} fecha={fecha} variante={variante} />;
	else if (estilo === 'velas') body = <VelasReveal dias={dias} fecha={fecha} variante={variante} />;
	else if (estilo === 'papel') body = <PapelReveal dias={dias} fecha={fecha} variante={variante} />;
	else if (estilo === 'brasas') body = <BrasasReveal dias={dias} fecha={fecha} />;
	else body = <SceneE dias={dias} fecha={fecha} mostrarFecha />;
	return (
		<AbsoluteFill>
			{body}
			{estilo !== 'altar' ? <AbsoluteFill style={{background: '#000', opacity: fade}} /> : null}
		</AbsoluteFill>
	);
};
