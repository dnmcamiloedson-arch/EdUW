// Día 7 · el set (en caché): pared de cal sobre adobe, empedrado de río, el callejón con niebla y papel picado,
// y las cubetas de cempasúchil del primer plano. El albedo se pinta una vez; la luz del foco llega después (light.ts).
import {C, H, W, clamp, hash, mixRGB, rgba} from '../../lib/util';
import {cached, drawTiled, glow, makeCanvas, tinted, type Ctx} from '../kit/paint';
import {tile} from './tiles';
import {papelPicado} from '../kit/fx';
import {EYE, F_, HZ, P, WALL_BASE, WALL_SX0, WALL_Z, pxPerM, sx, sy} from './world';

// el lienzo del set cubre más que la pantalla (cámara en mano, paneo, golpe del susto)
export const SET_X0 = -120;
export const SET_Y0 = 360;
const SET_W = W + 240;
const SET_H = H + 120 - SET_Y0;

type RGB = [number, number, number];
const hx = (c: string): RGB => mixRGB(c, c, 0);
const mixA = (a: RGB, b: RGB, t: number): RGB => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
const css = (v: RGB) => `rgb(${v[0] | 0},${v[1] | 0},${v[2] | 0})`;

// ---------------------------------------------------------------- pared
const paintWall = (g: Ctx) => {
	const x0 = WALL_SX0;
	const yTop = SET_Y0;
	const yb = WALL_BASE;
	const ww = SET_X0 + SET_W - x0;
	// cal: base clara con manchas
	g.fillStyle = '#E9D5B4';
	g.fillRect(x0, yTop, ww, yb - yTop);
	const mott = tinted(tile({period: 4, contrast: 1.8}), '#B89470', 'd07mott');
	drawTiled(g, mott, {x: x0, y: yTop, w: ww, h: yb - yTop, scale: 1.6, alpha: 0.3});
	const fine = tinted(tile({period: 4, contrast: 2.2, ox: 101, oy: 37}), '#8E6A48', 'd07fine');
	drawTiled(g, fine, {x: x0, y: yTop, w: ww, h: yb - yTop, scale: 0.7, alpha: 0.16});
	// adobe asomando donde se cayó la cal (máscara de ruido con umbral)
	const brick = makeCanvas(ww, yb - yTop);
	const b = brick.getContext('2d')!;
	b.fillStyle = '#6E2A1A';
	b.fillRect(0, 0, brick.width, brick.height);
	const bw = 0.4 * pxPerM(WALL_Z);
	const bh = 0.11 * pxPerM(WALL_Z);
	for (let r = 0; r * bh < brick.height; r++)
		for (let c = -1; c * bw < brick.width; c++) {
			const ox = (r % 2) * bw * 0.5;
			const k = r * 97 + c;
			b.fillStyle = css(mixRGB(C.terracota, '#5E2616', 0.15 + hash(k, 3) * 0.45));
			b.fillRect(c * bw + ox + 3, r * bh + 3, bw - 6, bh - 6);
		}
	const pm = tile({period: 4, contrast: 6, bias: -0.8, ox: 53, oy: 171});
	drawTiled(b, pm, {w: brick.width, h: brick.height, scale: 2.6, ox: 140, oy: 60, op: 'destination-in'});
	// la cal aguanta arriba (donde cae el ala de la sombra) y se cae más abajo, por la humedad del rodapié
	const keep = b.createLinearGradient(0, 0, 0, brick.height);
	keep.addColorStop(0, 'rgba(0,0,0,0.12)');
	keep.addColorStop(0.42, 'rgba(0,0,0,0.25)');
	keep.addColorStop(0.75, 'rgba(0,0,0,1)');
	keep.addColorStop(1, 'rgba(0,0,0,1)');
	b.globalCompositeOperation = 'destination-in';
	b.fillStyle = keep;
	b.fillRect(0, 0, brick.width, brick.height);
	b.globalCompositeOperation = 'source-over';
	// borde de la cal rota: sombra suave alrededor del parche
	g.save();
	g.filter = 'blur(3px)';
	g.globalAlpha = 0.55;
	g.globalCompositeOperation = 'multiply';
	g.drawImage(brick, x0 + 2, yTop + 3);
	g.restore();
	g.drawImage(brick, x0, yTop);
	// escurrimientos verticales
	for (let i = 0; i < 14; i++) {
		const x = x0 + hash(i, 81) * ww;
		const len = 120 + hash(i, 82) * 380;
		const w = 10 + hash(i, 83) * 30;
		const gr = g.createLinearGradient(0, yTop, 0, yTop + len);
		gr.addColorStop(0, 'rgba(90,70,50,0.22)');
		gr.addColorStop(1, 'rgba(90,70,50,0)');
		g.fillStyle = gr;
		g.fillRect(x, yTop, w, len);
	}
	// grietas finas (caminatas deterministas)
	g.strokeStyle = 'rgba(60,40,25,0.55)';
	g.lineCap = 'round';
	for (let i = 0; i < 9; i++) {
		let x = x0 + hash(i, 91) * ww;
		let y = yTop + 80 + hash(i, 92) * (yb - yTop - 200);
		let a = Math.PI * 0.5 + (hash(i, 93) - 0.5) * 1.2;
		g.lineWidth = 1.2;
		g.beginPath();
		g.moveTo(x, y);
		for (let s = 0; s < 18; s++) {
			a += (hash(s, i * 7 + 94) - 0.5) * 0.9;
			x += Math.cos(a) * 9;
			y += Math.sin(a) * 9;
			g.lineTo(x, y);
		}
		g.stroke();
	}
	// rodapié de terracota
	const rodTop = sy(0.32, WALL_Z);
	const rg = g.createLinearGradient(0, rodTop, 0, yb);
	rg.addColorStop(0, '#B4472C');
	rg.addColorStop(1, '#8C3420');
	g.fillStyle = rg;
	g.fillRect(x0, rodTop, ww, yb - rodTop);
	drawTiled(g, mott, {x: x0, y: rodTop, w: ww, h: yb - rodTop, scale: 1.1, alpha: 0.3});
	g.fillStyle = 'rgba(255,230,190,0.25)';
	g.fillRect(x0, rodTop - 2, ww, 3);
	// esquina de la casa (arista)
	const eg = g.createLinearGradient(x0, 0, x0 + 26, 0);
	eg.addColorStop(0, 'rgba(60,40,25,0.45)');
	eg.addColorStop(1, 'rgba(60,40,25,0)');
	g.fillStyle = eg;
	g.fillRect(x0, yTop, 26, yb - yTop);
	// ventana con postigos verdes y reja oxidada (x 760–1000, y 520–900)
	const wx0 = 760;
	const wx1 = 1000;
	const wy0 = 520;
	const wy1 = 900;
	g.fillStyle = '#5A4632';
	g.fillRect(wx0 - 16, wy0 - 16, wx1 - wx0 + 32, wy1 - wy0 + 34);
	g.fillStyle = '#E2C79E';
	g.fillRect(wx0 - 24, wy1 + 14, wx1 - wx0 + 48, 14);
	const half = (wx1 - wx0) / 2;
	for (let s = 0; s < 2; s++) {
		const ax = wx0 + s * half;
		const sg = g.createLinearGradient(ax, 0, ax + half, 0);
		sg.addColorStop(0, '#1A4A3A');
		sg.addColorStop(1, '#245E4A');
		g.fillStyle = sg;
		g.fillRect(ax + 2, wy0, half - 4, wy1 - wy0);
		g.strokeStyle = 'rgba(8,20,16,0.6)';
		g.lineWidth = 2;
		for (let k = 1; k < 4; k++) {
			g.beginPath();
			g.moveTo(ax + (half * k) / 4, wy0 + 6);
			g.lineTo(ax + (half * k) / 4, wy1 - 6);
			g.stroke();
		}
		g.strokeStyle = 'rgba(200,230,210,0.12)';
		g.strokeRect(ax + 12, wy0 + 14, half - 24, (wy1 - wy0) * 0.42);
		g.strokeRect(ax + 12, wy0 + (wy1 - wy0) * 0.52, half - 24, (wy1 - wy0) * 0.42);
	}
	drawTiled(g, fine, {x: wx0, y: wy0, w: wx1 - wx0, h: wy1 - wy0, scale: 0.5, alpha: 0.25});
	// reja: barrotes con su sombrita (el foco viene de arriba a la izquierda)
	const bars = 9;
	for (let pass = 0; pass < 2; pass++) {
		g.strokeStyle = pass === 0 ? 'rgba(10,20,15,0.55)' : '#3B2A1E';
		g.lineWidth = pass === 0 ? 6 : 7;
		const dx = pass === 0 ? 9 : 0;
		const dy = pass === 0 ? 7 : 0;
		for (let k = 0; k <= bars; k++) {
			const x = wx0 - 6 + ((wx1 - wx0 + 12) * k) / bars;
			g.beginPath();
			g.moveTo(x + dx, wy0 - 10 + dy);
			g.lineTo(x + dx, wy1 + 10 + dy);
			g.stroke();
		}
		for (const yy of [wy0 + 30, (wy0 + wy1) / 2, wy1 - 30]) {
			g.beginPath();
			g.moveTo(wx0 - 12 + dx, yy + dy);
			g.lineTo(wx1 + 12 + dx, yy + dy);
			g.stroke();
		}
	}
	g.strokeStyle = 'rgba(170,90,50,0.45)';
	g.lineWidth = 2;
	for (let k = 0; k <= bars; k++) {
		const x = wx0 - 6 + ((wx1 - wx0 + 12) * k) / bars - 2;
		g.beginPath();
		g.moveTo(x, wy0 - 10);
		g.lineTo(x, wy1 + 10);
		g.stroke();
	}
};

// ---------------------------------------------------------------- empedrado
const paintStreet = (g: Ctx) => {
	const y0 = WALL_BASE;
	const y1 = SET_Y0 + SET_H;
	const gr = g.createLinearGradient(0, y0, 0, y1);
	gr.addColorStop(0, '#4A3B2D');
	gr.addColorStop(1, '#2E241A');
	g.fillStyle = gr;
	g.fillRect(SET_X0, y0, SET_W, y1 - y0);
	// cuneta al pie del muro
	g.fillStyle = 'rgba(30,20,12,0.55)';
	g.fillRect(SET_X0, y0, SET_W, 5);
	// piedras de río: celdas redondeadas en perspectiva
	let row = 0;
	for (let z = WALL_Z - 0.05; z > 0.78; row++) {
		const step = 0.085 + 0.03 * hash(row, 5);
		const xr = (SET_W / 2 + 200) * (z / F_);
		const sp = 0.115;
		for (let x = -xr - (row % 2) * sp * 0.5; x < xr; x += sp * (0.85 + 0.3 * hash(row * 131 + Math.round(x * 100), 6))) {
			const k = row * 1000 + Math.round((x + 10) * 100);
			const zz = z + (hash(k, 7) - 0.5) * 0.03;
			const [px, py] = P(x + (hash(k, 8) - 0.5) * 0.03, 0, zz);
			const s = pxPerM(zz);
			const rw = (0.045 + 0.02 * hash(k, 9)) * s;
			const rh = rw * ((F_ * EYE) / (zz * zz) / s) * (0.9 + 0.3 * hash(k, 10));
			if (py < y0 - 2) continue;
			const tone = hash(k, 11);
			const base = mixRGB('#6E5E4E', '#9A8670', tone);
			const sg = g.createRadialGradient(px - rw * 0.25, py - rh * 0.45, 0, px, py, rw * 1.1);
			sg.addColorStop(0, css(mixA(base, hx('#E8DCC6'), 0.22)));
			sg.addColorStop(0.55, css(base));
			sg.addColorStop(1, css(mixA(hx('#2C2018'), base, 0.45)));
			g.fillStyle = sg;
			g.beginPath();
			g.ellipse(px, py, rw, Math.max(1.2, rh), (hash(k, 12) - 0.5) * 0.3, 0, Math.PI * 2);
			g.fill();
		}
		z -= step * (z / 3.2) ** 0.6;
	}
	// pétalos de cempasúchil sueltos hacia una puerta lejana
	for (let i = 0; i < 70; i++) {
		const z = 1.3 + hash(i, 21) ** 0.7 * 2.8;
		const x = -0.9 + hash(i, 22) * 2.2 + (z > 3 ? 0.4 : 0);
		const [px, py] = P(x, 0, z);
		const s = pxPerM(z) * 0.018;
		g.fillStyle = rgba(hash(i, 23) > 0.4 ? C.cempa : C.flama, 0.9);
		g.beginPath();
		g.ellipse(px, py, s * (1 + hash(i, 24)), s * 0.45, hash(i, 25) * 3, 0, Math.PI * 2);
		g.fill();
	}
};

// profundidad de campo del empedrado con el foco en la pared: bandas cada vez más borrosas hacia la cámara
const DOF_BANDS: [number, number, number][] = [
	[5, 1150, 1300],
	[11, 1300, 1460],
	[20, 1460, 1720],
];
export const setCanvas = () =>
	cached('d07:set', () => {
		const c = makeCanvas(SET_W, SET_H);
		const g = c.getContext('2d')!;
		g.translate(-SET_X0, -SET_Y0);
		paintWall(g);
		paintStreet(g);
		g.setTransform(1, 0, 0, 1, 0, 0);
		// desenfoque por bandas a media resolución (barato y se ve igual)
		const HW = Math.ceil(SET_W / 2);
		const HH = Math.ceil(SET_H / 2);
		const half = makeCanvas(HW, HH);
		const hq = half.getContext('2d')!;
		hq.drawImage(c, 0, 0, HW, HH);
		const tmp = makeCanvas(HW, HH);
		const q = tmp.getContext('2d')!;
		for (const [r, ya, yb] of DOF_BANDS) {
			q.setTransform(1, 0, 0, 1, 0, 0);
			q.globalCompositeOperation = 'source-over';
			q.clearRect(0, 0, HW, HH);
			q.filter = `blur(${r / 2}px)`;
			q.drawImage(half, 0, 0);
			q.filter = 'none';
			q.globalCompositeOperation = 'destination-in';
			const gr = q.createLinearGradient(0, (ya - SET_Y0) / 2, 0, (yb - SET_Y0) / 2);
			gr.addColorStop(0, 'rgba(0,0,0,0)');
			gr.addColorStop(1, 'rgba(0,0,0,1)');
			q.fillStyle = gr;
			q.fillRect(0, (ya - SET_Y0) / 2, HW, HH);
			g.imageSmoothingEnabled = true;
			g.drawImage(tmp, 0, 0, SET_W, SET_H);
		}
		return c;
	});
export const drawSet = (g: Ctx) => {
	g.drawImage(setCanvas(), SET_X0, SET_Y0);
};

// ---------------------------------------------------------------- callejón (luz propia, niebla, papel picado, tecolote)
const alleyStatic = () =>
	cached('d07:alley', () => {
		const w = Math.ceil(WALL_SX0 - SET_X0) + 4;
		const h = Math.ceil(WALL_BASE - SET_Y0) + 40;
		const c = makeCanvas(w, h);
		const g = c.getContext('2d')!;
		g.translate(-SET_X0, -SET_Y0);
		const sk = g.createLinearGradient(0, SET_Y0, 0, WALL_BASE);
		sk.addColorStop(0, '#0E1C20');
		sk.addColorStop(0.6, '#1A3236');
		sk.addColorStop(1, '#22383A');
		g.fillStyle = sk;
		g.fillRect(SET_X0, SET_Y0, w, h);
		// muro izquierdo del callejón, fugando (x = −2.4 m, z 4.6 → 16)
		const L = -2.4;
		const zs = [4.6, 6, 8, 11, 16];
		g.fillStyle = '#2E3B37';
		g.beginPath();
		g.moveTo(sx(L, zs[0]), sy(3.2, zs[0]));
		for (const z of zs) g.lineTo(sx(L, z), sy(3.2, z));
		for (let i = zs.length - 1; i >= 0; i--) g.lineTo(sx(L, zs[i]), sy(0, zs[i]));
		g.closePath();
		g.fill();
		// piso del callejón
		g.fillStyle = '#25302B';
		g.beginPath();
		g.moveTo(sx(L, 4.6), sy(0, 4.6));
		g.lineTo(sx(L, 16), sy(0, 16));
		g.lineTo(WALL_SX0 + 4, sy(0, 16));
		g.lineTo(WALL_SX0 + 4, WALL_BASE + 40);
		g.lineTo(SET_X0, WALL_BASE + 40);
		g.closePath();
		g.fill();
		// puertas y ventanitas en el muro lejano
		for (let i = 0; i < 4; i++) {
			const z = 6 + i * 2.4;
			const xA = sx(L, z);
			const xB = sx(L, z + 0.9);
			g.fillStyle = 'rgba(10,16,15,0.75)';
			g.beginPath();
			g.moveTo(xA, sy(0, z));
			g.lineTo(xA, sy(1.9, z));
			g.lineTo(xB, sy(1.9, z + 0.9));
			g.lineTo(xB, sy(0, z + 0.9));
			g.closePath();
			g.fill();
		}
		return c;
	});

// niebla del callejón: UNA textura chica (256, 4 octavas) compartida por las tres bandas (la del kit hace 3 de 512)
const fogBuf = () => cached('d07:fogbuf', () => makeCanvas(420, 300));
const alleyFog = (ctx: Ctx, o: {y0: number; y1: number; color: string; t: number; ox: number; alpha: number; speed: number; x: number; w: number}) => {
	const band = fogBuf();
	const bw = Math.min(band.width, Math.round(o.w));
	const bh = Math.min(band.height, Math.round(o.y1 - o.y0));
	const g = band.getContext('2d')!;
	g.setTransform(1, 0, 0, 1, 0, 0);
	g.globalCompositeOperation = 'source-over';
	g.globalAlpha = 1;
	g.clearRect(0, 0, band.width, band.height);
	const ft = tinted(tile({period: 4, contrast: 1.5, ox: 30, oy: 60}), o.color, `d07fog${o.color}`);
	drawTiled(g, ft, {w: bw, h: bh, scale: 1.6, ox: -o.t * o.speed + o.ox, sy: 0.45});
	drawTiled(g, ft, {w: bw, h: bh, scale: 1.0, ox: o.t * o.speed * 0.55 + 200 + o.ox, oy: 90, alpha: 0.7, sy: 0.4});
	g.globalCompositeOperation = 'destination-in';
	const gr = g.createLinearGradient(0, 0, 0, bh);
	gr.addColorStop(0, 'rgba(0,0,0,0)');
	gr.addColorStop(0.35, 'rgba(0,0,0,1)');
	gr.addColorStop(0.7, 'rgba(0,0,0,1)');
	gr.addColorStop(1, 'rgba(0,0,0,0)');
	g.fillStyle = gr;
	g.fillRect(0, 0, bw, bh);
	ctx.save();
	ctx.globalAlpha *= o.alpha;
	ctx.drawImage(band, 0, 0, bw, bh, o.x, o.y0, bw, bh);
	ctx.restore();
};
export const drawAlley = (g: Ctx, t: number, f: number, owl?: (g: Ctx) => void) => {
	g.save();
	g.beginPath();
	g.rect(SET_X0, SET_Y0, WALL_SX0 - SET_X0 + 1, WALL_BASE - SET_Y0 + 1);
	g.clip();
	g.drawImage(alleyStatic(), SET_X0, SET_Y0);
	// farol lejano en el muro del callejón
	const [lx, ly] = P(-2.3, 2.3, 9.5);
	glow(g, lx, ly, 260, '#9FB7A8', 0.28);
	glow(g, lx, ly, 60, '#F4E3B8', 0.6, 0.25);
	// cable bajo con el tecolote, papel picado
	g.strokeStyle = 'rgba(8,12,12,0.9)';
	g.lineWidth = 2;
	g.beginPath();
	const c0 = P(-2.4, 2.0, 6.2);
	const c1 = P(-0.8, 2.05, 6.2);
	g.moveTo(c0[0], c0[1]);
	g.quadraticCurveTo((c0[0] + c1[0]) / 2, c0[1] + 70, c1[0] + 200, c1[1] + 40);
	g.stroke();
	papelPicado(g, {x0: SET_X0 - 20, x1: WALL_SX0 + 60, y: 480, t, n: 4, sag: 30, seed: 7, size: 0.55, alpha: 0.85, colors: [C.marfil, C.cempa, C.marfil, C.cempa]});
	if (owl) owl(g);
	// niebla teal en capas
	const fw = WALL_SX0 - SET_X0 + 40;
	alleyFog(g, {y0: 640, y1: 900, color: '#6F9A94', t, ox: 0, alpha: 0.35, speed: 6, x: SET_X0, w: fw});
	alleyFog(g, {y0: 760, y1: 1010, color: '#88AAA2', t, ox: 97, alpha: 0.32, speed: 9, x: SET_X0, w: fw});
	alleyFog(g, {y0: 880, y1: 1070, color: '#9DBAB0', t: t + 3, ox: 191, alpha: 0.28, speed: 12, x: SET_X0, w: fw});
	g.restore();
	void f;
};

// ---------------------------------------------------------------- cubetas de cempasúchil (primer plano, desenfocadas)
const bucketSprite = (seed: number) =>
	cached(`d07:bucket:${seed}`, () => {
		// se pinta a media resolución y se desenfoca (está a 28 px de desenfoque): cubeta de lámina con costillas y
		// borde brillante, un ramo de cempasúchil (bolas cálidas con centro oscuro) y hojas
		const S = 230;
		const raw = makeCanvas(S, S);
		const g = raw.getContext('2d')!;
		const bx = S / 2;
		const by = S * 0.62;
		const bg = g.createLinearGradient(bx - 75, 0, bx + 75, 0);
		bg.addColorStop(0, '#2E3634');
		bg.addColorStop(0.32, '#9AA29C');
		bg.addColorStop(0.5, '#6E7672');
		bg.addColorStop(1, '#1E2422');
		g.fillStyle = bg;
		g.beginPath();
		g.moveTo(bx - 75, by);
		g.lineTo(bx + 75, by);
		g.lineTo(bx + 62, S);
		g.lineTo(bx - 62, S);
		g.closePath();
		g.fill();
		g.strokeStyle = 'rgba(20,24,22,0.5)';
		g.lineWidth = 3;
		for (const yy of [by + 22, by + 50]) {
			g.beginPath();
			g.moveTo(bx - 72, yy);
			g.lineTo(bx + 72, yy);
			g.stroke();
		}
		g.fillStyle = 'rgba(255,240,200,0.5)';
		g.fillRect(bx - 76, by - 2, 152, 5);
		// hojas
		for (let i = 0; i < 10; i++) {
			const a = hash(i, seed + 20) * Math.PI;
			g.fillStyle = hash(i, seed + 21) > 0.5 ? '#2F5A2C' : '#1F4A28';
			g.beginPath();
			g.ellipse(bx + Math.cos(a) * 70, by - 10 - Math.sin(a) * 40, 18, 7, a, 0, Math.PI * 2);
			g.fill();
		}
		// flores
		for (let i = 0; i < 30; i++) {
			const a = hash(i, seed) * Math.PI * 2;
			const r = Math.sqrt(hash(i, seed + 1)) * 72;
			const x = bx + Math.cos(a) * r;
			const y = by - 22 - Math.sin(a) * r * 0.5 - hash(i, seed + 2) * 34;
			const R = 15 + hash(i, seed + 3) * 9;
			const gr = g.createRadialGradient(x - R * 0.2, y - R * 0.25, 0, x, y, R);
			const hot = hash(i, seed + 4) > 0.35;
			gr.addColorStop(0, hot ? '#FFD36A' : '#F5A040');
			gr.addColorStop(0.55, hot ? C.cempa : C.flama);
			gr.addColorStop(1, '#8A3410');
			g.fillStyle = gr;
			g.beginPath();
			g.arc(x, y, R, 0, Math.PI * 2);
			g.fill();
		}
		const out = makeCanvas(S + 60, S + 60);
		const o = out.getContext('2d')!;
		o.filter = 'blur(12px)';
		o.drawImage(raw, 30, 30);
		return out;
	});
export const drawBuckets = (g: Ctx, t: number, light = 1) => {
	const items = [
		{x: -0.33, z: 0.95, seed: 3, s: 1.0},
		{x: 0.3, z: 0.97, seed: 9, s: 1.08},
	];
	for (const it of items) {
		const sp = bucketSprite(it.seed);
		const [px, py] = P(it.x, 0.32, it.z);
		const sway = Math.sin(t * 0.9 + it.seed) * 3;
		const k = it.s * 1.15;
		g.save();
		g.globalAlpha = clamp(0.55 + 0.45 * light);
		g.translate(px + sway, py + 120);
		g.scale(k, k);
		g.drawImage(sp, -sp.width, -sp.height * 1.1, sp.width * 2, sp.height * 2);
		g.restore();
	}
};

// polvo flotando en el chorro de luz (arriba a la izquierda del hueco)
export const drawDust = (g: Ctx, t: number, I: number, top: number) => {
	g.save();
	g.globalCompositeOperation = 'lighter';
	for (let i = 0; i < 46; i++) {
		const sp = 0.25 + hash(i, 61) * 0.5;
		const x = ((hash(i, 62) * 700 + t * 9 * sp + Math.sin(t * 0.5 + i) * 18) % 760) - 60;
		const y = top + 20 + ((hash(i, 63) * 520 - t * 6 * sp) % 520 + 520) % 520;
		const d = clamp(1 - Math.hypot(x / 760, (y - top) / 600));
		const a = d * d * 0.5 * I * (0.5 + 0.5 * Math.sin(t * 2 + i));
		if (a < 0.02) continue;
		g.fillStyle = rgba(C.flama, a);
		g.beginPath();
		g.arc(x, y, 1 + hash(i, 64) * 1.6, 0, Math.PI * 2);
		g.fill();
	}
	g.restore();
};
void hx;
void HZ;
void H;
