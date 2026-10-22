// El cuarto reflejado: muro de adobe con enjarre (parches caídos, grietas, guardapolvo verde de cal), vigas y carrizo,
// piso de tierra, dintel, derrame del vano, postigos de tablón, repisa, silla de tule de perfil y petate.
// Lo estático se hornea una vez (con la luz de la veladora) en un lienzo sobredimensionado: la rotación del espejo,
// la caída y la inclinación nunca muestran un borde.
import {clamp, hash, lerp, mixRGB, rgba} from '../../lib/util';
import {cached, drawTiled, glow, makeCanvas, noiseTile, speckle, tinted, type Ctx} from '../kit/paint';
import {candle2D} from '../kit/fx';
import {smoothPath, type V2} from '../kit/rig';
import {P} from './timeline';
import {WIN} from './exterior';

// lienzo del mundo (coordenadas del reflejo en reposo)
export const RW = {x: -340, y: -280, w: 1760, h: 2480};
export const FLOOR_Y = 1280; // unión muro / piso
export const CEIL_Y = 320; // unión muro / techo
export const SILL = {x0: 268, x1: 1032, y: 1030, h: 30};
export const CANDLE = {x: 130, y: 1650};
export const CANDLE_LIGHT = {x: 210, y: 1420, r: 1750};
// silla de tule vista de perfil (mira a la cuna, a la derecha)
export const CHAIR = {back: 228, backFar: 262, seatY: 1146, front: 420, frontFar: 452, top: 870, floor: 1314};

const texture = (g: Ctx, seed: number, color: string, x: number, y: number, w: number, h: number, scale: number, alpha: number, op: GlobalCompositeOperation = 'multiply', sy = 1, period = 5) => {
	const tile = tinted(noiseTile({seed, period, oct: 6, contrast: 1.7}), color, `d06tex${seed}:${period}`);
	drawTiled(g, tile, {x, y, w, h, scale, alpha, op, sy});
};

// contorno irregular (mancha) alrededor de un centro
const blob = (cx: number, cy: number, rx: number, ry: number, seed: number, n = 14): V2[] => {
	const pts: V2[] = [];
	for (let i = 0; i < n; i++) {
		const a = (i / n) * Math.PI * 2;
		const k = 0.7 + 0.5 * hash(i, seed);
		pts.push([cx + Math.cos(a) * rx * k, cy + Math.sin(a) * ry * k]);
	}
	return pts;
};

// ---------- muro ----------
const paintWall = (g: Ctx) => {
	const y0 = CEIL_Y - 24;
	const h = FLOOR_Y - y0 + 12;
	const wg = g.createLinearGradient(0, y0, 0, FLOOR_Y);
	wg.addColorStop(0, '#cfae84');
	wg.addColorStop(0.5, '#dcbb8f');
	wg.addColorStop(1, '#c9a477');
	g.fillStyle = wg;
	g.fillRect(RW.x, y0, RW.w, h);
	// manchas grandes del enjarre y grano fino
	texture(g, 41, '#9a7650', RW.x, y0, RW.w, h, 2.6, 0.5);
	texture(g, 43, '#6a4a2c', RW.x, y0, RW.w, h, 0.42, 0.32);
	texture(g, 44, '#fff1d8', RW.x, y0, RW.w, h, 0.9, 0.16, 'screen');
	g.drawImage(speckle(RW.w, h, 401, 0.6, true), RW.x, y0);
	g.drawImage(speckle(RW.w, h, 402, 0.25, false), RW.x, y0);
	// parches donde el enjarre se cayó y asoma el adobe
	const patches: [number, number, number, number, number][] = [
		[120, 560, 120, 90, 3],
		[1110, 470, 150, 110, 5],
		[1180, 1010, 120, 80, 7],
		[-60, 930, 140, 120, 9],
		[640, 1180, 90, 46, 11],
	];
	for (const [cx, cy, rx, ry, seed] of patches) {
		const pts = blob(cx, cy, rx, ry, seed);
		g.save();
		g.beginPath();
		smoothPath(g, pts, true);
		g.clip();
		g.fillStyle = '#a87c52';
		g.fillRect(cx - rx * 1.5, cy - ry * 1.5, rx * 3, ry * 3);
		texture(g, 45 + seed, '#5a3a20', cx - rx * 1.5, cy - ry * 1.5, rx * 3, ry * 3, 0.5, 0.55);
		// adobes (bloques de 120×58) con junta de lodo
		for (let row = 0, y = CEIL_Y + 20; y < FLOOR_Y; y += 58, row++) {
			if (y < cy - ry * 1.5 || y > cy + ry * 1.5) continue;
			for (let x = RW.x + (row % 2) * 60; x < RW.x + RW.w; x += 120) {
				if (x < cx - rx * 1.6 || x > cx + rx * 1.6) continue;
				g.fillStyle = rgba(mixRGB('#7a5232', '#b88a5c', hash(x, row + seed)), 0.55);
				g.fillRect(x + 3, y + 3, 114, 52);
			}
			g.fillStyle = 'rgba(50,30,15,0.55)';
			g.fillRect(cx - rx * 1.6, y, rx * 3.2, 3);
		}
		g.restore();
		// labio del enjarre: borde claro arriba-izquierda, sombra abajo-derecha
		g.save();
		g.lineWidth = 3;
		g.strokeStyle = 'rgba(255,236,200,0.35)';
		g.translate(-1.5, -1.5);
		g.beginPath();
		smoothPath(g, pts, true);
		g.stroke();
		g.translate(4, 4);
		g.strokeStyle = 'rgba(40,22,10,0.45)';
		g.lineWidth = 4;
		g.beginPath();
		smoothPath(g, pts, true);
		g.stroke();
		g.restore();
	}
	// grietas desde las esquinas del vano
	const crack = (x: number, y: number, ang: number, len: number, seed: number, depth = 0) => {
		let px = x;
		let py = y;
		let a = ang;
		g.beginPath();
		g.moveTo(px, py);
		const steps = Math.round(len / 14);
		for (let i = 0; i < steps; i++) {
			a += (hash(i, seed) - 0.5) * 0.9;
			px += Math.cos(a) * 14;
			py += Math.sin(a) * 14;
			g.lineTo(px, py);
			if (depth < 1 && hash(i, seed + 7) < 0.12) crack(px, py, a + (hash(i, seed + 3) < 0.5 ? 0.7 : -0.7), len * 0.35, seed + i * 13, depth + 1);
		}
		g.stroke();
	};
	g.save();
	g.lineCap = 'round';
	g.strokeStyle = 'rgba(255,236,205,0.22)';
	g.lineWidth = 1.4;
	g.translate(1, 1);
	crack(WIN.x0, WIN.y0, -2.3, 220, 11);
	crack(WIN.x1, WIN.y0, -0.8, 260, 17);
	crack(WIN.x1, WIN.y1, 0.6, 180, 23);
	crack(WIN.x0, WIN.y1, 2.5, 160, 29);
	g.translate(-1, -1);
	g.strokeStyle = 'rgba(40,20,8,0.55)';
	g.lineWidth = 1.8;
	crack(WIN.x0, WIN.y0, -2.3, 220, 11);
	crack(WIN.x1, WIN.y0, -0.8, 260, 17);
	crack(WIN.x1, WIN.y1, 0.6, 180, 23);
	crack(WIN.x0, WIN.y1, 2.5, 160, 29);
	g.restore();
	// guardapolvo de cal verde, gastado (borde superior irregular)
	g.save();
	const dadoTop = 1150;
	g.beginPath();
	g.moveTo(RW.x, FLOOR_Y + 8);
	for (let x = RW.x; x <= RW.x + RW.w; x += 20) g.lineTo(x, dadoTop + Math.sin(x * 0.013) * 4 + (hash(Math.round(x / 20), 5) - 0.5) * 7);
	g.lineTo(RW.x + RW.w, FLOOR_Y + 8);
	g.closePath();
	g.clip();
	g.fillStyle = rgba(P.green, 0.62);
	g.fillRect(RW.x, dadoTop - 20, RW.w, FLOOR_Y - dadoTop + 40);
	g.globalCompositeOperation = 'destination-out';
	drawTiled(g, noiseTile({seed: 52, period: 6, oct: 5, contrast: 2.6, bias: -0.25}), {x: RW.x, y: dadoTop - 20, w: RW.w, h: 200, scale: 0.8, alpha: 0.85, op: 'destination-out'});
	g.globalCompositeOperation = 'multiply';
	texture(g, 53, '#20140a', RW.x, dadoTop - 20, RW.w, 200, 0.6, 0.35);
	g.restore();
	g.strokeStyle = 'rgba(20,40,32,0.5)';
	g.lineWidth = 2;
	g.beginPath();
	for (let x = RW.x; x <= RW.x + RW.w; x += 20) g.lineTo(x, dadoTop + Math.sin(x * 0.013) * 4 + (hash(Math.round(x / 20), 5) - 0.5) * 7);
	g.stroke();
	// hollín de años junto al techo
	const sg = g.createLinearGradient(0, y0, 0, y0 + 260);
	sg.addColorStop(0, 'rgba(30,16,6,0.75)');
	sg.addColorStop(1, 'rgba(30,16,6,0)');
	g.fillStyle = sg;
	g.fillRect(RW.x, y0, RW.w, 260);
	// sombra de contacto en la base
	const zg = g.createLinearGradient(0, FLOOR_Y - 90, 0, FLOOR_Y);
	zg.addColorStop(0, 'rgba(40,20,8,0)');
	zg.addColorStop(1, 'rgba(40,20,8,0.6)');
	g.fillStyle = zg;
	g.fillRect(RW.x, FLOOR_Y - 90, RW.w, 90);
};

// ---------- piso ----------
const paintFloor = (g: Ctx) => {
	const fy = FLOOR_Y;
	const fh = RW.y + RW.h - fy;
	const fg = g.createLinearGradient(0, fy, 0, RW.y + RW.h);
	fg.addColorStop(0, '#7a5534');
	fg.addColorStop(0.3, '#5e3e24');
	fg.addColorStop(1, '#2a180c');
	g.fillStyle = fg;
	g.fillRect(RW.x, fy, RW.w, fh);
	// textura en perspectiva: fina cerca del muro, gruesa hacia el espejo
	const bands = 6;
	for (let i = 0; i < bands; i++) {
		const a = fy + (fh * Math.pow(i / bands, 1.6));
		const b = fy + (fh * Math.pow((i + 1) / bands, 1.6));
		texture(g, 47, '#2a160a', RW.x, a, RW.w, b - a, 0.35 + i * 0.35, 0.5, 'multiply', 0.45);
		texture(g, 48, '#c8a070', RW.x, a, RW.w, b - a, 0.25 + i * 0.25, 0.12, 'screen', 0.4);
	}
	g.drawImage(speckle(RW.w, fh, 403, 0.5, true), RW.x, fy);
	// piedritas y pajas
	for (let i = 0; i < 160; i++) {
		const u = hash(i, 91);
		const y = fy + 10 + Math.pow(hash(i, 92), 1.4) * (fh - 20);
		const x = RW.x + u * RW.w;
		const sc = 0.6 + ((y - fy) / fh) * 3;
		if (hash(i, 93) < 0.7) {
			g.fillStyle = rgba(mixRGB('#2a180c', '#b8946a', hash(i, 94)), 0.7);
			g.beginPath();
			g.ellipse(x, y, 2.2 * sc, 1.2 * sc, 0, 0, Math.PI * 2);
			g.fill();
		} else {
			g.strokeStyle = 'rgba(200,160,90,0.35)';
			g.lineWidth = 0.8 * sc;
			const a = hash(i, 95) * Math.PI;
			g.beginPath();
			g.moveTo(x, y);
			g.lineTo(x + Math.cos(a) * 9 * sc, y + Math.sin(a) * 2.5 * sc);
			g.stroke();
		}
	}
};

// ---------- techo: carrizo y vigas en perspectiva ----------
const paintCeiling = (g: Ctx) => {
	const h = CEIL_Y - RW.y;
	g.fillStyle = '#3a2412';
	g.fillRect(RW.x, RW.y, RW.w, h);
	// carrizos (paralelos al muro), más gruesos y separados hacia el espejo
	let y = CEIL_Y - 4;
	let i = 0;
	while (y > RW.y - 20) {
		const u = (CEIL_Y - y) / h;
		const th = 4 + u * u * 22;
		const tone = hash(i, 31);
		const gr = g.createLinearGradient(0, y - th / 2, 0, y + th / 2);
		gr.addColorStop(0, rgba(mixRGB('#6a4824', '#c8a068', tone), 1));
		gr.addColorStop(0.6, rgba(mixRGB('#4a3018', '#9a7448', tone), 1));
		gr.addColorStop(1, '#24140a');
		g.fillStyle = gr;
		g.beginPath();
		const wob = (hash(i, 32) - 0.5) * 3;
		g.moveTo(RW.x, y - th / 2 + wob);
		g.bezierCurveTo(RW.x + RW.w * 0.3, y - th / 2 - wob, RW.x + RW.w * 0.7, y - th / 2 + wob * 1.5, RW.x + RW.w, y - th / 2);
		g.lineTo(RW.x + RW.w, y + th / 2);
		g.bezierCurveTo(RW.x + RW.w * 0.7, y + th / 2 + wob * 1.5, RW.x + RW.w * 0.3, y + th / 2 - wob, RW.x, y + th / 2 + wob);
		g.closePath();
		g.fill();
		// nudos del carrizo
		g.fillStyle = 'rgba(30,16,6,0.5)';
		for (let k = 0; k < 9; k++) {
			const x = RW.x + hash(i * 9 + k, 33) * RW.w;
			g.fillRect(x, y - th / 2, Math.max(1.5, th * 0.15), th);
		}
		y -= th * (1.05 + hash(i, 34) * 0.15);
		i++;
	}
	// vigas que salen del muro hacia el espejo (punto de fuga a la altura del ojo)
	const vx = 540;
	const vy = 820;
	for (let k = -4; k <= 4; k++) {
		const xb = vx + k * 240 + 10;
		const diry = CEIL_Y - vy;
		const L = (RW.y - CEIL_Y) / diry;
		const xt = xb + (xb - vx) * L;
		const w0 = 40;
		const w1 = w0 * (1 + L);
		// sombra de la viga sobre el carrizo (luz desde abajo-izquierda → sombra a la derecha)
		g.fillStyle = 'rgba(15,8,3,0.5)';
		g.beginPath();
		g.moveTo(xb + w0 / 2, CEIL_Y);
		g.lineTo(xt + w1 / 2, RW.y);
		g.lineTo(xt + w1 / 2 + w1 * 0.6, RW.y);
		g.lineTo(xb + w0 / 2 + w0 * 0.6, CEIL_Y);
		g.closePath();
		g.fill();
		// cuerpo redondo: degradado a lo ancho (claro abajo-izquierda)
		const poly = () => {
			g.beginPath();
			g.moveTo(xb - w0 / 2, CEIL_Y);
			g.lineTo(xt - w1 / 2, RW.y);
			g.lineTo(xt + w1 / 2, RW.y);
			g.lineTo(xb + w0 / 2, CEIL_Y);
			g.closePath();
		};
		g.save();
		poly();
		g.clip();
		const steps = 14;
		for (let s = 0; s < steps; s++) {
			const u0 = s / steps;
			const u1 = (s + 1) / steps;
			const shadeK = Math.sin(clamp(u0 + 0.12) * Math.PI) * (1 - u0 * 0.55);
			g.fillStyle = rgba(mixRGB('#120a04', '#7a5230', shadeK));
			g.beginPath();
			g.moveTo(lerp(xb - w0 / 2, xb + w0 / 2, u0), CEIL_Y);
			g.lineTo(lerp(xt - w1 / 2, xt + w1 / 2, u0), RW.y);
			g.lineTo(lerp(xt - w1 / 2, xt + w1 / 2, u1) + 1, RW.y);
			g.lineTo(lerp(xb - w0 / 2, xb + w0 / 2, u1) + 0.3, CEIL_Y);
			g.closePath();
			g.fill();
		}
		// veta y grietas de la madera
		for (let s = 0; s < 9; s++) {
			const u = hash(s, 40 + k);
			g.strokeStyle = s % 3 ? 'rgba(20,10,4,0.45)' : 'rgba(210,160,100,0.18)';
			g.lineWidth = 1 + (s % 2);
			g.beginPath();
			g.moveTo(lerp(xb - w0 / 2, xb + w0 / 2, u), CEIL_Y);
			g.lineTo(lerp(xt - w1 / 2, xt + w1 / 2, u + (hash(s, 41) - 0.5) * 0.06), RW.y);
			g.stroke();
		}
		g.restore();
		// cabeza de la viga empotrada (sección oscura)
		g.fillStyle = '#140a04';
		g.beginPath();
		g.ellipse(xb, CEIL_Y - 2, w0 / 2, 8, 0, 0, Math.PI * 2);
		g.fill();
	}
	// solera (viga madre sobre el muro)
	const sg = g.createLinearGradient(0, CEIL_Y - 30, 0, CEIL_Y + 10);
	sg.addColorStop(0, '#1a0e06');
	sg.addColorStop(0.55, '#6a4626');
	sg.addColorStop(1, '#24140a');
	g.fillStyle = sg;
	g.fillRect(RW.x, CEIL_Y - 30, RW.w, 40);
	texture(g, 61, '#140a04', RW.x, CEIL_Y - 30, RW.w, 40, 0.5, 0.5, 'multiply', 0.12);
};

// ---------- silla de tule de perfil ----------
const paintChair = (g: Ctx) => {
	const C = CHAIR;
	const post = (x: number, y0: number, y1: number, w: number, lit: number) => {
		const gr = g.createLinearGradient(x - w / 2, 0, x + w / 2, 0);
		gr.addColorStop(0, rgba(mixRGB('#1a0d05', '#a87444', lit)));
		gr.addColorStop(0.45, rgba(mixRGB('#1a0d05', '#6a4020', lit)));
		gr.addColorStop(1, '#140a04');
		g.fillStyle = gr;
		g.beginPath();
		g.moveTo(x - w / 2, y1);
		g.lineTo(x - w / 2, y0 + w);
		g.quadraticCurveTo(x, y0 - w * 0.6, x + w / 2, y0 + w);
		g.lineTo(x + w / 2, y1);
		g.closePath();
		g.fill();
		// torneado: anillos
		g.fillStyle = 'rgba(10,5,2,0.55)';
		for (let y = y0 + 40; y < y1 - 20; y += 92) g.fillRect(x - w / 2 - 1, y, w + 2, 3);
	};
	// patas lejanas (más oscuras, un poco más arriba)
	post(C.backFar, C.top + 8, C.floor - 14, 18, 0.25);
	post(C.frontFar, C.seatY + 6, C.floor - 14, 16, 0.2);
	// travesaños del respaldo (escalera) entre los dos postes traseros
	for (const y of [930, 990, 1050]) {
		g.fillStyle = '#2a170a';
		g.beginPath();
		g.moveTo(C.back, y);
		g.lineTo(C.backFar, y - 4);
		g.lineTo(C.backFar, y + 14);
		g.lineTo(C.back, y + 20);
		g.closePath();
		g.fill();
		g.fillStyle = 'rgba(200,140,80,0.35)';
		g.fillRect(C.back, y, C.backFar - C.back, 2);
	}
	// asiento de tule (paralelogramo en perspectiva)
	const seat: V2[] = [
		[C.back - 10, C.seatY + 12],
		[C.front + 10, C.seatY + 12],
		[C.frontFar + 8, C.seatY - 8],
		[C.backFar - 8, C.seatY - 8],
	];
	g.save();
	g.beginPath();
	seat.forEach((p, i) => (i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1])));
	g.closePath();
	g.fillStyle = '#9a7a44';
	g.fill();
	g.clip();
	g.strokeStyle = 'rgba(60,40,15,0.6)';
	g.lineWidth = 2;
	for (let k = -30; k < 40; k++) {
		g.beginPath();
		g.moveTo(C.back + k * 9, C.seatY + 14);
		g.lineTo(C.back + k * 9 + 26, C.seatY - 10);
		g.stroke();
	}
	g.strokeStyle = 'rgba(230,200,140,0.25)';
	for (let k = -30; k < 40; k++) {
		g.beginPath();
		g.moveTo(C.back + k * 9 + 3, C.seatY - 10);
		g.lineTo(C.back + k * 9 + 29, C.seatY + 14);
		g.stroke();
	}
	g.restore();
	// canto del asiento
	g.fillStyle = '#3a2210';
	g.fillRect(C.back - 10, C.seatY + 12, C.front - C.back + 20, 12);
	// patas cercanas
	post(C.back, C.top, C.floor, 22, 0.75);
	post(C.front, C.seatY + 8, C.floor, 20, 0.7);
	// travesaño bajo
	g.fillStyle = '#2a170a';
	g.fillRect(C.back, 1250, C.front - C.back, 10);
	g.fillStyle = 'rgba(200,140,80,0.3)';
	g.fillRect(C.back, 1250, C.front - C.back, 2);
	// sombra en el piso
	g.save();
	g.globalCompositeOperation = 'multiply';
	const sh = g.createRadialGradient(330, C.floor + 4, 10, 330, C.floor + 4, 200);
	sh.addColorStop(0, 'rgba(30,15,5,0.7)');
	sh.addColorStop(1, 'rgba(30,15,5,0)');
	g.fillStyle = sh;
	g.beginPath();
	g.ellipse(340, C.floor + 4, 200, 26, 0, 0, Math.PI * 2);
	g.fill();
	g.restore();
};

const paintPetate = (g: Ctx) => {
	const quad: V2[] = [
		[120, 1268],
		[560, 1268],
		[620, 1372],
		[60, 1372],
	];
	g.save();
	g.beginPath();
	quad.forEach((p, i) => (i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1])));
	g.closePath();
	g.fillStyle = '#a8844c';
	g.fill();
	g.clip();
	// tejido de palma en diagonal (perspectiva: más fino arriba)
	for (let k = -40; k < 60; k++) {
		const x = 60 + k * 12;
		g.strokeStyle = k % 2 ? 'rgba(90,62,28,0.55)' : 'rgba(225,195,140,0.35)';
		g.lineWidth = 5;
		g.beginPath();
		g.moveTo(x, 1268);
		g.lineTo(x + 70, 1372);
		g.stroke();
		g.beginPath();
		g.moveTo(x + 70, 1268);
		g.lineTo(x, 1372);
		g.stroke();
	}
	texture(g, 57, '#3a2412', 60, 1268, 560, 104, 0.4, 0.4);
	g.restore();
	// orilla deshilachada
	g.strokeStyle = 'rgba(60,40,18,0.6)';
	g.lineWidth = 3;
	g.beginPath();
	g.moveTo(60, 1372);
	g.lineTo(620, 1372);
	g.stroke();
};

// ---------- postigos de tablón abiertos ----------
const paintShutter = (g: Ctx, xh: number, xo: number, light: number, seed: number) => {
	const top0 = WIN.y0 + 4;
	const bot0 = WIN.y1 - 2;
	const topO = WIN.y0 - 38;
	const botO = WIN.y1 + 46;
	const yAt = (u: number, top: boolean) => (top ? lerp(top0, topO, u) : lerp(bot0, botO, u));
	const planks = 4;
	for (let p = 0; p < planks; p++) {
		const u0 = p / planks;
		const u1 = (p + 1) / planks;
		const x0 = lerp(xh, xo, u0);
		const x1 = lerp(xh, xo, u1);
		const tone = 0.8 + 0.4 * hash(p, seed);
		g.fillStyle = rgba(mixRGB('#140a04', '#8a5c34', light * tone));
		g.beginPath();
		g.moveTo(x0, yAt(u0, true));
		g.lineTo(x1, yAt(u1, true));
		g.lineTo(x1, yAt(u1, false));
		g.lineTo(x0, yAt(u0, false));
		g.closePath();
		g.fill();
		g.save();
		g.clip();
		texture(g, 63 + p, '#1a0d05', Math.min(x0, x1) - 4, topO - 10, Math.abs(x1 - x0) + 8, botO - topO + 20, 0.35, 0.55, 'multiply', 6);
		// nudos
		const ky = lerp(yAt(0.5, true), yAt(0.5, false), 0.2 + 0.6 * hash(p, seed + 1));
		g.fillStyle = 'rgba(20,10,4,0.5)';
		g.beginPath();
		g.ellipse((x0 + x1) / 2, ky, Math.abs(x1 - x0) * 0.18, 9, 0, 0, Math.PI * 2);
		g.fill();
		g.restore();
		g.strokeStyle = 'rgba(8,4,1,0.75)';
		g.lineWidth = 2.5;
		g.beginPath();
		g.moveTo(x1, yAt(u1, true));
		g.lineTo(x1, yAt(u1, false));
		g.stroke();
	}
	// travesaños y bisagras de hierro
	for (const v of [0.16, 0.84]) {
		const yh = lerp(top0, bot0, v);
		const yo = lerp(topO, botO, v);
		g.fillStyle = rgba(mixRGB('#0e0703', '#5a3a1e', light));
		g.beginPath();
		g.moveTo(xh, yh - 12);
		g.lineTo(xo, yo - 18);
		g.lineTo(xo, yo + 14);
		g.lineTo(xh, yh + 10);
		g.closePath();
		g.fill();
		g.strokeStyle = 'rgba(230,170,100,0.18)';
		g.lineWidth = 1.5;
		g.beginPath();
		g.moveTo(xh, yh - 12);
		g.lineTo(xo, yo - 18);
		g.stroke();
		g.fillStyle = '#0a0806';
		g.fillRect(xh - 6, yh - 8, 12, 16);
		g.beginPath();
		g.arc(xh, yh, 5, 0, Math.PI * 2);
		g.fill();
	}
	// canto del postigo (grosor del tablón)
	g.fillStyle = '#0c0603';
	g.beginPath();
	g.moveTo(xo, topO);
	g.lineTo(xo + (xo > xh ? 12 : -12), topO + 6);
	g.lineTo(xo + (xo > xh ? 12 : -12), botO - 4);
	g.lineTo(xo, botO);
	g.closePath();
	g.fill();
};

// mapa de luz de la veladora (multiplicador): cálido cerca, #231305 lejos; sombras frías hacia arriba a la derecha
const lightMap = (g: Ctx) => {
	const r = g.createRadialGradient(CANDLE_LIGHT.x, CANDLE_LIGHT.y, 40, CANDLE_LIGHT.x, CANDLE_LIGHT.y, CANDLE_LIGHT.r);
	r.addColorStop(0, '#ffe6b8');
	r.addColorStop(0.18, '#e8a868');
	r.addColorStop(0.42, '#9a6038');
	r.addColorStop(0.7, '#4a2a16');
	r.addColorStop(1, '#1a0e06');
	g.fillStyle = r;
	g.fillRect(RW.x, RW.y, RW.w, RW.h);
};

const buildRoom = () => {
	const c = makeCanvas(RW.w, RW.h);
	const g = c.getContext('2d')!;
	g.translate(-RW.x, -RW.y);
	paintWall(g);
	paintFloor(g);
	paintCeiling(g);
	// dintel de madera sobre el vano
	g.fillStyle = '#2a170a';
	g.fillRect(WIN.x0 - 70, WIN.y0 - 46, WIN.x1 - WIN.x0 + 140, 46);
	texture(g, 66, '#0e0703', WIN.x0 - 70, WIN.y0 - 46, WIN.x1 - WIN.x0 + 140, 46, 0.4, 0.6, 'multiply', 0.1);
	g.fillStyle = 'rgba(220,160,95,0.3)';
	g.fillRect(WIN.x0 - 70, WIN.y0 - 6, WIN.x1 - WIN.x0 + 140, 3);
	paintPetate(g);
	paintChair(g);
	paintShutter(g, WIN.x0, 168, 0.75, 3);
	paintShutter(g, WIN.x1, 1132, 0.4, 9);
	// repisa de madera
	g.fillStyle = '#4a2e16';
	g.fillRect(SILL.x0, SILL.y, SILL.x1 - SILL.x0, SILL.h);
	texture(g, 67, '#140a04', SILL.x0, SILL.y, SILL.x1 - SILL.x0, SILL.h, 0.35, 0.6, 'multiply', 0.12);
	g.fillStyle = '#8a5e34';
	g.fillRect(SILL.x0, SILL.y, SILL.x1 - SILL.x0, 5);
	g.fillStyle = 'rgba(10,5,2,0.55)';
	g.fillRect(SILL.x0 + 10, SILL.y + SILL.h, SILL.x1 - SILL.x0 - 20, 14);
	// --- luz de la veladora (multiplica todo lo anterior)
	g.globalCompositeOperation = 'multiply';
	lightMap(g);
	// frío lejano (arriba a la derecha)
	const cg = g.createLinearGradient(200, 1500, 1300, -200);
	cg.addColorStop(0, 'rgba(255,255,255,1)');
	cg.addColorStop(0.6, 'rgba(225,232,232,1)');
	cg.addColorStop(1, 'rgba(150,175,180,1)');
	g.fillStyle = cg;
	g.fillRect(RW.x, RW.y, RW.w, RW.h);
	g.globalCompositeOperation = 'source-over';
	// calor extra junto a la flama
	glow(g, CANDLE.x + 80, CANDLE.y - 300, 900, '#F5A04A', 0.1, 0.3);
	// --- hueco de la ventana
	g.globalCompositeOperation = 'destination-out';
	g.fillRect(WIN.x0, WIN.y0, WIN.x1 - WIN.x0, WIN.y1 - WIN.y0);
	g.globalCompositeOperation = 'source-over';
	// derrame del vano (grosor del muro, ~45 cm) con luz de luna rasante en el lado derecho
	const reveal = (x0: number, x1: number, col0: string, col1: string) => {
		const gr = g.createLinearGradient(x0, 0, x1, 0);
		gr.addColorStop(0, col0);
		gr.addColorStop(1, col1);
		g.fillStyle = gr;
		g.beginPath();
		g.moveTo(x0, WIN.y0);
		g.lineTo(x1, WIN.y0 + 24);
		g.lineTo(x1, WIN.y1);
		g.lineTo(x0, WIN.y1);
		g.closePath();
		g.fill();
		texture(g, 68, '#1a0d05', Math.min(x0, x1), WIN.y0, Math.abs(x1 - x0), WIN.y1 - WIN.y0, 0.4, 0.4);
	};
	reveal(WIN.x0, WIN.x0 + 30, '#5a3a20', '#2a180c');
	reveal(WIN.x1, WIN.x1 - 30, '#24160c', '#3a4a4a');
	const tg = g.createLinearGradient(0, WIN.y0, 0, WIN.y0 + 24);
	tg.addColorStop(0, '#120a04');
	tg.addColorStop(1, '#2a1a0e');
	g.fillStyle = tg;
	g.beginPath();
	g.moveTo(WIN.x0, WIN.y0);
	g.lineTo(WIN.x1, WIN.y0);
	g.lineTo(WIN.x1 - 30, WIN.y0 + 24);
	g.lineTo(WIN.x0 + 30, WIN.y0 + 24);
	g.closePath();
	g.fill();
	return c;
};

export const roomCanvas = () => cached('d06:room2', buildRoom);

export type RoomOpts = {
	candle: number; // 0..1.3 intensidad de la luz de la veladora (parpadeo)
	moon?: number; // derrame de luna por la ventana
};

// muro (con hueco), techo, piso, postigos, repisa, silla — todo detrás de cuna y abuela
export const paintRoomBack = (g: Ctx, o: RoomOpts) => {
	g.drawImage(roomCanvas(), RW.x, RW.y);
	// derrame de luna en el piso bajo la ventana
	const m = o.moon ?? 0.6;
	if (m > 0) {
		g.save();
		g.globalCompositeOperation = 'screen';
		const gr = g.createLinearGradient(0, FLOOR_Y, 0, 1720);
		gr.addColorStop(0, rgba('#6f9fa6', 0.2 * m));
		gr.addColorStop(1, rgba('#6f9fa6', 0));
		g.fillStyle = gr;
		g.beginPath();
		g.moveTo(WIN.x0 + 80, FLOOR_Y);
		g.lineTo(WIN.x1 - 10, FLOOR_Y);
		g.lineTo(WIN.x1 + 190, 1720);
		g.lineTo(WIN.x0 + 150, 1720);
		g.closePath();
		g.fill();
		// luna rasante sobre la repisa
		g.fillStyle = rgba('#9FC3C4', 0.18 * m);
		g.fillRect(SILL.x0 + 30, SILL.y, SILL.x1 - SILL.x0 - 60, 4);
		g.restore();
	}
	// respiración de la flama sobre el muro (luz viva)
	const k = o.candle - 1;
	if (Math.abs(k) > 0.01) {
		g.save();
		g.globalCompositeOperation = k > 0 ? 'lighter' : 'multiply';
		const r = g.createRadialGradient(CANDLE_LIGHT.x, CANDLE_LIGHT.y, 0, CANDLE_LIGHT.x, CANDLE_LIGHT.y, 1300);
		if (k > 0) {
			r.addColorStop(0, rgba('#F5A14A', 0.25 * k));
			r.addColorStop(1, rgba('#F5A14A', 0));
		} else {
			const v = Math.round(255 * (1 + k * 0.8));
			r.addColorStop(0, `rgb(${v},${v},${v})`);
			r.addColorStop(1, `rgb(${Math.round(v * 0.9)},${Math.round(v * 0.9)},${Math.round(v * 0.9)})`);
		}
		g.fillStyle = r;
		g.fillRect(RW.x, RW.y, RW.w, RW.h);
		g.restore();
	}
};

// tijeras de sastre de hierro abiertas en cruz, paradas sobre sus ojos en la repisa (x, y = punto de apoyo).
// open: 0 cerradas → 1 abiertas 90°. rot: inclinación extra (en la mano).
export const paintScissors = (g: Ctx, x: number, y: number, open: number, rim = 0.6, flash = 0, s = 1, rot = 0) => {
	const ang = (open * Math.PI) / 2;
	// el pivote queda a la altura que deja los ojos apoyados en la repisa
	const reach = 62;
	const lift = Math.cos(ang / 2) * reach;
	g.save();
	g.translate(x, y);
	g.rotate(rot);
	g.translate(0, -lift * s);
	g.scale(s, s);
	const iron = rgba(mixRGB('#0b0907', P.bone, flash));
	const blade = (a: number, big: boolean) => {
		g.save();
		g.rotate(a);
		// hoja larga, de lomo recto y filo curvo
		g.fillStyle = iron;
		g.beginPath();
		g.moveTo(-5, 4);
		g.lineTo(-4.5, -40);
		g.quadraticCurveTo(-3, -96, 0, -118);
		g.quadraticCurveTo(7, -70, 7.5, -10);
		g.lineTo(6, 6);
		g.closePath();
		g.fill();
		// cuello y ojo (uno más grande para los dedos)
		g.lineWidth = big ? 7.5 : 6.5;
		g.strokeStyle = iron;
		g.beginPath();
		g.moveTo(0, 4);
		g.quadraticCurveTo(big ? -4 : 4, 18, big ? -3 : 3, 26);
		g.stroke();
		g.beginPath();
		if (big) g.ellipse(-4, 44, 17, 21, -0.15, 0, Math.PI * 2);
		else g.ellipse(3, 41, 12, 16, 0.1, 0, Math.PI * 2);
		g.stroke();
		// filo de luna
		g.strokeStyle = rgba(P.moonRim, clamp(0.8 * rim + flash));
		g.lineWidth = 1.5;
		g.beginPath();
		g.moveTo(7, -10);
		g.quadraticCurveTo(6.5, -70, 0.5, -116);
		g.stroke();
		g.strokeStyle = rgba(P.gold, 0.35 * rim);
		g.lineWidth = 1.2;
		g.beginPath();
		g.arc(big ? -4 : 3, big ? 44 : 41, big ? 20 : 15, Math.PI * 0.65, Math.PI * 1.2);
		g.stroke();
		g.restore();
	};
	blade(-ang / 2, true);
	blade(ang / 2, false);
	g.fillStyle = '#2a2420';
	g.beginPath();
	g.arc(0, 0, 5, 0, Math.PI * 2);
	g.fill();
	g.fillStyle = rgba(P.moonRim, 0.6 * rim);
	g.beginPath();
	g.arc(1, -1.5, 1.6, 0, Math.PI * 2);
	g.fill();
	g.restore();
	if (flash > 0) glow(g, x, y - lift * s, 140 * s, P.bone, 0.5 * flash);
};

// mesa y veladora en primer plano (desenfocadas: están junto al espejo)
export const paintVeladora = (g: Ctx, t: number, o: {lean?: number; flame?: number; stub?: number; blur?: number}) => {
	const {lean = 0, flame = 1, stub = 0, blur = 9} = o;
	const tmp = cached('d06:velTmp', () => makeCanvas(420, 640));
	const q = tmp.getContext('2d')!;
	q.setTransform(1, 0, 0, 1, 0, 0);
	q.clearRect(0, 0, 420, 640);
	q.translate(210 - CANDLE.x, 470 - CANDLE.y);
	// charco de luz sobre el borde de madera (sin losa negra: se funde con el piso)
	const pool = q.createRadialGradient(CANDLE.x, CANDLE.y + 72, 10, CANDLE.x, CANDLE.y + 72, 230);
	pool.addColorStop(0, 'rgba(242,150,70,0.55)');
	pool.addColorStop(0.45, 'rgba(120,52,20,0.35)');
	pool.addColorStop(1, 'rgba(35,19,5,0)');
	q.fillStyle = pool;
	q.beginPath();
	q.ellipse(CANDLE.x, CANDLE.y + 78, 240, 60, 0, 0, Math.PI * 2);
	q.fill();
	// vaso de la veladora: vela dentro de un vidrio ámbar
	const h = 170 * (1 - stub * 0.75);
	candle2D(q, {x: CANDLE.x, y: CANDLE.y + 66, w: 80, h, t, seed: 6, lean, flameA: flame, wax: '#f0cf98'});
	const vg = q.createLinearGradient(CANDLE.x - 54, 0, CANDLE.x + 54, 0);
	vg.addColorStop(0, 'rgba(120,40,16,0.55)');
	vg.addColorStop(0.3, 'rgba(242,109,61,0.32)');
	vg.addColorStop(0.55, 'rgba(255,214,150,0.22)');
	vg.addColorStop(1, 'rgba(90,28,10,0.6)');
	q.fillStyle = vg;
	q.beginPath();
	q.roundRect(CANDLE.x - 54, CANDLE.y + 66 - 196, 108, 200, [6, 6, 14, 14]);
	q.fill();
	q.strokeStyle = 'rgba(255,220,170,0.35)';
	q.lineWidth = 3;
	q.beginPath();
	q.moveTo(CANDLE.x - 40, CANDLE.y + 66 - 186);
	q.lineTo(CANDLE.x - 40, CANDLE.y + 56);
	q.stroke();
	g.save();
	g.filter = `blur(${blur}px)`;
	g.drawImage(tmp, CANDLE.x - 210, CANDLE.y - 470);
	g.restore();
	glow(g, CANDLE.x, CANDLE.y + 66 - h - 30, 420, '#F5B04A', 0.35 * flame);
};
