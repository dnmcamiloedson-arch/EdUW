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
	g.fillStyle = col;
	g.beginPath();
	g.moveTo(-L * 0.5, 0);
	g.bezierCurveTo(-L * 0.25, -L * 0.22, L * 0.25, -L * 0.2, L * 0.5, 0);
	g.bezierCurveTo(L * 0.25, L * 0.2, -L * 0.25, L * 0.22, -L * 0.5, 0);
	g.fill();
	g.strokeStyle = vein;
	g.lineWidth = Math.max(0.6, L * 0.03);
	g.beginPath();
	g.moveTo(-L * 0.55, 0);
	g.lineTo(L * 0.48, 0);
	for (let k = -2; k <= 2; k++) {
		if (!k) continue;
		g.moveTo(k * L * 0.15, 0);
		g.lineTo(k * L * 0.15 + L * 0.1, -L * 0.12);
		g.moveTo(k * L * 0.15, 0);
		g.lineTo(k * L * 0.15 + L * 0.1, L * 0.12);
	}
	g.stroke();
	g.restore();
};
const pebble = (g: Ctx, x: number, y: number, r: number, sq: number, seed: number) => {
	const base = mixRGB('#5d625a', '#7a6a55', hash(seed, 3));
	g.save();
	g.translate(x, y);
	g.scale(1, sq);
	const gr = g.createRadialGradient(-r * 0.3, -r * 0.4, r * 0.1, 0, 0, r * 1.1);
	gr.addColorStop(0, rgba(mixRGB(rgba(base), '#d8d2c0', 0.35)));
	gr.addColorStop(0.6, rgba(base));
	gr.addColorStop(1, rgba(mixRGB(rgba(base), '#120a04', 0.6)));
	g.fillStyle = 'rgba(10,6,2,0.55)';
	g.beginPath();
	g.ellipse(r * 0.15, r * 0.35, r * 1.05, r * 0.8, 0, 0, Math.PI * 2);
	g.fill();
	g.fillStyle = gr;
	g.beginPath();
	g.ellipse(0, 0, r, r * (0.72 + hash(seed, 5) * 0.2), hash(seed, 6) * 3, 0, Math.PI * 2);
	g.fill();
	g.restore();
};

// ---------------------------------------------------------------- sprite POV del suelo + piedra (albedo)
export const GX0 = -560;
export const GY0 = -160;
const GW = 2300;
const GH = 2260;
export const groundPOV = () =>
	cached('d8groundPOV', () => {
		const c = makeCanvas(GW, GH);
		const g = c.getContext('2d')!;
		g.translate(-GX0, -GY0);
		// lodo base: más oscuro lejos
		const bg = g.createLinearGradient(0, GY0, 0, GY0 + GH);
		bg.addColorStop(0, '#1c130b');
		bg.addColorStop(0.45, '#3a2a19');
		bg.addColorStop(0.8, '#3f2c18');
		bg.addColorStop(1, '#2c1d10');
		g.fillStyle = bg;
		g.fillRect(GX0, GY0, GW, GH);
		const t1 = tinted(noiseTile({seed: 81, period: 6, oct: 6, contrast: 2.0}), '#0e0804', 'd8mud1');
		const t2 = tinted(noiseTile({seed: 82, period: 9, oct: 5, contrast: 2.4, bias: -0.1}), '#6b5232', 'd8mud2');
		drawTiled(g, t1, {x: GX0, y: GY0, w: GW, h: GH, scale: 1.6, alpha: 0.6, sy: 0.6});
		drawTiled(g, t2, {x: GX0, y: GY0, w: GW, h: GH, scale: 0.7, alpha: 0.35, sy: 0.6});
		// raíces lejanas
		g.strokeStyle = '#140c06';
		for (let i = 0; i < 9; i++) {
			const x0 = GX0 + hash(i, 21) * GW;
			const y0 = GY0 + hash(i, 22) * 520;
			g.lineWidth = 6 + hash(i, 23) * 16;
			g.beginPath();
			g.moveTo(x0, y0);
			g.bezierCurveTo(x0 + 200, y0 + 40, x0 + 260, y0 + 160 * hash(i, 24), x0 + 520 * (hash(i, 25) - 0.3), y0 + 260);
			g.stroke();
		}
		// hojarasca y piedritas en el plano del suelo
		for (let i = 0; i < 900; i++) {
			const u = (hash(i, 31) * 2 - 1) * 1900;
			const v = -2600 + hash(i, 32) * 3700;
			const [x, y] = proj(u, v);
			if (x < GX0 - 40 || x > GX0 + GW + 40 || y < GY0 - 40 || y > GY0 + GH + 40) continue;
			const s = sAt(v);
			if (s < 0.08) continue; // más allá del horizonte de la proyección
			const inStone = Math.hypot(u / 640, v / 570) < 1;
			if (inStone) continue;
			if (hash(i, 33) < 0.72) {
				const col = rgba(mixRGB(hash(i, 34) < 0.5 ? '#5a4022' : '#4a4a26', '#20140a', hash(i, 35) * 0.6));
				leaf(g, x, y, hash(i, 36) * 6.28, (40 + hash(i, 37) * 60) * s, PV.sq * 1.05, col, 'rgba(20,10,4,0.5)');
			} else pebble(g, x, y, (10 + hash(i, 38) * 22) * s, PV.sq * 1.1, i);
		}
		// sombra de contacto de la piedra
		const sh: V2[] = STONE.map(([u, v]) => proj(u * 1.08, v * 1.05 + 80));
		g.save();
		g.filter = 'blur(26px)';
		g.fillStyle = 'rgba(6,3,1,0.85)';
		g.beginPath();
		smoothPath(g, sh, true);
		g.fill();
		g.restore();
		// canto (cara frontal) de la piedra
		const top = STONE.map(([u, v]) => proj(u, v));
		const side = (q: Ctx) => {
			q.moveTo(top[0][0], top[0][1]);
			const n = STONE.length;
			const lower: V2[] = [];
			for (let k = 0; k <= n / 2; k++) {
				const [u, v] = STONE[k % n];
				const [x, y] = proj(u * 1.02, v * 1.02);
				lower.push([x, y + STONE_H * sAt(v) * clamp(0.3 + (v / 545) * 0.7 + 0.4)]);
			}
			smoothPath(q, [...lower, ...top.slice(0, n / 2 + 1).reverse()], true);
		};
		paintShape(g, side, [PV.cx - 520, PV.cy - 40, 1040, 420], {fill: vgrad('#3d4640', '#151a16'), light: -Math.PI * 0.7, shadow: {color: '#05070a', width: 60, alpha: 0.6}, texture: {seed: 84, scale: 0.8, alpha: 0.4}}, 1);
		// cara superior
		const face = (q: Ctx) => smoothPath(q, top, true);
		paintShape(
			g,
			face,
			[PV.cx - 400, PV.cy - 190, 800, 470],
			{
				fill: (q, b) => {
					const gr = q.createRadialGradient(b[0] + b[2] * 0.42, b[1] + b[3] * 0.4, 20, b[0] + b[2] * 0.5, b[1] + b[3] * 0.5, b[2] * 0.62);
					gr.addColorStop(0, '#8b948a');
					gr.addColorStop(0.55, '#6c766d');
					gr.addColorStop(1, '#3c453f');
					return gr;
				},
				light: -Math.PI * 0.62,
				shadow: {color: '#1a201c', width: 70, alpha: 0.7, blur: 50},
				rim: {color: '#b8c4bc', width: 6, alpha: 0.45},
				texture: {seed: 85, scale: 0.55, alpha: 0.45},
			},
			1,
		);
		// musgo y líquenes (en manchas con borde roto), grietas
		g.save();
		g.beginPath();
		face(g);
		g.clip();
		for (let i = 0; i < 1500; i++) {
			const a = hash(i, 51) * Math.PI * 2;
			const r = Math.sqrt(hash(i, 52));
			const u = Math.cos(a) * r * 640;
			const v = Math.sin(a) * r * 570;
			const m = noise2D('moss', u * 0.004, v * 0.004) + (r - 0.55) * 1.1 - (v > 0 ? 0.25 : -0.1);
			if (m < 0.15) continue;
			const [x, y] = proj(u, v);
			const s = sAt(v);
			g.fillStyle = rgba(mixRGB(P.verde, hash(i, 53) < 0.3 ? '#6f8a3a' : '#0f2a20', hash(i, 54)), 0.35 + 0.4 * clamp(m));
			g.beginPath();
			g.ellipse(x, y, (6 + hash(i, 55) * 14) * s, (4 + hash(i, 56) * 9) * s * PV.sq, 0, 0, Math.PI * 2);
			g.fill();
		}
		for (let i = 0; i < 140; i++) {
			const u = (hash(i, 61) * 2 - 1) * 560;
			const v = (hash(i, 62) * 2 - 1) * 480;
			if (Math.hypot(u / 600, v / 530) > 1) continue;
			const [x, y] = proj(u, v);
			g.fillStyle = rgba('#c9c8a8', 0.18 + hash(i, 63) * 0.2);
			g.beginPath();
			g.arc(x, y, (2 + hash(i, 64) * 5) * sAt(v), 0, Math.PI * 2);
			g.fill();
		}
		g.strokeStyle = 'rgba(14,16,14,0.55)';
		g.lineWidth = 2;
		for (let i = 0; i < 6; i++) {
			let u = (hash(i, 71) * 2 - 1) * 400;
			let v = (hash(i, 72) * 2 - 1) * 380;
			g.beginPath();
			const p0 = proj(u, v);
			g.moveTo(p0[0], p0[1]);
			for (let k = 0; k < 7; k++) {
				u += (hash(i * 9 + k, 73) - 0.5) * 120;
				v += 40 + hash(i * 9 + k, 74) * 50;
				const p = proj(u, v);
				g.lineTo(p[0], p[1]);
			}
			g.stroke();
		}
		g.restore();
		// orilla mojada antes del agua
		const wet = g.createLinearGradient(0, 1500, 0, 1640);
		wet.addColorStop(0, 'rgba(10,6,3,0)');
		wet.addColorStop(1, 'rgba(10,6,3,0.75)');
		g.fillStyle = wet;
		g.fillRect(GX0, 1500, GW, 200);
		return c;
	});

// brillos mojados de la piedra (solo brillan dentro del haz)
const SPEC = cached('d8spec', () => {
	const out: {u: number; v: number; l: number; a: number}[] = [];
	for (let i = 0; i < 70; i++) {
		const a = hash(i, 91) * Math.PI * 2;
		const r = Math.sqrt(hash(i, 92)) * 0.92;
		out.push({u: Math.cos(a) * r * 600, v: Math.sin(a) * r * 530, l: 10 + hash(i, 93) * 30, a: -0.3 + hash(i, 94) * 0.6});
	}
	return out;
});

// ---------------------------------------------------------------- agua que corre al frente (franja inferior)
export const waterStrip = (g: Ctx, t: number, y0 = 1600) => {
	const h = 2100 - y0;
	const gr = g.createLinearGradient(0, y0, 0, y0 + h);
	gr.addColorStop(0, '#0d1a1a');
	gr.addColorStop(0.25, '#0a1516');
	gr.addColorStop(1, '#050b0c');
	g.fillStyle = gr;
	g.fillRect(-700, y0, 2600, h);
	// borde: espuma oscura
	const tile = tinted(noiseTile({seed: 95, period: 5, oct: 5, contrast: 2.6, bias: -0.18}), '#5f8686', 'd8water');
	drawTiled(g, tile, {x: -700, y: y0, w: 2600, h, scale: 0.9, ox: -t * 40, sy: 0.18, alpha: 0.5});
	drawTiled(g, tile, {x: -700, y: y0, w: 2600, h, scale: 0.55, ox: -t * 62 + 300, oy: 40, sy: 0.12, alpha: 0.4});
	g.strokeStyle = 'rgba(160,190,186,0.35)';
	g.lineWidth = 2;
	for (let i = 0; i < 26; i++) {
		const yy = y0 + 20 + hash(i, 96) * (h - 40);
		const L = 40 + hash(i, 97) * 140;
		const x = ((hash(i, 98) * 2600 - t * (40 + hash(i, 99) * 30)) % 2600 + 2600) % 2600 - 700;
		g.globalAlpha = 0.25 + 0.5 * Math.abs(Math.sin(t * 1.3 + i));
		g.beginPath();
		g.moveTo(x, yy);
		g.lineTo(x + L, yy + Math.sin(i) * 3);
		g.stroke();
	}
	g.globalAlpha = 1;
	g.fillStyle = 'rgba(6,4,2,0.8)';
	g.fillRect(-700, y0 - 6, 2600, 10);
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

export type PrintSet = 0 | 1 | 2 | 3 | 4;
// capa de albedo del POV de la piedra (todo lo que la linterna ilumina)
export const stonePOVAlbedo = (g: Ctx, t: number, cam: StoneCam, o: {prints: PrintSet; liston?: number; petals?: boolean; printPop?: number}) => {
	g.save();
	stoneM(g, cam);
	g.drawImage(groundPOV(), GX0, GY0);
	const set = o.prints === 1 ? PRINTS.s7 : o.prints === 2 ? PRINTS.s15 : o.prints === 3 ? PRINTS.s40 : o.prints === 4 ? [...PRINTS.s40, ...PRINTS.rings] : [];
	const npop = o.printPop ?? set.length;
	for (let i = 0; i < Math.min(npop, set.length); i++) {
		const p = set[i];
		const [x, y] = proj(p.u, p.v);
		footprint(g, x, y, p.a, 72 * sAt(p.v), PV.sq, p.side, 0, 0, 0.92);
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
// luz de luna y brillos mojados (después de oscurecer)
export const stonePOVMoon = (g: Ctx, t: number, cam: StoneCam, light: (x: number, y: number) => number, o: {prints: PrintSet; liston?: number}) => {
	g.save();
	g.globalCompositeOperation = 'lighter';
	for (const sp of SPEC) {
		const [x, y] = proj(sp.u, sp.v);
		const [sx, sy] = camPt(cam, x, y);
		const L = light(sx, sy);
		if (L < 0.05) continue;
		const k = Math.pow(L, 2.2) * 0.55;
		const shift = (sx - W / 2) * 0.03;
		g.save();
		stoneM(g, cam);
		g.strokeStyle = rgba('#fff3dc', k);
		g.lineWidth = 2.2 * sAt(sp.v);
		g.beginPath();
		g.moveTo(x - sp.l * 0.5 + shift, y);
		g.lineTo(x + sp.l * 0.5 + shift, y + sp.a * 6);
		g.stroke();
		g.restore();
	}
	// gotas en las huellas frescas
	const set = o.prints === 4 ? PRINTS.rings : o.prints === 3 ? PRINTS.s40 : [];
	g.save();
	stoneM(g, cam);
	for (const p of set) {
		if (!p.fresh) continue;
		const [x, y] = proj(p.u, p.v);
		const [sx, sy] = camPt(cam, x, y);
		const L = light(sx, sy);
		if (L < 0.08) continue;
		g.fillStyle = rgba('#fff4dc', L * 0.6);
		g.beginPath();
		g.arc(x, y - 6 * sAt(p.v), 1.6 * sAt(p.v) * 1.6, 0, Math.PI * 2);
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
	g.restore();
	// borde de luna sobre el agua
	g.restore();
};
