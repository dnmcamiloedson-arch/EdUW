// Bruja de fuego en forma de orbe (compartido por todos los orbes): núcleo blanco-oro, coraza turbulenta naranja,
// seis lóbulos de flama que corren contra el movimiento, estela de brasas, huecos de ojos, encogida y cortina.
import {noise2D} from '@remotion/noise';
import {clamp, hash, rgba} from '../../lib/util';
import {glow, type Ctx} from '../kit/paint';
import {P} from './timeline';

export type OrbOpts = {
	x: number;
	y: number;
	r: number; // radio del núcleo + coraza
	t: number;
	seed?: number;
	vx?: number; // velocidad (px/frame) para orientar lóbulos y estela
	vy?: number;
	eyes?: number; // 0..1 huecos oscuros (ojos)
	crumple?: number; // 0..1 la coraza se hunde hacia adentro
	curtain?: number; // 0..1 la coraza se abre desde el centro
	a?: number;
	lower?: boolean; // solo mitad inferior (forma de alimentarse)
	pulse?: number; // 0..1 pulso del núcleo
};

const shellPath = (g: Ctx, o: OrbOpts, k: number, gap: number) => {
	const {x, y, r, t, seed = 1, crumple = 0} = o;
	const N = 48;
	g.beginPath();
	let started = false;
	for (let i = 0; i <= N; i++) {
		const th = (i / N) * Math.PI * 2;
		// cortina: hueco angular centrado arriba/abajo que se ensancha
		if (gap > 0) {
			const d = Math.abs(Math.atan2(Math.sin(th - Math.PI / 2), Math.cos(th - Math.PI / 2)));
			if (d < gap || Math.PI - d < gap) {
				started = false;
				continue;
			}
		}
		const n = noise2D('orb' + seed, Math.cos(th) * 1.3 + t * 1.7, Math.sin(th) * 1.3 + t * 1.1);
		const rr = r * k * (1 + 0.18 * n) * (1 - 0.35 * crumple * (0.6 + 0.4 * Math.sin(th * 5 + t * 20)));
		const px = x + Math.cos(th) * rr;
		const py = y + Math.sin(th) * rr;
		if (!started) {
			g.moveTo(px, py);
			started = true;
		} else g.lineTo(px, py);
	}
	g.closePath();
};

export const paintOrb = (g: Ctx, o: OrbOpts) => {
	const {x, y, r, t, seed = 1, vx = 0, vy = 0, eyes = 0, curtain = 0, a = 1, pulse = 0} = o;
	if (r <= 0.5 || a <= 0) return;
	g.save();
	if (o.lower) {
		g.beginPath();
		g.rect(x - r * 4, y, r * 8, r * 6);
		g.clip();
	}
	// halo amplio
	glow(g, x, y, r * 6, P.cempa, 0.35 * a);
	glow(g, x, y, r * 2.6, P.gold, 0.5 * a);
	// estela de brasas (sin estado: posiciones a lo largo de −v)
	const sp = Math.hypot(vx, vy);
	if (sp > 0.3) {
		g.globalCompositeOperation = 'lighter';
		for (let i = 0; i < 18; i++) {
			const u = (i + ((t * 30) % 1)) / 18;
			const jitter = (hash(i, seed) - 0.5) * r * 0.8;
			const px = x - vx * u * 22 + (-vy / sp) * jitter;
			const py = y - vy * u * 22 + (vx / sp) * jitter + u * u * 6;
			g.fillStyle = rgba(i % 3 ? P.gold : P.cempa, 0.8 * (1 - u) * a);
			g.beginPath();
			g.arc(px, py, Math.max(0.6, r * 0.07 * (1 - u)), 0, Math.PI * 2);
			g.fill();
		}
		g.globalCompositeOperation = 'source-over';
	}
	// lóbulos de flama contra la velocidad
	const dir = sp > 0.3 ? Math.atan2(-vy, -vx) : -Math.PI / 2;
	g.globalCompositeOperation = 'lighter';
	for (let k = 0; k < 6; k++) {
		const base = dir + (k - 2.5) * 0.42;
		const wob = noise2D('lobe' + seed + k, t * 2.4, k) * 0.35;
		const L = r * (1.3 + 0.5 * noise2D('lobl' + seed + k, t * 1.9, 0.5));
		const ang = base + wob;
		const bx = x + Math.cos(base) * r * 0.7;
		const by = y + Math.sin(base) * r * 0.7;
		const tx = x + Math.cos(ang) * (r + L);
		const ty = y + Math.sin(ang) * (r + L) - L * 0.25;
		const nx = -Math.sin(base) * r * 0.4;
		const ny = Math.cos(base) * r * 0.4;
		const grd = g.createLinearGradient(bx, by, tx, ty);
		grd.addColorStop(0, rgba(P.gold, 0.6 * a));
		grd.addColorStop(0.6, rgba(P.cempa, 0.4 * a));
		grd.addColorStop(1, rgba(P.terra, 0));
		g.fillStyle = grd;
		g.beginPath();
		g.moveTo(bx + nx, by + ny);
		g.quadraticCurveTo((bx + tx) / 2 + nx * 0.8, (by + ty) / 2 + ny * 0.8, tx, ty);
		g.quadraticCurveTo((bx + tx) / 2 - nx * 0.8, (by + ty) / 2 - ny * 0.8, bx - nx, by - ny);
		g.closePath();
		g.fill();
	}
	// coraza (borde terracota → naranja)
	const gap = curtain * 1.5;
	const sh = g.createRadialGradient(x, y, r * 0.2, x, y, r * 1.2);
	sh.addColorStop(0, rgba(P.gold, 0.95 * a));
	sh.addColorStop(0.6, rgba(P.cempa, 0.85 * a));
	sh.addColorStop(1, rgba(P.terra, 0.0));
	g.fillStyle = sh;
	shellPath(g, o, 1.15, gap);
	g.fill();
	g.globalCompositeOperation = 'source-over';
	// núcleo blanco-oro
	const pr = 1 + 0.08 * Math.sin(t * 8) + 0.15 * pulse;
	const core = g.createRadialGradient(x, y, 0, x, y, r * 0.75 * pr);
	core.addColorStop(0, rgba(P.core, a));
	core.addColorStop(0.55, rgba('#FFE08A', 0.9 * a * (1 - curtain)));
	core.addColorStop(1, rgba(P.gold, 0));
	g.fillStyle = core;
	g.beginPath();
	g.arc(x, y, r * 0.75 * pr, 0, Math.PI * 2);
	g.fill();
	// huecos de ojos
	if (eyes > 0) {
		g.fillStyle = rgba('#7a2a10', 0.55 * eyes * a);
		for (const sx of [-1, 1]) {
			g.beginPath();
			g.ellipse(x + sx * r * 0.24, y - r * 0.06, r * 0.13, r * 0.08, sx * 0.25, 0, Math.PI * 2);
			g.fill();
		}
	}
	g.restore();
};

// ignición: punto → destello r70 → asienta (8 frames) — factor de radio en función de frames desde la ignición
export const ignite = (df: number, target: number) => {
	if (df < 0) return 0;
	if (df < 4) return (df / 4) * 1.4 * target;
	if (df < 12) return target * (1.4 - 0.4 * ((df - 4) / 8));
	return target;
};

// destello de chispas (sin estado) desde (x, y) iniciado hace df frames
export const sparkBurst = (g: Ctx, x: number, y: number, df: number, n: number, seed: number, power = 1) => {
	if (df < 0 || df > 40) return;
	g.save();
	g.globalCompositeOperation = 'lighter';
	for (let i = 0; i < n; i++) {
		const a = hash(i, seed) * Math.PI * 2;
		const v = (3 + hash(i, seed + 1) * 9) * power;
		const life = 18 + hash(i, seed + 2) * 20;
		if (df > life) continue;
		const u = df / life;
		const px = x + Math.cos(a) * v * df * (1 - u * 0.4);
		const py = y + Math.sin(a) * v * df * (1 - u * 0.4) + 0.12 * df * df;
		g.fillStyle = rgba(i % 2 ? P.gold : P.core, (1 - u) * 0.9);
		g.fillRect(px, py, 2.4, 2.4);
	}
	g.restore();
	void clamp;
};
