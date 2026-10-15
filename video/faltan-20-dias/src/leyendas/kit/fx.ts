// Efectos 2D compartidos: partículas, llamas y velas, cempasúchil, papel picado, humo de copal y reflejos.
import {noise2D} from '@remotion/noise';
import {C, H, W, clamp, hash, lerp, mixRGB, rgba} from '../../lib/util';
import {cached, drawTiled, glow, makeCanvas, noiseTile, tinted, type Ctx} from './paint';

// ---------- Partículas deterministas ----------
export type PKind = 'dust' | 'embers' | 'petals' | 'rain' | 'fireflies' | 'ash';
export const particles = (ctx: Ctx, o: {kind: PKind; n: number; t: number; seed?: number; x?: number; y?: number; w?: number; h?: number; color?: string; size?: number; alpha?: number; speed?: number; wind?: number}) => {
	const {kind, n, t, seed = 1, x = 0, y = 0, w = W, h = H, size = 1, alpha = 1, speed = 1, wind = 0} = o;
	const color = o.color ?? (kind === 'embers' ? C.flama : kind === 'petals' ? C.cempa : kind === 'rain' ? '#9fb3c0' : kind === 'fireflies' ? '#e8f0a0' : '#e8dcc0');
	ctx.save();
	if (kind === 'embers' || kind === 'fireflies' || kind === 'dust') ctx.globalCompositeOperation = 'lighter';
	for (let i = 0; i < n; i++) {
		const r1 = hash(i, seed);
		const r2 = hash(i, seed + 1);
		const r3 = hash(i, seed + 2);
		const life = 3 + r3 * 5;
		if (kind === 'dust') {
			const px = x + ((r1 * w + noise2D('pdx' + seed, i * 0.3, t * 0.08 * speed) * 80 + t * wind * 10) % w + w) % w;
			const py = y + ((r2 * h + noise2D('pdy' + seed, i * 0.3, t * 0.07 * speed) * 80 - t * 6 * speed) % h + h) % h;
			const tw = 0.5 + 0.5 * Math.sin(t * (1 + r3 * 2) + i);
			ctx.fillStyle = rgba(color, alpha * (0.15 + 0.5 * tw) * (0.4 + r3));
			ctx.beginPath();
			ctx.arc(px, py, (0.8 + r3 * 2.2) * size, 0, Math.PI * 2);
			ctx.fill();
		} else if (kind === 'embers' || kind === 'ash') {
			const age = ((t * speed + r1 * life) % life) / life;
			const px = x + r2 * w + noise2D('pex' + seed, i, t * 0.6) * 60 * age + wind * age * 120;
			const py = y + h - age * h * (0.7 + r3 * 0.6);
			const a = Math.sin(Math.PI * age) * alpha;
			const fl = 0.6 + 0.4 * noise2D('pef' + seed, i, t * 8);
			if (kind === 'embers') {
				glow(ctx, px, py, (6 + r3 * 10) * size, color, a * fl * 0.5);
				ctx.fillStyle = rgba(mixRGB(C.core, color, age), a * fl);
				ctx.fillRect(px - size, py - size, 2 * size, 2 * size);
			} else {
				ctx.fillStyle = rgba('#8a8580', a * 0.7);
				ctx.fillRect(px, py, 2.4 * size, 1.6 * size);
			}
		} else if (kind === 'petals') {
			const fall = h + 200;
			const age = (t * 60 * speed * (0.6 + r3 * 0.6) + r1 * fall) % fall;
			const px = x + r2 * w + Math.sin(t * (0.8 + r3) + i) * 40 + wind * age * 0.3;
			const py = y - 100 + age;
			const rot = t * (1 + r3 * 2) + i;
			ctx.save();
			ctx.translate(px, py);
			ctx.rotate(rot);
			ctx.scale(1, Math.abs(Math.cos(t * (1.5 + r1) + i)) * 0.8 + 0.2);
			ctx.fillStyle = rgba(r1 > 0.6 ? C.flama : color, alpha * 0.9);
			ctx.beginPath();
			ctx.ellipse(0, 0, 9 * size, 5 * size, 0, 0, Math.PI * 2);
			ctx.fill();
			ctx.restore();
		} else if (kind === 'rain') {
			const len = (40 + r3 * 40) * size;
			const py = y + ((r2 * (h + len) + t * 1500 * speed * (0.8 + r3 * 0.4)) % (h + len)) - len;
			const px = x + r1 * w + (py - y) * wind * 0.2;
			ctx.strokeStyle = rgba(color, alpha * (0.15 + r3 * 0.25));
			ctx.lineWidth = 1.2 * size;
			ctx.beginPath();
			ctx.moveTo(px, py);
			ctx.lineTo(px + len * wind * 0.2, py + len);
			ctx.stroke();
		} else if (kind === 'fireflies') {
			const px = x + r1 * w + noise2D('pff' + seed, i, t * 0.2) * 120;
			const py = y + r2 * h + noise2D('pfy' + seed, i, t * 0.2) * 90;
			const on = Math.max(0, Math.sin(t * (0.8 + r3) + i * 3)) ** 3;
			glow(ctx, px, py, 18 * size, color, alpha * on * 0.6);
		}
	}
	ctx.restore();
};

// ---------- Llama y vela ----------
export const flame2D = (ctx: Ctx, x: number, y: number, s: number, t: number, seed = 0, lean = 0, a = 1) => {
	const sway = noise2D('fl' + seed, t * 2.2, 0) * 0.18 + lean;
	const flick = 0.85 + 0.15 * noise2D('fk' + seed, t * 9, 1);
	const hgt = s * 2.6 * flick;
	ctx.save();
	ctx.translate(x, y);
	glow(ctx, 0, -hgt * 0.45, s * 9, '#ffb24a', 0.32 * a * flick);
	ctx.globalAlpha = a;
	const layer = (k: number, col: string) => {
		const wv = s * 0.55 * k;
		const hh = hgt * k;
		ctx.fillStyle = col;
		ctx.beginPath();
		ctx.moveTo(0, 0);
		ctx.bezierCurveTo(-wv * 1.15, -hh * 0.18, -wv * 0.9, -hh * 0.62, sway * hh, -hh);
		ctx.bezierCurveTo(wv * 0.9, -hh * 0.62, wv * 1.15, -hh * 0.18, 0, 0);
		ctx.fill();
	};
	ctx.globalCompositeOperation = 'lighter';
	layer(1, 'rgba(255,120,30,0.55)');
	layer(0.78, 'rgba(255,190,70,0.85)');
	layer(0.5, 'rgba(255,245,200,0.95)');
	ctx.globalCompositeOperation = 'source-over';
	ctx.fillStyle = 'rgba(40,60,140,0.35)';
	ctx.beginPath();
	ctx.ellipse(0, -s * 0.15, s * 0.22, s * 0.3, 0, 0, Math.PI * 2);
	ctx.fill();
	ctx.restore();
};

export const candle2D = (ctx: Ctx, o: {x: number; y: number; w: number; h: number; t: number; seed?: number; lit?: boolean; wax?: string; lean?: number; flameA?: number}) => {
	const {x, y, w, h, t, seed = 0, lit = true, wax = '#efe3c8', lean = 0, flameA = 1} = o;
	ctx.save();
	// cuerpo con luz que nace arriba (la cera brilla junto a la llama)
	const g = ctx.createLinearGradient(x - w / 2, 0, x + w / 2, 0);
	g.addColorStop(0, rgba(mixRGB('#1a0e06', wax, 0.35)));
	g.addColorStop(0.3, rgba(mixRGB('#1a0e06', wax, 0.78)));
	g.addColorStop(0.62, rgba(mixRGB('#1a0e06', wax, 0.9)));
	g.addColorStop(1, rgba(mixRGB('#1a0e06', wax, 0.3)));
	ctx.fillStyle = g;
	ctx.beginPath();
	ctx.moveTo(x - w / 2, y);
	ctx.lineTo(x - w / 2, y - h + w * 0.12);
	ctx.quadraticCurveTo(x, y - h - w * 0.1, x + w / 2, y - h + w * 0.12);
	ctx.lineTo(x + w / 2, y);
	ctx.closePath();
	ctx.fill();
	if (lit) {
		const gl = ctx.createLinearGradient(0, y - h, 0, y - h + w * 1.6);
		gl.addColorStop(0, 'rgba(255,190,110,0.35)');
		gl.addColorStop(1, 'rgba(255,200,120,0)');
		ctx.fillStyle = gl;
		ctx.fillRect(x - w / 2, y - h, w, w * 1.6);
	}
	// escurrimientos
	ctx.fillStyle = rgba(mixRGB('#ffffff', wax, 0.6), 0.9);
	for (let k = 0; k < 3; k++) {
		const dx = (hash(k, seed) - 0.5) * w * 0.8;
		const L = h * (0.1 + hash(k, seed + 1) * 0.3);
		ctx.beginPath();
		ctx.ellipse(x + dx, y - h + L * 0.5, w * 0.06, L * 0.5, 0, 0, Math.PI * 2);
		ctx.fill();
	}
	// pabilo
	ctx.strokeStyle = '#1a0f08';
	ctx.lineWidth = Math.max(1, w * 0.05);
	ctx.beginPath();
	ctx.moveTo(x, y - h);
	ctx.lineTo(x + lean * w * 0.2, y - h - w * 0.18);
	ctx.stroke();
	ctx.restore();
	if (lit) flame2D(ctx, x + lean * w * 0.2, y - h - w * 0.12, w * 0.32, t, seed, lean, flameA);
};

// ---------- Cempasúchil (sprite cacheado por tamaño) ----------
export const marigoldSprite = (r: number, seed = 1, tone = 0) =>
	cached(`mg:${Math.round(r)}:${seed}:${tone}`, () => {
		const R = Math.max(4, Math.round(r));
		const c = makeCanvas(R * 2.4, R * 2.4);
		const g = c.getContext('2d')!;
		g.translate(c.width / 2, c.height / 2);
		const rings = 6;
		for (let k = rings; k >= 1; k--) {
			const rr = (R * k) / rings;
			const nPet = 8 + k * 4;
			const col = mixRGB(k > rings * 0.6 ? (tone ? C.flama : C.cempa) : '#ffd36a', '#7a2e10', 0.12 + (k / rings) * 0.18);
			for (let p = 0; p < nPet; p++) {
				const a = (p / nPet) * Math.PI * 2 + hash(p + k * 31, seed) * 0.4;
				const pr = rr * (0.85 + hash(p, seed + k) * 0.3);
				g.fillStyle = rgba(mixRGB(rgbHex(col), '#ffffff', hash(p, seed + 7) * 0.12));
				g.save();
				g.rotate(a);
				g.beginPath();
				g.ellipse(pr * 0.55, 0, pr * 0.5, rr * 0.22 + 1, 0, 0, Math.PI * 2);
				g.fill();
				g.fillStyle = 'rgba(80,20,0,0.18)';
				g.fillRect(pr * 0.2, -0.6, pr * 0.6, 1.2);
				g.restore();
			}
		}
		g.fillStyle = '#5a2a0a';
		g.beginPath();
		g.arc(0, 0, R * 0.12, 0, Math.PI * 2);
		g.fill();
		return c;
	});
const rgbHex = (v: [number, number, number]) => `#${v.map((n) => n.toString(16).padStart(2, '0')).join('')}`;
export const marigold = (ctx: Ctx, x: number, y: number, r: number, rot = 0, seed = 1, tone = 0) => {
	const s = marigoldSprite(r, seed % 6, tone);
	ctx.save();
	ctx.translate(x, y);
	ctx.rotate(rot);
	ctx.drawImage(s, -s.width / 2, -s.height / 2);
	ctx.restore();
};

// ---------- Papel picado: fila de banderitas con calado y ondeo ----------
const PP_COLORS = [C.cempa, '#c2185b', C.flama, C.verde, '#6a1b9a', C.terracota];
export const papelPicado = (ctx: Ctx, o: {x0: number; x1: number; y: number; t: number; n?: number; seed?: number; sag?: number; size?: number; alpha?: number; colors?: string[]}) => {
	const {x0, x1, y, t, n = 7, seed = 1, sag = 40, size = 1, alpha = 1, colors = PP_COLORS} = o;
	const ropeY = (u: number) => y + Math.sin(Math.PI * u) * sag;
	ctx.save();
	ctx.globalAlpha = alpha;
	ctx.strokeStyle = 'rgba(30,20,10,0.8)';
	ctx.lineWidth = 2 * size;
	ctx.beginPath();
	for (let k = 0; k <= 20; k++) {
		const u = k / 20;
		const xx = lerp(x0, x1, u);
		if (k) ctx.lineTo(xx, ropeY(u));
		else ctx.moveTo(xx, ropeY(u));
	}
	ctx.stroke();
	const bw = ((x1 - x0) / n) * 0.82;
	const bh = bw * 1.25;
	for (let i = 0; i < n; i++) {
		const u = (i + 0.5) / n;
		const cx = lerp(x0, x1, u);
		const cy = ropeY(u);
		const sw = noise2D('pp' + seed, i * 0.7, t * 0.9) * 0.22;
		const col = colors[(i + seed) % colors.length];
		const sp = cached(`pp:${Math.round(bw)}:${col}:${(i + seed) % 4}`, () => ppSprite(bw, bh, col, (i + seed) % 4));
		ctx.save();
		ctx.translate(cx, cy);
		ctx.transform(1, 0, sw, 1, 0, 0);
		ctx.scale(1, 0.92 + 0.08 * Math.cos(t * 2 + i));
		ctx.drawImage(sp, -bw / 2, 0, bw, bh);
		ctx.restore();
	}
	ctx.restore();
};
const ppSprite = (bw: number, bh: number, col: string, motif: number) => {
	const c = makeCanvas(bw, bh);
	const g = c.getContext('2d')!;
	g.fillStyle = col;
	g.fillRect(0, 0, bw, bh * 0.86);
	// fleco
	for (let k = 0; k < 10; k++) {
		g.beginPath();
		g.moveTo((k / 10) * bw, bh * 0.86);
		g.lineTo(((k + 0.5) / 10) * bw, bh);
		g.lineTo(((k + 1) / 10) * bw, bh * 0.86);
		g.fill();
	}
	g.globalCompositeOperation = 'destination-out';
	const cx = bw / 2;
	const cy = bh * 0.45;
	const R = bw * 0.3;
	if (motif === 0) {
		// calaverita de calado
		g.beginPath();
		g.ellipse(cx, cy - R * 0.1, R * 0.8, R * 0.75, 0, 0, Math.PI * 2);
		g.fill();
		g.globalCompositeOperation = 'source-over';
		g.fillStyle = col;
		for (const sx of [-1, 1]) {
			g.beginPath();
			g.arc(cx + sx * R * 0.32, cy - R * 0.15, R * 0.2, 0, Math.PI * 2);
			g.fill();
		}
		g.fillRect(cx - R * 0.05, cy + R * 0.1, R * 0.1, R * 0.2);
		g.globalCompositeOperation = 'destination-out';
	} else if (motif === 1) {
		for (let p = 0; p < 8; p++) {
			const a = (p / 8) * Math.PI * 2;
			g.beginPath();
			g.ellipse(cx + Math.cos(a) * R * 0.6, cy + Math.sin(a) * R * 0.6, R * 0.32, R * 0.14, a, 0, Math.PI * 2);
			g.fill();
		}
		g.beginPath();
		g.arc(cx, cy, R * 0.2, 0, Math.PI * 2);
		g.fill();
	} else if (motif === 2) {
		g.beginPath();
		g.moveTo(cx, cy - R);
		g.lineTo(cx + R * 0.9, cy);
		g.lineTo(cx, cy + R);
		g.lineTo(cx - R * 0.9, cy);
		g.closePath();
		g.fill();
	} else {
		g.beginPath();
		g.moveTo(cx, cy + R * 0.8);
		g.bezierCurveTo(cx - R * 1.4, cy - R * 0.2, cx - R * 0.4, cy - R * 1.1, cx, cy - R * 0.35);
		g.bezierCurveTo(cx + R * 0.4, cy - R * 1.1, cx + R * 1.4, cy - R * 0.2, cx, cy + R * 0.8);
		g.fill();
	}
	for (let k = 0; k < 14; k++) {
		const a = (k / 14) * Math.PI * 2;
		g.beginPath();
		g.arc(cx + Math.cos(a) * R * 1.25, cy + Math.sin(a) * R * 1.25, bw * 0.025, 0, Math.PI * 2);
		g.fill();
	}
	return c;
};

// ---------- Humo de copal / niebla que sube ----------
export const smoke = (ctx: Ctx, o: {x: number; y: number; h: number; w: number; t: number; seed?: number; color?: string; alpha?: number}) => {
	const {x, y, h, w, t, seed = 2, color = '#d8d0c4', alpha = 0.35} = o;
	const tile = tinted(noiseTile({seed: 40 + seed, period: 3, oct: 5, contrast: 2}), color, `smoke${seed}`);
	const band = cached(`smokeband:${Math.round(w)}:${Math.round(h)}`, () => makeCanvas(w, h));
	const g = band.getContext('2d')!;
	g.setTransform(1, 0, 0, 1, 0, 0);
	g.globalCompositeOperation = 'source-over';
	g.clearRect(0, 0, band.width, band.height);
	drawTiled(g, tile, {w: band.width, h: band.height, scale: 0.9, oy: t * 70, ox: Math.sin(t * 0.5) * 30, sy: 2.2});
	g.globalCompositeOperation = 'destination-in';
	const gx = g.createLinearGradient(0, 0, w, 0);
	gx.addColorStop(0, 'rgba(0,0,0,0)');
	gx.addColorStop(0.5, 'rgba(0,0,0,1)');
	gx.addColorStop(1, 'rgba(0,0,0,0)');
	g.fillStyle = gx;
	g.fillRect(0, 0, w, h);
	const gy = g.createLinearGradient(0, 0, 0, h);
	gy.addColorStop(0, 'rgba(0,0,0,0)');
	gy.addColorStop(0.55, 'rgba(0,0,0,0.9)');
	gy.addColorStop(0.92, 'rgba(0,0,0,1)');
	gy.addColorStop(1, 'rgba(0,0,0,0)');
	g.fillStyle = gy;
	g.fillRect(0, 0, w, h);
	ctx.save();
	ctx.globalAlpha *= alpha;
	ctx.drawImage(band, x - w / 2, y - h);
	ctx.restore();
};

// ---------- Reflejo en agua: copia invertida del lienzo con ondas por franjas ----------
export const reflect = (ctx: Ctx, src: HTMLCanvasElement, o: {yLine: number; t: number; depth?: number; amp?: number; alpha?: number; tint?: string; seed?: number}) => {
	const {yLine, t, depth = H - yLine, amp = 6, alpha = 0.55, tint = '#0a1820', seed = 3} = o;
	const tmp = cached(`refl:${W}x${H}`, () => makeCanvas(W, H));
	const g = tmp.getContext('2d')!;
	g.setTransform(1, 0, 0, 1, 0, 0);
	g.globalAlpha = 1;
	g.globalCompositeOperation = 'source-over';
	g.clearRect(0, 0, W, H);
	g.drawImage(src, 0, 0);
	const strip = 4;
	ctx.save();
	for (let yy = 0; yy < depth; yy += strip) {
		const k = yy / depth;
		const off = Math.sin(yy * 0.09 + t * 2.4) * amp * (0.3 + k) + noise2D('rf' + seed, yy * 0.02, t * 0.7) * amp * 1.5 * k;
		const sy = yLine - yy - strip;
		if (sy < 0) break;
		ctx.globalAlpha = alpha * (1 - k * 0.85);
		ctx.drawImage(tmp, 0, sy, W, strip, off, yLine + yy, W, strip);
	}
	ctx.restore();
	ctx.save();
	const gr = ctx.createLinearGradient(0, yLine, 0, yLine + depth);
	gr.addColorStop(0, rgba(tint, 0.25));
	gr.addColorStop(1, rgba(tint, 0.85));
	ctx.fillStyle = gr;
	ctx.fillRect(0, yLine, W, depth);
	ctx.restore();
};

export const vignetteRect = (ctx: Ctx, k = 0.6, color = '#000') => {
	const g = ctx.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.3, W / 2, H / 2, Math.max(W, H) * 0.75);
	g.addColorStop(0, rgba(color, 0));
	g.addColorStop(1, rgba(color, clamp(k)));
	ctx.fillStyle = g;
	ctx.fillRect(0, 0, W, H);
};
