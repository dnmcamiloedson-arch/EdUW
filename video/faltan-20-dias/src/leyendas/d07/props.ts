// Día 7 · utilería y animales. ESQUELETO (etapa 1): siluetas simples con sus tiempos finales.
// G1: perro (dormido → alerta) y tecolote finales. G2: coyote (rig cuadrúpedo), caña, sombrero, pila del sarape.
// G3: cabeza del susto (scare.ts) y ojos del callejón.
import {C, E, FPS, clamp, lerp, rgba} from '../../lib/util';
import {glow, type Ctx} from '../kit/paint';
import {card, lightAt, type Caster} from './light';
import {P, pxPerM, seg, type V2, type V3} from './world';

type Drawer = (box: [number, number, number, number], blur: number, shade: {color: string; a: number}, fn: (q: Ctx) => void) => void;

// ---------------------------------------------------------------- perro callejero (x≈915 en la base del muro)
export const dogState = (f: number) => {
	const t = f / FPS;
	let x = 1.0;
	let z = 3.95;
	let pose = 0; // 0 dormido, 1 cabeza arriba, 2 medio alzado, 3 agachado retrocede, 4 galope
	if (t >= 8.4) pose = 1;
	if (t >= 9.6) pose = 2;
	if (t >= 14) {
		pose = 3;
		x = lerp(1.0, 1.32, E.inOut(seg(t, 14, 16)));
	}
	if (t >= 24.2) {
		pose = 4;
		x = lerp(1.32, 3.2, E.in(seg(t, 24.2, 24.9)));
		z = lerp(3.95, 3.6, seg(t, 24.2, 24.9));
	}
	return {x, z, pose, gone: t > 25};
};
export const drawDog = (g: Ctx, f: number, L: V3, I: number, draw: Drawer) => {
	const d = dogState(f);
	if (d.gone) return;
	const s = pxPerM(d.z);
	const [px, py] = P(d.x, 0, d.z);
	const lit = lightAt(L, I, [d.x, 0.3, d.z], [0, 0, -1]);
	draw([px - 0.5 * s, py - 0.6 * s, 1.0 * s, 0.65 * s], 0, {color: '#101818', a: clamp(0.8 - lit * 0.7)}, (q) => {
		q.save();
		q.translate(px, py);
		q.scale(s, -s);
		const breath = d.pose === 0 ? Math.sin(f * 0.11) * 0.01 : 0;
		const hy = d.pose === 0 ? 0.12 : d.pose === 1 ? 0.3 : d.pose === 2 ? 0.42 : d.pose === 3 ? 0.28 : 0.36;
		const by = d.pose >= 2 ? 0.3 : 0.12;
		q.fillStyle = '#B88A55';
		q.beginPath();
		q.ellipse(0, by, 0.3, 0.12 + breath, 0, 0, Math.PI * 2);
		q.fill();
		q.fillStyle = '#7A5530';
		q.beginPath();
		q.ellipse(0, by + 0.07, 0.26, 0.05, 0, 0, Math.PI * 2);
		q.fill();
		q.fillStyle = '#B88A55';
		q.beginPath();
		q.ellipse(-0.3, hy, 0.1, 0.075, 0, 0, Math.PI * 2);
		q.fill();
		q.beginPath();
		q.moveTo(-0.33, hy + 0.05);
		q.lineTo(-0.28, hy + (d.pose === 1 || d.pose === 3 ? 0.08 : 0.15));
		q.lineTo(-0.25, hy + 0.04);
		q.fill();
		if (d.pose >= 2) {
			q.fillStyle = '#9C7244';
			for (const lx of [-0.2, -0.12, 0.14, 0.22]) q.fillRect(lx, 0, 0.04, by);
		}
		q.restore();
	});
	if (d.pose >= 1 && d.pose < 4) {
		const [ex, ey] = P(d.x - 0.33, (d.pose === 1 ? 0.3 : 0.42) + 0.02, d.z - 0.05);
		glow(g, ex, ey, 10, '#D8E07A', 0.6 * lit, 0.3);
	}
};
export const dogCaster = (f: number): Caster | null => {
	const d = dogState(f);
	if (d.gone) return null;
	const h = d.pose === 0 ? 0.26 : d.pose >= 2 ? 0.55 : 0.42;
	const pts: V2[] = [];
	for (let i = 0; i < 18; i++) {
		const a = (i / 18) * Math.PI * 2;
		pts.push([Math.cos(a) * 0.34, h / 2 + Math.sin(a) * (h / 2)]);
	}
	return {pts: card(pts, d.x, 0, d.z - 0.05), dens: 0.8};
};

// ---------------------------------------------------------------- tecolote en el cable del callejón
export const drawOwl = (g: Ctx, f: number) => {
	const t = f / FPS;
	let x = 112;
	let y = 556;
	let flyU = 0;
	if (t >= 16.2) {
		flyU = seg(t, 16.2, 17.6);
		x = lerp(112, -60, E.in(flyU));
		y = lerp(556, 470, flyU) + Math.sin(flyU * 30) * 6;
	}
	if (flyU >= 1) return;
	g.save();
	g.translate(x, y);
	g.fillStyle = '#141A18';
	g.beginPath();
	g.ellipse(0, -26, 15, 26, 0, 0, Math.PI * 2);
	g.fill();
	g.beginPath();
	g.ellipse(0, -56, 13, 11, 0, 0, Math.PI * 2);
	g.fill();
	if (flyU > 0) {
		const wf = Math.sin(t * 2 * Math.PI / 0.45);
		g.beginPath();
		g.moveTo(-6, -36);
		g.lineTo(-44, -36 - wf * 26);
		g.lineTo(-6, -22);
		g.moveTo(6, -36);
		g.lineTo(44, -36 - wf * 26);
		g.lineTo(6, -22);
		g.fill();
	}
	// ojos ámbar: miran a cámara desde 2.9 s
	const look = E.out(seg(t, 2.9, 2.9 + 20 / 30));
	const ex = lerp(6, 0, look);
	glow(g, -5 + ex, -57, 9, '#F5B342', 0.55, 0.35);
	glow(g, 5 + ex, -57, 9, '#F5B342', 0.55, 0.35);
	g.restore();
};

// ---------------------------------------------------------------- caña y sombrero (caen en las vueltas)
export const drawCaneOnGround = (g: Ctx, f: number) => {
	if (f < 510 || f >= 1020) return;
	const u = seg(f, 510, 534);
	const x = -0.18;
	const z = 2.35;
	const ang = lerp(-1.35, 0, E.out(u));
	const b = Math.abs(Math.sin(u * Math.PI * 3)) * (1 - u) * 0.06;
	const [px, py] = P(x, b, z);
	const s = pxPerM(z);
	g.save();
	g.translate(px, py);
	g.rotate(ang * 0.6 + 0.12);
	g.strokeStyle = '#4A2E17';
	g.lineWidth = 0.03 * s;
	g.lineCap = 'round';
	g.beginPath();
	g.moveTo(-0.45 * s * Math.cos(ang), -0.45 * s * Math.sin(ang) * 0.3);
	g.lineTo(0.45 * s * Math.cos(ang), 0.45 * s * Math.sin(ang) * 0.3);
	g.stroke();
	g.restore();
};
export const hatState = (f: number) => {
	const t = f / FPS;
	if (t < 18.4 || f >= 1020) return null;
	const u = seg(t, 18.4, 19.6);
	const x = lerp(-0.25, 0.32, E.out(u));
	const z = lerp(2.3, 1.44, E.out(u));
	const yy = t < 18.7 ? lerp(1.6, 0.0, E.in(seg(t, 18.4, 18.7))) : Math.abs(Math.sin(seg(t, 18.7, 19.4) * Math.PI * 2)) * 0.08 * (1 - seg(t, 18.7, 19.4));
	const wob = Math.sin(t * 22) * (1 - u) * 0.5;
	return {x, z, y: yy, wob};
};
export const drawHat = (g: Ctx, f: number, L: V3, I: number, blur: number, draw: Drawer) => {
	const h = hatState(f);
	if (!h) return;
	const s = pxPerM(h.z);
	const [px, py] = P(h.x, h.y, h.z);
	const lit = lightAt(L, I, [h.x, 0.1, h.z], [0, 1, 0]);
	draw([px - 0.32 * s, py - 0.22 * s, 0.64 * s, 0.3 * s], blur, {color: '#101614', a: clamp(0.7 - lit * 0.6)}, (q) => {
		q.save();
		q.translate(px, py);
		q.rotate(h.wob * 0.3);
		q.fillStyle = '#C9A866';
		q.beginPath();
		q.ellipse(0, -0.02 * s, 0.26 * s, 0.07 * s, 0, 0, Math.PI * 2);
		q.fill();
		q.fillStyle = '#B08E52';
		q.beginPath();
		q.ellipse(0, -0.09 * s, 0.1 * s, 0.09 * s, 0, Math.PI, 0);
		q.fill();
		q.restore();
	});
};

// ---------------------------------------------------------------- pila del sarape vacío (desde el colapso)
export const drawPile = (g: Ctx, f: number, x: number, z: number, L: V3, I: number, blur: number, draw: Drawer) => {
	if (f < 606 || f >= 1020) return;
	const u = E.out(seg(f, 606, 621));
	const breath = f >= 624 && f < 648 ? Math.sin(seg(f, 624, 648) * Math.PI) * 6 : 0;
	const s = pxPerM(z);
	const [px, py] = P(x, 0, z);
	const lit = lightAt(L, I, [x, 0.1, z], [0, 1, 0]);
	const h = lerp(0.55, 0.16, u) * s + breath;
	draw([px - 0.5 * s, py - h - 10, 1.0 * s, h + 20], blur, {color: '#101614', a: clamp(0.7 - lit * 0.6)}, (q) => {
		const bands = [C.terracota, C.flama, C.verde, C.marfil];
		for (let i = 0; i < 4; i++) {
			q.fillStyle = bands[i];
			q.beginPath();
			q.ellipse(px + (i - 1.5) * 0.08 * s, py - h * 0.4, 0.42 * s - i * 0.04 * s, h * (0.6 - i * 0.1), 0, Math.PI, 0);
			q.fill();
		}
	});
};

// ---------------------------------------------------------------- coyote (stub; G2 lo hace con el rig cuadrúpedo)
export const coyoteState = (f: number) => {
	const t = f / FPS;
	if (t < 21.8 || t > 26.8) return null;
	let x = -0.3;
	let z = 2.4;
	let face = 1;
	let look = 0;
	if (t < 22.6) x = lerp(-0.42, -0.3, seg(t, 21.8, 22.6));
	else if (t < 24.8) x = lerp(-0.3, 0.25, E.inOut(seg(t, 23.2, 24.8)));
	else if (t < 25.4) {
		x = 0.25;
		look = E.out(seg(t, 24.8, 25.0));
	} else {
		face = -1;
		const u = seg(t, 25.4, 26.7);
		x = lerp(0.25, -1.7, E.in(u));
		z = lerp(2.4, 3.6, u);
	}
	return {x, z, face, look, emerge: seg(t, 21.8, 22.6)};
};
export const drawCoyote = (g: Ctx, f: number, L: V3, I: number, blur: number, draw: Drawer) => {
	const c = coyoteState(f);
	if (!c) return;
	const s = pxPerM(c.z);
	const [px, py] = P(c.x, 0, c.z);
	const lit = lightAt(L, I, [c.x, 0.4, c.z], [0, 0, -1]);
	draw([px - 0.8 * s, py - 0.95 * s, 1.6 * s, 1.0 * s], blur, {color: '#0E1616', a: clamp(0.75 - lit * 0.65)}, (q) => {
		q.save();
		q.translate(px, py);
		q.scale(s * c.face, -s);
		q.fillStyle = '#8A6A48';
		q.beginPath();
		q.ellipse(0, 0.42, 0.36, 0.13, 0, 0, Math.PI * 2);
		q.fill();
		q.beginPath();
		q.moveTo(0.3, 0.5);
		q.lineTo(0.56, 0.5);
		q.lineTo(0.42, 0.62);
		q.closePath();
		q.fill();
		q.beginPath();
		q.moveTo(0.32, 0.58);
		q.lineTo(0.36, 0.76);
		q.lineTo(0.41, 0.6);
		q.fill();
		q.fillStyle = '#6E5236';
		for (const lx of [-0.26, -0.18, 0.2, 0.28]) q.fillRect(lx, 0, 0.035, 0.38);
		q.beginPath();
		q.moveTo(-0.34, 0.45);
		q.quadraticCurveTo(-0.6, 0.35, -0.62, 0.2);
		q.lineTo(-0.56, 0.22);
		q.quadraticCurveTo(-0.5, 0.36, -0.32, 0.38);
		q.fill();
		q.restore();
	});
	void rgba;
	if (c.look > 0) {
		const [ex, ey] = P(c.x + 0.45 * c.face, 0.58, c.z - 0.05);
		glow(g, ex - 6, ey, 30, '#D6E36A', 0.9 * c.look, 0.25);
		glow(g, ex + 8, ey, 30, '#D6E36A', 0.9 * c.look, 0.25);
	}
};
// su sombra corta en el piso (animal bajo, foco alto)
export const coyoteCaster = (f: number): Caster | null => {
	const c = coyoteState(f);
	if (!c) return null;
	const pts: V2[] = [
		[-0.6, 0.25], [-0.36, 0.5], [0.3, 0.55], [0.42, 0.75], [0.58, 0.5], [0.36, 0.3], [0.3, 0.0], [-0.3, 0.0],
	];
	return {pts: card(pts, c.x, 0, c.z, c.face), dens: 0.8};
};
