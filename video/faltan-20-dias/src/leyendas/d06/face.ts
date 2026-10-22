// El rostro verdadero de la bruja (solo lo revela el espejo) y la mano de fuego que se estampa en el vidrio.
// Rostro: líneas de brasa (bezier) con ancho variable, achurado en las cuencas, cabello de flama que sube y ojos de carbón.
// Mano: UNA silueta (Path2D) para la mano de fuego, la huella de hollín, sus grietas de brasa y el humo.
import {noise2D} from '@remotion/noise';
import {clamp, hash, lerp, rgba} from '../../lib/util';
import {cached, glow, makeCanvas, type Ctx} from '../kit/paint';
import {P} from './timeline';

type V = [number, number];
const mix = (a: V, b: V, k: number): V => [lerp(a[0], b[0], k), lerp(a[1], b[1], k)];

// ---------------------------------------------------------------- rostro
// morph: 0 hambrienta → 0.5 reconocimiento → 1 horror. a: revelado (cortina). heat: brillo extra de las líneas.
export const paintWitchFace = (g: Ctx, o: {x: number; y: number; s: number; morph: number; a: number; t: number; heat?: number}) => {
	const {x, y, s, a, t} = o;
	if (a <= 0) return;
	const m = clamp(o.morph);
	const horror = clamp((m - 0.45) / 0.55);
	const heat = (o.heat ?? 0) + horror * 0.35;
	const lidOpen = lerp(0.4, 1.25, m); // apertura de párpados
	const brow = -24 * horror - 6 * clamp(m / 0.45);
	const mouthH = lerp(4, 90, Math.pow(horror, 0.8));
	const mouthW = lerp(78, 52, horror);
	const jaw = 26 * horror; // la mandíbula baja con la O
	const trem = (k: number) => noise2D('wfT', t * 18, k) * (0.6 + 2.6 * horror);
	g.save();
	g.translate(x, y);
	g.scale(s, s);
	g.lineCap = 'round';
	g.lineJoin = 'round';
	g.globalCompositeOperation = 'lighter';
	// trazo de brasa: halo ancho + cuerpo naranja + filo blanco-oro
	const ember = (path: () => void, w: number, k = 1) => {
		const A = a * k;
		g.strokeStyle = rgba(P.terra, 0.35 * A);
		g.lineWidth = w * 4.2;
		g.beginPath();
		path();
		g.stroke();
		g.strokeStyle = rgba(P.cempa, (0.7 + 0.2 * heat) * A);
		g.lineWidth = w * 1.9;
		g.beginPath();
		path();
		g.stroke();
		g.strokeStyle = rgba(heat > 0.3 ? '#FFF6E0' : P.gold, 0.95 * A);
		g.lineWidth = w * 0.7;
		g.beginPath();
		path();
		g.stroke();
	};
	// --- cabello de flama: lenguas que nacen del contorno superior y suben ---
	for (let i = 0; i < 26; i++) {
		const u = i / 25;
		const ang = lerp(-2.75, -0.39, u);
		const bx = Math.cos(ang) * 175;
		const by = -40 + Math.sin(ang) * 215;
		const len = 140 + 150 * Math.sin(u * Math.PI) + 60 * hash(i, 31) + 40 * horror;
		const sway = noise2D('wfH' + i, t * 2.2, u * 3) * 40;
		const lean = (u - 0.5) * 60;
		const w = 12 + 10 * hash(i, 32);
		const tx = bx + lean + sway * 1.4;
		const ty = by - len;
		const gr = g.createLinearGradient(bx, by, tx, ty);
		gr.addColorStop(0, rgba(P.cempa, 0.55 * a));
		gr.addColorStop(0.55, rgba(P.terra, 0.35 * a));
		gr.addColorStop(1, rgba(P.terra, 0));
		g.fillStyle = gr;
		g.beginPath();
		g.moveTo(bx - w, by);
		g.bezierCurveTo(bx - w + sway * 0.4, by - len * 0.4, tx - 4 + sway * 0.6, ty + len * 0.3, tx, ty);
		g.bezierCurveTo(tx + 4 + sway * 0.3, ty + len * 0.35, bx + w + sway * 0.4, by - len * 0.4, bx + w, by);
		g.closePath();
		g.fill();
		if (i % 2 === 0)
			ember(() => {
				g.moveTo(bx, by);
				g.bezierCurveTo(bx + sway * 0.3, by - len * 0.35, tx + sway * 0.2, ty + len * 0.4, tx * 0.96 + bx * 0.04, ty + len * 0.12);
			}, 1.6, 0.55);
	}
	// --- achurado en las cuencas y bajo los pómulos (tiembla con el horror) ---
	const hatch = (cx: number, cy: number, rx: number, ry: number, ang: number, n: number, k: number, seed: number) => {
		g.save();
		g.beginPath();
		g.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
		g.clip();
		g.strokeStyle = rgba(P.cempa, 0.55 * a * k);
		g.lineWidth = 1.8;
		g.beginPath();
		for (let i = 0; i < n; i++) {
			const d = (i / (n - 1) - 0.5) * 2 * Math.max(rx, ry);
			const j = trem(seed + i) * 0.8;
			const ca = Math.cos(ang);
			const sa = Math.sin(ang);
			g.moveTo(cx - sa * d - ca * 120 + j, cy + ca * d - sa * 120);
			g.lineTo(cx - sa * d + ca * 120 + j, cy + ca * d + sa * 120);
		}
		g.stroke();
		g.restore();
	};
	for (const sx of [-1, 1]) {
		hatch(sx * 74, -44, 66, 40, sx * 0.5, 9, 0.8, 10 + sx); // cuenca
		hatch(sx * 110, 62, 46, 70, sx * -0.9, 8, 0.7, 20 + sx); // hueco bajo el pómulo
		hatch(sx * 150, -120, 30, 60, sx * 0.2, 6, 0.5, 30 + sx); // sien
	}
	// --- contorno: sien → pómulo fuerte → mandíbula → mentón ---
	for (const sx of [-1, 1]) {
		ember(() => {
			g.moveTo(sx * 162, -190);
			g.bezierCurveTo(sx * 182, -120, sx * 176, -50, sx * 170, 6);
			g.bezierCurveTo(sx * 164, 70, sx * 140, 130 + jaw * 0.5, sx * 96, 182 + jaw * 0.8);
			g.bezierCurveTo(sx * 70, 214 + jaw, sx * 34, 232 + jaw, 0, 236 + jaw);
		}, 3.6);
		// arco del pómulo
		ember(() => {
			g.moveTo(sx * 64, 14);
			g.bezierCurveTo(sx * 100, 4, sx * 140, 10, sx * 160, 34);
		}, 2.2, 0.8);
		// pliegue nasogeniano (se marca con la O)
		ember(() => {
			g.moveTo(sx * 30, 52);
			g.bezierCurveTo(sx * 46, 90, sx * (54 + horror * 8), 120, sx * (52 + horror * 10), 150 + jaw * 0.5);
		}, 1.6, 0.45 + 0.35 * horror);
	}
	// --- cejas: arco fuerte que sube con el horror; se fruncen al centro en reconocimiento ---
	const knit = clamp(m / 0.45) * (1 - horror);
	for (const sx of [-1, 1]) {
		const b = brow + trem(40 + sx);
		ember(() => {
			g.moveTo(sx * 26, -86 + b * 0.8 + knit * 8);
			g.bezierCurveTo(sx * 56, -112 + b * 1.25, sx * 104, -118 + b * 1.2, sx * 134, -92 + b * 0.6);
		}, 4.2);
	}
	// --- ojos: párpado superior, inferior y carbón blanco-oro ---
	for (const sx of [-1, 1]) {
		const ex = sx * 74;
		const ey = -42;
		const up = 22 * lidOpen;
		const lo = 10 + 6 * horror;
		ember(() => {
			g.moveTo(ex - sx * 40, ey + 2);
			g.bezierCurveTo(ex - sx * 22, ey - up, ex + sx * 20, ey - up * 1.05, ex + sx * 42, ey - 2);
		}, 2.6);
		ember(() => {
			g.moveTo(ex - sx * 36, ey + 4);
			g.bezierCurveTo(ex - sx * 14, ey + lo, ex + sx * 16, ey + lo, ex + sx * 40, ey);
		}, 1.6, 0.7);
		// pliegue del párpado
		ember(() => {
			g.moveTo(ex - sx * 32, ey - up * 0.7 - 10);
			g.bezierCurveTo(ex - sx * 10, ey - up - 16, ex + sx * 16, ey - up - 14, ex + sx * 34, ey - up * 0.6 - 8);
		}, 1.1, 0.4);
		// carbón (iris) — se achica con el horror (pupila de miedo), siempre brillante
		const ir = lerp(12, 9, horror) * Math.min(1, lidOpen * 1.6);
		const py = ey + lerp(4, -1, horror);
		glow(g, ex, py, 46, P.gold, 0.55 * a, 0.25);
		g.fillStyle = rgba('#FFF6E0', a);
		g.beginPath();
		g.ellipse(ex, py, ir, Math.min(ir, up * 0.55 + 2), 0, 0, Math.PI * 2);
		g.fill();
	}
	// --- nariz recta: puente + ala ---
	ember(() => {
		g.moveTo(-8, -64);
		g.bezierCurveTo(-12, -20, -14, 18, -20, 44);
	}, 2, 0.75);
	ember(() => {
		g.moveTo(-34, 50);
		g.bezierCurveTo(-24, 62, -6, 64, 6, 56);
		g.moveTo(22, 52);
		g.bezierCurveTo(28, 58, 34, 56, 38, 48);
	}, 1.8, 0.8);
	// --- boca: línea fina cerrada → O de 90 px ---
	const my = 116 + jaw * 0.6;
	if (mouthH < 10)
		ember(() => {
			g.moveTo(-mouthW / 2, my);
			g.bezierCurveTo(-mouthW / 4, my + 3, mouthW / 4, my + 3, mouthW / 2, my - 1);
		}, 2.6);
	else {
		g.fillStyle = rgba('#120503', 0.6 * a);
		g.globalCompositeOperation = 'source-over';
		g.beginPath();
		g.ellipse(0, my + mouthH * 0.35, mouthW / 2, mouthH / 2, 0, 0, Math.PI * 2);
		g.fill();
		g.globalCompositeOperation = 'lighter';
		ember(() => {
			g.ellipse(trem(60) * 0.5, my + mouthH * 0.35, mouthW / 2, mouthH / 2, 0, 0, Math.PI * 2);
		}, 3);
	}
	// cuello: dos líneas que se pierden en la flama
	for (const sx of [-1, 1])
		ember(() => {
			g.moveTo(sx * 70, 200 + jaw);
			g.bezierCurveTo(sx * 74, 250, sx * 80, 290, sx * 96, 330);
		}, 2, 0.4);
	g.restore();
};

// ---------------------------------------------------------------- mano (Path2D compartido)
// coordenadas locales: palma centrada en el origen, dedos hacia arriba; huella en pantalla con HAND.
export const HAND = {x: 560, y: 1080, s: 1.85};

type Finger = {b: V; ang: number; len: number; w: number};
const FINGERS: Finger[] = [
	{b: [-150, 30], ang: -1.02, len: 205, w: 74}, // pulgar
	{b: [-96, -150], ang: -0.17, len: 248, w: 62}, // índice
	{b: [-30, -166], ang: -0.04, len: 284, w: 64}, // medio
	{b: [36, -160], ang: 0.09, len: 258, w: 60}, // anular
	{b: [102, -138], ang: 0.25, len: 198, w: 52}, // meñique
];

// punta de un dedo en coordenadas locales
export const fingerTip = (i: number): V => {
	const F = FINGERS[i];
	return [F.b[0] + Math.sin(F.ang) * F.len, F.b[1] - Math.cos(F.ang) * F.len];
};

const addFinger = (p: Path2D, F: Finger, curl = 0) => {
	const N = 10;
	const L: V[] = [];
	const R: V[] = [];
	const ax: V = [Math.sin(F.ang), -Math.cos(F.ang)];
	const nx: V = [-ax[1], ax[0]]; // normal hacia la derecha visual
	const len = F.len * (1 - curl * 0.35);
	for (let i = 0; i <= N; i++) {
		const u = i / N;
		const bulge = 1 + 0.05 * Math.exp(-(((u - 0.38) / 0.07) ** 2)) + 0.04 * Math.exp(-(((u - 0.7) / 0.06) ** 2));
		const hw = (F.w / 2) * (1 - 0.2 * u) * bulge;
		const c: V = [F.b[0] + ax[0] * len * u, F.b[1] + ax[1] * len * u];
		L.push([c[0] - nx[0] * hw, c[1] - nx[1] * hw]);
		R.push([c[0] + nx[0] * hw, c[1] + nx[1] * hw]);
	}
	// lado izquierdo de la base a la punta, punta redonda, lado derecho de regreso (horario en pantalla)
	p.moveTo(L[0][0], L[0][1]);
	for (const q of L) p.lineTo(q[0], q[1]);
	const tip: V = [F.b[0] + ax[0] * len, F.b[1] + ax[1] * len];
	const hwT = (F.w / 2) * 0.8;
	const a0 = Math.atan2(-nx[1], -nx[0]);
	p.arc(tip[0], tip[1], hwT, a0, a0 + Math.PI);
	for (let i = N; i >= 0; i--) p.lineTo(R[i][0], R[i][1]);
	p.closePath();
};

const handPath = () =>
	cached('d06:handPath', () => {
		const p = new Path2D();
		// palma (horario en pantalla)
		p.moveTo(-122, 236);
		p.bezierCurveTo(-150, 180, -172, 120, -168, 60);
		p.bezierCurveTo(-164, 0, -150, -60, -140, -120);
		p.bezierCurveTo(-120, -168, -40, -186, 20, -180);
		p.bezierCurveTo(80, -176, 140, -160, 156, -120);
		p.bezierCurveTo(170, -60, 168, 20, 160, 80);
		p.bezierCurveTo(152, 150, 140, 200, 118, 236);
		p.closePath();
		for (const F of FINGERS) addFinger(p, F);
		return p;
	});

// mano de fuego (antes y en el instante del golpe). k: forma (0 = tentáculos sueltos → 1 mano), blur por cercanía.
export const paintFireHand = (g: Ctx, o: {x: number; y: number; s: number; a: number; t: number; k?: number; flat?: number}) => {
	const {x, y, s, a, t} = o;
	if (a <= 0) return;
	const flat = o.flat ?? 0;
	g.save();
	g.translate(x, y);
	g.scale(s, s);
	g.globalCompositeOperation = 'lighter';
	const p = handPath();
	// halo exterior de flama
	g.filter = `blur(${(18 - flat * 8).toFixed(0)}px)`;
	g.fillStyle = rgba(P.cempa, 0.75 * a);
	g.fill(p);
	g.filter = 'none';
	g.fillStyle = rgba(P.gold, 0.55 * a);
	g.fill(p);
	// lenguas que corren por los dedos hacia arriba
	g.save();
	g.clip(p);
	for (let i = 0; i < 40; i++) {
		const fx = -180 + hash(i, 71) * 360;
		const ph = (t * 1.6 + hash(i, 72)) % 1;
		const fy = 240 - ph * 560;
		const r = 26 + 30 * hash(i, 73);
		g.fillStyle = rgba(i % 3 ? P.core : P.gold, 0.35 * a * Math.sin(ph * Math.PI));
		g.beginPath();
		g.ellipse(fx + noise2D('fh' + i, t * 3, 0) * 12, fy, r * 0.5, r, 0, 0, Math.PI * 2);
		g.fill();
	}
	g.restore();
	// núcleo blanco al aplanarse contra el vidrio
	if (flat > 0) {
		g.globalAlpha = flat * a;
		g.filter = 'blur(6px)';
		g.fillStyle = rgba('#FFF4DA', 0.85);
		g.translate(0, 20);
		g.scale(0.82, 0.86);
		g.fill(p);
	}
	g.restore();
};

// ---------------------------------------------------------------- huella de hollín (media resolución, horneada)
const SW = 540;
const SH = 960;
const inHand = (() => {
	let ctx: CanvasRenderingContext2D | null = null;
	return (lx: number, ly: number) => {
		if (!ctx) ctx = makeCanvas(4, 4).getContext('2d')!;
		return ctx.isPointInPath(handPath(), lx, ly);
	};
})();
const toLocal = (sx: number, sy: number): V => [(sx - HAND.x) / HAND.s, (sy - HAND.y) / HAND.s];
const toScr = (l: V): V => [HAND.x + l[0] * HAND.s, HAND.y + l[1] * HAND.s];

const sootCanvas = () =>
	cached('d06:soot', () => {
		const c = makeCanvas(SW, SH);
		const q = c.getContext('2d')!;
		q.scale(0.5, 0.5);
		q.translate(HAND.x, HAND.y);
		q.scale(HAND.s, HAND.s);
		const p = handPath();
		// halo de humo pegado alrededor
		q.filter = 'blur(14px)';
		q.fillStyle = rgba(P.soot, 0.55);
		q.fill(p);
		q.filter = 'blur(2px)';
		q.fillStyle = rgba('#140D08', 0.9);
		q.fill(p);
		q.filter = 'none';
		// moteado (huella real: más carga en yemas y talón, menos en el hueco de la palma)
		q.save();
		q.clip(p);
		q.globalCompositeOperation = 'destination-out';
		for (let i = 0; i < 900; i++) {
			const lx = -200 + hash(i, 91) * 400;
			const ly = -470 + hash(i, 92) * 720;
			const r = 2 + hash(i, 93) * 9;
			q.fillStyle = `rgba(0,0,0,${0.15 + hash(i, 94) * 0.45})`;
			q.beginPath();
			q.arc(lx, ly, r, 0, Math.PI * 2);
			q.fill();
		}
		// hueco de la palma: menos hollín
		const rg = q.createRadialGradient(-5, 20, 10, -5, 20, 120);
		rg.addColorStop(0, 'rgba(0,0,0,0.55)');
		rg.addColorStop(1, 'rgba(0,0,0,0)');
		q.fillStyle = rg;
		q.fillRect(-200, -100, 400, 260);
		// líneas de la palma y pliegues de nudillos (claras)
		q.strokeStyle = 'rgba(0,0,0,0.7)';
		q.lineWidth = 3;
		q.lineCap = 'round';
		q.beginPath();
		q.moveTo(-150, -40);
		q.bezierCurveTo(-60, -70, 40, -80, 140, -100); // línea del corazón
		q.moveTo(-150, 20);
		q.bezierCurveTo(-60, 0, 20, 10, 100, 40); // cabeza
		q.moveTo(-90, -110);
		q.bezierCurveTo(-140, 0, -120, 120, -60, 220); // vida
		q.stroke();
		q.lineWidth = 2;
		for (let fi = 1; fi < 5; fi++) {
			const F = FINGERS[fi];
			const ax: V = [Math.sin(F.ang), -Math.cos(F.ang)];
			for (const u of [0.38, 0.7]) {
				const cx = F.b[0] + ax[0] * F.len * u;
				const cy = F.b[1] + ax[1] * F.len * u;
				q.beginPath();
				q.moveTo(cx + ax[1] * F.w * 0.4, cy - ax[0] * F.w * 0.4);
				q.lineTo(cx - ax[1] * F.w * 0.4, cy + ax[0] * F.w * 0.4);
				q.stroke();
			}
		}
		// huellas dactilares: arcos concéntricos en las yemas
		q.lineWidth = 1.4;
		for (let fi = 0; fi < 5; fi++) {
			const tp = fingerTip(fi);
			const F = FINGERS[fi];
			const ax: V = [Math.sin(F.ang), -Math.cos(F.ang)];
			const cx = tp[0] - ax[0] * F.w * 0.55;
			const cy = tp[1] - ax[1] * F.w * 0.55;
			for (let r = 5; r < F.w * 0.42; r += 4.5) {
				q.beginPath();
				q.ellipse(cx, cy, r, r * 1.3, F.ang, Math.PI * 0.9, Math.PI * 2.1);
				q.stroke();
			}
		}
		q.restore();
		return c;
	});

// red de grietas de brasa dentro de la huella (segmentos en pantalla)
type Seg = {x0: number; y0: number; x1: number; y1: number; w: number};
const emberSegs = () =>
	cached('d06:emberSegs', () => {
		const out: Seg[] = [];
		const seeds: V[] = [[-20, 40], [-90, -60], [70, -40], [10, 160], [-130, 100], [110, 110]];
		for (let fi = 0; fi < 5; fi++) {
			const F = FINGERS[fi];
			seeds.push([F.b[0] + Math.sin(F.ang) * F.len * 0.5, F.b[1] - Math.cos(F.ang) * F.len * 0.5]);
		}
		seeds.forEach((sd, si) => {
			for (let br = 0; br < 4; br++) {
				let [x, y] = sd;
				let ang = hash(si * 7 + br, 101) * Math.PI * 2;
				let w = 2.6;
				for (let k = 0; k < 16; k++) {
					ang += (hash(si * 131 + br * 17 + k, 102) - 0.5) * 1.1;
					const L = 10 + hash(si * 37 + k + br, 103) * 16;
					const nx = x + Math.cos(ang) * L;
					const ny = y + Math.sin(ang) * L;
					if (!inHand(nx, ny)) break;
					const a = toScr([x, y]);
					const b = toScr([nx, ny]);
					out.push({x0: a[0], y0: a[1], x1: b[0], y1: b[1], w});
					w *= 0.9;
					x = nx;
					y = ny;
				}
			}
		});
		return out;
	});

const emberGlowCanvas = () =>
	cached('d06:emberGlow', () => {
		const c = makeCanvas(SW, SH);
		const q = c.getContext('2d')!;
		q.scale(0.5, 0.5);
		q.filter = 'blur(10px)';
		q.strokeStyle = rgba(P.cempa, 1);
		q.lineCap = 'round';
		for (const s of emberSegs()) {
			q.lineWidth = s.w * 5;
			q.beginPath();
			q.moveTo(s.x0, s.y0);
			q.lineTo(s.x1, s.y1);
			q.stroke();
		}
		return c;
	});

// huella completa: hollín + grietas de brasa que se enfrían + humo. a: opacidad (limpieza), cool 0..1,
// smear: corrimiento al ser arrancada (px de pantalla hacia abajo-izquierda), haze: velo gris que queda tras limpiar.
export const paintSootPrint = (g: Ctx, o: {a: number; cool: number; t: number; smear?: number; smoke?: number}) => {
	const {a, cool, t} = o;
	if (a <= 0.004) return;
	const sm = o.smear ?? 0;
	const sc = sootCanvas();
	g.save();
	g.globalAlpha = a * 0.92;
	g.drawImage(sc, 0, 0, 1080, 1920);
	if (sm > 0) {
		for (let k = 1; k <= 3; k++) {
			g.globalAlpha = a * 0.22 * (1 - k / 4);
			g.drawImage(sc, -sm * 0.35 * k, sm * k, 1080, 1920);
		}
	}
	g.restore();
	// grietas de brasa (palpitan mientras se enfrían)
	const hot = Math.pow(1 - clamp(cool), 1.4);
	if (hot > 0.01) {
		g.save();
		g.globalCompositeOperation = 'lighter';
		g.globalAlpha = a * hot * (0.85 + 0.15 * Math.sin(t * 13));
		g.drawImage(emberGlowCanvas(), 0, 0, 1080, 1920);
		g.lineCap = 'round';
		for (const pass of [0, 1]) {
			g.strokeStyle = pass ? rgba(P.gold, a * hot) : rgba(P.cempa, a * hot);
			g.beginPath();
			for (const s of emberSegs()) {
				g.lineWidth = pass ? s.w * 0.6 : s.w * 1.6;
				g.moveTo(s.x0, s.y0);
				g.lineTo(s.x1, s.y1);
			}
			g.stroke();
		}
		g.restore();
	}
	// humo que sube de la huella (manchas suaves desplazadas por ruido)
	const smoke = (o.smoke ?? 0) * a;
	if (smoke > 0.01) {
		g.save();
		for (let i = 0; i < 14; i++) {
			const life = 1.4 + hash(i, 111) * 1.2;
			const u = ((t + hash(i, 112) * life) % life) / life;
			const bx = 300 + hash(i, 113) * 520;
			const by = 600 + hash(i, 114) * 700;
			const x = bx + noise2D('smk' + i, t * 0.7, u) * 60;
			const y = by - u * 260;
			const r = 50 + u * 120;
			const rg = g.createRadialGradient(x, y, 0, x, y, r);
			rg.addColorStop(0, rgba('#3A302A', 0.22 * smoke * Math.sin(u * Math.PI)));
			rg.addColorStop(1, 'rgba(58,48,42,0)');
			g.fillStyle = rg;
			g.fillRect(x - r, y - r, r * 2, r * 2);
		}
		g.restore();
	}
};

// puntas de los tentáculos convergiendo en la mano (frames del lanzamiento). k 0..1
export const tendrilsToHand = (g: Ctx, o: {k: number; a: number; t: number; cx: number; cy: number; s: number}) => {
	const {k, a, t, cx, cy, s} = o;
	if (a <= 0) return;
	g.save();
	g.globalCompositeOperation = 'lighter';
	g.lineCap = 'round';
	for (let i = 0; i < 7; i++) {
		const fi = Math.min(4, Math.round((i / 6) * 4));
		const tip = fingerTip(fi);
		const start: V = [cx + (i - 3) * 60 * s, cy + 260 * s];
		const end: V = [cx + tip[0] * s, cy + tip[1] * s];
		const p = mix(start, end, k);
		const w = noise2D('tth' + i, t * 4, 0) * 30 * (1 - k);
		g.strokeStyle = rgba(P.cempa, 0.6 * a);
		g.lineWidth = 22 * s;
		g.beginPath();
		g.moveTo(cx + (i - 3) * 20 * s, cy + 40 * s);
		g.quadraticCurveTo(cx + (i - 3) * 50 * s + w, cy + 120 * s, p[0], p[1]);
		g.stroke();
		g.strokeStyle = rgba(P.core, 0.8 * a);
		g.lineWidth = 7 * s;
		g.stroke();
	}
	g.restore();
};

export {toLocal};
