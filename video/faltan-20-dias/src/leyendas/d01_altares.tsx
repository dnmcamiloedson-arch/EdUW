// Día 1 · «Falta uno» — versión historia: el patio de noche visto desde arriba. Las siete veladoras se encienden
// una por una, cada una con la seña de su leyenda (sin nombres ni facultades). Luego el fuego corre por el camino
// de cempasúchil, que tiene forma de «1», y aparece FALTA 1 DÍA. El outro estándar se agrega aparte.
import React from 'react';
import {useCurrentFrame} from 'remotion';
import {noise2D} from '@remotion/noise';
import {E, H, W, clamp, lerp} from '../lib/util';
import {Scene} from './kit/scene';
import {LeyendaLockup} from './kit/text';
import {cached, drawTiled, fogBand, glow, makeCanvas, noiseTile, tinted, type Ctx} from './kit/paint';
import {flame2D, marigold, particles} from './kit/fx';
import type {PostOpts} from './kit/post';
import {UNO_PATH, UNO_PTS} from './d01/uno';

export const EP01_LEN = 230; // 7.7 s
const FPS = 30;
const LOCK = 172;
const IGN = [96, 132]; // el fuego corre por el camino mientras la cámara se acerca a ras del suelo
const N = UNO_PTS.length / 2;

const hash = (i: number, s = 0) => {
	const x = Math.sin(i * 127.1 + s * 311.7) * 43758.5453;
	return x - Math.floor(x);
};

// las siete veladoras: abajo las tres del Ala Sur (1–3), arriba las cuatro del Ala Norte (4–7)
type Alt = {x: number; y: number; at: number; sig: (g: Ctx, x: number, y: number, t: number, k: number) => void};
const ORB = (g: Ctx, x: number, y: number, t: number, k: number) => {
	// brujas de fuego: una esfera de lumbre que flota arriba
	const yy = y - 95 + Math.sin(t * 2.2) * 10;
	glow(g, x + 30, yy, 90, '#F26D3D', 0.75 * k);
	flame2D(g, x + 30, yy + 14, 16, t * 1.3, 11, 0, 0.9 * k);
	glow(g, x + 30, yy, 10, '#FFF3D6', 0.9 * k);
};
const EYES = (color: string, dx: number, dy: number, sep: number) => (g: Ctx, x: number, y: number, t: number, k: number) => {
	const blink = (t * 0.6) % 1 > 0.94 ? 0.1 : 1;
	for (const s of [-1, 1]) {
		glow(g, x + dx + (s * sep) / 2, y + dy, 30, color, 0.8 * k * blink);
		glow(g, x + dx + (s * sep) / 2, y + dy, 7, '#FFF3D6', 1 * k * blink);
	}
};
const COIN = (g: Ctx, x: number, y: number, t: number, k: number) => {
	// charro negro: una moneda de oro tirada que destella
	g.save();
	g.globalAlpha = k;
	g.fillStyle = '#C9962E';
	g.beginPath();
	g.ellipse(x + 70, y + 40, 24, 16, 0.3, 0, Math.PI * 2);
	g.fill();
	g.restore();
	const tw = 0.5 + 0.5 * Math.sin(t * 5);
	glow(g, x + 74, y + 36, 50 * tw + 12, '#F5C242', 0.8 * k);
};
const CROSS = (g: Ctx, x: number, y: number, t: number, k: number) => {
	// momias: una crucecita de panteón que la vela alumbra
	g.save();
	g.globalAlpha = 0.85 * k;
	g.fillStyle = '#6b4a2c';
	g.fillRect(x - 92, y - 96, 12, 80);
	g.fillRect(x - 113, y - 78, 54, 11);
	g.restore();
	glow(g, x - 86, y - 60, 80, '#F5B04A', 0.3 * k);
};
const VEIL = (g: Ctx, x: number, y: number, t: number, k: number) => {
	// la llorona: un velo blanco que respira junto a la vela
	const vx = x - 60 + Math.sin(t * 0.9) * 10;
	const vg = g.createRadialGradient(vx, y - 60, 5, vx, y - 60, 120);
	vg.addColorStop(0, `rgba(235,238,236,${0.45 * k})`);
	vg.addColorStop(1, 'rgba(235,238,236,0)');
	g.fillStyle = vg;
	g.beginPath();
	g.ellipse(vx, y - 60, 60, 115, -0.2, 0, Math.PI * 2);
	g.fill();
};
const RIBBON = (g: Ctx, x: number, y: number, t: number, k: number) => {
	// chaneques: el listón rojo y luciérnagas
	g.save();
	g.globalAlpha = k;
	g.strokeStyle = '#A83A25';
	g.lineWidth = 10;
	g.lineCap = 'round';
	g.beginPath();
	for (let i = 0; i <= 20; i++) {
		const u = i / 20;
		const px = x + 40 + u * 90;
		const py = y + 30 + Math.sin(u * 7 + t * 2) * 10 - u * 30;
		if (i === 0) g.moveTo(px, py);
		else g.lineTo(px, py);
	}
	g.stroke();
	g.restore();
	for (let i = 0; i < 5; i++) {
		const fx = x - 60 + noise2D('d1ff', i, t * 0.4) * 70;
		const fy = y - 80 + noise2D('d1fy', i, t * 0.4) * 50;
		glow(g, fx, fy, 16, '#B8E07A', (0.5 + 0.5 * Math.sin(t * 4 + i * 2)) * 0.8 * k);
	}
};
// las siete veladoras en círculo alrededor del 1 (ángulos desde arriba, en el sentido del reloj)
export const RING = {cx: 540, cy: 925, rx: 420, ry: 640};
const SIGS = [ORB, EYES('#9FD36B', 85, -75, 34), COIN, EYES('#E03A2A', -80, 55, 22), CROSS, VEIL, RIBBON];
const ORBIT = {f0: 0, f1: 84, a0: -88, a1: 244}; // la cámara da la vuelta sobre las velas
const ALT: Alt[] = SIGS.map((sig, i) => {
	const a = -90 + 180 / 7 + (i * 360) / 7;
	const r = (a * Math.PI) / 180;
	const at = Math.max(8, ORBIT.f0 + ((a - ORBIT.a0) / (ORBIT.a1 - ORBIT.a0)) * (ORBIT.f1 - ORBIT.f0) - 17);
	return {x: RING.cx + RING.rx * Math.cos(r), y: RING.cy + RING.ry * Math.sin(r), at, sig};
});

const ground = (g: Ctx, t: number) => {
	g.fillStyle = '#120a05';
	g.fillRect(0, 0, W, H);
	const st = tinted(noiseTile({seed: 8, size: 256, period: 4, oct: 4, contrast: 1.3}), '#3a2a1c', 'd1st');
	drawTiled(g, st, {scale: 2.4, alpha: 0.55});
	// juntas de las losas del patio
	const j = cached('d1joints', () => {
		const c = makeCanvas(W, H);
		const q = c.getContext('2d')!;
		q.strokeStyle = 'rgba(0,0,0,0.45)';
		q.lineWidth = 3;
		for (let y = 0; y < H; y += 180) {
			q.beginPath();
			q.moveTo(0, y);
			q.lineTo(W, y);
			q.stroke();
			for (let x = (y / 180) % 2 ? 90 : 0; x < W; x += 180) {
				q.beginPath();
				q.moveTo(x, y);
				q.lineTo(x, y + 180);
				q.stroke();
			}
		}
		return c;
	});
	g.drawImage(j, 0, 0);
	fogBand(g, {y0: 0, y1: H, color: '#1F5C48', t, seed: 3, scale: 1.4, speed: 0.04, alpha: 0.12});
};

// el camino de pétalos con forma de 1; el fuego lo recorre de abajo hacia arriba
const order = cached('d1order', () => {
	const idx = Array.from({length: N}, (_, i) => i);
	idx.sort((a, b) => UNO_PTS[b * 2 + 1] - UNO_PTS[a * 2 + 1]);
	const rank = new Float32Array(N);
	idx.forEach((i, r) => (rank[i] = r / N));
	return rank;
});
const PETAL = ['#B8501F', '#C9772A', '#A8441A'];
const LIT = ['#F26D3D', '#F5A23A', '#F5C242'];
const path = (g: Ctx, f: number, t: number) => {
	const p = (f - IGN[0]) / (IGN[1] - IGN[0]);
	for (const lit of [false, true]) {
		const cols = lit ? LIT : PETAL;
		for (let ci = 0; ci < cols.length; ci++) {
			g.fillStyle = cols[ci];
			g.beginPath();
			for (let i = ci; i < N; i += cols.length) {
				const on = order[i] < p;
				if (on !== lit) continue;
				const x = UNO_PTS[i * 2] + noise2D('d1px', i, t * 0.5) * (on ? 1.5 : 0.5);
				const y = UNO_PTS[i * 2 + 1];
				const rot = hash(i, 6) * Math.PI;
				const s = 6 + hash(i, 8) * 3;
				g.moveTo(x + Math.cos(rot) * s, y + Math.sin(rot) * s);
				g.ellipse(x, y, s, s * 0.55, rot, 0, Math.PI * 2);
			}
			g.fill();
		}
	}
	// frente de fuego: brillo que sube por el trazo
	if (p > 0 && p < 1.05) {
		const fy = lerp(1240, 600, clamp(p));
		glow(g, 540, fy, 170, '#F5B04A', 0.55);
	}
};
const pathGlow = (g: Ctx, k: number) => {
	if (k <= 0) return;
	const c = cached('d1glow', () => {
		const cv = makeCanvas(W, H);
		const q = cv.getContext('2d')!;
		q.filter = 'blur(20px)';
		q.fillStyle = '#F5C242';
		q.fill(new Path2D(UNO_PATH));
		return cv;
	});
	g.save();
	g.globalAlpha = 0.5 * k;
	g.globalCompositeOperation = 'screen';
	g.drawImage(c, 0, 0);
	g.restore();
};

const veladora = (g: Ctx, a: Alt, f: number, t: number, i: number) => {
	const k = E.out(clamp((f - a.at) / 8));
	// corona de cempasúchil alrededor del vaso
	for (let j = 0; j < 7; j++) {
		const ang = (j / 7) * Math.PI * 2 + i;
		marigold(g, a.x + Math.cos(ang) * 46, a.y + Math.sin(ang) * 30, 15, ang, j + i, 0);
	}
	g.fillStyle = 'rgba(239,227,200,0.85)';
	g.beginPath();
	g.ellipse(a.x, a.y, 20, 14, 0, 0, Math.PI * 2);
	g.fill();
	if (k <= 0) return;
	glow(g, a.x, a.y - 10, 210, '#F5B04A', 0.32 * k);
	if (a.sig !== ORB) a.sig(g, a.x, a.y, t, E.inOut(clamp((f - a.at - 4) / 10)));
};

// ---------- suelo en coordenadas de mundo (el plano del patio), con margen alrededor del cuadro final ----------
const M = 1000;
const WW = W + M * 2;
const WH = H + M * 2;
const groundLayer = (f: number, t: number) => {
	const c = cached('d1world', () => makeCanvas(WW, WH));
	const q = c.getContext('2d')!;
	q.setTransform(1, 0, 0, 1, 0, 0);
	q.globalAlpha = 1;
	q.globalCompositeOperation = 'source-over';
	q.filter = 'none';
	const base = cached('d1worldBase', () => {
		const b = makeCanvas(WW, WH);
		const bq = b.getContext('2d')!;
		bq.translate(M, M);
		bq.save();
		bq.translate(-M, -M);
		bq.fillStyle = '#120a05';
		bq.fillRect(0, 0, WW, WH);
		const st = tinted(noiseTile({seed: 8, size: 256, period: 4, oct: 4, contrast: 1.3}), '#3a2a1c', 'd1st');
		drawTiled(bq, st, {x: 0, y: 0, w: WW, h: WH, scale: 2.4, alpha: 0.55});
		bq.strokeStyle = 'rgba(0,0,0,0.45)';
		bq.lineWidth = 3;
		for (let y = -180 * 4; y < H + M; y += 180) {
			bq.beginPath();
			bq.moveTo(0, y + M);
			bq.lineTo(WW, y + M);
			bq.stroke();
			for (let x = (Math.abs(y) / 180) % 2 ? 90 - 180 * 4 : -180 * 4; x < W + M; x += 180) {
				bq.beginPath();
				bq.moveTo(x + M, y + M);
				bq.lineTo(x + M, y + M + 180);
				bq.stroke();
			}
		}
		bq.restore();
		// el patio se pierde en la oscuridad hacia los bordes (sin orilla visible)
		bq.setTransform(1, 0, 0, 1, 0, 0);
		const vg = bq.createRadialGradient(WW / 2, WH / 2, Math.min(WW, WH) * 0.32, WW / 2, WH / 2, Math.max(WW, WH) * 0.62);
		vg.addColorStop(0, 'rgba(7,4,3,0)');
		vg.addColorStop(1, 'rgba(7,4,3,1)');
		bq.fillStyle = vg;
		bq.fillRect(0, 0, WW, WH);
		return b;
	});
	q.drawImage(base, 0, 0);
	q.translate(M, M);
	fogBand(q, {y0: -M, y1: H + M, x: -M, w: WW, color: '#1F5C48', t, seed: 3, scale: 1.4, speed: 0.04, alpha: 0.12});
	pathGlow(q, E.inOut(clamp((f - IGN[0] - 10) / 40)));
	path(q, f, t);
	ALT.forEach((a, i) => veladora(q, a, f, t, i));
	return c;
};

// ---------- cámara dron: posición (x, y en el plano; h altura), rumbo y picada ----------
type Cam3 = {x: number; y: number; h: number; pitch: number; yaw: number};
const F = 1100;
const D2R = Math.PI / 180;
const camKeys = cached('d1keys', () => {
	const keys: [number, Cam3][] = [];
	const at = (a: number, k = 1): [number, number] => [RING.cx + RING.rx * k * Math.cos(a * D2R), RING.cy + RING.ry * k * Math.sin(a * D2R)];
	const tang = (a: number) => Math.atan2(RING.ry * Math.cos(a * D2R), -RING.rx * Math.sin(a * D2R)) / D2R;
	for (let k = 0; k <= 7; k++) {
		const a = ORBIT.a0 + ((ORBIT.a1 - ORBIT.a0) * k) / 7;
		const [x, y] = at(a, 1.12);
		keys.push([ORBIT.f0 + ((ORBIT.f1 - ORBIT.f0) * k) / 7, {x, y, h: 520, pitch: 52, yaw: tang(a) + 22}]);
	}
	const [ex, ey] = at(ORBIT.a1 + 18, 0.92);
	const toC = Math.atan2(960 - ey, 540 - ex) / D2R;
	keys.push([104, {x: lerp(ex, 540, 0.45), y: lerp(ey, 960, 0.45), h: 150, pitch: 18, yaw: toC}]);
	keys.push([124, {x: lerp(ex, 540, 0.88), y: lerp(ey, 960, 0.88), h: 95, pitch: 11, yaw: toC}]);
	keys.push([146, {x: 540, y: 960, h: 520, pitch: 62, yaw: lerp(toC, -90, 0.6)}]);
	keys.push([168, {x: 540, y: 960, h: F, pitch: 90, yaw: -90}]);
	keys.push([230, {x: 540, y: 960, h: F, pitch: 90, yaw: -90}]);
	// rumbo continuo (sin saltos de 360°)
	for (let i = 1; i < keys.length; i++) {
		let y = keys[i][1].yaw;
		const p = keys[i - 1][1].yaw;
		while (y - p > 180) y -= 360;
		while (y - p < -180) y += 360;
		keys[i][1].yaw = y;
	}
	return keys;
});
const camAt = (f: number): Cam3 => {
	const K = camKeys;
	let i = 0;
	while (i < K.length - 2 && f > K[i + 1][0]) i++;
	const [f1, c1] = K[i];
	const [f2, c2] = K[i + 1];
	const c0 = K[Math.max(0, i - 1)][1];
	const c3 = K[Math.min(K.length - 1, i + 2)][1];
	const u = clamp((f - f1) / (f2 - f1));
	const cr = (p0: number, p1: number, p2: number, p3: number) => {
		const u2 = u * u;
		const u3 = u2 * u;
		return 0.5 * (2 * p1 + (-p0 + p2) * u + (2 * p0 - 5 * p1 + 4 * p2 - p3) * u2 + (-p0 + 3 * p1 - 3 * p2 + p3) * u3);
	};
	const k = (key: keyof Cam3) => cr(c0[key], c1[key], c2[key], c3[key]);
	return {x: k('x'), y: k('y'), h: Math.max(40, k('h')), pitch: clamp(k('pitch'), 5, 90), yaw: k('yaw')};
};

type Basis = {c: Cam3; r: number[]; u: number[]; fw: number[]};
const basis = (c: Cam3): Basis => {
	const p = c.pitch * D2R;
	const y = c.yaw * D2R;
	const fw = [Math.cos(y) * Math.cos(p), Math.sin(y) * Math.cos(p), -Math.sin(p)];
	const r = [-Math.sin(y), Math.cos(y), 0];
	const u = [fw[1] * r[2] - fw[2] * r[1], fw[2] * r[0] - fw[0] * r[2], fw[0] * r[1] - fw[1] * r[0]];
	return {c, r, u, fw};
};
// mundo (x, y en px del cuadro final; z hacia arriba) → pantalla [sx, sy, profundidad]
const proj3 = (b: Basis, x: number, y: number, z: number): [number, number, number] => {
	const dx = x - b.c.x;
	const dy = y - b.c.y;
	const dz = z - b.c.h;
	const zc = dx * b.fw[0] + dy * b.fw[1] + dz * b.fw[2];
	const xc = dx * b.r[0] + dy * b.r[1];
	const yc = dx * b.u[0] + dy * b.u[1] + dz * b.u[2];
	return [W / 2 + (F * xc) / zc, H / 2 - (F * yc) / zc, zc];
};

// pinta el plano del suelo en perspectiva: malla de triángulos con mapeo afín; los triángulos grandes o con mucha
// diferencia de profundidad (cerca de la cámara) se subdividen para que la perspectiva no se deforme
const NX = 24;
const NY = 32;
type SP = {u: number; v: number; p: [number, number, number]};
const warpGround = (g: Ctx, src: HTMLCanvasElement, b: Basis) => {
	const mk = (u: number, v: number): SP => ({u, v, p: proj3(b, u - M, v - M, 0)});
	const draw = (A: SP, B: SP, C: SP) => {
		const p0 = A.p;
		const p1 = B.p;
		const p2 = C.p;
		const den = (B.u - A.u) * (C.v - A.v) - (C.u - A.u) * (B.v - A.v);
		if (Math.abs(den) < 1e-6) return;
		const a11 = ((p1[0] - p0[0]) * (C.v - A.v) - (p2[0] - p0[0]) * (B.v - A.v)) / den;
		const a12 = ((p2[0] - p0[0]) * (B.u - A.u) - (p1[0] - p0[0]) * (C.u - A.u)) / den;
		const a21 = ((p1[1] - p0[1]) * (C.v - A.v) - (p2[1] - p0[1]) * (B.v - A.v)) / den;
		const a22 = ((p2[1] - p0[1]) * (B.u - A.u) - (p1[1] - p0[1]) * (C.u - A.u)) / den;
		const tx = p0[0] - a11 * A.u - a12 * A.v;
		const ty = p0[1] - a21 * A.u - a22 * A.v;
		const cx = (p0[0] + p1[0] + p2[0]) / 3;
		const cy = (p0[1] + p1[1] + p2[1]) / 3;
		const inf = (p: number[]) => {
			const dx = p[0] - cx;
			const dy = p[1] - cy;
			const l = Math.hypot(dx, dy) || 1;
			return [p[0] + (dx / l) * 0.9, p[1] + (dy / l) * 0.9];
		};
		const q0 = inf(p0);
		const q1 = inf(p1);
		const q2 = inf(p2);
		g.save();
		g.beginPath();
		g.moveTo(q0[0], q0[1]);
		g.lineTo(q1[0], q1[1]);
		g.lineTo(q2[0], q2[1]);
		g.closePath();
		g.clip();
		g.setTransform(a11, a21, a12, a22, tx, ty);
		g.drawImage(src, 0, 0);
		g.restore();
	};
	const tri = (A: SP, B: SP, C: SP, depth: number) => {
		const zs = [A.p[2], B.p[2], C.p[2]];
		const zmin = Math.min(...zs);
		const zmax = Math.max(...zs);
		if (zmax <= 4) return; // todo detrás de la cámara
		const front = zmin > 4;
		if (front) {
			const xs = [A.p[0], B.p[0], C.p[0]];
			const ys = [A.p[1], B.p[1], C.p[1]];
			const minx = Math.min(...xs);
			const maxx = Math.max(...xs);
			const miny = Math.min(...ys);
			const maxy = Math.max(...ys);
			if (maxx < -2 || minx > W + 2 || maxy < -2 || miny > H + 2) return;
			const big = Math.max(maxx - minx, maxy - miny);
			if (depth >= 5 || (zmax / zmin < 1.25 && big < 260) || big < 24) {
				draw(A, B, C);
				return;
			}
		} else if (depth >= 5) return;
		// subdividir en 4 por los puntos medios (en el plano del suelo)
		const ab = mk((A.u + B.u) / 2, (A.v + B.v) / 2);
		const bc = mk((B.u + C.u) / 2, (B.v + C.v) / 2);
		const ca = mk((C.u + A.u) / 2, (C.v + A.v) / 2);
		tri(A, ab, ca, depth + 1);
		tri(ab, B, bc, depth + 1);
		tri(ca, bc, C, depth + 1);
		tri(ab, bc, ca, depth + 1);
	};
	const G: SP[] = [];
	for (let j = 0; j <= NY; j++) for (let i = 0; i <= NX; i++) G.push(mk((i / NX) * WW, (j / NY) * WH));
	for (let j = 0; j < NY; j++)
		for (let i = 0; i < NX; i++) {
			const a = j * (NX + 1) + i;
			tri(G[a], G[a + 1], G[a + NX + 2], 0);
			tri(G[a], G[a + NX + 2], G[a + NX + 1], 0);
		}
};

const paint = (g: Ctx, f: number): PostOpts => {
	const t = f / FPS;
	const cam = camAt(f);
	const b = basis(cam);
	g.fillStyle = '#070403';
	g.fillRect(0, 0, W, H);
	warpGround(g, groundLayer(f, t), b);
	// bruma hacia el horizonte cuando la cámara va baja
	const far = proj3(b, cam.x + Math.cos(cam.yaw * D2R) * 1e5, cam.y + Math.sin(cam.yaw * D2R) * 1e5, 0);
	if (cam.pitch < 80 && far[2] > 0) {
		const hy = far[1];
		const fg = g.createLinearGradient(0, hy - 40, 0, hy + 520);
		fg.addColorStop(0, 'rgba(7,4,3,1)');
		fg.addColorStop(0.35, 'rgba(18,24,20,0.55)');
		fg.addColorStop(1, 'rgba(18,24,20,0)');
		g.fillStyle = fg;
		g.fillRect(0, hy - 40, W, 560);
		if (hy > 0) {
			g.fillStyle = '#070403';
			g.fillRect(0, 0, W, Math.max(0, hy - 38));
		}
	}
	// flamas paradas sobre cada veladora (carteles proyectados), de la más lejana a la más cercana
	const items = ALT.map((a, i) => ({a, i, p: proj3(b, a.x, a.y - 8, 18)})).filter((o) => o.p[2] > 20).sort((m, n) => n.p[2] - m.p[2]);
	for (const {a, i, p} of items) {
		const k = E.out(clamp((f - a.at) / 8));
		if (k <= 0) continue;
		const sc = 1100 / p[2];
		glow(g, p[0], p[1] - 14 * sc, 60 * sc, '#F5B04A', 0.35 * k);
		flame2D(g, p[0], p[1], 19 * sc, t + i, i, 0.15 * Math.sin(t * 1.7 + i), k);
		if (a.sig === ORB) {
			const op = proj3(b, a.x + 30, a.y, 95 + Math.sin(t * 2.2) * 10);
			if (op[2] > 20) {
				const so = 1100 / op[2];
				const ks = E.inOut(clamp((f - a.at - 4) / 10));
				glow(g, op[0], op[1], 90 * so, '#F26D3D', 0.75 * ks);
				flame2D(g, op[0], op[1] + 14 * so, 16 * so, t * 1.3, 11, 0, 0.9 * ks);
				glow(g, op[0], op[1], 10 * so, '#FFF3D6', 0.9 * ks);
			}
		}
	}
	// brasas que suben del frente de fuego
	const pf = (f - IGN[0]) / (IGN[1] - IGN[0]);
	if (pf > 0 && pf < 1.1) {
		for (let e = 0; e < 36; e++) {
			const life = (t * 0.9 + hash(e, 9)) % 1;
			const ex = 540 + (hash(e, 10) - 0.5) * 260;
			const ey = lerp(1240, 600, clamp(pf)) + (hash(e, 11) - 0.5) * 120;
			const ep = proj3(b, ex, ey, life * 220);
			if (ep[2] < 20) continue;
			const so = 1100 / ep[2];
			glow(g, ep[0], ep[1], 7 * so, '#F5A23A', (1 - life) * 0.9);
		}
	}
	return {bloom: 0.75, bloomThr: 0.6, halation: 0.35, vignette: 0.9, grain: 0.07, hatch: 0.1, contrast: 1.08, saturation: 1.05, exposure: lerp(0.85, 1.05, clamp((f - 10) / 70)), fade: 1 - E.out(clamp(f / 10))};
};

export const Ep01: React.FC<{dias: number; fecha: string}> = ({dias, fecha}) => {
	const f = useCurrentFrame();
	return (
		<Scene paint={paint} bg="#120a05">
			{f >= LOCK ? <LeyendaLockup f={f} at={LOCK} dias={dias} fecha={fecha} /> : null}
		</Scene>
	);
};
