// Día 8 · B2 · MEMORIA (f90–246): las manos de la abuela atan el listón. Cenital sobre la mesa de la cocina,
// luz de veladora que respira, hule floreado gastado, jarro de barro, sombra del péndulo, fleco del rebozo.
// Capas: hule → mancha/pétalos/jarro/veladora → (mano D de la abuela si pasa POR DEBAJO) → brazo del niño + manga
// → vueltas del listón → manos de la abuela (por encima) → fleco → sombra del péndulo → luz de vela (multiply)
// → llama emisiva → fuga de luz → viñeta → humo (transición).
import {noise2D} from '@remotion/noise';
import {H, W, clamp, hash, lerp, rgba} from '../../lib/util';
import {cached, glow, makeCanvas, noiseTile, tinted, drawTiled, type Ctx} from '../kit/paint';
import {flame2D, marigold, smoke} from '../kit/fx';
import {paintShape} from '../kit/shade';
import {simChain, chainAt, smoothPath} from '../kit/rig';
import type {PostOpts} from '../kit/post';
import {P, easeInOut, easeOut3, petal, ribbon, seg, smooth, spr, type V2} from './core';
import {SKIN_ABU, SKIN_KID, drawHand, handGeom, handPt, rebozoSleeve, sleeve, type HandPose} from './hands';
import {B, EV, POST_MEMORY} from './timeline';

const sec = (f: number) => f / 30;
const VX = 806; // veladora (pantalla, antes del push)
const VY = 700;
const add = (a: V2, b: V2, k = 1): V2 => [a[0] + b[0] * k, a[1] + b[1] * k];
const sub = (a: V2, b: V2): V2 => [a[0] - b[0], a[1] - b[1]];
const mix2 = (a: V2, b: V2, u: number): V2 => [lerp(a[0], b[0], u), lerp(a[1], b[1], u)];
const lightAng = (x: number, y: number) => Math.atan2(VY - y, VX - x);

// ---------------------------------------------------------------- hule floreado (lienzo estático)
const HULE_PAD = 140;
const hule = () =>
	cached('d8b2hule', () => {
		const w = W + HULE_PAD * 2;
		const h = H + HULE_PAD * 2;
		const c = makeCanvas(w, h);
		const g = c.getContext('2d')!;
		g.fillStyle = '#c6a978';
		g.fillRect(0, 0, w, h);
		// fibra del plástico: ruido muy suave
		// trama del plástico: líneas finas cruzadas
		g.strokeStyle = 'rgba(90,60,30,0.07)';
		g.lineWidth = 1;
		for (let x = 0; x < w; x += 5) {
			g.beginPath();
			g.moveTo(x, 0);
			g.lineTo(x, h);
			g.stroke();
		}
		for (let y = 0; y < h; y += 5) {
			g.beginPath();
			g.moveTo(0, y);
			g.lineTo(w, y);
			g.stroke();
		}
		// estampado en su propio lienzo (para gastarlo sin tocar la base)
		const pc = makeCanvas(w, h);
		const p = pc.getContext('2d')!;
		const flower = (x: number, y: number, r: number, rot: number, i: number) => {
			// hojas verdes (desregistro de 3 px respecto al rojo)
			p.save();
			p.translate(x + 3, y + 2);
			p.rotate(rot);
			p.fillStyle = 'rgba(38,92,72,0.78)';
			for (const s of [-1, 1]) {
				p.save();
				p.rotate(s * 0.9 + 0.3);
				p.beginPath();
				p.moveTo(r * 0.7, 0);
				p.quadraticCurveTo(r * 1.5, -r * 0.55, r * 2.3, 0);
				p.quadraticCurveTo(r * 1.5, r * 0.55, r * 0.7, 0);
				p.fill();
				p.restore();
			}
			p.strokeStyle = 'rgba(38,92,72,0.7)';
			p.lineWidth = 3;
			p.beginPath();
			p.moveTo(0, r * 0.6);
			p.quadraticCurveTo(r * 0.4, r * 1.6, -r * 0.2, r * 2.4);
			p.stroke();
			p.restore();
			// flor terracota de seis pétalos redondeados
			p.save();
			p.translate(x, y);
			p.rotate(rot);
			for (let k = 0; k < 6; k++) {
				p.save();
				p.rotate((k / 6) * Math.PI * 2);
				p.fillStyle = k % 2 ? 'rgba(160,62,36,0.86)' : 'rgba(176,72,42,0.86)';
				p.beginPath();
				p.ellipse(r * 0.62, 0, r * 0.52, r * 0.34, 0, 0, Math.PI * 2);
				p.fill();
				p.fillStyle = 'rgba(110,36,22,0.5)';
				p.beginPath();
				p.ellipse(r * 0.4, 0, r * 0.2, r * 0.06, 0, 0, Math.PI * 2);
				p.fill();
				p.restore();
			}
			p.fillStyle = 'rgba(232,196,120,0.95)';
			p.beginPath();
			p.arc(0, 0, r * 0.26, 0, Math.PI * 2);
			p.fill();
			p.fillStyle = 'rgba(110,40,20,0.7)';
			for (let k = 0; k < 7; k++) {
				const a = (k / 7) * Math.PI * 2;
				p.beginPath();
				p.arc(Math.cos(a) * r * 0.14, Math.sin(a) * r * 0.14, 1.6, 0, Math.PI * 2);
				p.fill();
			}
			p.restore();
			// ramito de tres puntos verdes
			p.fillStyle = 'rgba(38,92,72,0.7)';
			for (let k = 0; k < 3; k++) {
				p.beginPath();
				p.arc(x + r * 2.6 + k * 9, y - r * 1.4 + (k % 2) * 8, 4, 0, Math.PI * 2);
				p.fill();
			}
			void i;
		};
		let i = 0;
		for (let y = -40, row = 0; y < h + 80; y += 190, row++)
			for (let x = row % 2 ? 100 : -10; x < w + 80; x += 230) flower(x, y, 30, (hash(i, 3) - 0.5) * 0.5 + (row % 2) * 0.6, i++);
		// desgaste: donde se apoyan los brazos (centro) el estampado se borra en manchas
		const wear = tinted(noiseTile({seed: 822, period: 6, oct: 6, contrast: 5, bias: -0.32}), '#000', 'd8hulewear');
		p.globalCompositeOperation = 'destination-out';
		drawTiled(p, wear, {w, h, scale: 1.2, alpha: 0.85, op: 'destination-out'});
		const rub = p.createRadialGradient(w * 0.48, h * 0.62, 80, w * 0.48, h * 0.62, 700);
		rub.addColorStop(0, 'rgba(0,0,0,0.35)');
		rub.addColorStop(1, 'rgba(0,0,0,0)');
		p.fillStyle = rub;
		p.fillRect(0, 0, w, h);
		g.drawImage(pc, 0, 0);
		// pliegues del hule: una línea oscura y una clara desplazada
		const crease = (pts: V2[]) => {
			g.lineCap = 'round';
			g.strokeStyle = 'rgba(60,34,14,0.28)';
			g.lineWidth = 2.2;
			g.beginPath();
			smoothPath(g, pts);
			g.stroke();
			g.strokeStyle = 'rgba(255,236,196,0.22)';
			g.lineWidth = 1.6;
			g.beginPath();
			smoothPath(
				g,
				pts.map(([x, y]) => [x + 2.5, y + 2] as V2),
			);
			g.stroke();
		};
		crease([[60, 520], [420, 600], [880, 560], [1300, 640]]);
		crease([[200, 1780], [520, 1700], [900, 1760], [1340, 1690]]);
		crease([[880, 140], [920, 700], [1000, 1300]]);
		// mancha de un aro (el jarro lleva años en ese lugar)
		g.strokeStyle = 'rgba(96,56,24,0.22)';
		g.lineWidth = 7;
		g.beginPath();
		g.ellipse(HULE_PAD + 228, HULE_PAD + 1490, 104, 100, 0.2, 0.3, Math.PI * 1.85);
		g.stroke();
		// motas y raspones
		for (let k = 0; k < 900; k++) {
			g.fillStyle = hash(k, 7) < 0.5 ? `rgba(70,40,15,${0.1 + hash(k, 8) * 0.18})` : `rgba(255,240,210,${0.06 + hash(k, 9) * 0.1})`;
			const s = 0.8 + hash(k, 10) * 2.4;
			g.fillRect(hash(k, 11) * w, hash(k, 12) * h, s, s * (0.5 + hash(k, 13)));
		}
		return c;
	});

// ---------------------------------------------------------------- utilería
const jarro = (g: Ctx, x: number, y: number, r: number, t: number) => {
	const la = lightAng(x, y);
	// sombra de contacto (lejos de la vela)
	g.save();
	const sx = -Math.cos(la) * 38;
	const sy = -Math.sin(la) * 38;
	const sh = g.createRadialGradient(x + sx, y + sy, r * 0.5, x + sx, y + sy, r * 1.35);
	sh.addColorStop(0, 'rgba(26,12,4,0.55)');
	sh.addColorStop(1, 'rgba(26,12,4,0)');
	g.fillStyle = sh;
	g.fillRect(x + sx - r * 1.5, y + sy - r * 1.5, r * 3, r * 3);
	g.restore();
	// asa (del lado contrario a la vela)
	const ha = la + Math.PI + 0.35;
	g.save();
	g.translate(x + Math.cos(ha) * r * 0.98, y + Math.sin(ha) * r * 0.98);
	g.rotate(ha);
	paintShape(
		g,
		(q) => {
			q.ellipse(0, 0, r * 0.42, r * 0.2, 0, 0, Math.PI * 2);
			q.ellipse(-r * 0.04, 0, r * 0.25, r * 0.08, 0, 0, Math.PI * 2, true);
		},
		[-r * 0.5, -r * 0.3, r, r * 0.6],
		{fill: '#8a3a1c', light: la - ha, shadow: {color: '#2a0f05', width: 10, alpha: 0.8}, rim: {color: '#f2b27a', width: 3, alpha: 0.5}},
	);
	g.restore();
	// cuerpo (vista cenital: la panza es el disco mayor)
	paintShape(
		g,
		(q) => q.arc(x, y, r, 0, Math.PI * 2),
		[x - r, y - r, r * 2, r * 2],
		{
			fill: (q, b) => {
				const gr = q.createRadialGradient(b[0] + b[2] * (0.5 + Math.cos(la) * 0.22), b[1] + b[3] * (0.5 + Math.sin(la) * 0.22), r * 0.1, x, y, r);
				gr.addColorStop(0, '#c8673a');
				gr.addColorStop(0.6, '#9a4222');
				gr.addColorStop(1, '#5c220e');
				return gr;
			},
			light: la,
			shadow: {color: '#2a0d04', width: 30, alpha: 0.85, blur: 14},
			rim: {color: '#ffc58a', width: 4, alpha: 0.55, blur: 3},
			texture: {seed: 140, scale: 0.3, alpha: 0.22, color: '#3a1606'},
		},
	);
	// decoración bruñida: puntos y una greca en el hombro
	g.save();
	g.strokeStyle = 'rgba(236,206,160,0.42)';
	g.lineWidth = 2.4;
	g.beginPath();
	g.arc(x, y, r * 0.83, 0, Math.PI * 2);
	g.stroke();
	g.fillStyle = 'rgba(236,206,160,0.5)';
	for (let k = 0; k < 22; k++) {
		const a = (k / 22) * Math.PI * 2;
		g.beginPath();
		g.arc(x + Math.cos(a) * r * 0.74, y + Math.sin(a) * r * 0.74, 3, 0, Math.PI * 2);
		g.fill();
	}
	g.restore();
	// boca: labio claro y el agua oscura con el reflejo de la llama
	const mr = r * 0.56;
	paintShape(g, (q) => q.arc(x, y, mr, 0, Math.PI * 2), [x - mr, y - mr, mr * 2, mr * 2], {fill: '#b65a30', light: la, shadow: {color: '#3a1406', width: 8, alpha: 0.6}, rim: {color: '#ffd2a0', width: 3, alpha: 0.65}});
	const ir = mr * 0.78;
	const wg = g.createRadialGradient(x - Math.cos(la) * ir * 0.3, y - Math.sin(la) * ir * 0.3, 2, x, y, ir);
	wg.addColorStop(0, '#2a1608');
	wg.addColorStop(1, '#0d0603');
	g.fillStyle = wg;
	g.beginPath();
	g.arc(x, y, ir, 0, Math.PI * 2);
	g.fill();
	const fx = x + Math.cos(la) * ir * 0.45;
	const fy = y + Math.sin(la) * ir * 0.45;
	const wob = noise2D('jarw', t * 1.3, 0) * 1.5;
	g.fillStyle = 'rgba(255,214,140,0.75)';
	g.beginPath();
	g.ellipse(fx + wob, fy, 6, 3.2, la, 0, Math.PI * 2);
	g.fill();
};

// veladora vista desde arriba (ligera perspectiva): vidrio grueso, cera, mecha. La llama va después de la luz.
const veladoraBody = (g: Ctx, t: number) => {
	const r = 74;
	// cáustica cálida del vidrio sobre el hule
	g.save();
	g.globalCompositeOperation = 'lighter';
	const cg = g.createRadialGradient(VX, VY + 8, r * 0.9, VX, VY + 8, r * 1.9);
	cg.addColorStop(0, 'rgba(255,200,110,0.35)');
	cg.addColorStop(0.35, 'rgba(255,170,80,0.12)');
	cg.addColorStop(1, 'rgba(255,170,80,0)');
	g.fillStyle = cg;
	g.fillRect(VX - r * 2, VY - r * 2, r * 4, r * 4);
	g.restore();
	// pared del vidrio
	const gg = g.createRadialGradient(VX, VY, r * 0.7, VX, VY, r);
	gg.addColorStop(0, 'rgba(255,226,170,0.5)');
	gg.addColorStop(0.75, 'rgba(214,170,110,0.55)');
	gg.addColorStop(1, 'rgba(120,80,40,0.7)');
	g.fillStyle = gg;
	g.beginPath();
	g.ellipse(VX, VY, r, r * 0.94, 0, 0, Math.PI * 2);
	g.fill();
	// cera (algo hundida) con charco de cera líquida que brilla
	const wr = r * 0.82;
	const wx = g.createRadialGradient(VX, VY - 4, 4, VX, VY, wr);
	wx.addColorStop(0, '#fff0c6');
	wx.addColorStop(0.35, '#f4d9a0');
	wx.addColorStop(1, '#c79f68');
	g.fillStyle = wx;
	g.beginPath();
	g.ellipse(VX, VY - 3, wr, wr * 0.93, 0, 0, Math.PI * 2);
	g.fill();
	// labio del vidrio: brillos cortados
	g.lineCap = 'round';
	g.strokeStyle = 'rgba(255,246,220,0.75)';
	g.lineWidth = 3;
	g.beginPath();
	g.ellipse(VX, VY, r - 2, r * 0.94 - 2, 0, Math.PI * 1.1, Math.PI * 1.55);
	g.stroke();
	g.strokeStyle = 'rgba(255,246,220,0.45)';
	g.lineWidth = 2;
	g.beginPath();
	g.ellipse(VX, VY, r - 3, r * 0.94 - 3, 0, Math.PI * 0.05, Math.PI * 0.35);
	g.stroke();
	g.strokeStyle = 'rgba(90,50,20,0.5)';
	g.lineWidth = 2;
	g.beginPath();
	g.ellipse(VX, VY, r, r * 0.94, 0, 0, Math.PI * 2);
	g.stroke();
	// mecha
	g.fillStyle = '#2a1608';
	g.beginPath();
	g.arc(VX + noise2D('wick', t, 0) * 0.5, VY - 4, 3.2, 0, Math.PI * 2);
	g.fill();
};

// sombra del péndulo del reloj de pared (2 s de periodo, desenfocada, cacheada)
const pendSprite = () =>
	cached('d8b2pend', () => {
		const c = makeCanvas(260, 1700);
		const g = c.getContext('2d')!;
		g.filter = 'blur(26px)';
		g.fillStyle = '#000';
		g.fillRect(118, 0, 24, 1400);
		g.beginPath();
		g.arc(130, 1460, 82, 0, Math.PI * 2);
		g.fill();
		return c;
	});

// ---------------------------------------------------------------- muñeca del niño (palma arriba)
const KID: HandPose = {x: 520, y: 1225, rot: -0.1, s: 1.8, side: 'L', view: 'palm', skin: SKIN_KID, curl: [0.3, 0.26, 0.28, 0.34], thumb: 0.28, forearm: 760, spread: 0.2, light: lightAng(520, 1150), shadow: {dx: -16, dy: 26, a: 0.42}};
const WR = (() => {
	const c = handPt(KID, 0, 14);
	const a0 = sub(handPt(KID, 0, -10), handPt(KID, 0, 0));
	const la = Math.hypot(a0[0], a0[1]);
	const a: V2 = [a0[0] / la, a0[1] / la]; // hacia los dedos
	const n: V2 = [-a[1], a[0]]; // hacia la derecha de pantalla
	return {c, a, n, hw: 41 * KID.s};
})();
const wristPt = (across: number, along: number): V2 => add(add(WR.c, WR.n, across), WR.a, along);
const HS = 1.2; // escala de las manos respecto al diseño original
const wp = (across: number, along: number) => wristPt(across * HS, along * HS);

// vueltas del listón sobre la muñeca: tramo visible (por encima) de la vuelta k, de la orilla derecha a la izquierda
const BAND = [
	{off: 6, slant: 10},
	{off: -10, slant: -7},
];
const bandPts = (k: number, u1: number): V2[] => {
	const pts: V2[] = [];
	const N = 14;
	for (let i = 0; i <= N; i++) {
		const u = (i / N) * u1;
		const across = WR.hw * 1.04 * (1 - 2 * u);
		pts.push(wristPt(across, (BAND[k].off + BAND[k].slant * (u - 0.5) - Math.sin(Math.PI * u) * 2.5) * HS));
	}
	return pts;
};

// ---------------------------------------------------------------- abuela: claves de movimiento
const W0 = 94; // empieza a envolver
const W1 = EV.wrap1; // 138
const K0 = W1; // cruza para el nudo
const KP = 146; // empieza a jalar
const KT = 160; // queda tenso (rechinido del hilo ~162)
const KR = 164; // suelta
const TH0 = EV.knot1; // 165 pulgar
const TH1 = 182;
const LIFT0 = EV.lift0; // 231
const KNOT = wp(10, 2);
const kp = (dx: number, dy: number): V2 => add(add(KNOT, WR.n, dx * HS), WR.a, dy * HS);

const phi = (f: number) => {
	const u = seg(f, W0, W1);
	return Math.PI * 4 * (0.55 * u + 0.45 * easeInOut(u));
};
const wrapT = (f: number): {p: V2; z: number} => {
	const ph = phi(f);
	return {p: add(wp(Math.cos(ph) * 98, lerp(4, -8, ph / (Math.PI * 4))), WR.a, Math.sin(ph) * 6 * HS), z: Math.sin(ph)};
};
const tremor = (id: string, t: number): V2 => [noise2D(id + 'x', t * 5, 0) * 0.8, noise2D(id + 'y', 0, t * 5) * 0.8];

// coloca la mano para que su punto local (lx, ly) caiga en el objetivo
const placeHand = (p: HandPose, local: V2, target: V2): HandPose => {
	const o = handPt({...p, x: 0, y: 0}, local[0], local[1]);
	return {...p, x: target[0] - o[0], y: target[1] - o[1]};
};
const pinchLocal = (p: HandPose): V2 => {
	const g = handGeom(p);
	const a = g.fingers[0][2].b;
	const b = g.thumb[g.thumb.length - 1].b;
	return [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
};
const thumbLocal = (p: HandPose): V2 => {
	const g = handGeom(p);
	return g.thumb[g.thumb.length - 1].b;
};

type AbuState = {pose: HandPose; pinch: V2 | null; under: boolean; lift: number};
const ABU_BASE = {s: 1.7, view: 'dorsal' as const, skin: SKIN_ABU, engraved: 0.4, forearm: 980};

// curl con desfase por dedo (2–4 frames de solapamiento)
const curlLag = (f: number, fn: (ff: number) => number): [number, number, number, number] => [fn(f), fn(f - 1.5), fn(f - 3), fn(f - 4)];

// mano DERECHA de la abuela (izquierda de pantalla): envuelve, jala el nudo, pulgar, palmaditas, se va
const abuR = (f: number): AbuState => {
	const t = sec(f);
	const tr = tremor('abR', t);
	const pinchCurl = (ff: number) => (ff < KR ? 0.4 : ff < TH0 + 4 ? lerp(0.4, 0.22, seg(ff, KR, KR + 6)) : 0.26);
	const base: HandPose = {...ABU_BASE, x: 0, y: 0, rot: 2.42, side: 'R', ring: true, curl: curlLag(f, pinchCurl), thumb: f < KR ? 0.5 : 0.2, spread: 0.16};
	const lift = smooth(seg(f, LIFT0, B.b2[1] + 4));
	let pose: HandPose;
	let pinch: V2 | null = null;
	let under = false;
	if (f < K0) {
		const w = wrapT(f);
		const p = {...base, rot: 2.42 + Math.sin(phi(f)) * 0.16 - Math.cos(phi(f)) * 0.1, s: base.s * (1 + 0.05 * w.z)};
		pose = placeHand(p, pinchLocal(p), add(w.p, tr));
		pinch = w.p;
		under = w.z < -0.05;
	} else if (f < KR) {
		// cruza por encima hacia el nudo (138–146) y luego jala hacia la izquierda (146–160) con rebote al tensar
		const startP = wrapT(K0 - 0.001).p;
		const cross = smooth(seg(f, K0, KP));
		const pull = easeOut3(seg(f, KP, KT)) + (f > KT ? (spr(sec(f - KT), 900, 22) - 1) * -0.03 : 0);
		const at = mix2(mix2(startP, kp(-24, 0), cross), kp(-196, -26), pull);
		const p = {...base, rot: 2.42 + pull * 0.25, s: base.s * (1 + 0.07 * Math.sin(Math.PI * cross))};
		pose = placeHand(p, pinchLocal(p), add(at, tr));
		pinch = at;
	} else if (f < TH1 + 2) {
		// regresa y pasa el pulgar sobre el nudo, despacio (arco con ease in-out)
		const p = {...base, rot: lerp(2.6, 1.9, smooth(seg(f, KR, TH0 + 4))), thumb: 0.05, thumbAng: 0.2};
		const back = smooth(seg(f, KR, TH0 + 2));
		const u = easeInOut(seg(f, TH0, TH1));
		const arc = kp(lerp(-46, 40, u), -6 + Math.sin(Math.PI * u) * 12);
		const from = kp(-196, -26);
		pose = placeHand(p, thumbLocal(p), add(mix2(from, kp(-46, -6), back), u > 0 ? sub(arc, kp(-46, -6)) : [0, 0]));
		pose = {...pose, x: pose.x + tr[0], y: pose.y + tr[1]};
	} else {
		// palmaditas (184, 193): 3 frames abajo, regreso con resorte; luego se queda, aprieta y se va
		const p0 = {...base, rot: 1.9, thumb: 0.2, curl: curlLag(f, (ff) => 0.32 + 0.12 * smooth(seg(ff, 200, 214)) - 0.08 * smooth(seg(ff, 218, 230)))};
		const patK = (fp: number) => (f < fp ? 0 : f < fp + 3 ? (f - fp) / 3 : 1 - spr(sec(f - fp - 3), 500, 26));
		const down = Math.max(patK(EV.pat1), patK(EV.pat2)) * (f >= EV.pat1 ? 1 : 0);
		const palm: V2 = [0, -70];
		const settle = smooth(seg(f, TH1, EV.pat1));
		const target = add(add(WR.c, WR.n, lerp(-6, -10, settle) * HS), WR.a, (lerp(30, 64, settle) - down * 4) * HS);
		const p = {...p0, s: p0.s * (1 - 0.045 * down)};
		pose = placeHand(p, palm, add(target, tr));
	}
	if (lift > 0) pose = {...pose, x: pose.x - 260 * lift * lift, y: pose.y - 1150 * lift * lift, s: pose.s * (1 + 0.22 * lift)};
	pose.light = lightAng(pose.x, pose.y);
	const h = 0.25 + (under ? 0 : 0.35) + lift * 2.5;
	pose.shadow = {dx: -22 * h - 8, dy: 30 * h + 10, a: 0.4 * (1 - lift * 0.6)};
	return {pose, pinch, under, lift};
};

// mano IZQUIERDA de la abuela (derecha de pantalla): sostiene la punta del listón contra la muñeca, ayuda con el
// nudo, jala hacia la derecha, se retira a descansar sobre el hule y al final se levanta
const abuL = (f: number): AbuState => {
	const t = sec(f);
	const tr = tremor('abL', t);
	const base: HandPose = {...ABU_BASE, x: 0, y: 0, rot: -2.35, side: 'L', curl: curlLag(f, (ff) => (ff < KR ? 0.38 : lerp(0.38, 0.22, seg(ff, KR, KR + 8)))), thumb: f < KR ? 0.5 : 0.15, spread: 0.16};
	const hold = wristPt(WR.hw * 0.92, -16 * HS);
	const lift = smooth(seg(f, LIFT0 - 4, B.b2[1]));
	let pinch: V2 | null = null;
	let at: V2;
	if (f < K0) at = hold;
	else if (f < KR) {
		const cross = smooth(seg(f, K0, KP));
		const pull = easeOut3(seg(f, KP, KT)) + (f > KT ? (spr(sec(f - KT), 900, 22) - 1) * -0.03 : 0);
		at = mix2(mix2(hold, kp(22, 0), cross), kp(200, -14), pull);
	} else {
		const away = smooth(seg(f, KR + 2, KR + 30));
		at = mix2(kp(200, -14), [870, 1020], away);
	}
	if (f < KR) pinch = at;
	let pose = placeHand(base, pinchLocal(base), add(at, tr));
	if (lift > 0) pose = {...pose, x: pose.x + 240 * lift * lift, y: pose.y - 1150 * lift * lift, s: pose.s * (1 + 0.2 * lift)};
	pose.light = lightAng(pose.x, pose.y);
	const h = (f < KR ? 0.45 : 0.15) + lift * 2.5;
	pose.shadow = {dx: -22 * h - 8, dy: 30 * h + 10, a: 0.4 * (1 - lift * 0.6)};
	return {pose, pinch, under: false, lift};
};

// ---------------------------------------------------------------- listón: cola libre y puntas
const LF = B.b2[1] - B.b2[0] + 12;
const tailChain = () =>
	simChain({
		key: 'd8b2tail',
		frames: LF,
		n: 18,
		seg: 9,
		anchor: (lf) => abuR(B.b2[0] + lf).pinch ?? abuR(KR - 0.01).pinch!,
		dir: [-0.4, 0.9],
		gravity: 0.22,
		damping: 0.9,
		stiffness: 8,
		substeps: 3,
	});
const fringeChains = () =>
	cached('d8b2fringe', () =>
		Array.from({length: 12}, (_, i) =>
			simChain({
				key: 'd8b2fr' + i,
				frames: LF,
				n: 8,
				seg: 8.5,
				anchor: (lf) => fringeAnchor(B.b2[0] + lf, i),
				dir: [0.35, 0.95],
				gravity: 0.3,
				damping: 0.93,
				stiffness: 5,
				wind: (lf, k) => [noise2D('frw' + i, lf * 0.05, k * 0.2) * 0.04, 0],
			}),
		),
	);
// orilla del rebozo en la manga de la mano derecha (misma fórmula que rebozoSleeve)
const SLEEVE_AT = 58;
const fringeAnchor = (f: number, i: number): V2 => {
	const p = abuR(f).pose;
	const u = 0.06 + (i / 11) * 0.88;
	return handPt(p, lerp(-50, 50, u), SLEEVE_AT + Math.sin(u * Math.PI * 3 + 0.5) * 3 + 2);
};

// longitud de la cola libre: se consume con las vueltas (de 150 px a 0 cuando la mano queda en la punta)
const freeLen = (f: number) => lerp(180, 0, smooth(seg(f, W0, KP + 4)));

const ribbonW = 14;
const drawFreeTail = (g: Ctx, f: number) => {
	const L = freeLen(f);
	if (L < 4) return;
	const lf = f - B.b2[0];
	const pts = chainAt(tailChain(), 18, Math.max(0, Math.min(LF - 1, lf)));
	const keep: V2[] = [pts[0]];
	let acc = 0;
	for (let i = 1; i < pts.length && acc < L; i++) {
		const d = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
		const k = Math.min(1, (L - acc) / Math.max(1e-3, d));
		keep.push(mix2(pts[i - 1], pts[i], k));
		acc += d;
	}
	ribbon(g, keep, {w: ribbonW, s0: 300, shadow: 0.45, chunks: 1});
	fray(g, keep[keep.length - 1], keep[keep.length - 2] ?? keep[0]);
};
const fray = (g: Ctx, end: V2, prev: V2) => {
	const a = Math.atan2(end[1] - prev[1], end[0] - prev[0]);
	g.save();
	g.translate(end[0], end[1]);
	g.rotate(a);
	g.strokeStyle = 'rgba(168,58,37,0.85)';
	g.lineWidth = 1;
	for (let j = -3; j <= 3; j++) {
		g.beginPath();
		g.moveTo(0, j * 1.6);
		g.lineTo(5 + Math.abs(j) * 0.8 + hash(j + 9, 4) * 3, j * 2);
		g.stroke();
	}
	g.restore();
};

// puntas del nudo: tensas hacia los dedos mientras jalan; al soltar caen y se acomodan curvas sobre la muñeca
const knotTails = (g: Ctx, f: number, rPinch: V2 | null, lPinch: V2 | null) => {
	const restR: V2[] = [KNOT, wp(-24, -34), wp(-46, -76), wp(-38, -122)];
	const restL: V2[] = [KNOT, wp(34, -28), wp(66, -62), wp(84, -100)];
	const rel = f < KR ? 0 : spr(sec(f - KR), 120, 9);
	const sway = Math.sin(sec(f) * 2.1) * 2 * (f > KR ? 1 : 0);
	for (const [pinch, rest, s0] of [
		[rPinch, restR, 40],
		[lPinch, restL, 140],
	] as [V2 | null, V2[], number][]) {
		const tip = pinch ?? rest[3];
		const taut: V2[] = [0, 1, 2, 3].map((k) => mix2(KNOT, tip, k / 3));
		const pts = taut.map((p, k) => (pinch && f < KR ? p : mix2(p, add(rest[k], [sway * k * 0.4, 0]), clamp(rel))));
		const dense: V2[] = [];
		for (let k = 0; k < 3; k++) for (let j = 0; j < 6; j++) dense.push(mix2(pts[k], pts[k + 1], j / 6));
		dense.push(pts[3]);
		ribbon(g, dense, {w: ribbonW * 0.95, s0, shadow: 0.5, chunks: 1});
		fray(g, dense[dense.length - 1], dense[dense.length - 2]);
	}
	// el nudo
	const k = smooth(seg(f, KP + 2, KT));
	g.save();
	g.translate(KNOT[0], KNOT[1]);
	g.rotate(Math.atan2(WR.n[1], WR.n[0]) + 0.3);
	const r = lerp(13, 10, k);
	paintShape(
		g,
		(q) => q.ellipse(0, 0, r * 1.25, r, 0, 0, Math.PI * 2),
		[-r * 1.4, -r * 1.2, r * 2.8, r * 2.4],
		{fill: P.terra, light: -2.2, shadow: {color: P.lLo, width: 6, alpha: 0.9}, rim: {color: '#f3a27e', width: 2.4, alpha: 0.7}},
	);
	g.strokeStyle = 'rgba(70,18,10,0.6)';
	g.lineWidth = 1.4;
	g.beginPath();
	g.moveTo(-r * 0.8, -r * 0.3);
	g.quadraticCurveTo(0, r * 0.4, r * 0.9, -r * 0.2);
	g.stroke();
	g.restore();
};

// vueltas sobre la muñeca + tramo hasta los dedos (solo la parte que va por encima)
const wrapBands = (g: Ctx, f: number, rPinch: V2 | null, drawSegment: boolean) => {
	const ph = f < K0 ? phi(f) : Math.PI * 4;
	for (let k = 0; k < 2; k++) {
		const a0 = k * Math.PI * 2;
		if (ph <= a0) continue;
		const local = ph - a0;
		const u = local >= Math.PI ? 1 : (1 - Math.cos(Math.max(0, local - 0.35))) / 2;
		if (u > 0.01) ribbon(g, bandPts(k, u), {w: ribbonW, s0: k * 60, shadow: 0.55, chunks: 1});
	}
	// punta inicial bajo el pulgar de la mano izquierda
	if (f < KP) ribbon(g, [wristPt(WR.hw * 1.04, (BAND[0].off - 5) * HS), wristPt(WR.hw * 1.3, -18 * HS), wristPt(WR.hw * 1.55, -30 * HS)], {w: ribbonW, s0: 520, shadow: 0.5, chunks: 1});
	if (drawSegment && rPinch && f < K0) {
		const local = ph % (Math.PI * 2);
		const k = Math.min(1, Math.floor(ph / (Math.PI * 2)));
		const over = Math.sin(ph) > -0.05;
		if (over) {
			const u = local >= Math.PI ? 1 : (1 - Math.cos(Math.max(0, local - 0.35))) / 2;
			const from = local < Math.PI ? bandPts(k, Math.max(0.001, u)).pop()! : wristPt(WR.hw * 1.04, BAND[Math.min(1, k)].off * HS);
			ribbon(g, [from, mix2(from, rPinch, 0.5), rPinch], {w: ribbonW, s0: 200, shadow: 0.5, chunks: 1});
		}
	}
};

// ---------------------------------------------------------------- B2
export const paintB2 = (g: Ctx, f: number): PostOpts => {
	const t = sec(f);
	const lf = f - B.b2[0];
	const u = seg(f, B.b2[0], B.b2[1]);
	const zoom = 1 + 0.06 * (0.5 - 0.5 * Math.cos(Math.PI * u));
	const wv: V2 = [Math.sin(t * 0.8 * Math.PI * 2) * 1.5, Math.cos(t * 0.8 * Math.PI * 2 + 1) * 1.5];
	const piv: V2 = [530, 1150];
	g.fillStyle = '#1a0c04';
	g.fillRect(0, 0, W, H);
	g.save();
	g.translate(piv[0] + wv[0], piv[1] + wv[1]);
	g.scale(zoom, zoom);
	g.translate(-piv[0], -piv[1]);
	g.drawImage(hule(), -HULE_PAD, -HULE_PAD);
	// pétalos sueltos alrededor de la veladora y una flor entera
	for (let i = 0; i < 11; i++) {
		const a = hash(i, 21) * Math.PI * 2;
		const d = 150 + hash(i, 22) * 230;
		petal(g, VX + Math.cos(a) * d * 0.8, VY + 120 + Math.sin(a) * d * 0.7, hash(i, 23) * 6, 22 + hash(i, 24) * 8, i % 3 ? P.cempa : P.gold);
	}
	marigold(g, 930, 470, 46, 0.4, 3);
	jarro(g, 214, 1500, 118, t);
	veladoraBody(g, t);
	// manos y listón
	const R = abuR(f);
	const L = abuL(f);
	const drawAbu = (s: AbuState, sleeveFringe: boolean) => {
		if (s.pose.y < -1400) return;
		drawHand(g, s.pose);
		rebozoSleeve(g, s.pose, SLEEVE_AT, {light: s.pose.light});
		if (sleeveFringe) {
			const chains = fringeChains();
			const fi = Math.max(0, Math.min(LF - 1, lf));
			g.save();
			g.lineCap = 'round';
			chains.forEach((ch, i) => {
				const pts = chainAt(ch, 8, fi);
				g.strokeStyle = i % 2 ? '#2b1f17' : '#3a2a1e';
				g.lineWidth = 3.4;
				g.beginPath();
				smoothPath(g, pts);
				g.stroke();
				g.strokeStyle = 'rgba(224,187,143,0.28)';
				g.lineWidth = 1;
				g.beginPath();
				smoothPath(g, pts.map(([x, y]) => [x - 1, y - 1] as V2));
				g.stroke();
				// nudito al final
				const e = pts[pts.length - 1];
				g.fillStyle = '#2b1f17';
				g.beginPath();
				g.arc(e[0], e[1], 2.6, 0, Math.PI * 2);
				g.fill();
			});
			g.restore();
		}
	};
	if (R.under) {
		drawAbu(R, true);
		drawFreeTail(g, f);
	}
	drawHand(g, KID);
	sleeve(g, KID, 250, '#2a2420', '#3a332c', 1.3);
	if (f < K0) wrapBands(g, f, R.pinch, true);
	else {
		wrapBands(g, f, null, false);
		knotTails(g, f, f < KR ? R.pinch : null, f < KR ? L.pinch : null);
	}
	drawAbu(L, false);
	if (!R.under) {
		if (f < KR) drawFreeTail(g, f);
		drawAbu(R, true);
	}
	// sombra del péndulo (pasa sobre todo; el reloj está fuera de cuadro, arriba)
	const sw = Math.sin((t - sec(B.b2[0])) * Math.PI + 0.6) * 0.32;
	g.save();
	g.globalCompositeOperation = 'multiply';
	g.globalAlpha = 0.24;
	g.translate(470, -420);
	g.rotate(sw);
	const ps = pendSprite();
	g.drawImage(ps, -130, 0);
	g.restore();
	g.restore();

	// luz de la veladora: respira (3 Hz de llama, 0.4 Hz de calidez) y cae a café oscuro
	const vx = piv[0] + (VX - piv[0]) * zoom + wv[0];
	const vy = piv[1] + (VY - piv[1]) * zoom + wv[1];
	const br = 0.92 + 0.06 * noise2D('vel', t * 3, 0) + 0.03 * noise2D('vel2', t * 7, 1);
	const warm = 0.5 + 0.5 * Math.sin(t * 0.4 * Math.PI * 2);
	g.save();
	g.globalCompositeOperation = 'multiply';
	const lg = g.createRadialGradient(vx, vy, 30, vx - 120, vy + 420, 1500 * br);
	lg.addColorStop(0, '#fff6e2');
	lg.addColorStop(0.3, warm > 0.5 ? '#f6d6a2' : '#f2cf9c');
	lg.addColorStop(0.58, '#b07a46');
	lg.addColorStop(0.78, '#4a2810');
	lg.addColorStop(1, '#1c0d04');
	g.fillStyle = lg;
	g.fillRect(0, 0, W, H);
	g.restore();
	g.save();
	g.globalCompositeOperation = 'soft-light';
	g.fillStyle = rgba(warm > 0.5 ? '#ffb45a' : '#ffc77a', 0.18 + 0.06 * warm);
	g.fillRect(0, 0, W, H);
	g.restore();
	// llama (emisiva, después de la luz)
	g.save();
	g.translate(vx, vy);
	g.scale(zoom, zoom);
	glow(g, 0, -10, 340 * br, '#ffbf62', 0.28 * br);
	flame2D(g, 0, -4, 15, t, 4, -0.08);
	g.restore();
	// fuga de luz dorada (5.0–7.0 s), izquierda → derecha
	const lk = seg(f, EV.leak0, EV.leak1);
	if (lk > 0 && lk < 1) {
		const a = Math.sin(lk * Math.PI);
		g.save();
		g.globalCompositeOperation = 'screen';
		const x = lerp(-300, W + 300, easeInOut(lk));
		const gr = g.createLinearGradient(x - 380, 0, x + 380, 0);
		gr.addColorStop(0, 'rgba(255,190,90,0)');
		gr.addColorStop(0.5, rgba('#ffc46a', 0.32 * a));
		gr.addColorStop(1, 'rgba(255,190,90,0)');
		g.fillStyle = gr;
		g.fillRect(0, 0, W, H);
		g.restore();
	}
	// viñeta ovalada de recuerdo
	g.save();
	g.translate(W / 2, H * 0.56);
	g.scale(1, 1.55);
	const vg = g.createRadialGradient(0, 0, 260, 0, 0, 720);
	vg.addColorStop(0, 'rgba(18,8,3,0)');
	vg.addColorStop(1, 'rgba(18,8,3,0.88)');
	g.fillStyle = vg;
	g.fillRect(-W, -H, W * 2, H * 2);
	g.restore();
	// humo de la veladora que sube y se lleva el recuerdo
	const sm = seg(f, EV.smoke0, B.b2[1]);
	if (sm > 0) {
		smoke(g, {x: vx - 40, y: vy + 260, h: 900 + 1100 * sm, w: 500 + 900 * sm, t, seed: 5, color: '#e9dcc0', alpha: 0.55 * smooth(sm)});
		smoke(g, {x: 540, y: H + 200, h: 2200, w: 1400, t: t + 3, seed: 6, color: '#d8c8a8', alpha: 0.6 * sm * sm});
	}
	return {...POST_MEMORY, flash: 1 - smooth(seg(f, B.b2[0], B.b2[0] + 12)), exposure: 1.0};
};
