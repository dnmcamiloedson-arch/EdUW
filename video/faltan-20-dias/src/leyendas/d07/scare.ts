// Día 7 · B09 · la cabeza del coyote que irrumpe en el hueco de la cortina (936–956). Pintada en 2D: masa de pelo en
// ¾ frontal, orejas pegadas, hocico arrugado, labios recogidos (dientes hueso, encías casi negras, nunca rojo),
// eyeshine oro con raya anamórfica. A contraluz del foco: rim naranja duro arriba a la izquierda, panza teal.
import {C, E, clamp, hash, lerp} from '../../lib/util';
import {makeCanvas, cached, type Ctx} from '../kit/paint';
import {CX, camAt, seg, type V2} from './world';

const HW = 1400; // lienzo local de la cabeza (px a escala 1)
const HO: V2 = [700, 640]; // origen local (entre los ojos) dentro del lienzo
type Pose = {x: number; y: number; s: number; jaw: number; rot: number};

// entrada 935–939 (expo out) con 6 % de sobretiro; cabezazo contra el labio y chasquido a 945; gruñido después
export const scarePose = (f: number): Pose => {
	const u = seg(f, 935, 939);
	const e = 1 - Math.pow(2, -9 * u);
	const over = 0.06 * Math.sin(seg(f, 938, 947) * Math.PI) * Math.exp(-seg(f, 938, 947) * 1.5);
	let x = lerp(1060, 585, e);
	let y = lerp(1900, 1180, e) - 520 * over;
	const s = lerp(0.82, 1.0, e) * (1 + over);
	if (f >= 944) y -= 22 * Math.exp(-(f - 944) / 2.2) * clamp((f - 943) / 1.5);
	if (f >= 947) {
		x += (hash(Math.floor(f), 11) - 0.5) * 5;
		y += (hash(Math.floor(f), 12) - 0.5) * 4 + Math.sin((f - 947) * 0.5) * 6;
	}
	let jaw = 0.7;
	if (f >= 942 && f < 945) jaw = lerp(0.7, 1.0, seg(f, 942, 944.5));
	else if (f >= 945) jaw = f < 947 ? lerp(1.0, 0.04, seg(f, 945, 946)) : lerp(0.04, 0.42, E.out(seg(f, 948, 956)));
	const rot = lerp(0.22, -0.04, e) + 0.02 * Math.sin(seg(f, 939, 950) * Math.PI * 2);
	return {x, y, s, jaw, rot};
};

// contorno base de la masa (local, y abajo)
const MASS: V2[] = [
	[0, -282], [150, -270], [292, -200], [352, -80], [376, 40], [356, 150], [302, 252], [232, 332], [140, 382], [0, 402],
	[-150, 382], [-242, 332], [-314, 252], [-368, 150], [-390, 40], [-366, -80], [-302, -200], [-156, -270],
];
const smoothPath = (g: Ctx, pts: V2[], closed = true) => {
	const n = pts.length;
	const mid = (a: V2, b: V2): V2 => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
	const m0 = mid(pts[n - 1], pts[0]);
	g.beginPath();
	if (closed) g.moveTo(m0[0], m0[1]);
	else g.moveTo(pts[0][0], pts[0][1]);
	for (let i = 0; i < n - (closed ? 0 : 1); i++) {
		const a = pts[i];
		const b = pts[(i + 1) % n];
		const m = mid(a, b);
		g.quadraticCurveTo(a[0], a[1], m[0], m[1]);
	}
	if (closed) g.closePath();
};
const poly = (g: Ctx, pts: V2[]) => {
	g.beginPath();
	g.moveTo(pts[0][0], pts[0][1]);
	for (let i = 1; i < pts.length; i++) g.lineTo(pts[i][0], pts[i][1]);
	g.closePath();
};
// contorno suavizado (mismas cuadráticas que el relleno) muestreado denso; punto y normal hacia afuera
const DENSE: V2[] = (() => {
	const n = MASS.length;
	const out: V2[] = [];
	for (let i = 0; i < n; i++) {
		const a = MASS[(i + n - 1) % n];
		const c = MASS[i];
		const b = MASS[(i + 1) % n];
		const m0: V2 = [(a[0] + c[0]) / 2, (a[1] + c[1]) / 2];
		const m1: V2 = [(c[0] + b[0]) / 2, (c[1] + b[1]) / 2];
		for (let k = 0; k < 10; k++) {
			const u = k / 10;
			out.push([(1 - u) * (1 - u) * m0[0] + 2 * u * (1 - u) * c[0] + u * u * m1[0], (1 - u) * (1 - u) * m0[1] + 2 * u * (1 - u) * c[1] + u * u * m1[1]]);
		}
	}
	return out;
})();
const contourAt = (s: number): {p: V2; n: V2} => {
	const n = DENSE.length;
	const k = (((s % 1) + 1) % 1) * n;
	const i = Math.floor(k);
	const u = k - i;
	const a = DENSE[i % n];
	const b = DENSE[(i + 1) % n];
	const p: V2 = [lerp(a[0], b[0], u), lerp(a[1], b[1], u)];
	const pa = DENSE[(i + n - 2) % n];
	const pb = DENSE[(i + 3) % n];
	const tx = pb[0] - pa[0];
	const ty = pb[1] - pa[1];
	const d = Math.hypot(tx, ty) || 1;
	return {p, n: [ty / d, -tx / d]};
};
// cuánto le pega el rim (arriba-izquierda): dirección hacia el foco
const LDIR: V2 = [-0.62, -0.78];
const rimK = (n: V2) => clamp((n[0] * LDIR[0] + n[1] * LDIR[1] - 0.15) / 0.85);

// pinta la cabeza en su lienzo local (por frame: pelo que latiguea + quijada)
const paintHead = (q: Ctx, f: number, jaw: number) => {
	q.setTransform(1, 0, 0, 1, 0, 0);
	q.clearRect(0, 0, HW, HW);
	q.translate(HO[0], HO[1]);
	const whip = Math.exp(-seg(f, 936, 950) * 2.2);
	const t = f / 30;

	// orejas pegadas hacia atrás (detrás de la masa)
	const ear = (sgn: number) => {
		const base0: V2 = [sgn * 120, -262];
		const base1: V2 = [sgn * 330, -150];
		const tip: V2 = [sgn * (470 + 10 * Math.sin(t * 9) * whip), -440 + 6 * Math.sin(t * 11)];
		q.fillStyle = '#140c07';
		q.beginPath();
		q.moveTo(base0[0], base0[1]);
		q.quadraticCurveTo(sgn * 250, -400, tip[0], tip[1]);
		q.quadraticCurveTo(sgn * 420, -260, base1[0], base1[1]);
		q.closePath();
		q.fill();
		// interior
		q.fillStyle = '#26130b';
		q.beginPath();
		q.moveTo(sgn * 170, -252);
		q.quadraticCurveTo(sgn * 280, -370, tip[0] - sgn * 30, tip[1] + 40);
		q.quadraticCurveTo(sgn * 380, -250, sgn * 300, -170);
		q.closePath();
		q.fill();
		// rim de la oreja izquierda (lado del foco)
		if (sgn < 0) {
			q.strokeStyle = 'rgba(242,109,61,0.95)';
			q.lineWidth = 7;
			q.beginPath();
			q.moveTo(base0[0], base0[1]);
			q.quadraticCurveTo(sgn * 250, -400, tip[0], tip[1]);
			q.stroke();
			q.strokeStyle = 'rgba(255,214,140,0.8)';
			q.lineWidth = 2.5;
			q.stroke();
		}
	};
	ear(-1);
	ear(1);

	// masa: degradado oscuro, cálido arriba-izq, teal abajo
	smoothPath(q, MASS);
	const gr = q.createLinearGradient(-300, -320, 260, 430);
	gr.addColorStop(0, '#3b2112');
	gr.addColorStop(0.35, '#1d120a');
	gr.addColorStop(0.75, '#120d0a');
	gr.addColorStop(1, '#0d2622');
	q.fillStyle = gr;
	q.fill();
	q.save();
	smoothPath(q, MASS);
	q.clip();
	// panza teal (luz fría que rebota del empedrado)
	const tg = q.createRadialGradient(40, 470, 40, 40, 470, 420);
	tg.addColorStop(0, 'rgba(31,92,72,0.55)');
	tg.addColorStop(1, 'rgba(31,92,72,0)');
	q.fillStyle = tg;
	q.fillRect(-450, 50, 900, 450);
	// pelo interior: trazos que fluyen del hocico hacia afuera
	q.lineCap = 'round';
	for (let i = 0; i < 260; i++) {
		const a = hash(i, 3) * Math.PI * 2;
		const r = 120 + hash(i, 4) * 300;
		const px = Math.cos(a) * r * 1.0;
		const py = Math.sin(a) * r * 0.92 + 20;
		const dir = Math.atan2(py - 120, px) + (hash(i, 5) - 0.5) * 0.5;
		const len = 18 + hash(i, 6) * 34;
		const lit = rimK([Math.cos(a), Math.sin(a)]) * clamp((r - 230) / 140);
		const c = hash(i, 7);
		q.strokeStyle = lit > 0.15 ? `rgba(196,98,48,${0.25 + 0.5 * lit})` : c < 0.5 ? 'rgba(8,5,3,0.55)' : 'rgba(70,48,32,0.35)';
		q.lineWidth = 2 + hash(i, 8) * 2.5;
		q.beginPath();
		q.moveTo(px, py);
		q.quadraticCurveTo(px + Math.cos(dir) * len * 0.6 + 4, py + Math.sin(dir) * len * 0.6, px + Math.cos(dir) * len, py + Math.sin(dir) * len);
		q.stroke();
	}
	q.restore();

	// pelo de contorno que latiguea: mechones afilados en grupos, peinados hacia atrás
	for (let i = 0; i < 190; i++) {
		const grp = Math.floor(i / 3);
		const s = (grp + hash(grp, 21) * 0.5 + (i % 3) * 0.12) / 63.3;
		const {p, n} = contourAt(s);
		const lit = rimK(n);
		const len = (16 + hash(i, 22) * 26) * (p[1] > -120 && p[1] < 280 ? 1.55 : 0.75);
		const back = p[0] < 0 ? -0.5 : 0.5;
		const sw = Math.sin(t * 14 + grp * 1.7) * 0.4 * whip + (hash(grp, 23) - 0.5) * 0.35 + (hash(i, 25) - 0.5) * 0.2;
		const ang = Math.atan2(n[1], n[0]) - back * (p[1] > -150 ? 1 : 0.3) + sw;
		const ca = Math.cos(ang);
		const sa = Math.sin(ang);
		const bw = 5 + hash(i, 24) * 4;
		const rx = p[0] - n[0] * 12;
		const ry = p[1] - n[1] * 12;
		const tx = p[0] + ca * len;
		const ty = p[1] + sa * len;
		q.fillStyle = lit > 0.05 ? `rgba(242,${Math.round(109 + 70 * lit)},61,${0.2 + 0.55 * lit})` : 'rgba(16,11,8,0.95)';
		q.beginPath();
		q.moveTo(rx - sa * bw, ry + ca * bw);
		q.quadraticCurveTo(p[0] + ca * len * 0.5 - sa * bw * 0.6 + 3, p[1] + sa * len * 0.5 + ca * bw * 0.6, tx, ty);
		q.quadraticCurveTo(p[0] + ca * len * 0.45 + sa * bw * 0.4, p[1] + sa * len * 0.45 - ca * bw * 0.4, rx + sa * bw, ry - ca * bw);
		q.closePath();
		q.fill();
	}
	// modelado: planos de frente y mejilla del lado del foco
	q.save();
	smoothPath(q, MASS);
	q.clip();
	const mg = q.createRadialGradient(-170, -150, 20, -170, -150, 300);
	mg.addColorStop(0, 'rgba(120,64,32,0.32)');
	mg.addColorStop(1, 'rgba(120,64,32,0)');
	q.fillStyle = mg;
	q.fillRect(-470, -460, 600, 600);
	const cg = q.createRadialGradient(250, 120, 30, 250, 120, 240);
	cg.addColorStop(0, 'rgba(0,0,0,0.35)');
	cg.addColorStop(1, 'rgba(0,0,0,0)');
	q.fillStyle = cg;
	q.fillRect(0, -140, 520, 520);
	q.restore();
	// rim duro sobre la masa (arriba-izquierda)
	q.save();
	q.lineJoin = 'round';
	for (let i = 0; i < 180; i++) {
		const s0 = i / 180;
		const s1 = (i + 1) / 180;
		const a = contourAt(s0);
		const b = contourAt(s1);
		const k = rimK(a.n);
		if (k <= 0.02) continue;
		q.strokeStyle = `rgba(242,109,61,${0.9 * k})`;
		q.lineWidth = 12 * k + 2;
		q.beginPath();
		q.moveTo(a.p[0], a.p[1]);
		q.lineTo(b.p[0], b.p[1]);
		q.stroke();
		q.strokeStyle = `rgba(255,226,160,${0.85 * k})`;
		q.lineWidth = 3;
		q.stroke();
	}
	q.restore();

	// ceño: surcos en V sobre los ojos
	q.lineCap = 'round';
	for (let i = 0; i < 4; i++) {
		const o = i * 16;
		q.strokeStyle = i % 2 ? 'rgba(74,40,22,0.6)' : 'rgba(6,4,3,0.8)';
		q.lineWidth = 6 - i;
		q.beginPath();
		q.moveTo(-260 + o * 0.4, -150 - o);
		q.quadraticCurveTo(-110, -100 - o * 0.6, -18, -40 - o * 0.4);
		q.moveTo(240 - o * 0.4, -158 - o);
		q.quadraticCurveTo(100, -106 - o * 0.6, 14, -42 - o * 0.4);
		q.stroke();
	}

	// hocico: puente que baja hacia nosotros (un poco a la izquierda)
	const snout: V2[] = [
		[-74, -34], [62, -38], [112, 60], [130, 160], [98, 234], [-12, 262], [-142, 252], [-190, 182], [-152, 70],
	];
	smoothPath(q, snout);
	const sg = q.createLinearGradient(-120, 0, 90, 220);
	sg.addColorStop(0, '#4a2a17');
	sg.addColorStop(0.5, '#24160d');
	sg.addColorStop(1, '#120c08');
	q.fillStyle = sg;
	q.fill();
	// arrugas: pliegues cortos en el stop y surcos del gruñido a los lados de la nariz (se aprietan con la quijada)
	const wr = 0.6 + 0.4 * jaw;
	const crease = (x0: number, y0: number, cx: number, cy: number, x1: number, y1: number, w: number) => {
		q.strokeStyle = 'rgba(6,4,3,0.85)';
		q.lineWidth = w;
		q.beginPath();
		q.moveTo(x0, y0);
		q.quadraticCurveTo(cx, cy, x1, y1);
		q.stroke();
		q.strokeStyle = 'rgba(214,120,62,0.22)';
		q.lineWidth = 2;
		q.beginPath();
		q.moveTo(x0 - 2, y0 - 5);
		q.quadraticCurveTo(cx - 2, cy - 5, x1 - 2, y1 - 5);
		q.stroke();
	};
	for (let i = 0; i < 3; i++) crease(-70 + i * 6, 18 + i * 20 * wr, -20, 4 + i * 18 * wr, 46 - i * 5, 14 + i * 20 * wr, 4);
	for (let i = 0; i < 3; i++) {
		crease(-150 - i * 14, 200 - i * 10, -190 - i * 12, 140 - i * 16, -200 - i * 6, 70 + i * 4 - 20 * wr, 4 - i);
		crease(100 + i * 12, 192 - i * 10, 138 + i * 10, 136 - i * 16, 150 + i * 4, 66 + i * 4 - 20 * wr, 4 - i);
	}
	// rim del puente del hocico
	q.strokeStyle = 'rgba(242,109,61,0.7)';
	q.lineWidth = 5;
	q.beginPath();
	q.moveTo(-74, -34);
	q.quadraticCurveTo(-170, 80, -176, 176);
	q.stroke();

	// boca: labios recogidos, encías casi negras, dientes hueso; la quijada baja con `jaw`
	q.save();
	q.translate(0, 34);
	const J = jaw * 120;
	const cl: V2 = [-250, 236];
	const cr: V2 = [200, 226];
	// interior
	q.fillStyle = '#080404';
	q.beginPath();
	q.moveTo(cl[0], cl[1]);
	q.quadraticCurveTo(-60, 220, cr[0], cr[1]);
	q.quadraticCurveTo(120, 300 + J, -30, 320 + J * 1.05);
	q.quadraticCurveTo(-190, 300 + J, cl[0], cl[1]);
	q.fill();
	// encía superior
	q.fillStyle = '#1d0f0d';
	q.beginPath();
	q.moveTo(cl[0], cl[1]);
	q.quadraticCurveTo(-170, 214, -110, 218);
	q.quadraticCurveTo(-40, 214, 30, 216);
	q.quadraticCurveTo(140, 206, cr[0], cr[1]);
	q.quadraticCurveTo(120, 262, -40, 264);
	q.quadraticCurveTo(-180, 266, cl[0], cl[1]);
	q.fill();
	// dientes superiores
	const tooth = (x: number, y: number, w: number, h: number, dir: number, lean = 0) => {
		const tg2 = q.createLinearGradient(x, y, x, y + h * dir);
		tg2.addColorStop(0, '#9c8f78');
		tg2.addColorStop(0.5, C.marfil);
		tg2.addColorStop(1, '#efe6d2');
		q.fillStyle = tg2;
		q.beginPath();
		q.moveTo(x - w / 2, y);
		q.quadraticCurveTo(x - w * 0.35 + lean * 0.5, y + h * 0.6 * dir, x + lean, y + h * dir);
		q.quadraticCurveTo(x + w * 0.3 + lean * 0.5, y + h * 0.55 * dir, x + w / 2, y);
		q.closePath();
		q.fill();
	};
	for (let i = 0; i < 6; i++) tooth(-112 + i * 30 + (hash(i, 31) - 0.5) * 6, 258, 20 + hash(i, 32) * 8, 20 + hash(i, 33) * 14, 1);
	tooth(-162, 254, 40, 112, 1, 10); // colmillo izq
	tooth(130, 248, 36, 100, 1, -10); // colmillo der
	tooth(-212, 246, 26, 34, 1);
	tooth(172, 240, 24, 30, 1);
	// labio inferior + dientes inferiores (suben con la quijada)
	const ly = 300 + J;
	for (let i = 0; i < 5; i++) tooth(-90 + i * 30, ly + 6, 18 + hash(i, 34) * 6, 16 + hash(i, 35) * 12, -1);
	tooth(-140, ly + 2, 34, 74, -1, 6);
	tooth(104, ly - 4, 30, 66, -1, -6);
	q.fillStyle = '#140b07';
	q.beginPath();
	q.moveTo(cl[0] + 20, cl[1] + 30);
	q.quadraticCurveTo(-190, ly + 4, -30, ly + 18);
	q.quadraticCurveTo(120, ly + 4, cr[0] - 16, cr[1] + 28);
	q.quadraticCurveTo(120, ly + 60, -30, ly + 70);
	q.quadraticCurveTo(-190, ly + 60, cl[0] + 20, cl[1] + 30);
	q.fill();
	// barbilla/papada con rim teal frío
	q.strokeStyle = 'rgba(80,150,130,0.35)';
	q.lineWidth = 4;
	q.beginPath();
	q.moveTo(-150, ly + 58);
	q.quadraticCurveTo(-30, ly + 92, 110, ly + 56);
	q.stroke();

	q.restore();
	// nariz: cuero negro con brillo
	q.fillStyle = '#050303';
	q.beginPath();
	q.ellipse(-38, 228, 68, 40, -0.08, 0, Math.PI * 2);
	q.fill();
	q.fillStyle = '#000';
	q.beginPath();
	q.ellipse(-68, 238, 15, 10, 0.3, 0, Math.PI * 2);
	q.ellipse(-6, 236, 15, 10, -0.3, 0, Math.PI * 2);
	q.fill();
	q.fillStyle = 'rgba(255,214,150,0.55)';
	q.beginPath();
	q.ellipse(-60, 206, 22, 8, -0.2, 0, Math.PI * 2);
	q.fill();

	// ojos: almendra rasgada, eyeshine oro
	const eye = (x: number, y: number, w: number, h: number, tilt: number) => {
		q.save();
		q.translate(x, y);
		q.rotate(tilt);
		q.fillStyle = '#050302';
		q.beginPath();
		q.ellipse(0, 0, w * 0.62, h * 0.75, 0, 0, Math.PI * 2);
		q.fill();
		q.beginPath();
		q.moveTo(-w / 2, 4);
		q.quadraticCurveTo(0, -h * 0.9, w / 2, -6);
		q.quadraticCurveTo(0, h * 0.75, -w / 2, 4);
		q.closePath();
		const eg = q.createRadialGradient(4, -2, 2, 0, 0, w * 0.55);
		eg.addColorStop(0, C.core);
		eg.addColorStop(0.35, C.flama);
		eg.addColorStop(0.8, '#d9822f');
		eg.addColorStop(1, '#6b2a10');
		q.fillStyle = eg;
		q.fill();
		q.fillStyle = 'rgba(30,14,4,0.5)';
		q.beginPath();
		q.ellipse(2, 0, 6, h * 0.36, 0, 0, Math.PI * 2);
		q.fill();
		q.restore();
	};
	eye(-158, -58, 118, 48, 0.32);
	eye(128, -66, 106, 44, -0.3);
};

const LOCAL_EYES: V2[] = [
	[-158, -58],
	[128, -66],
];
const toScreenLocal = (p: Pose, l: V2): V2 => {
	const c = Math.cos(p.rot);
	const s = Math.sin(p.rot);
	return [p.x + (l[0] * c - l[1] * s) * p.s, p.y + (l[0] * s + l[1] * c) * p.s];
};

// dibuja en coordenadas del mundo (después del mapa de luz); desenfoque de movimiento en la embestida (6 muestras)
export const drawScare = (g: Ctx, f: number) => {
	const cv = cached('d07:scareCanvas', () => makeCanvas(HW, HW));
	const q = cv.getContext('2d')!;
	const p = scarePose(f);
	paintHead(q, f, p.jaw);
	const samples = f >= 935 && f <= 939 ? 6 : 1;
	const pp = scarePose(f - 0.8);
	for (let k = 0; k < samples; k++) {
		const u = samples === 1 ? 0 : k / (samples - 1);
		const x = lerp(pp.x, p.x, u);
		const y = lerp(pp.y, p.y, u);
		const s = lerp(pp.s, p.s, u);
		const r = lerp(pp.rot, p.rot, u);
		g.save();
		g.globalAlpha = samples === 1 ? 1 : 0.22 + 0.78 * u * u;
		g.translate(x, y);
		g.rotate(r);
		g.scale(s, s);
		g.drawImage(cv, -HO[0], -HO[1]);
		g.restore();
	}
	// halo del eyeshine + raya anamórfica (aditivo)
	const on = clamp(seg(f, 935.5, 938));
	g.save();
	g.globalCompositeOperation = 'lighter';
	for (const l of LOCAL_EYES) {
		const [x, y] = toScreenLocal(p, l);
		const hg = g.createRadialGradient(x, y, 0, x, y, 190 * p.s);
		hg.addColorStop(0, `rgba(255,236,170,${0.55 * on})`);
		hg.addColorStop(0.25, `rgba(245,194,66,${0.28 * on})`);
		hg.addColorStop(1, 'rgba(242,109,61,0)');
		g.fillStyle = hg;
		g.fillRect(x - 200 * p.s, y - 200 * p.s, 400 * p.s, 400 * p.s);
		g.save();
		g.translate(x, y);
		g.scale(1, 0.022);
		const ag = g.createRadialGradient(0, 0, 0, 0, 0, 420 * p.s);
		ag.addColorStop(0, `rgba(255,232,170,${0.75 * on})`);
		ag.addColorStop(1, 'rgba(245,194,66,0)');
		g.fillStyle = ag;
		g.fillRect(-430 * p.s, -430 * p.s, 860 * p.s, 860 * p.s);
		g.restore();
	}
	g.restore();
};

// posición en PANTALLA de los ojos (para la posimagen del negro): aplica la cámara del mundo
export const scareEyesScreen = (f: number): V2[] => {
	const p = scarePose(f);
	const c = camAt(f);
	return LOCAL_EYES.map((l) => {
		const [wx, wy] = toScreenLocal(p, l);
		return [CX + c.hx + (c.s * wx + c.ox - CX), 960 + c.hy + (c.s * wy + c.oy - 960)] as V2;
	});
};
