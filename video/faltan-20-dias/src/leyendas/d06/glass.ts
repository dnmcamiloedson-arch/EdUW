import {noise2D} from '@remotion/noise';
// EL VIDRIO (capa fija a la pantalla, siempre al frente): plata tibia, manchas de azogue (foxing), rayones que
// brillan cuando una luz pasa detrás, bisel, dobles fantasma de las luces, vaho de aliento, sombra de la cruz y grieta.
import {clamp, hash, rgba} from '../../lib/util';
import {cached, drawTiled, makeCanvas, noiseTile, tinted, type Ctx} from '../kit/paint';
import type {Light} from './light';
import {P} from './timeline';

const W = 1080;
const H = 1920;

// plata + bisel + manchas, horneado una vez (se aplica con multiply)
const glassTint = () =>
	cached('d06:glassTint', () => {
		const c = makeCanvas(W / 2, H / 2);
		const g = c.getContext('2d')!;
		g.scale(0.5, 0.5);
		g.fillStyle = P.silver;
		g.fillRect(0, 0, W, H);
		// manchas de azogue desde las esquinas
		const fox = makeCanvas(W / 2, H / 2);
		const q = fox.getContext('2d')!;
		const tile = tinted(noiseTile({seed: 71, period: 6, oct: 6, contrast: 2.6, bias: -0.18}), P.foxing, 'd06fox');
		drawTiled(q, tile, {w: W / 2, h: H / 2, scale: 0.7});
		drawTiled(q, tinted(noiseTile({seed: 73, period: 12, oct: 4, contrast: 3, bias: -0.3}), P.foxing, 'd06fox2'), {w: W / 2, h: H / 2, scale: 0.5, alpha: 0.8});
		q.globalCompositeOperation = 'destination-in';
		const rg = q.createRadialGradient(W / 4, H / 4, H * 0.18, W / 4, H / 4, H * 0.56);
		rg.addColorStop(0, 'rgba(0,0,0,0)');
		rg.addColorStop(0.7, 'rgba(0,0,0,0.35)');
		rg.addColorStop(1, 'rgba(0,0,0,1)');
		q.fillStyle = rg;
		q.fillRect(0, 0, W / 2, H / 2);
		g.setTransform(1, 0, 0, 1, 0, 0);
		g.globalAlpha = 0.55;
		g.drawImage(fox, 0, 0);
		g.globalAlpha = 1;
		g.scale(0.5, 0.5);
		// bisel 24 px
		const edge = (x0: number, y0: number, x1: number, y1: number) => {
			const gr = g.createLinearGradient(x0, y0, x1, y1);
			gr.addColorStop(0, 'rgba(60,40,25,0.75)');
			gr.addColorStop(1, 'rgba(60,40,25,0)');
			g.fillStyle = gr;
			g.fillRect(Math.min(x0, x1), Math.min(y0, y1), Math.abs(x1 - x0) || W, Math.abs(y1 - y0) || H);
		};
		edge(0, 0, 24, 0);
		edge(W, 0, W - 24, 0);
		edge(0, 0, 0, 24);
		edge(0, H, 0, H - 24);
		return c;
	});

// rayones finos precalculados
type Scratch = {x: number; y: number; dx: number; dy: number; a: number};
const scratches = () =>
	cached('d06:scratches', () => {
		const out: Scratch[] = [];
		for (let i = 0; i < 120; i++) {
			const ang = hash(i, 81) * Math.PI;
			const L = 30 + hash(i, 82) * 160;
			out.push({x: hash(i, 83) * W, y: hash(i, 84) * H, dx: Math.cos(ang) * L, dy: Math.sin(ang) * L, a: 0.3 + hash(i, 85) * 0.7});
		}
		return out;
	});

// grieta: polilíneas ramificadas desde un punto (determinista)
type Seg = {x0: number; y0: number; x1: number; y1: number; d: number};
export const crackSegs = (cx: number, cy: number, seed: number) =>
	cached(`d06:crack:${cx}:${cy}:${seed}`, () => {
		const out: Seg[] = [];
		const grow = (x: number, y: number, a: number, len: number, d: number, depth: number, s: number) => {
			let px = x;
			let py = y;
			const steps = 6 + Math.floor(hash(s, seed) * 5);
			for (let k = 0; k < steps; k++) {
				const aa = a + (hash(s * 31 + k, seed + 1) - 0.5) * 0.7;
				const L = len * (0.6 + hash(s * 17 + k, seed + 2) * 0.6);
				const nx = px + Math.cos(aa) * L;
				const ny = py + Math.sin(aa) * L;
				out.push({x0: px, y0: py, x1: nx, y1: ny, d: d + k});
				if (depth < 2 && hash(s * 13 + k, seed + 3) < 0.28) grow(nx, ny, aa + (hash(s * 7 + k, seed + 4) < 0.5 ? -0.8 : 0.8), len * 0.7, d + k + 1, depth + 1, s * 5 + k + 1);
				px = nx;
				py = ny;
			}
		};
		for (let r = 0; r < 7; r++) grow(cx, cy, (r / 7) * Math.PI * 2 + hash(r, seed) * 0.6, 34, 0, 0, r + 1);
		const maxD = out.reduce((m, s) => Math.max(m, s.d), 1);
		return {segs: out, maxD};
	});

export const paintCrack = (g: Ctx, cx: number, cy: number, reveal: number, a: number, seed = 5) => {
	if (a <= 0 || reveal <= 0) return;
	const {segs, maxD} = crackSegs(cx, cy, seed);
	const lim = reveal * maxD;
	g.save();
	g.lineCap = 'round';
	for (const pass of [0, 1, 2]) {
		g.strokeStyle = pass === 0 ? rgba('#050302', 0.7 * a) : pass === 1 ? rgba(P.bone, 0.55 * a) : rgba('#9FC3C4', 0.25 * a);
		g.lineWidth = pass === 0 ? 3 : 1.2;
		const off = pass === 2 ? 3 : pass === 1 ? -1 : 0;
		g.beginPath();
		for (const s of segs) {
			if (s.d > lim) continue;
			g.moveTo(s.x0 + off, s.y0 + off);
			g.lineTo(s.x1 + off, s.y1 + off);
		}
		g.stroke();
	}
	g.restore();
};

// vaho: soplos analíticos menos trazos de limpieza, por (1 − máscara del 6). Sin estado: se rehace cada frame.
export type Puff = {x: number; y: number; r: number; a: number};
export type FogOpts = {puffs: Puff[]; wipe?: (q: Ctx) => void; carve?: (q: Ctx) => void; veil?: number; t: number};

const FW = 270;
const FH = 480;
export const paintFog = (g: Ctx, o: FogOpts) => {
	const total = o.puffs.reduce((s, p) => s + p.a, 0);
	if (total <= 0.001) return;
	const fc = cached('d06:fogC', () => makeCanvas(FW, FH));
	const q = fc.getContext('2d')!;
	q.setTransform(1, 0, 0, 1, 0, 0);
	q.globalCompositeOperation = 'source-over';
	q.globalAlpha = 1;
	q.clearRect(0, 0, FW, FH);
	q.scale(FW / W, FH / H);
	q.filter = 'blur(2px)';
	o.puffs.forEach((p, pi) => {
		if (p.a <= 0 || p.r <= 1) return;
		// borde irregular: radio modulado por ruido angular (sin patrón repetido)
		const rg = q.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r * 1.12);
		rg.addColorStop(0, `rgba(255,255,255,${p.a})`);
		rg.addColorStop(0.62, `rgba(255,255,255,${p.a * 0.9})`);
		rg.addColorStop(0.86, `rgba(255,255,255,${p.a * 0.45})`);
		rg.addColorStop(1, 'rgba(255,255,255,0)');
		q.fillStyle = rg;
		q.beginPath();
		const N = 56;
		for (let i = 0; i <= N; i++) {
			const th = (i / N) * Math.PI * 2;
			const n = noise2D('d6fog' + pi, Math.cos(th) * 1.6 + o.t * 0.15, Math.sin(th) * 1.6) * 0.14 + noise2D('d6fogb' + pi, Math.cos(th) * 5, Math.sin(th) * 5 + o.t * 0.3) * 0.05;
			const rr = p.r * (1.04 + n);
			const x = p.x + Math.cos(th) * rr;
			const y = p.y + Math.sin(th) * rr;
			if (i) q.lineTo(x, y);
			else q.moveTo(x, y);
		}
		q.closePath();
		q.fill();
	});
	q.filter = 'none';
	// condensación: grano fino, sin manchas grandes
	q.globalCompositeOperation = 'destination-out';
	drawTiled(q, noiseTile({seed: 93, period: 8, oct: 4, contrast: 1.25, bias: -0.1}), {w: W, h: H, scale: 2.2, alpha: 0.16, op: 'destination-out'});
	if (o.wipe) o.wipe(q);
	if (o.carve) o.carve(q);
	q.setTransform(1, 0, 0, 1, 0, 0);
	q.globalCompositeOperation = 'source-over';
	// copia desenfocada del cuadro, enmascarada por el vaho
	const bc = cached('d06:fogB', () => makeCanvas(FW, FH));
	const b = bc.getContext('2d')!;
	b.setTransform(1, 0, 0, 1, 0, 0);
	b.globalCompositeOperation = 'source-over';
	b.clearRect(0, 0, FW, FH);
	b.filter = 'blur(3px)';
	b.drawImage(g.canvas, 0, 0, FW, FH);
	b.filter = 'none';
	b.globalCompositeOperation = 'destination-in';
	b.drawImage(fc, 0, 0);
	g.save();
	g.setTransform(1, 0, 0, 1, 0, 0);
	g.drawImage(bc, 0, 0, W, H);
	const vc = cached('d06:fogV', () => makeCanvas(FW, FH));
	const v = vc.getContext('2d')!;
	v.globalCompositeOperation = 'source-over';
	v.clearRect(0, 0, FW, FH);
	v.drawImage(fc, 0, 0);
	v.globalCompositeOperation = 'source-in';
	v.fillStyle = '#E6DFD2';
	v.fillRect(0, 0, FW, FH);
	g.globalAlpha = o.veil ?? 0.6;
	g.drawImage(vc, 0, 0, W, H);
	g.restore();
};

export type GlassOpts = {
	t: number;
	lights: Light[]; // en coordenadas de PANTALLA
	ghost?: number;
	cross?: number; // 0..1 sombra de la cruz de las tijeras sobre todo el vidrio
	crack?: {x: number; y: number; reveal: number; a: number};
	tint?: number; // fuerza del multiply de plata/foxing
};

export const paintGlass = (g: Ctx, o: GlassOpts) => {
	const {lights, ghost = 1, cross = 0, tint = 1} = o;
	g.save();
	g.setTransform(1, 0, 0, 1, 0, 0);
	// dobles fantasma (vidrio azogado por detrás): +5/+9 px, 18 %
	if (ghost > 0) {
		g.globalCompositeOperation = 'screen';
		for (const l of lights) {
			if (l.kind === 'moon' || l.kind === 'dawn') continue;
			const rr = Math.max(8, l.r * 0.5);
			const gr = g.createRadialGradient(l.x + 5, l.y + 9, 0, l.x + 5, l.y + 9, rr);
			gr.addColorStop(0, rgba(l.color, 0.18 * l.a * ghost));
			gr.addColorStop(0.35, rgba(l.color, 0.08 * l.a * ghost));
			gr.addColorStop(1, rgba(l.color, 0));
			g.fillStyle = gr;
			g.fillRect(l.x + 5 - rr, l.y + 9 - rr, rr * 2, rr * 2);
		}
		g.globalCompositeOperation = 'source-over';
	}
	// plata + manchas + bisel
	if (tint > 0) {
		g.globalCompositeOperation = 'multiply';
		g.globalAlpha = tint;
		g.drawImage(glassTint(), 0, 0, W, H);
		g.globalAlpha = 1;
		g.globalCompositeOperation = 'source-over';
	}
	// rayones que brillan cerca de las luces
	g.globalCompositeOperation = 'lighter';
	g.lineWidth = 1;
	for (const s of scratches()) {
		let k = 0.02;
		for (const l of lights) {
			if (l.kind === 'moon') continue;
			const d = Math.hypot(s.x - l.x, s.y - l.y);
			k += l.a * clamp(1 - d / (l.r * 2.2 + 120)) * 0.5;
		}
		if (k < 0.03) continue;
		g.strokeStyle = rgba('#FFE6B8', clamp(k) * s.a * 0.5);
		g.beginPath();
		g.moveTo(s.x, s.y);
		g.lineTo(s.x + s.dx, s.y + s.dy);
		g.stroke();
	}
	g.globalCompositeOperation = 'source-over';
	// sombra de la cruz sobre todo el vidrio
	if (cross > 0) {
		g.globalCompositeOperation = 'multiply';
		g.filter = 'blur(60px)';
		g.strokeStyle = `rgba(90,60,40,${0.65 * cross})`;
		g.lineWidth = 260;
		g.beginPath();
		g.moveTo(-200, -100);
		g.lineTo(W + 200, H + 100);
		g.moveTo(W + 200, -100);
		g.lineTo(-200, H + 100);
		g.stroke();
		g.filter = 'none';
		g.globalCompositeOperation = 'source-over';
	}
	if (o.crack) paintCrack(g, o.crack.x, o.crack.y, o.crack.reveal, o.crack.a);
	g.restore();
};
