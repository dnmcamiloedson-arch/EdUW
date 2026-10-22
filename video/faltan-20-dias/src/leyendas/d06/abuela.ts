// La madre (la protectora; el nombre del módulo se conserva): silueta 2D de seis partes (capucha/rebozo, torso,
// falda, brazo, antebrazo, mano) con material pictórico, rebozo con física (rebozo.ts) y 18 barbas; el ojo en
// primerísimo plano estilo grabado (gancho y amanecer) y los dedos que agarran los bordes del vidrio en el clímax.
import {E, clamp, hash, lerp, mixRGB, rgba} from '../../lib/util';
import {drawTiled, glow, noiseTile, tinted, type Ctx} from '../kit/paint';
import {paintShape, vgrad} from '../kit/shade';
import {ik2, smoothPath, type V2} from '../kit/rig';
import {COLS, ROWS, restCloth, solveBody, type Body} from './rig06';
import {fringeAt, rebozoAt, gridPt} from './rebozo';
import {poseAt} from './poses';
import {P} from './timeline';

export type AbuelaPose = {
	x: number; // piso bajo la cadera (mundo)
	y: number;
	s?: number; // escala (1 = 620 px de alto de pie)
	lean?: number; // rad hacia adelante
	head?: number; // rad cabeceo (dormitando)
	seated?: number; // 0 de pie, de espaldas → 1 sentada de perfil (mira a la derecha)
	arm?: V2 | null; // objetivo de la mano (mundo) o null = bajo el rebozo
	rim?: number; // intensidad del contorno cálido
	rimColor?: string;
	bob?: number;
	walk?: number | null; // fase de caminata (en pasos)
};

const LIGHT = 2.36; // la veladora: abajo a la izquierda, junto al espejo
const L1 = 118;
const L2 = 112;

const pathOf = (pts: V2[]) => (q: Ctx) => smoothPath(q, pts, true);
const bbox = (pts: V2[], pad = 4): [number, number, number, number] => {
	let x0 = Infinity;
	let y0 = Infinity;
	let x1 = -Infinity;
	let y1 = -Infinity;
	for (const [x, y] of pts) {
		x0 = Math.min(x0, x);
		y0 = Math.min(y0, y);
		x1 = Math.max(x1, x);
		y1 = Math.max(y1, y);
	}
	return [x0 - pad, y0 - pad, x1 - x0 + pad * 2, y1 - y0 + pad * 2];
};

// rejilla del rebozo para este cuerpo: reposo del cuerpo dibujado + desplazamiento dinámico de la simulación
const clothFor = (b: Body, f: number | undefined): {G: Float32Array; shift: (c: number, r: number) => V2} => {
	const G = new Float32Array(COLS * ROWS * 2);
	const sim = f !== undefined ? rebozoAt(f) : null;
	const pSim = f !== undefined ? poseAt(Math.floor(f)) : null;
	const bSim = pSim ? solveBody({m: pSim.seated ?? 0, lean: pSim.lean ?? 0, head: pSim.head ?? 0, walk: pSim.walk ?? null}) : null;
	const d = new Float32Array(COLS * ROWS * 2);
	for (let r = 0; r < ROWS; r++)
		for (let c = 0; c < COLS; c++) {
			const i = (r * COLS + c) * 2;
			const q = restCloth(b, c, r);
			let dx = 0;
			let dy = 0;
			if (sim && bSim) {
				const qs = restCloth(bSim, c, r);
				dx = sim[i] - qs[0];
				dy = sim[i + 1] - qs[1];
				const m = Math.hypot(dx, dy);
				if (m > 60) {
					dx *= 60 / m;
					dy *= 60 / m;
				}
			}
			d[i] = dx;
			d[i + 1] = dy;
			G[i] = q[0] + dx;
			G[i + 1] = q[1] + dy;
		}
	return {G, shift: (c, r) => [d[(r * COLS + c) * 2], d[(r * COLS + c) * 2 + 1]]};
};

// brazo: manga de manta hasta el codo, antebrazo y mano con anillo de plata
const paintArm = (g: Ctx, S: V2, T: V2, rim: number, rimColor: string, side: number) => {
	const a = ik2(S, T, L1, L2, 1);
	const b = ik2(S, T, L1, L2, -1);
	const {mid: M, end: W} = a.mid[1] > b.mid[1] ? a : b;
	const seg = (p: V2, q: V2, w0: number, w1: number, c0: string, c1: string) => {
		const dx = q[0] - p[0];
		const dy = q[1] - p[1];
		const L = Math.hypot(dx, dy) || 1;
		const nx = -dy / L;
		const ny = dx / L;
		const gr = g.createLinearGradient(p[0] + nx * w0, p[1] + ny * w0, p[0] - nx * w0, p[1] - ny * w0);
		gr.addColorStop(0, c0);
		gr.addColorStop(1, c1);
		g.fillStyle = gr;
		g.beginPath();
		g.moveTo(p[0] + nx * w0, p[1] + ny * w0);
		g.lineTo(q[0] + nx * w1, q[1] + ny * w1);
		g.arc(q[0], q[1], w1, Math.atan2(ny, nx), Math.atan2(ny, nx) + Math.PI);
		g.lineTo(p[0] - nx * w0, p[1] - ny * w0);
		g.arc(p[0], p[1], w0, Math.atan2(-ny, -nx), Math.atan2(-ny, -nx) + Math.PI);
		g.closePath();
		g.fill();
		// contorno del lado de la luz
		const lx = Math.cos(LIGHT);
		const ly = Math.sin(LIGHT);
		const sgn = nx * lx + ny * ly > 0 ? 1 : -1;
		g.strokeStyle = rgba(rimColor, 0.5 * rim);
		g.lineWidth = 2.2;
		g.beginPath();
		g.moveTo(p[0] + sgn * nx * (w0 - 1), p[1] + sgn * ny * (w0 - 1));
		g.lineTo(q[0] + sgn * nx * (w1 - 1), q[1] + sgn * ny * (w1 - 1));
		g.stroke();
	};
	// manga (manta en sombra)
	seg(S, M, 17, 14, '#7a6c58', '#2e261c');
	// pliegues de la manga
	g.strokeStyle = 'rgba(20,14,8,0.45)';
	g.lineWidth = 1.5;
	for (let k = 1; k < 4; k++) {
		const u = k / 4;
		const px = lerp(S[0], M[0], u);
		const py = lerp(S[1], M[1], u);
		g.beginPath();
		g.arc(px, py, 11, 0.3, 1.6);
		g.stroke();
	}
	// antebrazo (piel)
	const mid2: V2 = [lerp(M[0], W[0], 0.18), lerp(M[1], W[1], 0.18)];
	seg(mid2, W, 10, 7.5, '#8a5232', '#3a2010');
	// puño de la manga
	g.fillStyle = '#5a4c3a';
	g.beginPath();
	g.ellipse(M[0] + (W[0] - M[0]) * 0.16, M[1] + (W[1] - M[1]) * 0.16, 14, 9, Math.atan2(W[1] - M[1], W[0] - M[0]) + Math.PI / 2, 0, Math.PI * 2);
	g.fill();
	// mano: palma, dedos juntos, pulgar
	const ang = Math.atan2(W[1] - M[1], W[0] - M[0]);
	g.save();
	g.translate(W[0], W[1]);
	g.rotate(ang);
	const skin = g.createLinearGradient(0, -10, 0, 10);
	skin.addColorStop(0, '#9a5e3a');
	skin.addColorStop(1, '#2e180a');
	g.fillStyle = skin;
	g.beginPath();
	g.moveTo(-2, -9);
	g.bezierCurveTo(10, -12, 22, -10, 30, -6);
	g.bezierCurveTo(36, -3, 36, 4, 30, 6);
	g.bezierCurveTo(22, 9, 10, 11, -2, 8);
	g.closePath();
	g.fill();
	g.beginPath();
	g.moveTo(4, side * -6);
	g.quadraticCurveTo(14, side * -16, 20, side * -12);
	g.quadraticCurveTo(14, side * -6, 8, side * -2);
	g.closePath();
	g.fill();
	// separación de dedos
	g.strokeStyle = 'rgba(20,10,4,0.5)';
	g.lineWidth = 1;
	for (const yy of [-3, 1, 4.5]) {
		g.beginPath();
		g.moveTo(18, yy);
		g.lineTo(32, yy * 0.8);
		g.stroke();
	}
	// anillo de plata
	g.fillStyle = '#e8e4dc';
	g.fillRect(19, -5.5, 2.4, 4);
	g.restore();
	glow(g, W[0] + Math.cos(ang) * 20, W[1] + Math.sin(ang) * 20 - 3, 7, '#ffffff', 0.35);
	return W;
};

export const paintAbuela = (g: Ctx, o: AbuelaPose, f?: number) => {
	const {x, y, s = 1, rim = 1, rimColor = P.gold, bob = 0} = o;
	const b = solveBody({m: o.seated ?? 0, lean: o.lean ?? 0, head: o.head ?? 0, walk: o.walk ?? null});
	const m = b.m;
	g.save();
	g.translate(x, y + bob * s);
	g.scale(s, s);
	const res = Math.max(0.5, Math.min(2, s));
	const T: V2 | null = o.arm ? [(o.arm[0] - x) / s, (o.arm[1] - (y + bob * s)) / s] : null;
	const back = m < 0.5;
	// brazo por detrás (de espaldas el brazo va hacia la cuna, lejos del espejo)
	if (T && back) paintArm(g, b.shF, T, rim, rimColor, -1);
	// falda
	paintShape(
		g,
		pathOf(b.skirt),
		bbox(b.skirt, 6),
		{fill: vgrad('#3a2416', '#120904', '#24150c'), light: LIGHT, rim: {color: rimColor, width: 5, alpha: 0.5 * rim}, shadow: {color: '#050201', width: 46, alpha: 0.65}, texture: {seed: 12, alpha: 0.22, scale: 0.6}},
		res,
	);
	// pliegues de la falda (caen del talle al ruedo)
	g.save();
	g.beginPath();
	smoothPath(g, b.skirt, true);
	g.clip();
	for (let k = 0; k < 7; k++) {
		const u = (k + 0.5) / 7;
		const top = [lerp(b.skirt[0][0], b.skirt[7][0], u), lerp(b.skirt[0][1], b.skirt[7][1], u)];
		const bot = [lerp(b.skirt[3][0], b.skirt[4][0], u), lerp(b.skirt[3][1], b.skirt[4][1], u)];
		g.strokeStyle = k % 2 ? 'rgba(0,0,0,0.28)' : rgba(rimColor, 0.06 * rim);
		g.lineWidth = k % 2 ? 7 : 3;
		g.beginPath();
		g.moveTo(top[0], top[1]);
		g.quadraticCurveTo(lerp(top[0], bot[0], 0.5) + (u - 0.5) * 14, lerp(top[1], bot[1], 0.5), bot[0], bot[1]);
		g.stroke();
	}
	g.restore();
	// pies (huaraches): de espaldas asoma el talón del pie que despega; de perfil, las puntas bajo el ruedo
	if (back && o.walk !== null && o.walk !== undefined) {
		const ph = o.walk;
		const lift = Math.sin((ph % 1) * Math.PI);
		const side = Math.floor(ph) % 2 ? 1 : -1;
		g.fillStyle = '#0e0703';
		g.beginPath();
		g.ellipse(side * 20, -4 - lift * 12, 13, 5 + lift * 4, side * 0.2 * lift, 0, Math.PI * 2);
		g.fill();
		g.strokeStyle = rgba(rimColor, 0.35 * rim);
		g.lineWidth = 1.4;
		g.beginPath();
		g.ellipse(side * 20, -4 - lift * 12, 13, 5 + lift * 4, side * 0.2 * lift, Math.PI * 0.6, Math.PI * 1.1);
		g.stroke();
	} else if (m > 0.5) {
		g.fillStyle = '#120904';
		g.beginPath();
		g.ellipse(198, -5, 18, 6, -0.1, 0, Math.PI * 2);
		g.fill();
		g.fillStyle = rgba('#8a5232', 0.8);
		g.beginPath();
		g.ellipse(206, -9, 8, 4, -0.2, 0, Math.PI * 2);
		g.fill();
	}
	// torso (blusa de manta: solo asoma de perfil, al frente del pecho)
	paintShape(g, pathOf(b.torso), bbox(b.torso, 6), {fill: vgrad('#6a5a46', '#1e160e'), light: LIGHT, rim: {color: rimColor, width: 4, alpha: 0.4 * rim}, shadow: {color: '#0a0604', width: 30, alpha: 0.6}}, res);
	// cabeza (y perfil de la cara, casi todo en sombra bajo la capucha)
	g.fillStyle = '#1e1008';
	g.beginPath();
	g.ellipse(b.head[0], b.head[1], b.headR[0], b.headR[1], 0, 0, Math.PI * 2);
	g.fill();
	if (m > 0.4) {
		const k = clamp((m - 0.4) / 0.4);
		const hx = b.head[0];
		const hy = b.head[1];
		const rot = Math.atan2(b.head[1] - b.neck[1], b.head[0] - b.neck[0]) + Math.PI / 2;
		g.save();
		g.translate(hx, hy);
		g.rotate(rot - 0.05);
		g.globalAlpha = k;
		const face: V2[] = [
			[10, -40],
			[30, -26],
			[34, -14],
			[44, 0],
			[37, 6],
			[39, 13],
			[36, 18],
			[38, 24],
			[32, 34],
			[16, 44],
			[-10, 40],
		];
		g.fillStyle = '#2a160a';
		g.beginPath();
		smoothPath(g, face, false, 0.4);
		g.lineTo(-10, 0);
		g.closePath();
		g.fill();
		// luz de luna fría en el filo de la cara (viene de la ventana)
		g.strokeStyle = rgba(P.moonRim, 0.45);
		g.lineWidth = 1.8;
		g.beginPath();
		smoothPath(g, face.slice(1, 9), false, 0.4);
		g.stroke();
		g.restore();
	}
	// rebozo
	const {G, shift} = clothFor(b, f);
	const P2 = (c: number, r: number) => gridPt(G, c, r);
	const outline: V2[] = [];
	for (let c = 0; c < COLS; c++) outline.push(P2(c, 0));
	for (let r = 1; r < ROWS; r++) outline.push(P2(COLS - 1, r));
	for (let c = COLS - 2; c >= 0; c--) outline.push(P2(c, ROWS - 1));
	for (let r = ROWS - 2; r >= 1; r--) outline.push(P2(0, r));
	const rebozoPath = pathOf(outline);
	paintShape(
		g,
		rebozoPath,
		bbox(outline, 6),
		{fill: vgrad('#b8492c', '#4a160c', P.terra), light: LIGHT, rim: {color: rimColor, width: 6, alpha: 0.75 * rim}, shadow: {color: '#1a0603', width: 48, alpha: 0.72}, texture: {seed: 5, alpha: 0.2, scale: 0.5}},
		res,
	);
	g.save();
	g.beginPath();
	rebozoPath(g);
	g.clip();
	// rayas (urdimbre) que siguen la tela
	const rowLine = (v: number) => {
		const rr = v * (ROWS - 1);
		const r0 = Math.min(ROWS - 2, Math.floor(rr));
		const tt = rr - r0;
		const pts: V2[] = [];
		for (let c = 0; c < COLS; c++) {
			const a = P2(c, r0);
			const bb = P2(c, r0 + 1);
			pts.push([lerp(a[0], bb[0], tt), lerp(a[1], bb[1], tt)]);
		}
		const e0 = pts[0];
		const e1 = pts[COLS - 1];
		pts.unshift([e0[0] - (pts[1][0] - e0[0]), e0[1] - (pts[1][1] - e0[1])]);
		pts.push([e1[0] + (e1[0] - pts[COLS - 1][0]), e1[1] + (e1[1] - pts[COLS - 1][1])]);
		g.beginPath();
		smoothPath(g, pts, false);
	};
	const stripes: [number, number, string, number][] = [
		[0.1, 3, P.green, 0.6],
		[0.5, 9, P.green, 0.85],
		[0.555, 2, P.bone, 0.35],
		[0.445, 2, P.bone, 0.35],
		[0.74, 3, P.green, 0.7],
		[0.88, 10, P.green, 0.85],
		[0.935, 2, P.bone, 0.3],
	];
	for (const [v, w, col, a] of stripes) {
		rowLine(v);
		g.strokeStyle = rgba(col, a);
		g.lineWidth = w;
		g.stroke();
	}
	// pliegues verticales: más oscuros donde la tela se junta
	for (let c = 1; c < COLS - 1; c++) {
		const pts: V2[] = [];
		let comp = 0;
		for (let r = 0; r < ROWS; r++) {
			pts.push(P2(c, r));
			const a = P2(c - 1, r);
			const bb = P2(c + 1, r);
			const ra = restCloth(b, c - 1, r);
			const rb = restCloth(b, c + 1, r);
			comp += clamp(1 - Math.hypot(bb[0] - a[0], bb[1] - a[1]) / (Math.hypot(rb[0] - ra[0], rb[1] - ra[1]) || 1), -0.5, 0.6);
		}
		comp /= ROWS;
		g.beginPath();
		smoothPath(g, pts, false);
		g.strokeStyle = `rgba(20,4,2,${clamp(0.16 + comp * 0.8)})`;
		g.lineWidth = 8;
		g.stroke();
		g.translate(-3, 0);
		g.strokeStyle = rgba(rimColor, 0.07 * rim);
		g.lineWidth = 3;
		g.stroke();
		g.translate(3, 0);
	}
	g.restore();
	void shift;
	// barbas (flecos) colgando del borde
	if (f !== undefined) {
		const fr = fringeAt(f);
		const pSim = poseAt(Math.floor(f));
		const bSim = pSim ? solveBody({m: pSim.seated ?? 0, lean: pSim.lean ?? 0, head: pSim.head ?? 0, walk: pSim.walk ?? null}) : b;
		g.lineCap = 'round';
		fr.forEach((ch, i) => {
			const u = 0.03 + (i / (fr.length - 1)) * 0.94;
			// desplaza la barba simulada al borde del cuerpo dibujado
			const x0 = u * (COLS - 1);
			const c0 = Math.min(COLS - 2, Math.floor(x0));
			const tt = x0 - c0;
			const ra = restCloth(b, c0, ROWS - 1);
			const rb = restCloth(b, c0 + 1, ROWS - 1);
			const sa = restCloth(bSim, c0, ROWS - 1);
			const sb = restCloth(bSim, c0 + 1, ROWS - 1);
			const dx = lerp(ra[0] - sa[0], rb[0] - sb[0], tt);
			const dy = lerp(ra[1] - sa[1], rb[1] - sb[1], tt);
			const pts = ch.map(([px, py]) => [px + dx, py + dy] as V2);
			g.strokeStyle = i % 3 === 1 ? '#2a3a2c' : '#6a2014';
			g.lineWidth = 2.6;
			g.beginPath();
			smoothPath(g, pts, false);
			g.stroke();
			g.strokeStyle = rgba(rimColor, (0.25 + 0.2 * hash(i, 7)) * rim);
			g.lineWidth = 1;
			g.stroke();
			g.fillStyle = '#4a140c';
			g.beginPath();
			g.arc(pts[0][0], pts[0][1], 2.4, 0, Math.PI * 2);
			g.fill();
		});
	}
	// brazo cercano (de perfil)
	if (T && !back) paintArm(g, b.shF, T, rim, rimColor, 1);
	g.restore();
};

// ---------- ojo y pómulo en primerísimo plano, estilo grabado (una mujer joven) ----------
// cx, cy = centro del ojo; light: 'candle' (desde abajo) | 'dawn' (contraluz)
export const paintEyeECU = (g: Ctx, o: {cx: number; cy: number; s: number; lid: number; widen?: number; light: 'candle' | 'dawn'; a?: number; look?: number}) => {
	const {cx, cy, s, lid, widen = 0, light, a = 1, look = 0} = o;
	if (a <= 0) return;
	const night = light === 'candle';
	g.save();
	g.globalAlpha = a;
	g.translate(cx, cy);
	g.scale(s, s);
	// --- campo de piel: sien, pómulo, mejilla (el contorno de la cara a la derecha deja ver la ventana)
	const face: V2[] = [
		[-760, -480],
		[-260, -470],
		[80, -450],
		[250, -360],
		[292, -190],
		[318, 20],
		[340, 210],
		[300, 420],
		[200, 700],
		[60, 1000],
		[-100, 1400],
	];
	const fp = (q: Ctx) => {
		q.moveTo(face[0][0], face[0][1]);
		smoothPath(q, face, false, 0.5);
		q.lineTo(-760, 1400);
		q.closePath();
	};
	const skin = g.createRadialGradient(-160, 520, 40, -60, 200, 900);
	if (night) {
		skin.addColorStop(0, '#d49a6c');
		skin.addColorStop(0.3, '#a8693f');
		skin.addColorStop(0.62, '#5e3219');
		skin.addColorStop(1, '#1e0e06');
	} else {
		skin.addColorStop(0, '#6a4630');
		skin.addColorStop(0.6, '#3a2216');
		skin.addColorStop(1, '#140a06');
	}
	g.fillStyle = skin;
	g.beginPath();
	fp(g);
	g.fill();
	g.save();
	g.beginPath();
	fp(g);
	g.clip();
	// cuenca del ojo y sien en sombra
	const sock = g.createRadialGradient(10, -90, 60, 10, -60, 330);
	sock.addColorStop(0, 'rgba(40,18,6,0)');
	sock.addColorStop(0.5, 'rgba(40,18,6,0.35)');
	sock.addColorStop(1, 'rgba(40,18,6,0)');
	g.fillStyle = sock;
	g.fillRect(-400, -460, 800, 600);
	// pómulo encendido por la flama (o contraluz en el filo)
	if (night) glow(g, 90, 300, 320, '#ffc690', 0.14, 0.4);
	// sombra bajo el pómulo
	const chk = g.createRadialGradient(240, 560, 20, 240, 560, 300);
	chk.addColorStop(0, 'rgba(40,16,6,0.45)');
	chk.addColorStop(1, 'rgba(40,16,6,0)');
	g.fillStyle = chk;
	g.fillRect(-60, 260, 600, 600);
	// achurado de grabado siguiendo la forma (solo en las sombras)
	g.lineWidth = 1.6;
	g.strokeStyle = night ? 'rgba(40,16,4,0.32)' : 'rgba(10,4,2,0.4)';
	for (let k = 0; k < 26; k++) {
		const yy = -440 + k * 15;
		g.beginPath();
		g.moveTo(-120 + k * 6, yy);
		g.quadraticCurveTo(140, yy - 60 + k * 2, 300, yy + 30);
		g.stroke();
	}
	for (let k = 0; k < 18; k++) {
		const xx = 150 + k * 9;
		g.beginPath();
		g.moveTo(xx, -260);
		g.quadraticCurveTo(xx + 40, 120, xx - 30, 560);
		g.stroke();
	}
	// lado de la nariz (borde izquierdo)
	const nose = g.createLinearGradient(-560, 0, -300, 0);
	nose.addColorStop(0, night ? 'rgba(255,200,150,0.25)' : 'rgba(60,40,30,0.2)');
	nose.addColorStop(0.35, 'rgba(30,12,4,0.5)');
	nose.addColorStop(1, 'rgba(30,12,4,0)');
	g.fillStyle = nose;
	g.fillRect(-900, -500, 620, 1950);
	// sien que gira lejos de la luz
	const tmp = g.createLinearGradient(120, 0, 340, 0);
	tmp.addColorStop(0, 'rgba(30,12,4,0)');
	tmp.addColorStop(1, 'rgba(30,12,4,0.55)');
	g.fillStyle = tmp;
	g.fillRect(120, -500, 260, 1950);
	// poro y grano de la piel
	drawTiled(g, tinted(noiseTile({seed: 18, period: 8, oct: 4, contrast: 1.6}), '#2a1206', 'd06skin'), {x: -900, y: -500, w: 1300, h: 1950, scale: 0.7, alpha: 0.22, op: 'multiply'});
	g.restore();
	// filo de la cara (contraluz al amanecer, rim tibio de noche)
	g.strokeStyle = night ? 'rgba(245,170,100,0.35)' : 'rgba(255,214,150,0.9)';
	g.lineWidth = night ? 3 : 7;
	g.beginPath();
	smoothPath(g, face.slice(2, 10), false, 0.5);
	g.stroke();
	// --- ceja: muchos trazos cortos de pelo
	g.lineCap = 'round';
	for (let k = 0; k < 70; k++) {
		const u = k / 70;
		const bx = lerp(-230, 230, u);
		const by = -205 - Math.sin(u * Math.PI * 0.95 + 0.1) * 48 + u * 26;
		const len = 26 + 14 * Math.sin(u * Math.PI);
		const ang = -0.35 + u * 0.6 + (hash(k, 3) - 0.5) * 0.3;
		g.strokeStyle = `rgba(18,8,3,${0.55 + 0.4 * hash(k, 4)})`;
		g.lineWidth = 2.6 + hash(k, 5) * 1.6;
		g.beginPath();
		g.moveTo(bx, by + 10);
		g.quadraticCurveTo(bx + Math.cos(ang) * len * 0.5, by + 10 - len * 0.35, bx + Math.cos(ang) * len, by + 6 - Math.sin(ang) * len * 0.3);
		g.stroke();
	}
	// --- ojo
	const open = clamp(lid) * (1 + 0.3 * widen);
	const W2 = 190;
	const upY = (t: number) => -Math.pow(Math.sin(t * Math.PI), 0.85) * 96 * open + (1 - open) * 12 * Math.sin(t * Math.PI); // párpado superior
	const loY = (t: number) => Math.pow(Math.sin(t * Math.PI), 1.2) * 56; // párpado inferior
	const ex = (t: number) => lerp(-W2, W2, t);
	const tilt = (t: number) => (t - 0.5) * -18; // rabillo externo un poco más alto
	const eyePath = (q: Ctx) => {
		q.moveTo(ex(0), tilt(0));
		for (let i = 1; i <= 24; i++) {
			const t = i / 24;
			q.lineTo(ex(t), upY(t) + tilt(t));
		}
		for (let i = 23; i >= 0; i--) {
			const t = i / 24;
			q.lineTo(ex(t), loY(t) + tilt(t));
		}
		q.closePath();
	};
	// pliegue del párpado y piel del párpado
	g.fillStyle = night ? 'rgba(70,34,14,0.55)' : 'rgba(30,16,8,0.6)';
	g.beginPath();
	g.moveTo(ex(0) - 14, tilt(0) - 4);
	for (let i = 1; i <= 24; i++) {
		const t = i / 24;
		g.lineTo(ex(t) + (t - 0.5) * 24, -Math.sin(t * Math.PI) * (150 + 30 * widen) + tilt(t) - 6);
	}
	for (let i = 24; i >= 0; i--) {
		const t = i / 24;
		g.lineTo(ex(t), upY(t) + tilt(t) - 4);
	}
	g.closePath();
	g.fill();
	g.strokeStyle = 'rgba(25,10,4,0.75)';
	g.lineWidth = 4;
	g.beginPath();
	for (let i = 0; i <= 24; i++) {
		const t = i / 24;
		const xx = ex(t) + (t - 0.5) * 24;
		const yy = -Math.sin(t * Math.PI) * (150 + 30 * widen) + tilt(t) - 6;
		if (i) g.lineTo(xx, yy);
		else g.moveTo(xx, yy);
	}
	g.stroke();
	if (open > 0.03) {
		g.save();
		g.beginPath();
		eyePath(g);
		g.clip();
		// esclerótica (sombreada arriba por el párpado)
		const sc = g.createLinearGradient(0, -110, 0, 60);
		sc.addColorStop(0, '#6a5a4c');
		sc.addColorStop(0.45, night ? '#bfae96' : '#a89a8a');
		sc.addColorStop(1, night ? '#d2c2a8' : '#8a7c6c');
		g.fillStyle = sc;
		g.fillRect(-W2, -130, W2 * 2, 200);
		// carúncula (lagrimal) rosada
		g.fillStyle = 'rgba(190,110,90,0.7)';
		g.beginPath();
		g.ellipse(ex(0.03), 4, 22, 16, 0, 0, Math.PI * 2);
		g.fill();
		// iris con fibras radiales
		const ix = 14 + look * 40;
		const iy = -8;
		const IR = 70;
		const ir = g.createRadialGradient(ix, iy, 10, ix, iy, IR);
		ir.addColorStop(0, '#1a0c05');
		ir.addColorStop(0.35, '#5a3218');
		ir.addColorStop(0.75, '#3a1e0c');
		ir.addColorStop(1, '#120804');
		g.fillStyle = ir;
		g.beginPath();
		g.arc(ix, iy, IR, 0, Math.PI * 2);
		g.fill();
		g.lineWidth = 1.4;
		for (let k = 0; k < 64; k++) {
			const an = (k / 64) * Math.PI * 2;
			const r0 = 30 + hash(k, 8) * 6;
			const r1 = IR - 6 - hash(k, 9) * 14;
			g.strokeStyle = k % 2 ? 'rgba(140,90,45,0.4)' : 'rgba(10,4,2,0.35)';
			g.beginPath();
			g.moveTo(ix + Math.cos(an) * r0, iy + Math.sin(an) * r0);
			g.lineTo(ix + Math.cos(an + 0.05) * r1, iy + Math.sin(an + 0.05) * r1);
			g.stroke();
		}
		// pupila
		g.fillStyle = '#050201';
		g.beginPath();
		g.arc(ix, iy, 27 - 4 * widen, 0, Math.PI * 2);
		g.fill();
		// sombra del párpado superior sobre el globo
		const ls = g.createLinearGradient(0, -120, 0, -20);
		ls.addColorStop(0, 'rgba(20,8,3,0.8)');
		ls.addColorStop(1, 'rgba(20,8,3,0)');
		g.fillStyle = ls;
		g.fillRect(-W2, -130, W2 * 2, 120);
		// dos brillos: la ventana (arriba) y la flama (abajo)
		g.fillStyle = 'rgba(210,235,240,0.9)';
		g.beginPath();
		g.ellipse(ix - 26, iy - 30, 12, 9, -0.4, 0, Math.PI * 2);
		g.fill();
		g.fillStyle = night ? 'rgba(255,214,150,0.95)' : 'rgba(255,230,190,0.8)';
		g.beginPath();
		g.arc(ix + 24, iy + 30, 5.5, 0, Math.PI * 2);
		g.fill();
		g.restore();
	}
	// línea del párpado superior + pestañas
	g.strokeStyle = '#120603';
	g.lineWidth = 7;
	g.beginPath();
	for (let i = 0; i <= 24; i++) {
		const t = i / 24;
		const yy = upY(t) + tilt(t);
		if (i) g.lineTo(ex(t), yy);
		else g.moveTo(ex(t), yy);
	}
	g.stroke();
	for (let k = 0; k < 34; k++) {
		const t = 0.08 + (k / 33) * 0.9;
		const px = ex(t);
		const py = upY(t) + tilt(t);
		const len = (22 + 16 * Math.sin(t * Math.PI)) * (0.6 + 0.4 * open);
		const ang = -Math.PI / 2 + (t - 0.4) * 1.5;
		g.strokeStyle = 'rgba(14,6,2,0.9)';
		g.lineWidth = 2.4;
		g.beginPath();
		g.moveTo(px, py);
		g.quadraticCurveTo(px + Math.cos(ang) * len * 0.6, py + Math.sin(ang) * len * 0.5 - 4, px + Math.cos(ang) * len, py + Math.sin(ang) * len + 3);
		g.stroke();
	}
	// párpado inferior: borde húmedo y pocas pestañas
	g.strokeStyle = night ? 'rgba(255,214,170,0.45)' : 'rgba(255,220,180,0.25)';
	g.lineWidth = 2.5;
	g.beginPath();
	for (let i = 2; i <= 22; i++) {
		const t = i / 24;
		const yy = loY(t) + tilt(t) + 2;
		if (i > 2) g.lineTo(ex(t), yy);
		else g.moveTo(ex(t), yy);
	}
	g.stroke();
	for (let k = 0; k < 14; k++) {
		const t = 0.3 + (k / 13) * 0.62;
		const px = ex(t);
		const py = loY(t) + tilt(t) + 4;
		g.strokeStyle = 'rgba(20,8,3,0.6)';
		g.lineWidth = 1.5;
		g.beginPath();
		g.moveTo(px, py);
		g.lineTo(px + (t - 0.5) * 14, py + 12);
		g.stroke();
	}
	// sombra suave bajo el ojo
	g.fillStyle = 'rgba(50,20,8,0.25)';
	g.beginPath();
	g.ellipse(20, 100, 190, 34, -0.05, 0, Math.PI * 2);
	g.fill();
	// mechones que escapan del rebozo por la sien
	g.strokeStyle = 'rgba(14,6,2,0.85)';
	g.lineWidth = 3;
	for (let k = 0; k < 9; k++) {
		g.beginPath();
		g.moveTo(140 + k * 14, -470);
		g.bezierCurveTo(200 + k * 10, -360, 250 + k * 6, -250, 230 + k * 9 + Math.sin(k) * 20, -120 + k * 6);
		g.stroke();
	}
	// --- borde del rebozo sobre la frente (tela cercana, terracota con raya verde)
	const hood = (q: Ctx) => {
		q.moveTo(-760, -900);
		q.lineTo(560, -900);
		q.bezierCurveTo(460, -640, 330, -470, 120, -440);
		q.bezierCurveTo(-100, -410, -400, -470, -760, -430);
		q.closePath();
	};
	paintShape(g, hood, [-760, -900, 1320, 500], {fill: vgrad('#3a120a', night ? '#9a3a22' : '#4a1a10'), light: night ? Math.PI / 2 : -Math.PI / 4, rim: {color: night ? '#F5B04A' : '#FFE0A8', width: 10, alpha: 0.6}, shadow: {color: '#140402', width: 70, alpha: 0.7}, texture: {seed: 5, alpha: 0.25, scale: 1.2}}, s);
	g.save();
	g.beginPath();
	hood(g);
	g.clip();
	g.strokeStyle = rgba(P.green, 0.85);
	g.lineWidth = 22;
	g.beginPath();
	g.moveTo(-760, -480);
	g.bezierCurveTo(-400, -520, -100, -460, 130, -490);
	g.bezierCurveTo(330, -520, 450, -690, 540, -900);
	g.stroke();
	g.strokeStyle = rgba(P.bone, 0.35);
	g.lineWidth = 4;
	g.stroke();
	g.restore();
	g.restore();
	if (night) glow(g, cx - 160 * s, cy + 520 * s, 520 * s, '#F5A04A', 0.2 * a);
};

// dedos de la madre agarrando los bordes del vidrio (por ENCIMA de la capa del vidrio, desenfocados)
export const paintFingers = (g: Ctx, o: {k: number; t: number; rim?: number}) => {
	const {k, t, rim = 1} = o;
	if (k <= 0) return;
	g.save();
	g.filter = 'blur(10px)';
	for (const side of [-1, 1]) {
		for (let i = 0; i < 4; i++) {
			const y = 760 + i * 110 + Math.sin(t * 9 + i) * 2;
			const len = (150 - Math.abs(i - 1.5) * 18) * E.out(k);
			const x0 = side < 0 ? -30 : 1110;
			const x1 = x0 + side * -1 * len;
			g.strokeStyle = '#120804';
			g.lineCap = 'round';
			g.lineWidth = 62;
			g.beginPath();
			g.moveTo(x0, y);
			g.lineTo(x1, y + 8);
			g.stroke();
			g.strokeStyle = rgba(P.cempa, 0.5 * rim);
			g.lineWidth = 6;
			g.beginPath();
			g.moveTo(x0, y - 28);
			g.lineTo(x1, y - 22);
			g.stroke();
		}
	}
	g.restore();
	void mixRGB;
};
