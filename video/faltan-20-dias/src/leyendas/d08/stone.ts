// Día 8 · ENV-01 / ENV-09: la piedra del río. Una sola geometría para el POV de noche (B1, B6, B7) y la vista
// cenital al amanecer (B10–B11). Coordenadas de la cara superior (u, v) = espacio del «8» del rótulo − (540, 930).
import {noise2D} from '@remotion/noise';
import {H, W, clamp, hash, lerp, mixRGB, rgba} from '../../lib/util';
import {cached, drawTiled, makeCanvas, noiseTile, tinted, type Ctx} from '../kit/paint';
import {paintShape, vgrad} from '../kit/shade';
import {smoothPath} from '../kit/rig';
import {OCHO_CX, OCHO_CY, OCHO_PATH} from './ocho';
import {P, footprint, petal, ribbon, type V2} from './core';

// ---------------------------------------------------------------- proyección POV (mirando abajo ~40°)
export const PV = {cx: 540, cy: 1150, k: 0.62, sq: 0.62, p: 0.0004};
export const sAt = (v: number) => PV.k * (1 + PV.p * v);
export const proj = (u: number, v: number): V2 => {
	const s = sAt(v);
	return [PV.cx + u * s, PV.cy + v * PV.sq * s];
};

// contorno de la cara superior de la piedra
export const STONE: V2[] = (() => {
	const out: V2[] = [];
	for (let k = 0; k < 48; k++) {
		const a = (k / 48) * Math.PI * 2;
		const n = noise2D('stone', Math.cos(a) * 1.3, Math.sin(a) * 1.3) * 0.07 + noise2D('stone2', Math.cos(a) * 3, Math.sin(a) * 3) * 0.025;
		const rx = 610 * (1 + n);
		const ry = 545 * (1 + n);
		out.push([Math.cos(a) * rx + 20 * Math.sin(a * 2), Math.sin(a) * ry]);
	}
	return out;
})();
const STONE_H = 120; // altura del canto (unidades)

// ---------------------------------------------------------------- huellas: 7 / 15 / 40 / cientos en anillos
export type Print = {u: number; v: number; a: number; side: number; fresh: number};
const trail = (pts: V2[], step: number, seed: number, out: Print[], fresh = 0) => {
	let acc = 0;
	let side = 1;
	for (let i = 1; i < pts.length; i++) {
		const [x0, y0] = pts[i - 1];
		const [x1, y1] = pts[i];
		const L = Math.hypot(x1 - x0, y1 - y0);
		const a = Math.atan2(y1 - y0, x1 - x0) + Math.PI / 2;
		while (acc <= L) {
			const u = acc / L;
			const nx = Math.cos(a);
			const ny = Math.sin(a);
			out.push({u: lerp(x0, x1, u) + nx * 20 * side, v: lerp(y0, y1, u) + ny * 20 * side, a: a + (hash(out.length, seed) - 0.5) * 0.25, side, fresh});
			side = -side;
			acc += step;
		}
		acc -= L;
	}
};
export const PRINTS = cached('d8prints', () => {
	const a: Print[] = [];
	trail([[-260, 760], [-150, 330], [40, 20], [260, -300], [520, -760]], 92, 1, a);
	const b = a.slice(0, 7);
	const s15 = b.slice();
	trail([[-760, -260], [-380, -120], [0, -60], [400, 60], [820, 160]], 92, 2, s15);
	const s15c = s15.slice(0, 15);
	const s40 = s15c.slice();
	trail([[700, 700], [380, 420], [120, 300], [-200, 380], [-520, 640]], 88, 3, s40);
	trail([[-640, 400], [-500, -50], [-300, -420], [60, -640]], 90, 4, s40, 1);
	trail([[200, -720], [420, -380], [620, 40], [700, 420]], 90, 5, s40, 1);
	const s40c = s40.slice(0, 40);
	// cientos: anillos concéntricos alrededor del centro (caminan en círculo)
	const rings: Print[] = [];
	for (let r = 0; r < 8; r++) {
		const rx = 470 + r * 120;
		const ry = 520 + r * 120;
		const n = Math.floor((Math.PI * (rx + ry)) / 84);
		for (let k = 0; k < n; k++) {
			const th = (k / n) * Math.PI * 2 + r * 0.37;
			const side = k % 2 ? 1 : -1;
			const nx = Math.cos(th);
			const ny = Math.sin(th);
			const u = nx * (rx + side * 16);
			const v = ny * (ry + side * 16);
			if (Math.abs(u) > 1500 || v > 1100 || v < -1900) continue;
			const tang = th + (r % 2 ? Math.PI : 0); // dirección de marcha
			rings.push({u, v, a: tang + (hash(k, r + 40) - 0.5) * 0.2, side, fresh: hash(k, r + 90) > 0.8 ? 1 : 0});
		}
	}
	return {s7: b, s15: s15c, s40: s40c, rings};
});

// ---------------------------------------------------------------- el «8» de listón sobre la piedra
export const OCHO: V2[] = cached('d8ocho', () => {
	const out: V2[] = [];
	for (let i = 0; i < OCHO_PATH.length; i += 2) out.push([OCHO_PATH[i], OCHO_PATH[i + 1]]);
	return out;
});
// anillo de pétalos colocados (imitación de altar)
export const PETAL_RING = cached('d8petring', () => {
	const out: {u: number; v: number; a: number; s: number; tone: number}[] = [];
	const n = 46;
	for (let k = 0; k < n; k++) {
		const th = (k / n) * Math.PI * 2;
		for (let j = 0; j < 2; j++) {
			const rr = 1 + (j ? 0.07 : 0) + (hash(k, 7 + j) - 0.5) * 0.03;
			out.push({u: Math.cos(th) * 375 * rr, v: Math.sin(th) * 425 * rr, a: th + Math.PI / 2 + (hash(k, 9 + j) - 0.5) * 0.8, s: 30 + hash(k, 11 + j) * 10, tone: hash(k, 13 + j)});
		}
	}
	return out;
});

// ---------------------------------------------------------------- elementos sueltos del suelo
const leaf = (g: Ctx, x: number, y: number, a: number, L: number, sq: number, col: string, vein: string) => {
	g.save();
	g.translate(x, y);
	g.scale(1, sq);
	g.rotate(a);
	g.fillStyle = 'rgba(8,5,2,0.45)';
	g.beginPath();
	g.ellipse(L * 0.04, L * 0.08, L * 0.52, L * 0.2, 0, 0, Math.PI * 2);
	g.fill();
	g.fillStyle = col;
	g.beginPath();
	g.moveTo(-L * 0.5, 0);
	g.bezierCurveTo(-L * 0.25, -L * 0.24, L * 0.22, -L * 0.22, L * 0.5, -L * 0.02);
	g.bezierCurveTo(L * 0.26, L * 0.18, -L * 0.22, L * 0.22, -L * 0.5, 0);
	g.fill();
	g.strokeStyle = vein;
	g.lineWidth = Math.max(0.6, L * 0.025);
	g.beginPath();
	g.moveTo(-L * 0.6, 0.02 * L);
	g.quadraticCurveTo(0, -L * 0.03, L * 0.48, -L * 0.02);
	for (let k = -2; k <= 2; k++) {
		if (!k) continue;
		g.moveTo(k * L * 0.15, -L * 0.01);
		g.lineTo(k * L * 0.15 + L * 0.1, -L * 0.13);
		g.moveTo(k * L * 0.15, -L * 0.01);
		g.lineTo(k * L * 0.15 + L * 0.1, L * 0.11);
	}
	g.stroke();
	g.restore();
};
const pebble = (g: Ctx, x: number, y: number, r: number, sq: number, seed: number, wet = 0) => {
	const base = mixRGB('#5d625a', '#7a6a55', hash(seed, 3));
	g.save();
	g.translate(x, y);
	g.scale(1, sq);
	const rot = hash(seed, 6) * 3;
	const ry = r * (0.72 + hash(seed, 5) * 0.2);
	g.fillStyle = 'rgba(8,5,2,0.6)';
	g.beginPath();
	g.ellipse(r * 0.18, r * 0.42, r * 1.08, ry * 1.05, rot, 0, Math.PI * 2);
	g.fill();
	const gr = g.createRadialGradient(-r * 0.35, -r * 0.45, r * 0.08, 0, 0, r * 1.1);
	gr.addColorStop(0, rgba(mixRGB(rgba(base), '#e2dccb', 0.3 + wet * 0.3)));
	gr.addColorStop(0.55, rgba(base));
	gr.addColorStop(1, rgba(mixRGB(rgba(base), '#120a04', 0.65)));
	g.fillStyle = gr;
	g.beginPath();
	g.ellipse(0, 0, r, ry, rot, 0, Math.PI * 2);
	g.fill();
	g.restore();
};
const twig = (g: Ctx, x: number, y: number, a: number, L: number, sq: number, w: number) => {
	g.save();
	g.translate(x, y);
	g.scale(1, sq);
	g.rotate(a);
	g.lineCap = 'round';
	g.strokeStyle = 'rgba(8,5,2,0.6)';
	g.lineWidth = w * 1.6;
	g.beginPath();
	g.moveTo(-L / 2, w);
	g.quadraticCurveTo(0, w - L * 0.06, L / 2, w + L * 0.02);
	g.stroke();
	g.strokeStyle = '#4a3622';
	g.lineWidth = w;
	g.beginPath();
	g.moveTo(-L / 2, 0);
	g.quadraticCurveTo(0, -L * 0.06, L / 2, L * 0.02);
	g.moveTo(L * 0.1, -L * 0.04);
	g.lineTo(L * 0.25, -L * 0.16);
	g.stroke();
	g.restore();
};
// mata de juncos / pasto ribereño
const sedge = (g: Ctx, x: number, y: number, s: number, seed: number) => {
	g.save();
	g.lineCap = 'round';
	const n = 7 + Math.floor(hash(seed, 1) * 6);
	for (let k = 0; k < n; k++) {
		const a = -Math.PI / 2 + (hash(k, seed + 2) - 0.5) * 1.5;
		const L = (60 + hash(k, seed + 3) * 90) * s;
		const bend = (hash(k, seed + 4) - 0.5) * 1.2 + Math.cos(a) * 0.8;
		const ex = x + Math.cos(a) * L + bend * L * 0.3;
		const ey = y + Math.sin(a) * L * 0.75;
		g.strokeStyle = rgba(mixRGB('#3e4a22', '#1c2410', hash(k, seed + 5)));
		g.lineWidth = (3 + hash(k, seed + 6) * 2) * s;
		g.beginPath();
		g.moveTo(x + (hash(k, seed + 7) - 0.5) * 14 * s, y);
		g.quadraticCurveTo(x + Math.cos(a) * L * 0.5, y + Math.sin(a) * L * 0.6, ex, ey);
		g.stroke();
	}
	g.restore();
};

// ---------------------------------------------------------------- sprite POV del suelo + piedra (albedo)
export const GX0 = -560;
export const GY0 = -160;
const GW = 2300;
const GH = 2260;
const WATER_Y = 1600;
const facePts = () => STONE.map(([u, v]) => proj(u, v));
const faceP = (q: Ctx) => smoothPath(q, facePts(), true);
const sidePath = (q: Ctx) => {
	const top = facePts();
	const n = STONE.length;
	const lower: V2[] = [];
	for (let k = 0; k <= n / 2; k++) {
		const [u, v] = STONE[k % n];
		const [x, y] = proj(u * 1.035, v * 1.03);
		lower.push([x, y + STONE_H * sAt(v) * clamp(0.25 + (v / 545) * 0.75 + 0.4)]);
	}
	smoothPath(q, [...lower, ...top.slice(0, n / 2 + 1).reverse()], true);
};
export const groundPOV = () =>
	cached('d8groundPOV2', () => {
		const c = makeCanvas(GW, GH);
		const g = c.getContext('2d')!;
		g.translate(-GX0, -GY0);
		// lodo base: más oscuro lejos y junto al agua
		const bg = g.createLinearGradient(0, GY0, 0, GY0 + GH);
		bg.addColorStop(0, '#120c06');
		bg.addColorStop(0.3, '#2a1d12');
		bg.addColorStop(0.62, '#3b2b1a');
		bg.addColorStop(0.76, '#33251a');
		bg.addColorStop(0.8, '#21170e');
		bg.addColorStop(1, '#140e08');
		g.fillStyle = bg;
		g.fillRect(GX0, GY0, GW, GH);
		const t1 = tinted(noiseTile({seed: 81, period: 6, oct: 6, contrast: 2.0}), '#0e0804', 'd8mud1');
		const t2 = tinted(noiseTile({seed: 82, period: 9, oct: 5, contrast: 2.4, bias: -0.1}), '#6b5232', 'd8mud2');
		const t3 = tinted(noiseTile({seed: 83, period: 4, oct: 4, contrast: 2.8, bias: -0.25}), '#24301c', 'd8mud3');
		drawTiled(g, t1, {x: GX0, y: GY0, w: GW, h: GH, scale: 1.6, alpha: 0.6, sy: 0.6});
		drawTiled(g, t2, {x: GX0, y: GY0, w: GW, h: GH, scale: 0.7, alpha: 0.35, sy: 0.6});
		drawTiled(g, t3, {x: GX0, y: GY0, w: GW, h: GH, scale: 1.2, alpha: 0.5, sy: 0.55});
		// raíces que cruzan el suelo (con lomo iluminado)
		for (let i = 0; i < 4; i++) {
			const x0 = GX0 + hash(i, 21) * GW;
			const y0 = 380 + hash(i, 22) * 420;
			const w = 10 + hash(i, 23) * 18;
			const pth = (q: Ctx, dy: number) => {
				q.beginPath();
				q.moveTo(x0, y0 + dy);
				q.bezierCurveTo(x0 + 220, y0 + 30 + dy, x0 + 300, y0 + 150 * hash(i, 24) + dy, x0 + 560 * (hash(i, 25) - 0.3), y0 + 240 + dy);
			};
			g.lineCap = 'round';
			g.strokeStyle = 'rgba(6,4,2,0.7)';
			g.lineWidth = w * 1.5;
			pth(g, w * 0.4);
			g.stroke();
			g.strokeStyle = '#2a1e14';
			g.lineWidth = w;
			pth(g, 0);
			g.stroke();
			g.strokeStyle = 'rgba(120,100,78,0.35)';
			g.lineWidth = w * 0.25;
			pth(g, -w * 0.28);
			g.stroke();
		}
		// hojarasca, ramitas y piedritas en el plano del suelo (sin «horizonte» de cosas aplastadas)
		for (let i = 0; i < 1100; i++) {
			const u = (hash(i, 31) * 2 - 1) * 1900;
			const v = -1500 + hash(i, 32) * 2700;
			const [x, y] = proj(u, v);
			if (x < GX0 - 40 || x > GX0 + GW + 40 || y < GY0 - 40 || y > WATER_Y - 10) continue;
			const s = sAt(v);
			if (Math.hypot(u / 655, v / 590) < 1) continue;
			const r = hash(i, 33);
			if (r < 0.62) {
				const col = rgba(mixRGB(hash(i, 34) < 0.5 ? '#5a4022' : hash(i, 34) < 0.8 ? '#4a4a26' : '#6a4a26', '#1a1008', hash(i, 35) * 0.65));
				leaf(g, x, y, hash(i, 36) * 6.28, (44 + hash(i, 37) * 60) * s, PV.sq * 1.05, col, 'rgba(20,10,4,0.5)');
			} else if (r < 0.72) twig(g, x, y, hash(i, 36) * 6.28, (60 + hash(i, 37) * 110) * s, PV.sq, (3 + hash(i, 38) * 3) * s);
			else pebble(g, x, y, (8 + hash(i, 38) * 20) * s, PV.sq * 1.1, i);
		}
		// grava mojada junto al agua
		for (let i = 0; i < 260; i++) {
			const x = GX0 + hash(i, 41) * GW;
			const y = 1440 + Math.pow(hash(i, 42), 0.7) * 150;
			pebble(g, x, y, 6 + hash(i, 43) * 16, 0.62, i + 900, 1);
		}
		// juncos y musgo al pie de la piedra y en la orilla
		for (let i = 0; i < 9; i++) {
			const a = Math.PI * (0.15 + hash(i, 44) * 0.7) + (i % 2 ? Math.PI : 0);
			const [x, y] = proj(Math.cos(a) * 700, Math.sin(a) * 640);
			sedge(g, x, y, 0.55 + hash(i, 45) * 0.4, i + 30);
		}
		for (let i = 0; i < 6; i++) sedge(g, GX0 + 200 + hash(i, 46) * (GW - 400), 1470 + hash(i, 47) * 70, 0.8 + hash(i, 48) * 0.5, i + 60);
		// sombra de contacto de la piedra
		const sh: V2[] = STONE.map(([u, v]) => proj(u * 1.1, v * 1.06 + 90));
		g.save();
		g.filter = 'blur(28px)';
		g.fillStyle = 'rgba(6,3,1,0.88)';
		g.beginPath();
		smoothPath(g, sh, true);
		g.fill();
		g.restore();
		// canto frontal (redondeado, con musgo abajo y agua escurrida)
		paintShape(g, sidePath, [PV.cx - 560, PV.cy - 60, 1120, 460], {fill: vgrad('#4a544c', '#121612', '#2c342e'), light: -Math.PI * 0.62, shadow: {color: '#05070a', width: 70, alpha: 0.65}, rim: {color: '#9aa69c', width: 5, alpha: 0.25}, texture: {seed: 84, scale: 0.8, alpha: 0.45}}, 1);
		g.save();
		g.beginPath();
		sidePath(g);
		g.clip();
		for (let i = 0; i < 90; i++) {
			const x = PV.cx - 470 + hash(i, 141) * 940;
			const y = PV.cy + 220 + hash(i, 142) * 180;
			g.strokeStyle = rgba('#0a0d0b', 0.25 + hash(i, 143) * 0.3);
			g.lineWidth = 1 + hash(i, 144) * 2.5;
			g.beginPath();
			g.moveTo(x, y - 40);
			g.lineTo(x + (hash(i, 145) - 0.5) * 8, y + 40 + hash(i, 146) * 60);
			g.stroke();
		}
		for (let i = 0; i < 500; i++) {
			const x = PV.cx - 520 + hash(i, 147) * 1040;
			const y = PV.cy + 300 + hash(i, 148) * 140;
			g.fillStyle = rgba(mixRGB(P.verde, '#0c1a12', hash(i, 149)), 0.55);
			g.beginPath();
			g.ellipse(x, y, 4 + hash(i, 150) * 9, 3 + hash(i, 151) * 5, 0, 0, Math.PI * 2);
			g.fill();
		}
		g.restore();
		// cara superior: cúpula suave gris verdosa
		paintShape(
			g,
			faceP,
			[PV.cx - 430, PV.cy - 200, 860, 500],
			{
				fill: (q, b) => {
					const gr = q.createRadialGradient(b[0] + b[2] * 0.44, b[1] + b[3] * 0.38, 20, b[0] + b[2] * 0.5, b[1] + b[3] * 0.52, b[2] * 0.6);
					gr.addColorStop(0, '#8e978d');
					gr.addColorStop(0.5, '#6a746a');
					gr.addColorStop(0.85, '#465048');
					gr.addColorStop(1, '#2f3832');
					return gr;
				},
				light: -Math.PI * 0.62,
				shadow: {color: '#161c18', width: 80, alpha: 0.6, blur: 60},
				rim: {color: '#c2ccc2', width: 7, alpha: 0.35},
				texture: {seed: 85, scale: 0.5, alpha: 0.5},
			},
			1,
		);
		g.save();
		g.beginPath();
		faceP(g);
		g.clip();
		// oclusión en todo el borde (la cara se curva hacia el canto)
		g.filter = 'blur(34px)';
		g.strokeStyle = 'rgba(14,18,15,0.75)';
		g.lineWidth = 110;
		g.beginPath();
		faceP(g);
		g.stroke();
		g.filter = 'none';
		// manchado mineral
		const tm = tinted(noiseTile({seed: 86, period: 5, oct: 6, contrast: 2.2, bias: -0.05}), '#20241f', 'd8stm');
		drawTiled(g, tm, {x: PV.cx - 450, y: PV.cy - 220, w: 900, h: 540, scale: 0.9, alpha: 0.45, sy: 0.62});
		const tl = tinted(noiseTile({seed: 87, period: 7, oct: 5, contrast: 2.6, bias: -0.2}), '#b7b8a0', 'd8stl');
		drawTiled(g, tl, {x: PV.cx - 450, y: PV.cy - 220, w: 900, h: 540, scale: 0.6, alpha: 0.22, sy: 0.62});
		// musgo en cojines: sombra abajo, cuerpo, puntas claras (más denso en el borde y en grietas)
		for (let pass = 0; pass < 3; pass++) {
			for (let i = 0; i < 1700; i++) {
				const a = hash(i, 51) * Math.PI * 2;
				const r = Math.sqrt(hash(i, 52));
				const u = Math.cos(a) * r * 650;
				const v = Math.sin(a) * r * 580;
				const m = noise2D('moss', u * 0.0045, v * 0.0045) * 0.9 + (r - 0.6) * 1.5 + (v < 0 ? 0.12 : -0.15);
				if (m < 0.12) continue;
				const [x, y] = proj(u, v);
				const s = sAt(v);
				const rr = (5 + hash(i, 55) * 11) * s * (0.6 + clamp(m) * 0.6);
				if (pass === 0) g.fillStyle = 'rgba(8,14,10,0.5)';
				else if (pass === 1) g.fillStyle = rgba(mixRGB(P.verde, hash(i, 53) < 0.35 ? '#5d7a30' : '#0f2a1e', hash(i, 54) * 0.8), 0.55 + 0.35 * clamp(m));
				else {
					if (hash(i, 57) < 0.55) continue;
					g.fillStyle = rgba('#93a85a', 0.3 * clamp(m));
				}
				const oy = pass === 0 ? rr * 0.5 : pass === 2 ? -rr * 0.35 : 0;
				const sc = pass === 2 ? 0.45 : 1;
				g.beginPath();
				g.ellipse(x, y + oy, rr * sc, rr * PV.sq * sc * 0.9, 0, 0, Math.PI * 2);
				g.fill();
			}
		}
		// líquenes en roseta
		for (let i = 0; i < 70; i++) {
			const u = (hash(i, 61) * 2 - 1) * 560;
			const v = (hash(i, 62) * 2 - 1) * 480;
			if (Math.hypot(u / 600, v / 530) > 0.95) continue;
			const [x, y] = proj(u, v);
			const s = sAt(v);
			const R = (6 + hash(i, 64) * 16) * s;
			g.fillStyle = rgba('#c9c6a4', 0.16 + hash(i, 63) * 0.18);
			g.beginPath();
			for (let k = 0; k < 9; k++) {
				const aa = (k / 9) * Math.PI * 2;
				const rk = R * (0.7 + hash(i * 9 + k, 65) * 0.5);
				g.lineTo(x + Math.cos(aa) * rk, y + Math.sin(aa) * rk * PV.sq);
			}
			g.fill();
		}
		// grietas con labio iluminado
		for (let i = 0; i < 5; i++) {
			let u = (hash(i, 71) * 2 - 1) * 380;
			let v = (hash(i, 72) * 2 - 1) * 360;
			const pts: V2[] = [proj(u, v)];
			for (let k = 0; k < 7; k++) {
				u += (hash(i * 9 + k, 73) - 0.5) * 120;
				v += 40 + hash(i * 9 + k, 74) * 50;
				pts.push(proj(u, v));
			}
			g.lineCap = 'round';
			g.strokeStyle = 'rgba(150,160,150,0.28)';
			g.lineWidth = 2;
			g.beginPath();
			pts.forEach(([x, y], k) => (k ? g.lineTo(x, y + 2.2) : g.moveTo(x, y + 2.2)));
			g.stroke();
			g.strokeStyle = 'rgba(10,12,10,0.75)';
			g.lineWidth = 2.4;
			g.beginPath();
			pts.forEach(([x, y], k) => (k ? g.lineTo(x, y) : g.moveTo(x, y)));
			g.stroke();
		}
		g.restore();
		// orilla mojada antes del agua
		const wet = g.createLinearGradient(0, WATER_Y - 120, 0, WATER_Y);
		wet.addColorStop(0, 'rgba(10,6,3,0)');
		wet.addColorStop(1, 'rgba(10,6,3,0.8)');
		g.fillStyle = wet;
		g.fillRect(GX0, WATER_Y - 120, GW, 130);
		// lo lejano se hunde en la oscuridad
		const far = g.createLinearGradient(0, GY0, 0, 820);
		far.addColorStop(0, 'rgba(8,5,2,0.92)');
		far.addColorStop(1, 'rgba(8,5,2,0)');
		g.fillStyle = far;
		g.fillRect(GX0, GY0, GW, 820 - GY0);
		return c;
	});

// película de agua sobre la piedra (se ilumina como reflejo especular cerca del punto caliente del haz)
const sheen = () =>
	cached('d8sheen', () => {
		const c = makeCanvas(GW, GH);
		const g = c.getContext('2d')!;
		g.translate(-GX0, -GY0);
		g.save();
		g.beginPath();
		faceP(g);
		g.clip();
		g.filter = 'blur(3px)';
		for (let i = 0; i < 520; i++) {
			const a = hash(i, 191) * Math.PI * 2;
			const r = Math.sqrt(hash(i, 192)) * 0.95;
			const u = Math.cos(a) * r * 620;
			const v = Math.sin(a) * r * 550;
			const m = noise2D('wetfilm', u * 0.006, v * 0.006) + 0.15;
			if (m < 0.2) continue;
			const [x, y] = proj(u, v);
			const s = sAt(v);
			g.fillStyle = rgba('#fff4de', 0.2 + 0.5 * clamp(m));
			g.beginPath();
			g.ellipse(x, y, (8 + hash(i, 193) * 22) * s, (2 + hash(i, 194) * 4) * s, (hash(i, 195) - 0.5) * 0.3, 0, Math.PI * 2);
			g.fill();
		}
		g.restore();
		return c;
	});
// destellos de luna: lomos de piedritas, hojas mojadas y el borde lejano de la piedra (aditivos, fijos al suelo)
const moonGlints = () =>
	cached('d8moonglints', () => {
		const c = makeCanvas(GW, GH);
		const g = c.getContext('2d')!;
		g.translate(-GX0, -GY0);
		g.lineCap = 'round';
		for (let i = 0; i < 520; i++) {
			const u = (hash(i, 231) * 2 - 1) * 1800;
			const v = -1300 + hash(i, 232) * 2500;
			const [x, y] = proj(u, v);
			if (y > WATER_Y || Math.hypot(u / 650, v / 585) < 1) continue;
			const s = sAt(v);
			const r = (6 + hash(i, 233) * 14) * s;
			g.strokeStyle = rgba('#8fb4b0', 0.3 + hash(i, 234) * 0.5);
			g.lineWidth = 1.2 + s * 1.5;
			g.beginPath();
			g.ellipse(x, y, r, r * PV.sq, 0, Math.PI * 1.1, Math.PI * 1.75);
			g.stroke();
		}
		const top = facePts();
		g.strokeStyle = 'rgba(143,180,176,0.55)';
		g.lineWidth = 2.5;
		g.beginPath();
		const n = top.length;
		for (let k = Math.floor(n * 0.55); k <= Math.floor(n * 0.95); k++) {
			const [x, y] = top[k % n];
			if (k === Math.floor(n * 0.55)) g.moveTo(x, y + 1);
			else g.lineTo(x, y + 1);
		}
		g.stroke();
		for (let i = 0; i < 160; i++) {
			const x = GX0 + hash(i, 241) * GW;
			const y = 1450 + Math.pow(hash(i, 242), 0.7) * 140;
			g.strokeStyle = rgba('#9cc4be', 0.35 + hash(i, 243) * 0.4);
			g.lineWidth = 1.4;
			g.beginPath();
			const r = 5 + hash(i, 244) * 10;
			g.ellipse(x, y, r, r * 0.6, 0, Math.PI * 1.15, Math.PI * 1.7);
			g.stroke();
		}
		return c;
	});

// ---------------------------------------------------------------- agua que corre al frente (franja inferior)
export const waterStrip = (g: Ctx, t: number, y0 = WATER_Y) => {
	const h = 2200 - y0;
	const gr = g.createLinearGradient(0, y0, 0, y0 + h);
	gr.addColorStop(0, '#0f1d1d');
	gr.addColorStop(0.25, '#0b1718');
	gr.addColorStop(1, '#050b0c');
	g.fillStyle = gr;
	g.fillRect(-700, y0, 2600, h);
	const tile = tinted(noiseTile({seed: 95, period: 5, oct: 5, contrast: 2.6, bias: -0.18}), '#3f5e5e', 'd8water');
	drawTiled(g, tile, {x: -700, y: y0, w: 2600, h, scale: 0.9, ox: -t * 40, sy: 0.18, alpha: 0.5});
	drawTiled(g, tile, {x: -700, y: y0, w: 2600, h, scale: 0.55, ox: -t * 62 + 300, oy: 40, sy: 0.12, alpha: 0.4});
	g.fillStyle = 'rgba(6,4,2,0.85)';
	g.beginPath();
	g.moveTo(-700, y0 - 8);
	for (let x = -700; x <= 1900; x += 60) g.lineTo(x, y0 - 4 + Math.sin(x * 0.013) * 6 + noise2D('wl', x * 0.004, 0) * 8);
	g.lineTo(1900, y0 + 10);
	g.lineTo(-700, y0 + 10);
	g.fill();
};
// destellos de luna en el agua (corren a la izquierda a 40 px/s) — se pintan después de oscurecer
const waterGlints = (g: Ctx, t: number, light: (x: number, y: number) => number, cam: StoneCam, y0 = WATER_Y) => {
	g.lineCap = 'round';
	for (let i = 0; i < 60; i++) {
		const d = hash(i, 96);
		const yy = y0 + 18 + d * d * 300;
		const L = (30 + hash(i, 97) * 120) * (0.6 + d);
		const x = (((hash(i, 98) * 2600 - t * 40 * (0.8 + d * 0.6)) % 2600) + 2600) % 2600 - 700;
		const tw = 0.5 + 0.5 * Math.sin(t * (1.1 + hash(i, 99) * 1.8) + i * 1.7);
		const [sx, sy] = camPt(cam, x, yy);
		const warm = light(sx, sy);
		g.strokeStyle = warm > 0.05 ? rgba('#ffe8c4', 0.25 + warm * 0.6) : rgba('#86b0aa', 0.12 + tw * 0.35);
		g.lineWidth = 1.2 + d * 2;
		g.beginPath();
		g.moveTo(x, yy);
		g.quadraticCurveTo(x + L * 0.5, yy - 2 - d * 3, x + L, yy + Math.sin(i) * 2);
		g.stroke();
	}
};

// ---------------------------------------------------------------- pintura POV completa de la piedra
export type StoneCam = {x: number; y: number; zoom: number; roll: number};
export const stoneM = (g: Ctx, cam: StoneCam) => {
	g.translate(W / 2 + cam.x, H / 2 + cam.y);
	g.rotate(cam.roll);
	g.scale(cam.zoom, cam.zoom);
	g.translate(-W / 2, -H / 2);
};
export const camPt = (cam: StoneCam, x: number, y: number): V2 => {
	const dx = (x - W / 2) * cam.zoom;
	const dy = (y - H / 2) * cam.zoom;
	const c = Math.cos(cam.roll);
	const s = Math.sin(cam.roll);
	return [W / 2 + cam.x + dx * c - dy * s, H / 2 + cam.y + dx * s + dy * c];
};
// pantalla → espacio de la escena de la piedra (inverso de camPt)
export const camInv = (cam: StoneCam, x: number, y: number): V2 => {
	const dx = x - W / 2 - cam.x;
	const dy = y - H / 2 - cam.y;
	const c = Math.cos(-cam.roll);
	const s = Math.sin(-cam.roll);
	return [W / 2 + (dx * c - dy * s) / cam.zoom, H / 2 + (dx * s + dy * c) / cam.zoom];
};

export type PrintSet = 0 | 1 | 2 | 3 | 4;
const printSet = (k: PrintSet) => (k === 1 ? PRINTS.s7 : k === 2 ? PRINTS.s15 : k === 3 ? PRINTS.s40 : k === 4 ? [...PRINTS.s40, ...PRINTS.rings] : []);
export const PRINT_SIZE = 96; // 7 cm en unidades de la cara (≈ 60 px en pantalla)
// capa de albedo del POV de la piedra (todo lo que la linterna ilumina)
export const stonePOVAlbedo = (g: Ctx, t: number, cam: StoneCam, o: {prints: PrintSet; liston?: number; petals?: boolean; printPop?: number}) => {
	g.save();
	stoneM(g, cam);
	g.drawImage(groundPOV(), GX0, GY0);
	const set = printSet(o.prints);
	const npop = o.printPop ?? set.length;
	for (let i = 0; i < Math.min(npop, set.length); i++) {
		const p = set[i];
		const [x, y] = proj(p.u, p.v);
		footprint(g, x, y, p.a, PRINT_SIZE * sAt(p.v), PV.sq, p.side, 0, 0, 0.95);
	}
	if (o.petals) {
		for (const pr of PETAL_RING) {
			const [x, y] = proj(pr.u, pr.v);
			const s = sAt(pr.v);
			petal(g, x, y, pr.a, pr.s * s, pr.tone > 0.6 ? P.gold : pr.tone > 0.25 ? P.cempa : '#E8862F');
		}
	}
	if (o.liston) {
		const pts = OCHO.map(([x, y]) => proj(x - OCHO_CX, y - OCHO_CY));
		ribbon(g, pts, {w: 18 * sAt(0), shadow: 0.7});
	}
	waterStrip(g, t);
	g.restore();
};
// luz de luna y brillos mojados (después de oscurecer). light(x, y) en coordenadas de pantalla; hot = punto caliente del haz
export const stonePOVMoon = (g: Ctx, t: number, cam: StoneCam, light: (x: number, y: number) => number, o: {prints: PrintSet; liston?: number; hot?: V2; power?: number}) => {
	g.save();
	stoneM(g, cam);
	g.globalCompositeOperation = 'lighter';
	// luna: destellos fijos al suelo
	g.globalAlpha = 0.55;
	g.drawImage(moonGlints(), GX0, GY0);
	g.globalAlpha = 1;
	// película de agua: se enciende alrededor del reflejo del punto caliente (se desliza cuando el haz se mueve)
	if (o.hot && (o.power ?? 1) > 0.02) {
		const [hx, hy] = camInv(cam, o.hot[0], o.hot[1]);
		const rx = hx + (hx - PV.cx) * 0.35;
		const ry = hy - 40;
		const {c: sc, g: sg} = scratchStone();
		sg.drawImage(sheen(), 0, 0);
		sg.globalCompositeOperation = 'destination-in';
		const gr = sg.createRadialGradient(rx - GX0, ry - GY0, 0, rx - GX0, ry - GY0, 330);
		gr.addColorStop(0, `rgba(0,0,0,${0.6 * Math.min(1, o.power ?? 1)})`);
		gr.addColorStop(0.5, `rgba(0,0,0,${0.22 * Math.min(1, o.power ?? 1)})`);
		gr.addColorStop(1, 'rgba(0,0,0,0)');
		sg.fillStyle = gr;
		sg.fillRect(rx - GX0 - 340, ry - GY0 - 340, 680, 680);
		g.drawImage(sc, GX0, GY0);
	}
	// brillo mojado en las huellas (todas: el lodo está fresco)
	const set = printSet(o.prints);
	for (let i = 0; i < set.length; i++) {
		const p = set[i];
		const [x, y] = proj(p.u, p.v);
		const [sx, sy] = camPt(cam, x, y);
		const L = light(sx, sy);
		if (L < 0.06) continue;
		const s = sAt(p.v) * PRINT_SIZE;
		g.fillStyle = rgba('#fff2d6', Math.min(0.85, L * (0.5 + 0.4 * p.fresh)));
		g.beginPath();
		g.ellipse(x - s * 0.05, y - s * 0.1 * PV.sq, s * 0.05, s * 0.025, 0.2, 0, Math.PI * 2);
		g.fill();
		g.beginPath();
		g.arc(x + s * 0.03, y + s * 0.2 * PV.sq, s * 0.018, 0, Math.PI * 2);
		g.fill();
	}
	// rocío en el listón
	if (o.liston) {
		for (let i = 0; i < OCHO.length; i += 11) {
			const [x, y] = proj(OCHO[i][0] - OCHO_CX, OCHO[i][1] - OCHO_CY);
			const [sx, sy] = camPt(cam, x, y);
			const L = light(sx, sy);
			if (L < 0.06 || hash(i, 3) < 0.4) continue;
			g.fillStyle = rgba('#fff8e6', L * 0.75);
			g.beginPath();
			g.arc(x + (hash(i, 4) - 0.5) * 6, y + (hash(i, 5) - 0.5) * 5, 1.4 + hash(i, 6) * 1.6, 0, Math.PI * 2);
			g.fill();
		}
	}
	waterGlints(g, t, light, cam);
	g.restore();
};
const scratchStone = () => {
	const c = cached('d8scrStone', () => makeCanvas(GW, GH));
	const g = c.getContext('2d')!;
	g.setTransform(1, 0, 0, 1, 0, 0);
	g.globalCompositeOperation = 'source-over';
	g.clearRect(0, 0, GW, GH);
	return {c, g};
};
