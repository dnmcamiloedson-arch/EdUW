// E1/E2 · El camino viejo: cielo, cerros, terracería en filas, utilería con semilla (magueyes, quiotes, nopales,
// barda, cruz) y el arco de hacienda de cantera. Todo en metros del mundo y proyectado con la cámara POV.
import {noise2D} from '@remotion/noise';
import {H, W, clamp, hash, lerp, rgba} from '../../lib/util';
import {cached, drawTiled, fogBand, glow, makeCanvas, noiseTile, tinted, type Ctx} from '../kit/paint';
import {marigold} from '../kit/fx';
import {paintShape} from '../kit/shade';
import {CX, FOCAL, horizonY, proj, pxPerM, type Pov} from './pov';
import {P} from './timeline';

export const ARCH_Z = 42; // el arco al final del camino (≈35 m desde donde se detiene el viajero)
export const ROAD_W = 4.2; // ancho de la terracería (m)

// ---------- cielo ----------
export const paintSky = (g: Ctx, c: Pov, t: number, opts: {moon?: [number, number, number]; glowMoon?: number} = {}) => {
	const hy = horizonY(c);
	const gr = g.createLinearGradient(0, hy - 1400, 0, hy + 40);
	gr.addColorStop(0, P.night0);
	gr.addColorStop(0.7, '#122830');
	gr.addColorStop(1, P.night1);
	g.fillStyle = gr;
	g.fillRect(0, 0, W, H);
	// nubes fbm con borde iluminado por la luna (detrás → bordes inferiores fríos)
	const tile = tinted(noiseTile({seed: 51, size: 256, period: 4, oct: 5, contrast: 1.9, bias: -0.15}), '#1d3a40', 'd5cloud');
	const rim = tinted(noiseTile({seed: 51, size: 256, period: 4, oct: 5, contrast: 1.9, bias: -0.15}), P.cloudRim, 'd5cloudrim'); // misma textura base (una sola generación)
	const ox = -t * 6 - c.yaw * FOCAL;
	const top = hy - 1500;
	drawTiled(g, tile, {y: top, h: 1400, scale: 4.4, ox, oy: 0, alpha: 0.55, sy: 0.5});
	drawTiled(g, rim, {y: top + 8, h: 1400, scale: 4.4, ox, oy: 0, alpha: 0.18, sy: 0.5, op: 'lighter'});
	if (opts.moon) {
		const [mx, my, mr] = opts.moon;
		glow(g, mx, my, mr * 3.8, P.moonRim, 0.35 * (opts.glowMoon ?? 1), 0.12);
		const mg = g.createRadialGradient(mx - mr * 0.25, my - mr * 0.25, mr * 0.1, mx, my, mr);
		mg.addColorStop(0, '#F2F0E6');
		mg.addColorStop(1, '#C9D8D6');
		g.fillStyle = mg;
		g.beginPath();
		g.arc(mx, my, mr, 0, Math.PI * 2);
		g.fill();
		g.save();
		g.beginPath();
		g.arc(mx, my, mr, 0, Math.PI * 2);
		g.clip();
		drawTiled(g, tinted(noiseTile({seed: 77, period: 3, oct: 4, contrast: 2.2}), '#7d8f8c', 'd5crater'), {x: mx - mr, y: my - mr, w: mr * 2, h: mr * 2, scale: mr / 160, alpha: 0.35, op: 'multiply'});
		g.restore();
	}
};

// ---------- cerros lejanos ----------
export const paintHills = (g: Ctx, c: Pov) => {
	const hy = horizonY(c);
	const shift = -c.yaw * FOCAL * c.zoom;
	const layer = (amp: number, freq: number, seed: string, col: string, lift: number) => {
		g.fillStyle = col;
		g.beginPath();
		g.moveTo(-20, hy + 6);
		for (let x = -20; x <= W + 20; x += 12) {
			const n = noise2D(seed, (x - shift) * freq, 0.3) * 0.6 + noise2D(seed + 'b', (x - shift) * freq * 3.1, 0.7) * 0.25;
			g.lineTo(x, hy - lift - (n * 0.5 + 0.5) * amp * c.zoom);
		}
		g.lineTo(W + 20, hy + 6);
		g.closePath();
		g.fill();
	};
	layer(70, 0.0016, 'd5h1', '#14282c', 18);
	layer(40, 0.0027, 'd5h2', '#101d1e', 4);
};

// ---------- terracería en filas de 4 px ----------
export type Lamp = {x: number; z: number; k: number; r: number}; // posición del farol en el suelo (m), intensidad, radio (m)

// tierra + surcos en una sola textura (una pasada por fila)
const groundTile = () =>
	cached('d5groundtile', () => {
		const c = makeCanvas(512, 512);
		const g = c.getContext('2d')!;
		g.drawImage(tinted(noiseTile({seed: 61, size: 256, period: 4, oct: 5, contrast: 1.6}), '#5a4a36', 'd5dirt'), 0, 0, 512, 512);
		g.globalAlpha = 0.45;
		g.globalCompositeOperation = 'source-atop';
		g.drawImage(tinted(noiseTile({seed: 62, size: 256, period: 2, oct: 3, contrast: 2.4, ridged: true}), '#0c0806', 'd5rut'), 0, 0, 512, 512);
		return c;
	});

export const paintGround = (g: Ctx, c: Pov, lamp: Lamp | null) => {
	const hy = Math.max(-200, horizonY(c));
	const base = g.createLinearGradient(0, hy, 0, H);
	base.addColorStop(0, '#1a2a28');
	base.addColorStop(0.25, '#1b211b');
	base.addColorStop(1, '#2a1c10');
	g.fillStyle = base;
	g.fillRect(0, Math.max(0, hy), W, H - Math.max(0, hy));
	const tile = groundTile();
	const pat = g.createPattern(tile, 'repeat');
	if (!pat) return;
	const f = FOCAL * c.zoom;
	const cp = Math.cos(c.pitch);
	const sp = Math.sin(c.pitch);
	const m = new DOMMatrix();
	g.save();
	g.fillStyle = pat;
	for (let y = Math.max(0, Math.ceil(hy + 2)); y < H; ) {
		const vy = -(y - 820 - c.oy) / f; // rayo de la fila en cámara
		const dirY = vy * cp + sp; // componente vertical en mundo
		const dirZ = cp - vy * sp;
		const step = y - hy < 160 ? 3 : y - hy < 500 ? 5 : 8; // filas finas cerca del horizonte
		if (dirY >= -1e-4) {
			y += step;
			continue;
		}
		const z = (c.eyeH / -dirY) * dirZ; // distancia adelante
		const rz = -c.eyeH * sp + z * cp; // profundidad en cámara
		const ppm = f / Math.max(0.05, rz);
		const sc = ppm / 320; // 512 px de textura ≈ 1.6 m
		g.globalAlpha = 0.6 * (1 - clamp((z - 8) / 60) * 0.7);
		m.a = sc;
		m.d = sc;
		m.e = CX + c.ox - c.yaw * f - c.x * 320 * sc;
		m.f = y - (c.z + z) * 320 * sc;
		pat.setTransform(m);
		g.fillRect(0, y, W, step);
		y += step;
	}
	g.restore();
	// luz del farol: caída cuadrática inversa aditiva, aplastada en perspectiva
	if (lamp && lamp.k > 0.01) lampPool(g, c, lamp);
};

export const lampPool = (g: Ctx, c: Pov, lamp: Lamp) => {
	const [sx, sy, d] = proj(c, lamp.x, 0, lamp.z);
	if (d <= 0.05) return;
	const rx = lamp.r * pxPerM(c, d);
	const [, syFar] = proj(c, lamp.x, 0, lamp.z + lamp.r);
	const [, syNear] = proj(c, lamp.x, 0, Math.max(c.z + 0.2, lamp.z - lamp.r));
	const ry = Math.max(8, (syNear - syFar) / 2);
	const cy = (syNear + syFar) / 2;
	g.save();
	g.globalCompositeOperation = 'lighter';
	g.translate(sx, cy);
	g.scale(1, ry / rx);
	const gr = g.createRadialGradient(0, (sy - cy) * (rx / ry), 0, 0, 0, rx);
	gr.addColorStop(0, rgba(P.gold, 0.6 * lamp.k));
	gr.addColorStop(0.3, rgba(P.cempa, 0.36 * lamp.k));
	gr.addColorStop(0.65, rgba(P.terra, 0.14 * lamp.k));
	gr.addColorStop(1, rgba(P.terra, 0));
	g.fillStyle = gr;
	g.fillRect(-rx, -rx, rx * 2, rx * 2);
	g.restore();
};

// ---------- niebla: tres bandas a 18, 40 y 70 m ----------
export const paintFog = (g: Ctx, c: Pov, t: number, warm = 0) => {
	const bands: [number, number, number, number][] = [
		[70, 0.32, 8, 0],
		[40, 0.26, 14, 1],
		[18, 0.18, 22, 2],
	];
	for (const [z, a, sp, seed] of bands) {
		const [, y, d] = proj(c, 0, 0, c.z + z);
		if (d <= 0) continue;
		const hh = 2.4 * pxPerM(c, d) + 60;
		fogBand(g, {y0: y - hh, y1: y + hh * 0.35, color: warm > 0.5 ? P.sand : '#5f7a74', t: t + seed * 37, seed: 71, speed: sp, alpha: a, scale: 1.4 - seed * 0.25});
	}
};

// ---------- utilería del camino ----------
export type Prop = {kind: 'maguey' | 'nopal' | 'quiote' | 'cross' | 'wall'; x: number; z: number; s: number; seed: number};
export const PROPS: Prop[] = cached('d5props', () => {
	const out: Prop[] = [];
	for (let i = 0; i < 46; i++) {
		const side = i % 2 === 0 ? -1 : 1;
		const z = 2 + i * 1.6 + hash(i, 3) * 1.2;
		const x = side * (ROAD_W / 2 + 0.9 + hash(i, 4) * 3.2);
		const r = hash(i, 5);
		out.push({kind: r < 0.72 ? 'maguey' : 'nopal', x, z, s: 0.8 + hash(i, 6) * 0.6, seed: i});
	}
	out.push({kind: 'cross', x: -(ROAD_W / 2 + 0.6), z: 9.5, s: 1, seed: 900});
	out.push({kind: 'quiote', x: -(ROAD_W / 2 + 1.6), z: 12.5, s: 1, seed: 901});
	return out;
});

const magueySprite = (seed: number) =>
	cached(`d5mag:${seed}`, () => {
		const c = makeCanvas(260, 200);
		const g = c.getContext('2d')!;
		const n = 9 + Math.floor(hash(seed, 1) * 5);
		for (let i = 0; i < n; i++) {
			const a = -Math.PI / 2 + (i / (n - 1) - 0.5) * 2.6 + (hash(seed, i + 10) - 0.5) * 0.25;
			const L = 80 + hash(seed, i + 30) * 70;
			const w = 13 + hash(seed, i + 50) * 6;
			const tx = 130 + Math.cos(a) * L;
			const ty = 196 + Math.sin(a) * L;
			const nx = -Math.sin(a);
			const ny = Math.cos(a);
			const gr = g.createLinearGradient(130, 196, tx, ty);
			gr.addColorStop(0, '#0f1a17');
			gr.addColorStop(1, '#1c312b');
			g.fillStyle = gr;
			g.beginPath();
			g.moveTo(130 - nx * w, 196 - ny * w);
			g.quadraticCurveTo(130 + Math.cos(a) * L * 0.55 - nx * w * 0.8, 196 + Math.sin(a) * L * 0.55 - ny * w * 0.8, tx, ty);
			g.quadraticCurveTo(130 + Math.cos(a) * L * 0.55 + nx * w * 0.8, 196 + Math.sin(a) * L * 0.55 + ny * w * 0.8, 130 + nx * w, 196 + ny * w);
			g.fill();
			// rim de luna (de atrás: borde superior frío)
			g.strokeStyle = rgba(P.moonRim, 0.35);
			g.lineWidth = 1.5;
			g.beginPath();
			g.moveTo(130 - nx * w * 0.9, 196 - ny * w * 0.9);
			g.quadraticCurveTo(130 + Math.cos(a) * L * 0.55 - nx * w * 0.7, 196 + Math.sin(a) * L * 0.55 - ny * w * 0.7, tx, ty);
			g.stroke();
		}
		return c;
	});

const nopalSprite = (seed: number) =>
	cached(`d5nop:${seed}`, () => {
		const c = makeCanvas(200, 220);
		const g = c.getContext('2d')!;
		const pad = (x: number, y: number, r: number, a: number) => {
			g.save();
			g.translate(x, y);
			g.rotate(a);
			g.fillStyle = '#15241e';
			g.beginPath();
			g.ellipse(0, 0, r * 0.62, r, 0, 0, Math.PI * 2);
			g.fill();
			g.strokeStyle = rgba(P.moonRim, 0.3);
			g.lineWidth = 1.5;
			g.beginPath();
			g.ellipse(0, 0, r * 0.62, r, 0, Math.PI * 1.1, Math.PI * 1.9);
			g.stroke();
			g.restore();
		};
		pad(100, 170, 46, 0);
		pad(70, 105, 36, -0.4 + hash(seed, 1) * 0.2);
		pad(132, 98, 34, 0.45);
		pad(108, 48, 28, 0.1);
		return c;
	});

// dibuja un sprite parado en (x, z) con altura hM metros; light = luz del farol 0..1 en ese punto
const standSprite = (g: Ctx, c: Pov, spr: HTMLCanvasElement, key: string, x: number, z: number, hM: number, warm: number, fog: number) => {
	const [sx, sy, d] = proj(c, x, 0, z);
	if (d < 0.3) return;
	const k = pxPerM(c, d);
	const h = hM * k;
	const w = (spr.width / spr.height) * h;
	if (sx + w < -50 || sx - w > W + 50) return;
	g.save();
	g.translate(sx, sy);
	g.rotate(-c.roll * 0);
	g.drawImage(spr, -w / 2, -h, w, h);
	if (warm > 0.02) {
		g.globalCompositeOperation = 'lighter';
		g.globalAlpha = warm * 0.35;
		g.drawImage(tintedSprite(spr, key, P.cempa), -w / 2, -h, w, h);
	}
	if (fog > 0.02) {
		g.globalCompositeOperation = 'source-atop';
		g.globalAlpha = fog;
		g.fillStyle = '#1a2b2c';
		g.fillRect(-w / 2, -h, w, h);
	}
	g.restore();
};
const tintedSprite = (spr: HTMLCanvasElement, key: string, col: string) =>
	cached(`d5tint:${key}:${col}`, () => {
		const c = makeCanvas(spr.width, spr.height);
		const g = c.getContext('2d')!;
		g.drawImage(spr, 0, 0);
		g.globalCompositeOperation = 'source-in';
		g.fillStyle = col;
		g.fillRect(0, 0, c.width, c.height);
		return c;
	});

// cruz de camino con corona seca de cempasúchil
const crossWood = (g2: Ctx, k: number, lean: number) => {
	// poste y travesaño con extremos tallados, un poco vencida
	g2.save();
	g2.rotate(lean);
	g2.rect(-0.065 * k, -1.85 * k, 0.13 * k, 1.85 * k);
	g2.rect(-0.46 * k, -1.42 * k, 0.92 * k, 0.12 * k);
	g2.rect(-0.085 * k, -1.9 * k, 0.17 * k, 0.07 * k);
	g2.rect(-0.5 * k, -1.44 * k, 0.06 * k, 0.16 * k);
	g2.rect(0.44 * k, -1.44 * k, 0.06 * k, 0.16 * k);
	g2.restore();
};
const paintCross = (g: Ctx, c: Pov, x: number, z: number, warm: number) => {
	const [sx, sy, d] = proj(c, x, 0, z);
	if (d < 0.3) return;
	const k = pxPerM(c, d);
	const lean = -0.06;
	g.save();
	g.translate(sx, sy);
	// montículo de piedras al pie
	g.fillStyle = '#17120c';
	g.beginPath();
	g.ellipse(0, 0, 0.42 * k, 0.12 * k, 0, Math.PI, 0);
	g.fill();
	for (let i = 0; i < 7; i++) {
		const px = (hash(i, 31) - 0.5) * 0.7 * k;
		const pr = (0.06 + hash(i, 32) * 0.06) * k;
		g.fillStyle = i % 2 ? '#2a241c' : '#1e1912';
		g.beginPath();
		g.ellipse(px, -pr * 0.5, pr, pr * 0.7, 0, 0, Math.PI * 2);
		g.fill();
		g.fillStyle = rgba(P.moonRim, 0.12);
		g.beginPath();
		g.ellipse(px, -pr * 0.9, pr * 0.7, pr * 0.25, 0, Math.PI, 0);
		g.fill();
	}
	paintShape(
		g,
		(g2) => crossWood(g2, k, lean),
		[-0.6 * k, -1.95 * k, 1.2 * k, 1.95 * k],
		{
			fill: '#1f150c',
			light: -Math.PI / 2 - 0.3,
			rim: {color: P.moonRim, width: Math.max(1, 0.02 * k), alpha: 0.45, blur: 1},
			shadow: {color: '#050302', width: Math.max(2, 0.05 * k), alpha: 0.6, blur: 2},
			texture: {seed: 33, scale: 0.5, alpha: 0.3, color: '#3a3430'},
			halo: warm > 0.02 ? {color: P.cempa, r: 6, alpha: warm * 0.3} : undefined,
		},
		1,
	);
	// corona seca de cempasúchil colgada del cruce (con listón caído)
	g.rotate(lean);
	g.strokeStyle = '#3a2a14';
	g.lineWidth = Math.max(1, 0.02 * k);
	g.beginPath();
	g.ellipse(0, -1.25 * k, 0.15 * k, 0.17 * k, 0, 0, Math.PI * 2);
	g.stroke();
	for (let i = 0; i < 14; i++) {
		const a = (i / 14) * Math.PI * 2 + 0.2;
		marigold(g, Math.sin(a) * 0.15 * k, -1.25 * k + Math.cos(a) * 0.17 * k, (0.036 + hash(i, 33) * 0.012) * k, a, 900 + i, 0.8);
	}
	g.strokeStyle = rgba('#5a2a18', 0.8);
	g.lineWidth = Math.max(1, 0.025 * k);
	g.beginPath();
	g.moveTo(0, -1.08 * k);
	g.quadraticCurveTo(0.05 * k, -0.85 * k, 0.02 * k, -0.62 * k);
	g.stroke();
	g.restore();
};

// quiote seco (vara floral del maguey) con vainas; sway = ráfaga (rad)
const paintQuiote = (g: Ctx, c: Pov, x: number, z: number, sway: number, rattle: number) => {
	const [sx, sy, d] = proj(c, x, 0, z);
	if (d < 0.3) return;
	const k = pxPerM(c, d);
	g.save();
	g.translate(sx, sy);
	g.drawImage(magueySprite(77), -1.2 * k, -1.0 * k, 2.4 * k, 1.0 * k);
	g.strokeStyle = '#1e1a12';
	g.lineWidth = Math.max(1.5, 0.07 * k);
	g.lineCap = 'round';
	const top = -5.2 * k;
	const tipX = Math.sin(sway) * 5.2 * k;
	g.beginPath();
	g.moveTo(0, -0.6 * k);
	g.quadraticCurveTo(tipX * 0.3, top * 0.55, tipX, top);
	g.stroke();
	g.strokeStyle = rgba(P.moonRim, 0.3);
	g.lineWidth = Math.max(1, 0.02 * k);
	g.stroke();
	for (let i = 0; i < 6; i++) {
		const u = 0.62 + i * 0.065;
		const bx = tipX * u * u;
		const by = top * u;
		const side = i % 2 ? 1 : -1;
		const jig = Math.sin(rattle * 40 + i) * rattle * 0.08 * k;
		g.fillStyle = '#2a2015';
		g.beginPath();
		g.ellipse(bx + side * 0.28 * k + jig, by + 0.1 * k, 0.11 * k, 0.07 * k, side * 0.4, 0, Math.PI * 2);
		g.fill();
		g.strokeStyle = '#1e1a12';
		g.lineWidth = Math.max(1, 0.02 * k);
		g.beginPath();
		g.moveTo(bx, by);
		g.lineTo(bx + side * 0.24 * k + jig, by + 0.08 * k);
		g.stroke();
	}
	g.restore();
};

// barda de piedra seca (lado derecho), tramo continuo
const paintWall = (g: Ctx, c: Pov, warmAt: (x: number, z: number) => number) => {
	const xw = ROAD_W / 2 + 0.5;
	const z0 = Math.max(c.z + 0.6, 0);
	const z1 = c.z + 60;
	g.fillStyle = '#1a1f1c';
	g.beginPath();
	const top: [number, number][] = [];
	const bot: [number, number][] = [];
	for (let z = z0; z <= z1; z += Math.max(0.5, (z - c.z) * 0.12)) {
		const h = 0.85 + noise2D('d5wall', z * 0.4, 0) * 0.12;
		const [ax, ay, d] = proj(c, xw, h, z);
		const [, by] = proj(c, xw, 0, z);
		if (d <= 0) continue;
		top.push([ax, ay]);
		bot.push([ax, by]);
	}
	if (top.length < 2) return;
	g.moveTo(top[0][0], top[0][1]);
	for (const p of top) g.lineTo(p[0], p[1]);
	for (let i = bot.length - 1; i >= 0; i--) g.lineTo(bot[i][0], bot[i][1]);
	g.closePath();
	g.fill();
	g.strokeStyle = rgba(P.moonRim, 0.25);
	g.lineWidth = 1.5;
	g.beginPath();
	g.moveTo(top[0][0], top[0][1]);
	for (const p of top) g.lineTo(p[0], p[1]);
	g.stroke();
	const w = warmAt(xw, c.z + 1.5);
	if (w > 0.02) {
		g.save();
		g.globalCompositeOperation = 'lighter';
		g.globalAlpha = w * 0.2;
		g.fillStyle = P.cempa;
		g.fill();
		g.restore();
	}
};

// utilería ordenada de lejos a cerca; extra(z) permite intercalar capas (charro, arco) por profundidad
export const paintProps = (g: Ctx, c: Pov, t: number, o: {lamp: Lamp | null; quiote?: {sway: number; rattle: number}; layers?: {z: number; fn: () => void}[]}) => {
	const warmAt = (x: number, z: number) => {
		if (!o.lamp) return 0;
		const d = Math.hypot(x - o.lamp.x, z - o.lamp.z);
		return clamp(o.lamp.k / (1 + (d / (o.lamp.r * 0.6)) ** 2));
	};
	type Item = {z: number; fn: () => void};
	const items: Item[] = [...(o.layers ?? [])];
	items.push({z: c.z + 30, fn: () => paintWall(g, c, warmAt)}); // la barda se pinta como un tramo único
	for (const p of PROPS) {
		if (p.z < c.z + 0.4 || p.z > c.z + 75) continue;
		const fog = clamp((p.z - c.z - 10) / 55) * 0.85;
		const warm = warmAt(p.x, p.z);
		if (p.kind === 'maguey') items.push({z: p.z, fn: () => standSprite(g, c, magueySprite(p.seed % 12), 'm' + (p.seed % 12), p.x, p.z, 1.3 * p.s, warm, fog)});
		else if (p.kind === 'nopal') items.push({z: p.z, fn: () => standSprite(g, c, nopalSprite(p.seed % 6), 'n' + (p.seed % 6), p.x, p.z, 1.5 * p.s, warm, fog)});
		else if (p.kind === 'cross') items.push({z: p.z, fn: () => paintCross(g, c, p.x, p.z, warm)});
		else if (p.kind === 'quiote') items.push({z: p.z, fn: () => paintQuiote(g, c, p.x, p.z, (o.quiote?.sway ?? 0) + Math.sin(t * 0.9) * 0.01, o.quiote?.rattle ?? 0)});
	}
	items.sort((a, b) => b.z - a.z);
	for (const it of items) it.fn();
};

// ---------- arco de hacienda de cantera (medio punto + espadaña vacía) ----------
// inside(): lo que se ve dentro del vano (charro lejano) — se pinta ANTES de las jambas
export const paintArch = (g: Ctx, c: Pov, t: number, inside?: () => void) => {
	const z = ARCH_Z;
	const [sx, sy, d] = proj(c, 0, 0, z);
	if (d <= 0.5) return;
	const k = pxPerM(c, d);
	// glow de niebla detrás del vano
	glow(g, sx, sy - 2.2 * k, 5.5 * k, '#7fb0ac', 0.45, 0.25);
	fogBand(g, {y0: sy - 3.6 * k, y1: sy + 0.6 * k, x: sx - 4 * k, w: 8 * k, color: '#9FC3C4', t, seed: 71, speed: 4, alpha: 0.45, scale: 0.8});
	inside?.();
	g.save();
	g.translate(sx, sy);
	const ow = 3.2; // vano
	const wallW = 7.2;
	const hSpring = 3.0;
	g.fillStyle = '#2b2e29';
	g.beginPath();
	g.rect(-wallW / 2 * k, -(hSpring + ow / 2 + 1.0) * k, wallW * k, (hSpring + ow / 2 + 1.0) * k);
	// espadaña
	g.moveTo(-1.1 * k, -(hSpring + ow / 2 + 1.0) * k);
	g.lineTo(-1.1 * k, -(hSpring + ow / 2 + 2.6) * k);
	g.arc(0, -(hSpring + ow / 2 + 2.6) * k, 1.1 * k, Math.PI, 0);
	g.lineTo(1.1 * k, -(hSpring + ow / 2 + 1.0) * k);
	g.closePath();
	// vano (recorte) y ojo de la espadaña
	g.moveTo(ow / 2 * k, 0);
	g.lineTo(ow / 2 * k, -hSpring * k);
	g.arc(0, -hSpring * k, ow / 2 * k, 0, Math.PI, true);
	g.lineTo(-ow / 2 * k, 0);
	g.closePath();
	g.moveTo(0.5 * k, -(hSpring + ow / 2 + 2.4) * k);
	g.arc(0, -(hSpring + ow / 2 + 2.4) * k, 0.5 * k, 0, Math.PI, true);
	g.lineTo(-0.5 * k, -(hSpring + ow / 2 + 1.6) * k);
	g.lineTo(0.5 * k, -(hSpring + ow / 2 + 1.6) * k);
	g.closePath();
	g.fill('evenodd');
	// cantera: rim de luna arriba, intradós más oscuro
	g.strokeStyle = rgba(P.moonRim, 0.4);
	g.lineWidth = Math.max(1, 0.04 * k);
	g.beginPath();
	g.moveTo(-wallW / 2 * k, -(hSpring + ow / 2 + 1.0) * k);
	g.lineTo(wallW / 2 * k, -(hSpring + ow / 2 + 1.0) * k);
	g.stroke();
	g.strokeStyle = 'rgba(8,10,9,0.8)';
	g.lineWidth = Math.max(1, 0.12 * k);
	g.beginPath();
	g.moveTo(ow / 2 * k, 0);
	g.lineTo(ow / 2 * k, -hSpring * k);
	g.arc(0, -hSpring * k, ow / 2 * k, 0, Math.PI, true);
	g.lineTo(-ow / 2 * k, 0);
	g.stroke();
	g.restore();
	void lerp;
};
