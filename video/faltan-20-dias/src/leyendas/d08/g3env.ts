// Día 8 · G3 · entornos del final: B9 amanecer en la orilla del camino (cielo, ceibas/amates a contraluz, camino de
// tierra en perspectiva, ramo SECO, desmoronado) · B10/B11 cara superior de la piedra con textura, musgo, rocío ·
// B12 palmada de lodo en el lente con refracción.
import {noise2D} from '@remotion/noise';
import {H, W, clamp, hash, lerp, rgba} from '../../lib/util';
import {blurred, cached, fogBand, glow, makeCanvas, type Ctx} from '../kit/paint';
import {surface} from '../kit/shade';
import {smoothPath} from '../kit/rig';
import {P, footprint, petal, scratch, type V2} from './core';
import {PETAL_RING, PRINTS, STONE} from './stone';

export const HZN = 1185; // horizonte de B9 (pantalla)
const VPX = 600;

// ---------------------------------------------------------------- B9 · fondo (cielo + líneas de árboles), en caché
const blobs = (g: Ctx, cx: number, cy: number, rx: number, ry: number, n: number, seed: number) => {
	for (let i = 0; i < n; i++) {
		const a = hash(i, seed) * Math.PI * 2;
		const d = Math.sqrt(hash(i, seed + 1));
		const x = cx + Math.cos(a) * rx * d;
		const y = cy + Math.sin(a) * ry * d * 0.8;
		const r = (0.22 + hash(i, seed + 2) * 0.3) * Math.min(rx, ry * 2.2);
		g.beginPath();
		g.ellipse(x, y, r, r * 0.72, 0, 0, Math.PI * 2);
		g.fill();
	}
};
// ceiba: tronco recto con contrafuertes y copa en pisos planos (sombrilla); amate: copa ancha y redonda
const ceiba = (g: Ctx, x: number, base: number, h: number, seed: number) => {
	const tw = h * 0.045;
	g.beginPath();
	g.moveTo(x - tw * 2.6, base);
	g.quadraticCurveTo(x - tw * 0.9, base - h * 0.08, x - tw * 0.7, base - h * 0.3);
	g.lineTo(x - tw * 0.45, base - h * 0.78);
	g.lineTo(x + tw * 0.45, base - h * 0.78);
	g.lineTo(x + tw * 0.7, base - h * 0.3);
	g.quadraticCurveTo(x + tw * 0.9, base - h * 0.08, x + tw * 2.6, base);
	g.fill();
	// ramas horizontales
	g.lineWidth = tw * 0.35;
	g.lineCap = 'round';
	for (let k = 0; k < 4; k++) {
		const y = base - h * (0.62 + k * 0.1);
		const L = h * (0.42 - k * 0.07);
		for (const s of [-1, 1]) {
			g.beginPath();
			g.moveTo(x, y + h * 0.04);
			g.quadraticCurveTo(x + s * L * 0.5, y - h * 0.01, x + s * L * (0.9 + hash(k, seed + s) * 0.2), y - h * 0.03);
			g.stroke();
		}
		blobs(g, x, y - h * 0.035, L * 1.05, h * 0.035, 26, seed + k * 7);
	}
	blobs(g, x, base - h * 0.99, h * 0.16, h * 0.04, 14, seed + 50);
};
const amate = (g: Ctx, x: number, base: number, h: number, seed: number) => {
	const tw = h * 0.06;
	g.beginPath();
	g.moveTo(x - tw * 2, base);
	g.bezierCurveTo(x - tw * 0.6, base - h * 0.1, x - tw, base - h * 0.4, x - tw * 0.3, base - h * 0.55);
	g.lineTo(x + tw * 0.3, base - h * 0.55);
	g.bezierCurveTo(x + tw, base - h * 0.4, x + tw * 0.6, base - h * 0.1, x + tw * 2, base);
	g.fill();
	blobs(g, x, base - h * 0.72, h * 0.42, h * 0.24, 46, seed);
};

export const dawnBG = () =>
	cached('d8dawnBG:v1', () => {
		const c = makeCanvas(W, H);
		const g = c.getContext('2d')!;
		const sky = g.createLinearGradient(0, 0, 0, HZN + 40);
		sky.addColorStop(0, '#3e4a55');
		sky.addColorStop(0.35, '#6c7378');
		sky.addColorStop(0.68, '#b39b78');
		sky.addColorStop(0.9, '#e6b86a');
		sky.addColorStop(1, '#f5cf7a');
		g.fillStyle = sky;
		g.fillRect(0, 0, W, HZN + 60);
		// nubes rasgadas de amanecer con borde dorado
		for (let i = 0; i < 9; i++) {
			const y = 640 + i * 52 + hash(i, 5) * 30;
			const x = hash(i, 6) * W;
			const w = 260 + hash(i, 7) * 420;
			const cg = g.createLinearGradient(0, y - 14, 0, y + 14);
			cg.addColorStop(0, rgba('#5a5f63', 0.35));
			cg.addColorStop(1, rgba('#f0c47a', 0.35));
			g.fillStyle = cg;
			g.beginPath();
			g.ellipse(x, y, w, 9 + hash(i, 8) * 9, 0, 0, Math.PI * 2);
			g.fill();
		}
		const sun = g.createRadialGradient(700, HZN - 10, 0, 700, HZN - 10, 520);
		sun.addColorStop(0, 'rgba(255,238,190,0.95)');
		sun.addColorStop(0.18, 'rgba(250,206,120,0.55)');
		sun.addColorStop(1, 'rgba(245,194,66,0)');
		g.fillStyle = sun;
		g.fillRect(0, HZN - 540, W, 600);
		g.fillStyle = '#7a6a52';
		g.fillRect(0, HZN + 40, W, H - HZN);
		// fila lejana (azulada, perspectiva aérea)
		g.fillStyle = '#7d8380';
		for (let x = -40; x < W + 60; x += 46) blobs(g, x, HZN - 22 - hash(x, 9) * 20, 46, 26, 6, x + 11);
		g.fillRect(0, HZN - 24, W, 60);
		// fila media: ceibas y amates a contraluz, con halo dorado (filtro sólo al construir la caché)
		const mid = makeCanvas(W, H);
		const m = mid.getContext('2d')!;
		m.fillStyle = '#2f3533';
		m.strokeStyle = '#2f3533';
		amate(m, 90, HZN + 6, 430, 31);
		ceiba(m, 300, HZN + 6, 610, 41);
		amate(m, 520, HZN + 6, 300, 51);
		amate(m, 880, HZN + 6, 380, 61);
		ceiba(m, 1010, HZN + 6, 520, 71);
		m.fillRect(0, HZN - 30, W, 90);
		for (let x = 0; x < W; x += 22) blobs(m, x, HZN - 30 - hash(x, 3) * 30, 30, 22, 4, x + 3);
		const halo = makeCanvas(W, H);
		const hg = halo.getContext('2d')!;
		hg.filter = 'blur(10px)';
		hg.drawImage(mid, 0, 0);
		hg.filter = 'none';
		hg.globalCompositeOperation = 'source-in';
		hg.fillStyle = '#f2c46c';
		hg.fillRect(0, 0, W, H);
		g.globalAlpha = 0.8;
		g.drawImage(halo, 0, -4);
		g.globalAlpha = 1;
		g.drawImage(mid, 0, 0);
		// el sol se come el borde de las copas (bloom contenido)
		const s2 = g.createRadialGradient(700, HZN - 20, 0, 700, HZN - 20, 260);
		s2.addColorStop(0, 'rgba(255,236,186,0.75)');
		s2.addColorStop(1, 'rgba(255,236,186,0)');
		g.fillStyle = s2;
		g.fillRect(400, HZN - 300, 600, 400);
		return c;
	});

// camino de tierra en perspectiva (orilla con pasto), en caché
export const roadLayer = () =>
	cached('d8road:v1', () => {
		const c = makeCanvas(W, H);
		const g = c.getContext('2d')!;
		const dirt = surface('d8dirt', 512, 512, '#5e4630', [
			{seed: 801, color: '#2e2014', scale: 1.2, alpha: 0.55},
			{seed: 802, color: '#a07c56', scale: 0.5, alpha: 0.35},
		]);
		// filas de suelo comprimidas por la perspectiva
		for (let y = HZN; y < H; y += 6) {
			const d = (y - HZN) / (H - HZN); // 0 lejos → 1 cerca
			const sc = 0.15 + d * 2.2;
			const sy = (y * 7.3) % 512;
			g.globalAlpha = 1;
			for (let x = -((y * 13) % (512 * sc)); x < W; x += 512 * sc) g.drawImage(dirt, 0, sy, 512, Math.max(1, 6 / sc), x, y, 512 * sc, 6.5);
		}
		// surcos de llantas hacia el punto de fuga
		for (const [a, b] of [[-0.55, -0.35], [0.3, 0.52]] as const) {
			g.fillStyle = 'rgba(30,20,10,0.13)';
			g.beginPath();
			g.moveTo(VPX, HZN);
			g.lineTo(VPX + a * 2600, H);
			g.lineTo(VPX + b * 2600, H);
			g.closePath();
			g.fill();
		}
		// piedritas y grava (más grandes cerca)
		for (let i = 0; i < 900; i++) {
			const d = Math.pow(hash(i, 811), 1.8);
			const y = HZN + 4 + d * (H - HZN);
			const x = VPX + (hash(i, 812) - 0.5) * (300 + d * 3200);
			const r = 0.8 + d * 9 * (0.4 + hash(i, 813));
			g.fillStyle = rgba(hash(i, 814) > 0.5 ? '#2a1c10' : '#9a8062', 0.6);
			g.beginPath();
			g.ellipse(x, y, r, r * 0.55, 0, 0, Math.PI * 2);
			g.fill();
			if (r > 3) {
				g.fillStyle = 'rgba(245,200,130,0.35)';
				g.beginPath();
				g.ellipse(x - r * 0.2, y - r * 0.25, r * 0.5, r * 0.2, 0, 0, Math.PI * 2);
				g.fill();
			}
		}
		// orilla izquierda con pasto (donde estamos tirados)
		for (let i = 0; i < 520; i++) {
			const d = Math.pow(hash(i, 821), 1.4);
			const y = HZN + d * (H - HZN);
			const edge = VPX - 60 - d * 1500;
			const x = edge + (hash(i, 822) - 0.7) * (40 + d * 500);
			const L = 6 + d * 120 * (0.5 + hash(i, 823));
			const lean = (hash(i, 824) - 0.4) * L * 0.5;
			g.strokeStyle = rgba(hash(i, 825) > 0.5 ? '#3b4a26' : '#6b6a38', 0.85);
			g.lineWidth = 1 + d * 4;
			g.beginPath();
			g.moveTo(x, y);
			g.quadraticCurveTo(x + lean * 0.3, y - L * 0.6, x + lean, y - L);
			g.stroke();
		}
		// oscurece a lo lejos (niebla) y hacia la cámara (sin sol directo)
		const ag = g.createLinearGradient(0, HZN, 0, H);
		ag.addColorStop(0, 'rgba(214,200,170,0.75)');
		ag.addColorStop(0.15, 'rgba(160,140,110,0.25)');
		ag.addColorStop(0.6, 'rgba(20,12,6,0)');
		ag.addColorStop(1, 'rgba(20,12,6,0.55)');
		g.fillStyle = ag;
		g.fillRect(0, HZN, W, H - HZN);
		return c;
	});

// rocío: destellos que titilan sobre el camino
export const dew = (g: Ctx, t: number, y0: number, dy: number) => {
	g.save();
	g.globalCompositeOperation = 'lighter';
	for (let i = 0; i < 70; i++) {
		const d = Math.pow(hash(i, 831), 1.6);
		const y = HZN + 8 + d * (H - HZN) + dy;
		if (y < y0) continue;
		const x = VPX + (hash(i, 832) - 0.5) * (300 + d * 2600);
		const tw = Math.max(0, Math.sin(t * (2 + hash(i, 833) * 3) + i));
		const r = 1 + d * 3;
		g.fillStyle = rgba('#fff2c8', 0.5 * tw * tw);
		g.beginPath();
		g.arc(x, y, r, 0, Math.PI * 2);
		g.fill();
	}
	g.restore();
};

// cabezuela de cempasúchil SECA: pétalos rizados (escala-y .7), arena → café
export const driedHead = (g: Ctx, x: number, y: number, r: number, rot: number, seed: number, lost = 0) => {
	g.save();
	g.translate(x, y);
	g.rotate(rot);
	g.scale(1, 0.78);
	const tones = ['#6a4a2a', '#8a6a44', '#a88a5c', '#b9966a'];
	for (let ring = 0; ring < 4; ring++) {
		const n = 13 - ring * 2;
		const rr = r * (0.95 - ring * 0.24);
		for (let i = 0; i < n; i++) {
			if (hash(i + ring * 20, seed) < lost * (1 - ring * 0.2)) continue;
			const a = (i / n) * Math.PI * 2 + ring * 0.4 + hash(i, seed + ring) * 0.3;
			petal(g, Math.cos(a) * rr * 0.6, Math.sin(a) * rr * 0.6, a + Math.PI / 2, r * (0.62 - ring * 0.08), tones[(ring + i) % 4], 1, 0.95);
		}
	}
	g.fillStyle = '#2e1c0e';
	g.beginPath();
	g.arc(0, 0, r * 0.2, 0, Math.PI * 2);
	g.fill();
	g.restore();
};

// pétalos que se desprenden y vuelan con el viento (arrastre + ráfaga + giro), deterministas
export const crumble = (g: Ctx, t: number, src: V2[], n = 26) => {
	for (let i = 0; i < n; i++) {
		const tb = hash(i, 841) * 3.4;
		const age = t - tb;
		if (age < 0 || age > 2.6) continue;
		const [sx, sy] = src[i % src.length];
		const vx = 150 + hash(i, 842) * 260;
		const x = sx + vx * (1 - Math.exp(-1.4 * age)) / 1.4 + age * age * 60 + noise2D('cr', i, age * 0.8) * 50;
		const y = sy - 50 * age + 40 * age * age + noise2D('cr2', i, age * 0.9) * 40;
		const spin = age * (4 + hash(i, 843) * 6);
		g.save();
		g.translate(x, y);
		g.scale(Math.cos(spin) * 0.9 + 0.1 * Math.sign(Math.cos(spin) || 1), 1);
		petal(g, 0, 0, spin * 0.5 + i, 14 + hash(i, 844) * 10, hash(i, 845) > 0.5 ? '#a88a5c' : '#7a5a36', 1, clamp(1.4 - age / 2));
		g.restore();
	}
};

// ---------------------------------------------------------------- B10/B11 · cara superior de la piedra (espacio u,v)
const TU = 1300;
const TV = 1750;
export const topLayer = () =>
	cached('d8top:v3', () => {
		const c = makeCanvas(TU * 2, TV * 2);
		const g = c.getContext('2d')!;
		g.translate(TU, TV);
		// tierra húmeda + hojarasca
		const soil = surface('d8soil', 512, 512, '#3e3022', [
			{seed: 851, color: '#1c140c', scale: 1.4, alpha: 0.6},
			{seed: 852, color: '#6a553a', scale: 0.6, alpha: 0.35},
		]);
		for (let x = -TU; x < TU; x += 512) for (let y = -TV; y < TV; y += 512) g.drawImage(soil, x, y);
		for (let i = 0; i < 260; i++) {
			const x = (hash(i, 861) - 0.5) * TU * 2;
			const y = (hash(i, 862) - 0.5) * TV * 2;
			const L = 40 + hash(i, 863) * 70;
			g.save();
			g.translate(x, y);
			g.rotate(hash(i, 864) * 6.28);
			g.fillStyle = rgba(['#4a3a22', '#5c4628', '#2e3a22', '#6a4a2a'][i % 4], 0.85);
			g.beginPath();
			g.moveTo(0, -L / 2);
			g.quadraticCurveTo(L * 0.32, 0, 0, L / 2);
			g.quadraticCurveTo(-L * 0.32, 0, 0, -L / 2);
			g.fill();
			g.strokeStyle = 'rgba(20,12,6,0.5)';
			g.lineWidth = 1.5;
			g.beginPath();
			g.moveTo(0, -L / 2);
			g.lineTo(0, L / 2);
			g.stroke();
			g.restore();
		}
		// sombra de contacto de la piedra
		g.fillStyle = 'rgba(10,6,3,0.6)';
		g.beginPath();
		smoothPath(g, STONE.map(([u, v]) => [u * 1.06 + 26, v * 1.06 + 36] as V2), true);
		g.fill();
		// piedra: textura, musgo, vetas, filo
		const rock = surface('d8rock3', 512, 512, '#6b6352', [
			{seed: 871, color: '#2c312a', scale: 1.1, alpha: 0.55},
			{seed: 872, color: '#a39a84', scale: 0.45, alpha: 0.3},
			{seed: 873, color: '#3b2a1c', scale: 2.2, alpha: 0.25},
		]);
		g.save();
		g.beginPath();
		smoothPath(g, STONE, true);
		g.clip();
		for (let x = -TU; x < TU; x += 512) for (let y = -TV; y < TV; y += 512) g.drawImage(rock, x, y);
		for (let i = 0; i < 90; i++) {
			const a = hash(i, 881) * Math.PI * 2;
			const d = 0.55 + hash(i, 882) * 0.45;
			const [u, v] = STONE[Math.floor(hash(i, 883) * STONE.length)];
			const r = 30 + hash(i, 884) * 90;
			g.fillStyle = rgba(hash(i, 885) > 0.4 ? P.verde : '#3e4a2a', 0.12 + hash(i, 886) * 0.14);
			g.beginPath();
			g.ellipse(u * d + Math.cos(a) * 20, v * d + Math.sin(a) * 20, r, r * 0.6, a, 0, Math.PI * 2);
			g.fill();
		}
		g.strokeStyle = 'rgba(20,16,12,0.45)';
		g.lineWidth = 3;
		for (let k = 0; k < 6; k++) {
			g.beginPath();
			let x = (hash(k, 891) - 0.5) * 900;
			let y = (hash(k, 892) - 0.5) * 1200;
			g.moveTo(x, y);
			for (let j = 0; j < 8; j++) {
				x += (hash(j + k * 9, 893) - 0.3) * 90;
				y += (hash(j + k * 9, 894) - 0.5) * 90;
				g.lineTo(x, y);
			}
			g.stroke();
		}
		// luz del amanecer desde arriba a la izquierda + filo interior oscuro
		const lg = g.createRadialGradient(-260, -420, 40, -100, -150, 1100);
		lg.addColorStop(0, 'rgba(255,214,150,0.32)');
		lg.addColorStop(1, 'rgba(255,214,150,0)');
		g.fillStyle = lg;
		g.fillRect(-TU, -TV, TU * 2, TV * 2);
		g.lineWidth = 60;
		g.strokeStyle = 'rgba(12,10,8,0.35)';
		g.beginPath();
		smoothPath(g, STONE, true);
		g.stroke();
		// bisel: el filo de arriba a la izquierda atrapa el sol
		g.save();
		g.translate(10, 12);
		g.lineWidth = 10;
		g.strokeStyle = 'rgba(255,220,160,0.28)';
		g.beginPath();
		smoothPath(g, STONE, true);
		g.stroke();
		g.restore();
		g.restore();
		// huellas diminutas en anillos (lodo seco)
		for (const p of PRINTS.rings) footprint(g, p.u, p.v, p.a, 72, 1, p.side, 0, 0, 0.85);
		// pétalos secos en anillo
		for (const pr of PETAL_RING) petal(g, pr.u, pr.v, pr.a, pr.s, pr.tone > 0.5 ? P.gold : P.cempa, 0.75);
		return c;
	});
export const drawTop = (g: Ctx) => g.drawImage(topLayer(), -TU, -TV);

// gotas de rocío sobre el listón y la piedra (en espacio de pantalla del «8»)
export const dewBeads = (g: Ctx, pts: V2[], t: number, a = 1) => {
	for (let i = 0; i < pts.length; i += 23) {
		const [x, y] = pts[i];
		const ox = (hash(i, 901) - 0.5) * 10;
		const r = 3 + hash(i, 902) * 4;
		g.fillStyle = rgba('#2a0a04', 0.45 * a);
		g.beginPath();
		g.arc(x + ox + 1.5, y + 2.5, r, 0, Math.PI * 2);
		g.fill();
		g.fillStyle = rgba('#f4d8c0', 0.55 * a);
		g.beginPath();
		g.arc(x + ox, y, r, 0, Math.PI * 2);
		g.fill();
		const tw = 0.6 + 0.4 * Math.sin(t * 3 + i);
		g.fillStyle = rgba('#ffffff', 0.9 * a * tw);
		g.beginPath();
		g.arc(x + ox - r * 0.35, y - r * 0.35, r * 0.35, 0, Math.PI * 2);
		g.fill();
	}
};

// ---------------------------------------------------------------- B12 · palmada de lodo en el lente
const HANDPRINT: V2[] = (() => {
	// palma + 4 dedos (sin pulgar), mano pequeña de dedos largos y nudosos; local, palma centrada en (0,0)
	const pts: V2[] = [];
	const fingers = [
		{a: -2.35, L: 150, w: 26},
		{a: -1.92, L: 178, w: 27},
		{a: -1.5, L: 170, w: 26},
		{a: -1.1, L: 132, w: 23},
	];
	pts.push([-118, 70]);
	pts.push([-128, 0]);
	for (const fi of fingers) {
		const bx = Math.cos(fi.a) * 92;
		const by = Math.sin(fi.a) * 82;
		const tx = Math.cos(fi.a) * (92 + fi.L);
		const ty = Math.sin(fi.a) * (82 + fi.L);
		const nx = -Math.sin(fi.a) * fi.w;
		const ny = Math.cos(fi.a) * fi.w;
		pts.push([bx + nx, by + ny]);
		pts.push([(bx + tx) / 2 + nx * 1.15, (by + ty) / 2 + ny * 1.15]); // nudillo
		pts.push([tx + nx * 0.7, ty + ny * 0.7]);
		pts.push([tx + Math.cos(fi.a) * fi.w * 0.8, ty + Math.sin(fi.a) * fi.w * 0.8]);
		pts.push([tx - nx * 0.7, ty - ny * 0.7]);
		pts.push([(bx + tx) / 2 - nx * 1.1, (by + ty) / 2 - ny * 1.1]);
		pts.push([bx - nx, by - ny]);
	}
	pts.push([128, 20]);
	pts.push([110, 100]);
	pts.push([20, 140]);
	pts.push([-80, 130]);
	return pts;
})();

export const handprint = (g: Ctx, x: number, y: number, s: number, slide: number, k: number) => {
	// trazo suave en coordenadas de pantalla
	const m = new DOMMatrix().translate(x, y + slide).rotate(18).scale(s, s);
	const ctxPath = (q: Ctx) => {
		q.beginPath();
		smoothPath(q, HANDPRINT, true, 0.42);
	};
	// 1) refracción: copia desenfocada y desplazada de la imagen, recortada a la huella
	const bx = Math.round(x - 260 * s);
	const by = Math.round(y - 300 * s);
	const bw = Math.round(560 * s);
	const bh = Math.round(560 * s + slide + 80);
	const {c, g: q} = scratch(5, 640, 760);
	q.filter = 'blur(9px)';
	q.drawImage(g.canvas, bx + 14, by - 10, bw, bh, 0, 0, bw, bh);
	q.filter = 'none';
	q.globalCompositeOperation = 'destination-in';
	q.setTransform(m.translate(0, 0).preMultiplySelf(new DOMMatrix().translate(-bx, -by)));
	ctxPath(q);
	q.fill();
	q.setTransform(1, 0, 0, 1, 0, 0);
	q.globalCompositeOperation = 'source-over';
	g.save();
	g.globalAlpha = k;
	g.drawImage(c, 0, 0, bw, bh, bx, by, bw, bh);
	// 2) lodo translúcido con grumos y bordes más espesos
	g.setTransform(g.getTransform().multiply(m));
	ctxPath(g);
	g.save();
	g.clip();
	g.fillStyle = 'rgba(22,13,5,0.8)';
	g.fillRect(-500, -500, 1000, 1000);
	for (let i = 0; i < 80; i++) {
		const px = (hash(i, 911) - 0.5) * 420;
		const py = (hash(i, 912) - 0.6) * 520;
		const r = 8 + hash(i, 913) * 34;
		g.fillStyle = rgba(hash(i, 914) > 0.5 ? '#0e0803' : '#3a2410', 0.3 + hash(i, 915) * 0.4);
		g.beginPath();
		g.ellipse(px, py, r, r * 0.7, hash(i, 916) * 3, 0, Math.PI * 2);
		g.fill();
	}
	// huecos claros (donde la piel no tocó el vidrio)
	for (let i = 0; i < 24; i++) {
		const px = (hash(i, 921) - 0.5) * 220;
		const py = (hash(i, 922) - 0.5) * 200;
		g.fillStyle = 'rgba(120,80,40,0.12)';
		g.beginPath();
		g.ellipse(px, py, 10 + hash(i, 923) * 22, 6 + hash(i, 924) * 10, hash(i, 925) * 3, 0, Math.PI * 2);
		g.fill();
	}
	g.restore();
	g.strokeStyle = 'rgba(28,16,6,0.85)';
	g.lineWidth = 9;
	ctxPath(g);
	g.stroke();
	// brillo húmedo: el filo de arriba a la derecha atrapa el resplandor del 8
	g.save();
	g.translate(-4, 4);
	g.strokeStyle = 'rgba(245,170,90,0.4)';
	g.lineWidth = 3;
	ctxPath(g);
	g.stroke();
	g.restore();
	for (let i = 0; i < 14; i++) {
		const px = (hash(i, 941) - 0.3) * 220;
		const py = (hash(i, 942) - 0.7) * 300;
		g.fillStyle = 'rgba(255,200,130,0.35)';
		g.beginPath();
		g.ellipse(px, py, 3 + hash(i, 943) * 5, 1.5 + hash(i, 944) * 2, -0.6, 0, Math.PI * 2);
		g.fill();
	}
	// chorreados que bajan del lodo
	for (let i = 0; i < 5; i++) {
		const px = -90 + i * 48 + hash(i, 931) * 20;
		const L = (40 + hash(i, 932) * 110) * clamp(slide / 30 + 0.2);
		g.fillStyle = 'rgba(20,12,5,0.8)';
		g.beginPath();
		g.moveTo(px - 8, 110);
		g.quadraticCurveTo(px - 6, 110 + L * 0.7, px, 110 + L);
		g.quadraticCurveTo(px + 6, 110 + L * 0.7, px + 8, 110);
		g.fill();
	}
	g.restore();
};

export {blurred, fogBand, glow, lerp};
