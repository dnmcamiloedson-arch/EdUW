// Día 8 · núcleo propio: paleta, tiempos, resortes, linterna por planos, ojos, huellas, listón, pétalos.
// Todo determinista (hash / noise2D) y pintado durante el render.
import {noise2D} from '@remotion/noise';
import {FPS, H, W, clamp, hash, lerp, mixRGB, rgba} from '../../lib/util';
import {cached, makeCanvas, type Ctx} from '../kit/paint';

export type V2 = [number, number];

export const P = {
	ink: '#0B0703',
	bg: '#231305',
	cempa: '#F26D3D',
	gold: '#F5C242',
	arena: '#E0BB8F',
	verde: '#1F5C48',
	terra: '#A83A25',
	bone: '#D9CDB6',
	lHi: '#C9553B',
	lLo: '#6E2416',
	mud: '#2A1A0E',
	mud2: '#3A2410',
	moon: '#7FA0A0',
	amb: '#0F2E2F',
	core: '#EDE3CF',
	night: '#081314',
};

export const S = (s: number) => s * FPS; // segundos → frames
export const seg = (f: number, a: number, b: number) => clamp((f - a) / (b - a));
export const smooth = (u: number) => u * u * (3 - 2 * u);
export const easeOut3 = (u: number) => 1 - Math.pow(1 - clamp(u), 3);
export const easeInOut = (u: number) => {
	const x = clamp(u);
	return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
};
export const expoOut = (u: number) => (u >= 1 ? 1 : 1 - Math.pow(2, -10 * clamp(u)));

// Respuesta al escalón de un resorte masa-amortiguador (k, c con m = 1): 0 → 1 con un pequeño rebase
export const spr = (t: number, k = 220, c = 18) => {
	if (t <= 0) return 0;
	const w0 = Math.sqrt(k);
	const z = c / (2 * w0);
	if (z >= 1) return 1 - Math.exp(-w0 * t) * (1 + w0 * t);
	const wd = w0 * Math.sqrt(1 - z * z);
	return 1 - Math.exp(-z * w0 * t) * (Math.cos(wd * t) + (z / Math.sqrt(1 - z * z)) * Math.sin(wd * t));
};
// Oscilador amortiguado tras un impulso (rama que rebota, helecho que se mece)
export const ring = (t: number, hz: number, decay: number) => (t <= 0 ? 0 : Math.sin(t * hz * Math.PI * 2) * Math.exp(-t / decay));

// Lienzos de trabajo reutilizables (pantalla completa)
export const scratch = (i: number, w = W, h = H) => {
	const c = cached(`d8scr:${i}:${w}x${h}`, () => makeCanvas(w, h));
	const g = c.getContext('2d')!;
	g.setTransform(1, 0, 0, 1, 0, 0);
	g.globalAlpha = 1;
	g.globalCompositeOperation = 'source-over';
	g.filter = 'none';
	g.clearRect(0, 0, w, h);
	return {c, g};
};

// ---------------------------------------------------------------- linterna
export type Beam = {x: number; y: number; r: number; squash?: number; angle?: number; power: number};

// Mapa de oscuridad: color de luna (teal profundo) con alfa = 1 − iluminación. Se aplica por plano (source-atop).
export const darkMap = (b: Beam, amb = 0.91, color = '#061012', idx = 7) => {
	const {c, g} = scratch(idx);
	g.fillStyle = rgba(color, amb);
	g.fillRect(0, 0, W, H);
	if (b.power > 0.001) {
		g.globalCompositeOperation = 'destination-out';
		g.translate(b.x, b.y);
		g.rotate(b.angle ?? 0);
		g.scale(1, b.squash ?? 0.82);
		const p = clamp(b.power);
		const gr = g.createRadialGradient(0, 0, 0, 0, 0, b.r);
		gr.addColorStop(0, `rgba(0,0,0,${p})`);
		gr.addColorStop(0.22, `rgba(0,0,0,${p * 0.985})`);
		gr.addColorStop(0.3, `rgba(0,0,0,${p * 0.86})`); // anillo oscuro de linterna barata
		gr.addColorStop(0.37, `rgba(0,0,0,${p * 0.93})`);
		gr.addColorStop(0.58, `rgba(0,0,0,${p * 0.62})`);
		gr.addColorStop(0.8, `rgba(0,0,0,${p * 0.22})`);
		gr.addColorStop(1, 'rgba(0,0,0,0)');
		g.fillStyle = gr;
		g.fillRect(-b.r, -b.r, b.r * 2, b.r * 2);
		g.setTransform(1, 0, 0, 1, 0, 0);
		g.globalCompositeOperation = 'source-over';
	}
	return c;
};
// iluminación aproximada (0..1) de la linterna en un punto de pantalla
export const beamAt = (b: Beam, x: number, y: number) => {
	if (b.power <= 0) return 0;
	const a = -(b.angle ?? 0);
	const dx = x - b.x;
	const dy = y - b.y;
	const rx = dx * Math.cos(a) - dy * Math.sin(a);
	const ry = (dx * Math.sin(a) + dy * Math.cos(a)) / (b.squash ?? 0.82);
	const d = Math.hypot(rx, ry) / b.r;
	return clamp(b.power) * clamp(1 - smooth(clamp((d - 0.25) / 0.75)));
};

// Pinta un plano en su lienzo, lo oscurece con el mapa de la linterna (solo donde hay pintura), agrega la luz
// de luna (bordes, brillos) y lo compone sobre la escena. Así lo de adelante siempre tapa a lo de atrás.
export const litPlane = (main: Ctx, dark: HTMLCanvasElement | null, albedo: (g: Ctx) => void, moon?: (g: Ctx) => void, extra = 0) => {
	const {c, g} = scratch(1);
	albedo(g);
	g.setTransform(1, 0, 0, 1, 0, 0);
	g.globalAlpha = 1;
	g.filter = 'none';
	g.globalCompositeOperation = 'source-atop';
	if (dark) g.drawImage(dark, 0, 0);
	if (extra > 0) {
		g.fillStyle = rgba(P.night, extra);
		g.fillRect(0, 0, W, H);
	}
	g.globalCompositeOperation = 'source-over';
	if (moon) moon(g);
	g.setTransform(1, 0, 0, 1, 0, 0);
	g.globalAlpha = 1;
	g.globalCompositeOperation = 'source-over';
	main.drawImage(c, 0, 0);
};

// Calidez de la luz dentro del cono (tungsteno: núcleo hueso, halo arena, borde terracota)
export const beamWarm = (g: Ctx, b: Beam, k = 1) => {
	if (b.power <= 0.01) return;
	g.save();
	g.translate(b.x, b.y);
	g.rotate(b.angle ?? 0);
	g.scale(1, b.squash ?? 0.82);
	g.globalCompositeOperation = 'soft-light';
	const w = g.createRadialGradient(0, 0, 0, 0, 0, b.r * 1.05);
	w.addColorStop(0, rgba(P.core, 0.5 * b.power * k));
	w.addColorStop(0.45, rgba(P.arena, 0.45 * b.power * k));
	w.addColorStop(0.85, rgba(P.terra, 0.35 * b.power * k));
	w.addColorStop(1, rgba(P.terra, 0));
	g.fillStyle = w;
	g.fillRect(-b.r * 1.1, -b.r * 1.1, b.r * 2.2, b.r * 2.2);
	g.globalCompositeOperation = 'lighter';
	const hcore = g.createRadialGradient(0, 0, 0, 0, 0, b.r * 0.32);
	hcore.addColorStop(0, rgba('#fff2d8', 0.13 * b.power * k));
	hcore.addColorStop(1, 'rgba(255,242,216,0)');
	g.fillStyle = hcore;
	g.fillRect(-b.r, -b.r, b.r * 2, b.r * 2);
	g.restore();
};

// Cono volumétrico desde la mano (fuera de cuadro) hacia el blanco, con polvo/niebla dentro. Sin filtros caros.
export const beamCone = (g: Ctx, x0: number, y0: number, b: Beam, t: number, a = 0.1, seed = 1) => {
	if (b.power <= 0.01 || a <= 0) return;
	const dx = b.x - x0;
	const dy = b.y - y0;
	const L = Math.hypot(dx, dy);
	const nx = -dy / L;
	const ny = dx / L;
	g.save();
	g.globalCompositeOperation = 'lighter';
	for (let k = 0; k < 4; k++) {
		const wk = 1 - k * 0.2;
		const w0 = 40 * wk;
		const w1 = b.r * 1.5 * wk;
		const gr = g.createLinearGradient(x0, y0, b.x + dx * 0.15, b.y + dy * 0.15);
		gr.addColorStop(0, rgba(P.core, a * b.power * 0.5));
		gr.addColorStop(0.6, rgba(P.arena, a * b.power * 0.22));
		gr.addColorStop(1, rgba(P.arena, 0));
		g.fillStyle = gr;
		g.beginPath();
		g.moveTo(x0 + nx * w0, y0 + ny * w0);
		g.lineTo(b.x + dx * 0.15 + nx * w1, b.y + dy * 0.15 + ny * w1);
		g.lineTo(b.x + dx * 0.15 - nx * w1, b.y + dy * 0.15 - ny * w1);
		g.lineTo(x0 - nx * w0, y0 - ny * w0);
		g.closePath();
		g.fill();
	}
	// motas suspendidas en el haz
	for (let i = 0; i < 70; i++) {
		const u = hash(i, seed);
		const v = hash(i, seed + 1) * 2 - 1;
		const drift = noise2D('mote' + seed, i * 0.37, t * 0.25);
		const uu = (u + t * 0.015 * (0.5 + hash(i, seed + 2))) % 1;
		const px = x0 + dx * uu * 1.1 + nx * v * lerp(30, b.r * 1.3, uu) + drift * 30;
		const py = y0 + dy * uu * 1.1 + ny * v * lerp(30, b.r * 1.3, uu) + noise2D('motey' + seed, i * 0.41, t * 0.2) * 30;
		const tw = 0.4 + 0.6 * Math.abs(Math.sin(t * (1 + hash(i, seed + 3) * 3) + i));
		const al = a * 3.2 * b.power * tw * (1 - Math.abs(v)) * Math.sin(Math.PI * clamp(uu));
		if (al < 0.01) continue;
		g.fillStyle = rgba(P.core, Math.min(0.6, al));
		g.beginPath();
		g.arc(px, py, 1 + hash(i, seed + 4) * 1.8, 0, Math.PI * 2);
		g.fill();
	}
	g.restore();
};

// Tabla de parpadeo de la linterna: 1 encendida. Encendido barato (2 on, 3 off, on) y muerte (dos parpadeos y fuera).
export const torch = (f: number, on: number, die?: number) => {
	if (f < on) return 0;
	const d = f - on;
	let p = d < 2 ? 0.8 : d < 5 ? 0 : 1;
	if (d >= 5 && d < 9) p = 0.85 + 0.15 * Math.sin(d * 2.1);
	if (die !== undefined && f >= die) {
		const e = f - die;
		p = e < 2 ? 0.6 : e < 3 ? 0 : e < 4 ? 0.5 : e < 6 ? 0.1 : 0;
	}
	// zumbido del filamento
	return p * (0.93 + 0.07 * noise2D('torch', f * 0.37, 0.2));
};

// ---------------------------------------------------------------- ojos de chaneque
export type EyeOpts = {open?: number; tilt?: number; pupil?: number; alpha?: number; look?: number; glow?: number; spread?: number};
export const eyePair = (g: Ctx, x: number, y: number, s: number, o: EyeOpts = {}) => {
	const {open = 1, tilt = 0, pupil = 0.32, alpha = 1, look = 0, glow: gl = 1, spread = 2.5} = o;
	if (alpha <= 0.003) return;
	g.save();
	g.translate(x, y);
	g.rotate(tilt);
	g.globalCompositeOperation = 'lighter';
	const R = s * 7 * gl;
	const halo = g.createRadialGradient(0, 0, 0, 0, 0, R);
	halo.addColorStop(0, rgba(P.cempa, 0.32 * alpha * (0.4 + 0.6 * open)));
	halo.addColorStop(0.35, rgba(P.cempa, 0.09 * alpha * (0.4 + 0.6 * open)));
	halo.addColorStop(1, rgba(P.cempa, 0));
	g.fillStyle = halo;
	g.fillRect(-R, -R, 2 * R, 2 * R);
	for (const sx of [-1, 1]) {
		const ex = sx * s * spread * 0.5;
		g.save();
		g.translate(ex, 0);
		g.scale(1, Math.max(0.04, open));
		const gr = g.createRadialGradient(0, 0, 0, 0, 0, s * 1.6);
		gr.addColorStop(0, rgba('#FFF6D0', alpha));
		gr.addColorStop(0.35, rgba(P.gold, alpha * 0.95));
		gr.addColorStop(0.7, rgba(P.cempa, alpha * 0.55));
		gr.addColorStop(1, rgba(P.cempa, 0));
		g.fillStyle = gr;
		g.beginPath();
		g.ellipse(0, 0, s * 1.6, s * 1.25, 0, 0, Math.PI * 2);
		g.fill();
		g.restore();
		if (open > 0.3) {
			g.globalCompositeOperation = 'source-over';
			g.fillStyle = rgba('#140803', alpha * 0.95);
			g.beginPath();
			g.ellipse(ex + look * s * 0.45, 0, s * pupil * 0.45, s * pupil * Math.min(1, open) * 1.1, 0, 0, Math.PI * 2);
			g.fill();
			g.globalCompositeOperation = 'lighter';
		}
	}
	g.restore();
};
// apertura de párpados para un parpadeo que empieza en f0: cierra 2, sostiene 2, abre 2
export const blink = (f: number, f0: number) => {
	const d = f - f0;
	if (d < 0 || d > 6) return 1;
	if (d < 2) return 1 - d / 2;
	if (d < 4) return 0;
	return (d - 4) / 2;
};
// ojos que se abren: 0 → 1 en 3 frames con un leve rebase
export const eyeOpen = (f: number, f0: number) => (f < f0 ? 0 : clamp(spr((f - f0) / FPS, 900, 30) * 1.0));

// ---------------------------------------------------------------- huellas (7 cm, planta angosta, 5 dedos redondos)
// Lodo depositado: borde embarrado claro, núcleo oscuro húmedo, dedos separados y un arrastre detrás del talón.
const TOES: [number, number, number][] = [
	[-0.16, -0.46, 0.066],
	[-0.065, -0.53, 0.058],
	[0.03, -0.55, 0.052],
	[0.115, -0.51, 0.046],
	[0.185, -0.44, 0.04],
];
const soleP = (g: Ctx, L: number, k = 1) => {
	g.moveTo(0, 0.48 * L * k);
	g.bezierCurveTo(-0.14 * L * k, 0.48 * L * k, -0.13 * L * k, 0.18 * L * k, -0.1 * L * k, 0.05 * L * k);
	g.bezierCurveTo(-0.08 * L * k, -0.08 * L * k, -0.21 * L * k, -0.2 * L * k, -0.18 * L * k, -0.31 * L * k);
	g.bezierCurveTo(-0.14 * L * k, -0.41 * L * k, 0.16 * L * k, -0.41 * L * k, 0.19 * L * k, -0.29 * L * k);
	g.bezierCurveTo(0.21 * L * k, -0.15 * L * k, 0.11 * L * k, 0.0, 0.12 * L * k, 0.18 * L * k);
	g.bezierCurveTo(0.13 * L * k, 0.4 * L * k, 0.1 * L * k, 0.48 * L * k, 0, 0.48 * L * k);
};
export const footprint = (g: Ctx, x: number, y: number, ang: number, size: number, sq: number, side: number, wet = 0, light = 0, alpha = 1) => {
	g.save();
	g.translate(x, y);
	g.scale(1, sq);
	g.rotate(ang);
	g.scale(side, 1);
	const L = size;
	g.globalAlpha = alpha;
	// arrastre de lodo detrás del talón
	g.fillStyle = rgba('#3a2814', 0.45);
	g.beginPath();
	g.ellipse(0.02 * L, 0.6 * L, 0.06 * L, 0.16 * L, 0.05, 0, Math.PI * 2);
	g.fill();
	// halo embarrado (lodo más seco, claro)
	g.fillStyle = rgba('#5a4026', 0.55);
	g.beginPath();
	soleP(g, L * 1.12);
	g.fill();
	for (const [tx, ty, tr] of TOES) {
		g.beginPath();
		g.ellipse(tx * L * 1.04, ty * L * 1.04, tr * L * 1.35, tr * L * 1.6, 0, 0, Math.PI * 2);
		g.fill();
	}
	// núcleo húmedo
	g.fillStyle = '#1c1108';
	g.beginPath();
	soleP(g, L);
	g.fill();
	for (const [tx, ty, tr] of TOES) {
		g.beginPath();
		g.ellipse(tx * L, ty * L, tr * L, tr * L * 1.25, 0, 0, Math.PI * 2);
		g.fill();
	}
	// arco interior más claro (la planta no apoya toda)
	g.fillStyle = rgba('#3c2a16', 0.7);
	g.beginPath();
	g.ellipse(-0.06 * L, 0.02 * L, 0.035 * L, 0.11 * L, 0.1, 0, Math.PI * 2);
	g.fill();
	if (wet > 0 && light > 0.02) {
		g.fillStyle = rgba('#fff4dc', clamp(wet * light * 0.9));
		g.beginPath();
		g.ellipse(-0.04 * L, -0.18 * L, 0.035 * L, 0.06 * L, 0.3, 0, Math.PI * 2);
		g.fill();
		g.beginPath();
		g.arc(0.02 * L, 0.3 * L, 0.025 * L, 0, Math.PI * 2);
		g.fill();
		g.fillStyle = rgba('#fff4dc', clamp(wet * light * 0.5));
		g.beginPath();
		g.arc(-0.06 * L, -0.5 * L, 0.018 * L, 0, Math.PI * 2);
		g.fill();
	}
	g.restore();
};

// ---------------------------------------------------------------- listón (tela con giro, nunca líquido)
// Dibuja una cinta a lo largo de pts; el color alterna con el giro de la tela (bandas claras/oscuras).
export const ribbonColor = (s: number, phase = 0, glowK = 0) => {
	const tw = 0.5 + 0.5 * Math.cos(s * 0.045 + phase + Math.sin(s * 0.011) * 1.6);
	const base = tw > 0.5 ? mixRGB(P.terra, P.lHi, (tw - 0.5) * 2 * 0.9) : mixRGB(P.lLo, P.terra, tw * 2);
	if (glowK <= 0) return base;
	const hot = mixRGB(P.cempa, '#FFE9A8', glowK);
	return [lerp(base[0], hot[0], glowK), lerp(base[1], hot[1], glowK), lerp(base[2], hot[2], glowK)] as [number, number, number];
};
export const ribbon = (g: Ctx, pts: V2[], o: {w: number; from?: number; to?: number; phase?: number; shadow?: number; s0?: number; chunks?: number; light?: (x: number, y: number) => number; dim?: number}) => {
	const {w, phase = 0, shadow = 0.5, s0 = 0, chunks = 2, light, dim = 1} = o;
	const n = pts.length;
	const from = Math.max(0, Math.floor(o.from ?? 0));
	const to = Math.min(n - 1, Math.ceil(o.to ?? n - 1));
	if (to - from < 1) return;
	const per = Math.ceil((to - from) / chunks);
	g.save();
	g.lineCap = 'round';
	g.lineJoin = 'round';
	for (let c0 = from; c0 < to; c0 += per) {
		const c1 = Math.min(to, c0 + per + 1);
		// sombra/contorno
		g.strokeStyle = rgba('#120604', shadow);
		g.lineWidth = w + Math.max(2, w * 0.28);
		g.beginPath();
		g.moveTo(pts[c0][0], pts[c0][1] + w * 0.12);
		for (let i = c0 + 1; i <= c1 && i < n; i++) g.lineTo(pts[i][0], pts[i][1] + w * 0.12);
		g.stroke();
		g.lineWidth = w;
		for (let i = c0; i < c1 && i < n - 1; i++) {
			const col = ribbonColor(s0 + i * 3, phase);
			const lk = light ? light(pts[i][0], pts[i][1]) : 1;
			const k = dim * lk;
			g.strokeStyle = `rgb(${Math.round(col[0] * k)},${Math.round(col[1] * k)},${Math.round(col[2] * k)})`;
			g.beginPath();
			g.moveTo(pts[i][0], pts[i][1]);
			g.lineTo(pts[i + 1][0], pts[i + 1][1]);
			g.stroke();
		}
		// filo de luz donde la tela mira hacia arriba
		g.lineWidth = Math.max(1, w * 0.18);
		for (let i = c0; i < c1 && i < n - 1; i++) {
			const tw = Math.cos((s0 + i * 3) * 0.045 + phase + Math.sin((s0 + i * 3) * 0.011) * 1.6);
			if (tw < 0.55) continue;
			const lk = light ? light(pts[i][0], pts[i][1]) : 1;
			const dx = pts[i + 1][0] - pts[i][0];
			const dy = pts[i + 1][1] - pts[i][1];
			const L = Math.hypot(dx, dy) || 1;
			const ox = (-dy / L) * w * 0.25;
			const oy = (dx / L) * w * 0.25;
			g.strokeStyle = rgba('#F3A27E', (tw - 0.55) * 1.4 * lk * dim);
			g.beginPath();
			g.moveTo(pts[i][0] + ox, pts[i][1] + oy);
			g.lineTo(pts[i + 1][0] + ox, pts[i + 1][1] + oy);
			g.stroke();
		}
	}
	g.restore();
};

// ---------------------------------------------------------------- pétalo de cempasúchil (rizado, no óvalo)
export const petal = (g: Ctx, x: number, y: number, ang: number, s: number, col: string, dried = 0, alpha = 1) => {
	g.save();
	g.translate(x, y);
	g.rotate(ang);
	g.scale(1, 1 - dried * 0.3);
	g.globalAlpha = alpha;
	const c = dried > 0 ? rgba(mixRGB(col, '#8a6a44', dried)) : col;
	g.fillStyle = c;
	g.beginPath();
	g.moveTo(0, s * 0.55);
	g.bezierCurveTo(-s * 0.5, s * 0.25, -s * 0.62, -s * 0.2, -s * 0.45, -s * 0.42);
	// borde rizado
	for (let k = 0; k <= 5; k++) {
		const u = k / 5;
		const px = lerp(-s * 0.45, s * 0.45, u);
		const py = -s * 0.48 - Math.sin(u * Math.PI) * s * 0.1 + (k % 2 ? s * 0.07 : 0);
		g.lineTo(px, py);
	}
	g.bezierCurveTo(s * 0.62, -s * 0.2, s * 0.5, s * 0.25, 0, s * 0.55);
	g.fill();
	g.strokeStyle = rgba(dried > 0 ? '#3a2410' : '#8a2e10', 0.35);
	g.lineWidth = Math.max(0.6, s * 0.05);
	g.beginPath();
	g.moveTo(0, s * 0.5);
	g.lineTo(0, -s * 0.35);
	g.moveTo(0, s * 0.3);
	g.lineTo(-s * 0.22, -s * 0.3);
	g.moveTo(0, s * 0.3);
	g.lineTo(s * 0.22, -s * 0.3);
	g.stroke();
	g.restore();
};

// sombra suave barata: silueta a 1/4 de resolución, escalada (sin ctx.filter)
export const softShadow = (g: Ctx, path: (q: Ctx) => void, box: [number, number, number, number], color: string, alpha: number, dx = 0, dy = 0, q = 0.2, idx = 0) => {
	const [bx, by, bw, bh] = box;
	const pad = 40;
	const cw = Math.max(4, Math.ceil((bw + pad * 2) * q));
	const ch = Math.max(4, Math.ceil((bh + pad * 2) * q));
	const c = cached(`d8ss:${idx}`, () => makeCanvas(cw, ch));
	if (c.width < cw || c.height < ch) {
		c.width = Math.max(c.width, cw);
		c.height = Math.max(c.height, ch);
	}
	const s = c.getContext('2d')!;
	s.setTransform(1, 0, 0, 1, 0, 0);
	s.clearRect(0, 0, c.width, c.height);
	s.setTransform(q, 0, 0, q, (pad - bx) * q, (pad - by) * q);
	s.fillStyle = color;
	s.beginPath();
	path(s);
	s.fill();
	g.save();
	g.globalAlpha *= alpha;
	g.imageSmoothingEnabled = true;
	g.imageSmoothingQuality = 'high';
	g.drawImage(c, 0, 0, cw, ch, bx - pad + dx, by - pad + dy, cw / q, ch / q);
	g.restore();
};

// muestra un punto de una polilínea por longitud de arco (u en 0..1)
export const arcTable = (pts: V2[], closed = false) => {
	const n = pts.length;
	const cum = new Float32Array(n + 1);
	for (let i = 1; i <= n; i++) {
		const a = pts[i - 1];
		const b = pts[i % n];
		if (i === n && !closed) {
			cum[i] = cum[i - 1];
			break;
		}
		cum[i] = cum[i - 1] + Math.hypot(b[0] - a[0], b[1] - a[1]);
	}
	return cum;
};

export const vignetteOval = (g: Ctx, k: number, color = '#1a0c04', inner = 0.35) => {
	const gr = g.createRadialGradient(W / 2, H / 2, W * inner, W / 2, H / 2, H * 0.62);
	gr.addColorStop(0, rgba(color, 0));
	gr.addColorStop(1, rgba(color, k));
	g.save();
	g.translate(W / 2, H / 2);
	g.scale(1, 1);
	g.translate(-W / 2, -H / 2);
	g.fillStyle = gr;
	g.fillRect(0, 0, W, H);
	g.restore();
};

export const fillBg = (g: Ctx, color: string) => {
	g.fillStyle = color;
	g.fillRect(0, 0, W, H);
};
