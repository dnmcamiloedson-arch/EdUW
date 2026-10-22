// Día 8 · B3 · BAJÉ AL RÍO (f246–348). Hora azul en la barranca: avance a pie entre planos (cresta lejana → niebla →
// troncos lejanos → niebla → troncos medios con lianas y el tecolote → helechos arborescentes → orilla con la mata de
// cempasúchil → frondas cercanas desenfocadas). Tecolote gira la cabeza (282); panorámica hacia abajo (306) y la
// mano izquierda con el listón corta tres tallos (chasquido 330) y se los lleva.
import {noise2D} from '@remotion/noise';
import {H, W, clamp, hash, lerp, rgba} from '../../lib/util';
import {cached, drawTiled, fogBand, glow, makeCanvas, noiseTile, tinted, type Ctx} from '../kit/paint';
import {marigold, smoke} from '../kit/fx';
import type {PostOpts} from '../kit/post';
import {P, darkMap, easeInOut, litPlane, ring, scratch, seg, smooth, spr, type V2} from './core';
import {SKIN_POV, drawHand, handPt, sleeve, wristBand, type HandPose} from './hands';
import {B, EV, POST_MEMORY, POST_NIGHT} from './timeline';
import {FOGC, MB, MOONRIM, MX, branch, canopy, drawPlane, fernClump, ground, liana, owl, planePt, platLeaf, treeFern, trunk, type BPlane, type BView} from './barranca';
import {paintB2} from './b2';

const sec = (f: number) => f / 30;

// ---------------------------------------------------------------- planos
const RIDGE: BPlane = {
	key: 'b3ridge',
	z: 30000,
	rf: 0.6,
	draw: (g) => {
		// cresta lejana (más clara, más niebla) y la barranca en V con copas
		const ridge = (y0: number, depth: number, col: string, seed: number, amp: number) => {
			g.fillStyle = col;
			g.beginPath();
			g.moveTo(-MX, H + MB);
			for (let x = -MX; x <= W + MX; x += 12) {
				const v = Math.abs(x - 560) / 700;
				const y = y0 - v * depth + noise2D('rd' + seed, x * 0.006, 0) * amp + Math.abs(noise2D('rt' + seed, x * 0.05, 1)) * amp * 0.5;
				g.lineTo(x, y);
			}
			g.lineTo(W + MX, H + MB);
			g.fill();
		};
		ridge(1050, 360, '#29494e', 1, 30);
		ridge(1180, 420, '#1c383d', 2, 26);
		// el río allá abajo: hilo de plata entre las laderas
		g.lineCap = 'round';
		for (let k = 0; k < 3; k++) {
			g.strokeStyle = rgba('#a9c9c6', 0.22 - k * 0.06);
			g.lineWidth = 5 - k * 1.5;
			g.beginPath();
			g.moveTo(470, 1236 + k * 2);
			g.bezierCurveTo(520, 1230, 560, 1246, 640, 1240);
			g.stroke();
		}
		ridge(1300, 470, '#13292d', 3, 20);
	},
};
const FAR: BPlane = {
	key: 'b3far',
	z: 7000,
	rf: 0.9,
	draw: (g) => {
		canopy(g, 120, 0.55, 31, undefined, undefined, 0.7);
		const xs = [-120, 90, 300, 700, 900, 1120];
		xs.forEach((x, i) => trunk(g, {x, gy: 1260, w: 46 + hash(i, 41) * 34, h: 1500, seed: 40 + i, kind: i % 2 ? 'amate' : 'ceiba', fog: 0.62, rim: 0.7, lean: (hash(i, 42) - 0.5) * 0.06}));
		ground(g, 1260, 0.6, 43, {amp: 30});
		fernClump(g, 380, 1268, 90, 44, 0.6, 5, 0.3);
		fernClump(g, 820, 1262, 110, 45, 0.6, 5, 0.3);
	},
};
const MID: BPlane = {
	key: 'b3mid',
	z: 3200,
	rf: 1.25,
	draw: (g) => {
		canopy(g, 60, 0.3, 51, undefined, undefined, 1);
		branch(g, 262, 822, 520, 808, 20, 0.3, 52);
		branch(g, 880, 560, 1150, 520, 26, 0.3, 53);
		trunk(g, {x: -70, gy: 1360, w: 200, h: 1700, seed: 54, kind: 'ceiba', fog: 0.3, lean: 0.03});
		trunk(g, {x: 262, gy: 1350, w: 110, h: 1700, seed: 55, kind: 'amate', fog: 0.32, lean: -0.02});
		trunk(g, {x: 880, gy: 1372, w: 240, h: 1700, seed: 56, kind: 'ceiba', fog: 0.3, lean: -0.025});
		trunk(g, {x: 1190, gy: 1360, w: 130, h: 1700, seed: 57, kind: 'amate', fog: 0.32});
		ground(g, 1355, 0.3, 58, {amp: 40});
		fernClump(g, 520, 1362, 150, 59, 0.3, 6, 0.4);
		fernClump(g, 1040, 1372, 130, 60, 0.3, 5, 0.4);
		fernClump(g, 120, 1366, 120, 61, 0.3, 5, 0.4);
	},
};
const FERNS: BPlane = {
	key: 'b3ferns',
	z: 2000,
	rf: 1.35,
	draw: (g) => {
		ground(g, 1440, 0.12, 71, {amp: 50, slope: -0.02});
		treeFern(g, -90, 1450, 420, 1.2, 72, 0.12);
		treeFern(g, 1010, 1440, 640, 1.35, 73, 0.12);
		fernClump(g, 300, 1450, 200, 74, 0.12, 6, 0.5);
		fernClump(g, 760, 1446, 170, 75, 0.12, 5, 0.5);
	},
};
const BANK: BPlane = {
	key: 'b3bank',
	z: 1500,
	rf: 1.3,
	draw: (g) => {
		ground(g, 1500, 0, 81, {amp: 36, slope: 0.03});
		// piedras de la orilla con musgo
		for (let i = 0; i < 5; i++) {
			const x = [200, 340, 760, 880, 1010][i];
			const y = 1540 + hash(i, 82) * 50;
			const r = 34 + hash(i, 83) * 40;
			const gr = g.createRadialGradient(x - r * 0.4, y - r * 0.5, 4, x, y, r * 1.2);
			gr.addColorStop(0, '#46564f');
			gr.addColorStop(0.6, '#1d2622');
			gr.addColorStop(1, '#0a0e0c');
			g.fillStyle = gr;
			g.beginPath();
			g.ellipse(x, y, r * 1.3, r * 0.75, 0, 0, Math.PI * 2);
			g.fill();
			g.strokeStyle = rgba(MOONRIM, 0.35);
			g.lineWidth = 2;
			g.beginPath();
			g.ellipse(x, y, r * 1.3 - 2, r * 0.75 - 2, 0, Math.PI * 1.1, Math.PI * 1.6);
			g.stroke();
			g.fillStyle = rgba('#2f5a3e', 0.55);
			g.beginPath();
			g.ellipse(x - r * 0.2, y - r * 0.45, r * 0.7, r * 0.22, -0.1, 0, Math.PI * 2);
			g.fill();
		}
		fernClump(g, 120, 1510, 220, 84, 0, 6, 0.55);
		fernClump(g, 960, 1500, 200, 85, 0, 6, 0.55);
	},
};
const NEAR: BPlane = {
	key: 'b3near',
	z: 1150,
	rf: 0.6,
	blur: 9,
	draw: (g) => {
		platLeaf(g, -200, 1500, 760, 120, -0.95, 0.9, 91);
		platLeaf(g, -220, 1250, 640, 100, -0.45, 0.5, 92, '#13201a');
		platLeaf(g, W + 210, 1420, 720, 115, -2.35, -0.8, 93);
		platLeaf(g, W + 230, 1100, 560, 90, -2.9, -0.4, 94, '#13201a');
		fernClump(g, -60, 1900, 520, 95, 0, 7, 0.45);
		fernClump(g, W + 80, 1880, 480, 96, 0, 7, 0.45);
	},
};

// ---------------------------------------------------------------- cámara
// caminando cuesta abajo: avance que se frena para cortar las flores; bamboleo de paso 1.8 Hz; panorámica abajo 306
const camZ = (f: number) => 760 * (1 - Math.pow(1 - seg(f, B.b3[0] - 6, 318), 2));
const walkK = (f: number) => 1 - smooth(seg(f, 296, 318));
const TILT = 400;
const view = (f: number): BView => {
	const t = sec(f);
	const ph = (t - sec(B.b3[0])) * 1.8 * Math.PI;
	const wk = walkK(f);
	const bob = Math.abs(Math.sin(ph)) * 6 * wk;
	const hx = noise2D('b3hx', t * 0.35, 0) * 6 + noise2D('b3hx2', t * 1.1, 0) * 2;
	const hy = noise2D('b3hy', 0, t * 0.35) * 5 + noise2D('b3hy2', 0, t * 1.1) * 1.5;
	const tilt = spr(t - sec(EV.tiltDown), 220, 18);
	return {x: hx, y: hy - bob - tilt * TILT + 30, roll: Math.sin(ph) * 0.0087 * wk + noise2D('b3r', t * 0.35, 2) * 0.004};
};

// ---------------------------------------------------------------- mata de cempasúchil (por frame, en el plano BANK)
const STEMS = Array.from({length: 9}, (_, i) => ({
	bx: 492 + i * 15 + (hash(i, 101) - 0.5) * 10,
	hx: 438 + i * 31 + (hash(i, 102) - 0.5) * 18,
	hy: 1232 + hash(i, 103) * 70 + Math.abs(i - 4) * 6,
	r: 18 + hash(i, 104) * 6,
}));
const PICK = [3, 4, 5];
const GRIP_U = 0.55;
const stemPt = (i: number, u: number, sw: number): V2 => {
	const s = STEMS[i];
	const bx = s.bx;
	const by = 1502;
	const cx = lerp(bx, s.hx, 0.4) + sw * 40;
	const cy = lerp(by, s.hy, 0.55);
	const hx = s.hx + sw * 70;
	const hy = s.hy + Math.abs(sw) * 12;
	const a = (1 - u) * (1 - u);
	const b = 2 * (1 - u) * u;
	const c = u * u;
	return [a * bx + b * cx + c * hx, a * by + b * cy + c * hy];
};
const cutLeaf = (g: Ctx, x: number, y: number, ang: number, L: number) => {
	g.save();
	g.translate(x, y);
	g.rotate(ang);
	g.fillStyle = '#22361f';
	for (let k = 0; k < 5; k++) {
		const u = (k + 1) / 6;
		for (const sd of [-1, 1]) {
			g.beginPath();
			g.ellipse(u * L, sd * L * 0.09, L * 0.11, L * 0.035, sd * 0.6, 0, Math.PI * 2);
			g.fill();
		}
	}
	g.strokeStyle = '#2b4426';
	g.lineWidth = 2;
	g.beginPath();
	g.moveTo(0, 0);
	g.lineTo(L, 0);
	g.stroke();
	g.restore();
};
const clump = (g: Ctx, f: number, pull: V2, snapped: boolean) => {
	const t = sec(f);
	const back = snapped ? ring(t - sec(EV.snap), 2.2, 0.8) : 0;
	g.lineCap = 'round';
	STEMS.forEach((s, i) => {
		const picked = PICK.includes(i);
		const sw = noise2D('stm' + i, t * 0.6, 0) * 0.05 + back * 0.12 * (i < 4 ? -1 : 1) * (1 - Math.abs(i - 4) * 0.1);
		const pts: V2[] = [];
		const u1 = picked && snapped ? GRIP_U - 0.06 : 1;
		for (let k = 0; k <= 12; k++) {
			const u = (k / 12) * u1;
			let p = stemPt(i, u, sw);
			if (picked && !snapped) {
				const w = smooth(clamp(u / GRIP_U));
				p = [p[0] + pull[0] * w, p[1] + pull[1] * w];
			}
			pts.push(p);
		}
		g.strokeStyle = '#2a4523';
		g.lineWidth = 6;
		g.beginPath();
		pts.forEach((p, k) => (k ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1])));
		g.stroke();
		g.strokeStyle = rgba(MOONRIM, 0.3);
		g.lineWidth = 1.5;
		g.beginPath();
		pts.forEach((p, k) => (k ? g.lineTo(p[0] - 2, p[1]) : g.moveTo(p[0] - 2, p[1])));
		g.stroke();
		// hojas recortadas
		for (let k = 0; k < 2; k++) {
			const u = 0.25 + k * 0.25;
			if (u > u1) continue;
			const p = pts[Math.round((u / u1) * 12)];
			cutLeaf(g, p[0], p[1], (k % 2 ? -0.6 : -2.5) + (i % 2) * 0.2, 46);
		}
		if (picked && snapped) {
			// tallo roto: punta astillada clara
			const e = pts[pts.length - 1];
			g.fillStyle = '#9fb48a';
			g.beginPath();
			g.arc(e[0], e[1], 3, 0, Math.PI * 2);
			g.fill();
			return;
		}
		const h = pts[pts.length - 1];
		bloomHead(g, h[0], h[1], s.r, i);
	});
};
// cabeza de cempasúchil con luz de hora azul: sombra fría abajo a la derecha, filo de luna arriba a la izquierda
const bloomHead = (g: Ctx, x: number, y: number, r: number, i: number) => {
	marigold(g, x, y, r, i * 0.7, i, i % 2);
	g.save();
	g.globalCompositeOperation = 'multiply';
	const sh = g.createRadialGradient(x - r * 0.45, y - r * 0.5, r * 0.1, x, y, r);
	sh.addColorStop(0, '#d8d0c0');
	sh.addColorStop(0.6, '#8f8f8c');
	sh.addColorStop(1, '#5a686c');
	g.fillStyle = sh;
	g.beginPath();
	g.arc(x, y, r * 0.97, 0, Math.PI * 2);
	g.fill();
	g.restore();
	g.strokeStyle = rgba(MOONRIM, 0.4);
	g.lineWidth = 1.6;
	g.beginPath();
	g.arc(x, y, r * 1.05, Math.PI * 1.05, Math.PI * 1.55);
	g.stroke();
};
// flores ya cortadas (pantalla), desde el puño
const pickedInHand = (g: Ctx, grip: V2, k: number, f: number, recoil: number) => {
	g.lineCap = 'round';
	PICK.forEach((i, j) => {
		const s = STEMS[i];
		const base = stemPt(i, GRIP_U - 0.06, 0);
		const head: V2 = [s.hx, s.hy];
		const dx = (head[0] - base[0]) * k;
		const dy = (head[1] - base[1]) * k;
		const wob = Math.sin(sec(f) * 9 + j) * 6 * recoil;
		const b: V2 = [grip[0] + (j - 1) * 8, grip[1] + 20];
		const hd: V2 = [b[0] + dx * 1.05 + wob, b[1] + dy * 1.02];
		g.strokeStyle = '#2a4523';
		g.lineWidth = 6 * k * 0.8;
		g.beginPath();
		g.moveTo(b[0], b[1]);
		g.quadraticCurveTo((b[0] + hd[0]) / 2 + 6, (b[1] + hd[1]) / 2, hd[0], hd[1]);
		g.stroke();
		bloomHead(g, hd[0], hd[1], s.r * k * 0.82, i);
	});
};

// ---------------------------------------------------------------- mano izquierda (alcanza, cierra, jala, chasquido, sale)
const GRIP_LOCAL: V2 = [6, -120];
const handAt = (f: number, grip: V2): {pose: HandPose; gripScr: V2; pull: V2; recoil: number} => {
	const t = sec(f);
	const reach = easeInOut(seg(f, EV.pick0, 322));
	const close = f < 318 ? 0 : clamp(spr(sec(f - 318), 320, 22));
	const tens = smooth(seg(f, 324, EV.snap));
	const pull: V2 = [-20 * tens, 14 * tens];
	const recoil = f < EV.snap ? 0 : Math.exp(-(f - EV.snap) / 6);
	const out = Math.pow(seg(f, EV.snap + 3, EV.pick1), 2);
	const start: V2 = [grip[0] - 420, grip[1] + 720];
	let gp: V2 = [lerp(start[0], grip[0], reach) + pull[0], lerp(start[1], grip[1], reach) + pull[1]];
	if (f >= EV.snap) gp = [gp[0] - 34 * (1 - recoil) - out * 520, gp[1] + 30 * (1 - recoil) + out * 760];
	const trem: V2 = [noise2D('b3tr', t * 8, 0) * 1.5, noise2D('b3tr2', 0, t * 8) * 1.5];
	const curl = lerp(0.12, 0.92, close);
	const base: HandPose = {x: 0, y: 0, rot: 0.42 - 0.12 * reach, s: 1.75, side: 'L', view: 'dorsal', skin: SKIN_POV, curl: [curl, curl * 1.02, curl * 1.04, curl * 1.05], thumb: lerp(0.15, 0.8, close), spread: lerp(0.35, 0.05, close), forearm: 560, light: -2.4};
	const o = handPt(base, GRIP_LOCAL[0], GRIP_LOCAL[1]);
	const pose = {...base, x: gp[0] - o[0] + trem[0], y: gp[1] - o[1] + trem[1]};
	return {pose, gripScr: gp, pull, recoil};
};

// ---------------------------------------------------------------- transición: el humo del recuerdo se vuelve niebla
const lastB2 = () =>
	cached('d8b3lastB2', () => {
		const c = makeCanvas(W, H);
		paintB2(c.getContext('2d')!, B.b2[1] - 1);
		return c;
	});
const lerpPost = (a: PostOpts, b: PostOpts, u: number): PostOpts => {
	const o: Record<string, unknown> = {};
	for (const k of new Set([...Object.keys(a), ...Object.keys(b)])) {
		const va = (a as Record<string, unknown>)[k];
		const vb = (b as Record<string, unknown>)[k];
		if (typeof va === 'number' && typeof vb === 'number') o[k] = lerp(va, vb, u);
		else if (Array.isArray(va) && Array.isArray(vb)) o[k] = va.map((x: number, i: number) => lerp(x, vb[i] as number, u));
		else o[k] = u < 0.5 ? (va ?? vb) : (vb ?? va);
	}
	return o as PostOpts;
};

// ---------------------------------------------------------------- B3
export const paintB3 = (g: Ctx, f: number): PostOpts => {
	const t = sec(f);
	const cz = camZ(f);
	const v = view(f);
	// cielo de hora azul con luna en creciente (se mueve con la cabeza, sin paralaje)
	const sky = g.createLinearGradient(0, v.y - 200, 0, v.y + 1500);
	sky.addColorStop(0, '#07131a');
	sky.addColorStop(0.45, '#123039');
	sky.addColorStop(1, '#2d5258');
	g.fillStyle = sky;
	g.fillRect(0, 0, W, H);
	const mx = 300 + v.x;
	const my = 330 + v.y;
	glow(g, mx, my, 420, '#7fa6a8', 0.18);
	g.fillStyle = '#e4ebde';
	g.beginPath();
	g.arc(mx, my, 24, 0, Math.PI * 2);
	g.fill();
	g.fillStyle = '#0c1f27';
	g.beginPath();
	g.arc(mx + 9, my - 6, 23, 0, Math.PI * 2);
	g.fill();
	for (let i = 0; i < 26; i++) {
		const sx = hash(i, 201) * W + v.x;
		const sy = hash(i, 202) * 700 + v.y - 100;
		g.fillStyle = rgba('#dfe8e0', 0.15 + 0.25 * hash(i, 203) * (0.7 + 0.3 * Math.sin(t * 2 + i)));
		g.fillRect(sx, sy, 1.6, 1.6);
	}
	drawPlane(g, RIDGE, cz, v);
	const fy = (z: number, y: number) => planePt(z, cz, v, 540, y)[1];
	fogBand(g, {y0: fy(30000, 1050), y1: fy(30000, 1420), color: '#4f7074', t, seed: 11, alpha: 0.5, speed: 10});
	drawPlane(g, FAR, cz, v);
	fogBand(g, {y0: fy(7000, 1100), y1: fy(7000, 1420), color: '#46676b', t, seed: 12, alpha: 0.45, speed: 14});
	drawPlane(g, MID, cz, v, (q) => {
		const sway = Math.sin(t * 0.9) * 10;
		liana(q, 330, -200, 520, -160, 760, 7, 0.3, sway);
		liana(q, 600, -220, 830, -180, 520, 5, 0.32, -sway * 0.7);
		liana(q, 470, -200, 470, 980, 0, 4, 0.34, sway * 0.6);
		// tecolote: gira la cabeza 90° en 5 frames con rebase (282)
		const yaw = 1 - clamp(spr(sec(f - EV.owlTurn), 1700, 46), 0, 1.15);
		const tilt = f >= EV.owlTurn + 6 ? Math.sin(sec(f - EV.owlTurn - 6) * 7) * 0.05 * Math.exp(-(f - EV.owlTurn - 6) / 12) : 0;
		owl(q, 436, 800, 62, yaw, tilt + (f >= EV.owlTurn ? 0.06 : 0), 0.28);
	});
	fogBand(g, {y0: fy(3200, 1180), y1: fy(3200, 1560), color: '#3e5f63', t, seed: 13, alpha: 0.32, speed: 18});
	drawPlane(g, FERNS, cz, v);
	// orilla con la mata (más clara: el único color cálido)
	const snapped = f >= EV.snap;
	const grip = planePt(BANK.z, cz, v, stemPt(4, GRIP_U, 0)[0], stemPt(4, GRIP_U, 0)[1]);
	const H0 = f >= EV.pick0 ? handAt(f, grip) : null;
	drawPlane(g, BANK, cz, v, (q, k) => {
		const pull: V2 = H0 ? [H0.pull[0] / k, H0.pull[1] / k] : [0, 0];
		clump(q, f, pull, snapped);
	});
	drawPlane(g, NEAR, cz, v);
	// mano + flores cortadas (con luz de luna: oscurecida por plano)
	if (H0 && f < EV.pick1 + 2) {
		const kb = (BANK.z / Math.max(1, BANK.z - cz)) * 1;
		const dk = darkMap({x: 0, y: 0, r: 1, power: 0}, 0.42, '#0a1c22');
		litPlane(g, dk, (q) => {
			if (snapped) pickedInHand(q, H0.gripScr, kb, f, H0.recoil);
			sleeve(q, H0.pose, 150, '#141413', '#22221f');
			drawHand(q, H0.pose);
			wristBand(q, H0.pose, {wraps: 2, knot: 1, tails: 1, dim: 0.85});
		});
	}
	// bruma baja al frente y velo azul general
	fogBand(g, {y0: 1300, y1: 1920, color: '#2e4c52', t, seed: 14, alpha: 0.18, speed: 22});
	g.fillStyle = rgba('#0a1e26', 0.12);
	g.fillRect(0, 0, W, H);
	// transición desde el recuerdo (246–266): el cuadro de la cocina se deshace en humo que sube
	const u = seg(f, B.b3[0], EV.smoke1 + 2);
	if (u < 1) {
		const src = lastB2();
		const {c: dc, g: dg} = scratch(9);
		dg.drawImage(src, noise2D('disx', t * 0.7, 0) * 20 * u, -u * u * 160);
		dg.globalCompositeOperation = 'destination-out';
		const tile = tinted(noiseTile({seed: 61, period: 3, oct: 5, contrast: 2.4}), '#000', 'd8dis');
		drawTiled(dg, tile, {w: W, h: H, scale: 1.6, oy: t * 90, ox: t * 12, alpha: clamp(u * 1.6), op: 'destination-out'});
		drawTiled(dg, tile, {w: W, h: H, scale: 0.9, oy: t * 140 + 300, alpha: clamp(u * 1.6 - 0.25), op: 'destination-out'});
		g.save();
		g.globalAlpha = clamp(1.15 - u * 1.15);
		g.drawImage(dc, 0, 0);
		g.restore();
		smoke(g, {x: 540, y: H + 300, h: 2400, w: 1500, t: t + 3, seed: 6, color: '#cbbfa6', alpha: 0.65 * (1 - smooth(u))});
	}
	const post = u < 1 ? lerpPost(POST_MEMORY, {...POST_NIGHT, hatch: 0.45}, smooth(u)) : {...POST_NIGHT, hatch: 0.45};
	void P;
	void FOGC;
	return post;
};
