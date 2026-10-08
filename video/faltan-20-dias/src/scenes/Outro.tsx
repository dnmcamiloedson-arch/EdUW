import React, {useEffect, useState} from 'react';
import {AbsoluteFill, Easing, continueRender, delayRender, staticFile, useCurrentFrame} from 'remotion';
import {noise2D} from '@remotion/noise';
import {C, E, FPS, H, W, clamp, flicker, hash, mixRGB, ramp, rgba} from '../lib/util';
import {Flame, Light, PaperTexture, useCanvasDraw} from '../components/core';
import {Calavera, CutFilter, Marigold} from '../components/Calavera';
import {MiniVeladora, PanDeMuerto, Pompon} from '../components/Objetos';
import {Embers, Sparks, drawPetal} from '../components/Particles';


// Outro (4.5 s): el logo se enciende con un frente de fuego, se sostiene encendido
// rodeado de la ofrenda, y se esfuma en brasas y humo.
export const OUTRO_LEN = 135;

const SRC_W = 1918;
const SRC_H = 795;
const LW = 880;
const LH = Math.round((LW * SRC_H) / SRC_W);
const CX = W / 2;
const CY = 930;
const LX = CX - LW / 2;
const LY = CY - LH / 2;

const BURN: [number, number] = [8, 48];
const DISS: [number, number] = [92, 126];
const DB = 0.12; // ancho de la banda de fuego al encender
const DD = 0.1; // ancho de la banda de brasa al esfumarse

const burnEase = Easing.bezier(0.42, 0, 0.3, 1);
const dissEase = Easing.bezier(0.5, 0, 0.7, 1);

type LogoData = {
	n: number;
	px: Int32Array; // índice de pixel (y*LW+x) de cada pixel opaco
	a: Float32Array; // alfa 0..1
	rb: Float32Array; // rango de encendido 0..1
	rd: Float32Array; // rango de disolución 0..1
	byB: Int32Array; // pixeles ordenados por rb
	byD: Int32Array; // pixeles ordenados por rd
};

let LOGO: Promise<LogoData> | null = null;
const loadLogo = () =>
	(LOGO ??= new Promise<LogoData>((resolve, reject) => {
		const img = new Image();
		img.onload = () => {
			const c = document.createElement('canvas');
			c.width = LW;
			c.height = LH;
			const g = c.getContext('2d')!;
			g.drawImage(img, 0, 0, LW, LH);
			const d = g.getImageData(0, 0, LW, LH).data;
			const idx: number[] = [];
			for (let i = 0; i < LW * LH; i++) if (d[i * 4 + 3] > 6) idx.push(i);
			const n = idx.length;
			const px = Int32Array.from(idx);
			const a = new Float32Array(n);
			const fb = new Float32Array(n);
			const fd = new Float32Array(n);
			// el fuego nace abajo al centro (la base del edificio) y trepa con un frente irregular
			const ix = LW / 2;
			const iy = LH * 0.62;
			const maxD = Math.hypot(LW / 2, LH);
			for (let k = 0; k < n; k++) {
				const x = px[k] % LW;
				const y = (px[k] / LW) | 0;
				a[k] = d[px[k] * 4 + 3] / 255;
				const nb = 0.6 * noise2D('lb1', x * 0.007, y * 0.007) + 0.3 * noise2D('lb2', x * 0.022, y * 0.022) + 0.1 * noise2D('lb3', x * 0.07, y * 0.07);
				fb[k] = 0.62 * (Math.hypot((x - ix) * 0.8, (y - iy) * 1.6) / maxD) + 0.38 * (nb * 0.5 + 0.5);
				const nd = 0.6 * noise2D('ld1', x * 0.006, y * 0.006) + 0.3 * noise2D('ld2', x * 0.02, y * 0.02) + 0.1 * noise2D('ld3', x * 0.065, y * 0.065);
				// se esfuma de arriba hacia abajo, como si el humo se lo llevara
				fd[k] = 0.55 * (nd * 0.5 + 0.5) + 0.45 * (y / LH);
			}
			const rank = (f: Float32Array) => {
				const order = Int32Array.from({length: n}, (_, i) => i).sort((p, q) => f[p] - f[q]);
				const r = new Float32Array(n);
				for (let i = 0; i < n; i++) r[order[i]] = i / n;
				return [r, order] as const;
			};
			const [rb, byB] = rank(fb);
			const [rd, byD] = rank(fd);
			resolve({n, px, a, rb, rd, byB, byD});
		};
		img.onerror = reject;
		img.src = staticFile('brand/logo-westhill-blanco.png');
	}));

const useLogo = () => {
	const [data, setData] = useState<LogoData | null>(null);
	const [handle] = useState(() => delayRender('logo Westhill'));
	useEffect(() => {
		loadLogo()
			.then((d) => {
				setData(d);
				continueRender(handle);
			})
			.catch((e) => {
				throw e;
			});
	}, [handle]);
	return data;
};

const hex = (h: string) => {
	const v = parseInt(h.slice(1), 16);
	return [(v >> 16) & 255, (v >> 8) & 255, v & 255];
};
const LOGO_C = hex('#FFF3E2');
const STOPS = [hex('#FFF3E2'), hex(C.cempa), hex(C.flama), hex('#FFFBEE')];
const ASH = [hex('#FFF3E2'), hex(C.flama), hex(C.cempa), hex(C.terracota), hex('#2a1206')];
const ramp4 = (stops: number[][], h: number) => {
	const s = clamp(h) * (stops.length - 1);
	const i = Math.min(stops.length - 2, Math.floor(s));
	const u = s - i;
	return [0, 1, 2].map((c) => stops[i][c] + (stops[i + 1][c] - stops[i][c]) * u);
};
const smooth = (a: number, b: number, x: number) => {
	const t = clamp((x - a) / (b - a));
	return t * t * (3 - 2 * t);
};

// Pixeles del logo: encendido con banda de fuego + disolución con banda de brasa.
const LogoCanvas: React.FC<{data: LogoData; p: number; q: number; glow: number; edgesOnly?: boolean}> = ({data, p, q, glow, edgesOnly = false}) => {
	const ref = useCanvasDraw(
		(ctx) => {
			const img = ctx.createImageData(LW, LH);
			const o = img.data;
			const warm = 0.92 + 0.08 * glow;
			for (let k = 0; k < data.n; k++) {
				const ub = (p - data.rb[k]) / DB;
				if (ub <= 0) continue;
				const ud = (q - data.rd[k]) / DD;
				if (ud >= 1) continue;
				let col: number[];
				let al = data.a[k];
				let edge = 0;
				if (ub < 1) {
					col = ramp4(STOPS, 1 - ub);
					al *= smooth(0, 0.3, ub);
					edge = 1 - ub;
				} else col = LOGO_C;
				if (ud > 0) {
					col = ramp4(ASH, ud);
					al *= 1 - smooth(0.55, 1, ud);
					edge = Math.max(edge, 1 - Math.abs(ud - 0.35) * 2);
				}
				if (edgesOnly) {
					if (edge <= 0.02) continue;
					al *= edge;
				}
				const i = data.px[k] * 4;
				o[i] = Math.min(255, col[0] * warm);
				o[i + 1] = Math.min(255, col[1] * warm);
				o[i + 2] = Math.min(255, col[2] * warm);
				o[i + 3] = al * 255;
			}
			ctx.putImageData(img, 0, 0);
		},
		[data, p, q, glow, edgesOnly],
	);
	return <canvas ref={ref} width={LW} height={LH} style={{position: 'absolute', left: 0, top: 0, width: LW, height: LH}} />;
};

// Lenguas de fuego sobre el frente + brasas y humo al esfumarse.
let TONGUE: Path2D | null = null;
const tongue = () =>
	(TONGUE ??= new Path2D('M 0 0 C -0.5 0 -0.55 -0.35 -0.25 -0.6 C -0.1 -0.75 -0.02 -0.9 0 -1 C 0.06 -0.85 0.18 -0.72 0.28 -0.58 C 0.52 -0.3 0.45 0 0 0 Z'));

const PAD = 220;
const FireCanvas: React.FC<{data: LogoData; f: number}> = ({data, f}) => {
	const ref = useCanvasDraw(
		(ctx) => {
			ctx.globalCompositeOperation = 'lighter';
			const pAt = (fr: number) => burnEase(clamp((fr - BURN[0]) / (BURN[1] - BURN[0]))) * (1 + DB);
			const qAt = (fr: number) => dissEase(clamp((fr - DISS[0]) / (DISS[1] - DISS[0]))) * (1 + DD);
			const pick = (order: Int32Array, lo: number, hi: number, r: number) => {
				const a = Math.max(0, Math.floor(lo * data.n));
				const b = Math.min(data.n - 1, Math.floor(hi * data.n));
				if (b <= a) return -1;
				return order[a + Math.floor(r * (b - a))];
			};
			// lenguas de fuego: cada una vive ~5 frames, nacen en el frente
			const p = pAt(f);
			if (p > 0.01 && p < 1 + DB) {
				for (let j = 0; j < 70; j++) {
					const born = Math.floor(f) - (j % 5);
					const life = (f - born) / 5;
					const k = pick(data.byB, pAt(born) - DB * 0.55, pAt(born), hash(j * 31 + born * 7, 3));
					if (k < 0) continue;
					const x = (data.px[k] % LW) + PAD / 2;
					const y = ((data.px[k] / LW) | 0) + PAD;
					const hgt = (16 + 46 * hash(j, born)) * Math.sin(Math.PI * clamp(life)) * (0.7 + 0.3 * noise2D('tg', j, f * 0.4));
					const wid = hgt * (0.32 + 0.12 * hash(j + 5, born));
					if (hgt < 1) continue;
					const g = ctx.createLinearGradient(0, 0, 0, -1);
					g.addColorStop(0, 'rgba(255,248,224,0.95)');
					g.addColorStop(0.3, rgba(C.flama, 0.85));
					g.addColorStop(0.7, rgba(C.cempa, 0.55));
					g.addColorStop(1, rgba(C.terracota, 0));
					ctx.save();
					ctx.translate(x + noise2D('tx', j, f * 0.3) * 4, y - life * 10);
					ctx.rotate(noise2D('tr', j, f * 0.25) * 0.25);
					ctx.scale(wid, hgt);
					ctx.fillStyle = g;
					ctx.fill(tongue());
					ctx.restore();
				}
			}
			// chispas y brasas: nacen en el frente activo y suben con flotación + turbulencia
			const emit = (order: Int32Array, at: (fr: number) => number, band: number, from: number, to: number, perFrame: number, seed: number, ash: boolean) => {
				for (let fb = Math.max(from, Math.floor(f) - 40); fb <= Math.min(to, f); fb++) {
					const v = at(fb);
					if (v <= 0 || v >= 1 + band) continue;
					for (let j = 0; j < perFrame; j++) {
						const r = (q: number) => hash(fb * 97 + j * 13 + q, seed);
						const k = pick(order, v - band, v, r(1));
						if (k < 0) continue;
						const age = (f - fb) / FPS;
						const life = 0.7 + 0.9 * r(2);
						if (age > life) continue;
						const u = age / life;
						const x = (data.px[k] % LW) + PAD / 2 + noise2D('ex' + seed, j + fb * 0.1, age * 1.4) * 40 * age + (r(3) - 0.5) * 60 * age;
						const y = ((data.px[k] / LW) | 0) + PAD - (50 + 70 * r(4)) * age - 60 * age * age;
						const col = mixRGB(C.terracota, ash ? C.cempa : C.flama, 1 - u);
						const rad = (ash ? 1.6 : 1.2) + 2.2 * r(5);
						const al = (1 - u) ** 1.3 * (0.6 + 0.4 * noise2D('ef', j, f * 0.8));
						const gr = ctx.createRadialGradient(x, y, 0, x, y, rad * 4);
						gr.addColorStop(0, rgba('#FFF2C8', al));
						gr.addColorStop(0.3, rgba(col, al * 0.8));
						gr.addColorStop(1, rgba(col, 0));
						ctx.fillStyle = gr;
						ctx.fillRect(x - rad * 4, y - rad * 4, rad * 8, rad * 8);
					}
				}
			};
			emit(data.byB, pAt, DB, BURN[0], BURN[1] + 6, 4, 11, false);
			emit(data.byD, qAt, DD, DISS[0], DISS[1] + 4, 9, 23, true);
		},
		[data, f],
	);
	return <canvas ref={ref} width={LW + PAD} height={LH + PAD * 1.5} style={{position: 'absolute', left: -PAD / 2, top: -PAD, mixBlendMode: 'screen'}} />;
};

// Humo que se lleva el logo
let PUFF: HTMLCanvasElement | null = null;
const puff = () => {
	if (PUFF) return PUFF;
	const c = document.createElement('canvas');
	c.width = c.height = 96;
	const g = c.getContext('2d')!;
	const gr = g.createRadialGradient(48, 48, 0, 48, 48, 48);
	gr.addColorStop(0, 'rgba(224,187,143,0.5)');
	gr.addColorStop(0.5, 'rgba(224,187,143,0.18)');
	gr.addColorStop(1, 'rgba(224,187,143,0)');
	g.fillStyle = gr;
	g.fillRect(0, 0, 96, 96);
	return (PUFF = c);
};
const AshSmoke: React.FC<{data: LogoData; f: number}> = ({data, f}) => {
	const ref = useCanvasDraw(
		(ctx) => {
			const qAt = (fr: number) => dissEase(clamp((fr - DISS[0]) / (DISS[1] - DISS[0]))) * (1 + DD);
			const sp = puff();
			for (let fb = DISS[0]; fb <= Math.min(f, DISS[1] + 4); fb++) {
				const v = qAt(fb);
				for (let j = 0; j < 5; j++) {
					const r = (q: number) => hash(fb * 53 + j * 7 + q, 61);
					const a0 = Math.max(0, Math.floor((v - DD) * data.n));
					const b0 = Math.min(data.n - 1, Math.floor(v * data.n));
					if (b0 <= a0) continue;
					const k = data.byD[a0 + Math.floor(r(1) * (b0 - a0))];
					const age = (f - fb) / FPS;
					const life = 1.6;
					if (age > life) continue;
					const u = age / life;
					const x = (data.px[k] % LW) + PAD / 2 + noise2D('sx', j + fb, age) * 50 * age;
					const y = ((data.px[k] / LW) | 0) + PAD - 70 * age;
					const s = 30 + 140 * u;
					ctx.globalAlpha = Math.sin(Math.PI * u) * 0.2;
					ctx.drawImage(sp, x - s / 2, y - s / 2, s, s);
				}
			}
			ctx.globalAlpha = 1;
		},
		[data, f],
	);
	return <canvas ref={ref} width={LW + PAD} height={LH + PAD * 1.5} style={{position: 'absolute', left: -PAD / 2, top: -PAD, filter: 'blur(4px)', mixBlendMode: 'screen'}} />;
};

// Calaverita centrada en (x, y); la original mira a la izquierda, flip la voltea.
const Skull: React.FC<{x: number; y: number; size: number; lit: number; t: number; flip?: boolean}> = ({x, y, size, lit, t, flip}) => (
	<g transform={`translate(${x} ${y}) scale(${flip ? -1 : 1} 1) translate(${-size / 2} ${-size / 2})`}>
		<Calavera L={Math.min(1, lit * 1.35)} eye={0} rim={0.6 * lit} t={t} size={size} />
	</g>
);

// La ofrenda alrededor: corona de cempasúchil (arriba y abajo, libre a los lados para el texto),
// calaveritas, panes y veladoras.
const RING_R = 470;
const Surround: React.FC<{lit: number; t: number}> = ({lit, t}) => {
	const pomp: React.ReactNode[] = [];
	const arcs: [number, number][] = [
		[200, 340],
		[22, 158],
	];
	let id = 0;
	for (const [a0, a1] of arcs) {
		const n = 17;
		for (let i = 0; i < n; i++) {
			const a = ((a0 + ((a1 - a0) * i) / (n - 1)) * Math.PI) / 180;
			const x = CX + Math.cos(a) * RING_R;
			const y = CY + Math.sin(a) * RING_R * 0.98;
			pomp.push(<Pompon key={id} x={x} y={y} r={30 + 8 * hash(id, 71)} lit={lit * (0.75 + 0.3 * hash(id, 72))} seed={id} />);
			id++;
		}
	}
	const base = 1508;
	return (
		<svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{position: 'absolute', inset: 0, overflow: 'visible'}}>
			<defs>
				<radialGradient id="ofloor" cx="50%" cy="0%" r="70%">
					<stop offset="0%" stopColor={rgba(mixRGB(C.ink, '#3a1c0a', lit))} />
					<stop offset="100%" stopColor="#050201" />
				</radialGradient>
			</defs>
			<rect x={0} y={base} width={W} height={H - base} fill="url(#ofloor)" />
			{pomp}
			{/* corona arriba */}
			<Marigold x={CX} y={CY - RING_R - 6} s={0.72} lit={lit} />
			{/* calaveritas en la corona, mirando hacia el logo */}
			<Skull x={CX - 372} y={CY - 352} size={150} lit={lit} t={t} flip />
			<Skull x={CX + 372} y={CY - 352} size={150} lit={lit} t={t} />
			{/* mesa de abajo: panes, calaveritas, veladoras */}
			<g transform={`translate(300 ${base}) scale(0.3)`}>
				<PanDeMuerto lit={lit} rim={lit} id="oPan1" />
			</g>
			<g transform={`translate(780 ${base}) scale(0.3)`}>
				<PanDeMuerto lit={lit} rim={lit} id="oPan2" />
			</g>
			<Skull x={418} y={base - 78} size={160} lit={lit} t={t} flip />
			<Skull x={662} y={base - 78} size={160} lit={lit} t={t} />
			<g transform={`translate(${CX} ${base}) scale(0.44)`}>
				<PanDeMuerto lit={lit} rim={lit} id="oPan0" />
			</g>
			{[165, 915].map((x, i) => (
				<g key={i} transform={`translate(${x} ${base})`}>
					<MiniVeladora lit={lit} glow={lit} h={84} glass={i ? C.terracota : C.cempa} />
				</g>
			))}
		</svg>
	);
};

const FloorPetals: React.FC<{lit: number}> = ({lit}) => {
	const ref = useCanvasDraw(
		(ctx) => {
			for (let i = 0; i < 70; i++) {
				const r = (q: number) => hash(i * 9 + q, 515);
				const x = 60 + r(1) * (W - 120);
				const y = 1516 + r(2) * 70;
				drawPetal(ctx, x, y, 16 + 8 * r(3), r(4) * 6.28, 1, 0.5, lit * (0.6 + 0.4 * r(5)), r(6));
			}
		},
		[lit],
	);
	return <canvas ref={ref} width={W} height={H} style={{position: 'absolute', inset: 0}} />;
};

export const Outro: React.FC = () => {
	const f = useCurrentFrame();
	const t = f / FPS + 20;
	const fl = flicker(t, 11);
	const data = useLogo();
	const p = burnEase(clamp((f - BURN[0]) / (BURN[1] - BURN[0]))) * (1 + DB);
	const q = dissEase(clamp((f - DISS[0]) / (DISS[1] - DISS[0]))) * (1 + DD);
	// cuánto ilumina el logo: crece con el fuego y se apaga al esfumarse
	const G = clamp(p) * (1 - clamp(q * 1.05)) * (0.9 + 0.1 * fl);
	const candles = ramp(f, [22, 34], [0, 1], E.out) * (1 - ramp(f, [98, 116], [0, 1], E.in));
	const lit = clamp(0.06 + 0.62 * G + 0.18 * candles);
	const s = ramp(f, [0, OUTRO_LEN], [1.0, 1.05], E.inOut);
	const end = ramp(f, [118, 134], [0, 1], E.inOut);
	return (
		<AbsoluteFill style={{background: '#030100', overflow: 'hidden'}}>
			<CutFilter />
			<AbsoluteFill style={{transformOrigin: `${CX}px ${CY}px`, transform: `scale(${s})`}}>
				<Light x={CX} y={CY} r={900} color={C.cempa} o={0.5 * G} />
				<Light x={CX} y={CY + 40} r={480} color={C.flama} o={0.32 * G} />
				<Surround lit={lit} t={t} />
				<FloorPetals lit={lit} />
				{[165, 915].map((x, i) =>
					candles > 0.001 ? (
						<React.Fragment key={i}>
							<Light x={x} y={1508 - 84 - 30} r={240} color={C.cempa} o={0.45 * candles * fl} />
							<Flame x={x} y={1508 - 84 + 10} size={40} t={t + i * 2.1} seed={60 + i} grow={candles} fl={fl} />
						</React.Fragment>
					) : null,
				)}
				<PaperTexture o={0.2} />
				{/* velo oscuro tras el logo para que lea limpio */}
				<div
					style={{
						position: 'absolute',
						left: LX - 80,
						top: LY - 90,
						width: LW + 160,
						height: LH + 180,
						borderRadius: '50%',
						background: 'radial-gradient(closest-side, rgba(6,2,0,0.55), rgba(6,2,0,0))',
					}}
				/>
				<Sparks t={(f - 5) / FPS} x={CX} y={LY + LH * 0.62} n={34} seed={17} />
				{data ? (
					<div style={{position: 'absolute', left: LX, top: LY, width: LW, height: LH}}>
						{/* resplandor del borde encendido */}
						<div style={{position: 'absolute', inset: 0, filter: 'blur(14px)', mixBlendMode: 'screen', opacity: 0.95}}>
							<LogoCanvas data={data} p={p} q={q} glow={fl} edgesOnly />
						</div>
						<div style={{position: 'absolute', inset: 0, filter: `drop-shadow(0 0 ${10 + 8 * fl}px ${rgba(C.cempa, 0.55 * G)})`}}>
							<LogoCanvas data={data} p={p} q={q} glow={fl} />
						</div>
						<AshSmoke data={data} f={f} />
						<FireCanvas data={data} f={f} />
					</div>
				) : null}
				<Embers t={t} L={0.25 + 0.6 * G} n={26} seed={33} src={[120, 1050, 840, 500]} />
			</AbsoluteFill>
			<AbsoluteFill style={{background: '#000', opacity: end}} />
		</AbsoluteFill>
	);
};
